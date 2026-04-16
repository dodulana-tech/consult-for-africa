import { NextRequest, NextResponse } from "next/server";
import { sendOutreachBatch } from "@/lib/cadreHealth/outreachSender";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user?.role ||
    !["PARTNER", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(
      Math.max(parseInt(body.batchSize ?? "25", 10) || 25, 1),
      200
    );

    const result = await sendOutreachBatch(batchSize);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Outreach batch error:", err);
    return NextResponse.json(
      { error: "Failed to send outreach batch" },
      { status: 500 }
    );
  }
}
