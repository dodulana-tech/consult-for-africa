/**
 * Opening a Mezo place for a CadreHealth member.
 *
 * Mezo runs in its own codebase against its own database, so this is an HTTP
 * call across a trust boundary, signed the same way Paystack signs us: HMAC
 * over the exact bytes we send, verified on the far side before the body is
 * parsed. See docs/mezo-cadrehealth-handoff.md.
 *
 * Mezo already models a pre-made account as a Doctor row holding a claimToken,
 * which the doctor exchanges for a password. So we are not inventing an
 * account, we are asking Mezo to seed a stub and hand back the URL that turns
 * it into a real one. Nobody is marked verified by this call: MDCN checks and
 * indemnity stay Mezo's job and the doctor's.
 */
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

export type MezoProvisionStatus = "PROVISIONED" | "EXISTING" | "FAILED";

export interface MezoProvisionInput {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  primarySpecialty: string;
  subSpecialty?: string | null;
  state?: string | null;
  isDiaspora?: boolean;
  mdcnFolioNumber?: string | null;
}

export interface MezoProvisionResult {
  status: MezoProvisionStatus;
  claimUrl?: string;
  reason?: string;
}

interface MezoApiResult {
  externalId: string;
  status: "created" | "existing" | "skipped";
  claimUrl?: string;
  reason?: string;
}

/** How long we wait on Mezo before giving the member their page back. */
const TIMEOUT_MS = 8000;

/**
 * The specialty safe to publish for someone.
 *
 * Mezo builds a public profile slug out of what we send here, so an
 * unconfirmed register value becomes dr/<name>-cardiology-nigeria on the open
 * web. Two doctors have already written in to say the register had them under
 * the wrong specialty, so an import nobody has checked is not good enough to
 * put a colleague's name next to. Until they confirm it themselves, send the
 * cadre and let Mezo's own onboarding ask them.
 */
export function publishableSpecialty(p: {
  subSpecialty: string | null;
  cadre: string;
  specialtyConfirmedAt: Date | null;
}): string {
  if (p.subSpecialty && p.specialtyConfirmedAt) return p.subSpecialty;
  return p.cadre === "DENTISTRY" ? "Dentistry" : "Medicine";
}

export function isMezoConfigured(): boolean {
  return Boolean(process.env.MEZO_PARTNER_SECRET && process.env.MEZO_BASE_URL);
}

/**
 * Ask Mezo to open a place for one member.
 *
 * Never throws. A failure here must not cost us the survey answers, which are
 * the thing we cannot recreate, so every error path returns FAILED with a
 * reason to store rather than propagating.
 */
export async function provisionMezoDoctor(
  input: MezoProvisionInput,
): Promise<MezoProvisionResult> {
  const secret = process.env.MEZO_PARTNER_SECRET;
  const baseUrl = process.env.MEZO_BASE_URL;

  if (!secret || !baseUrl) {
    return { status: "FAILED", reason: "Mezo handoff is not configured" };
  }

  // Signed over the exact string we send. Serialising once and reusing the
  // string is the whole point: re-serialising for the request would risk
  // different bytes and a signature that cannot verify.
  const body = JSON.stringify({ professionals: [toPayload(input)] });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/partners/cadrehealth/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cfa-signature": signature },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { status: "FAILED", reason: `Mezo returned ${res.status}: ${text.slice(0, 300)}` };
    }

    const data = (await res.json()) as { results?: MezoApiResult[] };
    const result = data.results?.find((r) => r.externalId === input.externalId);

    if (!result) {
      return { status: "FAILED", reason: "Mezo did not answer for this member" };
    }
    if (result.status === "skipped") {
      return { status: "FAILED", reason: result.reason ?? "Mezo declined this member" };
    }
    if (!result.claimUrl) {
      return { status: "FAILED", reason: "Mezo returned no claim link" };
    }

    return {
      status: result.status === "existing" ? "EXISTING" : "PROVISIONED",
      claimUrl: result.claimUrl,
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "Mezo did not respond in time"
        : err instanceof Error
          ? err.message
          : "Unknown error reaching Mezo";
    return { status: "FAILED", reason };
  } finally {
    clearTimeout(timer);
  }
}

