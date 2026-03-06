import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/services/webhook";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (!payload.orderId || !payload.status) {
    return NextResponse.json(
      { error: "Missing required fields: orderId, status" },
      { status: 400 }
    );
  }

  const result = handleWebhook(payload);

  return NextResponse.json(result, {
    status: result.accepted ? 200 : 400,
  });
}
