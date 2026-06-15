import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";

const PUBLIC_PREFIXES = ["/login", "/register", "/auth", "/paywall", "/setup"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/documents")) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublic = isPublicPath(pathname);

    if (!user && !isPublic && !pathname.startsWith("/api/health")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (user && !isPublic && !pathname.startsWith("/api")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("subscription_status, trial_ends_at")
          .eq("id", profile.organization_id)
          .single();

        if (org) {
          const trialExpired =
            org.trial_ends_at && new Date(org.trial_ends_at) < new Date();
          const hasActiveSubscription = org.subscription_status === "active";

          if (
            trialExpired &&
            !hasActiveSubscription &&
            !pathname.startsWith("/paywall")
          ) {
            const url = request.nextUrl.clone();
            url.pathname = "/paywall";
            return NextResponse.redirect(url);
          }

          if (pathname.startsWith("/paywall") && hasActiveSubscription) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
          }
        }
      }
    }
  } catch {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
