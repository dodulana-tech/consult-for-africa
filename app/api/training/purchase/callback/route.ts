import { NextRequest, NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/training/purchase/callback
 * Paystack redirects here after payment. We redirect to the academy page.
 * Actual enrollment happens via the webhook (idempotent).
 */
export const GET = handler(async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL ?? "";

  if (!reference) {
    return NextResponse.redirect(`${baseUrl}/academy?payment=error`);
  }

  // Redirect to academy with success indicator
  // The webhook handles the actual enrollment confirmation
  return NextResponse.redirect(`${baseUrl}/academy?payment=success&ref=${reference}`);
});
