import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET = () => {
  const s = process.env.CADRE_PORTAL_SECRET;
  if (!s) throw new Error("CADRE_PORTAL_SECRET environment variable is required");
  return s;
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signJWT(payload: Record<string, unknown>, secret: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const body = base64url(
    JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJWT<T>(token: string, secret: string): T | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as T;
  } catch {
    return null;
  }
}

// ─── CadreHealth Professional Session ───

export interface CadreSession {
  sub: string; // professional ID
  email: string;
  firstName: string;
  lastName: string;
  cadre: string;
  accountStatus: string;
}

export function signCadreJWT(payload: Record<string, unknown>): string {
  return signJWT(payload, SECRET());
}

export function verifyCadreToken(token: string): CadreSession | null {
  return verifyJWT<CadreSession>(token, SECRET());
}

export async function getCadreSession(): Promise<CadreSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cadre_token")?.value;
  if (!token) return null;
  const session = verifyCadreToken(token);
  if (session) {
    // Fire-and-forget heartbeat so we can tell "active in last 7/30 days"
    // honestly. Without this, lastLoginAt only updates when the user
    // re-authenticates via the login form (every 30 days, when the cookie
    // expires) — so it dramatically undercounts real engagement.
    touchLastLogin(session.sub);
  }
  return session;
}

// In-memory throttle: only update lastLoginAt once per HEARTBEAT_THROTTLE_MS
// per professional. Avoids hammering the DB on every page request. Map is
// per-process; on a multi-instance deploy we may write up to N times per
// window, which is fine — N is small and the write is idempotent.
const HEARTBEAT_THROTTLE_MS = 60 * 60 * 1000; // 1 hour
const lastHeartbeat = new Map<string, number>();

function touchLastLogin(professionalId: string): void {
  const now = Date.now();
  const last = lastHeartbeat.get(professionalId) ?? 0;
  if (now - last < HEARTBEAT_THROTTLE_MS) return;
  lastHeartbeat.set(professionalId, now);
  // Cap the cache so a long-running process doesn't leak memory. 10k is
  // well above the active-cadre pool size; eviction is a clean wipe rather
  // than LRU to keep the code dead simple.
  if (lastHeartbeat.size > 10000) lastHeartbeat.clear();
  prisma.cadreProfessional
    .update({ where: { id: professionalId }, data: { lastLoginAt: new Date() } })
    .catch((err) => console.error("[cadre-heartbeat] failed:", err));
}
