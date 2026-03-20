import { auth } from "@/auth";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-outreach
 * Nuru suggests outreach targets for a Maarova assessment campaign.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { campaignName, targetCity, targetRole, industry, existingTargets } = body;

  const nuruContext = await getNuruContext();

  const prompt = `You are Nuru, CFA's internal intelligence system. Help build an outreach target list for a Maarova leadership assessment campaign.

CAMPAIGN: ${campaignName || "Monthly outreach"}
${targetCity ? `TARGET CITY: ${targetCity}` : ""}
${targetRole ? `TARGET ROLES: ${targetRole}` : "Targeting senior healthcare leaders: CEOs, Medical Directors, COOs, CMOs, Heads of Nursing, Hospital Administrators"}
${industry ? `INDUSTRY FOCUS: ${industry}` : "Healthcare: private hospitals, hospital groups, HMOs, health agencies"}
${Array.isArray(existingTargets) && existingTargets.length > 0 ? `ALREADY IN CAMPAIGN (avoid duplicates):\n${existingTargets.join("\n")}` : ""}
${nuruContext}

CONTEXT: CFA is building a network of assessed healthcare leaders in Nigeria. The goal is to invite senior healthcare professionals to take a free Maarova leadership assessment, building our executive search database.

TARGET CRITERIA:
- Decision-makers at hospitals, HMOs, health agencies (CEO, MD, CMO, COO, Director level)
- Preferably in Lagos, Abuja, Port Harcourt, but other major cities welcome
- Mix of private hospitals, government/teaching hospitals, HMO executives
- 10+ years experience in healthcare management
- Active on LinkedIn or reachable via email

Generate 10-20 target profiles. For each, suggest a realistic Nigerian healthcare leader profile (these should be plausible target archetypes, not real people).

Return ONLY valid JSON:
{
  "targets": [
    {
      "name": "<Nigerian name>",
      "title": "<e.g. Medical Director>",
      "organization": "<e.g. XYZ Hospital>",
      "city": "<Lagos/Abuja/etc>",
      "source": "<LinkedIn/Conference/Industry Directory>",
      "outreachAngle": "<1 sentence: why they'd care about a free leadership assessment>"
    }
  ],
  "messagingTip": "<1-2 sentences: suggested LinkedIn message approach for this campaign>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return Response.json({ error: "Suggestion failed" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ targets: parsed.targets ?? [], messagingTip: parsed.messagingTip ?? "" });
  } catch (err) {
    console.error("[ai/suggest-outreach] failed", err);
    return Response.json({ error: "Suggestion failed" }, { status: 500 });
  }
}
