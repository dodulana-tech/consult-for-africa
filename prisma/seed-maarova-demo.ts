/**
 * Seed script: Maarova Demo Data
 *
 * Idempotently creates one demo organisation, one demo user, and one
 * COMPLETED assessment session with a READY report. Useful for sales
 * demos, internal QA, and validating the share/profile UI without
 * having to take the full assessment.
 *
 * Demo user credentials: demo@maarova.test (no password; not portal-enabled)
 *
 * Run with: npx tsx prisma/seed-maarova-demo.ts
 *
 * Safe to run repeatedly. Updates existing demo records by deterministic
 * email/slug lookup; never creates duplicates.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ORG_EMAIL = "demo@maarova.test";
const DEMO_USER_EMAIL = "demo.leader@maarova.test";

async function main() {
  console.log("Seeding Maarova demo data ...\n");

  // 1. Organisation
  const org = await prisma.maarovaOrganisation.upsert({
    where: { id: "demo-org-maarova" },
    update: {
      name: "Maarova Demo Hospital",
      type: "private_hospital",
      country: "Nigeria",
      city: "Lagos",
      contactName: "Demo Contact",
      contactEmail: DEMO_ORG_EMAIL,
      stream: "DEVELOPMENT",
      maxAssessments: 100,
      isActive: true,
      notes: "Internal demo organisation. Do not invoice or report on.",
    },
    create: {
      id: "demo-org-maarova",
      name: "Maarova Demo Hospital",
      type: "private_hospital",
      country: "Nigeria",
      city: "Lagos",
      contactName: "Demo Contact",
      contactEmail: DEMO_ORG_EMAIL,
      stream: "DEVELOPMENT",
      maxAssessments: 100,
      isActive: true,
      notes: "Internal demo organisation. Do not invoice or report on.",
    },
  });
  console.log(`  org:     ${org.name} (${org.id})`);

  // 2. User
  const user = await prisma.maarovaUser.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      organisationId: org.id,
      name: "Dr Adaeze Okafor",
      title: "Chief Medical Director",
      department: "Executive Office",
      yearsInRole: 3,
      yearsInHealthcare: 18,
      clinicalBackground: "Internal Medicine",
      isPortalEnabled: false,
    },
    create: {
      email: DEMO_USER_EMAIL,
      organisationId: org.id,
      name: "Dr Adaeze Okafor",
      title: "Chief Medical Director",
      department: "Executive Office",
      yearsInRole: 3,
      yearsInHealthcare: 18,
      clinicalBackground: "Internal Medicine",
      isPortalEnabled: false,
    },
  });
  console.log(`  user:    ${user.name} (${user.id})`);

  // 3. Assessment session (COMPLETED)
  const startedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedAt = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let session = await prisma.maarovaAssessmentSession.findFirst({
    where: { userId: user.id, sessionType: "demo" },
  });
  if (session) {
    session = await prisma.maarovaAssessmentSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        stream: "DEVELOPMENT",
        startedAt,
        completedAt,
        expiresAt,
        totalTimeMinutes: 65,
      },
    });
  } else {
    session = await prisma.maarovaAssessmentSession.create({
      data: {
        userId: user.id,
        sessionType: "demo",
        stream: "DEVELOPMENT",
        status: "COMPLETED",
        startedAt,
        completedAt,
        expiresAt,
        totalTimeMinutes: 65,
      },
    });
  }
  console.log(`  session: ${session.id} (${session.status})`);

  // 4. Report (READY)
  const dimensionScores = {
    D: 72, I: 58, S: 64, C: 81,
    selfAwareness: 78, empathy: 71, socialSkills: 66, emotionalRegulation: 74,
    clinicalIdentity: 88, leadershipIdentity: 64, transitionReadiness: 70, identityFriction: 42,
    collaborate: 76, create: 52, compete: 58, control: 81,
    theoretical: 82, economic: 54, aesthetic: 38, social: 78, political: 62, regulatory: 71,
  };

  const radarChartData = [
    { dimension: "Conscientious (DISC)", score: 81, benchmark: 65 },
    { dimension: "Self-Awareness (EQ)", score: 78, benchmark: 68 },
    { dimension: "Clinical Identity (CILTI)", score: 88, benchmark: 72 },
    { dimension: "Control (Culture)", score: 81, benchmark: 60 },
    { dimension: "Theoretical (Values)", score: 82, benchmark: 64 },
    { dimension: "Empathy (EQ)", score: 71, benchmark: 70 },
  ];

  const signatureStrengths = [
    {
      dimension: "Clinical Identity",
      title: "Anchored Clinical Authority",
      description:
        "You bring deep clinical credibility into every leadership decision. Teams trust your judgement because it is grounded in patient outcomes, not just policy.",
    },
    {
      dimension: "Conscientiousness",
      title: "Disciplined Systems Thinking",
      description:
        "You instinctively design and enforce structure. Where others see chaos, you see process gaps you can close.",
    },
    {
      dimension: "Theoretical Values",
      title: "Evidence-Driven Conviction",
      description:
        "You make decisions from data and principle, not pressure. This makes you a stabilising influence in politicised environments.",
    },
  ];

  const coachingPriorities = [
    {
      priority: 1,
      title: "Develop emergent leadership identity",
      description:
        "Your leadership identity (64) lags your clinical identity (88). Coaching will help you claim authority in non-clinical decisions without retreating to your clinical comfort zone.",
      suggestedActions: [
        "Lead one strategic, non-clinical initiative this quarter",
        "Co-create a leadership narrative with a coach",
        "Practice delegating clinical work to senior registrars",
      ],
      timeframe: "3-6 months",
    },
    {
      priority: 2,
      title: "Expand influencing range beyond Control style",
      description:
        "Your Culture profile leans heavily on Control (81). Building Collaborate and Create capacity will help you mobilise change without burning relational capital.",
      suggestedActions: [
        "Run a 90-day participative team experiment",
        "Map your stakeholder influence styles",
        "Adopt one creative-quadrant practice (e.g. innovation huddles)",
      ],
      timeframe: "6 months",
    },
  ];

  const fullReportContent = {
    disc: {
      profileSummary:
        "Your DISC profile shows a Conscientious-Dominant blend. You are decisive when the data supports a course of action, and meticulous about implementation.",
      characterInsights:
        "Colleagues experience you as principled, exacting, and focused. You are most yourself when systems are working as designed.",
      communicationDos: [
        "Bring data and a clear recommendation",
        "Be explicit about expectations and standards",
        "Acknowledge the relational impact before driving change",
      ],
      communicationDonts: [
        "Do not skip the rationale to save time",
        "Do not assume silence equals agreement",
        "Avoid over-correcting in front of junior clinicians",
      ],
    },
    values: {
      profileSummary:
        "Your top drivers are Theoretical (evidence and truth-seeking) and Social (service and relationships). This combination is well-suited to clinical leadership in mission-driven hospitals.",
      topThree: [
        { value: "Theoretical", rank: 1, interpretation: "You are energised by understanding root causes and building knowledge." },
        { value: "Social", rank: 2, interpretation: "Service to patients and staff is intrinsically motivating, not performative." },
        { value: "Regulatory", rank: 3, interpretation: "You believe institutions work better when standards are clear and enforced." },
      ],
      healthcareAlignment:
        "These drivers align with quality improvement, clinical governance, and academic medicine. They may strain in environments that prioritise commercial speed over rigour.",
    },
    emotionalIntelligence: {
      profileSummary:
        "Your EQ profile is strongest in Self-Awareness and Emotional Regulation. Empathy and Social Skills are good but not yet defining strengths.",
      dimensions: {
        selfAwareness: { score: 78, interpretation: "You read your own state quickly and adjust." },
        empathy: { score: 71, interpretation: "You attune to others, but may default to problem-solving." },
        socialSkills: { score: 66, interpretation: "You build trust over time rather than instantly." },
        emotionalRegulation: { score: 74, interpretation: "You stay composed under pressure." },
      },
    },
    cilti: {
      profileSummary:
        "Your CILTI profile shows strong clinical identity (88) and developing leadership identity (64). Identity friction is moderate (42), suggesting you are still negotiating the transition.",
      transitionStage: "Mid-transition: clinically anchored, leadership emerging",
    },
    cultureTeam: {
      profileSummary:
        "Your dominant Competing Values quadrant is Control (81), with Collaborate as a strong secondary (76). You build cultures of accountability and care.",
    },
  };

  const existingReport = await prisma.maarovaReport.findUnique({
    where: { sessionId: session.id },
  });

  const reportData = {
    userId: user.id,
    status: "READY" as const,
    overallScore: 74,
    dimensionScores,
    radarChartData,
    leadershipArchetype: "The Anchored Reformer",
    archetypeNarrative:
      "You combine deep clinical authority with disciplined systems thinking. Your hospital relies on you to hold the line on standards while also opening the door to change. The next edge for you is leading from a leadership identity that is as fully formed as your clinical one.",
    signatureStrengths,
    executiveSummary:
      "Dr Adaeze Okafor presents as a clinically anchored leader with strong systems instincts and an evidence-first orientation. The report identifies emergent leadership identity and broader influencing range as the next areas of growth. With targeted coaching, this profile is well-positioned to lead a hospital through a quality transformation.",
    strengthsAnalysis:
      "Across the assessment, three strengths reinforce one another: clinical credibility (CILTI), conscientious execution (DISC), and evidence-driven values. Together, these make Dr Okafor a trusted decision-maker in technical environments.",
    developmentAreas:
      "The development edges concentrate around leadership identity formation and broadening influencing styles. Both are addressable through coaching and structured stretch assignments.",
    nextLeadershipEdge:
      "The next leadership edge is to claim authority in non-clinical strategic conversations with the same confidence currently reserved for clinical decisions.",
    coachingPriorities,
    fullReportContent,
    generatedAt: completedAt,
  };

  let report;
  if (existingReport) {
    report = await prisma.maarovaReport.update({
      where: { id: existingReport.id },
      data: reportData,
    });
  } else {
    report = await prisma.maarovaReport.create({
      data: { ...reportData, sessionId: session.id },
    });
  }
  console.log(`  report:  ${report.id} (${report.status}, archetype="${report.leadershipArchetype}")`);

  console.log(`\nDone.`);
  console.log(`Demo user: ${user.email}`);
  console.log(`Session:   ${session.id}`);
  console.log(`Report:    ${report.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
