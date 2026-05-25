const MAIN_MOBILE_BLOCKED_PREFIXES = [
  "/search",
  "/bookmark",
  "/settings",
] as const;

export function isMainRouteBlockedOnMobile(pathname: string): boolean {
  return MAIN_MOBILE_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
