import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: mocks.connection,
}));

vi.mock("@/hooks/useCurrentAgreements", () => ({
  useCurrentAgreements: () => {
    throw new Error("client agreement query mounted");
  },
}));

vi.mock("@/lib/required-env", () => ({
  requiredEnv: () => "http://backend.test",
}));

import { PolicyDocumentView } from "@/components/agreements/PolicyDocumentView";

describe("PolicyDocumentView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders current policy content from the server without a client query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              content: "## 정적 이용약관",
              contentFormat: "MARKDOWN",
              title: "이용약관",
              type: "TERMS_OF_SERVICE",
              version: "2026-07-23",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const view = await PolicyDocumentView({
      agreementType: "TERMS_OF_SERVICE",
    });
    const html = renderToStaticMarkup(view);

    expect(mocks.connection).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/agreements/current",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(html).toContain("이용약관");
    expect(html).toContain("정적 이용약관");
  });
});
