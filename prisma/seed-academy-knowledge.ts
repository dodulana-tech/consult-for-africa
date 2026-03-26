import { PrismaClient, KnowledgeAssetType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Academy Knowledge Base entries...\n')

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['PARTNER', 'ADMIN', 'DIRECTOR'] } },
  })
  if (!admin) {
    console.error('No admin user found. Create a user first.')
    return
  }
  const authorId = admin.id
  console.log(`Using author: ${admin.name} (${admin.role})\n`)

  const assets: {
    title: string
    content: string
    assetType: KnowledgeAssetType
    tags: string[]
    isReusable: boolean
  }[] = [
    // ─── GUIDES (from academy reference links) ───────────────────────────────

    {
      title: 'MECE Framework Guide',
      content: `The MECE (Mutually Exclusive, Collectively Exhaustive) principle is the foundation of structured problem-solving in management consulting. Developed at McKinsey & Company, MECE ensures that when you break down a problem into components, those components do not overlap (mutually exclusive) and together they cover the complete problem space (collectively exhaustive).

In healthcare consulting across Africa, MECE is critical because hospital problems are often intertwined. Revenue leakage, for example, could stem from registration errors, charge capture failures, coding inaccuracies, claims denial, or collection inefficiency. A MECE breakdown separates these into distinct workstreams so that each can be diagnosed and addressed without duplication of effort.

To build a MECE issue tree: (1) Start with the core question or problem statement. (2) Identify 3-5 primary branches that are mutually exclusive. (3) Test exclusivity by asking "If I solve Branch A, does that automatically solve Branch B?" If yes, they overlap. (4) Test exhaustiveness by asking "If I solve all branches, is the entire problem addressed?" If no, you are missing a branch. (5) Continue decomposing each branch until you reach actionable, testable hypotheses at the leaf level.

Common MECE frameworks for hospital consulting include: Revenue vs. Cost decomposition, Internal vs. External factors, Clinical vs. Operational vs. Financial dimensions, and the Patient Journey framework (access, diagnosis, treatment, discharge, follow-up).`,
      assetType: 'GUIDE' as KnowledgeAssetType,
      tags: ['mece', 'problem-solving', 'methodology', 'consulting-fundamentals'],
      isReusable: true,
    },
    {
      title: 'Issue Tree Templates',
      content: `Issue trees are visual tools that decompose complex consulting problems into smaller, manageable components following the MECE principle. At C4A, issue trees are the primary diagnostic tool used in the first two weeks of every engagement.

Standard C4AIssue Tree Structures:

1. Profitability Tree: Revenue (Volume x Price) vs. Costs (Fixed + Variable). Used for hospital turnaround engagements where the core question is "Why is this hospital losing money?"

2. Patient Flow Tree: Access (Registration, Triage, Waiting) vs. Throughput (Diagnosis, Treatment, Procedures) vs. Discharge (Documentation, Billing, Follow-up). Used for operational improvement engagements.

3. Revenue Cycle Tree: Front-end (Scheduling, Registration, Eligibility) vs. Mid-cycle (Charge Capture, Coding, Claims) vs. Back-end (Payment Posting, Denials, Collections). Used for revenue cycle excellence engagements.

4. Clinical Governance Tree: Structure (Committees, Policies, Reporting) vs. Process (Audit, Risk Management, Training) vs. Outcomes (Clinical Indicators, Patient Safety, Satisfaction). Used for governance transformation.

When building an issue tree for a Nigerian hospital: always include an "Informal Systems" branch that captures non-documented revenue streams, parallel governance structures, and workaround processes that staff have developed. These are often invisible in formal documentation but critical to understanding actual operations.`,
      assetType: 'GUIDE' as KnowledgeAssetType,
      tags: ['issue-tree', 'problem-solving', 'diagnostic', 'templates'],
      isReusable: true,
    },
    {
      title: 'The Pyramid Principle Summary',
      content: `The Pyramid Principle, developed by Barbara Minto at McKinsey, is the gold standard for structuring consulting communication. The core idea: start with the answer first, then provide supporting arguments grouped logically.

The structure follows three rules: (1) Ideas at any level must always summarize the ideas grouped below them. (2) Ideas in each group must be the same kind of idea. (3) Ideas in each group must be logically ordered.

For C4A consultants, this means every client presentation, email, and deliverable follows the SCR format:

Situation: The current state (e.g., "Federal Medical Centre Lagos has a -8% operating margin")
Complication: What changed or what is wrong (e.g., "Claims denial rate has risen to 34%, 4x the industry benchmark, and two major HMOs are threatening to delist the hospital")
Resolution: Your recommendation (e.g., "Implement a 12-week revenue integrity programme targeting three workstreams: charge capture automation, coding quality improvement, and HMO relationship restructuring")

When presenting to Nigerian hospital boards and management teams, the Pyramid Principle is especially important because meeting time is often limited, decision-makers have competing priorities, and the hierarchical culture expects consultants to lead with clear, confident recommendations rather than lengthy analysis.

Every C4A slide should have an action title (a complete sentence stating the key message), not a topic title. "Revenue cycle has three critical gaps" not "Revenue Cycle Overview".`,
      assetType: 'GUIDE' as KnowledgeAssetType,
      tags: ['communication', 'pyramid-principle', 'presentations', 'consulting-fundamentals'],
      isReusable: true,
    },
    {
      title: 'WHO Health System Building Blocks Framework',
      content: `The World Health Organization's Health System Building Blocks framework provides a universal structure for analyzing and strengthening health systems. It identifies six core components that every health system requires to function effectively.

The six building blocks are:

1. Service Delivery: The provision of effective, safe, quality health services to those who need them, when and where needed, with minimum waste of resources. In African contexts, this includes both formal facility-based care and community health worker programmes.

2. Health Workforce: Sufficient numbers of skilled, motivated, and equitably distributed health workers. Sub-Saharan Africa faces acute shortages, with an estimated deficit of 4.2 million health workers. Brain drain to the diaspora compounds this challenge.

3. Health Information Systems: The production, analysis, dissemination, and use of timely and reliable health information. Many African hospitals still operate on paper-based systems. DHIS2 has emerged as the dominant platform for health information in over 40 African countries.

4. Access to Essential Medicines: Equitable access to quality, safe, efficacious medicines and technologies. Supply chain challenges, counterfeit medicines, and import dependency are persistent issues.

5. Health Financing: Adequate funding for health, ensuring people can use needed services without financial hardship. Mechanisms include tax-based funding, social health insurance (like Nigeria's NHIS), community-based insurance, and out-of-pocket payments.

6. Leadership and Governance: Strategic policy frameworks, effective oversight, coalition-building, regulation, attention to system design, and accountability. Governance weakness is consistently identified as the root cause of health system underperformance in Africa.

C4A uses this framework as the starting diagnostic for health systems advisory engagements, mapping each building block to specific assessment criteria and benchmarks relevant to the country context.`,
      assetType: 'GUIDE' as KnowledgeAssetType,
      tags: ['who', 'health-systems', 'framework', 'building-blocks', 'public-health'],
      isReusable: true,
    },
    {
      title: 'DDDS Framework Guide',
      content: `The DDDS (Diagnose, Design, Deliver, Sustain) framework is C4A's proprietary engagement methodology that structures every consulting engagement into four distinct phases. It ensures rigorous diagnosis before solutioning, structured implementation, and built-in sustainability.

Phase 1 - DIAGNOSE (Weeks 1-4): Rapid but thorough assessment of the current state. This includes stakeholder interviews (minimum 15-20 across clinical, operational, financial, and governance functions), data collection and analysis, process observation, benchmarking against African healthcare standards, and identification of quick wins. The output is a Diagnostic Report and Transformation Roadmap.

Phase 2 - DESIGN (Weeks 3-8): Solution design based on diagnostic findings. This involves workstream definition, intervention design, resource planning, timeline development, and risk mitigation planning. C4A always designs with implementation in mind, meaning every recommendation includes the "how" not just the "what". The output is a Detailed Implementation Plan with clear milestones and gate reviews.

Phase 3 - DELIVER (Weeks 5-20): Hands-on implementation alongside the client team. C4A consultants work embedded within the hospital, not from an external office. This phase includes weekly progress reviews, data-driven course correction, capability building, and regular client communication. Each workstream has defined deliverables with quality gates.

Phase 4 - SUSTAIN (Weeks 18-24): Knowledge transfer and sustainability planning. This includes documentation of new processes, training of internal champions, establishment of performance dashboards, governance structure recommendations, and a 90-day post-engagement monitoring plan.

The phases deliberately overlap to ensure continuity. Design begins during late diagnosis. Delivery starts for quick wins before full design is complete. Sustainability planning begins during mid-delivery.`,
      assetType: 'FRAMEWORK' as KnowledgeAssetType,
      tags: ['ddds', 'methodology', 'cfa-proprietary', 'engagement-lifecycle'],
      isReusable: true,
    },
    {
      title: 'NHIS Tariff and Claims Guide',
      content: `Nigeria's National Health Insurance Scheme (NHIS), now restructured under the National Health Insurance Authority (NHIA) Act 2022, is the primary social health insurance mechanism in the country. Understanding NHIS tariffs and claims processes is essential for any hospital revenue cycle engagement.

Key Tariff Structure: NHIS uses a fee-for-service model with capitation for primary care. Tariffs are organized by service category: outpatient consultations, laboratory investigations, radiology, surgical procedures, and inpatient care. Tariffs are periodically revised but often lag behind actual costs of service delivery.

Claims Process: (1) Patient presents NHIS card at registration. (2) Hospital verifies enrollment status with the HMO. (3) Services are rendered and documented. (4) Hospital codes services according to NHIS tariff schedule. (5) Claims are submitted to the patient's HMO (monthly batches). (6) HMO processes claims against capitation or fee-for-service. (7) Payment is made to hospital (typically 60-90 days).

Common Revenue Leakage Points: Under-coding of services actually rendered; failure to capture all billable items (especially consumables and drugs); expired patient enrollments not caught at registration; claims submitted without proper documentation; denial of claims for technical errors that could be corrected.

C4A's Revenue Cycle Excellence programme typically identifies 20-35% revenue uplift potential in NHIS claims alone, primarily through improved charge capture, coding accuracy, and denial management.`,
      assetType: 'GUIDE' as KnowledgeAssetType,
      tags: ['nhis', 'claims', 'revenue-cycle', 'billing', 'nigeria', 'health-insurance'],
      isReusable: true,
    },

    // ─── TOOLS & TEMPLATES ───────────────────────────────────────────────────

    {
      title: 'Issue Tree Builder',
      content: `Interactive tool for building MECE issue trees. Start with a core question, decompose into mutually exclusive branches, and continue breaking down until you reach testable hypotheses.

When to use: First two weeks of any engagement, during problem structuring sessions, when presenting diagnostic findings to clients.

Key sections: Core question (the overarching problem), Level 1 branches (3-5 MECE categories), Level 2 sub-issues, Level 3 hypotheses (testable, actionable items).

Available as an interactive tool at /tools/issue-tree on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['issue-tree', 'problem-solving', 'diagnostic', 'interactive'],
      isReusable: true,
    },
    {
      title: 'Hypothesis Tracker',
      content: `Template for tracking hypotheses throughout a consulting engagement. Links each hypothesis to supporting evidence, data sources, and conclusions.

Columns: Hypothesis ID, Statement, Category (Revenue/Cost/Clinical/Operational), Priority (High/Medium/Low), Evidence For, Evidence Against, Data Source, Status (Open/Confirmed/Rejected), Action Required.

When to use: Throughout the Diagnose phase, updated weekly during team meetings. Ensures rigorous evidence-based conclusions rather than assumptions.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['hypothesis', 'diagnostic', 'evidence-based', 'tracking'],
      isReusable: true,
    },
    {
      title: 'Fishbone Diagram Template',
      content: `Ishikawa cause-and-effect diagram adapted for healthcare settings. Uses six standard categories: People, Process, Equipment, Environment, Materials, Management.

When to use: Root cause analysis of operational problems, clinical incident investigation, quality improvement projects.

Available as an interactive tool at /tools/fishbone on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['fishbone', 'ishikawa', 'root-cause', 'quality-improvement', 'interactive'],
      isReusable: true,
    },
    {
      title: 'RACI Matrix Builder',
      content: `Responsible-Accountable-Consulted-Informed matrix for defining roles across engagement workstreams. Ensures every task has exactly one Accountable person and at least one Responsible person.

When to use: At engagement kickoff, when defining workstream ownership, during TMO (Transformation Management Office) setup.

Available as an interactive tool at /tools/raci-builder on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['raci', 'project-management', 'roles', 'accountability', 'interactive'],
      isReusable: true,
    },
    {
      title: 'SCR Template',
      content: `Situation-Complication-Resolution template for structuring all client-facing communications following the Pyramid Principle.

Sections: Situation (2-3 sentences on current state), Complication (what changed or what is wrong), Resolution (your recommendation with supporting points).

When to use: Every client email, every slide deck, every status update. The SCR structure ensures you lead with the answer and provide context efficiently.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['scr', 'communication', 'pyramid-principle', 'client-facing'],
      isReusable: true,
    },
    {
      title: 'Hospital P&L Template',
      content: `Standardized hospital profit and loss template adapted for Nigerian hospital accounting. Includes revenue breakdown by payer type (NHIS, HMO, Private Pay, Government), departmental cost allocation, and margin analysis.

Key sections: Revenue (by department and payer), Direct Costs (clinical supplies, drugs, consumables), Personnel Costs (clinical and non-clinical staff), Overhead (facilities, utilities, administration), EBITDA, Capital Expenditure, Net Income.

When to use: Financial diagnostic phase of turnaround and operations engagements. Benchmark against C4A's African hospital financial database.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['financial', 'p-and-l', 'hospital', 'accounting', 'nigeria'],
      isReusable: true,
    },
    {
      title: '13-Week Cash Flow Model',
      content: `Rolling 13-week cash flow projection template for hospitals in financial distress. Tracks weekly cash inflows and outflows with variance analysis.

Key sections: Opening Balance, Inflows (Collections by payer, other income), Outflows (Payroll, Suppliers, Utilities, Debt Service, Capital), Closing Balance, Minimum Cash Threshold, Variance vs Forecast.

When to use: First deliverable in any hospital turnaround engagement. Updated weekly during the stabilization phase. Critical for identifying cash crunch points and prioritizing collection efforts.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['cash-flow', 'turnaround', 'financial', 'weekly-tracking'],
      isReusable: true,
    },
    {
      title: 'Distress Scorecard',
      content: `C4A's proprietary hospital financial distress assessment tool. Scores hospitals on 12 indicators across four dimensions: Liquidity, Profitability, Operational Efficiency, and Governance.

Scoring: Each indicator scored 1-5 (1=Critical, 5=Healthy). Overall score determines distress level: Critical (<24), Severe (24-36), Moderate (36-48), Stable (>48).

When to use: During the first week of any turnaround engagement, or as a screening tool for prospective clients. Results guide the prioritization of the turnaround programme.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['distress', 'assessment', 'turnaround', 'financial', 'scoring'],
      isReusable: true,
    },
    {
      title: 'Balanced Scorecard Template (Hospital)',
      content: `Hospital-adapted Balanced Scorecard template with four perspectives: Financial, Patient/Customer, Internal Processes, and Learning & Growth. Includes strategy map visualization.

Key sections per perspective: Strategic Objectives (3-4 per perspective), Key Performance Indicators, Targets, Initiatives, Owner.

When to use: Strategic planning engagements, performance management system design, hospital transformation programme design.

Available as an interactive tool at /tools/bsc-builder on the C4APlatform.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['balanced-scorecard', 'strategy', 'kpi', 'performance-management'],
      isReusable: true,
    },
    {
      title: 'FMEA Worksheet',
      content: `Failure Mode and Effects Analysis worksheet for healthcare risk assessment. Identifies potential failure modes in clinical and operational processes, assesses severity, occurrence, and detectability, and calculates Risk Priority Numbers (RPN).

Columns: Process Step, Potential Failure Mode, Potential Effect, Severity (1-10), Potential Cause, Occurrence (1-10), Current Controls, Detection (1-10), RPN (S x O x D), Recommended Actions, Responsible Person, Target Date.

When to use: Clinical governance engagements, process redesign, pre-accreditation risk assessment, new service line launch.

Available as an interactive tool at /tools/fmea-worksheet on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['fmea', 'risk-assessment', 'clinical-governance', 'quality'],
      isReusable: true,
    },
    {
      title: 'Denial Dashboard Template',
      content: `Claims denial tracking and analysis dashboard template. Categorizes denials by type, payer, department, and root cause to drive targeted improvement.

Key metrics: Total Denials (count and value), Denial Rate (% of claims), Top Denial Reasons, Denial by Payer, Denial by Department, Appeal Success Rate, Average Days to Resolution, Revenue Recovered.

When to use: Revenue cycle excellence engagements, ongoing revenue integrity monitoring, HMO relationship management.

Available as an interactive tool at /tools/denial-dashboard on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['denial', 'revenue-cycle', 'claims', 'dashboard', 'billing'],
      isReusable: true,
    },
    {
      title: 'Stakeholder Mapping Grid',
      content: `2x2 stakeholder mapping matrix plotting stakeholders by Influence (High/Low) and Interest (High/Low). Determines engagement strategy for each quadrant.

Quadrants: High Influence + High Interest = Manage Closely (key decision-makers). High Influence + Low Interest = Keep Satisfied (board members, regulators). Low Influence + High Interest = Keep Informed (staff champions, patient advocates). Low Influence + Low Interest = Monitor (general staff).

When to use: First week of every engagement. Update monthly. Critical for navigating the complex stakeholder landscape in African hospitals where informal power structures often differ from formal organizational charts.

Available as an interactive tool at /tools/stakeholder-map on the C4APlatform.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['stakeholder', 'engagement', 'mapping', 'change-management'],
      isReusable: true,
    },
    {
      title: 'Logframe Template (C4A)',
      content: `Logical Framework (Logframe) template adapted for C4A's healthcare consulting engagements and development-funded programmes. Follows USAID/Global Fund standards.

Structure: Goal (long-term impact), Purpose (engagement outcome), Outputs (deliverables), Activities (tasks). Each level includes: Narrative Summary, Objectively Verifiable Indicators (OVIs), Means of Verification (MOVs), Assumptions.

When to use: M&E-driven engagements, development partner funded projects, government health system strengthening programmes.

Available as an interactive tool at /tools/logframe on the C4APlatform.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['logframe', 'mne', 'monitoring-evaluation', 'development', 'global-fund'],
      isReusable: true,
    },
    {
      title: 'Value Stream Mapping Canvas',
      content: `Lean healthcare value stream mapping template for visualizing patient flow and identifying waste. Maps current state and designs future state processes.

Key elements: Process steps, Wait times, Value-added vs Non-value-added time, Information flow, Material flow, Cycle time, Lead time, Process time, Takt time.

DOWNTIME waste categories for healthcare: Defects (medical errors), Overproduction (unnecessary tests), Waiting (patient wait times), Non-utilized talent (nurses doing clerical work), Transportation (unnecessary patient transfers), Inventory (expired supplies), Motion (walking to distant supplies), Extra-processing (redundant documentation).

When to use: Lean healthcare engagements, process improvement projects, patient flow optimization.`,
      assetType: 'TOOL' as KnowledgeAssetType,
      tags: ['lean', 'value-stream', 'process-improvement', 'patient-flow'],
      isReusable: true,
    },
    {
      title: 'Engagement Architecture Template',
      content: `Master template for structuring a C4A consulting engagement. Defines the overall engagement structure including governance, team composition, workstreams, milestones, and reporting cadence.

Key sections: Engagement Overview (client, scope, duration, budget), Team Structure (roles, responsibilities, reporting lines), Workstream Definition (objectives, deliverables, timelines), Governance (steering committee, gate reviews, escalation), Communication Plan (cadence, stakeholders, formats), Risk Register, Quality Assurance Plan.

When to use: During the proposal/scoping phase and refined during the first week of engagement. This is the "constitution" of every C4A engagement.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['engagement', 'project-management', 'governance', 'planning'],
      isReusable: true,
    },
    {
      title: 'Proposal Template',
      content: `C4A's standard consulting proposal template. Follows the Pyramid Principle structure with executive summary first, then detailed methodology, team, timeline, and commercial terms.

Sections: Cover Page, Executive Summary (1 page max), Understanding of the Challenge, Proposed Approach (DDDS methodology), Workstreams and Deliverables, Team and Qualifications, Timeline and Milestones, Commercial Proposal (fees, payment schedule, expenses), Terms and Conditions, Appendices (CVs, case studies).

When to use: Every client proposal. Nuru AI can generate an 80% complete draft from discovery call notes.`,
      assetType: 'TEMPLATE' as KnowledgeAssetType,
      tags: ['proposal', 'business-development', 'client-facing', 'commercial'],
      isReusable: true,
    },
  ]

  let created = 0
  for (const asset of assets) {
    await prisma.knowledgeAsset.upsert({
      where: {
        id: `kb-academy-${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`,
      },
      create: {
        id: `kb-academy-${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`,
        title: asset.title,
        content: asset.content,
        assetType: asset.assetType,
        tags: asset.tags,
        isReusable: asset.isReusable,
        authorId,
      },
      update: {
        content: asset.content,
        assetType: asset.assetType,
        tags: asset.tags,
      },
    })
    created++
    process.stdout.write(`\r  Created ${created}/${assets.length} knowledge assets`)
  }

  console.log(`\n\nDone! Seeded ${created} knowledge assets from academy references.\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
