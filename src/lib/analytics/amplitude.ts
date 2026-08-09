"use client";

import * as amplitude from "@amplitude/unified";

import { amplitudeRuntime } from "@/lib/analytics/amplitude-runtime";
const pendingAmplitudeCommands: unknown[][] = [];
let amplitudeInitialization: Promise<void> | null = null;

function dispatchAmplitudeDataCommand(...args: unknown[]): void {
  const [command, nameOrProperties, maybeProperties] = args;

  if (command === "event" && typeof nameOrProperties === "string") {
    const eventProperties =
      typeof maybeProperties === "object" && maybeProperties !== null
        ? (maybeProperties as Record<string, unknown>)
        : undefined;
    amplitude.track(nameOrProperties, eventProperties);
    return;
  }

  if (
    command === "set" &&
    typeof nameOrProperties === "object" &&
    nameOrProperties !== null &&
    "user_id" in nameOrProperties
  ) {
    const userId = (nameOrProperties as { user_id?: unknown }).user_id;
    amplitude.setUserId(typeof userId === "string" ? userId : undefined);
  }
}

export function initializeAmplitude(): void {
  if (
    typeof window === "undefined" ||
    !amplitudeRuntime.enabled ||
    !amplitudeRuntime.apiKey
  ) {
    return;
  }

  amplitudeInitialization ??= amplitude.initAll(amplitudeRuntime.apiKey, {
    analytics: {
      autocapture: {
        attribution: true,
        elementInteractions: false,
        fileDownloads: false,
        formInteractions: false,
        frustrationInteractions: false,
        networkTracking: false,
        pageUrlEnrichment: true,
        pageViews: false,
        performanceTracking: false,
        sessions: true,
        webVitals: false,
      },
    },
    sessionReplay: {
      privacyConfig: {
        blockSelector: [".amp-block", "[data-amplitude-block]"],
        defaultMaskLevel: "conservative",
        maskSelector: [".amp-mask", "[data-amplitude-mask]"],
      },
      sampleRate: amplitudeRuntime.sessionReplaySampleRate,
    },
  });
  amplitude.setOptOut(false);

  for (const command of pendingAmplitudeCommands.splice(0)) {
    dispatchAmplitudeDataCommand(...command);
  }
}

export function sendAmplitudeDataCommand(...args: unknown[]): void {
  if (typeof window === "undefined" || !amplitudeRuntime.enabled) return;

  if (amplitudeInitialization === null) {
    pendingAmplitudeCommands.push(args);
    return;
  }

  dispatchAmplitudeDataCommand(...args);
}

export function revokeAmplitudeConsent(): void {
  pendingAmplitudeCommands.length = 0;
  if (typeof window === "undefined" || amplitudeInitialization === null) return;

  amplitude.setUserId(undefined);
  amplitude.setOptOut(true);
}
