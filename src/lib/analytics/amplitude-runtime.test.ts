import { describe, expect, it } from "vitest";

import { resolveAmplitudeRuntime } from "@/lib/analytics/amplitude-runtime";

describe("Amplitude runtime configuration", () => {
  it("uses a trimmed environment key and a 10% production replay default", () => {
    expect(
      resolveAmplitudeRuntime({
        apiKey: " production-key ",
        nodeEnv: "production",
      }),
    ).toEqual({
      apiKey: "production-key",
      enabled: true,
      sessionReplaySampleRate: 0.1,
    });
  });

  it("keeps full replay sampling by default outside production", () => {
    expect(
      resolveAmplitudeRuntime({
        apiKey: "development-key",
        nodeEnv: "development",
      }).sessionReplaySampleRate,
    ).toBe(1);
  });

  it("accepts an explicit replay rate within the inclusive zero-to-one range", () => {
    expect(
      resolveAmplitudeRuntime({
        apiKey: "preview-key",
        nodeEnv: "production",
        sessionReplaySampleRate: "0.25",
      }).sessionReplaySampleRate,
    ).toBe(0.25);
  });

  it("falls back to the environment default for an invalid replay rate", () => {
    expect(
      resolveAmplitudeRuntime({
        apiKey: "production-key",
        nodeEnv: "production",
        sessionReplaySampleRate: "1.5",
      }).sessionReplaySampleRate,
    ).toBe(0.1);
  });

  it("disables Amplitude when the environment key is missing", () => {
    expect(
      resolveAmplitudeRuntime({
        apiKey: "  ",
        nodeEnv: "production",
      }),
    ).toEqual({
      apiKey: null,
      enabled: false,
      sessionReplaySampleRate: 0.1,
    });
  });
});
