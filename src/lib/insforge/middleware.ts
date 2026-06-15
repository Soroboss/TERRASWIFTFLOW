import { NextResponse, type NextRequest } from "next/server";
import { isInsforgeConfigured } from "@/lib/env";
import { getClientIp } from "@/lib/security/client-ip";
import { AUTH_RATE_LIMIT, checkRateLimit } from "@/lib/security/rate-limit";

const PUBLIC_PREFIXES = ["/login", "/register", "/auth", "/paywall", "/setup", "/compte-en-attente"];
const ACCESS_COOKIE = "insforge_access_token";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) {
    const ip = getClientIp(request.headers);
    const result = await checkRateLimit("api:auth", ip, AUTH_RATE_LIMIT);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        {
          status: 429,
          headers: result.retryAfterSec
            ? { "Retry-After": String(result.retryAfterSec) }
            : undefined,
        }
      );
    }
  }

  if (!isInsforgeConfigured()) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/documents")) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  const isPublic = isPublicPath(pathname);

  if (
    !hasSession &&
    !isPublic &&
    !pathname.startsWith("/api/health") &&
    !pathname.startsWith("/api/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname.startsWith("/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
