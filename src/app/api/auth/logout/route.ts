import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const backendRes = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
  });

  const res = new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });

  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);

  return res;
}
