// Consultant Assessment Question Banks
// Specialty-specific vetting for CFA consultant onboarding

export interface AssessmentQuestion {
  id: string;
  part: "scenario" | "experience" | "quickfire" | "video";
  text: string;
  timeLimitSec: number;
}

export interface SpecialtyQuestionBank {
  specialty: string;
  scenario: AssessmentQuestion[];
  experience: AssessmentQuestion[];
  quickfire: AssessmentQuestion[];
  video: AssessmentQuestion[];
}

// ─── Part 2: Experience Deep-Dive (shared across all specialties) ────────────

const experienceQuestions: AssessmentQuestion[] = [
  {
    id: "exp-1",
    part: "experience",
    text: "Describe the most challenging healthcare engagement you have worked on. What was the situation, what did you do, and what was the outcome? Include specific numbers where possible.",
    timeLimitSec: 300,
  },
  {
    id: "exp-2",
    part: "experience",
    text: "Tell us about a time a client or stakeholder strongly disagreed with your recommendation. How did you handle it?",
    timeLimitSec: 300,
  },
  {
    id: "exp-3",
    part: "experience",
    text: "What is one thing you learned from a project that did NOT go well?",
    timeLimitSec: 300,
  },
];

// ─── Part 4: Video Prompt (shared across all specialties) ────────────────────

const videoPrompt: AssessmentQuestion[] = [
  {
    id: "video-1",
    part: "video",
    text: "In under 2 minutes, summarise your approach to the scenario from Part 1. Focus on what makes YOUR approach different from what any consultant might propose.",
    timeLimitSec: 120,
  },
];

// ─── Part 1: Scenario Responses (specialty-specific) ─────────────────────────

const scenarioQuestions: Record<string, AssessmentQuestion[]> = {
  HOSPITAL_OPERATIONS: [
    {
      id: "scenario-hospital-ops-1",
      part: "scenario",
      text: "You have been engaged by a 200-bed private hospital in Lagos experiencing 30% revenue leakage, 45% bed occupancy, and staff turnover of 35%. The CEO wants visible results within 90 days. Walk us through your approach, starting from day one. Be specific about what data you would request, who you would interview, and what quick wins you would target.",
      timeLimitSec: 900,
    },
  ],
  TURNAROUND: [
    {
      id: "scenario-turnaround-1",
      part: "scenario",
      text: "A 150-bed mission hospital in rural Kenya has been running at a 25% operating loss for 18 months. The board is considering closure. NHIF reimbursements are 4 months delayed, key staff are leaving, and the community depends on this facility. You have 12 weeks. What is your turnaround plan?",
      timeLimitSec: 900,
    },
  ],
  CLINICAL_GOVERNANCE: [
    {
      id: "scenario-clin-gov-1",
      part: "scenario",
      text: "A private hospital group with 3 facilities in Abuja has had 4 adverse events in 6 months, including one maternal death. The MDCN is investigating. Patient complaints have tripled. Design a clinical governance improvement programme.",
      timeLimitSec: 900,
    },
  ],
  DIGITAL_HEALTH: [
    {
      id: "scenario-digital-1",
      part: "scenario",
      text: "A state government wants to digitise 15 primary healthcare centres across 3 LGAs. Current records are paper-based, there is no internet in 8 of the 15 facilities, staff have minimal digital literacy, and the budget is NGN 50M. Create an implementation roadmap.",
      timeLimitSec: 900,
    },
  ],
  HEALTH_SYSTEMS: [
    {
      id: "scenario-health-sys-1",
      part: "scenario",
      text: "A West African country with 200 million people has an out-of-pocket healthcare expenditure of 77%. The government wants to achieve Universal Health Coverage by 2030. You are advising the Ministry of Health. What is your strategic framework?",
      timeLimitSec: 900,
    },
  ],
  EMBEDDED_LEADERSHIP: [
    {
      id: "scenario-embed-lead-1",
      part: "scenario",
      text: "You are placed as interim COO of a 300-bed teaching hospital. The previous COO was removed after a financial scandal. Staff morale is at rock bottom, the medical director is hostile to management, and the board expects a clean audit within 6 months. How do you navigate your first 30 days?",
      timeLimitSec: 900,
    },
  ],
  DIASPORA_EXPERTISE: [
    {
      id: "scenario-diaspora-1",
      part: "scenario",
      text: "You are a diaspora consultant asked to help a Nigerian hospital group benchmark against international standards. The group has 5 facilities across Lagos and Abuja. They want JCI accreditation readiness within 18 months. How do you bridge the gap between where they are and where they need to be?",
      timeLimitSec: 900,
    },
  ],
  EM_AS_SERVICE: [
    {
      id: "scenario-em-1",
      part: "scenario",
      text: "A health-tech startup has raised $2M Series A and needs to set up operations in 3 African countries within 12 months. They have no local presence. As their outsourced engagement manager, outline your approach to market entry, partner identification, and operational setup.",
      timeLimitSec: 900,
    },
  ],
};

