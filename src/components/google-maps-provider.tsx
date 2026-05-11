"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

import { requiredEnv } from "@/lib/required-env";

export function GoogleMapsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <APIProvider apiKey={requiredEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")}>
      {children}
    </APIProvider>
  );
}
