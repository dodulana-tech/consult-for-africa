import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canAsk = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAsk) return new Response("Forbidden", { status: 403 });

  const { question } = await req.json();
  if (!question?.trim()) return new Response("question required", { status: 400 });

  const { role, id: userId } = session.user;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";

  const projectWhere = isElevated ? {} : isEM ? { engagementManagerId: userId } : {};

  // Fetch platform snapshot
  const [projects, consultants, clients, deliverables, timesheets] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true, name: true, status: true, riskLevel: true, healthScore: true,
        serviceType: true, budgetAmount: true, actualSpent: true, budgetCurrency: true,
        startDate: true, endDate: true,
        client: { select: { name: true, type: true } },
        engagementManager: { select: { name: true } },
        assignments: { select: { id: true, status: true } },
        _count: { select: { deliverables: true, milestones: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.consultantProfile.findMany({
      select: {
        id: true, title: true, location: true, tier: true,
        availabilityStatus: true, yearsExperience: true,
        expertiseAreas: true, averageRating: true, totalProjects: true,
        user: { select: { name: true } },
      },
      orderBy: { averageRating: "desc" },
      take: 30,
    }),
    isElevated
      ? prisma.client.findMany({
          select: {
            name: true, type: true, status: true,
            _count: { select: { projects: true, invoices: true } },
          },
          take: 20,
        })
      : Promise.resolve([] as unknown[]),
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    prisma.timeEntry.count({ where: { status: "PENDING" } }),
  ]);

  // Build context summary
  const projectSummaries = projects.map((p) => ({
    name: p.name,
    client: p.client.name,
    status: p.status,
    risk: p.riskLevel,
    health: p.healthScore,
    type: p.serviceType.replace(/_/g, " "),
    budget: Number(p.budgetAmount),
    spent: Number(p.actualSpent),
    currency: p.budgetCurrency,
    spentPct: Math.round((Number(p.actualSpent) / Number(p.budgetAmount)) * 100),
    team: p.assignments.filter((a) => a.status === "ACTIVE").length,
    em: p.engagementManager.name,
    deliverables: p._count.deliverables,
    endDate: p.endDate.toISOString().split("T")[0],
  }));

  const consultantSummaries = consultants.map((c) => ({
    name: c.user.name,
    title: c.title,
    tier: c.tier,
    availability: c.availabilityStatus,
    location: c.location,
    yearsExp: c.yearsExperience,
    expertise: c.expertiseAreas,
    rating: c.averageRating ? Number(c.averageRating) : null,
    projects: c.totalProjects,
  }));

  const context = `PLATFORM DATA SNAPSHOT (${new Date().toLocaleDateString()}):

PROJECTS (${projects.length} total):
${JSON.stringify(projectSummaries, null, 2)}

CONSULTANTS (${consultants.length} total):
${JSON.stringify(consultantSummaries, null, 2)}

${isElevated ? `CLIENTS (${(clients as { name: string }[]).length} total):\n${JSON.stringify(clients, null, 2)}\n` : ""}

PENDING ACTIONS:
- Deliverables awaiting review: ${deliverables}
- Timesheets awaiting approval: ${timesheets}

USER CONTEXT:
- Role: ${role.replace(/_/g, " ")}
- Viewing: ${isElevated ? "All projects" : "Assigned projects only"}`;

  const systemPrompt = `You are an AI assistant for Consult For Africa, an operations management consulting firm in Nigeria. You have access to the platform's real-time data and can answer questions about projects, consultants, clients, deliverables, and performance metrics.

Be concise, direct, and specific. Use Nigerian Naira (NGN) and USD as appropriate. No em dashes.
When asked for recommendations, be actionable and specific.
Format currency with commas (e.g., NGN 45,000,000 or $50,000).
If asked something outside the data provided, say so honestly rather than guessing.`;

  let answer: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `PLATFORM DATA:\n${context}\n\nQUESTION: ${question}`,
        },
      ],
    });
    answer = (message.content[0] as { text: string }).text;
  } catch (err) {
    console.error("AI ask error:", err);
    return new Response("Failed to get answer. Please try again.", { status: 500 });
  }

  return Response.json({ answer, question });
}
