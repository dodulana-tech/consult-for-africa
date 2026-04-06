import { NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getCadreLabel, getCadreShortLabel } from "@/lib/cadreHealth/cadres";

const anthropic = new Anthropic();

export async function POST() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load full professional profile
    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: session.sub },
      include: {
        credentials: true,
        qualifications: true,
        workHistory: { orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] },
        cpdEntries: { orderBy: { dateCompleted: "desc" }, take: 20 },
        readinessAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!professional) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Load aggregate data for comparison
    const peerCount = await prisma.cadreProfessional.count({
      where: { cadre: professional.cadre, state: professional.state || undefined },
    });

    const peerSalaries = await prisma.cadreProfessional.findMany({
      where: {
        cadre: professional.cadre,
        state: professional.state || undefined,
        monthlySalary: { not: null },
      },
      select: { monthlySalary: true, yearsOfExperience: true },
      orderBy: { monthlySalary: "asc" },
    });

    const avgQualCount = await prisma.cadreQualification.groupBy({
      by: ["professionalId"],
      where: {
        professional: { cadre: professional.cadre },
      },
      _count: true,
    });

    const avgCredCount = await prisma.cadreCredential.groupBy({
      by: ["professionalId"],
      where: {
        professional: { cadre: professional.cadre },
      },
      _count: true,
    });

    const cadreLabel = getCadreLabel(professional.cadre);
    const cadreShort = getCadreShortLabel(professional.cadre);

    // Build profile summary for prompt
    const profileSummary = {
      name: `${professional.firstName} ${professional.lastName}`,
      cadre: cadreLabel,
      cadreShort,
      subSpecialty: professional.subSpecialty,
      yearsOfExperience: professional.yearsOfExperience,
      state: professional.state,
      city: professional.city,
      country: professional.country,
      isDiaspora: professional.isDiaspora,
      diasporaCountry: professional.diasporaCountry,
      monthlySalary: professional.monthlySalary ? Number(professional.monthlySalary) : null,
      salaryCurrency: professional.salaryCurrency,
      profileCompleteness: professional.profileCompleteness,
      credentials: professional.credentials.map((c) => ({
        type: c.type,
        regulatoryBody: c.regulatoryBody,
        licenseNumber: c.licenseNumber ? "Present" : "Not provided",
        verified: c.verificationStatus,
      })),
      qualifications: professional.qualifications.map((q) => ({
        type: q.type,
        name: q.name,
        institution: q.institution,
        yearObtained: q.yearObtained,
        score: q.score,
      })),
      workHistory: professional.workHistory.map((w) => ({
        facility: w.facilityName,
        role: w.role,
        department: w.department,
        startDate: w.startDate.toISOString().split("T")[0],
        endDate: w.endDate?.toISOString().split("T")[0] || "Present",
        isCurrent: w.isCurrent,
      })),
      cpdPoints: professional.cpdEntries.reduce((sum, e) => sum + Number(e.points), 0),
      readinessScores: {
        domestic: professional.readinessScoreDomestic,
        uk: professional.readinessScoreUK,
        us: professional.readinessScoreUS,
        canada: professional.readinessScoreCanada,
        gulf: professional.readinessScoreGulf,
      },
    };

    const aggregateData = {
      totalPeersInCadreAndState: peerCount,
      salaryDataPoints: peerSalaries.length,
      salaryRange: peerSalaries.length >= 3
        ? {
            p25: Number(peerSalaries[Math.floor(peerSalaries.length * 0.25)]?.monthlySalary || 0),
            median: Number(peerSalaries[Math.floor(peerSalaries.length * 0.5)]?.monthlySalary || 0),
            p75: Number(peerSalaries[Math.floor(peerSalaries.length * 0.75)]?.monthlySalary || 0),
          }
        : null,
      avgQualificationsPerPeer: avgQualCount.length > 0
        ? Math.round(avgQualCount.reduce((s, g) => s + g._count, 0) / avgQualCount.length * 10) / 10
        : null,
      avgCredentialsPerPeer: avgCredCount.length > 0
        ? Math.round(avgCredCount.reduce((s, g) => s + g._count, 0) / avgCredCount.length * 10) / 10
        : null,
    };

    const systemPrompt = `You are a senior career intelligence analyst for CadreHealth, specializing in Nigerian healthcare workforce analytics. Generate a comprehensive Career Intelligence Report for the professional below.

You have access to their complete profile and aggregate comparison data from peers in the same cadre and state.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "marketPosition": {
    "percentile": <number 1-100, estimated based on qualifications, experience, and credentials relative to peers>,
    "peerComparison": "<1-2 sentence summary of how they compare>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "standoutFactors": ["<what makes them notable>"]
  },
  "compensationBenchmark": {
    "estimatedRangeLow": <number in NGN monthly>,
    "estimatedRangeHigh": <number in NGN monthly>,
    "estimatedMedian": <number in NGN monthly>,
    "currentPositionLabel": "<below market | at market | above market>",
    "narrative": "<1-2 sentence explanation of compensation positioning>",
    "growthPotential": "<what could increase their earning potential>"
  },
  "skillsGap": [
    {
      "skill": "<certification or qualification name>",
      "category": "CERTIFICATION | QUALIFICATION | CREDENTIAL | EXPERIENCE",
      "impact": <1-10 score of how much this would improve their standing>,
      "timeToAcquire": "<estimated time>",
      "rationale": "<why this matters>"
    }
  ],
  "careerPaths": [
    {
      "title": "<path name>",
      "description": "<2-3 sentence description>",
      "timeline": "<estimated timeline>",
      "requirements": ["<requirement 1>", "<requirement 2>"],
      "salaryImpact": "<estimated salary change>",
      "suitabilityScore": <1-10>
    }
  ],
  "internationalReadiness": {
    "overall": "<summary statement>",
    "countries": [
      {
        "country": "United Kingdom",
        "readinessScore": <0-100>,
        "status": "<Ready | Nearly Ready | In Progress | Not Started>",
        "completedSteps": ["<step>"],
        "remainingSteps": ["<step>"],
        "estimatedTimeline": "<time to full readiness>"
      },
      {
        "country": "United States",
        "readinessScore": <0-100>,
        "status": "<Ready | Nearly Ready | In Progress | Not Started>",
        "completedSteps": ["<step>"],
        "remainingSteps": ["<step>"],
        "estimatedTimeline": "<time to full readiness>"
      },
      {
        "country": "Canada",
        "readinessScore": <0-100>,
        "status": "<Ready | Nearly Ready | In Progress | Not Started>",
        "completedSteps": ["<step>"],
        "remainingSteps": ["<step>"],
        "estimatedTimeline": "<time to full readiness>"
      },
      {
        "country": "Gulf States (UAE/Saudi Arabia)",
        "readinessScore": <0-100>,
        "status": "<Ready | Nearly Ready | In Progress | Not Started>",
        "completedSteps": ["<step>"],
        "remainingSteps": ["<step>"],
        "estimatedTimeline": "<time to full readiness>"
      }
    ]
  },
  "nextSteps": [
    {
      "priority": <1-based ranking>,
      "action": "<specific action>",
      "category": "CREDENTIAL | QUALIFICATION | CAREER_MOVE | SKILL | DOCUMENTATION",
      "impact": "<what this achieves>",
      "timeframe": "<when to do this>"
    }
  ]
}

Rules:
- Be specific to Nigerian healthcare systems (MDCN, NMCN, PCN processes, NYSC, etc.)
- For salary benchmarks, use realistic Nigerian healthcare salary ranges for the cadre and experience level
- For international pathways, reference actual requirements (PLAB for UK, USMLE for US, etc.)
- If salary data is insufficient, estimate based on cadre, experience, and location
- Provide exactly 3 career paths
- Provide 5-8 skills gap items, prioritized by impact
- Provide 5-7 next steps, ordered by priority
- Be warm but direct. Use professional language.
- Never mention that this analysis is automated or generated by technology`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a Career Intelligence Report for this professional:\n\nProfile:\n${JSON.stringify(profileSummary, null, 2)}\n\nAggregate Peer Data:\n${JSON.stringify(aggregateData, null, 2)}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let report;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      report = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to generate report. Please try again." },
        { status: 500 }
      );
    }

    // Save the report
    const saved = await prisma.cadreCareerReport.create({
      data: {
        professionalId: session.sub,
        marketPosition: report.marketPosition || null,
        compensationBenchmark: report.compensationBenchmark || null,
        skillsGap: report.skillsGap || null,
        careerPaths: report.careerPaths || null,
        internationalReadiness: report.internationalReadiness || null,
        nextSteps: report.nextSteps || null,
        fullReport: report,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: saved.id,
      report,
    });
  } catch (error) {
    console.error("Career assessment error:", error);
    return NextResponse.json(
      { error: "Failed to generate career assessment. Please try again." },
      { status: 500 }
    );
  }
}
