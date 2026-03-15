import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const validServiceTypes = [
  "HOSPITAL_OPERATIONS","TURNAROUND","EMBEDDED_LEADERSHIP",
  "CLINICAL_GOVERNANCE","DIGITAL_HEALTH","HEALTH_SYSTEMS",
  "DIASPORA_EXPERTISE","EM_AS_SERVICE",
];

const methodologies = [
  {
    name: "CFA Hospital Excellence Programme™",
    slug: "cfa-hospital-excellence",
    description:
      "CFA's flagship comprehensive hospital transformation programme. Integrates operational, clinical, financial, and governance transformation into a single embedded engagement with measurable exit criteria.",
    category: "cfa_proprietary",
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
    estimatedWeeks: 52,
    sortOrder: 49,
    isActive: true,
    phases: [
      {
        name: "Institution Diagnostic",
        description: "Full-spectrum assessment covering operations, clinical quality, financial performance, governance, and culture. Produces the baseline from which all intervention priorities are set.",
        order: 1,
        typicalWeeks: 4,
        keyActivities: [
          "Operational walkthroughs and time-motion studies",
          "Financial and billing audit",
          "Clinical quality and safety review",
          "Board and leadership interviews",
          "Staff engagement and culture survey",
          "Benchmarking against comparable institutions",
        ],
        keyDeliverables: [
          "Institution Diagnostic Report",
          "Performance Baseline (KPI snapshot)",
          "Prioritised Intervention Matrix",
          "Quick Win Register",
        ],
        gates: [
          { name: "Diagnostic Sign-Off", criteria: "Board and CFA leadership aligned on root causes and priority interventions before proceeding.", order: 1 },
        ],
      },
      {
        name: "Stabilisation Sprint",
        description: "Rapid resolution of critical failures threatening institutional viability. Cash flow stabilised, key revenue leakage plugged, and urgent leadership vacancies addressed.",
        order: 2,
        typicalWeeks: 8,
        keyActivities: [
          "Emergency revenue recovery measures",
          "Billing and collections triage",
          "Theatre, bed, and clinic utilisation quick wins",
          "Interim management deployment if required",
          "Critical supplier and creditor engagement",
          "Board communication and confidence restoration",
        ],
        keyDeliverables: [
          "30-Day Stabilisation Plan",
          "Revenue Recovery Tracker",
          "Interim Org Chart (if applicable)",
          "Weekly Performance Dashboard",
        ],
        gates: [
          { name: "Stabilisation Gate", criteria: "Cash position stabilised and at least three quick win revenue or cost interventions confirmed.", order: 1 },
        ],
      },
      {
        name: "Operational Transformation",
        description: "Structural redesign of core hospital operations. New care pathways, scheduling systems, department KPIs, and accountability frameworks embedded with CFA working alongside department heads.",
        order: 3,
        typicalWeeks: 16,
        keyActivities: [
          "Department-by-department operational redesign",
          "Theatre, clinic, and bed management system redesign",
          "Patient flow and discharge optimisation",
          "Procurement and supply chain review",
          "New KPI framework development",
          "Department head coaching and accountability",
        ],
        keyDeliverables: [
          "Operational Transformation Roadmap",
          "Revised Standard Operating Procedures",
          "Department Scorecard Pack",
          "Procurement and Stock Protocol",
        ],
        gates: [
          { name: "Ops Transformation Gate", criteria: "Utilisation rates, patient flow metrics, and department KPIs showing measurable improvement against baseline.", order: 1 },
        ],
      },
      {
        name: "Financial & Commercial Strengthening",
        description: "Revenue integrity, pricing strategy, payer mix optimisation, and cost discipline embedded as permanent management practices rather than one-off initiatives.",
        order: 4,
        typicalWeeks: 12,
        keyActivities: [
          "Tariff and pricing review",
          "NHIS/HMO claim management system overhaul",
          "Revenue cycle end-to-end redesign",
          "Cost centre accountability framework",
          "P&L reporting cadence establishment",
          "Financial dashboard implementation",
        ],
        keyDeliverables: [
          "Revenue Integrity Protocol",
          "Payer Mix Optimisation Plan",
          "Monthly P&L Dashboard",
          "Cost Reduction Register",
        ],
        gates: [
          { name: "Financial Gate", criteria: "Revenue per patient episode and collection rates trending positively for two consecutive months.", order: 1 },
        ],
      },
      {
        name: "Clinical & Governance Strengthening",
        description: "Clinical quality systems, patient safety culture, governance structures, and board accountability frameworks put in place to sustain performance beyond the engagement.",
        order: 5,
        typicalWeeks: 8,
        keyActivities: [
          "Clinical governance committee establishment",
          "Mortality and morbidity review system",
          "Incident reporting and learning culture",
          "Board performance reporting redesign",
          "Policy and procedure library update",
          "Medical staff credentialling and privileging",
        ],
        keyDeliverables: [
          "Clinical Governance Framework",
          "Board Reporting Pack Template",
          "Policy and Procedure Register",
          "Patient Safety Improvement Plan",
        ],
        gates: [
          { name: "Governance Gate", criteria: "Clinical governance committee active, board receiving structured performance reports, and no critical safety gaps outstanding.", order: 1 },
        ],
      },
      {
        name: "Capability Transfer & Exit",
        description: "Structured handover of all systems, tools, and management practices to the institution's own leadership. CFA steps back progressively while monitoring performance until exit criteria are met.",
        order: 6,
        typicalWeeks: 4,
        keyActivities: [
          "Leadership capability assessment and coaching",
          "Management systems documentation",
          "Performance monitoring dashboard handover",
          "Graduated CFA disengagement",
          "90-day post-exit support arrangement",
        ],
        keyDeliverables: [
          "Institution Operating Manual",
          "Leadership Capability Report",
          "Exit Readiness Scorecard",
          "Post-Exit Monitoring Plan",
        ],
        gates: [
          { name: "Exit Gate", criteria: "Exit Readiness Scorecard at 80%+ across all domains and institution leadership confirms readiness.", order: 1 },
        ],
      },
    ],
  },

  {
    name: "CFA Turnaround & Recovery Programme™",
    slug: "cfa-turnaround-recovery",
    description:
      "CFA's rapid-response programme for hospitals in acute financial or operational distress. Designed for institutions that cannot afford a full long-cycle engagement — delivers stabilisation and recovery within 6 months.",
    category: "cfa_proprietary",
    serviceTypes: ["TURNAROUND", "HOSPITAL_OPERATIONS"],
    estimatedWeeks: 24,
    sortOrder: 50,
    isActive: true,
    phases: [
      {
        name: "Rapid Diagnostic",
        description: "Compressed 2-week assessment identifying the critical failure points threatening institutional viability. Produces a ranked intervention list and a clear recovery thesis.",
        order: 1,
        typicalWeeks: 2,
        keyActivities: [
          "Emergency financial review",
          "Operational bottleneck mapping",
          "Leadership and staffing risk assessment",
          "Creditor and payer situation review",
          "Quick win identification",
        ],
        keyDeliverables: [
          "Rapid Diagnostic Report",
          "Recovery Thesis (1-page)",
          "Top 10 Immediate Interventions",
          "Cash Runway Assessment",
        ],
        gates: [
          { name: "Recovery Thesis Approval", criteria: "Owner/board aligned on recovery thesis and CFA engagement scope before mobilisation.", order: 1 },
        ],
      },
      {
        name: "Crisis Stabilisation",
        description: "Weeks 2 to 8. Arrest the decline. Cash stabilised, key revenue restored, critical operational failures resolved. CFA operates with full management authority during this phase.",
        order: 2,
        typicalWeeks: 6,
        keyActivities: [
          "Daily revenue and cash monitoring",
          "Emergency billing and collections push",
          "Theatre and bed utilisation recovery",
          "Senior leadership stabilisation",
          "Staff morale intervention",
          "Supplier prioritisation",
        ],
        keyDeliverables: [
          "Daily Cash Dashboard",
          "Week-4 Revenue Recovery Report",
          "Operational Stabilisation Checklist",
          "Leadership Communication Plan",
        ],
        gates: [
          { name: "Stabilisation Confirmation", criteria: "Institution is cash-flow stable and primary revenue channels restored to minimum viable performance.", order: 1 },
        ],
      },
      {
        name: "Performance Recovery",
        description: "Structural interventions that take the institution from stable to growing. Operational redesign, financial system overhaul, and governance reconstruction.",
        order: 3,
        typicalWeeks: 12,
        keyActivities: [
          "Revenue cycle end-to-end redesign",
          "Core department operational redesign",
          "Governance and board reporting overhaul",
          "Pricing and payer mix optimisation",
          "Cost structure review",
          "Team rebuilding where necessary",
        ],
        keyDeliverables: [
          "Turnaround Performance Report",
          "New Revenue Cycle Protocol",
          "Governance Reform Plan",
          "6-Month Recovery Scorecard",
        ],
        gates: [
          { name: "Recovery Gate", criteria: "Month-6 performance metrics show improvement in all three domains: revenue, operations, and governance.", order: 1 },
        ],
      },
      {
        name: "Transition to Sustained Growth",
        description: "Handover from CFA management to internal leadership. Systems embedded, dashboards live, and a clear 12-month growth plan in place for the institution's own team to execute.",
        order: 4,
        typicalWeeks: 4,
        keyActivities: [
          "Leadership capability transfer",
          "Performance management system handover",
          "12-month growth plan development",
          "Quarterly check-in schedule agreement",
        ],
        keyDeliverables: [
          "12-Month Growth Plan",
          "Institution Operating Handbook",
          "Performance Dashboard (live)",
          "Quarterly Review Framework",
        ],
        gates: [
          { name: "Transition Gate", criteria: "Internal leadership team signed off as capable of executing the 12-month growth plan independently.", order: 1 },
        ],
      },
    ],
  },

  {
    name: "CFA Clinical Governance Transformation™",
    slug: "cfa-clinical-governance",
    description:
      "A structured programme to design, embed, and operationalise clinical governance systems in African hospitals. Covers quality frameworks, safety culture, medical staff management, and board clinical oversight.",
    category: "cfa_proprietary",
    serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
    estimatedWeeks: 20,
    sortOrder: 51,
    isActive: true,
    phases: [
      {
        name: "Clinical Governance Baseline",
        description: "Assessment of existing clinical governance structures, quality systems, safety culture, and compliance status against national and international standards.",
        order: 1,
        typicalWeeks: 3,
        keyActivities: [
          "Clinical governance committee audit",
          "Incident reporting system review",
          "Mortality and morbidity review assessment",
          "Medical staff credentialling review",
          "Policy and procedure gap analysis",
          "Staff safety culture survey",
        ],
        keyDeliverables: [
          "Clinical Governance Baseline Report",
          "Safety Culture Survey Results",
          "Policy Gap Register",
          "Credentialling Status Report",
        ],
        gates: [
          { name: "Baseline Approval", criteria: "Leadership accepts baseline findings and prioritises governance domains for transformation.", order: 1 },
        ],
      },
      {
        name: "Governance Architecture Design",
        description: "Design of the complete clinical governance system: committee structures, reporting lines, accountability frameworks, and clinical performance indicators.",
        order: 2,
        typicalWeeks: 4,
        keyActivities: [
          "Clinical governance committee redesign",
          "Clinical KPI framework development",
          "Policy and procedure library development",
          "Credentialling and privileging protocol design",
          "Board clinical reporting design",
          "Incident management system design",
        ],
        keyDeliverables: [
          "Clinical Governance Charter",
          "Committee Terms of Reference",
          "Clinical KPI Dashboard",
          "Policy and Procedure Library (draft)",
        ],
        gates: [
          { name: "Architecture Sign-Off", criteria: "Board, CMO, and senior clinicians approve governance architecture before implementation begins.", order: 1 },
        ],
      },
      {
        name: "System Implementation",
        description: "Activation of all governance structures. Committees convened, policies approved, incident reporting live, and clinical indicators tracked for the first time.",
        order: 3,
        typicalWeeks: 8,
        keyActivities: [
          "Committee activation and inaugural meetings",
          "Policy ratification and staff communication",
          "Incident reporting system go-live",
          "First mortality and morbidity review cycle",
          "Credentialling and privileging completion",
          "Clinical dashboard go-live",
        ],
        keyDeliverables: [
          "Committee Meeting Records",
          "Approved Policy Library",
          "First M&M Review Report",
          "Credentialling Register",
        ],
        gates: [
          { name: "Implementation Gate", criteria: "All governance committees active, reporting cycles running, and incident reporting system showing utilisation.", order: 1 },
        ],
      },
      {
        name: "Embedding and Cultural Change",
        description: "Ensuring governance is not just structural but cultural. Clinical staff trained, leadership accountable, and the board receiving meaningful clinical performance reports.",
        order: 4,
        typicalWeeks: 5,
        keyActivities: [
          "Clinical governance training for department heads",
          "Board clinical reporting pack handover",
          "Safety culture follow-up survey",
          "Governance effectiveness review",
          "CFA advisory handover to internal CMO",
        ],
        keyDeliverables: [
          "Training Completion Records",
          "Board Clinical Reporting Pack",
          "Safety Culture Improvement Report",
          "Governance Sustainability Plan",
        ],
        gates: [
          { name: "Embedding Gate", criteria: "Follow-up safety culture survey shows improvement; board is receiving and acting on clinical performance data.", order: 1 },
        ],
      },
    ],
  },

  {
    name: "CFA Digital Health Transformation Programme™",
    slug: "cfa-digital-health-transformation",
    description:
      "End-to-end digital health transformation for African hospitals. Covers HIS/EMR selection and implementation, data infrastructure, clinical workflow digitisation, and staff adoption — built for resource-constrained environments.",
    category: "cfa_proprietary",
    serviceTypes: ["DIGITAL_HEALTH", "HOSPITAL_OPERATIONS"],
    estimatedWeeks: 32,
    sortOrder: 52,
    isActive: true,
    phases: [
      {
        name: "Digital Readiness Assessment",
        description: "Comprehensive assessment of current IT infrastructure, clinical workflows, staff digital literacy, and data needs. Produces a clear digital maturity baseline and vendor-neutral technology roadmap.",
        order: 1,
        typicalWeeks: 3,
        keyActivities: [
          "IT infrastructure audit",
          "Clinical workflow mapping",
          "Staff digital literacy assessment",
          "Current systems inventory",
          "Data and reporting needs assessment",
          "Budget and connectivity constraints review",
        ],
        keyDeliverables: [
          "Digital Maturity Baseline Report",
          "Clinical Workflow Maps",
          "Technology Roadmap (vendor-neutral)",
          "Digital Investment Business Case",
        ],
        gates: [
          { name: "Readiness Gate", criteria: "Leadership aligned on digital maturity level and committed to investment required for transformation.", order: 1 },
        ],
      },
      {
        name: "System Selection & Design",
        description: "Structured procurement and configuration of the HIS/EMR and supporting systems. CFA acts as the client's technical representative throughout vendor selection to ensure fit-for-purpose delivery.",
        order: 2,
        typicalWeeks: 6,
        keyActivities: [
          "Requirements specification development",
          "Vendor RFP and evaluation",
          "System demonstration and scoring",
          "Contract negotiation support",
          "Implementation planning",
          "Change management design",
        ],
        keyDeliverables: [
          "Technical Requirements Specification",
          "Vendor Evaluation Scorecard",
          "Implementation Plan",
          "Change Management Strategy",
        ],
        gates: [
          { name: "Vendor Selection Gate", criteria: "Vendor selected, contract signed, and implementation plan agreed before proceeding.", order: 1 },
        ],
      },
      {
        name: "Phased Implementation",
        description: "Controlled rollout of digital systems department by department. CFA manages the vendor, monitors progress, and resolves issues that would otherwise derail the implementation.",
        order: 3,
        typicalWeeks: 14,
        keyActivities: [
          "Pilot department go-live",
          "Clinical workflow integration",
          "Data migration and validation",
          "Staff training delivery",
          "Issue tracking and resolution",
          "Progressive department rollout",
        ],
        keyDeliverables: [
          "Go-Live Readiness Checklist",
          "Training Completion Records",
          "Data Migration Sign-Off",
          "Weekly Implementation Status Report",
        ],
        gates: [
          { name: "Pilot Gate", criteria: "Pilot department live with no critical system failures and staff utilisation above 70%.", order: 1 },
          { name: "Full Rollout Gate", criteria: "All departments live, no critical issues outstanding, and data integrity confirmed.", order: 2 },
        ],
      },
      {
        name: "Optimisation & Analytics",
        description: "Post-go-live optimisation to ensure systems are actually improving performance, not just digitising existing problems. Clinical dashboards, management analytics, and reporting infrastructure activated.",
        order: 4,
        typicalWeeks: 6,
        keyActivities: [
          "Clinical performance dashboard development",
          "Management reporting automation",
          "Workflow optimisation based on live data",
          "Advanced user training",
          "Data quality audit",
          "Analytics use case prioritisation",
        ],
        keyDeliverables: [
          "Clinical Analytics Dashboard",
          "Management Reporting Suite",
          "Data Quality Report",
          "Analytics Use Case Roadmap",
        ],
        gates: [
          { name: "Analytics Gate", criteria: "Clinical and management dashboards live, data quality confirmed, and leadership using data in decision-making.", order: 1 },
        ],
      },
      {
        name: "Digital Sustainability",
        description: "Ensuring the institution can maintain, govern, and evolve its digital systems independently. IT team capability built, governance structures for digital assets established.",
        order: 5,
        typicalWeeks: 3,
        keyActivities: [
          "Internal IT team capability development",
          "Digital governance framework",
          "Vendor management protocol",
          "System maintenance and upgrade plan",
          "CFA advisory handover",
        ],
        keyDeliverables: [
          "Digital Governance Framework",
          "IT Operations Manual",
          "Vendor Management Protocol",
          "2-Year Digital Roadmap",
        ],
        gates: [
          { name: "Sustainability Gate", criteria: "Internal IT team capable of day-to-day system management and escalation protocols in place.", order: 1 },
        ],
      },
    ],
  },

  {
    name: "CFA Health Systems Advisory Programme™",
    slug: "cfa-health-systems-advisory",
    description:
      "CFA's structured engagement model for government agencies, development partners, and health financing bodies seeking to strengthen health system architecture, policy, and implementation. Built around the WHO Health System Building Blocks.",
    category: "cfa_proprietary",
    serviceTypes: ["HEALTH_SYSTEMS", "DIASPORA_EXPERTISE"],
    estimatedWeeks: 26,
    sortOrder: 53,
    isActive: true,
    phases: [
      {
        name: "Health System Situation Analysis",
        description: "Comprehensive assessment of the health system across all six building blocks. Identifies structural gaps, financing constraints, governance weaknesses, and implementation capacity deficits.",
        order: 1,
        typicalWeeks: 5,
        keyActivities: [
          "Service delivery mapping",
          "Health workforce assessment",
          "Health information systems review",
          "Medical products and technology audit",
          "Health financing analysis",
          "Leadership and governance assessment",
          "Stakeholder mapping and interviews",
        ],
        keyDeliverables: [
          "Health System Situation Analysis Report",
          "Building Blocks Scorecard",
          "Stakeholder Map",
          "Priority Intervention Framework",
        ],
        gates: [
          { name: "Analysis Sign-Off", criteria: "Client and key stakeholders validate findings and agree on priority domains for intervention.", order: 1 },
        ],
      },
      {
        name: "Strategy & Policy Development",
        description: "Development or strengthening of health system strategy, policies, and frameworks aligned to national health goals and international standards.",
        order: 2,
        typicalWeeks: 7,
        keyActivities: [
          "Health system strategy design",
          "Policy framework development",
          "Regulatory environment review",
          "Health financing reform design",
          "UHC pathway development",
          "Stakeholder consultation facilitation",
        ],
        keyDeliverables: [
          "Health System Strategy Document",
          "Policy Framework",
          "Health Financing Reform Proposal",
          "Consultation Report",
        ],
        gates: [
          { name: "Strategy Approval Gate", criteria: "Strategy and policy frameworks validated by client leadership and key stakeholders.", order: 1 },
        ],
      },
      {
        name: "Implementation Planning",
        description: "Translation of strategy into executable implementation plans with clear ownership, resource requirements, timelines, and M&E frameworks.",
        order: 3,
        typicalWeeks: 5,
        keyActivities: [
          "Implementation plan development",
          "Resource mobilisation strategy",
          "M&E framework design",
          "Implementation capacity assessment",
          "Risk register development",
          "Coordination mechanisms design",
        ],
        keyDeliverables: [
          "Implementation Plan",
          "M&E Framework",
          "Resource Mobilisation Plan",
          "Risk Register",
        ],
        gates: [
          { name: "Planning Gate", criteria: "Implementation plan approved with confirmed ownership and resource commitments.", order: 1 },
        ],
      },
      {
        name: "Implementation Support & Oversight",
        description: "CFA embeds advisory support during implementation, providing technical expertise, troubleshooting, and course correction as the plan meets the reality of the health system.",
        order: 4,
        typicalWeeks: 9,
        keyActivities: [
          "Technical assistance delivery",
          "Implementation monitoring",
          "Issue identification and resolution",
          "Stakeholder coordination",
          "Progress reporting to client",
          "Adaptive management support",
        ],
        keyDeliverables: [
          "Monthly Implementation Progress Reports",
          "Issue Log and Resolution Register",
          "Adaptive Management Notes",
          "Mid-Term Review Report",
        ],
        gates: [
          { name: "Mid-Term Gate", criteria: "Mid-term review confirms implementation on track and adaptive changes made where needed.", order: 1 },
          { name: "Completion Gate", criteria: "Final deliverables accepted and outcomes documented against M&E framework targets.", order: 2 },
        ],
      },
    ],
  },

  {
    name: "CFA Embedded Medical Director Programme™",
    slug: "cfa-embedded-medical-director",
    description:
      "CFA's EM-as-a-Service model. Provides hospitals with a senior clinical leader functioning as Medical Director or Chief Medical Officer on an embedded basis — delivering clinical governance, medical staff management, and quality leadership without a permanent hire.",
    category: "cfa_proprietary",
    serviceTypes: ["EM_AS_SERVICE", "CLINICAL_GOVERNANCE"],
    estimatedWeeks: 52,
    sortOrder: 54,
    isActive: true,
    phases: [
      {
        name: "Clinical Leadership Onboarding",
        description: "CFA embedded Medical Director integrates into the institution. Full clinical situational assessment conducted, medical staff relationships established, and clinical governance baseline set.",
        order: 1,
        typicalWeeks: 4,
        keyActivities: [
          "Medical staff introductions and relationship building",
          "Clinical governance status review",
          "Existing committee and meeting audit",
          "Medical staff file and credentialling review",
          "Clinical performance data baseline",
          "Priority clinical leadership actions identified",
        ],
        keyDeliverables: [
          "Clinical Leadership Onboarding Report",
          "Medical Staff Register",
          "Clinical Governance Status Assessment",
          "30-Day Priority Action List",
        ],
        gates: [
          { name: "Onboarding Gate", criteria: "Board and CEO confirm Medical Director is fully integrated and has the authority needed to function effectively.", order: 1 },
        ],
      },
      {
        name: "Active Clinical Leadership",
        description: "Ongoing embedded clinical leadership. Medical Director leads clinical governance, manages medical staff, drives quality improvement, and represents the clinical voice to the board and management.",
        order: 2,
        typicalWeeks: 44,
        keyActivities: [
          "Clinical governance committee chair",
          "Medical staff management and performance",
          "Quality improvement programme leadership",
          "Mortality and morbidity review facilitation",
          "Board clinical reporting",
          "Incident management and investigation",
          "Credentialling and privileging",
          "Clinical policy development and enforcement",
          "Recruitment and retention of clinical staff",
        ],
        keyDeliverables: [
          "Monthly Clinical Performance Report (to Board)",
          "Quarterly Clinical Governance Report",
          "M&M Review Reports",
          "Quality Improvement Programme Update",
          "Medical Staff Performance Reports",
        ],
        gates: [
          { name: "6-Month Review Gate", criteria: "Board and CEO performance review confirms Medical Director is delivering against agreed clinical leadership objectives.", order: 1 },
          { name: "12-Month Review Gate", criteria: "Annual review confirms sustained clinical performance improvement and transition plan agreed.", order: 2 },
        ],
      },
      {
        name: "Transition to Permanent Leadership",
        description: "Structured handover to permanent Medical Director or CMO. CFA manages the recruitment process, provides handover documentation, and ensures the incoming leader is set up for success.",
        order: 3,
        typicalWeeks: 4,
        keyActivities: [
          "Permanent Medical Director recruitment support",
          "Structured handover documentation",
          "Incoming leader orientation and briefing",
          "Clinical governance system handover",
          "Relationship introductions to medical staff",
          "Post-handover advisory support arrangement",
        ],
        keyDeliverables: [
          "Clinical Leadership Handover Pack",
          "Medical Staff Briefing",
          "Governance System Documentation",
          "Post-Handover Support Plan",
        ],
        gates: [
          { name: "Handover Gate", criteria: "Permanent Medical Director in post and confirmed capable of leading clinical governance independently.", order: 1 },
        ],
      },
    ],
  },

  {
    name: "CFA Diaspora Healthcare Expertise Programme™",
    slug: "cfa-diaspora-expertise",
    description:
      "CFA's structured model for deploying African diaspora healthcare professionals into short-term high-impact assignments. Bridges the gap between diaspora intent and institutional readiness to absorb expertise.",
    category: "cfa_proprietary",
    serviceTypes: ["DIASPORA_EXPERTISE", "HEALTH_SYSTEMS"],
    estimatedWeeks: 12,
    sortOrder: 55,
    isActive: true,
    phases: [
      {
        name: "Institution Readiness & Expert Matching",
        description: "Assessment of the institution's specific expertise needs and matching with the most suitable diaspora professional from CFA's network. Both parties prepared for a productive engagement.",
        order: 1,
        typicalWeeks: 3,
        keyActivities: [
          "Institution needs assessment",
          "Expert profile matching",
          "Scope of work co-design",
          "Engagement terms and expectations alignment",
          "Logistics and access arrangements",
          "Pre-deployment briefing",
        ],
        keyDeliverables: [
          "Needs Assessment Report",
          "Expert Match Profile",
          "Scope of Work Document",
          "Pre-Deployment Briefing Pack",
        ],
        gates: [
          { name: "Match Confirmation", criteria: "Institution leadership and diaspora expert confirm scope, expectations, and logistics before deployment.", order: 1 },
        ],
      },
      {
        name: "In-Country Deployment",
        description: "Active deployment period. Diaspora expert embedded in the institution delivering their specific expertise while CFA provides ongoing support for both expert and host institution.",
        order: 2,
        typicalWeeks: 6,
        keyActivities: [
          "Structured work programme execution",
          "Knowledge transfer sessions",
          "Mentoring of local counterparts",
          "System or protocol development",
          "CFA check-in and support",
          "Real-time issue resolution",
        ],
        keyDeliverables: [
          "Weekly Deployment Progress Reports",
          "Knowledge Transfer Documentation",
          "Protocols or Systems Delivered",
          "Counterpart Development Log",
        ],
        gates: [
          { name: "Mid-Point Review", criteria: "CFA, expert, and institution review confirms deployment on track and any scope adjustments made.", order: 1 },
        ],
      },
      {
        name: "Impact Documentation & Sustainability",
        description: "Structured close-out ensuring all knowledge is documented, counterparts are equipped to sustain the work, and institutional impact is formally recorded.",
        order: 3,
        typicalWeeks: 3,
        keyActivities: [
          "Impact assessment and documentation",
          "Knowledge and protocol handover",
          "Counterpart readiness confirmation",
          "Institutional feedback collection",
          "CFA impact report preparation",
          "Alumni network integration",
        ],
        keyDeliverables: [
          "Engagement Impact Report",
          "Sustainability Plan",
          "Counterpart Competency Sign-Off",
          "Institution Feedback Report",
        ],
        gates: [
          { name: "Sustainability Gate", criteria: "Counterparts confirmed capable of sustaining delivered work and institution leadership satisfied with outcomes.", order: 1 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding CFA proprietary methodologies...");

  for (const m of methodologies) {
    const { phases, ...mData } = m;
    const clean = (mData.serviceTypes as string[]).filter(s => validServiceTypes.includes(s));

    const existing = await prisma.methodologyTemplate.findUnique({ where: { slug: mData.slug } });
    if (existing) {
      console.log(`  Skipping existing: ${mData.name}`);
      continue;
    }

    const created = await prisma.methodologyTemplate.create({
      data: {
        ...mData,
        serviceTypes: clean,
        phases: {
          create: phases.map(({ gates, ...p }) => ({
            ...p,
            gates: { create: gates },
          })),
        },
      },
    });
    console.log(`  Created: ${created.name}`);
  }

  const total = await prisma.methodologyTemplate.count();
  const proprietary = await prisma.methodologyTemplate.count({ where: { category: "cfa_proprietary" } });
  console.log(`\nDone. Total methodologies: ${total} | CFA Proprietary: ${proprietary}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
