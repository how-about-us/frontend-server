import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlanDaySection } from "./PlanDaySection";

describe("PlanDaySection", () => {
  it("펼침 토글 아이콘을 제목과 겹치지 않게 버튼 오른쪽에 배치한다", () => {
    const html = renderToStaticMarkup(
      createElement(
        PlanDaySection,
        {
          title: "1일차",
          subtitle: "7월 16일 (목)",
        },
        createElement("div", null, "일정"),
      ),
    );

    const triggerMarkup = html.match(
      /<button[^>]*aria-expanded="true"[^>]*>([\s\S]*?)<\/button>/,
    )?.[1];

    expect(triggerMarkup).toContain("ml-auto");
    expect(triggerMarkup).toContain("shrink-0");
    expect(html).not.toContain("absolute left-1/2");
  });
});
