/**
 * Create the Havana Specialist Hospital engagement on the C4A platform.
 *
 * Engagement: Board Governance Framework (Board and Committee Enablement).
 * A fixed-fee PROJECT, ~6 weeks, board-approved to proceed (green light from
 * Exec Director Ugo Nwokoro). Net fee N2,000,000 = full professional value
 * N5,000,000 less a N3,000,000 board-partner concession (Debo sits on the HSH
 * board as an independent NED; disclosed in full).
 *
 * Revised payment schedule agreed over WhatsApp / confirmed by Ugo:
 *   N1,000,000 mobilisation, N500,000 at an agreed milestone, N500,000 on completion.
 *
 * Idempotent: removes any prior Havana Specialist Hospital client/engagement
 * before recreating, so it is safe to re-run after edits.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/create-hsh-project.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENT_NAME = "Havana Specialist Hospital Limited";

async function main() {
  console.log("Creating Havana Specialist Hospital engagement...\n");

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
    console.log(`Removed ${existing.length} prior Havana record(s).\n`);
  }

  // ── Client ──────────────────────────────────────────────────────────────
  const client = await prisma.client.create({
    data: {
      name: CLIENT_NAME,
      type: "PRIVATE_MIDTIER",
      primaryContact: "Mr Ugo Nwokoro (Exec. Director); Finance: Mrs Nneka Chukwubuisi Solomon (Head of Finance)",
      email: "info@havanaspecialist.com", // TODO: confirm real billing/contact email (Ugo / Nneka)
      phone: "", // TODO: confirm
      address: "Lagos, Nigeria",
      paymentTerms: 14,
      currency: "NGN",
      status: "ACTIVE",
      creditScore: 4,
      notes:
        "Two-family specialist hospital being placed on a proper corporate-governance footing under an Afya Care " +
        "partnership. Debo sits on the HSH board as an independent non-executive director and CFA adviser; Dennis " +
        "Olisa is interim chair. Board approved the operating model and the Board Governance Framework engagement " +
        "(green light from Exec Director Ugo Nwokoro). Key contacts: Ugo Nwokoro (Exec. Director) and Mrs Nneka " +
        "Chukwubuisi Solomon (Head of Finance, processes payment). Other essential parties to align with: Afya " +
        "Care and Punuka (legal). Framework must be in place ahead of the September 2026 Board meeting. " +
        "TODO: add ClientContact records for Ugo and Nneka once real emails are confirmed.",
    },
  });

  // ── Engagement (fixed-fee PROJECT) ─────────────────────────────────────
  const NET_FEE = 2_000_000; // net of the N3,000,000 board-partner concession
  const engagement = await prisma.engagement.create({
    data: {
      clientId: client.id,
      engagementManagerId: em.id,
      name: "Havana Specialist Hospital Board Governance Framework",
      description:
        "Board and Committee Enablement: turn the adopted board operating model into a working board. Two " +
        "workstreams plus an optional supported first cycle. WS1, board and committee instruments: board pack and " +
        "committee report templates, agendas/minutes/action logs, reporting dashboard and KPI pack, annual " +
        "calendar, finalised delegation-of-authority schedule and committee terms of reference, built with the " +
        "Company Secretary. WS2, capability and training: working sessions for the executive directors and " +
        "management on reporting and escalation discipline, using the instruments, chairing a committee, board " +
        "interaction and fair process, and the Afya interface, plus a Board and Committee Handbook. Optional: " +
        "attend and coach through the first quarter of board and committee meetings. Delivered against a September " +
        "2026 Board meeting deadline; close alignment with Afya Care and Punuka is essential.",
      serviceType: "HEALTH_SYSTEMS", // governance/advisory; no dedicated corporate-governance enum
      engagementType: "PROJECT",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-08-31"), // ~6 weeks, ahead of the September board meeting
      status: "ACTIVE",
      budgetAmount: NET_FEE,
      budgetCurrency: "NGN",
      actualSpent: 0,
      healthScore: 5,
      riskLevel: "LOW",
      budgetSensitivity: "VALUE",
      consultantTierMin: "EXPERIENCED",
      consultantTierMax: "ELITE",
      feeStructure: "MILESTONE_BASED",
      retainerMonthlyFee: null, // optional legal-counsel secondment is billed QUARTERLY (see pricingNotes)
      transformBoardSeat: true, // Debo sits on the HSH board as an independent NED (related-party, disclosed)
      pricingNotes:
        "TRANSPARENT PRICING (full professional value -> board-partner concession -> net).\n" +
        "  WS1 Board and committee instruments:      N2,000,000\n" +
        "  WS2 Capability, training and handbook:    N3,000,000\n" +
        "  Supported first governance cycle:         included\n" +
        "  Full professional value:                  N5,000,000\n" +
        "  Board-partner concession:                (N3,000,000)  (shown in full; Debo on the HSH board)\n" +
        "  Net fee, payable by HSH:                  N2,000,000\n" +
        "Payment (revised schedule confirmed by Ugo): N1,000,000 mobilisation, N500,000 at an agreed milestone, " +
        "N500,000 on completion.\n" +
        "Optional (separate): legal-counsel / board-secretariat secondment from N600,000 per QUARTER, opt-in, " +
        "cancellable, billed separately from this fee.\n" +
        "Fixed fee, no success fee, to keep the related-party position clean. Concession, full value and net fee " +
        "all disclosed to the board and both families; net fee approved by People & Remuneration with Debo recused.",
      notes:
        "Invoice CFA-HSH-2026-001 issued 15 July 2026 for the N1,000,000 mobilisation fee (docs/hsh-invoice-cfa.pdf). " +
        "Payment to Zenith Bank, Consult for Africa Management Services Limited, 1312352157, ref CFA-HSH-2026-001. " +
        "On receipt of mobilisation, CFA mobilises within the week and begins engaging Afya Care and Punuka.",
    },
  });
  console.log(`Created engagement ${engagement.engagementCode ?? engagement.id}\n`);

  // ── Tracks ────────────────────────────────────────────────────────────
  // Net fee (N2,000,000) allocated across the two delivery workstreams pro-rata
  // to full value (2:3); full values noted in each description.
  const tracks = [
    {
      name: "1. Board and Committee Instruments",
      order: 1,
      status: "ACTIVE" as const,
      budgetAmount: 800_000, // net share of the 2/5 of full value
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-08-05"),
      description:
        "Full template and document suite built on the adopted operating model, finalised with the Company " +
        "Secretary: consolidated board pack template; one-page committee report templates for the five board " +
        "committees and the Afya-HSH Governance Committee; agenda/minutes/action-log templates; reporting " +
        "dashboard and KPI pack; rolling 12-month board and committee calendar; finalised delegation-of-authority " +
        "schedule; finalised committee terms of reference. Full professional value N2,000,000.",
    },
    {
      name: "2. Capability, Training & Handbook",
      order: 2,
      status: "OPEN" as const,
      budgetAmount: 1_200_000, // net share of the 3/5 of full value
      startDate: new Date("2026-07-28"),
      endDate: new Date("2026-08-31"),
      description:
        "Practical working sessions for the executive directors and management: the govern-vs-manage distinction " +
        "and what each committee is for; reporting and escalation discipline; hands-on use of the board pack, " +
        "committee reports, dashboards and action logs; chairing a committee (time, debate, decisions, recusals); " +
        "board interaction and fair process in a two-family board; and the Afya interface. Leaves behind a concise " +
        "Board and Committee Handbook. Full professional value N3,000,000.",
    },
    {
      name: "3. Supported First Governance Cycle (included)",
      order: 3,
      status: "OPEN" as const,
      budgetAmount: null,
      startDate: null,
      endDate: null,
      description:
        "Included. CFA attends and quietly coaches through the first quarter of board and committee meetings, " +
        "refining the templates against real use and giving each committee chair light, private feedback, so the " +
        "model is embedded rather than just launched.",
    },
    {
      name: "4. Legal-Counsel / Board-Secretariat Secondment (optional)",
      order: 4,
      status: "OPEN" as const,
      budgetAmount: null,
      startDate: null,
      endDate: null,
      description:
        "OPTIONAL, billed separately. CFA seconds a qualified legal practitioner to hold the board-secretariat " +
        "and in-house governance/legal function (board administration, minutes and registers, delegation-of-" +
        "authority, compliance, contract and related-party support). Indicative retainer from N600,000 per " +
        "quarter, part-time scope, cancellable. Gives HSH a professional governance owner immediately while it " +
        "decides on a permanent appointment.",
    },
  ];

  for (const t of tracks) {
    await prisma.engagementTrack.create({
      data: { engagementId: engagement.id, budgetCurrency: "NGN", ...t },
    });
  }
  console.log(`Created ${tracks.length} workstream tracks.\n`);

  // ── Key milestones + deliverables ──────────────────────────────────────
  const mInstruments = await prisma.milestone.create({
    data: {
      engagementId: engagement.id,
      name: "Board & Committee Instruments Finalised",
      description:
        "Full template and document suite finalised with the Company Secretary: board pack, committee report " +
        "templates, agendas/minutes/action logs, dashboard and KPI pack, annual calendar, delegation-of-authority " +
        "schedule and committee terms of reference.",
      dueDate: new Date("2026-08-05"),
      status: "PENDING",
      order: 1,
    },
  });
  const mHandover = await prisma.milestone.create({
    data: {
      engagementId: engagement.id,
      name: "Training Delivered & Handover Complete",
      description:
        "Executive directors and management trained on running board and committee interactions; Board and " +
        "Committee Handbook delivered; system handed over to the Company Secretary ahead of the September Board meeting.",
      dueDate: new Date("2026-08-31"),
      status: "PENDING",
      order: 2,
    },
  });

  const deliverables = [
    {
      milestoneId: mInstruments.id,
      name: "Board Pack & Committee Report Templates",
      description:
        "Consolidated board pack template plus one-page committee report templates for the five board committees " +
        "and the Afya-HSH Governance Committee, on a common format.",
      dueDate: new Date("2026-08-05"),
    },
    {
      milestoneId: mInstruments.id,
      name: "Annual Calendar, Finalised DoA Schedule & Committee ToRs",
      description:
        "Rolling 12-month board and committee calendar, the delegation-of-authority schedule finalised with the " +
        "board, and the committee terms of reference finalised from the prepared drafts.",
      dueDate: new Date("2026-08-05"),
    },
    {
      milestoneId: mInstruments.id,
      name: "Reporting Dashboard & KPI Pack",
      description:
        "Standing management and performance dashboard that feeds the board by exception, with agenda, minutes " +
        "and action-log templates standardised across the board and committees.",
      dueDate: new Date("2026-08-05"),
    },
    {
      milestoneId: mHandover.id,
      name: "Board & Committee Handbook",
      description:
        "Concise reference the directors and Company Secretary keep and reuse, covering the operating model, " +
        "reporting discipline, chairing, board interaction and fair process, and the Afya interface.",
      dueDate: new Date("2026-08-31"),
    },
    {
      milestoneId: mHandover.id,
      name: "Director & Management Training Sessions",
      description:
        "Delivered working sessions for the executive directors and management on reporting, using the " +
        "instruments, chairing, and board interaction, using HSH's own templates and real agenda items.",
      dueDate: new Date("2026-08-31"),
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
  console.log(`Created 2 milestones, ${deliverables.length} deliverables.\n`);

  // ── Payment schedule (revised: 1,000,000 / 500,000 / 500,000) ──────────
  const payments = [
    { name: "Mobilisation (invoice CFA-HSH-2026-001)", amount: 1_000_000, dueDate: new Date("2026-07-15") },
    { name: "Agreed project milestone", amount: 500_000, dueDate: new Date("2026-08-08") },
    { name: "Completion of engagement", amount: 500_000, dueDate: new Date("2026-08-31") },
  ];
  for (const p of payments) {
    await prisma.paymentMilestone.create({
      data: { engagementId: engagement.id, currency: "NGN", status: "PENDING", ...p },
    });
  }
  console.log(`Created ${payments.length} payment milestones (mobilisation + milestone + completion).\n`);

  console.log("=".repeat(60));
  console.log("Havana Specialist Hospital created.");
  console.log("  Type:        PROJECT (HEALTH_SYSTEMS, board governance)");
  console.log("  Status:      ACTIVE");
  console.log("  Net fee:     N2,000,000 (full value N5,000,000, N3,000,000 concession)");
  console.log("  Schedule:    N1,000,000 mobilisation / N500,000 milestone / N500,000 completion");
  console.log("  Tracks:      4  |  Milestones: 2  |  Deliverables: 5");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
