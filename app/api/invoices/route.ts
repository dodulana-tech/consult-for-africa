import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const { clientId, projectId, lineItems, taxPercent, dueInDays, currency, notes } = await req.json();

  if (!clientId || !lineItems?.length) {
    return new Response("clientId and lineItems required", { status: 400 });
  }

  // Validate line items
  for (const item of lineItems) {
    if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
      return new Response("Each line item needs description, quantity, unitPrice", { status: 400 });
    }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return new Response("Client not found", { status: 404 });

  const subtotal = lineItems.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = typeof taxPercent === "number" ? taxPercent / 100 : 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + tax;

  // Generate invoice number: INV-YYYYMM-XXXX
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  const invoiceNumber = `${prefix}-${String(count + 1).padStart(4, "0")}`;

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
