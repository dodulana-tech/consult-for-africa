import { NuruMeetBot } from "./meet-bot";
import { NuruTranscriber, TranscriptSegment } from "./transcriber";
import { postToVercel } from "./webhook";

/**
 * Nuru Meeting Orchestrator (bot-side)
 *
 * Lifecycle:
 * 1. Start bot -> joins Google Meet
 * 2. Audio chunks flow to Deepgram -> real-time transcript
 * 3. Meeting ends -> POST transcript + duration to Vercel webhook
 *    (Vercel runs Claude summarization, saves to R2, emails participants)
 *
 * Bot-side does NOT touch the database directly. All side effects flow
 * through Vercel webhooks for a clean security boundary.
 */

const activeSessions = new Map<string, NuruMeetingSession>();
const MAX_CONCURRENT_SESSIONS = 5;

export class NuruMeetingSession {
  private bot: NuruMeetBot;
  private transcriber: NuruTranscriber;
  private meetingId: string;
  private startedAt: Date | null = null;
  private segments: TranscriptSegment[] = [];

  constructor(meetingId: string, meetLink: string) {
    this.meetingId = meetingId;

    this.transcriber = new NuruTranscriber({
      onSegment: (segment) => {
        if (segment.isFinal) this.segments.push(segment);
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
        console.log(`[nuru:${meetingId}] Meeting ended`);
        this.processMeetingEnd().catch((err) => {
          console.error(`[nuru:${meetingId}] processMeetingEnd failed:`, err);
        });
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
    this.startedAt = new Date();

    // Tell Vercel we're joining
    await postToVercel(`/api/meetings/${this.meetingId}/nuru/start`, {
      startedAt: this.startedAt.toISOString(),
    }).catch((err) => {
      console.error(`[nuru:${this.meetingId}] start webhook failed:`, err);
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
    await this.dispatchComplete(transcript);
    activeSessions.delete(this.meetingId);
  }

  private async processMeetingEnd(): Promise<void> {
    const transcript = await this.transcriber.stop();
    await this.bot.leave();
    await this.dispatchComplete(transcript);
    activeSessions.delete(this.meetingId);
  }

  private async dispatchComplete(transcript: string): Promise<void> {
    const endedAt = new Date();
    const durationSec = this.startedAt
      ? Math.round((endedAt.getTime() - this.startedAt.getTime()) / 1000)
      : 0;

    try {
      await postToVercel(`/api/meetings/${this.meetingId}/nuru/complete`, {
        transcript,
        startedAt: this.startedAt?.toISOString() ?? null,
        endedAt: endedAt.toISOString(),
        durationSec,
        segmentCount: this.segments.length,
      });
      console.log(`[nuru:${this.meetingId}] Completion dispatched. Duration ${durationSec}s, ${this.segments.length} segments.`);
    } catch (err) {
      console.error(`[nuru:${this.meetingId}] complete webhook failed:`, err);
    }
  }
}

export function getActiveSession(meetingId: string): NuruMeetingSession | undefined {
  return activeSessions.get(meetingId);
}

export function getActiveSessions(): string[] {
  return Array.from(activeSessions.keys());
}

// ─── In-memory job queue ─────────────────────────────────────────────────────
// Simple scheduler. Production-grade users would swap for BullMQ + Redis.

interface ScheduledJob {
  meetingId: string;
  meetLink: string;
  scheduledAt: Date;
  timer: NodeJS.Timeout;
}

const scheduledJobs = new Map<string, ScheduledJob>();

export function scheduleJob(meetingId: string, meetLink: string, scheduledAt: Date): void {
  // Cancel any existing job for this meeting
  cancelJob(meetingId);

  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
  console.log(`[scheduler] Job ${meetingId} scheduled in ${Math.round(delayMs / 1000)}s`);

  const timer = setTimeout(async () => {
    scheduledJobs.delete(meetingId);
    try {
      const session = new NuruMeetingSession(meetingId, meetLink);
      await session.start();
    } catch (err) {
      console.error(`[scheduler] Job ${meetingId} failed to start:`, err);
      // Notify Vercel of the failure
      postToVercel(`/api/meetings/${meetingId}/nuru/error`, {
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => {});
    }
  }, delayMs);

  scheduledJobs.set(meetingId, { meetingId, meetLink, scheduledAt, timer });
}

export function cancelJob(meetingId: string): boolean {
  const existing = scheduledJobs.get(meetingId);
  if (!existing) return false;
  clearTimeout(existing.timer);
  scheduledJobs.delete(meetingId);
  console.log(`[scheduler] Job ${meetingId} cancelled`);
  return true;
}

export function listScheduledJobs(): Array<{ meetingId: string; scheduledAt: string }> {
  return Array.from(scheduledJobs.values()).map((j) => ({
    meetingId: j.meetingId,
    scheduledAt: j.scheduledAt.toISOString(),
  }));
}
