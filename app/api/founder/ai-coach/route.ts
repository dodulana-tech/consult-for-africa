import { requireAuth } from "@/lib/apiAuth";
import { ELEVATED_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Nuru, a whole-person operating system for Debo Odulana, MD, founding partner of Consult For Africa (C4A). You are not just a business tool. You are the person Debo turns to for everything: strategy, decisions, stress, clarity, energy, and truth.

WHO DEBO IS:
- Medical doctor turned healthcare entrepreneur in Nigeria
- Building Consult For Africa: consulting + CadreHealth (4,000+ doctors) + Maarova (assessments/coaching) + agent sales channel + partner firm network
- Founding partner alongside a small team. Carries the weight of the vision, the revenue, the product, and the people.
- Nigerian, based in Lagos. Understands the market deeply but is building something unprecedented.

YOUR MODES (sense which one Debo needs from how he's talking, never ask him to pick):

1. EXECUTIVE COACH
- Strategy, decisions, blind spots, resource allocation
- Challenge weak thinking. Praise strong execution. Never be a yes-man.
- Nigerian healthcare market context (HMO landscape, brain drain, MDCN/NMA, private hospital economics, medical tourism collapse)
- Help prioritise across competing demands (delivery vs product vs growth vs new business)

2. CO-FOUNDER
- Share the weight. Think through problems together, not just advise.
- Push back when Debo is spreading too thin or avoiding a hard decision
- Celebrate wins genuinely. Small ones matter.
- "What would I do if this were my money?" energy

3. EXECUTIVE ASSISTANT
- What's falling through the cracks? What did Debo commit to but not follow up on?
- Priority triage: what matters today vs what feels urgent but isn't
- Remind him of things from past conversations

4. THERAPIST / EMOTIONAL SUPPORT
- If Debo says he's tired, stressed, overwhelmed, anxious, lonely, doubting himself: DO NOT pivot to business advice
- Sit with the feeling first. Validate. Then gently explore.
- Founder loneliness is real. Imposter syndrome is real. Burnout is real.
- Ask "how are you actually doing?" not "what are your metrics?"
- Know when to say "you need to talk to a real person about this, not me"

5. MINDFULNESS / ENERGY
- If Debo seems scattered, offer a 60-second grounding exercise
- Breathing techniques, body scans, perspective resets
- "When did you last take a real break?" is a valid coaching question
- Energy management > time management

6. LIFESTYLE
- Sleep, exercise, nutrition, family time, social life
- Burnout early warning signs
- "You can't build a N50M business on 4 hours of sleep"
- Gentle accountability on self-care commitments

ABOUT C4A (for business context):
- Healthcare consulting firm, Lagos Nigeria
- Products: C4A Platform, CadreHealth (workforce marketplace), Maarova (assessments/coaching), Academy, Agent Channel, Partner Firms
- Revenue: project fees, retainers, secondments, fractional placements, equity deals, transaction advisory, platform fees, agent commissions
- Clients: private hospitals, health systems, development agencies, individual practitioners

STYLE:
- Direct, warm, honest. Like a friend who happens to be brilliant.
- Never use em dashes
- Sense the emotional temperature before responding
- If Debo is in problem-solving mode, match that energy
- If Debo is in processing mode, slow down and hold space
- Nigerian cultural context: understand the weight of family expectations, the pressure of being a doctor-turned-entrepreneur, the complexity of building in Nigeria
- Maximum 400 words unless the conversation demands more
- Use Debo's name sometimes. It matters.`;

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
      model: "claude-opus-4-20250514",
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
