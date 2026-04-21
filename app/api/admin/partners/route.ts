import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const partners = await prisma.partnerFirm.findMany({
    include: {
      _count: {
        select: {
          contacts: true,
          staffingRequests: true,
        },
      },
      staffingRequests: {
        where: {
          status: { in: ["SUBMITTED", "MATCHING", "SHORTLIST_SENT", "CONFIRMED", "ACTIVE"] },
        },
        select: {
          id: true,
          deployments: {
            where: { status: { in: ["ACCEPTED", "ACTIVE"] } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = partners.map((p) => {
    const activeRequests = p.staffingRequests.length;
    const activeDeployments = p.staffingRequests.reduce(
      (sum, r) => sum + r.deployments.length,
      0
    );
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.status,
      country: p.country,
      city: p.city,
      currency: p.currency,
      paymentTerms: p.paymentTerms,
      defaultMarkupPct: p.defaultMarkupPct ? Number(p.defaultMarkupPct) : null,
      contactsCount: p._count.contacts,
      activeRequests,
      activeDeployments,
      createdAt: p.createdAt.toISOString(),
    };
  });

  return Response.json({ partners: result });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const {
    name,
    type,
    website,
    country,
    city,
    notes,
    defaultMarkupPct,
    paymentTerms,
    currency,
    primaryContactName,
    primaryContactEmail,
  } = body;

  if (!name?.trim() || !type?.trim()) {
    return new Response("name and type are required", { status: 400 });
  }

  const partner = await prisma.partnerFirm.create({
    data: {
      name: name.trim(),
      type: type.trim(),
      website: website?.trim() || null,
      country: country?.trim() || "Nigeria",
      city: city?.trim() || null,
      notes: notes?.trim() || null,
      defaultMarkupPct: defaultMarkupPct != null ? defaultMarkupPct : null,
      paymentTerms: paymentTerms ? parseInt(paymentTerms, 10) : 30,
      currency: currency?.trim() || "NGN",
      ...(primaryContactName?.trim() && primaryContactEmail?.trim()
        ? {
            contacts: {
              create: {
                name: primaryContactName.trim(),
                email: primaryContactEmail.trim(),
                isPrimary: true,
              },
            },
          }
        : {}),
    },
    include: { contacts: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PartnerFirm",
    entityId: partner.id,
    entityName: partner.name,
    details: { type: partner.type },
  });

  return Response.json(
    {
      ok: true,
      partner: {
        ...partner,
        defaultMarkupPct: partner.defaultMarkupPct
          ? Number(partner.defaultMarkupPct)
          : null,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  );
});
