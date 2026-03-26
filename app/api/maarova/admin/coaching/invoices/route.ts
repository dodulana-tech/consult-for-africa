import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const coachId = searchParams.get("coachId");
  const organisationId = searchParams.get("organisationId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (coachId) where.coachId = coachId;
  if (organisationId) where.organisationId = organisationId;

  const invoices = await prisma.maarovaCoachingInvoice.findMany({
    where,
    include: {
      coach: { select: { id: true, name: true, email: true } },
      organisation: { select: { id: true, name: true } },
      match: {
        select: {
          id: true,
          user: { select: { id: true, name: true } },
          programme: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      amount: Number(inv.amount),
      currency: inv.currency,
      description: inv.description,
      lineItems: inv.lineItems,
      notes: inv.notes,
      issuedAt: inv.issuedAt?.toISOString() ?? null,
      dueAt: inv.dueAt?.toISOString() ?? null,
      paidAt: inv.paidAt?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
      coach: inv.coach,
      organisation: inv.organisation,
      match: inv.match
        ? { id: inv.match.id, programme: inv.match.programme, user: inv.match.user }
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { coachId, amount, description, matchId, organisationId, lineItems, dueAt, notes } = body;

  if (!coachId?.trim()) return Response.json({ error: "coachId is required" }, { status: 400 });
  if (amount === undefined || amount === null) {
    return Response.json({ error: "amount is required" }, { status: 400 });
  }
  if (!description?.trim()) return Response.json({ error: "description is required" }, { status: 400 });

  // Verify coach exists
  const coach = await prisma.maarovaCoach.findUnique({
    where: { id: coachId },
    select: { id: true, currency: true },
  });
  if (!coach) return Response.json({ error: "Coach not found" }, { status: 404 });

  // Generate invoice number: INV-YYMMDD-XXXX with retry on collision
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  let invoice;
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const rand = randomBytes(2).toString("hex").toUpperCase();
    const invoiceNumber = `INV-${yy}${mm}${dd}-${rand}`;
    try {
      invoice = await prisma.maarovaCoachingInvoice.create({
        data: {
          invoiceNumber,
          coachId,
          amount: parseFloat(String(amount)),
          currency: coach.currency,
          description: description.trim(),
          matchId: matchId || null,
          organisationId: organisationId || null,
          lineItems: lineItems ?? null,
          dueAt: dueAt ? new Date(dueAt) : null,
          notes: notes?.trim() || null,
          status: "DRAFT",
        },
      });
      break;
    } catch (err: unknown) {
      const isUniqueViolation =
        err instanceof Error && "code" in err && (err as { code: string }).code === "P2002";
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
        throw err;
      }
    }
  }

  if (!invoice) {
    return Response.json({ error: "Failed to generate a unique invoice number. Please try again." }, { status: 500 });
  }

  return Response.json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      createdAt: invoice.createdAt.toISOString(),
    },
  });
}
