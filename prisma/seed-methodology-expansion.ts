import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const methodologies = [
  // ─── PUBLIC HEALTH & M&E ────────────────────────────────────────────────────

  {
    name: "Logframe & Results-Based M&E",
    slug: "logframe-results-me",
    description:
      "Logical Framework Approach (Logframe) is the gold standard for designing, monitoring, and evaluating public health programs. Links inputs → activities → outputs → outcomes → impact in a logical chain. Enables results-based management and demonstrates accountability to donors and stakeholders.",
    category: "Public Health & M&E",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 10,
    sortOrder: 56,
    phases: [
      {
        name: "Problem Analysis & Needs Assessment",
        description: "Conduct stakeholder analysis, build problem trees, and define the intervention logic.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Stakeholder mapping", "Problem tree analysis", "Needs assessment surveys", "Situation analysis"],
        keyDeliverables: ["Situation Analysis report", "Problem Tree diagram", "Stakeholder Analysis matrix", "Needs Assessment Report"],
        gates: [{ name: "Problem validated with stakeholders", criteria: "Problem tree reviewed and agreed by key stakeholders.", order: 1 }],
      },
      {
        name: "Logframe Development",
        description: "Construct the full Logframe matrix: goal, purpose, outputs, activities, indicators, MoV, and assumptions.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Theory of Change workshop", "Indicator development", "SMART indicator validation", "Assumptions risk mapping"],
        keyDeliverables: ["Logframe Matrix", "Theory of Change diagram", "Indicator Reference Sheets"],
        gates: [{ name: "Logframe approved by donor/client", criteria: "Logframe matrix reviewed and signed off.", order: 1 }],
      },
      {
        name: "M&E Plan Design",
        description: "Design data collection tools, assign M&E roles, and establish monitoring cadence.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Data collection tool design", "M&E system setup", "Baseline data collection planning", "Staff training on M&E"],
        keyDeliverables: ["M&E Plan", "Data Collection Tools", "M&E Budget", "Roles & Responsibilities Matrix"],
        gates: [],
      },
      {
        name: "Implementation & Monitoring",
        description: "Execute the program with quarterly monitoring against logframe indicators.",
        order: 4, typicalWeeks: 0,
        keyActivities: ["Quarterly data collection", "Progress reporting", "Data quality assessments", "Adaptive management"],
        keyDeliverables: ["Quarterly Monitoring Reports", "Progress Dashboards", "Data Quality Assessment Reports"],
        gates: [{ name: "Midterm review checkpoint", criteria: "Midterm evaluation completed and adaptive management actions agreed.", order: 1 }],
      },
      {
        name: "Evaluation & Learning",
        description: "Conduct endline evaluation, document lessons learned, and produce final report.",
        order: 5, typicalWeeks: 3,
        keyActivities: ["Endline data collection", "Impact analysis", "Lessons learned workshop", "Dissemination planning"],
        keyDeliverables: ["Midterm Evaluation Report", "Endline Evaluation Report", "Lessons Learned Document", "Policy Brief"],
        gates: [{ name: "Evaluation report approved", criteria: "Final evaluation report accepted by donor/client.", order: 1 }],
      },
    ],
  },

  {
    name: "Impact Evaluation (RCTs & Quasi-Experimental)",
    slug: "impact-evaluation-rct",
    description:
      "Rigorous impact evaluation determines the causal effect of an intervention using experimental (RCTs) or quasi-experimental designs (DiD, RDD, PSM). Gold standard for evidence-based policy. Answers: Did this program work, and by how much?",
    category: "Public Health & M&E",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 52,
    sortOrder: 57,
    phases: [
      {
        name: "Evaluation Design",
        description: "Define the evaluation question, select the design, calculate sample size, and obtain ethics approval.",
        order: 1, typicalWeeks: 6,
        keyActivities: ["Theory of Change review", "Design selection (RCT, DiD, RDD, PSM)", "Power calculations", "IRB/ethics submission", "Data collection tool development"],
        keyDeliverables: ["Evaluation Protocol", "Power Calculation Report", "IRB Approval", "Data Collection Instruments"],
        gates: [{ name: "Evaluation design approved", criteria: "Protocol approved by ethics board and client.", order: 1 }],
      },
      {
        name: "Baseline Data Collection",
        description: "Collect baseline survey data to establish pre-intervention status of treatment and control groups.",
        order: 2, typicalWeeks: 8,
        keyActivities: ["Enumerator training", "Baseline surveys", "Data entry and cleaning", "Balance tests (RCT)"],
        keyDeliverables: ["Baseline Survey Dataset", "Data Quality Report", "Descriptive Statistics Report"],
        gates: [{ name: "Baseline data validated", criteria: "Data quality checks passed; balance tests confirm comparability.", order: 1 }],
      },
      {
        name: "Program Implementation",
        description: "Monitor program fidelity and collect implementation data throughout the intervention period.",
        order: 3, typicalWeeks: 0,
        keyActivities: ["Fidelity monitoring visits", "Implementation data collection", "Protocol deviation tracking"],
        keyDeliverables: ["Fidelity Assessment Reports", "Implementation Data", "Protocol Deviation Log"],
        gates: [],
      },
      {
        name: "Endline Data Collection",
        description: "Collect endline survey data and assess attrition.",
        order: 4, typicalWeeks: 8,
        keyActivities: ["Endline surveys", "Attrition analysis", "Data cleaning"],
        keyDeliverables: ["Endline Dataset", "Attrition Analysis", "Cleaned Merged Dataset"],
        gates: [],
      },
      {
        name: "Analysis & Reporting",
        description: "Run causal analysis, test heterogeneous effects, and produce the impact evaluation report.",
        order: 5, typicalWeeks: 10,
        keyActivities: ["ITT and TOT analysis", "Subgroup/heterogeneous effects", "Cost-effectiveness analysis", "Report writing", "Policy brief development"],
        keyDeliverables: ["Impact Evaluation Report", "Policy Brief", "Academic Manuscript (if applicable)", "Presentation deck"],
        gates: [{ name: "Findings peer reviewed", criteria: "Report reviewed by independent expert before publication.", order: 1 }],
      },
    ],
  },

  {
    name: "Theory of Change (ToC)",
    slug: "theory-of-change",
    description:
      "Theory of Change is a comprehensive description of how and why a desired change is expected to happen in a given context. Maps long-term goals backwards through intermediate outcomes to immediate outcomes, outputs, and activities. Essential for program design and impact measurement.",
    category: "Public Health & M&E",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 4,
    sortOrder: 58,
    phases: [
      {
        name: "Stakeholder Engagement",
        description: "Engage all stakeholders to understand the problem, existing evidence, and context.",
        order: 1, typicalWeeks: 1,
        keyActivities: ["Stakeholder mapping", "Literature review", "Stakeholder workshops", "Context analysis"],
        keyDeliverables: ["Stakeholder Map", "Context Analysis", "Evidence Review Summary"],
        gates: [],
      },
      {
        name: "Outcomes Mapping",
        description: "Identify long-term, intermediate, and immediate outcomes in the causal chain.",
        order: 2, typicalWeeks: 1,
        keyActivities: ["Backcasting from long-term goal", "Outcomes mapping workshop", "Assumptions identification", "Evidence mapping"],
        keyDeliverables: ["Outcomes Framework", "Causal Pathway Map", "Assumptions Register"],
        gates: [{ name: "Outcomes validated", criteria: "Outcomes and causal pathways reviewed and agreed by stakeholders.", order: 1 }],
      },
      {
        name: "ToC Diagram & Narrative",
        description: "Produce the ToC diagram and accompanying narrative explanation.",
        order: 3, typicalWeeks: 1,
        keyActivities: ["ToC diagram development", "Narrative writing", "Indicator development per outcome", "Internal review"],
        keyDeliverables: ["Theory of Change Diagram", "ToC Narrative Report", "Indicator Framework"],
        gates: [],
      },
      {
        name: "Testing & Validation",
        description: "Test ToC assumptions and validate with beneficiaries and partners.",
        order: 4, typicalWeeks: 1,
        keyActivities: ["Beneficiary validation sessions", "Assumption stress-testing", "Revision and finalisation"],
        keyDeliverables: ["Final ToC Document", "Validation Report", "Updated Assumptions Register"],
        gates: [{ name: "ToC finalised and adopted", criteria: "ToC approved and embedded in program design and M&E plan.", order: 1 }],
      },
    ],
  },

  {
    name: "RE-AIM Framework",
    slug: "re-aim-framework",
    description:
      "RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) is an implementation science framework for evaluating and improving public health programs. Assesses not just if an intervention works, but how well it can be scaled and sustained in real-world settings.",
    category: "Public Health & M&E",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 16,
    sortOrder: 59,
    phases: [
      {
        name: "Reach Assessment",
        description: "Assess what proportion and which segments of the target population are reached by the intervention.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Target population definition", "Participation data collection", "Representativeness analysis", "Equity analysis"],
        keyDeliverables: ["Reach Assessment Report", "Participation Statistics", "Equity Gap Analysis"],
        gates: [],
      },
      {
        name: "Effectiveness Evaluation",
        description: "Measure impact on primary outcomes and any negative unintended effects.",
        order: 2, typicalWeeks: 4,
        keyActivities: ["Outcome measurement", "Cost-effectiveness analysis", "Quality of life assessment", "Unintended consequences review"],
        keyDeliverables: ["Effectiveness Report", "Cost-Effectiveness Analysis", "Outcomes Dashboard"],
        gates: [{ name: "Effectiveness evidence sufficient", criteria: "Outcome data meets pre-specified evidence threshold.", order: 1 }],
      },
      {
        name: "Adoption Analysis",
        description: "Assess the proportion of settings, organisations, and staff that adopt the intervention.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Setting-level uptake tracking", "Barrier and facilitator analysis", "Champion identification"],
        keyDeliverables: ["Adoption Rate Report", "Barrier Analysis", "Facilitator Mapping"],
        gates: [],
      },
      {
        name: "Implementation Assessment",
        description: "Evaluate fidelity, consistency, and cost of delivery across settings.",
        order: 4, typicalWeeks: 4,
        keyActivities: ["Fidelity monitoring", "Cost of delivery analysis", "Implementation variation mapping", "Staff training assessment"],
        keyDeliverables: ["Implementation Fidelity Report", "Delivery Cost Analysis", "Adaptation Registry"],
        gates: [],
      },
      {
        name: "Maintenance Evaluation",
        description: "Assess long-term sustainability at individual and institutional level.",
        order: 5, typicalWeeks: 3,
        keyActivities: ["Long-term follow-up data collection", "Institutionalisation assessment", "Sustainability planning"],
        keyDeliverables: ["Maintenance Report", "Sustainability Plan", "Scale-Up Recommendations"],
        gates: [{ name: "Scale-up decision", criteria: "Evidence across all 5 dimensions sufficient to inform scale-up.", order: 1 }],
      },
    ],
  },

  {
    name: "CDC Program Evaluation Framework",
    slug: "cdc-program-evaluation",
    description:
      "The CDC Framework for Program Evaluation in Public Health provides a systematic approach to planning, designing, and conducting evaluations. Six interconnected steps ensure evaluations are useful, feasible, ethical, and accurate.",
    category: "Public Health & M&E",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 12,
    sortOrder: 60,
    phases: [
      {
        name: "Engage Stakeholders",
        description: "Identify and engage all those involved in or affected by the program and its evaluation.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Stakeholder identification", "Stakeholder engagement plan", "Roles and responsibilities definition"],
        keyDeliverables: ["Stakeholder Engagement Plan", "Roles Matrix", "Communication Plan"],
        gates: [],
      },
      {
        name: "Describe the Program",
        description: "Define the program context, logic model, and stage of development.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Logic model development", "Program context documentation", "Stage of development assessment"],
        keyDeliverables: ["Program Logic Model", "Program Description", "Context Analysis"],
        gates: [],
      },
      {
        name: "Focus the Evaluation Design",
        description: "Clarify evaluation purpose, questions, methods, and agreements.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Evaluation questions development", "Design selection", "Budget planning", "Protocol development"],
        keyDeliverables: ["Evaluation Questions", "Evaluation Design", "Evaluation Protocol", "Budget"],
        gates: [{ name: "Design approved by stakeholders", criteria: "All stakeholders agree on evaluation questions and design.", order: 1 }],
      },
      {
        name: "Gather Credible Evidence",
        description: "Collect credible data using appropriate methods.",
        order: 4, typicalWeeks: 4,
        keyActivities: ["Data collection", "Data quality assurance", "Mixed methods triangulation"],
        keyDeliverables: ["Data Collection Report", "Data Quality Assessment", "Cleaned Datasets"],
        gates: [],
      },
      {
        name: "Justify Conclusions",
        description: "Analyse data, interpret findings, and develop evidence-based conclusions.",
        order: 5, typicalWeeks: 3,
        keyActivities: ["Data analysis", "Benchmarking", "Stakeholder interpretation sessions", "Recommendations development"],
        keyDeliverables: ["Analysis Report", "Findings Summary", "Conclusions and Recommendations"],
        gates: [],
      },
      {
        name: "Ensure Use & Share Lessons",
        description: "Disseminate findings and ensure evaluation leads to action.",
        order: 6, typicalWeeks: 1,
        keyActivities: ["Report writing", "Stakeholder presentations", "Policy brief development", "Lessons learned documentation"],
        keyDeliverables: ["Evaluation Report", "Policy Brief", "Dissemination Plan", "Action Plan"],
        gates: [{ name: "Action plan adopted", criteria: "Key stakeholders commit to acting on evaluation findings.", order: 1 }],
      },
    ],
  },

  // ─── HEALTH ECONOMICS ───────────────────────────────────────────────────────

  {
    name: "Cost-Effectiveness Analysis (CEA)",
    slug: "cost-effectiveness-analysis",
    description:
      "CEA compares the costs and health outcomes of alternative interventions, expressing results as cost per unit of health outcome (e.g., cost per QALY gained, cost per DALY averted). Enables decision-makers to allocate limited health resources to maximise population health. Outputs include ICER, cost-effectiveness planes, and acceptability curves.",
    category: "Health Economics",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 16,
    sortOrder: 61,
    phases: [
      {
        name: "Research Question & Scope",
        description: "Define the decision problem, perspective, comparators, and time horizon.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Decision problem framing", "Perspective selection (societal, health system, payer)", "Comparator identification", "Time horizon decision", "Protocol development"],
        keyDeliverables: ["Research Protocol", "Scope Document", "Registered Study Protocol (if academic)"],
        gates: [{ name: "Scope agreed", criteria: "Client and technical team agree on perspective, comparators, and time horizon.", order: 1 }],
      },
      {
        name: "Model Structure Development",
        description: "Build the decision analytic model (decision tree or Markov model) reflecting the clinical pathway.",
        order: 2, typicalWeeks: 3,
        keyActivities: ["Clinical pathway mapping", "Decision tree construction", "Markov state definition", "Model programming (Excel, R, TreeAge)"],
        keyDeliverables: ["Model Structure Diagram", "Programmed Model (Excel/TreeAge/R)", "Assumptions Documentation"],
        gates: [],
      },
      {
        name: "Parameter Estimation",
        description: "Identify and populate all model parameters: costs, effectiveness, utilities, and transition probabilities.",
        order: 3, typicalWeeks: 5,
        keyActivities: ["Systematic literature review", "Cost data collection (local unit costs)", "Utility weight identification", "Transition probability derivation", "Expert elicitation"],
        keyDeliverables: ["Parameter Input Table", "Data Sources Reference List", "Costing Report", "Utilities Summary"],
        gates: [],
      },
      {
        name: "Base Case Analysis",
        description: "Run the base case analysis and calculate the ICER.",
        order: 4, typicalWeeks: 2,
        keyActivities: ["Base case model run", "ICER calculation", "Cost-effectiveness plane plotting", "Dominance/extended dominance checks"],
        keyDeliverables: ["Base Case Results Table", "Cost-Effectiveness Plane", "Incremental Analysis Summary"],
        gates: [],
      },
      {
        name: "Sensitivity & Uncertainty Analysis",
        description: "Test robustness through one-way, multi-way, and probabilistic sensitivity analyses.",
        order: 5, typicalWeeks: 3,
        keyActivities: ["One-way sensitivity analyses", "Tornado diagram", "Probabilistic sensitivity analysis (Monte Carlo)", "Cost-effectiveness acceptability curve (CEAC)", "Scenario analyses"],
        keyDeliverables: ["Sensitivity Analysis Results", "Tornado Diagram", "CEAC", "Probabilistic Results"],
        gates: [],
      },
      {
        name: "Reporting & Dissemination",
        description: "Produce full technical report and policy-facing outputs.",
        order: 6, typicalWeeks: 2,
        keyActivities: ["Report writing (CHEERS checklist)", "Policy brief development", "Stakeholder presentation", "Peer review"],
        keyDeliverables: ["Full CEA Report", "Policy Brief", "Presentation", "Academic Manuscript (if applicable)"],
        gates: [{ name: "Report peer reviewed and finalised", criteria: "Report reviewed by independent health economist.", order: 1 }],
      },
    ],
  },

  {
    name: "Cost-Benefit Analysis (CBA)",
    slug: "cost-benefit-analysis",
    description:
      "CBA compares costs and benefits of a health investment with BOTH expressed in monetary terms. Enables cross-sector comparisons (health vs education vs infrastructure). Key outputs: Benefit-Cost Ratio (BCR), Net Present Value (NPV), Internal Rate of Return (IRR). Used for infrastructure, public programmes, and policy decisions.",
    category: "Health Economics",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 8,
    sortOrder: 62,
    phases: [
      {
        name: "Scope & Framework",
        description: "Define perspective, time horizon, discount rate, and identify all relevant costs and benefits.",
        order: 1, typicalWeeks: 1,
        keyActivities: ["Stakeholder perspective setting", "Cost and benefit taxonomy", "Discount rate selection", "Distributional considerations"],
        keyDeliverables: ["Analytical Framework", "Cost & Benefit Classification Table"],
        gates: [],
      },
      {
        name: "Cost Estimation",
        description: "Identify and quantify all direct, indirect, and intangible costs.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Capital cost estimation", "Operating cost modelling", "Opportunity cost analysis", "Shadow pricing for non-market costs"],
        keyDeliverables: ["Cost Estimation Model", "Capital Expenditure Schedule", "Operating Cost Projections"],
        gates: [],
      },
      {
        name: "Benefit Valuation",
        description: "Quantify and monetise all benefits: health gains, productivity, education, quality of life.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Health outcome quantification", "Value of Statistical Life (VSL) application", "Productivity gains modelling", "Willingness-to-pay studies", "Contingent valuation"],
        keyDeliverables: ["Benefit Valuation Model", "VSL/VSLY Estimates", "Monetised Benefits Table"],
        gates: [],
      },
      {
        name: "CBA Calculations & Sensitivity",
        description: "Calculate BCR, NPV, IRR, and run sensitivity analyses.",
        order: 4, typicalWeeks: 2,
        keyActivities: ["NPV and BCR calculation", "IRR calculation", "Sensitivity analysis (discount rate, benefit assumptions)", "Break-even analysis"],
        keyDeliverables: ["CBA Results Table", "BCR/NPV/IRR Summary", "Sensitivity Analysis", "Break-Even Analysis"],
        gates: [],
      },
      {
        name: "Reporting",
        description: "Produce full CBA report and policy recommendations.",
        order: 5, typicalWeeks: 1,
        keyActivities: ["Report writing", "Equity and distributional analysis", "Recommendations development"],
        keyDeliverables: ["CBA Report", "Policy Brief", "Decision Recommendation"],
        gates: [{ name: "Results validated", criteria: "CBA reviewed by independent economist.", order: 1 }],
      },
    ],
  },

  {
    name: "Budget Impact Analysis (BIA)",
    slug: "budget-impact-analysis",
    description:
      "BIA estimates the financial consequences of adopting a new health technology or programme within a specific payer budget. Answers: Can we afford this? Complements CEA (which asks: Is this good value?). Outputs: annual budget impact, per-member-per-month cost, affordability assessment over 3-5 years.",
    category: "Health Economics",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 6,
    sortOrder: 63,
    phases: [
      {
        name: "Scope Definition",
        description: "Define the budget holder, time horizon, eligible population, and comparators.",
        order: 1, typicalWeeks: 1,
        keyActivities: ["Budget holder identification (NHIS, HMO, hospital)", "Time horizon setting (3-5 years)", "Population scoping", "Comparator selection"],
        keyDeliverables: ["BIA Scope Document", "Eligible Population Definition", "Budget Holder Profile"],
        gates: [],
      },
      {
        name: "Population & Uptake Modelling",
        description: "Estimate the eligible population and project uptake curves year-by-year.",
        order: 2, typicalWeeks: 1,
        keyActivities: ["Epidemiological data collection", "Market share analysis", "S-curve uptake modelling", "Sub-group analysis"],
        keyDeliverables: ["Eligible Population Model", "Uptake Projections", "Market Share Assumptions"],
        gates: [],
      },
      {
        name: "Cost & Offset Estimation",
        description: "Estimate per-patient costs for new and current technologies, and any downstream savings.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Drug/intervention cost data collection", "Administration cost modelling", "Offset savings identification (avoided hospitalisations, etc.)", "Cost validation with local prices"],
        keyDeliverables: ["Per-Patient Cost Model", "Cost Offset Analysis", "Total Treatment Cost Table"],
        gates: [],
      },
      {
        name: "Budget Impact Calculation & Reporting",
        description: "Calculate total budget impact year-by-year and assess affordability.",
        order: 4, typicalWeeks: 2,
        keyActivities: ["Annual budget impact calculation", "PMPM calculation", "Affordability assessment (% of total budget)", "Sensitivity analysis"],
        keyDeliverables: ["Budget Impact Table (Year 1-5)", "PMPM Analysis", "Affordability Assessment", "Sensitivity Analysis", "BIA Report"],
        gates: [{ name: "BIA approved by budget holder", criteria: "Budget holder has reviewed and accepted the affordability analysis.", order: 1 }],
      },
    ],
  },

  {
    name: "Behavioral Economics for Health",
    slug: "behavioral-economics-health",
    description:
      "Applies nudge theory and behavioral insights to understand and influence health behaviors. Diagnoses behavioral barriers (present bias, loss aversion, status quo bias, social norms, limited attention) and designs evidence-based nudge interventions. Used for improving medication adherence, vaccination uptake, preventive care, and provider behavior change.",
    category: "Health Economics",
    serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
    estimatedWeeks: 12,
    sortOrder: 64,
    phases: [
      {
        name: "Behavioral Diagnosis",
        description: "Identify the target behavior and diagnose the behavioral barriers preventing it.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Target behavior definition", "Patient/provider journey mapping", "Qualitative interviews and focus groups", "Behavioral barrier identification (COM-B framework)", "Data analysis (where drop-off occurs)"],
        keyDeliverables: ["Behavioral Diagnosis Report", "Journey Map", "Barrier Analysis", "Behavioral Insights Brief"],
        gates: [{ name: "Behavioral barriers validated", criteria: "Behavioural barriers confirmed through qualitative and quantitative evidence.", order: 1 }],
      },
      {
        name: "Intervention Design",
        description: "Design nudge interventions targeting identified behavioral barriers.",
        order: 2, typicalWeeks: 3,
        keyActivities: ["Intervention brainstorming (using EAST/MINDSPACE frameworks)", "Nudge selection (defaults, social proof, reminders, framing, simplification)", "Ethical review (autonomy, equity, transparency)", "Prototype development"],
        keyDeliverables: ["Intervention Design Portfolio", "EAST/MINDSPACE Analysis", "Ethical Review", "Prototypes"],
        gates: [{ name: "Interventions approved for piloting", criteria: "Ethical review complete; interventions signed off by client.", order: 1 }],
      },
      {
        name: "Pilot Testing",
        description: "Run small-scale pilots to test intervention effectiveness.",
        order: 3, typicalWeeks: 4,
        keyActivities: ["A/B testing design", "Pilot rollout", "Behavioral outcome measurement", "Qualitative feedback collection"],
        keyDeliverables: ["Pilot Test Results", "A/B Test Report", "Behaviour Change Metrics"],
        gates: [{ name: "Pilot results reviewed", criteria: "Pilot data reviewed; decision made on which interventions to scale.", order: 1 }],
      },
      {
        name: "Scale & Embed",
        description: "Scale effective interventions and embed into standard operating procedures.",
        order: 4, typicalWeeks: 2,
        keyActivities: ["Scale-up planning", "Staff training", "System integration (EHR prompts, SMS platform setup)", "Monitoring framework"],
        keyDeliverables: ["Scale-Up Plan", "Implementation Guide", "Training Materials", "Monitoring Framework"],
        gates: [],
      },
    ],
  },

  // ─── TECH STARTUP METHODOLOGIES ─────────────────────────────────────────────

  {
    name: "Lean Startup",
    slug: "lean-startup",
    description:
      "Lean Startup is a methodology for developing businesses and products through rapid iteration and validated learning. Core loop: Build → Measure → Learn. Uses Minimum Viable Products (MVPs) to test riskiest assumptions quickly before scaling. Enables pivot or persevere decisions based on data, not opinion.",
    category: "Tech & Innovation",
    serviceTypes: ["DIGITAL_HEALTH"],
    estimatedWeeks: 16,
    sortOrder: 65,
    phases: [
      {
        name: "Problem Discovery",
        description: "Validate the problem through customer interviews before building anything.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Customer discovery interviews (20-50)", "Problem hypothesis formulation", "Market size estimation", "Riskiest assumption identification", "Competitor landscape analysis"],
        keyDeliverables: ["Problem Validation Report", "Customer Interview Summary", "Riskiest Assumptions List", "Market Sizing"],
        gates: [{ name: "Problem validated", criteria: "Problem confirmed real and frequent by at least 20 customer interviews.", order: 1 }],
      },
      {
        name: "MVP Development",
        description: "Build the simplest possible thing to test the riskiest assumption.",
        order: 2, typicalWeeks: 4,
        keyActivities: ["MVP type selection (landing page, concierge, Wizard of Oz, prototype)", "MVP build", "Metrics definition (AARRR or HEART)", "Analytics setup"],
        keyDeliverables: ["MVP (working product or service)", "Metrics Dashboard", "Analytics Setup"],
        gates: [{ name: "MVP ready to test", criteria: "MVP deployed and metrics tracking live.", order: 1 }],
      },
      {
        name: "MVP Testing & Learning",
        description: "Deploy to early adopters, collect data, and generate validated learning.",
        order: 3, typicalWeeks: 5,
        keyActivities: ["Early adopter recruitment", "User testing sessions", "Metrics data collection", "Customer development interviews", "Cohort analysis"],
        keyDeliverables: ["Metrics Report", "User Feedback Summary", "Validated Learning Document", "Pivot/Persevere Recommendation"],
        gates: [{ name: "Pivot or persevere decision", criteria: "Data reviewed and decision made: pivot to new hypothesis or persevere and scale.", order: 1 }],
      },
      {
        name: "Iterate or Scale",
        description: "If persevering: scale the validated model. If pivoting: return to MVP cycle with new hypothesis.",
        order: 4, typicalWeeks: 4,
        keyActivities: ["Product roadmap development", "Growth channel identification", "Fundraising preparation (if needed)", "Team scaling"],
        keyDeliverables: ["Product Roadmap", "Growth Plan", "Investor Deck (if applicable)", "Hiring Plan"],
        gates: [],
      },
    ],
  },

  {
    name: "Agile / Scrum",
    slug: "agile-scrum",
    description:
      "Agile is an iterative approach to software development that delivers value in short cycles (sprints) with continuous customer feedback. Scrum is the most widely used Agile framework, with defined roles (Product Owner, Scrum Master, Dev Team), ceremonies (Sprint Planning, Daily Standup, Review, Retrospective), and artifacts (Product Backlog, Sprint Backlog, Increment).",
    category: "Tech & Innovation",
    serviceTypes: ["DIGITAL_HEALTH"],
    estimatedWeeks: 0,
    sortOrder: 66,
    phases: [
      {
        name: "Backlog Creation & Sprint 0",
        description: "Build the product backlog, define the MVP, set up team, tools, and Definition of Done.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["User story writing", "Backlog prioritisation (MoSCoW)", "Estimation (story points)", "Team setup", "CI/CD pipeline setup", "Definition of Done agreement"],
        keyDeliverables: ["Prioritised Product Backlog", "Definition of Done", "Team Charter", "Sprint 0 Report"],
        gates: [{ name: "Backlog ready for Sprint 1", criteria: "Top 2 sprints worth of backlog refined and estimated.", order: 1 }],
      },
      {
        name: "Sprint Cycle (Repeating)",
        description: "Two-week sprint cycle: plan, build, test, review, and retrospect.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Sprint Planning (2 hrs)", "Daily Standups (15 min/day)", "Development and testing", "Sprint Review (demo to stakeholders)", "Sprint Retrospective (team improvement)"],
        keyDeliverables: ["Working Software Increment", "Sprint Review Notes", "Updated Backlog", "Retrospective Actions"],
        gates: [{ name: "Sprint Review passed", criteria: "Product Owner accepts the sprint increment as meeting Definition of Done.", order: 1 }],
      },
      {
        name: "Release",
        description: "Deploy stable increment to production after sufficient sprints.",
        order: 3, typicalWeeks: 1,
        keyActivities: ["Release testing", "User acceptance testing (UAT)", "Deployment", "User training", "Go-live support"],
        keyDeliverables: ["Release Build", "UAT Sign-off", "Deployment Documentation", "User Training Materials"],
        gates: [{ name: "Go/No-Go release decision", criteria: "UAT passed, security reviewed, client sign-off obtained.", order: 1 }],
      },
    ],
  },

  {
    name: "Jobs-to-Be-Done (JTBD)",
    slug: "jobs-to-be-done",
    description:
      "JTBD is a framework for understanding customer motivation by focusing on the 'job' a customer is trying to accomplish, rather than product features or demographics. Clayton Christensen's insight: customers don't buy products, they hire them to do a job. Critical for product strategy, innovation, and understanding healthcare decision-making.",
    category: "Tech & Innovation",
    serviceTypes: ["DIGITAL_HEALTH"],
    estimatedWeeks: 4,
    sortOrder: 67,
    phases: [
      {
        name: "Job Discovery",
        description: "Identify the functional, social, and emotional jobs customers are trying to do.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["JTBD interviews (switch interviews)", "Job mapping workshops", "Outcome statements identification", "Competing solutions analysis"],
        keyDeliverables: ["JTBD Interview Guide", "Job Map", "Job Statements", "Competing Solutions Analysis"],
        gates: [],
      },
      {
        name: "Opportunity Scoring",
        description: "Score jobs by importance and satisfaction to identify underserved opportunities.",
        order: 2, typicalWeeks: 1,
        keyActivities: ["Survey design (importance + satisfaction)", "Opportunity score calculation (importance + max(importance-satisfaction, 0))", "Opportunity landscape mapping"],
        keyDeliverables: ["Opportunity Score Survey", "Opportunity Landscape", "Priority Job List"],
        gates: [],
      },
      {
        name: "Solution Design & Validation",
        description: "Design solutions that directly address the highest-opportunity jobs.",
        order: 3, typicalWeeks: 1,
        keyActivities: ["Solution brainstorming", "Concept testing", "Positioning validation", "Roadmap development"],
        keyDeliverables: ["Solution Concepts", "Concept Test Results", "Product/Service Positioning", "Roadmap"],
        gates: [{ name: "Solution validated with customers", criteria: "Concept tests confirm solution addresses target jobs better than alternatives.", order: 1 }],
      },
    ],
  },

  // ─── CLASSIC MBB FRAMEWORKS ─────────────────────────────────────────────────

  {
    name: "BCG Growth-Share Matrix",
    slug: "bcg-growth-share-matrix",
    description:
      "The BCG Matrix categorises products or business units by market growth rate and relative market share into Stars (invest), Cash Cows (harvest), Question Marks (selective investment or divest), and Dogs (divest). Used for portfolio management and resource allocation in multi-service healthcare organisations.",
    category: "Strategy",
    serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
    estimatedWeeks: 4,
    sortOrder: 68,
    phases: [
      {
        name: "Portfolio Mapping",
        description: "Map all products, services, or business units onto the Growth-Share matrix.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Service line/product inventory", "Market share data collection", "Market growth rate estimation", "Revenue and margin data gathering", "BCG matrix construction"],
        keyDeliverables: ["BCG Matrix", "Market Share Analysis", "Market Growth Analysis", "Portfolio Map"],
        gates: [],
      },
      {
        name: "Strategic Implications",
        description: "Analyse portfolio balance and develop strategic recommendations for each quadrant.",
        order: 2, typicalWeeks: 1,
        keyActivities: ["Portfolio balance assessment", "Cash flow analysis by unit", "Strategic options per quadrant (invest, harvest, divest, selectively invest)", "Competitor response analysis"],
        keyDeliverables: ["Portfolio Balance Assessment", "Strategic Options Brief", "Quadrant Recommendations"],
        gates: [],
      },
      {
        name: "Resource Allocation Plan",
        description: "Develop an investment and divestment roadmap based on portfolio strategy.",
        order: 3, typicalWeeks: 1,
        keyActivities: ["Investment prioritisation", "Divestment plan (Dogs)", "Star investment plan", "Cash Cow harvesting strategy", "Question Mark go/no-go decisions"],
        keyDeliverables: ["Resource Allocation Plan", "Investment Roadmap", "Divestment Plan"],
        gates: [{ name: "Portfolio strategy approved", criteria: "Senior leadership aligned on portfolio investment and divestment decisions.", order: 1 }],
      },
    ],
  },

  {
    name: "McKinsey 7-S Framework",
    slug: "mckinsey-7s",
    description:
      "The 7-S Framework (Strategy, Structure, Systems, Shared Values, Style, Staff, Skills) analyses seven interdependent organisational elements to ensure alignment. Used for organisational diagnosis, change management, post-merger integration, and performance improvement. All 7 S must be aligned for strategy to succeed.",
    category: "Organisational Analysis",
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP"],
    estimatedWeeks: 6,
    sortOrder: 69,
    phases: [
      {
        name: "Current State Assessment",
        description: "Assess the current state of all 7 elements through interviews, document review, and observation.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Leadership interviews (all 7 S)", "Document review (strategy docs, org chart, HR data, process maps)", "Staff surveys", "Observation"],
        keyDeliverables: ["7-S Current State Assessment", "Interview Synthesis", "Evidence Base per Element"],
        gates: [],
      },
      {
        name: "Desired State & Gap Analysis",
        description: "Define the desired future state for each S and identify misalignments.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Desired state workshops", "Gap analysis per element", "Inter-element alignment analysis", "Root cause of misalignment"],
        keyDeliverables: ["Desired State Definition", "Gap Analysis Matrix", "Misalignment Map", "Root Cause Analysis"],
        gates: [{ name: "Desired state agreed", criteria: "Leadership aligned on desired state for all 7 elements.", order: 1 }],
      },
      {
        name: "Action Planning & Implementation",
        description: "Develop and execute an action plan to realign all 7 elements.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Prioritised action plan development", "Quick wins identification", "Change management planning", "Implementation roadmap"],
        keyDeliverables: ["7-S Realignment Action Plan", "Quick Wins List", "Change Management Plan", "Implementation Roadmap"],
        gates: [{ name: "Realignment complete", criteria: "All 7 elements assessed post-implementation as aligned.", order: 1 }],
      },
    ],
  },

  {
    name: "Ansoff Matrix (Growth Strategy)",
    slug: "ansoff-matrix",
    description:
      "The Ansoff Matrix analyses four growth options: Market Penetration (existing products, existing markets — lowest risk), Market Development (existing products, new markets), Product Development (new products, existing markets), and Diversification (new products, new markets — highest risk). Guides strategic growth decisions in healthcare organisations.",
    category: "Strategy",
    serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
    estimatedWeeks: 4,
    sortOrder: 70,
    phases: [
      {
        name: "Current Position Assessment",
        description: "Map existing products/services and markets to establish the baseline.",
        order: 1, typicalWeeks: 1,
        keyActivities: ["Product/service inventory", "Market definition", "Current market share estimation", "Revenue breakdown by product/market"],
        keyDeliverables: ["Product-Market Map", "Revenue Breakdown", "Market Share Estimates"],
        gates: [],
      },
      {
        name: "Growth Options Analysis",
        description: "Evaluate all four Ansoff quadrants against risk appetite, capabilities, and market attractiveness.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Market penetration opportunities", "Market development opportunity scan", "Product development pipeline review", "Diversification feasibility (if considered)", "Risk-capability-attractiveness scoring"],
        keyDeliverables: ["Ansoff Matrix", "Growth Options Assessment", "Risk-Capability-Attractiveness Scoring", "Opportunity Shortlist"],
        gates: [],
      },
      {
        name: "Growth Strategy & Roadmap",
        description: "Select and prioritise growth strategies; develop an implementation roadmap.",
        order: 3, typicalWeeks: 1,
        keyActivities: ["Strategy selection (typically 1-2 quadrants)", "Resource requirements analysis", "Implementation roadmap", "KPIs and targets"],
        keyDeliverables: ["Growth Strategy Document", "Investment Requirements", "Implementation Roadmap", "KPI Framework"],
        gates: [{ name: "Growth strategy approved", criteria: "Board/leadership has approved the selected growth strategies and roadmap.", order: 1 }],
      },
    ],
  },

  {
    name: "Blue Ocean Strategy",
    slug: "blue-ocean-strategy",
    description:
      "Blue Ocean Strategy (Kim & Mauborgne) focuses on creating uncontested market space ('blue oceans') rather than competing in existing overcrowded markets ('red oceans'). Uses the Strategy Canvas and Four Actions Framework (Eliminate, Reduce, Raise, Create) to reconstruct market boundaries.",
    category: "Strategy",
    serviceTypes: ["HOSPITAL_OPERATIONS", "DIGITAL_HEALTH", "HEALTH_SYSTEMS"],
    estimatedWeeks: 8,
    sortOrder: 71,
    phases: [
      {
        name: "As-Is Strategy Canvas",
        description: "Map the current competitive landscape to identify the red ocean.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Competitor identification", "Competing factors identification", "Customer value survey", "Strategy canvas construction", "Red ocean diagnosis"],
        keyDeliverables: ["As-Is Strategy Canvas", "Competitive Factor Analysis", "Red Ocean Diagnosis"],
        gates: [],
      },
      {
        name: "Four Actions Framework",
        description: "Apply Eliminate-Reduce-Raise-Create (ERRC) grid to reconstruct buyer value.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["ERRC workshop", "Non-customer analysis (3 tiers)", "Value innovation brainstorming", "Blue ocean opportunity identification"],
        keyDeliverables: ["ERRC Grid", "Non-Customer Analysis", "Value Innovation Opportunities", "Blue Ocean Hypotheses"],
        gates: [],
      },
      {
        name: "To-Be Strategy Canvas",
        description: "Design the new value curve that creates a blue ocean.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["New value curve design", "Focus, divergence, and compelling tagline test", "Buyer utility map validation", "Business model sketch"],
        keyDeliverables: ["To-Be Strategy Canvas", "New Value Curve", "Buyer Utility Map", "Business Model Sketch"],
        gates: [{ name: "New value curve validated with non-customers", criteria: "Target non-customers confirm new value proposition is compelling.", order: 1 }],
      },
      {
        name: "Implementation Planning",
        description: "Address the four organisational hurdles (cognitive, resource, motivational, political).",
        order: 4, typicalWeeks: 2,
        keyActivities: ["Hurdle analysis", "Tipping point leadership plan", "Pilot market selection", "Execution roadmap"],
        keyDeliverables: ["Hurdle Analysis", "Tipping Point Plan", "Pilot Market Plan", "Execution Roadmap"],
        gates: [{ name: "Pilot launched", criteria: "Blue ocean strategy piloted in selected market segment.", order: 1 }],
      },
    ],
  },

  {
    name: "Balanced Scorecard",
    slug: "balanced-scorecard",
    description:
      "The Balanced Scorecard (Kaplan & Norton) translates strategy into measurable performance across four perspectives: Financial, Customer, Internal Process, and Learning & Growth. Ensures organisations do not focus solely on financial metrics and creates a line of sight from individual activities to strategic goals.",
    category: "Organisational Analysis",
    serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
    estimatedWeeks: 8,
    sortOrder: 72,
    phases: [
      {
        name: "Strategy Clarification",
        description: "Clarify and validate the organisation's strategy as the foundation for the scorecard.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Strategy review sessions", "Mission/vision/values alignment", "Strategic theme identification", "Strategy map development"],
        keyDeliverables: ["Strategy Map", "Strategic Themes", "Mission/Vision/Values Statement"],
        gates: [{ name: "Strategy map approved", criteria: "Senior leadership aligned on strategy map and strategic themes.", order: 1 }],
      },
      {
        name: "Scorecard Design",
        description: "Develop strategic objectives, KPIs, targets, and initiatives across all four perspectives.",
        order: 2, typicalWeeks: 3,
        keyActivities: ["Strategic objectives definition (per perspective)", "KPI selection (2-3 per objective)", "Baseline data collection", "Target setting", "Initiative identification"],
        keyDeliverables: ["Balanced Scorecard", "KPI Dictionary", "Target Setting Document", "Initiative List"],
        gates: [{ name: "Scorecard approved", criteria: "All four perspectives have strategic objectives, KPIs, and targets approved.", order: 1 }],
      },
      {
        name: "Data Systems & Reporting",
        description: "Set up data collection, reporting cadence, and dashboards.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Data owner assignment", "Data collection process design", "Dashboard development", "Reporting calendar"],
        keyDeliverables: ["KPI Data Collection Plan", "Scorecard Dashboard", "Reporting Calendar"],
        gates: [],
      },
      {
        name: "Cascade & Embed",
        description: "Cascade the scorecard to departments and embed in management reviews.",
        order: 4, typicalWeeks: 1,
        keyActivities: ["Departmental scorecard development", "Performance review cycle integration", "Staff communication", "Training"],
        keyDeliverables: ["Departmental Scorecards", "Performance Review Process", "Communication Plan"],
        gates: [{ name: "First performance review completed", criteria: "First quarterly performance review using Balanced Scorecard completed.", order: 1 }],
      },
    ],
  },

  // ─── FEASIBILITY STUDIES ─────────────────────────────────────────────────────

  {
    name: "Comprehensive Feasibility Study",
    slug: "comprehensive-feasibility-study",
    description:
      "A full feasibility study assesses the viability of a proposed project or investment across six dimensions: Market, Technical, Financial, Operational, Legal/Regulatory, and Schedule. Answers: Should we proceed? Produces a go/no-go recommendation with supporting evidence. Standard for new hospitals, clinics, and major capital projects.",
    category: "Feasibility & Investment",
    serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
    estimatedWeeks: 14,
    sortOrder: 73,
    phases: [
      {
        name: "Preliminary Analysis",
        description: "Quick sanity check to decide whether to proceed to full feasibility study.",
        order: 1, typicalWeeks: 2,
        keyActivities: ["Concept scoping", "Preliminary market research", "Desk review of regulatory environment", "Rough financial estimate", "Preliminary risk assessment"],
        keyDeliverables: ["Concept Brief", "Preliminary Market Analysis", "Rough Financial Estimate", "Go/No-Go Decision"],
        gates: [{ name: "Proceed to full feasibility", criteria: "Preliminary analysis shows sufficient market opportunity and no fatal flaws.", order: 1 }],
      },
      {
        name: "Market Feasibility",
        description: "Assess demand, competitive landscape, and market entry strategy.",
        order: 2, typicalWeeks: 3,
        keyActivities: ["TAM/SAM/SOM estimation", "Demand analysis (demographics, epidemiology, health utilisation data)", "Competitive analysis (Porter's Five Forces)", "SWOT analysis", "Patient/customer segmentation", "Willingness-to-pay research"],
        keyDeliverables: ["Market Sizing Report", "Demand Analysis", "Competitive Landscape", "SWOT Analysis", "Market Entry Strategy"],
        gates: [],
      },
      {
        name: "Technical Feasibility",
        description: "Assess whether the project can be technically delivered.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Site assessment (land, utilities, access)", "Technical specifications", "Equipment requirements", "Build vs buy vs partner analysis", "Technology landscape review"],
        keyDeliverables: ["Technical Specification", "Site Assessment Report", "Equipment List", "Build/Buy/Partner Recommendation"],
        gates: [],
      },
      {
        name: "Financial Feasibility",
        description: "Build the financial model and assess viability and returns.",
        order: 4, typicalWeeks: 3,
        keyActivities: ["CapEx estimation", "OpEx modelling", "Revenue projections (patient volume × average revenue)", "P&L, cash flow, and balance sheet projections (5-10 years)", "Break-even analysis", "NPV, IRR, payback period calculation", "Sensitivity analysis"],
        keyDeliverables: ["Financial Model (Excel)", "5-Year P&L Projection", "Cash Flow Forecast", "Break-Even Analysis", "NPV/IRR/Payback Summary", "Sensitivity Analysis"],
        gates: [{ name: "Financial model reviewed", criteria: "Financial model reviewed by independent finance expert.", order: 1 }],
      },
      {
        name: "Operational & Legal Feasibility",
        description: "Assess operational delivery capacity and regulatory requirements.",
        order: 5, typicalWeeks: 2,
        keyActivities: ["Operations plan development", "Staffing plan and recruitment assessment", "Regulatory requirements mapping (licences, permits, accreditation)", "Legal structure recommendation", "IP considerations"],
        keyDeliverables: ["Operations Plan", "Staffing Plan", "Regulatory Requirements Checklist", "Legal Structure Recommendation", "Compliance Roadmap"],
        gates: [],
      },
      {
        name: "Feasibility Report & Recommendation",
        description: "Synthesise all findings into a comprehensive feasibility report with a clear go/no-go recommendation.",
        order: 6, typicalWeeks: 2,
        keyActivities: ["Cross-dimension synthesis", "Risk register development", "Recommendation development", "Report writing", "Executive presentation"],
        keyDeliverables: ["Full Feasibility Report", "Risk Register", "Go/No-Go Recommendation", "Executive Summary", "Investor-Ready Presentation"],
        gates: [{ name: "Feasibility report approved", criteria: "Client has reviewed and accepted the feasibility report and recommendation.", order: 1 }],
      },
    ],
  },

  {
    name: "Hospital Development Feasibility",
    slug: "hospital-development-feasibility",
    description:
      "Specialist feasibility framework for new hospital or clinic development projects. Combines healthcare-specific demand modelling (catchment population, disease burden, utilisation rates), clinical service planning, HealthTech infrastructure, staffing models, and African regulatory context (NHIS, State Hospital Management Boards, Federal MOH).",
    category: "Feasibility & Investment",
    serviceTypes: ["HOSPITAL_OPERATIONS"],
    estimatedWeeks: 16,
    sortOrder: 74,
    phases: [
      {
        name: "Catchment Area & Demand Analysis",
        description: "Analyse the catchment population, disease burden, and projected healthcare utilisation.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Catchment area definition (drive-time analysis)", "Population census data analysis", "Disease burden and epidemiological profile", "Healthcare utilisation rate modelling", "Competitive mapping (existing facilities)", "Unmet demand estimation"],
        keyDeliverables: ["Catchment Area Report", "Disease Burden Profile", "Demand Model", "Utilisation Rate Analysis", "Competitive Map"],
        gates: [],
      },
      {
        name: "Clinical Service Planning",
        description: "Define the service mix and capacity required to meet projected demand.",
        order: 2, typicalWeeks: 2,
        keyActivities: ["Service line selection", "Bed count and mix determination", "OPD capacity planning", "Theatre, ICU, lab, pharmacy capacity modelling", "Clinical staffing model", "Referral network design"],
        keyDeliverables: ["Clinical Service Plan", "Facility Capacity Model", "Clinical Staffing Plan", "Referral Network Map"],
        gates: [{ name: "Clinical plan validated", criteria: "Clinical service plan reviewed by at least one clinical advisor.", order: 1 }],
      },
      {
        name: "Facility Design & Infrastructure",
        description: "Develop the facility programme, space requirements, and infrastructure needs.",
        order: 3, typicalWeeks: 2,
        keyActivities: ["Architectural brief", "Room and space schedule", "Utilities assessment (power, water, waste)", "Medical gas systems", "ICT and EMR infrastructure planning"],
        keyDeliverables: ["Facility Programme", "Space Schedule", "Infrastructure Requirements", "Design Brief"],
        gates: [],
      },
      {
        name: "Financial Modelling",
        description: "Build detailed hospital-specific financial projections.",
        order: 4, typicalWeeks: 3,
        keyActivities: ["CapEx estimation (land, construction, equipment)", "Revenue modelling by service line (outpatient, inpatient, theatre, lab)", "Payer mix analysis (self-pay, HMO, NHIS, corporate)", "Operating cost modelling", "Ramp-up projections (Years 1-5)", "Sensitivity analysis (occupancy rate, payer mix)"],
        keyDeliverables: ["Hospital Financial Model", "Revenue Projections by Service Line", "Payer Mix Analysis", "CapEx Budget", "Sensitivity Analysis"],
        gates: [{ name: "Financial model peer reviewed", criteria: "Model reviewed by independent healthcare finance expert.", order: 1 }],
      },
      {
        name: "Regulatory & Accreditation Pathway",
        description: "Map all regulatory requirements and develop the accreditation pathway.",
        order: 5, typicalWeeks: 2,
        keyActivities: ["State and federal licensing requirements", "NHIS accreditation process", "Environmental Impact Assessment (EIA)", "JCI/COHSASA accreditation pathway (if applicable)", "Land title and planning permissions"],
        keyDeliverables: ["Regulatory Requirements Matrix", "Licensing Checklist", "Accreditation Pathway", "Timeline for Approvals"],
        gates: [],
      },
      {
        name: "Feasibility Report & Investment Memorandum",
        description: "Produce the final feasibility report and investor-ready documentation.",
        order: 6, typicalWeeks: 4,
        keyActivities: ["Full report synthesis", "Risk register (clinical, financial, regulatory, operational)", "Investment memorandum preparation", "Executive presentation", "Q&A preparation for investor due diligence"],
        keyDeliverables: ["Hospital Feasibility Report", "Risk Register", "Investment Memorandum", "Executive Summary", "Due Diligence Package"],
        gates: [{ name: "Feasibility report and investment memo approved", criteria: "Approved by client; ready for investor/board presentation.", order: 1 }],
      },
    ],
  },

  {
    name: "PPP Feasibility & Structuring",
    slug: "ppp-feasibility-structuring",
    description:
      "Public-Private Partnership (PPP) feasibility and structuring methodology for healthcare infrastructure projects. Covers Value for Money analysis, risk transfer framework, PPP contract structures (Build-Operate-Transfer, DBFOM, concession), government output specifications, and affordability assessment for African health systems.",
    category: "Feasibility & Investment",
    serviceTypes: ["HEALTH_SYSTEMS"],
    estimatedWeeks: 20,
    sortOrder: 75,
    phases: [
      {
        name: "Project Identification & Appraisal",
        description: "Identify and appraise the project for PPP suitability.",
        order: 1, typicalWeeks: 3,
        keyActivities: ["Project concept development", "Public Sector Comparator (PSC) development", "PPP Value for Money screening", "Stakeholder mapping", "Political feasibility assessment"],
        keyDeliverables: ["Project Concept Note", "Public Sector Comparator", "PPP Suitability Screening", "Stakeholder Map"],
        gates: [{ name: "PPP suitability confirmed", criteria: "VfM screening and stakeholder analysis confirm PPP is preferred delivery model.", order: 1 }],
      },
      {
        name: "Risk Identification & Allocation",
        description: "Identify, quantify, and optimally allocate risks between public and private partners.",
        order: 2, typicalWeeks: 3,
        keyActivities: ["Risk identification workshop", "Risk quantification (Monte Carlo)", "Risk allocation matrix development", "Risk pricing and mitigation strategies"],
        keyDeliverables: ["Risk Register", "Risk Allocation Matrix", "Risk Pricing Model", "Mitigation Plan"],
        gates: [],
      },
      {
        name: "Financial Structuring",
        description: "Develop the financial structure for the PPP including project finance model.",
        order: 3, typicalWeeks: 4,
        keyActivities: ["Project finance model development", "Debt/equity structure", "Government support instruments (viability gap funding, guarantees)", "Tariff/payment mechanism design", "Sensitivity and scenario analysis"],
        keyDeliverables: ["PPP Financial Model", "Funding Structure", "Payment Mechanism Design", "Government Support Structure", "Sensitivity Analysis"],
        gates: [{ name: "Financial structure approved", criteria: "Government and potential private investors confirm financial structure is viable.", order: 1 }],
      },
      {
        name: "Output Specification & Contract Design",
        description: "Develop the output specification and key PPP contract terms.",
        order: 4, typicalWeeks: 4,
        keyActivities: ["Output specification development (services, standards)", "Key Performance Indicators", "Payment deduction mechanism", "Contract structure selection (BOT, DBFOM, concession)", "Affordability assessment"],
        keyDeliverables: ["Output Specification", "KPI Framework", "Payment Mechanism", "Draft Contract Terms", "Affordability Assessment"],
        gates: [],
      },
      {
        name: "Procurement & Tender",
        description: "Run the competitive tender process to select the private partner.",
        order: 5, typicalWeeks: 6,
        keyActivities: ["Procurement strategy", "Request for Qualifications (RFQ)", "Request for Proposals (RFP)", "Bid evaluation", "Best and Final Offer (BAFO)", "Contract negotiations"],
        keyDeliverables: ["Procurement Documents (RFQ, RFP)", "Evaluation Criteria", "Bid Evaluation Report", "Negotiated Contract"],
        gates: [{ name: "Preferred bidder selected", criteria: "Best and final offer evaluated; preferred bidder selected and announced.", order: 1 }],
      },
    ],
  },
];

async function main() {
  console.log("Seeding methodology expansion (Public Health, Health Economics, Tech, MBB, Feasibility)...\n");

  for (const m of methodologies) {
    const { phases, ...methodologyData } = m;

    const exists = await prisma.methodologyTemplate.findUnique({ where: { slug: m.slug } });
    if (exists) {
      console.log(`  Skipping (exists): ${m.name}`);
      continue;
    }

    const clean = methodologyData.serviceTypes.filter((s): s is string => typeof s === "string");

    const created = await prisma.methodologyTemplate.create({
      data: {
        ...methodologyData,
        serviceTypes: clean,
        phases: {
          create: phases.map(({ gates, ...p }) => ({
            ...p,
            gates: { create: gates },
          })),
        },
      },
    });
    console.log(`  Created [${created.category}]: ${created.name}`);
  }

  const total = await prisma.methodologyTemplate.count();
  console.log(`\nDone. Total methodologies in library: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
