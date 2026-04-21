import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/paystack/resolve?account_number=XXX&bank_code=XXX
 * Resolve account number to account name via Paystack.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("account_number");
  const bankCode = searchParams.get("bank_code");

  if (!accountNumber || !bankCode) {
    return Response.json({ error: "account_number and bank_code are required" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Paystack not configured. Enter account name manually." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const data = await res.json();

    if (data.status && data.data?.account_name) {
      return Response.json({ accountName: data.data.account_name });
    }

    return Response.json({ error: data.message || "Could not resolve account" }, { status: 400 });
  } catch (err) {
    console.error("[paystack/resolve] failed", err);
    return Response.json({ error: "Failed to resolve account" }, { status: 500 });
  }
});
