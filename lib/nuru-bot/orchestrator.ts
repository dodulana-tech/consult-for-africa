import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendMeetingSummary } from "@/lib/email";
import { buildKey, r2Client, getPublicUrl } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NuruMeetBot } from "./meet-bot";
import { NuruTranscriber, TranscriptSegment } from "./transcriber";

/**
 * Nuru Meeting Orchestrator
 *
 * Coordinates the Meet bot, transcriber, and Claude summarization
 * for a single meeting session.
 *
 * Lifecycle:
 * 1. Start bot -> joins Google Meet
 * 2. Audio chunks flow to transcriber -> real-time transcript
 * 3. Meeting ends -> full transcript sent to Claude for summary
 * 4. Summary + action items saved to DB and emailed to participants
 */

// Track active sessions to prevent duplicate bots
const activeSessions = new Map<string, NuruMeetingSession>();
const MAX_CONCURRENT_SESSIONS = 5;

export class NuruMeetingSession {
  private bot: NuruMeetBot;
  private transcriber: NuruTranscriber;
  private meetingId: string;
  private segments: TranscriptSegment[] = [];

  constructor(meetingId: string, meetLink: string) {
    this.meetingId = meetingId;

    this.transcriber = new NuruTranscriber({
      onSegment: (segment) => {
        if (segment.isFinal) {
          this.segments.push(segment);
        }
      },
      onError: (err) => {
        console.error(`[nuru:${meetingId}] Transcription error:`, err);
      },
    });

    this.bot = new NuruMeetBot({
      meetLink,
      meetingId,
      botName: "Nuru (Meeting Assistant)",
      onAudioChunk: (chunk) => {
        this.transcriber.sendAudio(chunk);
      },
      onMeetingEnd: () => {
        console.log(`[nuru:${meetingId}] Meeting ended, processing...`);
        this.processMeetingEnd().catch(console.error);
      },
      onError: (err) => {
        console.error(`[nuru:${meetingId}] Bot error:`, err);
      },
    });
  }

  async start(): Promise<void> {
    if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
      throw new Error(`Maximum concurrent Nuru sessions (${MAX_CONCURRENT_SESSIONS}) reached`);
    }

    console.log(`[nuru:${this.meetingId}] Starting session...`);

    // Mark as joined in DB
    await prisma.meeting.update({
      where: { id: this.meetingId },
      data: { nuruJoined: true, status: "IN_PROGRESS", startedAt: new Date() },
    });

    // Start transcription first, then join the meeting
    await this.transcriber.start();
    await this.bot.join();

    activeSessions.set(this.meetingId, this);
    console.log(`[nuru:${this.meetingId}] Session active`);
  }

  async stop(): Promise<void> {
    console.log(`[nuru:${this.meetingId}] Stopping session...`);
    await this.bot.leave();
    const transcript = await this.transcriber.stop();

    if (transcript) {
      await this.saveTranscriptAndSummarize(transcript);
    }

    activeSessions.delete(this.meetingId);
  }

  private async processMeetingEnd(): Promise<void> {
    const transcript = await this.transcriber.stop();
    await this.bot.leave();

    if (transcript) {
      await this.saveTranscriptAndSummarize(transcript);
    } else {
      // No transcript captured, just mark as completed
      await prisma.meeting.update({
        where: { id: this.meetingId },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
        },
      });
    }

    activeSessions.delete(this.meetingId);
  }

  private async saveTranscriptAndSummarize(transcript: string): Promise<void> {
    console.log(`[nuru:${this.meetingId}] Generating summary...`);

    // Get meeting context
    const meeting = await prisma.meeting.findUnique({
      where: { id: this.meetingId },
      include: {
        engagement: { select: { name: true, serviceType: true } },
        discoveryCall: { select: { organizationName: true, organizationType: true } },
        participants: { select: { name: true, email: true, role: true } },
        organizer: { select: { name: true } },
      },
    });

    if (!meeting) return;

    // Summarize with Claude
    const anthropic = new Anthropic();
    const contextLines: string[] = [];
    if (meeting.engagement) {
      contextLines.push(`Project: ${meeting.engagement.name} (${meeting.engagement.serviceType})`);
    }
    if (meeting.discoveryCall) {
      contextLines.push(
        `Discovery call with: ${meeting.discoveryCall.organizationName} (${meeting.discoveryCall.organizationType})`
      );
    }
    contextLines.push(
      `Participants: ${meeting.participants.map((p) => `${p.name} (${p.role || "attendee"})`).join(", ")}`
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
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

    let summary = "";
    let actionItems: string[] = [];
    let keyDecisions: string[] = [];

    try {
      const firstBlock = response.content[0];
      const text = firstBlock?.type === "text" ? firstBlock.text : "";
      // Strip markdown fences if present
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || "";
        actionItems = parsed.actionItems || [];
        keyDecisions = parsed.keyDecisions || [];
      }
    } catch (err) {
      console.error(`[nuru:${this.meetingId}] Failed to parse AI response:`, err);
      summary = "Meeting transcript captured but summary generation failed. Please review the transcript.";
    }

    // Calculate duration
    const startedAt = meeting.startedAt ?? meeting.scheduledAt;
    const endedAt = new Date();
    const durationMinutes = Math.round(
      (endedAt.getTime() - new Date(startedAt).getTime()) / 60000
    );

    // Save to DB
    await prisma.meeting.update({
      where: { id: this.meetingId },
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

    console.log(`[nuru:${this.meetingId}] Summary saved. Duration: ${durationMinutes}min`);

    // Upload transcript to R2 for long-term storage
    try {
      const key = buildKey("recordings", `${this.meetingId}-transcript.txt`);
      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME ?? "cfa-uploads",
          Key: key,
          Body: transcript,
          ContentType: "text/plain",
          Metadata: { meetingId: this.meetingId, type: "transcript" },
        })
      );
      const recordingUrl = await getPublicUrl(key);
      await prisma.meeting.update({
        where: { id: this.meetingId },
        data: { recordingUrl, recordingBucket: "cfa-uploads", recordingKey: key },
      });
      console.log(`[nuru:${this.meetingId}] Transcript uploaded to R2: ${key}`);
    } catch (err) {
      console.error(`[nuru:${this.meetingId}] R2 upload failed:`, err);
    }

    // Email summary to all participants (non-blocking)
    for (const participant of meeting.participants) {
      sendMeetingSummary({
        to: participant.email,
        participantName: participant.name,
        meetingTitle: meeting.title,
        summary,
        actionItems,
        meetingDate: new Date(startedAt),
      }).catch((err) =>
        console.error(`[nuru:${this.meetingId}] Email failed for ${participant.email}:`, err)
      );
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getActiveSession(meetingId: string): NuruMeetingSession | undefined {
  return activeSessions.get(meetingId);
}

export function getActiveSessions(): string[] {
  return Array.from(activeSessions.keys());
}
