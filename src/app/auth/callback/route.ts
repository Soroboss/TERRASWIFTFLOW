import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("insforge_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=missing_verifier", request.url));
  }

  const insforge = createServerClient({ cookies: cookieStore });
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier);

  if (error || !data?.accessToken) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  response.cookies.delete("insforge_code_verifier");

  return response;
}
