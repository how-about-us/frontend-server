import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hasAuthenticatedSession } from "@/lib/auth-server";
import { isProtectedAppPath } from "@/lib/auth-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = await hasAuthenticatedSession(request);

  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
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
    "/settings",
    "/settings/:path*",
    "/waiting",
  ],
};
