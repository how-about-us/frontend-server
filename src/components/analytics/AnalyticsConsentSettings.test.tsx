import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsConsentSettingsView } from "@/components/analytics/AnalyticsConsentSettings";

describe("AnalyticsConsentSettingsView", () => {
  it.each([
    ["pending", "선택 전"],
    ["granted", "분석 쿠키 허용"],
    ["denied", "분석 쿠키 거부"],
  ] as const)("renders %s state accessibly", (consent, label) => {
    const html = renderToStaticMarkup(
      <AnalyticsConsentSettingsView
        consent={consent}
        message=""
        onGrant={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(html).toContain(label);
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("허용");
    expect(html).toContain("거부");
  });

  it("announces a persistence failure without hiding the selected state", () => {
    const message =
      "선택은 현재 탭에 적용했지만 브라우저에 저장하지 못했습니다.";
    const html = renderToStaticMarkup(
      <AnalyticsConsentSettingsView
        consent="denied"
        message={message}
        onGrant={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(html).toContain(message);
    expect(html).toContain("분석 쿠키 거부");
  });
});
