import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { ideaId, title, content, category } = await req.json();
  if (!ideaId || !title || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are Nuru, strategic advisor to Debo Odulana, founder of Consult For Africa (C4A). C4A is a healthcare consulting firm in Nigeria with products including CadreHealth (workforce platform with 4000+ doctors), Maarova (assessments/coaching), and an agent sales channel.

Debo has captured this idea:

TITLE: ${title}
CATEGORY: ${category || "General"}
CONTENT: ${content}

Provide a brief strategic analysis in 3-5 short paragraphs:
1. Why this could work (or not) for C4A specifically
2. Quick validation steps (what to test before building)
3. Revenue/growth potential
4. Key risk or blindspot

Be direct, specific to C4A's context. No em dashes. No generic advice.`,
    }],
  });

  const nuruNotes = message.content[0].type === "text" ? message.content[0].text : "";

  await prisma.founderIdea.update({
    where: { id: ideaId },
    data: { nuruNotes },
  });

  return Response.json({ nuruNotes });
}
