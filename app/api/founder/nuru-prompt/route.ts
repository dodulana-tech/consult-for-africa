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

YOUR JOB: Generate ONE proactive check-in message. You are not waiting to be asked. You are initiating. Like a co-founder who texts first.

RULES:
- Be direct and specific. Not "how's it going?" but "Did you send the outreach batch to those 4,000 doctors?"
- Reference specific things from recent conversations if available
- If there are overdue items or at-risk engagements, call them out
- If ${firstName} has been talking about something repeatedly but not acting, push on it
- Ask exactly ONE question that demands a yes/no or specific answer
- Keep it under 3 sentences
- Never use em dashes
- Tone: warm but direct, like a trusted co-founder who cares about results

BUSINESS STATE:
- Revenue: N${revenue.toLocaleString()} total
- Active engagements: ${activeEngagements}
- At-risk engagements: ${atRiskEngagements.map(e => `${e.name} (${e.client.name})`).join(", ") || "none"}
- Overdue invoices: ${overdueInvoices}
- Delayed milestones: ${delayedMilestones}
- Pending deliverables to review: ${pendingDeliverables}
- CadreHealth outreach: ${outreachConverted}/${outreachTotal} converted
- Pending agent applications: ${pendingAgents}
- Ideas in progress: ${recentIdeas.map(i => i.title).join(", ") || "none"}

RECENT CONVERSATIONS:
${recentConvoSummary || "No recent conversations yet. This is the first interaction."}

Generate your proactive message as JSON:
{
  "message": "Your direct check-in message with ONE specific question",
  "type": "accountability|strategic|celebration|challenge",
  "context": "What triggered this prompt (1 sentence)"
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
