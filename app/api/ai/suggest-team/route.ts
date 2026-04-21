import { auth } from "@/auth";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-team
 * Nuru analyzes the full project (deliverables, phases, existing team) and suggests all roles needed.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectName, serviceType, description, deliverables, phases, existingTeam, existingRequests } = body;

  const prompt = `You are Nuru, C4A's internal intelligence system. An Engagement Manager needs you to analyze a project and suggest the complete team composition.

PROJECT: ${projectName || "Unnamed"}
SERVICE LINE: ${serviceType || "Not specified"}
${description ? `DESCRIPTION: ${description}` : ""}

${Array.isArray(deliverables) && deliverables.length > 0 ? `DELIVERABLES TO PRODUCE:\n${deliverables.map((d: string, i: number) => `  ${i + 1}. ${d}`).join("\n")}` : "No deliverables defined yet."}

${Array.isArray(phases) && phases.length > 0 ? `PROJECT PHASES:\n${phases.map((p: string, i: number) => `  ${i + 1}. ${p}`).join("\n")}` : ""}

${Array.isArray(existingTeam) && existingTeam.length > 0 ? `ALREADY ON TEAM:\n${existingTeam.join("\n")}` : "No team assigned yet."}

${Array.isArray(existingRequests) && existingRequests.length > 0 ? `OPEN STAFFING REQUESTS:\n${existingRequests.join("\n")}` : ""}

C4A operates as embedded execution teams inside hospitals. Teams are lean (2-5 people) and every person must be useful. Consider:
1. What roles are needed to deliver ALL the deliverables?
2. What gaps exist in the current team?
3. Don't duplicate existing roles or open requests
4. C4A engagement model: Lead Consultant + 1-3 specialists + optional analyst

Suggest 2-5 additional roles needed (excluding what's already assigned or requested).
${await getNuruContext()}

Return ONLY valid JSON:
{
  "profiles": [
    {
      "role": "<role title>",
      "description": "<2-3 sentences: what this person will do on THIS specific project>",
      "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
      "hoursPerWeek": <10-40>,
      "rateType": "<HOURLY | MONTHLY | FIXED_PROJECT>",
      "rationale": "<1 sentence: why this role is needed>"
    }
  ]
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
      return Response.json({ error: "Team analysis failed" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ profiles: parsed.profiles ?? [] });
  } catch (err) {
    console.error("[ai/suggest-team] failed", err);
    return Response.json({ error: "Team analysis failed" }, { status: 500 });
  }
});
