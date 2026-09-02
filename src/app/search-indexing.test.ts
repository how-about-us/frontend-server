import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_DIRECTORY = resolve(process.cwd(), "src/app");

function routeSource(relativePath: string): string {
  const absolutePath = resolve(APP_DIRECTORY, relativePath);
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

describe("route search-indexing metadata boundaries", () => {
  it.each([
    ["page.tsx", "/"],
    ["terms/page.tsx", "/terms"],
    ["privacy/page.tsx", "/privacy"],
    ["operations-policy/page.tsx", "/operations-policy"],
    ["copyright-policy/page.tsx", "/copyright-policy"],
  ])("wires %s to the centralized public metadata for %s", (file, path) => {
    expect(routeSource(file)).toContain(`publicPageMetadata("${path}")`);
  });

  it.each([
    ["login/layout.tsx", "NOINDEX_FOLLOW_METADATA"],
    ["privacy-settings/page.tsx", "NOINDEX_FOLLOW_METADATA"],
    ["login/agreements/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
    ["auth/callback/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
    ["join/[inviteCode]/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
    ["home/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
    ["(main)/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
    ["waiting/layout.tsx", "NOINDEX_NOFOLLOW_METADATA"],
  ])("applies %s at the safe %s boundary", (file, metadataName) => {
    const source = routeSource(file);

    expect(source).toContain("export const metadata: Metadata");
    expect(source).toContain(metadataName);
  });
});
