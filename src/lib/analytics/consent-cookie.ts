export const ANALYTICS_CONSENT_COOKIE_NAME = "uttae_analytics_consent";

const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export type AnalyticsConsentValue = "granted" | "denied";

export type AnalyticsConsent = AnalyticsConsentValue | null;

function parseConsentValue(raw: string | undefined): AnalyticsConsent {
  if (raw === "granted" || raw === "denied") {
    return raw;
  }
  return null;
}

export function readAnalyticsConsentCookie(): AnalyticsConsent {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${ANALYTICS_CONSENT_COOKIE_NAME}=`;
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return parseConsentValue(trimmed.slice(prefix.length));
    }
  }

  return null;
}

export function writeAnalyticsConsentCookie(value: AnalyticsConsentValue): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = [
    `${ANALYTICS_CONSENT_COOKIE_NAME}=${value}`,
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    secure,
  ].join("; ");
}
