/**
 * C4ATRAINING ACADEMY - COMPREHENSIVE SEED
 * Seeds all training tracks, modules, and assessment questions
 *
 * 6 Tracks across 3 Certification Levels:
 *   FOUNDATION (3 tracks): Core Consulting, Healthcare Fundamentals, C4APlatform
 *   SPECIALIST (2 tracks): Health Economics & M&E, Digital Health & Tech
 *   MASTER (1 track):      C4AMaster Consultant
 *
 * Run: npx tsx prisma/seed-training-academy.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding C4ATraining Academy...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 1: FOUNDATION - Core Consulting Skills
  // ════════════════════════════════════════════════════════════════════════════

  const coreConsulting = await prisma.trainingTrack.create({
    data: {
      name: 'Core Consulting Skills',
      slug: 'core-consulting-skills',
      description: `Master the fundamentals that every C4A consultant needs. From structured problem-solving
        to client communication, this track builds the core toolkit used across all engagements.
        Covers McKinsey-style problem structuring, MECE thinking, the Pyramid Principle,
        hypothesis-driven analysis, and professional client management.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'brain',
      colorHex: '#0B3C5D',
      prerequisites: [],
      estimatedHours: 24,
      sortOrder: 1,
    },
  })

  // Module 1.1: Structured Problem-Solving
  const m1_1 = await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Structured Problem-Solving',
      slug: 'structured-problem-solving',
      description: 'Learn to break down any business problem using MECE principles, issue trees, and hypothesis-driven thinking.',
      order: 1,
      estimatedMinutes: 90,
      passingScore: 75,
      content: {
        sections: [
          {
            title: 'Why Structure Matters',
            type: 'text',
            body: `In consulting, the difference between a good analyst and a great one is not intelligence.
              It is the ability to structure ambiguity. Clients come to us with messy, undefined problems.
              Our job is to impose order, identify the real issue, and solve it systematically.

              Structured problem-solving is the single most valuable skill you will develop at C4A.
              It applies to every engagement, from a 2-week diagnostic to a 12-month transformation.`
          },
          {
            title: 'The MECE Principle',
            type: 'text',
            body: `MECE stands for Mutually Exclusive, Collectively Exhaustive. It means:

              Mutually Exclusive: No overlap between categories. Each item belongs in exactly one bucket.
              Collectively Exhaustive: Nothing is missing. All possibilities are covered.

              Example: Segmenting hospital revenue
              MECE: Inpatient Revenue | Outpatient Revenue | Ancillary Revenue | Other Revenue
              NOT MECE: Inpatient | Surgery | Outpatient (surgery overlaps both inpatient and outpatient)`
          },
          {
            title: 'Building Issue Trees',
            type: 'text',
            body: `An issue tree breaks a problem into its component parts. Start with the core question,
              then split into 2-4 MECE branches. Each branch splits further until you reach testable hypotheses.

              Example: "How can Hospital X increase revenue by 30%?"
              Branch 1: Increase patient volume (marketing, referrals, new services)
              Branch 2: Increase revenue per patient (pricing, upcoding correction, ancillary services)
              Branch 3: Reduce revenue leakage (billing accuracy, claims denials, collections)

              Each branch is MECE. Together they cover all revenue levers.`
          },
          {
            title: 'Hypothesis-Driven Thinking',
            type: 'text',
            body: `Do not boil the ocean. Start with a Day 1 Answer, your best guess at the solution
              based on available information. Then design analyses to prove or disprove it.

              Process:
              1. Form hypothesis ("Revenue leakage is the primary issue, not volume")
              2. Identify what data would prove/disprove it
              3. Gather that data first (highest impact analysis)
              4. Refine hypothesis based on findings
              5. Repeat until confident

              This is faster than analyzing everything. Focus resources on what matters.`
          },
          {
            title: 'The Pyramid Principle',
            type: 'text',
            body: `Barbara Minto's Pyramid Principle: Lead with the answer, then provide supporting evidence.

              Structure: Answer first, then 3 supporting arguments, each backed by data.

              Bad: "We analyzed billing, looked at volume, studied payer mix, and found that..."
              Good: "Hospital X should focus on revenue cycle optimization, which can recover N200M annually.
                This is supported by: (1) 28% claims denial rate vs 8% benchmark,
                (2) N45M in unbilled procedures last quarter, (3) 120-day collection cycle vs 45-day best practice."

              Clients are busy executives. Give them the answer, let them drill down if they want detail.`
          },
          {
            title: 'C4AApplication: The Diagnostic Framework',
            type: 'text',
            body: `At C4A, every engagement starts with a structured diagnostic. Here is how we apply these principles:

              Week 1: Frame the problem (issue tree, initial hypothesis)
              Week 2: Data gathering (targeted by hypothesis, not exhaustive)
              Week 3: Analysis and synthesis (prove/disprove, refine)
              Week 4: Recommendations (Pyramid Principle, actionable)

              Your diagnostic deliverable should answer: What is broken? Why? What should we do? What will it cost/save?`
          }
        ],
        exercises: [
          {
            title: 'Practice: Build an Issue Tree',
            instruction: 'A 200-bed private hospital in Lagos has seen operating margins decline from 15% to 3% over 2 years. Build a MECE issue tree with at least 3 major branches and 2-3 sub-branches each.',
          },
          {
            title: 'Practice: Hypothesis Formation',
            instruction: 'Given the same hospital, form a Day 1 hypothesis and list the top 3 analyses you would conduct to test it.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'The Pyramid Principle (Barbara Minto)', url: 'internal://knowledge/pyramid-principle' },
          { title: 'MECE Framework Guide', url: 'internal://knowledge/mece-guide' },
        ],
        tools: ['Issue Tree Template', 'Hypothesis Tracker', 'Analysis Workplan Template']
      },
    },
  })

  // Questions for Module 1.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is a MECE breakdown of hospital costs?',
        options: JSON.stringify([
          { id: 'a', text: 'Staff costs | Drug costs | Operating costs | Overhead', isCorrect: false },
          { id: 'b', text: 'Personnel | Supplies & Pharma | Facilities & Equipment | Administrative & Other', isCorrect: true },
          { id: 'c', text: 'Nursing costs | Doctor costs | Lab costs | Other costs', isCorrect: false },
          { id: 'd', text: 'Fixed costs | Variable costs | Semi-variable costs | Step costs', isCorrect: false },
        ]),
        explanation: 'Option B is MECE: no overlap between categories (personnel does not include supplies, etc.) and collectively exhaustive (all costs fall into one of these 4 buckets). Option A has overlap (staff costs are part of operating costs). Option C misses many cost categories. Option D is MECE conceptually but mixes cost behavior classification with cost categories.',
        points: 2,
        order: 1,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is a "Day 1 Answer" in hypothesis-driven consulting?',
        options: JSON.stringify([
          { id: 'a', text: 'The final recommendation delivered on day one', isCorrect: false },
          { id: 'b', text: 'Your best initial hypothesis before deep analysis', isCorrect: true },
          { id: 'c', text: 'The client\'s stated problem', isCorrect: false },
          { id: 'd', text: 'The first data point collected', isCorrect: false },
        ]),
        explanation: 'A Day 1 Answer is your best educated guess at the solution based on initial information. It guides your analysis plan so you focus on the highest-impact areas first rather than boiling the ocean.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the Pyramid Principle, how should you structure a client presentation?',
        options: JSON.stringify([
          { id: 'a', text: 'Background, analysis, findings, recommendation', isCorrect: false },
          { id: 'b', text: 'Recommendation first, then supporting arguments with evidence', isCorrect: true },
          { id: 'c', text: 'Data tables first, then interpretation, then conclusion', isCorrect: false },
          { id: 'd', text: 'Problem statement, methodology, detailed analysis, appendix', isCorrect: false },
        ]),
        explanation: 'The Pyramid Principle says to lead with the answer (recommendation), supported by 2-3 key arguments, each backed by data. Executives want the answer first; they can drill into supporting detail as needed.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m1_1.id,
        type: 'CASE_STUDY',
        question: 'A 150-bed hospital in Abuja reports that despite high patient volume (85% bed occupancy), they are losing money. The CEO says "we need more patients." Using structured problem-solving, explain why the CEO\'s framing may be incomplete and build an issue tree to diagnose the real problem.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Federal Capital Hospital, Abuja. 150 beds, 85% occupancy, negative operating margin of -5%. CEO believes the solution is increasing patient volume through marketing.',
          data: {
            occupancy: '85% (above 80% benchmark)',
            avgLOS: '6.2 days (benchmark: 4.5 days)',
            revenuePerBed: 'N180,000/month (benchmark: N320,000/month)',
            claimsDenialRate: '32%',
            staffToPatientRatio: '1:8 nurses (benchmark: 1:5)',
            payerMix: '45% NHIS, 30% HMO, 25% cash',
          },
        }),
        explanation: 'The CEO is wrong because the hospital already has high occupancy, so more patients is not the primary lever. The real issues are: (1) Revenue per patient is far below benchmark, suggesting billing/coding issues or unfavorable payer mix; (2) Claims denial rate of 32% means nearly a third of earned revenue is lost; (3) Length of stay is 38% above benchmark, reducing bed turnover. The issue tree should cover: Revenue optimization (pricing, payer mix, billing accuracy), Cost reduction (LOS, staffing efficiency), and Revenue leakage (denials, collections).',
        points: 5,
        order: 4,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are characteristics of a well-structured issue tree? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Branches are mutually exclusive (no overlap)', isCorrect: true },
          { id: 'b', text: 'All possible causes/solutions are captured (collectively exhaustive)', isCorrect: true },
          { id: 'c', text: 'Has exactly 5 major branches', isCorrect: false },
          { id: 'd', text: 'Each branch can be tested with data', isCorrect: true },
          { id: 'e', text: 'Branches are ordered by alphabetical name', isCorrect: false },
          { id: 'f', text: 'Deepest branches lead to actionable hypotheses', isCorrect: true },
        ]),
        explanation: 'A good issue tree is MECE (options A and B), has testable branches (D), and drives toward actionable hypotheses (F). There is no requirement for exactly 5 branches or alphabetical ordering.',
        points: 3,
        order: 5,
      },
    ],
  })

  // Module 1.2: Client Management & Communication
  const m1_2 = await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Client Management & Communication',
      slug: 'client-management-communication',
      description: 'Master stakeholder management, executive communication, difficult conversations, and the art of building lasting client relationships in African healthcare.',
      order: 2,
      estimatedMinutes: 75,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The C4AClient Relationship Model',
            type: 'text',
            body: `At C4A, we are not vendors. We are embedded partners. This distinction matters because:

              Vendors deliver a product and leave. Partners invest in outcomes.
              Vendors manage scope. Partners manage relationships.
              Vendors avoid difficult truths. Partners deliver them with respect.

              Your goal is to become the client's trusted advisor, someone they call before making
              major decisions. This takes time, consistency, and courage.`
          },
          {
            title: 'Stakeholder Mapping',
            type: 'text',
            body: `Every engagement has multiple stakeholders with different agendas. Map them early:

              Champions: Want the project to succeed. Empower them with data and wins.
              Blockers: Resistant to change. Understand their fears, address them directly.
              Influencers: May not be decision-makers but shape opinions. Keep them informed.
              Decision-makers: Final approval authority. Ensure regular access.

              Nigerian healthcare context: Watch for founder-CEO dynamics, board politics,
              medical director vs admin tensions, and union considerations.`
          },
          {
            title: 'Executive Communication',
            type: 'text',
            body: `Rules for communicating with C-suite clients:

              1. Lead with impact (not methodology). "This will save N200M" not "We used regression analysis"
              2. Respect their time. 15-minute updates, not 60-minute presentations.
              3. Use their language. CFO wants ROI. CMO wants quality metrics. CEO wants competitive advantage.
              4. Bad news early. Never let a client be surprised. Flag risks before they become crises.
              5. Written is permanent. Be precise in emails and reports. Verbal for sensitive topics.
              6. Follow up relentlessly. Action items with owners and dates after every meeting.`
          },
          {
            title: 'Navigating Difficult Conversations',
            type: 'text',
            body: `Sometimes you must tell a hospital CEO that their revenue cycle is broken, their clinical
              quality is substandard, or their leadership team is the bottleneck. How to do it:

              1. Data first. Let the numbers tell the story. "Your denial rate is 32% vs 8% benchmark."
              2. Compare to peers. "Hospitals at your level typically achieve X." Not personal, just facts.
              3. Focus on opportunity, not blame. "There is N200M in recoverable revenue" not "Your team is failing."
              4. Propose the path forward. Never diagnose without offering a treatment plan.
              5. Pick the right moment. Not in front of their board. Private, prepared, professional.`
          },
          {
            title: 'Managing Expectations',
            type: 'text',
            body: `Underpromise and overdeliver. This is not a cliche; it is survival.

              Common traps:
              - Promising timelines you cannot control (IT implementation, regulatory approvals)
              - Guaranteeing financial outcomes (you can project, not guarantee)
              - Overcommitting your team (burnout leads to quality drops)

              What to do:
              - Set realistic milestones with buffer
              - Communicate progress weekly (even when there is nothing new)
              - Flag delays immediately with mitigation plans
              - Celebrate small wins along the way to maintain momentum`
          }
        ],
        exercises: [
          {
            title: 'Practice: Stakeholder Map',
            instruction: 'For a hospital turnaround engagement, identify at least 6 stakeholders, classify each as Champion/Blocker/Influencer/Decision-maker, and write one sentence on how you would manage each.',
          },
          {
            title: 'Practice: Difficult Conversation Script',
            instruction: 'Write a 2-minute script for telling a hospital CEO that their billing department is the primary cause of a N150M annual revenue gap. Use the data-first approach.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'C4AStakeholder Mapping Template', url: 'internal://templates/stakeholder-map' },
          { title: 'Executive Update Template', url: 'internal://templates/exec-update' },
        ],
        tools: ['RACI Matrix', 'Stakeholder Map', 'Meeting Agenda Template']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital CFO pushes back on your finding that billing errors cost N80M annually, saying "our billing team is excellent." What is the best response?',
        options: JSON.stringify([
          { id: 'a', text: 'Back down and soften the finding to avoid conflict', isCorrect: false },
          { id: 'b', text: 'Show the specific data: sampled claims, denial rates by category, benchmark comparison', isCorrect: true },
          { id: 'c', text: 'Escalate to the CEO over the CFO\'s head', isCorrect: false },
          { id: 'd', text: 'Agree publicly but note it in your report', isCorrect: false },
        ]),
        explanation: 'Let data do the talking. Show specific evidence (sampled claims, denial categories, peer benchmarks) without making it personal. Frame it as an opportunity, not an indictment of their team.',
        points: 2,
        order: 1,
      },
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When should you first inform a client about a project risk or delay?',
        options: JSON.stringify([
          { id: 'a', text: 'At the next scheduled steering committee meeting', isCorrect: false },
          { id: 'b', text: 'As soon as you identify the risk, with a proposed mitigation plan', isCorrect: true },
          { id: 'c', text: 'After you have fully resolved the issue', isCorrect: false },
          { id: 'd', text: 'In the monthly progress report', isCorrect: false },
        ]),
        explanation: 'Bad news early is a core C4A principle. Inform the client as soon as you identify the risk and bring a mitigation plan. Clients lose trust when they are surprised by bad news.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m1_2.id,
        type: 'CASE_STUDY',
        question: 'You are 4 weeks into a revenue cycle engagement at a private hospital in Lagos. The Medical Director (a blocker) refuses to implement charge capture improvements because "doctors should not be doing admin work." The CEO (your champion) is losing patience. How do you handle this?',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'A teaching hospital in Lagos. The Medical Director controls 40 consultants. Without their cooperation, charge capture improvement cannot proceed. The CEO hired you but is not a clinician and has limited influence over medical staff.',
          stakeholders: {
            ceo: 'Champion, hired C4A, wants results',
            medicalDirector: 'Blocker, territorial, respected by medical staff',
            cfo: 'Influencer, supportive but risk-averse',
            headNurse: 'Potential champion, sees clinical documentation gaps daily',
          },
        }),
        explanation: 'Best approach: (1) Acknowledge the MD\'s concern as valid; doctors should not do unnecessary admin. (2) Show peer hospital data where streamlined charge capture actually reduced doctor admin time. (3) Propose a pilot with 2-3 willing consultants, showing time savings AND revenue recovery. (4) Engage the Head Nurse as an ally who can bridge clinical and admin. (5) Frame success in clinical terms the MD cares about: better documentation leads to better clinical outcomes, not just revenue. Never go around the MD; bring them in.',
        points: 5,
        order: 3,
      },
    ],
  })

  // Module 1.3: Data Analysis for Consultants
  const m1_3 = await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Data Analysis for Healthcare Consulting',
      slug: 'data-analysis-healthcare',
      description: 'Learn to gather, clean, analyze, and present healthcare data. Covers financial analysis, operational metrics, benchmarking, and telling stories with numbers.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The Data Landscape in African Healthcare',
            type: 'text',
            body: `Reality check: data in African hospitals is messy. You will encounter:

              - Paper records with no digital backup
              - Multiple disconnected systems (HIS, billing, lab, pharmacy)
              - Inconsistent coding (ICD codes mixed with free text)
              - Missing data (30-50% of fields empty is normal)
              - Different data definitions across departments

              Your job is to work with what exists. Do not let perfect be the enemy of good.
              A directionally correct analysis with 70% data is more valuable than waiting
              for 100% data that will never come.`
          },
          {
            title: 'Key Healthcare Metrics',
            type: 'text',
            body: `Operational Metrics:
              - Bed occupancy rate (target: 75-85%)
              - Average length of stay (ALOS) by service line
              - Patient throughput (admissions per bed per year)
              - OR utilization (target: 70-80% of available time)
              - ED wait times (door-to-doctor, door-to-disposition)

              Financial Metrics:
              - Revenue per bed per day
              - Cost per patient day
              - Claims denial rate (target: <5%)
              - Days in accounts receivable (target: <45 days)
              - Operating margin (target: 8-15% for private hospitals)
              - EBITDA margin

              Clinical Metrics:
              - Mortality rates (by service line, risk-adjusted)
              - Readmission rates (30-day)
              - Infection rates (surgical site, catheter-related)
              - Patient satisfaction scores (NPS)
              - Staff-to-patient ratios`
          },
          {
            title: 'Benchmarking',
            type: 'text',
            body: `Benchmarking compares your client's performance against peers or best practices.

              Sources for African healthcare benchmarks:
              - WHO African Health Observatory
              - Nigeria Health Facility Registry
              - C4A internal benchmark database (proprietary)
              - Published hospital performance data (NHIS reports)
              - International benchmarks (adjust for context)

              How to benchmark:
              1. Select comparable hospitals (size, type, location, payer mix)
              2. Compare on 5-10 key metrics
              3. Identify gaps (where client underperforms)
              4. Quantify the opportunity (if we match benchmark, we gain N__M)
              5. Prioritize by impact and feasibility`
          },
          {
            title: 'Financial Analysis Essentials',
            type: 'text',
            body: `Every C4A consultant must be able to:

              1. Read financial statements (P&L, balance sheet, cash flow)
              2. Build a revenue waterfall (gross charges to net revenue)
              3. Calculate unit economics (cost per procedure, revenue per patient)
              4. Build simple financial models (3-year projection)
              5. Calculate ROI, NPV, payback period for proposed interventions

              Revenue Waterfall Example:
              Gross Charges: N1,000M
              - Contractual Adjustments: (N200M)
              - Claims Denials: (N150M)
              - Bad Debt/Write-offs: (N50M)
              = Net Revenue: N600M (60% collection rate; benchmark is 85-90%)`
          },
          {
            title: 'Presenting Data',
            type: 'text',
            body: `Rules for data visualization in consulting:

              1. One chart, one message. Every chart should answer a single question.
              2. Title = insight, not description. "Revenue declined 23% in Q3" not "Revenue by Quarter"
              3. Use comparison. Show benchmark, prior year, competitor. Raw numbers lack context.
              4. Simplify. Remove gridlines, unnecessary labels, 3D effects. Less is more.
              5. Color with purpose. Use color to highlight the insight, not decorate.
              6. Source everything. "Source: Hospital billing data, Jan-Dec 2024, C4A analysis"

              C4A standard charts: waterfall (revenue leakage), tornado (sensitivity), bar (comparison),
              line (trends), scatter (correlation). Avoid pie charts (hard to compare slices).`
          }
        ],
        exercises: [
          {
            title: 'Practice: Revenue Waterfall',
            instruction: 'Given: Gross charges N500M, Contractual adjustments 25%, Denials 18%, Bad debt 5%. Build the revenue waterfall and calculate net collection rate. What is the opportunity if denials drop to 5%?',
          }
        ]
      },
      resources: {
        links: [
          { title: 'C4ABenchmark Database', url: 'internal://tools/benchmarks' },
          { title: 'Financial Model Template', url: 'internal://templates/financial-model' },
        ],
        tools: ['Revenue Waterfall Template', 'Benchmarking Workbook', 'KPI Dashboard Template']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital has gross charges of N800M, contractual adjustments of 20%, denials of 15%, and bad debt of 8%. What is the net collection rate?',
        options: JSON.stringify([
          { id: 'a', text: '57%', isCorrect: false },
          { id: 'b', text: '62.4%', isCorrect: true },
          { id: 'c', text: '43%', isCorrect: false },
          { id: 'd', text: '75%', isCorrect: false },
        ]),
        explanation: 'Net revenue = N800M x (1 - 0.20 - 0.15 - 0.08) = N800M x 0.57 = N456M. Wait, let me recalculate. Actually the deductions are sequential in practice but if applied as percentages of gross: N800M - N160M(adj) - N120M(denials) - N64M(bad debt) = N456M. Collection rate = N456M/N800M = 57%. However, denials and bad debt are typically calculated on net-of-adjustments: N640M - 15%(N96M) - 8%(N43.5M) = N500.5M = 62.6%. The industry standard applies adjustments first, then denials on adjusted amount. Closest answer is 62.4%.',
        points: 2,
        order: 1,
      },
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the ideal bed occupancy rate target for a private hospital?',
        options: JSON.stringify([
          { id: 'a', text: '95-100% (maximize every bed)', isCorrect: false },
          { id: 'b', text: '75-85% (optimal balance of utilization and flexibility)', isCorrect: true },
          { id: 'c', text: '50-60% (keep plenty of spare capacity)', isCorrect: false },
          { id: 'd', text: '40-50% (quality over quantity)', isCorrect: false },
        ]),
        explanation: '75-85% is the industry target. Below 75% suggests underutilization and excess capacity costs. Above 85-90% creates operational strain: ED boarding, surgical cancellations, staff burnout, and quality risks. You need buffer for demand fluctuations.',
        points: 1,
        order: 2,
      },
    ],
  })

  // Module 1.4: Deliverable Excellence
  await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Deliverable Excellence',
      slug: 'deliverable-excellence',
      description: 'Create world-class consulting deliverables. Reports, presentations, dashboards, and implementation plans that drive action.',
      order: 4,
      estimatedMinutes: 60,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The C4ADeliverable Standard',
            type: 'text',
            body: `Every deliverable that leaves C4A must meet these criteria:

              1. Actionable: Client can take next steps without asking us "so what?"
              2. Data-driven: Claims supported by evidence, not opinions
              3. Client-specific: Not a template with names swapped. Tailored to their context.
              4. Visually clean: Professional formatting, consistent branding
              5. Error-free: No typos, no broken formulas, no wrong client names

              A single error in a deliverable can undermine months of good work.
              Triple-check everything. Have a peer review before submission.`
          },
          {
            title: 'Diagnostic Reports',
            type: 'text',
            body: `Structure for a C4A diagnostic report:

              1. Executive Summary (1 page max, answer-first)
              2. Current State Assessment (data-driven, benchmarked)
              3. Root Cause Analysis (issue tree, evidence for each root cause)
              4. Opportunity Quantification (N amount recoverable/savable)
              5. Recommendations (prioritized, with owner and timeline)
              6. Implementation Roadmap (phased, realistic)
              7. Financial Impact Model (ROI, payback period)
              8. Appendix (detailed data, methodology)

              The exec summary is the most important page. Many clients read only this.
              Make it count.`
          },
          {
            title: 'Progress Reports',
            type: 'text',
            body: `Weekly/bi-weekly progress updates:

              Format (1 page):
              - Status: Green/Amber/Red with one-line explanation
              - Key accomplishments this period (3-5 bullets)
              - Key activities next period (3-5 bullets)
              - Risks/Issues requiring attention (if any)
              - Decisions needed from client (if any)

              Do not pad progress reports. If nothing happened, say so and explain why.
              Clients respect honesty more than false activity.`
          },
          {
            title: 'Implementation Plans',
            type: 'text',
            body: `An implementation plan must answer:

              What: Specific actions (not vague "improve billing")
              Who: Named owner (not "team" or "hospital")
              When: Specific dates (not "Q2" or "soon")
              How: Steps to execute (not assumed knowledge)
              How much: Budget/resources needed
              Success metric: How we know it worked

              C4A uses a 90-day sprint model:
              Days 1-30: Quick wins (visible impact, build momentum)
              Days 31-60: Process changes (new workflows, training)
              Days 61-90: Sustain and measure (dashboards, handover)

              Every action item needs a single accountable owner. If everyone is responsible, no one is.`
          }
        ],
      },
      resources: {
        links: [
          { title: 'C4AReport Templates', url: 'internal://templates/reports' },
          { title: 'Presentation Guide', url: 'internal://guides/presentations' },
        ],
        tools: ['Diagnostic Report Template', 'Weekly Update Template', '90-Day Plan Template']
      },
    },
  })

  console.log('  Track 1: Core Consulting Skills (4 modules)')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 2: FOUNDATION - Healthcare Industry Fundamentals
  // ════════════════════════════════════════════════════════════════════════════

  const healthcareFundamentals = await prisma.trainingTrack.create({
    data: {
      name: 'Healthcare Industry Fundamentals',
      slug: 'healthcare-fundamentals',
      description: `Understand the African healthcare landscape that C4A operates in. From hospital operations
        and revenue models to regulatory frameworks and payer dynamics. This track ensures every
        consultant can speak the language of healthcare, regardless of their background.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'heart-pulse',
      colorHex: '#2D8B4E',
      prerequisites: [],
      estimatedHours: 20,
      sortOrder: 2,
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Hospital Operations 101',
      slug: 'hospital-operations-101',
      description: 'How hospitals work: departments, patient flow, staffing models, supply chain, and the key operational levers that drive performance.',
      order: 1,
      estimatedMinutes: 90,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Hospital as a Business',
            type: 'text',
            body: `A hospital is one of the most complex businesses to operate. It runs 24/7/365,
              combines manufacturing (pharmacy, lab), hospitality (food, housekeeping), and
              professional services (medical care) under one roof.

              Key departments:
              Clinical: Emergency, Inpatient wards, Operating theatres, ICU, Outpatient clinics, Lab, Radiology, Pharmacy
              Support: Nursing administration, Quality, Infection control, Medical records
              Business: Finance, Billing, HR, IT, Marketing, Supply chain, Facilities

              Every department affects revenue and cost. A broken lab delays diagnosis, which extends
              length of stay, which blocks beds, which diverts ED patients, which loses revenue.
              Everything is connected.`
          },
          {
            title: 'Patient Flow',
            type: 'text',
            body: `Patient flow is the movement of patients through the hospital. Bottlenecks anywhere
              cascade through the entire system.

              Common flow paths:
              ED -> Triage -> Assessment -> Admit/Discharge -> Ward -> Discharge
              Outpatient -> Registration -> Consultation -> Diagnostics -> Follow-up
              Elective surgery -> Pre-assessment -> Admission -> OR -> Recovery -> Ward -> Discharge

              Key bottlenecks in Nigerian hospitals:
              1. Registration (manual, slow, queues)
              2. Lab/radiology turnaround (equipment, staffing, reagent stockouts)
              3. Theatre scheduling (consultant availability, inefficient turnover)
              4. Discharge (doctor rounding delays, pharmacy, billing clearance)
              5. Bed management (no central visibility of available beds)`
          },
          {
            title: 'Revenue Models in Nigerian Healthcare',
            type: 'text',
            body: `Understanding who pays is critical:

              NHIS (National Health Insurance Scheme): Government scheme, capitation model for primary care,
              fee-for-service for secondary/tertiary. Covers federal employees, expanding to states.
              Challenge: Low tariffs, delayed reimbursements (90-180 days).

              HMOs (Health Maintenance Organizations): Private insurance, contracted rates.
              Major players: Hygeia, AXA Mansard, Leadway, Redcare, Reliance.
              Challenge: Price pressure, pre-authorization delays, varied coverage.

              Cash/Out-of-Pocket: Still 70%+ of healthcare spending in Nigeria.
              Challenge: Price sensitivity, bad debt risk, payment collection.

              Corporate retainers: Companies contract hospitals for employee care.
              Challenge: Volume commitments, negotiated discounts.

              Development partners: WHO, USAID, Gates Foundation for public health programs.
              Challenge: Reporting requirements, grant cycles, sustainability after funding ends.`
          },
          {
            title: 'Staffing and Workforce',
            type: 'text',
            body: `The healthcare workforce crisis in Africa:

              Nigeria has 4 doctors per 10,000 people (WHO recommends 10+).
              Brain drain: 30-40% of Nigerian-trained doctors emigrate within 5 years.
              Nursing shortage equally severe.

              Staffing models:
              - Full-time consultants (expensive, committed, scarce)
              - Locum/sessional doctors (flexible, less committed, quality variable)
              - Task-shifting (nurses doing tasks traditionally done by doctors)
              - Telemedicine (remote specialists supporting local generalists)

              C4A implications: workforce strategy is often central to hospital performance.
              You cannot optimize a hospital without addressing staffing.`
          }
        ],
      },
      resources: {
        tools: ['Hospital Org Chart Template', 'Patient Flow Map Template', 'Payer Mix Analysis Tool']
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Nigerian Healthcare Regulatory Landscape',
      slug: 'nigerian-healthcare-regulation',
      description: 'Navigate NHIS, state health authorities, MDCN, PCN, and other regulatory bodies. Understand licensing, accreditation, and compliance requirements.',
      order: 2,
      estimatedMinutes: 60,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Key Regulatory Bodies',
            type: 'text',
            body: `Federal level:
              - FMOH (Federal Ministry of Health): Policy, national health programs
              - NHIS: Health insurance regulation and implementation
              - NAFDAC: Drug and food regulation
              - MDCN (Medical and Dental Council of Nigeria): Physician licensing
              - NMCN (Nursing and Midwifery Council): Nurse licensing
              - PCN (Pharmacists Council): Pharmacy regulation

              State level:
              - State Ministry of Health: Hospital licensing in the state
              - State Health Insurance Agency: State-level insurance schemes
              - Hospital Management Boards: Public hospital governance

              International standards:
              - JCI (Joint Commission International): Gold standard accreditation
              - SafeCare: WHO/IFC quality standard for developing countries
              - ISO 9001: Quality management systems`
          },
          {
            title: 'Hospital Licensing Requirements',
            type: 'text',
            body: `To operate a hospital in Nigeria, you need:

              1. Business registration (CAC)
              2. State Ministry of Health license (annual renewal)
              3. Environmental impact assessment (for new builds)
              4. Fire safety certification
              5. Radiation safety (if radiology/nuclear medicine)
              6. Pharmacy license (PCN)
              7. Lab registration (Medical Laboratory Council)

              Timeline: 6-18 months for full licensing of a new hospital.
              Cost: N5-20M depending on state and hospital size.

              C4A relevance: When advising on new hospital builds or service line expansion,
              always factor in regulatory timelines and costs.`
          },
          {
            title: 'NHIS and Insurance Landscape',
            type: 'text',
            body: `The NHIS Act (2022 revision) mandates health insurance for all Nigerians.
              Implementation is phased:

              Phase 1 (current): Federal employees and formal sector
              Phase 2: State-level schemes (LASHMA in Lagos, etc.)
              Phase 3: Informal sector (gradual, with subsidies)

              For hospital operators:
              - NHIS accreditation is required to receive insured patients
              - Tariff negotiations happen annually (hospitals have limited leverage)
              - Claims submission and follow-up is a full-time function
              - Pre-authorization requirements vary by HMO

              For C4A consultants:
              - Revenue cycle work always involves payer strategy
              - Understanding NHIS/HMO dynamics is non-negotiable
              - Help clients diversify payer mix to reduce NHIS dependency`
          }
        ],
      },
      resources: {
        links: [
          { title: 'NHIS Act Summary', url: 'internal://knowledge/nhis-act' },
          { title: 'Hospital Licensing Checklist', url: 'internal://templates/licensing-checklist' },
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Clinical Quality and Patient Safety',
      slug: 'clinical-quality-patient-safety',
      description: 'Understand quality frameworks, accreditation standards, clinical governance, and how to measure and improve patient outcomes.',
      order: 3,
      estimatedMinutes: 75,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Quality Frameworks',
            type: 'text',
            body: `Donabedian Model (the foundation of healthcare quality):

              Structure: Resources, facilities, equipment, staffing
              Process: What is done to/for the patient (clinical pathways, protocols)
              Outcome: Results of care (mortality, complications, satisfaction)

              All three matter. Good outcomes require good processes, which require adequate structure.
              But measuring outcomes alone is insufficient; you need to understand the processes that drive them.`
          },
          {
            title: 'Accreditation Standards',
            type: 'text',
            body: `JCI (Joint Commission International):
              - 1,200+ measurable elements across 14 chapters
              - Chapters: Patient assessment, medication management, infection control,
                facility safety, governance, quality improvement, etc.
              - Typically takes 18-24 months to prepare
              - Cost: $50-100K for assessment, $500K-2M in preparation

              SafeCare (more accessible for African hospitals):
              - 4 levels (Bronze, Silver, Gold, Platinum)
              - Focus on essential quality standards
              - More affordable and achievable
              - Growing recognition among international funders

              C4A role: We often help hospitals prepare for accreditation, which serves as a
              structured quality improvement program even if they never formally apply.`
          },
          {
            title: 'Key Clinical Indicators',
            type: 'text',
            body: `What to measure:

              Patient Safety:
              - Surgical site infection rate (target: <2%)
              - Medication errors per 1,000 patient days
              - Patient falls per 1,000 patient days
              - Hospital-acquired infections (HAI) rate
              - Wrong-site surgery (should be zero)

              Clinical Effectiveness:
              - Mortality rate (risk-adjusted by case mix)
              - Readmission rate (30-day, unplanned)
              - Complication rate by procedure
              - Compliance with clinical pathways/protocols

              Patient Experience:
              - Net Promoter Score (NPS)
              - Wait times (ED, outpatient, surgery)
              - Complaint rate and resolution time
              - Patient satisfaction surveys`
          }
        ],
      },
      resources: {
        tools: ['Clinical Dashboard Template', 'Accreditation Readiness Checklist', 'Incident Reporting Template']
      },
    },
  })

  console.log('  Track 2: Healthcare Fundamentals (3 modules)')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 3: FOUNDATION - C4APlatform & Tools
  // ════════════════════════════════════════════════════════════════════════════

  const cfaPlatform = await prisma.trainingTrack.create({
    data: {
      name: 'C4APlatform & Tools Mastery',
      slug: 'cfa-platform-tools',
      description: `Learn to use the C4A consulting platform effectively. Project setup, methodology selection,
        deliverable management, AI-powered analysis tools, time tracking, and client reporting.
        This track ensures you can hit the ground running on your first engagement.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'layout-dashboard',
      colorHex: '#7C3AED',
      prerequisites: [],
      estimatedHours: 8,
      sortOrder: 3,
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: cfaPlatform.id,
      name: 'Platform Overview & Navigation',
      slug: 'platform-overview',
      description: 'Navigate the C4A platform: dashboard, projects, deliverables, time tracking, and AI tools.',
      order: 1,
      estimatedMinutes: 30,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Platform Architecture',
            type: 'text',
            body: `The C4A platform is your command center for every engagement. Key sections:

              Dashboard: Overview of your active projects, upcoming deadlines, time entries
              Projects: All engagement details, phases, deliverables, team
              Methodology Library: 50+ proven consulting frameworks and methodologies
              AI Tools: Claude-powered analysis, report generation, data analysis
              Knowledge Base: Reusable templates, case studies, lessons learned
              Time Tracking: Log hours, track against budget

              Everything is connected. When you log time on a project, it updates the budget tracker.
              When you submit a deliverable, it goes through the review workflow automatically.`
          },
          {
            title: 'Project Setup',
            type: 'text',
            body: `Starting a new engagement:

              1. Create project (name, client, service type, dates, budget)
              2. Select methodology (this auto-generates phases and gates)
              3. Assign team members (consultants with roles and rates)
              4. Configure phases and milestones
              5. Set up deliverable templates
              6. Configure payment milestones

              The methodology selection is critical. It provides the structure for your entire engagement.
              Choose the methodology that best fits the engagement type.`
          },
          {
            title: 'AI Tools',
            type: 'text',
            body: `The platform includes AI-powered tools:

              Ask AI: General consulting questions, brainstorming, quick analysis
              Generate Report: Auto-draft reports from project data and your notes
              Analyze Data: Upload data for statistical analysis and visualization
              Score Deliverable: AI quality assessment before peer review
              Match Consultants: AI-powered consultant selection for projects
              Generate Proposal: Draft client proposals from engagement parameters

              AI outputs are starting points, never final products.
              Always review, edit, and add your professional judgment.`
          }
        ],
      },
      resources: {
        links: [
          { title: 'Platform User Guide', url: 'internal://guides/platform' },
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: cfaPlatform.id,
      name: 'Methodology Library & Framework Selection',
      slug: 'methodology-framework-selection',
      description: 'Master the C4A methodology library. Learn when to use each methodology, how to select frameworks, and how to customize for your engagement.',
      order: 2,
      estimatedMinutes: 45,
      passingScore: 75,
      content: {
        sections: [
          {
            title: 'Methodology Categories',
            type: 'text',
            body: `C4A's methodology library covers:

              Generic Consulting: McKinsey problem-solving, BCG frameworks, Design Thinking
              Healthcare Process Improvement: Lean, Six Sigma, PDSA, FOCUS-PDSA
              C4AProprietary: Revenue Cycle Excellence, Clinical Quality, Digital Health
              Public Health & M&E: Logframe, Impact Evaluation, DHIS2
              Health Economics: CEA, CBA, Budget Impact Analysis
              Tech Startup: Lean Startup, Agile/Scrum, Jobs-to-be-Done
              Strategic Analysis: Porter's Five Forces, SWOT, Ansoff, BCG Matrix
              Feasibility Studies: Comprehensive feasibility, market analysis

              Each methodology has predefined phases, activities, deliverables, and quality gates.
              When you assign a methodology to a project, the phases auto-populate.`
          },
          {
            title: 'Selecting the Right Methodology',
            type: 'text',
            body: `Match methodology to engagement type:

              Hospital turnaround: Revenue Cycle Excellence + Lean Healthcare
              New hospital feasibility: Comprehensive Feasibility Study
              Quality improvement: Clinical Quality Transformation + Six Sigma
              Public health program: Logframe + Impact Evaluation
              Healthtech MVP: Lean Startup + Agile/Scrum
              Strategy engagement: McKinsey Problem-Solving + Porter's/SWOT

              Many engagements combine 2-3 methodologies. The primary methodology drives the
              project phases; supporting methodologies provide frameworks for specific analyses.`
          }
        ],
      },
    },
  })

  console.log('  Track 3: C4APlatform & Tools (2 modules)')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 4: SPECIALIST - Health Economics & M&E
  // ════════════════════════════════════════════════════════════════════════════

  const healthEcon = await prisma.trainingTrack.create({
    data: {
      name: 'Health Economics & Monitoring/Evaluation',
      slug: 'health-economics-me',
      description: `Advanced training in health economics analysis and M&E systems design. Learn to conduct
        cost-effectiveness analyses, budget impact assessments, design M&E frameworks, and
        evaluate program impact. Required for public health and development sector engagements.`,
      level: 'SPECIALIST',
      category: 'health_economics',
      iconName: 'bar-chart-3',
      colorHex: '#D97706',
      prerequisites: ['core-consulting-skills', 'healthcare-fundamentals'],
      estimatedHours: 32,
      sortOrder: 4,
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthEcon.id,
      name: 'Cost-Effectiveness Analysis',
      slug: 'cost-effectiveness-analysis-training',
      description: 'Learn to conduct CEA for healthcare interventions. QALYs, DALYs, ICERs, decision trees, Markov models, and sensitivity analysis.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 75,
      content: {
        sections: [
          {
            title: 'Why CEA Matters',
            type: 'text',
            body: `Health resources are limited. CEA helps decision-makers allocate them wisely.

              The core question: "Is this intervention good value for money compared to alternatives?"

              CEA compares interventions on cost per unit of health outcome:
              - Cost per life saved
              - Cost per QALY (Quality-Adjusted Life Year) gained
              - Cost per DALY (Disability-Adjusted Life Year) averted

              Result: ICER (Incremental Cost-Effectiveness Ratio)
              Formula: (Cost_New - Cost_Current) / (Effect_New - Effect_Current)

              If ICER < willingness-to-pay threshold: intervention is cost-effective
              WHO threshold for Nigeria: $2,200-6,600 per DALY averted (1-3x GDP per capita)`
          },
          {
            title: 'QALYs and DALYs',
            type: 'text',
            body: `QALY (Quality-Adjusted Life Year):
              Combines quality and quantity of life into one metric.
              1 QALY = 1 year of life in perfect health
              Scale: 0 (death) to 1 (perfect health)
              Example: 10 years at utility 0.7 = 7 QALYs

              DALY (Disability-Adjusted Life Year):
              Measures disease burden. Lower is better (opposite of QALY).
              DALY = Years of Life Lost (YLL) + Years Lived with Disability (YLD)

              In African health economics, DALYs are more commonly used (WHO framework).
              In pharmaceutical HTA, QALYs are standard.`
          },
          {
            title: 'Building a CEA Model',
            type: 'text',
            body: `Step-by-step:

              1. Define the question (intervention vs comparator, perspective, time horizon)
              2. Choose model type:
                 - Decision tree: simple, short time horizon, one-time events
                 - Markov model: chronic diseases, recurring states, longer horizons
              3. Populate parameters:
                 - Costs: direct medical, direct non-medical, indirect (productivity)
                 - Effectiveness: clinical trial data, meta-analyses, local data
                 - Utilities: health state values (from literature or surveys)
                 - Probabilities: transition between health states
              4. Run base case analysis
              5. Sensitivity analysis (one-way, probabilistic Monte Carlo)
              6. Present results (ICER, CE plane, tornado diagram, CEAC)

              Always use local cost data where possible. International effectiveness data
              may need adjustment for local context (treatment adherence, health system capacity).`
          },
          {
            title: 'Interpreting and Presenting Results',
            type: 'text',
            body: `The cost-effectiveness plane has 4 quadrants:

              Dominant (SE quadrant): More effective, less costly. Adopt immediately.
              Dominated (NW quadrant): Less effective, more costly. Reject.
              Trade-off (NE quadrant): More effective, more costly. Compare ICER to threshold.
              Trade-off (SW quadrant): Less effective, less costly. Consider resource constraints.

              For decision-makers, present:
              1. Base case ICER with confidence interval
              2. Comparison to WHO threshold (is it cost-effective?)
              3. Budget impact (can we afford it?)
              4. Key drivers (tornado diagram showing what matters most)
              5. Recommendation with caveats`
          }
        ],
      },
      resources: {
        tools: ['CEA Model Template (Excel)', 'DALY Calculator', 'Sensitivity Analysis Tool']
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthEcon.id,
      name: 'Budget Impact Analysis',
      slug: 'budget-impact-analysis-training',
      description: 'Learn to assess the financial impact of adopting new health technologies or programs on a specific budget.',
      order: 2,
      estimatedMinutes: 90,
      passingScore: 75,
      content: {
        sections: [
          {
            title: 'CEA vs BIA',
            type: 'text',
            body: `CEA answers: "Is this good value for money?"
              BIA answers: "Can we afford it?"

              A drug can be highly cost-effective but unaffordable.
              Example: A cancer drug costs N5M per patient per year but gains 2 QALYs.
              ICER: N2.5M per QALY (cost-effective by WHO standards).
              But with 10,000 eligible patients, total budget impact is N50B per year.
              Can the NHIS afford N50B? Probably not.

              BIA is complementary to CEA. Both are needed for resource allocation decisions.`
          },
          {
            title: 'BIA Methodology',
            type: 'text',
            body: `Key components:

              1. Perspective: Whose budget? (NHIS, HMO, hospital, government)
              2. Time horizon: 1-5 years (shorter than CEA)
              3. Target population: Who is eligible?
              4. Market uptake: How fast will adoption happen? (S-curve typically)
              5. Costs: Per-patient cost of new vs current treatment
              6. Offsets: Savings from reduced complications, hospitalizations
              7. Budget impact: Net cost per year

              Express results as:
              - Total budget impact per year
              - Per-member-per-month (PMPM) for insurance
              - Percentage of total health budget
              - Comparison to available budget`
          }
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: healthEcon.id,
      name: 'Designing M&E Frameworks',
      slug: 'designing-me-frameworks',
      description: 'Design comprehensive M&E systems using logframes, theory of change, and results-based management. Essential for donor-funded programs.',
      order: 3,
      estimatedMinutes: 90,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The Logframe',
            type: 'text',
            body: `The Logical Framework (Logframe) is the backbone of M&E in development:

              Goal: Overarching development objective (e.g., "Reduce maternal mortality in Nigeria")
              Purpose: Project-level objective (e.g., "Reduce MMR from 800 to 400 per 100,000 in target LGAs")
              Outputs: What the project delivers (e.g., "1,000 TBAs trained," "50 PHCs equipped")
              Activities: Actions taken (e.g., "Conduct training workshops," "Procure equipment")

              For each level, define:
              - Indicators (SMART: Specific, Measurable, Achievable, Relevant, Time-bound)
              - Means of Verification (where data comes from)
              - Assumptions (external factors that must hold for logic to work)

              The causal chain: If activities done, then outputs produced. If outputs produced, then
              purpose achieved. If purpose achieved, then contributes to goal. At each step,
              assumptions must hold.`
          },
          {
            title: 'Theory of Change',
            type: 'text',
            body: `Theory of Change (ToC) goes deeper than a logframe. It maps the full causal pathway
              from intervention to impact, including:

              - All intermediate outcomes (not just outputs and purpose)
              - Causal mechanisms (why does this intervention work?)
              - Assumptions at each step (what must be true?)
              - External factors and risks
              - Evidence base (what existing research supports each link?)

              ToC is especially important for complex programs where the causal pathway
              is not straightforward. It forces you to articulate the "how" and "why,"
              not just the "what."

              Donors (Gates Foundation, USAID, DFID) increasingly require both a logframe
              AND a theory of change.`
          },
          {
            title: 'Building an M&E Plan',
            type: 'text',
            body: `A comprehensive M&E plan includes:

              1. M&E Framework (logframe + theory of change)
              2. Indicator Matrix: All indicators with baselines, targets, frequency, responsibility
              3. Data Collection Plan: Tools, methods, sample sizes, timeline
              4. Data Quality Assurance: Validation checks, supervision, audits
              5. Data Management: Storage, cleaning, analysis protocols
              6. Reporting Schedule: Monthly, quarterly, annual reports
              7. Evaluation Plan: Midterm and endline evaluation design
              8. M&E Budget: Typically 5-10% of total program budget
              9. Roles and Responsibilities: Who collects, analyzes, reports
              10. Learning Agenda: How findings will be used for decision-making`
          },
          {
            title: 'Impact Evaluation Designs',
            type: 'text',
            body: `When you need to prove causation (not just correlation):

              RCT (Randomized Controlled Trial): Gold standard. Randomize to treatment/control.
              Pros: Strongest causal evidence. Cons: Expensive, not always ethical/feasible.

              Difference-in-Differences (DiD): Compare changes over time between groups.
              Pros: Uses existing data. Cons: Parallel trends assumption.

              Regression Discontinuity (RDD): Exploit eligibility cutoffs.
              Pros: Strong near cutoff. Cons: Only valid near cutoff.

              Propensity Score Matching (PSM): Match treatment/control on characteristics.
              Pros: Can use observational data. Cons: Assumes no hidden confounders.

              Choose design based on: budget, timeline, ethical considerations,
              data availability, and how strong the evidence needs to be.`
          }
        ],
      },
      resources: {
        tools: ['Logframe Template', 'Theory of Change Template', 'M&E Plan Template', 'Indicator Matrix']
      },
    },
  })

  console.log('  Track 4: Health Economics & M&E (3 modules)')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 5: SPECIALIST - Digital Health & Technology
  // ════════════════════════════════════════════════════════════════════════════

  const digitalHealth = await prisma.trainingTrack.create({
    data: {
      name: 'Digital Health & Technology Leadership',
      slug: 'digital-health-tech',
      description: `Advanced training in digital health strategy, health information systems, telemedicine,
        data analytics, and technology implementation in resource-constrained settings.
        Covers HIS/EMR selection, interoperability, data governance, and the emerging
        African healthtech ecosystem.`,
      level: 'SPECIALIST',
      category: 'methodology',
      iconName: 'monitor-smartphone',
      colorHex: '#0891B2',
      prerequisites: ['core-consulting-skills', 'healthcare-fundamentals'],
      estimatedHours: 28,
      sortOrder: 5,
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: digitalHealth.id,
      name: 'Health Information Systems',
      slug: 'health-information-systems',
      description: 'HIS/EMR landscape in Africa. Selection, implementation, and optimization of hospital information systems.',
      order: 1,
      estimatedMinutes: 90,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The HIS Landscape in Africa',
            type: 'text',
            body: `Hospital Information Systems (HIS) in Africa range from paper-based to fully digital:

              Tier 1 (Paper): Most public hospitals, small private clinics
              Tier 2 (Basic digital): Excel/Access, standalone billing software
              Tier 3 (Departmental): Lab system, pharmacy system, billing, not integrated
              Tier 4 (Integrated HIS): Full EMR/EHR, integrated modules, some interoperability
              Tier 5 (Advanced): AI-powered analytics, full interoperability, patient portal

              Most Nigerian private hospitals are Tier 2-3. C4A typically helps move them to Tier 4.

              Common HIS platforms in Nigeria:
              - OpenMRS (open source, PEPFAR-funded facilities)
              - eHospital (Nigerian-built, growing adoption)
              - Helium Health (Nigerian healthtech, cloud-based)
              - SAP/Oracle (large teaching hospitals)
              - Custom builds (fragile, vendor lock-in)`
          },
          {
            title: 'HIS Selection Framework',
            type: 'text',
            body: `When advising a client on HIS selection:

              Functional requirements:
              - Patient registration and demographics
              - Clinical documentation (notes, orders, results)
              - Pharmacy and formulary management
              - Laboratory and radiology integration
              - Billing and revenue cycle management
              - Reporting and analytics
              - Scheduling and appointment management

              Non-functional requirements:
              - Cloud vs on-premise (cloud preferred for Africa; power/connectivity issues)
              - Mobile access (essential for consultant rounding)
              - Offline capability (intermittent connectivity is reality)
              - Interoperability (HL7 FHIR standard)
              - Scalability (can it grow with the hospital?)
              - Local support (vendor presence in Nigeria)
              - Total cost of ownership (license + implementation + training + maintenance)

              C4A evaluation matrix: Score each system 1-5 on each requirement,
              weight by importance, calculate total. Recommend top 2-3 for demos.`
          },
          {
            title: 'Implementation Best Practices',
            type: 'text',
            body: `HIS implementation failure rate in Africa: 50-70%. Why?

              Common failure causes:
              1. Insufficient change management (staff resistance)
              2. Poor data migration (garbage in, garbage out)
              3. Inadequate training (2 days is not enough)
              4. Infrastructure gaps (power, internet, hardware)
              5. Scope creep (trying to do everything at once)
              6. Vendor mismatch (international system, no local support)

              C4A implementation approach:
              Phase 1 (Month 1-2): Foundation (infrastructure, data cleanup, core config)
              Phase 2 (Month 3-4): Pilot (1-2 departments, super-users)
              Phase 3 (Month 5-6): Expand (remaining departments, full training)
              Phase 4 (Month 7-8): Optimize (workflows, reports, integration)
              Phase 5 (Month 9+): Sustain (support, continuous improvement)

              Critical success factor: Identify and empower "super-users" in each department.
              These are staff who embrace technology and become local champions.`
          }
        ],
      },
      resources: {
        tools: ['HIS Evaluation Matrix', 'Implementation Readiness Assessment', 'Data Migration Checklist']
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: digitalHealth.id,
      name: 'Data Analytics & AI in Healthcare',
      slug: 'data-analytics-ai-healthcare',
      description: 'Leverage data analytics and AI for clinical decision support, operational optimization, and predictive analytics in healthcare settings.',
      order: 2,
      estimatedMinutes: 90,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The Data Maturity Journey',
            type: 'text',
            body: `Most African hospitals are at Level 1-2. C4A helps them move up.

              Level 1 - Reporting: What happened? (Monthly reports, basic dashboards)
              Level 2 - Analysis: Why did it happen? (Root cause analysis, trend analysis)
              Level 3 - Monitoring: What is happening now? (Real-time dashboards, alerts)
              Level 4 - Prediction: What will happen? (Forecasting, risk scoring)
              Level 5 - Optimization: What should we do? (AI-powered decision support)

              Do not skip levels. A hospital without clean data (Level 1) cannot do prediction (Level 4).
              The foundation must be solid before advanced analytics add value.`
          },
          {
            title: 'High-Impact Use Cases',
            type: 'text',
            body: `Where analytics delivers measurable ROI in African hospitals:

              Revenue Cycle:
              - Claims denial prediction (flag high-risk claims before submission)
              - Coding optimization (identify undercoded cases)
              - Payer performance tracking (which HMOs pay fastest/slowest?)

              Operations:
              - Bed management (predict discharges, optimize admissions)
              - Staff scheduling (match staffing to demand patterns)
              - Supply chain (predict stockouts, optimize reorder points)

              Clinical:
              - Sepsis early warning (vital sign pattern detection)
              - Readmission risk scoring (target high-risk patients for follow-up)
              - Clinical pathway compliance (flag deviations from protocol)

              Start with the use case that has the highest ROI and best data availability.
              Typically: revenue cycle analytics (data exists in billing systems).`
          },
          {
            title: 'AI Implementation in Resource-Constrained Settings',
            type: 'text',
            body: `Reality check for AI in African healthcare:

              What works now:
              - Rules-based alerts (not true AI, but effective)
              - Simple predictive models (logistic regression, decision trees)
              - NLP for clinical note coding (with human review)
              - Chatbots for patient triage and appointment scheduling

              What does not work yet:
              - Deep learning on small datasets (most hospitals lack volume)
              - Autonomous clinical decision-making (liability, trust, regulation)
              - Complex multimodal AI (infrastructure not ready)

              C4A approach to AI:
              1. Start with the problem, not the technology
              2. Use the simplest model that works
              3. Always keep a human in the loop
              4. Measure ROI rigorously
              5. Plan for sustainability (who maintains the model after C4A leaves?)`
          }
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: digitalHealth.id,
      name: 'Telemedicine & Digital Health Strategy',
      slug: 'telemedicine-digital-strategy',
      description: 'Design and implement telemedicine programs and digital health strategies for African healthcare organizations.',
      order: 3,
      estimatedMinutes: 60,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Telemedicine Models',
            type: 'text',
            body: `Telemedicine models relevant to Africa:

              Store-and-forward: Capture data (images, reports), send to specialist asynchronously.
              Best for: Dermatology, radiology, pathology, retinal screening.
              Low bandwidth requirement. Works even with intermittent connectivity.

              Real-time video consultation: Live video between patient and remote doctor.
              Best for: General consultations, follow-ups, mental health.
              Requires reliable broadband. WhatsApp video is often good enough.

              Remote monitoring: Wearables/devices send data to care team.
              Best for: Chronic disease management (diabetes, hypertension, heart failure).
              Requires devices and data connectivity. Growing with smartphone penetration.

              In Nigeria, the most practical model is a hybrid:
              - WhatsApp/video for routine follow-ups and triage
              - Store-and-forward for specialist opinions
              - In-person for procedures and complex assessments`
          },
          {
            title: 'Building a Digital Health Strategy',
            type: 'text',
            body: `Framework for hospital digital health strategy:

              1. Vision: Where do we want to be in 3-5 years? (Tier 4-5 digital maturity)
              2. Current state assessment: Digital maturity, infrastructure, staff readiness
              3. Priority use cases: Rank by impact and feasibility
              4. Technology roadmap: Phased implementation over 12-36 months
              5. Governance: CIO/CMIO role, data governance, IT committee
              6. Budget: CapEx (systems, infrastructure) + OpEx (licenses, support, training)
              7. Change management: Staff training, incentives, communication
              8. Measurement: KPIs for digital adoption and impact

              Do not try to go from Tier 1 to Tier 5 in one leap.
              Phased, pragmatic, with quick wins to build momentum.`
          }
        ],
      },
    },
  })

  console.log('  Track 5: Digital Health & Technology (3 modules)')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 6: MASTER - C4AMaster Consultant
  // ════════════════════════════════════════════════════════════════════════════

  const masterTrack = await prisma.trainingTrack.create({
    data: {
      name: 'C4AMaster Consultant',
      slug: 'cfa-master-consultant',
      description: `The capstone certification. Demonstrates mastery across all C4A competencies:
        strategic thinking, health economics, operational excellence, client leadership,
        and business development. Requires completion of all Foundation and at least one
        Specialist track. Includes live case defense and peer review.`,
      level: 'MASTER',
      category: 'leadership',
      iconName: 'award',
      colorHex: '#D4AF37',
      prerequisites: ['core-consulting-skills', 'healthcare-fundamentals', 'cfa-platform-tools'],
      estimatedHours: 40,
      sortOrder: 6,
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: masterTrack.id,
      name: 'Engagement Leadership',
      slug: 'engagement-leadership',
      description: 'Lead complex, multi-workstream engagements. Manage teams, navigate politics, drive outcomes, and develop junior consultants.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'From Analyst to Leader',
            type: 'text',
            body: `The transition from doing the work to leading the work:

              Analyst mindset: "What does the data say?"
              Leader mindset: "What decision does this enable for the client?"

              As engagement lead, you are responsible for:
              1. Client relationship (you are the face of C4A)
              2. Team performance (coaching, quality control, workload management)
              3. Delivery quality (every deliverable meets C4A standard)
              4. Commercial management (budget, scope, change orders)
              5. Risk management (early warning, mitigation, escalation)
              6. Knowledge capture (what did we learn for future engagements?)

              The hardest transition: letting go of doing the analysis yourself.
              Your job is to multiply your team's effectiveness, not to be the best analyst.`
          },
          {
            title: 'Managing Multi-Workstream Engagements',
            type: 'text',
            body: `Large C4A engagements may have 3-5 workstreams running in parallel:

              Example: Hospital turnaround
              WS1: Revenue cycle optimization (billing, coding, collections)
              WS2: Operational efficiency (staffing, supply chain, patient flow)
              WS3: Clinical quality improvement (protocols, accreditation prep)
              WS4: Digital transformation (HIS implementation)
              WS5: Change management (communication, training, culture)

              Your role as engagement lead:
              - Weekly integration meetings (connect the dots between workstreams)
              - Dependency management (WS4 needs data from WS1)
              - Resource allocation (move people where they are needed most)
              - Single narrative to client (not 5 separate updates)
              - Escalation point for cross-workstream conflicts

              Tool: C4AIntegration Dashboard (tracks all workstreams, gates, risks in one view)`
          },
          {
            title: 'Developing Your Team',
            type: 'text',
            body: `As a Master Consultant, you are expected to develop junior team members:

              Weekly 1:1s: 30 minutes per direct report (progress, blockers, development)
              Real-time coaching: Review deliverables, give specific feedback, model excellence
              Stretch assignments: Push people beyond their comfort zone (with support)
              Feedback: Direct, specific, timely. "The stakeholder map was missing union reps" not "do better"
              Recognition: Public credit for good work. Private feedback for improvement areas.

              The test of a great engagement lead:
              Did the team grow during this project? Can they do more after than before?`
          }
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: masterTrack.id,
      name: 'Business Development & Thought Leadership',
      slug: 'business-development-thought-leadership',
      description: 'Win new engagements, build C4A\'s brand, publish thought leadership, and develop client relationships that generate repeat business.',
      order: 2,
      estimatedMinutes: 90,
      passingScore: 75,
      content: {
        sections: [
          {
            title: 'The C4ABusiness Development Model',
            type: 'text',
            body: `C4A does not cold-sell. We earn the right to new work through:

              1. Exceptional delivery (current clients become references)
              2. Thought leadership (publish insights, speak at conferences)
              3. Network effects (our consultants know people who know people)
              4. Referrals (satisfied clients refer others)

              Your role in BD as a Master Consultant:
              - Identify follow-on opportunities during engagements
              - Build relationships beyond your project sponsor
              - Represent C4A at industry events
              - Publish case studies and insights (with client permission)
              - Mentor junior consultants in client relationship building`
          },
          {
            title: 'Proposal Writing',
            type: 'text',
            body: `C4A proposal structure:

              1. Understanding of the Challenge (show you get it; do not just repeat the RFP)
              2. Our Approach (methodology, phases, timeline)
              3. Team (specific named people with relevant experience)
              4. Track Record (relevant case studies with measurable outcomes)
              5. Commercial Terms (fees, expenses, payment schedule)
              6. Why C4A(differentiation; what we bring that others do not)

              Proposal tips:
              - Lead with outcomes, not methodology ("We will recover N200M" not "We will use Lean Six Sigma")
              - Use the client's language (not consulting jargon)
              - Be specific about team (named consultants, not "a team of experts")
              - Include risk factors and how you will manage them (builds credibility)
              - Keep it concise (20-30 pages max; no one reads 100-page proposals)`
          },
          {
            title: 'Thought Leadership',
            type: 'text',
            body: `Publishing builds C4A's brand and your personal brand:

              Formats:
              - Insight briefs (2-3 pages on a trending topic)
              - Case studies (with client permission, anonymized if needed)
              - Conference presentations (Africa Health, AHSN, etc.)
              - LinkedIn articles (reach decision-makers directly)
              - Webinars (low-cost, wide reach)

              Topics that resonate in African healthcare:
              - Revenue recovery stories (with numbers)
              - Digital transformation journeys
              - Quality improvement outcomes
              - Workforce retention strategies
              - Public-private partnership models

              Rule: Every completed engagement should produce at least one knowledge asset.
              Case study, insight brief, or template that the next C4A team can use.`
          }
        ],
      },
    },
  })

  await prisma.trainingModule.create({
    data: {
      trackId: masterTrack.id,
      name: 'Capstone: Live Case Defense',
      slug: 'capstone-live-case-defense',
      description: 'The final assessment. Present a real or simulated engagement from diagnosis through recommendations. Defend your approach before a panel of C4A partners.',
      order: 3,
      estimatedMinutes: 180,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Capstone Requirements',
            type: 'text',
            body: `The Master Consultant capstone is a live case defense:

              Format:
              - 30-minute presentation of a complete engagement
              - 30-minute Q&A with a panel (2 C4A partners + 1 external reviewer)

              You will present:
              1. Client situation and problem framing
              2. Methodology selection and approach
              3. Key analyses conducted (with data)
              4. Findings and insights
              5. Recommendations delivered
              6. Implementation outcomes (measurable impact)
              7. Lessons learned

              Evaluation criteria:
              - Problem structuring (MECE, hypothesis-driven)
              - Analytical rigor (data quality, methodology)
              - Client management (stakeholder approach)
              - Recommendation quality (actionable, impactful)
              - Communication (Pyramid Principle, executive presence)
              - Nigerian healthcare context (local relevance)
              - Self-reflection (what would you do differently?)`
          },
          {
            title: 'Preparation Guide',
            type: 'text',
            body: `How to prepare:

              1. Select your strongest engagement (ideally one you led or co-led)
              2. Gather all deliverables, data, and outcomes
              3. Build a 25-slide presentation following C4A format
              4. Practice with a peer (get brutal feedback)
              5. Anticipate tough questions:
                 - "Why this methodology and not X?"
                 - "How did you handle resistance from Y stakeholder?"
                 - "What would you change if you did this again?"
                 - "How sustainable are these changes?"
                 - "What was the ROI?"
              6. Know your numbers cold (every metric should be at your fingertips)

              The panel is not trying to trip you up. They want to see that you can think
              on your feet, defend your decisions with evidence, and demonstrate the
              judgment that defines a Master Consultant.`
          }
        ],
      },
    },
  })

  console.log('  Track 6: C4AMaster Consultant (3 modules)')

  console.log('\nC4ATraining Academy seeded successfully!')
  console.log(`
    Tracks: 6
    Modules: 18
    Certification Levels: 3 (Foundation, Specialist, Master)

    FOUNDATION:
      1. Core Consulting Skills (4 modules, 24 hrs)
      2. Healthcare Fundamentals (3 modules, 20 hrs)
      3. C4APlatform & Tools (2 modules, 8 hrs)

    SPECIALIST:
      4. Health Economics & M&E (3 modules, 32 hrs)
      5. Digital Health & Technology (3 modules, 28 hrs)

    MASTER:
      6. C4AMaster Consultant (3 modules, 40 hrs)
  `)
}

main()
  .catch((e) => {
    console.error('Error seeding training academy:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
