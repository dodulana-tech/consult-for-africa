import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  if (!isElevated && !isEM) return new Response("Forbidden", { status: 403 });

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;

  // EMs can only see invoices for their projects
  if (isEM) {
    where.project = { engagementManagerId: session.user.id };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(
    invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      total: Number(inv.total),
      issuedDate: inv.issuedDate?.toISOString() ?? null,
      dueDate: inv.dueDate?.toISOString() ?? null,
      paidDate: inv.paidDate?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const { clientId, projectId, lineItems, taxPercent, dueInDays, currency, notes } = await req.json();

  if (!clientId || !lineItems?.length) {
    return new Response("clientId and lineItems required", { status: 400 });
  }

  // Validate line items with positive amounts
  for (const item of lineItems) {
    if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
      return new Response("Each line item needs description, quantity, unitPrice", { status: 400 });
    }
    if (item.quantity <= 0) {
      return new Response("Quantity must be greater than zero", { status: 400 });
    }
    if (item.unitPrice < 0) {
      return new Response("Unit price cannot be negative", { status: 400 });
    }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return new Response("Client not found", { status: 404 });

  const subtotal = lineItems.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = typeof taxPercent === "number" && taxPercent >= 0 ? taxPercent / 100 : 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + tax;

  // Atomic invoice number generation using findMany count + retry
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  let invoiceNumber: string;
  let attempts = 0;
  while (true) {
    const count = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    invoiceNumber = `${prefix}-${String(count + 1).padStart(4, "0")}`;

    // Check if this number already exists (race condition guard)
    const exists = await prisma.invoice.findFirst({
      where: { invoiceNumber },
      select: { id: true },
    });
    if (!exists) break;

    attempts++;
    if (attempts > 10) {
      return new Response("Failed to generate unique invoice number. Try again.", { status: 500 });
    }
  }

  const issuedDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (typeof dueInDays === "number" ? dueInDays : 30));

  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      projectId: projectId ?? null,
      invoiceNumber,
      subtotal,
      tax,
      total,
      currency: currency ?? "NGN",
      status: "DRAFT",
      issuedDate,
      dueDate,
      lineItems: lineItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      })),
    },
  });

  return Response.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    issuedDate: invoice.issuedDate?.toISOString() ?? null,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  });
}
