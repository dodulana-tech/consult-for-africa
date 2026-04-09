import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const doc = await prisma.founderDocument.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  const docContent = doc.content || doc.description || doc.title;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are Nuru, strategic advisor to Debo Odulana, founder of Consult For Africa (C4A), a healthcare consulting firm in Nigeria with CadreHealth (4000+ doctors), Maarova (assessments), and an agent sales channel.

Debo has saved this document in his Knowledge Hub:

TITLE: ${doc.title}
CATEGORY: ${doc.category}
${doc.description ? `DESCRIPTION: ${doc.description}` : ""}
CONTENT:
${docContent?.slice(0, 3000) ?? "(File uploaded, no text content available)"}

Provide:
1. A 2-sentence summary of the document
2. Key takeaways (3-5 bullet points)
3. How this connects to C4A's current priorities
4. One action item Debo should consider based on this

Be specific to C4A. Never use em dashes. Be concise.`,
    }],
  });

  const nuruNotes = message.content[0].type === "text" ? message.content[0].text : "";

  // Also generate a short summary
  const summaryMsg = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Summarise this in exactly one sentence (max 20 words): ${doc.title}. ${doc.description || docContent?.slice(0, 500) || ""}`,
    }],
  });
  const nuruSummary = summaryMsg.content[0].type === "text" ? summaryMsg.content[0].text : "";

  await prisma.founderDocument.update({
    where: { id },
    data: { nuruNotes, nuruSummary },
  });

  return Response.json({ nuruNotes, nuruSummary });
}
