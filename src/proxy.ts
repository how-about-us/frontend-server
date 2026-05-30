import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appendSetCookies } from "@/lib/auth-cookies";
import { verifySessionWithOptionalRefresh } from "@/lib/auth-server";
import { isProtectedAppPath } from "@/lib/auth-session";

function withRefreshedCookies(
  response: NextResponse,
  setCookies: readonly string[],
): NextResponse {
  if (setCookies.length > 0) {
    appendSetCookies(response, setCookies);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { ok: hasSession, setCookies } =
    await verifySessionWithOptionalRefresh(request.headers.get("cookie"));

  if (pathname === "/login") {
    if (hasSession) {
      return withRefreshedCookies(
        NextResponse.redirect(new URL("/home", request.url)),
        setCookies,
      );
    }
    return NextResponse.next();
  }

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return withRefreshedCookies(NextResponse.next(), setCookies);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/auth/callback",
    "/home",
    "/home/:path*",
    "/plan",
    "/plan/:roomId",
    "/plan/:roomId/:path*",
    "/bookmark",
    "/bookmark/:path*",
    "/search",
    "/search/:path*",
    "/member-settings",
    "/member-settings/:path*",
    "/room-settings",
    "/room-settings/:path*",
    "/settings",
    "/settings/:path*",
    "/waiting",
  ],
};
