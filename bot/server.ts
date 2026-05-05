import express, { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import {
  scheduleJob,
  cancelJob,
  listScheduledJobs,
  getActiveSession,
  getActiveSessions,
  NuruMeetingSession,
} from "./orchestrator";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT ?? 8080);
const BOT_SECRET = process.env.BOT_SECRET;

if (!BOT_SECRET) {
  console.error("[server] BOT_SECRET env var is required - exiting");
  process.exit(1);
}

// ─── Auth middleware ─────────────────────────────────────────────────────────
// Vercel signs requests with HMAC(timestamp, body) using BOT_SECRET.
// Reject anything else.

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function verifyHmac(req: Request, res: Response, next: NextFunction): void {
  const ts = req.header("X-Bot-Timestamp");
  const sig = req.header("X-Bot-Signature");
  if (!ts || !sig) {
    res.status(401).json({ error: "missing signature" });
    return;
  }
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(ts, 10));
  if (Number.isNaN(ageSec) || ageSec > 300) {
    res.status(401).json({ error: "stale signature" });
    return;
  }
  const body = JSON.stringify(req.body ?? {});
  const expected = crypto
    .createHmac("sha256", BOT_SECRET!)
    .update(`${ts}.${body}`)
    .digest("hex");
  if (!timingSafeEqualHex(sig, expected)) {
    res.status(401).json({ error: "invalid signature" });
    return;
  }
  next();
}

// ─── Public health check (no auth) ───────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    activeSessions: getActiveSessions().length,
    scheduledJobs: listScheduledJobs().length,
  });
});

// ─── Authed routes ───────────────────────────────────────────────────────────

app.post("/jobs/schedule", verifyHmac, (req, res) => {
  const { meetingId, meetLink, scheduledAt } = req.body ?? {};
  if (typeof meetingId !== "string" || typeof meetLink !== "string" || typeof scheduledAt !== "string") {
    res.status(400).json({ error: "meetingId, meetLink, scheduledAt required" });
    return;
  }
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    res.status(400).json({ error: "invalid scheduledAt" });
    return;
  }
  scheduleJob(meetingId, meetLink, date);
  res.json({ ok: true, meetingId, scheduledAt: date.toISOString() });
});

app.post("/jobs/cancel", verifyHmac, (req, res) => {
  const { meetingId } = req.body ?? {};
  if (typeof meetingId !== "string") {
    res.status(400).json({ error: "meetingId required" });
    return;
  }
  const cancelled = cancelJob(meetingId);
  // Also stop active session if running
  const active = getActiveSession(meetingId);
  if (active) {
    active.stop().catch((err) => console.error(`[cancel] stop failed:`, err));
  }
  res.json({ ok: true, cancelled, activeStopped: !!active });
});

app.post("/jobs/run-now", verifyHmac, async (req, res) => {
  const { meetingId, meetLink } = req.body ?? {};
  if (typeof meetingId !== "string" || typeof meetLink !== "string") {
    res.status(400).json({ error: "meetingId, meetLink required" });
    return;
  }
  try {
    const session = new NuruMeetingSession(meetingId, meetLink);
    void session.start().catch((err) => console.error(`[run-now] session failed:`, err));
    res.json({ ok: true, status: "starting" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

app.get("/jobs", verifyHmac, (_req, res) => {
  res.json({
    activeSessions: getActiveSessions(),
    scheduledJobs: listScheduledJobs(),
  });
});

app.listen(PORT, () => {
  console.log(`[server] Nuru bot listening on :${PORT}`);
});
