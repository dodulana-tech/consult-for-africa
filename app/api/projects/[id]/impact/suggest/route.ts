import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const POST = handler(async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      budgetAmount: true,
      budgetCurrency: true,
      client: { select: { name: true, type: true } },
      impactMetrics: { select: { metricName: true } },
    },
  });

  if (!project) return new Response("Not found", { status: 404 });

  const existingMetrics = project.impactMetrics.map((m) => m.metricName);

  const prompt = `You are a senior healthcare management consultant at Consult For Africa. You define impact metrics and KPIs for healthcare consulting engagements in Africa.

PROJECT:
- Name: ${project.name}
- Service Type: ${project.serviceType.replace(/_/g, " ")}
- Description: ${project.description}
- Client: ${project.client.name} (${project.client.type})
- Budget: ${project.budgetCurrency} ${Number(project.budgetAmount).toLocaleString()}
- Existing metrics: ${existingMetrics.length > 0 ? existingMetrics.join(", ") : "None yet"}

Suggest 5-8 impact metrics that should be tracked for this engagement. Include:
1. Clinical/operational metrics relevant to the service type
2. Financial impact metrics (revenue, cost savings)
3. Patient/stakeholder outcomes
4. Capacity/efficiency metrics

For each metric, suggest a realistic baseline (current state, "before" value) and a target (expected improvement). Use realistic Nigerian healthcare benchmarks.

Do NOT duplicate existing metrics.

Return ONLY a JSON array:
[
  {
    "metricName": "Metric name (e.g. Bed Occupancy Rate)",
    "baselineValue": "65%",
    "targetValue": "82%",
    "unit": "%",
    "quantifiedValue": 50000000,
    "rationale": "Brief explanation of why this metric matters for this engagement"
  }
]

quantifiedValue is the estimated monetary impact in ${project.budgetCurrency} (use 0 if not applicable).
No em dashes. Be specific to Nigerian/African healthcare.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions });
  } catch (err) {
    console.error("Impact metric suggestion error:", err);
    return new Response("AI suggestions unavailable", { status: 500 });
  }
});
