"use client";

import { useCallback, useEffect, useState } from "react";

export type Room = {
  id: string;
  title: string;
  /** "4월 8일 – 5월 6일" 형태 또는 null */
  date: string | null;
  places: number;
  gradient: string;
  createdAt: number;
};

const STORAGE_KEY = "how-about-us-rooms";
const UPDATE_EVENT = "hau:rooms-updated";

const GRADIENTS = [
  "from-teal-400 to-cyan-600",
  "from-green-500 to-emerald-700",
  "from-purple-400 to-violet-600",
  "from-orange-400 to-rose-500",
  "from-blue-400 to-indigo-600",
  "from-pink-400 to-fuchsia-600",
];

const DEFAULT_ROOMS: Room[] = [
  {
    id: "room-hikone",
    title: "히코네 여행",
    date: null,
    places: 0,
    gradient: GRADIENTS[0],
    createdAt: 1,
  },
  {
    id: "room-japura",
    title: "자푸라 여행",
    date: "4월 8일 – 5월 6일",
    places: 0,
    gradient: GRADIENTS[1],
    createdAt: 2,
  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function load(): Room[] {
  if (typeof window === "undefined") return DEFAULT_ROOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Room[];
  } catch {}
  return DEFAULT_ROOMS;
}

function save(rooms: Room[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function addRoom(
  title: string,
  startDate?: string,
  endDate?: string,
): Room {
  const rooms = load();
  const gradient = GRADIENTS[rooms.length % GRADIENTS.length];

  let date: string | null = null;
  if (startDate && endDate) {
    date = `${formatDate(startDate)} – ${formatDate(endDate)}`;
  } else if (startDate) {
    date = formatDate(startDate);
  }

  const newRoom: Room = {
    id: `room-${Date.now()}`,
    title,
    date,
    places: 0,
    gradient,
    createdAt: Date.now(),
  };

  save([...rooms, newRoom]);
  return newRoom;
}

export function removeRoom(id: string) {
  save(load().filter((r) => r.id !== id));
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);

  const refresh = useCallback(() => setRooms(load()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { rooms, refresh };
}