// ─── Part 3: Quick-Fire (specialty-specific, 60 sec each) ────────────────────

const quickfireQuestions: Record<string, AssessmentQuestion[]> = {
  HOSPITAL_OPERATIONS: [
    {
      id: "qf-hospital-ops-1",
      part: "quickfire",
      text: "What is the typical bed occupancy benchmark for a profitable private hospital in Nigeria?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-2",
      part: "quickfire",
      text: "Name three revenue leakage points in a typical Nigerian hospital.",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-3",
      part: "quickfire",
      text: "What is the SERVICOM charter and how does it affect hospital operations?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-4",
      part: "quickfire",
      text: "A ward has 20 beds but only 8 nurses across 3 shifts. Is this adequate? Why or why not?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-5",
      part: "quickfire",
      text: "What does ALOS stand for and what is a healthy benchmark for a general ward?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-6",
      part: "quickfire",
      text: "The pharmacy is dispensing drugs but revenue is not matching. What are your first 3 investigative steps?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-7",
      part: "quickfire",
      text: "Should a 100-bed hospital in Lagos have a full-time CFO? Justify your answer in one sentence.",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-8",
      part: "quickfire",
      text: "Name two key differences between managing a faith-based hospital and a for-profit one in Nigeria.",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-9",
      part: "quickfire",
      text: "What is the biggest operational risk during a hospital renovation while maintaining services?",
      timeLimitSec: 60,
    },
    {
      id: "qf-hospital-ops-10",
      part: "quickfire",
      text: "A consultant reports to both the CEO and the board. The CEO asks you to omit negative findings from the board report. What do you do?",
      timeLimitSec: 60,
    },
  ],
  TURNAROUND: [
    {
      id: "qf-turnaround-1",
      part: "quickfire",
      text: "What is the single most common cause of financial distress in mid-tier African hospitals?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-2",
      part: "quickfire",
      text: "You need to cut costs by 20% in 30 days without layoffs. Name two levers you would pull first.",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-3",
      part: "quickfire",
      text: "What is a cash waterfall and why is it critical in a turnaround?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-4",
      part: "quickfire",
      text: "NHIF/NHIS reimbursements are 6 months delayed. What is your immediate cash strategy?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-5",
      part: "quickfire",
      text: "How do you communicate a turnaround plan to frontline staff who fear job losses?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-6",
      part: "quickfire",
      text: "What is the difference between a restructuring and a turnaround in a hospital context?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-7",
      part: "quickfire",
      text: "The hospital owes suppliers NGN 80M and they are threatening to stop deliveries. What is your negotiation approach?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-8",
      part: "quickfire",
      text: "Name the top 3 KPIs you would track weekly during a hospital turnaround.",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-9",
      part: "quickfire",
      text: "A turnaround board wants to replace the medical director. The medical staff association threatens to strike. How do you advise the board?",
      timeLimitSec: 60,
    },
    {
      id: "qf-turnaround-10",
      part: "quickfire",
      text: "When should you recommend that a hospital should NOT be saved?",
      timeLimitSec: 60,
    },
  ],
  CLINICAL_GOVERNANCE: [
    {
      id: "qf-clin-gov-1",
      part: "quickfire",
      text: "What are the five pillars of clinical governance?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-2",
      part: "quickfire",
      text: "What is a root cause analysis and when should it be triggered?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-3",
      part: "quickfire",
      text: "Explain the difference between a clinical audit and clinical research in one sentence each.",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-4",
      part: "quickfire",
      text: "A nurse reports a medication error. The ward manager wants to discipline the nurse. What is your recommendation?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-5",
      part: "quickfire",
      text: "What is the role of mortality and morbidity (M&M) meetings and who should attend?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-6",
      part: "quickfire",
      text: "Name three clinical quality indicators that every Nigerian hospital should be tracking.",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-7",
      part: "quickfire",
      text: "What is SafeCare and how does it differ from JCI accreditation?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-8",
      part: "quickfire",
      text: "The surgical team has a 5% surgical site infection rate. Is this acceptable? What benchmark would you use?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-9",
      part: "quickfire",
      text: "How do you build a just culture in a hospital where blame is the default?",
      timeLimitSec: 60,
    },
    {
      id: "qf-clin-gov-10",
      part: "quickfire",
      text: "A senior consultant has consistently poor patient outcomes but is the hospital's top revenue generator. How do you address this?",
      timeLimitSec: 60,
    },
  ],
  DIGITAL_HEALTH: [
    {
      id: "qf-digital-1",
      part: "quickfire",
      text: "What is the FHIR standard and why does it matter for African health systems?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-2",
      part: "quickfire",
      text: "Name two open-source EMR systems commonly deployed in African hospitals.",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-3",
      part: "quickfire",
      text: "A facility has no internet. Name two approaches to ensure data continuity for an EMR.",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-4",
      part: "quickfire",
      text: "What is NDPR and how does it affect health data in Nigeria?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-5",
      part: "quickfire",
      text: "The biggest reason digital health projects fail in Africa is not technology. What is it?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-6",
      part: "quickfire",
      text: "What is interoperability and why do most Nigerian hospitals fail at it?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-7",
      part: "quickfire",
      text: "A hospital CEO wants to buy a new HMS for NGN 30M. What 3 questions would you ask before approving?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-8",
      part: "quickfire",
      text: "How would you measure ROI on a telemedicine deployment in a rural setting?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-9",
      part: "quickfire",
      text: "What is DHIS2 and what role does it play in public health systems?",
      timeLimitSec: 60,
    },
    {
      id: "qf-digital-10",
      part: "quickfire",
      text: "Staff are resisting a new digital system. 60% have never used a computer. What is your change management approach in one sentence?",
      timeLimitSec: 60,
    },
  ],
  HEALTH_SYSTEMS: [
    {
      id: "qf-health-sys-1",
      part: "quickfire",
      text: "What is the WHO building blocks framework? Name all six blocks.",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-2",
      part: "quickfire",
      text: "What percentage of GDP does Nigeria spend on healthcare and how does this compare to the Abuja Declaration target?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-3",
      part: "quickfire",
      text: "Explain the difference between UHC and free healthcare in one sentence.",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-4",
      part: "quickfire",
      text: "What is the Basic Health Care Provision Fund (BHCPF) and what problem does it aim to solve?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-5",
      part: "quickfire",
      text: "Name two successful community-based health insurance schemes in Sub-Saharan Africa.",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-6",
      part: "quickfire",
      text: "What is the main bottleneck in primary healthcare delivery in rural Nigeria?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-7",
      part: "quickfire",
      text: "How does task-shifting address the health workforce crisis in Africa?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-8",
      part: "quickfire",
      text: "What is the role of the National Primary Health Care Development Agency (NPHCDA)?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-9",
      part: "quickfire",
      text: "A state governor asks you whether to invest in 10 new PHCs or upgrade 5 existing ones. How do you frame the analysis?",
      timeLimitSec: 60,
    },
    {
      id: "qf-health-sys-10",
      part: "quickfire",
      text: "What is the biggest risk of donor-dependent health programmes and how do you mitigate it?",
      timeLimitSec: 60,
    },
  ],
  EMBEDDED_LEADERSHIP: [
    {
      id: "qf-embed-lead-1",
      part: "quickfire",
      text: "What is the first meeting you hold as an interim COO and who is in the room?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-2",
      part: "quickfire",
      text: "The medical director refuses to meet with you. What do you do?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-3",
      part: "quickfire",
      text: "How do you establish authority without formal power in an interim role?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-4",
      part: "quickfire",
      text: "Name the top 3 things an embedded leader should accomplish in the first 2 weeks.",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-5",
      part: "quickfire",
      text: "A staff union files a formal complaint about your leadership style. How do you respond?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-6",
      part: "quickfire",
      text: "What is the difference between managing and leading in a hospital under crisis?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-7",
      part: "quickfire",
      text: "The board wants weekly reports but the data systems are unreliable. How do you solve this in week one?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-8",
      part: "quickfire",
      text: "You discover the previous COO left behind undisclosed liabilities. What are your first 3 actions?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-9",
      part: "quickfire",
      text: "How do you balance quick wins with long-term structural reform?",
      timeLimitSec: 60,
    },
    {
      id: "qf-embed-lead-10",
      part: "quickfire",
      text: "Your 6-month mandate ends but the job is not done. The board asks you to stay for another 6 months. What factors determine your answer?",
      timeLimitSec: 60,
    },
  ],
  DIASPORA_EXPERTISE: [
    {
      id: "qf-diaspora-1",
      part: "quickfire",
      text: "What is the biggest mistake diaspora consultants make when advising African hospitals?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-2",
      part: "quickfire",
      text: "Name two JCI standards that are most difficult for Nigerian hospitals to meet.",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-3",
      part: "quickfire",
      text: "How do you adapt NHS or US healthcare best practices to a Nigerian setting?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-4",
      part: "quickfire",
      text: "A local clinical lead dismisses your recommendations as 'not applicable here.' How do you respond?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-5",
      part: "quickfire",
      text: "What is the SafeCare accreditation framework and how does it relate to JCI in Africa?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-6",
      part: "quickfire",
      text: "Name three areas where international benchmarking adds the most value to an African hospital.",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-7",
      part: "quickfire",
      text: "How do you handle the power dynamic of being perceived as 'the one from abroad' by local staff?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-8",
      part: "quickfire",
      text: "What is the realistic timeline for JCI readiness for a well-run 100-bed Nigerian hospital?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-9",
      part: "quickfire",
      text: "A hospital wants to attract medical tourists. What are the top 3 operational prerequisites?",
      timeLimitSec: 60,
    },
    {
      id: "qf-diaspora-10",
      part: "quickfire",
      text: "You are remote for 80% of the engagement. How do you maintain influence and accountability?",
      timeLimitSec: 60,
    },
  ],
  EM_AS_SERVICE: [
    {
      id: "qf-em-1",
      part: "quickfire",
      text: "What are the top 3 regulatory hurdles for a health-tech company entering Nigeria?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-2",
      part: "quickfire",
      text: "How do you identify and vet local partners in a country where you have no network?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-3",
      part: "quickfire",
      text: "A client wants to launch in Kenya, Nigeria, and South Africa simultaneously. Is this wise? Why or why not?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-4",
      part: "quickfire",
      text: "What is the difference between managing a project and managing an engagement?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-5",
      part: "quickfire",
      text: "Your client is burning cash faster than planned. The CEO does not want to hear bad news. How do you deliver it?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-6",
      part: "quickfire",
      text: "Name two non-obvious risks of outsourcing engagement management for a startup.",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-7",
      part: "quickfire",
      text: "How do you measure success for an EM-as-a-Service engagement after 6 months?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-8",
      part: "quickfire",
      text: "The client founder micromanages every decision. How do you set boundaries while keeping the relationship intact?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-9",
      part: "quickfire",
      text: "What is a go/no-go framework for market entry and what are the top 3 criteria?",
      timeLimitSec: 60,
    },
    {
      id: "qf-em-10",
      part: "quickfire",
      text: "You are managing 3 client engagements simultaneously. One is about to fail. How do you triage?",
      timeLimitSec: 60,
    },
  ],
};

// ─── Assembled Question Banks ────────────────────────────────────────────────

const ALL_SPECIALTIES = [
  "HOSPITAL_OPERATIONS",
  "TURNAROUND",
  "CLINICAL_GOVERNANCE",
  "DIGITAL_HEALTH",
  "HEALTH_SYSTEMS",
  "EMBEDDED_LEADERSHIP",
  "DIASPORA_EXPERTISE",
  "EM_AS_SERVICE",
] as const;

export type AssessmentSpecialty = (typeof ALL_SPECIALTIES)[number];

export function getQuestionBank(specialty: string): SpecialtyQuestionBank | null {
  if (!ALL_SPECIALTIES.includes(specialty as AssessmentSpecialty)) {
    return null;
  }

  return {
    specialty,
    scenario: scenarioQuestions[specialty] || [],
    experience: experienceQuestions,
    quickfire: quickfireQuestions[specialty] || [],
    video: videoPrompt,
  };
}

export function getAllSpecialties(): string[] {
  return [...ALL_SPECIALTIES];
}

export { experienceQuestions, videoPrompt, scenarioQuestions, quickfireQuestions };
