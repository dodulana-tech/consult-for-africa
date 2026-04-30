import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { CommunicationSubjectType } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "Consult For Africa <hello@consultforafrica.com>";
const REPLY_DOMAIN = process.env.REPLY_DOMAIN ?? "consultforafrica.com";

/**
 * Generate a unique Message-ID for this outbound email.
 * Format: <commId.random@domain>. Used for reply tracking via In-Reply-To.
 */
export function buildMessageId(commId: string): string {
  const random = randomBytes(8).toString("hex");
  return `<${commId}.${random}@${REPLY_DOMAIN}>`;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  messageId?: string;
  inReplyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId: string | null;
  error?: string;
}

/**
 * Send a single email via Zoho SMTP, returning the assigned Message-ID
 * for reply tracking. Does NOT log to Communication table -- callers do that.
 */
export async function sendOutboundEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!process.env.SMTP_USER) {
    console.log(`[comm-send] SMTP not configured. Would send to ${params.to}`);
    return { ok: false, messageId: null, error: "SMTP not configured" };
  }

  const messageId = params.messageId ?? `<${randomBytes(12).toString("hex")}@${REPLY_DOMAIN}>`;

  const html = params.bodyHtml ?? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#1F2937;white-space:pre-wrap;">${escapeHtml(params.bodyText)}</div>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      text: params.bodyText,
      html,
      replyTo: params.replyTo,
      headers: {
        "Message-ID": messageId,
        ...(params.inReplyTo && { "In-Reply-To": params.inReplyTo, "References": params.inReplyTo }),
      },
    });
    return { ok: true, messageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[comm-send] send failed to ${params.to}:`, errMsg);
    return { ok: false, messageId, error: errMsg };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Substitute Handlebars-style {{variable}} placeholders.
 * Only top-level keys are supported (no helpers, no logic).
 */
export function renderTemplate(template: string, vars: Record<string, string | null | undefined>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value ?? "";
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIENCE RESOLVERS
// Each resolver returns a list of recipients with the IDs needed to log
// communications back to the right subjectType.
// ═══════════════════════════════════════════════════════════════════════════

export type AudienceCode =
  | "CONSULTANTS_ALL"
  | "CONSULTANTS_AVAILABLE"
  | "CONSULTANTS_ACTIVE_ONBOARDING"
  | "CADRE_VERIFIED"
  | "CADRE_ALL"
  | "CADRE_PENDING_REVIEW"
  | "CLIENT_CONTACTS_ACTIVE"
  | "TALENT_APPLICANTS_RECENT"
  | "PARTNERS_ACTIVE";

export interface AudienceMember {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  // Subject linkage (full enum so this type is also usable for 1-to-1 sends)
  subjectType: CommunicationSubjectType;
  consultantId?: string;
  clientId?: string;
  clientContactId?: string;
  applicationId?: string;
  cadreProfessionalId?: string;
  partnerFirmId?: string;
  salesAgentId?: string;
  discoveryCallId?: string;
  maarovaUserId?: string;
  vars: Record<string, string>; // for template substitution
}

export const AUDIENCE_LABELS: Record<AudienceCode, string> = {
  CONSULTANTS_ALL: "All consultants in the network",
  CONSULTANTS_AVAILABLE: "Consultants currently available",
  CONSULTANTS_ACTIVE_ONBOARDING: "Consultants in active onboarding",
  CADRE_VERIFIED: "CadreHealth: verified professionals",
  CADRE_ALL: "CadreHealth: all professionals",
  CADRE_PENDING_REVIEW: "CadreHealth: pending review",
  CLIENT_CONTACTS_ACTIVE: "Client contacts at active clients",
  TALENT_APPLICANTS_RECENT: "Talent applicants from last 30 days",
  PARTNERS_ACTIVE: "Active partner firm contacts",
};

export async function resolveAudience(code: AudienceCode): Promise<AudienceMember[]> {
  switch (code) {
    case "CONSULTANTS_ALL":
    case "CONSULTANTS_AVAILABLE":
    case "CONSULTANTS_ACTIVE_ONBOARDING": {
      const where: Record<string, unknown> = { role: "CONSULTANT" };
      if (code === "CONSULTANTS_AVAILABLE") {
        where.consultantProfile = { availabilityStatus: "AVAILABLE" };
      }
      if (code === "CONSULTANTS_ACTIVE_ONBOARDING") {
        where.onboarding = { status: "ACTIVE" };
      }
      const users = await prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true },
      });
      return users
        .filter((u) => !!u.email)
        .map((u) => {
          const [firstName, ...rest] = u.name.split(" ");
          return {
            email: u.email,
            firstName,
            lastName: rest.join(" "),
            fullName: u.name,
            subjectType: "CONSULTANT" as const,
            consultantId: u.id,
            vars: {
              firstName: firstName ?? "",
              lastName: rest.join(" "),
              fullName: u.name,
              email: u.email,
            },
          };
        });
    }

    case "CADRE_VERIFIED":
    case "CADRE_ALL":
    case "CADRE_PENDING_REVIEW": {
      const status =
        code === "CADRE_VERIFIED" ? "VERIFIED" :
        code === "CADRE_PENDING_REVIEW" ? "PENDING_REVIEW" : undefined;
      const pros = await prisma.cadreProfessional.findMany({
        where: status ? { accountStatus: status } : {},
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      return pros.map((p) => ({
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`,
        subjectType: "CADRE_PROFESSIONAL" as const,
        cadreProfessionalId: p.id,
        vars: {
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: `${p.firstName} ${p.lastName}`,
          email: p.email,
        },
      }));
    }

    case "CLIENT_CONTACTS_ACTIVE": {
      const contacts = await prisma.clientContact.findMany({
        where: { client: { status: "ACTIVE" } },
        select: { id: true, name: true, email: true, client: { select: { name: true } } },
      });
      return contacts.map((c) => {
        const [firstName, ...rest] = c.name.split(" ");
        return {
          email: c.email,
          firstName,
          lastName: rest.join(" "),
          fullName: c.name,
          subjectType: "CLIENT_CONTACT" as const,
          clientContactId: c.id,
          vars: {
            firstName: firstName ?? "",
            lastName: rest.join(" "),
            fullName: c.name,
            email: c.email,
            company: c.client.name,
          },
        };
      });
    }

    case "TALENT_APPLICANTS_RECENT": {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const apps = await prisma.talentApplication.findMany({
        where: { createdAt: { gt: cutoff } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      return apps.map((a) => ({
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        fullName: `${a.firstName} ${a.lastName}`,
        subjectType: "TALENT_APPLICATION" as const,
        applicationId: a.id,
        vars: {
          firstName: a.firstName,
          lastName: a.lastName,
          fullName: `${a.firstName} ${a.lastName}`,
          email: a.email,
        },
      }));
    }

    case "PARTNERS_ACTIVE": {
      const partners = await prisma.partnerContact.findMany({
        where: { partner: { status: "ACTIVE" } },
        select: {
          id: true, name: true, email: true,
          partner: { select: { id: true, name: true } },
        },
      });
      return partners.map((p) => {
        const [firstName, ...rest] = (p.name ?? "").split(" ");
        return {
          email: p.email,
          firstName,
          lastName: rest.join(" "),
          fullName: p.name ?? "",
          subjectType: "PARTNER_FIRM" as const,
          partnerFirmId: p.partner.id,
          vars: {
            firstName: firstName ?? "",
            lastName: rest.join(" "),
            fullName: p.name ?? "",
            email: p.email,
            company: p.partner.name,
          },
        };
      });
    }
  }
}

/**
 * Filter out recipients on the suppression list (opt-outs and bounces).
 */
export async function applySuppressionFilter(members: AudienceMember[]): Promise<AudienceMember[]> {
  if (members.length === 0) return [];
  const emails = [...new Set(members.map((m) => m.email.toLowerCase()))];
  const suppressed = await prisma.communicationSuppression.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const suppressedSet = new Set(suppressed.map((s) => s.email?.toLowerCase()));
  return members.filter((m) => !suppressedSet.has(m.email.toLowerCase()));
}
