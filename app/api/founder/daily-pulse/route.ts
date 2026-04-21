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
  });
  if (!profile) return Response.json({ error: "No founder profile" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if pulse already exists for today
  const existing = await prisma.founderDailyPulse.findUnique({
    where: { founderId_date: { founderId: profile.id, date: today } },
  });
  if (existing) return Response.json(existing);

  // Gather metrics snapshot
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalRevenue, last30Revenue, overdueInvoices,
    activeEngagements, atRiskCount, planningCount,
    totalConsultants, availableConsultants,
    newLeads7d, totalLeads, proposalsSent,
    totalProfessionals, outreachConverted, outreachTotal, openMandates,
    approvedAgents, activeDeals, dealsWon,
    pendingDeliverables, delayedMilestones, pendingTimesheets,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "CONFIRMED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED", paymentDate: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.engagement.count({ where: { status: "ACTIVE" } }),
    prisma.engagement.count({ where: { status: "AT_RISK" } }),
    prisma.engagement.count({ where: { status: "PLANNING" } }),
    prisma.consultantProfile.count(),
    prisma.consultantProfile.count({ where: { availabilityStatus: "AVAILABLE" } }),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count(),
    prisma.proposal.count({ where: { status: "SENT" } }),
    prisma.cadreProfessional.count(),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.cadreOutreachRecord.count(),
    prisma.cadreMandate.count({ where: { status: { in: ["OPEN", "SOURCING"] } } }),
    prisma.salesAgent.count({ where: { status: "APPROVED" } }),
    prisma.agentDeal.count({ where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"] } } }),
    prisma.agentDeal.count({ where: { stage: "CLOSED_WON" } }),
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    prisma.milestone.count({ where: { status: "DELAYED" } }),
    prisma.timeEntry.count({ where: { status: "PENDING" } }),
  ]);

  const metricsSnapshot = {
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    last30Revenue: Number(last30Revenue._sum.amount ?? 0),
    overdueInvoices,
    activeEngagements,
    atRiskCount,
    planningCount,
    totalConsultants,
    availableConsultants,
    newLeads7d,
    totalLeads,
    proposalsSent,
    totalProfessionals,
    outreachConverted,
    outreachTotal,
    openMandates,
    approvedAgents,
    activeDeals,
    dealsWon,
    pendingDeliverables,
    delayedMilestones,
    pendingTimesheets,
  };

  // Search for relevant macro news
  let newsContext = "";
  try {
    const newsRes = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search", name: "web_search", max_uses: 3 } as any],
      messages: [{
        role: "user",
        content: `Search for the latest Nigerian healthcare industry news, medical tourism policy updates, and healthcare workforce regulation changes from the last 7 days. Focus on: NMA, MDCN, NHIA, HMO policy, medical brain drain, and healthcare investment in Nigeria. Summarise the 3 most relevant headlines with source names.`,
      }],
    });
    const newsText = newsRes.content.find(c => c.type === "text");
    if (newsText && newsText.type === "text") {
      newsContext = `\n\nRECENT INDUSTRY NEWS (from web search):\n${newsText.text}`;
    }
  } catch {
    // Web search failed, proceed without news
    newsContext = "\n\n(Industry news unavailable today)";
  }

  // Generate pulse with Claude (Opus for quality briefing)
  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are Nuru, the strategy assistant for Debo Odulana, founder of Consult For Africa (C4A), a healthcare consulting and workforce platform in Nigeria. Generate a concise daily briefing based on live business metrics and industry context.

Today: ${today.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

METRICS:
- Total Revenue: N${metricsSnapshot.totalRevenue.toLocaleString()}
- Last 30 Days Revenue: N${metricsSnapshot.last30Revenue.toLocaleString()}
- Overdue Invoices: ${overdueInvoices}
- Active Engagements: ${activeEngagements}, At Risk: ${atRiskCount}, Planning: ${planningCount}
- Consultants: ${totalConsultants} total, ${availableConsultants} available
- New Leads (7d): ${newLeads7d}, Total Leads: ${totalLeads}, Proposals Sent: ${proposalsSent}
- CadreHealth: ${totalProfessionals.toLocaleString()} professionals, ${outreachConverted}/${outreachTotal} outreach converted, ${openMandates} open mandates
- Agent Channel: ${approvedAgents} agents, ${activeDeals} active deals, ${dealsWon} won
- Pending: ${pendingDeliverables} deliverables, ${delayedMilestones} delayed milestones, ${pendingTimesheets} timesheets
${newsContext}

Respond in JSON format:
{
  "summary": "2-3 sentence morning briefing in a direct, warm tone. No fluff. Address Debo by name.",
  "insights": [
    {"type": "win|risk|opportunity|action|macro", "title": "short title", "detail": "1 sentence", "priority": "high|medium|low"}
  ],
  "macroNews": [
    {"headline": "headline text", "source": "publication name", "relevance": "why this matters to C4A in 1 sentence"}
  ]
}

Generate 3-5 insights from the business metrics. Add 1-3 macroNews items if relevant industry news was found. Focus on what Debo should act on today. Be honest about gaps. Never use em dashes.`,
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  let parsed: { summary: string; insights: Array<{ type: string; title: string; detail: string; priority: string }>; macroNews?: Array<{ headline: string; source: string; relevance: string }> };

  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? responseText);
  } catch {
    parsed = { summary: responseText.slice(0, 500), insights: [] };
  }

  const pulse = await prisma.founderDailyPulse.create({
    data: {
      founderId: profile.id,
      date: today,
      summary: parsed.summary,
      insights: { business: parsed.insights, macroNews: parsed.macroNews ?? [] },
      metrics: metricsSnapshot,
    },
  });

  return Response.json(pulse);
});
