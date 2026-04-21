import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Simple in-memory rate limiter ── */
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 5; // 5 requests per minute per IP
}

/* ── Periodic cleanup so the map doesn't grow unbounded ── */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, 120_000);

const SYSTEM_PROMPT = `You are Nuru, the AI assistant for Consult For Africa (C4A), a specialist management consulting firm focused on healthcare and social impact across Africa.

Your role is to help website visitors understand C4A's services and guide them toward booking a consultation. You are warm, professional, and knowledgeable.

About C4A:
- Specialist management consulting firm for healthcare in Africa
- Services: Hospital Operations, Turnaround Management, Embedded Leadership, Clinical Governance, Digital Health, Health Systems Strengthening
- Maarova: C4A's proprietary psychometric assessment platform for healthcare leaders (6 dimensions: Behavioural Style, Values & Drivers, Emotional Intelligence, Clinical Leadership Transition, 360 Feedback, Culture & Team Diagnostics)
- Training Academy for consultants
- Active in Nigeria and expanding across Africa
- Founded by Dr. Debo Odulana, former CEO of Cedarcrest Hospitals Abuja and founder of Doctoora

Key links to share:
- Book a consultation: /contact
- View services: /services
- Maarova assessment platform: /maarova
- Book a Maarova demo: /maarova/demo
- Careers at C4A: /careers
- Turnaround services: /turnaround

Rules:
- Keep responses concise (2-3 sentences max unless the question requires detail)
- Never use em dashes
- Use British English spelling
- If someone asks about pricing, say "Pricing depends on scope. I would recommend booking a brief consultation so we can understand your needs."
- If someone shares a healthcare challenge, acknowledge it and suggest the relevant C4A service
- Always end with a helpful next step or question
- Never make up facts about C4A. If unsure, suggest they contact hello@consultforafrica.com`;

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  let body: { messages?: Array<{ role: "user" | "assistant"; content: string }> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages array required" }, { status: 400 });
  }

  // Validate and sanitise messages
  const sanitised = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  if (sanitised.length === 0 || sanitised[sanitised.length - 1].role !== "user") {
    return Response.json({ error: "Last message must be from user" }, { status: 400 });
  }

  // Cap conversation length to prevent abuse
  const trimmed = sanitised.slice(-20);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: trimmed,
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        console.error("Nuru chat error:", err);
        controller.enqueue(
          encoder.encode(
            "I'm having trouble responding right now. Please try again or reach out to hello@consultforafrica.com."
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
});
