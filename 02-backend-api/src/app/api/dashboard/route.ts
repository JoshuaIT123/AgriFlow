import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendOk } from "@/lib/http";
import { buildDashboard } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

/** GET /api/dashboard - role-aware summary (UC-26 farmer, UC-27 buyer). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  return sendOk({ dashboard: buildDashboard(auth.user) });
}