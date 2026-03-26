/**
 * C4ATRAINING ACADEMY - FOUNDATION LEVEL SEED B (Tracks 3-5)
 * Seeds Foundation-level training tracks, modules, and assessment questions
 *
 * 3 Tracks:
 *   Track 3: C4APlatform & Engagement
 *   Track 4: Financial Literacy for Healthcare
 *   Track 5: Professional Standards
 *
 * This file only CREATES new data. It does NOT delete existing records.
 *
 * Run: npx tsx prisma/seed-academy-foundation-b.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding C4ATraining Academy - Foundation Level Tracks (3-5)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 3: FOUNDATION - C4APlatform & Engagement
  // ════════════════════════════════════════════════════════════════════════════

  const platformEngagement = await prisma.trainingTrack.create({
    data: {
      name: 'C4APlatform & Engagement',
      slug: 'cfa-platform-engagement',
      description: `Understand how C4A engagements are structured from first client contact to final handover,
        and learn to navigate the C4A digital platform for day-to-day project execution. This track covers
        the engagement lifecycle, deliverable standards, quality gates, and practical use of the C4A platform
        for project tracking, timesheets, and knowledge management.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'layout-dashboard',
      colorHex: '#2563EB',
      prerequisites: [],
      estimatedHours: 10,
      sortOrder: 3,
    },
  })

  // Module 3.1: C4AEngagement Lifecycle
  const m3_1 = await prisma.trainingModule.create({
    data: {
      trackId: platformEngagement.id,
      name: 'C4AEngagement Lifecycle',
      slug: 'cfa-engagement-lifecycle',
      description: 'Master the four phases of a C4A engagement, understand the deliverables expected at each stage, and learn how quality gates ensure consistent output across every project.',
      order: 1,
      estimatedMinutes: 90,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The Four Phases: Diagnose, Design, Deliver, Sustain',
            type: 'text',
            body: `Every C4A engagement follows the Diagnose-Design-Deliver-Sustain (DDDS) framework. This is not a suggestion or a loose guideline. It is the standard operating model that ensures consistency whether we are working with a 50-bed district hospital in Zambia or a 500-bed teaching hospital in Nigeria. Each phase has defined entry criteria, expected deliverables, and an exit gate that must be cleared before moving forward.

              Diagnose is about understanding the real problem, not just the presenting complaint. We conduct stakeholder interviews, review financial and operational data, observe workflows, and map the current state. Design translates diagnostic findings into a costed, sequenced action plan with clear ownership. Deliver is hands-on implementation, working alongside client teams to execute the plan. Sustain ensures that changes stick after C4A leaves, through capability transfer, dashboards, and follow-up reviews.`
          },
          {
            title: 'Deliverables and Quality Standards',
            type: 'text',
            body: `Each phase produces specific deliverables that follow C4A templates. The Diagnose phase produces a Current State Assessment (CSA) and a Problem Prioritization Matrix. Design produces a Transformation Roadmap, a Business Case, and a Stakeholder Alignment Deck. Deliver produces weekly progress reports, risk logs, and implementation dashboards. Sustain produces a Handover Pack, a Sustainability Scorecard, and a 90-day Follow-Up Plan.

              All deliverables go through the C4A quality review process before reaching the client. Junior consultants draft, senior consultants review, and the engagement lead approves. No deliverable leaves C4A without at least two sets of eyes. This is non-negotiable. A single poorly formatted slide or an incorrect data point erodes the client's confidence in everything else we present.`
          },
          {
            title: 'Quality Gates Between Phases',
            type: 'text',
            body: `Quality gates are formal checkpoints where the engagement team presents findings and recommendations to the C4A review panel before proceeding. The Gate 1 review (after Diagnose) confirms that the root causes have been correctly identified and the scope is right. Gate 2 (after Design) validates that the proposed interventions are feasible, properly costed, and sequenced. Gate 3 (after Deliver) confirms that implementation targets have been met and the client team is ready for independent operation.

              Gates are not bureaucratic hurdles. They exist because C4A's reputation depends on every engagement delivering measurable results. A failed gate means additional work is needed before proceeding. In practice, about 20% of Gate 1 reviews result in the team going back to gather more data or re-scope the engagement. This is healthy. It is far better to course-correct early than to deliver a flawed transformation plan.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Map an Engagement to DDDS',
            instruction: 'A 150-bed private hospital in Dar es Salaam has declining occupancy rates and rising staff turnover. Outline what you would do in each DDDS phase, listing 2-3 key activities and the primary deliverable for each phase.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'DDDS Framework Guide', url: 'internal://knowledge/ddds-framework' },
          { title: 'Deliverable Templates Library', url: 'internal://knowledge/deliverable-templates' },
        ],
        tools: ['CSA Template', 'Transformation Roadmap Template', 'Quality Gate Checklist']
      },
    },
  })

  // Questions for Module 3.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m3_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are the four phases of the C4A engagement lifecycle in order?',
        options: JSON.stringify([
          { id: 'a', text: 'Plan, Execute, Monitor, Close', isCorrect: false },
          { id: 'b', text: 'Diagnose, Design, Deliver, Sustain', isCorrect: true },
          { id: 'c', text: 'Assess, Recommend, Implement, Review', isCorrect: false },
          { id: 'd', text: 'Discover, Define, Develop, Deploy', isCorrect: false },
        ]),
        explanation: 'C4A uses the Diagnose-Design-Deliver-Sustain (DDDS) framework as its standard operating model for all engagements, ensuring consistency across projects of all sizes.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m3_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which deliverable is produced during the Diagnose phase?',
        options: JSON.stringify([
          { id: 'a', text: 'Transformation Roadmap', isCorrect: false },
          { id: 'b', text: 'Sustainability Scorecard', isCorrect: false },
          { id: 'c', text: 'Current State Assessment (CSA)', isCorrect: true },
          { id: 'd', text: 'Weekly Progress Report', isCorrect: false },
        ]),
        explanation: 'The Diagnose phase produces a Current State Assessment (CSA) and a Problem Prioritization Matrix. The Transformation Roadmap belongs to Design, progress reports to Deliver, and the Sustainability Scorecard to Sustain.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m3_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What happens when approximately 20% of Gate 1 reviews identify issues?',
        options: JSON.stringify([
          { id: 'a', text: 'The engagement is cancelled', isCorrect: false },
          { id: 'b', text: 'The team proceeds to Design anyway and fixes issues later', isCorrect: false },
          { id: 'c', text: 'The team goes back to gather more data or re-scope the engagement', isCorrect: true },
          { id: 'd', text: 'A new engagement team is assigned', isCorrect: false },
        ]),
        explanation: 'When a Gate 1 review identifies issues, the team goes back to gather more data or re-scope. This early course-correction is considered healthy and preferable to delivering a flawed transformation plan.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m3_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the minimum review process for C4A deliverables before they reach the client?',
        options: JSON.stringify([
          { id: 'a', text: 'Junior consultant drafts and sends directly to the client', isCorrect: false },
          { id: 'b', text: 'Junior consultant drafts, senior consultant reviews, engagement lead approves', isCorrect: true },
          { id: 'c', text: 'The engagement lead drafts and reviews all deliverables alone', isCorrect: false },
          { id: 'd', text: 'Any team member can approve deliverables', isCorrect: false },
        ]),
        explanation: 'C4A requires at least two sets of eyes on every deliverable. Junior consultants draft, senior consultants review, and the engagement lead approves. This is non-negotiable.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m3_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The Sustain phase ensures changes stick after C4A leaves. Which of these is a Sustain-phase deliverable?',
        options: JSON.stringify([
          { id: 'a', text: 'Problem Prioritization Matrix', isCorrect: false },
          { id: 'b', text: 'Business Case', isCorrect: false },
          { id: 'c', text: 'Implementation Dashboard', isCorrect: false },
          { id: 'd', text: '90-day Follow-Up Plan', isCorrect: true },
        ]),
        explanation: 'The Sustain phase produces a Handover Pack, a Sustainability Scorecard, and a 90-day Follow-Up Plan. These tools ensure the client can maintain improvements independently after C4A exits.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 3.2: Using the C4APlatform
  const m3_2 = await prisma.trainingModule.create({
    data: {
      trackId: platformEngagement.id,
      name: 'Using the C4APlatform',
      slug: 'using-cfa-platform',
      description: 'Learn to navigate the C4A digital platform for project management, timesheet submission, document collaboration, and accessing the firm knowledge base.',
      order: 2,
      estimatedMinutes: 90,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Project Dashboard and Task Management',
            type: 'text',
            body: `The C4A platform is the single source of truth for every active engagement. When you are assigned to a project, it appears on your dashboard with a summary of the current phase, your assigned tasks, upcoming deadlines, and the engagement lead's contact details. Every task in the platform maps to a deliverable or workstream from the Transformation Roadmap.

              Tasks have four statuses: Not Started, In Progress, In Review, and Complete. You move tasks through these stages as work progresses. The platform automatically notifies the reviewer when a task moves to In Review. Do not use email or WhatsApp to submit deliverables for review. Everything goes through the platform so there is a clear audit trail and nothing gets lost.`
          },
          {
            title: 'Timesheets and Utilization Tracking',
            type: 'text',
            body: `Timesheets are submitted weekly by end of day Friday. This is a firm-wide policy with no exceptions. Each timesheet entry requires a project code, an activity category (e.g., data collection, analysis, report writing, client meeting, travel), and a brief description. The platform calculates your utilization rate automatically based on billable hours divided by available hours.

              C4A targets 70-80% utilization for consultants. Below 70% means you are under-deployed and the firm is absorbing unbilled cost. Above 85% consistently signals a risk of burnout. If your utilization is trending low, speak with your engagement manager about reallocation. If it is trending high, flag it early so the team can redistribute workload before quality suffers.`
          },
          {
            title: 'Knowledge Base and Document Management',
            type: 'text',
            body: `The C4A Knowledge Base contains past engagement deliverables (anonymized), methodology guides, industry research, templates, and best-practice case studies. Before starting any new analysis, check the knowledge base first. There is a strong chance that a similar analysis has been done on a prior engagement and you can adapt existing work rather than starting from scratch.

              All project documents must be stored in the platform's document library, not on personal laptops or Google Drive. Documents are organized by engagement and phase. Version control is automatic, so you can always see the history of changes. When uploading deliverables, use the C4A naming convention: [Project Code]-[Phase]-[Document Type]-[Version]. For example, NGA-LAG-001-DIAGNOSE-CSA-v2.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Platform Navigation',
            instruction: 'Log into the C4A platform sandbox environment. Create a test timesheet entry for 8 hours on project code DEMO-001, categorized as "data collection," with the description "Reviewed patient flow data for outpatient department." Submit the timesheet for approval.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'C4APlatform User Guide', url: 'internal://knowledge/platform-user-guide' },
          { title: 'Timesheet Policy', url: 'internal://knowledge/timesheet-policy' },
        ],
        tools: ['C4APlatform Sandbox', 'Document Naming Guide', 'Knowledge Base Search']
      },
    },
  })

  // Questions for Module 3.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m3_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When must weekly timesheets be submitted on the C4A platform?',
        options: JSON.stringify([
          { id: 'a', text: 'By end of day Monday of the following week', isCorrect: false },
          { id: 'b', text: 'By end of day Friday each week', isCorrect: true },
          { id: 'c', text: 'By the 1st of each month for the prior month', isCorrect: false },
          { id: 'd', text: 'Whenever the consultant has time', isCorrect: false },
        ]),
        explanation: 'C4A has a firm-wide policy requiring timesheets to be submitted by end of day Friday each week, with no exceptions.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m3_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the target utilization rate for C4A consultants?',
        options: JSON.stringify([
          { id: 'a', text: '50-60%', isCorrect: false },
          { id: 'b', text: '90-100%', isCorrect: false },
          { id: 'c', text: '70-80%', isCorrect: true },
          { id: 'd', text: '60-70%', isCorrect: false },
        ]),
        explanation: 'C4A targets 70-80% utilization. Below 70% means the consultant is under-deployed. Above 85% consistently signals burnout risk.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m3_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the correct C4A document naming convention?',
        options: JSON.stringify([
          { id: 'a', text: '[Project Code]-[Phase]-[Document Type]-[Version]', isCorrect: true },
          { id: 'b', text: '[Client Name]-[Date]-[Document Type]', isCorrect: false },
          { id: 'c', text: '[Consultant Name]-[Project]-[Version]', isCorrect: false },
          { id: 'd', text: '[Document Type]-[Date]-[Draft Number]', isCorrect: false },
        ]),
        explanation: 'C4A uses the naming convention [Project Code]-[Phase]-[Document Type]-[Version], for example NGA-LAG-001-DIAGNOSE-CSA-v2.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m3_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How should deliverables be submitted for review?',
        options: JSON.stringify([
          { id: 'a', text: 'Email the document to the engagement lead', isCorrect: false },
          { id: 'b', text: 'Share via WhatsApp', isCorrect: false },
          { id: 'c', text: 'Move the task to In Review status on the C4A platform', isCorrect: true },
          { id: 'd', text: 'Upload to a shared Google Drive folder', isCorrect: false },
        ]),
        explanation: 'All deliverables must go through the C4A platform by moving tasks to In Review status. This ensures a clear audit trail. Email and WhatsApp should not be used for deliverable submissions.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m3_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Before starting a new analysis, what should a C4A consultant do first?',
        options: JSON.stringify([
          { id: 'a', text: 'Build the analysis from scratch to ensure originality', isCorrect: false },
          { id: 'b', text: 'Check the C4A Knowledge Base for similar past work that can be adapted', isCorrect: true },
          { id: 'c', text: 'Ask colleagues on WhatsApp if they have done something similar', isCorrect: false },
          { id: 'd', text: 'Search the internet for publicly available reports', isCorrect: false },
        ]),
        explanation: 'The C4A Knowledge Base contains anonymized past deliverables, methodology guides, and templates. Checking it first avoids reinventing the wheel and ensures consistency with proven C4A approaches.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Track 3: C4APlatform & Engagement - 2 modules, 10 questions')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 4: FOUNDATION - Financial Literacy for Healthcare
  // ════════════════════════════════════════════════════════════════════════════

  const financialLiteracy = await prisma.trainingTrack.create({
    data: {
      name: 'Financial Literacy for Healthcare',
      slug: 'financial-literacy-healthcare',
      description: `Build foundational financial literacy tailored to African healthcare institutions. This track
        covers how hospitals generate revenue, manage costs, and measure financial performance. You will learn
        to read and interpret hospital P&L statements, understand cost structures unique to healthcare, and
        apply budgeting and variance analysis techniques used in hospital financial planning.`,
      level: 'FOUNDATION',
      category: 'health_economics',
      iconName: 'calculator',
      colorHex: '#059669',
      prerequisites: [],
      estimatedHours: 16,
      sortOrder: 4,
    },
  })

  // Module 4.1: Hospital P&L Structure
  const m4_1 = await prisma.trainingModule.create({
    data: {
      trackId: financialLiteracy.id,
      name: 'Hospital P&L Structure',
      slug: 'hospital-pl-structure',
      description: 'Understand how hospital revenue is generated, how costs are structured, and how to read a hospital income statement to identify financial performance drivers.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Hospital Revenue Streams',
            type: 'text',
            body: `Hospital revenue in Africa typically comes from four sources: out-of-pocket payments, health insurance (NHIS, private HMOs), government subsidies or grants, and development partner funding. The mix varies dramatically by institution type. A private hospital in Lagos might derive 60% of revenue from HMO claims and 35% from out-of-pocket, while a mission hospital in rural Tanzania might depend on 40% government grants, 30% development partner funding, and 30% patient fees on a sliding scale.

              Understanding revenue mix is critical because each source has different collection dynamics. Out-of-pocket is collected at point of service but limits patient volume. Insurance revenue is higher volume but comes with 60-120 day payment cycles and claim rejection rates of 15-30% in some markets. Government funding is predictable in theory but often arrives late. A C4A consultant must map these dynamics early in any financial diagnostic.`
          },
          {
            title: 'Cost Structure and Margins',
            type: 'text',
            body: `Hospital costs fall into three categories: personnel (typically 45-60% of total costs), supplies and consumables (20-30%), and overhead including utilities, maintenance, and administration (15-25%). Personnel costs are largely fixed in the short term since you cannot lay off nurses when occupancy drops. This makes hospitals operationally leveraged, meaning that small changes in revenue have outsized impacts on profitability.

              Gross margin in African hospitals ranges from 25-45% for private facilities and is often negative for public and mission hospitals that rely on subsidies. Operating margin after overhead for well-run private hospitals sits between 8-15%. Below 5% operating margin, a hospital is one bad quarter away from cash flow crisis. C4A consultants should benchmark client margins against these ranges to quickly identify whether the problem is revenue, cost, or both.`
          },
          {
            title: 'Reading a Hospital Income Statement',
            type: 'text',
            body: `A hospital income statement follows the standard format but with healthcare-specific line items. Revenue is broken out by department (outpatient, inpatient, diagnostics, pharmacy, theatre) and by payer type. Cost of services includes direct clinical costs such as drugs, consumables, and laboratory reagents. Below that, personnel costs cover salaries, benefits, and locum expenses. Operating expenses capture everything from electricity to laundry to IT systems.

              When reviewing a hospital P&L, look at three things immediately. First, revenue per bed per month, which tells you whether the hospital is generating enough throughput from its installed capacity. Second, the drug cost ratio (pharmacy costs as a percentage of pharmacy revenue), which should be 55-65% for a well-managed pharmacy. Third, the staff cost ratio, where anything above 60% of total revenue signals overstaffing or under-billing relative to the clinical workforce deployed.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Analyze a Hospital P&L',
            instruction: 'Given the following simplified P&L for a 100-bed hospital (Total Revenue: 1.2B NGN, Pharmacy Revenue: 300M, Drug Costs: 210M, Total Personnel: 650M, Total Operating Costs: 1.1B), calculate the drug cost ratio, staff cost ratio, and operating margin. Identify which metrics are outside healthy ranges and recommend two actions.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'Hospital Financial Statements Guide', url: 'internal://knowledge/hospital-financials' },
          { title: 'Healthcare Cost Benchmarks - Africa', url: 'internal://knowledge/cost-benchmarks-africa' },
        ],
        tools: ['Hospital P&L Template', 'Financial Ratio Calculator', 'Benchmarking Dashboard']
      },
    },
  })

  // Questions for Module 4.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m4_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is typically the largest cost category in an African hospital?',
        options: JSON.stringify([
          { id: 'a', text: 'Supplies and consumables (20-30%)', isCorrect: false },
          { id: 'b', text: 'Personnel costs (45-60%)', isCorrect: true },
          { id: 'c', text: 'Utilities and maintenance (15-25%)', isCorrect: false },
          { id: 'd', text: 'Equipment depreciation (10-15%)', isCorrect: false },
        ]),
        explanation: 'Personnel costs (salaries, benefits, locum expenses) typically represent 45-60% of total hospital costs, making it the single largest cost category.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m4_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the healthy range for a hospital pharmacy drug cost ratio?',
        options: JSON.stringify([
          { id: 'a', text: '30-40%', isCorrect: false },
          { id: 'b', text: '55-65%', isCorrect: true },
          { id: 'c', text: '75-85%', isCorrect: false },
          { id: 'd', text: '90-95%', isCorrect: false },
        ]),
        explanation: 'A well-managed hospital pharmacy should have a drug cost ratio (pharmacy costs as a percentage of pharmacy revenue) of 55-65%. Higher ratios indicate poor procurement or pricing.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m4_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Why are hospitals described as "operationally leveraged"?',
        options: JSON.stringify([
          { id: 'a', text: 'Because they use a lot of debt financing', isCorrect: false },
          { id: 'b', text: 'Because personnel costs are largely fixed, so small revenue changes have outsized profit impacts', isCorrect: true },
          { id: 'c', text: 'Because they operate 24 hours a day', isCorrect: false },
          { id: 'd', text: 'Because they serve multiple payer types simultaneously', isCorrect: false },
        ]),
        explanation: 'Hospitals have high fixed costs, primarily personnel. You cannot lay off nurses when occupancy drops, so small revenue declines hit profitability disproportionately hard.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m4_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital has a staff cost ratio above 60% of total revenue. What does this most likely indicate?',
        options: JSON.stringify([
          { id: 'a', text: 'The hospital pays competitive salaries', isCorrect: false },
          { id: 'b', text: 'The hospital has excellent staff retention', isCorrect: false },
          { id: 'c', text: 'Overstaffing or under-billing relative to the clinical workforce deployed', isCorrect: true },
          { id: 'd', text: 'The hospital is in a high-cost urban market', isCorrect: false },
        ]),
        explanation: 'A staff cost ratio above 60% signals that the hospital either has more staff than its patient volume justifies, or it is not billing enough for the clinical services its workforce delivers.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m4_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is a typical HMO claim payment cycle in African markets, and what is a common claim rejection rate?',
        options: JSON.stringify([
          { id: 'a', text: '30 days payment cycle, 5% rejection rate', isCorrect: false },
          { id: 'b', text: '60-120 days payment cycle, 15-30% rejection rate', isCorrect: true },
          { id: 'c', text: '7 days payment cycle, 1-2% rejection rate', isCorrect: false },
          { id: 'd', text: '180-360 days payment cycle, 50% rejection rate', isCorrect: false },
        ]),
        explanation: 'Insurance revenue in African markets typically comes with 60-120 day payment cycles and claim rejection rates of 15-30%. These dynamics significantly impact hospital cash flow and must be mapped early in any financial diagnostic.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 4.2: Budgeting & Financial Planning
  const m4_2 = await prisma.trainingModule.create({
    data: {
      trackId: financialLiteracy.id,
      name: 'Budgeting & Financial Planning',
      slug: 'budgeting-financial-planning',
      description: 'Learn how hospital operating budgets are built, how to conduct variance analysis, and how to support clients in creating realistic financial plans that survive contact with reality.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Building a Hospital Operating Budget',
            type: 'text',
            body: `A hospital operating budget translates the institution's strategic plan into financial terms for the coming year. It starts with revenue projections based on expected patient volumes by department, payer mix assumptions, and pricing. Then it builds up costs: staffing plans with headcount and salary scales, procurement budgets for drugs and consumables, and overhead allocations for utilities, maintenance, and administration.

              The most common mistake in African hospital budgeting is building budgets top-down from revenue targets without grounding them in operational capacity. A 100-bed hospital cannot budget for 100% occupancy year-round. Realistic budgets use 70-80% occupancy targets, account for seasonal variations (malaria season, holiday periods), and build in contingency of 5-10% for unexpected cost increases such as generator fuel during power outages or emergency drug procurement.`
          },
          {
            title: 'Variance Analysis: Budget vs. Actual',
            type: 'text',
            body: `Variance analysis compares budgeted figures to actual results and investigates the reasons for differences. A favorable variance means actual performance exceeded budget (higher revenue or lower costs). An unfavorable variance means the opposite. But the label alone is not enough. You must understand whether the variance is due to volume (more or fewer patients), price/rate (different billing rates or procurement costs), or efficiency (more or fewer resources consumed per unit of output).

              For example, if pharmacy costs are 20% over budget, the variance could be a volume variance (more patients required more drugs), a price variance (supplier prices increased), or an efficiency variance (clinical staff are prescribing more expensive drugs than the formulary recommends). Each root cause demands a different response. C4A consultants must decompose variances rather than simply reporting that a line item is over or under budget.`
          },
          {
            title: 'Making Budgets Stick in Practice',
            type: 'text',
            body: `A budget is only useful if department heads own it and review it regularly. C4A recommends monthly budget review meetings where each department head presents their actual-vs-budget performance, explains material variances (anything over 10%), and commits to corrective actions. These meetings should take no more than 90 minutes and follow a standard agenda.

              The biggest barrier to budget discipline in African hospitals is the belief that budgets are accounting exercises disconnected from clinical operations. To overcome this, C4A consultants help clients build budgets from the bottom up with department-level input, link budget performance to departmental KPIs, and make variance reports simple enough for clinical managers (not just accountants) to understand. When the head of surgery can see that theatre underutilization is costing the hospital 15M NGN per month in lost revenue, budget conversations become operational conversations.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Variance Analysis',
            instruction: 'A hospital budgeted pharmacy costs of 25M NGN for the quarter but actual costs were 31M NGN. Patient volume was 10% higher than budgeted. Average drug cost per patient was 5% higher than budgeted. Decompose the 6M NGN unfavorable variance into volume and price components. Which component should management focus on first, and why?',
          },
        ]
      },
      resources: {
        links: [
          { title: 'Hospital Budgeting Guide', url: 'internal://knowledge/hospital-budgeting' },
          { title: 'Variance Analysis Templates', url: 'internal://knowledge/variance-analysis' },
        ],
        tools: ['Operating Budget Template', 'Variance Analysis Workbook', 'Monthly Review Agenda Template']
      },
    },
  })

  // Questions for Module 4.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m4_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the recommended occupancy rate to use when building a realistic hospital budget?',
        options: JSON.stringify([
          { id: 'a', text: '95-100%', isCorrect: false },
          { id: 'b', text: '70-80%', isCorrect: true },
          { id: 'c', text: '50-60%', isCorrect: false },
          { id: 'd', text: '85-90%', isCorrect: false },
        ]),
        explanation: 'Realistic hospital budgets use 70-80% occupancy targets. Budgeting for 100% occupancy is unrealistic and leads to unfavorable revenue variances throughout the year.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m4_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are the three types of variance that should be analyzed when actual costs differ from budget?',
        options: JSON.stringify([
          { id: 'a', text: 'Revenue, expense, and profit variances', isCorrect: false },
          { id: 'b', text: 'Volume, price/rate, and efficiency variances', isCorrect: true },
          { id: 'c', text: 'Favorable, unfavorable, and neutral variances', isCorrect: false },
          { id: 'd', text: 'Fixed, variable, and semi-variable variances', isCorrect: false },
        ]),
        explanation: 'Variances should be decomposed into volume (more or fewer patients), price/rate (different unit costs or billing rates), and efficiency (more or fewer resources consumed per unit of output). Each root cause demands a different corrective action.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m4_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What contingency percentage does C4A recommend building into hospital operating budgets?',
        options: JSON.stringify([
          { id: 'a', text: '1-2%', isCorrect: false },
          { id: 'b', text: '5-10%', isCorrect: true },
          { id: 'c', text: '20-25%', isCorrect: false },
          { id: 'd', text: 'No contingency is needed if budgets are built correctly', isCorrect: false },
        ]),
        explanation: 'C4A recommends a 5-10% contingency for unexpected cost increases such as generator fuel during power outages or emergency drug procurement.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m4_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How often should hospital departments conduct budget review meetings?',
        options: JSON.stringify([
          { id: 'a', text: 'Quarterly', isCorrect: false },
          { id: 'b', text: 'Annually', isCorrect: false },
          { id: 'c', text: 'Monthly', isCorrect: true },
          { id: 'd', text: 'Weekly', isCorrect: false },
        ]),
        explanation: 'C4A recommends monthly budget review meetings where each department head presents actual-vs-budget performance, explains material variances (over 10%), and commits to corrective actions.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m4_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the most common mistake in African hospital budgeting?',
        options: JSON.stringify([
          { id: 'a', text: 'Using too many spreadsheets', isCorrect: false },
          { id: 'b', text: 'Building budgets top-down from revenue targets without grounding them in operational capacity', isCorrect: true },
          { id: 'c', text: 'Including too much contingency', isCorrect: false },
          { id: 'd', text: 'Having too many department-level inputs', isCorrect: false },
        ]),
        explanation: 'The most common mistake is building budgets top-down from revenue targets without considering operational capacity constraints like bed count, staffing levels, and seasonal volume variations.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Track 4: Financial Literacy for Healthcare - 2 modules, 10 questions')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 5: FOUNDATION - Professional Standards
  // ════════════════════════════════════════════════════════════════════════════

  const professionalStandards = await prisma.trainingTrack.create({
    data: {
      name: 'Professional Standards',
      slug: 'professional-standards',
      description: `Every C4A consultant represents the firm in every client interaction. This track covers the
        ethical standards, codes of conduct, and data protection obligations that govern how we work.
        You will learn the C4ACode of Conduct, understand your obligations under the Nigeria Data Protection
        Regulation (NDPR) and healthcare data privacy standards, and develop the professional discipline that
        distinguishes C4A consultants in the market.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'shield-check',
      colorHex: '#7C3AED',
      prerequisites: [],
      estimatedHours: 8,
      sortOrder: 5,
    },
  })

  // Module 5.1: C4ACode of Conduct & Ethics
  const m5_1 = await prisma.trainingModule.create({
    data: {
      trackId: professionalStandards.id,
      name: 'C4ACode of Conduct & Ethics',
      slug: 'cfa-code-of-conduct-ethics',
      description: 'Understand the ethical principles and professional conduct standards that every C4A consultant must uphold, including conflict of interest management, anti-corruption obligations, and client relationship boundaries.',
      order: 1,
      estimatedMinutes: 60,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Core Ethical Principles',
            type: 'text',
            body: `C4A operates on four non-negotiable ethical principles: integrity, objectivity, confidentiality, and competence. Integrity means we tell clients the truth even when the findings are uncomfortable. If the data shows that a hospital's CEO is the primary obstacle to operational improvement, we say so professionally and constructively. We do not soften findings to preserve relationships.

              Objectivity means our recommendations are driven by evidence and analysis, not by what the client wants to hear or what generates the largest follow-on engagement for C4A. If a client does not need a full transformation program and a focused 6-week intervention will solve their problem, we recommend the 6-week intervention. C4A's long-term reputation depends on consultants who prioritize client outcomes over firm revenue in every engagement.`
          },
          {
            title: 'Conflict of Interest and Anti-Corruption',
            type: 'text',
            body: `Consultants must disclose any personal, financial, or professional relationship that could influence their objectivity on an engagement. This includes prior employment at a client organization, family relationships with client staff, or financial interests in vendors being evaluated. Disclosures are made to the engagement lead and documented in the project file. Most conflicts can be managed through recusal from specific workstreams rather than removal from the entire engagement.

              C4A has zero tolerance for bribery, kickbacks, or facilitation payments. In many African markets, consultants will encounter requests for "facilitation" to access data, expedite approvals, or secure meetings with senior officials. The answer is always no. If a legitimate business process requires a formal fee (e.g., regulatory filing fees), it must be documented and approved by the engagement lead. Any gray-area situation should be escalated immediately. There is no penalty for escalating; there are severe consequences for not escalating.`
          },
          {
            title: 'Client Relationship Boundaries',
            type: 'text',
            body: `C4A consultants build strong client relationships, but those relationships must remain professional. We do not accept personal gifts from clients beyond token items (under $25 value). We do not enter into personal financial transactions with client staff. We do not socialize with clients in ways that could compromise our objectivity or create the appearance of impropriety.

              During engagements, we are guests in our client's institution. We respect their culture, hierarchies, and working norms. We dress professionally, arrive on time, and follow local customs. At the same time, we maintain the independence needed to deliver honest assessments. The best client relationships are built on trust, which comes from consistently demonstrating competence, reliability, and the courage to have difficult conversations when the data demands them.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Ethics Scenario Analysis',
            instruction: 'You are two weeks into a hospital diagnostic. The Medical Director offers to take you and the engagement team out for dinner at an expensive restaurant to "build the relationship." He also mentions that his brother-in-law runs a medical equipment supply company that could provide discounted equipment as part of the transformation plan. Identify the ethical issues in this scenario and describe how you would handle each one.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'C4ACode of Conduct (Full Document)', url: 'internal://knowledge/code-of-conduct' },
          { title: 'Ethics Escalation Procedure', url: 'internal://knowledge/ethics-escalation' },
        ],
        tools: ['Conflict of Interest Disclosure Form', 'Gift Register', 'Ethics Hotline Guide']
      },
    },
  })

  // Questions for Module 5.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m5_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are C4A\'s four core ethical principles?',
        options: JSON.stringify([
          { id: 'a', text: 'Speed, accuracy, profitability, and innovation', isCorrect: false },
          { id: 'b', text: 'Integrity, objectivity, confidentiality, and competence', isCorrect: true },
          { id: 'c', text: 'Loyalty, discretion, flexibility, and efficiency', isCorrect: false },
          { id: 'd', text: 'Transparency, accountability, fairness, and growth', isCorrect: false },
        ]),
        explanation: 'C4A operates on four non-negotiable ethical principles: integrity (tell the truth), objectivity (evidence-driven recommendations), confidentiality (protect client information), and competence (deliver quality work).',
        points: 1,
        order: 1,
      },
      {
        moduleId: m5_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A client staff member asks you to make a "facilitation payment" to expedite access to hospital financial records. What should you do?',
        options: JSON.stringify([
          { id: 'a', text: 'Pay it if the amount is small and it speeds up the engagement', isCorrect: false },
          { id: 'b', text: 'Decline and escalate the situation to the engagement lead immediately', isCorrect: true },
          { id: 'c', text: 'Pay it and include it in the project expense report', isCorrect: false },
          { id: 'd', text: 'Ignore the request and find the data through other channels', isCorrect: false },
        ]),
        explanation: 'C4A has zero tolerance for facilitation payments. Any gray-area situation must be escalated immediately. There is no penalty for escalating, but there are severe consequences for not escalating.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m5_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Your analysis shows that a hospital does not need a full transformation program and a 6-week focused intervention would solve the problem. What should C4A recommend?',
        options: JSON.stringify([
          { id: 'a', text: 'The full transformation program because it generates more revenue for C4A', isCorrect: false },
          { id: 'b', text: 'The 6-week intervention because objectivity requires prioritizing client outcomes over firm revenue', isCorrect: true },
          { id: 'c', text: 'A compromise: a medium-sized engagement that balances client needs and C4A revenue', isCorrect: false },
          { id: 'd', text: 'Let the client decide between the two options without making a recommendation', isCorrect: false },
        ]),
        explanation: 'Objectivity means recommendations are driven by evidence, not by what generates the largest engagement. If a 6-week intervention solves the problem, that is what C4A recommends. Long-term reputation depends on prioritizing client outcomes.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m5_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'You discover that your cousin works as the finance director at the hospital you are about to audit. What is the correct course of action?',
        options: JSON.stringify([
          { id: 'a', text: 'Do not disclose it since family relationships are private', isCorrect: false },
          { id: 'b', text: 'Disclose the relationship to the engagement lead and document it in the project file', isCorrect: true },
          { id: 'c', text: 'Resign from C4A to avoid the conflict', isCorrect: false },
          { id: 'd', text: 'Ask your cousin to keep the relationship secret', isCorrect: false },
        ]),
        explanation: 'All personal, financial, or professional relationships that could influence objectivity must be disclosed to the engagement lead and documented. Most conflicts can be managed through recusal from specific workstreams.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m5_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the maximum value of a personal gift a C4A consultant may accept from a client?',
        options: JSON.stringify([
          { id: 'a', text: 'No gifts of any value are permitted', isCorrect: false },
          { id: 'b', text: '$100', isCorrect: false },
          { id: 'c', text: '$25 (token items only)', isCorrect: true },
          { id: 'd', text: '$50', isCorrect: false },
        ]),
        explanation: 'C4A consultants may only accept token gifts valued under $25. Anything above that threshold must be declined to maintain professional independence and avoid the appearance of impropriety.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 5.2: Data Protection & Confidentiality
  const m5_2 = await prisma.trainingModule.create({
    data: {
      trackId: professionalStandards.id,
      name: 'Data Protection & Confidentiality',
      slug: 'data-protection-confidentiality',
      description: 'Understand your obligations under the Nigeria Data Protection Regulation (NDPR), healthcare data privacy standards, and C4A confidentiality policies that protect both client and patient information.',
      order: 2,
      estimatedMinutes: 60,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'NDPR and Healthcare Data Obligations',
            type: 'text',
            body: `The Nigeria Data Protection Regulation (NDPR), issued in 2019 and strengthened by the Nigeria Data Protection Act of 2023, governs how personal data is collected, processed, stored, and shared. For C4A consultants, this is directly relevant because hospital engagements routinely involve access to patient records, staff personnel files, and financial data containing personal information. NDPR requires lawful basis for processing, data minimization (collect only what you need), purpose limitation (use data only for the stated purpose), and storage limitation (do not keep data longer than necessary).

              Health data receives special protection under NDPR as "sensitive personal data." Processing health data requires explicit consent from the data subject or a legal basis such as public health necessity. When C4A consultants access patient records during a diagnostic, they must work with anonymized or pseudonymized datasets wherever possible. If individual patient records are needed (e.g., for clinical pathway analysis), the client must provide the legal basis and C4A must follow strict handling protocols.`
          },
          {
            title: 'C4AData Handling Protocols',
            type: 'text',
            body: `C4A maintains strict data handling protocols that go beyond legal minimums. Client data must never be stored on personal devices or in personal cloud accounts. All data stays within the C4A platform or approved secure storage. Laptops used for client work must have full-disk encryption enabled. Data shared between team members must use the C4A platform, not email attachments or messaging apps.

              When an engagement ends, all client data must be returned or securely deleted within 30 days unless a longer retention period is agreed in the engagement contract. C4A maintains a data destruction register that documents what was deleted, when, and by whom. Consultants who retain client data after an engagement ends are in violation of C4A policy and potentially in breach of NDPR. The engagement lead is responsible for ensuring the data destruction process is completed and documented.`
          },
          {
            title: 'Confidentiality in Practice',
            type: 'text',
            body: `Confidentiality extends beyond data files to everyday behavior. Do not discuss client details in public spaces, taxis, hotel lobbies, or restaurants. Do not leave client documents visible on your screen in airports or co-working spaces. Do not mention client names or details on social media, including LinkedIn posts about "exciting work" that could identify the client.

              Within C4A, confidentiality follows the need-to-know principle. You may discuss client matters with team members assigned to the same engagement and with C4A leadership for quality review purposes. You may not share client information with C4A colleagues on other engagements, even if they are working with a similar type of institution. If a colleague asks about your engagement, redirect them to the engagement lead. Client trust is earned one interaction at a time and lost in a single careless moment.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Data Handling Scenario',
            instruction: 'You are conducting a diagnostic at a hospital and need to analyze patient readmission patterns over the past 12 months. The hospital offers to give you a full extract of their patient database including names, national ID numbers, and clinical diagnoses. Describe step by step how you would handle this situation under NDPR and C4A data handling protocols.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'Nigeria Data Protection Act 2023 - Summary', url: 'internal://knowledge/ndpr-summary' },
          { title: 'C4AData Handling Policy', url: 'internal://knowledge/data-handling-policy' },
        ],
        tools: ['Data Destruction Register Template', 'NDPR Compliance Checklist', 'Data Anonymization Guide']
      },
    },
  })

  // Questions for Module 5.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m5_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Under NDPR, health data is classified as:',
        options: JSON.stringify([
          { id: 'a', text: 'Standard personal data with no special protections', isCorrect: false },
          { id: 'b', text: 'Sensitive personal data requiring explicit consent or legal basis for processing', isCorrect: true },
          { id: 'c', text: 'Public data that can be freely shared', isCorrect: false },
          { id: 'd', text: 'Corporate data governed by commercial law, not data protection law', isCorrect: false },
        ]),
        explanation: 'Health data receives special protection under NDPR as "sensitive personal data." Processing it requires explicit consent from the data subject or a legal basis such as public health necessity.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m5_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When a C4A engagement ends, within what timeframe must client data be returned or securely deleted?',
        options: JSON.stringify([
          { id: 'a', text: '7 days', isCorrect: false },
          { id: 'b', text: '30 days', isCorrect: true },
          { id: 'c', text: '90 days', isCorrect: false },
          { id: 'd', text: 'No specific timeframe; whenever convenient', isCorrect: false },
        ]),
        explanation: 'C4A policy requires all client data to be returned or securely deleted within 30 days of engagement completion, unless a longer retention period is specified in the engagement contract.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m5_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'You need to analyze patient records for a clinical pathway review. What is the preferred approach under C4A data handling protocols?',
        options: JSON.stringify([
          { id: 'a', text: 'Download the full patient database to your laptop for analysis', isCorrect: false },
          { id: 'b', text: 'Work with anonymized or pseudonymized datasets wherever possible', isCorrect: true },
          { id: 'c', text: 'Use the data freely since you signed an NDA with the client', isCorrect: false },
          { id: 'd', text: 'Email the records to the C4A analytics team for processing', isCorrect: false },
        ]),
        explanation: 'C4A protocols require using anonymized or pseudonymized datasets wherever possible. If individual patient records are needed, the client must provide the legal basis and C4A must follow strict handling protocols.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m5_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A C4A colleague on a different engagement asks about your current project because they are "working on something similar." What should you do?',
        options: JSON.stringify([
          { id: 'a', text: 'Share details since they are a C4A employee and bound by the same confidentiality policies', isCorrect: false },
          { id: 'b', text: 'Share only general information, keeping specific details private', isCorrect: false },
          { id: 'c', text: 'Redirect them to the engagement lead; confidentiality follows the need-to-know principle', isCorrect: true },
          { id: 'd', text: 'Arrange a meeting to compare notes and share best practices', isCorrect: false },
        ]),
        explanation: 'Within C4A, confidentiality follows the need-to-know principle. Client information may only be shared with team members on the same engagement and C4A leadership for quality review. Colleagues on other engagements should be redirected to the engagement lead.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m5_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is a violation of C4A data handling protocols?',
        options: JSON.stringify([
          { id: 'a', text: 'Storing client data on the C4A platform', isCorrect: false },
          { id: 'b', text: 'Using full-disk encryption on laptops used for client work', isCorrect: false },
          { id: 'c', text: 'Sharing client files between team members via WhatsApp', isCorrect: true },
          { id: 'd', text: 'Completing the data destruction register after engagement close', isCorrect: false },
        ]),
        explanation: 'Data shared between team members must use the C4A platform, not email attachments or messaging apps like WhatsApp. Client data must never be stored on personal devices or in personal cloud accounts.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log('  Track 5: Professional Standards - 2 modules, 10 questions')

  console.log('\nC4ATraining Academy Foundation Level (B) seeding complete!')
  console.log('  Total: 3 tracks, 6 modules, 30 questions')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
