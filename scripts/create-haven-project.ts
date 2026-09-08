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
 * The delivery plan is granular: one milestone per checkable step, each with
 * an explicit completion test, dated as a week offset from KICKOFF so the whole
 * plan re-baselines from a single date when the signature slips.
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

/**
 * Week zero of the engagement: the signing date the proposal is written
 * against. Every milestone below is expressed as a week offset from here, so
 * re-baselining the whole plan after a later signature is a one-line change
 * (or a HAVEN_KICKOFF=YYYY-MM-DD env var on the re-run).
 */
const KICKOFF = new Date(process.env.HAVEN_KICKOFF ?? "2026-06-11");

/** End of week `n`, counted from KICKOFF. week(0) is the kickoff itself. */
function week(n: number): Date {
  const d = new Date(KICKOFF);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d;
}

/** The same day-of-month, `n` months after KICKOFF. Used for billing dates. */
function month(n: number): Date {
  const d = new Date(KICKOFF);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

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
      startDate: KICKOFF,
      endDate: week(28), // 26-week plan plus a two-week close-out buffer
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
  const trackSpecs = [
    {
      order: 1,
      name: "1. Diagnostic Audit",
      status: "ACTIVE" as const,
      budgetAmount: 2_100_000,
      fromWeek: 0,
      toWeek: 4,
      description:
        "Four-week detailed audit across clinical governance, operations and SOP adherence, finance and " +
        "working capital (receivables ageing, stock), procurement and inventory, HMO contract economics " +
        "(private vs HMO yield), staffing ratio, and the management reporting layer (the current report does " +
        "not reconcile: visit-type counts vs total encounters, and the receivables table total). Standard rate " +
        "N3,500,000; net N2,100,000.",
    },
    {
      order: 2,
      name: "2. Culture, Incentives & Clinical Standards of Work",
      status: "OPEN" as const,
      budgetAmount: 3_000_000,
      fromWeek: 3,
      toWeek: 20,
      description:
        "The spine of the engagement. Establish the safety culture and shift-level routines whose absence " +
        "caused the mortality (crash-cart checks, nursing standards of work, immunisation follow-up discipline). " +
        "Redesign incentives: the staff commission structure and JDS/KPIs already awaiting board approval. " +
        "Ownership culture is the root cause behind both the clinical lapse and the thin margins. Standard rate " +
        "N5,000,000; net N3,000,000.",
    },
    {
      order: 3,
      name: "3. Process Reengineering & Operations",
      status: "OPEN" as const,
      budgetAmount: 2_400_000,
      fromWeek: 4,
      toWeek: 18,
      description:
        "Reengineer core operations: procurement and vendor-managed inventory (recommend engaging Medbury " +
        "Pharma) to end stockouts and lift pharmacy margin; receivables recovery process for Leadway/NEM; a " +
        "reliable management reporting layer. Stockouts that kill and stockouts that erode margin are the same " +
        "broken process. Standard rate N4,000,000; net N2,400,000.",
    },
    {
      order: 4,
      name: "4. Revenue & Growth Optimisation",
      status: "OPEN" as const,
      budgetAmount: 2_700_000,
      fromWeek: 8,
      toWeek: 26,
      description:
        "Internal and external growth. NICU activation is the highest-yield lever (N3M deposit per admission, " +
        "3 beds) and is only safe once governance is established, so it is gated on track 2. Pricing review, " +
        "pharmacy attach, HMO yield, corporate tie-ups, school partnerships (e.g. Toddler Town), and referral " +
        "pipeline. Standard rate N4,500,000; net N2,700,000.",
    },
    {
      order: 5,
      name: "5. Board-Level Management Oversight (optional retainer)",
      status: "OPEN" as const,
      budgetAmount: null,
      fromWeek: null,
      toWeek: null,
      description:
        "OPTIONAL ongoing retainer. Up to 2 days per month of partner-level management oversight (Debo or a " +
        "delegate), priced to senior-partner value: standard N1,000,000/month, net N600,000/month after the " +
        "40% discount. Provided as opt-in optionality alongside the core project, ideally starting after BPR. " +
        "Also carries the recruitment of the senior operations leader (sourced via CadreHealth) and the " +
        "close-out handover.",
    },
  ];

  const trackIdByOrder = new Map<number, string>();
  for (const { fromWeek, toWeek, ...t } of trackSpecs) {
    const track = await prisma.engagementTrack.create({
      data: {
        engagementId: engagement.id,
        budgetCurrency: "NGN",
        startDate: fromWeek === null ? null : week(fromWeek),
        endDate: toWeek === null ? null : week(toWeek),
        ...t,
      },
    });
    trackIdByOrder.set(t.order, track.id);
  }
  console.log(`Created ${trackSpecs.length} workstream tracks.\n`);

  // ── Granular milestone plan ────────────────────────────────────────────
  // One milestone per checkable step, each with an explicit completion test,
  // so progress is evidenced rather than asserted. `week` is the week the
  // milestone is due, counted from KICKOFF. Deliverables hang off the
  // milestone that produces them and inherit its track.
  type MilestoneSpec = {
    track: number;
    name: string;
    week: number;
    description: string;
    deliverables?: { name: string; description: string; week?: number }[];
  };

  const milestonePlan: MilestoneSpec[] = [
    // ── Workstream 1: diagnostic audit (weeks 1-4) ───────────────────────
    {
      track: 1,
      name: "1.1 Engagement mobilised",
      week: 1,
      description:
        "Done when: Haven has named a point person (we suggest the Head of Operations), the week-one data " +
        "request is issued and acknowledged, the interview schedule with leadership and the nursing, pharmacy " +
        "and customer-service leads is locked, the facility walkthrough is complete, and read access is granted " +
        "to financial records, pharmacy stock data, HMO contracts, the staff roster and JDs, clinical incident " +
        "records and existing SOPs.",
    },
    {
      track: 1,
      name: "1.2 Crash-cart standard live",
      week: 1,
      description:
        "Quick win, delivered during the audit rather than after it. Done when: the cart is stocked to an agreed " +
        "paediatric drug and equipment list, sealed with a numbered tag, governed by a shift-level check sheet, " +
        "and seven consecutive days of completed checks are on file.",
      deliverables: [
        {
          name: "Crash-Cart Standard & Shift Check Sheet",
          description:
            "Agreed contents list, seal-and-check protocol, shift check sheet, and the escalation route when an " +
            "item is missing or expired.",
        },
      ],
    },
    {
      track: 1,
      name: "1.3 Receivables recovery push opened",
      week: 2,
      description:
        "Quick win: cash starts moving before the audit reports. Done when: Leadway and NEM statements are " +
        "reconciled to Haven's ledger, an agreed ageing position exists for the ~N4.2M, rejected and unsubmitted " +
        "claims are identified and resubmitted, and a named owner is holding a weekly recovery call.",
      deliverables: [
        {
          name: "HMO Receivables Reconciliation & Recovery Tracker",
          description:
            "Payer-by-payer reconciliation of the ~N4.2M balance, rejection reasons, resubmission status, and a " +
            "live tracker with owners and expected collection dates.",
        },
      ],
    },
    {
      track: 1,
      name: "1.4 Clinical governance and safety diagnostic complete",
      week: 2,
      description:
        "Done when: the May mortality has been reviewed to root cause, emergency readiness is assessed against an " +
        "agreed standard, clinical protocols and NICU readiness are reviewed, and the staff safety-culture survey " +
        "is fielded and analysed at a response rate the board can rely on.",
    },
    {
      track: 1,
      name: "1.5 Culture, routines and incentives diagnostic complete",
      week: 3,
      description:
        "Done when: frontline interviews are complete across nursing, pharmacy and customer service, the " +
        "safety-culture and patient-experience survey results are analysed, and the draft commission structure " +
        "and JDS/KPIs sitting on the board's decision list are assessed against what they actually reward.",
    },
    {
      track: 1,
      name: "1.6 Operations and SOP walkthrough complete",
      week: 3,
      description:
        "Done when: patient flow is mapped end to end from booking to discharge, and a gap register names every " +
        "material difference between the documented SOP and observed practice, with an owner against each.",
      deliverables: [
        {
          name: "SOP vs Practice Gap Register",
          description:
            "Every documented SOP set against what actually happens on the floor, with severity, owner and the " +
            "fix that closes it.",
        },
      ],
    },
    {
      track: 1,
      name: "1.7 Finance, working capital and HMO economics diagnostic complete",
      week: 3,
      description:
        "Done when: revenue mix and yield per private versus HMO patient are quantified, true pharmacy margin " +
        "(not the 201 percent markup the report currently shows) is established on the ~N2.77M of stock, the " +
        "~N4.2M receivables are aged by payer, HMO contract terms and claim rejection reasons are documented, " +
        "and every reconciliation break in the fortnightly report is identified.",
    },
    {
      track: 1,
      name: "1.8 Audit reported to the board",
      week: 4,
      description:
        "The gate into the rest of the engagement. Done when: the audit report and the working-capital and " +
        "receivables recovery plan are presented in a board working session, recommendations are prioritised and " +
        "costed, and the board has signed off the sequence and detail of workstreams 2 to 4.",
      deliverables: [
        {
          name: "Operational & Clinical Governance Audit Report",
          description:
            "Findings across clinical governance, operations, finance, working capital, procurement, HMO " +
            "economics, staffing and reporting integrity, with prioritised, costed recommendations.",
        },
        {
          name: "Working Capital & Receivables Recovery Plan",
          description:
            "Plan to unlock the ~N7M tied up in stock and receivables, building on the Leadway/NEM push already " +
            "running from week two.",
        },
        {
          name: "Senior Operations Leader Role Specification & KPIs",
          description:
            "The role defined off the audit findings so the hire lands into clarity rather than chaos: remit, " +
            "reporting line, KPIs, and the profile to brief CadreHealth with.",
        },
      ],
    },

    // ── Workstream 2: culture, incentives, standards (weeks 5-20) ────────
    {
      track: 2,
      name: "2.1 Shift-level safety routines running",
      week: 6,
      description:
        "The routine whose absence caused the mortality, made habit. Done when: crash cart, emergency equipment, " +
        "oxygen and resuscitation checks sit on a signed shift checklist across every shift, and spot audits find " +
        "compliance above 90 percent for four consecutive weeks.",
    },
    {
      track: 2,
      name: "2.2 Nursing standards of work published and trained out",
      week: 9,
      description:
        "Done when: standards of work exist for admission, observation and escalation, medication administration, " +
        "handover and discharge; every nurse has been trained against them and has signed off; and the first " +
        "adherence audit is complete with results reported to leadership.",
      deliverables: [
        {
          name: "Clinical Standards of Work Playbook",
          description:
            "Nursing standards of work, shift-level routines, escalation thresholds and the audit method that " +
            "keeps them honest.",
        },
      ],
    },
    {
      track: 2,
      name: "2.3 Safety huddle and incident reporting cadence embedded",
      week: 11,
      description:
        "Done when: a daily huddle runs to a fixed agenda, a no-blame incident reporting route is in use and " +
        "producing reports, and a fortnightly mortality and morbidity review has met at least three times with " +
        "actions closed out from its own log.",
      deliverables: [
        {
          name: "Safety Huddle & Incident Reporting Protocol",
          description:
            "Huddle agenda and cadence, incident reporting route and triage, and the M&M review terms of " +
            "reference with an action log.",
        },
      ],
    },
    {
      track: 2,
      name: "2.4 Staff commission structure approved",
      week: 13,
      description:
        "Done when: the redesigned commission structure is modelled against payroll cost, back-tested on the last " +
        "two reporting periods, approved by the board, and communicated to staff with worked examples. It must " +
        "reward quality and ownership, not activity alone.",
      deliverables: [
        {
          name: "Staff Commission Structure (board pack)",
          description:
            "Redesigned commission model, cost modelling and back-test, board decision paper, and the staff " +
            "communication pack.",
        },
      ],
    },
    {
      track: 2,
      name: "2.5 Job descriptions and KPIs live",
      week: 16,
      description:
        "Done when: every role has a job description and no more than five KPIs, each with a data source that " +
        "already exists in the reporting layer; line managers have run one full review cycle; and the outputs " +
        "feed the fortnightly management pack.",
      deliverables: [
        {
          name: "Job Descriptions & KPI Framework",
          description:
            "JDs and KPIs for every role, aligned to quality and ownership, with the review cadence and the " +
            "reporting hooks that make them measurable.",
        },
      ],
    },
    {
      track: 2,
      name: "2.6 Safety culture re-measured against baseline",
      week: 20,
      description:
        "The proof that the culture work took. Done when: the staff safety-culture survey is re-run at a " +
        "comparable response rate and reported against the week-two baseline, with a named action on every " +
        "dimension that has not moved.",
      deliverables: [
        {
          name: "Safety Culture Re-measurement Report",
          description:
            "Re-run survey results set against the audit baseline, dimension by dimension, with actions where " +
            "the shift has not happened.",
        },
      ],
    },

    // ── Workstream 3: process reengineering and operations (weeks 6-18) ──
    {
      track: 3,
      name: "3.1 Vendor-managed inventory agreed",
      week: 10,
      description:
        "Done when: terms are agreed with Medbury Pharma (or a benchmarked alternative), a critical-items list " +
        "with min/max levels is signed off, replenishment cadence and stockout escalation are documented, and the " +
        "commercial case sets out the margin and working-capital effect.",
      deliverables: [
        {
          name: "Vendor-Managed Inventory Agreement & Critical Items List",
          description:
            "Supplier terms, critical-items list with min/max levels, replenishment and escalation protocol, and " +
            "the commercial case behind the model.",
        },
      ],
    },
    {
      track: 3,
      name: "3.2 Management reporting layer live and reconciling",
      week: 12,
      description:
        "You cannot manage what you cannot measure reliably. Done when: a single fortnightly pack is produced by " +
        "Haven rather than by CFA; visit-type counts reconcile to total encounters; the receivables table foots; " +
        "pharmacy performance is reported as margin, not markup; and two consecutive packs have passed review " +
        "without correction.",
      deliverables: [
        {
          name: "Fortnightly Management Reporting Pack",
          description:
            "The template, the definitions behind every number, the reconciliation checks that must pass before " +
            "issue, and the first live pack produced by Haven.",
        },
      ],
    },
    {
      track: 3,
      name: "3.3 Receivables process institutionalised and cash recovered",
      week: 14,
      description:
        "Done when: claims are submitted within an agreed SLA of discharge, ageing is reviewed on a fixed cadence " +
        "with an escalation ladder, and at least N4.2M of the opening receivables balance has been collected.",
      deliverables: [
        {
          name: "Receivables Management Process",
          description:
            "Claim submission SLA, documentation standard, ageing review cadence, escalation ladder by payer, and " +
            "the ownership map that keeps it running without CFA.",
        },
      ],
    },
    {
      track: 3,
      name: "3.4 Vendor-managed inventory live",
      week: 15,
      description:
        "Done when: replenishment is running under the VMI agreement and no critical item has stocked out for 30 " +
        "consecutive days. This is the milestone that closes the failure mode behind the mortality.",
    },
    {
      track: 3,
      name: "3.5 Pharmacy and procurement economics improved",
      week: 18,
      description:
        "Done when: true pharmacy margin is measured on the new basis and has improved against the week-three " +
        "baseline, stock days are down, and the working capital released from the ~N2.77M of stock is quantified " +
        "in the management pack.",
    },

    // ── Workstream 4: revenue and growth (weeks 12-26) ───────────────────
    {
      track: 4,
      name: "4.1 NICU activation cleared to proceed",
      week: 14,
      description:
        "A hard gate, not a formality. Done when: milestones 2.1 and 2.3 are complete, NICU staffing, equipment " +
        "and escalation protocols meet the agreed readiness standard, and the board formally clears growth in " +
        "admissions. No activity that grows NICU volume starts before this gate clears.",
      deliverables: [
        {
          name: "NICU Activation Readiness Standard & Sign-off",
          description:
            "The readiness standard NICU must meet before admissions are grown: staffing, equipment, protocols, " +
            "escalation, and the board sign-off record.",
        },
      ],
    },
    {
      track: 4,
      name: "4.2 Pricing and deposit policy implemented",
      week: 16,
      description:
        "Done when: the price list is rebuilt against cost and yield, deposit and payment policy is set (including " +
        "the N3M NICU admission deposit), the change is communicated to staff and patients, and the first " +
        "period's realised yield is measured against the model.",
      deliverables: [
        {
          name: "Pricing & Deposit Policy",
          description:
            "Rebuilt price list with the cost and yield basis behind it, deposit and payment terms, and the " +
            "communication pack.",
        },
      ],
    },
    {
      track: 4,
      name: "4.3 HMO yield actions concluded",
      week: 20,
      description:
        "Done when: every HMO contract has been renegotiated, repriced or exited on an explicit board decision, " +
        "and blended yield per encounter is measured against the week-three baseline.",
      deliverables: [
        {
          name: "HMO Contract Review & Yield Model",
          description:
            "Contract-by-contract terms, claims and ageing behaviour, yield per encounter versus private, and the " +
            "renegotiate / reprice / exit recommendation for each.",
        },
      ],
    },
    {
      track: 4,
      name: "4.4 NICU occupancy building safely",
      week: 22,
      description:
        "The engagement's highest-yield lever, taken only once it is safe to take. Done when: NICU admissions are " +
        "running against the governance standard with no safety escalation attributable to readiness, and " +
        "occupancy across the three beds is trending to the agreed target.",
    },
    {
      track: 4,
      name: "4.5 Corporate, school and referral pipeline live",
      week: 22,
      description:
        "Done when: the Toddler Town relationship is formalised, at least two further corporate or school tie-ups " +
        "are signed, and referrals are tracked to source in the fortnightly management pack.",
    },
    {
      track: 4,
      name: "4.6 Growth blueprint delivered",
      week: 24,
      description:
        "Done when: the twelve-month growth plan is delivered to the board with owners, targets and the reporting " +
        "line that tracks it after CFA steps back.",
      deliverables: [
        {
          name: "Revenue & Growth Blueprint",
          description:
            "NICU activation plan, pricing, pharmacy attach, HMO yield, corporate and school tie-ups and the " +
            "referral pipeline, with a twelve-month target set and owners against each.",
        },
      ],
    },

    // ── Cross-cutting and close-out ──────────────────────────────────────
    {
      track: 5,
      name: "5.1 Senior operations leader in post",
      week: 18,
      description:
        "Define the role first, then recruit into it. Done when: the role spec and KPIs from milestone 1.8 are " +
        "approved, CadreHealth has delivered a shortlist (including diaspora and senior operator profiles), an " +
        "offer is accepted, and the appointee has taken a structured handover of the routines built in " +
        "workstreams 2 and 3.",
    },
    {
      track: 5,
      name: "5.2 Engagement closed and handed over",
      week: 26,
      description:
        "Done when: every routine, standard and report built in the engagement has a named Haven owner, the " +
        "twelve-month plan is agreed with the board, the six-month outcomes are reported against the baselines set " +
        "in the audit, and the board has taken an explicit decision on the optional oversight retainer.",
      deliverables: [
        {
          name: "Handover Pack & Twelve-Month Plan",
          description:
            "Ownership map for every routine and report, outcomes against the audit baselines, the twelve-month " +
            "plan, and the board decision paper on the optional oversight retainer.",
        },
      ],
    },
  ];

  let deliverableCount = 0;
  for (const [i, m] of milestonePlan.entries()) {
    const milestone = await prisma.milestone.create({
      data: {
        engagementId: engagement.id,
        name: m.name,
        description: m.description,
        dueDate: week(m.week),
        status: "PENDING",
        order: i + 1,
      },
    });
    for (const d of m.deliverables ?? []) {
      await prisma.deliverable.create({
        data: {
          engagementId: engagement.id,
          milestoneId: milestone.id,
          trackId: trackIdByOrder.get(m.track) ?? null,
          name: d.name,
          description: d.description,
          dueDate: week(d.week ?? m.week),
          status: "DRAFT",
          reviewStage: "DRAFT",
          clientVisible: false,
        },
      });
      deliverableCount += 1;
    }
  }
  console.log(
    `Created ${milestonePlan.length} milestones, ${deliverableCount} deliverables.\n`,
  );

  // ── Payment schedule (mobilisation upfront, balance monthly) ───────────
  const payments = [
    { name: "Mobilisation (diagnostic audit, on signing)", amount: 2_100_000, dueDate: month(0) },
    ...[1, 2, 3, 4, 5].map((n) => ({
      name: `Monthly installment ${n} of 5`,
      amount: 1_620_000,
      dueDate: month(n),
    })),
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
  console.log(`  Kickoff:     ${KICKOFF.toISOString().slice(0, 10)} (week 0; override with HAVEN_KICKOFF)`);
  console.log(
    `  Tracks:      ${trackSpecs.length}  |  Milestones: ${milestonePlan.length}` +
      `  |  Deliverables: ${deliverableCount}`,
  );
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
