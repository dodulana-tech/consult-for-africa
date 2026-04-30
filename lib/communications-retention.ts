import type { CommunicationSubjectType, CommunicationLawfulBasis } from "@prisma/client";

/**
 * NDPR / GDPR retention policy per subject type.
 *
 * NDPR (Nigeria) requires "no longer than necessary." We default to:
 * - 7 years for active engagement records (Nigerian tax/contract minimum)
 * - 2 years for prospect / cold outreach records (no engagement history)
 * - 5 years for talent applications (covers re-engagement window)
 * - 7 years for client comms (commercial contract retention)
 *
 * After expiry, the redaction worker nullifies body/subject/attachments
 * but preserves the audit shell (timestamps, status, role, hashed ID)
 * so we can prove compliance.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const RETENTION_DAYS: Record<CommunicationSubjectType, number> = {
  CONSULTANT: 7 * 365,
  CLIENT: 7 * 365,
  CLIENT_CONTACT: 7 * 365,
  TALENT_APPLICATION: 5 * 365,
  CADRE_PROFESSIONAL: 5 * 365,
  PARTNER_FIRM: 7 * 365,
  SALES_AGENT: 5 * 365,
  DISCOVERY_CALL: 3 * 365,
  MAAROVA_USER: 5 * 365,
  PROSPECT: 2 * 365,
};

/**
 * Compute when this comm's body/subject should be redacted under our
 * retention policy.
 */
export function computeRetentionExpiry(
  subjectType: CommunicationSubjectType,
  occurredAt: Date = new Date(),
): Date {
  const days = RETENTION_DAYS[subjectType];
  return new Date(occurredAt.getTime() + days * ONE_DAY_MS);
}

/**
 * Default lawful basis depending on context.
 * - LEGITIMATE_INTEREST is the standard outreach basis (with opt-out)
 * - CONTRACT applies for active consultants/clients we have agreements with
 *
 * Callers can override; this just provides a sensible default.
 */
export function defaultLawfulBasis(subjectType: CommunicationSubjectType): CommunicationLawfulBasis {
  switch (subjectType) {
    case "CONSULTANT":
    case "CLIENT":
    case "CLIENT_CONTACT":
    case "PARTNER_FIRM":
    case "SALES_AGENT":
      return "CONTRACT";
    case "TALENT_APPLICATION":
    case "CADRE_PROFESSIONAL":
    case "MAAROVA_USER":
      return "CONSENT";
    case "DISCOVERY_CALL":
    case "PROSPECT":
      return "LEGITIMATE_INTEREST";
  }
}
