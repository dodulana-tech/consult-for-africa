import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/paystack/callback
 * Redirect endpoint after Paystack payment. Verifies transaction and redirects
 * user to the appropriate invoice page.
 */

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  const trxref = req.nextUrl.searchParams.get("trxref");
  const ref = reference ?? trxref;

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL ?? "";

  if (!ref) {
    return NextResponse.redirect(`${baseUrl}/billing?error=missing_reference`);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.redirect(`${baseUrl}/billing?error=config_error`);
  }

  try {
    // Verify transaction with Paystack
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      console.error("[paystack/callback] Verification failed:", data);
      return NextResponse.redirect(
        `${baseUrl}/billing?error=payment_failed&reference=${encodeURIComponent(ref)}`
      );
    }

    // Extract invoice info from metadata
    const invoiceId = data.data.metadata?.invoiceId;

    if (invoiceId) {
      return NextResponse.redirect(
        `${baseUrl}/billing/invoices/${invoiceId}?payment=success`
      );
    }

    return NextResponse.redirect(`${baseUrl}/billing?payment=success`);
  } catch (err) {
    console.error("[paystack/callback] Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/billing?error=verification_failed&reference=${encodeURIComponent(ref)}`
    );
  }
}
