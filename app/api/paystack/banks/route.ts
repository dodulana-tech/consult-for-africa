import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/paystack/banks
 * Fetch list of Nigerian banks from Paystack.
 * Cached for 24 hours to avoid hitting Paystack rate limits.
 */

let cachedBanks: { name: string; code: string }[] | null = null;
let cacheExpiry = 0;

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Return cache if valid
  if (cachedBanks && Date.now() < cacheExpiry) {
    return Response.json({ banks: cachedBanks });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    // Fallback: return common Nigerian banks if no key configured
    return Response.json({
      banks: [
        { name: "Access Bank", code: "044" },
        { name: "Citibank Nigeria", code: "023" },
        { name: "Ecobank Nigeria", code: "050" },
        { name: "Fidelity Bank", code: "070" },
        { name: "First Bank of Nigeria", code: "011" },
        { name: "First City Monument Bank", code: "214" },
        { name: "Globus Bank", code: "00103" },
        { name: "Guaranty Trust Bank", code: "058" },
        { name: "Heritage Bank", code: "030" },
        { name: "Jaiz Bank", code: "301" },
        { name: "Keystone Bank", code: "082" },
        { name: "Kuda Bank", code: "50211" },
        { name: "Opay", code: "999992" },
        { name: "Palmpay", code: "999991" },
        { name: "Polaris Bank", code: "076" },
        { name: "Providus Bank", code: "101" },
        { name: "Stanbic IBTC Bank", code: "221" },
        { name: "Standard Chartered Bank", code: "068" },
        { name: "Sterling Bank", code: "232" },
        { name: "Titan Trust Bank", code: "102" },
        { name: "Union Bank of Nigeria", code: "032" },
        { name: "United Bank for Africa", code: "033" },
        { name: "Unity Bank", code: "215" },
        { name: "Wema Bank", code: "035" },
        { name: "Zenith Bank", code: "057" },
      ],
    });
  }

  try {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json();

    if (data.status && Array.isArray(data.data)) {
      cachedBanks = data.data
        .filter((b: { active: boolean }) => b.active)
        .map((b: { name: string; code: string }) => ({ name: b.name, code: b.code }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
      cacheExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24hr cache
      return Response.json({ banks: cachedBanks });
    }

    return Response.json({ error: "Failed to fetch banks" }, { status: 500 });
  } catch (err) {
    console.error("[paystack/banks] fetch failed", err);
    return Response.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
});
