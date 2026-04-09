import { requireAuth } from "@/lib/apiAuth";
import { ELEVATED_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Nuru, the strategic AI coach and co-pilot for Debo Odulana, MD, founding partner of Consult For Africa (C4A). You are a trusted thought partner, not a yes-man. Challenge assumptions when needed. Be direct, Nigerian-context-aware, and specific to C4A.

ABOUT C4A:
- Healthcare consulting and transformation firm based in Lagos, Nigeria
- Products: C4A Platform (consulting operations), CadreHealth (healthcare workforce marketplace with 4,000+ doctors), Maarova (psychometric assessments and executive coaching), Academy (consultant training)
- Revenue model: project fees, retainers, secondments, fractional placements, transformation equity deals, transaction advisory, platform fees from own-gig consultants
- Agent sales channel: commission-based external sales agents for client acquisition
- Partner firm channel: staffing requests from other consultancies (Verrakki, SafeCare/PharmAccess, etc.)
- Clients include private hospitals, health systems, development agencies, and individual practitioners (e.g. Dr. Kumar / Paras Orthocare)

YOUR ROLE:
- Founder coaching: help Debo think through strategy, priorities, resource allocation, and decision-making
- Challenge weak thinking, praise strong execution
- Draw on Nigerian healthcare market realities (HMO landscape, brain drain, MDCN/NMA regulation, medical tourism collapse, private hospital economics)
- Help prioritise across competing demands (consulting delivery vs product build vs CadreHealth growth vs new business)
- Provide frameworks when useful (but not generic MBA frameworks, context-specific ones)

STYLE:
- Direct, warm, no fluff
- Never use em dashes
- Specific to C4A's context, not generic startup advice
- Reference actual C4A products, metrics, and market dynamics
- Maximum 400 words per response unless the question demands more
- When Debo asks about revenue or growth, ground it in Nigerian healthcare economics (NGN pricing, hospital purchasing power, HMO reimbursement rates)`;

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(ELEVATED_ROLES);
  if (error) return error;

  const { question } = await req.json();
  if (!question?.trim()) return new Response("question required", { status: 400 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, startDate: true, currentPhase: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const [
    recentConversations,
    activeEngagements, atRiskEngagements, paidRevenue,
    totalConsultants, availableConsultants,
    totalLeads, proposalsSent,
    totalProfessionals, outreachTotal, outreachConverted, openMandates,
    approvedAgents, activeDeals,
    activePartners,
  ] = await Promise.all([
    prisma.founderAIConversation.findMany({
      where: { founderId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.engagement.count({ where: { status: "ACTIVE" } }),
    prisma.engagement.count({ where: { status: "AT_RISK" } }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.consultantProfile.count(),
    prisma.consultantProfile.count({ where: { availabilityStatus: "AVAILABLE" } }),
    prisma.lead.count(),
    prisma.proposal.count({ where: { status: "SENT" } }),
    prisma.cadreProfessional.count(),
    prisma.cadreOutreachRecord.count(),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.cadreMandate.count({ where: { status: { in: ["OPEN", "SOURCING"] } } }),
    prisma.salesAgent.count({ where: { status: "APPROVED" } }),
    prisma.agentDeal.count({ where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"] } } }),
    prisma.partnerFirm.count({ where: { status: "ACTIVE" } }),
  ]);

  const now = new Date();
  const daysInBusiness = Math.floor(
    (now.getTime() - profile.startDate.getTime()) / 86400000
  );

  const context = `LIVE BUSINESS SNAPSHOT (${now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}):
- Day ${daysInBusiness} since founding
- Revenue: N${Number(paidRevenue._sum.total ?? 0).toLocaleString()} total collected
- Active engagements: ${activeEngagements}, At-risk: ${atRiskEngagements}
- Consultants: ${totalConsultants} total, ${availableConsultants} available
- Pipeline: ${totalLeads} leads, ${proposalsSent} proposals pending
- CadreHealth: ${totalProfessionals.toLocaleString()} professionals, ${outreachConverted}/${outreachTotal} outreach converted, ${openMandates} open mandates
- Agent channel: ${approvedAgents} approved agents, ${activeDeals} active deals
- Partner firms: ${activePartners} active

RECENT COACHING CONVERSATIONS (for continuity):
${recentConversations
  .slice(0, 5)
  .map((c) => `Q: ${c.question}\nA: ${c.answer.slice(0, 200)}...`)
  .join("\n\n") || "First conversation"}`;

  let answer: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${context}\n\nQUESTION: ${question}`,
        },
      ],
    });
    answer = (message.content[0] as { text: string }).text;
  } catch (err) {
    console.error("AI coach error:", err);
    return new Response("Failed to get answer. Please try again.", { status: 500 });
  }

  const conversation = await prisma.founderAIConversation.create({
    data: {
      founderId: profile.id,
      question: question.trim(),
      answer,
    },
  });

  return Response.json({ answer, conversationId: conversation.id });
}

export async function GET() {
  const { error, session } = await requireAuth(ELEVATED_ROLES);
  if (error) return error;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const conversations = await prisma.founderAIConversation.findMany({
    where: { founderId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json(conversations);
}
