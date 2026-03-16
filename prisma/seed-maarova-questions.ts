/**
 * Seed script: Maarova Assessment Questions
 *
 * Populates all six Maarova assessment modules with psychometrically
 * sound questions tailored to African healthcare leadership contexts.
 *
 * Run with: npx tsx prisma/seed-maarova-questions.ts
 */

import { PrismaClient, MaarovaQuestionFormat } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionInput {
  format: MaarovaQuestionFormat;
  text: string;
  options: unknown;
  dimension?: string;
  subDimension?: string;
  isReversed?: boolean;
  weight?: number;
  order: number;
}

interface GroupInput {
  name: string;
  description?: string;
  context?: string;
  order: number;
  questions: QuestionInput[];
}

// ---------------------------------------------------------------------------
// Helper: seed one module
// ---------------------------------------------------------------------------

async function seedModule(slug: string, groups: GroupInput[]) {
  const mod = await prisma.maarovaModule.findUnique({ where: { slug } });
  if (!mod) {
    console.warn(`Module "${slug}" not found -- skipping`);
    return;
  }

  // Delete existing groups (cascades to questions)
  await prisma.maarovaQuestionGroup.deleteMany({
    where: { moduleId: mod.id },
  });

  for (const g of groups) {
    await prisma.maarovaQuestionGroup.create({
      data: {
        moduleId: mod.id,
        name: g.name,
        description: g.description ?? null,
        context: g.context ?? null,
        order: g.order,
        questions: {
          create: g.questions.map((q) => ({
            format: q.format,
            text: q.text,
            options: q.options as any,
            dimension: q.dimension ?? null,
            subDimension: q.subDimension ?? null,
            isReversed: q.isReversed ?? false,
            weight: q.weight ?? 1,
            order: q.order,
          })),
        },
      },
    });
  }

  const count = groups.reduce((s, g) => s + g.questions.length, 0);
  console.log(`  ${slug}: ${count} questions across ${groups.length} groups`);
}

// ---------------------------------------------------------------------------
// Module 1 -- DISC  (slug: "disc")
// 7 groups x 4 forced-choice questions = 28 questions
// ---------------------------------------------------------------------------

function discOptions(d: string, i: string, s: string, c: string) {
  return [
    { label: d, dimension: "D" },
    { label: i, dimension: "I" },
    { label: s, dimension: "S" },
    { label: c, dimension: "C" },
  ];
}

