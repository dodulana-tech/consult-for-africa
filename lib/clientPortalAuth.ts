import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = () => {
  const s = process.env.CLIENT_PORTAL_SECRET;
  if (!s) throw new Error("CLIENT_PORTAL_SECRET environment variable is required");
  return s;
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

export function signClientPortalJWT(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const body = base64url(
    JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })
  );
  const sig = crypto
    .createHmac("sha256", SECRET())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyClientPortalToken(
  token: string
): { sub: string; clientId: string; name: string; email: string } | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = crypto
      .createHmac("sha256", SECRET())
      .update(`${header}.${body}`)
      .digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as { sub: string; clientId: string; name: string; email: string };
  } catch {
    return null;
  }
}

export async function getClientPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("client_portal_token")?.value;
  if (!token) return null;
  return verifyClientPortalToken(token);
}
