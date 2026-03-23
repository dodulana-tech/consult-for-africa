import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;

  const project = await prisma.engagement.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      description: true,
      serviceType: true,
      status: true,
      riskLevel: true,
      startDate: true,
      endDate: true,
      budgetAmount: true,
      actualSpent: true,
      budgetCurrency: true,
      client: { select: { name: true, type: true } },
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING"] } },
        select: { role: true, consultant: { select: { name: true } } },
      },
      milestones: { select: { name: true, status: true, dueDate: true } },
      risks: { select: { title: true, severity: true, status: true } },
    },
  });

  if (!project) return new Response("Not found", { status: 404 });

  const now = new Date();
  const daysLeft = project.endDate ? Math.round((project.endDate.getTime() - now.getTime()) / 86400000) : 365;
  const budgetPct = Number(project.budgetAmount) > 0
    ? Math.round((Number(project.actualSpent) / Number(project.budgetAmount)) * 100)
    : 0;

  const existingRiskTitles = project.risks.map((r) => r.title);

  const prompt = `You are a senior healthcare management consulting risk analyst at Consult For Africa, specializing in Nigerian and African healthcare systems.

Analyze this project and suggest the most relevant risks to add to the risk register. Consider the specific service type, client type, Nigerian context, and current project state.

PROJECT:
- Name: ${project.name}
- Service: ${project.serviceType.replace(/_/g, " ")}
- Description: ${project.description}
- Client: ${project.client.name} (${project.client.type})
- Status: ${project.status} | Risk Level: ${project.riskLevel}
- Timeline: ${daysLeft} days remaining
- Budget: ${budgetPct}% spent (${project.budgetCurrency})
- Team: ${project.assignments.map((a) => `${a.consultant.name} (${a.role})`).join(", ") || "Not yet assigned"}
- Milestones: ${project.milestones.length} total, ${project.milestones.filter((m) => m.status !== "COMPLETED" && m.dueDate < now).length} overdue
- Already logged risks: ${existingRiskTitles.length > 0 ? existingRiskTitles.join(", ") : "None yet"}

Generate 6 highly specific, actionable risks for this project. Do NOT repeat any already-logged risks. Prioritize risks that are:
1. Specific to this service type in Nigerian healthcare
2. Relevant to the current project phase
3. Based on common failure patterns in African healthcare consulting

Return ONLY a JSON array:
[
  {
    "title": "Concise risk title (max 8 words)",
    "description": "2-3 sentence description of why this is a risk in this specific context",
    "category": "one of: Operational | Timeline | Budget | Quality | Client | Team | Regulatory | Technology",
    "severity": "GREEN | AMBER | RED",
    "likelihood": 3,
    "impact": 3,
    "mitigation": "Specific, actionable mitigation strategy for this project"
  }
]

severity: GREEN=low impact, AMBER=moderate, RED=high/critical
likelihood and impact: 1-5 scale (1=very low, 5=very high)
No em dashes. Be specific to Nigerian healthcare context.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions });
  } catch (err) {
    console.error("Risk suggestion error:", err);
    return new Response("AI suggestions unavailable", { status: 500 });
  }
}
