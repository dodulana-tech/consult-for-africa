import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding methodology & framework library...");

  // ─── Methodology Templates ─────────────────────────────────────────────────

  const methodologies = [
    {
      name: "McKinsey 7-Step Problem Solving",
      slug: "mckinsey-7-step",
      description:
        "A structured top-down problem solving approach that defines the problem, disaggregates it, prioritises, develops a workplan, conducts analysis, synthesises findings, and communicates recommendations. The gold standard for strategy and operations engagements.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "HEALTH_SYSTEMS"],
      estimatedWeeks: 12,
      sortOrder: 1,
      phases: [
        {
          name: "Define the Problem",
          description: "Articulate the problem statement, scope, and success criteria with the client.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: ["Stakeholder interviews", "Problem statement workshop", "Scope definition"],
          keyDeliverables: ["Problem statement document", "Project charter"],
          gates: [
            { name: "Client sign-off on problem statement", criteria: "Client has reviewed and approved the scoped problem statement in writing.", order: 1 },
          ],
        },
        {
          name: "Disaggregate the Problem",
          description: "Break the problem into constituent parts using issue trees and MECE logic.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: ["Issue tree development", "MECE decomposition workshop", "Hypothesis generation"],
          keyDeliverables: ["Issue tree", "Initial hypotheses list"],
          gates: [],
        },
        {
          name: "Prioritise Issues",
          description: "Rank issues by impact and feasibility; agree focus areas with client.",
          order: 3,
          typicalWeeks: 1,
          keyActivities: ["Prioritisation matrix", "Client alignment session"],
          keyDeliverables: ["Prioritised issue list", "Focus area brief"],
          gates: [
            { name: "Focus areas aligned with client", criteria: "Client has agreed on the top 3-5 issues to investigate.", order: 1 },
          ],
        },
        {
          name: "Develop Workplan",
          description: "Design analyses, assign ownership, and set timelines for each issue.",
          order: 4,
          typicalWeeks: 1,
          keyActivities: ["Workplan development", "Data collection planning", "Team role assignment"],
          keyDeliverables: ["Detailed workplan", "Data request list"],
          gates: [],
        },
        {
          name: "Conduct Analyses",
          description: "Execute analyses, gather data, test and refine hypotheses.",
          order: 5,
          typicalWeeks: 5,
          keyActivities: [
            "Quantitative data analysis",
            "Qualitative interviews",
            "Benchmarking",
            "Process observation",
            "Financial modelling",
          ],
          keyDeliverables: ["Analysis workbooks", "Interview transcripts", "Interim findings brief"],
          gates: [
            { name: "Mid-point review", criteria: "Interim findings presented to client; no major scope changes required.", order: 1 },
          ],
        },
        {
          name: "Synthesise Findings",
          description: "Build the narrative, develop recommendations, and stress-test conclusions.",
          order: 6,
          typicalWeeks: 2,
          keyActivities: ["Storyline development", "Recommendation stress-testing", "Financial impact modelling"],
          keyDeliverables: ["Findings synthesis deck", "Recommendations document"],
          gates: [],
        },
        {
          name: "Communicate Recommendations",
          description: "Present final recommendations and transition to implementation.",
          order: 7,
          typicalWeeks: 1,
          keyActivities: ["Executive presentation", "Implementation roadmap handover", "Knowledge transfer"],
          keyDeliverables: ["Final recommendations deck", "Implementation roadmap"],
          gates: [
            { name: "Final presentation delivered", criteria: "Final recommendations deck presented to and accepted by client executive team.", order: 1 },
          ],
        },
      ],
    },
    {
      name: "Lean Healthcare Transformation",
      slug: "lean-healthcare",
      description:
        "Applies lean manufacturing principles (value stream mapping, waste elimination, standard work) to hospital operations. Improves patient flow, reduces waiting times, and lowers operational costs without capital expenditure.",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 16,
      sortOrder: 2,
      phases: [
        {
          name: "Define Value & Scope",
          description: "Identify value from the patient perspective and select transformation scope.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: ["Patient journey mapping", "Voice of customer interviews", "Scope agreement workshop"],
          keyDeliverables: ["Patient value definition", "Scope charter"],
          gates: [
            { name: "Scope approved by hospital leadership", criteria: "CEO/MD has approved transformation scope and committed champion resources.", order: 1 },
          ],
        },
        {
          name: "Map Current State",
          description: "Create detailed value stream maps of current processes and identify waste.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: ["Value stream mapping workshops", "Time and motion studies", "Waste identification (8 wastes)"],
          keyDeliverables: ["Current state value stream maps", "Waste register"],
          gates: [],
        },
        {
          name: "Design Future State",
          description: "Co-design the improved process with frontline staff using lean principles.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: ["Future state workshop", "Standard work design", "Visual management design", "5S planning"],
          keyDeliverables: ["Future state value stream maps", "Standard operating procedures (draft)"],
          gates: [
            { name: "Future state signed off by clinical leads", criteria: "Clinical directors and nursing leads have approved redesigned processes.", order: 1 },
          ],
        },
        {
          name: "Pilot Implementation",
          description: "Run rapid improvement events (kaizen) in selected units to test changes.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: ["Kaizen events", "5S implementation", "Standard work rollout", "Visual management installation"],
          keyDeliverables: ["Pilot results report", "Updated standard work documents"],
          gates: [
            { name: "Pilot metrics improved", criteria: "At least 2 of 3 target metrics show measurable improvement in pilot unit.", order: 1 },
          ],
        },
        {
          name: "Scale & Sustain",
          description: "Roll out improvements hospital-wide and embed governance to sustain gains.",
          order: 5,
          typicalWeeks: 6,
          keyActivities: ["Full rollout", "Management huddle system setup", "Daily visual management boards", "Leader standard work"],
          keyDeliverables: ["Rollout plan", "Daily management system guide", "Sustainability metrics dashboard"],
          gates: [
            { name: "Sustainability plan in place", criteria: "Hospital has appointed internal lean champion and has operating daily management system.", order: 1 },
          ],
        },
      ],
    },
    {
      name: "Six Sigma DMAIC",
      slug: "six-sigma-dmaic",
      description:
        "Data-driven quality improvement methodology: Define, Measure, Analyse, Improve, Control. Best for reducing defects, errors, and variation in clinical and administrative processes where data is available.",
      category: "Quality",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 14,
      sortOrder: 3,
      phases: [
        {
          name: "Define",
          description: "Define the problem, project goals, and customer requirements.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: ["Project charter creation", "SIPOC analysis", "Voice of customer analysis", "Critical to Quality (CTQ) definition"],
          keyDeliverables: ["Project charter", "SIPOC diagram", "CTQ tree"],
          gates: [
            { name: "Project charter signed", criteria: "Sponsor has signed charter with defined problem statement, goal, scope, and timeline.", order: 1 },
          ],
        },
        {
          name: "Measure",
          description: "Baseline current process performance and validate measurement systems.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: ["Data collection plan", "Measurement system analysis (MSA)", "Process capability analysis", "Baseline sigma calculation"],
          keyDeliverables: ["Data collection plan", "Process capability report", "Baseline sigma level"],
          gates: [
            { name: "Measurement system validated", criteria: "MSA confirms data is reliable (Gauge R&R < 10% or acceptable for context).", order: 1 },
          ],
        },
        {
          name: "Analyse",
          description: "Identify root causes of defects and process variation using statistical tools.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: ["Fishbone (Ishikawa) analysis", "Pareto analysis", "5-Why analysis", "Statistical hypothesis testing", "Regression analysis"],
          keyDeliverables: ["Root cause analysis report", "Key drivers list", "Statistical analysis summary"],
          gates: [],
        },
        {
          name: "Improve",
          description: "Develop, test, and implement solutions to address root causes.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: ["Solution generation (brainstorming, benchmarking)", "Pilot testing", "Design of experiments (DOE)", "Implementation planning"],
          keyDeliverables: ["Solution options matrix", "Pilot results", "Implementation plan"],
          gates: [
            { name: "Pilot results meet target", criteria: "Pilot data demonstrates statistically significant improvement toward sigma target.", order: 1 },
          ],
        },
        {
          name: "Control",
          description: "Sustain improvements through control plans, monitoring, and handover.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: ["Control plan development", "Statistical process control (SPC) charts", "Response plan for out-of-control signals", "Handover to process owner"],
          keyDeliverables: ["Control plan", "SPC chart templates", "Handover document", "Final project report"],
          gates: [
            { name: "Control plan live and owned", criteria: "Process owner has accepted handover and control plan is actively being used.", order: 1 },
          ],
        },
      ],
    },
    {
      name: "PDSA Improvement Cycle",
      slug: "pdsa-cycle",
      description:
        "Plan-Do-Study-Act iterative improvement model used widely in healthcare quality improvement. Best for smaller-scale, faster-cycle improvements where rapid learning and adaptation are needed.",
      category: "Quality",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS", "DIGITAL_HEALTH"],
      estimatedWeeks: 8,
      sortOrder: 4,
      phases: [
        {
          name: "Plan",
          description: "Identify the improvement goal, predict outcomes, and plan the test.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: ["Aim statement definition", "Baseline data review", "Change theory development", "Test plan creation"],
          keyDeliverables: ["PDSA plan document", "Aim statement", "Prediction of results"],
          gates: [],
        },
        {
          name: "Do",
          description: "Carry out the planned test on a small scale; document what happens.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: ["Small-scale test execution", "Real-time data collection", "Observation and documentation", "Problem logging"],
          keyDeliverables: ["Test execution log", "Data collected during test"],
          gates: [],
        },
        {
          name: "Study",
          description: "Analyse results, compare to predictions, and identify learnings.",
          order: 3,
          typicalWeeks: 1,
          keyActivities: ["Data analysis vs prediction", "Root cause review of gaps", "Team learning session"],
          keyDeliverables: ["Study report", "Key learnings summary"],
          gates: [
            { name: "Team agrees on findings", criteria: "Clinical and management team have reviewed study findings and agreed on interpretation.", order: 1 },
          ],
        },
        {
          name: "Act",
          description: "Decide to adopt, adapt, or abandon; plan the next cycle.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Adoption or adaptation decision",
            "Next cycle planning",
            "Broader rollout if successful",
            "Documentation update",
          ],
          keyDeliverables: ["Act decision document", "Updated standard work", "Next PDSA plan (if iterating)"],
          gates: [
            { name: "Adopt/Adapt/Abandon decision made", criteria: "Formal decision documented with rationale; next steps assigned.", order: 1 },
          ],
        },
      ],
    },
    {
      name: "Revenue Cycle Excellence",
      slug: "revenue-cycle-excellence",
      description:
        "End-to-end revenue cycle optimisation for hospitals: patient access, charge capture, coding, billing, denial management, and collections. Designed for Nigerian private hospitals seeking to reduce revenue leakage and improve cash flow.",
      category: "Revenue",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 20,
      sortOrder: 5,
      phases: [
        {
          name: "Revenue Cycle Diagnostic",
          description: "Comprehensive audit of the entire revenue cycle from registration to final payment.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Patient registration accuracy audit",
            "Charge capture gap analysis",
            "Coding accuracy review",
            "Billing turnaround time analysis",
            "Denial and write-off pattern analysis",
            "HMO contract review",
          ],
          keyDeliverables: ["Revenue cycle diagnostic report", "Leakage quantification", "Quick wins list"],
          gates: [
            { name: "Diagnostic findings presented to CFO/COO", criteria: "Diagnostic findings and estimated revenue leakage presented and accepted by finance leadership.", order: 1 },
          ],
        },
        {
          name: "Patient Access Improvement",
          description: "Optimise patient registration, insurance verification, and pre-authorisation processes.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Insurance eligibility verification process redesign",
            "Pre-authorisation workflow improvement",
            "Registration accuracy training",
            "Point-of-service collection protocol",
          ],
          keyDeliverables: ["Updated registration SOPs", "Pre-auth tracking tool", "Patient access training materials"],
          gates: [],
        },
        {
          name: "Charge Capture & Coding Optimisation",
          description: "Close charge capture gaps and improve coding accuracy to reduce undercoding and denials.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Charge master review and update",
            "Coder productivity and accuracy assessment",
            "ICD-10 coding training",
            "Physician documentation improvement",
          ],
          keyDeliverables: ["Updated charge master", "Coding accuracy scorecard", "Documentation improvement guide"],
          gates: [
            { name: "Charge master approved", criteria: "Updated charge master reviewed by clinical and finance leadership and approved.", order: 1 },
          ],
        },
        {
          name: "Billing & Collections Enhancement",
          description: "Accelerate billing cycles and improve collections from HMOs and self-pay patients.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Clean claim rate improvement",
            "Billing turnaround time reduction",
            "HMO follow-up protocol strengthening",
            "Self-pay collection strategy",
            "Payment plan programs",
          ],
          keyDeliverables: ["Clean claim protocol", "HMO collections tracker", "Self-pay strategy document"],
          gates: [],
        },
        {
          name: "Denial Management Programme",
          description: "Build proactive denial prevention and systematic appeals process.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Denial root cause analysis by payer and reason code",
            "Prevention protocol for top denial reasons",
            "Appeals workflow and template development",
            "Denial tracking dashboard setup",
          ],
          keyDeliverables: ["Denial prevention protocols", "Appeals templates", "Denial management dashboard"],
          gates: [
            { name: "Denial rate below 15%", criteria: "Monthly denial rate from top 3 HMOs has dropped below 15% or improved by 5 percentage points.", order: 1 },
          ],
        },
        {
          name: "Governance & Sustainability",
          description: "Embed revenue cycle governance, KPI monitoring, and continuous improvement.",
          order: 6,
          typicalWeeks: 2,
          keyActivities: [
            "Revenue cycle committee setup",
            "KPI dashboard finalisation",
            "Monthly review cadence establishment",
            "Staff performance management integration",
          ],
          keyDeliverables: ["Revenue cycle governance charter", "KPI dashboard", "Sustainability plan"],
          gates: [
            { name: "Revenue cycle committee operational", criteria: "First formal committee meeting held with CFO, billing manager, and coding lead.", order: 1 },
          ],
        },
      ],
    },
    {
      name: "JCI Accreditation Readiness Framework™",
      slug: "jci-accreditation-readiness",
      description:
        "CFA's proprietary end-to-end roadmap for preparing large hospitals (200+ beds) to achieve Joint Commission International (JCI) accreditation. Covers gap analysis, phased standards implementation across all 16 JCI chapters, mock survey, and post-survey remediation. Typically 18-24 months for de novo applicants.",
      category: "cfa_proprietary",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 88,
      sortOrder: 6,
      phases: [
        {
          name: "Gap Analysis & Readiness Assessment",
          description:
            "Conduct a comprehensive baseline review against all JCI International Patient Safety Goals (IPSGs) and chapter standards to quantify the accreditation gap and prioritise workstreams.",
          order: 1,
          typicalWeeks: 5,
          keyActivities: [
            "Document review across all 16 JCI chapters",
            "Facility walkthrough and physical environment survey",
            "Staff interviews and competency spot-checks",
            "Patient record review against IPSG standards",
            "Quantitative gap scoring (Compliant / Partially / Non-Compliant)",
            "Stakeholder alignment workshop with CMO, CNO, and COO",
          ],
          keyDeliverables: [
            "JCI Gap Analysis Report (chapter-by-chapter scoring)",
            "Prioritised remediation roadmap",
            "Quick wins list (addressable within 30 days)",
            "Accreditation project charter",
          ],
          gates: [
            {
              name: "Board / Executive sign-off on accreditation roadmap",
              criteria:
                "Hospital board and CEO have formally approved the remediation roadmap, budget envelope, and 18-24 month timeline. Named accreditation champion appointed.",
              order: 1,
            },
          ],
        },
        {
          name: "Implementation Phase 1 - Foundational Standards",
          description:
            "Address foundational JCI requirements: governance, patient rights, quality improvement systems, infection prevention, and International Patient Safety Goals.",
          order: 2,
          typicalWeeks: 18,
          keyActivities: [
            "Governance and leadership policy development (GLD chapter)",
            "Patient rights policy rollout and staff training",
            "Hospital-wide infection prevention and control programme",
            "IPSG implementation: patient identification, handoff communication, medication safety, falls prevention, surgical safety checklist",
            "Quality and patient safety committee operationalisation",
            "Incident reporting system launch",
            "Credentialing and privileging system setup (SQE chapter)",
          ],
          keyDeliverables: [
            "Governance policy manual",
            "IPSG compliance evidence folder",
            "Infection prevention programme documentation",
            "Credentialing files for all clinical staff",
            "Incident reporting dashboard",
          ],
          gates: [
            {
              name: "Phase 1 internal compliance review passed",
              criteria:
                "Internal audit confirms at least 70% compliance on foundational chapters (GLD, PFR, IPSG, PCI). All IPSGs have documented evidence of implementation.",
              order: 1,
            },
          ],
        },
        {
          name: "Implementation Phase 2 - Clinical and Operational Standards",
          description:
            "Implement clinical care, medication management, facility management, and information management standards to close remaining gaps identified in Phase 1 review.",
          order: 3,
          typicalWeeks: 18,
          keyActivities: [
            "Clinical care pathway development (COP chapter)",
            "Anaesthesia and surgical care protocols (ASC chapter)",
            "Medication management system overhaul (MMU chapter)",
            "Facility management and safety programme (FMS chapter)",
            "Medical records standardisation (MCI chapter)",
            "Staff education and training programme rollout (SQE chapter)",
            "Emergency management and disaster preparedness drills",
          ],
          keyDeliverables: [
            "Clinical care pathways for top 10 DRGs",
            "Medication management policy and pharmacy protocols",
            "Facility management safety plan",
            "Standardised medical record format",
            "Staff training completion certificates and records",
          ],
          gates: [
            {
              name: "Pre-mock survey readiness confirmed",
              criteria:
                "Comprehensive internal audit shows overall compliance above 80% across all chapters. All critical findings from Phase 1 gate closed. Mock survey scheduled.",
              order: 1,
            },
          ],
        },
        {
          name: "Mock Survey & Remediation",
          description:
            "Conduct a full simulation JCI survey with external surveyor or CFA surveyor team. Identify residual findings and execute targeted remediation before the actual survey.",
          order: 4,
          typicalWeeks: 10,
          keyActivities: [
            "Full mock survey (2-3 days) simulating JCI methodology: document review, tracer methodology, facility tour, staff interviews",
            "Mock survey findings debrief with leadership",
            "Remediation planning for all Priority Focus Areas",
            "Staff competency drills for commonly failed IPSG tracers",
            "Final document completeness check",
            "JCI application submission support",
          ],
          keyDeliverables: [
            "Mock survey report with chapter-level scores",
            "Remediation action plan",
            "Tracer activity drill results",
            "Completed JCI application package",
          ],
          gates: [
            {
              name: "Mock survey score above JCI threshold",
              criteria:
                "Mock survey composite score meets or exceeds JCI passing threshold (typically 80%+ Fully Met). All Immediate Threat to Life (ITL) findings resolved. JCI application submitted.",
              order: 1,
            },
          ],
        },
        {
          name: "JCI Survey & Post-Survey Closure",
          description:
            "Support the hospital through the official JCI survey, manage surveyor interactions, and close any post-survey requirements to achieve the accreditation award.",
          order: 5,
          typicalWeeks: 6,
          keyActivities: [
            "On-site JCI survey support (logistics, document retrieval, staff coordination)",
            "Real-time tracking of surveyor observations",
            "Post-survey findings triage and response plan",
            "Evidence preparation for any Requirement for Improvement (RFI) submissions",
            "JCI accreditation certificate receipt and announcement support",
            "Sustainability plan handover to hospital accreditation committee",
          ],
          keyDeliverables: [
            "Survey observation log",
            "RFI response submissions (if required)",
            "Accreditation sustainability plan",
            "Lessons learned and post-accreditation roadmap",
          ],
          gates: [
            {
              name: "JCI accreditation awarded",
              criteria:
                "Hospital receives official JCI accreditation certificate. Any conditional findings fully closed within JCI stipulated timeline. Internal accreditation committee operational for renewal cycle.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "SafeCare Certification Readiness Framework™",
      slug: "safecare-certification-readiness",
      description:
        "CFA's proprietary step-by-step programme for small and medium hospitals (under 200 beds) to achieve SafeCare Level 4 or Level 5 certification. SafeCare is the WHO/IFC-endorsed quality improvement programme widely used in sub-Saharan Africa. Typically 12-18 months from baseline to Level 4.",
      category: "cfa_proprietary",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 60,
      sortOrder: 7,
      phases: [
        {
          name: "Baseline Assessment & Level Scoring",
          description:
            "Conduct an official SafeCare baseline assessment to establish the current certification level and generate a prioritised improvement plan.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "SafeCare baseline assessment using official SafeCare tool (12 topic areas, 250+ standards)",
            "Department walkthroughs and document review",
            "Staff competency and knowledge interviews",
            "SafeCare level scoring (Levels 1-5) across all topic areas",
            "Gap quantification and quick wins identification",
            "Leadership alignment workshop",
          ],
          keyDeliverables: [
            "Official SafeCare baseline assessment report",
            "Level-by-topic gap summary",
            "Prioritised improvement roadmap",
            "SafeCare project charter",
          ],
          gates: [
            {
              name: "Baseline report accepted and roadmap approved",
              criteria:
                "Hospital leadership has accepted the baseline assessment findings and formally approved the improvement roadmap with named champions per topic area.",
              order: 1,
            },
          ],
        },
        {
          name: "Level 1 Foundations",
          description:
            "Address Level 1 (basic minimum) requirements across all SafeCare topic areas to establish a safe baseline: patient identification, infection prevention basics, emergency preparedness, and essential documentation.",
          order: 2,
          typicalWeeks: 14,
          keyActivities: [
            "Patient identification wristband and protocol implementation",
            "Basic infection prevention: handwashing compliance, waste segregation, PPE availability",
            "Fire safety and emergency evacuation procedures",
            "Drug storage and basic medication safety",
            "Minimum patient record documentation standards",
            "Staff health screening and occupational safety basics",
          ],
          keyDeliverables: [
            "Level 1 compliance evidence folder (per topic area)",
            "Infection prevention and control policy",
            "Emergency preparedness plan",
            "Basic medication management SOP",
          ],
          gates: [
            {
              name: "Level 1 internal compliance confirmed",
              criteria:
                "Internal audit confirms full compliance with all Level 1 standards across all applicable topic areas. No critical patient safety gaps remaining.",
              order: 1,
            },
          ],
        },
        {
          name: "Level 2-3 Progression",
          description:
            "Build structured clinical and administrative systems to achieve Levels 2 and 3, establishing consistent processes, quality monitoring, and staff competency across all departments.",
          order: 3,
          typicalWeeks: 24,
          keyActivities: [
            "Clinical protocols and care pathway development for top admitting diagnoses",
            "Triage and emergency care system strengthening",
            "Pharmacy formulary management and medication reconciliation",
            "Lab and radiology quality controls and turnaround time standards",
            "Maternal and neonatal safety protocols",
            "Surgical and anaesthesia safety checklist implementation",
            "Staff training records and competency assessment system",
            "Basic quality improvement committee and incident reporting",
          ],
          keyDeliverables: [
            "Clinical protocol library (top 15 conditions)",
            "Department quality scorecards",
            "Surgical safety checklist compliance data",
            "Staff training and competency records",
            "Incident log and learning report",
          ],
          gates: [
            {
              name: "Level 3 re-assessment passed",
              criteria:
                "SafeCare formal or internal re-assessment confirms Level 3 in at least 10 of 12 topic areas. Remaining gaps documented with remediation plan.",
              order: 1,
            },
          ],
        },
        {
          name: "Level 4-5 Aspiration",
          description:
            "Advance to Level 4 (systematic, evidence-based practice) and optionally Level 5 (continuous improvement culture), embedding data-driven quality governance and preparing for external certification.",
          order: 4,
          typicalWeeks: 34,
          keyActivities: [
            "Clinical audit programme across all major specialties",
            "Patient satisfaction measurement system",
            "Outcome data collection and benchmarking",
            "Advanced infection prevention: bundles, surveillance, antimicrobial stewardship",
            "Equipment maintenance and calibration programme",
            "Staff performance management integration with quality metrics",
            "Formal SafeCare Level 4/5 external assessment preparation",
            "Accreditation sustainability and governance handover",
          ],
          keyDeliverables: [
            "Clinical audit results and improvement actions",
            "Patient satisfaction scorecard",
            "SafeCare Level 4 compliance evidence package",
            "Quality governance framework",
            "Sustainability and renewal plan",
          ],
          gates: [
            {
              name: "SafeCare Level 4 certification awarded",
              criteria:
                "Official SafeCare external assessment confirms Level 4 certification. Hospital quality committee is fully operational and owns the ongoing improvement cycle.",
              order: 1,
            },
          ],
        },
      ],
    },
  ];

  for (const m of methodologies) {
    const { phases, ...mData } = m;
    const existing = await prisma.methodologyTemplate.findUnique({ where: { slug: mData.slug } });
    if (existing) {
      console.log(`  Skipping existing methodology: ${mData.name}`);
      continue;
    }
    const created = await prisma.methodologyTemplate.create({
      data: {
        ...mData,
        phases: {
          create: phases.map(({ gates, ...p }) => ({
            ...p,
            gates: { create: gates },
          })),
        },
      },
    });
    console.log(`  Created methodology: ${created.name}`);
  }

  // ─── Framework Templates ───────────────────────────────────────────────────

  const frameworks = [
    // Strategic Analysis
    {
      name: "SWOT Analysis",
      slug: "swot",
      description: "Assesses internal Strengths and Weaknesses alongside external Opportunities and Threats to inform strategic positioning.",
      category: "Strategic Analysis",
      dimensions: ["Strengths", "Weaknesses", "Opportunities", "Threats"],
      guideText: "Focus strengths/weaknesses on internal capabilities vs competitors. For Nigerian healthcare, opportunities should address unmet patient demand and digital leapfrogging.",
      sortOrder: 1,
    },
    {
      name: "PESTLE Analysis",
      slug: "pestle",
      description: "Scans the macro-environment across Political, Economic, Social, Technological, Legal, and Environmental dimensions.",
      category: "Strategic Analysis",
      dimensions: ["Political", "Economic", "Social", "Technological", "Legal", "Environmental"],
      guideText: "Nigerian context: Political = NHIA/NHIS policy changes, state vs federal jurisdiction; Economic = FX risk, inflation on imported equipment; Regulatory = HEFAMAA, SON, NAFDAC.",
      sortOrder: 2,
    },
    {
      name: "Porter's Five Forces",
      slug: "porters-five-forces",
      description: "Analyses industry competitive dynamics through five structural forces to assess long-term profitability.",
      category: "Strategic Analysis",
      dimensions: [
        "Threat of New Entrants",
        "Bargaining Power of Suppliers",
        "Bargaining Power of Buyers",
        "Threat of Substitutes",
        "Competitive Rivalry",
      ],
      guideText: "In Nigerian private healthcare: Buyers = HMOs and self-pay patients (high power); Substitutes = medical tourism to India/UAE; New entrants = Diaspora-funded hospitals.",
      sortOrder: 3,
    },
    {
      name: "Ansoff Growth Matrix",
      slug: "ansoff-matrix",
      description: "Strategic framework for growth decisions across market and product dimensions.",
      category: "Strategic Analysis",
      dimensions: ["Market Penetration", "Product Development", "Market Development", "Diversification"],
      guideText: "Map each quadrant to specific service and geography opportunities. Diversification carries highest risk in capital-constrained Nigerian hospital environment.",
      sortOrder: 4,
    },
    // Operational
    {
      name: "Process Flow Analysis",
      slug: "process-flow",
      description: "Maps end-to-end process steps, decision points, wait times, and handoffs to identify bottlenecks and waste.",
      category: "Operational",
      dimensions: ["Process Steps", "Decision Points", "Wait Times & Bottlenecks", "Handoffs & Interfaces", "Waste Identified", "Improvement Opportunities"],
      guideText: "Use swim-lane format where multiple roles are involved. Time-stamp each step in the hospital context. Quantify wait time impact in patient volume terms.",
      sortOrder: 5,
    },
    {
      name: "Root Cause Analysis (5-Why)",
      slug: "five-why",
      description: "Iterative questioning technique to drill from symptom to root cause by asking 'Why?' five times.",
      category: "Operational",
      dimensions: ["Problem Statement", "Why 1", "Why 2", "Why 3", "Why 4", "Why 5 (Root Cause)", "Corrective Action"],
      guideText: "Stop at the level where a corrective action is feasible. In healthcare, often reaches systemic issues: training gaps, policy absence, or resource constraints.",
      sortOrder: 6,
    },
    {
      name: "Capacity & Demand Analysis",
      slug: "capacity-demand",
      description: "Matches service capacity against patient demand to identify over/under-utilisation patterns.",
      category: "Operational",
      dimensions: ["Current Capacity", "Current Demand", "Peak vs Off-Peak Patterns", "Utilisation Rate", "Capacity Gap", "Options to Close Gap"],
      guideText: "Nigerian hospitals: OPD often 60-70% of revenue. Map hourly demand patterns vs staffing schedules. Theatre utilisation below 70% is common improvement target.",
      sortOrder: 7,
    },
    // Financial
    {
      name: "Revenue Leakage Assessment",
      slug: "revenue-leakage",
      description: "Quantifies lost revenue across the revenue cycle from service delivery to final collection.",
      category: "Financial",
      dimensions: [
        "Unregistered / Undocumented Services",
        "Charge Capture Gaps",
        "Coding Errors & Undercoding",
        "Billing Denials & Write-offs",
        "HMO Underpayments",
        "Self-Pay Uncollected",
        "Total Leakage Estimate",
      ],
      guideText: "Typical Nigerian private hospital revenue leakage is 15-25% of gross revenue. Quantify each category in NGN and as % of gross revenue for impact prioritisation.",
      sortOrder: 8,
    },
    {
      name: "Unit Economics Model",
      slug: "unit-economics",
      description: "Analyses profitability at the service/department level to inform pricing, resource allocation, and investment decisions.",
      category: "Financial",
      dimensions: ["Revenue per Unit", "Direct Variable Costs", "Contribution Margin", "Fixed Cost Allocation", "Net Margin per Unit", "Volume Sensitivity"],
      guideText: "Build per-procedure or per-bed-day unit economics. Separate HMO vs self-pay economics. Most Nigerian hospitals lack this visibility - it's high-impact to establish.",
      sortOrder: 9,
    },
    // Stakeholder
    {
      name: "Stakeholder Mapping",
      slug: "stakeholder-map",
      description: "Identifies and prioritises stakeholders by influence and interest to guide engagement strategy.",
      category: "Stakeholder",
      dimensions: ["High Influence / High Interest", "High Influence / Low Interest", "Low Influence / High Interest", "Low Influence / Low Interest", "Engagement Strategy"],
      guideText: "In hospital transformations: CMO and senior nurses are often high influence. Community leaders matter for government hospitals. HMOs are high influence external stakeholders.",
      sortOrder: 10,
    },
    {
      name: "Change Readiness Assessment",
      slug: "change-readiness",
      description: "Evaluates the organisation's capacity and willingness to absorb and sustain change.",
      category: "Stakeholder",
      dimensions: ["Leadership Commitment", "Staff Awareness & Buy-in", "Past Change Track Record", "Resource & Capacity", "Systems & Process Readiness", "Overall Readiness Score"],
      guideText: "Score each dimension 1-5. Composite below 3.0 = high resistance risk; plan heavier change management. Pay attention to clinical staff readiness - key change agents in hospitals.",
      sortOrder: 11,
    },
    // Clinical
    {
      name: "Clinical Governance Review",
      slug: "clinical-governance",
      description: "Assesses the structures, processes, and culture that ensure safe, high-quality patient care.",
      category: "Clinical",
      dimensions: [
        "Clinical Audit & Quality Monitoring",
        "Incident Reporting & Learning",
        "Credentialing & Staff Competency",
        "Clinical Protocols & Guidelines",
        "Patient Safety Culture",
        "Infection Prevention & Control",
      ],
      guideText: "Use HEFAMAA standards as baseline for Nigerian hospitals. Rate each dimension (Compliant / Partially Compliant / Non-Compliant). Link gaps to patient safety risk.",
      sortOrder: 12,
    },
    {
      name: "Patient Experience Journey Map",
      slug: "patient-journey",
      description: "Maps the patient's end-to-end experience from awareness through discharge to identify pain points and moments of truth.",
      category: "Clinical",
      dimensions: ["Pre-arrival", "Arrival & Registration", "Triage / Consultation", "Investigation & Treatment", "Discharge & Payment", "Post-discharge Follow-up"],
      guideText: "Capture patient quotes at each stage. Rate experience 1-5. Identify top 3 pain points. In Nigerian hospitals, wait time and payment experience are usually lowest-rated.",
      sortOrder: 13,
    },
    // Digital Health
    {
      name: "Digital Maturity Assessment",
      slug: "digital-maturity",
      description: "Benchmarks the organisation's digital health capabilities against best practice to prioritise investment.",
      category: "Digital",
      dimensions: [
        "Electronic Health Records",
        "Clinical Decision Support",
        "Patient Engagement & Telemedicine",
        "Data Analytics & Reporting",
        "Interoperability & Integration",
        "Cybersecurity & Governance",
      ],
      guideText: "Score 0-5 per dimension. Nigerian benchmark: most facilities score 1-2. Focus roadmap on EMR (if absent) and basic analytics first. Avoid leapfrogging to advanced AI without foundations.",
      sortOrder: 14,
    },
  ];

  for (const f of frameworks) {
    const existing = await prisma.frameworkTemplate.findUnique({ where: { slug: f.slug } });
    if (existing) {
      console.log(`  Skipping existing framework: ${f.name}`);
      continue;
    }
    const created = await prisma.frameworkTemplate.create({ data: f });
    console.log(`  Created framework: ${created.name}`);
  }

  console.log("Methodology & framework seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
