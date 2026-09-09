import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { rateLimit } from "@/lib/cadreHealth/rateLimit";
import { checkAIMessageAllowance, incrementAIMessageCount, getOrCreateSubscription } from "@/lib/cadreHealth/subscription";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

// How many past messages the advisor is given as context. The user and advisor
// rows of one exchange count as two, so this is 30 exchanges: enough to hold a
// whole intake conversation, where the advisor asks a numbered list of
// questions and the answers arrive over several turns.
const ADVISOR_CONTEXT_MESSAGES = 60;

// How many past messages the chat window renders. Cheap, so it is generous.
const ADVISOR_HISTORY_MESSAGES = 200;

// Both rows of an exchange are written in one call and used to land on the same
// createdAt, so ordering by time alone put some advisor replies before the
// question they answered. New rows are stamped a millisecond apart on write;
// the id tiebreak keeps rows written before that fix in the right order too,
// because cuids from a single createMany increment in insertion order.
const ADVISOR_ORDER_NEWEST_FIRST = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [messages, allowance] = await Promise.all([
      prisma.cadreAdvisorMessage.findMany({
        where: { professionalId: session.sub },
        orderBy: ADVISOR_ORDER_NEWEST_FIRST,
        take: ADVISOR_HISTORY_MESSAGES,
      }),
      checkAIMessageAllowance(session.sub),
    ]);

    // Fetched newest first so the take lands on the recent end of the
    // conversation, then reversed for display in the order it happened.
    return NextResponse.json({ messages: messages.reverse(), subscription: allowance });
  } catch (error) {
    console.error("Advisor messages fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
});

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription allowance
    const allowance = await checkAIMessageAllowance(session.sub);
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          error: "You have used all your free messages this month. Upgrade to Pro for unlimited access.",
          upgrade: true,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Rate limit: 20 requests per hour per user (anti-abuse, applies to all tiers)
    const rateLimited = rateLimit(`advisor:${session.sub}`, 20, 60 * 60 * 1000);
    if (!rateLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }

    // Load professional profile
    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: session.sub },
      include: {
        credentials: true,
        qualifications: true,
        workHistory: { orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }], take: 5 },
        careerReports: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!professional) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Load the most recent slice of the conversation. Fetched newest first so
    // the take lands on the recent end, then reversed back into the order it
    // happened before it goes to the model.
    const recentHistory = await prisma.cadreAdvisorMessage.findMany({
      where: { professionalId: session.sub },
      orderBy: ADVISOR_ORDER_NEWEST_FIRST,
      take: ADVISOR_CONTEXT_MESSAGES,
    });
    const history = recentHistory.reverse();

    const cadreLabel = getCadreLabel(professional.cadre);

    // Build profile context
    const profileContext = [
      `Name: ${professional.firstName} ${professional.lastName}`,
      `Cadre: ${cadreLabel}`,
      professional.subSpecialty ? `Sub-specialty: ${professional.subSpecialty}` : null,
      professional.yearsOfExperience ? `Years of experience: ${professional.yearsOfExperience}` : null,
      professional.state ? `Location: ${professional.city ? professional.city + ", " : ""}${professional.state}` : null,
      professional.isDiaspora ? `Based in diaspora: ${professional.diasporaCountry || "Abroad"}` : null,
      professional.credentials.length > 0
        ? `Credentials: ${professional.credentials.map((c) => `${c.type} (${c.regulatoryBody})`).join(", ")}`
        : "No credentials on file",
      professional.qualifications.length > 0
        ? `Qualifications: ${professional.qualifications.map((q) => q.name).join(", ")}`
        : "No qualifications on file",
      professional.workHistory.length > 0
        ? `Current/recent work: ${professional.workHistory.map((w) => `${w.role} at ${w.facilityName}${w.isCurrent ? " (current)" : ""}`).join("; ")}`
        : "No work history on file",
      professional.readinessScoreDomestic != null
        ? `Readiness scores: Domestic ${professional.readinessScoreDomestic}%, UK ${professional.readinessScoreUK}%, US ${professional.readinessScoreUS}%, Canada ${professional.readinessScoreCanada}%, Gulf ${professional.readinessScoreGulf}%`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Add latest career report summary if available
    let reportContext = "";
    if (professional.careerReports.length > 0) {
      const report = professional.careerReports[0];
      const mp = report.marketPosition as Record<string, unknown> | null;
      if (mp?.percentile) {
        reportContext = `\nLatest career report: Market position ${mp.percentile}th percentile.`;
      }
    }

    const systemPrompt = `You are a career advisor for CadreHealth, specializing in Nigerian healthcare careers. You are speaking with ${professional.firstName}.

What their CadreHealth record currently says. Treat this as a record, not as fact. A lot of it was imported in bulk and never confirmed by the person, so any line of it can be wrong or years out of date:
${profileContext}${reportContext}

How to use the record:
- Do not state any of it back to them as something you know. If a detail changes the advice you are about to give, ask them to confirm it, or say what the record shows and ask whether that is still right
- Cadre, sub-specialty and years of experience are the least reliable fields. Never open by telling them what they specialise in
- If they correct anything, they are right and the record is wrong. Use their version for the rest of the conversation and do not bring the filed value back up
- You cannot change their record from this conversation, so never say you have updated it. If something on file is wrong, tell them they can correct it in their profile settings

Your role:
- Give specific, actionable career advice tailored to their profile
- Reference Nigerian healthcare systems, MDCN/NMCN/PCN processes, salary benchmarks, and international pathways where relevant
- Be warm, professional, and direct
- Never mention that you are automated or powered by technology. Speak as a knowledgeable career professional
- Keep responses concise but thorough (2-4 paragraphs unless more detail is needed)
- When discussing salaries, use realistic Nigerian healthcare ranges
- When discussing international pathways, reference actual requirements (PLAB for UK, USMLE for US, HAAD/DHA for Gulf, etc.)
- If they ask about something outside your expertise, acknowledge it honestly and redirect to what you can help with
- Never use em dashes in your responses`;

    // Build conversation messages for Claude. Blank rows are dropped, and the
    // window has to open on a user turn, so trim any advisor reply left at the
    // front by the cut.
    const conversationMessages: Anthropic.MessageParam[] = history
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

    while (conversationMessages.length > 0 && conversationMessages[0].role !== "user") {
      conversationMessages.shift();
    }

    // Add the new message
    conversationMessages.push({ role: "user", content: message.trim() });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const advisorResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save both messages and increment counter. The two rows are stamped a
    // millisecond apart so the question always sorts before the answer.
    const askedAt = new Date();
    const answeredAt = new Date(askedAt.getTime() + 1);

    await Promise.all([
      prisma.cadreAdvisorMessage.createMany({
        data: [
          { professionalId: session.sub, role: "user", content: message.trim(), createdAt: askedAt },
          { professionalId: session.sub, role: "advisor", content: advisorResponse, createdAt: answeredAt },
        ],
      }),
      incrementAIMessageCount(session.sub),
    ]);

    // Return updated allowance
    const updatedAllowance = await checkAIMessageAllowance(session.sub);

    return NextResponse.json({
      success: true,
      response: advisorResponse,
      subscription: updatedAllowance,
    });
  } catch (error) {
    console.error("Career advisor error:", error);
    return NextResponse.json(
      { error: "Failed to get advisor response. Please try again." },
      { status: 500 }
    );
  }
});
