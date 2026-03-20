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
  const { deliverableName, description, serviceType, consultantTier, rateType } = body;

  if (!deliverableName?.trim()) {
    return Response.json({ error: "deliverableName is required" }, { status: 400 });
  }

  const prompt = `You are Nuru, CFA's internal intelligence system. An Engagement Manager needs pricing guidance for a consulting deliverable.

DELIVERABLE: ${deliverableName.trim()}
${description ? `DESCRIPTION: ${description.trim()}` : ""}
${serviceType ? `SERVICE LINE: ${serviceType}` : ""}
${consultantTier ? `CONSULTANT TIER: ${consultantTier}` : ""}
${rateType ? `RATE TYPE: ${rateType}` : ""}

CFA RATE BENCHMARKS (Nigerian healthcare consulting market):
- INTERN: N30,000-50,000/month (stipend, not billed to client)
- EMERGING (0-2yr): N150,000-300,000/month or N5,000-10,000/hour
- STANDARD (3-7yr): N500,000-1,000,000/month or N15,000-30,000/hour
- EXPERIENCED (7-15yr): N1,000,000-2,000,000/month or N30,000-60,000/hour
- ELITE (15yr+): N2,000,000-4,000,000/month or N60,000-120,000/hour
- Diaspora consultants: $100-250/hour USD

Estimate the effort and suggest pricing. Consider:
1. Technical complexity (how specialized is the skill needed?)
2. Time required (research, analysis, drafting, review cycles)
3. Client-facing vs internal work
4. Risk/liability (clinical governance work requires more senior oversight)
5. Market positioning (CFA is premium, not budget consulting)

Return ONLY valid JSON:
{
  "estimatedHours": <number>,
  "complexityLevel": "<LOW | MEDIUM | HIGH | VERY_HIGH>",
  "suggestedPriceNGN": { "low": <number>, "mid": <number>, "high": <number> },
  "suggestedPriceUSD": { "low": <number>, "mid": <number>, "high": <number> },
  "recommendedTier": "<EMERGING | STANDARD | EXPERIENCED | ELITE>",
  "rationale": "<2-3 sentences explaining the pricing logic>",
  "comparables": "<what similar deliverables typically cost in the market>"
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
