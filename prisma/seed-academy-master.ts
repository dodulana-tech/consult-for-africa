/**
 * CFA TRAINING ACADEMY - MASTER LEVEL SEED (Tracks 13-15)
 * Seeds Master-level training tracks, modules, and assessment questions
 *
 * 3 Tracks:
 *   Track 13: Strategic Advisory & Growth
 *   Track 14: Public Sector & Health Systems
 *   Track 15: CFA Master Consultant
 *
 * This file only CREATES new data. It does NOT delete existing records.
 *
 * Run: npx tsx prisma/seed-academy-master.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CFA Training Academy - Master Level Tracks (13-15)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 13: MASTER - Strategic Advisory & Growth
  // ════════════════════════════════════════════════════════════════════════════

  const strategicAdvisory = await prisma.trainingTrack.create({
    data: {
      name: 'Strategic Advisory & Growth',
      slug: 'strategic-advisory-growth',
      description: `Elevate your practice from operational consulting to strategic advisory. This track equips
        senior consultants with the frameworks for hospital-level strategy, competitive positioning,
        and commercial growth planning. Covers Balanced Scorecard design for healthcare institutions,
        competitive strategy using Porter and Blue Ocean models, and commercial performance management
        with OKRs tailored to African hospital and clinic networks.`,
      level: 'MASTER',
      category: 'methodology',
      iconName: 'target',
      colorHex: '#1B4332',
      prerequisites: ['core-consulting-skills', 'hospital-turnaround-recovery'],
      estimatedHours: 30,
      sortOrder: 13,
    },
  })

  // Module 13.1: Balanced Scorecard for Hospitals
  const m13_1 = await prisma.trainingModule.create({
    data: {
      trackId: strategicAdvisory.id,
      name: 'Balanced Scorecard for Hospitals',
      slug: 'balanced-scorecard-hospitals',
      description: 'Design and deploy Balanced Scorecards that translate hospital strategy into measurable objectives across financial, patient, process, and learning perspectives.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Why Hospitals Need Balanced Scorecards',
            type: 'text',
            body: `Most African hospitals manage by gut feel and monthly P&L. Revenue is up or down, beds are full or empty, and leadership reacts accordingly. This is management by rearview mirror. The Balanced Scorecard (BSC), originally developed by Kaplan and Norton, gives hospital leaders a forward-looking instrument panel that connects daily operations to long-term strategy.

              For a 300-bed referral hospital in Nairobi or a 50-bed mission hospital in rural Ghana, the BSC provides the same disciplined approach: translate your strategy into objectives you can measure, track, and act on. Without it, strategy remains a document on a shelf. With it, every department head knows exactly how their work connects to the institution's mission.`
          },
          {
            title: 'The Four Perspectives in Healthcare',
            type: 'text',
            body: `The BSC organizes objectives into four perspectives, each answering a critical question:

              Financial Perspective: "How do we ensure financial sustainability?" For African hospitals, this goes beyond profit. It includes cost recovery ratios, revenue diversification, NHIS reimbursement efficiency, and cash reserves for equipment replacement. A teaching hospital in Accra might target reducing cost-per-inpatient-day by 15% while maintaining quality.

              Patient Perspective: "How do patients and communities experience our care?" This includes patient satisfaction scores, wait times, readmission rates, net promoter score, and community health outcomes. A hospital in Kigali tracked "time from arrival to first clinical contact" and reduced it from 90 minutes to 25 minutes by redesigning triage.

              Internal Process Perspective: "What must we excel at operationally?" Theatre utilization, bed turnover, formulary compliance, clinical protocol adherence, claims processing turnaround. These are the operational levers that drive both financial results and patient satisfaction.

              Learning & Growth Perspective: "How do we build capacity for the future?" Staff retention, training completion rates, research output, digital adoption, succession planning. This perspective is critical in Africa where talent retention is a strategic challenge.`
          },
          {
            title: 'Building Strategy Maps and KPIs',
            type: 'text',
            body: `A strategy map is a one-page visual that shows cause-and-effect relationships across the four perspectives. For example: "If we invest in nurse training (Learning), then clinical protocol adherence improves (Process), which reduces readmissions (Patient), which lowers cost-per-case and improves reputation for referrals (Financial)."

              When designing KPIs for African hospitals, keep three rules in mind. First, measure what you can actually collect. A rural hospital without an EMR cannot track digital metrics, so use manual proxies. Second, set benchmarks relevant to the context. Comparing a district hospital in Malawi to the Mayo Clinic is demoralizing and useless. Use regional peers and prior-year performance. Third, limit to 15-20 KPIs total. More than that and leadership attention fragments. Each KPI needs an owner, a target, a data source, and a review cadence.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Build a Hospital Strategy Map',
            instruction: 'A 200-bed private hospital in Lagos wants to become the top referral destination for cardiology in West Africa within 5 years. Build a strategy map with 3-4 objectives per perspective and draw the cause-and-effect linkages between them.',
          },
          {
            title: 'Practice: KPI Selection and Target-Setting',
            instruction: 'For the same Lagos cardiology hospital, select 2 KPIs per BSC perspective (8 total). For each, specify the current baseline (estimate), the 12-month target, the data source, and the review frequency.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Balanced Scorecard for Healthcare Organizations', url: 'internal://knowledge/bsc-healthcare' },
          { title: 'Strategy Map Templates', url: 'internal://knowledge/strategy-map-templates' },
        ],
        tools: ['BSC Template (Hospital)', 'Strategy Map Builder', 'KPI Dictionary - Healthcare']
      },
    },
  })

  // Questions for Module 13.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m13_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which Balanced Scorecard perspective answers the question "What must we excel at operationally?"',
        options: JSON.stringify([
          { id: 'a', text: 'Financial Perspective', isCorrect: false },
          { id: 'b', text: 'Patient Perspective', isCorrect: false },
          { id: 'c', text: 'Internal Process Perspective', isCorrect: true },
          { id: 'd', text: 'Learning & Growth Perspective', isCorrect: false },
        ]),
        explanation: 'The Internal Process Perspective focuses on the operational capabilities the hospital must excel at, such as theatre utilization, bed turnover, clinical protocol adherence, and claims processing turnaround.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m13_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A strategy map is best described as:',
        options: JSON.stringify([
          { id: 'a', text: 'A geographic map showing hospital catchment areas', isCorrect: false },
          { id: 'b', text: 'A one-page visual showing cause-and-effect relationships across BSC perspectives', isCorrect: true },
          { id: 'c', text: 'A detailed project plan for strategy implementation', isCorrect: false },
          { id: 'd', text: 'A financial model forecasting revenue growth', isCorrect: false },
        ]),
        explanation: 'A strategy map visually connects objectives across the four BSC perspectives, showing how investments in learning and growth drive process improvements, which drive patient outcomes, which drive financial sustainability.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m13_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'When designing KPIs for an African district hospital without an EMR, what is the recommended approach?',
        options: JSON.stringify([
          { id: 'a', text: 'Skip digital metrics entirely and focus only on financial KPIs', isCorrect: false },
          { id: 'b', text: 'Use manual proxies that can be reliably collected given the hospital\'s data infrastructure', isCorrect: true },
          { id: 'c', text: 'Require the hospital to implement an EMR before starting BSC work', isCorrect: false },
          { id: 'd', text: 'Copy KPIs from a tertiary hospital in the capital city', isCorrect: false },
        ]),
        explanation: 'The key principle is to measure what you can actually collect. Manual proxies (e.g., paper tally sheets for wait times, discharge registers for length of stay) can provide reliable data even without digital systems. Benchmarks should be context-appropriate.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m13_1.id,
        type: 'CASE_STUDY',
        question: 'A 120-bed mission hospital in rural Tanzania wants to improve maternal and neonatal outcomes while achieving financial sustainability. The hospital currently runs at a 12% operating loss. Design a Balanced Scorecard with 3 objectives per perspective, showing how they connect in a strategy map.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'St. Mary\'s Mission Hospital, rural Tanzania. 120 beds, serving a catchment of 200,000 people. Maternal mortality rate 3x national average. Operating at -12% margin. Staff turnover of 40% annually for nurses and midwives.',
          data: {
            bedOccupancy: '65%',
            maternalMortality: '450 per 100,000 (national avg: 150)',
            staffTurnover: '40% annually for clinical staff',
            avgLengthOfStay: '5.8 days',
            NHISReimbursementRate: '45% of billed charges',
            outpatientVolume: '120 patients/day',
          },
        }),
        explanation: 'A strong answer would link Learning (midwife training, retention incentives, EmONC skills) to Process (obstetric protocol adherence, theatre readiness, referral pathways) to Patient (reduced maternal mortality, improved birth outcomes, community trust) to Financial (higher volume from reputation, NHIS billing accuracy, donor funding for maternal programs). Each objective should have a measurable KPI.',
        points: 5,
        order: 4,
      },
      {
        moduleId: m13_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are recommended practices when implementing a Balanced Scorecard in an African hospital? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Limit to 15-20 KPIs total across all perspectives', isCorrect: true },
          { id: 'b', text: 'Use international benchmarks from US or European hospitals as targets', isCorrect: false },
          { id: 'c', text: 'Assign each KPI an owner, target, data source, and review cadence', isCorrect: true },
          { id: 'd', text: 'Set benchmarks using regional peers and prior-year performance', isCorrect: true },
          { id: 'e', text: 'Include at least 10 KPIs per perspective for comprehensiveness', isCorrect: false },
        ]),
        explanation: 'Effective BSC implementation requires focused KPIs (15-20 total, not per perspective), context-appropriate benchmarks (regional peers, not US hospitals), and clear ownership for each metric. More than 20 KPIs fragments leadership attention.',
        points: 3,
        order: 5,
      },
    ],
  })

  // Module 13.2: Competitive Strategy
  const m13_2 = await prisma.trainingModule.create({
    data: {
      trackId: strategicAdvisory.id,
      name: 'Competitive Strategy',
      slug: 'competitive-strategy-healthcare',
      description: 'Apply Porter\'s Five Forces and Blue Ocean Strategy to position hospitals and health networks for sustainable competitive advantage in African markets.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Porter\'s Five Forces in African Healthcare',
            type: 'text',
            body: `Michael Porter's Five Forces framework is as relevant to a hospital group in Johannesburg as it is to a tech company in Silicon Valley. The forces are: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, and rivalry among existing competitors.

              In African healthcare, each force has unique dynamics. New entrants are increasingly well-funded Indian and Middle Eastern hospital chains expanding into East and West Africa. Supplier power is high because pharmaceutical and equipment markets are concentrated, with few local manufacturers. Buyer power is growing as HMOs consolidate and negotiate harder on tariffs. Substitutes include medical tourism (patients flying to India or Turkey) and the rise of telemedicine. Rivalry is intensifying in urban markets like Lagos, Nairobi, and Accra where multiple private hospitals compete for the same insured population.`
          },
          {
            title: 'Blue Ocean Strategy and the ERRC Grid',
            type: 'text',
            body: `Blue Ocean Strategy asks: instead of competing in a crowded "red ocean," can you create uncontested market space? The ERRC Grid is the core tool. It stands for Eliminate, Reduce, Raise, Create.

              Consider a hospital group in Kenya looking at the gap between expensive private hospitals and overwhelmed public facilities. Using the ERRC Grid: Eliminate luxury amenities that add cost but not clinical value. Reduce specialist staffing by using task-shifting protocols. Raise clinical quality through standardized care pathways and outcomes measurement. Create a new category of "affordable quality" hospitals at 40% of private-hospital pricing with comparable clinical outcomes.

              This is not theoretical. Hospital chains like Narayana Health in India proved this model, and several African operators are adapting it. The key insight is that value innovation, delivering more clinical value at lower cost, beats incremental competition on existing terms.`
          },
          {
            title: 'Service-Line Strategy',
            type: 'text',
            body: `Not every service line deserves equal investment. Service-line strategy applies portfolio thinking to hospital departments. Map each service line on two axes: strategic importance (community need, competitive differentiation, mission alignment) and financial performance (contribution margin, growth trajectory, payer mix).

              This creates four quadrants. Stars (high strategic value, strong financial performance) should receive aggressive investment. Cash cows (moderate strategy value, strong margins) fund growth elsewhere. Question marks (high strategic value, weak finances) need turnaround plans or partnership models. Dogs (low strategy value, poor finances) should be rationalized or closed.

              A CFA engagement in Kampala mapped 12 service lines for a 250-bed hospital. Oncology was a question mark with high demand but poor economics. The recommendation was a PPP model with a regional cancer centre rather than building a standalone unit. Orthopaedics was a star with strong margins and growing demand from the emerging middle class. The result was a focused investment plan rather than spreading capital thinly across all departments.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Five Forces Analysis',
            instruction: 'Conduct a Five Forces analysis for the private hospital sector in your country (or a country you know well). Rate each force as low, medium, or high intensity and explain why. Identify the one force that most threatens profitability.',
          },
          {
            title: 'Practice: ERRC Grid',
            instruction: 'A hospital group wants to launch a chain of affordable day-surgery centres in secondary cities across Nigeria. Use the ERRC Grid to design their value proposition. What do they eliminate, reduce, raise, and create compared to traditional private hospitals?',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Porter\'s Five Forces Applied to Healthcare', url: 'internal://knowledge/porter-healthcare' },
          { title: 'Blue Ocean Strategy: ERRC Grid Guide', url: 'internal://knowledge/errc-grid-guide' },
        ],
        tools: ['Five Forces Worksheet', 'ERRC Grid Template', 'Service-Line Portfolio Matrix']
      },
    },
  })

  // Questions for Module 13.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m13_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the African private hospital market, which of Porter\'s Five Forces is most intensified by the expansion of Indian and Middle Eastern hospital chains?',
        options: JSON.stringify([
          { id: 'a', text: 'Bargaining power of suppliers', isCorrect: false },
          { id: 'b', text: 'Threat of new entrants', isCorrect: true },
          { id: 'c', text: 'Threat of substitutes', isCorrect: false },
          { id: 'd', text: 'Bargaining power of buyers', isCorrect: false },
        ]),
        explanation: 'International hospital chains entering African markets represent new entrants with significant capital, brand recognition, and operational expertise. This intensifies the threat of new entrants force, putting pressure on existing local operators.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m13_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does the "E" in the ERRC Grid stand for?',
        options: JSON.stringify([
          { id: 'a', text: 'Enhance', isCorrect: false },
          { id: 'b', text: 'Eliminate', isCorrect: true },
          { id: 'c', text: 'Evaluate', isCorrect: false },
          { id: 'd', text: 'Establish', isCorrect: false },
        ]),
        explanation: 'ERRC stands for Eliminate, Reduce, Raise, Create. "Eliminate" asks which factors the industry takes for granted that should be eliminated entirely, removing costs and complexity that do not add clinical value.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m13_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In service-line portfolio analysis, a department with high strategic importance but weak financial performance is classified as a:',
        options: JSON.stringify([
          { id: 'a', text: 'Star', isCorrect: false },
          { id: 'b', text: 'Cash cow', isCorrect: false },
          { id: 'c', text: 'Question mark', isCorrect: true },
          { id: 'd', text: 'Dog', isCorrect: false },
        ]),
        explanation: 'Question marks have high strategic value (community need, differentiation potential) but weak financial performance. They require a turnaround plan, partnership model, or creative funding approach rather than simply more investment or outright closure.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m13_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following best describes "value innovation" in Blue Ocean Strategy?',
        options: JSON.stringify([
          { id: 'a', text: 'Offering premium services at premium prices to wealthy patients', isCorrect: false },
          { id: 'b', text: 'Delivering more clinical value at lower cost by breaking the value-cost trade-off', isCorrect: true },
          { id: 'c', text: 'Copying competitors but at slightly lower prices', isCorrect: false },
          { id: 'd', text: 'Adding innovative technology to justify higher fees', isCorrect: false },
        ]),
        explanation: 'Value innovation is the cornerstone of Blue Ocean Strategy. Instead of competing on existing terms (better or cheaper), it breaks the value-cost trade-off by simultaneously increasing value to patients and reducing costs through strategic choices about what to eliminate, reduce, raise, and create.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m13_2.id,
        type: 'CASE_STUDY',
        question: 'A private hospital group operating 5 hospitals in West Africa is losing insured patients to a new Indian-owned hospital chain that offers lower prices and modern facilities. Advise the group on competitive strategy using both Porter\'s Five Forces and the ERRC Grid.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'HealthBridge Group, 5 hospitals across Ghana and Nigeria (total 800 beds). Founded 15 years ago, strong local brand. An Indian hospital chain has opened 2 facilities in Accra and Lagos with 30% lower pricing, newer equipment, and international accreditation.',
          data: {
            marketShare: 'Declining from 22% to 16% over 18 months',
            priceComparison: 'HealthBridge avg 30% higher than new entrant',
            patientSatisfaction: 'HealthBridge 72% vs new entrant 85%',
            staffTurnover: 'HealthBridge losing specialists to new entrant (20% turnover)',
            strengths: 'Strong community relationships, 15-year reputation, NHIS contracts, local clinical training partnerships',
          },
        }),
        explanation: 'A strong answer uses Five Forces to diagnose the competitive dynamics (high threat from new entrants, growing buyer power as patients have choices) and then applies the ERRC Grid to reposition: Eliminate bureaucratic admission processes and unnecessary amenities. Reduce cost structure through operational efficiency and task-shifting. Raise community engagement, local language care, NHIS navigation support, and continuity of care. Create integrated primary-to-tertiary care pathways and chronic disease management programs that the new entrant cannot easily replicate.',
        points: 5,
        order: 5,
      },
    ],
  })

  // Module 13.3: Commercial Performance & Growth
  const m13_3 = await prisma.trainingModule.create({
    data: {
      trackId: strategicAdvisory.id,
      name: 'Commercial Performance & Growth',
      slug: 'commercial-performance-growth',
      description: 'Drive hospital revenue growth through referral network optimization, revenue diversification, and OKR-driven performance management.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Building and Managing Referral Networks',
            type: 'text',
            body: `In African healthcare markets, referral networks are the primary growth engine for hospitals. Unlike developed markets where insurance directories and online reviews drive patient choice, most African patients reach hospitals through referrals from primary care providers, pharmacies, community health workers, and other specialists.

              Mapping your referral network is the first step. Identify the top 20 referral sources by volume and value. Track referral conversion rates (what percentage of referred patients actually arrive?) and leakage rates (what percentage of patients you refer out could be treated in-house?). A 250-bed hospital in Dar es Salaam discovered that 35% of their surgical volume came from just 8 referring GPs, yet they had no formal relationship management program for these physicians. Building one with regular clinical updates, priority scheduling, and feedback loops increased referral volume by 45% in 12 months.`
          },
          {
            title: 'Revenue Diversification Strategies',
            type: 'text',
            body: `Dependence on a single revenue stream is a strategic risk. Many African hospitals rely heavily on fee-for-service inpatient care, leaving them vulnerable to occupancy fluctuations, payer delays, and competitive pressure. Revenue diversification creates resilience.

              Key diversification levers include: outpatient expansion (day surgery, diagnostic centres, specialist clinics), wellness and preventive services (executive health checks, corporate wellness contracts), ancillary services (pharmacy, laboratory, imaging operated as profit centres), training and education (nursing school, CME programmes, simulation centre rental), and managed care contracts (capitation agreements with employers and HMOs). A hospital network in Kenya added corporate wellness programs targeting multinational employers in Nairobi. Within two years, these contracts contributed 18% of total revenue and served as a feeder pipeline for inpatient admissions.`
          },
          {
            title: 'OKRs for Healthcare Organizations',
            type: 'text',
            body: `Objectives and Key Results (OKRs) translate strategy into quarterly execution. Unlike KPIs, which measure ongoing performance, OKRs focus on ambitious goals with measurable outcomes over a defined period. They work well in healthcare because they force prioritization.

              Structure: Each team sets 3-5 Objectives per quarter, each with 2-4 Key Results. Objectives are qualitative and inspiring. Key Results are quantitative and verifiable. Scoring uses a 0-1 scale where 0.7 is considered strong performance (OKRs should be stretch goals).

              Example for a hospital commercial team: Objective: "Become the preferred referral destination for maternal care in our region." Key Results: (1) Increase referral volume from top 15 GPs by 30%, (2) Launch 3 community outreach clinics in underserved areas, (3) Achieve 90% patient satisfaction score for maternity services, (4) Reduce average time from referral to first appointment to under 48 hours. OKRs should cascade from the hospital CEO level down to department heads, creating alignment between strategic vision and operational execution.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Referral Network Analysis',
            instruction: 'Design a referral network mapping exercise for a 150-bed hospital. Identify the data you would collect, the analysis you would perform, and 3 specific interventions to increase referral volume by 25%.',
          },
          {
            title: 'Practice: Quarterly OKRs',
            instruction: 'Write OKRs for Q1 for the commercial director of a hospital group that wants to grow revenue by 20% this year. Include 3 Objectives with 3 Key Results each.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Referral Network Optimization Playbook', url: 'internal://knowledge/referral-networks' },
          { title: 'OKR Framework for Healthcare', url: 'internal://knowledge/okr-healthcare' },
        ],
        tools: ['Referral Network Map Template', 'Revenue Diversification Matrix', 'OKR Planning Sheet']
      },
    },
  })

  // Questions for Module 13.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m13_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the first step in building a hospital referral network strategy?',
        options: JSON.stringify([
          { id: 'a', text: 'Hiring a marketing team to promote the hospital', isCorrect: false },
          { id: 'b', text: 'Mapping existing referral sources by volume and value', isCorrect: true },
          { id: 'c', text: 'Offering discounts to referring physicians', isCorrect: false },
          { id: 'd', text: 'Building a new outpatient clinic', isCorrect: false },
        ]),
        explanation: 'Before any intervention, you must understand the current state. Mapping the top referral sources by volume and value reveals concentration risk, leakage patterns, and high-potential relationships that deserve investment.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m13_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the OKR framework, what score is considered strong performance on a Key Result?',
        options: JSON.stringify([
          { id: 'a', text: '1.0 (100% achievement)', isCorrect: false },
          { id: 'b', text: '0.7 (70% achievement)', isCorrect: true },
          { id: 'c', text: '0.5 (50% achievement)', isCorrect: false },
          { id: 'd', text: '0.9 (90% achievement)', isCorrect: false },
        ]),
        explanation: 'OKRs are designed as stretch goals. A score of 0.7 (70%) is considered strong performance because objectives should be ambitious enough that full achievement is rare. Consistently scoring 1.0 means your goals are not ambitious enough.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m13_3.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are valid revenue diversification strategies for an African hospital? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Corporate wellness contracts with multinational employers', isCorrect: true },
          { id: 'b', text: 'Operating the pharmacy and lab as profit centres', isCorrect: true },
          { id: 'c', text: 'Reducing all service prices by 50% to increase volume', isCorrect: false },
          { id: 'd', text: 'Launching a nursing school or CME programme', isCorrect: true },
          { id: 'e', text: 'Capitation agreements with employers and HMOs', isCorrect: true },
        ]),
        explanation: 'Revenue diversification means adding new revenue streams, not discounting existing ones. Corporate wellness, ancillary profit centres, education programmes, and managed care contracts all create additional income sources that reduce dependence on inpatient fee-for-service.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m13_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A hospital discovered that 35% of its surgical volume comes from just 8 referring GPs. What does this indicate?',
        options: JSON.stringify([
          { id: 'a', text: 'The hospital has a healthy and diversified referral network', isCorrect: false },
          { id: 'b', text: 'High referral concentration risk that requires both retention and diversification', isCorrect: true },
          { id: 'c', text: 'The hospital should stop accepting referrals from other sources', isCorrect: false },
          { id: 'd', text: 'The 8 GPs should be offered ownership stakes in the hospital', isCorrect: false },
        ]),
        explanation: 'High concentration in a few referral sources is a strategic risk. If even one or two of those GPs retire, move, or start referring elsewhere, the hospital loses significant volume. The strategy is dual: retain and deepen relationships with the top 8, while actively building new referral sources to diversify.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m13_3.id,
        type: 'CASE_STUDY',
        question: 'A 200-bed hospital in Lusaka, Zambia derives 80% of revenue from inpatient admissions, with 60% of those paid by a single HMO. The HMO has announced a 15% tariff reduction. Develop a 12-month commercial growth plan including referral network, revenue diversification, and OKR-based execution.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Lusaka Central Hospital, 200 beds. 80% inpatient revenue, 60% from MedAssure HMO which is cutting tariffs by 15%. Outpatient services underutilized (40% capacity). No corporate wellness program. Lab and pharmacy outsourced. 3 specialist clinics with available afternoon slots.',
          data: {
            currentRevenue: 'ZMW 48M annually',
            projectedLoss: 'ZMW 5.8M from tariff cut',
            outpatientUtilization: '40%',
            referralSources: '22 active referring providers',
            catchmentPopulation: '1.2M within 30km radius',
            corporateEmployers: '45 companies with 500+ employees within catchment',
          },
        }),
        explanation: 'A strong plan addresses three horizons: (1) Immediate (0-3 months): negotiate with MedAssure, add 2-3 alternative HMOs, improve billing accuracy to recover leaked revenue. (2) Medium-term (3-9 months): bring lab and pharmacy in-house as profit centres, launch corporate wellness targeting the 45 large employers, expand outpatient utilization through evening and weekend clinics. (3) Strategic (6-12 months): build referral network with 15 new providers, launch day-surgery programme, explore capitation contracts. OKRs should be set quarterly with clear targets for revenue diversification, referral growth, and payer mix improvement.',
        points: 5,
        order: 5,
      },
    ],
  })

  console.log('  Track 13: Strategic Advisory & Growth - 3 modules, 15 questions')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 14: MASTER - Public Sector & Health Systems
  // ════════════════════════════════════════════════════════════════════════════

  const publicSector = await prisma.trainingTrack.create({
    data: {
      name: 'Public Sector & Health Systems',
      slug: 'public-sector-health-systems',
      description: `Navigate the complexities of government health systems, public-private partnerships, and
        national health financing. This track prepares consultants for engagements with Ministries of Health,
        development partners, and multilateral organizations. Covers WHO building blocks, PPP frameworks,
        primary healthcare strengthening, and provider payment mechanisms including capitation, DRGs, and
        pay-for-performance.`,
      level: 'MASTER',
      category: 'public_health',
      iconName: 'landmark',
      colorHex: '#2D3A8C',
      prerequisites: ['healthcare-fundamentals', 'health-economics-me'],
      estimatedHours: 30,
      sortOrder: 14,
    },
  })

  // Module 14.1: Health System Design
  const m14_1 = await prisma.trainingModule.create({
    data: {
      trackId: publicSector.id,
      name: 'Health System Design',
      slug: 'health-system-design',
      description: 'Understand how national health systems are designed and governed using the WHO building blocks framework, with deep focus on governance, financing, and African health system archetypes.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The WHO Six Building Blocks',
            type: 'text',
            body: `The World Health Organization defines six building blocks of a health system: service delivery, health workforce, health information systems, access to essential medicines, health financing, and leadership/governance. Understanding these building blocks in depth is essential for any consultant advising governments or development partners.

              In most African countries, these building blocks are at varying levels of maturity. Nigeria might have a relatively developed pharmaceutical supply chain but weak health information systems. Rwanda excels in governance and community health worker deployment but faces health workforce shortages at specialist level. A CFA consultant must diagnose which building blocks are weakest, how they interact (a strong financing system cannot function without reliable health information), and where targeted investment will have the greatest systemic impact.`
          },
          {
            title: 'Governance and Stewardship',
            type: 'text',
            body: `Governance is the most critical and most neglected building block. It encompasses policy formulation, regulation, accountability, and system oversight. In decentralized health systems (common across Africa since the 1990s reforms), governance challenges multiply as responsibilities split between national ministries, regional health authorities, and district health management teams.

              Key governance issues in African health systems include: regulatory gaps that allow unregistered facilities to operate, weak accountability mechanisms that cannot track how funds are spent, fragmented authority where multiple agencies regulate different aspects of healthcare with poor coordination, and political interference in technical appointments. A CFA engagement with the Ministry of Health in a West African country found that 23% of registered health facilities had never been inspected, and facility licensing had not been updated in 14 years. The governance reform program included a new regulatory framework, digital facility registry, risk-based inspection protocol, and performance-based accountability contracts for district health managers.`
          },
          {
            title: 'Health Financing Architecture',
            type: 'text',
            body: `How a country finances healthcare determines who gets care, what quality they receive, and whether the system is sustainable. The three core functions of health financing are revenue collection (where does money come from?), pooling (how is financial risk shared?), and purchasing (how are providers paid?).

              African countries use different financing architectures. Tax-funded systems (e.g., Tanzania, South Africa public sector) collect revenue through general taxation and allocate budgets to public facilities. Social health insurance models (e.g., Ghana NHIS, Kenya NHIF) collect earmarked contributions from formal-sector workers and sometimes informal-sector voluntary members. Community-based health insurance (common in francophone West Africa) pools risk at the local level. Out-of-pocket payment remains dominant in many countries, accounting for over 40% of total health expenditure in 27 African nations.

              The trend across Africa is toward Universal Health Coverage (UHC), which requires expanding risk pooling, reducing out-of-pocket spending, and improving purchasing efficiency. CFA consultants advising on UHC transitions must understand the political economy, the fiscal space, and the institutional capacity required to move from fragmented financing to universal coverage.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Building Blocks Diagnostic',
            instruction: 'Select an African country and rate each of the six WHO building blocks on a 1-5 maturity scale. Justify each rating with evidence. Identify the two most critical building blocks that, if strengthened, would have the greatest systemic impact.',
          },
          {
            title: 'Practice: Financing Architecture Analysis',
            instruction: 'Compare the health financing architecture of Ghana (NHIS) and Rwanda (Mutuelles de Sante). For each, describe the revenue collection, pooling, and purchasing mechanisms. Which model is more sustainable and why?',
          }
        ]
      },
      resources: {
        links: [
          { title: 'WHO Health Systems Framework', url: 'internal://knowledge/who-building-blocks' },
          { title: 'Health Financing in Africa: A Comparative Review', url: 'internal://knowledge/health-financing-africa' },
        ],
        tools: ['Building Blocks Diagnostic Tool', 'Health Financing Architecture Template', 'Governance Maturity Assessment']
      },
    },
  })

  // Questions for Module 14.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m14_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is NOT one of the WHO six building blocks of a health system?',
        options: JSON.stringify([
          { id: 'a', text: 'Health workforce', isCorrect: false },
          { id: 'b', text: 'Health information systems', isCorrect: false },
          { id: 'c', text: 'Private sector engagement', isCorrect: true },
          { id: 'd', text: 'Leadership and governance', isCorrect: false },
        ]),
        explanation: 'The six WHO building blocks are: service delivery, health workforce, health information systems, access to essential medicines, health financing, and leadership/governance. Private sector engagement is important but is not one of the six building blocks.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m14_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are the three core functions of health financing?',
        options: JSON.stringify([
          { id: 'a', text: 'Budgeting, spending, and auditing', isCorrect: false },
          { id: 'b', text: 'Revenue collection, pooling, and purchasing', isCorrect: true },
          { id: 'c', text: 'Taxation, insurance, and out-of-pocket payment', isCorrect: false },
          { id: 'd', text: 'Planning, allocation, and disbursement', isCorrect: false },
        ]),
        explanation: 'The three core functions are: revenue collection (where money comes from), pooling (how financial risk is shared across populations), and purchasing (how providers are paid). These functions determine equity, efficiency, and sustainability of health financing.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m14_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In how many African nations does out-of-pocket payment account for over 40% of total health expenditure?',
        options: JSON.stringify([
          { id: 'a', text: '10', isCorrect: false },
          { id: 'b', text: '18', isCorrect: false },
          { id: 'c', text: '27', isCorrect: true },
          { id: 'd', text: '42', isCorrect: false },
        ]),
        explanation: 'Out-of-pocket payment exceeds 40% of total health expenditure in 27 African nations, highlighting the urgency of expanding risk pooling mechanisms and moving toward Universal Health Coverage.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m14_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are governance challenges commonly found in decentralized African health systems? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Regulatory gaps allowing unregistered facilities to operate', isCorrect: true },
          { id: 'b', text: 'Fragmented authority across multiple regulatory agencies', isCorrect: true },
          { id: 'c', text: 'Excessive investment in health information technology', isCorrect: false },
          { id: 'd', text: 'Political interference in technical appointments', isCorrect: true },
          { id: 'e', text: 'Weak accountability mechanisms for fund tracking', isCorrect: true },
        ]),
        explanation: 'Decentralized health systems in Africa commonly face regulatory gaps, fragmented authority, political interference, and weak accountability. Excessive IT investment is rarely a governance problem in African health systems, which more often suffer from underinvestment in health information systems.',
        points: 3,
        order: 4,
      },
      {
        moduleId: m14_1.id,
        type: 'CASE_STUDY',
        question: 'A newly appointed Minister of Health in an East African country wants to achieve Universal Health Coverage within 10 years. Currently, 52% of health spending is out-of-pocket, the country has a small formal sector (20% of the workforce), and district health management teams have limited capacity. Using the WHO building blocks, outline a phased UHC roadmap.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'East African country, population 35 million. GDP per capita $1,200. 52% out-of-pocket health expenditure. 20% formal-sector workforce. 48 district health management teams with varying capacity. Strong community health worker program. Functional but basic HMIS. 60% of health facilities are public, 25% faith-based, 15% private for-profit.',
          data: {
            healthExpPerCapita: '$42 (WHO recommends $86 minimum)',
            formalSectorEmployment: '20%',
            healthFacilities: '3,200 (60% public, 25% faith-based, 15% private)',
            communityHealthWorkers: '12,000 active CHWs',
            doctorDensity: '0.1 per 1,000 (WHO minimum: 2.3)',
            immunizationCoverage: '78%',
          },
        }),
        explanation: 'A strong UHC roadmap would be phased: Phase 1 (Years 1-3): Strengthen governance and health information as foundational building blocks. Create a legal framework for UHC, establish a national health insurance authority, register all facilities and providers, and build district capacity for fund management. Phase 2 (Years 4-7): Expand financing through mandatory formal-sector contributions and innovative informal-sector enrollment (mobile money premiums, agricultural cooperative enrollment). Phase 3 (Years 7-10): Progressively expand the benefit package, integrate private and faith-based providers, and strengthen purchasing through strategic contracting. Throughout all phases, invest in workforce and service delivery to ensure supply-side readiness matches expanded coverage.',
        points: 5,
        order: 5,
      },
    ],
  })

  // Module 14.2: PPP & Government Advisory
  const m14_2 = await prisma.trainingModule.create({
    data: {
      trackId: publicSector.id,
      name: 'PPP & Government Advisory',
      slug: 'ppp-government-advisory',
      description: 'Master public-private partnership frameworks for healthcare, policy-to-implementation translation, and multi-stakeholder management in government engagements.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'PPP Frameworks in African Healthcare',
            type: 'text',
            body: `Public-private partnerships in healthcare range from simple service contracts to full concession models. Understanding the spectrum is critical for advising governments on which model fits their context. The main models are: management contracts (private operator manages a public facility, government retains ownership), lease agreements (private operator leases a public facility and bears operating risk), build-operate-transfer (private sector builds, operates for a concession period, then transfers to government), and joint ventures (shared ownership and risk between public and private entities).

              In Africa, PPPs have had mixed results. Lesotho's Queen Mamohato Memorial Hospital PPP delivered a modern facility but at costs that strained the national health budget. Kenya's managed equipment service (MES) program deployed diagnostic equipment to county hospitals but faced utilization challenges because facilities lacked trained staff to operate the machines. Conversely, Uganda's PPP with private pharmacies for essential medicine distribution improved drug availability in rural areas significantly. The lesson: PPP success depends not on the model chosen but on the quality of contract design, performance monitoring, and alignment of incentives.`
          },
          {
            title: 'Policy-to-Implementation Translation',
            type: 'text',
            body: `African health ministries often produce excellent policies that never get implemented. The gap between policy and implementation is where CFA consultants add the most value. Translation requires four capabilities: operational planning (turning policy goals into costed, sequenced activities), institutional design (creating or strengthening the bodies responsible for execution), change management (building buy-in across political, bureaucratic, and clinical stakeholders), and monitoring frameworks (tracking implementation fidelity, not just outcomes).

              A common pattern: a government adopts a new primary healthcare policy with ambitious targets. The policy document is 80 pages long and technically sound. But there is no implementation plan, no budget line, no designated implementation unit, and no accountability mechanism. CFA's role is to bridge this gap. We translate the 80-page policy into a 24-month implementation plan with quarterly milestones, assigned responsibilities, budget requirements, and a monitoring dashboard that the Minister can review monthly. This is unglamorous work, but it is where impact happens.`
          },
          {
            title: 'Stakeholder Management in Government Engagements',
            type: 'text',
            body: `Government advisory engagements involve navigating complex stakeholder landscapes with competing interests, political sensitivities, and institutional inertia. Effective stakeholder management starts with mapping: identify all stakeholders by their influence (ability to affect the project) and interest (how much they care about the outcome).

              High-influence, high-interest stakeholders (Ministers, Permanent Secretaries, key development partners) require regular engagement, co-creation of solutions, and careful management of expectations. High-influence, low-interest stakeholders (Treasury, other ministries) need targeted communication that frames health investments in their terms (economic productivity, fiscal sustainability). Low-influence, high-interest stakeholders (health workers, patient advocacy groups) need channels for input and visible evidence that their concerns are heard.

              Critical rules for government advisory: never surprise a Minister publicly, always provide multiple options rather than single recommendations, document everything in writing, build relationships with permanent technical staff (politicians rotate but technocrats remain), and respect the pace of government decision-making while maintaining pressure on timelines. A CFA consultant who pushes too hard will be sidelined. One who is too passive will accomplish nothing. The skill is calibrated persistence.`
          }
        ],
        exercises: [
          {
            title: 'Practice: PPP Model Selection',
            instruction: 'A government wants to improve diagnostic services at 20 district hospitals. They are considering three PPP models: management contract, build-operate-transfer, and joint venture. Evaluate each model against the following criteria: government fiscal capacity, speed of implementation, quality assurance, and long-term sustainability. Recommend one model with justification.',
          },
          {
            title: 'Practice: Stakeholder Mapping',
            instruction: 'You are advising the Ministry of Health on a new national health insurance scheme. Map at least 10 stakeholders on an influence-interest grid and describe your engagement strategy for each quadrant.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Healthcare PPP Frameworks: A Practitioner Guide', url: 'internal://knowledge/ppp-frameworks' },
          { title: 'Policy-to-Implementation Toolkit', url: 'internal://knowledge/policy-implementation' },
        ],
        tools: ['PPP Model Comparison Matrix', 'Stakeholder Mapping Grid', 'Implementation Plan Template']
      },
    },
  })

  // Questions for Module 14.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m14_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which PPP model involves the private sector building a facility, operating it for a concession period, then transferring ownership to the government?',
        options: JSON.stringify([
          { id: 'a', text: 'Management contract', isCorrect: false },
          { id: 'b', text: 'Lease agreement', isCorrect: false },
          { id: 'c', text: 'Build-operate-transfer (BOT)', isCorrect: true },
          { id: 'd', text: 'Joint venture', isCorrect: false },
        ]),
        explanation: 'In a build-operate-transfer model, the private sector finances and builds the facility, operates it for a defined concession period (typically 15-30 years) to recoup investment and earn returns, then transfers ownership to the government.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m14_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the module, the primary reason African health policies fail to get implemented is:',
        options: JSON.stringify([
          { id: 'a', text: 'The policies themselves are technically flawed', isCorrect: false },
          { id: 'b', text: 'Lack of operational plans, designated implementation units, budget lines, and accountability mechanisms', isCorrect: true },
          { id: 'c', text: 'Opposition from healthcare workers', isCorrect: false },
          { id: 'd', text: 'Insufficient international donor funding', isCorrect: false },
        ]),
        explanation: 'Many African health policies are technically excellent but lack the operational infrastructure for execution: no implementation plan, no budget allocation, no designated unit to drive execution, and no accountability mechanism. CFA bridges this policy-to-implementation gap.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m14_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In stakeholder management for government engagements, a high-influence, low-interest stakeholder (such as the Treasury) should be managed by:',
        options: JSON.stringify([
          { id: 'a', text: 'Ignoring them since they have low interest', isCorrect: false },
          { id: 'b', text: 'Targeted communication framing health investments in their terms (economic productivity, fiscal sustainability)', isCorrect: true },
          { id: 'c', text: 'Inviting them to every technical meeting', isCorrect: false },
          { id: 'd', text: 'Escalating issues to the Minister to override them', isCorrect: false },
        ]),
        explanation: 'High-influence, low-interest stakeholders like Treasury can block or enable your project but do not naturally engage with health sector issues. The strategy is targeted communication that translates health outcomes into language they care about: fiscal impact, economic productivity, return on investment.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m14_2.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are critical rules for government advisory engagements? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Never surprise a Minister publicly', isCorrect: true },
          { id: 'b', text: 'Always provide multiple options rather than single recommendations', isCorrect: true },
          { id: 'c', text: 'Move fast and push hard to overcome government inertia', isCorrect: false },
          { id: 'd', text: 'Build relationships with permanent technical staff', isCorrect: true },
          { id: 'e', text: 'Document everything in writing', isCorrect: true },
        ]),
        explanation: 'Effective government advisory requires political sensitivity (no public surprises), decision flexibility (multiple options), institutional memory (build relationships with permanent technocrats who outlast political appointments), and documentation. Pushing too hard leads to being sidelined; the correct approach is calibrated persistence.',
        points: 3,
        order: 4,
      },
      {
        moduleId: m14_2.id,
        type: 'CASE_STUDY',
        question: 'A state government in Nigeria wants to partner with the private sector to revitalize 10 general hospitals that are in severe disrepair. Average bed occupancy is 30% despite high community demand, suggesting that patients are bypassing public facilities for private alternatives. Recommend a PPP approach and outline the first 12 months of implementation.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: '10 state-owned general hospitals (50-120 beds each), built in the 1980s and largely unmaintained. Current bed occupancy 30% despite the state having limited private sector alternatives for most residents. State health budget is constrained. Development partner (World Bank) has expressed interest in supporting health system strengthening.',
          data: {
            totalBeds: '780 across 10 hospitals',
            avgOccupancy: '30%',
            staffVacancyRate: '45% (especially doctors and pharmacists)',
            equipmentFunctional: '25% of major equipment is operational',
            stateHealthBudget: 'N8.5B annually (60% goes to salaries)',
            patientSatisfaction: '28%',
            avgRevenuePerHospital: 'N15M/year (potential estimated at N120M with full operation)',
          },
        }),
        explanation: 'A strong answer would recommend a phased management contract PPP (lower risk than BOT given fiscal constraints) starting with 2-3 pilot hospitals. Month 1-3: Conduct detailed facility assessment, draft PPP framework with legal team, engage World Bank for technical assistance grant. Month 4-6: Competitive procurement for private management partners, establish performance metrics (occupancy, patient satisfaction, revenue generation, clinical quality indicators). Month 7-9: Contract signing, management transition, staff reorientation. Month 10-12: Capital investment plan execution, equipment rehabilitation, service quality improvements, monthly performance monitoring. Critical success factors: ring-fenced hospital revenue (not returned to state treasury), performance-based payments, independent monitoring, and clear escalation mechanisms.',
        points: 5,
        order: 5,
      },
    ],
  })

  // Module 14.3: PHC Strengthening & Provider Payment
  const m14_3 = await prisma.trainingModule.create({
    data: {
      trackId: publicSector.id,
      name: 'PHC Strengthening & Provider Payment',
      slug: 'phc-strengthening-provider-payment',
      description: 'Design primary healthcare strengthening programs and implement provider payment mechanisms including capitation, DRGs, and pay-for-performance in African health systems.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Primary Healthcare as the Foundation',
            type: 'text',
            body: `The 1978 Alma-Ata Declaration established primary healthcare as the foundation of health systems, and the 2018 Astana Declaration renewed this commitment. In Africa, where the disease burden is shifting from communicable to non-communicable diseases while infectious diseases persist, strong PHC is more critical than ever. PHC should be the first point of contact, providing promotive, preventive, curative, rehabilitative, and palliative care close to where people live.

              Yet PHC remains chronically underfunded across Africa. In most countries, over 60% of health budgets flow to tertiary hospitals that serve a fraction of the population. Strengthening PHC requires rebalancing this allocation, building the workforce (community health workers, nurses, clinical officers), ensuring essential medicine supply, and creating functional referral pathways to higher levels of care. Rwanda's community health worker program and Ethiopia's Health Extension Program demonstrate that well-designed PHC models can dramatically improve health outcomes even in low-resource settings. CFA's PHC strengthening engagements focus on system design, not just facility upgrades.`
          },
          {
            title: 'Capitation and DRG-Based Payment',
            type: 'text',
            body: `How providers are paid shapes how they behave. Fee-for-service (FFS) incentivizes volume: more procedures, more tests, more admissions. Capitation pays providers a fixed amount per enrolled person per period, regardless of services used. This incentivizes efficiency and prevention but risks under-provision if not properly monitored. Diagnosis-Related Groups (DRGs) pay a fixed amount per hospital admission based on the diagnosis, adjusting for severity. DRGs incentivize shorter stays and cost efficiency but can incentivize premature discharge or upcoding.

              In African health systems, capitation is increasingly used for primary healthcare. Ghana's NHIS uses capitation for PHC in some regions, paying facilities a fixed amount per enrollee. Kenya's NHIF has piloted capitation for outpatient services. The challenge is setting the capitation rate correctly: too low and facilities cannot cover costs, too high and the insurance fund is unsustainable. DRGs are more complex and require robust clinical coding systems, which most African hospitals lack. South Africa has developed an African DRG classification system, and several countries are piloting simplified DRG models for common conditions.

              CFA consultants advising on provider payment reform must understand the technical mechanics, the behavioral incentives, and the institutional prerequisites. Moving from FFS to capitation requires provider education, information systems for enrollment tracking, risk adjustment for different population profiles, and quality monitoring to prevent under-provision.`
          },
          {
            title: 'Pay-for-Performance (P4P) Mechanisms',
            type: 'text',
            body: `Pay-for-performance, also called results-based financing (RBF) or performance-based financing (PBF), links a portion of provider payment to achieving predefined quality and output indicators. P4P has been widely piloted across Africa with support from the World Bank, Global Fund, and bilateral donors.

              Rwanda was an early pioneer, introducing PBF in 2005 and scaling it nationally by 2008. Facilities receive bonus payments for meeting targets on indicators like institutional delivery rates, childhood immunization coverage, family planning uptake, and quality of care scores. Evidence from Rwanda and other countries shows that well-designed P4P can improve service utilization and quality, particularly for maternal and child health services.

              However, P4P is not a silver bullet. Common pitfalls include: gaming (providers manipulate data to meet targets without genuine improvement), neglect of non-incentivized services (focus shifts to measured indicators at the expense of other care), high verification costs (independent verification of reported data is expensive), and sustainability concerns (many P4P schemes are donor-funded, raising questions about what happens when external funding ends). Effective P4P design requires careful indicator selection, independent verification, integration with existing payment systems rather than parallel structures, and a plan for domestic financing to replace donor funds over time.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Capitation Rate Setting',
            instruction: 'A national health insurance scheme wants to introduce capitation for primary healthcare. The target benefit package includes outpatient consultations, basic diagnostics, essential medicines, and maternal care. Design a methodology for calculating the capitation rate, including the data you would need, adjustments for rural vs urban settings, and safeguards against under-provision.',
          },
          {
            title: 'Practice: P4P Indicator Design',
            instruction: 'Design a pay-for-performance scheme for 50 primary healthcare facilities. Select 8-10 indicators across maternal health, child health, infectious disease, and facility management. For each indicator, specify the target, data source, verification method, and bonus payment weight.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'Provider Payment Mechanisms: A Primer', url: 'internal://knowledge/provider-payment' },
          { title: 'Results-Based Financing in African Health Systems', url: 'internal://knowledge/rbf-africa' },
        ],
        tools: ['Capitation Rate Calculator', 'P4P Indicator Framework Template', 'DRG Readiness Assessment']
      },
    },
  })

  // Questions for Module 14.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m14_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Under capitation payment, a primary healthcare facility receives:',
        options: JSON.stringify([
          { id: 'a', text: 'Payment for each service provided to a patient', isCorrect: false },
          { id: 'b', text: 'A fixed amount per enrolled person per period, regardless of services used', isCorrect: true },
          { id: 'c', text: 'A fixed amount per hospital admission based on diagnosis', isCorrect: false },
          { id: 'd', text: 'Bonus payments for meeting quality targets', isCorrect: false },
        ]),
        explanation: 'Capitation pays a fixed amount per enrolled person per time period (usually monthly or quarterly), regardless of whether that person uses services or not. This incentivizes efficiency and prevention rather than volume.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m14_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which African country was an early pioneer of national-scale performance-based financing, introducing PBF in 2005 and scaling nationally by 2008?',
        options: JSON.stringify([
          { id: 'a', text: 'Ghana', isCorrect: false },
          { id: 'b', text: 'Kenya', isCorrect: false },
          { id: 'c', text: 'Rwanda', isCorrect: true },
          { id: 'd', text: 'Nigeria', isCorrect: false },
        ]),
        explanation: 'Rwanda introduced performance-based financing in 2005 and scaled it nationally by 2008. Facilities receive bonus payments for meeting targets on maternal and child health indicators, immunization coverage, and quality of care scores.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m14_3.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are common pitfalls of pay-for-performance schemes in African health systems? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Gaming and data manipulation by providers', isCorrect: true },
          { id: 'b', text: 'Neglect of non-incentivized services', isCorrect: true },
          { id: 'c', text: 'Excessive government funding making schemes unsustainable', isCorrect: false },
          { id: 'd', text: 'High cost of independent verification', isCorrect: true },
          { id: 'e', text: 'Sustainability concerns when donor funding ends', isCorrect: true },
        ]),
        explanation: 'Common P4P pitfalls include gaming (data manipulation), neglect of non-measured services, expensive verification processes, and sustainability concerns because many schemes rely on donor funding. The issue is typically insufficient domestic funding, not excessive government spending.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m14_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the primary behavioral incentive created by Diagnosis-Related Group (DRG) based payment?',
        options: JSON.stringify([
          { id: 'a', text: 'Incentivizes providers to perform more procedures per admission', isCorrect: false },
          { id: 'b', text: 'Incentivizes shorter hospital stays and cost efficiency per case', isCorrect: true },
          { id: 'c', text: 'Incentivizes providers to prevent disease in their catchment population', isCorrect: false },
          { id: 'd', text: 'Incentivizes providers to refer patients to higher-level facilities', isCorrect: false },
        ]),
        explanation: 'DRGs pay a fixed amount per admission based on the diagnosis. Since the hospital receives the same payment regardless of how long the patient stays or how many resources are used, the incentive is to treat efficiently and discharge appropriately. The risk is premature discharge or upcoding to more expensive DRG categories.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m14_3.id,
        type: 'CASE_STUDY',
        question: 'A Ministry of Health wants to transition 200 primary healthcare facilities from fee-for-service to capitation-based payment under the national health insurance scheme. Design the transition plan, including capitation rate methodology, implementation phases, and safeguards.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'West African country with 200 PHC facilities serving 2.5 million enrolled members. Currently on fee-for-service, which has led to over-prescription of medicines and unnecessary lab tests, inflating costs. The NHIS is running a deficit and sees capitation as a cost-containment strategy. Providers are skeptical and fear revenue loss.',
          data: {
            enrolledPopulation: '2.5 million across 200 facilities',
            avgFFSCostPerCapita: '$18/year',
            targetCapitationRate: 'To be determined',
            commonConditions: 'Malaria (35%), URTI (20%), hypertension (12%), diabetes (8%), antenatal care (10%)',
            providerConcerns: 'Revenue loss, inability to cover drug costs, unfair risk distribution',
            dataInfrastructure: 'Paper-based registers, no electronic enrollment tracking',
          },
        }),
        explanation: 'A strong transition plan would include: (1) Capitation rate methodology based on historical utilization data, adjusted for case mix, geography (rural premium), and inflation. Start at or slightly above current FFS cost per capita to ease provider concerns. (2) Phase 1 (months 1-6): Build enrollment database, train providers, pilot in 20 facilities. Phase 2 (months 7-12): Expand to 80 facilities with lessons learned. Phase 3 (months 13-18): Full scale-up. (3) Safeguards: minimum quality standards with regular inspection, complaint hotline for patients, quarterly capitation rate review, ring-fenced drug budget within the capitation, and outlier payment mechanism for unusually expensive cases. (4) Risk mitigation: risk-adjusted capitation (higher rates for older populations), provider education on preventive care economics, and independent monitoring of service quality to prevent under-provision.',
        points: 5,
        order: 5,
      },
    ],
  })

  console.log('  Track 14: Public Sector & Health Systems - 3 modules, 15 questions')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 15: MASTER - CFA Master Consultant
  // ════════════════════════════════════════════════════════════════════════════

  const masterConsultant = await prisma.trainingTrack.create({
    data: {
      name: 'CFA Master Consultant',
      slug: 'cfa-master-consultant',
      description: `The capstone track for CFA's most experienced consultants. Master the art of leading complex,
        multi-workstream engagements, delivering CFA's proprietary transformation programmes, and
        building the firm through business development and thought leadership. Completion of this track,
        combined with demonstrated engagement performance, qualifies for the CFA Master Consultant
        certification, the firm's highest professional credential.`,
      level: 'MASTER',
      category: 'methodology',
      iconName: 'crown',
      colorHex: '#7C2D12',
      prerequisites: ['hospital-turnaround-recovery', 'clinical-governance-accreditation', 'strategic-advisory-growth'],
      estimatedHours: 40,
      sortOrder: 15,
    },
  })

  // Module 15.1: Complex Engagement Leadership
  const m15_1 = await prisma.trainingModule.create({
    data: {
      trackId: masterConsultant.id,
      name: 'Complex Engagement Leadership',
      slug: 'complex-engagement-leadership',
      description: 'Lead multi-workstream consulting engagements with multiple team members, manage client escalations, and deliver integrated recommendations across interdependent work packages.',
      order: 1,
      estimatedMinutes: 150,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Multi-Workstream Engagement Architecture',
            type: 'text',
            body: `CFA's largest engagements involve 3-6 simultaneous workstreams, each led by a specialist consultant, with a Master Consultant overseeing the integrated programme. A typical hospital transformation might include workstreams for clinical operations, financial restructuring, workforce development, governance reform, and digital systems. Each workstream has its own deliverables, timelines, and stakeholders, but they are deeply interdependent.

              The Master Consultant's role is architectural. You design the engagement structure, define workstream scopes and interfaces, establish integration points (weekly synthesis meetings, shared data rooms, cross-workstream dependencies), and ensure that individual workstream recommendations form a coherent whole. A clinical governance workstream might recommend new mortality review processes, while the workforce workstream is proposing a restructured nursing hierarchy. These must align. The Master Consultant spots conflicts, resolves them, and presents unified recommendations to the client steering committee.`
          },
          {
            title: 'Team Leadership and Development',
            type: 'text',
            body: `Leading a consulting team in African healthcare is uniquely demanding. Your team may include junior consultants on their first engagement, subject matter experts with deep clinical knowledge but limited consulting experience, and local counterparts assigned by the client. Cultural dynamics vary significantly between a government hospital in Francophone West Africa and a private facility in East Africa.

              Effective team leadership at this level requires three disciplines. First, structured delegation: define clear deliverables, quality standards, and deadlines for each team member, with check-ins frequent enough to catch issues early but not so frequent that you become a bottleneck. Second, active development: every engagement is a teaching opportunity. Debrief analytical approaches, review slide decks in detail, and provide direct feedback. Third, team protection: shield the team from political dynamics, absorb client frustration, and ensure sustainable working patterns. Burnout is a real risk on 6-month transformation engagements, and losing a team member mid-engagement can derail the entire programme.`
          },
          {
            title: 'Client Escalation and Difficult Conversations',
            type: 'text',
            body: `At the Master Consultant level, you handle the conversations nobody else wants to have. The hospital CEO whose leadership style is the root cause of staff turnover. The board chair who is blocking governance reform because it threatens his patronage network. The Ministry official who promised outcomes that are technically impossible within the budget.

              The framework for difficult conversations is: prepare, frame, listen, propose. Prepare by gathering irrefutable data and testing your message with a trusted advisor. Frame the conversation around shared objectives and facts, not blame. Listen actively to understand the other party's constraints and concerns. Propose a path forward that addresses both the technical requirement and the political reality.

              Escalation management follows a tiered approach. Level 1: resolve within the workstream through data-driven discussion. Level 2: escalate to the engagement steering committee with a clear problem statement and proposed options. Level 3: engage CFA senior leadership for firm-to-firm conversations. The key principle: never escalate a problem without a proposed solution. Clients and senior leaders want options, not just issues. Document all escalations in writing, including the agreed resolution and next steps.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Engagement Architecture',
            instruction: 'You are designing a 9-month hospital transformation engagement for a 400-bed public hospital. The scope includes clinical operations, financial performance, governance, workforce, and digital systems. Design the engagement architecture: workstream scopes, team composition, integration mechanisms, key milestones, and steering committee structure.',
          },
          {
            title: 'Practice: Escalation Simulation',
            instruction: 'The CEO of your client hospital has been consistently blocking implementation of clinical governance reforms that your team has recommended and the board has approved. Staff report that the CEO feels threatened by increased clinical oversight. Draft your approach for a one-on-one conversation with the CEO, including your preparation, framing, and proposed path forward.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'CFA Engagement Management Framework', url: 'internal://knowledge/engagement-management' },
          { title: 'Difficult Conversations in Consulting', url: 'internal://knowledge/difficult-conversations' },
        ],
        tools: ['Engagement Architecture Template', 'RACI Matrix Builder', 'Escalation Log Template']
      },
    },
  })

  // Questions for Module 15.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m15_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the primary role of the Master Consultant in a multi-workstream engagement?',
        options: JSON.stringify([
          { id: 'a', text: 'Performing the most complex analysis in each workstream', isCorrect: false },
          { id: 'b', text: 'Designing the engagement architecture and ensuring workstream recommendations form a coherent whole', isCorrect: true },
          { id: 'c', text: 'Managing the project budget and administrative tasks', isCorrect: false },
          { id: 'd', text: 'Presenting all findings to the client without team involvement', isCorrect: false },
        ]),
        explanation: 'The Master Consultant\'s role is architectural: designing the engagement structure, defining workstream interfaces, establishing integration points, spotting conflicts between workstream recommendations, and ensuring unified delivery to the client.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m15_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to the escalation framework, what is the key principle when escalating issues?',
        options: JSON.stringify([
          { id: 'a', text: 'Escalate immediately to CFA senior leadership for fastest resolution', isCorrect: false },
          { id: 'b', text: 'Never escalate a problem without a proposed solution', isCorrect: true },
          { id: 'c', text: 'Let the client resolve their own issues internally', isCorrect: false },
          { id: 'd', text: 'Avoid escalation at all costs to maintain client relationships', isCorrect: false },
        ]),
        explanation: 'The key principle is to never escalate without a proposed solution. Clients and senior leaders want options, not just problems. Every escalation should include a clear problem statement, context, and at least two proposed resolution paths.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m15_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are the three disciplines of effective team leadership on complex engagements? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Structured delegation with clear deliverables and check-ins', isCorrect: true },
          { id: 'b', text: 'Active development through debriefs and direct feedback', isCorrect: true },
          { id: 'c', text: 'Maximizing billable hours by assigning maximum workload', isCorrect: false },
          { id: 'd', text: 'Team protection from political dynamics and burnout prevention', isCorrect: true },
          { id: 'e', text: 'Maintaining strict hierarchy so team members do not engage with clients', isCorrect: false },
        ]),
        explanation: 'The three disciplines are structured delegation (clear expectations with appropriate oversight), active development (coaching and feedback on every engagement), and team protection (shielding from politics and ensuring sustainable work patterns). Overloading teams or isolating them from clients are counterproductive.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m15_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the framework for difficult conversations, what is the correct sequence?',
        options: JSON.stringify([
          { id: 'a', text: 'Frame, propose, listen, prepare', isCorrect: false },
          { id: 'b', text: 'Listen, frame, prepare, propose', isCorrect: false },
          { id: 'c', text: 'Prepare, frame, listen, propose', isCorrect: true },
          { id: 'd', text: 'Propose, prepare, frame, listen', isCorrect: false },
        ]),
        explanation: 'The sequence is: Prepare (gather data, test your message), Frame (set the conversation around shared objectives), Listen (understand constraints and concerns), Propose (offer a path forward that addresses technical and political realities).',
        points: 1,
        order: 4,
      },
      {
        moduleId: m15_1.id,
        type: 'CASE_STUDY',
        question: 'You are leading a 6-month hospital transformation with 4 workstreams and a team of 8 consultants. At Month 3, you discover that the clinical operations workstream is recommending closure of the outpatient pharmacy (to outsource it), while the financial workstream has identified the pharmacy as the highest-margin service line. Meanwhile, two team members are showing signs of burnout, and the hospital CEO has complained that consultants are "always in meetings and never on the wards." How do you address all three issues?',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: '400-bed hospital transformation. Month 3 of 6. 4 workstreams: clinical operations, finance, workforce, governance. Team of 8 consultants. Budget: on track. Deliverables: workstream recommendations due at Month 4.5.',
          data: {
            conflictingRecommendations: 'Clinical ops wants to outsource pharmacy; Finance identifies pharmacy as top margin contributor (22% gross margin)',
            teamIssues: '2 consultants working 14-hour days, weekend work for 6 consecutive weeks, one has requested a week off',
            clientFeedback: 'CEO frustrated that consultants spend too much time in internal meetings, wants more visible presence on wards and in departments',
            upcomingMilestone: 'Integrated recommendation presentation to Board in 6 weeks',
          },
        }),
        explanation: 'A strong answer addresses all three issues: (1) Recommendation conflict: convene a joint working session between clinical and financial workstream leads. The answer is likely nuanced, perhaps restructure the pharmacy operating model rather than outsource entirely. Present the Board with an integrated recommendation that optimizes both clinical flow and financial performance. (2) Team wellbeing: immediately restructure workloads, enforce a mandatory day off, and consider requesting a temporary additional resource from CFA. Losing a team member at Month 3 would be worse than a slight schedule slip. (3) CEO concern: restructure the weekly rhythm so consultants spend mornings on wards/departments and afternoons on analysis and meetings. Create a visible "office hours" presence where hospital staff can engage directly. Communicate this change to the CEO with a revised weekly schedule. The meta-lesson: at the Master Consultant level, managing the engagement itself is as important as the content of the recommendations.',
        points: 5,
        order: 5,
      },
    ],
  })

  // Module 15.2: CFA Proprietary Programmes
  const m15_2 = await prisma.trainingModule.create({
    data: {
      trackId: masterConsultant.id,
      name: 'CFA Proprietary Programmes',
      slug: 'cfa-proprietary-programmes',
      description: 'Master the delivery of CFA\'s six proprietary transformation programmes: Hospital Excellence, Turnaround, Clinical Governance Transformation, Digital Health Transformation, Health Systems Advisory, and Embedded Medical Director.',
      order: 2,
      estimatedMinutes: 150,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The CFA Programme Portfolio',
            type: 'text',
            body: `CFA has developed six proprietary programmes, each representing a codified approach to a specific healthcare transformation challenge. These programmes are the firm's intellectual property and competitive advantage. They combine structured methodologies, proven tools, and accumulated experience from dozens of African healthcare engagements into repeatable, scalable delivery models.

              The six programmes are: (1) Hospital Excellence Programme: a comprehensive operational improvement programme covering clinical quality, financial performance, patient experience, and workforce development. Typically 12-18 months. (2) Turnaround Programme: an intensive intervention for financially distressed or operationally failing hospitals, with a 90-day diagnostic-to-action cycle. (3) Clinical Governance Transformation: embedding clinical governance structures, mortality and morbidity reviews, clinical audit, and quality improvement culture. (4) Digital Health Transformation: EMR implementation, health information system design, telemedicine deployment, and digital maturity assessment. (5) Health Systems Advisory: supporting governments and development partners on health system strengthening, UHC design, and policy implementation. (6) Embedded Medical Director: placing a CFA clinician-consultant as interim Medical Director to drive clinical leadership transformation.`
          },
          {
            title: 'Programme Delivery Architecture',
            type: 'text',
            body: `Each CFA programme follows a consistent delivery architecture with four phases: Diagnose, Design, Deliver, and Sustain. The Diagnose phase (typically 4-6 weeks) uses structured assessment tools specific to each programme to establish a baseline, identify root causes, and quantify the opportunity. The Design phase (4-8 weeks) translates diagnostic findings into a detailed transformation plan with prioritized initiatives, resource requirements, and a benefits realization timeline.

              The Deliver phase (3-12 months depending on the programme) is where change happens. CFA consultants work alongside client teams to implement initiatives, build capability, and track progress against agreed milestones. The Sustain phase (3-6 months of decreasing intensity) ensures that changes stick after CFA departs. This includes embedding monitoring systems, training internal champions, and conducting periodic check-ins. The Sustain phase is what differentiates CFA from consultancies that deliver reports and leave. A hospital in Mombasa that went through the Hospital Excellence Programme maintained its quality improvements for 3 years after CFA's departure because the Sustain phase had embedded the right structures and habits.`
          },
          {
            title: 'Tailoring Programmes to Context',
            type: 'text',
            body: `No two hospitals are the same, and no CFA programme should be delivered identically twice. The Master Consultant's skill is knowing which programme elements to emphasize, which to skip, and how to adapt the methodology to the client's context. A Hospital Excellence engagement at a 500-bed teaching hospital in Lagos requires a fundamentally different approach than at a 60-bed district hospital in rural Zambia.

              Contextual factors that drive tailoring include: facility size and complexity, ownership structure (public, private, faith-based, PPP), existing management capacity, data availability, financial constraints, regulatory environment, and cultural dynamics. For example, the Turnaround Programme's financial restructuring module assumes access to detailed financial data. In a public hospital where financial records are incomplete, the first step is reconstructing the financial picture from bank statements, procurement records, and payroll data before any analysis can begin.

              The Master Consultant also knows when to combine programmes. A hospital requiring turnaround almost always needs clinical governance work as well. Rather than running two separate programmes, the Master Consultant designs an integrated engagement that draws from both programme methodologies, eliminating duplication and creating synergies. This programme integration skill is what justifies the Master Consultant certification.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Programme Selection',
            instruction: 'A faith-based hospital group operating 4 hospitals across East Africa approaches CFA. They report declining clinical quality, financial losses at 2 of 4 facilities, poor staff morale, and outdated paper-based systems. Which CFA programme(s) would you recommend and why? How would you sequence and integrate them?',
          },
          {
            title: 'Practice: Programme Tailoring',
            instruction: 'You are delivering the Hospital Excellence Programme to a 100-bed district hospital in rural Malawi. The hospital has no EMR, limited financial records, 60% staff vacancy rate, and the nearest specialist referral centre is 4 hours away. Describe how you would tailor the standard programme to this context, including which elements to emphasize, which to defer, and what contextual adaptations are needed.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'CFA Programme Portfolio Overview', url: 'internal://knowledge/programme-portfolio' },
          { title: 'Programme Tailoring Guidelines', url: 'internal://knowledge/programme-tailoring' },
        ],
        tools: ['Programme Selection Matrix', 'Diagnostic Assessment Templates (all 6 programmes)', 'Benefits Realization Tracker']
      },
    },
  })

  // Questions for Module 15.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m15_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What are the four phases of CFA\'s programme delivery architecture?',
        options: JSON.stringify([
          { id: 'a', text: 'Plan, Execute, Monitor, Close', isCorrect: false },
          { id: 'b', text: 'Diagnose, Design, Deliver, Sustain', isCorrect: true },
          { id: 'c', text: 'Assess, Recommend, Implement, Review', isCorrect: false },
          { id: 'd', text: 'Discover, Define, Develop, Deploy', isCorrect: false },
        ]),
        explanation: 'CFA\'s four-phase model is Diagnose (baseline and root cause), Design (transformation plan), Deliver (implementation alongside client teams), and Sustain (embedding changes for long-term impact). The Sustain phase is CFA\'s differentiator.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m15_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which CFA programme involves placing a CFA clinician-consultant as interim clinical leader to drive transformation?',
        options: JSON.stringify([
          { id: 'a', text: 'Hospital Excellence Programme', isCorrect: false },
          { id: 'b', text: 'Clinical Governance Transformation', isCorrect: false },
          { id: 'c', text: 'Embedded Medical Director', isCorrect: true },
          { id: 'd', text: 'Turnaround Programme', isCorrect: false },
        ]),
        explanation: 'The Embedded Medical Director programme places a CFA clinician-consultant as interim Medical Director within the client hospital, providing hands-on clinical leadership while building internal capacity for the permanent role.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m15_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What differentiates the Sustain phase from a traditional consulting engagement closeout?',
        options: JSON.stringify([
          { id: 'a', text: 'It involves delivering a final report and invoice', isCorrect: false },
          { id: 'b', text: 'It embeds monitoring systems, trains internal champions, and conducts periodic check-ins to ensure changes stick', isCorrect: true },
          { id: 'c', text: 'It focuses exclusively on financial metrics', isCorrect: false },
          { id: 'd', text: 'It transfers all CFA intellectual property to the client', isCorrect: false },
        ]),
        explanation: 'The Sustain phase (3-6 months of decreasing intensity) goes beyond delivering reports. It embeds monitoring systems, builds internal capability through trained champions, and includes periodic check-ins. This ensures transformation outlasts CFA\'s presence.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m15_2.id,
        type: 'MULTI_SELECT',
        question: 'Which contextual factors should a Master Consultant consider when tailoring a programme? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Facility size and complexity', isCorrect: true },
          { id: 'b', text: 'Ownership structure (public, private, faith-based)', isCorrect: true },
          { id: 'c', text: 'The personal preferences of the CFA team members', isCorrect: false },
          { id: 'd', text: 'Data availability and management capacity', isCorrect: true },
          { id: 'e', text: 'Cultural dynamics and regulatory environment', isCorrect: true },
        ]),
        explanation: 'Programme tailoring must consider facility characteristics (size, ownership), institutional factors (management capacity, data availability), and environmental factors (culture, regulation). Team preferences are not a valid tailoring factor.',
        points: 3,
        order: 4,
      },
      {
        moduleId: m15_2.id,
        type: 'CASE_STUDY',
        question: 'A state government has engaged CFA to transform a 350-bed teaching hospital that serves as the main referral centre for a population of 5 million. The hospital faces every challenge: clinical quality concerns (recent maternal death cluster), financial distress (6 months of unpaid supplier invoices), governance dysfunction (CEO and Medical Director in open conflict), workforce crisis (35% vacancy rate), and no digital systems. Design a CFA engagement that draws from the appropriate proprietary programmes.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'State Teaching Hospital, 350 beds, main referral centre for 5M population. All six CFA programme areas are relevant. State government is the client and funder, with the federal Teaching Hospital Board providing oversight. Budget for CFA engagement: $800K over 18 months.',
          data: {
            clinicalIssues: 'Maternal mortality cluster (5 deaths in 2 months), no M&M review process, expired drugs found in pharmacy',
            financialDistress: '6 months unpaid suppliers, N450M in outstanding liabilities, revenue only covers 65% of operating costs',
            governanceDysfunction: 'CEO (political appointee) and Medical Director (clinical leader) in open conflict, Board has not met in 8 months',
            workforceCrisis: '35% vacancy rate, 60% of specialists also run private practices, nurse attrition at 30% annually',
            digitalSystems: 'Paper-based everything, no EMR, manual billing, paper patient records frequently lost',
          },
        }),
        explanation: 'A strong answer would design an integrated engagement combining elements of Turnaround (for immediate financial stabilization), Clinical Governance Transformation (for the maternal mortality crisis and M&M reviews), and Hospital Excellence (for medium-term operational improvement). Phase 1 (Months 1-3): Turnaround diagnostic plus immediate clinical safety interventions (maternal death review, expired drug audit, essential drug procurement). Phase 2 (Months 4-9): Financial restructuring (supplier negotiation, revenue cycle optimization), governance reform (board reactivation, CEO-MD conflict resolution or restructuring), clinical governance framework implementation. Phase 3 (Months 10-15): Workforce strategy, operational improvements, basic digital system implementation (start with billing, not full EMR). Phase 4 (Months 16-18): Sustain phase. The Master Consultant recognizes that digital transformation should be deferred until basic operations are stable, and that governance reform is the prerequisite for everything else.',
        points: 5,
        order: 5,
      },
    ],
  })

  // Module 15.3: Business Development & Thought Leadership
  const m15_3 = await prisma.trainingModule.create({
    data: {
      trackId: masterConsultant.id,
      name: 'Business Development & Thought Leadership',
      slug: 'business-development-thought-leadership',
      description: 'Build CFA\'s practice through proposal writing, pipeline management, industry publications, conference speaking, and relationship-based business development.',
      order: 3,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Proposal Writing and Win Strategy',
            type: 'text',
            body: `At the Master Consultant level, you are expected to lead proposal development and win competitive bids. CFA proposals follow a structured approach: understand the client's real need (which may differ from the RFP), design a solution that addresses root causes rather than symptoms, price to value rather than cost, and present with clarity using the Pyramid Principle.

              Every proposal needs a win strategy. Before writing a single word, answer: Why should this client choose CFA? What is our unique advantage? Who is the competition and what will they propose? What are the decision-maker's personal priorities (career risk, political pressure, genuine desire for improvement)? A proposal for a government hospital turnaround should emphasize CFA's track record of implementation (not just strategy), our African healthcare specialization, and our Sustain methodology that delivers lasting results. Reference similar engagements with specific, quantified outcomes. Clients in African healthcare are tired of consultants who deliver reports. They want partners who deliver results.`
          },
          {
            title: 'Pipeline Management and Relationship Development',
            type: 'text',
            body: `Sustainable firm growth requires a disciplined pipeline. CFA uses a five-stage pipeline: Identified (potential opportunity spotted), Qualified (confirmed budget, timeline, and CFA fit), Developing (active relationship building and proposal preparation), Submitted (proposal delivered, awaiting decision), and Won/Lost (outcome captured with lessons learned).

              At any time, the Master Consultant should have visibility into 10-15 opportunities across these stages. The pipeline should represent 3-4x the revenue target to account for win rates (typical: 25-35% for competitive bids, 50-70% for sole-source relationships). Track pipeline value, stage conversion rates, average time in each stage, and win/loss patterns by client type, service line, and competitor.

              Relationship development is the primary driver of CFA's pipeline. In African healthcare consulting, trust is built over years, not months. Attend industry conferences, join professional associations, serve on advisory boards, and maintain regular contact with former clients. A 15-minute check-in call with a past client every quarter costs nothing but keeps CFA top of mind. The majority of CFA's engagements come from repeat clients or referrals, not competitive tenders. Invest accordingly.`
          },
          {
            title: 'Publications and Speaking',
            type: 'text',
            body: `Thought leadership positions CFA as the authoritative voice in African healthcare consulting. It serves three purposes: attracting inbound client inquiries, supporting proposal credibility, and building the personal brand of CFA consultants (which in turn attracts talent).

              Publications should demonstrate insight, not just knowledge. An article titled "Hospital Financial Performance in Nigeria" is generic. An article titled "Why Nigerian Hospitals Lose 30% of Earned Revenue and Three Strategies to Recover It" demonstrates specific expertise with actionable value. Target a mix of academic journals (for credibility), industry publications (for reach), and CFA's own channels (for full creative control). Each Master Consultant should aim for 2-4 publications per year and 3-5 speaking engagements at conferences, roundtables, or webinars.

              Speaking engagements require preparation and polish. Know your audience (hospital CEOs need different content than health ministry officials), lead with a provocative insight (not a company overview), use real case studies (anonymized), and always close with a clear takeaway. The best speaking engagements generate follow-up conversations that become pipeline opportunities. After every conference, follow up with every meaningful contact within 48 hours. The value of thought leadership is not the presentation itself but the relationships it creates.`
          }
        ],
        exercises: [
          {
            title: 'Practice: Proposal Executive Summary',
            instruction: 'Write a 1-page executive summary for a CFA proposal to conduct a Hospital Excellence Programme at a 300-bed private hospital group in East Africa. The group has 3 hospitals, is planning expansion to 5, and wants to standardize clinical quality and operational efficiency across all facilities. Include CFA\'s unique value proposition, proposed approach, expected outcomes, and investment range.',
          },
          {
            title: 'Practice: Thought Leadership Plan',
            instruction: 'Develop a 12-month thought leadership plan for yourself as a CFA Master Consultant specializing in hospital turnaround. Include 3 publication topics with target outlets, 4 speaking engagement targets, and a quarterly relationship-building cadence with key industry contacts.',
          }
        ]
      },
      resources: {
        links: [
          { title: 'CFA Proposal Writing Guide', url: 'internal://knowledge/proposal-guide' },
          { title: 'Pipeline Management Best Practices', url: 'internal://knowledge/pipeline-management' },
        ],
        tools: ['Proposal Template', 'Pipeline Tracker (CRM)', 'Speaking Engagement Planner', 'Publication Calendar']
      },
    },
  })

  // Questions for Module 15.3
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m15_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Before writing a CFA proposal, the first step in win strategy development is:',
        options: JSON.stringify([
          { id: 'a', text: 'Designing the project methodology', isCorrect: false },
          { id: 'b', text: 'Understanding why the client should choose CFA over competitors', isCorrect: true },
          { id: 'c', text: 'Calculating the fee estimate', isCorrect: false },
          { id: 'd', text: 'Assembling the project team', isCorrect: false },
        ]),
        explanation: 'Win strategy starts with understanding CFA\'s unique advantage for this specific opportunity. Before methodology or pricing, you must articulate why CFA is the best choice, what competitors will offer, and what the decision-maker truly cares about.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m15_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What pipeline-to-revenue ratio should a Master Consultant maintain to achieve revenue targets?',
        options: JSON.stringify([
          { id: 'a', text: '1:1 (pipeline equals target)', isCorrect: false },
          { id: 'b', text: '2x the revenue target', isCorrect: false },
          { id: 'c', text: '3-4x the revenue target', isCorrect: true },
          { id: 'd', text: '10x the revenue target', isCorrect: false },
        ]),
        explanation: 'Pipeline should represent 3-4x the revenue target to account for typical win rates (25-35% for competitive bids, 50-70% for sole-source). A 1:1 or 2x ratio would leave the consultant short of target when factoring in losses and delays.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m15_3.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which publication title best demonstrates thought leadership in African healthcare consulting?',
        options: JSON.stringify([
          { id: 'a', text: 'Hospital Financial Performance in Nigeria', isCorrect: false },
          { id: 'b', text: 'An Overview of Healthcare Consulting Services', isCorrect: false },
          { id: 'c', text: 'Why Nigerian Hospitals Lose 30% of Earned Revenue and Three Strategies to Recover It', isCorrect: true },
          { id: 'd', text: 'CFA Company Profile and Service Offerings', isCorrect: false },
        ]),
        explanation: 'Effective thought leadership demonstrates specific insight with actionable value. The title "Why Nigerian Hospitals Lose 30% of Earned Revenue and Three Strategies to Recover It" signals deep expertise, specific data, and practical solutions, making readers want to engage with CFA.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m15_3.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are elements of CFA\'s five-stage pipeline model? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Identified', isCorrect: true },
          { id: 'b', text: 'Qualified', isCorrect: true },
          { id: 'c', text: 'Negotiating', isCorrect: false },
          { id: 'd', text: 'Developing', isCorrect: true },
          { id: 'e', text: 'Submitted', isCorrect: true },
          { id: 'f', text: 'Won/Lost', isCorrect: true },
        ]),
        explanation: 'CFA\'s five pipeline stages are: Identified, Qualified, Developing, Submitted, and Won/Lost. "Negotiating" is not a separate stage; negotiation happens within the Submitted stage as part of the decision process.',
        points: 3,
        order: 4,
      },
      {
        moduleId: m15_3.id,
        type: 'CASE_STUDY',
        question: 'CFA has been invited to submit a proposal for a large health system strengthening programme funded by a multilateral development partner. The engagement is worth $2M over 3 years and involves supporting a national Ministry of Health to redesign primary healthcare delivery. Two international consulting firms (McKinsey and Deloitte) are also bidding. How do you develop the win strategy and what is CFA\'s competitive positioning?',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'World Bank-funded, $2M, 3-year engagement. Support Ministry of Health in redesigning PHC delivery model for a country of 40M people. Competitive bid against McKinsey and Deloitte. CFA has done 3 previous engagements in this country (2 hospital turnarounds and 1 clinical governance project). The CFA team has strong relationships with the Director of Primary Healthcare and several development partner representatives.',
          data: {
            competitorStrengths: 'McKinsey: global brand, large team capacity, government advisory track record. Deloitte: implementation capability, technology integration, local office presence.',
            cfaStrengths: 'Deep African healthcare specialization, 3 prior in-country engagements, personal relationships with key stakeholders, CFA proprietary PHC methodology, lower cost structure',
            clientPriorities: 'Practical implementation support (not just reports), health worker capacity building, community engagement, sustainable system change',
            evaluationCriteria: 'Technical approach (40%), team experience (30%), value for money (20%), local content (10%)',
          },
        }),
        explanation: 'CFA\'s win strategy should lean into its differentiators: (1) African healthcare specialization vs generalist competitors; (2) Implementation DNA (Diagnose-Design-Deliver-Sustain) vs report-and-leave consulting; (3) Existing in-country relationships and context knowledge from 3 prior engagements; (4) Lower cost structure delivering better value for money; (5) Proprietary PHC methodology built specifically for African health systems. The proposal should lead with CFA\'s track record of sustained results (not just recommendations), reference the 3 prior engagements with quantified outcomes, propose a team with a mix of CFA senior consultants and local experts (addressing the 10% local content criteria), and price competitively knowing that McKinsey and Deloitte will be 30-50% more expensive. Pre-submission, activate relationships with the Director of Primary Healthcare and development partner contacts to understand unstated preferences and refine positioning.',
        points: 5,
        order: 5,
      },
    ],
  })

  console.log('  Track 15: CFA Master Consultant - 3 modules, 15 questions')

  console.log('\nCFA Training Academy Master Level seeding complete!')
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
