import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TravelDirectionsCard } from "./TravelDirectionsCard";

describe("TravelDirectionsCard", () => {
  it("이동 요약 옆에 새 탭으로 여는 Google 길찾기 링크를 표시한다", () => {
    const googleMapsDirectionsUrl =
      "https://www.google.com/maps/dir/?api=1&origin=서울역&destination=성수";
    const html = renderToStaticMarkup(
      createElement(
        TravelDirectionsCard as ComponentType<Record<string, unknown>>,
        {
          menuOpen: false,
          onToggleMenu: () => {},
          summaryMode: "TRANSIT",
          route: {
            travelMode: "TRANSIT",
            durationSeconds: 1200,
            distanceMeters: 8500,
          },
          routeQuery: {
            isPending: false,
            isError: false,
            isFetching: false,
          },
          routeUnavailable: false,
          effectiveMode: "TRANSIT",
          showUnknownOption: false,
          modeRaw: "TRANSIT",
          onHideDirections: () => {},
          googleMapsDirectionsUrl,
        },
      ),
    );

    expect(html).toContain("20 분");
    expect(html).toContain(
      `href="${googleMapsDirectionsUrl.replaceAll("&", "&amp;")}"`,
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Google 길찾기");
    expect(html.indexOf("20 분")).toBeLessThan(
      html.indexOf("Google 길찾기"),
    );
  });
});
