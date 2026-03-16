/**
 * CFA TRAINING ACADEMY - SPECIALIST LEVEL SEED C (Tracks 11-12)
 * Seeds Specialist-level training tracks, modules, and assessment questions
 *
 * 2 Tracks:
 *   Track 11: Healthcare HR & Leadership
 *   Track 12: Lean & Quality Improvement
 *
 * This file only CREATES new data. It does NOT delete existing records.
 *
 * Run: npx tsx prisma/seed-academy-specialist-c.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CFA Training Academy - Specialist Level Tracks (11-12)...\n')

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 11: SPECIALIST - Healthcare HR & Leadership
  // ════════════════════════════════════════════════════════════════════════════

  const healthcareHR = await prisma.trainingTrack.create({
    data: {
      name: 'Healthcare HR & Leadership',
      slug: 'healthcare-hr-leadership',
      description: `Healthcare organisations across Africa lose their best clinicians and administrators not from lack of pay alone, but from poor leadership and misaligned team cultures. This track gives consultants the behavioural and organisational tools to assess, develop, and retain health workforce talent. Covers DISC behavioural profiling for clinical teams and the CILTI framework for navigating leadership transitions in hospitals, health NGOs, and ministries of health.`,
      level: 'SPECIALIST',
      category: 'leadership',
      iconName: 'users',
      colorHex: '#7C3AED',
      prerequisites: ['core-consulting-skills'],
      estimatedHours: 30,
      sortOrder: 11,
    },
  })

  // ── Module 11.1: DISC & Behavioral Assessment ──────────────────────────────

  const m11_1 = await prisma.trainingModule.create({
    data: {
      trackId: healthcareHR.id,
      name: 'DISC & Behavioral Assessment',
      slug: 'disc-behavioral-assessment',
      description: 'Use DISC profiling to understand clinical and administrative team dynamics, improve communication, and reduce conflict in African healthcare settings.',
      order: 1,
      estimatedMinutes: 110,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'DISC in the Healthcare Workplace',
            type: 'text',
            body: `DISC describes four primary behavioural styles: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C). In a district hospital in Zambia or a private clinic network in Nigeria, you will find all four styles operating under high pressure and resource scarcity. A D-style medical director drives decisions quickly but may steamroll nursing staff input. A C-style pharmacist obsesses over protocol compliance but struggles to communicate urgency in a crisis.

Understanding these styles helps consultants diagnose team tension, design better handover processes, and coach managers who wonder why their top-down memos are not working. DISC is not a label but a lens: it describes how people prefer to communicate and respond to pressure, not what they are capable of.`,
          },
          {
            title: 'Applying DISC to Team Diagnostics and Coaching',
            type: 'text',
            body: `When entering a healthcare engagement, a DISC team audit typically reveals one of three common problems: a leadership team dominated by a single style (often all-D executives who under-consult), a clinical-administrative divide where S-style nurses clash with C-style finance managers over documentation burdens, or I-style clinical champions who motivate teams but avoid accountability conversations.

The consultant's job is to map the team profile, surface the friction points, and design communication structures that work across styles. In East African hospitals, this often means pairing a structured D-style CMO with a high-S deputy who manages staff sentiment, and building decision forums that give C-style clinicians the data they need before committing.`,
          },
        ],
        exercises: [
          {
            title: 'Practice: DISC Team Map',
            instruction: 'A 180-bed mission hospital in Uganda is experiencing high tension between its medical superintendent (D-style) and head of nursing (S-style). Map the likely conflict points and design two practical interventions to improve their working relationship.',
          },
        ],
      },
      resources: {
        links: [
          { title: 'DISC in Healthcare Settings', url: 'internal://knowledge/disc-healthcare' },
          { title: 'Team Profile Assessment Tool', url: 'internal://knowledge/disc-team-profiler' },
        ],
        tools: ['DISC Assessment Template', 'Team Communication Matrix', 'Conflict Mapping Worksheet'],
      },
    },
  })

  // Questions for Module 11.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m11_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which DISC style is most likely to drive rapid decisions but risk alienating nursing staff input in a district hospital?',
        options: JSON.stringify([
          { id: 'a', text: 'Influence (I)', isCorrect: false },
          { id: 'b', text: 'Steadiness (S)', isCorrect: false },
          { id: 'c', text: 'Dominance (D)', isCorrect: true },
          { id: 'd', text: 'Conscientiousness (C)', isCorrect: false },
        ]),
        explanation: 'D-style leaders prioritise results and speed. Without deliberate inclusion practices, they can override input from high-S nursing staff who value consensus and stability.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m11_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A C-style pharmacist in a Kenyan hospital struggles to escalate stock-out alerts quickly. What is the most likely reason?',
        options: JSON.stringify([
          { id: 'a', text: 'They lack clinical knowledge about drug urgency', isCorrect: false },
          { id: 'b', text: 'They prefer to verify all data carefully before communicating, which slows escalation', isCorrect: true },
          { id: 'c', text: 'They are not motivated by patient outcomes', isCorrect: false },
          { id: 'd', text: 'They have a dominant communication style that alienates colleagues', isCorrect: false },
        ]),
        explanation: 'C-style individuals are detail-oriented and accuracy-driven. Under pressure, they may over-verify before communicating, which is a strength in quality control but a liability in time-sensitive crisis communication.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m11_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are valid uses of DISC profiling in a healthcare consulting engagement? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Diagnosing team communication friction points', isCorrect: true },
          { id: 'b', text: 'Determining clinical competency of a nurse', isCorrect: false },
          { id: 'c', text: 'Designing communication forums that work across behavioural styles', isCorrect: true },
          { id: 'd', text: 'Coaching a medical director on how to engage a high-S deputy', isCorrect: true },
          { id: 'e', text: 'Setting staff salary grades', isCorrect: false },
        ]),
        explanation: 'DISC is a behavioural lens, not a competency or compensation tool. It is most effective for communication design, leadership coaching, and team diagnostics.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m11_1.id,
        type: 'CASE_STUDY',
        question: 'A private hospital group in Ghana is rolling out a new EMR. The IT project manager (D-style) and the lead physician champion (C-style) are in constant conflict over implementation timelines. Describe the behavioural root cause and design two interventions.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Accra-based private hospital group, 3 sites. EMR rollout is 6 weeks behind schedule. IT PM wants to go live with 80% of features ready. Lead physician refuses to sign off without complete testing and documentation. Staff morale is declining as both leaders argue in department meetings.',
          data: {
            projectDelay: '6 weeks',
            featureReadiness: '80%',
            staffSentiment: 'Low — caught between two leaders',
            goLiveStake: 'Board has tied group CEO bonus to on-time delivery',
          },
        }),
        explanation: 'The D-style PM and C-style physician clash because D prioritises speed and decisiveness while C prioritises accuracy and completeness. A strong answer pairs a structured negotiation session with a phased go-live plan: pilot one site with full testing (satisfying C), with a committed 4-week deadline for full rollout (satisfying D). A neutral facilitator using shared patient-safety framing can de-escalate the public conflict.',
        points: 5,
        order: 4,
      },
      {
        moduleId: m11_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'An I-style clinical champion motivates staff well but avoids accountability conversations. As a consultant, your priority intervention is:',
        options: JSON.stringify([
          { id: 'a', text: 'Replace the I-style leader with a D-style manager', isCorrect: false },
          { id: 'b', text: 'Pair them with a structured C-style deputy who owns performance tracking', isCorrect: true },
          { id: 'c', text: 'Remove them from any supervisory role', isCorrect: false },
          { id: 'd', text: 'Conduct a DISC reassessment to confirm the profile', isCorrect: false },
        ]),
        explanation: 'Complementary pairings are more effective than replacement. A high-I leader\'s motivational strength is preserved while a C-style deputy fills the accountability gap through structured performance management.',
        points: 1,
        order: 5,
      },
    ],
  })

  // ── Module 11.2: CILTI & Leadership Transition ─────────────────────────────

  const m11_2 = await prisma.trainingModule.create({
    data: {
      trackId: healthcareHR.id,
      name: 'CILTI & Leadership Transition',
      slug: 'cilti-leadership-transition',
      description: 'Apply the CILTI framework to support leaders navigating role transitions in African health systems, from clinical expert to management and from manager to executive.',
      order: 2,
      estimatedMinutes: 110,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'Why Leadership Transitions Fail in Healthcare',
            type: 'text',
            body: `The most common HR crisis in African healthcare is not a shortage of talent but a failure of transition. A brilliant surgeon becomes a CMO and continues operating instead of managing. A high-performing nursing coordinator is promoted to hospital administrator and drowns in finance and procurement decisions she was never trained for. CILTI (Capability, Identity, Learning, Trust, and Integration) is a framework for diagnosing what a leader needs at each stage of a role transition.

In Nigeria, Rwanda, and Ethiopia alike, consultants find the same pattern: technical excellence gets people promoted, then the organisation provides no structured support for the identity shift the role demands. Within 12 months, the promoted leader either regresses to their technical comfort zone or burns out trying to do both jobs.`,
          },
          {
            title: 'The Five CILTI Dimensions in Practice',
            type: 'text',
            body: `Capability covers the hard skills the new role demands: budgeting, people management, stakeholder negotiation, board reporting. Identity addresses the internal shift required: a doctor must move from "I heal patients" to "I build a system that heals patients." Learning examines how the leader is acquiring new knowledge, whether through formal training, peer networks, or coaching. Trust maps the relationships the leader needs to rebuild in the new role. Integration assesses whether the leader's schedule, habits, and priorities have actually shifted to match the new remit.

A consultant deploying CILTI conducts a structured interview across all five dimensions, identifies the gaps, and builds a 90-day transition plan. In a ministry of health setting in Tanzania, this might mean pairing a newly appointed District Health Officer with a finance mentor, enrolling them in a public sector management short course, and creating weekly touchpoints with the regional health director to build trust upward.`,
          },
        ],
        exercises: [
          {
            title: 'Practice: CILTI Transition Audit',
            instruction: 'A senior nurse in a South African provincial hospital has been promoted to Operations Manager. Using the five CILTI dimensions, identify the two most likely gaps and design a 60-day onboarding plan.',
          },
        ],
      },
      resources: {
        links: [
          { title: 'CILTI Framework Overview', url: 'internal://knowledge/cilti-framework' },
          { title: 'Leadership Transition Toolkit', url: 'internal://knowledge/leadership-transition' },
        ],
        tools: ['CILTI Transition Audit Template', '90-Day Onboarding Planner', 'Stakeholder Trust Map'],
      },
    },
  })

  // Questions for Module 11.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m11_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'Which CILTI dimension addresses a doctor\'s internal shift from "I heal patients" to "I build a system that heals patients"?',
        options: JSON.stringify([
          { id: 'a', text: 'Capability', isCorrect: false },
          { id: 'b', text: 'Identity', isCorrect: true },
          { id: 'c', text: 'Trust', isCorrect: false },
          { id: 'd', text: 'Integration', isCorrect: false },
        ]),
        explanation: 'Identity is the dimension that captures the psychological and professional re-framing required when a technical expert transitions to a leadership role. Without this shift, new leaders revert to their technical comfort zone.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m11_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A newly promoted CMO in a Rwandan hospital continues to take on clinical caseload instead of managing department heads. Which CILTI dimension is most at risk?',
        options: JSON.stringify([
          { id: 'a', text: 'Learning', isCorrect: false },
          { id: 'b', text: 'Trust', isCorrect: false },
          { id: 'c', text: 'Integration', isCorrect: false },
          { id: 'd', text: 'Identity', isCorrect: true },
        ]),
        explanation: 'Continuing to operate in the previous role\'s tasks is a classic Identity gap. The leader has not yet internalised their new professional purpose, so they default to the role where they feel competent and valued.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m11_2.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are signs that a leadership transition is failing in a healthcare organisation? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'The promoted leader micromanages their former peers', isCorrect: true },
          { id: 'b', text: 'The leader attends board meetings and prepares financial reports on time', isCorrect: false },
          { id: 'c', text: 'The leader spends more than 50% of their time on tasks from their previous role', isCorrect: true },
          { id: 'd', text: 'Staff distrust the leader because they have not yet built upward or lateral relationships', isCorrect: true },
          { id: 'e', text: 'The leader asks for a formal mentor in the new role', isCorrect: false },
        ]),
        explanation: 'Micromanagement, reversion to previous-role tasks, and broken trust are hallmark failure signals. Seeking a mentor is a healthy signal, not a failure indicator.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m11_2.id,
        type: 'CASE_STUDY',
        question: 'A District Health Officer in Tanzania was appointed 4 months ago, previously a skilled epidemiologist. She is technically strong but her district team questions her authority, the regional director rarely responds to her reports, and she spends most of her time analysing surveillance data. Apply CILTI to diagnose the situation and propose a 90-day plan.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Dodoma Region, Tanzania. Newly appointed DHO, previously a senior epidemiologist at the national CDC. District team of 22 staff. She has produced detailed disease surveillance reports but has not held a staff performance review, submitted the quarterly budget return, or met her regional director in person.',
          data: {
            monthsInRole: 4,
            performanceReviewsConducted: 0,
            budgetReturnStatus: 'Overdue by 6 weeks',
            regionalDirectorMeetings: 0,
            surveillanceReportsProduced: 12,
          },
        }),
        explanation: 'A strong answer diagnoses: Capability gap (budget management, HR process), Identity gap (still acting as analyst, not district leader), Trust gap (no upward relationship with regional director, no downward credibility through performance management), and Integration gap (calendar dominated by analysis tasks). The 90-day plan should include: week 1 meeting with regional director, month 1 finance coaching with district accountant, month 2 first staff performance reviews, and a weekly schedule that caps surveillance analysis at 20% of time.',
        points: 5,
        order: 4,
      },
      {
        moduleId: m11_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'The Integration dimension of CILTI is best assessed by examining:',
        options: JSON.stringify([
          { id: 'a', text: 'The leader\'s formal qualifications for the new role', isCorrect: false },
          { id: 'b', text: 'Whether the leader\'s schedule and daily priorities reflect their new remit', isCorrect: true },
          { id: 'c', text: 'The number of stakeholders who trust the leader', isCorrect: false },
          { id: 'd', text: 'How many training courses the leader has completed since promotion', isCorrect: false },
        ]),
        explanation: 'Integration is about behavioural alignment: has the leader\'s actual use of time, energy, and attention shifted to match what the new role demands? A calendar audit is often the fastest diagnostic tool for this dimension.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log(`Track 11 seeded: ${healthcareHR.id}`)

  // ════════════════════════════════════════════════════════════════════════════
  // TRACK 12: SPECIALIST - Lean & Quality Improvement
  // ════════════════════════════════════════════════════════════════════════════

  const leanQuality = await prisma.trainingTrack.create({
    data: {
      name: 'Lean & Quality Improvement',
      slug: 'lean-quality-improvement',
      description: `Waste, rework, and process failure cost African health systems billions in avoidable spending every year. This track equips consultants with Lean and Six Sigma tools adapted for under-resourced clinical environments. Covers value stream mapping and waste elimination in hospital workflows, plus Six Sigma DMAIC methodology and QI tools for sustained quality gains. Designed for consultants supporting hospitals, clinics, and health system clients across sub-Saharan Africa.`,
      level: 'SPECIALIST',
      category: 'methodology',
      iconName: 'trending-up',
      colorHex: '#0369A1',
      prerequisites: ['healthcare-fundamentals'],
      estimatedHours: 26,
      sortOrder: 12,
    },
  })

  // ── Module 12.1: Lean Healthcare ───────────────────────────────────────────

  const m12_1 = await prisma.trainingModule.create({
    data: {
      trackId: leanQuality.id,
      name: 'Lean Healthcare',
      slug: 'lean-healthcare',
      description: 'Apply Lean principles and value stream mapping to eliminate waste and improve patient flow in African hospital and clinic settings.',
      order: 1,
      estimatedMinutes: 100,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'The Eight Wastes in African Healthcare',
            type: 'text',
            body: `Lean identifies eight categories of waste: defects, overproduction, waiting, non-utilised talent, transport, inventory, motion, and extra-processing (remembered with the acronym DOWNTIME). In African hospital settings, the dominant wastes are waiting, transport, and non-utilised talent. A patient at a Ugandan district hospital may wait 3 hours in triage, walk across a sprawling compound four times for tests and pharmacy, and be seen by a clinical officer when a specialist is idle in the next wing.

These wastes are not failures of individual staff but failures of process design. Lean's starting point is always the value stream: every step a patient or specimen travels, from entry to discharge. Steps that do not add clinical value are waste candidates. The goal is not to work harder but to remove friction so clinicians can spend more time on actual care.`,
          },
          {
            title: 'Value Stream Mapping in Practice',
            type: 'text',
            body: `A Value Stream Map (VSM) traces the current-state flow of a patient, sample, or document through a healthcare process. In a Nairobi outpatient clinic, a VSM of the morning consultation process might reveal: 40 minutes average wait at reception, 15-minute walk to the laboratory, 90-minute wait for results, and a return to a different queue for the prescribing clinician. Total patient time: 3.5 hours. Clinical value-add time: 22 minutes.

Drawing the current-state VSM with frontline staff creates a shared picture of waste without assigning blame. The future-state VSM then shows what the flow could look like with targeted changes: a pre-registration WhatsApp form to eliminate reception queues, a point-of-care rapid test to eliminate the lab walk, and a single clinician queue. In East and West African settings where mobile penetration is high, digital pre-registration is often the highest-leverage Lean intervention available.`,
          },
        ],
        exercises: [
          {
            title: 'Practice: Current-State VSM',
            instruction: 'A 60-bed clinic in Accra has a 4-hour average patient cycle time for a simple outpatient consultation. Walk through the DOWNTIME framework and identify the three most likely waste categories. Sketch a current-state VSM with at least 6 process steps.',
          },
        ],
      },
      resources: {
        links: [
          { title: 'Lean Healthcare Primer', url: 'internal://knowledge/lean-healthcare' },
          { title: 'VSM Templates for Clinics', url: 'internal://knowledge/vsm-templates' },
        ],
        tools: ['Value Stream Mapping Canvas', 'DOWNTIME Waste Checklist', 'Process Time Observation Sheet'],
      },
    },
  })

  // Questions for Module 12.1
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m12_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the DOWNTIME framework, which letter represents the waste of having skilled clinicians performing administrative tasks?',
        options: JSON.stringify([
          { id: 'a', text: 'D - Defects', isCorrect: false },
          { id: 'b', text: 'N - Non-utilised Talent', isCorrect: true },
          { id: 'c', text: 'T - Transport', isCorrect: false },
          { id: 'd', text: 'E - Extra-processing', isCorrect: false },
        ]),
        explanation: 'Non-utilised Talent (N) captures situations where skilled professionals perform tasks below their competency level, such as a doctor filing patient cards or a specialist sitting idle while a clinical officer handles referrals.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m12_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In a Nairobi clinic VSM example, total patient time was 3.5 hours but clinical value-add time was 22 minutes. The primary purpose of this analysis is to:',
        options: JSON.stringify([
          { id: 'a', text: 'Identify which staff members are underperforming', isCorrect: false },
          { id: 'b', text: 'Create a shared picture of process waste without assigning blame', isCorrect: true },
          { id: 'c', text: 'Justify reducing clinic staff headcount', isCorrect: false },
          { id: 'd', text: 'Prove that the clinic is financially inefficient', isCorrect: false },
        ]),
        explanation: 'VSM is a process design tool, not a performance management tool. Its value is in externalising waste so that frontline staff and management can redesign the process together, not in identifying individuals to blame.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m12_1.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following are high-leverage Lean interventions for an outpatient clinic in West Africa with high mobile phone penetration? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'WhatsApp-based pre-registration to reduce reception queues', isCorrect: true },
          { id: 'b', text: 'Hiring additional reception staff to process paperwork faster', isCorrect: false },
          { id: 'c', text: 'Point-of-care rapid testing to eliminate the laboratory transport waste', isCorrect: true },
          { id: 'd', text: 'Single patient queue for all clinicians to eliminate rerouting', isCorrect: true },
          { id: 'e', text: 'Extending clinic opening hours by 3 hours daily', isCorrect: false },
        ]),
        explanation: 'Lean interventions eliminate waste rather than add resources. Pre-registration, point-of-care testing, and queue redesign all remove non-value-add steps. Adding staff or hours treats capacity as the problem when flow is the problem.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m12_1.id,
        type: 'CASE_STUDY',
        question: 'A district hospital in Ethiopia has a theatre utilisation rate of 38% against a target of 70%. Surgeons complain of "no cases" in the morning while the ward is full of patients awaiting surgery. Apply the DOWNTIME framework to identify the most likely wastes and propose three Lean interventions.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Tigray Region district hospital, Ethiopia. 4 operating theatres, 2 surgeons, 6 nurses. Morning theatre sessions frequently start 90 minutes late. Consent forms are obtained on the morning of surgery. Instrument sterilisation is done in batches overnight only. Theatre roster is written by hand and distributed to wards by a runner each morning.',
          data: {
            theatreUtilisation: '38%',
            target: '70%',
            avgMorningStartDelay: '90 minutes',
            consentProcess: 'Day-of-surgery',
            sterilisationSchedule: 'Overnight batch only',
            rosterDistribution: 'Manual runner each morning',
          },
        }),
        explanation: 'Primary wastes: Waiting (90-minute late starts from day-of consent and no pre-op preparation), Extra-processing (manual roster, batch-only sterilisation), and Non-utilised Talent (surgeons idle while admin processes are completed). Three interventions: (1) consent on day before surgery during ward rounds, (2) two sterilisation cycles daily (morning and evening) to enable afternoon emergency add-ons, (3) WhatsApp or SMS theatre roster shared night before to all clinical staff.',
        points: 5,
        order: 4,
      },
      {
        moduleId: m12_1.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A Lean future-state VSM should primarily show:',
        options: JSON.stringify([
          { id: 'a', text: 'The ideal flow after targeted waste removal, used to design implementation steps', isCorrect: true },
          { id: 'b', text: 'The current process with all waste steps highlighted in red', isCorrect: false },
          { id: 'c', text: 'A benchmarked process from a hospital in a high-income country', isCorrect: false },
          { id: 'd', text: 'The minimum staffing required to run the process efficiently', isCorrect: false },
        ]),
        explanation: 'The future-state VSM is the design target: it shows what the process should look like after waste removal, and serves as the blueprint for the improvement plan. The current-state VSM documents the problem; the future-state VSM defines the solution.',
        points: 1,
        order: 5,
      },
    ],
  })

  // ── Module 12.2: Six Sigma & QI Tools ─────────────────────────────────────

  const m12_2 = await prisma.trainingModule.create({
    data: {
      trackId: leanQuality.id,
      name: 'Six Sigma & QI Tools',
      slug: 'six-sigma-qi-tools',
      description: 'Apply the DMAIC methodology and core quality improvement tools including fishbone analysis, run charts, and control charts to reduce clinical and operational defects in African health facilities.',
      order: 2,
      estimatedMinutes: 100,
      passingScore: 80,
      content: {
        sections: [
          {
            title: 'DMAIC: A Problem-Solving Structure for Healthcare',
            type: 'text',
            body: `Six Sigma\'s DMAIC cycle (Define, Measure, Analyse, Improve, Control) gives consultants a disciplined structure for complex quality problems that do not yield to simple Lean interventions. In healthcare, DMAIC is most valuable for problems where the root cause is unclear: high post-operative infection rates, persistent medication errors, or rising maternal near-miss events.

Define scopes the problem with precision: not "infections are high" but "post-caesarean wound infection rate at Muhimbili National Hospital is 14%, against a WHO benchmark of under 2%, costing an average of 8 additional bed-days per case." Measure establishes the current baseline with reliable data. Analyse identifies root causes using structured tools. Improve tests and implements solutions. Control embeds the change and monitors for regression.`,
          },
          {
            title: 'Core QI Tools: Fishbone, Run Charts, and Control Charts',
            type: 'text',
            body: `Three tools cover the majority of QI analysis needs in African health settings. The Ishikawa (fishbone) diagram organises potential root causes across six categories: Man, Machine, Method, Material, Measurement, and Environment. For a hospital in Abidjan investigating medication errors, a fishbone might reveal that "Method" (no standardised drug verification step) and "Environment" (poor lighting in the dispensary) are the primary causes, not staff incompetence.

Run charts plot a quality metric over time on a simple line graph. They reveal whether a problem is worsening, stable, or improving, and whether an intervention actually changed the trend. Control charts add statistical upper and lower control limits, enabling teams to distinguish normal process variation from signals that something has changed. In a Kampala hospital tracking hand hygiene compliance, a control chart would distinguish a genuine improvement from a random good week.`,
          },
        ],
        exercises: [
          {
            title: 'Practice: DMAIC Problem Statement',
            instruction: 'A hospital in Kumasi, Ghana reports a 22% medication error rate in its inpatient pharmacy. Write a precise DMAIC Define statement including: the problem, the scope, the baseline metric, the benchmark, and the business/patient impact.',
          },
        ],
      },
      resources: {
        links: [
          { title: 'DMAIC Toolkit for Healthcare', url: 'internal://knowledge/dmaic-healthcare' },
          { title: 'QI Tools Reference Guide', url: 'internal://knowledge/qi-tools-guide' },
        ],
        tools: ['Fishbone Diagram Template', 'Run Chart Builder', 'DMAIC Project Charter'],
      },
    },
  })

  // Questions for Module 12.2
  await prisma.trainingQuestion.createMany({
    data: [
      {
        moduleId: m12_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'In the DMAIC cycle, which phase establishes a precise, data-backed problem statement before any analysis begins?',
        options: JSON.stringify([
          { id: 'a', text: 'Measure', isCorrect: false },
          { id: 'b', text: 'Define', isCorrect: true },
          { id: 'c', text: 'Analyse', isCorrect: false },
          { id: 'd', text: 'Control', isCorrect: false },
        ]),
        explanation: 'The Define phase scopes the problem with quantitative precision before any data collection or root cause analysis. A vague problem statement leads to unfocused measurement and misdirected improvement efforts.',
        points: 1,
        order: 1,
      },
      {
        moduleId: m12_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A fishbone diagram investigating medication errors in an Abidjan hospital finds the primary causes under "Method" and "Environment." This most likely means:',
        options: JSON.stringify([
          { id: 'a', text: 'Individual nurses should be disciplined for the errors', isCorrect: false },
          { id: 'b', text: 'The pharmacy should be relocated to a larger building', isCorrect: false },
          { id: 'c', text: 'Process redesign (verification steps) and physical environment improvements (lighting) are the priority interventions', isCorrect: true },
          { id: 'd', text: 'The hospital needs to hire more pharmacists', isCorrect: false },
        ]),
        explanation: 'Fishbone analysis points to systemic root causes, not individual failures. Method and Environment causes call for process redesign and environmental fixes, not staffing or disciplinary responses.',
        points: 1,
        order: 2,
      },
      {
        moduleId: m12_2.id,
        type: 'MULTI_SELECT',
        question: 'Which of the following problems would most benefit from a full DMAIC approach rather than a simple Lean intervention? (Select all that apply)',
        options: JSON.stringify([
          { id: 'a', text: 'Post-caesarean wound infection rate 7x higher than WHO benchmark with unclear root cause', isCorrect: true },
          { id: 'b', text: 'Pharmacy queue taking 45 minutes due to a manual paper-based dispensing log', isCorrect: false },
          { id: 'c', text: 'Persistent medication errors despite two previous improvement attempts', isCorrect: true },
          { id: 'd', text: 'Theatre starting 90 minutes late due to consent obtained on the day of surgery', isCorrect: false },
          { id: 'e', text: 'Rising maternal near-miss events with no obvious single cause', isCorrect: true },
        ]),
        explanation: 'DMAIC is most valuable when root causes are unclear or when prior improvement attempts have failed. Clear, single-cause process problems (queue, theatre delay) are better addressed with Lean\'s lighter-touch VSM approach.',
        points: 3,
        order: 3,
      },
      {
        moduleId: m12_2.id,
        type: 'CASE_STUDY',
        question: 'A hospital in Dar es Salaam has a post-caesarean wound infection rate of 18% (WHO benchmark: under 2%). Three previous improvement initiatives failed to sustain results. Apply DMAIC: write the Define statement, propose three Measure data points, identify two likely root causes using the fishbone categories, and describe one Control mechanism.',
        options: undefined,
        caseStudy: JSON.stringify({
          scenario: 'Muhimbili-affiliated district hospital, Dar es Salaam. 800 caesarean sections per year. Current wound infection rate: 18%. WHO benchmark: <2%. Average additional length of stay per infected case: 7 days. Three prior QI initiatives (hand hygiene campaign, antibiotic protocol update, staff training) showed short-term improvement but infections returned within 3 months each time.',
          data: {
            annualCaesareans: 800,
            infectionRate: '18%',
            WHObenchmark: '<2%',
            extraBedsPerCase: '7 days',
            priorInitiatives: 3,
            sustainabilityOfPriorGains: 'None beyond 3 months',
          },
        }),
        explanation: 'Define: "Post-caesarean wound infection rate at [hospital] is 18%, against a WHO benchmark of <2%, generating approximately 1,008 excess bed-days annually and placing patients at risk of sepsis." Measure: (1) pre-operative skin prep compliance rate, (2) time from skin incision to wound closure (as proxy for contamination exposure), (3) post-discharge wound review attendance rate. Root causes (fishbone): Method (no standardised wound care protocol post-discharge), Environment (theatre ventilation and air quality not maintained). Control: monthly wound infection rate displayed on a control chart in the theatre suite, with a designated QI nurse reviewing any data point outside control limits within 48 hours.',
        points: 5,
        order: 4,
      },
      {
        moduleId: m12_2.id,
        type: 'MULTIPLE_CHOICE',
        question: 'A control chart tracking hand hygiene compliance at a Kampala hospital shows a data point far above the upper control limit following a new training programme. This most likely indicates:',
        options: JSON.stringify([
          { id: 'a', text: 'A random good week that is within normal process variation', isCorrect: false },
          { id: 'b', text: 'A data recording error that should be discarded', isCorrect: false },
          { id: 'c', text: 'A genuine signal that something has changed in the process', isCorrect: true },
          { id: 'd', text: 'The control limits need to be recalibrated downward', isCorrect: false },
        ]),
        explanation: 'A data point outside the statistical control limits is a signal, not noise. Following a specific intervention (training programme), a point above the upper control limit indicates the intervention likely caused a real change in compliance behaviour, warranting investigation to understand and sustain it.',
        points: 1,
        order: 5,
      },
    ],
  })

  console.log(`Track 12 seeded: ${leanQuality.id}`)

  console.log('\nSpecialist Level Tracks 11-12 seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
