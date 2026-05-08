const FETCH_OPTS: RequestInit = {
  credentials: "include",
};

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
