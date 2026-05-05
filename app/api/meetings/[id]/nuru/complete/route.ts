import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { verifyBotSignature } from "@/lib/nuru-bot/dispatch";
import { buildKey, r2Client, getPublicUrl } from "@/lib/r2";
import { sendMeetingSummary } from "@/lib/email";

export const maxDuration = 300; // Claude summarization can take ~30-60s

/**
 * POST /api/meetings/[id]/nuru/complete
 * Bot service finished. We:
 *  1. Save transcript to DB + R2
 *  2. Run Claude summarization
 *  3. Email participants
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ts = req.headers.get("x-bot-timestamp");
  const sig = req.headers.get("x-bot-signature");
  const raw = await req.text();
  if (!verifyBotSignature(raw, ts, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { id } = await params;
  const body = JSON.parse(raw || "{}") as {
    transcript?: string;
    startedAt?: string | null;
    endedAt?: string | null;
    durationSec?: number;
  };

  const transcript = body.transcript ?? "";
  const startedAt = body.startedAt ? new Date(body.startedAt) : null;
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();
  const durationMinutes = Math.round((body.durationSec ?? 0) / 60);

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      engagement: { select: { name: true, serviceType: true } },
      discoveryCall: { select: { organizationName: true, organizationType: true } },
      participants: { select: { name: true, email: true, role: true } },
      organizer: { select: { name: true } },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "meeting not found" }, { status: 404 });
  }

  // If transcript is empty, just mark completed and exit
  if (!transcript.trim()) {
    await prisma.meeting.update({
      where: { id },
      data: {
        status: "COMPLETED",
        endedAt,
        duration: durationMinutes,
      },
    });
    return NextResponse.json({ ok: true, summarized: false });
  }

  // Run Claude summarization
  let summary = "";
  let actionItems: string[] = [];
  let keyDecisions: string[] = [];

  try {
    const anthropic = new Anthropic();
    const contextLines: string[] = [];
    if (meeting.engagement) contextLines.push(`Project: ${meeting.engagement.name} (${meeting.engagement.serviceType})`);
    if (meeting.discoveryCall) {
      contextLines.push(
        `Discovery call with: ${meeting.discoveryCall.organizationName} (${meeting.discoveryCall.organizationType})`,
      );
    }
    contextLines.push(
      `Participants: ${meeting.participants.map((p) => `${p.name} (${p.role || "attendee"})`).join(", ")}`,
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are Nuru, the meeting assistant for Consult For Africa, a healthcare consulting firm in Nigeria.

Analyze this meeting transcript and provide:
1. A concise summary (3-5 sentences covering key topics discussed)
2. Action items (specific, assignable tasks with who should do them)
3. Key decisions made during the meeting

Context:
- Meeting: ${meeting.title} (${meeting.type})
${contextLines.map((l) => `- ${l}`).join("\n")}

Transcript:
${transcript}

Respond in this exact JSON format:
{
  "summary": "...",
  "actionItems": ["Action item 1 - Owner", "Action item 2 - Owner"],
  "keyDecisions": ["Decision 1", "Decision 2"]
}`,
        },
      ],
    });

    const firstBlock = response.content[0];
    const text = firstBlock?.type === "text" ? firstBlock.text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        summary?: string;
        actionItems?: string[];
        keyDecisions?: string[];
      };
      summary = parsed.summary ?? "";
      actionItems = parsed.actionItems ?? [];
      keyDecisions = parsed.keyDecisions ?? [];
    }
  } catch (err) {
    console.error("[nuru/complete] summarization failed:", err);
    summary = "Meeting transcript captured but summary generation failed. Please review the transcript.";
  }

  // Save transcript + summary to DB
  await prisma.meeting.update({
    where: { id },
    data: {
      status: "COMPLETED",
      endedAt,
      duration: durationMinutes,
      transcript,
      aiSummary: summary,
      aiActionItems: actionItems,
      aiKeyDecisions: keyDecisions,
    },
  });

  // Upload transcript to R2 (best-effort)
  try {
    const key = buildKey("recordings", `${id}-transcript.txt`);
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME ?? "cfa-uploads",
        Key: key,
        Body: transcript,
        ContentType: "text/plain",
        Metadata: { meetingId: id, type: "transcript" },
      }),
    );
    const recordingUrl = await getPublicUrl(key);
    await prisma.meeting.update({
      where: { id },
      data: { recordingUrl, recordingBucket: "cfa-uploads", recordingKey: key },
    });
  } catch (err) {
    console.error("[nuru/complete] R2 upload failed:", err);
  }

  // Email summary to participants (fire and forget)
  const meetingDate = startedAt ?? meeting.scheduledAt;
  for (const participant of meeting.participants) {
    sendMeetingSummary({
      to: participant.email,
      participantName: participant.name,
      meetingTitle: meeting.title,
      summary,
      actionItems,
      meetingDate,
    }).catch((err) =>
      console.error(`[nuru/complete] email failed for ${participant.email}:`, err),
    );
  }

  return NextResponse.json({ ok: true, summarized: true });
}