function toPayload(input: MezoProvisionInput) {
  return {
    externalId: input.externalId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone || undefined,
    primarySpecialty: input.primarySpecialty,
    subSpecialty: input.subSpecialty || undefined,
    state: input.state || undefined,
    isDiaspora: input.isDiaspora ?? false,
    mdcnFolioNumber: input.mdcnFolioNumber || undefined,
  };
}

// ---------------------------------------------------------------------------
// Batch provisioning.
//
// The one-at-a-time call above is right for the survey, where a member is
// waiting on the page. Seeding the register is the other shape: hundreds of
// rows, nobody waiting, and Mezo's endpoint already takes up to 200 at a time.
//
// /api/cron/mezo-backfill goes through here. scripts/mezo-backfill-registered
// predates it and still carries its own copy of the batching, the signing and
// the payload mapping; it should be moved onto these before it is next edited,
// or the two will drift on what gets sent to Mezo.
// ---------------------------------------------------------------------------

/** Mezo's endpoint caps a request at 200. Stay under it with room to spare. */
export const MEZO_BATCH_SIZE = 100;

/** Mezo opens an account per row inside one transaction, so give it room. */
const BATCH_TIMEOUT_MS = 120_000;

export interface MezoBatchResult {
  externalId: string;
  status: "created" | "existing" | "skipped";
  claimUrl?: string;
  reason?: string;
}

/**
 * The register import put titles in the first name field, so "Dr Francis" is a
 * common value. Mezo matches against MDCN, which holds the name and not the
 * honorific.
 */
export function cleanFirstName(firstName: string): string {
  return firstName.replace(/^\s*(dr|prof|professor|mr|mrs|ms|miss)\.?\s+/i, "").trim() || firstName;
}

/** The columns a backfill needs. Exported so the cohort query cannot drift.
 *  `satisfies` rather than `as const`: it checks the shape against Prisma's
 *  select type while keeping the literal, which is what lets findMany infer
 *  the narrowed row instead of handing back the whole model. */
export const MEZO_COHORT_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  cadre: true,
  subSpecialty: true,
  state: true,
  isDiaspora: true,
  specialtyConfirmedAt: true,
  credentials: {
    where: { regulatoryBody: "MDCN" },
    select: { licenseNumber: true },
    take: 1,
  },
} satisfies Prisma.CadreProfessionalSelect;

export type MezoCohortRow = Prisma.CadreProfessionalGetPayload<{
  select: typeof MEZO_COHORT_SELECT;
}>;

/** One cohort row to the payload Mezo expects. */
export function toMezoPayload(
  p: MezoCohortRow,
  surname: (s: string) => string | null,
) {
  return {
    externalId: p.id,
    email: p.email,
    firstName: cleanFirstName(p.firstName),
    lastName: surname(p.lastName) ?? p.lastName,
    phone: p.phone,
    primarySpecialty: publishableSpecialty(p),
    subSpecialty: p.specialtyConfirmedAt ? p.subSpecialty : null,
    state: p.state,
    isDiaspora: p.isDiaspora,
    mdcnFolioNumber: p.credentials[0]?.licenseNumber ?? null,
  };
}

/**
 * Send one batch to Mezo. Throws on transport or a non-2xx, because the caller
 * decides whether a failed batch is fatal or simply re-run: the endpoint is
 * idempotent on email, so retrying costs nothing and loses nothing.
 */
export async function provisionMezoBatch(batch: unknown[]): Promise<MezoBatchResult[]> {
  const secret = process.env.MEZO_PARTNER_SECRET;
  const baseUrl = process.env.MEZO_BASE_URL;
  if (!secret || !baseUrl) throw new Error("Mezo handoff is not configured");

  // Signed over the exact string sent. Serialise once and send that same
  // string: re-serialising would change the bytes and the signature would not
  // verify on the far side.
  const body = JSON.stringify({ professionals: batch });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/partners/cadrehealth/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cfa-signature": signature },
    body,
    signal: AbortSignal.timeout(BATCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Mezo returned ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: MezoBatchResult[] };
  return data.results ?? [];
}
