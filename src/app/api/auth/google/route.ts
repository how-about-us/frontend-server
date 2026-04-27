import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://api.howaboutus.app/auth/google/login";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
