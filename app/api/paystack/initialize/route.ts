import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/**
 * POST /api/paystack/initialize
 * Create a Paystack payment link for an invoice.
 * Director+ or the engagement manager of the engagement can initialize.
 */

const ALLOWED_STATUSES = ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"];
const ELEVATED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { invoiceId } = body as { invoiceId?: string };

  if (!invoiceId) {
    return Response.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      engagement: {
        select: { engagementManagerId: true },
      },
    },
  });

  if (!invoice) {
    return Response.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Authorization: Director+ or EM of the engagement
  const isElevated = ELEVATED_ROLES.includes(session.user.role);
  const isEM =
    session.user.role === "ENGAGEMENT_MANAGER" &&
    invoice.engagement?.engagementManagerId === session.user.id;

  if (!isElevated && !isEM) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!ALLOWED_STATUSES.includes(invoice.status)) {
    return Response.json(
      {
        error: `Invoice status "${invoice.status}" is not eligible for payment. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json(
      { error: "Payment processing is not configured" },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL;
  if (!baseUrl) {
    return Response.json(
      { error: "Application base URL not configured" },
      { status: 503 }
    );
  }

  const reference = `cfa-pay-${randomUUID()}`;
  const amountInKobo = Number(invoice.balanceDue) * 100;

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: invoice.client.email,
        amount: Math.round(amountInKobo),
        currency: invoice.currency,
        reference,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.client.id,
        },
        callback_url: `${baseUrl}/api/paystack/callback`,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      console.error("[paystack/initialize] Paystack error:", data);
      return Response.json(
        { error: data.message ?? "Failed to initialize payment" },
        { status: 502 }
      );
    }

    return Response.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("[paystack/initialize] Error:", err);
    return Response.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
