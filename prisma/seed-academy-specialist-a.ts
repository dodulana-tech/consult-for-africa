/**
 * CFA TRAINING ACADEMY - SPECIALIST LEVEL SEED A (Tracks 6-8)
 * Seeds Specialist-level training tracks, modules, and assessment questions
 *
 * 3 Tracks:
 *   Track 6: Hospital Turnaround & Recovery
 *   Track 7: Clinical Governance & Accreditation
 *   Track 8: Revenue Cycle Excellence
 *
 * This file only CREATES new data. It does NOT delete existing records.
 *
 * Run: npx tsx prisma/seed-academy-specialist-a.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CFA Training Academy - Specialist Level Tracks (6-8)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 6: SPECIALIST - Hospital Turnaround & Recovery
  // ════════════════════════════════════════════════════════════════════════════

  const hospitalTurnaround = await prisma.trainingTrack.create({
    data: {
      name: 'Hospital Turnaround & Recovery',
      slug: 'hospital-turnaround-recovery',
      description: `Learn to diagnose failing hospitals and lead them back to financial and operational health.
        This track covers rapid assessment techniques for distressed facilities, financial stabilisation
        strategies tailored to African healthcare contexts, and the full CFA 24-week Turnaround Programme
        methodology. You will gain practical tools for cash management, cost reduction, and revenue recovery
        that can be deployed from day one of an engagement.`,
      level: 'SPECIALIST',
      category: 'methodology',
      iconName: 'refresh-cw',
      colorHex: '#9B2226',
      prerequisites: ['core-consulting-skills', 'healthcare-fundamentals'],
      estimatedHours: 30,
      sortOrder: 6,
    },
  })

  // Module 6.1: Turnaround Diagnostics
  const m6_1 = await prisma.trainingModule.create({
    data: {
      trackId: hospitalTurnaround.id,
      name: 'Turnaround Diagnostics',
      slug: 'turnaround-diagnostics',
      description: 'Conduct rapid assessments of financially distressed hospitals, identifying root causes and prioritising interventions within the first two weeks of engagement.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Recognising Financial Distress in Hospitals',
            type: 'text',
            body: `Hospital distress rarely arrives overnight. It follows a predictable pattern: declining occupancy, rising staff costs as a percentage of revenue, deferred maintenance creating a backlog, supplier relationships deteriorating as payment cycles stretch from 30 to 90 to 180 days. By the time leadership calls for help, the facility is typically 6 to 12 months away from insolvency. Your job as a turnaround consultant is to cut through the noise and identify where the hospital sits on the distress curve.

              The CFA Distress Scorecard evaluates five dimensions: liquidity (can the hospital meet payroll next month?), operational performance (are beds, theatres, and clinics generating adequate throughput?), revenue integrity (is the hospital capturing and collecting what it earns?), cost structure (where is money leaking?), and leadership capacity (does the management team have the skill and will to execute change?). Scoring each dimension on a 1-5 scale gives you a rapid triage that determines whether the hospital needs stabilisation, restructuring, or managed wind-down.`
          },
          {
            title: 'The 10-Day Rapid Assessment',
            type: 'text',
            body: `Speed matters in turnaround work. A hospital burning cash cannot wait for a 12-week diagnostic. The CFA Rapid Assessment compresses a full diagnostic into 10 working days. Days 1-3 focus on financial triage: cash position, burn rate, creditor exposure, and revenue pipeline. You need to know how many weeks of runway remain before anything else matters.

              Days 4-7 shift to operational review: bed occupancy trends, theatre utilisation, outpatient volumes, staffing ratios versus benchmarks. Days 8-10 synthesise findings into a Turnaround Readiness Report with three components: a severity rating (green/amber/red), a prioritised list of quick wins deliverable within 30 days, and a high-level 24-week stabilisation roadmap. This report becomes the mandate document that leadership and the board use to authorise the turnaround programme.`
          },
          {
            title: 'Stakeholder Management in Crisis',
            type: 'text',
            body: `Turnaround diagnostics are as much political as they are analytical. Distressed hospitals have anxious staff, frustrated suppliers, nervous lenders, and a board that may be divided on the path forward. Your diagnostic must engage all stakeholder groups without triggering panic. Conduct confidential one-on-one interviews with the CEO, CFO, clinical leads, head of nursing, and procurement head in the first three days.

              Simultaneously, review board minutes from the past 12 months to understand the narrative leadership has been telling. Often the gap between board presentations and operational reality reveals systemic governance failures. When presenting findings, use the "no surprises" rule: brief the CEO and board chair privately before any group presentation. Frame the diagnostic as a platform for recovery, not an indictment. The goal is to build a coalition for change, not to assign blame.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Distress Scorecard',
            instruction: 'A 150-bed private hospital in Kampala has 45% bed occupancy, 72% staff cost ratio, 120-day average supplier payment cycle, and cash reserves covering 6 weeks of operations. Score each of the five CFA Distress dimensions (1-5) and classify the overall severity.',
          },
          {
            title: 'Practice: Rapid Assessment Planning',
            instruction: 'You arrive on Monday morning at a distressed mission hospital in rural Tanzania. Outline your day-by-day plan for the 10-day Rapid Assessment, listing the specific data you will collect and stakeholders you will interview each day.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'CFA Distress Scorecard Template', url: 'internal://knowledge/distress-scorecard' },
          { title: 'Rapid Assessment Playbook', url: 'internal://knowledge/rapid-assessment-playbook' },
        ],
        tools: ['Distress Scorecard', '10-Day Assessment Planner', 'Stakeholder Interview Guide']
      },
    },
  })

  // Questions for Module 6.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m6_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the CFA Distress Scorecard, which dimension answers the question "Can the hospital meet payroll next month?"',
        options: JSON.stringify([
          { id: 'a', text: 'Operational performance', isCorrect: false },
          { id: 'b', text: 'Liquidity', isCorrect: true },
          { id: 'c', text: 'Revenue integrity', isCorrect: false },
          { id: 'd', text: 'Leadership capacity', isCorrect: false },
        ]),
        explanation: 'Liquidity measures the hospital\'s ability to meet short-term obligations, including payroll. It is the first dimension assessed because if cash runs out, nothing else matters.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m6_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'During the CFA 10-Day Rapid Assessment, what is the primary focus of Days 1-3?',
        options: JSON.stringify([
          { id: 'a', text: 'Staff interviews and culture assessment', isCorrect: false },
          { id: 'b', text: 'Operational review of bed occupancy and theatre utilisation', isCorrect: false },
          { id: 'c', text: 'Financial triage: cash position, burn rate, creditor exposure, revenue pipeline', isCorrect: true },
          { id: 'd', text: 'Board governance review and strategic planning', isCorrect: false },
        ]),
        explanation: 'Days 1-3 focus on financial triage because understanding how many weeks of runway remain determines the urgency and scope of every subsequent decision in the turnaround.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m6_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The Turnaround Readiness Report produced at the end of the Rapid Assessment contains three components. Which of the following is NOT one of them?',
        options: JSON.stringify([
          { id: 'a', text: 'A severity rating (green/amber/red)', isCorrect: false },
          { id: 'b', text: 'A prioritised list of quick wins deliverable within 30 days', isCorrect: false },
          { id: 'c', text: 'A detailed 12-month operational budget', isCorrect: true },
          { id: 'd', text: 'A high-level 24-week stabilisation roadmap', isCorrect: false },
        ]),
        explanation: 'The three components are a severity rating, prioritised quick wins (30 days), and a high-level 24-week roadmap. A detailed 12-month budget comes later in the turnaround process, not in the initial rapid assessment.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m6_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When presenting diagnostic findings to a distressed hospital\'s leadership, the "no surprises" rule means:',
        options: JSON.stringify([
          { id: 'a', text: 'Only present positive findings to avoid causing panic', isCorrect: false },
          { id: 'b', text: 'Brief the CEO and board chair privately before any group presentation', isCorrect: true },
          { id: 'c', text: 'Share the full report with all staff simultaneously', isCorrect: false },
          { id: 'd', text: 'Delay findings until a solution has been fully developed', isCorrect: false },
        ]),
        explanation: 'The "no surprises" rule ensures the CEO and board chair hear findings privately first, allowing them to process the information, ask questions, and align on messaging before broader stakeholder communication.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m6_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital with 45% bed occupancy, a staff cost ratio of 72%, and a 120-day supplier payment cycle is most likely at which stage of distress?',
        options: JSON.stringify([
          { id: 'a', text: 'Early-stage underperformance requiring minor adjustments', isCorrect: false },
          { id: 'b', text: 'Mid-stage distress requiring active restructuring', isCorrect: true },
          { id: 'c', text: 'Late-stage crisis requiring managed wind-down', isCorrect: false },
          { id: 'd', text: 'Healthy performance with room for optimisation', isCorrect: false },
        ]),
        explanation: 'These metrics indicate mid-stage distress: occupancy well below breakeven, staff costs consuming most revenue, and suppliers being paid very late. The hospital is not yet insolvent but is deteriorating and requires active restructuring intervention.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 6.1: Turnaround Diagnostics - 5 questions')

  // Module 6.2: Financial Stabilisation
  const m6_2 = await prisma.trainingModule.create({
    data: {
      trackId: hospitalTurnaround.id,
      name: 'Financial Stabilisation',
      slug: 'financial-stabilisation',
      description: 'Deploy cash management, cost reduction, and revenue quick-win strategies to stop the bleeding and create breathing room for deeper transformation.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Cash Management in Crisis',
            type: 'text',
            body: `Cash is oxygen for a distressed hospital. Before you can fix anything structural, you must stabilise cash flow. The first action is implementing a 13-week cash flow forecast, updated weekly, that tracks every naira, cedi, or shilling flowing in and out. This forecast becomes the single most important management tool during stabilisation.

              Immediate cash levers include: accelerating collections on outstanding receivables (especially insurance claims older than 60 days), renegotiating payment terms with top 10 suppliers, suspending all non-essential capital expenditure, and reviewing every recurring expense over a defined threshold. In one CFA engagement at a 200-bed hospital in Accra, implementing a 13-week cash forecast and activating these levers freed up $180,000 in working capital within the first month.`
          },
          {
            title: 'Cost Reduction Without Harming Care',
            type: 'text',
            body: `The temptation in turnaround is to slash costs indiscriminately. This is dangerous in healthcare because poorly targeted cuts directly harm patient outcomes and accelerate the death spiral. CFA uses a three-tier cost framework: Tier 1 (cut immediately) includes redundant administrative roles, unused subscriptions, excessive overtime, and inflated procurement contracts. Tier 2 (restructure within 60 days) includes staffing ratios above benchmark, energy costs, and non-clinical outsourcing. Tier 3 (protect) includes frontline clinical staff, essential drugs, and patient-facing services.

              Start with procurement. African hospitals routinely overpay 15-40% for pharmaceuticals and consumables due to fragmented purchasing, lack of formulary discipline, and supplier relationships that have never been competitively tested. Consolidating suppliers, enforcing a formulary, and joining group purchasing organisations can yield savings of 20-30% on drug spend within 90 days.`
          },
          {
            title: 'Revenue Quick Wins',
            type: 'text',
            body: `While cutting costs buys time, revenue recovery creates sustainable breathing room. The fastest revenue wins come from fixing what is already broken rather than launching new services. Start with a claims audit: review every denied or pending insurance claim from the past 90 days. In most African hospitals, 15-30% of revenue is lost to claims denials, unbilled procedures, or incorrect coding. A dedicated claims recovery team can recapture significant revenue within weeks.

              Next, review pricing. Many hospitals have not updated their fee schedules in years. Compare your rates to local competitors and adjust where you are significantly below market. Finally, look at theatre and diagnostic utilisation. If your CT scanner runs only during business hours, extending to evening slots can add 30-40% more scans without additional capital investment. The same logic applies to theatres, endoscopy suites, and outpatient clinics.`
          }
        ],
        exercises: [
          {
            title: 'Practice: 13-Week Cash Flow Forecast',
            instruction: 'Build a simplified 13-week cash flow forecast for a 100-bed hospital with monthly revenue of $400,000, 60% staff costs, and $120,000 in overdue supplier payments. Identify the week when cash runs out and propose three interventions to extend the runway.',
          },
          {
            title: 'Practice: Cost Reduction Prioritisation',
            instruction: 'Using the CFA three-tier framework, categorise the following 8 cost items into Tier 1 (cut), Tier 2 (restructure), or Tier 3 (protect): night-shift nurses, marketing agency retainer, pharmaceutical procurement, CEO driver, lab technicians, office renovations, security outsourcing, clinical training budget.',
          }
        ]
      },
      resources: {
        links: [
          { title: '13-Week Cash Flow Template', url: 'internal://knowledge/13-week-cashflow' },
          { title: 'Cost Reduction Playbook', url: 'internal://knowledge/cost-reduction-healthcare' },
        ],
        tools: ['13-Week Cash Flow Model', 'Three-Tier Cost Framework', 'Claims Recovery Tracker']
      },
    },
  })

  // Questions for Module 6.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m6_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the single most important management tool during the financial stabilisation phase of a hospital turnaround?',
        options: JSON.stringify([
          { id: 'a', text: 'Annual operating budget', isCorrect: false },
          { id: 'b', text: '13-week cash flow forecast updated weekly', isCorrect: true },
          { id: 'c', text: 'Monthly profit and loss statement', isCorrect: false },
          { id: 'd', text: 'Balance sheet review', isCorrect: false },
        ]),
        explanation: 'The 13-week cash flow forecast, updated weekly, provides real-time visibility into cash inflows and outflows, enabling leadership to make daily decisions about payments, collections, and expenditure during the critical stabilisation period.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m6_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the CFA three-tier cost framework, which category should include frontline clinical staff and essential drugs?',
        options: JSON.stringify([
          { id: 'a', text: 'Tier 1: Cut immediately', isCorrect: false },
          { id: 'b', text: 'Tier 2: Restructure within 60 days', isCorrect: false },
          { id: 'c', text: 'Tier 3: Protect', isCorrect: true },
          { id: 'd', text: 'None of the above, they should be outsourced', isCorrect: false },
        ]),
        explanation: 'Tier 3 (Protect) includes frontline clinical staff, essential drugs, and patient-facing services. Cutting these items directly harms patient outcomes and accelerates the death spiral by driving patients to competitors.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m6_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, African hospitals routinely overpay for pharmaceuticals and consumables by what percentage range?',
        options: JSON.stringify([
          { id: 'a', text: '5-10%', isCorrect: false },
          { id: 'b', text: '15-40%', isCorrect: true },
          { id: 'c', text: '50-70%', isCorrect: false },
          { id: 'd', text: '1-5%', isCorrect: false },
        ]),
        explanation: 'African hospitals routinely overpay 15-40% for pharmaceuticals and consumables due to fragmented purchasing, lack of formulary discipline, and supplier relationships that have never been competitively tested.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m6_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The fastest revenue quick wins in a hospital turnaround typically come from:',
        options: JSON.stringify([
          { id: 'a', text: 'Building new service lines and departments', isCorrect: false },
          { id: 'b', text: 'Hiring additional marketing staff', isCorrect: false },
          { id: 'c', text: 'Fixing existing broken processes like claims denials and unbilled procedures', isCorrect: true },
          { id: 'd', text: 'Raising prices across all services by 50%', isCorrect: false },
        ]),
        explanation: 'The fastest revenue wins come from fixing what is already broken: recovering denied claims, billing for procedures that were performed but never invoiced, and correcting coding errors. These require process fixes, not capital investment.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m6_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Extending CT scanner operating hours from business hours to include evening slots can increase scan volume by approximately:',
        options: JSON.stringify([
          { id: 'a', text: '5-10%', isCorrect: false },
          { id: 'b', text: '10-20%', isCorrect: false },
          { id: 'c', text: '30-40%', isCorrect: true },
          { id: 'd', text: '80-100%', isCorrect: false },
        ]),
        explanation: 'Extending diagnostic equipment to evening slots can add 30-40% more scans without additional capital investment. This is a common revenue quick win because the asset is already paid for and marginal costs are low.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 6.2: Financial Stabilisation - 5 questions')

  // Module 6.3: CFA Turnaround Programme
  const m6_3 = await prisma.trainingModule.create({
    data: {
      trackId: hospitalTurnaround.id,
      name: 'CFA Turnaround Programme',
      slug: 'cfa-turnaround-programme',
      description: 'Master the CFA proprietary 24-week turnaround methodology that takes a distressed hospital from crisis to sustainable performance.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The 24-Week Methodology Overview',
            type: 'text',
            body: `The CFA Turnaround Programme is a structured 24-week intervention divided into four phases. Phase 1 (Weeks 1-4) is Stabilise: stop the cash bleeding, implement crisis management governance, and execute quick wins identified in the Rapid Assessment. Phase 2 (Weeks 5-12) is Restructure: redesign the operating model, right-size staffing, renegotiate key contracts, and fix revenue cycle processes.

              Phase 3 (Weeks 13-20) is Rebuild: launch growth initiatives, invest in deferred maintenance priorities, rebuild staff morale and culture, and implement performance management systems. Phase 4 (Weeks 21-24) is Sustain: embed monitoring dashboards, train the internal team to maintain gains, conduct a final performance review, and formally hand over to hospital leadership with a 12-month sustainability plan.`
          },
          {
            title: 'Governance and the Turnaround Management Office',
            type: 'text',
            body: `Turnarounds fail without disciplined governance. CFA establishes a Turnaround Management Office (TMO) in the first week, co-led by the CFA engagement manager and a senior hospital executive. The TMO meets daily for the first four weeks (stabilisation), then three times weekly through restructuring, then weekly through rebuild and sustain phases. Every meeting follows a fixed agenda: cash position update, progress against the 30/60/90-day action plan, escalated decisions, and risks.

              The TMO has delegated authority from the board to make operational decisions up to a defined financial threshold without waiting for board approval. This is critical because distressed hospitals are often paralysed by slow decision-making. The board receives a weekly one-page dashboard showing cash position, key milestones, and a traffic-light summary of each workstream. If the board loses confidence or the CEO resists TMO authority, the turnaround will stall.`
          },
          {
            title: 'Measuring Turnaround Success',
            type: 'text',
            body: `CFA tracks turnaround progress against five anchor metrics reported weekly: days of cash on hand (target: move from under 14 days to over 60 days by Week 24), staff cost ratio (target: reduce to under 55%), bed occupancy (target: increase to over 70%), claims denial rate (target: reduce to under 10%), and supplier payment cycle (target: reduce to under 45 days). These five numbers tell the full story of whether the hospital is recovering.

              At Week 12, the mid-point review determines whether the programme is on track. If three or more anchor metrics are trending in the right direction, Phase 3 (Rebuild) proceeds as planned. If not, the team reassesses and may extend the Restructure phase. At Week 24, the final scorecard compares each anchor metric to baseline and target. CFA's benchmark is that 80% of anchor metrics should hit target by programme completion. Hospitals that achieve this have a 90% probability of sustaining performance at 12 months post-engagement.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Phase Planning',
            instruction: 'A 250-bed hospital in Nairobi has just completed its Rapid Assessment with a Red severity rating. Cash runway is 8 weeks, staff cost ratio is 78%, and bed occupancy is 38%. Design the Phase 1 (Stabilise) action plan for Weeks 1-4, listing 5 specific initiatives with owners, timelines, and expected impact.',
          },
          {
            title: 'Practice: TMO Dashboard Design',
            instruction: 'Design a one-page weekly TMO dashboard for a hospital in Week 8 of its turnaround. Include the five anchor metrics, three additional operational KPIs relevant to the Restructure phase, and a risk register format.',
          }
        ]
      },
      resources: {
        links: [
          { title: '24-Week Turnaround Methodology Guide', url: 'internal://knowledge/turnaround-24-week' },
          { title: 'TMO Setup Playbook', url: 'internal://knowledge/tmo-playbook' },
        ],
        tools: ['24-Week Programme Tracker', 'TMO Dashboard Template', 'Anchor Metrics Scorecard']
      },
    },
  })

  // Questions for Module 6.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m6_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The CFA 24-week Turnaround Programme is divided into four phases. What is the correct sequence?',
        options: JSON.stringify([
          { id: 'a', text: 'Assess, Plan, Execute, Monitor', isCorrect: false },
          { id: 'b', text: 'Stabilise, Restructure, Rebuild, Sustain', isCorrect: true },
          { id: 'c', text: 'Diagnose, Design, Deliver, Evaluate', isCorrect: false },
          { id: 'd', text: 'Engage, Analyse, Transform, Exit', isCorrect: false },
        ]),
        explanation: 'The four phases are Stabilise (Weeks 1-4), Restructure (Weeks 5-12), Rebuild (Weeks 13-20), and Sustain (Weeks 21-24). Each phase has distinct objectives and the cadence of TMO meetings adjusts accordingly.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m6_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How frequently does the Turnaround Management Office (TMO) meet during the first four weeks of a turnaround?',
        options: JSON.stringify([
          { id: 'a', text: 'Weekly', isCorrect: false },
          { id: 'b', text: 'Three times per week', isCorrect: false },
          { id: 'c', text: 'Daily', isCorrect: true },
          { id: 'd', text: 'Bi-weekly', isCorrect: false },
        ]),
        explanation: 'During the Stabilise phase (Weeks 1-4), the TMO meets daily because decisions need to be made rapidly to stop cash bleeding and execute quick wins. The cadence reduces to three times weekly during Restructure, then weekly during Rebuild and Sustain.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m6_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is one of CFA\'s five anchor metrics for tracking turnaround progress?',
        options: JSON.stringify([
          { id: 'a', text: 'Patient satisfaction score', isCorrect: false },
          { id: 'b', text: 'Number of new service lines launched', isCorrect: false },
          { id: 'c', text: 'Staff cost ratio', isCorrect: true },
          { id: 'd', text: 'Social media engagement', isCorrect: false },
        ]),
        explanation: 'The five anchor metrics are: days of cash on hand, staff cost ratio, bed occupancy, claims denial rate, and supplier payment cycle. Staff cost ratio targets reduction to under 55%.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m6_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'At the Week 12 mid-point review, what condition must be met for Phase 3 (Rebuild) to proceed as planned?',
        options: JSON.stringify([
          { id: 'a', text: 'All five anchor metrics must have hit their final targets', isCorrect: false },
          { id: 'b', text: 'The hospital must be cash-flow positive', isCorrect: false },
          { id: 'c', text: 'Three or more anchor metrics must be trending in the right direction', isCorrect: true },
          { id: 'd', text: 'The board must unanimously approve Phase 3', isCorrect: false },
        ]),
        explanation: 'The mid-point review at Week 12 checks whether three or more of the five anchor metrics are trending positively. If not, the Restructure phase may be extended before moving to Rebuild.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m6_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'CFA\'s benchmark for turnaround success at Week 24 is that what percentage of anchor metrics should hit their targets?',
        options: JSON.stringify([
          { id: 'a', text: '50%', isCorrect: false },
          { id: 'b', text: '60%', isCorrect: false },
          { id: 'c', text: '80%', isCorrect: true },
          { id: 'd', text: '100%', isCorrect: false },
        ]),
        explanation: 'CFA\'s benchmark is 80% of anchor metrics hitting target by programme completion (4 out of 5). Hospitals achieving this threshold have a 90% probability of sustaining performance at 12 months post-engagement.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 6.3: CFA Turnaround Programme - 5 questions')
  console.log('  Track 6: Hospital Turnaround & Recovery - 3 modules, 15 questions\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 7: SPECIALIST - Clinical Governance & Accreditation
  // ════════════════════════════════════════════════════════════════════════════

  const clinicalGovernance = await prisma.trainingTrack.create({
    data: {
      name: 'Clinical Governance & Accreditation',
      slug: 'clinical-governance-accreditation',
      description: `Build expertise in clinical governance frameworks and international accreditation standards
        relevant to African healthcare facilities. This track covers clinical audit methodology, JCI and
        SafeCare accreditation preparation, International Patient Safety Goals, and systematic approaches
        to patient safety including FMEA, root cause analysis, and incident investigation. Equips consultants
        to help hospitals achieve and maintain quality standards that improve outcomes and unlock payer contracts.`,
      level: 'SPECIALIST',
      category: 'methodology',
      iconName: 'shield-check',
      colorHex: '#005F73',
      prerequisites: ['healthcare-fundamentals'],
      estimatedHours: 35,
      sortOrder: 7,
    },
  })

  // Module 7.1: Clinical Governance Foundations
  const m7_1 = await prisma.trainingModule.create({
    data: {
      trackId: clinicalGovernance.id,
      name: 'Clinical Governance Foundations',
      slug: 'clinical-governance-foundations',
      description: 'Understand the pillars of clinical governance and learn to design and conduct clinical audits that drive measurable quality improvement.',
      order: 1,
      estimatedMinutes: 140,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'What Clinical Governance Means in Practice',
            type: 'text',
            body: `Clinical governance is the system through which healthcare organisations are accountable for continuously improving the quality of their services and safeguarding high standards of care. In many African hospitals, "quality" is treated as a department rather than a system. There is a quality officer, perhaps a committee, and a folder of policies that nobody reads. This is not clinical governance. It is documentation theatre.

              True clinical governance rests on seven pillars: clinical effectiveness (are treatments evidence-based?), risk management (are hazards identified and mitigated?), patient experience (do patients feel safe, informed, and respected?), communication effectiveness (do handoffs, referrals, and documentation prevent errors?), resource effectiveness (are staff, equipment, and drugs deployed optimally?), strategic effectiveness (does leadership set and enforce quality standards?), and learning effectiveness (does the organisation learn from its mistakes?). A CFA governance assessment scores each pillar and identifies the weakest links.`
          },
          {
            title: 'Clinical Audit Methodology',
            type: 'text',
            body: `Clinical audit is the cornerstone tool of clinical governance. It is a systematic review of care against explicit criteria, followed by change implementation, and then re-audit to confirm improvement. The audit cycle has five steps: select a topic (high risk, high volume, or high cost), define measurable standards (e.g., "95% of surgical patients should receive prophylactic antibiotics within 60 minutes of incision"), collect data on current practice, compare results to the standard, and implement changes where gaps exist.

              In African hospitals, start with high-impact, low-complexity audits. Hand hygiene compliance is a classic first audit: define WHO "5 Moments" as the standard, observe 100 hand hygiene opportunities across wards, measure compliance, implement targeted interventions (gel dispensers, visual reminders, peer champions), and re-audit after 8 weeks. Most hospitals find baseline compliance below 40%. Reaching 70%+ significantly reduces healthcare-associated infections.`
          },
          {
            title: 'Building a Governance Structure',
            type: 'text',
            body: `Effective clinical governance requires a formal structure, not just enthusiasm. At minimum, a hospital needs a Clinical Governance Committee chaired by a senior clinician (not the CEO) that meets monthly, with a standing agenda covering: incident reports from the past month, audit results, mortality and morbidity reviews, patient complaint trends, and policy updates. The committee must have authority to mandate corrective actions with defined deadlines.

              Below the committee, establish specialty-level quality leads who own audit programmes within their departments. A surgical quality lead, for example, owns the surgical safety checklist audit, SSI rates, and theatre utilisation metrics. Feed these into the hospital-wide governance committee monthly. This two-tier structure ensures that governance is embedded in daily clinical work rather than existing as a parallel bureaucratic exercise.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Governance Gap Assessment',
            instruction: 'A 120-bed hospital in Lusaka has a quality officer but no formal clinical governance structure. Using the seven pillars framework, design a 90-day plan to establish foundational clinical governance, listing the first 3 audits you would recommend and why.',
          },
          {
            title: 'Practice: Clinical Audit Design',
            instruction: 'Design a complete clinical audit for surgical site infection (SSI) prevention at a hospital performing 200 surgeries per month. Define the standard, sample size, data collection method, analysis plan, and proposed interventions for common gaps.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Clinical Governance Framework', url: 'internal://knowledge/clinical-governance-framework' },
          { title: 'Clinical Audit Toolkit', url: 'internal://knowledge/clinical-audit-toolkit' },
        ],
        tools: ['Seven Pillars Assessment', 'Audit Cycle Template', 'Governance Committee Charter']
      },
    },
  })

  // Questions for Module 7.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m7_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How many pillars does the CFA clinical governance framework include?',
        options: JSON.stringify([
          { id: 'a', text: 'Four', isCorrect: false },
          { id: 'b', text: 'Five', isCorrect: false },
          { id: 'c', text: 'Seven', isCorrect: true },
          { id: 'd', text: 'Ten', isCorrect: false },
        ]),
        explanation: 'The seven pillars are: clinical effectiveness, risk management, patient experience, communication effectiveness, resource effectiveness, strategic effectiveness, and learning effectiveness.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m7_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The five steps of the clinical audit cycle, in correct order, are:',
        options: JSON.stringify([
          { id: 'a', text: 'Plan, Do, Study, Act, Review', isCorrect: false },
          { id: 'b', text: 'Select topic, define standards, collect data, compare to standards, implement changes', isCorrect: true },
          { id: 'c', text: 'Identify risk, analyse root cause, design solution, implement, monitor', isCorrect: false },
          { id: 'd', text: 'Assess, diagnose, treat, evaluate, discharge', isCorrect: false },
        ]),
        explanation: 'The clinical audit cycle follows five steps: select a topic (high risk/volume/cost), define measurable standards, collect data on current practice, compare results to the standard, and implement changes where gaps exist. Re-audit then closes the loop.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m7_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, baseline hand hygiene compliance in most African hospitals is typically:',
        options: JSON.stringify([
          { id: 'a', text: 'Above 80%', isCorrect: false },
          { id: 'b', text: 'Between 60-80%', isCorrect: false },
          { id: 'c', text: 'Below 40%', isCorrect: true },
          { id: 'd', text: 'Between 40-60%', isCorrect: false },
        ]),
        explanation: 'Most African hospitals find baseline hand hygiene compliance below 40% when measured against the WHO "5 Moments" standard. Reaching 70%+ through targeted interventions significantly reduces healthcare-associated infections.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m7_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Who should chair the Clinical Governance Committee?',
        options: JSON.stringify([
          { id: 'a', text: 'The CEO', isCorrect: false },
          { id: 'b', text: 'The quality officer', isCorrect: false },
          { id: 'c', text: 'A senior clinician', isCorrect: true },
          { id: 'd', text: 'The head of nursing', isCorrect: false },
        ]),
        explanation: 'The Clinical Governance Committee should be chaired by a senior clinician, not the CEO. This ensures clinical credibility and signals that governance is a clinical responsibility, not purely an administrative one.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m7_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The module describes "documentation theatre" in the context of quality management. This refers to:',
        options: JSON.stringify([
          { id: 'a', text: 'A hospital with robust documentation systems that drive quality improvement', isCorrect: false },
          { id: 'b', text: 'Having a quality officer, committee, and policy folder that exist on paper but do not drive real practice change', isCorrect: true },
          { id: 'c', text: 'A formal training programme for medical records staff', isCorrect: false },
          { id: 'd', text: 'Using theatre checklists during surgical procedures', isCorrect: false },
        ]),
        explanation: '"Documentation theatre" describes the common pattern where hospitals have quality structures on paper (officer, committee, policies) but these do not translate into actual quality improvement. True clinical governance requires active measurement, accountability, and change management.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 7.1: Clinical Governance Foundations - 5 questions')

  // Module 7.2: JCI & SafeCare Accreditation
  const m7_2 = await prisma.trainingModule.create({
    data: {
      trackId: clinicalGovernance.id,
      name: 'JCI & SafeCare Accreditation',
      slug: 'jci-safecare-accreditation',
      description: 'Navigate international accreditation standards relevant to African hospitals, with deep focus on JCI standards, SafeCare methodology, and International Patient Safety Goals.',
      order: 2,
      estimatedMinutes: 140,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Accreditation Landscape in Africa',
            type: 'text',
            body: `International accreditation serves two purposes for African hospitals: it drives genuine quality improvement through systematic standards compliance, and it unlocks commercial opportunities by signalling credibility to international insurers, medical tourism patients, and corporate clients. The two most relevant accreditation frameworks are JCI (Joint Commission International) and SafeCare (developed by the PharmAccess Foundation specifically for resource-limited settings).

              JCI is the gold standard globally, with over 1,000 accredited organisations worldwide. In Africa, fewer than 30 hospitals hold JCI accreditation, concentrated in South Africa, Kenya, and Nigeria. The process typically takes 18-24 months and costs $50,000-$150,000 in survey fees alone, plus significant investment in systems and infrastructure. SafeCare offers a tiered approach (Levels 1-5) designed for the African context, recognising that most hospitals cannot leap from current state to JCI-level compliance in one step. SafeCare Level 3 is roughly equivalent to national accreditation standards, while Level 5 approaches international standards.`
          },
          {
            title: 'International Patient Safety Goals (IPSGs)',
            type: 'text',
            body: `Both JCI and SafeCare emphasise the six International Patient Safety Goals, which are non-negotiable requirements. IPSG 1: Identify patients correctly using at least two identifiers (name and date of birth, never bed number). IPSG 2: Improve effective communication, including read-back of verbal orders and critical test results. IPSG 3: Improve the safety of high-alert medications through standardised storage, labelling, and double-checking protocols. IPSG 4: Ensure safe surgery through the WHO Surgical Safety Checklist (time-out before incision). IPSG 5: Reduce healthcare-associated infections through hand hygiene and evidence-based precautions. IPSG 6: Reduce patient harm from falls through risk assessment and prevention protocols.

              For CFA consultants preparing hospitals for accreditation, the IPSGs are the starting point. They address the most common causes of preventable patient harm and are heavily weighted in survey scoring. A hospital that nails IPSGs demonstrates a foundational safety culture.`
          },
          {
            title: 'Accreditation Preparation Roadmap',
            type: 'text',
            body: `CFA uses a phased approach to accreditation readiness. Phase 1 (Months 1-3): Baseline Assessment. Conduct a mock survey against the relevant standard set (JCI or SafeCare), scoring every measurable element. This produces a gap analysis showing the distance between current state and accreditation requirements. Most African hospitals score 30-50% on initial baseline against JCI standards.

              Phase 2 (Months 4-12): System Building. Address gaps systematically, starting with IPSGs and high-risk areas (medication management, infection control, facility safety). Write policies, train staff, implement processes, and begin internal auditing. Phase 3 (Months 13-18): Embedding and Mock Surveys. Run quarterly mock surveys with increasing rigour. Track "tracer methodology" readiness by following patient journeys through the hospital and testing compliance at every touchpoint. Phase 4 (Months 19-24): Final preparation and survey. Conduct a full dress rehearsal, address remaining gaps, and submit the survey application. Throughout all phases, the single biggest determinant of success is leadership commitment, not budget.`
          }
        ],
        exercises: [
          {
            title: 'Practice: IPSG Implementation Plan',
            instruction: 'A 180-bed hospital in Dar es Salaam has no formal patient identification system (patients are identified by bed number). Design a 90-day implementation plan for IPSG 1 (Patient Identification), covering wristband procurement, policy development, staff training, and compliance monitoring.',
          },
          {
            title: 'Practice: Accreditation Gap Analysis',
            instruction: 'You have completed a baseline assessment and the hospital scored 35% against JCI standards. The weakest areas are medication management (20%), infection control (25%), and facility management (30%). Create a prioritised 6-month action plan for Phase 2, explaining why you sequence the work the way you do.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'JCI Standards Overview', url: 'internal://knowledge/jci-standards' },
          { title: 'SafeCare Assessment Framework', url: 'internal://knowledge/safecare-framework' },
        ],
        tools: ['IPSG Compliance Tracker', 'Mock Survey Scorecard', 'Accreditation Roadmap Template']
      },
    },
  })

  // Questions for Module 7.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m7_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How many International Patient Safety Goals (IPSGs) are there?',
        options: JSON.stringify([
          { id: 'a', text: 'Four', isCorrect: false },
          { id: 'b', text: 'Six', isCorrect: true },
          { id: 'c', text: 'Eight', isCorrect: false },
          { id: 'd', text: 'Ten', isCorrect: false },
        ]),
        explanation: 'There are six IPSGs: patient identification, effective communication, high-alert medication safety, safe surgery, infection reduction, and fall prevention.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m7_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to IPSG 1, which of the following should NEVER be used as a patient identifier?',
        options: JSON.stringify([
          { id: 'a', text: 'Patient name', isCorrect: false },
          { id: 'b', text: 'Date of birth', isCorrect: false },
          { id: 'c', text: 'Bed number', isCorrect: true },
          { id: 'd', text: 'Medical record number', isCorrect: false },
        ]),
        explanation: 'Bed numbers should never be used as patient identifiers because patients move between beds. IPSG 1 requires at least two person-specific identifiers such as name and date of birth.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m7_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'SafeCare accreditation differs from JCI primarily in that it:',
        options: JSON.stringify([
          { id: 'a', text: 'Has lower quality standards overall', isCorrect: false },
          { id: 'b', text: 'Offers a tiered approach (Levels 1-5) designed for resource-limited settings', isCorrect: true },
          { id: 'c', text: 'Only applies to government hospitals', isCorrect: false },
          { id: 'd', text: 'Does not assess patient safety', isCorrect: false },
        ]),
        explanation: 'SafeCare was developed by PharmAccess specifically for the African context. Its tiered approach (Levels 1-5) recognises that most hospitals cannot leap to international standards in one step. Level 3 is roughly equivalent to national standards, while Level 5 approaches international standards.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m7_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Most African hospitals score what percentage on initial baseline assessment against JCI standards?',
        options: JSON.stringify([
          { id: 'a', text: '10-20%', isCorrect: false },
          { id: 'b', text: '30-50%', isCorrect: true },
          { id: 'c', text: '60-75%', isCorrect: false },
          { id: 'd', text: '75-90%', isCorrect: false },
        ]),
        explanation: 'Most African hospitals score 30-50% on initial baseline assessment against JCI standards. This gap is significant but achievable with 18-24 months of systematic preparation.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m7_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, the single biggest determinant of accreditation success is:',
        options: JSON.stringify([
          { id: 'a', text: 'Budget allocation for the accreditation project', isCorrect: false },
          { id: 'b', text: 'Hiring external consultants', isCorrect: false },
          { id: 'c', text: 'Leadership commitment', isCorrect: true },
          { id: 'd', text: 'Purchasing new equipment', isCorrect: false },
        ]),
        explanation: 'Throughout all phases of accreditation preparation, the single biggest determinant of success is leadership commitment, not budget. Without active CEO and board engagement, accreditation projects stall regardless of financial investment.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 7.2: JCI & SafeCare Accreditation - 5 questions')

  // Module 7.3: Patient Safety Systems
  const m7_3 = await prisma.trainingModule.create({
    data: {
      trackId: clinicalGovernance.id,
      name: 'Patient Safety Systems',
      slug: 'patient-safety-systems',
      description: 'Design and implement proactive and reactive patient safety systems including FMEA for risk prevention, root cause analysis for incident investigation, and reporting cultures that drive learning.',
      order: 3,
      estimatedMinutes: 140,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'FMEA: Proactive Risk Prevention',
            type: 'text',
            body: `Failure Mode and Effects Analysis (FMEA) is a proactive tool that identifies what could go wrong before it does. Originally developed for aerospace engineering, FMEA has been adapted for healthcare to systematically analyse high-risk processes. The method involves mapping every step of a clinical process (e.g., medication administration from prescription to delivery), identifying potential failure modes at each step, scoring each failure by severity, probability of occurrence, and detectability, then calculating a Risk Priority Number (RPN = Severity x Occurrence x Detectability).

              In African hospitals, FMEA is particularly powerful for medication safety and blood transfusion processes, where the consequences of failure are severe and the systems are often manual. A CFA team conducting FMEA on the medication process at a Lagos hospital identified 23 potential failure points, with "wrong dose due to illegible handwriting on prescription" scoring the highest RPN. The intervention was simple: standardised prescription forms with pre-printed dose ranges and mandatory block lettering. This single change reduced medication errors by 40% within three months.`
          },
          {
            title: 'Root Cause Analysis and Incident Investigation',
            type: 'text',
            body: `When adverse events occur, root cause analysis (RCA) digs beyond the immediate cause to identify the systemic failures that allowed the event to happen. The method follows a structured process: define the event clearly, assemble a multidisciplinary investigation team, construct a timeline of events, identify contributing factors using the "5 Whys" or fishbone diagram, determine root causes (typically system failures, not individual errors), and design corrective actions that address root causes.

              The critical mindset shift for African hospitals is moving from blame culture ("who made the mistake?") to learning culture ("what in our system allowed this to happen?"). When a nurse administers the wrong medication, the root cause is rarely incompetence. It is usually a combination of system failures: no barcode verification, look-alike drug packaging stored together, interruptions during medication rounds, inadequate staffing ratios, and absence of independent double-checks. RCA addresses all of these. Punishing the nurse addresses none of them and ensures future errors are hidden rather than reported.`
          },
          {
            title: 'Building an Incident Reporting Culture',
            type: 'text',
            body: `Patient safety systems depend on information flow. If staff do not report near-misses and adverse events, the organisation cannot learn. Most African hospitals have incident reporting rates far below international benchmarks, not because fewer incidents occur, but because staff fear punishment. Building a reporting culture requires three elements: a simple reporting mechanism (one-page form or digital tool, anonymous option available), a visible response loop (staff must see that their reports lead to action, not filing cabinets), and explicit protection from blame for honest reporting.

              CFA recommends a "just culture" framework that distinguishes between human error (system-supported, no blame), at-risk behaviour (coaching and system redesign), and reckless behaviour (accountability and discipline). This framework gives staff clarity on when reporting is safe and when behaviour crosses the line. Hospitals that implement just culture typically see reporting rates increase 5-10x within six months, which paradoxically looks like safety is getting worse when in fact visibility is improving.`
          }
        ],
        exercises: [
          {
            title: 'Practice: FMEA for Blood Transfusion',
            instruction: 'Map the blood transfusion process at a typical African hospital (from physician order to post-transfusion monitoring). Identify at least 5 potential failure modes, score each on Severity, Occurrence, and Detectability (1-10), calculate RPNs, and recommend interventions for the top 3 risks.',
          },
          {
            title: 'Practice: Root Cause Analysis',
            instruction: 'A patient received a blood transfusion intended for another patient. The error was caught 15 minutes into the transfusion when the patient developed a reaction. Conduct a root cause analysis: construct a timeline, use a fishbone diagram to identify contributing factors, determine root causes, and propose 5 corrective actions.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'FMEA in Healthcare Guide', url: 'internal://knowledge/fmea-healthcare' },
          { title: 'RCA Investigation Template', url: 'internal://knowledge/rca-template' },
        ],
        tools: ['FMEA Worksheet', 'RCA Investigation Kit', 'Incident Reporting Form Template']
      },
    },
  })

  // Questions for Module 7.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m7_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In FMEA, the Risk Priority Number (RPN) is calculated as:',
        options: JSON.stringify([
          { id: 'a', text: 'Severity + Occurrence + Detectability', isCorrect: false },
          { id: 'b', text: 'Severity x Occurrence x Detectability', isCorrect: true },
          { id: 'c', text: 'Severity x Probability / Detectability', isCorrect: false },
          { id: 'd', text: '(Severity + Occurrence) x Detectability', isCorrect: false },
        ]),
        explanation: 'RPN is the product of three factors: Severity (impact if the failure occurs), Occurrence (how likely it is to happen), and Detectability (how likely the failure is to be caught before reaching the patient). Higher RPNs indicate higher priority for intervention.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m7_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The primary purpose of root cause analysis is to:',
        options: JSON.stringify([
          { id: 'a', text: 'Identify and discipline the individual who made the error', isCorrect: false },
          { id: 'b', text: 'Document the event for legal purposes', isCorrect: false },
          { id: 'c', text: 'Identify systemic failures that allowed the adverse event to occur', isCorrect: true },
          { id: 'd', text: 'Calculate the financial cost of the incident', isCorrect: false },
        ]),
        explanation: 'RCA goes beyond the immediate cause to identify systemic failures. The goal is to redesign systems so the error becomes less likely to occur, regardless of which individual is performing the task.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m7_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In a "just culture" framework, at-risk behaviour should be addressed through:',
        options: JSON.stringify([
          { id: 'a', text: 'Immediate termination', isCorrect: false },
          { id: 'b', text: 'Coaching and system redesign', isCorrect: true },
          { id: 'c', text: 'Ignoring it since no harm occurred', isCorrect: false },
          { id: 'd', text: 'Public reprimand', isCorrect: false },
        ]),
        explanation: 'Just culture distinguishes three categories: human error (no blame, system support), at-risk behaviour (coaching and system redesign to remove the incentive for the shortcut), and reckless behaviour (accountability and discipline).',
        points: 1,
        order: 3,
      },
      {
        moduleId: m7_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Hospitals that implement a just culture framework typically see incident reporting rates:',
        options: JSON.stringify([
          { id: 'a', text: 'Decrease by 50% as safety improves', isCorrect: false },
          { id: 'b', text: 'Stay roughly the same', isCorrect: false },
          { id: 'c', text: 'Increase 5-10x within six months', isCorrect: true },
          { id: 'd', text: 'Increase slightly by 10-20%', isCorrect: false },
        ]),
        explanation: 'Reporting rates increase 5-10x because staff feel safe reporting. This looks like safety is deteriorating but actually reflects improved visibility. Low reporting rates in African hospitals typically indicate fear of punishment, not absence of incidents.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m7_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'FMEA was originally developed for which industry before being adapted for healthcare?',
        options: JSON.stringify([
          { id: 'a', text: 'Automotive manufacturing', isCorrect: false },
          { id: 'b', text: 'Aerospace engineering', isCorrect: true },
          { id: 'c', text: 'Nuclear power', isCorrect: false },
          { id: 'd', text: 'Pharmaceutical manufacturing', isCorrect: false },
        ]),
        explanation: 'FMEA was originally developed for aerospace engineering to identify potential failures in complex systems. It has since been adapted for healthcare, where it is particularly valuable for analysing high-risk clinical processes like medication administration and blood transfusion.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 7.3: Patient Safety Systems - 5 questions')
  console.log('  Track 7: Clinical Governance & Accreditation - 3 modules, 15 questions\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 8: SPECIALIST - Revenue Cycle Excellence
  // ════════════════════════════════════════════════════════════════════════════

  const revenueCycle = await prisma.trainingTrack.create({
    data: {
      name: 'Revenue Cycle Excellence',
      slug: 'revenue-cycle-excellence',
      description: `Master the end-to-end revenue cycle for African healthcare facilities, from patient registration
        through clinical coding to final collections. This track covers patient access optimisation,
        ICD-10 coding and DRG-based reimbursement, HMO and NHIS billing processes, claims management,
        and denial prevention strategies. Revenue cycle leakage is the single largest source of financial
        underperformance in African hospitals, and this track equips consultants to diagnose and fix it.`,
      level: 'SPECIALIST',
      category: 'health_economics',
      iconName: 'dollar-sign',
      colorHex: '#BC6C25',
      prerequisites: ['financial-literacy-healthcare'],
      estimatedHours: 28,
      sortOrder: 8,
    },
  })

  // Module 8.1: Patient Access & Registration
  const m8_1 = await prisma.trainingModule.create({
    data: {
      trackId: revenueCycle.id,
      name: 'Patient Access & Registration',
      slug: 'patient-access-registration',
      description: 'Optimise the front door of the revenue cycle by ensuring accurate patient registration, insurance verification, and financial counselling that prevent downstream revenue leakage.',
      order: 1,
      estimatedMinutes: 100,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Why Patient Access Is a Revenue Function',
            type: 'text',
            body: `Most hospital leaders think of patient registration as an administrative task. It is not. It is the first step in the revenue cycle, and errors here cascade through billing, coding, and collections. A misspelled name, wrong insurance ID, or missing referral authorisation at registration can result in a denied claim worth thousands of dollars weeks later. Studies across African hospitals show that 30-40% of claims denials originate from registration errors, making patient access the highest-leverage intervention point in the entire revenue cycle.

              CFA approaches patient access as a revenue function, not an admin function. This means registration staff need training in insurance verification, not just data entry. It means pre-registration processes should capture and verify insurance details before the patient arrives. And it means real-time eligibility checking (where infrastructure allows) should flag coverage gaps before services are rendered, not after.`
          },
          {
            title: 'Insurance Verification and Pre-Authorisation',
            type: 'text',
            body: `In African healthcare markets with mixed payer environments (NHIS, private HMOs, corporate schemes, and out-of-pocket), insurance verification is complex but critical. Each payer has different requirements for pre-authorisation, benefit limits, co-payment structures, and excluded services. Registration staff must verify four things before a patient receives care: Is the policy active? What benefits are covered? Is pre-authorisation required for the planned service? What is the patient's co-payment or balance responsibility?

              For hospitals without real-time electronic verification, CFA recommends a dedicated verification desk that calls HMOs to confirm eligibility for every insured patient. This seems labour-intensive, but the cost of one verification clerk is recovered many times over by preventing unverified patients from consuming services that will never be reimbursed. A Lagos hospital implementing this approach reduced its "insurance rejection at point of billing" rate from 18% to 3% within two months.`
          },
          {
            title: 'Financial Counselling and Point-of-Service Collections',
            type: 'text',
            body: `Financial counselling is the practice of informing patients about their financial responsibility before treatment begins. In markets where co-payments and out-of-pocket expenses are common, this is both a revenue protection strategy and a patient experience improvement. Patients who understand their financial obligation upfront are more likely to pay and less likely to feel ambushed by bills after discharge.

              Point-of-service (POS) collections involve collecting co-payments, deposits, or estimated out-of-pocket amounts at registration or before discharge. African hospitals that implement POS collections typically recover 60-70% of patient-owed balances at time of service, compared to 15-25% when billing is sent after discharge. The key is combining clear communication (financial counselling) with convenient payment options (mobile money, card, cash). Train registration and discharge staff to have confident, empathetic conversations about money. Provide scripts and role-play training, not just policy documents.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Registration Error Audit',
            instruction: 'Design an audit methodology to measure registration error rates at a 200-bed hospital. Define what constitutes a "registration error," determine the sample size, specify data collection methods, and propose a target error rate based on industry benchmarks.',
          },
          {
            title: 'Practice: Verification Workflow Design',
            instruction: 'A hospital in Abuja sees 150 insured patients daily across four major HMOs and the NHIS. Design an insurance verification workflow that can process all 150 verifications daily, specifying staffing, tools, escalation paths for verification failures, and turnaround time targets.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Patient Access Best Practices', url: 'internal://knowledge/patient-access' },
          { title: 'Insurance Verification Checklist', url: 'internal://knowledge/insurance-verification' },
        ],
        tools: ['Registration Audit Template', 'Verification Workflow Builder', 'Financial Counselling Scripts']
      },
    },
  })

  // Questions for Module 8.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m8_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, what percentage of claims denials in African hospitals originate from registration errors?',
        options: JSON.stringify([
          { id: 'a', text: '10-15%', isCorrect: false },
          { id: 'b', text: '20-25%', isCorrect: false },
          { id: 'c', text: '30-40%', isCorrect: true },
          { id: 'd', text: '50-60%', isCorrect: false },
        ]),
        explanation: '30-40% of claims denials originate from registration errors such as misspelled names, wrong insurance IDs, or missing referral authorisations, making patient access the highest-leverage intervention point in the revenue cycle.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m8_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The four things registration staff must verify before a patient receives insured care are:',
        options: JSON.stringify([
          { id: 'a', text: 'Patient age, diagnosis, treatment plan, and discharge date', isCorrect: false },
          { id: 'b', text: 'Policy active status, covered benefits, pre-authorisation requirements, and co-payment responsibility', isCorrect: true },
          { id: 'c', text: 'Insurance company name, employer, salary, and dependant count', isCorrect: false },
          { id: 'd', text: 'Patient address, phone number, emergency contact, and next of kin', isCorrect: false },
        ]),
        explanation: 'The four verification checks are: Is the policy active? What benefits are covered? Is pre-authorisation required? What is the patient\'s co-payment or balance responsibility? These four checks prevent downstream denials.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m8_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Hospitals that implement point-of-service (POS) collections typically recover what percentage of patient-owed balances at time of service?',
        options: JSON.stringify([
          { id: 'a', text: '15-25%', isCorrect: false },
          { id: 'b', text: '30-45%', isCorrect: false },
          { id: 'c', text: '60-70%', isCorrect: true },
          { id: 'd', text: '85-95%', isCorrect: false },
        ]),
        explanation: 'POS collections recover 60-70% of patient-owed balances at time of service, compared to only 15-25% when billing is sent after discharge. This dramatic difference makes POS collections one of the most impactful revenue cycle interventions.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m8_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'CFA approaches patient access as a:',
        options: JSON.stringify([
          { id: 'a', text: 'Clinical function focused on triage', isCorrect: false },
          { id: 'b', text: 'Revenue function, not an administrative function', isCorrect: true },
          { id: 'c', text: 'IT function focused on data entry', isCorrect: false },
          { id: 'd', text: 'Marketing function focused on patient experience', isCorrect: false },
        ]),
        explanation: 'CFA reframes patient access as a revenue function because registration accuracy directly determines downstream revenue capture. This reframing changes how staff are trained, how processes are designed, and how performance is measured.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m8_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A Lagos hospital implementing a dedicated verification desk reduced its insurance rejection rate from 18% to:',
        options: JSON.stringify([
          { id: 'a', text: '12%', isCorrect: false },
          { id: 'b', text: '8%', isCorrect: false },
          { id: 'c', text: '3%', isCorrect: true },
          { id: 'd', text: '0%', isCorrect: false },
        ]),
        explanation: 'The Lagos hospital reduced its insurance rejection at point of billing from 18% to 3% within two months by implementing a dedicated verification desk that confirms eligibility for every insured patient before services are rendered.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 8.1: Patient Access & Registration - 5 questions')

  // Module 8.2: Clinical Coding & Charge Capture
  const m8_2 = await prisma.trainingModule.create({
    data: {
      trackId: revenueCycle.id,
      name: 'Clinical Coding & Charge Capture',
      slug: 'clinical-coding-charge-capture',
      description: 'Understand ICD-10 clinical coding, DRG-based reimbursement models, and charge capture processes that ensure hospitals are reimbursed accurately for the care they provide.',
      order: 2,
      estimatedMinutes: 110,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'ICD-10 Coding Fundamentals',
            type: 'text',
            body: `The International Classification of Diseases, 10th Revision (ICD-10) is the global standard for coding diagnoses and procedures. In the context of hospital revenue, coding determines reimbursement. If a patient with pneumonia complicated by sepsis is coded only for pneumonia, the hospital is reimbursed for a simpler case. If a surgical procedure with complications is coded as routine, revenue is lost. Accurate coding is not about gaming the system; it is about ensuring the clinical record fully reflects the complexity of care delivered.

              African hospitals face three coding challenges. First, a severe shortage of trained clinical coders. Many hospitals rely on clinicians to code their own cases, which results in inconsistent, often under-coded records. Second, poor clinical documentation. Coders can only code what is documented. If a physician treats sepsis but only documents "fever and infection," the coder cannot assign the sepsis code. Third, limited familiarity with ICD-10 specificity requirements. ICD-10 has over 70,000 diagnosis codes and requires laterality, severity, and episode-of-care specificity that ICD-9 did not demand.`
          },
          {
            title: 'Diagnosis-Related Groups and Case-Based Reimbursement',
            type: 'text',
            body: `Diagnosis-Related Groups (DRGs) bundle hospital services into a single payment based on the patient's diagnosis, procedures performed, complications, and demographic factors. Several African countries, including Kenya, Nigeria, and Ghana, are moving toward DRG-based reimbursement through their national health insurance schemes. Under DRG models, hospitals receive a fixed payment per case rather than fee-for-service billing. This means coding accuracy directly determines whether the hospital is paid fairly, underpaid, or overpaid.

              For CFA consultants, understanding DRGs is essential because the transition from fee-for-service to case-based payment fundamentally changes hospital economics. Under fee-for-service, hospitals are incentivised to do more (more tests, more days, more procedures). Under DRGs, hospitals are incentivised to be efficient because the payment is fixed regardless of resources consumed. CFA helps hospitals prepare for DRG transitions by improving coding accuracy, optimising length of stay, and redesigning clinical pathways to deliver outcomes within the DRG payment envelope.`
          },
          {
            title: 'Charge Capture and Revenue Leakage',
            type: 'text',
            body: `Charge capture is the process of recording every billable service, supply, and procedure so that the hospital can invoice appropriately. Revenue leakage from missed charges is one of the most common and most fixable problems in African hospitals. Common leakage points include: medications administered but not recorded on the charge sheet, diagnostic tests ordered verbally but never entered into billing, surgical supplies used but not captured, specialist consultations delivered but not billed, and ward procedures (wound dressing, catheterisation) performed by nurses without a billing trigger.

              CFA's charge capture audit methodology reviews a random sample of 50-100 patient files, comparing clinical documentation (what was done) to billing records (what was charged). The gap between the two is the leakage rate. In most African hospitals, the first audit reveals a leakage rate of 8-15% of gross revenue. Closing this gap requires three interventions: redesigning charge capture forms to match clinical workflows, training clinical staff that documentation is a revenue activity, and implementing daily charge reconciliation between nursing stations and billing.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Charge Capture Audit',
            instruction: 'You are given 10 patient files from a surgical ward. For each file, compare the clinical notes (procedures, medications, diagnostics) to the billing record. Identify 3 categories of commonly missed charges and estimate the revenue impact if the hospital performs 500 surgeries per month.',
          },
          {
            title: 'Practice: DRG Readiness Assessment',
            instruction: 'A national health insurance scheme is transitioning from fee-for-service to DRG-based payments in 12 months. Design a hospital readiness assessment covering coding capability, clinical documentation quality, length-of-stay benchmarking, and clinical pathway standardisation.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'ICD-10 Coding Quick Reference', url: 'internal://knowledge/icd10-reference' },
          { title: 'DRG Transition Guide for African Hospitals', url: 'internal://knowledge/drg-transition' },
        ],
        tools: ['Charge Capture Audit Template', 'Coding Accuracy Scorecard', 'DRG Readiness Checklist']
      },
    },
  })

  // Questions for Module 8.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m8_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'ICD-10 contains approximately how many diagnosis codes?',
        options: JSON.stringify([
          { id: 'a', text: '5,000', isCorrect: false },
          { id: 'b', text: '14,000', isCorrect: false },
          { id: 'c', text: '70,000', isCorrect: true },
          { id: 'd', text: '150,000', isCorrect: false },
        ]),
        explanation: 'ICD-10 has over 70,000 diagnosis codes, requiring specificity in laterality, severity, and episode of care that was not required in ICD-9. This complexity demands trained clinical coders.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m8_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Under a DRG-based reimbursement model, hospitals are incentivised to:',
        options: JSON.stringify([
          { id: 'a', text: 'Perform more tests and procedures per patient', isCorrect: false },
          { id: 'b', text: 'Keep patients in hospital longer to justify higher charges', isCorrect: false },
          { id: 'c', text: 'Be efficient because payment is fixed regardless of resources consumed', isCorrect: true },
          { id: 'd', text: 'Refer complex patients to other facilities', isCorrect: false },
        ]),
        explanation: 'DRGs provide a fixed payment per case based on diagnosis and procedures. This means hospitals earn the same amount whether the patient stays 3 days or 10 days, incentivising efficiency and optimal length of stay.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m8_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'CFA\'s charge capture audit typically reveals a revenue leakage rate of what percentage in most African hospitals?',
        options: JSON.stringify([
          { id: 'a', text: '1-3%', isCorrect: false },
          { id: 'b', text: '8-15%', isCorrect: true },
          { id: 'c', text: '25-35%', isCorrect: false },
          { id: 'd', text: '40-50%', isCorrect: false },
        ]),
        explanation: 'The first charge capture audit in most African hospitals reveals a leakage rate of 8-15% of gross revenue. This represents services that were delivered but never billed, making it one of the most fixable sources of financial underperformance.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m8_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A patient with pneumonia complicated by sepsis is coded only for pneumonia. This is an example of:',
        options: JSON.stringify([
          { id: 'a', text: 'Upcoding', isCorrect: false },
          { id: 'b', text: 'Under-coding', isCorrect: true },
          { id: 'c', text: 'Fraud', isCorrect: false },
          { id: 'd', text: 'Correct coding practice', isCorrect: false },
        ]),
        explanation: 'Under-coding occurs when the clinical complexity of care delivered is not fully reflected in the diagnostic codes. This results in the hospital being reimbursed for a simpler case than what was actually treated, directly reducing revenue.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m8_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is NOT listed as a common charge capture leakage point in African hospitals?',
        options: JSON.stringify([
          { id: 'a', text: 'Medications administered but not recorded on the charge sheet', isCorrect: false },
          { id: 'b', text: 'Surgical supplies used but not captured', isCorrect: false },
          { id: 'c', text: 'Bed occupancy charges for empty beds', isCorrect: true },
          { id: 'd', text: 'Ward procedures performed by nurses without a billing trigger', isCorrect: false },
        ]),
        explanation: 'Charging for empty beds would be fraudulent billing, not a charge capture issue. The common leakage points are all legitimate services that were actually delivered but never captured in the billing system.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 8.2: Clinical Coding & Charge Capture - 5 questions')

  // Module 8.3: Billing, Claims & Collections
  const m8_3 = await prisma.trainingModule.create({
    data: {
      trackId: revenueCycle.id,
      name: 'Billing, Claims & Collections',
      slug: 'billing-claims-collections',
      description: 'Master the back end of the revenue cycle: HMO and NHIS billing processes, claims submission and follow-up, denial management, and collection strategies for African healthcare markets.',
      order: 3,
      estimatedMinutes: 110,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'HMO and NHIS Billing Processes',
            type: 'text',
            body: `Billing in African healthcare is fragmented across multiple payer types, each with unique submission requirements, tariff schedules, and processing timelines. The major payer categories are: National Health Insurance Schemes (NHIS in Nigeria, NHIF in Kenya, NHIA in Ghana), private Health Maintenance Organisations (HMOs), corporate medical schemes, and out-of-pocket patients. Each payer requires different documentation, uses different claim forms, and pays at different rates for the same service.

              The billing team must master each payer's requirements. NHIS claims typically require capitation verification, referral authorisation for secondary and tertiary services, and submission within strict deadlines (often 30-60 days from service delivery). HMO claims require pre-authorisation codes, itemised bills matching the approved treatment plan, and supporting clinical documentation. Getting any of these elements wrong results in denial or delayed payment. CFA recommends payer-specific standard operating procedures and dedicated billing staff trained on each payer's requirements rather than generalist billers handling all payers.`
          },
          {
            title: 'Denial Management and Prevention',
            type: 'text',
            body: `Claims denials are the single largest revenue leak in African hospital revenue cycles. Denial rates of 15-30% are common, with some facilities seeing rates above 40% for specific payers. CFA categorises denials into three buckets: preventable denials (registration errors, missing authorisation, late submission), clinical denials (medical necessity disputes, length of stay outliers, uncovered services), and technical denials (coding errors, duplicate claims, formatting issues). In most hospitals, 70-80% of denials are preventable.

              Effective denial management requires a closed-loop process. First, track every denial by reason code and payer. Build a denial dashboard that shows trends over time. Second, work denied claims aggressively within the appeal window (typically 30-90 days depending on the payer). Many hospitals write off denied claims without attempting appeal, leaving significant money on the table. Third, feed denial root causes back to the front end. If 25% of denials are due to missing pre-authorisation, fix the pre-authorisation process rather than repeatedly appealing the same type of denial. Prevention is always cheaper than correction.`
          },
          {
            title: 'Collections Strategy and Aged Receivables',
            type: 'text',
            body: `The probability of collecting a receivable drops sharply with age. Industry data shows that receivables under 30 days have a 95% collection probability, 30-60 days drops to 85%, 60-90 days to 70%, 90-120 days to 50%, and beyond 120 days the probability falls below 30%. This means that speed of follow-up is the most important factor in collections performance, not the aggressiveness of collection tactics.

              CFA recommends a tiered collections strategy. Tier 1 (0-30 days): automated statements and follow-up calls for patient balances; systematic claims tracking for insurer receivables. Tier 2 (31-60 days): personal outreach, payment plan offers for patients; escalation to HMO relationship managers for insurer claims. Tier 3 (61-90 days): final demand letters, credit hold for repeat defaulters (patients); formal dispute filing for insurer claims. Tier 4 (90+ days): evaluate cost-benefit of continued pursuit; consider write-off or third-party collection agency. For NHIS receivables, which in some countries take 6-12 months to pay, hospitals should factor this into cash flow planning and negotiate advance capitation payments where possible.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Denial Analysis',
            instruction: 'You receive a report showing 200 denied claims from the past quarter worth $180,000. Break down the denials by the three CFA categories (preventable, clinical, technical), estimate the percentage in each category, and design 3 specific process changes to reduce the overall denial rate by 50% within 6 months.',
          },
          {
            title: 'Practice: Collections Improvement Plan',
            instruction: 'A hospital has $2.5M in accounts receivable, with 40% over 90 days old. Current monthly collections are $300,000 against $500,000 in monthly billings. Design a 90-day collections improvement plan using the CFA tiered strategy, with specific actions, staffing requirements, and target collection rate improvements.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'HMO/NHIS Billing Guide', url: 'internal://knowledge/hmo-nhis-billing' },
          { title: 'Denial Management Playbook', url: 'internal://knowledge/denial-management' },
        ],
        tools: ['Denial Dashboard Template', 'Collections Aging Tracker', 'Payer SOP Builder']
      },
    },
  })

  // Questions for Module 8.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m8_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, what percentage of claims denials in most African hospitals are preventable?',
        options: JSON.stringify([
          { id: 'a', text: '30-40%', isCorrect: false },
          { id: 'b', text: '50-60%', isCorrect: false },
          { id: 'c', text: '70-80%', isCorrect: true },
          { id: 'd', text: '90-100%', isCorrect: false },
        ]),
        explanation: '70-80% of denials are preventable, falling into categories like registration errors, missing authorisation, and late submission. This means most denials can be eliminated through process improvement rather than claims appeals.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m8_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The probability of collecting a receivable beyond 120 days old falls below:',
        options: JSON.stringify([
          { id: 'a', text: '70%', isCorrect: false },
          { id: 'b', text: '50%', isCorrect: false },
          { id: 'c', text: '30%', isCorrect: true },
          { id: 'd', text: '10%', isCorrect: false },
        ]),
        explanation: 'Collection probability drops sharply with age: 95% under 30 days, 85% at 30-60 days, 70% at 60-90 days, 50% at 90-120 days, and below 30% beyond 120 days. This underscores that speed of follow-up is the most important collections factor.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m8_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'CFA recommends that billing staff should be:',
        options: JSON.stringify([
          { id: 'a', text: 'Generalists who handle all payer types', isCorrect: false },
          { id: 'b', text: 'Dedicated staff trained on specific payer requirements', isCorrect: true },
          { id: 'c', text: 'Clinical staff who also handle their own billing', isCorrect: false },
          { id: 'd', text: 'Outsourced to a third-party billing company', isCorrect: false },
        ]),
        explanation: 'CFA recommends payer-specific standard operating procedures and dedicated billing staff trained on each payer\'s unique requirements (NHIS, HMOs, corporate schemes). Generalist billers are more likely to miss payer-specific documentation requirements.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m8_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the CFA tiered collections strategy, what action is recommended at Tier 2 (31-60 days) for patient balances?',
        options: JSON.stringify([
          { id: 'a', text: 'Automated statements only', isCorrect: false },
          { id: 'b', text: 'Personal outreach and payment plan offers', isCorrect: true },
          { id: 'c', text: 'Final demand letters and credit holds', isCorrect: false },
          { id: 'd', text: 'Referral to a third-party collection agency', isCorrect: false },
        ]),
        explanation: 'Tier 2 (31-60 days) escalates from automated statements to personal outreach and payment plan offers for patients. This human touch at the right time point maximises recovery before the receivable ages further.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m8_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The third step in CFA\'s closed-loop denial management process is:',
        options: JSON.stringify([
          { id: 'a', text: 'Track every denial by reason code and payer', isCorrect: false },
          { id: 'b', text: 'Appeal denied claims within the appeal window', isCorrect: false },
          { id: 'c', text: 'Feed denial root causes back to the front end to prevent recurrence', isCorrect: true },
          { id: 'd', text: 'Write off uncollectable denials', isCorrect: false },
        ]),
        explanation: 'The three steps are: (1) track denials by reason code and payer, (2) work denied claims aggressively within the appeal window, and (3) feed root causes back to the front end to fix the process. Step 3 is what makes it a closed loop, as prevention is always cheaper than correction.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Module 8.3: Billing, Claims & Collections - 5 questions')
  console.log('  Track 8: Revenue Cycle Excellence - 3 modules, 15 questions\n')

  console.log('CFA Training Academy Specialist Level A seeding complete!')
  console.log('  Total: 3 tracks, 9 modules, 45 questions')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
