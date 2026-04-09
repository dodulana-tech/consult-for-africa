import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true },
  });
  if (!profile) return new Response("No profile", { status: 404 });

  // Gather context for proactive prompting
  const [
    recentConversations,
    overdueInvoices,
    atRiskEngagements,
    delayedMilestones,
    pendingAgents,
    outreachTotal,
    outreachConverted,
    activeEngagements,
    paidRevenue,
    recentIdeas,
    pendingDeliverables,
  ] = await Promise.all([
    prisma.founderAIConversation.findMany({
      where: { founderId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { question: true, answer: true, createdAt: true },
    }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.engagement.findMany({ where: { status: "AT_RISK" }, select: { name: true, client: { select: { name: true } } } }),
    prisma.milestone.count({ where: { status: "DELAYED" } }),
    prisma.salesAgent.count({ where: { status: "APPLIED" } }),
    prisma.cadreOutreachRecord.count(),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.engagement.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.founderIdea.findMany({ where: { founderId: profile.id, status: { in: ["CAPTURED", "EXPLORING"] } }, orderBy: { createdAt: "desc" }, take: 3, select: { title: true, status: true } }),
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
  ]);

  const revenue = Number(paidRevenue._sum.total ?? 0);
  const firstName = profile.name.split(" ")[0];
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.toLocaleDateString("en-NG", { weekday: "long" });

  const recentConvoSummary = recentConversations.slice(0, 5).map(c =>
    `[${new Date(c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}] Q: ${c.question}\nA: ${c.answer.slice(0, 150)}...`
  ).join("\n\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are Nuru, the accountability partner and strategic co-pilot for ${firstName}, founder of Consult For Africa (C4A), a healthcare consulting firm in Nigeria.

It is ${dayOfWeek}, ${now.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}, ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}.

YOUR JOB: Generate ONE proactive check-in. You initiate. Like someone who genuinely cares about ${firstName} as a whole person, not just as a CEO.

RULES:
- Be direct and specific. Not "how's it going?" but a real question.
- Sense what ${firstName} might need RIGHT NOW based on:
  - Time of day: ${hour < 9 ? "early morning, he might be starting his day" : hour < 12 ? "mid-morning, likely in work mode" : hour < 14 ? "around lunch" : hour < 17 ? "afternoon, energy may be dipping" : hour < 20 ? "evening, should be winding down" : "late night, probably should not be working"}
  - Day of week: ${dayOfWeek}${dayOfWeek === "Saturday" || dayOfWeek === "Sunday" ? " (weekend, check if he's resting or grinding)" : ""}
  - Business state (see below)
  - Recent conversation tone and content
- Mix it up. Don't always ask about business. Sometimes ask:
  - "Did you sleep well?" or "When did you last exercise?"
  - "How are you actually feeling today, Debo?"
  - "You've been going hard all week. What's one thing you're doing for yourself today?"
  - Business accountability when there are real overdue items
- Ask exactly ONE question
- Keep it under 3 sentences
- Never use em dashes
- Tone: warm, direct, like a friend who happens to be your co-founder and also cares about your wellbeing

BUSINESS STATE:
- Revenue: N${revenue.toLocaleString()} total
- Active engagements: ${activeEngagements}
- At-risk: ${atRiskEngagements.map(e => `${e.name} (${e.client.name})`).join(", ") || "none"}
- Overdue invoices: ${overdueInvoices}
- Delayed milestones: ${delayedMilestones}
- Pending deliverables: ${pendingDeliverables}
- CadreHealth outreach: ${outreachConverted}/${outreachTotal} converted
- Pending agent applications: ${pendingAgents}
- Ideas captured: ${recentIdeas.map(i => i.title).join(", ") || "none"}

RECENT CONVERSATIONS:
${recentConvoSummary || "No recent conversations yet. First time here today."}

Generate as JSON:
{
  "message": "Your check-in message with ONE question",
  "type": "accountability|strategic|celebration|challenge|wellbeing|energy",
  "context": "What triggered this (1 sentence)"
}`,
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? responseText);
    return Response.json(parsed);
  } catch {
    return Response.json({
      message: responseText.slice(0, 300),
      type: "strategic",
      context: "Generated prompt",
    });
  }
}
