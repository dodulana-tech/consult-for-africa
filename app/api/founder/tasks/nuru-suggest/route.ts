import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true },
  });
  if (!profile) return Response.json({ error: "No profile" }, { status: 404 });

  // Gather context
  const [
    existingTasks, revenue, activeEngagements, atRisk,
    outreachTotal, outreachConverted, pendingAgents,
    overdueInvoices, pendingDeliverables,
  ] = await Promise.all([
    prisma.founderTask.findMany({ where: { founderId: profile.id, status: "pending" }, select: { title: true } }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED" }, _sum: { amount: true } }),
    prisma.engagement.count({ where: { status: "ACTIVE" } }),
    prisma.engagement.count({ where: { status: "AT_RISK" } }),
    prisma.cadreOutreachRecord.count(),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.salesAgent.count({ where: { status: "APPLIED" } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
  ]);

  const existingTaskTitles = existingTasks.map(t => t.title).join(", ") || "none";

  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are Nuru, strategic co-pilot for ${profile.name.split(" ")[0]}, founder of Consult For Africa (C4A).

Based on the current business state, suggest 3-5 tasks for this week. These should be specific, actionable, and prioritised.

BUSINESS STATE:
- Revenue: N${Number(revenue._sum.amount ?? 0).toLocaleString()}
- Active engagements: ${activeEngagements}, At-risk: ${atRisk}
- CadreHealth outreach: ${outreachConverted}/${outreachTotal} converted
- Pending agent applications: ${pendingAgents}
- Overdue invoices: ${overdueInvoices}
- Pending deliverables to review: ${pendingDeliverables}

EXISTING TASKS (don't duplicate): ${existingTaskTitles}

Respond as JSON array:
[
  {
    "title": "Specific actionable task",
    "description": "Why this matters and what done looks like",
    "priority": "critical|high|medium|low",
    "category": "revenue|delivery|cadrehealth|agents|operations|strategy",
    "estimatedMinutes": 30
  }
]

Focus on what moves the needle THIS WEEK. Be specific to C4A. Never use em dashes.`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const tasks = JSON.parse(jsonMatch?.[0] ?? text);
    return Response.json(tasks);
  } catch {
    return Response.json([]);
  }
});
