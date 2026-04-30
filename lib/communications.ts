import { prisma } from "@/lib/prisma";
import type {
  CommunicationSubjectType,
  CommunicationType,
  CommunicationDirection,
  CommunicationStatus,
  Communication,
  Prisma,
} from "@prisma/client";

/**
 * Allowed roles to read/write communications.
 * Communications are internal-team data, not exposed to consultants/applicants.
 */
export const COMMS_ELEVATED_ROLES = [
  "ENGAGEMENT_MANAGER",
  "DIRECTOR",
  "PARTNER",
  "ADMIN",
] as const;

export function isCommsElevated(role: string | undefined): boolean {
  return COMMS_ELEVATED_ROLES.includes(role as typeof COMMS_ELEVATED_ROLES[number]);
}

/**
 * Build a Prisma where clause for filtering communications by subject.
 * Pass exactly one of the subjectId fields.
 */
export interface CommSubjectFilter {
  subjectType?: CommunicationSubjectType;
  consultantId?: string;
  clientId?: string;
  clientContactId?: string;
  applicationId?: string;
  cadreProfessionalId?: string;
  partnerFirmId?: string;
  salesAgentId?: string;
  discoveryCallId?: string;
  maarovaUserId?: string;
}

export function subjectFilterToWhere(filter: CommSubjectFilter): Prisma.CommunicationWhereInput {
  const where: Prisma.CommunicationWhereInput = {};
  if (filter.subjectType) where.subjectType = filter.subjectType;
  if (filter.consultantId) where.consultantId = filter.consultantId;
  if (filter.clientId) where.clientId = filter.clientId;
  if (filter.clientContactId) where.clientContactId = filter.clientContactId;
  if (filter.applicationId) where.applicationId = filter.applicationId;
  if (filter.cadreProfessionalId) where.cadreProfessionalId = filter.cadreProfessionalId;
  if (filter.partnerFirmId) where.partnerFirmId = filter.partnerFirmId;
  if (filter.salesAgentId) where.salesAgentId = filter.salesAgentId;
  if (filter.discoveryCallId) where.discoveryCallId = filter.discoveryCallId;
  if (filter.maarovaUserId) where.maarovaUserId = filter.maarovaUserId;
  return where;
}

/**
 * Compute summary stats for a contact's communication timeline.
 */
export async function getCommSummary(filter: CommSubjectFilter) {
  const where = subjectFilterToWhere(filter);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [total, last90Days, lastComm, outboundCount, replied, openNextActions] = await Promise.all([
    prisma.communication.count({ where: { ...where, isArchived: false } }),
    prisma.communication.count({
      where: { ...where, isArchived: false, occurredAt: { gte: ninetyDaysAgo } },
    }),
    prisma.communication.findFirst({
      where: { ...where, isArchived: false, direction: { not: "INTERNAL" } },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true, type: true, direction: true, loggedBy: { select: { name: true } } },
    }),
    prisma.communication.count({ where: { ...where, isArchived: false, direction: "OUTBOUND" } }),
    prisma.communication.count({
      where: { ...where, isArchived: false, status: "REPLIED" },
    }),
    prisma.communication.count({
      where: { ...where, isArchived: false, nextActionDate: { not: null }, status: { notIn: ["CANCELLED", "FAILED"] } },
    }),
  ]);

  const responseRate = outboundCount > 0 ? Math.round((replied / outboundCount) * 100) : null;

  return {
    total,
    last90Days,
    lastContactedAt: lastComm?.occurredAt?.toISOString() ?? null,
    lastContactedBy: lastComm?.loggedBy?.name ?? null,
    lastContactType: lastComm?.type ?? null,
    lastContactDirection: lastComm?.direction ?? null,
    responseRate,
    openNextActions,
  };
}

export interface CreateCommInput {
  subjectType: CommunicationSubjectType;
  consultantId?: string | null;
  clientId?: string | null;
  clientContactId?: string | null;
  applicationId?: string | null;
  cadreProfessionalId?: string | null;
  partnerFirmId?: string | null;
  salesAgentId?: string | null;
  discoveryCallId?: string | null;
  maarovaUserId?: string | null;
  prospectName?: string | null;
  prospectEmail?: string | null;
  prospectPhone?: string | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  subject?: string | null;
  body?: string | null;
  bodyHtml?: string | null;
  attachmentUrls?: string[];
  occurredAt?: Date;
  durationMinutes?: number | null;
  fromEmail?: string | null;
  toEmails?: string[];
  ccEmails?: string[];
  meetingLink?: string | null;
  meetingLocation?: string | null;
  phoneNumber?: string | null;
  outcome?: string | null;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  nextAction?: string | null;
  nextActionDate?: Date | null;
  nextActionAssignedToId?: string | null;
  threadId?: string | null;
  replyToId?: string | null;
  tags?: string[];
  visibility?: "PRIVATE" | "TEAM" | "PUBLIC";
}

/**
 * Validate that the subjectType matches a non-null subject ID and that
 * the prospect path is only used for PROSPECT type.
 */
export function validateSubject(input: Partial<CreateCommInput>): string | null {
  const t = input.subjectType;
  if (!t) return "subjectType is required";

  const idMap: Record<CommunicationSubjectType, string | null | undefined> = {
    CONSULTANT: input.consultantId,
    CLIENT: input.clientId,
    CLIENT_CONTACT: input.clientContactId,
    TALENT_APPLICATION: input.applicationId,
    CADRE_PROFESSIONAL: input.cadreProfessionalId,
    PARTNER_FIRM: input.partnerFirmId,
    SALES_AGENT: input.salesAgentId,
    DISCOVERY_CALL: input.discoveryCallId,
    MAAROVA_USER: input.maarovaUserId,
    PROSPECT: input.prospectName || input.prospectEmail || input.prospectPhone || null,
  };

  if (!idMap[t]) {
    return `subjectType ${t} requires the matching subject ID (or prospect details for PROSPECT)`;
  }

  return null;
}
