import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canAnalyze = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAnalyze) return new Response("Forbidden", { status: 403 });

  const { projectId } = await req.json();
  if (!projectId) return new Response("projectId required", { status: 400 });

  // Fetch full project state using separate queries for reliability
  const [project, assignments, milestones, deliverables, invoices, tracks] = await Promise.all([
    prisma.engagement.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { name: true, type: true, creditScore: true, status: true } },
        engagementManager: { select: { name: true } },
      },
    }),
    prisma.assignment.findMany({
      where: { engagementId: projectId },
      include: {
        consultant: { select: { name: true, consultantProfile: { select: { tier: true, averageRating: true } } } },
        timeEntries: { select: { hours: true, status: true } },
        deliverables: { select: { status: true } },
      },
    }),
    prisma.milestone.findMany({
      where: { engagementId: projectId },
      select: { name: true, dueDate: true, status: true },
    }),
    prisma.deliverable.findMany({
      where: { engagementId: projectId },
      select: { status: true, version: true },
    }),
    prisma.invoice.findMany({
      where: { engagementId: projectId },
      select: { status: true, total: true, dueDate: true },
    }),
    prisma.engagementTrack.findMany({
      where: { engagementId: projectId },
      include: {
        _count: { select: { assignments: true, deliverables: true } },
        assignments: {
          where: { status: { in: ["ACTIVE", "PENDING"] } },
          select: {
            trackRole: true,
            consultant: { select: { name: true } },
          },
        },
        deliverables: {
          select: { status: true },
        },
      },
    }),
  ]);

  if (!project) return new Response("Project not found", { status: 404 });

  const now = new Date();
  const endTime = project.endDate ? new Date(project.endDate).getTime() : (new Date(project.startDate).getTime() + 365 * 86400000);
  const daysUntilEnd = Math.round((endTime - now.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.round((endTime - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const pctComplete = Math.round(((totalDays - Math.max(0, daysUntilEnd)) / totalDays) * 100);

  const budgetSpentPct = Math.round((Number(project.actualSpent) / Number(project.budgetAmount)) * 100);

  const overdueMilestones = milestones.filter(
    (m) => m.status !== "COMPLETED" && new Date(m.dueDate) < now
  );

  const pendingDeliverables = deliverables.filter(
    (d) => !["APPROVED", "DELIVERED_TO_CLIENT"].includes(d.status)
  ).length;
  const approvedDeliverables = deliverables.filter(
    (d) => ["APPROVED", "DELIVERED_TO_CLIENT"].includes(d.status)
  ).length;

  const totalHoursLogged = assignments.reduce(
    (sum, a) => sum + a.timeEntries.reduce((s, te) => s + Number(te.hours), 0),
    0
  );

  const needsRevisionCount = deliverables.filter((d) => d.status === "NEEDS_REVISION").length;
  const highRevisionConsultants = assignments
    .filter((a) => a.deliverables.filter((d) => d.status === "NEEDS_REVISION").length >= 2)
    .map((a) => a.consultant.name);

  const overdueInvoices = invoices.filter(
    (inv) => inv.status !== "PAID" && inv.dueDate && new Date(inv.dueDate) < now
  );

  const projectData = {
    name: project.name,
    status: project.status,
    currentRiskLevel: project.riskLevel,
    healthScore: project.healthScore,
    serviceType: project.serviceType,
    daysUntilDeadline: daysUntilEnd,
    timelineProgress: pctComplete,
    budget: {
      total: Number(project.budgetAmount),
      spent: Number(project.actualSpent),
      spentPercent: budgetSpentPct,
      currency: project.budgetCurrency,
    },
    team: {
      totalConsultants: assignments.length,
      consultants: assignments.map((a) => ({
        name: a.consultant.name,
        tier: a.consultant.consultantProfile?.tier ?? "STANDARD",
        rating: a.consultant.consultantProfile?.averageRating
          ? Number(a.consultant.consultantProfile.averageRating)
          : null,
      })),
    },
    milestones: {
      total: milestones.length,
      overdue: overdueMilestones.length,
      overdueMilestones: overdueMilestones.map((m) => m.name),
    },
    deliverables: {
      total: deliverables.length,
      approved: approvedDeliverables,
      pending: pendingDeliverables,
      needsRevision: needsRevisionCount,
      completionRate: deliverables.length > 0
        ? Math.round((approvedDeliverables / deliverables.length) * 100)
        : 0,
    },
    timesheets: { totalHoursLogged },
    payment: { overdueInvoices: overdueInvoices.length },
    client: {
      name: project.client.name,
      type: project.client.type,
      creditScore: project.client.creditScore,
      status: project.client.status,
    },
    qualityConcerns: highRevisionConsultants,
    tracks: tracks.map((t) => {
      const trackDeliverables = t.deliverables;
      const approvedCount = trackDeliverables.filter(
        (d) => ["APPROVED", "DELIVERED_TO_CLIENT"].includes(d.status)
      ).length;
      return {
        name: t.name,
        status: t.status,
        assignedConsultants: t.assignments.map((a) => ({
          name: a.consultant.name,
          role: a.trackRole ?? "Unspecified",
        })),
        staffingCount: t._count.assignments,
        deliverableCount: t._count.deliverables,
        deliverableProgress: trackDeliverables.length > 0
          ? `${approvedCount}/${trackDeliverables.length} approved`
          : "No deliverables",
        hasLead: t.assignments.some((a) => a.trackRole === "Track Lead"),
      };
    }),
  };

  const trackRiskContext = tracks.length > 0
    ? `\nTRACK-LEVEL ANALYSIS:\nThis project has ${tracks.length} workstream track(s). Analyze each for staffing gaps, missing leads, and deliverable progress:\n${tracks.map((t) => {
        const assigned = t.assignments.map((a) => `${a.consultant.name} (${a.trackRole ?? "no role"})`).join(", ") || "UNSTAFFED";
        const approvedDels = t.deliverables.filter((d) => ["APPROVED", "DELIVERED_TO_CLIENT"].includes(d.status)).length;
        const hasLead = t.assignments.some((a) => a.trackRole === "Track Lead");
        return `- "${t.name}" [${t.status}]: Team: ${assigned} | Lead assigned: ${hasLead ? "Yes" : "NO"} | Deliverables: ${approvedDels}/${t.deliverables.length} approved`;
      }).join("\n")}\n`
    : "";

  const prompt = `You are a senior management consulting risk analyst. Analyze this project's health and predict risks.

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}
${trackRiskContext}
Analyze this data and provide a risk assessment. Be specific and data-driven. No em dashes.

Return ONLY a JSON object with this exact structure:
{
  "overallRiskScore": 45,
  "riskLevel": "MEDIUM",
  "riskSummary": "2 sentence summary of overall project health",
  "risks": [
    {
      "category": "Budget" | "Timeline" | "Quality" | "Team" | "Client" | "Delivery",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "title": "Short risk title",
      "description": "What is the risk",
      "likelihood": 70,
      "impact": 60,
      "earlyWarningSign": "What to watch for",
      "recommendedAction": "Specific action to take now"
    }
  ],
  "predictedOutcomes": {
    "onTimeDelivery": 75,
    "withinBudget": 80,
    "clientSatisfaction": 85
  },
  "topPriority": "The single most important action to take in the next 7 days",
  "healthScore": 7
}

Risk level guide: 0-25=LOW, 26-50=MEDIUM, 51-75=HIGH, 76-100=CRITICAL
List 3-5 risks maximum. Focus on the most impactful ones.
overallRiskScore is 0-100 (higher = more risk).
healthScore is 1-10 (higher = healthier).
All probability fields (likelihood, impact, predictedOutcomes) are 0-100.`;

  let analysis: {
    overallRiskScore: number;
    riskLevel: string;
    riskSummary: string;
    risks: Array<{
      category: string;
      severity: string;
      title: string;
      description: string;
      likelihood: number;
      impact: number;
      earlyWarningSign: string;
      recommendedAction: string;
    }>;
    predictedOutcomes: { onTimeDelivery: number; withinBudget: number; clientSatisfaction: number };
    topPriority: string;
    healthScore: number;
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    analysis = JSON.parse(jsonMatch[0]);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("AI risk analysis error:", errMsg, err);
    return Response.json(
      { error: "AI analysis failed", detail: errMsg },
      { status: 500 }
    );
  }

  // Save analysis to project notes
  const analyzedAt = new Date().toISOString();
  const riskSummary = `[Nuru Risk Analysis - ${analyzedAt.slice(0, 10)}]\n` +
    `Risk Level: ${analysis.riskLevel} (Score: ${analysis.overallRiskScore}/100)\n` +
    `Health Score: ${analysis.healthScore}/10\n\n` +
    `Summary: ${analysis.riskSummary}\n\n` +
    `Top Priority: ${analysis.topPriority}\n\n` +
    `Predicted Outcomes:\n` +
    `  On-time delivery: ${analysis.predictedOutcomes.onTimeDelivery}%\n` +
    `  Within budget: ${analysis.predictedOutcomes.withinBudget}%\n` +
    `  Client satisfaction: ${analysis.predictedOutcomes.clientSatisfaction}%\n\n` +
    `Risks Identified:\n` +
    analysis.risks.map((r, i) =>
      `  ${i + 1}. [${r.severity}] ${r.title}\n     ${r.description}\n     Action: ${r.recommendedAction}`
    ).join("\n\n");

  const existingNotes = project.notes || "";
  const updatedNotes = riskSummary + (existingNotes ? "\n\n---\n\n" + existingNotes : "");

  await prisma.engagement.update({
    where: { id: projectId },
    data: {
      notes: updatedNotes,
      healthScore: analysis.healthScore,
      riskLevel: analysis.riskLevel === "CRITICAL" ? "CRITICAL"
        : analysis.riskLevel === "HIGH" ? "HIGH"
        : analysis.riskLevel === "MEDIUM" ? "MEDIUM"
        : "LOW",
    },
  });

  return Response.json({ analysis, projectId, analyzedAt });
});