const discGroups: GroupInput[] = [
  {
    name: "Decision Making",
    description:
      "How you approach decisions in clinical and administrative settings.",
    order: 1,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "During a ward-round crisis where a patient's condition deteriorates rapidly, I am most likely to:",
        options: discOptions(
          "Take immediate command and direct the team on next steps",
          "Rally the team with encouragement and maintain morale",
          "Calmly follow established resuscitation protocols step by step",
          "Analyse the vital signs and lab data before deciding on intervention"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a hospital board requests an urgent decision on capital expenditure for new theatre equipment, I tend to:",
        options: discOptions(
          "Present a firm recommendation and push for swift approval",
          "Facilitate a lively discussion to build consensus among board members",
          "Consult widely with department heads to ensure everyone is comfortable",
          "Prepare a detailed cost-benefit analysis with risk projections"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When faced with conflicting diagnostic opinions between consultants, I prefer to:",
        options: discOptions(
          "Make the final call quickly to avoid delays in patient care",
          "Bring the consultants together and mediate a collaborative review",
          "Allow the more senior clinician to guide the decision",
          "Request additional investigations to resolve the disagreement with evidence"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When deciding whether to adopt a new clinical guideline from the WHO Africa Regional Office, I would:",
        options: discOptions(
          "Champion the change and set a firm implementation deadline",
          "Organise a launch event to generate excitement among clinical staff",
          "Pilot the guideline on one ward first and gather feedback before scaling",
          "Benchmark the guideline against local disease burden data before committing"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Communication Style",
    description:
      "How you communicate with colleagues, patients, and stakeholders.",
    order: 2,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When presenting the quarterly clinical governance report to hospital leadership, I tend to:",
        options: discOptions(
          "Focus on outcomes and bold recommendations for immediate action",
          "Use stories of patient impact to inspire and energise the audience",
          "Present a balanced view, acknowledging contributions from every department",
          "Rely on charts, data tables, and statistical comparisons"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a junior doctor approaches me with a concern about workload, I am most likely to:",
        options: discOptions(
          "Give direct advice and clear actions they should take right away",
          "Listen enthusiastically and help them see the bigger career opportunity",
          "Offer patient, supportive listening and reassure them of my availability",
          "Help them map out a structured plan with timelines and milestones"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "In a multi-disciplinary team meeting discussing patient discharge planning, I usually:",
        options: discOptions(
          "Drive the agenda and keep discussion focused on discharge targets",
          "Encourage open sharing of ideas and celebrate the team's progress",
          "Ensure every discipline has an opportunity to voice concerns",
          "Focus on discharge criteria checklists and compliance documentation"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When relaying difficult news about budget cuts to department heads, I prefer to:",
        options: discOptions(
          "Be direct about the situation and outline what must change immediately",
          "Frame the challenge as a shared opportunity to innovate together",
          "Deliver the news gently, emphasising support available during the transition",
          "Provide a detailed breakdown of the figures and the rationale behind each cut"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Team Leadership",
    description:
      "How you lead and organise teams within healthcare settings.",
    order: 3,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When building a project team for a new maternal health outreach programme, I prefer to:",
        options: discOptions(
          "Handpick high performers and set ambitious targets from day one",
          "Assemble a diverse group and build excitement around the shared mission",
          "Select dependable team members who work well together and value stability",
          "Define clear roles, responsibilities, and reporting structures before recruitment"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a nursing team falls behind on their patient documentation targets, I would:",
        options: discOptions(
          "Set a non-negotiable deadline and hold individuals accountable",
          "Motivate the team with recognition for improvements and celebrate quick wins",
          "Work alongside the team to understand barriers and offer hands-on support",
          "Review the documentation workflow and identify process bottlenecks"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "My approach to mentoring clinical officers in a district hospital is to:",
        options: discOptions(
          "Set stretch goals and challenge them to take on responsibilities beyond their level",
          "Build strong personal relationships and connect them with influential networks",
          "Provide consistent, reliable guidance at a pace that suits each individual",
          "Create structured learning plans with measurable competency milestones"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When delegating responsibilities for a hospital accreditation audit, I tend to:",
        options: discOptions(
          "Assign tasks decisively and expect them completed without micromanagement",
          "Inspire ownership by connecting each task to the hospital's vision and reputation",
          "Check in frequently to ensure team members feel supported and confident",
          "Create a detailed task matrix with deadlines, dependencies, and quality criteria"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Conflict Resolution",
    description:
      "How you handle disagreements and tensions in healthcare environments.",
    order: 4,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When two consultants have a public disagreement about treatment protocol during a grand round, I would:",
        options: discOptions(
          "Intervene firmly and redirect focus to the evidence and the patient's welfare",
          "Use humour and diplomacy to defuse the tension and restore collegial spirit",
          "Speak privately with each party afterwards to mediate a resolution",
          "Review the clinical evidence for both positions and present an objective comparison"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a senior nurse challenges my clinical decision in front of the care team, I would:",
        options: discOptions(
          "Stand firm on my decision while acknowledging their experience",
          "Openly welcome the challenge and turn it into a learning moment for all",
          "Acknowledge their viewpoint calmly and suggest a private follow-up discussion",
          "Ask them to present the data that supports their alternative approach"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When there is tension between clinical and administrative departments over resource allocation, I prefer to:",
        options: discOptions(
          "Make a definitive resource allocation decision and communicate it clearly",
          "Bring both sides together for a creative brainstorm on shared solutions",
          "Facilitate a structured dialogue ensuring both departments feel heard",
          "Present utilisation data and patient outcome metrics to guide the decision"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a community health worker reports that traditional leaders are resisting a vaccination campaign, I would:",
        options: discOptions(
          "Meet the traditional leaders directly and persuade them with clear health arguments",
          "Organise a community dialogue event that brings leaders and health workers together",
          "Build a relationship gradually by having respected local champions engage first",
          "Gather data on vaccine-preventable disease burden to present a compelling case"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Change Management",
    description:
      "How you approach and lead organisational change in healthcare.",
    order: 5,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When implementing a new electronic health records system across a teaching hospital, I would:",
        options: discOptions(
          "Set an aggressive go-live date and drive the transition with urgency",
          "Create excitement through demonstrations and champion stories from early adopters",
          "Phase the rollout gradually, ensuring each department is comfortable before moving on",
          "Develop a detailed implementation plan with risk mitigation for every workflow"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When staff resist a new infection prevention and control protocol, my first response is to:",
        options: discOptions(
          "Enforce compliance and make clear the consequences of non-adherence",
          "Share compelling patient stories that illustrate why the protocol matters",
          "Listen to their concerns and adjust the implementation timeline if needed",
          "Present the evidence base and infection rate data that justify the change"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When leading a hospital merger in a rapidly growing African city, I focus first on:",
        options: discOptions(
          "Establishing a clear command structure and making rapid integration decisions",
          "Building a shared vision and culture that excites staff from both institutions",
          "Ensuring job security messaging and pastoral support for anxious employees",
          "Mapping every process, system, and governance structure for systematic alignment"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a government policy suddenly changes pharmaceutical procurement rules, I would:",
        options: discOptions(
          "Act decisively to secure essential stock before competitors react",
          "Convene a stakeholder group to collaboratively navigate the new landscape",
          "Work steadily through the new requirements, keeping the team calm and informed",
          "Study the policy document thoroughly and create a compliance checklist"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Stakeholder Management",
    description:
      "How you manage relationships with diverse healthcare stakeholders.",
    order: 6,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a major donor organisation requests changes to a health programme's design, I tend to:",
        options: discOptions(
          "Negotiate firmly for what I believe serves patients best",
          "Find creative compromises that keep the donor excited and engaged",
          "Accommodate their requests where reasonable, maintaining a good relationship",
          "Evaluate the proposed changes against programme objectives and outcome data"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When managing expectations of a state Ministry of Health during a health systems strengthening project, I prefer to:",
        options: discOptions(
          "Set clear deliverables and hold all parties accountable to timelines",
          "Build personal rapport with key officials and maintain regular informal contact",
          "Be responsive and accommodating to the ministry's evolving priorities",
          "Provide detailed progress reports with evidence-based recommendations"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When a patient advocacy group publicly criticises the hospital's waiting times, I would:",
        options: discOptions(
          "Issue a direct public response outlining immediate corrective actions",
          "Invite the advocacy group for a collaborative town hall meeting",
          "Reach out privately to the group's leaders to understand their concerns",
          "Compile waiting time data, identify root causes, and share a detailed improvement plan"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When building partnerships with pharmaceutical companies for a clinical trial in sub-Saharan Africa, I focus on:",
        options: discOptions(
          "Negotiating the best terms and ensuring the institution's interests are protected",
          "Building enthusiasm around the research potential and networking opportunities",
          "Ensuring all parties feel valued and building long-term trust",
          "Reviewing every clause of the agreement and ensuring regulatory compliance"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
  {
    name: "Work Approach",
    description:
      "How you organise and approach your daily work and long-term responsibilities.",
    order: 7,
    questions: [
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When planning the annual clinical audit programme for my department, I prefer to:",
        options: discOptions(
          "Set ambitious targets and challenge the team to exceed last year's results",
          "Make the process engaging with interactive workshops and peer recognition",
          "Follow a proven methodology and maintain consistency with previous years",
          "Design a systematic framework with detailed timelines and measurement criteria"
        ),
        dimension: "disc",
        order: 1,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When my schedule is overloaded with clinical duties, administrative tasks, and teaching commitments, I tend to:",
        options: discOptions(
          "Prioritise ruthlessly and delegate everything that others can handle",
          "Stay flexible, energised, and find ways to make each commitment enjoyable",
          "Maintain my routine, working steadily through each task without complaint",
          "Create a detailed priority matrix to optimise my time allocation"
        ),
        dimension: "disc",
        order: 2,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When developing a quality improvement initiative for reducing hospital-acquired infections, I would:",
        options: discOptions(
          "Set a bold target, assign ownership, and drive results aggressively",
          "Engage frontline staff with a campaign that makes hand hygiene exciting",
          "Build on existing protocols and make incremental, sustainable improvements",
          "Conduct a root cause analysis and design interventions based on the evidence"
        ),
        dimension: "disc",
        order: 3,
      },
      {
        format: "FORCED_CHOICE_PAIR",
        text: "When preparing for an important presentation to the National Health Insurance Authority, I would:",
        options: discOptions(
          "Focus on key outcomes and a strong, confident delivery",
          "Craft a narrative that connects emotionally and builds enthusiasm for the proposal",
          "Rehearse thoroughly to ensure a smooth, error-free presentation",
          "Prepare comprehensive data, anticipate every question, and bring backup slides"
        ),
        dimension: "disc",
        order: 4,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module 2 -- VALUES_DRIVERS  (slug: "values-drivers")
// 2 groups x 6 ranking questions = 12 questions
// ---------------------------------------------------------------------------

function rankingOptions() {
  return [
    { label: "Advancing medical knowledge and evidence-based practice", dimension: "theoretical" },
    { label: "Achieving financial sustainability and resource efficiency", dimension: "economic" },
    { label: "Creating a healing environment and patient-centred experience", dimension: "aesthetic" },
    { label: "Serving communities and reducing health inequities", dimension: "social" },
    { label: "Building institutional influence and strategic leadership", dimension: "political" },
    { label: "Ensuring compliance with clinical standards and governance", dimension: "regulatory" },
  ];
}

const valuesDriversGroups: GroupInput[] = [
  {
    name: "Professional Values",
    description:
      "Rank these motivations in order of personal importance to you as a healthcare leader.",
    order: 1,
    questions: [
      {
        format: "RANKING",
        text: "When choosing which hospital improvement project to champion next, I prioritise:",
        options: [
          { label: "Implementing the latest evidence-based clinical guidelines", dimension: "theoretical" },
          { label: "Projects that will improve revenue and reduce waste", dimension: "economic" },
          { label: "Redesigning patient journeys for comfort and dignity", dimension: "aesthetic" },
          { label: "Expanding access for underserved populations in my catchment area", dimension: "social" },
          { label: "Initiatives that raise the hospital's national profile and my department's standing", dimension: "political" },
          { label: "Strengthening compliance with MDCN, PCN, and accreditation standards", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 1,
      },
      {
        format: "RANKING",
        text: "What I find most rewarding about my role in healthcare leadership is:",
        options: [
          { label: "Contributing to research that advances clinical understanding", dimension: "theoretical" },
          { label: "Delivering a financially viable health service against all odds", dimension: "economic" },
          { label: "Seeing a well-designed ward that promotes healing and wellbeing", dimension: "aesthetic" },
          { label: "Knowing my work directly improves outcomes for vulnerable patients", dimension: "social" },
          { label: "Influencing health policy and shaping the direction of the institution", dimension: "political" },
          { label: "Maintaining the highest possible clinical governance standards", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 2,
      },
      {
        format: "RANKING",
        text: "When mentoring the next generation of healthcare leaders, I emphasise:",
        options: [
          { label: "The importance of staying current with global medical literature", dimension: "theoretical" },
          { label: "Understanding hospital finance, billing systems, and cost management", dimension: "economic" },
          { label: "Designing services that respect patient dignity and cultural context", dimension: "aesthetic" },
          { label: "Commitment to health equity and serving those most in need", dimension: "social" },
          { label: "Building networks, influence, and strategic career positioning", dimension: "political" },
          { label: "Mastering clinical governance, risk management, and regulatory compliance", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 3,
      },
      {
        format: "RANKING",
        text: "If I had unrestricted funding for one hospital initiative, I would invest in:",
        options: [
          { label: "A state-of-the-art clinical research and simulation centre", dimension: "theoretical" },
          { label: "Revenue cycle optimisation and operational efficiency technology", dimension: "economic" },
          { label: "A complete facility redesign focused on the patient and family experience", dimension: "aesthetic" },
          { label: "Community health outreach programmes reaching remote areas", dimension: "social" },
          { label: "A leadership development academy to grow institutional influence", dimension: "political" },
          { label: "An integrated quality management and accreditation readiness system", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 4,
      },
      {
        format: "RANKING",
        text: "The achievement I would be most proud of at the end of my career is:",
        options: [
          { label: "Publishing landmark research that changed clinical practice in Africa", dimension: "theoretical" },
          { label: "Turning around a financially distressed hospital into a sustainable institution", dimension: "economic" },
          { label: "Building a hospital environment recognised for its excellence in patient experience", dimension: "aesthetic" },
          { label: "Measurably reducing maternal or child mortality in my region", dimension: "social" },
          { label: "Serving on national health policy committees and shaping health legislation", dimension: "political" },
          { label: "Achieving international accreditation for a Nigerian or African hospital", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 5,
      },
      {
        format: "RANKING",
        text: "When evaluating a potential partnership with an international health organisation, I weigh most heavily:",
        options: [
          { label: "Access to the latest research, training, and knowledge exchange", dimension: "theoretical" },
          { label: "Financial sustainability and fair economic terms of the partnership", dimension: "economic" },
          { label: "Alignment with our values around patient-centred, culturally appropriate care", dimension: "aesthetic" },
          { label: "Impact on health outcomes for the communities we serve", dimension: "social" },
          { label: "The strategic positioning and prestige the partnership brings", dimension: "political" },
          { label: "Compliance requirements and alignment with local regulatory frameworks", dimension: "regulatory" },
        ],
        dimension: "values",
        order: 6,
      },
    ],
  },
  {
    name: "Leadership Drivers",
    description:
      "Rank what drives your leadership decisions in healthcare settings.",
    order: 2,
    questions: [
      {
        format: "RANKING",
        text: "When I have a free weekend, I am most drawn to:",
        options: [
          { label: "Reading the latest journals or attending an online clinical seminar", dimension: "theoretical" },
          { label: "Reviewing my department's financial dashboards and planning efficiencies", dimension: "economic" },
          { label: "Visiting other hospitals to observe their environment and design choices", dimension: "aesthetic" },
          { label: "Volunteering at a community health outreach or charity clinic", dimension: "social" },
          { label: "Attending a networking event or professional association meeting", dimension: "political" },
          { label: "Reviewing policies, SOPs, or accreditation documentation", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 1,
      },
      {
        format: "RANKING",
        text: "In a leadership retreat, the session I would find most valuable is:",
        options: [
          { label: "Evidence-based medicine updates and research methodology", dimension: "theoretical" },
          { label: "Hospital financial management and revenue diversification", dimension: "economic" },
          { label: "Design thinking for healthcare innovation and patient experience", dimension: "aesthetic" },
          { label: "Community health impact measurement and social determinants of health", dimension: "social" },
          { label: "Strategic influence, board dynamics, and health policy advocacy", dimension: "political" },
          { label: "Risk management frameworks and regulatory compliance masterclass", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 2,
      },
      {
        format: "RANKING",
        text: "When a crisis hits my hospital, the first thing I focus on is:",
        options: [
          { label: "What does the clinical evidence say about the best response?", dimension: "theoretical" },
          { label: "What are the financial implications and how do we protect the bottom line?", dimension: "economic" },
          { label: "How do we maintain a calm, reassuring environment for patients and families?", dimension: "aesthetic" },
          { label: "How do we protect the most vulnerable patients and community members?", dimension: "social" },
          { label: "How do we manage the messaging and maintain institutional reputation?", dimension: "political" },
          { label: "What do the incident response protocols and regulations require?", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 3,
      },
      {
        format: "RANKING",
        text: "The healthcare leader I most admire is someone who:",
        options: [
          { label: "Made groundbreaking contributions to medical science", dimension: "theoretical" },
          { label: "Built a financially sustainable healthcare institution from nothing", dimension: "economic" },
          { label: "Transformed the patient experience and humanised healthcare delivery", dimension: "aesthetic" },
          { label: "Dedicated their career to serving underserved communities", dimension: "social" },
          { label: "Rose to national influence and shaped health policy for millions", dimension: "political" },
          { label: "Set the gold standard for clinical governance and safety culture", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 4,
      },
      {
        format: "RANKING",
        text: "When recruiting a new senior clinician, I value most:",
        options: [
          { label: "Their academic credentials, publications, and commitment to evidence", dimension: "theoretical" },
          { label: "Their ability to generate revenue and manage resources efficiently", dimension: "economic" },
          { label: "Their bedside manner and commitment to holistic, compassionate care", dimension: "aesthetic" },
          { label: "Their track record of community service and pro-bono work", dimension: "social" },
          { label: "Their professional networks, reputation, and ability to attract referrals", dimension: "political" },
          { label: "Their attention to protocols, documentation, and regulatory compliance", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 5,
      },
      {
        format: "RANKING",
        text: "When measuring my department's success at year-end, I give most weight to:",
        options: [
          { label: "Research outputs, audit completions, and guideline adherence rates", dimension: "theoretical" },
          { label: "Revenue targets met, cost savings achieved, and budget discipline", dimension: "economic" },
          { label: "Patient satisfaction scores and complaints reduction", dimension: "aesthetic" },
          { label: "Community health impact indicators and outreach coverage", dimension: "social" },
          { label: "National rankings, media coverage, and stakeholder relationships strengthened", dimension: "political" },
          { label: "Compliance scores, incident rates, and accreditation readiness", dimension: "regulatory" },
        ],
        dimension: "drivers",
        order: 6,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module 3 -- EMOTIONAL_INTEL  (slug: "eq")
// 4 groups x 5 scenario questions = 20 questions
// ---------------------------------------------------------------------------

function eqOptions(
  dim: string,
  best: string,
  good: string,
  fair: string,
  poor: string
) {
  return [
    { label: best, eqDimension: dim, weight: 5 },
    { label: good, eqDimension: dim, weight: 4 },
    { label: fair, eqDimension: dim, weight: 2 },
    { label: poor, eqDimension: dim, weight: 1 },
  ];
}

const eqGroups: GroupInput[] = [
  {
    name: "Self-Awareness Scenarios",
    description: "How well you recognise and understand your own emotions in professional healthcare situations.",
    context:
      "You are a clinical director in a busy tertiary hospital in Lagos. You carry both clinical and administrative responsibilities, and the demands on your time are relentless. These scenarios explore how you manage your inner emotional landscape.",
    order: 1,
    questions: [
      {
        format: "SCENARIO_RESPONSE",
        text: "You receive feedback from a 360-degree review that your team finds you unapproachable during peak clinical hours. You are surprised, as you consider yourself open. What do you do?",
        options: eqOptions(
          "self_awareness",
          "Reflect honestly on what behaviours might create that impression and ask a trusted colleague for specific examples",
          "Schedule time to review the feedback in detail and journal about how it makes you feel before responding",
          "Tell yourself it is simply the pressure of the environment and carry on as before",
          "Dismiss the feedback as coming from staff who do not understand the demands of your role"
        ),
        dimension: "self_awareness",
        order: 1,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "During a morbidity and mortality conference, a case you managed is reviewed and a colleague suggests your decision may have contributed to a poor outcome. You feel your face flush with defensiveness. What do you do?",
        options: eqOptions(
          "self_awareness",
          "Acknowledge to yourself that you are feeling defensive, take a breath, and ask the colleague to elaborate on their clinical reasoning",
          "Recognise the emotion but stay quiet during the meeting, then reflect on the feedback privately",
          "Immediately counter with a detailed justification of your clinical decision",
          "Shut down the discussion by pointing out that the colleague was not present during the case"
        ),
        dimension: "self_awareness",
        order: 2,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "You notice that you have been snapping at nursing staff all morning. On reflection, you realise you are anxious about a pending hospital board meeting where budget cuts will be discussed. What do you do?",
        options: eqOptions(
          "self_awareness",
          "Apologise to the nursing staff, name the source of your anxiety, and take steps to prepare for the board meeting",
          "Recognise the connection between your anxiety and your behaviour and make a conscious effort to be kinder",
          "Push through the morning hoping the mood will pass on its own",
          "Blame the nursing staff for being oversensitive during a stressful period"
        ),
        dimension: "self_awareness",
        order: 3,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A pharma representative praises your department effusively and offers an all-expenses-paid conference in Dubai. You feel flattered. What do you do?",
        options: eqOptions(
          "self_awareness",
          "Notice the flattery and how it makes you feel, then evaluate the offer strictly against your institution's conflict of interest policy",
          "Feel pleased but check the ethical guidelines before accepting",
          "Accept the offer because your department deserves recognition",
          "Accept immediately and tell colleagues about the opportunity"
        ),
        dimension: "self_awareness",
        order: 4,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "You are passed over for appointment as Chief Medical Director in favour of a less experienced colleague. You feel a mix of anger and self-doubt. What do you do?",
        options: eqOptions(
          "self_awareness",
          "Allow yourself to feel the disappointment fully, then seek honest feedback on areas for growth from a mentor",
          "Write down your feelings and give yourself a few days before responding to anyone",
          "Complain privately to close colleagues about the unfairness of the process",
          "Immediately start looking for opportunities at another institution"
        ),
        dimension: "self_awareness",
        order: 5,
      },
    ],
  },
  {
    name: "Empathy Scenarios",
    description: "How well you perceive and respond to the emotions and needs of others.",
    context:
      "You are the head of a department in a public teaching hospital in Nairobi. Your team comprises consultants, registrars, nurses, pharmacists, and community health workers from diverse ethnic backgrounds and career stages.",
    order: 2,
    questions: [
      {
        format: "SCENARIO_RESPONSE",
        text: "A registrar who recently lost a parent to cancer becomes visibly emotional when a terminally ill patient's family asks about prognosis. The registrar excuses themselves from the consultation. What do you do?",
        options: eqOptions(
          "empathy",
          "Follow the registrar, acknowledge what you observed, and gently explore how they are coping with their grief alongside clinical duties",
          "Ask a senior colleague to check on the registrar and ensure they have access to the staff counselling service",
          "Cover the consultation yourself and speak to the registrar later about professionalism",
          "Make a note to discuss it at the next supervision meeting without addressing it now"
        ),
        dimension: "empathy",
        order: 1,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A nurse from a rural background is consistently quiet in multi-disciplinary team meetings, even though she has excellent clinical instincts. Other team members sometimes talk over her. What do you do?",
        options: eqOptions(
          "empathy",
          "Speak with her privately to understand what holds her back, and actively create space for her contributions in meetings",
          "Direct questions to her during meetings to help her voice be heard",
          "Encourage the whole team to be more inclusive without singling anyone out",
          "Assume she will speak up when she has something important to say"
        ),
        dimension: "empathy",
        order: 2,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A patient's family from a rural community insists on consulting a traditional healer before consenting to surgery. Your surgical team is frustrated by the delay. What do you do?",
        options: eqOptions(
          "empathy",
          "Take time to understand the family's cultural beliefs, explain the clinical urgency compassionately, and explore whether both can be accommodated",
          "Arrange for the hospital chaplain or social worker to mediate between the family's beliefs and the clinical plan",
          "Explain the risks of delay firmly but politely and ask them to decide quickly",
          "Tell the family that traditional medicine has no place in evidence-based care"
        ),
        dimension: "empathy",
        order: 3,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A junior doctor confides that they are struggling financially and considering leaving medicine for a better-paying career. They seem ashamed. What do you do?",
        options: eqOptions(
          "empathy",
          "Listen without judgement, validate the difficulty of their situation, and help them explore options including moonlighting policies or hardship funds",
          "Share your own experiences of financial hardship early in your career to normalise their feelings",
          "Encourage them to stay in medicine because it is a noble calling",
          "Suggest they should have planned their finances better before entering residency"
        ),
        dimension: "empathy",
        order: 4,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "Your hospital CEO, who is normally composed, becomes unusually short-tempered during a leadership meeting. Others look uncomfortable. What do you do?",
        options: eqOptions(
          "empathy",
          "After the meeting, check in privately and offer support without assuming you know what is wrong",
          "Send a brief, warm message after the meeting acknowledging that it seemed like a tough day",
          "Ignore it and focus on the agenda items that need resolution",
          "Mention it to other leadership team members to see if they know what is happening"
        ),
        dimension: "empathy",
        order: 5,
      },
    ],
  },
  {
    name: "Social Skills Scenarios",
    description: "How effectively you manage relationships, influence others, and navigate social dynamics.",
    context:
      "You are a hospital medical director navigating complex relationships between clinicians, administrators, government officials, community leaders, and international development partners in an East African health system.",
    order: 3,
    questions: [
      {
        format: "SCENARIO_RESPONSE",
        text: "You need to convince a group of specialist consultants to adopt a new theatre scheduling system that will reduce their personal flexibility but improve patient access. What approach do you take?",
        options: eqOptions(
          "social_skills",
          "Meet influential consultants individually first to understand their concerns, co-design solutions, then present the system as a shared initiative",
          "Present the patient access data at a department meeting and invite the consultants to propose their own improvements",
          "Announce the change with a clear rationale and a fixed implementation date",
          "Implement the system without consultation, knowing resistance will fade once they see the benefits"
        ),
        dimension: "social_skills",
        order: 1,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A prominent community leader publicly accuses your hospital of neglecting patients from his ethnic group. The accusation is unfounded but gaining traction on social media. What do you do?",
        options: eqOptions(
          "social_skills",
          "Request a private meeting with the leader to listen, share disaggregated patient data, and jointly develop a community engagement plan",
          "Issue a factual public statement with data, and invite the community leader for a hospital tour",
          "Ignore the social media noise, knowing the truth will emerge",
          "Publicly challenge the accusation with a strong rebuttal"
        ),
        dimension: "social_skills",
        order: 2,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "During a multi-stakeholder meeting on maternal health, the NGO partner and the county health director disagree sharply on programme priorities. Both look to you to mediate. What do you do?",
        options: eqOptions(
          "social_skills",
          "Acknowledge both perspectives, reframe the discussion around shared patient outcomes, and propose a working group to align priorities",
          "Summarise both positions fairly and suggest a data-driven process to resolve the disagreement",
          "Support the county health director's position since they represent the government",
          "Stay neutral and suggest they resolve it between themselves"
        ),
        dimension: "social_skills",
        order: 3,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "You want to introduce a nurse-led triage system in the emergency department but know the senior doctors will perceive it as a threat to their authority. What do you do?",
        options: eqOptions(
          "social_skills",
          "Pilot the system as a joint initiative with a respected senior doctor as co-lead, sharing evidence from similar African hospitals",
          "Present the evidence at a clinical governance meeting and invite open discussion",
          "Implement it as a trial and review outcomes after three months",
          "Avoid the initiative for now, waiting for a more receptive moment"
        ),
        dimension: "social_skills",
        order: 4,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A development partner offers funding for a vertical disease programme, but you believe the money would be better spent on health systems strengthening. What do you do?",
        options: eqOptions(
          "social_skills",
          "Present a counter-proposal that integrates the disease programme into a broader systems strengthening approach, showing how it achieves both parties' goals",
          "Accept the funding as offered but advocate for a broader approach in the programme design",
          "Decline the funding on principle and seek alternative sources",
          "Accept the funding and redirect it towards your preferred priorities"
        ),
        dimension: "social_skills",
        order: 5,
      },
    ],
  },
  {
    name: "Emotional Regulation Scenarios",
    description: "How effectively you manage and channel your own emotional responses under pressure.",
    context:
      "You hold a senior clinical leadership role in a 400-bed hospital in Accra. The hospital faces chronic resource shortages, high patient volumes, and frequent interactions with regulatory bodies. These scenarios test your ability to stay composed and constructive.",
    order: 4,
    questions: [
      {
        format: "SCENARIO_RESPONSE",
        text: "A patient dies unexpectedly on your ward. The family is distraught and begins shouting accusations of negligence at nursing staff in the corridor. Other patients and visitors are watching. What do you do?",
        options: eqOptions(
          "emotional_regulation",
          "Calmly approach the family, express sincere condolences, guide them to a private space, and listen fully before discussing next steps",
          "Ask a senior nurse to support the family while you quickly review the clinical notes to understand what happened",
          "Address the family firmly, explaining that a proper investigation will be conducted",
          "Avoid the family and ask the hospital's patient relations officer to handle the situation"
        ),
        dimension: "emotional_regulation",
        order: 1,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "The health regulatory authority arrives unannounced for an inspection. Your infection control records are not up to date due to a recent staff shortage. You feel panicked. What do you do?",
        options: eqOptions(
          "emotional_regulation",
          "Take a deep breath, welcome the inspectors professionally, be transparent about the gap, and present your remediation plan",
          "Stay calm outwardly, begin the inspection cooperatively, and brief your team to gather what documentation is available",
          "Ask the inspectors if the visit can be rescheduled due to the staffing situation",
          "Blame the staffing shortage on hospital management and express frustration openly"
        ),
        dimension: "emotional_regulation",
        order: 2,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "During a heated board meeting, the hospital chairman publicly blames your department for the institution's declining patient satisfaction scores. You believe the criticism is unfair and politically motivated. What do you do?",
        options: eqOptions(
          "emotional_regulation",
          "Maintain composure, acknowledge the concern professionally, and request the opportunity to present your department's data at the next meeting",
          "Respond calmly with a brief factual correction and offer to share a detailed analysis afterwards",
          "Counter the chairman's claims immediately with your own data and arguments",
          "Walk out of the meeting to avoid saying something you will regret"
        ),
        dimension: "emotional_regulation",
        order: 3,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "You have been working 14-hour days for three weeks due to a disease outbreak. You realise you are becoming irritable and making uncharacteristic clinical errors. What do you do?",
        options: eqOptions(
          "emotional_regulation",
          "Acknowledge that you have reached your limit, delegate responsibilities to capable colleagues, and take a structured break to recover",
          "Reduce your hours slightly and implement personal strategies like mindfulness or exercise",
          "Push through because the patients need you and no one else can fill your role",
          "Carry on but take out your frustration by criticising slower-performing team members"
        ),
        dimension: "emotional_regulation",
        order: 4,
      },
      {
        format: "SCENARIO_RESPONSE",
        text: "A colleague you mentored for years is appointed to a position you wanted. They approach you excitedly to share the news. You feel envious and disappointed. What do you do?",
        options: eqOptions(
          "emotional_regulation",
          "Congratulate them genuinely, allow yourself to process your feelings privately later, and use the experience to reassess your career goals",
          "Offer congratulations and step away to manage your emotions before engaging further",
          "Congratulate them half-heartedly and change the subject quickly",
          "Express your disappointment openly and suggest the selection process was flawed"
        ),
        dimension: "emotional_regulation",
        order: 5,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module 4 -- CILTI  (slug: "cilti")
// 4 groups x 6 Likert-7 questions = 24 questions
// ---------------------------------------------------------------------------

const likert7Options = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Slightly Disagree" },
  { value: 4, label: "Neutral" },
  { value: 5, label: "Slightly Agree" },
  { value: 6, label: "Agree" },
  { value: 7, label: "Strongly Agree" },
];

const ciltiGroups: GroupInput[] = [
  {
    name: "Clinical Identity",
    description: "How strongly you identify with your clinical professional role.",
    order: 1,
    questions: [
      {
        format: "LIKERT_7",
        text: "My identity as a clinician is central to who I am, regardless of any leadership title I hold.",
        options: likert7Options,
        dimension: "clinical_identity",
        order: 1,
      },
      {
        format: "LIKERT_7",
        text: "I feel most competent and confident when I am directly involved in patient care.",
        options: likert7Options,
        dimension: "clinical_identity",
        order: 2,
      },
      {
        format: "LIKERT_7",
        text: "I would feel a profound sense of loss if I had to give up clinical practice entirely for a management role.",
        options: likert7Options,
        dimension: "clinical_identity",
        order: 3,
      },
      {
        format: "LIKERT_7",
        text: "I struggle to see myself as a leader when I am away from the clinical environment.",
        options: likert7Options,
        dimension: "clinical_identity",
        isReversed: true,
        order: 4,
      },
      {
        format: "LIKERT_7",
        text: "When colleagues introduce me, I prefer they use my clinical title rather than my administrative one.",
        options: likert7Options,
        dimension: "clinical_identity",
        order: 5,
      },
      {
        format: "LIKERT_7",
        text: "My clinical training in Africa has shaped my values more than any leadership programme I have attended.",
        options: likert7Options,
        dimension: "clinical_identity",
        order: 6,
      },
    ],
  },
  {
    name: "Leadership Identity",
    description: "How strongly you have embraced your identity as an organisational leader.",
    order: 2,
    questions: [
      {
        format: "LIKERT_7",
        text: "I see myself as a leader first, even though my background is clinical.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 1,
      },
      {
        format: "LIKERT_7",
        text: "I derive as much satisfaction from strategic planning as from clinical problem-solving.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 2,
      },
      {
        format: "LIKERT_7",
        text: "I am comfortable making decisions that affect the whole organisation, not just my clinical domain.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 3,
      },
      {
        format: "LIKERT_7",
        text: "I actively seek opportunities to develop my leadership skills through formal training and coaching.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 4,
      },
      {
        format: "LIKERT_7",
        text: "I can advocate for organisational priorities even when they conflict with the interests of my clinical specialty.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 5,
      },
      {
        format: "LIKERT_7",
        text: "Other people see me as a natural leader, and I have come to accept and embrace that perception.",
        options: likert7Options,
        dimension: "leadership_identity",
        order: 6,
      },
    ],
  },
  {
    name: "Transition Readiness",
    description: "How prepared you feel to move deeper into healthcare leadership.",
    order: 3,
    questions: [
      {
        format: "LIKERT_7",
        text: "I am ready to take on a more senior leadership role, even if it means less time in clinical practice.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 1,
      },
      {
        format: "LIKERT_7",
        text: "I have a clear understanding of the competencies required to lead a healthcare organisation effectively.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 2,
      },
      {
        format: "LIKERT_7",
        text: "I have mentors or role models who have successfully navigated the clinician-to-leader transition in Africa.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 3,
      },
      {
        format: "LIKERT_7",
        text: "I feel confident managing hospital finances, budgets, and resource allocation.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 4,
      },
      {
        format: "LIKERT_7",
        text: "I can navigate the political dynamics of healthcare governance in my country without compromising my integrity.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 5,
      },
      {
        format: "LIKERT_7",
        text: "I have a personal development plan that addresses the gaps between my current abilities and the demands of senior healthcare leadership.",
        options: likert7Options,
        dimension: "transition_readiness",
        order: 6,
      },
    ],
  },
  {
    name: "Identity Friction",
    description: "The tension you experience between your clinical and leadership identities.",
    order: 4,
    questions: [
      {
        format: "LIKERT_7",
        text: "I often feel pulled between my clinical responsibilities and my leadership duties.",
        options: likert7Options,
        dimension: "identity_friction",
        order: 1,
      },
      {
        format: "LIKERT_7",
        text: "My clinical colleagues sometimes view my leadership role with suspicion, as if I have 'crossed to the other side'.",
        options: likert7Options,
        dimension: "identity_friction",
        order: 2,
      },
      {
        format: "LIKERT_7",
        text: "I feel guilty when administrative tasks take me away from patient care.",
        options: likert7Options,
        dimension: "identity_friction",
        order: 3,
      },
      {
        format: "LIKERT_7",
        text: "I have successfully integrated my clinical expertise and my leadership role into a coherent professional identity.",
        options: likert7Options,
        dimension: "identity_friction",
        isReversed: true,
        order: 4,
      },
      {
        format: "LIKERT_7",
        text: "The healthcare system in my country does not adequately recognise or support the clinician-to-leader transition.",
        options: likert7Options,
        dimension: "identity_friction",
        order: 5,
      },
      {
        format: "LIKERT_7",
        text: "I sometimes feel like an imposter in leadership meetings because my primary training was clinical.",
        options: likert7Options,
        dimension: "identity_friction",
        isReversed: true,
        order: 6,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module 5 -- THREE_SIXTY  (slug: "three-sixty")
// 6 frequency groups x 5 + 1 free-text group x 6 = 36 questions
// ---------------------------------------------------------------------------

const frequencyOptions = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Always" },
];

const threeSixtyGroups: GroupInput[] = [
  {
    name: "Communication",
    description: "How effectively this leader communicates across the organisation.",
    order: 1,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Communicates the hospital's vision and strategic direction in a way that motivates the team.",
        options: frequencyOptions,
        dimension: "communication",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Listens actively to concerns from all levels of staff, including nurses, cleaners, and porters.",
        options: frequencyOptions,
        dimension: "communication",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Provides clear, timely updates during clinical emergencies or institutional crises.",
        options: frequencyOptions,
        dimension: "communication",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Adapts communication style when addressing different stakeholders such as patients, families, regulators, and board members.",
        options: frequencyOptions,
        dimension: "communication",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Gives constructive feedback to colleagues and direct reports in a respectful and culturally appropriate manner.",
        options: frequencyOptions,
        dimension: "communication",
        order: 5,
      },
    ],
  },
  {
    name: "Decision Making",
    description: "How this leader approaches and executes decisions.",
    order: 2,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Makes timely decisions under pressure, even when information is incomplete.",
        options: frequencyOptions,
        dimension: "decision_making",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Balances clinical evidence with operational realities when making resource allocation decisions.",
        options: frequencyOptions,
        dimension: "decision_making",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Involves relevant stakeholders in decisions that affect their work or patient care.",
        options: frequencyOptions,
        dimension: "decision_making",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Takes responsibility for the outcomes of their decisions, including when things go wrong.",
        options: frequencyOptions,
        dimension: "decision_making",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Avoids decision paralysis by setting clear deadlines and sticking to them.",
        options: frequencyOptions,
        dimension: "decision_making",
        order: 5,
      },
    ],
  },
  {
    name: "Team Development",
    description: "How this leader builds and develops high-performing teams.",
    order: 3,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Invests time in coaching and mentoring junior clinicians and managers.",
        options: frequencyOptions,
        dimension: "team_development",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Creates an environment where team members feel safe to raise concerns and report errors.",
        options: frequencyOptions,
        dimension: "team_development",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Recognises and celebrates team achievements, both clinical and operational.",
        options: frequencyOptions,
        dimension: "team_development",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Delegates effectively, matching tasks to the strengths and development needs of team members.",
        options: frequencyOptions,
        dimension: "team_development",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Addresses underperformance promptly and fairly, following due process.",
        options: frequencyOptions,
        dimension: "team_development",
        order: 5,
      },
    ],
  },
  {
    name: "Strategic Thinking",
    description: "How this leader thinks about and plans for the future.",
    order: 4,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Anticipates changes in the healthcare landscape, such as policy shifts, demographic trends, and disease burden changes.",
        options: frequencyOptions,
        dimension: "strategic_thinking",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Aligns departmental goals with the broader institutional strategy and national health priorities.",
        options: frequencyOptions,
        dimension: "strategic_thinking",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Identifies and pursues partnerships, grants, or collaborations that strengthen the institution.",
        options: frequencyOptions,
        dimension: "strategic_thinking",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Thinks beyond immediate clinical challenges to consider systemic improvements.",
        options: frequencyOptions,
        dimension: "strategic_thinking",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Develops contingency plans for foreseeable risks such as supply chain disruptions, staff attrition, or regulatory changes.",
        options: frequencyOptions,
        dimension: "strategic_thinking",
        order: 5,
      },
    ],
  },
  {
    name: "Clinical Credibility",
    description: "How this leader maintains clinical respect while leading.",
    order: 5,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Maintains clinical competence and stays current with developments in their specialty.",
        options: frequencyOptions,
        dimension: "clinical_credibility",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Draws on clinical experience to make informed leadership decisions that staff trust.",
        options: frequencyOptions,
        dimension: "clinical_credibility",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Commands respect from clinical colleagues through demonstrated expertise and integrity.",
        options: frequencyOptions,
        dimension: "clinical_credibility",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Bridges the gap between clinical teams and administrative leadership effectively.",
        options: frequencyOptions,
        dimension: "clinical_credibility",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Champions evidence-based practice and quality improvement across the institution.",
        options: frequencyOptions,
        dimension: "clinical_credibility",
        order: 5,
      },
    ],
  },
  {
    name: "Change Management",
    description: "How this leader navigates and drives organisational change.",
    order: 6,
    questions: [
      {
        format: "FREQUENCY_SCALE",
        text: "Builds a compelling case for change that resonates with staff at all levels.",
        options: frequencyOptions,
        dimension: "change_management",
        order: 1,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Manages resistance to change with patience, transparency, and persistence.",
        options: frequencyOptions,
        dimension: "change_management",
        order: 2,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Sustains momentum during long change processes without losing focus or team engagement.",
        options: frequencyOptions,
        dimension: "change_management",
        order: 3,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Adapts change strategies when the original plan encounters unexpected obstacles.",
        options: frequencyOptions,
        dimension: "change_management",
        order: 4,
      },
      {
        format: "FREQUENCY_SCALE",
        text: "Embeds changes into institutional culture so they outlast their personal involvement.",
        options: frequencyOptions,
        dimension: "change_management",
        order: 5,
      },
    ],
  },
  {
    name: "Open-Ended Feedback",
    description: "Free-text responses providing qualitative feedback across all leadership dimensions.",
    order: 7,
    questions: [
      {
        format: "FREE_TEXT",
        text: "What is this leader's greatest strength in how they communicate with staff, patients, and stakeholders?",
        options: [],
        dimension: "communication",
        order: 1,
      },
      {
        format: "FREE_TEXT",
        text: "Describe a specific example of a good or poor decision this leader has made and what you learned from it.",
        options: [],
        dimension: "decision_making",
        order: 2,
      },
      {
        format: "FREE_TEXT",
        text: "How does this leader contribute to building a strong, motivated team? What could they improve?",
        options: [],
        dimension: "team_development",
        order: 3,
      },
      {
        format: "FREE_TEXT",
        text: "How well does this leader think ahead and position the department or institution for the future?",
        options: [],
        dimension: "strategic_thinking",
        order: 4,
      },
      {
        format: "FREE_TEXT",
        text: "How does this leader's clinical background influence their effectiveness as a leader, positively or negatively?",
        options: [],
        dimension: "clinical_credibility",
        order: 5,
      },
      {
        format: "FREE_TEXT",
        text: "Describe how this leader has handled a recent change initiative. What went well and what could be improved?",
        options: [],
        dimension: "change_management",
        order: 6,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Module 6 -- CULTURE_TEAM  (slug: "culture-team")
// 4 culture groups x 6 + 1 team effectiveness group x 6 = 30 questions
// ---------------------------------------------------------------------------

const likert5Options = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const cultureTeamGroups: GroupInput[] = [
  {
    name: "Collaborate Culture",
    description: "The degree to which your organisation values teamwork, participation, and consensus.",
    order: 1,
    questions: [
      {
        format: "LIKERT_5",
        text: "Our hospital feels like an extended family where people look out for one another.",
        options: likert5Options,
        dimension: "collaborate",
        order: 1,
      },
      {
        format: "LIKERT_5",
        text: "Leaders in this institution act as mentors and coaches rather than commanders.",
        options: likert5Options,
        dimension: "collaborate",
        order: 2,
      },
      {
        format: "LIKERT_5",
        text: "Multi-disciplinary teamwork and shared decision-making are genuinely valued here.",
        options: likert5Options,
        dimension: "collaborate",
        order: 3,
      },
      {
        format: "LIKERT_5",
        text: "Staff wellbeing and morale are treated as important institutional priorities.",
        options: likert5Options,
        dimension: "collaborate",
        order: 4,
      },
      {
        format: "LIKERT_5",
        text: "We invest meaningfully in staff development, training, and career progression.",
        options: likert5Options,
        dimension: "collaborate",
        order: 5,
      },
      {
        format: "LIKERT_5",
        text: "Loyalty and mutual trust between staff and leadership are strong in this institution.",
        options: likert5Options,
        dimension: "collaborate",
        order: 6,
      },
    ],
  },
  {
    name: "Create Culture",
    description: "The degree to which your organisation values innovation, risk-taking, and creative problem-solving.",
    order: 2,
    questions: [
      {
        format: "LIKERT_5",
        text: "Our institution encourages innovative approaches to healthcare delivery challenges.",
        options: likert5Options,
        dimension: "create",
        order: 1,
      },
      {
        format: "LIKERT_5",
        text: "Leaders here are willing to experiment with new models of care, even if the outcome is uncertain.",
        options: likert5Options,
        dimension: "create",
        order: 2,
      },
      {
        format: "LIKERT_5",
        text: "Staff are encouraged to propose creative solutions to operational problems without fear of criticism.",
        options: likert5Options,
        dimension: "create",
        order: 3,
      },
      {
        format: "LIKERT_5",
        text: "Our institution actively seeks partnerships with technology companies, universities, and global health innovators.",
        options: likert5Options,
        dimension: "create",
        order: 4,
      },
      {
        format: "LIKERT_5",
        text: "We are known in the sector for being early adopters of digital health tools and new clinical practices.",
        options: likert5Options,
        dimension: "create",
        order: 5,
      },
      {
        format: "LIKERT_5",
        text: "Failure from a well-considered experiment is treated as a learning opportunity, not a punishable offence.",
        options: likert5Options,
        dimension: "create",
        order: 6,
      },
    ],
  },
  {
    name: "Compete Culture",
    description: "The degree to which your organisation values achievement, targets, and competitive performance.",
    order: 3,
    questions: [
      {
        format: "LIKERT_5",
        text: "Our institution is highly results-oriented, with a strong focus on patient throughput and financial targets.",
        options: likert5Options,
        dimension: "compete",
        order: 1,
      },
      {
        format: "LIKERT_5",
        text: "Leaders here are demanding and push teams hard to achieve ambitious performance goals.",
        options: likert5Options,
        dimension: "compete",
        order: 2,
      },
      {
        format: "LIKERT_5",
        text: "Success is primarily measured by patient volumes, revenue, and market share relative to competing institutions.",
        options: likert5Options,
        dimension: "compete",
        order: 3,
      },
      {
        format: "LIKERT_5",
        text: "There is a strong emphasis on being the best hospital in the region or country in key specialties.",
        options: likert5Options,
        dimension: "compete",
        order: 4,
      },
      {
        format: "LIKERT_5",
        text: "High performers are publicly recognised and rewarded, creating a competitive internal environment.",
        options: likert5Options,
        dimension: "compete",
        order: 5,
      },
      {
        format: "LIKERT_5",
        text: "The institution benchmarks itself against regional and international standards and strives to exceed them.",
        options: likert5Options,
        dimension: "compete",
        order: 6,
      },
    ],
  },
  {
    name: "Control Culture",
    description: "The degree to which your organisation values structure, procedures, and hierarchical governance.",
    order: 4,
    questions: [
      {
        format: "LIKERT_5",
        text: "Our hospital runs on well-defined policies, protocols, and standard operating procedures.",
        options: likert5Options,
        dimension: "control",
        order: 1,
      },
      {
        format: "LIKERT_5",
        text: "There is a clear chain of command and decisions follow established approval hierarchies.",
        options: likert5Options,
        dimension: "control",
        order: 2,
      },
      {
        format: "LIKERT_5",
        text: "Compliance with regulatory requirements and accreditation standards is a top institutional priority.",
        options: likert5Options,
        dimension: "control",
        order: 3,
      },
      {
        format: "LIKERT_5",
        text: "Documentation, record-keeping, and audit trails are rigorously maintained.",
        options: likert5Options,
        dimension: "control",
        order: 4,
      },
      {
        format: "LIKERT_5",
        text: "Stability, predictability, and risk avoidance are valued more than bold experimentation.",
        options: likert5Options,
        dimension: "control",
        order: 5,
      },
      {
        format: "LIKERT_5",
        text: "The institution prioritises efficiency and smooth operations over individual initiative.",
        options: likert5Options,
        dimension: "control",
        order: 6,
      },
    ],
  },
  {
    name: "Team Effectiveness",
    description: "How well your immediate team functions as a unit.",
    order: 5,
    questions: [
      {
        format: "LIKERT_5",
        text: "My team has a shared understanding of our objectives and how we contribute to the institution's mission.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 1,
      },
      {
        format: "LIKERT_5",
        text: "Team members trust each other enough to admit mistakes and ask for help.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 2,
      },
      {
        format: "LIKERT_5",
        text: "Conflict within the team is addressed openly and resolved constructively.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 3,
      },
      {
        format: "LIKERT_5",
        text: "Team members hold one another accountable for delivering on commitments.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 4,
      },
      {
        format: "LIKERT_5",
        text: "Our team communicates effectively across professional boundaries, such as between doctors, nurses, and allied health.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 5,
      },
      {
        format: "LIKERT_5",
        text: "The team regularly reviews its own performance and makes adjustments to improve.",
        options: likert5Options,
        dimension: "team_effectiveness",
        order: 6,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding Maarova assessment questions ...\n");

  await seedModule("disc", discGroups);
  await seedModule("values-drivers", valuesDriversGroups);
  await seedModule("eq", eqGroups);
  await seedModule("cilti", ciltiGroups);
  await seedModule("three-sixty", threeSixtyGroups);
  await seedModule("culture-team", cultureTeamGroups);

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
