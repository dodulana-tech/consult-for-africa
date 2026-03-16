import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; frameworkId: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId, frameworkId } = await params;

  const pf = await prisma.projectFramework.findUnique({
    where: { id: frameworkId },
    include: {
      framework: true,
      project: {
        select: {
          name: true,
          description: true,
          serviceType: true,
          status: true,
          budgetAmount: true,
          budgetCurrency: true,
          startDate: true,
          endDate: true,
          client: { select: { name: true, type: true } },
        },
      },
    },
  });

  if (!pf || pf.project === null) return new Response("Not found", { status: 404 });

  const project = pf.project;
  const dimensions = pf.framework.dimensions;

  const prompt = `You are Nuru, the AI consulting analyst at Consult For Africa. You are filling in a ${pf.framework.name} analysis framework for a healthcare consulting project.

PROJECT CONTEXT:
- Name: ${project.name}
- Description: ${project.description}
- Service Type: ${project.serviceType.replace(/_/g, " ")}
- Client: ${project.client.name} (${project.client.type})
- Status: ${project.status}
- Budget: ${project.budgetCurrency} ${Number(project.budgetAmount).toLocaleString()}
- Timeline: ${project.startDate.toISOString().slice(0, 10)} to ${project.endDate.toISOString().slice(0, 10)}

FRAMEWORK: ${pf.framework.name}
DESCRIPTION: ${pf.framework.description}

Fill in each dimension with specific, actionable analysis relevant to this project in the Nigerian/African healthcare context. Each dimension should have 3-5 bullet points or a focused paragraph.

Dimensions to fill: ${dimensions.join(", ")}

Return ONLY a JSON object with each dimension as a key and the analysis text as the value:
{
${dimensions.map((d) => `  "${d}": "Your analysis for ${d}..."`).join(",\n")}
}

Be specific to this project. Use Nigerian healthcare context. No em dashes. No generic filler.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const content = JSON.parse(jsonMatch[0]);

    const updated = await prisma.projectFramework.update({
      where: { id: frameworkId },
      data: {
        content,
        aiGenerated: true,
        status: "IN_PROGRESS",
      },
      include: { framework: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "AI_GENERATE",
      entityType: "ProjectFramework",
      entityId: updated.id,
      entityName: updated.framework.name,
      projectId,
    });

    return Response.json({
      framework: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Framework generation error:", err);
    return new Response("AI analysis unavailable", { status: 500 });
  }
}
