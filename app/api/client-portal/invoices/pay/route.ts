import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/client-portal/invoices/pay
 * Initialize Paystack payment for a client invoice.
 * Body: { invoiceId: string }
 */
export const POST = handler(async function POST(req: Request) {
  const session = await getClientPortalSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await req.json();
  if (!invoiceId) {
    return Response.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      clientId: true,
      invoiceNumber: true,
      balanceDue: true,
      currency: true,
      status: true,
    },
  });

  if (!invoice) {
    return Response.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.clientId !== session.clientId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow payment for payable statuses
  const payableStatuses = ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"];
  if (!payableStatuses.includes(invoice.status)) {
    return Response.json({ error: "This invoice is not available for payment" }, { status: 400 });
  }

  const balanceDue = Number(invoice.balanceDue);
  if (balanceDue <= 0) {
    return Response.json({ error: "No balance due on this invoice" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Payment gateway not configured" }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://consultforafrica.com";
  const callbackUrl = `${baseUrl}/client/invoices/pay-success?invoice=${invoice.id}`;

  // Paystack expects amount in kobo (NGN) or cents (USD)
  const amountInMinorUnit = Math.round(balanceDue * 100);

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.email,
        amount: amountInMinorUnit,
        currency: invoice.currency,
        reference: `C4A-${invoice.invoiceNumber}-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientId: session.clientId,
          contactId: session.sub,
          custom_fields: [
            {
              display_name: "Invoice Number",
              variable_name: "invoice_number",
              value: invoice.invoiceNumber,
            },
          ],
        },
      }),
    });

    const data = await res.json();

    if (data.status && data.data?.authorization_url) {
      return Response.json({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        access_code: data.data.access_code,
      });
    }

    console.error("[client-portal/invoices/pay] Paystack error:", data);
    return Response.json({ error: "Failed to initialize payment" }, { status: 500 });
  } catch (err) {
    console.error("[client-portal/invoices/pay] fetch failed:", err);
    return Response.json({ error: "Payment initialization failed" }, { status: 500 });
  }
});
