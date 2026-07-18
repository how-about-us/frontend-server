import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appendSetCookies } from "@/lib/auth-cookies";
import { verifySessionWithOptionalRefresh } from "@/lib/auth-server";
import { isProtectedAppPath } from "@/lib/auth-session";

const LINK_PREVIEW_BOT_UA =
  /bot|crawler|spider|facebookexternalhit|kakaotalk|twitterbot|slackbot|discordbot|linkedinbot|telegrambot|whatsapp|line/i;

function isInvitePreviewRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/join/")) return false;
  const ua = request.headers.get("user-agent") ?? "";
  return LINK_PREVIEW_BOT_UA.test(ua);
}

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

  if (isInvitePreviewRequest(request)) {
    return NextResponse.rewrite(new URL("/invite-preview.html", request.url));
  }

  let hasSession = false;
  let setCookies: string[] = [];
  try {
    const verified = await verifySessionWithOptionalRefresh(
      request.headers.get("cookie"),
    );
    hasSession = verified.ok;
    setCookies = verified.setCookies;
  } catch {
    hasSession = false;
    setCookies = [];
  }

  if (pathname === "/login") {
    if (hasSession) {
      return withRefreshedCookies(
        NextResponse.redirect(new URL("/home", request.url)),
        setCookies,
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
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
    "/join/:path*",
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
    "/contact",
    "/settings",
    "/settings/:path*",
    "/waiting",
  ],
};
