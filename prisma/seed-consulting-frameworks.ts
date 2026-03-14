import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding consulting frameworks & advanced methodology library...");

  // ─── METHODOLOGIES ─────────────────────────────────────────────────────────

  const methodologies = [
    // ── CLASSIC CONSULTING ────────────────────────────────────────────────────
    {
      name: "Balanced Scorecard Implementation",
      slug: "balanced-scorecard",
      description:
        "Kaplan & Norton's Balanced Scorecard translates an organisation's strategy into a coherent set of performance measures across four perspectives: Financial, Customer, Internal Processes, and Learning & Growth. Moves beyond lagging financial metrics to a balanced set of leading and lagging indicators that drive strategy execution. The standard framework for hospital strategy deployment and executive performance management.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 14,
      sortOrder: 20,
      phases: [
        {
          name: "Strategy Clarification",
          description:
            "Clarify and validate the organisation's strategy before translating it into the scorecard. Ensure leadership alignment on strategic priorities.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Strategic plan review and gap analysis",
            "Executive interviews (CEO, CMO, CFO, CNO)",
            "SWOT / PESTLE environmental analysis",
            "Strategic theme identification (3-5 themes)",
            "Mission, Vision, and Values validation",
            "Leadership alignment workshop",
          ],
          keyDeliverables: [
            "Strategy Clarity Assessment",
            "Strategic Themes (agreed by leadership)",
            "Mission / Vision / Values Statement",
          ],
          gates: [
            {
              name: "Executive alignment on strategic themes",
              criteria:
                "All C-suite members have agreed on 3-5 strategic themes that will anchor the Balanced Scorecard. Mission and vision statements confirmed.",
              order: 1,
            },
          ],
        },
        {
          name: "Strategy Map Development",
          description:
            "Build a one-page visual strategy map showing cause-and-effect relationships between strategic objectives across all four BSC perspectives.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Objective identification per perspective (3-5 per perspective)",
            "Cause-and-effect linkage mapping",
            "Strategy map workshop (full leadership team)",
            "Narrative development per perspective",
            "Strategy map validation and sign-off",
          ],
          keyDeliverables: [
            "Strategy Map (one-page visual)",
            "Strategic Objectives List (12-20 total)",
            "Strategy Narrative Document",
          ],
          gates: [
            {
              name: "Strategy map approved by board / CEO",
              criteria:
                "Strategy map reviewed and approved by the board or CEO. Cause-and-effect logic validated by clinical and operational leadership.",
              order: 1,
            },
          ],
        },
        {
          name: "Measure & Target Setting",
          description:
            "Select 1-2 KPIs per strategic objective and set ambitious but achievable targets for a 3-year horizon with quarterly milestones.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "KPI selection (1-2 per objective, mix of leading and lagging)",
            "Baseline data gathering",
            "Target-setting workshops (benchmark-informed)",
            "Data owner and collection method assignment",
            "KPI dictionary development (definition, formula, source)",
          ],
          keyDeliverables: [
            "KPI Dictionary (20-40 indicators)",
            "3-Year Targets per KPI",
            "Quarterly Milestone Targets",
            "Data Owner Register",
          ],
          gates: [],
        },
        {
          name: "Strategic Initiatives Alignment",
          description:
            "Identify and prioritise the strategic initiatives (projects and programmes) that will close the gap between current performance and targets.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Current initiatives inventory",
            "Strategic contribution scoring (which initiatives drive which objectives?)",
            "Initiative gap identification",
            "Initiative prioritisation and resource allocation",
            "Initiative owner assignment and timeline",
          ],
          keyDeliverables: [
            "Strategic Initiatives Portfolio",
            "Initiative-to-Objective Linkage Matrix",
            "Strategic Budget Allocation",
          ],
          gates: [],
        },
        {
          name: "Cascade & Embed",
          description:
            "Cascade the corporate scorecard to departments and individual performance plans. Embed BSC reviews into the organisation's governance calendar.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Departmental scorecard development (aligned to corporate)",
            "Individual KPI alignment (job descriptions, appraisals)",
            "Monthly BSC reporting process design",
            "Strategy review meeting cadence establishment",
            "BSC software / dashboard configuration",
            "Staff communication and training",
          ],
          keyDeliverables: [
            "Departmental Scorecards",
            "BSC Reporting Template",
            "Strategy Review Meeting Agenda",
            "BSC Dashboard",
            "Staff Orientation Materials",
          ],
          gates: [
            {
              name: "First strategy review meeting completed",
              criteria:
                "First monthly strategy review meeting held using BSC data. All four perspectives reported. Owners have presented their scorecard sections.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Kotter's 8-Step Change Management",
      slug: "kotter-change-management",
      description:
        "John Kotter's 8-Step Change Model is the most widely adopted framework for managing large-scale organisational change. It addresses both the rational (process, structure) and emotional (culture, motivation) dimensions of transformation. Essential for hospital mergers, clinical pathway redesigns, digital transformation, and any change initiative affecting large numbers of staff.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "EMBEDDED_LEADERSHIP", "TURNAROUND"],
      estimatedWeeks: 26,
      sortOrder: 21,
      phases: [
        {
          name: "Create Urgency & Build Coalition",
          description:
            "Make the compelling case for change, create urgency, and assemble a powerful guiding coalition with the authority to lead transformation.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Data and narrative development for the burning platform",
            "All-hands communication of the case for change",
            "Guiding coalition assembly (formal and informal leaders, clinical champions)",
            "Coalition trust-building activities",
            "Leadership alignment on transformation vision",
          ],
          keyDeliverables: [
            "Case for Change Presentation",
            "Guiding Coalition Membership",
            "Urgency Communication Materials",
          ],
          gates: [
            {
              name: "At least 75% of senior leaders aligned",
              criteria:
                "At least 75% of senior clinical and management leaders are actively endorsing the change. Guiding coalition is operational with clear mandate.",
              order: 1,
            },
          ],
        },
        {
          name: "Vision & Strategy",
          description:
            "Develop a clear, compelling vision for the future state. Define the transformation strategy that will deliver the vision.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Future state visioning workshop",
            "Change vision statement crafting",
            "Transformation strategy development",
            "Communication materials for the vision",
          ],
          keyDeliverables: [
            "Change Vision Statement",
            "Transformation Strategy",
            "Vision Communication Pack",
          ],
          gates: [],
        },
        {
          name: "Communicate the Vision",
          description:
            "Communicate the vision relentlessly through every channel and every leader. The guiding coalition must walk the talk.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Multi-channel communication plan execution (town halls, ward rounds, digital, print)",
            "Leadership messaging and storytelling",
            "Q&A forums and two-way communication",
            "Communication effectiveness measurement (staff understanding surveys)",
          ],
          keyDeliverables: [
            "Communication Campaign Materials",
            "Communication Effectiveness Survey",
            "Leadership Communication Log",
          ],
          gates: [],
        },
        {
          name: "Empower & Remove Barriers",
          description:
            "Remove structural, systemic, and human barriers that prevent staff from acting on the vision. Empower broad-based action.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Barrier identification (survey, interviews, observation)",
            "Structural barrier removal (process redesign, policy changes)",
            "Resistance management (identify and address resistance sources)",
            "Empowerment activities (training, delegation, autonomy)",
            "Quick win project launches",
          ],
          keyDeliverables: [
            "Barrier Register and Resolution Plan",
            "Resistance Management Log",
            "Empowerment Actions",
          ],
          gates: [],
        },
        {
          name: "Generate Short-Term Wins",
          description:
            "Plan and deliver visible, unambiguous improvements within 6-12 months to demonstrate progress, build credibility, and sustain momentum.",
          order: 5,
          typicalWeeks: 8,
          keyActivities: [
            "Quick win project identification (high impact, achievable within 3-6 months)",
            "Quick win delivery",
            "Visible celebration of wins",
            "Linking wins to the broader transformation story",
            "Recognition of change champions",
          ],
          keyDeliverables: [
            "Quick Win Projects Delivered",
            "Win Communication Announcements",
            "Change Champion Recognition",
          ],
          gates: [
            {
              name: "At least 3 visible wins delivered and communicated",
              criteria:
                "At least three credible, measurable improvements delivered and widely communicated. Staff awareness of wins above 60% on pulse survey.",
              order: 1,
            },
          ],
        },
        {
          name: "Consolidate & Accelerate",
          description:
            "Use the credibility from early wins to tackle bigger, harder changes. Don't declare victory too soon.",
          order: 6,
          typicalWeeks: 4,
          keyActivities: [
            "Assessment of progress against transformation goals",
            "Next wave initiative launch",
            "Guiding coalition refresh (add new champions)",
            "Systems and processes aligned to new ways of working",
            "Resistance management for harder changes",
          ],
          keyDeliverables: [
            "Progress Assessment Report",
            "Phase 2 Initiative Plan",
            "Updated Transformation Roadmap",
          ],
          gates: [],
        },
        {
          name: "Anchor in Culture",
          description:
            "Make the new approaches stick by embedding them in culture, hiring, onboarding, and leadership development.",
          order: 7,
          typicalWeeks: 4,
          keyActivities: [
            "Culture measurement (pre/post transformation surveys)",
            "New behaviours linked to performance management",
            "Onboarding and induction updated to reflect new ways of working",
            "Leadership development aligned to transformation values",
            "Stories, symbols, and rituals reinforcing new culture",
          ],
          keyDeliverables: [
            "Culture Survey Results",
            "Updated HR Systems (hiring criteria, appraisals)",
            "Transformation Sustainability Plan",
          ],
          gates: [
            {
              name: "Culture shift evidenced in staff survey",
              criteria:
                "Post-transformation staff survey shows measurable shift toward target culture dimensions. New behaviours observable in daily practice without active reinforcement.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Hospital Strategic Planning",
      slug: "hospital-strategic-planning",
      description:
        "A comprehensive methodology for developing a 3-5 year strategic plan for a hospital or health system. Covers environmental scanning, stakeholder engagement, strategic direction setting, strategy formulation, and execution planning. Produces a board-approved strategic plan with funded initiatives and performance targets. Specifically adapted for Nigerian and African private hospital contexts.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 16,
      sortOrder: 22,
      phases: [
        {
          name: "Environmental Scan & Baseline",
          description:
            "Assess the external environment (market, competition, regulation, technology) and internal capabilities to establish a clear baseline and identify strategic issues.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "PESTLE analysis (Political, Economic, Social, Technological, Legal, Environmental)",
            "Market analysis (catchment population, demand trends, payer mix)",
            "Competitive analysis (competitor mapping, differentiation assessment)",
            "Internal capability assessment (operations, finance, HR, clinical quality)",
            "Patient satisfaction and community needs data review",
            "Financial performance benchmarking",
            "Regulatory landscape review (HEFAMAA, NHIA, state-level)",
          ],
          keyDeliverables: [
            "Environmental Scan Report",
            "SWOT Analysis",
            "Competitor Map",
            "Internal Capability Assessment",
            "Strategic Issues List",
          ],
          gates: [
            {
              name: "Board pre-read of environmental scan",
              criteria:
                "Environmental scan shared with board members ahead of strategy workshop. Key strategic issues endorsed.",
              order: 1,
            },
          ],
        },
        {
          name: "Stakeholder Engagement",
          description:
            "Gather strategic input from key internal and external stakeholders: medical staff, nurses, patients, community, payers, and regulators.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Board and executive leadership interviews",
            "Medical staff focus groups",
            "Nursing and allied health forums",
            "Patient and community input sessions",
            "HMO / payer consultations",
            "Synthesis of stakeholder priorities and concerns",
          ],
          keyDeliverables: [
            "Stakeholder Consultation Summary",
            "Priority Themes from Stakeholders",
          ],
          gates: [],
        },
        {
          name: "Strategic Direction Setting",
          description:
            "Define or refresh the hospital's mission, vision, values, and 3-5 year strategic goals through a facilitated board and leadership retreat.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Board and leadership strategic retreat (1-2 days)",
            "Mission and vision refinement",
            "Values clarification",
            "Strategic goal setting (3-7 goals for the planning period)",
            "Strategic choice decisions (what we will AND will not do)",
          ],
          keyDeliverables: [
            "Mission / Vision / Values (refreshed)",
            "3-5 Year Strategic Goals",
            "Strategic Boundaries (what we will not do)",
          ],
          gates: [
            {
              name: "Board endorsement of strategic direction",
              criteria:
                "Board has formally endorsed mission, vision, strategic goals, and strategic choices at a board meeting.",
              order: 1,
            },
          ],
        },
        {
          name: "Strategy & Initiative Development",
          description:
            "Develop strategies and concrete initiatives to achieve each strategic goal. Prioritise based on impact and feasibility.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Strategy development per goal (how will we achieve this?)",
            "Initiative generation and evaluation (impact vs feasibility)",
            "Priority initiative selection",
            "Resource requirements and budgeting",
            "Initiative owner and timeline assignment",
            "Balanced Scorecard KPI development",
          ],
          keyDeliverables: [
            "Strategic Plan Document (draft)",
            "Priority Initiatives Portfolio",
            "3-Year Financial Projection",
            "BSC / KPI Framework",
          ],
          gates: [],
        },
        {
          name: "Plan Finalisation & Launch",
          description:
            "Finalise the strategic plan document, present to the board for approval, and launch to all staff with a clear communication plan.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "Strategic plan document finalisation",
            "Board presentation and approval",
            "Staff communication campaign",
            "Strategy execution governance setup (review cadence, owners)",
            "First-year operating plan alignment",
          ],
          keyDeliverables: [
            "Final Strategic Plan Document",
            "Board Approval Minute",
            "Staff Launch Communication",
            "Strategy Execution Calendar",
          ],
          gates: [
            {
              name: "Strategic plan approved by board and launched",
              criteria:
                "Board has approved the final strategic plan. Plan shared with all staff. Year 1 operating plan aligned. First strategy review date in calendar.",
              order: 1,
            },
          ],
        },
        {
          name: "Execution & Annual Review",
          description:
            "Track progress against the strategic plan quarterly. Conduct an annual review to refresh initiatives and update 3-year targets.",
          order: 6,
          typicalWeeks: 2,
          keyActivities: [
            "Quarterly strategy review meetings",
            "Annual performance assessment vs strategic targets",
            "Annual strategy refresh workshop",
            "Initiative progress reporting",
            "Course correction and reprioritisation",
          ],
          keyDeliverables: [
            "Quarterly Strategy Dashboard",
            "Annual Strategy Review Report",
            "Updated 3-Year Plan (annual refresh)",
          ],
          gates: [],
        },
      ],
    },
    {
      name: "Population Health Management Programme",
      slug: "population-health-management",
      description:
        "A systematic approach to managing the health outcomes of a defined population by identifying high-risk individuals, coordinating care across settings, and shifting from reactive treatment to proactive prevention. Combines data analytics, care coordination, and community-based interventions. Increasingly relevant to African health systems managing the double burden of infectious and non-communicable disease.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH"],
      estimatedWeeks: 26,
      sortOrder: 23,
      phases: [
        {
          name: "Population Segmentation & Risk Stratification",
          description:
            "Define and segment the target population. Identify high-risk individuals using data analytics and clinical criteria.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Population definition (geographic, insurance membership, facility catchment)",
            "Data sources integration (EMR, insurance claims, community health records)",
            "Risk stratification model development (clinical algorithms)",
            "High-risk, rising-risk, and low-risk segment sizing",
            "Social determinants of health (SDOH) data incorporation",
            "Priority conditions selection (hypertension, diabetes, HIV, TB, MCH)",
          ],
          keyDeliverables: [
            "Population Profile Report",
            "Risk Stratification Model",
            "High-Risk Patient Registry",
            "Priority Conditions List",
          ],
          gates: [
            {
              name: "Risk stratification model validated",
              criteria:
                "Risk stratification model validated against 6-12 months of historical data. High-risk registry contains at least 200 patients for pilot phase.",
              order: 1,
            },
          ],
        },
        {
          name: "Care Pathway Design",
          description:
            "Design evidence-based care pathways for priority conditions, integrating primary, secondary, and community care. Define care coordinator roles.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Evidence-based care pathway development per priority condition",
            "Care team composition and role definition (care coordinators, CHWs, specialists)",
            "Care plan template development",
            "Referral pathway mapping (between community, primary, and secondary care)",
            "Patient communication and engagement protocols",
            "Technology platform selection (if applicable)",
          ],
          keyDeliverables: [
            "Care Pathways (per priority condition)",
            "Care Coordinator Role Description",
            "Patient Care Plan Template",
            "Referral Pathway Maps",
          ],
          gates: [],
        },
        {
          name: "Pilot Implementation",
          description:
            "Implement the population health programme in a defined pilot geography or facility catchment. Enrol high-risk patients and activate care coordination.",
          order: 3,
          typicalWeeks: 8,
          keyActivities: [
            "Pilot site preparation (staff training, IT setup, patient outreach)",
            "High-risk patient outreach and enrolment",
            "Care coordinator activation",
            "Care plan creation for each enrolled patient",
            "Community health worker activation",
            "Monthly outcomes data tracking",
          ],
          keyDeliverables: [
            "Pilot Enrolment Data",
            "Care Plans for Enrolled Patients",
            "Monthly Outcomes Report",
          ],
          gates: [
            {
              name: "Pilot meets enrolment and engagement targets",
              criteria:
                "At least 70% of identified high-risk patients enrolled. At least 60% of enrolled patients have active care plans and have completed first care coordinator contact.",
              order: 1,
            },
          ],
        },
        {
          name: "Outcomes Measurement & Learning",
          description:
            "Measure clinical, operational, and financial outcomes from the pilot. Learn what works and what needs adaptation.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Clinical outcome measurement (disease control rates, hospitalisation, mortality)",
            "Operational efficiency measurement (care coordinator productivity, access)",
            "Patient experience measurement",
            "Financial impact (cost per member per month, ROI)",
            "Lessons learned synthesis",
            "Programme adaptation recommendations",
          ],
          keyDeliverables: [
            "Pilot Evaluation Report",
            "Clinical Outcomes Summary",
            "Financial Impact Analysis",
            "Programme Adaptation Plan",
          ],
          gates: [],
        },
        {
          name: "Scale-Up & Sustainability",
          description:
            "Scale the programme to the full target population. Establish sustainable governance and financing for the long term.",
          order: 5,
          typicalWeeks: 6,
          keyActivities: [
            "Scale-up plan development (phased geographic or population expansion)",
            "Workforce scale-up (additional care coordinators, CHW training)",
            "Technology platform scale-up",
            "Financing model development (per-member-per-month fees, outcome-based contracts)",
            "Governance model for ongoing programme management",
            "Integration with national health system and reporting",
          ],
          keyDeliverables: [
            "Scale-Up Plan and Timeline",
            "Workforce Expansion Plan",
            "Sustainable Financing Model",
            "Population Health Programme Governance Charter",
          ],
          gates: [
            {
              name: "Sustainable financing committed for scale phase",
              criteria:
                "At least 24 months of committed financing for the scale phase secured from payer, government, or donor. Governance committee operational.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Healthcare M&A Due Diligence",
      slug: "healthcare-ma-due-diligence",
      description:
        "A comprehensive framework for evaluating a healthcare acquisition, merger, or partnership. Covers clinical quality, operational performance, financial health, regulatory compliance, human capital, and cultural fit. Designed for private hospital acquisitions, diagnostic lab roll-ups, health tech investments, and PPP transactions in African healthcare markets.",
      category: "Feasibility",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
      estimatedWeeks: 10,
      sortOrder: 24,
      phases: [
        {
          name: "Deal Thesis & Scope",
          description:
            "Define the strategic rationale for the transaction and scope the due diligence work programme.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Deal thesis articulation (why this target, why now?)",
            "Due diligence scope definition (which workstreams, depth)",
            "Deal team assembly (clinical, financial, legal, HR, operations)",
            "Target information request (data room setup)",
            "NDA and access agreement execution",
          ],
          keyDeliverables: [
            "Deal Thesis Document",
            "Due Diligence Work Programme",
            "Information Request List",
          ],
          gates: [],
        },
        {
          name: "Clinical Quality Due Diligence",
          description:
            "Assess the clinical quality, patient safety, accreditation status, and governance maturity of the target.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Accreditation and licensing status review",
            "Clinical governance structure assessment",
            "Mortality and morbidity data review",
            "Incident and adverse event history",
            "Infection control programme assessment",
            "Credentialing and medical staff quality review",
            "Regulatory compliance history (HEFAMAA, NAFDAC, state)",
          ],
          keyDeliverables: [
            "Clinical Quality Due Diligence Report",
            "Clinical Risk Register",
            "Regulatory Compliance Summary",
          ],
          gates: [],
        },
        {
          name: "Financial & Operational Due Diligence",
          description:
            "Assess the financial health, revenue quality, cost structure, and operational performance of the target.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "3-5 year audited financial review",
            "Revenue quality assessment (payer mix, HMO contract quality, bad debt)",
            "EBITDA normalisation (one-off items removed)",
            "Cost structure analysis (labour, supplies, overhead)",
            "Capacity and utilisation analysis (beds, theatres, diagnostics)",
            "Capital expenditure requirements (deferred maintenance)",
            "Working capital analysis",
          ],
          keyDeliverables: [
            "Financial Due Diligence Report",
            "Normalised Financial Model",
            "CAPEX Requirements Assessment",
            "Operational Performance Benchmarking",
          ],
          gates: [
            {
              name: "No fatal financial or clinical findings",
              criteria:
                "No material misrepresentations in financial statements. No undisclosed clinical liabilities. No regulatory prohibition on transaction. Deal team recommends proceeding.",
              order: 1,
            },
          ],
        },
        {
          name: "Legal, HR & Culture Assessment",
          description:
            "Assess legal risk, employment liabilities, and cultural fit to inform integration planning.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Legal structure and ownership review",
            "Material contracts review (leases, supplier agreements, HMO contracts)",
            "Litigation and legal liability review",
            "Employment contracts and HR liabilities (gratuity, pensions)",
            "Key staff retention risk assessment",
            "Culture and values assessment",
            "IT systems and data review",
          ],
          keyDeliverables: [
            "Legal Due Diligence Summary",
            "HR and Employment Liabilities Report",
            "Culture Assessment",
            "Key Talent Risk Register",
          ],
          gates: [],
        },
        {
          name: "Valuation, SPA & Integration Planning",
          description:
            "Synthesise due diligence findings into a final valuation, negotiate transaction terms, and develop the post-acquisition integration plan.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "Valuation (DCF, EBITDA multiples, comparable transactions)",
            "Due diligence findings integration into valuation adjustments",
            "Sale and Purchase Agreement (SPA) negotiation support",
            "Post-acquisition integration plan development",
            "Day 1 readiness planning",
            "100-day post-acquisition plan",
          ],
          keyDeliverables: [
            "Valuation Report",
            "Due Diligence Summary for Investors/Board",
            "Post-Acquisition Integration Plan",
            "100-Day Plan",
          ],
          gates: [
            {
              name: "Transaction completed and 100-day plan launched",
              criteria:
                "SPA signed and conditions precedent met. Day 1 readiness confirmed. 100-day integration plan launched with named initiative owners.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Service Line Development",
      slug: "service-line-development",
      description:
        "A structured methodology for launching or expanding a hospital service line (e.g., cardiac surgery, oncology, IVF, diagnostics, telemedicine). Covers market assessment, clinical design, financial modelling, operational setup, and go-to-market. Enables hospitals to grow revenue and market share through focused speciality development.",
      category: "Revenue",
      serviceTypes: ["HOSPITAL_OPERATIONS", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 20,
      sortOrder: 25,
      phases: [
        {
          name: "Market & Strategic Assessment",
          description:
            "Assess whether there is sufficient demand and competitive opportunity to justify the service line investment.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Epidemiological demand analysis (disease prevalence, volume estimates)",
            "Competitor landscape (who offers this? At what quality and price?)",
            "Patient referral pattern analysis (where do patients go today?)",
            "HMO and payer coverage assessment",
            "Strategic fit with hospital's overall strategy",
            "Go / No-Go recommendation",
          ],
          keyDeliverables: [
            "Market Assessment Report",
            "Demand Forecast",
            "Competitive Analysis",
            "Strategic Fit Assessment",
            "Go / No-Go Recommendation",
          ],
          gates: [
            {
              name: "Board approval to proceed to detailed design",
              criteria:
                "Board has reviewed market assessment and approved investment to proceed to detailed clinical and financial design.",
              order: 1,
            },
          ],
        },
        {
          name: "Clinical Service Design",
          description:
            "Design the clinical model: scope of services, care pathways, equipment, staffing mix, and quality standards.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Scope of services definition (what procedures/conditions will be treated)",
            "Clinical pathway development for core conditions",
            "Equipment and technology requirements",
            "Medical staff recruitment plan (consultants, nursing, allied health)",
            "Partnerships and referral network design",
            "Clinical quality standards and accreditation targets",
          ],
          keyDeliverables: [
            "Clinical Service Model",
            "Equipment Requirements List",
            "Staffing Plan",
            "Clinical Pathways",
          ],
          gates: [],
        },
        {
          name: "Financial Modelling & Investment Case",
          description:
            "Build a detailed financial model for the service line. Present the investment case for board and investor approval.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Revenue projections (volume ramp, pricing, payer mix)",
            "Capital expenditure (equipment, renovation, IT)",
            "Operating cost model (staff, consumables, overhead allocation)",
            "Break-even analysis",
            "NPV / IRR / payback calculation",
            "Sensitivity analysis (best / base / worst case)",
          ],
          keyDeliverables: [
            "5-Year Financial Model",
            "Investment Case Presentation",
            "Sensitivity Analysis",
          ],
          gates: [
            {
              name: "Investment approved and funding committed",
              criteria:
                "Board or investors have approved the investment case. Capital committed. Operating budget allocated.",
              order: 1,
            },
          ],
        },
        {
          name: "Operational Setup",
          description:
            "Execute all operational, HR, technology, and regulatory preparations for the service line launch.",
          order: 4,
          typicalWeeks: 8,
          keyActivities: [
            "Facility preparation and equipment installation",
            "Staff recruitment and training",
            "IT system configuration (EMR, billing, scheduling)",
            "Regulatory and licensing applications",
            "HMO panel registration and contracting",
            "SOPs and clinical protocols finalised",
            "Soft launch with controlled patient volumes",
          ],
          keyDeliverables: [
            "Operational Readiness Checklist",
            "Staff Hired and Trained",
            "Regulatory Approvals Secured",
            "HMO Contracts in Place",
          ],
          gates: [
            {
              name: "Operational readiness confirmed for full launch",
              criteria:
                "All staff hired, equipped, and trained. Regulatory approvals in hand. At least 5 successful cases completed in soft launch. No critical quality or safety issues.",
              order: 1,
            },
          ],
        },
        {
          name: "Go-to-Market & Ramp-Up",
          description:
            "Launch to patients and referring physicians. Execute the marketing and referral development strategy. Monitor and optimise for volume ramp-up.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Launch marketing campaign (digital, referring physician outreach, community)",
            "Referring physician relationship development",
            "Patient feedback monitoring",
            "Volume and revenue tracking against projections",
            "Quality and outcomes monitoring",
            "Monthly performance review and course correction",
          ],
          keyDeliverables: [
            "Launch Campaign",
            "Referral Development Report",
            "Monthly Performance Dashboard",
          ],
          gates: [
            {
              name: "Break-even trajectory confirmed",
              criteria:
                "Monthly volumes on track to achieve break-even timeline per financial model. Patient satisfaction above 80%. No material quality incidents.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Clinical Pathway Development",
      slug: "clinical-pathway-development",
      description:
        "A systematic methodology for developing evidence-based clinical pathways (care protocols) for high-volume or high-risk conditions. Clinical pathways standardise the sequence, timing, and content of care to reduce variation, improve outcomes, and increase efficiency. Essential for quality accreditation (JCI, SafeCare), clinical governance, and Value-Based Care programmes.",
      category: "Quality",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 12,
      sortOrder: 26,
      phases: [
        {
          name: "Condition Selection & Scope",
          description:
            "Select priority conditions for pathway development based on volume, cost, variation, and clinical risk.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Top 20 DRGs / conditions by volume and cost analysis",
            "Clinical variation analysis (length of stay, outcome variation by clinician)",
            "Priority condition selection (high volume, high cost, high variation)",
            "Pathway scope definition (start and end points)",
            "Multidisciplinary team (MDT) formation for each pathway",
          ],
          keyDeliverables: [
            "Priority Conditions List",
            "Pathway Scope Document",
            "MDT Membership for Each Pathway",
          ],
          gates: [],
        },
        {
          name: "Evidence Review & Best Practice",
          description:
            "Review clinical evidence, international guidelines, and benchmark practice for the selected conditions.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Systematic literature review (Cochrane, PubMed, NICE, WHO guidelines)",
            "International benchmark pathway review (NHS, JCI examples)",
            "Local epidemiology and patient population characteristics",
            "Drug formulary and diagnostic availability check",
            "Resource and contextual adaptation considerations",
          ],
          keyDeliverables: [
            "Evidence Summary per Condition",
            "Best Practice Benchmark Report",
            "Local Adaptation Notes",
          ],
          gates: [],
        },
        {
          name: "Pathway Drafting",
          description:
            "MDT drafts the clinical pathway: sequence of care steps, decision points, timeframes, responsible roles, and criteria.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "MDT drafting workshops (2-4 sessions per pathway)",
            "Care step sequencing (admission → diagnosis → treatment → discharge → follow-up)",
            "Decision algorithm development",
            "Nursing care plan integration",
            "Medication and investigation standard orders",
            "Discharge criteria definition",
          ],
          keyDeliverables: [
            "Draft Clinical Pathway Document",
            "Standard Order Sets",
            "Nursing Care Plan",
            "Discharge Criteria",
          ],
          gates: [
            {
              name: "MDT consensus on draft pathway",
              criteria:
                "All MDT members have reviewed the draft. No outstanding clinical disagreements. Ready for broader clinical consultation.",
              order: 1,
            },
          ],
        },
        {
          name: "Clinical Consultation & Piloting",
          description:
            "Consult the broader clinical community on the pathway. Pilot with a cohort of patients before hospital-wide rollout.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Broader clinical consultation (all consultants, nursing leads)",
            "Feedback incorporation and pathway revision",
            "Pilot implementation (20-50 patients per pathway)",
            "Pilot outcome measurement (adherence, LOS, outcomes, errors)",
            "Pathway refinement based on pilot learnings",
          ],
          keyDeliverables: [
            "Clinical Consultation Feedback Summary",
            "Revised Pathway",
            "Pilot Results Report",
          ],
          gates: [
            {
              name: "Pilot outcomes non-inferior to pre-pathway",
              criteria:
                "Pilot patient outcomes at least equivalent to pre-pathway baseline. Pathway adherence above 70%. Staff report pathway is workable.",
              order: 1,
            },
          ],
        },
        {
          name: "Rollout & Monitoring",
          description:
            "Deploy the finalised pathway hospital-wide. Build ongoing monitoring and an annual review cycle.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "Final pathway approval (clinical governance committee)",
            "Hospital-wide training and orientation",
            "EMR integration (where applicable)",
            "Pathway adherence monitoring",
            "Outcomes monitoring (quarterly)",
            "Annual pathway review and update",
          ],
          keyDeliverables: [
            "Approved Final Pathway",
            "Training Materials",
            "Pathway Monitoring Dashboard",
            "Annual Review Schedule",
          ],
          gates: [
            {
              name: "Pathway approved and training complete",
              criteria:
                "Clinical governance committee has approved all pathways. At least 80% of relevant clinical staff trained. Monitoring dashboard live.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "IHI Breakthrough Series Collaborative",
      slug: "ihi-breakthrough-collaborative",
      description:
        "The Institute for Healthcare Improvement (IHI) Breakthrough Series (BTS) is a structured learning system that enables multiple organisations to make rapid improvements in a focused topic area over 12-18 months. Uses PDSA cycles, shared learning sessions, and an expert faculty. Widely adopted by African Ministries of Health, WHO, USAID, and hospital networks for quality improvement at scale.",
      category: "Quality",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HEALTH_SYSTEMS"],
      estimatedWeeks: 60,
      sortOrder: 27,
      phases: [
        {
          name: "Collaborative Design & Faculty Development",
          description:
            "Define the improvement topic, identify change package (evidence-based changes), recruit expert faculty, and select participating organisations.",
          order: 1,
          typicalWeeks: 8,
          keyActivities: [
            "Topic selection (focused, high-impact clinical or operational problem)",
            "Change package development (evidence-based interventions to test)",
            "Expert faculty identification and training (QI coaches, clinical experts)",
            "Participating organisation recruitment and onboarding",
            "Measurement framework development (process, outcome, balancing measures)",
            "Baseline data collection from all participants",
          ],
          keyDeliverables: [
            "Collaborative Charter",
            "Change Package",
            "Measurement Framework",
            "Baseline Data Report",
            "Participant Handbook",
          ],
          gates: [
            {
              name: "Participating organisations recruited and baseline data collected",
              criteria:
                "At least 10 participating organisations recruited. All sites have submitted baseline data. Faculty trained and ready for Learning Session 1.",
              order: 1,
            },
          ],
        },
        {
          name: "Learning Session 1 (LS1)",
          description:
            "Launch the collaborative. Introduce the change package, train teams in PDSA methodology, and set targets.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: [
            "2-3 day face-to-face learning session",
            "Change package presentation (faculty)",
            "PDSA training and simulation",
            "Team improvement charter development",
            "First PDSA cycle planning",
            "Peer learning and networking",
          ],
          keyDeliverables: [
            "Team Improvement Charters",
            "First PDSA Plans",
            "LS1 Learning Summary",
          ],
          gates: [],
        },
        {
          name: "Action Period 1 (AP1)",
          description:
            "Teams implement PDSA cycles at their sites between learning sessions. Coaches provide support and track data.",
          order: 3,
          typicalWeeks: 12,
          keyActivities: [
            "Weekly / bi-weekly PDSA cycles at each site",
            "Monthly data submission to collaborative hub",
            "Faculty coaching visits and calls",
            "Peer learning calls (monthly)",
            "Data review and feedback to teams",
            "Early adopter case studies documentation",
          ],
          keyDeliverables: [
            "Monthly Data Reports (all sites)",
            "PDSA Documentation",
            "Coaching Visit Reports",
          ],
          gates: [
            {
              name: "At least 50% of sites show measurable improvement",
              criteria:
                "At least 50% of participating sites show statistically significant improvement on at least one process measure. Ready for LS2.",
              order: 1,
            },
          ],
        },
        {
          name: "Learning Session 2 & Action Period 2",
          description:
            "Share learnings from AP1. Introduce advanced changes. Continue PDSA cycles toward outcome goals.",
          order: 4,
          typicalWeeks: 16,
          keyActivities: [
            "LS2: Share AP1 results and learnings across all sites",
            "Advanced change package elements introduced",
            "Team re-planning for AP2",
            "Continued PDSA cycles",
            "Monthly data submission and coaching",
            "Spread strategies within participating organisations",
          ],
          keyDeliverables: [
            "LS2 Summary",
            "AP2 Team Plans",
            "Monthly Data Reports (all sites)",
          ],
          gates: [],
        },
        {
          name: "Congress & Sustainability",
          description:
            "Celebrate results, share learnings widely, and embed sustainability plans for each participating organisation.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Final Learning Session (Congress): results presentation, awards",
            "Collaborative-level outcomes analysis",
            "Spread plan development for high-performing sites",
            "Sustainability plan for each site",
            "Publication and knowledge sharing",
            "Next collaborative planning (if applicable)",
          ],
          keyDeliverables: [
            "Collaborative Outcomes Report",
            "Site Sustainability Plans",
            "Knowledge Products (case studies, how-to guide)",
            "Spread Plan",
          ],
          gates: [
            {
              name: "Collaborative outcomes achieved and published",
              criteria:
                "Aggregate collaborative outcomes show significant improvement vs baseline across participating sites. Results published or presented at national / international forum.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Digital Health Strategy & Roadmap",
      slug: "digital-health-strategy",
      description:
        "A structured approach to developing a 3-5 year digital health strategy for a hospital, health system, or ministry of health. Covers digital maturity assessment, strategic vision, priority use cases, architecture principles, governance, and a phased implementation roadmap. Designed for African health organisations navigating EMR adoption, telemedicine, data analytics, and interoperability.",
      category: "Tech & Startup",
      serviceTypes: ["DIGITAL_HEALTH", "HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
      estimatedWeeks: 14,
      sortOrder: 28,
      phases: [
        {
          name: "Digital Maturity Assessment",
          description:
            "Baseline the current state of digital health capabilities across people, process, technology, and data dimensions.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "HIMSS EMRAM or equivalent digital maturity assessment",
            "Inventory of existing IT systems (EMR, PACS, LIS, billing, HR)",
            "Infrastructure assessment (networks, hardware, power reliability)",
            "Digital skills and capacity assessment (IT team, clinical users)",
            "Data quality and availability assessment",
            "Benchmark vs peer organisations",
          ],
          keyDeliverables: [
            "Digital Maturity Assessment Report",
            "IT Systems Inventory",
            "Digital Skills Gap Analysis",
            "Benchmark Comparison",
          ],
          gates: [],
        },
        {
          name: "Strategic Vision & Priority Use Cases",
          description:
            "Define the digital vision and identify the highest-impact use cases that the strategy will prioritise.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Leadership visioning workshop",
            "Use case identification (clinical, operational, patient engagement, analytics)",
            "Use case prioritisation (impact vs feasibility matrix)",
            "Top 5-10 priority use cases selection",
            "Digital vision statement development",
          ],
          keyDeliverables: [
            "Digital Health Vision Statement",
            "Priority Use Cases List",
            "Use Case Prioritisation Matrix",
          ],
          gates: [
            {
              name: "Leadership aligned on vision and priorities",
              criteria:
                "Executive leadership and board have endorsed the digital vision and priority use cases.",
              order: 1,
            },
          ],
        },
        {
          name: "Architecture & Technology Strategy",
          description:
            "Define the target architecture, technology standards, and vendor strategy to enable the priority use cases.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Target architecture design (systems, integrations, data flow)",
            "Build-buy-partner-open-source analysis per use case",
            "Interoperability standards adoption (HL7 FHIR, IHE profiles)",
            "Data governance and privacy framework",
            "Cybersecurity and resilience standards",
            "Vendor shortlist development",
          ],
          keyDeliverables: [
            "Target Architecture Diagram",
            "Technology Strategy Document",
            "Data Governance Framework",
            "Vendor Shortlist",
          ],
          gates: [],
        },
        {
          name: "Roadmap & Investment Plan",
          description:
            "Develop a phased 3-5 year implementation roadmap with a costed investment plan and funding strategy.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Phased roadmap development (Quick wins → Core platform → Advanced capabilities)",
            "Initiative sequencing and dependencies mapping",
            "CAPEX and OPEX cost estimation per initiative",
            "Benefits quantification (time savings, error reduction, revenue uplift)",
            "ROI calculation",
            "Funding strategy (internal, grants, IFC/DFI financing, PPP)",
          ],
          keyDeliverables: [
            "Digital Health Roadmap (3-5 years)",
            "Investment Plan",
            "ROI Model",
            "Funding Strategy",
          ],
          gates: [
            {
              name: "Digital strategy approved by board",
              criteria:
                "Board has approved the digital health strategy and investment plan. Year 1 budget allocated. Digital programme governance established.",
              order: 1,
            },
          ],
        },
        {
          name: "Governance & Programme Launch",
          description:
            "Establish digital programme governance, launch the year 1 initiatives, and build the organisational capacity to deliver.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "Digital Steering Committee establishment",
            "Chief Digital Officer or IT Director role definition",
            "Change management plan for digital adoption",
            "Year 1 initiative kickoff",
            "Vendor selection and contracting for priority initiatives",
            "Training and digital literacy programme launch",
          ],
          keyDeliverables: [
            "Digital Governance Charter",
            "Year 1 Implementation Plan",
            "Digital Training Programme",
          ],
          gates: [
            {
              name: "Year 1 initiatives launched",
              criteria:
                "Year 1 priority initiatives all have approved project charters, named project managers, and have been formally launched.",
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

  // ─── NEW FRAMEWORK TEMPLATES ────────────────────────────────────────────────

  const frameworks = [
    {
      name: "Porter's Generic Strategies",
      slug: "porters-generic-strategies",
      description:
        "Michael Porter's three generic competitive strategies: Cost Leadership, Differentiation, and Focus. Any organisation must choose a strategic position or risk being 'stuck in the middle' with no competitive advantage. Foundational for competitive strategy in healthcare markets.",
      category: "Strategic Analysis",
      dimensions: [
        "Cost Leadership (lowest cost producer in the industry)",
        "Differentiation (unique attributes valued by customers at premium price)",
        "Cost Focus (cost advantage in a narrow segment)",
        "Differentiation Focus (uniqueness in a narrow segment)",
        "Stuck in the Middle (risk: no clear strategy)",
      ],
      guideText:
        "Choose ONE primary strategy clearly. Healthcare examples: Cost Leadership = low-cost generic clinic serving mass market; Differentiation = JCI-accredited hospital with premium care; Differentiation Focus = specialist fertility clinic targeting affluent patients. Most private Nigerian hospitals attempt differentiation but compete on cost — choose and commit. 'Stuck in the middle' hospitals underinvest in both quality and cost reduction.",
      sortOrder: 25,
    },
    {
      name: "GE-McKinsey Nine-Box Matrix",
      slug: "ge-mckinsey-matrix",
      description:
        "A 3×3 portfolio management matrix assessing business units or service lines on Industry Attractiveness (vertical) and Competitive Strength (horizontal). More nuanced than the BCG Matrix because both axes are composite scores rather than single metrics. Used for strategic resource allocation across multi-service hospital groups.",
      category: "Strategic Analysis",
      dimensions: [
        "Industry Attractiveness Score (market size, growth, profitability, competition)",
        "Competitive Strength Score (market share, brand, capabilities, margins)",
        "Invest / Grow Zone (high-high)",
        "Selectivity / Earnings Zone (medium-medium)",
        "Harvest / Divest Zone (low-low)",
        "Strategic Investment Decision",
      ],
      guideText:
        "Score Industry Attractiveness 1-5 across: market size, growth rate, profitability, competitive intensity, technological requirements, environmental factors. Score Competitive Strength 1-5 across: market share, brand strength, production capacity, profit margins, technological capability, management. Plot each business unit. Upper-right 3 cells: invest and grow. Middle 3 cells: selective investment. Lower-left 3 cells: harvest or divest.",
      sortOrder: 26,
    },
    {
      name: "Blue Ocean Value Innovation Canvas",
      slug: "blue-ocean-canvas",
      description:
        "The Strategy Canvas from W. Chan Kim and Renée Mauborgne's Blue Ocean Strategy. Maps the competitive factors in an industry and plots how your organisation and competitors perform on each. A divergent curve signals a Blue Ocean strategy. Used to identify untapped market spaces in healthcare.",
      category: "Strategic Analysis",
      dimensions: [
        "Eliminate (which factors to remove entirely from industry standard?)",
        "Reduce (which factors should be well below industry standard?)",
        "Raise (which factors should be raised well above industry standard?)",
        "Create (which factors should be created that the industry never offered?)",
      ],
      guideText:
        "The ERRC Grid forces trade-offs. A Blue Ocean healthcare example: a low-cost diagnostics chain that Eliminates (full-service clinicians), Reduces (waiting time, facility luxury), Raises (accuracy and turnaround speed), Creates (home sample collection and digital results). Draw the strategy canvas with key industry factors on the x-axis and performance 1-10 on y-axis. If your curve mirrors competitors, you are in the Red Ocean.",
      sortOrder: 27,
    },
    {
      name: "Kotter's Change Curve",
      slug: "change-curve",
      description:
        "Based on Elisabeth Kubler-Ross's change curve adapted for organisational change. Maps the emotional journey individuals travel when confronted with significant change: Shock → Denial → Frustration → Depression → Experiment → Decision → Integration. Essential for designing targeted change management interventions.",
      category: "Organizational",
      dimensions: [
        "Shock (initial surprise or alarm)",
        "Denial (refusing to believe change is necessary or real)",
        "Frustration (anger, resistance, blame)",
        "Depression (low morale, loss of confidence, disengagement)",
        "Experiment (cautious testing of new ways)",
        "Decision (commitment to new approach)",
        "Integration (new way of working is normalised)",
      ],
      guideText:
        "Diagnose where different staff groups are on the curve. Design targeted interventions: Shock/Denial = clear communication and burning platform. Frustration = listening, involving people, showing empathy. Depression = small wins, visible support from leaders. Experiment = psychological safety, celebrating attempts. Decision/Integration = recognition, embedding in systems. Hospital change programs often underestimate Denial phase — especially among senior clinicians.",
      sortOrder: 28,
    },
    {
      name: "ADKAR Change Model",
      slug: "adkar-model",
      description:
        "Prosci's ADKAR model identifies the five building blocks required for successful individual change: Awareness, Desire, Knowledge, Ability, and Reinforcement. Diagnoses where change is failing and targets interventions at the specific barrier. Highly practical for healthcare digitisation and clinical practice change.",
      category: "Organizational",
      dimensions: [
        "Awareness (why the change is necessary)",
        "Desire (motivation and choice to support the change)",
        "Knowledge (how to change — training, instructions)",
        "Ability (skills and behaviours to implement the change)",
        "Reinforcement (sustaining the change through consequences)",
      ],
      guideText:
        "Diagnose each person's ADKAR profile (1-5 rating per element). The lowest-scoring element is the 'barrier point' — focus interventions here. Example: nurses scoring high on Awareness and Desire for new EMR but low on Knowledge and Ability → solution is training, not more communication. Common healthcare trap: organisations provide training (Knowledge) when the problem is Desire (staff don't want to change). Always assess Desire first.",
      sortOrder: 29,
    },
    {
      name: "WHO Health System Building Blocks",
      slug: "who-building-blocks",
      description:
        "The WHO's framework for analysing and strengthening health systems across six building blocks. Used globally for health system assessment, reform planning, and development assistance. The standard framework for any health systems strengthening engagement, particularly in African public health contexts.",
      category: "Clinical",
      dimensions: [
        "Service Delivery (how services are organised, managed, and delivered)",
        "Health Workforce (numbers, distribution, skills, motivation)",
        "Health Information Systems (data collection, analysis, use)",
        "Medical Products & Technologies (access, quality, rational use)",
        "Health Financing (fund-raising, pooling, purchasing, financial protection)",
        "Leadership & Governance (policy, regulation, accountability)",
      ],
      guideText:
        "Assess each building block on a scale (Strong / Moderate / Weak) using available evidence. Identify the weakest building block — this is often the binding constraint. In Nigeria: Health Information Systems and Health Financing are commonly the weakest. For private hospitals, Leadership & Governance and Workforce tend to be most leverage-able. All six blocks are interdependent — a strong service delivery system requires all others to be at least functional.",
      sortOrder: 30,
    },
    {
      name: "Patient Safety Culture Survey",
      slug: "patient-safety-culture",
      description:
        "A multi-dimensional framework for assessing organisational safety culture in healthcare settings. Based on the AHRQ Hospital Survey on Patient Safety Culture (HSOPS). Identifies strengths and areas for improvement in the psychological and organisational conditions that enable safe care delivery.",
      category: "Clinical",
      dimensions: [
        "Teamwork Within Units",
        "Supervisor / Manager Expectations and Actions",
        "Organisational Learning — Continuous Improvement",
        "Management Support for Patient Safety",
        "Overall Perceptions of Patient Safety",
        "Feedback and Communication about Error",
        "Communication Openness",
        "Frequency of Events Reported",
        "Teamwork Across Units",
        "Staffing",
        "Handoffs and Transitions",
      ],
      guideText:
        "Administer survey to all staff (aim for 60%+ response rate). Score each dimension as % positive responses. Dimensions below 50% positive are areas of concern. Dimensions above 75% are strengths. Benchmark against national database if available. Priority interventions: 'Communication Openness' and 'Frequency of Events Reported' are often the most culture-defining dimensions in African hospitals — low scores indicate punitive rather than learning culture.",
      sortOrder: 31,
    },
    {
      name: "Issue Tree (MECE)",
      slug: "issue-tree-mece",
      description:
        "The Issue Tree (also called Logic Tree or Problem Tree) structures complex problems into MECE (Mutually Exclusive, Collectively Exhaustive) branches. The foundational structured thinking tool in management consulting. Used to decompose any problem, hypothesis, or analysis into manageable components without gaps or overlaps.",
      category: "Strategic Analysis",
      dimensions: [
        "Problem Statement (root of the tree)",
        "Level 1 Branches (major component drivers of the problem — MECE)",
        "Level 2 Branches (sub-drivers — each Level 1 broken into MECE sub-issues)",
        "Level 3 Branches (leaf nodes — specific, answerable questions or analyses)",
        "MECE Test (do branches together cover everything? Do they overlap?)",
        "Prioritisation (which branches are most likely drivers?)",
      ],
      guideText:
        "Two types: (1) Diagnostic Tree — starts with the problem, branches into causes ('Why is revenue declining?'); (2) Solution Tree — starts with the goal, branches into how to achieve it ('How do we increase revenue?'). MECE check: (a) read all branches at the same level — do they together = the level above? No gaps? (b) Do any two branches overlap? Fix overlaps. Healthcare example: 'Why are patient volumes declining?' Level 1: Demand-side factors | Supply-side factors | Competitive factors. Then branch each into specific testable hypotheses.",
      sortOrder: 32,
    },
    {
      name: "Pyramid Principle (Communication)",
      slug: "pyramid-principle",
      description:
        "Barbara Minto's Pyramid Principle is the standard framework for structuring consultant communications and written documents. Answers come first (top of pyramid), supported by arguments, supported by data. Every consultant, engagement manager, and director at a top firm uses this structure for decks, reports, and verbal communication.",
      category: "Organizational",
      dimensions: [
        "Governing Thought (single top-line message — what do I want them to know/do?)",
        "Key Line Arguments (3-5 main supporting points — MECE)",
        "Supporting Arguments / Data (evidence for each key line point)",
        "SCQ Framework (Situation, Complication, Question — sets up the pyramid)",
        "Inductive vs Deductive Grouping",
        "So What Test (does each slide/paragraph answer the reader's 'So what?')",
      ],
      guideText:
        "Structure every deliverable top-down: start with the answer, then prove it. Never bury the recommendation on slide 40. SCQ opening: 'The hospital is performing well financially (Situation). However, it faces a quality crisis that threatens its market position (Complication). This raises the question: how should the hospital address clinical quality while maintaining financial performance? (Question).' Each level of the pyramid must be MECE. The most common consulting communication failure is bottom-up storytelling — describing findings before stating the implication.",
      sortOrder: 33,
    },
    {
      name: "Kano Model",
      slug: "kano-model",
      description:
        "Professor Noriaki Kano's model categorises product and service features by their impact on customer satisfaction. Identifies Must-Be (basic requirements), Performance (linear satisfaction drivers), and Delighter (unexpected features that create delight). Prevents over-investment in the wrong features. Highly applicable to hospital patient experience design.",
      category: "Operational",
      dimensions: [
        "Must-Be / Basic Requirements (absent = very dissatisfied; present = not delighted, just expected)",
        "Performance / Linear (more = more satisfied; less = less satisfied)",
        "Delighters / Excitement (unexpected; absent = not missed; present = great delight)",
        "Indifferent (customers don't care either way)",
        "Reverse (some customers prefer absence of this feature)",
        "Priority Matrix (must-have investment vs delight investment allocation)",
      ],
      guideText:
        "For each feature, ask two questions: functional ('How do you feel if the hospital has X?') and dysfunctional ('How do you feel if the hospital doesn't have X?'). Map responses to Kano categories. Healthcare Must-Bes: clean environment, diagnosis accuracy, staff courtesy — these won't create loyalty but their absence causes strong dissatisfaction. Performance factors: waiting times (reduce = more satisfied). Delighters: proactive communication, follow-up calls, personalised care — exceed expectations and create loyalty.",
      sortOrder: 34,
    },
    {
      name: "Service Blueprint",
      slug: "service-blueprint",
      description:
        "A detailed mapping of the complete service delivery system showing customer-facing actions, frontstage and backstage staff actions, support processes, and physical evidence — all aligned along a timeline. More detailed than a customer journey map. Essential for designing high-quality, consistent healthcare service experiences.",
      category: "Operational",
      dimensions: [
        "Physical Evidence (what does the patient see, hear, feel?)",
        "Customer Actions (what does the patient do?)",
        "Line of Interaction (visible boundary between customer and service)",
        "Frontstage Staff Actions (what visible staff do)",
        "Line of Visibility (what customer can vs cannot see)",
        "Backstage Staff Actions (what invisible staff do)",
        "Support Processes (IT systems, supplies, labs supporting delivery)",
      ],
      guideText:
        "Map horizontally across the patient journey (pre-visit → arrival → triage → consultation → investigation → treatment → discharge → follow-up). Map vertically through the layers. Identify: (1) Fail points (where does the experience most often break?), (2) Wait points (where do queues form?), (3) Evidence gaps (where should we reinforce quality signals?). In Nigerian hospitals: Backstage coordination between lab, pharmacy, and clinical team is frequently the source of patient-visible service failures.",
      sortOrder: 35,
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

  console.log("Consulting frameworks & advanced methodology seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
