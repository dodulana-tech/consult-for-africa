import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { isCommsElevated } from "@/lib/communications";
import type { CommunicationType } from "@prisma/client";

const VALID_TYPES: CommunicationType[] = [
  "EMAIL", "PHONE_CALL", "VIDEO_CALL", "IN_PERSON_MEETING",
  "WHATSAPP", "SMS", "LINKEDIN_MESSAGE", "NOTE", "OTHER",
];

/**
 * GET /api/communications/templates
 * Optional filter: ?category=CONSULTANT_OUTREACH or ?type=EMAIL or ?activeOnly=true
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || undefined;
  const type = searchParams.get("type") as CommunicationType | null;
  const activeOnly = searchParams.get("activeOnly") === "true";

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (type) where.type = type;
  if (activeOnly) where.isActive = true;

  const templates = await prisma.communicationTemplate.findMany({
    where,
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return Response.json({
    items: templates.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
});

/**
 * POST /api/communications/templates
 * Create a new template.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name: string = (body.name ?? "").toString().trim();
  const subject: string = (body.subject ?? "").toString().trim();
  const bodyText: string = (body.body ?? "").toString();
  const type: CommunicationType = body.type ?? "EMAIL";
  const category: string | null = body.category?.trim() || null;
  const description: string | null = body.description?.trim() || null;

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!bodyText.trim()) return Response.json({ error: "Body is required" }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return Response.json({ error: "Invalid type" }, { status: 400 });

  // Extract variables {{xxx}} from subject and body
  const variableSet = new Set<string>();
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  let match;
  while ((match = re.exec(subject)) !== null) variableSet.add(match[1]);
  while ((match = re.exec(bodyText)) !== null) variableSet.add(match[1]);

  try {
    const template = await prisma.communicationTemplate.create({
      data: {
        name,
        description,
        category,
        type,
        subject: subject || null,
        body: bodyText,
        variables: Array.from(variableSet),
        createdById: session.user.id,
        isActive: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entityType: "CommunicationTemplate",
      entityId: template.id,
      entityName: template.name,
      details: { category, type },
    });

    return Response.json(template, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return Response.json({ error: "A template with this name already exists" }, { status: 409 });
    }
    throw err;
  }
});
