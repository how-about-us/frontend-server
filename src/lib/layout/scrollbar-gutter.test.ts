import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const globalStyles = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("전역 세로 스크롤 영역", () => {
  it("스크롤바가 생기기 전부터 gutter를 확보하되 textarea는 제외한다", () => {
    expect(globalStyles).toMatch(
      /:where\(\.overflow-y-auto:not\(textarea\)\)\s*\{[^}]*scrollbar-gutter:\s*stable;/,
    );
  });

  it("채팅 메시지 스크롤 영역도 gutter를 안정적으로 유지한다", () => {
    expect(globalStyles).toMatch(
      /\.chat-message-list-scroll\s*\{[^}]*scrollbar-gutter:\s*stable;/,
    );
  });
});
