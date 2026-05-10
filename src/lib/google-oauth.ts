/**
 * Google OAuth authorize URL 및 콜백 redirect_uri 공통 처리.
 * redirect_uri는 로그인을 연 호스트(www / apex)와 맞춰야 sessionStorage oauth_state가 유효하다.
 */

export const GOOGLE_AUTH_CALLBACK_PATH = "/auth/callback";

export const OAUTH_STATE_SESSION_KEY = "oauth_state";

const DEFAULT_GOOGLE_CLIENT_ID =
  "813204192877-5ueflcpjqdd9cpntpnkrmjgnro1mc4rr.apps.googleusercontent.com";

export function resolveGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? DEFAULT_GOOGLE_CLIENT_ID;
}

/** 브라우저: 현재 origin 기준 콜백 URL. SSR·프리렌더 시 env/로컬 기본값. */
export function getGoogleOAuthRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${GOOGLE_AUTH_CALLBACK_PATH}`;
  }
  return (
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ??
    "http://www.howaboutus.app/auth/callback"
  );
}

export function buildGoogleAuthorizationUrl(): string {
  const clientId = resolveGoogleClientId();
  const redirectUri = getGoogleOAuthRedirectUri();
  return (
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    "&scope=openid%20email%20profile"
  );
}

export function messageForOAuthLoginErrorParam(
  code: string | null,
): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    Configuration: "로그인 설정에 문제가 있습니다. 관리자에게 문의해 주세요.",
    AccessDenied: "접근이 거부되었습니다. 계정을 확인해 주세요.",
    Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
    OAuthSignin:
      "로그인 요청을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    OAuthCallback: "로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
    OAuthCreateAccount:
      "계정을 만들 수 없습니다. 다른 방법으로 로그인해 주세요.",
    Callback: "로그인 응답을 처리하지 못했습니다. 다시 시도해 주세요.",
    Default: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  };
  return map[code] ?? map.Default;
}
