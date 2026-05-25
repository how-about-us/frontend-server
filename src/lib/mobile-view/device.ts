type NavigatorUaData = Navigator & {
  userAgentData?: { mobile?: boolean };
};

const MOBILE_PHONE_UA_RE =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

const MOBILE_INLINE_RE = /Mobile/i;

const TABLET_UA_RE = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i;

function readUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent ?? "";
}

/** iPadOS 13+ — 데스크톱 Safari UA + 터치 */
function isIpadOsDesktopUa(): boolean {
  if (typeof navigator === "undefined") return false;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  if (touchPoints <= 1) return false;
  const platform = navigator.platform ?? "";
  const ua = readUserAgent();
  return /MacIntel|Macintosh/i.test(platform) || /Macintosh/i.test(ua);
}

function matchesMobileUserAgent(ua: string): boolean {
  if (TABLET_UA_RE.test(ua)) return true;
  if (MOBILE_PHONE_UA_RE.test(ua)) return true;
  if (MOBILE_INLINE_RE.test(ua) && /Android/i.test(ua)) return true;
  return false;
}

/**
 * 실제 모바일·태블릿 여부 (뷰포트 브레이크포인트 미사용).
 * - `navigator.userAgentData.mobile` (Chromium)
 * - User-Agent 패턴
 * - iPadOS (Macintosh UA + 다중 터치)
 */
export function readIsMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  if ((navigator as NavigatorUaData).userAgentData?.mobile === true) return true;
  if (isIpadOsDesktopUa()) return true;
  return matchesMobileUserAgent(readUserAgent());
}
