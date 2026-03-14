import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

const SYSTEM_PROMPT = `You are an AI strategic coach for Debo Odulana, founder of Consult For Africa (CFA), a premium healthcare consulting platform in Nigeria. You have deep knowledge of: the CFA roadmap ($0 to $50M journey), Nigerian healthcare sector, management consulting operations, startup growth strategy, and the platform's technical build. Debo is in Phase 1 (MVP Build, Week 5 of 8). Launch is April 13, 2026. The platform connects diaspora and Nigeria-based healthcare consultants with Nigerian hospitals and health organizations. Be strategic, specific, actionable. Cite relevant phases/documents when helpful. Maximum 300 words per response.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const { question } = await req.json();
  if (!question?.trim()) return new Response("question required", { status: 400 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, startDate: true, currentPhase: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const [recentMilestones, recentConversations] = await Promise.all([
    prisma.founderMilestone.findMany({
      where: { founderId: profile.id, status: "achieved" },
      orderBy: { achievedAt: "desc" },
      take: 5,
    }),
    prisma.founderAIConversation.findMany({
      where: { founderId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const now = new Date();
  const daysInBusiness = Math.floor(
    (now.getTime() - profile.startDate.getTime()) / 86400000
  );

  const context = `FOUNDER CONTEXT (${now.toLocaleDateString()}):
- Name: ${profile.name}
- Days in business: ${daysInBusiness}
- Current phase: ${profile.currentPhase}
- Week: 5 of 8 in MVP build

RECENT ACHIEVEMENTS:
${recentMilestones.map((m) => `- ${m.name} (${m.achievedAt ? m.achievedAt.toISOString().split("T")[0] : ""}): ${m.celebration ?? ""}`).join("\n") || "None yet"}

RECENT COACHING CONVERSATIONS (last ${recentConversations.length}):
${recentConversations
  .slice(0, 5)
  .map((c) => `Q: ${c.question}\nA: ${c.answer}`)
  .join("\n\n") || "None yet"}`;

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
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

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
