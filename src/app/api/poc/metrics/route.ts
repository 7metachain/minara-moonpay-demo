import { NextResponse } from "next/server";
import {
  getFunnelMetrics,
  getFailureBreakdown,
  getKPIs,
  getAllEvents,
} from "@/lib/services/metrics";

export async function GET() {
  return NextResponse.json({
    funnel: getFunnelMetrics(),
    failures: getFailureBreakdown(),
    kpis: getKPIs(),
    events: getAllEvents(),
  });
}
