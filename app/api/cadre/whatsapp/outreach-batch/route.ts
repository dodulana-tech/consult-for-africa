import { NextResponse } from "next/server";
import { sendOutreachBatch } from "@/lib/cadreHealth/outreachSender";
import { auth } from "@/auth";

// ─── CadreHealth: Outreach Batch Sender API ───

export async function POST() {
  const session = await auth();
  if (
    !session?.user?.role ||
    !["PARTNER", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
