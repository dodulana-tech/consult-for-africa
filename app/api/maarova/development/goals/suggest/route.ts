import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const POST = handler(async function POST() {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the user's latest completed report
  const report = await prisma.maarovaReport.findFirst({
    where: { userId: session.sub, status: "READY" },
    orderBy: { createdAt: "desc" },
    select: {
      dimensionScores: true,
      developmentAreas: true,
      coachingPriorities: true,
      strengthsAnalysis: true,
      leadershipArchetype: true,
    },
  });

  if (!report) {
    return Response.json(
      { error: "No completed assessment report found. Complete your assessment first." },
      { status: 400 },
    );
  }

  // Fetch existing goals to avoid duplicates
  const existingGoals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: session.sub },
    select: { title: true, dimension: true },
  });

  const systemPrompt = `You are a leadership development coach for Maarova, a leadership assessment platform. Based on the user's assessment results, generate 3 to 5 specific, actionable development goals.

Focus on:
1. Dimensions where the user scored lowest
2. Coaching priorities from the report
3. Development areas highlighted in the analysis

Each goal must include:
- title: A concise, action-oriented title (under 60 characters)
- description: 2 to 3 sentences describing what this goal involves, why it matters, and what success looks like
- dimension: The leadership dimension this goal maps to

Do NOT duplicate existing goals. Do NOT use em dashes. Write in clear, direct language.

Return ONLY valid JSON in this format:
{ "suggestions": [{ "title": "...", "description": "...", "dimension": "..." }] }`;

  const userContent = `ASSESSMENT RESULTS:
Dimension Scores: ${JSON.stringify(report.dimensionScores)}
Development Areas: ${report.developmentAreas ?? "Not available"}
Coaching Priorities: ${JSON.stringify(report.coachingPriorities)}
Strengths: ${report.strengthsAnalysis ?? "Not available"}
Leadership Archetype: ${report.leadershipArchetype ?? "Not available"}

EXISTING GOALS (do not duplicate):
${existingGoals.map((g) => `- ${g.title} (${g.dimension})`).join("\n") || "None"}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = (message.content[0] as { text: string }).text;

    // Parse JSON from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch (err) {
    console.error("AI goal suggestion error:", err);
    return Response.json(
      { error: "Failed to generate suggestions. Please try again." },
      { status: 500 },
    );
  }
});
