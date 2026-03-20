import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

/**
 * POST /api/ai/price-deliverable
 * Nuru suggests pricing for a deliverable based on scope, complexity, and market rates.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { deliverableName, description, serviceType, consultantTier, rateType, budgetSensitivity, consultantTierMin, consultantTierMax, clientType } = body;

  if (!deliverableName?.trim()) {
    return Response.json({ error: "deliverableName is required" }, { status: 400 });
  }

  // Budget sensitivity multiplier context
  const sensitivityContext: Record<string, string> = {
    PREMIUM: "Client expects premium service and can pay full rates. Price at CFA's full rate card.",
    STANDARD: "Standard engagement. Price competitively but maintain CFA quality positioning.",
    VALUE: "Client is price-conscious. Use standard-tier consultants where possible, keep estimates lean.",
    BUDGET: "Tight budget. Use emerging/intern talent where possible. Minimize hours. Focus on templates and existing frameworks rather than bespoke work.",
  };

  const prompt = `You are Nuru, CFA's internal intelligence system. Help price a consulting deliverable for the Nigerian healthcare market.

IMPORTANT CONTEXT: CFA is an African healthcare consulting firm positioned as affordable premium: below Big 4 rates, above freelancers, with embedded execution as the differentiator. We are NOT McKinsey. Our pricing must be realistic for the Nigerian market.

DELIVERABLE: ${deliverableName.trim()}
${description ? `DESCRIPTION: ${description.trim()}` : ""}
${serviceType ? `SERVICE LINE: ${serviceType}` : ""}
${clientType ? `CLIENT TYPE: ${clientType}` : ""}
${budgetSensitivity ? `BUDGET SENSITIVITY: ${budgetSensitivity} - ${sensitivityContext[budgetSensitivity] || ""}` : ""}
${consultantTierMin ? `CONSULTANT TIER RANGE: ${consultantTierMin} to ${consultantTierMax || "EXPERIENCED"}` : ""}

CFA RATE CARD (Nigerian market, 2026):
- EMERGING (0-2yr): N5,000-8,000/hr | N150-250K/month
- STANDARD (3-7yr): N10,000-18,000/hr | N350-600K/month
- EXPERIENCED (7-15yr): N20,000-35,000/hr | N700K-1.2M/month
- ELITE (15yr+): N35,000-50,000/hr | N1.2-1.8M/month
- Diaspora: $50-150/hr USD

DELIVERABLE COMPLEXITY GUIDE (be realistic with hours):
- Template/Checklist/SLA (adapt existing framework): 4-10 hours
- Analysis/Assessment/Gap review: 8-20 hours
- Strategy document/Plan: 15-30 hours
- Complex multi-stakeholder (full diagnostic): 25-50 hours
- Do NOT inflate hours. Most deliverables should be 8-20 hours.

BUDGET SENSITIVITY MULTIPLIERS:
- PREMIUM: 1.0x (full rates)
- STANDARD: 0.75x
- VALUE: 0.55x
- BUDGET: 0.4x

Apply the ${budgetSensitivity || "STANDARD"} multiplier to your pricing.

Return ONLY valid JSON:
{
  "estimatedHours": <number - be conservative>,
  "complexityLevel": "<LOW | MEDIUM | HIGH | VERY_HIGH>",
  "suggestedPriceNGN": { "low": <number>, "mid": <number>, "high": <number> },
  "suggestedPriceUSD": { "low": <number>, "mid": <number>, "high": <number> },
  "recommendedTier": "<EMERGING | STANDARD | EXPERIENCED | ELITE>",
  "rationale": "<1-2 sentences, concise>",
  "comparables": "<brief market reference>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return Response.json({ error: "Pricing analysis failed" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ pricing: parsed });
  } catch (err) {
    console.error("[ai/price-deliverable] failed", err);
    return Response.json({ error: "Pricing analysis failed" }, { status: 500 });
  }
}
