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
      startDate: true,
      endDate: true,
      budgetAmount: true,
      budgetCurrency: true,
      methodology: true,
      client: { select: { name: true, type: true } },
      phases: { select: { name: true } },
    },
  });

  if (!project) return new Response("Not found", { status: 404 });

  const durationWeeks = Math.round(
    ((project.endDate?.getTime() ?? (project.startDate.getTime() + 365 * 86400000)) - project.startDate.getTime()) / (7 * 86400000)
  );
  const existingPhases = project.phases.map((p) => p.name);

  const prompt = `You are a senior healthcare management consultant at Consult For Africa. You design engagement phases for healthcare consulting projects across Africa.

PROJECT:
- Name: ${project.name}
- Service Type: ${project.serviceType.replace(/_/g, " ")}
- Description: ${project.description}
- Client: ${project.client.name} (${project.client.type})
- Duration: ${durationWeeks} weeks (${project.startDate.toISOString().slice(0, 10)} to ${project.endDate?.toISOString().slice(0, 10) ?? "ongoing"})
- Budget: ${project.budgetCurrency} ${Number(project.budgetAmount).toLocaleString()}
- Methodology: ${project.methodology || "Not specified"}
- Existing phases: ${existingPhases.length > 0 ? existingPhases.join(", ") : "None yet"}

Design 4-6 phases for this engagement. Each phase should follow consulting best practice:
1. Discovery/Diagnostic phase first
2. Design/Planning phase
3. Implementation phase(s)
4. Handover/Closure phase

Make phases specific to the service type and Nigerian/African healthcare context. Do NOT duplicate existing phases.

Return ONLY a JSON array:
[
  {
    "name": "Phase name (e.g. Discovery & Diagnostic)",
    "description": "1-2 sentence description of activities and deliverables in this phase",
    "durationWeeks": 4
  }
]

No em dashes. Be specific and practical.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const suggestions = JSON.parse(jsonMatch[0]);

    // Calculate start/end dates for each phase
    let currentStart = new Date(project.startDate);
    const phasesWithDates = suggestions.map((s: { name: string; description: string; durationWeeks: number }) => {
      const startDate = currentStart.toISOString().slice(0, 10);
      const endDate = new Date(currentStart.getTime() + s.durationWeeks * 7 * 86400000).toISOString().slice(0, 10);
      currentStart = new Date(currentStart.getTime() + s.durationWeeks * 7 * 86400000);
      return { ...s, startDate, endDate };
    });

    return Response.json({ suggestions: phasesWithDates });
  } catch (err) {
    console.error("Phase suggestion error:", err);
    return new Response("AI suggestions unavailable", { status: 500 });
  }
}
