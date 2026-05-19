import type { NextRequest } from "next/server";

import { sessionCheckResponse } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  return sessionCheckResponse(request);
}
