/**
 * C4A TRAINING ACADEMY - SPECIALIST LEVEL SEED B (Tracks 9-10)
 * Seeds Specialist-level training tracks, modules, and assessment questions
 *
 * 2 Tracks:
 *   Track 9: Health Economics & M&E
 *   Track 10: Digital Health & Technology
 *
 * This file only CREATES new data. It does NOT delete existing records.
 *
 * Run: npx tsx prisma/seed-academy-specialist-b.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding C4A Training Academy - Specialist Level Tracks (9-10)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 9: SPECIALIST - Health Economics & M&E
  // ════════════════════════════════════════════════════════════════════════════

  const healthEconomics = await prisma.trainingTrack.create({
    data: {
      name: 'Health Economics & M&E',
      slug: 'health-economics-mne',
      description: `Build the analytical foundation that separates junior advisors from credible health sector consultants. This track covers cost-effectiveness analysis for programme and investment decisions, and the design of logframes and M&E frameworks that satisfy donor, government, and board requirements. Grounded in African healthcare realities — thin data environments, mixed funding models, and high-stakes resource allocation.`,
      level: 'SPECIALIST',
      category: 'health_economics',
      iconName: 'bar-chart-2',
      colorHex: '#1E3A5F',
      prerequisites: ['healthcare-fundamentals'],
      estimatedHours: 32,
      sortOrder: 9,
    },
  })

  // ── Module 9.1: Cost-Effectiveness Analysis ──────────────────────────────

  const m9_1 = await prisma.trainingModule.create({
    data: {
      trackId: healthEconomics.id,
      name: 'Cost-Effectiveness Analysis',
      slug: 'cost-effectiveness-analysis',
      description: 'Apply CEA and cost-benefit frameworks to health programme decisions, equipment procurement, and service-line investment in African healthcare settings.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'CEA Fundamentals in the African Context',
            type: 'text',
            body: `Cost-effectiveness analysis (CEA) answers one question: does this intervention produce enough health gain to justify its cost? In African healthcare, where budgets are constrained and every dollar competes against multiple priorities, CEA is not a theoretical exercise — it is a decision-making survival skill. The core metric is the cost per unit of health outcome: cost per malaria case prevented, cost per DALY averted, cost per successful TB treatment. The lower the ratio, the more attractive the intervention relative to alternatives.

The most widely used threshold in sub-Saharan Africa is one to three times GDP per capita per DALY averted, derived from WHO guidance. At Nigeria's current GDP per capita, that places the threshold at roughly USD 1,500 to 4,500 per DALY. A new diagnostic technology costing USD 800 per DALY averted clears the bar; one costing USD 6,000 does not. Consultants who can frame recommendations in these terms earn immediate credibility with ministries of health and international funders.`
          },
          {
            title: 'Conducting a CEA: Data, Assumptions, and Sensitivity',
            type: 'text',
            body: `A practical CEA involves four steps: define the comparator (the "do nothing" or current practice baseline), estimate incremental costs (programme costs plus system costs, net of savings), estimate incremental health outcomes (cases prevented, life-years gained, DALYs averted), and compute the incremental cost-effectiveness ratio (ICER). Data in African settings is often incomplete, so triangulation from published studies, regional datasets, and local cost surveys is standard practice.

Sensitivity analysis is non-negotiable. Test your conclusions by varying the two or three most uncertain inputs — unit cost of the intervention, coverage rate, and effect size — across plausible ranges. If the intervention remains cost-effective across most scenarios, the recommendation is robust. If results flip, the decision hinges on resolving that uncertainty first.`
          },
        ],
        exercises: [
          {
            title: 'Practice: ICER Calculation',
            instruction: 'A county health department in Kenya is evaluating a community health worker programme for hypertension screening. Incremental annual cost is KES 4.2 million. The programme is expected to prevent 60 premature deaths over five years, each representing an estimated 15 life-years gained. Calculate the cost per life-year gained and assess against a threshold of KES 150,000 per life-year.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'WHO-CHOICE Cost-Effectiveness Thresholds', url: 'internal://knowledge/who-choice-thresholds' },
          { title: 'ICER Calculator Template', url: 'internal://knowledge/icer-template' },
        ],
        tools: ['CEA Spreadsheet Model', 'DALY Calculation Guide', 'Sensitivity Analysis Template']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m9_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does the Incremental Cost-Effectiveness Ratio (ICER) measure?',
        options: JSON.stringify([
          { id: 'a', text: 'The total budget required for a health programme', isCorrect: false },
          { id: 'b', text: 'The additional cost per additional unit of health outcome compared to the baseline alternative', isCorrect: true },
          { id: 'c', text: 'The return on investment for hospital infrastructure', isCorrect: false },
          { id: 'd', text: 'The percentage of the population covered by an intervention', isCorrect: false },
        ]),
        explanation: 'The ICER divides incremental cost by incremental health outcome (e.g., DALYs averted, life-years gained) compared to a defined comparator. It is the central metric in cost-effectiveness analysis.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m9_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'According to WHO guidance, what is the commonly used cost-effectiveness threshold range for sub-Saharan Africa?',
        options: JSON.stringify([
          { id: 'a', text: 'USD 50,000 to 100,000 per DALY averted', isCorrect: false },
          { id: 'b', text: '1 to 3 times GDP per capita per DALY averted', isCorrect: true },
          { id: 'c', text: 'USD 1,000 per life-year gained, regardless of country', isCorrect: false },
          { id: 'd', text: '5 to 10 times GDP per capita per DALY averted', isCorrect: false },
        ]),
        explanation: 'WHO guidance sets the cost-effectiveness threshold at one to three times GDP per capita per DALY averted. This produces country-specific thresholds relevant to local resource constraints, rather than a single universal number.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m9_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are the four core steps in conducting a cost-effectiveness analysis? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Define the comparator baseline', isCorrect: true },
          { id: 'b', text: 'Estimate incremental costs', isCorrect: true },
          { id: 'c', text: 'Conduct media and stakeholder outreach', isCorrect: false },
          { id: 'd', text: 'Estimate incremental health outcomes', isCorrect: true },
          { id: 'e', text: 'Compute the ICER', isCorrect: true },
        ]),
        explanation: 'The four steps are: define the comparator, estimate incremental costs, estimate incremental health outcomes, and compute the ICER. Stakeholder outreach is important for implementation but is not part of the CEA methodology itself.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m9_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In a CEA with incomplete local data, what is the recommended approach?',
        options: JSON.stringify([
          { id: 'a', text: 'Abandon the analysis and present qualitative recommendations only', isCorrect: false },
          { id: 'b', text: 'Use only data from high-income country studies as a proxy', isCorrect: false },
          { id: 'c', text: 'Triangulate from published studies, regional datasets, and local cost surveys, then test assumptions with sensitivity analysis', isCorrect: true },
          { id: 'd', text: 'Request a five-year data collection period before beginning analysis', isCorrect: false },
        ]),
        explanation: 'Data triangulation combined with rigorous sensitivity analysis is the standard approach in data-limited African settings. The goal is a robust, defensible estimate rather than perfect precision.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m9_1.id,
        type: 'CASE_STUDY',
        question: 'A regional hospital in Ghana is choosing between two malaria rapid diagnostic test (RDT) programmes. Programme A costs USD 80,000 per year and prevents an estimated 200 malaria deaths annually. Programme B costs USD 130,000 per year and prevents an estimated 280 deaths. Ghana GDP per capita is approximately USD 2,400. Calculate the ICER of Programme B vs. Programme A and advise whether the incremental investment is cost-effective.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Regional hospital, Ashanti Region, Ghana. Annual malaria caseload: 18,000. Two RDT programmes under evaluation. Budget authority rests with the Regional Health Directorate. Assume each death prevented represents 25 life-years gained.',
          data: {
            programmeACost: 'USD 80,000/year',
            programmeADeathsPrevented: 200,
            programmeBCost: 'USD 130,000/year',
            programmeBDeathsPrevented: 280,
            ghanaGDPPerCapita: 'USD 2,400',
            lifeYearsPerDeathPrevented: 25,
          },
        }),
        explanation: 'Incremental cost of B vs. A: USD 50,000. Incremental deaths prevented: 80. Incremental life-years gained: 80 x 25 = 2,000. ICER = USD 50,000 / 2,000 = USD 25 per life-year gained. Ghana threshold (1-3x GDP per capita): USD 2,400 to 7,200 per life-year. At USD 25 per life-year, Programme B is highly cost-effective and the incremental investment is clearly justified.',
        points: 5,
        order: 5,
      },
    ],
  })

  // ── Module 9.2: Logframe & M&E Design ───────────────────────────────────

  const m9_2 = await prisma.trainingModule.create({
    data: {
      trackId: healthEconomics.id,
      name: 'Logframe & M&E Design',
      slug: 'logframe-mne-design',
      description: 'Design logframes, theories of change, and M&E frameworks that meet donor standards and generate actionable programme learning in African health contexts.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Logframes and Theories of Change',
            type: 'text',
            body: `The logical framework (logframe) is the default planning and accountability tool for health programmes funded by bilateral donors, the Global Fund, USAID, GAVI, and most African governments. It maps the causal chain from inputs and activities through outputs and outcomes to impact, with corresponding indicators, verification sources, and assumptions at each level. A well-constructed logframe is a contract: it commits the programme to delivering specific results and gives funders a basis for evaluation.

A theory of change (ToC) sits above the logframe and answers the "why" question: under what conditions and through what mechanisms does this programme produce its intended impact? For a maternal health intervention in rural Uganda, the ToC might state that training village health teams increases care-seeking behaviour, which increases skilled birth attendance, which reduces maternal mortality — provided that referral infrastructure exists and communities trust the health system. The ToC makes assumptions explicit so they can be monitored and, if necessary, revised.`
          },
          {
            title: 'Building an M&E Framework that Works',
            type: 'text',
            body: `An M&E framework operationalises the logframe into a data collection and reporting system. It specifies for each indicator: the definition, the data source, the collection method, the frequency, the responsible party, and the disaggregation required (by sex, age, geographic zone, facility type). In African programme management, the most common failure is designing indicators that cannot actually be measured given available systems and staff capacity.

Apply the SMART test rigorously: Specific (leaves no room for interpretation), Measurable (data can be collected reliably), Achievable (realistic given the implementation context), Relevant (directly linked to the programme logic), and Time-bound (has a clear reporting period). A PEPFAR-funded HIV programme in Zambia, for example, uses standardised indicator definitions that allow cross-site comparison and aggregation to national dashboards — a standard worth emulating in domestic programme design.`
          },
        ],
        exercises: [
          {
            title: 'Practice: Build a Logframe',
            instruction: 'A nutrition programme in northern Nigeria aims to reduce acute malnutrition among children under five in three LGAs. Draft a four-level logframe (inputs, outputs, outcomes, impact) with one SMART indicator and one verifiable data source per level.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'USAID Logframe Guidance', url: 'internal://knowledge/usaid-logframe' },
          { title: 'Global Fund M&E Standards', url: 'internal://knowledge/gf-mne-standards' },
        ],
        tools: ['Logframe Template (C4A)', 'Theory of Change Builder', 'SMART Indicator Checklist']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m9_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In a logframe, at which level are indicators and means of verification specified?',
        options: JSON.stringify([
          { id: 'a', text: 'Only at the impact level', isCorrect: false },
          { id: 'b', text: 'At every level: inputs, outputs, outcomes, and impact', isCorrect: true },
          { id: 'c', text: 'Only at the output and outcome levels', isCorrect: false },
          { id: 'd', text: 'Only at the input level', isCorrect: false },
        ]),
        explanation: 'A logframe specifies indicators and means of verification at each of its four levels — inputs, outputs, outcomes, and impact. This ensures the entire results chain is measurable and verifiable.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m9_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the primary purpose of a Theory of Change in health programme design?',
        options: JSON.stringify([
          { id: 'a', text: 'To calculate the programme budget', isCorrect: false },
          { id: 'b', text: 'To specify data collection methods for each indicator', isCorrect: false },
          { id: 'c', text: 'To articulate the causal mechanisms and conditions under which the programme produces its intended impact', isCorrect: true },
          { id: 'd', text: 'To satisfy donor reporting formats', isCorrect: false },
        ]),
        explanation: 'A Theory of Change explains the "why" and "how" of programme impact — the causal pathway and the assumptions that must hold for the intervention to work. It sits above the logframe and makes programme logic transparent.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m9_2.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are required elements of an indicator specification in an M&E framework? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Indicator definition', isCorrect: true },
          { id: 'b', text: 'Data source and collection method', isCorrect: true },
          { id: 'c', text: 'Responsible party', isCorrect: true },
          { id: 'd', text: 'Name of the donor funding the indicator', isCorrect: false },
          { id: 'e', text: 'Disaggregation required (e.g., by sex, age, location)', isCorrect: true },
        ]),
        explanation: 'A complete indicator specification includes the definition, data source, collection method, frequency, responsible party, and required disaggregation. The donor name is administrative context, not part of the indicator specification itself.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m9_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The most common M&E framework failure in African programme management is:',
        options: JSON.stringify([
          { id: 'a', text: 'Having too few indicators', isCorrect: false },
          { id: 'b', text: 'Designing indicators that cannot be measured given available systems and staff capacity', isCorrect: true },
          { id: 'c', text: 'Reporting results too frequently to donors', isCorrect: false },
          { id: 'd', text: 'Using disaggregated data instead of aggregate totals', isCorrect: false },
        ]),
        explanation: 'Over-ambitious indicator design is the most frequent failure point. When data collection requires systems or staff capacity that does not exist, the M&E framework produces unreliable or missing data. Design must match implementation reality.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m9_2.id,
        type: 'CASE_STUDY',
        question: 'A donor-funded community health programme in rural Mozambique has been running for two years but cannot demonstrate results to its funder because its M&E data is incomplete and inconsistent. The programme director has asked you to diagnose and rebuild the M&E system. Identify three likely root causes of the data failure and propose a concrete remediation for each.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Community health programme, Nampula Province, Mozambique. 45 community health workers (CHWs) covering 12 villages. Funder: European development agency. Programme goal: reduce under-five mortality by 20% over 4 years. Current M&E status: CHWs submit paper registers monthly; data is not aggregated at district level; indicator definitions vary across sites; no verification of reported data.',
          data: {
            chws: 45,
            villages: 12,
            dataSubmissionMethod: 'Paper registers, monthly',
            aggregationStatus: 'Not aggregated at district level',
            indicatorConsistency: 'Definitions vary across sites',
            dataVerification: 'None',
          },
        }),
        explanation: 'Strong answers should identify: (1) Inconsistent indicator definitions — remediation: standardise a single definition dictionary and retrain all CHWs; (2) No data aggregation pathway — remediation: assign a district M&E officer and implement a monthly data flow from CHW to facility to district; (3) No data verification — remediation: institute quarterly spot-checks comparing paper registers against community headcounts and facility records. Additional valid issues: paper forms prone to transcription error (introduce simple tally sheets), no feedback loops mean CHWs are not motivated to report accurately (introduce monthly data review meetings with performance recognition).',
        points: 5,
        order: 5,
      },
    ],
  })

  console.log('Track 9 seeded.\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 10: SPECIALIST - Digital Health & Technology
  // ════════════════════════════════════════════════════════════════════════════

  const digitalHealth = await prisma.trainingTrack.create({
    data: {
      name: 'Digital Health & Technology',
      slug: 'digital-health-technology',
      description: `Equip yourself to advise health systems on the technology decisions that will define their next decade. This track covers Health Information System (HIS) and EMR selection and implementation, and the strategic frameworks for building a coherent digital health roadmap. Grounded in the realities of African connectivity, data governance, and system interoperability.`,
      level: 'SPECIALIST',
      category: 'tech',
      iconName: 'monitor',
      colorHex: '#0D4F3C',
      prerequisites: ['healthcare-fundamentals'],
      estimatedHours: 28,
      sortOrder: 10,
    },
  })

  // ── Module 10.1: HIS/EMR Implementation ─────────────────────────────────

  const m10_1 = await prisma.trainingModule.create({
    data: {
      trackId: digitalHealth.id,
      name: 'HIS/EMR Implementation',
      slug: 'his-emr-implementation',
      description: 'Guide health facilities and systems through HIS and EMR selection, configuration, and rollout, with a focus on avoiding the common failure patterns in African deployments.',
      order: 1,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The African HIS Landscape',
            type: 'text',
            body: `Health Information Systems in Africa span a wide spectrum: from paper registers and spreadsheets in rural clinics to integrated EMR platforms in urban referral hospitals. The dominant open-source platforms are DHIS2 (used in over 40 African countries for aggregate reporting), OpenMRS (patient-level clinical records), and OpenELIS (laboratory information). Proprietary systems such as Meditech and Sage 200 exist in private hospitals that can afford licensing and support costs. Consultants must be able to assess this landscape and match system selection to a facility's clinical complexity, transaction volume, connectivity environment, and IT capacity.

The most expensive mistake in HIS implementation is selecting a system based on vendor presentations rather than site requirements. A county referral hospital in Uganda that selects a cloud-based EMR without reliable internet, a generator, and trained IT staff will spend more on workarounds than the system saves. Requirements assessment — covering clinical workflows, hardware, connectivity, power, and human resources — must precede any procurement decision.`
          },
          {
            title: 'Implementation Phases and Change Management',
            type: 'text',
            body: `Successful HIS implementation follows four phases: requirements and selection (8-12 weeks), configuration and piloting (12-16 weeks), phased rollout (8-24 weeks depending on site count), and stabilisation and optimisation (ongoing). Each phase has defined deliverables and go/no-go criteria. Skipping the pilot phase — one of the most common shortcuts — typically results in system-wide failures that take 6-12 months to remediate.

Change management is the highest-risk element. Clinical staff who distrust the system will revert to paper, creating parallel processes that are worse than no digitisation at all. Effective approaches include: involving clinical champions in configuration decisions, phasing rollout by department starting with the most supportive teams, establishing a super-user network, and scheduling regular feedback sessions during stabilisation. The technology is rarely the reason implementations fail — the people and process dimensions almost always are.`
          },
        ],
        exercises: [
          {
            title: 'Practice: Requirements Assessment',
            instruction: 'A 180-bed district hospital in rural Zambia wants to implement an EMR. Develop a requirements assessment checklist covering clinical, technical, and organisational dimensions. Identify the top three risks for this deployment and propose mitigations.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'DHIS2 Implementation Toolkit', url: 'internal://knowledge/dhis2-toolkit' },
          { title: 'OpenMRS Africa Deployment Guide', url: 'internal://knowledge/openmrs-guide' },
        ],
        tools: ['HIS Requirements Template', 'EMR Vendor Scorecard', 'Implementation Readiness Checklist']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m10_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'DHIS2 is primarily used in African health systems for:',
        options: JSON.stringify([
          { id: 'a', text: 'Patient-level clinical records and appointment scheduling', isCorrect: false },
          { id: 'b', text: 'Laboratory information management', isCorrect: false },
          { id: 'c', text: 'Aggregate health data reporting across facilities and districts', isCorrect: true },
          { id: 'd', text: 'Medical billing and insurance claims processing', isCorrect: false },
        ]),
        explanation: 'DHIS2 is the dominant platform for aggregate routine health data reporting, used in over 40 African countries. OpenMRS handles patient-level records and OpenELIS manages laboratory data.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m10_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What is the most common and costly mistake in HIS system selection in Africa?',
        options: JSON.stringify([
          { id: 'a', text: 'Choosing open-source systems over proprietary ones', isCorrect: false },
          { id: 'b', text: 'Selecting a system based on vendor presentations rather than a site requirements assessment', isCorrect: true },
          { id: 'c', text: 'Involving clinical staff in configuration decisions', isCorrect: false },
          { id: 'd', text: 'Running a pilot phase before full rollout', isCorrect: false },
        ]),
        explanation: 'Requirements assessment must precede procurement. Selecting a system without evaluating clinical workflows, connectivity, power supply, hardware, and IT capacity typically results in a mismatched system that costs more to maintain than it saves.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m10_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is identified as the highest-risk element of HIS implementation?',
        options: JSON.stringify([
          { id: 'a', text: 'Server configuration and database setup', isCorrect: false },
          { id: 'b', text: 'Software licensing and vendor contracts', isCorrect: false },
          { id: 'c', text: 'Change management — ensuring clinical staff adopt and trust the system', isCorrect: true },
          { id: 'd', text: 'Internet bandwidth procurement', isCorrect: false },
        ]),
        explanation: 'Technology failures are recoverable. When clinical staff distrust the system and revert to paper, parallel processes emerge that are harder to resolve than the original gap. Change management — clinical champions, super-users, phased rollout, feedback loops — is the implementation dimension with the highest failure risk.',
        points: 1,
        order: 3,
      },
      {
        moduleId: m10_1.id,
        type: 'MULTI_SELECT',
        question: 'Which effective change management approaches are recommended for HIS rollout in African hospitals? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Involve clinical champions in system configuration decisions', isCorrect: true },
          { id: 'b', text: 'Roll out to all departments simultaneously to avoid disruption', isCorrect: false },
          { id: 'c', text: 'Establish a super-user network across departments', isCorrect: true },
          { id: 'd', text: 'Start rollout with the most supportive departments first', isCorrect: true },
          { id: 'e', text: 'Schedule regular feedback sessions during stabilisation', isCorrect: true },
        ]),
        explanation: 'Effective change management requires clinical ownership (champions, super-users), phased rollout starting with willing teams, and continuous feedback loops. Simultaneous full rollout is high-risk and should be avoided.',
        points: 3,
        order: 4,
      },
      {
        moduleId: m10_1.id,
        type: 'CASE_STUDY',
        question: 'A 250-bed referral hospital in Dar es Salaam implemented an EMR 18 months ago. Clinical staff have reverted to paper for most workflows. The system is used only for billing. The CEO wants the implementation rescued before the board meeting in 90 days. Diagnose the likely failure points and outline a 90-day recovery plan.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Referral hospital, Dar es Salaam, Tanzania. EMR implemented 18 months ago. Current adoption: billing module only (finance team). Clinical modules (inpatient, outpatient, nursing, pharmacy): paper reversion. IT staff: 2 people. Clinical champions identified during implementation: none. Training sessions held: 2-day classroom training at go-live only.',
          data: {
            emrAdoption: 'Billing only — clinical modules abandoned',
            itStaffCount: 2,
            clinicalChampions: 'None identified',
            trainingApproach: '2-day classroom at go-live, no follow-up',
            timeToBoard: '90 days',
          },
        }),
        explanation: 'Likely failure points: (1) No clinical champions meant no internal advocates for adoption; (2) One-time classroom training with no ongoing support left staff without help at the point of use; (3) No phased rollout meant all departments faced change simultaneously without a proven model. 90-day recovery: Weeks 1-2 — conduct rapid workflow assessments per department and identify two champions per clinical area; Weeks 3-6 — run department-level retraining using real patient scenarios, establish a help-desk number; Weeks 7-10 — pilot full adoption in one ward with daily IT support presence; Weeks 11-12 — expand to two additional wards, present adoption metrics to board with 6-month roadmap.',
        points: 5,
        order: 5,
      },
    ],
  })

  // ── Module 10.2: Digital Health Strategy ────────────────────────────────

  const m10_2 = await prisma.trainingModule.create({
    data: {
      trackId: digitalHealth.id,
      name: 'Digital Health Strategy',
      slug: 'digital-health-strategy',
      description: 'Build coherent digital health roadmaps for hospitals, health networks, and ministries of health — aligned to national frameworks, interoperability standards, and realistic implementation capacity.',
      order: 2,
      estimatedMinutes: 120,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'National Digital Health Frameworks in Africa',
            type: 'text',
            body: `Most African countries now have a National Digital Health Strategy (NDHS) — a government-published roadmap covering health data governance, interoperability standards, priority platforms, and investment priorities. Kenya's NDHS, Rwanda's Digital Health Strategic Plan, and Ghana's eHealth Strategy are among the most developed. As a consultant, your client's digital health strategy must align with — and ideally leverage — the national framework. Duplicate investment in systems that contradict national standards creates interoperability debt that is expensive to resolve later.

The Africa CDC's Africa Digital Health Blueprint and the Smart Africa initiative provide continental frameworks. The WHO SCORE framework (Standardise, Connect, Own, Review, Enable) gives a structured approach to health data strengthening that translates well into client roadmaps. Consultants who can navigate these frameworks earn credibility with both health system clients and the donors who fund digital health investments.`
          },
          {
            title: 'Building a Digital Health Roadmap',
            type: 'text',
            body: `A digital health roadmap translates strategic intent into a sequenced, funded, and governable implementation plan. The five-step process: (1) Current state assessment — inventory existing systems, connectivity, data flows, and governance gaps; (2) Priority use-case definition — identify the two or three digital use cases with the highest potential impact; (3) Architecture design — specify the target system landscape, interoperability approach (HL7 FHIR is the emerging standard in Africa), and data governance model; (4) Investment planning — cost the roadmap, identify funding sources, and sequence by readiness and dependency; (5) Governance model — define who owns digital health decisions, how vendors are managed, and how the roadmap is reviewed.

Interoperability is the most underestimated challenge. A hospital running five disconnected systems — billing, EMR, laboratory, pharmacy, radiology — loses more value to data silos than it gains from each individual system. Designing for interoperability from the start, using open standards and a central health information exchange where feasible, is far cheaper than retrofitting integration later.`
          },
        ],
        exercises: [
          {
            title: 'Practice: Digital Maturity Assessment',
            instruction: 'A 12-facility private health network in Kenya wants to develop a group-wide digital health strategy. Design a digital maturity assessment framework covering five dimensions: infrastructure, data management, clinical digitisation, analytics, and governance. Define three maturity levels per dimension.',
          },
        ]
      },
      resources: {
        links: [
          { title: 'WHO SCORE Framework for Health Data', url: 'internal://knowledge/who-score' },
          { title: 'Africa CDC Digital Health Blueprint', url: 'internal://knowledge/africa-cdc-digital' },
        ],
        tools: ['Digital Maturity Assessment Tool', 'Digital Health Roadmap Template', 'HL7 FHIR Primer for Consultants']
      },
    },
  })

  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m10_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'What does the WHO SCORE framework stand for in the context of health data strengthening?',
        options: JSON.stringify([
          { id: 'a', text: 'Strategy, Capacity, Operations, Reporting, Evaluation', isCorrect: false },
          { id: 'b', text: 'Standardise, Connect, Own, Review, Enable', isCorrect: true },
          { id: 'c', text: 'Systems, Compliance, Outcomes, Resources, Equity', isCorrect: false },
          { id: 'd', text: 'Scope, Cost, Output, Results, Efficiency', isCorrect: false },
        ]),
        explanation: 'The WHO SCORE framework stands for Standardise, Connect, Own, Review, Enable. It provides a structured approach to health data strengthening that maps well onto client digital health roadmaps and donor investment frameworks.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m10_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which interoperability standard is emerging as the primary framework for health data exchange in Africa?',
        options: JSON.stringify([
          { id: 'a', text: 'HL7 v2', isCorrect: false },
          { id: 'b', text: 'DICOM', isCorrect: false },
          { id: 'c', text: 'HL7 FHIR (Fast Healthcare Interoperability Resources)', isCorrect: true },
          { id: 'd', text: 'ICD-10', isCorrect: false },
        ]),
        explanation: 'HL7 FHIR is the emerging standard for health data interoperability across Africa, backed by WHO guidance, national digital health strategies, and major health technology vendors. It enables systems to exchange patient data using modern API-based architecture.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m10_2.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are steps in building a digital health roadmap? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Current state assessment of systems, connectivity, and governance', isCorrect: true },
          { id: 'b', text: 'Priority use-case definition', isCorrect: true },
          { id: 'c', text: 'Architecture design including interoperability approach', isCorrect: true },
          { id: 'd', text: 'Selecting a vendor before assessing requirements', isCorrect: false },
          { id: 'e', text: 'Investment planning and governance model definition', isCorrect: true },
        ]),
        explanation: 'The five roadmap steps are: current state assessment, priority use-case definition, architecture design, investment planning, and governance model. Vendor selection follows requirements assessment — never precedes it.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m10_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Why is interoperability described as the most underestimated challenge in digital health strategy?',
        options: JSON.stringify([
          { id: 'a', text: 'Because most African governments prohibit data sharing between systems', isCorrect: false },
          { id: 'b', text: 'Because a hospital with disconnected systems loses more value to data silos than it gains from each individual system', isCorrect: true },
          { id: 'c', text: 'Because interoperability standards do not yet exist for African contexts', isCorrect: false },
          { id: 'd', text: 'Because EMR vendors in Africa refuse to support integration', isCorrect: false },
        ]),
        explanation: 'Disconnected systems — billing, EMR, laboratory, pharmacy, radiology — create data silos that undermine clinical decision-making, reporting, and operational efficiency. Retrofitting integration after deployment is far more expensive than designing for interoperability from the start.',
        points: 1,
        order: 4,
      },
      {
        moduleId: m10_2.id,
        type: 'CASE_STUDY',
        question: 'The Rwanda Ministry of Health has asked you to review the digital health strategy of a 6-hospital network that is seeking government partnership status. The network has an EMR in two hospitals, DHIS2 reporting in all six, a standalone laboratory system in the largest hospital, and no shared patient identifier across facilities. Draft a gap analysis and priority recommendations for a 24-month digital health roadmap.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Six-hospital private network, Rwanda. Seeking MoH partnership status, which requires interoperability with national systems including the national health information exchange (RwandaHIE) and DHIS2. Current digital footprint: EMR (OpenMRS) in 2 of 6 hospitals; DHIS2 aggregate reporting in all 6; standalone OpenELIS in flagship hospital; no shared patient ID; no analytics platform; IT staff: 1 per hospital.',
          data: {
            emrCoverage: '2 of 6 hospitals',
            dhis2Coverage: 'All 6 hospitals (aggregate only)',
            labSystem: 'OpenELIS in flagship hospital only',
            sharedPatientID: 'None',
            analyticsCapability: 'None',
            itStaffing: '1 IT staff per hospital',
            nationalRequirement: 'Integration with RwandaHIE and DHIS2',
          },
        }),
        explanation: 'Key gaps: (1) EMR coverage — 4 hospitals have no patient-level digital records; (2) No shared patient identifier — patients cannot be tracked across facilities; (3) Lab system isolated; (4) No analytics layer; (5) RwandaHIE integration absent. 24-month roadmap: Months 1-6 — implement shared patient identifier (national ID integration), roll out OpenMRS to remaining 4 hospitals starting with two highest-volume sites; Months 7-12 — integrate OpenELIS with OpenMRS at flagship, configure FHIR-based RwandaHIE connection; Months 13-18 — extend RwandaHIE integration to all sites, deploy DHIS2 analytics dashboard; Months 19-24 — group-wide analytics platform, staff training programme, and governance review. Governance: establish a group CIO role or digital health steering committee.',
        points: 5,
        order: 5,
      },
    ],
  })

  console.log('Track 10 seeded.\n')
  console.log('Specialist Level Tracks 9-10 complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
