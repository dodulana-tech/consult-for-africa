import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding final push to 50+ methodologies...");

  // ─── METHODOLOGIES ─────────────────────────────────────────────────────────

  const methodologies = [
    // ── QUALITY ───────────────────────────────────────────────────────────────
    {
      name: "Lean Six Sigma DMADV",
      slug: "lean-six-sigma-dmadv",
      description:
        "Design for Six Sigma (DMADV) is the Lean Six Sigma methodology for designing new processes, products, or services to meet Six Sigma quality levels from the outset — rather than improving existing defective processes. Complements DMAIC: use DMADV when designing something new or when a process is so broken that redesign beats improvement. Covers Define, Measure, Analyse, Design, Verify. Used for new hospital service lines, new digital health platforms, and new clinical programmes.",
      category: "Quality",
      serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS", "DIGITAL_HEALTH"],
      estimatedWeeks: 18,
      sortOrder: 39,
      phases: [
        {
          name: "Define",
          description:
            "Define the project goals, customer requirements, and the scope of the new process or service to be designed.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Project charter development",
            "Voice of Customer (VoC) research",
            "Critical to Quality (CTQ) requirements identification",
            "Business case for new design (vs improving existing)",
            "Project team and sponsor assignment",
          ],
          keyDeliverables: [
            "Project Charter",
            "Voice of Customer Summary",
            "CTQ Requirements List",
          ],
          gates: [
            {
              name: "Project charter and CTQs approved",
              criteria:
                "Sponsor has signed the project charter. CTQ requirements are validated with real customer input — not assumed.",
              order: 1,
            },
          ],
        },
        {
          name: "Measure",
          description:
            "Measure customer needs in detail. Identify performance benchmarks and capability requirements for the new design.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Detailed CTQ specification (target values, tolerances)",
            "Benchmarking best-in-class designs for this type of service",
            "Performance capability targets (what sigma level to design for?)",
            "Risk and constraint identification",
            "Measurement plan for design verification",
          ],
          keyDeliverables: [
            "CTQ Specification Sheet",
            "Performance Targets",
            "Benchmark Report",
            "Measurement Plan",
          ],
          gates: [],
        },
        {
          name: "Analyse",
          description:
            "Analyse design concepts and options. Use structured techniques to generate and evaluate alternative designs.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Design concept generation (brainstorming, TRIZ, benchmarking)",
            "Concept screening (Pugh Matrix — rate concepts vs CTQs)",
            "Concept scoring and selection",
            "Risk analysis of shortlisted designs (FMEA of design concepts)",
            "Simulation or modelling of top concepts",
          ],
          keyDeliverables: [
            "Design Concepts List",
            "Pugh Matrix",
            "Preferred Design Concept",
            "Design Risk Assessment",
          ],
          gates: [
            {
              name: "Preferred design concept selected",
              criteria:
                "Preferred design concept selected through structured evaluation. Sponsor and stakeholders aligned. Design FMEA completed.",
              order: 1,
            },
          ],
        },
        {
          name: "Design",
          description:
            "Develop the detailed design of the preferred concept. Optimise it to meet CTQ requirements at Six Sigma capability.",
          order: 4,
          typicalWeeks: 6,
          keyActivities: [
            "Detailed design development (processes, systems, roles, physical environment)",
            "Design optimisation (simulation, pilot testing, design experiments)",
            "Standard operating procedures drafting",
            "Technology and IT design",
            "Training programme design",
            "Pilot run planning",
          ],
          keyDeliverables: [
            "Detailed Design Documentation",
            "SOPs",
            "Technology Specifications",
            "Training Materials",
            "Pilot Plan",
          ],
          gates: [],
        },
        {
          name: "Verify",
          description:
            "Verify the design meets all CTQ requirements through pilot testing. Hand over to operations.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Pilot implementation (controlled rollout)",
            "CTQ performance measurement in pilot",
            "Design adjustments based on pilot findings",
            "Full launch plan",
            "Control plan development",
            "Handover to process owner",
          ],
          keyDeliverables: [
            "Pilot Results Report",
            "CTQ Verification Data",
            "Final Design (adjusted)",
            "Control Plan",
            "Handover Documentation",
          ],
          gates: [
            {
              name: "Design meets CTQ targets in pilot",
              criteria:
                "Pilot data confirms new design meets all CTQ targets at required sigma level. Sponsor approves full launch.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Total Quality Management",
      slug: "total-quality-management",
      description:
        "TQM is a management philosophy and comprehensive system for achieving continuous quality improvement across every function and level of an organisation. Unlike tools-based quality (Six Sigma, PDSA), TQM is a cultural transformation: quality is everyone's responsibility, not just the quality department. Based on Deming, Juran, and Crosby. The foundation for Malcolm Baldrige Award and EFQM Excellence Model. Applicable to whole-hospital transformation.",
      category: "Quality",
      serviceTypes: ["HOSPITAL_OPERATIONS", "CLINICAL_GOVERNANCE", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 52,
      sortOrder: 40,
      phases: [
        {
          name: "Leadership Commitment & Culture Foundation",
          description:
            "TQM starts at the top. Leadership must commit personally to quality, not delegate it. Build the quality culture from the executive suite down.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Executive TQM education and commitment workshop",
            "Quality vision and policy statement development",
            "Quality values integration into mission and strategy",
            "Leadership behaviour modelling plan (visibly walking the quality talk)",
            "Quality council establishment (executive-chaired)",
            "Patient/customer focus definition (who are we serving, what do they need?)",
          ],
          keyDeliverables: [
            "Quality Vision and Policy Statement",
            "Quality Council Charter",
            "Leadership Commitment Pledge",
          ],
          gates: [
            {
              name: "Quality council operational and quality policy endorsed by board",
              criteria:
                "Board has endorsed the quality policy. Quality council is meeting monthly with CEO chairing. All executives can articulate the quality vision.",
              order: 1,
            },
          ],
        },
        {
          name: "Process Focus & Standardisation",
          description:
            "Map, measure, and standardise all key processes. Establish the process-centric mindset: variation is the enemy, standard work is the foundation.",
          order: 2,
          typicalWeeks: 12,
          keyActivities: [
            "Core process inventory and ownership assignment",
            "Key process performance measurement (baseline)",
            "Standard work development for top 20 processes",
            "Process documentation and SOP library creation",
            "Process owner accountability framework",
            "Internal process customer mapping (every department has internal customers)",
          ],
          keyDeliverables: [
            "Process Inventory with Owners",
            "Process Performance Baselines",
            "SOP Library",
            "Internal Customer Map",
          ],
          gates: [],
        },
        {
          name: "People Development & Involvement",
          description:
            "Involve every employee in quality improvement. Train all staff in basic quality tools. Create quality circles and improvement teams.",
          order: 3,
          typicalWeeks: 12,
          keyActivities: [
            "All-staff quality awareness training",
            "Quality tools training (5-Why, fishbone, run charts, checklists)",
            "Quality circles establishment (frontline staff-led improvement groups)",
            "Suggestion system implementation",
            "Recognition and reward system for quality improvement",
            "Staff quality performance integration into appraisals",
          ],
          keyDeliverables: [
            "Quality Training Programme",
            "Quality Circles Log",
            "Suggestion System",
            "Recognition Programme",
          ],
          gates: [
            {
              name: "At least 80% of staff trained in basic quality tools",
              criteria:
                "At least 80% of staff have completed basic quality awareness and tools training. At least 10 quality circles operational.",
              order: 1,
            },
          ],
        },
        {
          name: "Customer Focus & Measurement",
          description:
            "Build systematic customer (patient) listening systems. Use data to drive decisions — management by fact, not opinion.",
          order: 4,
          typicalWeeks: 8,
          keyActivities: [
            "Patient satisfaction measurement system (ongoing, real-time)",
            "Patient complaints management system overhaul",
            "Patient advisory group establishment",
            "Quality dashboard development (cross-organisation)",
            "Benchmarking vs peers",
            "Performance review cadence (monthly quality dashboard review)",
          ],
          keyDeliverables: [
            "Patient Satisfaction Measurement System",
            "Quality Dashboard",
            "Benchmarking Report",
            "Patient Advisory Group Charter",
          ],
          gates: [],
        },
        {
          name: "Continuous Improvement Embedding",
          description:
            "Make continuous improvement a permanent feature of the organisation. Use structured improvement cycles, celebrate wins, and never declare victory.",
          order: 5,
          typicalWeeks: 16,
          keyActivities: [
            "Annual quality improvement planning cycle",
            "PDSA / Kaizen project portfolio management",
            "Quality achievement celebration and communication",
            "External quality award application (NQFN, ISO, etc.)",
            "Quality management system maturity assessment",
            "Annual senior leadership quality review",
          ],
          keyDeliverables: [
            "Annual Quality Improvement Plan",
            "Quality Achievement Report",
            "Maturity Assessment",
          ],
          gates: [
            {
              name: "Measurable year-on-year quality improvement demonstrated",
              criteria:
                "Year-on-year improvement demonstrated on at least 5 of 10 tracked quality metrics. Quality culture survey shows improvement from baseline.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── OPERATIONS ────────────────────────────────────────────────────────────
    {
      name: "Healthcare Supply Chain Optimisation",
      slug: "healthcare-supply-chain",
      description:
        "A methodology for designing and optimising the healthcare supply chain: medical consumables, pharmaceuticals, equipment maintenance, and procurement. Covers demand forecasting, inventory management, supplier management, and logistics. Supply chain costs typically represent 20-30% of a hospital's operating budget. A well-managed supply chain prevents stockouts, reduces waste, and can recover 5-10% of operating costs. Particularly impactful in Nigeria where FX volatility, import dependence, and informal procurement are major risk factors.",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
      estimatedWeeks: 14,
      sortOrder: 41,
      phases: [
        {
          name: "Supply Chain Diagnostic",
          description:
            "Baseline the current supply chain: spend analysis, inventory performance, supplier landscape, and process maturity.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Spend analysis (total spend by category, supplier, and department)",
            "Inventory turnover and stockout rate measurement",
            "Expiry and waste quantification",
            "Supplier portfolio mapping (number of suppliers, concentration risk)",
            "Procurement process assessment (PO cycle time, compliance)",
            "Storage and cold chain assessment",
            "FX risk and import dependency mapping",
          ],
          keyDeliverables: [
            "Supply Chain Diagnostic Report",
            "Spend Analysis by Category",
            "Inventory Performance Baseline",
            "Supplier Risk Map",
          ],
          gates: [
            {
              name: "Diagnostic findings validated by COO and finance",
              criteria:
                "Diagnostic findings reviewed by COO and CFO. Supply chain savings opportunity quantified. Priority improvement areas agreed.",
              order: 1,
            },
          ],
        },
        {
          name: "Demand Planning & Formulary Rationalisation",
          description:
            "Establish evidence-based demand forecasting and rationalise the product formulary to reduce SKU complexity and purchasing cost.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Historical consumption data analysis",
            "Demand forecasting model development (statistical + clinical input)",
            "Formulary rationalisation (eliminate low-use, duplicative, expensive SKUs)",
            "Standardisation to generic equivalents where clinically appropriate",
            "Pharmacy and Therapeutics (P&T) committee engagement for formulary decisions",
            "Par level setting per item per department",
          ],
          keyDeliverables: [
            "Rationalised Formulary",
            "Demand Forecast Model",
            "Par Level Guide",
            "Generic Substitution Protocol",
          ],
          gates: [],
        },
        {
          name: "Supplier Management & Contracting",
          description:
            "Consolidate the supplier base, negotiate better terms, and establish formal supplier management processes.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Supplier consolidation strategy (fewer, larger, better-qualified suppliers)",
            "Supplier qualification and evaluation",
            "Competitive tendering for major categories",
            "Framework agreements and long-term contracts negotiation",
            "Supplier KPIs (on-time delivery, quality, pricing compliance)",
            "Local sourcing opportunities (reduce FX exposure)",
          ],
          keyDeliverables: [
            "Supplier Consolidation Plan",
            "Framework Agreements",
            "Supplier Scorecard",
            "Local Sourcing Analysis",
          ],
          gates: [
            {
              name: "Major supplier contracts renegotiated",
              criteria:
                "Top 10 suppliers by spend have renegotiated terms. Documented savings of at least 10% on negotiated categories. Supplier scorecards active.",
              order: 1,
            },
          ],
        },
        {
          name: "Inventory & Logistics Optimisation",
          description:
            "Redesign inventory management processes to reduce stockouts, eliminate excess stock, and prevent expiries.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Inventory management system improvement (automated reorder points)",
            "ABC-VED analysis (prioritise management by value and criticality)",
            "Decentralised vs centralised store design",
            "Cold chain integrity management",
            "Expiry management protocols",
            "First-In-First-Out (FIFO) process enforcement",
          ],
          keyDeliverables: [
            "ABC-VED Classification",
            "Reorder Point Calculations",
            "Inventory Management SOPs",
            "Cold Chain Protocol",
          ],
          gates: [],
        },
        {
          name: "Governance & Sustainability",
          description:
            "Establish supply chain governance, anti-corruption controls, and a continuous improvement system.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "Procurement committee and approval authority matrix",
            "Anti-fraud and conflict of interest controls",
            "Supply chain KPI dashboard operationalisation",
            "Monthly supply chain review meeting",
            "Annual supplier review programme",
          ],
          keyDeliverables: [
            "Procurement Policy and Approval Matrix",
            "Supply Chain KPI Dashboard",
            "Anti-Fraud Controls",
            "Annual Supplier Review Calendar",
          ],
          gates: [
            {
              name: "Supply chain savings target met and governance live",
              criteria:
                "At least 8% savings on total supply chain spend vs baseline. Procurement policy in place. Monthly supply chain dashboard reviewed by COO.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Pharmacy Management Optimisation",
      slug: "pharmacy-optimisation",
      description:
        "A structured methodology for transforming hospital pharmacy from a cost centre into a clinical and revenue engine. Covers formulary management, medication safety, inventory control, revenue capture, and clinical pharmacy services. Hospital pharmacy typically represents 30-40% of total supply spend and is the #1 source of preventable patient harm. A high-performing pharmacy is essential for JCI accreditation, revenue cycle optimisation, and clinical quality.",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 16,
      sortOrder: 42,
      phases: [
        {
          name: "Pharmacy Diagnostic",
          description:
            "Comprehensively assess the current state of pharmacy operations, clinical services, and financial performance.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Pharmacy revenue and cost analysis",
            "Formulary review (size, generic ratio, slow-movers, stockouts)",
            "Medication safety audit (prescribing, dispensing, administration errors)",
            "JCIA MMU chapter gap assessment (medication management and use)",
            "Inventory management assessment (turnover, expiries, shrinkage)",
            "Staffing model and productivity assessment",
            "Dispensing turnaround time measurement",
          ],
          keyDeliverables: [
            "Pharmacy Diagnostic Report",
            "Medication Safety Audit",
            "Financial Performance Baseline",
            "MMU Gap Assessment",
          ],
          gates: [],
        },
        {
          name: "Medication Safety Programme",
          description:
            "Implement structured medication safety systems to reduce prescribing, dispensing, and administration errors.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "High-alert medication list and double-check protocols",
            "Medication reconciliation process at admission, transfer, and discharge",
            "Look-alike sound-alike (LASA) medication management",
            "Antibiotic stewardship programme",
            "Adverse drug event (ADE) reporting and review system",
            "Pharmacy staff competency assessment and training",
          ],
          keyDeliverables: [
            "High-Alert Medication Policy",
            "Medication Reconciliation Protocol",
            "Antibiotic Stewardship Programme",
            "ADE Reporting System",
          ],
          gates: [
            {
              name: "Medication safety system live and MMU compliance improved",
              criteria:
                "High-alert medication protocols operational in all clinical areas. Medication reconciliation completion rate above 80%. MMU compliance audit shows improvement.",
              order: 1,
            },
          ],
        },
        {
          name: "Formulary & Inventory Optimisation",
          description:
            "Rationalise the formulary, improve inventory management, and reduce pharmaceutical costs without compromising clinical outcomes.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "P&T committee-led formulary rationalisation",
            "Generic substitution programme",
            "Therapeutic interchange protocols",
            "ABC-VED inventory analysis",
            "Automated dispensing cabinet (ADC) evaluation (if applicable)",
            "Supplier consolidation and contract renegotiation",
          ],
          keyDeliverables: [
            "Rationalised Hospital Formulary",
            "Generic Substitution Protocol",
            "Inventory Optimisation Plan",
            "New Supplier Contracts",
          ],
          gates: [],
        },
        {
          name: "Clinical Pharmacy Services",
          description:
            "Develop clinical pharmacy services that add direct patient care value: ward rounds, drug therapy monitoring, patient counselling.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Clinical pharmacist role development",
            "Ward pharmacy rounds programme",
            "Drug therapy monitoring protocols (especially high-risk drugs)",
            "Patient medication counselling programme",
            "Discharge medication reconciliation",
            "Physician-pharmacist collaboration model",
          ],
          keyDeliverables: [
            "Clinical Pharmacy Programme",
            "Ward Rounds Protocol",
            "Patient Counselling Materials",
          ],
          gates: [],
        },
        {
          name: "Revenue Capture & Sustainability",
          description:
            "Ensure pharmacy charges are accurately captured, billed, and collected. Establish ongoing pharmacy governance.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "Pharmacy charge capture audit",
            "Billing and documentation improvement",
            "Outpatient pharmacy retail strategy",
            "Pharmacy KPI dashboard",
            "Monthly pharmacy performance review",
            "Annual formulary review cycle",
          ],
          keyDeliverables: [
            "Pharmacy Revenue Recovery Plan",
            "Pharmacy KPI Dashboard",
            "Annual Formulary Review Schedule",
          ],
          gates: [
            {
              name: "Pharmacy savings and safety targets met",
              criteria:
                "Pharmaceutical spend reduction of at least 10% vs baseline. Medication error rate reduction documented. Revenue capture improvement confirmed.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── PUBLIC HEALTH ─────────────────────────────────────────────────────────
    {
      name: "Health Behaviour Change Communication",
      slug: "behaviour-change-communication",
      description:
        "Social and Behaviour Change Communication (SBCC) is a systematic approach to developing and implementing communication strategies that promote healthy behaviours and address the social norms, beliefs, and environmental factors that influence health decisions. Grounded in behaviour change theories (Social Cognitive Theory, Health Belief Model, Trans-Theoretical Model). The standard methodology for HIV/AIDS, malaria, nutrition, immunisation, and maternal health communication programs.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 20,
      sortOrder: 43,
      phases: [
        {
          name: "Situation & Audience Analysis",
          description:
            "Deeply understand the audience, their current behaviours, knowledge, attitudes, social norms, and the barriers and facilitators to the desired behaviour.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Target audience segmentation (demographics, behaviours, psychographics)",
            "Knowledge, Attitudes, and Practices (KAP) survey",
            "Focus group discussions with target audiences",
            "Social norms mapping",
            "Communication channel landscape analysis (what media do they consume?)",
            "Influencer and gatekeeper identification",
            "Behaviour determinant analysis (which factors most influence the behaviour?)",
          ],
          keyDeliverables: [
            "Audience Segmentation",
            "KAP Survey Report",
            "Behaviour Determinant Analysis",
            "Communication Channel Assessment",
          ],
          gates: [
            {
              name: "Audience insights validated",
              criteria:
                "Formative research completed with representative audience samples. Key behaviour determinants identified and prioritised. Ready to develop communication strategy.",
              order: 1,
            },
          ],
        },
        {
          name: "SBCC Strategy Development",
          description:
            "Develop the overall communication strategy: objectives, audiences, key messages, channels, and theory of change.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "SBCC objectives development (SMART, behaviour-focused)",
            "Primary and secondary audience prioritisation",
            "Key message development (audience-centred, evidence-based)",
            "Channel mix selection (mass media, community, interpersonal, digital)",
            "Positioning statement development",
            "SBCC Theory of Change",
            "M&E framework alignment",
          ],
          keyDeliverables: [
            "SBCC Strategy Document",
            "Key Messages per Audience",
            "Channel Mix Plan",
            "SBCC Theory of Change",
          ],
          gates: [],
        },
        {
          name: "Material Development & Pretesting",
          description:
            "Develop communication materials for each channel. Pretest rigorously with target audiences before finalising.",
          order: 3,
          typicalWeeks: 6,
          keyActivities: [
            "Creative brief development",
            "Material production (radio spots, TV, social media, print, community theatre)",
            "Message concept pretesting with target audience",
            "Material revision based on pretest feedback",
            "Cultural sensitivity and gender responsiveness review",
            "Final material production",
          ],
          keyDeliverables: [
            "Communication Materials (all channels)",
            "Pretest Reports",
            "Finalised Materials",
          ],
          gates: [
            {
              name: "All materials pretested and revised",
              criteria:
                "All materials pretested with at least 30 target audience members per channel. Revisions incorporated. No messages generating unintended negative reactions.",
              order: 1,
            },
          ],
        },
        {
          name: "Campaign Implementation",
          description:
            "Launch and manage the SBCC campaign across all channels. Coordinate mass media, community mobilisation, and interpersonal communication.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Media planning and buying",
            "Community mobilisation activities",
            "Health worker and CHW communication training",
            "Interpersonal communication (IPC) protocol rollout",
            "Digital and social media campaign management",
            "Monitoring of campaign reach and exposure",
          ],
          keyDeliverables: [
            "Campaign Launch",
            "Media Placement Records",
            "Community Activation Log",
            "Reach and Exposure Reports",
          ],
          gates: [],
        },
        {
          name: "Monitoring, Evaluation & Learning",
          description:
            "Measure campaign reach, audience recall, attitude change, and ultimately behaviour change. Use findings to optimise and scale.",
          order: 5,
          typicalWeeks: 4,
          keyActivities: [
            "Campaign monitoring (reach, frequency, exposure tracking)",
            "Mid-campaign KAP survey (awareness and attitude change)",
            "Endline KAP survey (behaviour change measurement)",
            "Campaign effectiveness analysis",
            "Lessons learned documentation",
            "Strategy and material optimisation for next phase",
          ],
          keyDeliverables: [
            "Campaign Monitoring Reports",
            "Endline KAP Survey",
            "Campaign Effectiveness Report",
            "Lessons Learned",
            "Optimised Next-Phase Plan",
          ],
          gates: [
            {
              name: "Behaviour change evidence documented",
              criteria:
                "Endline survey shows statistically significant improvement in target behaviour vs baseline. Findings documented and shared with program team and donors.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "National Health Program Design",
      slug: "national-health-program-design",
      description:
        "A structured methodology for designing, planning, and launching national or state-level government health programs. Covers situation analysis, program logic, resource planning, implementation modelling, and governance design. Used by Ministries of Health, donor agencies (USAID, WHO, Global Fund), and development partners. Applicable to Nigeria's primary healthcare revitalisation, free maternal health programs, and NCD prevention initiatives.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS"],
      estimatedWeeks: 26,
      sortOrder: 44,
      phases: [
        {
          name: "Situation Analysis & Problem Definition",
          description:
            "Comprehensively analyse the health situation, define the problem the program will address, and establish the policy mandate.",
          order: 1,
          typicalWeeks: 5,
          keyActivities: [
            "Epidemiological situation analysis (disease burden, trends)",
            "Health system capacity assessment",
            "Equity and population vulnerability analysis",
            "Policy environment review (national health policy, existing programs)",
            "Stakeholder mapping and political economy analysis",
            "Needs assessment (quantitative + community voice)",
            "International best practice review",
          ],
          keyDeliverables: [
            "Situation Analysis Report",
            "Problem Statement",
            "Policy Environment Assessment",
            "Stakeholder Analysis",
          ],
          gates: [
            {
              name: "Problem statement endorsed by Minister or Commissioner",
              criteria:
                "Minister / Commissioner of Health has endorsed the problem statement and confirmed political mandate for the program.",
              order: 1,
            },
          ],
        },
        {
          name: "Program Design & Theory of Change",
          description:
            "Design the intervention package and develop the theory of change. Define the service delivery model and target population.",
          order: 2,
          typicalWeeks: 5,
          keyActivities: [
            "Intervention package design (what services, for whom, delivered how?)",
            "Theory of change development (causal pathway from activities to impact)",
            "Service delivery model design (facility-based, community-based, hybrid)",
            "Target population and coverage targets",
            "Equity strategies (reaching the poorest and most marginalised)",
            "Gender and social inclusion mainstreaming",
            "Logframe development",
          ],
          keyDeliverables: [
            "Program Design Document",
            "Theory of Change",
            "Service Delivery Model",
            "Coverage Targets",
            "Logframe",
          ],
          gates: [],
        },
        {
          name: "Resource Planning & Costing",
          description:
            "Cost the program comprehensively. Identify funding sources and develop a sustainable financing plan.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Program costing (OneHealth tool or similar)",
            "Human resources requirements and costing",
            "Commodity and supply chain costing",
            "Infrastructure and equipment needs",
            "Program management and overhead costs",
            "Funding gap analysis",
            "Domestic and external financing strategy",
          ],
          keyDeliverables: [
            "Program Cost Estimates",
            "Funding Gap Analysis",
            "Financing Strategy",
            "Investment Case for Donors",
          ],
          gates: [
            {
              name: "Funding commitments sufficient to launch",
              criteria:
                "At least 70% of Year 1 funding committed from government and/or donors. Remaining funding actively being mobilised.",
              order: 1,
            },
          ],
        },
        {
          name: "Implementation Planning",
          description:
            "Develop the detailed operational plan. Design governance structures, accountability mechanisms, and rollout sequencing.",
          order: 4,
          typicalWeeks: 5,
          keyActivities: [
            "Phased rollout plan (geographic sequencing)",
            "Implementation arrangements (who does what at national, state, LGA, facility levels)",
            "Governance and accountability framework",
            "Supply chain and logistics planning",
            "Workforce training plan",
            "Communication and community mobilisation plan",
            "M&E system design",
          ],
          keyDeliverables: [
            "Detailed Implementation Plan",
            "Rollout Schedule",
            "Governance Framework",
            "M&E Plan",
          ],
          gates: [],
        },
        {
          name: "Program Launch & Scale",
          description:
            "Launch the program and scale to target coverage. Establish adaptive management to course-correct as evidence emerges.",
          order: 5,
          typicalWeeks: 7,
          keyActivities: [
            "Pilot launch in selected LGAs or states",
            "Pilot evaluation and learning",
            "Full national or state-wide scale-up",
            "Annual review and program adaptation",
            "Independent midterm and endline evaluations",
            "Results communication to government and donors",
          ],
          keyDeliverables: [
            "Pilot Evaluation Report",
            "Scale-Up Plan",
            "Annual Review Reports",
            "Program Evaluation Reports",
          ],
          gates: [
            {
              name: "Program reaching coverage targets",
              criteria:
                "Program reaching at least 60% of target coverage in operational areas. Annual review shows outcomes on track. Donor reporting requirements met.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── HEALTH ECONOMICS ─────────────────────────────────────────────────────
    {
      name: "Health Insurance Scheme Design",
      slug: "health-insurance-design",
      description:
        "A structured methodology for designing or reforming a health insurance scheme — national (NHIA), state-level, community-based (CBHI), or employer-sponsored. Covers benefit package design, premium setting, risk pooling, provider payment mechanisms, financial sustainability, and enrolment strategy. Directly applicable to Nigeria's NHIA reforms, state contributory health schemes, and the expansion of health insurance coverage toward Universal Health Coverage (UHC).",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS"],
      estimatedWeeks: 24,
      sortOrder: 45,
      phases: [
        {
          name: "Context & Actuarial Analysis",
          description:
            "Analyse the target population's health needs, utilisation patterns, and ability to pay. Conduct actuarial modelling to inform scheme design.",
          order: 1,
          typicalWeeks: 5,
          keyActivities: [
            "Target population demographic and epidemiological analysis",
            "Current health utilisation patterns and costs",
            "Ability-to-pay and willingness-to-pay surveys",
            "Existing scheme analysis (formal and informal insurance landscape)",
            "Actuarial modelling (expected claims frequency and cost)",
            "Adverse selection and moral hazard risk assessment",
          ],
          keyDeliverables: [
            "Actuarial Report",
            "Utilisation and Cost Estimates",
            "Willingness-to-Pay Study",
            "Risk Assessment",
          ],
          gates: [],
        },
        {
          name: "Benefit Package Design",
          description:
            "Define the services covered by the scheme. Balance comprehensiveness with affordability using explicit priority-setting methods.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Essential Health Package (EHP) identification",
            "Benefit package options development (basic, standard, comprehensive)",
            "Cost-effectiveness analysis for benefit package prioritisation",
            "Exclusions list development",
            "Benefits-cost modelling per package option",
            "Stakeholder consultation on benefit priorities",
          ],
          keyDeliverables: [
            "Benefit Package Design (options)",
            "Benefits Costing",
            "Exclusions List",
            "Final Benefit Package Recommendation",
          ],
          gates: [
            {
              name: "Benefit package endorsed by steering committee",
              criteria:
                "Technical steering committee has endorsed the benefit package. Costing completed. Legal framework for benefits confirmed.",
              order: 1,
            },
          ],
        },
        {
          name: "Premium Setting & Risk Pooling",
          description:
            "Set premiums to ensure financial sustainability while keeping contributions affordable. Design cross-subsidisation and government contribution strategy.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Premium calculation (actuarial cost + loading for admin, reserve, profit)",
            "Differential premium modelling (income-based, family-based)",
            "Government subsidy design (for the poor and informal sector)",
            "Risk pooling strategy (national pool vs state pools vs district pools)",
            "Reinsurance strategy",
            "Financial sustainability projections (5-10 years)",
          ],
          keyDeliverables: [
            "Premium Calculations",
            "Government Subsidy Model",
            "Risk Pooling Design",
            "Financial Sustainability Projections",
          ],
          gates: [],
        },
        {
          name: "Provider Payment & Contracting",
          description:
            "Design the provider payment system. Select mechanisms that incentivise quality, efficiency, and appropriate care.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Provider payment mechanism selection (capitation, fee-for-service, DRGs, P4P)",
            "Provider tariff setting",
            "Provider accreditation and contracting requirements",
            "Claims management and fraud detection system",
            "Provider performance monitoring framework",
          ],
          keyDeliverables: [
            "Provider Payment Policy",
            "Fee Schedule / Tariff",
            "Provider Contract Template",
            "Claims Management System Requirements",
          ],
          gates: [],
        },
        {
          name: "Enrolment Strategy & Launch",
          description:
            "Design and execute the enrolment strategy to achieve target coverage. Establish scheme governance and management.",
          order: 5,
          typicalWeeks: 9,
          keyActivities: [
            "Enrolment strategy (mandatory vs voluntary, employer vs community vs government)",
            "Enrolment infrastructure (agents, technology platform)",
            "Member communication and education",
            "Scheme management organisation (staffing, systems, governance)",
            "Pilot launch and evaluation",
            "Full rollout and scale-up",
          ],
          keyDeliverables: [
            "Enrolment Strategy",
            "Member Communication Materials",
            "Scheme Management Manual",
            "Pilot and Rollout Plan",
          ],
          gates: [
            {
              name: "Enrolment target met for pilot phase",
              criteria:
                "Pilot phase enrolment target met (typically 10,000-50,000 members). Claims experience within actuarial projections. Scheme financially solvent.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── STRATEGY ─────────────────────────────────────────────────────────────
    {
      name: "Post-Merger Integration",
      slug: "post-merger-integration",
      description:
        "A structured methodology for integrating two organisations following a merger, acquisition, or partnership. The 100-day plan determines whether the transaction delivers its intended value — most M&A value is destroyed in poor integration, not in poor deals. Covers governance integration, operational harmonisation, culture blending, system consolidation, and synergy realisation. Critical for hospital group roll-ups and health network formation in Africa.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 26,
      sortOrder: 46,
      phases: [
        {
          name: "Day 1 Readiness",
          description:
            "Prepare everything needed for a smooth legal close and Day 1 operational continuity. No surprises on the first day.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Day 1 operational readiness checklist",
            "Staff announcement and communication plan",
            "Interim governance structure announcement",
            "Patient and client communication",
            "Critical systems access and continuity",
            "Regulatory and licensing notifications",
            "Media and public relations management",
          ],
          keyDeliverables: [
            "Day 1 Readiness Checklist",
            "Staff Communication Package",
            "Interim Governance Structure",
          ],
          gates: [
            {
              name: "Day 1 readiness confirmed",
              criteria:
                "All Day 1 checklists completed. Staff informed and key messages delivered. Operations continuing without disruption.",
              order: 1,
            },
          ],
        },
        {
          name: "100-Day Integration Plan",
          description:
            "Execute the high-priority integration activities that must be completed in the first 100 days to capture quick wins and avoid value erosion.",
          order: 2,
          typicalWeeks: 14,
          keyActivities: [
            "Integration management office (IMO) establishment",
            "Workstream leads appointment (clinical, operations, finance, HR, IT)",
            "Synergy target setting and tracking",
            "Organisation structure decision and announcement",
            "Key talent retention programme activation",
            "Culture assessment and integration approach",
            "IT systems integration roadmap",
            "Quick win identification and delivery",
          ],
          keyDeliverables: [
            "100-Day Integration Plan",
            "IMO Governance Charter",
            "Organisation Structure Decision",
            "Synergy Tracker",
            "Key Talent Retention Plan",
          ],
          gates: [
            {
              name: "100-day plan milestones met",
              criteria:
                "At least 80% of 100-day milestones completed on time. No major clinical quality or operational disruptions. Key talent retention above 90%.",
              order: 1,
            },
          ],
        },
        {
          name: "Full Integration",
          description:
            "Complete the deeper integration: system consolidation, process harmonisation, culture blending, and full synergy realisation.",
          order: 3,
          typicalWeeks: 8,
          keyActivities: [
            "IT systems consolidation (EMR, finance, HR)",
            "Clinical policy and protocol harmonisation",
            "Financial reporting consolidation",
            "HR policy harmonisation and grading alignment",
            "Brand and communications integration",
            "Culture integration initiatives",
            "Supply chain and procurement consolidation",
          ],
          keyDeliverables: [
            "Integrated Systems",
            "Harmonised Clinical Policies",
            "Integrated Financial Reports",
            "Culture Integration Progress Report",
          ],
          gates: [],
        },
        {
          name: "Synergy Realisation & Value Capture",
          description:
            "Track and realise the synergies that justified the deal. Validate that the transaction is delivering its intended value.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Synergy tracking vs business case",
            "Financial performance measurement (EBITDA vs pre-merger projection)",
            "Revenue synergy realisation (cross-referrals, payer leverage, new services)",
            "Cost synergy realisation (procurement, back-office, clinical efficiency)",
            "Post-integration review with board",
            "Lessons learned for future transactions",
          ],
          keyDeliverables: [
            "Synergy Realisation Report",
            "Post-Integration Review",
            "Integration Lessons Learned",
          ],
          gates: [
            {
              name: "Synergy targets met and integration declared complete",
              criteria:
                "At least 80% of year-1 synergy targets achieved. Board has declared integration complete. Ongoing monitoring transitioned to business-as-usual management.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── C4APROPRIETARY ───────────────────────────────────────────────────────
    {
      name: "C4AEmbedded Leadership Programme™",
      slug: "cfa-embedded-leadership",
      description:
        "C4A's flagship Embedded Leadership service: placing experienced healthcare executives (CEO, COO, CMO, CFO) into client hospitals for 12-24 months to drive transformation from within. Unlike advisory consulting, embedded leaders hold line authority, make real decisions, and are accountable for measurable results. The most intensive and highest-impact form of healthcare consulting — reserved for turnarounds, post-acquisition integration, and major transformation mandates.",
      category: "c4a_proprietary",
      serviceTypes: ["EMBEDDED_LEADERSHIP", "TURNAROUND", "EM_AS_SERVICE"],
      estimatedWeeks: 52,
      sortOrder: 47,
      phases: [
        {
          name: "Mandate Scoping & Leader Placement",
          description:
            "Define the transformation mandate, select the right embedded leader for the organisation, and execute a structured onboarding.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Transformation mandate definition with board and investors",
            "Success criteria and KPIs agreed (clinical, financial, operational, cultural)",
            "C4A embedded leader selection and matching",
            "Contract and governance framework (who does the embedded leader report to?)",
            "Structured 30-day onboarding and stakeholder listening tour",
            "100-day plan development",
          ],
          keyDeliverables: [
            "Transformation Mandate Document",
            "KPI Framework",
            "Embedded Leader Onboarding Report",
            "100-Day Plan",
          ],
          gates: [
            {
              name: "Mandate agreed and 100-day plan signed off by board",
              criteria:
                "Board and C4A have agreed on mandate, KPIs, governance, and 100-day plan. Embedded leader has completed stakeholder listening tour and has full picture of situation.",
              order: 1,
            },
          ],
        },
        {
          name: "Rapid Stabilisation",
          description:
            "Address the most urgent operational, clinical, and financial issues to stabilise the organisation and stop value erosion.",
          order: 2,
          typicalWeeks: 8,
          keyActivities: [
            "Critical issue triage and resolution",
            "Cash and liquidity management (if financial distress)",
            "Clinical quality and patient safety immediate actions",
            "Key staff retention emergency actions",
            "Operational quick wins implementation",
            "Weekly board reporting on progress",
          ],
          keyDeliverables: [
            "Stabilisation Report",
            "Quick Wins Delivered",
            "Weekly Board Update",
          ],
          gates: [
            {
              name: "Organisation stabilised",
              criteria:
                "Immediate crises resolved. No active patient safety emergencies. Cash position stabilised. Board confidence in trajectory.",
              order: 1,
            },
          ],
        },
        {
          name: "Transformation Execution",
          description:
            "Drive the medium-term transformation agenda: restructuring, process improvement, culture change, and performance management.",
          order: 3,
          typicalWeeks: 26,
          keyActivities: [
            "Transformation programme portfolio management",
            "Organisational redesign and right-sizing",
            "Clinical and operational improvement projects",
            "Financial turnaround execution",
            "Culture transformation",
            "New leadership team development",
            "Monthly board reporting on transformation KPIs",
          ],
          keyDeliverables: [
            "Monthly Transformation Dashboards",
            "Transformation Milestones",
            "New Leadership Team",
          ],
          gates: [
            {
              name: "Mid-point transformation targets met",
              criteria:
                "At the 12-month mark, at least 70% of transformation KPIs showing improvement vs baseline. Permanent leadership pipeline identified.",
              order: 1,
            },
          ],
        },
        {
          name: "Leadership Transition & Handover",
          description:
            "Develop permanent leadership capability. Plan and execute the transition from C4A embedded leader to permanent leadership.",
          order: 4,
          typicalWeeks: 12,
          keyActivities: [
            "Permanent leadership candidate identification and development",
            "Succession planning for embedded leader role",
            "Knowledge transfer and institutional memory documentation",
            "Governance systems embedded for sustainable self-management",
            "Phased handover with C4A support reducing over time",
            "Final impact report and lessons learned",
          ],
          keyDeliverables: [
            "Permanent Leadership Succession Plan",
            "Knowledge Transfer Documentation",
            "Final Impact Report",
            "Post-Engagement Advisory Plan (if applicable)",
          ],
          gates: [
            {
              name: "Successful handover to permanent leadership",
              criteria:
                "Permanent leader appointed and operational. Organisation delivering against KPIs without C4A embedded leader. Board confident in self-sustainability.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "C4ARevenue Recovery Programme™",
      slug: "cfa-revenue-recovery",
      description:
        "C4A's proprietary rapid revenue recovery programme for Nigerian private hospitals experiencing revenue decline, cash flow crisis, or chronic underperformance. Combines revenue cycle optimisation, pricing strategy, HMO contract renegotiation, and new revenue stream development into a 90-day intensive programme. Designed to deliver measurable revenue improvement within the first quarter while laying foundations for sustained growth.",
      category: "c4a_proprietary",
      serviceTypes: ["TURNAROUND", "HOSPITAL_OPERATIONS", "REVENUE_CYCLE_EXCELLENCE" as never],
      estimatedWeeks: 16,
      sortOrder: 48,
      phases: [
        {
          name: "Revenue Diagnostic (Days 1-30)",
          description:
            "Rapidly diagnose all sources of revenue leakage, underpricing, and missed opportunity across the full revenue cycle.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Revenue leakage quantification (see Revenue Leakage Assessment framework)",
            "Pricing benchmarking (are we priced competitively?)",
            "HMO contract audit (are we being paid correctly? rejection rates?)",
            "Service volume analysis (under-utilised services with demand potential)",
            "Charge capture gap analysis (unregistered services, underbilling)",
            "Payer mix analysis (optimal payer mix vs actual)",
            "Quick wins identification (achievable within 30 days)",
          ],
          keyDeliverables: [
            "Revenue Diagnostic Report",
            "Leakage Quantification (NGN value)",
            "Quick Wins List",
          ],
          gates: [
            {
              name: "Revenue opportunity confirmed and agreed with CFO",
              criteria:
                "CFO and CEO have reviewed the revenue diagnostic. Total addressable leakage quantified. Quick wins list approved for immediate implementation.",
              order: 1,
            },
          ],
        },
        {
          name: "Quick Win Implementation (Days 30-60)",
          description:
            "Execute the immediate revenue recovery actions: charge capture fixes, HMO claim resubmissions, and high-ROI process corrections.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Billing error corrections and resubmissions",
            "Outstanding HMO claims follow-up (overdue AR collection)",
            "Unregistered services capture process fix",
            "Denial management rapid response",
            "Outpatient fee review and update",
            "Daily revenue dashboard implementation",
          ],
          keyDeliverables: [
            "Revenue Collected from Quick Wins",
            "Daily Revenue Dashboard",
            "HMO AR Recovery Report",
          ],
          gates: [],
        },
        {
          name: "Strategic Revenue Enhancement (Days 60-90+)",
          description:
            "Execute the medium-term revenue growth initiatives: pricing strategy, HMO contract renegotiation, and new revenue streams.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Pricing strategy review and update",
            "HMO contract renegotiation (rates, terms, capitation review)",
            "New revenue stream development (new services, diagnostic expansion, retail pharmacy)",
            "Self-pay patient strategy",
            "Corporate health partnership development",
            "Revenue team capability building",
          ],
          keyDeliverables: [
            "Updated Pricing Schedule",
            "Renegotiated HMO Contracts",
            "New Revenue Stream Plans",
            "Corporate Partnership Pipeline",
          ],
          gates: [],
        },
        {
          name: "Governance & Sustained Growth",
          description:
            "Embed revenue management governance. Build the internal capability to sustain and continue growing revenue without external support.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Revenue management committee establishment",
            "Revenue cycle team training and capability building",
            "Monthly revenue review process",
            "KPI target setting for the year ahead",
            "Revenue management SOP library",
          ],
          keyDeliverables: [
            "Revenue Management Governance Charter",
            "Revenue Cycle Team Capability Plan",
            "Monthly Review Calendar",
            "12-Month Revenue Targets",
          ],
          gates: [
            {
              name: "Revenue improvement target achieved and governance live",
              criteria:
                "Measurable revenue improvement of at least 15% vs pre-programme baseline. Revenue management committee meeting monthly. Daily dashboard tracked.",
              order: 1,
            },
          ],
        },
      ],
    },
  ];

  for (const m of methodologies) {
    const { phases, ...mData } = m;
    // strip any invalid serviceType values just in case
    const validServiceTypes = [
      "HOSPITAL_OPERATIONS","TURNAROUND","EMBEDDED_LEADERSHIP",
      "CLINICAL_GOVERNANCE","DIGITAL_HEALTH","HEALTH_SYSTEMS",
      "DIASPORA_EXPERTISE","EM_AS_SERVICE",
    ];
    const cleanServiceTypes = (mData.serviceTypes as string[]).filter(s => validServiceTypes.includes(s));
    const existing = await prisma.methodologyTemplate.findUnique({ where: { slug: mData.slug } });
    if (existing) {
      console.log(`  Skipping existing methodology: ${mData.name}`);
      continue;
    }
    const created = await prisma.methodologyTemplate.create({
      data: {
        ...mData,
        serviceTypes: cleanServiceTypes,
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

  // ─── FINAL FRAMEWORK BATCH ─────────────────────────────────────────────────

  const frameworks = [
    {
      name: "Universal Health Coverage Monitoring Framework",
      slug: "uhc-monitoring",
      description:
        "The WHO/World Bank framework for measuring progress toward Universal Health Coverage (UHC) across two dimensions: service coverage and financial protection. The UHC Service Coverage Index (SCI) aggregates indicators across reproductive health, child health, infectious diseases, and NCDs. Essential for Ministries of Health, NHIA, and development partners tracking Nigeria's UHC commitments.",
      category: "Health Economics",
      dimensions: [
        "Service Coverage Index (SCI) — 14 tracer indicators across 4 categories",
        "Reproductive & Maternal Health (antenatal care, skilled birth attendance, family planning)",
        "Child Health (immunisation coverage, treatment-seeking for pneumonia/diarrhoea)",
        "Infectious Diseases (HIV treatment, TB treatment success, malaria prevention)",
        "NCDs (hypertension treatment, diabetes management, cancer screening)",
        "Financial Protection (catastrophic health expenditure, impoverishment from health costs)",
      ],
      guideText:
        "SCI score 0-100: Nigeria scores approximately 45 (2023 estimate), well below the sub-Saharan Africa average of 47 and the WHO target of 80. Financial protection: over 40% of Nigerians face catastrophic health expenditure annually. Priority actions for the SCI: reproductive health (ANC 4+ visits currently ~57%), NCD management (hypertension treatment coverage ~30%), and child immunisation (full coverage ~57%). Use the SCI decomposition to identify which sub-index is dragging overall score and target interventions accordingly.",
      sortOrder: 44,
    },
    {
      name: "Net Promoter System",
      slug: "net-promoter-system",
      description:
        "Bain & Company's Net Promoter System (NPS) measures customer loyalty through a single question: 'How likely is it that you would recommend us to a friend or colleague?' (0-10 scale). Promoters (9-10), Passives (7-8), and Detractors (0-6) yield the NPS score. The NPS System goes beyond the metric to a closed-loop feedback management system.",
      category: "Operational",
      dimensions: [
        "NPS Score (% Promoters - % Detractors)",
        "Promoters (score 9-10): loyal enthusiasts who fuel growth",
        "Passives (score 7-8): satisfied but unenthusiastic",
        "Detractors (score 0-6): unhappy patients who damage reputation",
        "Inner Loop (close the loop with individual patients)",
        "Outer Loop (systemic fixes based on pattern analysis)",
      ],
      guideText:
        "NPS benchmarks for African private healthcare: World class >70, Good >50, Average 30-50, Below average <30. Healthcare-specific NPS questions: overall care quality, likelihood to return, likelihood to recommend. Closed-loop process: (1) Survey within 24-48 hours of discharge, (2) Follow up with all Detractors within 48 hours (Inner Loop), (3) Monthly analysis of Detractor themes for systemic fixes (Outer Loop). Most valuable insight is not the score itself but what Detractors say — categorise by care quality, waiting times, billing, communication, and facilities.",
      sortOrder: 45,
    },
    {
      name: "Hospital Governance Framework",
      slug: "hospital-governance",
      description:
        "A structured framework for assessing and designing effective corporate governance in hospitals and health systems. Covers board composition and effectiveness, executive accountability, clinical governance integration, financial oversight, risk management, and stakeholder accountability. Based on the King IV Governance Principles and NHS Foundation Trust governance model.",
      category: "Organizational",
      dimensions: [
        "Board Composition & Independence (right mix of skills, independence, diversity)",
        "Board Effectiveness (meeting quality, information quality, decision-making)",
        "Executive Accountability (CEO/MD performance management, delegation framework)",
        "Clinical Governance Integration (board oversight of clinical quality and safety)",
        "Financial Oversight (internal audit, external audit, financial controls)",
        "Risk Management Framework (risk appetite, risk register, risk culture)",
        "Stakeholder Accountability (transparency, patient voice, community reporting)",
      ],
      guideText:
        "Common governance failures in Nigerian private hospitals: (1) Boards dominated by founders who confuse governance with management, (2) No independent non-executive directors with relevant expertise, (3) Clinical quality not on board agenda (only finances discussed), (4) No formal internal audit function, (5) Risk management reactive rather than proactive. For family-owned hospitals transitioning to professional management: prioritise separating ownership from management, appointing independent non-executive directors, and establishing a clinical quality subcommittee of the board.",
      sortOrder: 46,
    },
    {
      name: "Spectrum of Prevention Framework",
      slug: "spectrum-of-prevention",
      description:
        "A public health planning framework that recognises effective prevention requires interventions at multiple levels — from individual behaviour to broad social change. Developed by Cohen & Swift. Prevents the common mistake of focusing only on individual education when the most powerful levers are policy, systems, and environmental change.",
      category: "Public Health & M&E",
      dimensions: [
        "Level 1: Strengthening Individual Knowledge and Skills",
        "Level 2: Promoting Community Education",
        "Level 3: Educating Providers (healthcare workers)",
        "Level 4: Fostering Coalitions and Networks",
        "Level 5: Changing Organisational Practices",
        "Level 6: Influencing Policy and Legislation",
      ],
      guideText:
        "The most impactful interventions are at Levels 5-6 (policy and organisational change) but are the hardest to implement. The most common interventions are at Levels 1-2 (individual education) but have the smallest population-level impact. High-performing public health programs work simultaneously at multiple levels: e.g., for tobacco control: individual counselling (L1) + community campaigns (L2) + provider training on cessation (L3) + health facility smoke-free policies (L5) + tobacco excise taxes and advertising bans (L6). For Nigeria: use L6 (policy/legislation) for the highest-leverage health gains per naira spent.",
      sortOrder: 47,
    },
    {
      name: "Digital Health Maturity Model (HIMSS EMRAM)",
      slug: "himss-emram",
      description:
        "The Healthcare Information and Management Systems Society (HIMSS) Electronic Medical Record Adoption Model (EMRAM) is the global standard for benchmarking hospital digital health maturity. Eight stages (0-7) from paper-based to a fully digital, interoperable healthcare environment. Used globally by 32,000+ hospitals. Relevant for any African hospital planning EMR investment or digital health accreditation.",
      category: "Digital",
      dimensions: [
        "Stage 0: All major systems not installed",
        "Stage 1: Lab, radiology, pharmacy systems installed",
        "Stage 2: Clinical data repository, clinical decision support (CDS)",
        "Stage 3: Nursing and clinical documentation, PACS available",
        "Stage 4: Computerised physician order entry (CPOE) with CDS",
        "Stage 5: Closed loop medication administration",
        "Stage 6: Physician documentation, full CDS",
        "Stage 7: Complete EMR, data analytics, health information exchange",
      ],
      guideText:
        "Most Nigerian private hospitals are at Stage 0-2. Realistic 5-year target for a well-funded hospital is Stage 4-5. Do not try to jump from Stage 0 to Stage 7 — the organisational change required is too large. Sequence: (1) Get to Stage 2 first (basic EMR, lab, pharmacy, radiology integration), (2) Then CPOE (Stage 4) for medication safety, (3) Then closed-loop medication (Stage 5) for JCI MMU compliance. Each stage requires the previous stage's capabilities to be stable — rushing ahead creates systems that staff don't trust or use.",
      sortOrder: 48,
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

  console.log("Final push seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
