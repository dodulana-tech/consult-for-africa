/**
 * Create the Haven Paediatric Centre engagement on the C4A platform.
 *
 * Structure: one TRANSFORMATION engagement (board-led operational turnaround
 * and culture build) with five workstream tracks. Tracks 1-4 are the core
 * fixed-fee project; track 5 is the optional ongoing board-oversight retainer.
 *
 * Pricing is fully transparent: standard CFA rates with a single visible
 * 40% partner discount line. budgetAmount reflects the NET (discounted)
 * core project value; the optional retainer is captured separately.
 *
 * Idempotent: removes any prior Haven Paediatric Centre client/engagement
 * before recreating, so it is safe to re-run after edits.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/create-haven-project.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENT_NAME = "Haven Paediatric Centre";

async function main() {
  console.log("Creating Haven Paediatric Centre engagement...\n");

  const em = await prisma.user.findFirst({
    where: { role: { in: ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"] } },
  });
  if (!em) {
    console.error("No admin/partner/director user found. Seed a user first.");
    return;
  }
  console.log(`Engagement manager: ${em.name} (${em.email})\n`);

  // ── Idempotent cleanup ──────────────────────────────────────────────────
  const existing = await prisma.client.findMany({
    where: { name: CLIENT_NAME },
    select: { id: true },
  });
  if (existing.length > 0) {
    const clientIds = existing.map((c) => c.id);
    const projects = await prisma.engagement.findMany({
      where: { clientId: { in: clientIds } },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length > 0) {
      await prisma.deliverable.deleteMany({ where: { engagementId: { in: projectIds } } });
      await prisma.milestone.deleteMany({ where: { engagementId: { in: projectIds } } });
      await prisma.paymentMilestone.deleteMany({ where: { engagementId: { in: projectIds } } });
      await prisma.engagementTrack.deleteMany({ where: { engagementId: { in: projectIds } } });
      await prisma.assignment.deleteMany({ where: { engagementId: { in: projectIds } } });
      await prisma.engagement.deleteMany({ where: { id: { in: projectIds } } });
    }
    await prisma.clientContact.deleteMany({ where: { clientId: { in: clientIds } } });
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
    console.log(`Removed ${existing.length} prior Haven record(s).\n`);
  }

  // ── Client ──────────────────────────────────────────────────────────────
  const client = await prisma.client.create({
    data: {
      name: CLIENT_NAME,
      type: "PRIVATE_MIDTIER",
      primaryContact: "Kabir Aregbesola",
      email: "info@havenpaediatric.com", // TODO: confirm real contact email
      phone: "+234 817 777 7753", // Kabir Aregbesola
      address: "GRA Ikeja, Lagos, Nigeria",
      paymentTerms: 30,
      currency: "NGN",
      status: "ACTIVE",
      creditScore: 4,
      notes:
        "5-bed general paediatrics + 3-bed NICU facility in GRA Ikeja, ~15 months old. " +
        "Owners: Dr Shakira Saliu (Aregbesola), Kabir Aregbesola, and Dr Odedina (consultant neonatologist). " +
        "Debo invited to Haven's board from inception (board not yet formally constituted; he does not formally sit on it). " +
        "First patient mortality recorded May 2026 (crash-cart " +
        "medication unavailable during paediatric resuscitation). Leadership has requested CFA support on " +
        "operational optimisation, culture, and growth.",
    },
  });

  // ── Engagement (TRANSFORMATION) ────────────────────────────────────────
  const NET_PROJECT = 10_200_000; // discounted core project value (tracks 1-4)
  const engagement = await prisma.engagement.create({
    data: {
      clientId: client.id,
      engagementManagerId: em.id,
      name: "Haven Paediatric Centre Operational Turnaround & Culture Build",
      description:
        "Board-led operational turnaround for a 5+3 bed paediatric/NICU facility. The engaging insight: the " +
        "facility's first mortality (crash-cart medication unavailable) was a symptom of an unestablished " +
        "safety culture and unaligned incentives, not an isolated stockout. Scope, across five workstreams: " +
        "(1) a detailed diagnostic audit; (2) culture, incentives and clinical standards of work, including " +
        "the staff commission structure and JDS/KPIs already on the board's decision list; (3) business " +
        "process reengineering and operations (procurement/vendor-managed inventory, receivables recovery, " +
        "management reporting); (4) revenue and growth optimisation (NICU activation, pricing review, " +
        "corporate and HMO tie-ups); and (5) optional ongoing board-level management oversight. CFA also " +
        "advised recruiting a senior operations leader to run the facility, sourced via CadreHealth.",
      serviceType: "HOSPITAL_OPERATIONS",
      engagementType: "TRANSFORMATION",
      startDate: new Date("2026-06-11"),
      endDate: new Date("2026-12-31"),
      status: "PLANNING",
      budgetAmount: NET_PROJECT,
      budgetCurrency: "NGN",
      actualSpent: 0,
      healthScore: 5,
      riskLevel: "MEDIUM",
      budgetSensitivity: "VALUE",
      consultantTierMin: "EXPERIENCED",
      consultantTierMax: "ELITE",
      feeStructure: "HYBRID",
      retainerMonthlyFee: 600_000, // optional board-oversight retainer (net of 40% discount)
      transformBoardSeat: false, // Debo invited to Haven's board but does not formally hold a seat
      pricingNotes:
        "TRANSPARENT PRICING (standard CFA rates -> 40% partner discount -> net).\n" +
        "Core project (tracks 1-4):\n" +
        "  T1 Diagnostic audit:                 N3,500,000 -> N2,100,000\n" +
        "  T2 Culture, incentives & standards:  N5,000,000 -> N3,000,000\n" +
        "  T3 Process reengineering & ops:      N4,000,000 -> N2,400,000\n" +
        "  T4 Revenue & growth optimisation:    N4,500,000 -> N2,700,000\n" +
        "  Core subtotal:                      N17,000,000 -> N10,200,000  (N6.8M concession shown in full)\n" +
        "Optional ongoing (track 5):\n" +
        "  Board-level oversight, 2 days/month: N1,000,000/mo -> N600,000/mo (priced to senior-partner value; opt-in)\n" +
        "Payment: mobilisation N2,100,000 on signing, then balance N8,100,000 over 5 equal monthly installments of N1,620,000.\n" +
        "Clean fixed-fee + retainer only. No success fee, to keep related-party optics clean.",
      notes:
        "Related-party context: Debo has been invited to Haven's board (not yet formally constituted) and CFA " +
        "would be a paid partner. Pricing and discount fully disclosed to all " +
        "owners. Quick wins targeted in first fortnight: crash-cart standard + shift checklist, and recovery " +
        "of ~N4.2M in HMO receivables (Leadway + NEM) that roughly equals a full period's revenue.",
    },
  });
  console.log(`Created engagement ${engagement.engagementCode ?? engagement.id}\n`);

  // ── Tracks ────────────────────────────────────────────────────────────
  const tracks = [
    {
      name: "1. Diagnostic Audit",
      order: 1,
      status: "ACTIVE" as const,
      budgetAmount: 2_100_000,
      startDate: new Date("2026-06-11"),
      endDate: new Date("2026-07-11"),
      description:
        "Four-week detailed audit across clinical governance, operations and SOP adherence, finance and " +
        "working capital (receivables ageing, stock), procurement and inventory, HMO contract economics " +
        "(private vs HMO yield), staffing ratio, and the management reporting layer (the current report does " +
        "not reconcile: visit-type counts vs total encounters, and the receivables table total). Standard rate " +
        "N3,500,000; net N2,100,000.",
    },
    {
      name: "2. Culture, Incentives & Clinical Standards of Work",
      order: 2,
      status: "OPEN" as const,
      budgetAmount: 3_000_000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-10-31"),
      description:
        "The spine of the engagement. Establish the safety culture and shift-level routines whose absence " +
        "caused the mortality (crash-cart checks, nursing standards of work, immunisation follow-up discipline). " +
        "Redesign incentives: the staff commission structure and JDS/KPIs already awaiting board approval. " +
        "Ownership culture is the root cause behind both the clinical lapse and the thin margins. Standard rate " +
        "N5,000,000; net N3,000,000.",
    },
    {
      name: "3. Process Reengineering & Operations",
      order: 3,
      status: "OPEN" as const,
      budgetAmount: 2_400_000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-10-31"),
      description:
        "Reengineer core operations: procurement and vendor-managed inventory (recommend engaging Medbury " +
        "Pharma) to end stockouts and lift pharmacy margin; receivables recovery process for Leadway/NEM; a " +
        "reliable management reporting layer. Stockouts that kill and stockouts that erode margin are the same " +
        "broken process. Standard rate N4,000,000; net N2,400,000.",
    },
    {
      name: "4. Revenue & Growth Optimisation",
      order: 4,
      status: "OPEN" as const,
      budgetAmount: 2_700_000,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-31"),
      description:
        "Internal and external growth. NICU activation is the highest-yield lever (N3M deposit per admission, " +
        "3 beds) and is only safe once governance is established, so it ties directly to track 2. Pricing review, " +
        "pharmacy attach, HMO yield, corporate tie-ups, school partnerships (e.g. Toddler Town), and referral " +
        "pipeline. Standard rate N4,500,000; net N2,700,000.",
    },
    {
      name: "5. Board-Level Management Oversight (optional retainer)",
      order: 5,
      status: "OPEN" as const,
      budgetAmount: null,
      startDate: null,
      endDate: null,
      description:
        "OPTIONAL ongoing retainer. Up to 2 days per month of partner-level management oversight (Debo or a " +
        "delegate), priced to senior-partner value: standard N1,000,000/month, net N600,000/month after the " +
        "40% discount. Provided as opt-in optionality alongside the core project, ideally starting after BPR. " +
        "Pairs with CFA's recommendation to recruit a senior operations leader (sourced via CadreHealth).",
    },
  ];

  for (const t of tracks) {
    await prisma.engagementTrack.create({
      data: { engagementId: engagement.id, budgetCurrency: "NGN", ...t },
    });
  }
  console.log(`Created ${tracks.length} workstream tracks.\n`);

  // ── Key milestones + deliverables ──────────────────────────────────────
  const mAudit = await prisma.milestone.create({
    data: {
      engagementId: engagement.id,
      name: "Diagnostic Audit Complete",
      description:
        "Detailed operational, clinical-governance, financial and cultural audit delivered to the board.",
      dueDate: new Date("2026-07-11"),
      status: "PENDING",
      order: 1,
    },
  });
  const mCulture = await prisma.milestone.create({
    data: {
      engagementId: engagement.id,
      name: "Culture, Incentives & Standards Established",
      description:
        "Safety culture, clinical standards of work, redesigned commission structure and JDS/KPIs in place.",
      dueDate: new Date("2026-10-31"),
      status: "PENDING",
      order: 2,
    },
  });
  const mGrowth = await prisma.milestone.create({
    data: {
      engagementId: engagement.id,
      name: "Revenue & Growth Plan Activated",
      description: "NICU activation, pricing and corporate/HMO tie-ups underway; reporting layer live.",
      dueDate: new Date("2026-12-31"),
      status: "PENDING",
      order: 3,
    },
  });

  const deliverables = [
    {
      milestoneId: mAudit.id,
      name: "Operational & Clinical Governance Audit Report",
      description:
        "Findings across clinical governance, operations, finance, working capital, procurement, HMO " +
        "economics, staffing and reporting integrity, with prioritised recommendations.",
      dueDate: new Date("2026-07-11"),
    },
    {
      milestoneId: mAudit.id,
      name: "Working Capital & Receivables Recovery Plan",
      description:
        "Plan to unlock ~N7M tied in stock and receivables, with an immediate Leadway/NEM recovery push (~N4.2M).",
      dueDate: new Date("2026-07-11"),
    },
    {
      milestoneId: mCulture.id,
      name: "Clinical Standards of Work & Safety Culture Playbook",
      description:
        "Shift-level routines, crash-cart standard and checklist, nursing standards of work, and safety huddle cadence.",
      dueDate: new Date("2026-09-30"),
    },
    {
      milestoneId: mCulture.id,
      name: "Incentive & Performance Framework (Commission, JDS, KPIs)",
      description:
        "Redesigned staff commission structure and job descriptions/KPIs, aligned to quality and ownership.",
      dueDate: new Date("2026-10-31"),
    },
    {
      milestoneId: mGrowth.id,
      name: "Revenue & Growth Blueprint",
      description:
        "NICU activation plan, pricing review, pharmacy attach, HMO yield, corporate tie-ups and referral pipeline.",
      dueDate: new Date("2026-12-15"),
    },
  ];

  for (const d of deliverables) {
    await prisma.deliverable.create({
      data: {
        engagementId: engagement.id,
        status: "DRAFT",
        reviewStage: "DRAFT",
        clientVisible: false,
        ...d,
      },
    });
  }
  console.log(`Created 3 milestones, ${deliverables.length} deliverables.\n`);

  // ── Payment schedule (mobilisation upfront, balance monthly) ───────────
  const payments = [
    { name: "Mobilisation (diagnostic audit, on signing)", amount: 2_100_000, dueDate: new Date("2026-06-11") },
    { name: "Monthly installment 1 of 5", amount: 1_620_000, dueDate: new Date("2026-07-11") },
    { name: "Monthly installment 2 of 5", amount: 1_620_000, dueDate: new Date("2026-08-11") },
    { name: "Monthly installment 3 of 5", amount: 1_620_000, dueDate: new Date("2026-09-11") },
    { name: "Monthly installment 4 of 5", amount: 1_620_000, dueDate: new Date("2026-10-11") },
    { name: "Monthly installment 5 of 5", amount: 1_620_000, dueDate: new Date("2026-11-11") },
  ];
  for (const p of payments) {
    await prisma.paymentMilestone.create({
      data: { engagementId: engagement.id, currency: "NGN", status: "PENDING", ...p },
    });
  }
  console.log(`Created ${payments.length} payment milestones (mobilisation + 5 monthly).\n`);

  console.log("=".repeat(60));
  console.log("Haven Paediatric Centre created.");
  console.log("  Type:        TRANSFORMATION (HOSPITAL_OPERATIONS)");
  console.log("  Status:      PLANNING");
  console.log("  Core budget: N10,200,000 (standard N17,000,000, 40% discount)");
  console.log("  Retainer:    N600,000/month optional (standard N1,000,000)");
  console.log("  Tracks:      5  |  Milestones: 3  |  Deliverables: 5");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
