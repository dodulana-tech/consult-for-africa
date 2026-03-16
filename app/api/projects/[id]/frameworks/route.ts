import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const frameworks = await prisma.projectFramework.findMany({
    where: { projectId },
    include: {
      framework: {
        select: { id: true, name: true, slug: true, description: true, category: true, dimensions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ frameworks });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const { frameworkId, generateWithAI, content } = await req.json();

  if (!frameworkId) return new Response("frameworkId required", { status: 400 });

  // Check if already exists
  const existing = await prisma.projectFramework.findUnique({
    where: { projectId_frameworkId: { projectId, frameworkId } },
  });
  if (existing) return new Response("Framework already added to this project", { status: 409 });

  const framework = await prisma.frameworkTemplate.findUnique({
    where: { id: frameworkId },
    select: { name: true, description: true, dimensions: true, guideText: true },
  });
  if (!framework) return new Response("Framework not found", { status: 404 });

  let finalContent: Record<string, string> = {};
  let aiGenerated = false;

  if (generateWithAI) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        description: true,
        serviceType: true,
        status: true,
        client: { select: { name: true, type: true } },
      },
    });
    if (!project) return new Response("Project not found", { status: 404 });

    const prompt = `You are a senior management consultant at Consult For Africa, specializing in Nigerian and African healthcare systems.

Apply the ${framework.name} framework to this project. Provide specific, data-driven analysis for each dimension.

PROJECT:
- Name: ${project.name}
- Service: ${project.serviceType.replace(/_/g, " ")}
- Description: ${project.description}
- Client: ${project.client.name} (${project.client.type})
- Status: ${project.status}

FRAMEWORK: ${framework.name}
${framework.description}

DIMENSIONS TO ANALYZE:
${framework.dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

${framework.guideText ? `GUIDE: ${framework.guideText}` : ""}

Return ONLY a JSON object where each key is the exact dimension name and the value is a 2-4 sentence analysis specific to this project in the Nigerian healthcare context. No em dashes. Be specific and actionable.

Example format:
{
  "${framework.dimensions[0]}": "Analysis specific to this project...",
  "${framework.dimensions[1] ?? "Next dimension"}": "Analysis..."
}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = (message.content[0] as { text: string }).text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        finalContent = JSON.parse(jsonMatch[0]);
        aiGenerated = true;
      }
    } catch (err) {
      console.error("AI framework generation error:", err);
      // Fall through with empty content
    }
  } else if (content) {
    finalContent = content;
  }

  const projectFramework = await prisma.projectFramework.create({
    data: {
      projectId,
      frameworkId,
      content: finalContent,
      aiGenerated,
      status: "DRAFT",
      createdById: session.user.id,
    },
    include: {
      framework: {
        select: { id: true, name: true, slug: true, description: true, category: true, dimensions: true },
      },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ProjectFramework",
    entityId: projectFramework.id,
    entityName: projectFramework.framework.name,
    projectId,
    details: { aiGenerated },
  });

  return Response.json({ ok: true, framework: projectFramework }, { status: 201 });
}
