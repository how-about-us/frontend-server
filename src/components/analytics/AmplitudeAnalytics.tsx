"use client";

import { useEffect } from "react";

import { initializeAmplitude } from "@/lib/analytics/amplitude";

export function AmplitudeAnalytics() {
  useEffect(() => {
    initializeAmplitude();
  }, []);

  return null;
}
