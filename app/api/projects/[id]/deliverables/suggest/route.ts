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
      status: true,
      startDate: true,
      endDate: true,
      budgetAmount: true,
      budgetCurrency: true,
      methodology: true,
      client: { select: { name: true, type: true } },
      milestones: { select: { name: true, status: true } },
      deliverables: { select: { name: true } },
      phases: { select: { name: true, description: true } },
    },
  });

  if (!project) return new Response("Not found", { status: 404 });

  const existingDeliverables = project.deliverables.map((d) => d.name);
  const durationWeeks = Math.round(
    ((project.endDate?.getTime() ?? (project.startDate.getTime() + 365 * 86400000)) - project.startDate.getTime()) / (7 * 86400000)
  );

  const prompt = `You are Nuru, the AI consulting analyst at Consult For Africa. You design engagement deliverables for healthcare consulting projects.

PROJECT CONTEXT:
- Name: ${project.name}
- Description: ${project.description}
- Service Type: ${project.serviceType.replace(/_/g, " ")}
- Client: ${project.client.name} (${project.client.type})
- Duration: ${durationWeeks} weeks
- Budget: ${project.budgetCurrency} ${Number(project.budgetAmount).toLocaleString()}
- Methodology: ${project.methodology || "Not specified"}
- Phases: ${project.phases.length > 0 ? project.phases.map((p) => p.name).join(", ") : "None defined"}
- Milestones: ${project.milestones.length > 0 ? project.milestones.map((m) => `${m.name} (${m.status})`).join(", ") : "None"}
- Existing deliverables: ${existingDeliverables.length > 0 ? existingDeliverables.join(", ") : "None"}

Design a MECE (Mutually Exclusive, Collectively Exhaustive) set of deliverables for this engagement. Think like a senior consulting partner:

1. What does the client need to receive to consider this engagement successful?
2. What documents, analyses, and outputs are standard for this service type?
3. What is the logical sequence of deliverables across the engagement lifecycle?

Categories to cover (MECE):
- Diagnostic/Assessment deliverables (understanding the current state)
- Strategy/Design deliverables (defining the solution)
- Implementation deliverables (executing the plan)
- Handover/Knowledge transfer deliverables (ensuring sustainability)

Do NOT duplicate existing deliverables. Each deliverable should be a distinct, valuable output.

Return ONLY a JSON array:
[
  {
    "name": "Deliverable name (e.g. Hospital Diagnostic Report)",
    "description": "2-3 sentence description of what this deliverable contains, its purpose, and expected format (report, presentation, dashboard, etc.)"
  }
]

Suggest 6-10 deliverables. No em dashes. Be specific to this project type and Nigerian/African healthcare context.`;

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
    console.error("Deliverable suggestion error:", err);
    return new Response("AI suggestions unavailable", { status: 500 });
  }
});
