import { auth } from "@/auth";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-outreach
 * Nuru suggests outreach targets for a Maarova assessment campaign.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { campaignName, targetCity, targetRole, industry, existingTargets } = body;

  const nuruContext = await getNuruContext();

  const prompt = `You are Nuru, C4A's internal strategy advisor. Help plan outreach sourcing for a Maarova leadership assessment campaign.

CAMPAIGN: ${campaignName || "Monthly outreach"}
${targetCity ? `TARGET CITY: ${targetCity}` : ""}
${targetRole ? `TARGET ROLES: ${targetRole}` : "Targeting senior healthcare leaders: CEOs, Medical Directors, COOs, CMOs, Heads of Nursing, Hospital Administrators"}
${industry ? `INDUSTRY FOCUS: ${industry}` : "Healthcare: private hospitals, hospital groups, HMOs, health agencies"}
${Array.isArray(existingTargets) && existingTargets.length > 0 ? `ALREADY IN CAMPAIGN (avoid duplicates):\n${existingTargets.join("\n")}` : ""}
${nuruContext}

CONTEXT: C4A is building a network of assessed healthcare leaders in Nigeria and across Africa. The goal is to invite senior healthcare professionals to take a free Maarova leadership assessment, building our leadership database.

IMPORTANT: Do NOT invent fictional people. Instead, suggest REAL, VERIFIABLE organisations and roles where we should look for targets. Every organisation you name must be a real institution that exists in Nigeria or Africa. If you are not confident an organisation is real, do not include it.

For each suggestion, provide:
- The real organisation name (hospital, HMO, health agency, or group)
- The role/title we should target at that organisation
- The city where the organisation is headquartered
- Where to find the person (LinkedIn search terms, organisation website, conference speaker lists)
- Why someone in that role at that organisation would value a leadership assessment

Generate 10-20 sourcing leads.

Return ONLY valid JSON:
{
  "targets": [
    {
      "name": "<role title to search for, e.g. Medical Director>",
      "title": "<specific role, e.g. Chief Medical Officer>",
      "organization": "<REAL organisation name>",
      "city": "<city>",
      "source": "<where to find them: specific LinkedIn search, org website URL pattern, conference name>",
      "outreachAngle": "<1 sentence: why this role at this org would value the assessment>"
    }
  ],
  "messagingTip": "<1-2 sentences: suggested outreach approach for this campaign>"
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
});
