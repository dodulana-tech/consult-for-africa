import { NextRequest, NextResponse } from "next/server";
import { sendOutreachBatch, type OutreachChannel } from "@/lib/cadreHealth/outreachSender";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";

const VALID_CHANNELS: OutreachChannel[] = ["EMAIL", "WHATSAPP"];

export const POST = handler(async function POST(req: NextRequest) {
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

    const requestedChannel = (body.channel ?? "EMAIL").toString().toUpperCase() as OutreachChannel;
    const channel: OutreachChannel = VALID_CHANNELS.includes(requestedChannel)
      ? requestedChannel
      : "EMAIL";

    const result = await sendOutreachBatch(batchSize, channel);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Outreach batch error:", err);
    return NextResponse.json(
      { error: "Failed to send outreach batch" },
      { status: 500 }
    );
  }
});
