/**
 * CFA TRAINING ACADEMY - FOUNDATION LEVEL SEED (Tracks 1-2)
 * Seeds Foundation-level training tracks, modules, and assessment questions
 *
 * 2 Tracks:
 *   Track 1: Core Consulting Skills (methodology)
 *   Track 2: Healthcare Fundamentals (health_economics)
 *
 * This file DELETES all existing training data first, then creates fresh.
 *
 * Run: npx tsx prisma/seed-academy-foundation.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CFA Training Academy - Foundation Level Tracks (1-2)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // DELETE ALL EXISTING TRAINING DATA (order matters for FK constraints)
  // ════════════════════════════════════════════════════════════════════════════

  console.log('Deleting existing training data...')
  await prisma.questionAnswer.deleteMany({})
  await prisma.trainingQuestion.deleteMany({})
  await prisma.moduleProgress.deleteMany({})
  await prisma.trainingModule.deleteMany({})
  await prisma.trainingEnrollment.deleteMany({})
  await prisma.trainingTrack.deleteMany({})
  console.log('Existing training data deleted.\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 1: FOUNDATION - Core Consulting Skills
  // ════════════════════════════════════════════════════════════════════════════

  const coreConsulting = await prisma.trainingTrack.create({
    data: {
      name: 'Core Consulting Skills',
      slug: 'core-consulting-skills',
      description: `Build the foundational toolkit every CFA consultant needs before stepping into a client engagement. This track covers structured problem-solving using MECE and issue trees, client communication grounded in the Pyramid Principle, and data analysis techniques for turning messy hospital data into actionable insights. These are non-negotiable skills that separate professional consultants from well-meaning advisors.`,
      level: 'FOUNDATION',
      category: 'methodology',
      iconName: 'brain',
      colorHex: '#1E40AF',
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
      description: 'Master MECE frameworks, issue trees, and hypothesis-driven analysis to decompose complex healthcare challenges into workable components.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The MECE Principle',
            type: 'text',
            body: `MECE stands for Mutually Exclusive, Collectively Exhaustive. It is the single most important structuring principle in consulting. When you decompose a problem into MECE categories, every element belongs to exactly one category (mutually exclusive) and all elements are accounted for (collectively exhaustive). Without MECE thinking, your analysis will either double-count issues or miss them entirely.

              In African healthcare consulting, MECE discipline is critical because problems are interconnected and messy. A hospital CEO says "we are losing money." A MECE decomposition might split revenue into outpatient, inpatient, diagnostics, and pharmacy streams, then split costs into personnel, supplies, utilities, and depreciation. Each bucket is distinct, and together they cover the full P&L. This prevents the common trap of chasing one visible problem while ignoring the real driver.`
          },
          {
            title: 'Issue Trees and Hypothesis-Driven Analysis',
            type: 'text',
            body: `An issue tree is a visual decomposition of a key question into sub-questions, structured in a MECE hierarchy. The top node is your governing question: "Why is Lakeview Hospital's operating margin declining?" The first branch might split into revenue-side factors and cost-side factors. Each of those branches further until you reach testable hypotheses at the leaves.

              Hypothesis-driven analysis flips the traditional research approach. Instead of gathering all data and hoping patterns emerge, you start with a hypothesis ("the margin decline is driven by rising locum costs exceeding 40% of the personnel budget") and then design your data collection to prove or disprove it. This approach is faster and more focused, which matters when your client is paying by the week and wants answers, not research projects.`
          },
          {
            title: 'Applying Structure to Healthcare Problems',
            type: 'text',
            body: `Healthcare problems come in recognizable patterns. Revenue problems decompose into volume (patient numbers, case mix) and yield (reimbursement rates, collections efficiency). Operational problems decompose into capacity, throughput, and quality. Staffing problems decompose into recruitment, retention, productivity, and skill mix. Knowing these standard structures lets you build an issue tree in minutes rather than hours.

              Practice building issue trees for common CFA engagement types: hospital turnaround, department optimization, new service line feasibility, and claims leakage reduction. For each, start with the governing question, build two levels of branches, and identify the data you would need to test each leaf hypothesis. Speed and precision in structuring will define your effectiveness in the first week of any engagement.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Build a MECE Issue Tree',
            instruction: 'A 150-bed private hospital in Abuja has seen revenue decline by 22% over 18 months despite stable patient volumes. Build a MECE issue tree with at least three levels to identify potential root causes.',
          },
          {
            title: 'Practice: Hypothesis-Driven Workplan',
            instruction: 'Based on your issue tree, select the three most likely hypotheses and design a one-week workplan to test each. Specify the data sources, analysis method, and decision criteria for each hypothesis.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'MECE Framework Guide', url: 'internal://knowledge/mece-framework' },
          { title: 'Issue Tree Templates', url: 'internal://knowledge/issue-tree-templates' },
        ],
        tools: ['Issue Tree Builder', 'Hypothesis Tracker', 'Problem Structuring Worksheet']
      },
    },
  })

  // Questions for Module 1.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does MECE stand for in consulting problem-solving?',
        options: JSON.stringify([
          { id: 'a', text: 'Most Effective Cost Evaluation', isCorrect: false },
          { id: 'b', text: 'Mutually Exclusive, Collectively Exhaustive', isCorrect: true },
          { id: 'c', text: 'Management Executive Consulting Exercise', isCorrect: false },
          { id: 'd', text: 'Measured Evidence for Clinical Effectiveness', isCorrect: false },
        ]),
        explanation: 'MECE (Mutually Exclusive, Collectively Exhaustive) ensures every element belongs to exactly one category and all elements are accounted for, preventing double-counting or gaps in analysis.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In hypothesis-driven analysis, what is the correct starting point?',
        options: JSON.stringify([
          { id: 'a', text: 'Collect all available data and look for patterns', isCorrect: false },
          { id: 'b', text: 'Interview every department head before forming any view', isCorrect: false },
          { id: 'c', text: 'Form a testable hypothesis first, then design data collection to prove or disprove it', isCorrect: true },
          { id: 'd', text: 'Benchmark against international hospital performance data', isCorrect: false },
        ]),
        explanation: 'Hypothesis-driven analysis starts with a specific, testable hypothesis and then collects targeted data to validate or invalidate it. This is faster and more focused than open-ended data gathering.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital CEO says "we are losing money." Which decomposition is MECE?',
        options: JSON.stringify([
          { id: 'a', text: 'Revenue is low, costs are high, and staff are unproductive', isCorrect: false },
          { id: 'b', text: 'Revenue-side factors and cost-side factors', isCorrect: true },
          { id: 'c', text: 'Inpatient problems, outpatient problems, and financial problems', isCorrect: false },
          { id: 'd', text: 'Clinical issues, operational issues, and revenue issues', isCorrect: false },
        ]),
        explanation: 'Revenue-side and cost-side is MECE because every financial driver falls into one or the other, with no overlap. The other options either overlap (staff productivity affects both revenue and cost) or are not exhaustive.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the top node of an issue tree?',
        options: JSON.stringify([
          { id: 'a', text: 'The client organization name', isCorrect: false },
          { id: 'b', text: 'The project timeline', isCorrect: false },
          { id: 'c', text: 'The governing question the engagement seeks to answer', isCorrect: true },
          { id: 'd', text: 'A list of all stakeholders', isCorrect: false },
        ]),
        explanation: 'The top node of an issue tree is the governing question (e.g., "Why is operating margin declining?"). All branches below decompose this question into testable sub-questions.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m1_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Revenue problems in healthcare typically decompose into which two primary drivers?',
        options: JSON.stringify([
          { id: 'a', text: 'Quality and safety', isCorrect: false },
          { id: 'b', text: 'Volume (patient numbers, case mix) and yield (reimbursement rates, collections efficiency)', isCorrect: true },
          { id: 'c', text: 'Staff count and equipment age', isCorrect: false },
          { id: 'd', text: 'Marketing spend and brand reputation', isCorrect: false },
        ]),
        explanation: 'Revenue in healthcare is a function of how many patients you see and what mix of services they consume (volume) multiplied by how much you collect per service (yield). This is the standard first-level revenue decomposition.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 1.2: Client Communication
  const m1_2 = await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Client Communication',
      slug: 'client-communication',
      description: 'Learn the Pyramid Principle, executive communication techniques, and how to deliver findings that drive action rather than confusion.',
      order: 2,
      estimatedMinutes: 100,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The Pyramid Principle',
            type: 'text',
            body: `The Pyramid Principle, developed by Barbara Minto at McKinsey, is the foundation of all consulting communication. The core rule: start with the answer, then support it with grouped arguments, then back those arguments with data. Most people communicate bottom-up (here is what I did, here is what I found, and therefore my conclusion). Consultants communicate top-down (here is my recommendation, supported by three reasons, each backed by evidence).

              In practice, this means every email, slide, and presentation to a hospital CEO starts with the "so what." Instead of "We analyzed 18 months of theatre utilization data across 6 operating rooms and found variation in scheduling patterns," lead with "Theatre utilization can increase by 30% through three scheduling changes, adding an estimated 400 million naira in annual revenue." The supporting data comes after, organized in logical groups.`
          },
          {
            title: 'Executive Communication in African Healthcare',
            type: 'text',
            body: `African healthcare leaders operate under intense pressure with limited time. A medical director running a 200-bed hospital may have 15 minutes between emergencies to review your findings. Your communication must respect that reality. Use the "1-3-1" format: one key message, three supporting points, one clear ask or next step. Everything else goes in an appendix.

              Cultural context matters. In many African business settings, direct contradiction of senior leaders requires diplomatic framing. Instead of "Your assumption about bed occupancy is wrong," frame it as "The data suggests an opportunity to revisit bed occupancy targets based on updated patient flow patterns." The message is the same; the delivery respects the relationship. Master the balance between clarity and diplomacy.`
          },
          {
            title: 'Slide Design and Written Deliverables',
            type: 'text',
            body: `Every slide needs an action title: a complete sentence at the top that states the "so what" of that slide. "Revenue Breakdown by Department" is a topic title and tells the reader nothing. "Pharmacy generates 45% of revenue but only 12% of margin, indicating pricing or procurement issues" is an action title that drives the narrative forward. If you read only the action titles of a deck in sequence, they should tell the complete story.

              For written reports, use the situation-complication-resolution (SCR) structure. Situation: the context both you and the client agree on. Complication: the problem or change that creates tension. Resolution: your recommendation. This structure works for executive summaries, board papers, and even weekly status updates. Keep paragraphs short, use bullet points for lists of three or more items, and always end with explicit next steps and owners.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Pyramid-Structured Email',
            instruction: 'A hospital CFO has asked you to summarize your findings on revenue leakage. Write a 200-word email using the Pyramid Principle. Start with the answer, provide three supporting points, and end with a clear next step.',
          },
          {
            title: 'Practice: Action Title Rewrite',
            instruction: 'Rewrite these topic titles as action titles: (1) "Patient Wait Time Analysis" (2) "Staffing Levels by Department" (3) "Insurance Claims Data" (4) "Pharmacy Inventory Status".',
          }
        ]
      },
      resources: {
        links: [
          { title: 'The Pyramid Principle Summary', url: 'internal://knowledge/pyramid-principle' },
          { title: 'CFA Slide Design Standards', url: 'internal://knowledge/slide-design-guide' },
        ],
        tools: ['Action Title Checker', 'SCR Template', 'Executive Summary Builder']
      },
    },
  })

  // Questions for Module 1.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the Pyramid Principle, how should consulting communication be structured?',
        options: JSON.stringify([
          { id: 'a', text: 'Start with methodology, then data, then conclusions', isCorrect: false },
          { id: 'b', text: 'Start with the answer/recommendation, then supporting arguments, then evidence', isCorrect: true },
          { id: 'c', text: 'Start with background context, then analysis, then recommendations', isCorrect: false },
          { id: 'd', text: 'Start with stakeholder introductions, then present findings chronologically', isCorrect: false },
        ]),
        explanation: 'The Pyramid Principle requires top-down communication: lead with the conclusion or recommendation, then group supporting arguments beneath it, each backed by evidence. This is the opposite of bottom-up academic communication.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the "1-3-1" communication format?',
        options: JSON.stringify([
          { id: 'a', text: 'One page, three charts, one appendix', isCorrect: false },
          { id: 'b', text: 'One key message, three supporting points, one clear ask or next step', isCorrect: true },
          { id: 'c', text: 'One hour meeting, three agenda items, one follow-up email', isCorrect: false },
          { id: 'd', text: 'One hypothesis, three data sources, one conclusion', isCorrect: false },
        ]),
        explanation: 'The 1-3-1 format ensures concise communication for time-pressed executives: one key message they must remember, three supporting points that justify it, and one clear action or ask.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is an action title rather than a topic title?',
        options: JSON.stringify([
          { id: 'a', text: 'Revenue Breakdown by Department', isCorrect: false },
          { id: 'b', text: 'Patient Wait Time Analysis', isCorrect: false },
          { id: 'c', text: 'Pharmacy generates 45% of revenue but only 12% of margin, indicating pricing issues', isCorrect: true },
          { id: 'd', text: 'Staffing Levels Overview', isCorrect: false },
        ]),
        explanation: 'An action title is a complete sentence that states the "so what" of the slide. Topic titles merely name the content area without conveying the insight. Action titles drive the narrative forward.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does the SCR structure stand for in written deliverables?',
        options: JSON.stringify([
          { id: 'a', text: 'Summary, Conclusion, Recommendation', isCorrect: false },
          { id: 'b', text: 'Scope, Context, Results', isCorrect: false },
          { id: 'c', text: 'Situation, Complication, Resolution', isCorrect: true },
          { id: 'd', text: 'Strategy, Cost, Risk', isCorrect: false },
        ]),
        explanation: 'SCR (Situation, Complication, Resolution) is a narrative structure that establishes shared context, introduces the problem or tension, and then presents the recommended solution.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m1_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When delivering findings that may contradict a senior African healthcare leader, what is the recommended approach?',
        options: JSON.stringify([
          { id: 'a', text: 'Avoid sharing the contradictory findings entirely', isCorrect: false },
          { id: 'b', text: 'Present the data bluntly to establish credibility', isCorrect: false },
          { id: 'c', text: 'Frame findings diplomatically, e.g., "the data suggests an opportunity to revisit..." while keeping the message clear', isCorrect: true },
          { id: 'd', text: 'Only share contradictory findings with junior staff', isCorrect: false },
        ]),
        explanation: 'Effective consulting communication in African contexts balances clarity with diplomacy. The message stays factual and clear, but the delivery respects relationships and cultural norms around seniority.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 1.3: Data Analysis & Synthesis
  const m1_3 = await prisma.trainingModule.create({
    data: {
      trackId: coreConsulting.id,
      name: 'Data Analysis & Synthesis',
      slug: 'data-analysis-synthesis',
      description: 'Learn to collect, clean, analyze, and synthesize healthcare data into compelling, evidence-based recommendations.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Data Collection in African Healthcare Settings',
            type: 'text',
            body: `Data in African hospitals is rarely clean, rarely digital, and rarely complete. Your first task on any engagement is a rapid data inventory: what exists, where it lives, how reliable it is, and what gaps need filling. Common sources include HMIS registers, billing system exports, HR spreadsheets, pharmacy stock cards, and paper-based ward registers. Expect inconsistencies between sources. The finance department's patient count will not match the medical records department's count. Your job is to triangulate.

              Design your data collection around the hypotheses you need to test, not the data that happens to be available. If you need theatre utilization data and the hospital has no digital scheduling system, design a simple tally sheet and have theatre nurses fill it for two weeks. Proxy data collected with discipline is more useful than years of messy administrative data. Always validate a sample manually before trusting any dataset.`
          },
          {
            title: 'Core Analytical Techniques',
            type: 'text',
            body: `Four techniques handle 80% of healthcare consulting analysis. First, variance analysis: compare actual performance to budget, prior year, or benchmark. "Revenue is 18% below budget, driven entirely by outpatient volumes dropping 25% while inpatient held steady." Second, Pareto analysis: identify the 20% of causes driving 80% of impact. "Three DRG codes account for 62% of claims rejections." Third, trend analysis: plot key metrics over time to identify inflection points and seasonality. Fourth, cohort analysis: compare performance across groups (departments, physicians, payer types) to find outliers.

              For each technique, the output must be a clear "so what." A chart showing declining revenue is observation. "Revenue declined 18% due to a 25% drop in outpatient volumes, correlating with the opening of a competing clinic 2km away in March 2024" is analysis. Always connect the data to a causal explanation and a recommended action.`
          },
          {
            title: 'Synthesis: From Data to Recommendations',
            type: 'text',
            body: `Synthesis is where most junior consultants struggle. You have 15 spreadsheets, 20 interviews, and 8 site observations. The question is: what does it all mean? The synthesis process has three steps. First, pattern recognition: what themes appear across multiple data sources? If the finance data shows rising costs, interviews mention locum overuse, and the HR spreadsheet shows 30% nursing vacancies, the pattern is clear. Second, prioritization: which findings have the largest impact and highest feasibility? Use a 2x2 matrix of impact versus ease of implementation. Third, storyline development: arrange your findings into a logical narrative that leads inevitably to your recommendations.

              Test your synthesis by presenting it to a colleague in two minutes. If they understand the situation, the key findings, and the recommended actions, your synthesis is strong. If they have clarifying questions about basic facts, you need to simplify. The goal is a recommendation that a hospital CEO can act on Monday morning, not a research paper.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Data Inventory Assessment',
            instruction: 'You arrive at a 100-bed hospital for a revenue optimization engagement. List 10 data sources you would request in your first-week data request, specifying the format you expect, the department that owns it, and what hypothesis each source helps test.',
          },
          {
            title: 'Practice: Synthesis Exercise',
            instruction: 'Given these three findings: (1) Bed occupancy is 58%, (2) Average length of stay is 7.2 days vs. 4.5 day benchmark, (3) Discharge processes take 4-6 hours. Write a two-paragraph synthesis that connects these findings and proposes one actionable recommendation.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Data Collection Templates for African Hospitals', url: 'internal://knowledge/data-collection-templates' },
          { title: 'Healthcare Analytics Toolkit', url: 'internal://knowledge/analytics-toolkit' },
        ],
        tools: ['Data Inventory Checklist', 'Variance Analysis Template', 'Impact-Feasibility Matrix']
      },
    },
  })

  // Questions for Module 1.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What should be your first step when assessing data at an African hospital?',
        options: JSON.stringify([
          { id: 'a', text: 'Import all available data into a single database', isCorrect: false },
          { id: 'b', text: 'Conduct a rapid data inventory: what exists, where it lives, how reliable it is, and what gaps need filling', isCorrect: true },
          { id: 'c', text: 'Request the hospital purchase a modern EMR system', isCorrect: false },
          { id: 'd', text: 'Focus exclusively on financial data from the accounting system', isCorrect: false },
        ]),
        explanation: 'A rapid data inventory is the essential first step because it establishes what you can work with, identifies reliability issues early, and reveals gaps that may need proxy data collection.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which analytical technique identifies the 20% of causes driving 80% of impact?',
        options: JSON.stringify([
          { id: 'a', text: 'Variance analysis', isCorrect: false },
          { id: 'b', text: 'Trend analysis', isCorrect: false },
          { id: 'c', text: 'Pareto analysis', isCorrect: true },
          { id: 'd', text: 'Cohort analysis', isCorrect: false },
        ]),
        explanation: 'Pareto analysis (the 80/20 rule) identifies the vital few causes that drive the majority of impact, allowing consultants to focus recommendations on the highest-leverage areas.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What distinguishes analysis from mere observation?',
        options: JSON.stringify([
          { id: 'a', text: 'Analysis uses more sophisticated charts', isCorrect: false },
          { id: 'b', text: 'Analysis connects data to a causal explanation and a recommended action', isCorrect: true },
          { id: 'c', text: 'Analysis requires at least 12 months of historical data', isCorrect: false },
          { id: 'd', text: 'Analysis must be validated by the client before sharing', isCorrect: false },
        ]),
        explanation: '"Revenue declined 18%" is observation. "Revenue declined 18% due to outpatient volume drops correlating with a new competitor, recommend targeted service differentiation" is analysis. The causal link and action make the difference.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are the three steps in the synthesis process?',
        options: JSON.stringify([
          { id: 'a', text: 'Data cleaning, visualization, and presentation', isCorrect: false },
          { id: 'b', text: 'Pattern recognition, prioritization, and storyline development', isCorrect: true },
          { id: 'c', text: 'Hypothesis generation, testing, and validation', isCorrect: false },
          { id: 'd', text: 'Interviews, surveys, and benchmarking', isCorrect: false },
        ]),
        explanation: 'Synthesis moves from recognizing patterns across data sources, to prioritizing findings by impact and feasibility, to arranging them into a compelling narrative that leads to clear recommendations.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m1_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When hospital data sources show inconsistent patient counts, what is the recommended approach?',
        options: JSON.stringify([
          { id: 'a', text: 'Use whichever source has the highest numbers', isCorrect: false },
          { id: 'b', text: 'Discard all data and rely solely on interviews', isCorrect: false },
          { id: 'c', text: 'Triangulate across multiple sources and validate a sample manually', isCorrect: true },
          { id: 'd', text: 'Report only the finance department numbers since they are audited', isCorrect: false },
        ]),
        explanation: 'Triangulation across sources (finance, medical records, ward registers) combined with manual sample validation is the most reliable approach when data sources conflict, which is common in African healthcare settings.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log(`Track 1 created: ${coreConsulting.name} (${coreConsulting.slug})`)
  console.log(`  - Module 1.1: ${m1_1.name}`)
  console.log(`  - Module 1.2: ${m1_2.name}`)
  console.log(`  - Module 1.3: ${m1_3.name}\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 2: FOUNDATION - Healthcare Fundamentals
  // ════════════════════════════════════════════════════════════════════════════

  const healthcareFundamentals = await prisma.trainingTrack.create({
    data: {
      name: 'Healthcare Fundamentals',
      slug: 'healthcare-fundamentals',
      description: `Understand how healthcare systems work in Africa before you try to fix them. This track covers the WHO health system building blocks, hospital operations from admission to discharge, and healthcare financing models including capitation, fee-for-service, DRGs, and national health insurance schemes. Every CFA consultant must speak the language of healthcare, whether they come from a clinical, business, or public health background.`,
      level: 'FOUNDATION',
      category: 'health_economics',
      iconName: 'heart-pulse',
      colorHex: '#DC2626',
      prerequisites: [],
      estimatedHours: 20,
      sortOrder: 2,
    },
  })

  // Module 2.1: Health Systems Overview
  const m2_1 = await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Health Systems Overview',
      slug: 'health-systems-overview',
      description: 'Understand the WHO health system building blocks and how they apply to African healthcare contexts, from Nigeria to Kenya to Ghana.',
      order: 1,
      estimatedMinutes: 90,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'The WHO Health System Building Blocks',
            type: 'text',
            body: `The World Health Organization defines six building blocks that constitute a health system: service delivery, health workforce, health information systems, access to essential medicines, financing, and leadership/governance. These building blocks provide a universal framework for understanding why health systems perform the way they do. When a hospital fails, it is rarely one building block in isolation. It is usually a cascade: weak governance leads to poor financing decisions, which leads to workforce attrition, which leads to service delivery collapse.

              For CFA consultants, the building blocks are a diagnostic checklist. When you walk into any engagement, map the client's challenges to building blocks. A hospital struggling with quality? Check service delivery protocols, workforce capacity, and information systems. A government agency with poor maternal mortality outcomes? Check financing adequacy, medicine supply chains, and governance accountability structures. The framework prevents you from treating symptoms while missing systemic causes.`
          },
          {
            title: 'African Health System Archetypes',
            type: 'text',
            body: `African health systems broadly fall into three archetypes, each with distinct consulting implications. First, tax-funded national systems (e.g., Tanzania, Uganda) where government owns and operates most facilities, funded through general taxation and donor support. These systems face chronic underfunding, centralized bureaucracy, and procurement bottlenecks. Second, social health insurance systems (e.g., Ghana's NHIS, Kenya's SHA) where mandatory or voluntary insurance pools funds for care delivery. These face enrollment gaps, claims processing delays, and provider payment disputes. Third, mixed private-public systems (e.g., Nigeria, South Africa) where private hospitals serve the paying middle class while public facilities serve the majority with fewer resources.

              Understanding which archetype you are working within determines your approach. In a tax-funded system, your client is often a ministry or donor program, and recommendations must fit government procurement rules. In an insurance system, your focus may be on claims optimization and accreditation. In a mixed system, private hospital engagements focus on commercial performance while public sector work focuses on efficiency within fixed budgets.`
          },
          {
            title: 'Key Health Metrics Every Consultant Must Know',
            type: 'text',
            body: `Before entering any healthcare engagement, you must be fluent in the metrics that define system performance. At the national level: life expectancy, under-5 mortality rate, maternal mortality ratio, total health expenditure as percentage of GDP, and out-of-pocket expenditure as percentage of total health spending. At the facility level: bed occupancy rate, average length of stay (ALOS), patient-to-nurse ratio, theatre utilization, outpatient visits per day, and revenue per bed per day.

              Context matters more than absolute numbers. Nigeria's maternal mortality ratio of approximately 512 per 100,000 live births is alarming by global standards but represents significant variation internally: Lagos State performs very differently from Sokoto State. Similarly, a bed occupancy rate of 65% might signal underperformance in Nairobi but represent full practical capacity in a rural Malawian district hospital that cannot staff night shifts. Always ask "compared to what?" and "why?" before interpreting any metric.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Building Block Diagnosis',
            instruction: 'A state government hospital in southeastern Nigeria has rising maternal mortality despite receiving new equipment last year. Using the WHO building blocks, identify which blocks are most likely failing and explain why equipment alone is insufficient.',
          },
          {
            title: 'Practice: System Archetype Analysis',
            instruction: 'Compare the consulting approach you would take for a revenue optimization engagement at: (1) a private hospital in Lagos, (2) a government hospital in Dar es Salaam, and (3) an NHIS-accredited hospital in Kumasi. Highlight one key difference for each.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'WHO Health System Building Blocks Framework', url: 'internal://knowledge/who-building-blocks' },
          { title: 'African Health Systems Comparative Analysis', url: 'internal://knowledge/african-health-systems' },
        ],
        tools: ['Health System Diagnostic Checklist', 'Country Health Profile Template']
      },
    },
  })

  // Questions for Module 2.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m2_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'How many building blocks does the WHO health system framework define?',
        options: JSON.stringify([
          { id: 'a', text: 'Four', isCorrect: false },
          { id: 'b', text: 'Five', isCorrect: false },
          { id: 'c', text: 'Six', isCorrect: true },
          { id: 'd', text: 'Eight', isCorrect: false },
        ]),
        explanation: 'The WHO framework defines six building blocks: service delivery, health workforce, health information systems, access to essential medicines, financing, and leadership/governance.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m2_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is NOT one of the WHO health system building blocks?',
        options: JSON.stringify([
          { id: 'a', text: 'Health workforce', isCorrect: false },
          { id: 'b', text: 'Technology infrastructure', isCorrect: true },
          { id: 'c', text: 'Access to essential medicines', isCorrect: false },
          { id: 'd', text: 'Leadership and governance', isCorrect: false },
        ]),
        explanation: 'Technology infrastructure is not a standalone WHO building block. The six blocks are: service delivery, health workforce, health information systems, access to essential medicines, financing, and leadership/governance.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m2_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Ghana\'s NHIS is an example of which health system archetype?',
        options: JSON.stringify([
          { id: 'a', text: 'Tax-funded national system', isCorrect: false },
          { id: 'b', text: 'Social health insurance system', isCorrect: true },
          { id: 'c', text: 'Mixed private-public system', isCorrect: false },
          { id: 'd', text: 'Fully privatized system', isCorrect: false },
        ]),
        explanation: 'Ghana\'s National Health Insurance Scheme (NHIS) pools funds through mandatory and voluntary insurance contributions for care delivery, making it a social health insurance archetype.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m2_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Why is a bed occupancy rate of 65% insufficient to evaluate hospital performance without context?',
        options: JSON.stringify([
          { id: 'a', text: 'Because 65% is always considered good performance', isCorrect: false },
          { id: 'b', text: 'Because the same rate may signal underperformance in one setting but full practical capacity in another due to staffing or infrastructure constraints', isCorrect: true },
          { id: 'c', text: 'Because bed occupancy is not a valid metric', isCorrect: false },
          { id: 'd', text: 'Because only financial metrics matter for performance evaluation', isCorrect: false },
        ]),
        explanation: 'Context determines interpretation. A 65% rate in a well-resourced urban hospital suggests underutilization, while the same rate in a rural hospital unable to staff night shifts may represent full practical capacity. Always ask "compared to what?" and "why?".',
        points: 1,
        order: 4,
      },
      {
        moduleId: m2_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In a mixed private-public health system like Nigeria, what typically differentiates consulting approaches between sectors?',
        options: JSON.stringify([
          { id: 'a', text: 'Private and public engagements use identical approaches', isCorrect: false },
          { id: 'b', text: 'Private engagements focus on commercial performance while public engagements focus on efficiency within fixed budgets', isCorrect: true },
          { id: 'c', text: 'Public hospitals do not need consulting services', isCorrect: false },
          { id: 'd', text: 'Private hospitals only need marketing support', isCorrect: false },
        ]),
        explanation: 'In mixed systems, private hospital consulting focuses on revenue growth, margin optimization, and competitive positioning. Public sector consulting focuses on maximizing outcomes within constrained budgets, improving efficiency, and navigating government processes.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 2.2: Hospital Operations
  const m2_2 = await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Hospital Operations',
      slug: 'hospital-operations',
      description: 'Understand how hospitals actually work: department structures, patient flow from admission to discharge, and the key operational metrics that reveal performance.',
      order: 2,
      estimatedMinutes: 100,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Hospital Department Structure and Patient Flow',
            type: 'text',
            body: `A hospital is a complex system of interdependent departments, and understanding how they connect is essential before you can optimize any of them. The core clinical departments include the Emergency Department (first point of contact for acute cases), Outpatient Department (scheduled visits, follow-ups, specialist clinics), Inpatient Wards (medical, surgical, pediatric, maternity, ICU), Operating Theatres, Diagnostics (laboratory, radiology, endoscopy), and Pharmacy. Supporting these are non-clinical departments: finance, human resources, procurement, medical records, facilities management, kitchen, laundry, and CSSD (Central Sterile Services).

              Patient flow is the movement of a patient through these departments from arrival to discharge. A typical inpatient journey: arrival at ED or OPD, triage, consultation, decision to admit, bed assignment, diagnostic workups, treatment, daily ward rounds, discharge decision, discharge process (medications, instructions, billing), and exit. Every handoff between departments is a potential bottleneck. The most common flow problems in African hospitals occur at three points: ED-to-ward admission (bed unavailability), ward-to-theatre scheduling (poor coordination), and discharge processes (billing delays, missing documentation).`
          },
          {
            title: 'Key Operational Metrics: ALOS, Bed Occupancy, and Throughput',
            type: 'text',
            body: `Three metrics form the operational performance triangle for any hospital. Average Length of Stay (ALOS) measures how many days patients spend in hospital on average. Lower ALOS (within clinical safety bounds) means faster throughput and lower cost per case. African hospital ALOS benchmarks vary by case type, but general medical patients averaging above 6 days or surgical patients above 5 days typically signal discharge process inefficiencies or complications.

              Bed Occupancy Rate measures what percentage of available beds are occupied at a point in time. The optimal range is 80-85%; below 70% signals underutilization and revenue loss, above 90% creates safety risks and diversion. Bed Turnover Rate measures how many patients use each bed per period. These three metrics are interconnected: reducing ALOS increases turnover, which can increase occupancy (if demand exists) or reduce needed bed stock. A consultant who understands these relationships can quantify the revenue impact of operational improvements. For example: reducing ALOS by 1 day across 200 beds with 80% occupancy frees approximately 58,400 bed-days annually.`
          },
          {
            title: 'Theatre Utilization and Revenue Cycle',
            type: 'text',
            body: `Operating theatres are the highest-revenue, highest-cost departments in most hospitals, making theatre utilization a critical operational focus. Key metrics include: first-case on-time start rate (percentage of days the first surgery starts within 15 minutes of scheduled time), turnover time (minutes between one patient leaving and the next entering), cancellation rate (surgeries cancelled on the day), and utilization rate (actual operating hours divided by available theatre hours). In many African hospitals, theatre utilization runs 40-55% when it should be 70-80%, representing enormous lost revenue.

              The revenue cycle encompasses everything from patient registration to final payment collection. In African hospitals, revenue leakage occurs at predictable points: unrecorded consumables in theatre, uncosted pharmacy items, unbilled diagnostic tests, delayed or incorrect insurance claims, and poor follow-up on outstanding balances. A revenue cycle audit typically finds 8-15% leakage in hospitals without strong billing controls. Understanding these operational realities allows you to size opportunities accurately and prioritize your recommendations.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Patient Flow Mapping',
            instruction: 'Map the patient flow for an elective surgical patient at a 150-bed hospital, from initial outpatient consultation to post-discharge follow-up. Identify the five most likely bottleneck points and suggest one improvement for each.',
          },
          {
            title: 'Practice: Operational Impact Calculation',
            instruction: 'A 200-bed hospital has 78% bed occupancy, ALOS of 6.8 days, and average revenue of 45,000 naira per bed-day. Calculate: (1) current annual bed-day revenue, (2) additional annual revenue if ALOS reduces to 5.5 days with occupancy maintained, and (3) the percentage revenue increase.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Hospital Operations Benchmarks - Africa', url: 'internal://knowledge/hospital-ops-benchmarks' },
          { title: 'Patient Flow Optimization Guide', url: 'internal://knowledge/patient-flow-guide' },
        ],
        tools: ['Bed Management Calculator', 'Theatre Utilization Tracker', 'Revenue Cycle Audit Checklist']
      },
    },
  })

  // Questions for Module 2.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m2_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the optimal bed occupancy rate range for a hospital?',
        options: JSON.stringify([
          { id: 'a', text: '60-70%', isCorrect: false },
          { id: 'b', text: '80-85%', isCorrect: true },
          { id: 'c', text: '90-95%', isCorrect: false },
          { id: 'd', text: '95-100%', isCorrect: false },
        ]),
        explanation: 'The optimal range is 80-85%. Below 70% signals underutilization and revenue loss. Above 90% creates patient safety risks, staff burnout, and the need to divert patients.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m2_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which three points in a hospital are the most common patient flow bottlenecks in African settings?',
        options: JSON.stringify([
          { id: 'a', text: 'Parking, reception, and cafeteria', isCorrect: false },
          { id: 'b', text: 'ED-to-ward admission, ward-to-theatre scheduling, and discharge processes', isCorrect: true },
          { id: 'c', text: 'Laboratory, radiology, and pharmacy', isCorrect: false },
          { id: 'd', text: 'HR, finance, and procurement', isCorrect: false },
        ]),
        explanation: 'The three most common bottlenecks are: ED-to-ward (bed unavailability), ward-to-theatre (poor scheduling coordination), and discharge (billing delays and missing documentation). Each represents a handoff between departments where coordination fails.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m2_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does ALOS stand for, and what does a high ALOS typically indicate?',
        options: JSON.stringify([
          { id: 'a', text: 'Annual Level of Service; indicates high service quality', isCorrect: false },
          { id: 'b', text: 'Average Length of Stay; may indicate discharge process inefficiencies or clinical complications', isCorrect: true },
          { id: 'c', text: 'Adjusted Level of Spending; indicates overspending', isCorrect: false },
          { id: 'd', text: 'Average Load on Staff; indicates overworked employees', isCorrect: false },
        ]),
        explanation: 'Average Length of Stay measures days patients spend in hospital. A high ALOS (e.g., above 6 days for general medical patients) often signals discharge bottlenecks, poor care coordination, or preventable complications rather than clinical necessity.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m2_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In many African hospitals, operating theatre utilization runs at what typical range?',
        options: JSON.stringify([
          { id: 'a', text: '80-90%, which is optimal', isCorrect: false },
          { id: 'b', text: '40-55%, well below the 70-80% target', isCorrect: true },
          { id: 'c', text: '95-100%, creating dangerous overuse', isCorrect: false },
          { id: 'd', text: '10-20%, due to lack of surgical demand', isCorrect: false },
        ]),
        explanation: 'Theatre utilization in many African hospitals runs 40-55% when the target should be 70-80%. This gap represents enormous lost revenue from late starts, long turnovers, same-day cancellations, and poor scheduling.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m2_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A revenue cycle audit in hospitals without strong billing controls typically finds what level of leakage?',
        options: JSON.stringify([
          { id: 'a', text: '1-3%', isCorrect: false },
          { id: 'b', text: '8-15%', isCorrect: true },
          { id: 'c', text: '25-30%', isCorrect: false },
          { id: 'd', text: 'Less than 1%', isCorrect: false },
        ]),
        explanation: 'Revenue leakage of 8-15% is typical in hospitals without strong billing controls, occurring through unrecorded consumables, uncosted items, unbilled tests, incorrect insurance claims, and poor collections follow-up.',
        points: 1,
        order: 5,
      },
    ],
  })

  // Module 2.3: Healthcare Financing
  const m2_3 = await prisma.trainingModule.create({
    data: {
      trackId: healthcareFundamentals.id,
      name: 'Healthcare Financing',
      slug: 'healthcare-financing',
      description: 'Understand how healthcare is paid for in Africa: capitation, fee-for-service, DRGs, and national health insurance schemes like NHIS.',
      order: 3,
      estimatedMinutes: 100,
      passingScore: 70,
      content: {
        sections: [
          {
            title: 'Provider Payment Mechanisms',
            type: 'text',
            body: `How providers get paid fundamentally shapes how they behave. Fee-for-service (FFS) pays providers for each service delivered: each consultation, test, procedure, and bed-day generates a separate charge. FFS incentivizes volume (more services equal more revenue) but can lead to overutilization and cost escalation. Most private hospitals in Africa operate primarily on FFS for cash-paying and insured patients.

              Capitation pays providers a fixed amount per enrolled member per period, regardless of services used. Ghana's NHIS uses capitation for primary care. This incentivizes efficiency (fewer unnecessary services) but can lead to underservice and cherry-picking of healthy enrollees. Diagnosis-Related Groups (DRGs) pay a fixed amount per hospital admission based on the diagnosis and procedure, regardless of actual length of stay or services consumed. DRGs incentivize efficiency within each case but require sophisticated coding and data infrastructure that many African health systems are still building.`
          },
          {
            title: 'National Health Insurance in Africa',
            type: 'text',
            body: `Several African countries have implemented or are building national health insurance schemes. Ghana's NHIS, launched in 2003, covers approximately 40% of the population through district mutual health insurance schemes funded by a national health insurance levy, social security contributions, and government subsidies. Kenya recently transitioned from NHIF to the Social Health Authority (SHA), aiming for universal coverage. Nigeria's NHIA (formerly NHIS) has historically covered primarily federal government employees but is expanding under the 2022 National Health Insurance Authority Act.

              For consultants, understanding NHIS dynamics is critical because insurance reimbursement directly affects hospital revenue and operations. Common challenges include: delayed reimbursement (3-12 months in some schemes), low tariff rates that do not cover actual costs, complex claims processes that lead to rejections, and limited benefit packages that exclude many services. A hospital deriving 40% of revenue from NHIS with 6-month payment delays faces a cash flow crisis that shapes every operational decision. Your financial analysis must account for these realities.`
          },
          {
            title: 'Implications for Consulting Engagements',
            type: 'text',
            body: `Payment mechanisms determine the type of consulting recommendations that will actually work. In a fee-for-service environment, revenue growth comes from increasing patient volumes, expanding service lines, and improving collections efficiency. In a capitated environment, the focus shifts to managing utilization, preventing costly complications, and keeping patients healthy at the primary care level. In a DRG environment, the priority is reducing cost-per-case through shorter lengths of stay, standardized clinical pathways, and accurate coding to ensure appropriate reimbursement.

              When advising hospitals on payer mix strategy, consider the risk profile of each payment mechanism. A hospital with 80% FFS revenue from cash patients is vulnerable to economic downturns that reduce patients' ability to pay. A hospital with 60% NHIS revenue is vulnerable to government reimbursement delays. The optimal strategy for most African hospitals is a diversified payer mix with strong cash collections, managed insurance exposure, and active management of claims to minimize rejections and delays.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Payment Mechanism Analysis',
            instruction: 'A 100-bed hospital in Accra derives 35% of revenue from NHIS capitation, 40% from NHIS fee-for-service, and 25% from cash patients. NHIS reimbursement is delayed by 5 months on average. Analyze the financial implications and recommend a payer mix strategy.',
          },
          {
            title: 'Practice: DRG Impact Assessment',
            instruction: 'A Nigerian hospital is preparing for a potential shift from fee-for-service to DRG-based payment for insured patients. Identify three operational changes the hospital must make and two risks they should prepare for.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Healthcare Financing in Sub-Saharan Africa', url: 'internal://knowledge/healthcare-financing-ssa' },
          { title: 'NHIS Tariff and Claims Guide', url: 'internal://knowledge/nhis-claims-guide' },
        ],
        tools: ['Payer Mix Analyzer', 'Claims Rejection Tracker', 'DRG Readiness Assessment']
      },
    },
  })

  // Questions for Module 2.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m2_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Under a fee-for-service (FFS) payment model, what behavior does the incentive structure encourage?',
        options: JSON.stringify([
          { id: 'a', text: 'Minimizing the number of services to reduce costs', isCorrect: false },
          { id: 'b', text: 'Delivering more services since each service generates separate revenue', isCorrect: true },
          { id: 'c', text: 'Focusing exclusively on preventive care', isCorrect: false },
          { id: 'd', text: 'Discharging patients as quickly as possible', isCorrect: false },
        ]),
        explanation: 'FFS pays per service delivered, so it naturally incentivizes volume. More consultations, tests, and procedures mean more revenue. This can lead to overutilization if not managed with clinical governance.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m2_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the primary risk of capitation payment for healthcare providers?',
        options: JSON.stringify([
          { id: 'a', text: 'Excessive revenue growth', isCorrect: false },
          { id: 'b', text: 'Overutilization of services', isCorrect: false },
          { id: 'c', text: 'Underservice of patients and cherry-picking of healthy enrollees', isCorrect: true },
          { id: 'd', text: 'Inability to bill for any services', isCorrect: false },
        ]),
        explanation: 'Capitation pays a fixed amount per member regardless of services used. This incentivizes providers to minimize care delivery, potentially leading to underservice. It also incentivizes enrolling healthy members who use fewer services (cherry-picking).',
        points: 1,
        order: 2,
      },
      {
        moduleId: m2_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What infrastructure requirement makes DRG-based payment challenging for many African health systems?',
        options: JSON.stringify([
          { id: 'a', text: 'Availability of hospital beds', isCorrect: false },
          { id: 'b', text: 'Sophisticated clinical coding and data infrastructure', isCorrect: true },
          { id: 'c', text: 'Sufficient number of doctors', isCorrect: false },
          { id: 'd', text: 'Proximity to international airports', isCorrect: false },
        ]),
        explanation: 'DRGs require accurate clinical coding (e.g., ICD-10) to assign each admission to the correct payment group. This demands trained coders, robust health information systems, and data infrastructure that many African health systems are still developing.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m2_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital deriving 60% of revenue from NHIS with 6-month payment delays faces which primary financial challenge?',
        options: JSON.stringify([
          { id: 'a', text: 'Excessive profitability', isCorrect: false },
          { id: 'b', text: 'A cash flow crisis that affects all operational decisions', isCorrect: true },
          { id: 'c', text: 'Too many patients seeking care', isCorrect: false },
          { id: 'd', text: 'Overstaffing due to high revenue', isCorrect: false },
        ]),
        explanation: 'When the majority of revenue is delayed 6 months, the hospital must fund operations (salaries, supplies, utilities) from reserves or debt while waiting for reimbursement. This cash flow gap shapes every operational decision from staffing to procurement.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m2_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the recommended payer mix strategy for most African hospitals?',
        options: JSON.stringify([
          { id: 'a', text: 'Rely entirely on government insurance for stable revenue', isCorrect: false },
          { id: 'b', text: 'Accept only cash-paying patients to avoid reimbursement delays', isCorrect: false },
          { id: 'c', text: 'Diversified payer mix with strong cash collections, managed insurance exposure, and active claims management', isCorrect: true },
          { id: 'd', text: 'Focus exclusively on international medical tourism', isCorrect: false },
        ]),
        explanation: 'Diversification reduces vulnerability to any single payer risk. Strong cash collections provide immediate liquidity, managed insurance exposure limits reimbursement delay risk, and active claims management minimizes rejections and accelerates payment.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log(`Track 2 created: ${healthcareFundamentals.name} (${healthcareFundamentals.slug})`)
  console.log(`  - Module 2.1: ${m2_1.name}`)
  console.log(`  - Module 2.2: ${m2_2.name}`)
  console.log(`  - Module 2.3: ${m2_3.name}\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════════

  console.log('════════════════════════════════════════════════════════════════')
  console.log('FOUNDATION SEED COMPLETE')
  console.log('════════════════════════════════════════════════════════════════')
  console.log('Tracks created: 2')
  console.log('Modules created: 6')
  console.log('Questions created: 30')
  console.log('')
  console.log('Track 1: Core Consulting Skills (24 hrs, methodology)')
  console.log('  1.1 Structured Problem-Solving (5 questions)')
  console.log('  1.2 Client Communication (5 questions)')
  console.log('  1.3 Data Analysis & Synthesis (5 questions)')
  console.log('')
  console.log('Track 2: Healthcare Fundamentals (20 hrs, health_economics)')
  console.log('  2.1 Health Systems Overview (5 questions)')
  console.log('  2.2 Hospital Operations (5 questions)')
  console.log('  2.3 Healthcare Financing (5 questions)')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
