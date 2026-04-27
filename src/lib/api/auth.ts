export async function exchangeGoogleCode(
  code: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}
