import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";

function isProtectedPath(pathname: string) {
  if (pathname === "/") return true;
  const prefixes = ["/plan", "/bookmark", "/search", "/settings"];
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.get(AUTH_SESSION_COOKIE)?.value === "1";

  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/plan", request.url));
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
    "/plan",
    "/plan/:path*",
    "/bookmark",
    "/bookmark/:path*",
    "/search",
    "/search/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
