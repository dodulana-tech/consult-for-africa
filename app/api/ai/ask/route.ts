import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/sanitize";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json();
  if (!question?.trim()) return Response.json({ error: "question required" }, { status: 400 });

  const { role, id: userId } = session.user;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isConsultant = role === "CONSULTANT";

  let context: string;

  if (isConsultant) {
    // Scoped context for consultants: only their own assignments, deliverables, timesheets
    const [myAssignments, myDeliverables, myTimesheets, myProfile] = await Promise.all([
      prisma.assignment.findMany({
        where: { consultantId: userId, status: { in: ["ACTIVE", "PENDING"] } },
        include: {
          engagement: {
            select: { name: true, status: true, startDate: true, endDate: true, client: { select: { name: true } } },
          },
        },
      }),
      prisma.deliverable.findMany({
        where: { assignment: { consultantId: userId } },
        select: { name: true, status: true, version: true, dueDate: true, submittedAt: true, reviewScore: true, reviewNotes: true, engagement: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.timeEntry.findMany({
        where: { consultantId: userId },
        select: { date: true, hours: true, status: true, description: true, assignment: { select: { engagement: { select: { name: true } } } } },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.consultantProfile.findFirst({
        where: { userId },
        select: { title: true, tier: true, expertiseAreas: true, averageRating: true, totalProjects: true },
      }),
    ]);

    const assignmentSummaries = myAssignments.map((a) => ({
      project: a.engagement.name,
      client: a.engagement.client.name,
      role: a.role,
      status: a.engagement.status,
      endDate: a.engagement.endDate?.toISOString().split("T")[0] ?? "ongoing",
    }));

    const deliverableSummaries = myDeliverables.map((d) => ({
      name: d.name,
      project: d.engagement.name,
      status: d.status,
      version: d.version,
      dueDate: d.dueDate?.toISOString().split("T")[0] ?? null,
      reviewScore: d.reviewScore,
      reviewNotes: d.reviewNotes,
    }));

    const timesheetSummaries = myTimesheets.map((t) => ({
      date: t.date.toISOString().split("T")[0],
      hours: Number(t.hours),
      status: t.status,
      project: t.assignment.engagement.name,
    }));

    context = `YOUR DATA SNAPSHOT (${new Date().toLocaleDateString()}):

YOUR PROFILE:
${JSON.stringify(myProfile, null, 2)}

YOUR ACTIVE ASSIGNMENTS (${myAssignments.length}):
${JSON.stringify(assignmentSummaries, null, 2)}

YOUR DELIVERABLES (${myDeliverables.length}):
${JSON.stringify(deliverableSummaries, null, 2)}

YOUR RECENT TIMESHEETS (${myTimesheets.length}):
${JSON.stringify(timesheetSummaries, null, 2)}

USER CONTEXT:
- Role: Consultant
- Viewing: Your own data only`;
  } else {
    const projectWhere = isElevated ? {} : isEM ? { engagementManagerId: userId } : {};

    // Fetch platform snapshot
    const [projects, consultants, clients, deliverables, timesheets] = await Promise.all([
      prisma.engagement.findMany({
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
              _count: { select: { engagements: true, invoices: true } },
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
      em: p.engagementManager?.name ?? "Unassigned",
      deliverables: p._count.deliverables,
      endDate: p.endDate?.toISOString().split("T")[0] ?? "ongoing",
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

    context = `PLATFORM DATA SNAPSHOT (${new Date().toLocaleDateString()}):

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
  }

  const systemPrompt = isConsultant
    ? `You are Nuru, the AI assistant for Consult For Africa (C4A), an operations management consulting firm in Nigeria. You are helping a consultant on the platform. You can see their assignments, deliverables, timesheets, and profile data.

Help them with: understanding their deliverable feedback, improving their work, tracking deadlines, understanding project context, and general consulting methodology questions.

Be concise, direct, and specific. No em dashes. Do not reveal data about other consultants or projects they are not assigned to.
If asked something outside their scope, explain that you can only help with their own assignments and work.`
    : `You are Nuru, the AI assistant for Consult For Africa (C4A), an operations management consulting firm in Nigeria. You have access to the platform's real-time data and can answer questions about projects, consultants, clients, deliverables, and performance metrics.

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
          content: `PLATFORM DATA:\n${context}\n\nQUESTION: ${sanitizeForPrompt(question)}`,
        },
      ],
    });
    answer = (message.content[0] as { text: string }).text;
  } catch (err) {
    console.error("AI ask error:", err);
    return Response.json({ error: "Failed to get answer. Please try again." }, { status: 500 });
  }

  return Response.json({ answer, question });
});
