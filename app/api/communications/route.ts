import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import {
  isCommsElevated,
  subjectFilterToWhere,
  validateSubject,
  type CommSubjectFilter,
} from "@/lib/communications";
import { computeRetentionExpiry, defaultLawfulBasis } from "@/lib/communications-retention";
import type {
  CommunicationSubjectType,
  CommunicationType,
  CommunicationDirection,
  CommunicationStatus,
  CommunicationSentiment,
  CommunicationVisibility,
} from "@prisma/client";

const VALID_TYPES: CommunicationType[] = [
  "EMAIL", "PHONE_CALL", "VIDEO_CALL", "IN_PERSON_MEETING",
  "WHATSAPP", "SMS", "LINKEDIN_MESSAGE", "NOTE", "OTHER",
];
const VALID_DIRECTIONS: CommunicationDirection[] = ["OUTBOUND", "INBOUND", "INTERNAL"];
const VALID_SUBJECT_TYPES: CommunicationSubjectType[] = [
  "CONSULTANT", "CLIENT", "CLIENT_CONTACT", "TALENT_APPLICATION",
  "CADRE_PROFESSIONAL", "PARTNER_FIRM", "SALES_AGENT",
  "DISCOVERY_CALL", "MAAROVA_USER", "PROSPECT",
];

/**
 * GET /api/communications
 * Query params: any subject filter (consultantId, clientId, etc.)
 *               + optional type, direction, status, search, page, pageSize
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filter: CommSubjectFilter = {
    subjectType: (searchParams.get("subjectType") as CommunicationSubjectType) || undefined,
    consultantId: searchParams.get("consultantId") || undefined,
    clientId: searchParams.get("clientId") || undefined,
    clientContactId: searchParams.get("clientContactId") || undefined,
    applicationId: searchParams.get("applicationId") || undefined,
    cadreProfessionalId: searchParams.get("cadreProfessionalId") || undefined,
    partnerFirmId: searchParams.get("partnerFirmId") || undefined,
    salesAgentId: searchParams.get("salesAgentId") || undefined,
    discoveryCallId: searchParams.get("discoveryCallId") || undefined,
    maarovaUserId: searchParams.get("maarovaUserId") || undefined,
  };

  const type = searchParams.get("type") as CommunicationType | null;
  const direction = searchParams.get("direction") as CommunicationDirection | null;
  const status = searchParams.get("status") as CommunicationStatus | null;
  const search = searchParams.get("q")?.trim() || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50") || 50));

  const where = subjectFilterToWhere(filter);
  if (type) where.type = type;
  if (direction) where.direction = direction;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { outcome: { contains: search, mode: "insensitive" } },
    ];
  }
  // Default: show non-archived
  if (searchParams.get("includeArchived") !== "true") {
    where.isArchived = false;
  }

  const [items, total] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        loggedBy: { select: { id: true, name: true } },
        nextActionAssignedTo: { select: { id: true, name: true } },
        _count: { select: { replies: true, events: true } },
      },
    }),
    prisma.communication.count({ where }),
  ]);

  return Response.json({
    items: items.map((c) => ({
      ...c,
      occurredAt: c.occurredAt.toISOString(),
      scheduledFor: c.scheduledFor?.toISOString() ?? null,
      sentAt: c.sentAt?.toISOString() ?? null,
      deliveredAt: c.deliveredAt?.toISOString() ?? null,
      openedAt: c.openedAt?.toISOString() ?? null,
      clickedAt: c.clickedAt?.toISOString() ?? null,
      repliedAt: c.repliedAt?.toISOString() ?? null,
      nextActionDate: c.nextActionDate?.toISOString() ?? null,
      retentionExpiresAt: c.retentionExpiresAt?.toISOString() ?? null,
      redactedAt: c.redactedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

/**
 * POST /api/communications
 * Log a new communication record.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!VALID_SUBJECT_TYPES.includes(body.subjectType)) {
    return Response.json({ error: "Invalid subjectType" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(body.type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!VALID_DIRECTIONS.includes(body.direction)) {
    return Response.json({ error: "Invalid direction" }, { status: 400 });
  }

  const subjectError = validateSubject(body);
  if (subjectError) {
    return Response.json({ error: subjectError }, { status: 400 });
  }

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
  const nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;

  const created = await prisma.communication.create({
    data: {
      subjectType: body.subjectType,
      consultantId: body.consultantId || null,
      clientId: body.clientId || null,
      clientContactId: body.clientContactId || null,
      applicationId: body.applicationId || null,
      cadreProfessionalId: body.cadreProfessionalId || null,
      partnerFirmId: body.partnerFirmId || null,
      salesAgentId: body.salesAgentId || null,
      discoveryCallId: body.discoveryCallId || null,
      maarovaUserId: body.maarovaUserId || null,
      prospectName: body.prospectName || null,
      prospectEmail: body.prospectEmail || null,
      prospectPhone: body.prospectPhone || null,
      type: body.type,
      direction: body.direction,
      status: body.status || "LOGGED",
      subject: body.subject || null,
      body: body.body || null,
      bodyHtml: body.bodyHtml || null,
      attachmentUrls: Array.isArray(body.attachmentUrls) ? body.attachmentUrls : [],
      occurredAt,
      durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : null,
      fromEmail: body.fromEmail || null,
      toEmails: Array.isArray(body.toEmails) ? body.toEmails : [],
      ccEmails: Array.isArray(body.ccEmails) ? body.ccEmails : [],
      meetingLink: body.meetingLink || null,
      meetingLocation: body.meetingLocation || null,
      phoneNumber: body.phoneNumber || null,
      outcome: body.outcome || null,
      sentiment: (body.sentiment as CommunicationSentiment) || null,
      nextAction: body.nextAction || null,
      nextActionDate,
      nextActionAssignedToId: body.nextActionAssignedToId || null,
      threadId: body.threadId || null,
      replyToId: body.replyToId || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      visibility: (body.visibility as CommunicationVisibility) || "TEAM",
      lawfulBasis: defaultLawfulBasis(body.subjectType),
      retentionExpiresAt: computeRetentionExpiry(body.subjectType, occurredAt),
      loggedById: session.user.id,
      events: {
        create: {
          type: "CREATED",
          actorUserId: session.user.id,
          provider: "MANUAL",
          notes: "Communication logged manually",
        },
      },
    },
    include: {
      loggedBy: { select: { id: true, name: true } },
      nextActionAssignedTo: { select: { id: true, name: true } },
    },
  });

  // If this is a reply, bump the parent's status to REPLIED
  if (body.replyToId && body.direction === "INBOUND") {
    await prisma.communication.updateMany({
      where: { id: body.replyToId, status: { not: "REPLIED" } },
      data: { status: "REPLIED", repliedAt: created.occurredAt },
    });
    await prisma.communicationEvent.create({
      data: {
        communicationId: body.replyToId,
        type: "REPLIED",
        toStatus: "REPLIED",
        actorUserId: session.user.id,
        provider: "MANUAL",
        notes: `Reply logged: ${created.id}`,
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Communication",
    entityId: created.id,
    entityName: created.subject ?? `${created.type} ${created.direction}`,
    details: { subjectType: created.subjectType, type: created.type, replyTo: body.replyToId ?? null },
  });

  return Response.json(created, { status: 201 });
});
