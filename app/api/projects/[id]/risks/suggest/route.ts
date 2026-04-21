import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const POST = handler(async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

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

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const daysLeft = project.endDate ? Math.round((project.endDate.getTime() - now.getTime()) / 86400000) : 365;
  const budgetPct = Number(project.budgetAmount) > 0
    ? Math.round((Number(project.actualSpent) / Number(project.budgetAmount)) * 100)
    : 0;

  const existingRiskTitles = project.risks.map((r) => r.title);

  const prompt = `You are a risk analyst at Consult For Africa (Nigerian healthcare consulting).

PROJECT: ${project.name}
Service: ${project.serviceType.replace(/_/g, " ")}
Client: ${project.client.name} (${project.client.type})
Status: ${project.status} | Risk: ${project.riskLevel}
Timeline: ${daysLeft} days left | Budget: ${budgetPct}% spent (${project.budgetCurrency})
Team: ${project.assignments.map((a) => `${a.consultant.name} (${a.role})`).join(", ") || "None assigned"}
Milestones: ${project.milestones.length} total, ${project.milestones.filter((m) => m.status !== "COMPLETED" && m.dueDate < now).length} overdue
Description: ${(project.description || "").substring(0, 300)}
Existing risks: ${existingRiskTitles.length > 0 ? existingRiskTitles.join(", ") : "None"}

Generate 6 specific risks for this Nigerian healthcare project. Don't repeat existing risks. Return ONLY a JSON array:
[{"title":"max 8 words","description":"2 sentences why this is risky","category":"Operational|Timeline|Budget|Quality|Client|Team|Regulatory|Technology","severity":"GREEN|AMBER|RED","likelihood":3,"impact":3,"mitigation":"specific action"}]

No markdown, no explanation, just the JSON array. No em dashes.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Risk suggestion error:", msg, err);
    return Response.json({ error: "AI suggestions unavailable", detail: msg }, { status: 500 });
  }
});
