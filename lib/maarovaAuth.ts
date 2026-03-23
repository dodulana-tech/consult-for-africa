import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = () => {
  const s = process.env.MAAROVA_PORTAL_SECRET;
  if (!s) {
    console.error("[maarovaAuth] MAAROVA_PORTAL_SECRET is not set. Authentication will fail.");
    return "MISSING_SECRET_DO_NOT_USE";
  }
  return s;
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signJWT(payload: Record<string, unknown>, secret: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
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
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as T;
  } catch {
    return null;
  }
}

// ─── Maarova Portal (User / HR / Manager) ───

export interface MaarovaSession {
  sub: string;
  organisationId: string;
  name: string;
  email: string;
  role: string;
}

export function signMaarovaJWT(payload: Record<string, unknown>): string {
  return signJWT(payload, SECRET());
}

export function verifyMaarovaToken(token: string): MaarovaSession | null {
  return verifyJWT<MaarovaSession>(token, SECRET());
}

export async function getMaarovaSession(): Promise<MaarovaSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("maarova_portal_token")?.value;
  if (!token) return null;
  return verifyMaarovaToken(token);
}

// ─── Coach Portal ───

export interface MaarovaCoachSession {
  sub: string;
  name: string;
  email: string;
}

export function signMaarovaCoachJWT(payload: Record<string, unknown>): string {
  return signJWT(payload, SECRET() + "-coach");
}

export function verifyMaarovaCoachToken(token: string): MaarovaCoachSession | null {
  return verifyJWT<MaarovaCoachSession>(token, SECRET() + "-coach");
}

export async function getMaarovaCoachSession(): Promise<MaarovaCoachSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("maarova_coach_token")?.value;
  if (!token) return null;
  return verifyMaarovaCoachToken(token);
}
