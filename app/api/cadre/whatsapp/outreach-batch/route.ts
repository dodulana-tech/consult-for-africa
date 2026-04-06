import { NextResponse } from "next/server";
import { sendOutreachBatch } from "@/lib/cadreHealth/outreachSender";

// ─── CadreHealth: Outreach Batch Sender API ───

export async function POST() {
  // TODO: Add admin auth check here
  try {
    const result = await sendOutreachBatch(50);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Outreach batch error:", err);
    return NextResponse.json(
      { error: "Failed to send outreach batch" },
      { status: 500 }
    );
  }
}
