import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hasAuthenticatedSession } from "@/lib/auth-server";

function isProtectedPath(pathname: string) {
  if (pathname === "/") return true;
  const prefixes = [
    "/home",
    "/plan",
    "/bookmark",
    "/search",
    "/settings",
    "/waiting",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = await hasAuthenticatedSession(request);

  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
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
