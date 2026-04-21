import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { rateLimit } from "@/lib/cadreHealth/rateLimit";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.cadreAdvisorMessage.findMany({
      where: { professionalId: session.sub },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ messages });
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

    // Rate limit: 20 requests per hour per user
    const allowed = rateLimit(`advisor:${session.sub}`, 20, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "You have reached the daily advisor limit. Please try again later." },
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

    // Load conversation history (last 20 messages)
    const history = await prisma.cadreAdvisorMessage.findMany({
      where: { professionalId: session.sub },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

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

    const systemPrompt = `You are a career advisor for CadreHealth, specializing in Nigerian healthcare careers. You are speaking with ${professional.firstName}, a ${cadreLabel}${professional.subSpecialty ? ` specializing in ${professional.subSpecialty}` : ""} with ${professional.yearsOfExperience || "unknown"} years of experience.

Profile summary:
${profileContext}${reportContext}

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

    // Build conversation messages for Claude
    const conversationMessages: { role: "user" | "assistant"; content: string }[] =
      history.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

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

    // Save both messages
    await prisma.cadreAdvisorMessage.createMany({
      data: [
        {
          professionalId: session.sub,
          role: "user",
          content: message.trim(),
        },
        {
          professionalId: session.sub,
          role: "advisor",
          content: advisorResponse,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      response: advisorResponse,
    });
  } catch (error) {
    console.error("Career advisor error:", error);
    return NextResponse.json(
      { error: "Failed to get advisor response. Please try again." },
      { status: 500 }
    );
  }
});
