import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding expanded methodology & framework library...");

  // ─── NEW METHODOLOGY TEMPLATES ─────────────────────────────────────────────

  const methodologies = [
    // ── PUBLIC HEALTH & M&E ──────────────────────────────────────────────────
    {
      name: "Logframe & Results-Based M&E",
      slug: "logframe-rme",
      description:
        "The Logical Framework Approach (Logframe) is the gold standard for designing, monitoring, and evaluating public health programs. Links inputs → activities → outputs → outcomes → impact in a causal chain. Enables results-based management and demonstrates accountability to donors and stakeholders. Used across USAID, World Bank, DFID, and Gates Foundation-funded programs.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 24,
      sortOrder: 8,
      phases: [
        {
          name: "Problem Analysis & Needs Assessment",
          description:
            "Understand the root causes and effects of the problem, identify stakeholders, and quantify needs before designing the intervention.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Desk review of secondary data",
            "Key informant interviews with stakeholders",
            "Problem tree analysis (causes and effects)",
            "Stakeholder analysis (influence and interest)",
            "Needs assessment fieldwork",
            "Situation analysis compilation",
          ],
          keyDeliverables: [
            "Situation Analysis Report",
            "Problem Tree diagram",
            "Stakeholder Analysis matrix",
            "Needs Assessment Report",
          ],
          gates: [
            {
              name: "Needs assessment findings agreed by all partners",
              criteria:
                "All implementing partners and donor have reviewed the needs assessment findings and agreed on the priority problems to address.",
              order: 1,
            },
          ],
        },
        {
          name: "Logframe & Theory of Change Development",
          description:
            "Translate the problem analysis into a structured logical framework matrix defining the goal, purpose, outputs, activities, indicators, means of verification, and assumptions.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Theory of Change workshop with stakeholders",
            "Objective tree development (turning problem tree positive)",
            "Logframe matrix completion (4×4 structure)",
            "SMART indicator development",
            "Means of verification specification",
            "Assumptions and risks documentation",
          ],
          keyDeliverables: [
            "Theory of Change diagram with narrative",
            "Logframe Matrix (Goal / Purpose / Outputs / Activities)",
            "Indicator Reference Sheets (one per indicator)",
          ],
          gates: [
            {
              name: "Logframe validated by donor",
              criteria:
                "Donor has reviewed and approved the logframe including all indicators, targets, and assumptions. Baseline values confirmed or baseline study commissioned.",
              order: 1,
            },
          ],
        },
        {
          name: "M&E Plan Design",
          description:
            "Design the full monitoring and evaluation system covering data collection, reporting, analysis, and learning. Align with donor reporting requirements.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "M&E plan development (methods, frequency, responsibility)",
            "Data collection tool design (surveys, registers, checklists)",
            "M&E database/platform setup",
            "M&E roles and responsibilities assignment",
            "M&E budget development",
            "Data quality assurance procedures",
          ],
          keyDeliverables: [
            "Comprehensive M&E Plan",
            "Data Collection Tools",
            "M&E Budget",
            "M&E RACI matrix",
          ],
          gates: [],
        },
        {
          name: "Implementation Monitoring",
          description:
            "Continuously track program progress against the logframe indicators. Identify implementation bottlenecks early and support adaptive management.",
          order: 4,
          typicalWeeks: 12,
          keyActivities: [
            "Routine data collection at facility/community level",
            "Monthly data quality checks",
            "Quarterly progress reporting",
            "Dashboard maintenance and updates",
            "Site supervision and data verification visits",
            "Adaptive management discussions with program team",
          ],
          keyDeliverables: [
            "Quarterly Monitoring Reports",
            "Progress Dashboard",
            "Data Quality Assessment Reports",
            "Adaptive Management Log",
          ],
          gates: [
            {
              name: "Mid-term review milestones on track",
              criteria:
                "At least 70% of output-level indicators are on track at mid-program. Any off-track indicators have documented corrective action plans.",
              order: 1,
            },
          ],
        },
        {
          name: "Evaluation",
          description:
            "Conduct midterm and/or endline evaluations to assess effectiveness, efficiency, relevance, sustainability, and impact of the program.",
          order: 5,
          typicalWeeks: 8,
          keyActivities: [
            "Evaluation terms of reference development",
            "Evaluator procurement (internal or external)",
            "Endline data collection (survey, interviews, FGDs)",
            "Data analysis (quantitative and qualitative)",
            "Findings validation workshop with stakeholders",
            "Dissemination of results",
          ],
          keyDeliverables: [
            "Evaluation Report (midterm and/or endline)",
            "Lessons Learned Summary",
            "Recommendations Matrix",
            "Policy Brief",
          ],
          gates: [
            {
              name: "Evaluation report accepted by donor",
              criteria:
                "Donor has reviewed and accepted the final evaluation report. All factual corrections incorporated. Dissemination plan in place.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Impact Evaluation Framework",
      slug: "impact-evaluation",
      description:
        "Rigorous causal assessment of a program's impact using experimental (RCT) or quasi-experimental designs. Answers 'Did this program work?' and 'By how much?' using counterfactual methods. Gold standard for evidence-based policy in global health. Used by J-PAL, IPA, and major development finance institutions.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 52,
      sortOrder: 9,
      phases: [
        {
          name: "Evaluation Design",
          description:
            "Select the most rigorous feasible design (RCT, difference-in-differences, regression discontinuity, or propensity score matching). Power calculations determine required sample size.",
          order: 1,
          typicalWeeks: 6,
          keyActivities: [
            "Theory of change development",
            "Evaluation design selection (RCT vs quasi-experimental)",
            "Power calculations (sample size determination)",
            "Randomization strategy (if RCT)",
            "Data collection instrument development",
            "IRB / ethics committee application",
            "Pre-registration on AEA or ISRCTN registry",
          ],
          keyDeliverables: [
            "Evaluation Protocol",
            "Power Calculations Report",
            "Data Collection Plan",
            "Ethics Approval Certificate",
            "Pre-Analysis Plan (PAP)",
          ],
          gates: [
            {
              name: "Ethics approval obtained and design finalized",
              criteria:
                "Ethics committee approval received. Design finalized and pre-registered. Sample size sufficient for 80% power at minimum detectable effect size.",
              order: 1,
            },
          ],
        },
        {
          name: "Baseline Data Collection",
          description:
            "Collect pre-intervention data on treatment and control groups to establish baseline levels of key outcomes and test for balance.",
          order: 2,
          typicalWeeks: 10,
          keyActivities: [
            "Sampling frame construction",
            "Enumerator recruitment and training",
            "Baseline survey fieldwork",
            "Data cleaning and validation",
            "Balance tests (treatment vs control groups)",
            "Attrition risk mitigation plan",
          ],
          keyDeliverables: [
            "Baseline Survey Dataset",
            "Data Quality Verification Report",
            "Balance Test Results",
            "Baseline Descriptive Statistics Report",
          ],
          gates: [
            {
              name: "Baseline balance confirmed",
              criteria:
                "Balance tests confirm treatment and control groups are statistically equivalent at baseline on key outcome and covariate variables. Data quality satisfactory.",
              order: 1,
            },
          ],
        },
        {
          name: "Program Implementation",
          description:
            "Monitor program rollout to ensure treatment integrity and document implementation fidelity. Track contamination risks.",
          order: 3,
          typicalWeeks: 26,
          keyActivities: [
            "Implementation monitoring and fidelity checks",
            "Treatment dose tracking (who received what)",
            "Contamination monitoring (control group exposure)",
            "Qualitative process documentation",
            "Midline data collection (if applicable)",
          ],
          keyDeliverables: [
            "Implementation Monitoring Reports",
            "Fidelity Assessment Report",
            "Midline Data (if applicable)",
          ],
          gates: [],
        },
        {
          name: "Endline Data Collection",
          description:
            "Collect post-intervention outcome data following the same protocols as baseline to enable valid comparison.",
          order: 4,
          typicalWeeks: 10,
          keyActivities: [
            "Endline survey fieldwork",
            "Data cleaning and validation",
            "Attrition analysis (who was lost to follow-up)",
            "Comparison with baseline data",
          ],
          keyDeliverables: [
            "Endline Survey Dataset",
            "Attrition Analysis Report",
            "Matched Baseline-Endline Dataset",
          ],
          gates: [],
        },
        {
          name: "Analysis & Reporting",
          description:
            "Estimate causal treatment effects. Conduct heterogeneity and cost-effectiveness analyses. Disseminate findings to policy and academic audiences.",
          order: 5,
          typicalWeeks: 10,
          keyActivities: [
            "Intent-to-Treat (ITT) analysis",
            "Treatment-on-the-Treated (TOT) analysis (if applicable)",
            "Subgroup / heterogeneity analysis",
            "Cost-effectiveness analysis",
            "Findings validation workshop",
            "Policy brief writing",
            "Academic manuscript preparation",
          ],
          keyDeliverables: [
            "Impact Evaluation Report",
            "Policy Brief",
            "Data and Code Repository (replication package)",
            "Academic Paper (if applicable)",
          ],
          gates: [
            {
              name: "Findings validated and disseminated",
              criteria:
                "Impact findings validated through stakeholder workshop. Policy brief circulated to government and donor counterparts. Data deposited in public repository.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Theory of Change Development",
      slug: "theory-of-change",
      description:
        "A participatory process for articulating how and why a program will achieve its intended impact. Maps the causal pathways from activities to outcomes to ultimate goal, making assumptions explicit. Essential for program design, M&E framework development, and donor accountability. Best practice for USAID, DFID, Gates Foundation, and UN-funded programs.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 6,
      sortOrder: 10,
      phases: [
        {
          name: "Context & Evidence Review",
          description:
            "Review existing evidence on what works for the problem. Analyse the local context that will shape how the theory operates.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Literature review of evidence on effective interventions",
            "Context analysis (political, social, economic factors)",
            "Stakeholder interviews (beneficiaries, implementers, policymakers)",
            "Review of similar programs and their theories",
            "Problem and root cause analysis",
          ],
          keyDeliverables: [
            "Evidence Review Summary",
            "Context Analysis",
            "Problem Analysis",
          ],
          gates: [],
        },
        {
          name: "ToC Workshop & Drafting",
          description:
            "Facilitate a participatory workshop to co-create the theory of change. Map the causal chain from activities to long-term impact.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: [
            "Multi-stakeholder ToC workshop (1-2 days)",
            "Backcasting from desired impact",
            "Causal pathway mapping (activities → outputs → outcomes → impact)",
            "Identifying preconditions for change",
            "Documenting assumptions at each step",
            "Initial ToC diagram drafting",
          ],
          keyDeliverables: [
            "Draft Theory of Change Diagram",
            "Draft ToC Narrative",
            "Assumptions Register",
          ],
          gates: [
            {
              name: "Stakeholder consensus on causal logic",
              criteria:
                "Workshop participants representing program team, beneficiaries, and donor have agreed on the causal pathway and documented assumptions.",
              order: 1,
            },
          ],
        },
        {
          name: "Testing & Refinement",
          description:
            "Critically examine the theory for logical gaps, weak assumptions, and untested causal claims. Revise based on stakeholder feedback.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Internal review for logical consistency",
            "External expert review",
            "Peer critique workshop ('red teaming' the theory)",
            "Identification of weakest assumptions requiring M&E attention",
            "Alignment with logframe or results framework",
          ],
          keyDeliverables: [
            "Revised Theory of Change Diagram",
            "Revised ToC Narrative",
            "Prioritised Assumption Testing Plan",
          ],
          gates: [],
        },
        {
          name: "Finalisation & Embedding",
          description:
            "Produce final ToC documentation, connect it to the M&E framework, and embed it in program governance as a living document.",
          order: 4,
          typicalWeeks: 1,
          keyActivities: [
            "Final ToC document production (diagram + full narrative)",
            "Integration with logframe or results framework",
            "M&E indicator alignment with causal pathway",
            "Staff orientation on the theory of change",
            "ToC review schedule established",
          ],
          keyDeliverables: [
            "Final Theory of Change Document",
            "ToC-linked Indicator Framework",
            "ToC Review Schedule",
          ],
          gates: [
            {
              name: "ToC approved by program leadership and donor",
              criteria:
                "Final ToC document approved by program director and donor focal point. Integrated into M&E framework and program design documentation.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "RE-AIM Implementation Framework",
      slug: "re-aim",
      description:
        "The RE-AIM framework evaluates and plans for the real-world implementation and sustainability of health interventions across five dimensions: Reach, Effectiveness, Adoption, Implementation, and Maintenance. Widely used to assess whether evidence-based interventions can be scaled in health systems. Developed by Glasgow et al. at CDC.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH"],
      estimatedWeeks: 18,
      sortOrder: 11,
      phases: [
        {
          name: "Reach Assessment",
          description:
            "Assess who the intervention reaches and whether it reaches the intended target population equitably.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Define target population and eligibility criteria",
            "Participation rate measurement",
            "Representativeness analysis (who is NOT reached?)",
            "Equity analysis (gender, age, geography, socioeconomic status)",
            "Barriers to participation identification",
          ],
          keyDeliverables: [
            "Reach Assessment Report",
            "Participation Rate Data",
            "Equity Analysis",
            "Non-participation Barrier Analysis",
          ],
          gates: [],
        },
        {
          name: "Effectiveness Evaluation",
          description:
            "Measure the intervention's impact on intended outcomes AND unintended consequences in real-world settings.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Primary outcome measurement",
            "Secondary and quality of life outcome measurement",
            "Subgroup effectiveness analysis",
            "Unintended consequences assessment",
            "Cost data collection",
          ],
          keyDeliverables: [
            "Effectiveness Evidence Summary",
            "Subgroup Analysis Results",
            "Unintended Consequences Report",
            "Cost-Effectiveness Estimate",
          ],
          gates: [
            {
              name: "Effectiveness evidence sufficient for adoption decision",
              criteria:
                "Primary outcomes show statistically and clinically significant improvement. Evidence sufficient to make an informed adoption decision.",
              order: 1,
            },
          ],
        },
        {
          name: "Adoption Planning",
          description:
            "Assess and support the willingness of organizations and staff to adopt and deliver the intervention.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Stakeholder and champion identification",
            "Organizational readiness assessment",
            "Leadership engagement strategy",
            "Resource and capacity mapping",
            "Policy and governance alignment",
          ],
          keyDeliverables: [
            "Adoption Readiness Assessment",
            "Stakeholder Engagement Plan",
            "Resource Requirements Analysis",
          ],
          gates: [],
        },
        {
          name: "Implementation Support",
          description:
            "Monitor and support consistent delivery of the intervention as designed. Adapt as needed while preserving core components.",
          order: 4,
          typicalWeeks: 6,
          keyActivities: [
            "Fidelity monitoring (is it being delivered as designed?)",
            "Staff training and quality assurance",
            "Adaptation documentation (adaptations that don't compromise core)",
            "Implementation cost tracking",
            "Troubleshooting and problem solving",
          ],
          keyDeliverables: [
            "Fidelity Monitoring Reports",
            "Adaptation Log",
            "Implementation Cost Report",
            "Training and Competency Records",
          ],
          gates: [
            {
              name: "Fidelity above acceptable threshold",
              criteria:
                "Implementation fidelity at or above 80% of core components delivered as intended across all implementation sites.",
              order: 1,
            },
          ],
        },
        {
          name: "Maintenance & Sustainability",
          description:
            "Plan and monitor the long-term integration of the intervention into routine practice beyond the initial program period.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "Sustainability assessment (funding, capacity, culture)",
            "Integration into routine systems and workflows",
            "Staff handover and capacity building for sustainability",
            "Long-term outcome monitoring plan",
            "Scale-up plan development",
          ],
          keyDeliverables: [
            "Sustainability Assessment",
            "Maintenance and Monitoring Plan",
            "Scale-up Readiness Report",
          ],
          gates: [
            {
              name: "Sustainability plan endorsed by implementing organization",
              criteria:
                "Host organization leadership has committed to maintaining the intervention with defined resources. Long-term outcome monitoring in place.",
              order: 1,
            },
          ],
        },
      ],
    },

    // ── HEALTH ECONOMICS ─────────────────────────────────────────────────────
    {
      name: "Cost-Effectiveness Analysis",
      slug: "cost-effectiveness-analysis",
      description:
        "CEA compares costs and health outcomes of alternative interventions, expressing results as cost per unit of health gained (e.g., cost per QALY or DALY averted). Helps decision-makers allocate limited health budgets to maximise population health impact. Standard method for health technology assessment (HTA) at WHO, NICE, and national HTA agencies.",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 20,
      sortOrder: 12,
      phases: [
        {
          name: "Define Research Question & Scope",
          description:
            "Establish the comparators, perspective, time horizon, and target population for the analysis. Align with decision-maker requirements.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Decision problem scoping with commissioners",
            "Comparator selection (relevant alternatives)",
            "Analysis perspective determination (payer, health system, societal)",
            "Time horizon selection (short-term vs lifetime)",
            "Target population definition",
            "Protocol development",
          ],
          keyDeliverables: [
            "CEA Research Protocol",
            "Comparators Defined",
            "Analysis Scope Document",
          ],
          gates: [
            {
              name: "Scope agreed with decision-maker",
              criteria:
                "Commissioner or funder has agreed on the scope, comparators, and perspective. Protocol registered or shared in advance.",
              order: 1,
            },
          ],
        },
        {
          name: "Model Structure Development",
          description:
            "Select and build the appropriate decision-analytic model (decision tree for acute conditions, Markov model for chronic conditions).",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Clinical pathway mapping",
            "Model type selection (decision tree vs Markov vs microsimulation)",
            "Model structure building",
            "Model validation (face validity with clinicians)",
            "Health states definition (for Markov models)",
            "Assumptions documentation",
          ],
          keyDeliverables: [
            "Decision-Analytic Model (Excel / R / TreeAge)",
            "Model Structure Diagram",
            "Assumptions Register",
          ],
          gates: [],
        },
        {
          name: "Parameter Estimation",
          description:
            "Identify and populate all model parameters: clinical effectiveness, costs, utility weights, and transition probabilities from the best available evidence.",
          order: 3,
          typicalWeeks: 6,
          keyActivities: [
            "Systematic literature review (clinical effectiveness)",
            "Meta-analysis (if multiple studies available)",
            "Local cost data collection (direct medical costs, administration)",
            "Utility weight identification (EQ-5D, SF-6D studies)",
            "Transition probability estimation from epidemiological data",
            "Expert elicitation (where data gaps exist)",
          ],
          keyDeliverables: [
            "Evidence Tables (costs, effects, utilities)",
            "Parameter Summary Table with sources",
            "Populated Model",
          ],
          gates: [],
        },
        {
          name: "Base Case Analysis",
          description:
            "Run the primary analysis using best-estimate parameter values. Calculate the ICER and present on the cost-effectiveness plane.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Base case model run",
            "ICER calculation (incremental cost / incremental effect)",
            "Cost-effectiveness plane plotting",
            "Incremental analysis table production",
            "Results interpretation against threshold (e.g., WHO 1-3× GDP/capita)",
          ],
          keyDeliverables: [
            "Base Case ICER",
            "Cost-Effectiveness Plane",
            "Incremental Analysis Table",
          ],
          gates: [],
        },
        {
          name: "Sensitivity & Uncertainty Analysis",
          description:
            "Test the robustness of the base case results under different assumptions and parameter values.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "One-way sensitivity analysis (vary each parameter ±20%)",
            "Multi-way sensitivity analysis (key combinations)",
            "Probabilistic sensitivity analysis (Monte Carlo simulation, 10,000 iterations)",
            "Scenario analysis (optimistic/pessimistic)",
            "Tornado diagram production (key drivers of uncertainty)",
            "Cost-Effectiveness Acceptability Curve (CEAC) generation",
          ],
          keyDeliverables: [
            "Tornado Diagram",
            "PSA Scatter Plot on CE Plane",
            "Cost-Effectiveness Acceptability Curve (CEAC)",
            "Scenario Analysis Results",
          ],
          gates: [],
        },
        {
          name: "Reporting & Dissemination",
          description:
            "Produce the full technical report and decision-maker summary. Submit for peer review if academic publication planned.",
          order: 6,
          typicalWeeks: 2,
          keyActivities: [
            "Full technical CEA report writing (CHEERS checklist compliant)",
            "Policy brief for decision-makers",
            "Results presentation to HTA committee or funder",
            "Journal manuscript preparation (if applicable)",
            "Model sharing for validation (open-access data where possible)",
          ],
          keyDeliverables: [
            "Full CEA Technical Report",
            "Policy Brief (1-2 pages)",
            "Presentation Deck",
            "Peer-Reviewed Publication (if applicable)",
          ],
          gates: [
            {
              name: "Decision-maker presentation accepted",
              criteria:
                "HTA committee, funder, or national health authority has received and acknowledged the CEA findings. Reimbursement or adoption decision process initiated.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Cost-Benefit Analysis",
      slug: "cost-benefit-analysis",
      description:
        "CBA compares the costs and benefits of a health intervention with BOTH expressed in monetary terms. Enables comparison across sectors (health vs education vs infrastructure). Returns Benefit-Cost Ratio (BCR) and Net Present Value (NPV). The standard method for infrastructure projects, national health programs, and cross-sector investment prioritisation.",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS"],
      estimatedWeeks: 16,
      sortOrder: 13,
      phases: [
        {
          name: "Scope & Perspective",
          description:
            "Define the intervention, comparator, societal perspective, time horizon, and discount rate. Identify all cost and benefit categories to include.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Stakeholder consultations on scope",
            "Comparator selection",
            "Cost and benefit category identification",
            "Discount rate selection (government borrowing rate typically)",
            "Protocol development",
          ],
          keyDeliverables: [
            "CBA Protocol",
            "Cost and Benefit Category List",
            "Scope and Perspective Document",
          ],
          gates: [],
        },
        {
          name: "Cost Estimation",
          description:
            "Estimate all costs over the time horizon, including capital, operating, and opportunity costs.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Capital cost estimation (infrastructure, equipment)",
            "Operating cost estimation (staff, supplies, overhead)",
            "Opportunity costs identification",
            "Training and implementation costs",
            "Discounting of future costs to present value",
          ],
          keyDeliverables: [
            "Detailed Cost Table (NPV)",
            "Cost Data Sources",
          ],
          gates: [],
        },
        {
          name: "Benefit Monetisation",
          description:
            "Convert all health and non-health benefits into monetary values using established shadow pricing methods.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Health outcomes quantification (lives saved, DALYs averted)",
            "Value of Statistical Life (VSL) application (government or WTP estimates)",
            "Productivity gains estimation (averted work days lost)",
            "Education gains (averted school days missed)",
            "Household cost savings (reduced out-of-pocket expenditure)",
            "Discounting of future benefits to present value",
          ],
          keyDeliverables: [
            "Benefit Monetisation Table",
            "VSL Source and Justification",
            "Total Benefits (NPV)",
          ],
          gates: [
            {
              name: "Monetisation methodology validated",
              criteria:
                "Shadow pricing methods reviewed and accepted by commissioners. Sensitivity of results to VSL assumptions documented.",
              order: 1,
            },
          ],
        },
        {
          name: "CBA Calculation & Reporting",
          description:
            "Compute BCR, NPV, and IRR. Test sensitivity. Present findings with clear policy recommendations.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "BCR calculation (Total Benefits NPV / Total Costs NPV)",
            "NPV calculation (Benefits NPV - Costs NPV)",
            "IRR calculation",
            "Distributional impact analysis (who pays, who benefits?)",
            "Sensitivity analysis (particularly on VSL and discount rate)",
            "Report and policy brief writing",
          ],
          keyDeliverables: [
            "CBA Report",
            "BCR, NPV, and IRR Summary Table",
            "Distributional Impact Analysis",
            "Policy Brief",
          ],
          gates: [
            {
              name: "CBA findings accepted by decision-maker",
              criteria:
                "Government or funder decision-maker has accepted the CBA findings. Investment decision process initiated.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Budget Impact Analysis",
      slug: "budget-impact-analysis",
      description:
        "BIA estimates the financial consequences for a specific budget holder (health system, HMO, NHIS) of adopting a new health technology or program. Answers 'Can we afford this?' over a 1-5 year horizon. Complements CEA by shifting from 'Is this good value?' to 'What is the cost to our budget?'. Essential for pharmaceutical reimbursement and technology coverage decisions.",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS"],
      estimatedWeeks: 8,
      sortOrder: 14,
      phases: [
        {
          name: "Define Scope & Budget Holder",
          description:
            "Identify the payer perspective, eligible population, comparators, and time horizon for the analysis.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Budget holder identification (NHIS, HMO, hospital, etc.)",
            "Time horizon selection (typically 3-5 years)",
            "Eligible population definition",
            "Current treatment mix (market share of comparators)",
            "Protocol development",
          ],
          keyDeliverables: [
            "BIA Protocol",
            "Current Treatment Mix Data",
            "Eligible Population Estimate",
          ],
          gates: [],
        },
        {
          name: "Population & Market Uptake Estimation",
          description:
            "Project the number of patients who will receive the new intervention each year, accounting for gradual uptake.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Target population sizing (prevalence × eligible fraction)",
            "Uptake curve development (S-curve; year-by-year market share)",
            "Displacement of current treatments modelling",
            "Sensitivity around uptake assumptions",
          ],
          keyDeliverables: [
            "Population Model",
            "Market Uptake Projections (year 1-5)",
          ],
          gates: [],
        },
        {
          name: "Cost Estimation",
          description:
            "Estimate per-patient costs under the new intervention scenario versus current practice, including any cost offsets.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Per-patient cost of new intervention (drug, device, program)",
            "Per-patient cost of comparators",
            "Program implementation costs (training, infrastructure)",
            "Cost offsets (reduced hospitalisations, complications, etc.)",
            "Unit cost validation with local data",
          ],
          keyDeliverables: [
            "Per-Patient Cost Comparison",
            "Cost Offset Estimation",
            "Incremental Cost per Patient",
          ],
          gates: [],
        },
        {
          name: "Budget Impact Calculation",
          description:
            "Calculate total budget impact year-by-year for the budget holder, including PMPM (per-member-per-month) impact.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Annual budget impact calculation (patients × incremental cost, net of offsets)",
            "Cumulative 5-year budget impact",
            "Per-Member-Per-Month (PMPM) impact calculation",
            "Sensitivity analysis (optimistic/pessimistic uptake and costs)",
            "Affordability benchmarking against total budget",
          ],
          keyDeliverables: [
            "Budget Impact Table (year 1-5)",
            "PMPM Impact",
            "Sensitivity Analysis",
          ],
          gates: [],
        },
        {
          name: "Reporting & Affordability Assessment",
          description:
            "Present findings with clear affordability conclusions and options to manage budget impact (phased rollout, price negotiation, etc.).",
          order: 5,
          typicalWeeks: 1,
          keyActivities: [
            "Affordability assessment (budget impact as % of total budget)",
            "Risk-sharing and managed entry options",
            "Phased implementation scenarios",
            "BIA report writing",
            "Presentation to decision-maker",
          ],
          keyDeliverables: [
            "BIA Full Report",
            "Affordability Assessment Summary",
            "Managed Entry Options",
          ],
          gates: [
            {
              name: "Reimbursement or coverage decision made",
              criteria:
                "Payer decision-maker has made a coverage decision based on combined CEA and BIA findings. Coverage conditions or volume agreements documented.",
              order: 1,
            },
          ],
        },
      ],
    },

    // ── TECH & STARTUP ───────────────────────────────────────────────────────
    {
      name: "Lean Startup",
      slug: "lean-startup",
      description:
        "Lean Startup is a methodology for developing businesses and products that emphasises rapid iteration, validated learning, and pivoting based on real customer feedback. Core loop: Build → Measure → Learn. Minimises waste by testing assumptions cheaply before scaling. Essential for any health tech startup or new digital health product launch. Based on Eric Ries (2011).",
      category: "Tech & Startup",
      serviceTypes: ["DIGITAL_HEALTH"],
      estimatedWeeks: 16,
      sortOrder: 15,
      phases: [
        {
          name: "Problem Discovery",
          description:
            "Deeply understand the customer problem before building anything. Talk to potential users to validate that the problem is real, painful, and worth solving.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Define target customer segment and early adopter profile",
            "Conduct 20-50 customer discovery interviews",
            "Problem ranking (how painful? how frequent? how current solutions fail?)",
            "Identify riskiest assumptions about problem and customer",
            "Market sizing (TAM, SAM, SOM)",
            "Competitor landscape analysis",
          ],
          keyDeliverables: [
            "Customer Discovery Interview Summary",
            "Problem Statement (validated)",
            "Riskiest Assumption List",
            "Initial Business Model Canvas",
          ],
          gates: [
            {
              name: "Problem validated with at least 15 customer interviews",
              criteria:
                "At least 15 target customers have confirmed the problem is real, painful, and they would switch from their current solution. Key assumptions documented.",
              order: 1,
            },
          ],
        },
        {
          name: "MVP Development",
          description:
            "Build the minimum viable product: the smallest thing you can create to test your riskiest assumption with real users. Focus on learning, not a perfect product.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "MVP type selection (landing page, concierge, Wizard of Oz, prototype)",
            "MVP scope definition (1 core feature only)",
            "MVP build (code, design, or manual process)",
            "Metrics dashboard setup (North Star metric defined)",
            "Onboarding flow design",
            "Early adopter recruitment strategy",
          ],
          keyDeliverables: [
            "MVP (deployed and accessible to users)",
            "Metrics Dashboard",
            "North Star Metric Defined",
            "Early Adopter List (50+ prospects)",
          ],
          gates: [
            {
              name: "MVP live with at least 10 real users",
              criteria:
                "MVP deployed and accessible. At least 10 real (non-team, non-investor) users have used it. Tracking in place.",
              order: 1,
            },
          ],
        },
        {
          name: "Build-Measure-Learn Cycles",
          description:
            "Run rapid Build-Measure-Learn loops. Each cycle tests one hypothesis. Accumulate validated learnings to find product-market fit.",
          order: 3,
          typicalWeeks: 8,
          keyActivities: [
            "Weekly BML cycle retrospectives",
            "Quantitative metrics analysis (activation, retention, NPS)",
            "Qualitative user interviews (every 2 weeks minimum)",
            "A/B testing of key assumptions",
            "Cohort analysis to separate signal from noise",
            "Pivot or persevere decision reviews (every 4-8 weeks)",
          ],
          keyDeliverables: [
            "Weekly Metrics Report",
            "Validated Learning Log",
            "Pivot or Persevere Decision Documents",
            "Updated Business Model Canvas",
          ],
          gates: [
            {
              name: "Product-market fit signals present",
              criteria:
                "At least one of: NPS above 40, weekly retention above 40% after 4 weeks, organic growth through referrals, or customers explicitly paying/willing to pay.",
              order: 1,
            },
          ],
        },
        {
          name: "Scale Preparation",
          description:
            "Once product-market fit is validated, shift from learning to growth. Prepare infrastructure, team, and funding for scale.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Growth strategy definition (channel strategy, unit economics)",
            "Technical infrastructure scale-up planning",
            "Team and hiring plan",
            "Financial model and fundraising preparation",
            "Partnership and regulatory strategy",
            "Investor pitch deck and data room preparation",
          ],
          keyDeliverables: [
            "Growth Strategy Document",
            "Updated Financial Model",
            "Investor Pitch Deck",
            "Scale-Up Roadmap",
          ],
          gates: [
            {
              name: "Funding or revenue secured for scale phase",
              criteria:
                "Funding round closed, government contract signed, or revenue run-rate sufficient to fund scale phase activities.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Agile Product Development",
      slug: "agile-scrum",
      description:
        "An iterative approach to software and product development delivering working software in short cycles (sprints) with continuous customer feedback. Scrum is the most popular Agile framework, with defined roles (Product Owner, Scrum Master, Dev Team), ceremonies (Sprint Planning, Daily Standup, Review, Retrospective), and artifacts. Standard for all digital health product development.",
      category: "Tech & Startup",
      serviceTypes: ["DIGITAL_HEALTH"],
      estimatedWeeks: 20,
      sortOrder: 16,
      phases: [
        {
          name: "Product Discovery & Backlog Building",
          description:
            "Define the product vision, identify user needs, and build a prioritised product backlog of user stories before sprint work begins.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Product vision and goal definition",
            "User research and persona development",
            "User story mapping",
            "Product backlog creation (user stories in 'As a... I want... So that...' format)",
            "Backlog prioritisation (MoSCoW or WSJF)",
            "Definition of Done (DoD) agreed by team",
            "Sprint 0: environment setup, tooling, architecture decisions",
          ],
          keyDeliverables: [
            "Product Vision Statement",
            "User Personas",
            "Prioritised Product Backlog (50+ stories)",
            "Definition of Done",
            "Sprint 0 Technical Setup Complete",
          ],
          gates: [
            {
              name: "Backlog ready for first sprint",
              criteria:
                "Top 20+ user stories are written, estimated, and prioritised. Definition of Done agreed. Development environment live.",
              order: 1,
            },
          ],
        },
        {
          name: "Iterative Sprint Execution",
          description:
            "Run 2-week sprints: plan → build → test → review. Each sprint delivers working, tested software against agreed sprint goals.",
          order: 2,
          typicalWeeks: 12,
          keyActivities: [
            "Sprint Planning: select stories from backlog, create sprint backlog, agree sprint goal",
            "Daily Standups: 15-min sync (What did I do? What will I do? Any blockers?)",
            "Development, testing, and integration throughout sprint",
            "Sprint Review: demo working software to stakeholders",
            "Sprint Retrospective: What went well? What didn't? One improvement action",
            "Backlog refinement: groom upcoming stories weekly",
          ],
          keyDeliverables: [
            "Working Software Increment (every sprint)",
            "Sprint Velocity Tracking",
            "Burndown Charts",
            "Sprint Retrospective Action Log",
          ],
          gates: [
            {
              name: "First deployable release ready",
              criteria:
                "At least one production-ready release deployed to staging or pilot users. All critical user journeys tested and functional.",
              order: 1,
            },
          ],
        },
        {
          name: "Pilot & User Acceptance Testing",
          description:
            "Deploy to a controlled pilot group. Collect structured user feedback, fix critical issues, and validate readiness for wider release.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Pilot user group onboarding (20-100 users)",
            "User Acceptance Testing (UAT) sessions",
            "Bug triage and prioritisation",
            "Performance and load testing",
            "Security and data privacy review",
            "User feedback collection (NPS, interviews, usage analytics)",
          ],
          keyDeliverables: [
            "UAT Report",
            "Bug Fix Log",
            "Security Assessment",
            "Pilot Feedback Summary",
            "Go/No-Go Release Decision",
          ],
          gates: [
            {
              name: "UAT passed and release approved",
              criteria:
                "All critical and high-priority bugs resolved. UAT signed off by product owner and key stakeholders. Security review cleared.",
              order: 1,
            },
          ],
        },
        {
          name: "Release & Continuous Improvement",
          description:
            "Launch to full user base. Establish ongoing sprint cadence for continuous improvement based on real usage data and user feedback.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Production release and deployment",
            "User onboarding and training",
            "Production monitoring and alerting setup",
            "Support and bug response process",
            "Continuous backlog refinement based on user data",
            "Quarterly roadmap reviews",
          ],
          keyDeliverables: [
            "Production Release",
            "Monitoring Dashboard",
            "Support Runbook",
            "Quarterly Product Roadmap",
          ],
          gates: [
            {
              name: "Key adoption metrics met within 90 days",
              criteria:
                "Active user target met. Critical user journeys have 70%+ completion rate. Support ticket volume manageable. NPS above 30.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Design Thinking",
      slug: "design-thinking",
      description:
        "A human-centred innovation process that deeply understands user needs before designing solutions. Five phases: Empathise, Define, Ideate, Prototype, Test. Best for solving complex, ambiguous problems where the solution is not yet known. Used by IDEO, Stanford d.school, and leading health innovators worldwide for product design, service redesign, and experience improvement.",
      category: "Tech & Startup",
      serviceTypes: ["DIGITAL_HEALTH", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 10,
      sortOrder: 17,
      phases: [
        {
          name: "Empathise",
          description:
            "Deeply understand the experiences, needs, emotions, and context of the people you are designing for through direct engagement.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Immersive observation (shadowing users in their environment)",
            "In-depth user interviews (needs, frustrations, workarounds)",
            "Empathy mapping (What do users Say, Think, Do, Feel?)",
            "Patient / user journey shadowing",
            "Photo and video ethnography",
            "Expert interviews (subject matter experts)",
          ],
          keyDeliverables: [
            "Field Research Notes",
            "Empathy Maps",
            "User Journey Observations",
            "Key Insights and Tensions",
          ],
          gates: [],
        },
        {
          name: "Define",
          description:
            "Synthesise research into a clear, actionable problem statement (Point of View) that frames the challenge from the user's perspective.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: [
            "Research synthesis and insight clustering (affinity mapping)",
            "Persona development",
            "Point of View (POV) statement crafting: [User] needs [need] because [insight]",
            "How Might We (HMW) question generation",
            "Priority criteria definition",
          ],
          keyDeliverables: [
            "Synthesised Research Insights",
            "User Personas",
            "Point of View Statements",
            "How Might We Questions",
          ],
          gates: [
            {
              name: "POV statement validated with users",
              criteria:
                "Point of View statement resonates with target users (validated through brief check-in). HMW questions are generative and human-centred.",
              order: 1,
            },
          ],
        },
        {
          name: "Ideate",
          description:
            "Generate a wide range of creative solutions without judgment before converging on the most promising ideas.",
          order: 3,
          typicalWeeks: 1,
          keyActivities: [
            "Brainstorming sessions (quantity over quality phase)",
            "Lateral thinking techniques (SCAMPER, worst possible idea, analogous inspiration)",
            "Silent brainstorming and idea sharing",
            "Idea clustering and categorisation",
            "Voting and prioritisation (impact vs feasibility matrix)",
            "Concept development for top 3-5 ideas",
          ],
          keyDeliverables: [
            "Idea Bank (100+ ideas)",
            "Top Concept Sketches (3-5)",
            "Prioritisation Matrix",
          ],
          gates: [],
        },
        {
          name: "Prototype",
          description:
            "Build quick, cheap representations of ideas to make them tangible for testing. Fail fast and learn early.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Prototype type selection (paper, digital wireframe, physical, role-play)",
            "Rapid prototype building (hours, not days)",
            "Multiple concept prototyping (test several ideas simultaneously)",
            "Prototype documentation (what are we testing?)",
            "Internal team walkthrough for quality check",
          ],
          keyDeliverables: [
            "Physical or Digital Prototypes (3-5 concepts)",
            "Test Plan (what to learn from each prototype)",
          ],
          gates: [],
        },
        {
          name: "Test",
          description:
            "Put prototypes in front of real users. Learn, iterate, and refine until a solution clearly meets user needs.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "User testing sessions (5-8 users per concept)",
            "Structured observation and interview during testing",
            "Feedback synthesis and iteration",
            "Multiple rapid test-iterate cycles",
            "Pivot or proceed decision based on user response",
            "Solution definition for development handover",
          ],
          keyDeliverables: [
            "User Testing Insights",
            "Iteration Log",
            "Validated Solution Concept",
            "Design Brief for Development",
          ],
          gates: [
            {
              name: "Solution validated by users",
              criteria:
                "Target users have demonstrated they can use the prototype to achieve their goal with minimal guidance. Key pain points from Empathise phase resolved.",
              order: 1,
            },
          ],
        },
      ],
    },

    // ── FEASIBILITY ──────────────────────────────────────────────────────────
    {
      name: "Comprehensive Feasibility Study",
      slug: "feasibility-study",
      description:
        "A structured pre-investment assessment of whether a proposed project or business venture is viable across technical, financial, market, operational, legal, and scheduling dimensions. Answers 'Should we proceed?' before significant capital is committed. Standard requirement for hospital construction, clinic network expansion, health technology investment, and major government health programs.",
      category: "Feasibility",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "DIGITAL_HEALTH"],
      estimatedWeeks: 14,
      sortOrder: 18,
      phases: [
        {
          name: "Preliminary Analysis & Go/No-Go",
          description:
            "Conduct a rapid assessment of the concept to decide whether to invest in a full feasibility study. Screen out non-viable ideas early.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Concept description and scope definition",
            "High-level market demand check",
            "Regulatory red flags scan",
            "Initial resource requirements estimate",
            "Stakeholder mapping",
            "Preliminary Go / No-Go recommendation",
          ],
          keyDeliverables: [
            "Concept Brief",
            "Preliminary Market Scan",
            "Regulatory Red Flags Summary",
            "Preliminary Go / No-Go Decision",
          ],
          gates: [
            {
              name: "Go decision to proceed with full study",
              criteria:
                "No immediate fatal flaws identified (regulatory prohibition, zero market demand, or prohibitive capital requirements). Sponsor approves budget for full feasibility study.",
              order: 1,
            },
          ],
        },
        {
          name: "Detailed Feasibility Study",
          description:
            "Conduct thorough analysis across all six feasibility dimensions: market, technical, financial, operational, legal/regulatory, and scheduling.",
          order: 2,
          typicalWeeks: 10,
          keyActivities: [
            "MARKET: TAM/SAM/SOM analysis, competitive landscape, customer segmentation, demand forecasting",
            "TECHNICAL: Technology/infrastructure requirements, build-buy-partner analysis, technical risks",
            "FINANCIAL: 5-year financial model (P&L, cash flow, balance sheet), break-even, NPV, IRR, payback",
            "OPERATIONAL: Operations plan, staffing requirements, supply chain design, capacity planning",
            "LEGAL/REGULATORY: License requirements, compliance plan, IP considerations, legal structure",
            "SCHEDULING: Project timeline (Gantt), critical path, milestone plan, resource allocation",
          ],
          keyDeliverables: [
            "Market Feasibility Report",
            "Technical Feasibility Assessment",
            "5-Year Financial Model",
            "Operational Plan",
            "Regulatory Compliance Roadmap",
            "Project Schedule (Gantt chart)",
            "Risk Register",
            "Full Feasibility Study Report",
          ],
          gates: [
            {
              name: "Feasibility study peer-reviewed",
              criteria:
                "Full feasibility study reviewed by at least one independent expert not involved in the analysis. Key assumptions stress-tested.",
              order: 1,
            },
          ],
        },
        {
          name: "Investment Decision & Business Plan",
          description:
            "Present feasibility findings, obtain an investment decision, and (if approved) develop the full business plan and implementation roadmap.",
          order: 3,
          typicalWeeks: 6,
          keyActivities: [
            "Feasibility study presentation to investors / board / government",
            "Investment decision: Proceed / Modify / Abandon",
            "If proceed: Business plan development",
            "Funding strategy (equity, debt, grants, PPP)",
            "Implementation roadmap (90-day, 1-year, 3-year)",
            "Governance and team setup",
          ],
          keyDeliverables: [
            "Feasibility Study Executive Summary (for investor presentation)",
            "Investment Decision Document",
            "Business Plan (if Go decision)",
            "Implementation Roadmap",
            "Funding Term Sheet or Commitment (if applicable)",
          ],
          gates: [
            {
              name: "Investment decision made and funding committed",
              criteria:
                "Board or investor decision formally documented. If Go: minimum viable funding committed to begin implementation. If No-Go or Modify: rationale documented and next steps defined.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Healthcare Investment Appraisal",
      slug: "healthcare-investment-appraisal",
      description:
        "A structured framework for appraising capital investment decisions in healthcare settings: new facilities, equipment, technology platforms, or service lines. Combines financial return analysis (NPV, IRR, payback) with strategic fit, clinical impact, and risk scoring. Enables disciplined capital allocation and board-level investment governance in hospitals and health systems.",
      category: "Feasibility",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS"],
      estimatedWeeks: 8,
      sortOrder: 19,
      phases: [
        {
          name: "Investment Case Definition",
          description:
            "Clearly define what is being appraised, why it is needed, and what problem it solves. Align with strategic priorities.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Investment description and scope",
            "Problem or opportunity being addressed",
            "Alignment with strategic plan",
            "Options identification (do nothing, minimum, full investment)",
            "Preliminary stakeholder consultation",
          ],
          keyDeliverables: [
            "Investment Case Brief",
            "Options Long List",
            "Strategic Alignment Statement",
          ],
          gates: [],
        },
        {
          name: "Financial Analysis",
          description:
            "Model the financial return of the investment over its useful life, comparing options on NPV, IRR, and payback period.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Capital cost estimation",
            "Operating cost differential (new vs current state)",
            "Revenue uplift or cost saving quantification",
            "NPV calculation (5-10 year horizon, relevant discount rate)",
            "IRR calculation",
            "Payback period calculation",
            "Sensitivity analysis (occupancy, pricing, cost overrun scenarios)",
          ],
          keyDeliverables: [
            "Financial Model",
            "NPV / IRR / Payback Summary",
            "Sensitivity Analysis",
          ],
          gates: [],
        },
        {
          name: "Strategic, Clinical & Risk Scoring",
          description:
            "Score the investment on non-financial dimensions: strategic fit, clinical need, regulatory compliance, and risk. Combine with financial score for overall recommendation.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Strategic fit scoring (1-5 on each strategic priority)",
            "Clinical need and patient impact assessment",
            "Regulatory compliance and licensing review",
            "Risk identification and scoring (financial, operational, clinical, reputational)",
            "Weighted total score across all dimensions",
            "Comparison of options on combined scorecard",
          ],
          keyDeliverables: [
            "Investment Scorecard (financial + strategic + clinical + risk)",
            "Risk Register",
            "Options Comparison Matrix",
          ],
          gates: [],
        },
        {
          name: "Recommendation & Board Approval",
          description:
            "Present the investment appraisal to the board or investment committee with a clear recommendation. Document the decision and conditions.",
          order: 4,
          typicalWeeks: 1,
          keyActivities: [
            "Investment appraisal report preparation",
            "Board or investment committee presentation",
            "Post-investment monitoring plan agreement",
            "Approval conditions documentation (milestones, reporting)",
            "Procurement or project initiation authorisation",
          ],
          keyDeliverables: [
            "Investment Appraisal Report",
            "Board Approval Minute",
            "Post-Investment Monitoring Framework",
          ],
          gates: [
            {
              name: "Board investment decision recorded",
              criteria:
                "Board or investment committee has formally voted on the investment. Decision recorded in minutes with conditions and monitoring requirements.",
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
    // Strategic Analysis (new additions)
    {
      name: "BCG Growth-Share Matrix",
      slug: "bcg-matrix",
      description:
        "Categorises a company's products or business units into four quadrants (Stars, Cash Cows, Question Marks, Dogs) based on market growth rate and relative market share. Helps allocate resources and make strategic decisions about which businesses to invest in, harvest, or divest. Developed by Boston Consulting Group in the 1970s.",
      category: "Strategic Analysis",
      dimensions: ["Stars (High Share, High Growth)", "Cash Cows (High Share, Low Growth)", "Question Marks (Low Share, High Growth)", "Dogs (Low Share, Low Growth)"],
      guideText:
        "Place each business unit / product on the matrix. Stars: invest to grow. Cash Cows: harvest to fund Stars and Question Marks. Question Marks: invest selectively or divest. Dogs: divest or minimal investment. Healthcare application: Stars = new telemedicine platforms; Cash Cows = established diagnostic services; Question Marks = new digital health apps; Dogs = outdated service lines.",
      sortOrder: 15,
    },
    {
      name: "Value Chain Analysis",
      slug: "value-chain",
      description:
        "Porter's Value Chain identifies the key activities through which an organisation creates value for customers, separating primary activities (directly creating value) from support activities (enabling primary activities). Used to identify competitive advantage, cost drivers, and areas for improvement.",
      category: "Strategic Analysis",
      dimensions: [
        "Inbound Logistics",
        "Operations",
        "Outbound Logistics",
        "Marketing & Sales",
        "Service",
        "Firm Infrastructure (Support)",
        "Human Resource Management (Support)",
        "Technology Development (Support)",
        "Procurement (Support)",
      ],
      guideText:
        "For each activity: (1) Map what the organisation does, (2) Assess cost and value created, (3) Compare to competitors, (4) Identify where competitive advantage lies. In hospitals: Operations = patient care delivery; Service = post-discharge follow-up. Focus improvement efforts on high-cost or low-value activities.",
      sortOrder: 16,
    },

    // Organisational (new category)
    {
      name: "McKinsey 7-S Framework",
      slug: "mckinsey-7s",
      description:
        "Analyses seven interdependent elements of an organisation to ensure strategic alignment. All 7 must be aligned for successful change. Developed by McKinsey in the 1970s. Used for organisational diagnosis, change management, and post-merger integration.",
      category: "Organizational",
      dimensions: [
        "Strategy (plan to achieve competitive advantage)",
        "Structure (how organisation is organised)",
        "Systems (processes and IT infrastructure)",
        "Shared Values (culture and core beliefs)",
        "Style (leadership and management approach)",
        "Staff (people, capabilities, and motivation)",
        "Skills (distinctive competencies)",
      ],
      guideText:
        "Assess current and desired state for each S. Identify misalignments. Hard S elements (Strategy, Structure, Systems) are easier to change; Soft S elements (Shared Values, Style, Staff, Skills) take longer. Shared Values sits at the centre — every other S must align with it. In hospital transformations, Shared Values and Style are typically the hardest to change.",
      sortOrder: 17,
    },
    {
      name: "RACI Responsibility Matrix",
      slug: "raci-matrix",
      description:
        "Clarifies roles and responsibilities for every key activity, decision, and deliverable in a project or process. Assigns each person as Responsible, Accountable, Consulted, or Informed. Prevents duplication, gaps, and confusion about who owns what. Essential for multi-stakeholder healthcare projects.",
      category: "Organizational",
      dimensions: [
        "Responsible (does the work)",
        "Accountable (owns the outcome, final approval)",
        "Consulted (provides input, two-way communication)",
        "Informed (kept updated, one-way communication)",
      ],
      guideText:
        "List all project activities or decisions in rows. List all team members / roles in columns. Assign R, A, C, or I for each combination. Rules: (1) Every activity must have exactly one A, (2) Every activity must have at least one R, (3) Avoid too many C/I per activity (decision by committee), (4) Review with all stakeholders before finalising. Red flags: multiple A's (accountability dilution) or no A (accountability vacuum).",
      sortOrder: 18,
    },

    // Health Economics (new category)
    {
      name: "Behavioral Economics Nudge Audit",
      slug: "behavioral-nudge-audit",
      description:
        "Applies behavioral economics principles to identify why patients, providers, or staff are not making desired health decisions, and designs low-cost 'nudge' interventions to guide better choices without restricting freedom. Based on Thaler & Sunstein nudge theory, EAST framework, and the extensive evidence base from J-PAL and behavioural insights teams.",
      category: "Health Economics",
      dimensions: [
        "Present Bias Diagnosis (do immediate incentives undermine long-term decisions?)",
        "Loss Aversion Application (reframe as avoiding loss, not gaining benefit)",
        "Default Option Design (make the right choice the easy/default choice)",
        "Social Norm Messaging (what are peers doing?)",
        "Simplification & Salience (reduce complexity and increase visibility)",
        "Commitment Devices (help people pre-commit to desired behavior)",
        "Reminder Systems (combat forgetfulness and present bias)",
        "Feedback & Progress Tracking (make progress visible)",
      ],
      guideText:
        "For each behavioral barrier: (1) Diagnose the specific bias, (2) Design the nudge intervention, (3) Test with small pilot (A/B if possible), (4) Measure behavior change, (5) Scale if effective. EAST framework: make it Easy, Attractive, Social, and Timely. High-impact healthcare nudges: opt-out organ donation (default), SMS appointment reminders (reminder), peer comparison hand hygiene rates (social norm), instant reward at vaccination (present bias).",
      sortOrder: 19,
    },
    {
      name: "Health Technology Assessment Scorecard",
      slug: "hta-scorecard",
      description:
        "A structured multi-criteria framework for evaluating health technologies (drugs, devices, diagnostics, digital tools) for coverage and reimbursement decisions. Combines clinical effectiveness, cost-effectiveness, budget impact, equity, and implementation feasibility into a single decision framework. Used by HTA agencies (NICE, WHO, national health insurance authorities).",
      category: "Health Economics",
      dimensions: [
        "Clinical Effectiveness (does it work better than alternatives?)",
        "Safety Profile (adverse events, contraindications)",
        "Cost-Effectiveness (ICER vs threshold)",
        "Budget Impact (3-5 year fiscal impact on payer)",
        "Equity & Accessibility (impact on underserved populations)",
        "Implementation Feasibility (supply chain, infrastructure, training)",
        "Patient Preferences & Values",
        "Overall Recommendation",
      ],
      guideText:
        "Score each dimension using available evidence. Apply country-specific cost-effectiveness threshold (Nigeria: ~1-3× GDP per capita per DALY averted, approximately $2,000-6,000). Positive recommendation requires: (1) Meaningful clinical benefit, (2) ICER below threshold or highly cost-effective, (3) Affordable budget impact, (4) Implementable in health system context. Negative on any one dimension can override positive on others.",
      sortOrder: 20,
    },

    // Innovation (new category)
    {
      name: "Business Model Canvas",
      slug: "business-model-canvas",
      description:
        "A visual tool for describing, designing, and analysing business models. The 9 building blocks cover all aspects of how an organisation creates, delivers, and captures value. Developed by Alexander Osterwalder. Essential for health startups, new service line design, and business model innovation in health organisations.",
      category: "Innovation",
      dimensions: [
        "Customer Segments (who are we creating value for?)",
        "Value Propositions (what value do we deliver?)",
        "Channels (how do we reach customers?)",
        "Customer Relationships (how do we interact?)",
        "Revenue Streams (how do we earn?)",
        "Key Resources (what do we need?)",
        "Key Activities (what must we do?)",
        "Key Partnerships (who helps us?)",
        "Cost Structure (what are our costs?)",
      ],
      guideText:
        "Complete canvas from right (customer-facing) to left (infrastructure). Customer Segments and Value Propositions are the core — validate these with real customers before detailing the rest. Revenue Streams must cover Cost Structure for viability. Common health startup mistake: great clinical Value Proposition but unclear Customer Segment (patient vs hospital vs HMO vs government). Test riskiest assumptions first.",
      sortOrder: 21,
    },
    {
      name: "OKR Framework",
      slug: "okr-framework",
      description:
        "Objectives and Key Results (OKRs) is a goal-setting framework that connects ambitious qualitative objectives to measurable quantitative results. Used by Google, Intel, and leading health organisations to align teams, drive accountability, and focus effort on what matters most. Operates on quarterly cycles with annual aspirational OKRs.",
      category: "Innovation",
      dimensions: [
        "Objective (ambitious, qualitative, inspiring — What do we want to achieve?)",
        "Key Result 1 (measurable outcome showing progress toward objective)",
        "Key Result 2",
        "Key Result 3",
        "Confidence Score (weekly: how confident are we to hit this KR?)",
        "Initiatives (what projects/activities drive this KR?)",
      ],
      guideText:
        "Rules: (1) 3-5 Objectives maximum per team/person per quarter, (2) 2-4 Key Results per Objective, (3) KRs must be measurable outcomes (not tasks), (4) 60-70% achievement is a good OKR (100% means not ambitious enough), (5) Separate stretch OKRs from committed OKRs. Healthcare example — Objective: 'Become the quality leader in cardiac care in Lagos' KR1: Achieve JCI accreditation in cardiac department by Q4; KR2: Reduce 30-day cardiac readmissions from 18% to 12%; KR3: Net Promoter Score for cardiac patients above 60.",
      sortOrder: 22,
    },

    // Public Health & M&E (new category for frameworks)
    {
      name: "Logical Framework Matrix",
      slug: "logframe-matrix",
      description:
        "The classic 4×4 Logframe Matrix used in donor-funded programs to summarise program logic, indicators, means of verification, and assumptions at each level of the results chain. The structured format required by USAID, World Bank, EU, DFID, GAVI, Global Fund, and most bilateral donors for program design and reporting.",
      category: "Public Health & M&E",
      dimensions: [
        "Goal / Impact (long-term societal change)",
        "Purpose / Outcome (program-level objective)",
        "Outputs (tangible deliverables produced)",
        "Activities (actions to produce outputs)",
      ],
      guideText:
        "For each level, complete 4 columns: (1) Narrative Summary (what happens at this level), (2) Indicators (how will we measure it — SMART), (3) Means of Verification (data source and collection method), (4) Assumptions (what must be true for the logic to hold going UP to the next level). Key vertical logic test: IF activities happen AND assumptions hold, THEN outputs are produced. IF outputs happen AND assumptions hold, THEN purpose is achieved. And so on.",
      sortOrder: 23,
    },
    {
      name: "M&E Indicator Selection Criteria",
      slug: "me-indicator-criteria",
      description:
        "A structured assessment framework for selecting the right indicators for a monitoring and evaluation system. Ensures indicators are SMART, SPICED, or CREAM-compliant and covers the full results chain from outputs through to impact. Prevents the common trap of selecting what is easy to measure rather than what matters.",
      category: "Public Health & M&E",
      dimensions: [
        "Validity (measures what it's supposed to measure)",
        "Reliability (consistent results regardless of who measures)",
        "Sensitivity (detects changes over the program timeframe)",
        "Specificity (attributable to the program, not other factors)",
        "Practicality (data is feasible and affordable to collect)",
        "Disaggregation (can be broken down by sex, age, geography)",
        "Coverage of results chain (output, outcome, impact levels)",
      ],
      guideText:
        "Score each candidate indicator 1-3 on each dimension. Prioritise high-scoring indicators. Aim for 3-5 indicators per results level. Red flags: (1) Only output indicators (no outcome/impact measurement), (2) Indicators that require expensive surveys to measure (use proxy indicators instead), (3) Indicators that cannot be disaggregated by sex/age (equity blind), (4) Too many indicators overall (>20 for a standard program). Common output indicator: '# of health workers trained'. Better outcome indicator: '% of health workers demonstrating competency 3 months post-training'.",
      sortOrder: 24,
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

  console.log("Expanded methodology & framework seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
