"use client";

import { useEffect, useState } from "react";

import {
  readDestinationLatLngFromSession,
  writeDestinationLatLngToSession,
} from "@/lib/maps";
import { readRoomMapViewport } from "@/lib/map-room-viewport-storage";

/** 지오코드 결과 없거나 방 미선택 시 기본 줌 근처 */
const DEFAULT_MAP_CENTER = { lat: 37.5665, lng: 126.978 };
/** 목적지 문자열 지오코드 후 줌 레벨 */
export const DESTINATION_MAP_ZOOM = 12;

/** 방·목록이 준비된 뒤 localStorage 뷰포트 → 목적지 지오코드(또는 세션 캐시) 순으로 첫 프레임 중심을 정함 */
export function useTripMapBootstrap(
  roomId: string | null | undefined,
  destination: string | null | undefined,
  roomsFetched: boolean,
  geocodingLib: google.maps.GeocodingLibrary | null,
): { ready: boolean; center: google.maps.LatLngLiteral; zoom: number } {
  const rid = typeof roomId === "string" ? roomId.trim() : "";
  const dest = typeof destination === "string" ? destination.trim() : "";

  const [coords, setCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [bootstrapZoom, setBootstrapZoom] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCoords(null);
    setBootstrapZoom(null);
    setSettled(false);

    if (!rid.length) {
      setSettled(true);
      return () => {
        cancelled = true;
      };
    }

    if (!roomsFetched) {
      return () => {
        cancelled = true;
      };
    }

    const savedViewport = readRoomMapViewport(rid);
    if (savedViewport) {
      setCoords({ lat: savedViewport.lat, lng: savedViewport.lng });
      setBootstrapZoom(savedViewport.zoom);
      setSettled(true);
      return () => {
        cancelled = true;
      };
    }

    if (!dest.length) {
      setSettled(true);
      return () => {
        cancelled = true;
      };
    }

    const cached = readDestinationLatLngFromSession(rid, dest);
    if (cached) {
      setCoords(cached);
      setBootstrapZoom(DESTINATION_MAP_ZOOM);
      setSettled(true);
      return () => {
        cancelled = true;
      };
    }

    if (!geocodingLib || typeof geocodingLib.Geocoder !== "function") {
      return () => {
        cancelled = true;
      };
    }

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address: dest }, (results, status) => {
      if (cancelled) return;
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const c = { lat: loc.lat(), lng: loc.lng() };
        writeDestinationLatLngToSession(rid, dest, c);
        setCoords(c);
        setBootstrapZoom(DESTINATION_MAP_ZOOM);
      }
      setSettled(true);
    });

    return () => {
      cancelled = true;
    };
  }, [rid, dest, roomsFetched, geocodingLib]);

  if (!rid.length) {
    return { ready: true, center: DEFAULT_MAP_CENTER, zoom: 13 };
  }

  if (!roomsFetched || !settled) {
    return {
      ready: false,
      center: DEFAULT_MAP_CENTER,
      zoom: DESTINATION_MAP_ZOOM,
    };
  }

  if (!dest.length && !coords) {
    return { ready: true, center: DEFAULT_MAP_CENTER, zoom: 13 };
  }

  const zoom =
    bootstrapZoom ??
    (coords ? DESTINATION_MAP_ZOOM : 13);

  return {
    ready: true,
    center: coords ?? DEFAULT_MAP_CENTER,
    zoom,
  };
}
