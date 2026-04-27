const BASE_URL = "https://api.howaboutus.app";

export async function exchangeGoogleCode(
  code: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    credentials: "include",
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
