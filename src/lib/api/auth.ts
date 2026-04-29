const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const FETCH_OPTS: RequestInit = {
  credentials: "include",
};

export type UserMe = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
};

export async function getMe(): Promise<UserMe> {
  const res = await fetch(`${API_BASE}/users/me`, FETCH_OPTS);
  if (!res.ok) throw new Error(`내 정보 조회 실패: ${res.status}`);
  return res.json();
}

export async function exchangeGoogleCode(
  code: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetch("/api/auth/google", {
    ...FETCH_OPTS,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

export async function refreshToken(): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const res = await fetch("/api/auth/refresh", {
    ...FETCH_OPTS,
    method: "POST",
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

export async function logout(): Promise<
  { ok: true } | { ok: false; status: number }
> {
  const res = await fetch("/api/auth/logout", {
    ...FETCH_OPTS,
    method: "POST",
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
