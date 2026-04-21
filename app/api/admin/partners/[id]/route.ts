import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const partner = await prisma.partnerFirm.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      staffingRequests: {
        include: {
          deployments: {
            include: {
              request: { select: { projectName: true } },
            },
          },
          _count: { select: { deployments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!partner) return new Response("Not found", { status: 404 });

  return Response.json({
    partner: {
      ...partner,
      defaultMarkupPct: partner.defaultMarkupPct
        ? Number(partner.defaultMarkupPct)
        : null,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      contacts: partner.contacts.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
        passwordHash: undefined,
        resetToken: undefined,
        resetTokenExpiry: undefined,
      })),
      staffingRequests: partner.staffingRequests.map((r) => ({
        ...r,
        clientBudgetPerDay: r.clientBudgetPerDay
          ? Number(r.clientBudgetPerDay)
          : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        submittedAt: r.submittedAt?.toISOString() ?? null,
        matchedAt: r.matchedAt?.toISOString() ?? null,
        confirmedAt: r.confirmedAt?.toISOString() ?? null,
        startDate: r.startDate?.toISOString() ?? null,
        deployments: r.deployments.map((d) => ({
          ...d,
          ratePerDay: Number(d.ratePerDay),
          billingRatePerDay: Number(d.billingRatePerDay),
          proposedAt: d.proposedAt.toISOString(),
          acceptedAt: d.acceptedAt?.toISOString() ?? null,
          completedAt: d.completedAt?.toISOString() ?? null,
          startDate: d.startDate?.toISOString() ?? null,
          endDate: d.endDate?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      })),
      invoices: partner.invoices.map((i) => ({
        ...i,
        subtotal: Number(i.subtotal),
        tax: Number(i.tax),
        total: Number(i.total),
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        issuedDate: i.issuedDate?.toISOString() ?? null,
        dueDate: i.dueDate?.toISOString() ?? null,
        paidDate: i.paidDate?.toISOString() ?? null,
      })),
    },
  });
});

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.name?.trim()) updateData.name = body.name.trim();
  if (body.type?.trim()) updateData.type = body.type.trim();
  if (body.website !== undefined) updateData.website = body.website?.trim() || null;
  if (body.country?.trim()) updateData.country = body.country.trim();
  if (body.city !== undefined) updateData.city = body.city?.trim() || null;
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.defaultMarkupPct !== undefined)
    updateData.defaultMarkupPct = body.defaultMarkupPct;
  if (body.paymentTerms !== undefined)
    updateData.paymentTerms = parseInt(body.paymentTerms, 10);
  if (body.currency?.trim()) updateData.currency = body.currency.trim();
  if (body.status?.trim()) updateData.status = body.status.trim();

  if (Object.keys(updateData).length === 0) {
    return new Response("No fields to update", { status: 400 });
  }

  const partner = await prisma.partnerFirm.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PartnerFirm",
    entityId: partner.id,
    entityName: partner.name,
    details: { fields: Object.keys(updateData) },
  });

  return Response.json({
    ok: true,
    partner: {
      ...partner,
      defaultMarkupPct: partner.defaultMarkupPct
        ? Number(partner.defaultMarkupPct)
        : null,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
    },
  });
});
