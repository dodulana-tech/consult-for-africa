import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = () => {
  const s = process.env.CADRE_EMPLOYER_SECRET || process.env.CADRE_PORTAL_SECRET;
  if (!s) throw new Error("CADRE_EMPLOYER_SECRET or CADRE_PORTAL_SECRET environment variable is required");
  return s + "_employer"; // namespace even if sharing the same env var
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

// ─── CadreHealth Employer Session ───

export interface CadreEmployerSession {
  sub: string; // employer account ID
  email: string;
  companyName: string;
  contactName: string;
  isVerified: boolean;
  facilityId: string | null;
}

export function signCadreEmployerJWT(payload: Record<string, unknown>): string {
  return signJWT(payload, SECRET());
}

export function verifyCadreEmployerToken(token: string): CadreEmployerSession | null {
  return verifyJWT<CadreEmployerSession>(token, SECRET());
}

export async function getCadreEmployerSession(): Promise<CadreEmployerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cadre_employer_token")?.value;
  if (!token) return null;
  return verifyCadreEmployerToken(token);
}
