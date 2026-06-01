/** `proxy.ts` 보호 경로와 동일 — reconcile 실패 시 로그인 리다이렉트 판단용 */
export function isProtectedAppPath(pathname: string): boolean {
  const prefixes = [
    "/home",
    "/plan",
    "/bookmark",
    "/search",
    "/member-settings",
    "/room-settings",
    "/settings",
    "/waiting",
  ];
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
