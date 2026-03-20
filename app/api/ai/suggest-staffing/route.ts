import { auth } from "@/auth";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-staffing
 * Nuru suggests staffing needs based on project context.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectName, serviceType, description, existingTeam } = body;

  const prompt = `You are Nuru, CFA's internal intelligence system. An Engagement Manager needs help staffing a project.

PROJECT: ${projectName || "Unnamed"}
SERVICE LINE: ${serviceType || "Not specified"}
${description ? `DESCRIPTION: ${description}` : ""}
${Array.isArray(existingTeam) && existingTeam.length > 0 ? `EXISTING TEAM:\n${existingTeam.join("\n")}` : "No team assigned yet."}

Based on this project context, suggest the next consultant role needed. Consider what skills are missing from the existing team.

CFA SKILL TAXONOMY: Hospital Operations, Revenue Cycle, Clinical Governance, Patient Safety, Quality Improvement, Financial Management, Health Insurance (NHIS/HMO), Supply Chain, Pharmacy Management, Digital Health, EMR/HIS, Data Analytics, Change Management, HR Management, Strategy & Planning, Business Development, Process Engineering, Facilities Management, Nursing Leadership, Medical Director, Health Policy, M&E, Epidemiology, Marketing, Legal & Compliance, Risk Management, Internal Audit, Training & Development

${await getNuruContext()}

Return ONLY valid JSON:
{
  "role": "<suggested role title>",
  "description": "<2-3 sentence role description explaining what this person will do on this specific engagement>",
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "hoursPerWeek": <suggested hours 10-40>,
  "rateType": "<HOURLY | DAILY | MONTHLY | FIXED_PROJECT>",
  "rationale": "<1 sentence explaining why this role is needed>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return Response.json({ error: "Suggestion failed" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ suggestion: parsed });
  } catch (err) {
    console.error("[ai/suggest-staffing] failed", err);
    return Response.json({ error: "Suggestion failed" }, { status: 500 });
  }
}
