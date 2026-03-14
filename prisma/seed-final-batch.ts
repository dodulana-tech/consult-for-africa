import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding final methodology & framework batch...");

  // ─── METHODOLOGIES ─────────────────────────────────────────────────────────

  const methodologies = [
    // ── STRATEGY & CONSULTING TOOLS ───────────────────────────────────────────
    {
      name: "Hypothesis-Driven Problem Solving",
      slug: "hypothesis-driven",
      description:
        "The MBB consulting approach to complex problems: generate a bold answer hypothesis upfront, then work to prove or disprove it rather than boiling the ocean. Combines MECE issue trees, structured hypotheses, and rapid data analysis to deliver recommendations faster. The core intellectual method behind every McKinsey, BCG, and Bain engagement. Transforms analysts from data collectors into decision-makers.",
      category: "Strategy",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "TURNAROUND"],
      estimatedWeeks: 8,
      sortOrder: 29,
      phases: [
        {
          name: "Problem Definition & Initial Hypothesis",
          description:
            "Frame the problem precisely and generate an initial answer hypothesis before collecting data. This prevents boiling the ocean.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Problem statement development (specific, bounded, decision-focused)",
            "Problem context mapping (Situation, Complication, Question — SCQ)",
            "Initial hypothesis generation: 'We believe the answer is...'",
            "Hypothesis statement to client leadership for alignment",
            "Identify key questions the hypothesis must answer",
          ],
          keyDeliverables: [
            "Problem Statement Document",
            "SCQ Context Map",
            "Initial Hypothesis Statement",
            "Key Questions List",
          ],
          gates: [
            {
              name: "Client aligned on problem statement and hypothesis",
              criteria:
                "Client sponsor has confirmed the problem statement accurately reflects the decision they need to make. Initial hypothesis is directionally acceptable to pursue.",
              order: 1,
            },
          ],
        },
        {
          name: "Issue Tree & Work Planning",
          description:
            "Decompose the hypothesis into a MECE issue tree. Build a prioritised workplan that tests the most critical branches first.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: [
            "MECE issue tree construction from hypothesis",
            "Hypotheses assigned to each branch (sub-hypotheses)",
            "Prioritisation: which branches are highest leverage? (80/20 rule)",
            "Workplan development (what analysis, who owns it, by when)",
            "Data request list development",
          ],
          keyDeliverables: [
            "Issue Tree (hypothesis-led)",
            "Prioritised Workplan",
            "Data Request List",
          ],
          gates: [],
        },
        {
          name: "Rapid Analyses",
          description:
            "Execute the priority analyses quickly. Focus on the 20% of analyses that will yield 80% of the answer. Kill unproductive branches early.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Priority analyses execution (quantitative + qualitative)",
            "Weekly hypothesis update meetings (is the hypothesis still holding?)",
            "Ghost deck development (placeholder slides with hypothesised conclusions)",
            "Early insight sharing with client (no 'big reveal' surprises)",
            "Branch killing: eliminate issue tree branches proven wrong early",
          ],
          keyDeliverables: [
            "Analysis Workbooks",
            "Evolving Ghost Deck",
            "Weekly Hypothesis Status Update",
          ],
          gates: [
            {
              name: "Core hypothesis proven or pivoted",
              criteria:
                "The initial hypothesis is either confirmed by evidence or has been revised to a more supported alternative. No major analytical threads still open.",
              order: 1,
            },
          ],
        },
        {
          name: "Synthesis & Recommendations",
          description:
            "Build the recommendation pyramid. Lead with the answer, support with evidence. Deliver actionable recommendations, not just findings.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Pyramid structure construction (top-down: answer → arguments → evidence)",
            "Recommendation stress-testing (devil's advocate review)",
            "Implementation implications and risks",
            "Client-ready deck production (Minto Pyramid Principle structure)",
            "Oral presentation to executive sponsor",
          ],
          keyDeliverables: [
            "Final Recommendations Deck",
            "Implementation Roadmap",
            "Risk Register for Recommendations",
          ],
          gates: [
            {
              name: "Recommendations accepted and next steps agreed",
              criteria:
                "Client sponsor has accepted the recommendations. Implementation next steps agreed. Responsible owners assigned for at least the first 90 days.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Business Process Reengineering",
      slug: "business-process-reengineering",
      description:
        "Business Process Reengineering (BPR) is the radical redesign of core business processes to achieve dramatic improvements in performance. Unlike incremental improvement (Lean, PDSA), BPR asks 'If we were designing this process from scratch today, how would it look?' Particularly valuable for legacy hospital processes (outpatient registration, billing, pharmacy) where technology now enables fundamentally different approaches. Based on Hammer & Champy (1993).",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "DIGITAL_HEALTH"],
      estimatedWeeks: 20,
      sortOrder: 30,
      phases: [
        {
          name: "Process Identification & Selection",
          description:
            "Identify and prioritise the processes most in need of radical redesign based on dysfunction, strategic importance, and feasibility.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Complete process inventory (all major administrative and clinical processes)",
            "Dysfunction assessment (cost, quality, speed, customer pain per process)",
            "Strategic importance scoring",
            "Redesign feasibility assessment",
            "Process selection and executive sponsorship alignment",
          ],
          keyDeliverables: [
            "Process Inventory",
            "Process Prioritisation Matrix",
            "Selected Processes for Reengineering",
          ],
          gates: [
            {
              name: "Executive sponsor committed to selected processes",
              criteria:
                "C-suite sponsor has approved the selected processes and committed the authority and resources required for radical redesign. Staff 'sacred cows' explicitly addressed.",
              order: 1,
            },
          ],
        },
        {
          name: "Current State Mapping",
          description:
            "Document and quantify the current process in detail — not to improve it, but to understand its root dysfunctions before designing the new process.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "As-is process mapping (swim lane, end-to-end)",
            "Time and motion studies (actual time at each step)",
            "Handoff and rework counting",
            "Customer pain point mapping",
            "Technology and information flow documentation",
            "Cost quantification of current process",
          ],
          keyDeliverables: [
            "Current State Process Maps",
            "Process Metrics Baseline (time, cost, error rate)",
            "Pain Point Catalogue",
          ],
          gates: [],
        },
        {
          name: "Radical Redesign",
          description:
            "Design the new process from scratch, unconstrained by the current process. Apply technology enablers and eliminate unnecessary steps, checks, and handoffs.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Zero-based redesign workshops ('If we started over, how would we build this?')",
            "Technology enabler identification (automation, digital, AI)",
            "New process design (radically simplified, customer-centric)",
            "Roles and responsibilities in new process",
            "Performance target setting for new process",
            "Stakeholder validation and challenge sessions",
          ],
          keyDeliverables: [
            "Future State Process Design",
            "Technology Requirements",
            "New Roles and Responsibilities",
            "Performance Targets",
          ],
          gates: [
            {
              name: "Future state design validated by stakeholders",
              criteria:
                "New process design reviewed and endorsed by clinical leads, operations team, and executive sponsor. Technology requirements feasible within budget and timeline.",
              order: 1,
            },
          ],
        },
        {
          name: "Pilot Implementation",
          description:
            "Implement the redesigned process in one unit or location before full rollout. Test, measure, and refine.",
          order: 4,
          typicalWeeks: 6,
          keyActivities: [
            "Pilot site preparation (IT, training, physical environment)",
            "Staff recruitment or retraining for new roles",
            "Pilot launch (controlled go-live)",
            "Daily monitoring in first 2 weeks",
            "Issue triage and rapid fixes",
            "Outcome measurement vs baseline and targets",
          ],
          keyDeliverables: [
            "Pilot Results Report",
            "Issue Log and Resolutions",
            "Performance vs Targets",
          ],
          gates: [
            {
              name: "Pilot meets performance targets",
              criteria:
                "Pilot process demonstrates at least 50% improvement on primary metric vs baseline. No unacceptable patient safety or quality outcomes. Ready to scale.",
              order: 1,
            },
          ],
        },
        {
          name: "Full Rollout & Transition",
          description:
            "Scale the redesigned process across the organisation. Decommission the old process. Embed performance management.",
          order: 5,
          typicalWeeks: 6,
          keyActivities: [
            "Rollout planning (phased by unit, geography, or function)",
            "Change management and communication",
            "Training at scale",
            "Old process decommissioning",
            "Performance monitoring and management",
            "Lessons learned and process library update",
          ],
          keyDeliverables: [
            "Rollout Plan",
            "Training Materials",
            "Process Performance Dashboard",
            "Transition Completion Report",
          ],
          gates: [
            {
              name: "Full rollout complete and performance sustained",
              criteria:
                "New process operating hospital-wide. Performance targets met across all units. Old process fully decommissioned.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Scenario Planning",
      slug: "scenario-planning",
      description:
        "Scenario Planning is a strategic planning method for making decisions under deep uncertainty. Developed by Shell in the 1970s, it builds multiple plausible futures (not forecasts) to stress-test strategy and identify robust moves. Essential for African health organisations navigating uncertain regulatory, economic, and epidemiological futures. More valuable than single-point projections when the future is genuinely unknowable.",
      category: "Strategy",
      serviceTypes: ["HEALTH_SYSTEMS", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 8,
      sortOrder: 31,
      phases: [
        {
          name: "Focal Question & Driving Forces",
          description:
            "Define the strategic question the scenarios will address. Identify all external driving forces that could affect the answer.",
          order: 1,
          typicalWeeks: 1,
          keyActivities: [
            "Focal question definition ('What strategic decisions do we need to make over the next 5 years?')",
            "Driving forces brainstorm (PESTLE: political, economic, social, technological, legal, environmental)",
            "Driving forces clustering and consolidation",
            "Driving force significance and uncertainty rating",
          ],
          keyDeliverables: [
            "Focal Question Statement",
            "Long List of Driving Forces",
            "Driving Forces Significance/Uncertainty Matrix",
          ],
          gates: [],
        },
        {
          name: "Critical Uncertainties & Scenario Axes",
          description:
            "Identify the 2 most critical AND most uncertain driving forces. These become the axes of the scenario matrix.",
          order: 2,
          typicalWeeks: 1,
          keyActivities: [
            "Top 2 critical uncertainties selection (high impact + high uncertainty)",
            "Scenario axes definition",
            "4 scenario quadrants naming and initial description",
            "Scenario plausibility check",
            "Leadership alignment on scenario axes",
          ],
          keyDeliverables: [
            "2×2 Scenario Matrix",
            "4 Named Scenario Quadrants",
          ],
          gates: [
            {
              name: "Scenario axes agreed by leadership",
              criteria:
                "Leadership team agrees that the two selected critical uncertainties are the most strategically consequential. Scenarios feel genuinely distinct and plausible.",
              order: 1,
            },
          ],
        },
        {
          name: "Scenario Narrative Development",
          description:
            "Flesh each scenario into a vivid, internally consistent 5-10 year narrative. Include key indicators of which scenario is emerging.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Working groups per scenario (one team per quadrant)",
            "Narrative writing: timeline, key events, stakeholder behaviours, market conditions",
            "Early indicator identification (what signals that this scenario is coming true?)",
            "Scenario naming (memorable, evocative, not optimistic/pessimistic labels)",
            "Cross-team scenario critique (are they distinct enough? plausible?)",
          ],
          keyDeliverables: [
            "4 Scenario Narratives (3-5 pages each)",
            "Early Warning Indicators per Scenario",
            "Scenario Summary Matrix",
          ],
          gates: [],
        },
        {
          name: "Strategy Stress-Test & Robust Moves",
          description:
            "Test current and proposed strategies against all four scenarios. Identify robust moves (win in all scenarios) and hedges (protect against worst cases).",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Strategy performance assessment per scenario",
            "Robust move identification (strategies that perform acceptably in all 4 scenarios)",
            "Regret analysis (which strategic bet has worst downside?)",
            "Hedging strategy development",
            "Early mover opportunities identification",
            "Monitoring system design (track leading indicators for scenario emergence)",
          ],
          keyDeliverables: [
            "Strategy-Scenario Performance Matrix",
            "Robust Strategic Moves",
            "Hedging Strategies",
            "Scenario Monitoring Dashboard",
          ],
          gates: [
            {
              name: "Board briefed on scenarios and strategic implications",
              criteria:
                "Board has reviewed all four scenarios and agreed on robust strategic moves. Scenario monitoring system embedded in strategy review process.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Benchmarking & Best Practice Transfer",
      slug: "benchmarking",
      description:
        "A systematic process for comparing an organisation's performance and practices against peers, best-in-class performers, and industry standards. Goes beyond data comparison to identify what drives superior performance and how those practices can be adapted and implemented. The Robert Camp (Xerox) model for benchmarking. Essential for hospital network management and national quality improvement programmes.",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 10,
      sortOrder: 32,
      phases: [
        {
          name: "Plan: Scope & Metrics",
          description:
            "Define what you are benchmarking, select the metrics, and identify benchmarking partners.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Benchmarking topic selection (function, process, or outcome)",
            "KPI selection (what to measure — process and outcome metrics)",
            "Benchmarking partners identification (best-in-class, peer, aspirational)",
            "Data collection methodology",
            "Ethics and data sharing agreements",
          ],
          keyDeliverables: [
            "Benchmarking Scope Document",
            "KPI Framework",
            "Benchmarking Partners List",
            "Data Sharing Agreements",
          ],
          gates: [],
        },
        {
          name: "Collect: Internal & External Data",
          description:
            "Collect performance data from your organisation and benchmarking partners. Ensure data is comparable.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Internal data collection and validation",
            "External partner data collection (surveys, visits, published data)",
            "Data normalisation (adjust for case mix, size, context differences)",
            "Gap quantification (your performance vs best practice)",
            "Process deep-dives at high-performing sites (site visits, interviews)",
          ],
          keyDeliverables: [
            "Benchmarking Dataset",
            "Performance Gap Analysis",
            "Best Practice Process Documentation",
          ],
          gates: [
            {
              name: "Benchmarking data validated and gaps confirmed",
              criteria:
                "Data from at least 3 external comparators collected and validated. Performance gaps quantified and agreed with internal stakeholders.",
              order: 1,
            },
          ],
        },
        {
          name: "Analyse: Root Cause of Gaps",
          description:
            "Understand WHY the best performers perform better. Surface the practices, systems, and behaviours that drive superior performance.",
          order: 3,
          typicalWeeks: 2,
          keyActivities: [
            "Root cause analysis of performance gaps",
            "Best practice enabler identification (what specifically drives superior performance?)",
            "Adaptability assessment (can this practice work in our context?)",
            "Prioritisation of best practices to adopt",
          ],
          keyDeliverables: [
            "Root Cause Analysis",
            "Best Practice Enablers",
            "Prioritised Improvement Actions",
          ],
          gates: [],
        },
        {
          name: "Adapt & Implement",
          description:
            "Adapt the best practices to your context and implement. Track improvement toward benchmarks.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Best practice adaptation plan (what to change for local context)",
            "Implementation planning and piloting",
            "Progress tracking against benchmarks",
            "Continuous benchmarking cycle establishment (annual refresh)",
          ],
          keyDeliverables: [
            "Implementation Plan",
            "Adapted Best Practice Guide",
            "Progress vs Benchmark Dashboard",
            "Annual Benchmarking Refresh Schedule",
          ],
          gates: [
            {
              name: "Performance improvement toward benchmark confirmed",
              criteria:
                "At least one primary benchmark metric shows measurable improvement vs baseline. Benchmarking cycle scheduled for 12-month refresh.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── OPERATIONS ────────────────────────────────────────────────────────────
    {
      name: "Patient Flow Optimisation",
      slug: "patient-flow-optimisation",
      description:
        "A systematic methodology for redesigning patient flow through a hospital or clinic to reduce waiting times, increase throughput, and improve patient experience — without capital investment. Uses queuing theory, process mapping, and demand-capacity matching. Typically delivers 30-50% reduction in waiting times and 15-25% throughput improvement. The highest-ROI operational intervention in most African hospitals.",
      category: "Operations",
      serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 14,
      sortOrder: 33,
      phases: [
        {
          name: "Flow Diagnostic",
          description:
            "Map and measure current patient flow across all care steps. Identify where patients wait, why they wait, and the root causes.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Patient journey time studies (total time, value-added time, wait time)",
            "Throughput measurement by department and hour",
            "Demand profiling (patient arrival patterns by day and hour)",
            "Bottleneck identification (where is the queue building?)",
            "Staffing pattern vs demand pattern comparison",
            "Root cause analysis of top 3 flow bottlenecks",
          ],
          keyDeliverables: [
            "Patient Flow Diagnostic Report",
            "Current Flow Maps (swim lane by care area)",
            "Demand-Capacity Mismatch Analysis",
            "Bottleneck Identification Summary",
            "Baseline KPIs (waiting time, throughput, ALOS)",
          ],
          gates: [
            {
              name: "Diagnostic findings validated by clinical and operations leads",
              criteria:
                "Clinical and operations leadership agree on the primary bottlenecks and root causes. Baseline KPIs accepted as accurate.",
              order: 1,
            },
          ],
        },
        {
          name: "Redesign & Solutions Development",
          description:
            "Co-design flow improvement solutions with frontline staff. Prioritise by impact and ease of implementation.",
          order: 2,
          typicalWeeks: 2,
          keyActivities: [
            "Solution generation workshops (frontline staff led)",
            "Scheduling and staffing pattern optimisation",
            "Physical layout quick wins (re-positioning stations, signage)",
            "Appointment system redesign (overbooking policy, walk-in management)",
            "Patient streaming (fast track vs complex care)",
            "Parallel processing opportunities (reduce sequential steps)",
            "Solution prioritisation (impact vs effort matrix)",
          ],
          keyDeliverables: [
            "Flow Improvement Solutions List",
            "Prioritised Implementation Plan",
            "New Staff Scheduling Proposals",
            "Quick Win Actions (implementable within 2 weeks)",
          ],
          gates: [],
        },
        {
          name: "Pilot Implementation",
          description:
            "Implement priority solutions in one area first. Measure impact and refine before rolling out hospital-wide.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Quick wins implementation (week 1-2)",
            "Scheduling and staffing changes rollout",
            "Physical changes (layout, signage, triage redesign)",
            "Real-time flow monitoring (daily tracking of KPIs)",
            "Staff coaching on new flow protocols",
            "Patient communication updates",
          ],
          keyDeliverables: [
            "Pilot Results Report",
            "Daily Flow KPI Tracking",
            "Staff Feedback Log",
          ],
          gates: [
            {
              name: "Pilot shows 20%+ improvement in primary waiting metric",
              criteria:
                "Pilot area shows at least 20% reduction in waiting time or 15% increase in throughput vs baseline. Patient satisfaction scores stable or improved.",
              order: 1,
            },
          ],
        },
        {
          name: "Full Rollout & Sustainability",
          description:
            "Roll out solutions across all relevant departments. Establish real-time flow management and daily management systems to sustain gains.",
          order: 4,
          typicalWeeks: 5,
          keyActivities: [
            "Full hospital rollout plan and execution",
            "Daily management system implementation (morning huddles, real-time dashboards)",
            "Flow coordinator role establishment",
            "Monthly flow review meeting cadence",
            "Staff performance management integration",
            "Annual flow audit plan",
          ],
          keyDeliverables: [
            "Rollout Results Report",
            "Daily Management System Guide",
            "Flow Monitoring Dashboard",
            "Sustainability Plan",
          ],
          gates: [
            {
              name: "Targets met and daily management system live",
              criteria:
                "Hospital-wide waiting time and throughput targets met. Daily management system operational with data reviewed every morning by operations team.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Healthcare Workforce Planning",
      slug: "healthcare-workforce-planning",
      description:
        "A systematic methodology for assessing, planning, and developing the healthcare workforce to meet current and future service needs. Covers workforce sizing (how many staff?), skill mix (what roles?), distribution (where?), and pipeline development (how do we build the supply?). Based on WHO Human Resources for Health (HRH) methodology. Critical for Nigeria's health workforce crisis and diaspora deployment strategy.",
      category: "Operations",
      serviceTypes: ["HEALTH_SYSTEMS", "HOSPITAL_OPERATIONS", "EMBEDDED_LEADERSHIP"],
      estimatedWeeks: 16,
      sortOrder: 34,
      phases: [
        {
          name: "Workforce Situation Analysis",
          description:
            "Quantify the current workforce: numbers, skills, distribution, productivity, and turnover. Identify immediate gaps.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Workforce census (all categories: doctors, nurses, allied health, admin, support)",
            "Skills and qualification inventory",
            "Geographic distribution mapping",
            "Productivity analysis (patients per staff per day, workload benchmarking)",
            "Retention and turnover analysis",
            "Pay and incentive benchmarking",
            "Staff satisfaction survey",
          ],
          keyDeliverables: [
            "Workforce Situational Analysis Report",
            "Workforce Census Data",
            "Skills and Distribution Map",
            "Turnover Analysis",
          ],
          gates: [],
        },
        {
          name: "Demand Forecasting",
          description:
            "Project future workforce needs based on projected service volumes, population growth, and service delivery model changes.",
          order: 2,
          typicalWeeks: 3,
          keyActivities: [
            "Service demand projections (5-10 year population-based forecasts)",
            "Workload standards development (staff per bed, staff per patient)",
            "New service line workforce requirements",
            "Technology impact on workforce (EMR, telemedicine — what changes?)",
            "Future workforce size and mix projections",
          ],
          keyDeliverables: [
            "5-10 Year Demand Forecast",
            "Workforce Requirements Model",
            "Skill Mix Projections",
          ],
          gates: [
            {
              name: "Demand forecast validated by service leads",
              criteria:
                "Clinical and operational leaders have validated the demand forecast assumptions. Workforce requirements projections accepted.",
              order: 1,
            },
          ],
        },
        {
          name: "Gap Analysis & Strategy Development",
          description:
            "Compare current workforce supply to future demand. Develop strategies to close quantitative gaps, skill gaps, and distribution gaps.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Quantitative gap analysis (current vs needed per category)",
            "Skill gap analysis",
            "Geographic distribution gap analysis",
            "Strategy development per gap type (train, recruit, retain, redistribute, task shift)",
            "Task shifting opportunities (shift tasks to lower-cadre staff where safe)",
            "Diaspora engagement strategy (for Nigerian hospitals)",
          ],
          keyDeliverables: [
            "Workforce Gap Analysis",
            "Workforce Strategy",
            "Task Shifting Opportunities",
            "Diaspora Engagement Plan",
          ],
          gates: [],
        },
        {
          name: "Workforce Development Plan",
          description:
            "Develop concrete plans for training, recruitment, retention, and leadership pipelines to address identified gaps.",
          order: 4,
          typicalWeeks: 4,
          keyActivities: [
            "Training and education programme design",
            "Recruitment strategy and sourcing plan",
            "Retention programme design (pay, career development, working conditions)",
            "Leadership pipeline development",
            "Performance management system design",
            "Workforce monitoring and reporting system",
          ],
          keyDeliverables: [
            "Training and Education Plan",
            "Recruitment Plan",
            "Retention Programme",
            "Leadership Pipeline Plan",
            "Workforce Monitoring Dashboard",
          ],
          gates: [],
        },
        {
          name: "Implementation & Monitoring",
          description:
            "Execute the workforce plan. Track progress against targets quarterly and adjust as circumstances change.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "Year 1 workforce plan execution",
            "Quarterly workforce metrics review",
            "Annual workforce plan refresh",
            "Budget alignment (workforce is typically 60-70% of hospital costs)",
          ],
          keyDeliverables: [
            "Year 1 Workforce Plan",
            "Quarterly Workforce Metrics Report",
            "Annual Plan Refresh",
          ],
          gates: [
            {
              name: "Critical workforce gaps addressed in year 1",
              criteria:
                "Year 1 workforce plan completed. Critical positions (CMO, CNO, senior clinicians) filled. Training programme for priority gaps launched.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── HEALTH ECONOMICS ─────────────────────────────────────────────────────
    {
      name: "Disease Burden Analysis",
      slug: "disease-burden-analysis",
      description:
        "Quantifies the impact of diseases and risk factors on a population using DALYs (Disability-Adjusted Life Years) or other burden metrics. Based on the Global Burden of Disease (GBD) methodology developed by the Institute for Health Metrics and Evaluation (IHME). Essential for setting health priorities, allocating resources, and designing cost-effective interventions in African health systems.",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS", "CLINICAL_GOVERNANCE"],
      estimatedWeeks: 16,
      sortOrder: 35,
      phases: [
        {
          name: "Study Design & Data Inventory",
          description:
            "Define the geographic scope and conditions to analyse. Inventory all available data sources.",
          order: 1,
          typicalWeeks: 2,
          keyActivities: [
            "Geographic scope definition (national, state, LGA level)",
            "Conditions and risk factors selection",
            "Data source inventory (vital registration, surveys, health facility data, literature)",
            "Data quality assessment",
            "GBD cause list adaptation for local context",
          ],
          keyDeliverables: [
            "Study Protocol",
            "Data Inventory",
            "Conditions List",
          ],
          gates: [],
        },
        {
          name: "Mortality Estimation (YLL)",
          description:
            "Estimate cause-specific mortality rates and the Years of Life Lost (YLL) attributable to each condition.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "All-cause mortality estimation (indirect methods if vital registration incomplete)",
            "Cause-of-death data analysis",
            "Verbal autopsy data analysis (where direct cause-of-death data absent)",
            "Age-sex-cause mortality rate estimation",
            "YLL calculation (deaths × standard life expectancy)",
          ],
          keyDeliverables: [
            "Cause-Specific Mortality Rates",
            "YLL Estimates by Cause",
            "Mortality Data Quality Assessment",
          ],
          gates: [],
        },
        {
          name: "Morbidity Estimation (YLD)",
          description:
            "Estimate the prevalence and severity of non-fatal outcomes for each condition to calculate Years Lived with Disability (YLD).",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "Prevalence and incidence estimation from surveys and clinical data",
            "Disability weight identification (GBD disability weight database)",
            "Duration of conditions estimation",
            "YLD calculation (prevalence × disability weight × duration)",
          ],
          keyDeliverables: [
            "Prevalence and Incidence Estimates",
            "YLD Estimates by Condition",
          ],
          gates: [],
        },
        {
          name: "DALY Calculation & Attribution",
          description:
            "Combine YLL and YLD into total DALYs. Attribute DALYs to risk factors for informing prevention strategy.",
          order: 4,
          typicalWeeks: 3,
          keyActivities: [
            "Total DALY calculation (YLL + YLD) by cause, age, sex",
            "Risk factor attribution (comparative risk assessment)",
            "Top 10 causes of DALYs ranking",
            "Risk factor contribution to DALYs",
            "Temporal trends analysis (is burden increasing or decreasing?)",
          ],
          keyDeliverables: [
            "DALY Estimates (total, by cause, by risk factor)",
            "Disease Burden Ranking",
            "Risk Factor Attribution Analysis",
          ],
          gates: [
            {
              name: "Estimates reviewed by technical advisory group",
              criteria:
                "DALY estimates reviewed by external technical advisory group. Uncertainty ranges acceptable. Ready for policy dissemination.",
              order: 1,
            },
          ],
        },
        {
          name: "Policy Translation & Dissemination",
          description:
            "Translate burden estimates into actionable health priorities and communicate findings to policymakers, funders, and the public.",
          order: 5,
          typicalWeeks: 3,
          keyActivities: [
            "Priority condition identification for investment",
            "Policy brief development (one per key audience)",
            "Investment case development (link burden to cost-effective interventions)",
            "Stakeholder dissemination events",
            "Media and public communication",
            "GBD data submission (for inclusion in global estimates)",
          ],
          keyDeliverables: [
            "Disease Burden Report",
            "Policy Briefs",
            "Investment Case",
            "Stakeholder Presentation Materials",
          ],
          gates: [
            {
              name: "Findings formally endorsed by Ministry of Health",
              criteria:
                "Ministry of Health or equivalent authority has accepted the disease burden findings as official estimates. Cited in national health planning documents.",
              order: 1,
            },
          ],
        },
      ],
    },
    {
      name: "Health Financing Assessment",
      slug: "health-financing-assessment",
      description:
        "A comprehensive analysis of a country's or health system's financing arrangements covering revenue collection, risk pooling, purchasing, and financial protection. Based on WHO National Health Accounts (NHA) methodology and health financing strategy frameworks. Produces evidence to guide health financing reform — including improving NHIA/NHIS coverage in Nigeria and expanding fiscal space for health.",
      category: "Health Economics",
      serviceTypes: ["HEALTH_SYSTEMS"],
      estimatedWeeks: 20,
      sortOrder: 36,
      phases: [
        {
          name: "NHA & Expenditure Mapping",
          description:
            "Map where health financing comes from (sources), how it is pooled, and how it flows to service providers. Produce National Health Accounts estimates.",
          order: 1,
          typicalWeeks: 5,
          keyActivities: [
            "Health expenditure data collection (government budgets, household surveys, donor flows)",
            "NHA framework application (System of Health Accounts 2011 methodology)",
            "Expenditure by financing source (government, OOP, insurance, donors)",
            "Expenditure by function (inpatient, outpatient, preventive, admin)",
            "Expenditure by provider (hospitals, clinics, pharmacies)",
            "Out-of-pocket spending and catastrophic expenditure estimation",
          ],
          keyDeliverables: [
            "National Health Accounts Estimates",
            "Health Expenditure Report",
            "OOP and Catastrophic Expenditure Analysis",
          ],
          gates: [],
        },
        {
          name: "Coverage & Financial Protection Assessment",
          description:
            "Assess how many people are covered by pre-payment schemes and the depth of financial protection they receive.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Health insurance coverage analysis (formal, informal, NHIS, private HMO)",
            "Benefit package analysis (what is covered?)",
            "Financial protection metrics: incidence of catastrophic health expenditure",
            "Impoverishment analysis (how many pushed into poverty by health costs?)",
            "Equity in coverage (who is covered? who is not?)",
          ],
          keyDeliverables: [
            "Coverage Assessment Report",
            "Catastrophic Expenditure Metrics",
            "Equity in Coverage Analysis",
          ],
          gates: [],
        },
        {
          name: "Fiscal Space Analysis",
          description:
            "Assess the potential to increase public health financing through multiple fiscal space levers.",
          order: 3,
          typicalWeeks: 4,
          keyActivities: [
            "GDP and government revenue trend analysis",
            "Health budget share analysis and benchmarking (Abuja Declaration: 15% of national budget)",
            "Sin taxes and earmarked taxation potential (tobacco, alcohol, sugary drinks)",
            "Aid and donor resource potential",
            "Efficiency gains (how much more health can be bought with existing budget?)",
            "External debt and borrowing capacity",
          ],
          keyDeliverables: [
            "Fiscal Space Report",
            "Fiscal Space Levers Assessment",
            "Public Finance for Health Recommendations",
          ],
          gates: [],
        },
        {
          name: "Strategic Options & Reform Recommendations",
          description:
            "Synthesise findings into a coherent health financing strategy with reform options, implementation sequencing, and financing projections.",
          order: 4,
          typicalWeeks: 5,
          keyActivities: [
            "Health financing strategy options development",
            "Reform pathway modelling (coverage expansion, benefit package, provider payment)",
            "Financial projections (cost of reaching UHC targets)",
            "Political economy analysis (what reforms are feasible?)",
            "Stakeholder consultation on reform options",
            "Final strategy recommendation",
          ],
          keyDeliverables: [
            "Health Financing Strategy Report",
            "Reform Options Matrix",
            "UHC Financing Projections",
            "Political Economy Analysis",
          ],
          gates: [
            {
              name: "Health financing strategy endorsed by government",
              criteria:
                "Ministry of Finance and Ministry of Health have endorsed the health financing strategy. Reform implementation plan approved.",
              order: 1,
            },
          ],
        },
        {
          name: "Monitoring & Evaluation",
          description:
            "Establish annual health expenditure tracking and health financing reform monitoring systems.",
          order: 5,
          typicalWeeks: 2,
          keyActivities: [
            "NHA institutionalisation (annual production capacity building)",
            "Health financing M&E indicators selection",
            "Tracking system design",
            "Annual review process establishment",
          ],
          keyDeliverables: [
            "NHA Institutionalisation Plan",
            "Health Financing M&E Framework",
            "Annual Review Schedule",
          ],
          gates: [],
        },
      ],
    },
    // ── PUBLIC HEALTH ─────────────────────────────────────────────────────────
    {
      name: "Community Health Needs Assessment",
      slug: "community-health-needs-assessment",
      description:
        "A systematic process for identifying and analysing health needs, assets, and priorities in a defined geographic community. Combines quantitative data (epidemiology, mortality, health service utilisation) with qualitative input (community voice, stakeholder perspectives). Required by the US IRS for non-profit hospitals every 3 years, and best practice for any hospital seeking to demonstrate community benefit. Highly relevant for Nigerian state and LGA health planning.",
      category: "Public Health & M&E",
      serviceTypes: ["HEALTH_SYSTEMS", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 12,
      sortOrder: 37,
      phases: [
        {
          name: "Scope & Secondary Data Review",
          description:
            "Define the community and gather existing data on health status, demographics, and health service availability.",
          order: 1,
          typicalWeeks: 3,
          keyActivities: [
            "Community boundary definition (geographic, population)",
            "Demographic profile compilation",
            "Health status indicators review (mortality, morbidity, disease prevalence)",
            "Social determinants data (poverty, education, housing, water, sanitation)",
            "Existing health service inventory (what facilities exist, where, what do they offer?)",
            "Health service utilisation data (who uses what?)",
          ],
          keyDeliverables: [
            "Community Profile",
            "Health Status Indicator Report",
            "Social Determinants Analysis",
            "Health Service Inventory",
          ],
          gates: [],
        },
        {
          name: "Community Voice & Stakeholder Input",
          description:
            "Gather primary data on community perceptions of health needs, priorities, and barriers to care.",
          order: 2,
          typicalWeeks: 4,
          keyActivities: [
            "Community survey design and administration",
            "Focus group discussions (disaggregated by gender, age, socioeconomic group)",
            "Key informant interviews (community leaders, traditional healers, faith leaders, CHWs)",
            "Vulnerable population consultations (disabled, elderly, women, youth)",
            "Assets mapping (what community strengths and resources exist?)",
          ],
          keyDeliverables: [
            "Community Survey Data",
            "Focus Group Discussion Summaries",
            "Key Informant Interview Summaries",
            "Community Assets Map",
          ],
          gates: [],
        },
        {
          name: "Analysis & Priority Setting",
          description:
            "Synthesise quantitative and qualitative data. Identify and prioritise the most significant community health needs.",
          order: 3,
          typicalWeeks: 3,
          keyActivities: [
            "Data triangulation (align quantitative and qualitative findings)",
            "Health needs prioritisation (using weighted criteria: prevalence, severity, community concern, feasibility to address)",
            "Health equity lens application (who is most affected?)",
            "Stakeholder validation workshop",
            "Top 3-5 priority health needs selection",
          ],
          keyDeliverables: [
            "Priority Health Needs List",
            "Prioritisation Criteria and Scoring",
            "Equity Analysis",
          ],
          gates: [
            {
              name: "Priority needs validated by community stakeholders",
              criteria:
                "Priority health needs validated in a multi-stakeholder community workshop. Priorities reflect both data evidence and community voice.",
              order: 1,
            },
          ],
        },
        {
          name: "Implementation Strategy & CHNA Report",
          description:
            "Develop an implementation strategy responding to priority needs. Produce the final CHNA report for public dissemination.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "Community Health Improvement Plan (CHIP) development",
            "Partner identification and partnership strategy",
            "Resource mobilisation plan",
            "CHNA report writing (public document)",
            "CHNA public dissemination",
            "Progress monitoring framework",
          ],
          keyDeliverables: [
            "CHNA Full Report",
            "Community Health Improvement Plan (CHIP)",
            "Progress Monitoring Framework",
          ],
          gates: [
            {
              name: "CHNA report publicly released",
              criteria:
                "Final CHNA report published on hospital or government website. Community Health Improvement Plan launched. Partner commitments documented.",
              order: 1,
            },
          ],
        },
      ],
    },
    // ── FEASIBILITY ──────────────────────────────────────────────────────────
    {
      name: "Public-Private Partnership Structuring",
      slug: "ppp-structuring",
      description:
        "A structured methodology for designing, appraising, and negotiating Public-Private Partnership (PPP) transactions in healthcare. Covers PPP model selection, value-for-money assessment, risk allocation, contract design, and transaction management. Highly relevant for Nigerian state governments seeking private investment in public hospitals, diagnostic centres, and health infrastructure. Based on World Bank, IFC, and AfDB PPP frameworks.",
      category: "Feasibility",
      serviceTypes: ["HEALTH_SYSTEMS", "HOSPITAL_OPERATIONS"],
      estimatedWeeks: 26,
      sortOrder: 38,
      phases: [
        {
          name: "PPP Options Appraisal",
          description:
            "Assess whether a PPP is the right delivery model. Evaluate PPP options against conventional public procurement.",
          order: 1,
          typicalWeeks: 4,
          keyActivities: [
            "Project description and scope",
            "PPP model options identification (Design-Build-Finance-Operate, concession, management contract, etc.)",
            "Value for Money (VfM) analysis vs public procurement",
            "Public Sector Comparator (PSC) development",
            "Risk identification and preliminary allocation",
            "Government appetite and capacity assessment",
            "Legal framework review (PPP Act, enabling legislation)",
          ],
          keyDeliverables: [
            "PPP Options Assessment Report",
            "Value for Money Analysis",
            "Preliminary Risk Matrix",
            "Go / No-Go Recommendation for PPP Approach",
          ],
          gates: [
            {
              name: "Government confirms PPP is preferred approach",
              criteria:
                "Ministry of Health and Ministry of Finance have confirmed PPP as preferred procurement approach. PPP unit or transaction advisor appointed.",
              order: 1,
            },
          ],
        },
        {
          name: "Project Preparation",
          description:
            "Prepare the project fully: technical specifications, financial model, risk allocation framework, and draft contract.",
          order: 2,
          typicalWeeks: 8,
          keyActivities: [
            "Output specification development (what services must the private partner deliver?)",
            "Detailed financial model (PPP project finance structure, equity/debt)",
            "Risk register and allocation framework (which party bears which risk?)",
            "Performance framework (KPIs, payment mechanism, deductions)",
            "Draft PPP contract preparation",
            "Environmental and social impact assessment",
            "Land and infrastructure readiness",
          ],
          keyDeliverables: [
            "Output Specification",
            "PPP Financial Model",
            "Risk Allocation Matrix",
            "Performance Framework",
            "Draft PPP Contract",
          ],
          gates: [
            {
              name: "Project preparation documents approved for market",
              criteria:
                "Output specification, financial model, risk matrix, and draft contract approved by government PPP committee. Project ready for market testing.",
              order: 1,
            },
          ],
        },
        {
          name: "Procurement & Bidding",
          description:
            "Run a competitive procurement process to select the private partner. Evaluate bids and negotiate final terms.",
          order: 3,
          typicalWeeks: 12,
          keyActivities: [
            "Request for Qualifications (RFQ) — prequalify bidders",
            "Request for Proposals (RFP) issuance",
            "Bidder clarification meetings and site visits",
            "Bid evaluation (technical + financial)",
            "Preferred bidder announcement",
            "Commercial and financial close negotiations",
            "Contract signing",
          ],
          keyDeliverables: [
            "RFQ and RFP Documents",
            "Bid Evaluation Report",
            "Negotiated Final PPP Contract",
          ],
          gates: [
            {
              name: "Financial close achieved",
              criteria:
                "PPP contract signed. Private partner has achieved financial close (debt and equity committed). Implementation period begins.",
              order: 1,
            },
          ],
        },
        {
          name: "Contract Management",
          description:
            "Manage the PPP contract throughout its operational life. Monitor performance, manage disputes, and enforce contractual obligations.",
          order: 4,
          typicalWeeks: 2,
          keyActivities: [
            "PPP contract management unit setup",
            "Performance monitoring framework operationalisation",
            "Monthly performance reporting",
            "Payment deductions and incentive management",
            "Dispute resolution procedures",
            "Periodic contract review and renegotiation (where warranted)",
          ],
          keyDeliverables: [
            "Contract Management Manual",
            "Performance Monitoring System",
            "Dispute Resolution Protocol",
          ],
          gates: [
            {
              name: "Operational monitoring system live",
              criteria:
                "Contract management unit staffed and operational. Performance monitoring system live. First performance report produced within 90 days of contract start.",
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
      name: "CAGE Distance Framework",
      slug: "cage-framework",
      description:
        "Pankaj Ghemawat's framework for assessing the 'distance' between a home and target market across Cultural, Administrative, Geographic, and Economic dimensions. Used to evaluate international expansion or market entry decisions. Particularly valuable for African hospital groups, health tech companies, and pharmaceutical distributors considering cross-border expansion.",
      category: "Strategic Analysis",
      dimensions: [
        "Cultural Distance (language, religion, values, social norms)",
        "Administrative Distance (colonial history, trade agreements, governance, regulation)",
        "Geographic Distance (physical distance, time zones, infrastructure, landlocked)",
        "Economic Distance (income levels, consumer purchasing power, infrastructure quality)",
      ],
      guideText:
        "Score each dimension (Low / Medium / High distance) for your target market vs home market. High distance on any dimension adds cost, risk, and complexity to market entry. Healthcare specific: Administrative distance includes HEFAMAA vs KFDA vs NAFDAC licensing requirements; Economic distance affects willingness-to-pay and appropriate service model. High distance doesn't mean don't enter — it means plan for the distance. Nigerian healthcare companies expanding to Kenya or Ghana typically face Low cultural, Medium administrative, and Low economic distance.",
      sortOrder: 36,
    },
    {
      name: "Balanced Scorecard Strategy Map",
      slug: "strategy-map",
      description:
        "The Strategy Map is the visual companion to the Balanced Scorecard. It shows how strategic objectives across the four BSC perspectives (Financial, Customer, Internal Process, Learning & Growth) connect through cause-and-effect relationships. A completed strategy map is a one-page visual that tells the story of how the organisation creates value.",
      category: "Strategic Analysis",
      dimensions: [
        "Financial Perspective (how do we look to shareholders/funders?)",
        "Customer Perspective (how do we look to patients and payers?)",
        "Internal Process Perspective (what processes must we excel at?)",
        "Learning & Growth Perspective (how do we learn, improve, and grow our people?)",
      ],
      guideText:
        "Build bottom-up when CREATING strategy (L&G enables Processes, which enable Customer outcomes, which deliver Financial results). Present top-down when COMMUNICATING strategy. Cause-and-effect logic check: 'If we [L&G objective], then we will [Process objective], which means [Customer outcome], resulting in [Financial result].' Healthcare example: IF staff are trained in patient-centred care (L&G) THEN clinical protocols improve (Processes) THEN patient satisfaction rises (Customer) THEN HMO contract renewals improve (Financial).",
      sortOrder: 37,
    },
    {
      name: "Social Return on Investment (SROI)",
      slug: "sroi",
      description:
        "SROI is an extension of cost-benefit analysis that captures social, environmental, and economic value created by a program or organisation — including value that doesn't appear in conventional financial accounts. Expresses all outcomes in monetary terms to compute a SROI ratio. Used by social enterprises, NGOs, impact investors, and public health programs seeking to demonstrate broader social value.",
      category: "Health Economics",
      dimensions: [
        "Stakeholder Identification (who is affected, positively or negatively?)",
        "Mapping Outcomes (what changes for each stakeholder?)",
        "Evidencing Outcomes (how do we know change happened?)",
        "Establishing Deadweight & Attribution (would it have happened anyway?)",
        "Calculating Value (monetising each outcome using proxy values)",
        "SROI Ratio (total present value of outcomes / total investment)",
      ],
      guideText:
        "SROI process: (1) Scope: which stakeholders, which outcomes, what time period? (2) Map: activity → output → outcome for each stakeholder. (3) Evidence: measure each outcome with credible data. (4) Monetise: use financial proxies (willingness-to-pay, cost savings, government transfer values). (5) Deadweight: subtract outcomes that would have happened without the intervention. (6) Calculate: SROI ratio. Ratio >1 means more value created than invested. Healthcare example: a community nutrition program spends $100k and generates $450k in value (reduced hospitalisations + productivity gains + education benefits) → SROI = 4.5.",
      sortOrder: 38,
    },
    {
      name: "Epidemiological Transition Framework",
      slug: "epidemiological-transition",
      description:
        "Abdel Omran's Epidemiological Transition theory and its application to African health systems. Describes the shift from high mortality (infectious disease, malnutrition, maternal mortality) to chronic non-communicable disease as countries develop economically. African countries face the 'double burden' — simultaneous NCDs and communicable disease. Essential for national health priority setting.",
      category: "Public Health & M&E",
      dimensions: [
        "Stage 1: Pestilence and Famine (infectious disease, malnutrition, maternal mortality dominant)",
        "Stage 2: Receding Pandemics (declining infectious mortality, early NCD emergence)",
        "Stage 3: Degenerative and Man-Made Diseases (NCDs dominant)",
        "Stage 4: Delayed Degenerative Diseases (lifestyle improvements delay NCD onset)",
        "Double Burden (Africa): Infectious + NCD simultaneously",
        "Risk Factor Transition (physical inactivity, diet, tobacco, alcohol rising with urbanisation)",
      ],
      guideText:
        "Nigeria is in an accelerating transition — still carrying significant HIV, TB, malaria, and maternal mortality burden while NCD burden (hypertension, diabetes, cancers) is rapidly growing. Use this framework to argue for dual-track investment: (1) complete the unfinished agenda of infectious disease and MCH, while (2) building NCD infrastructure now, before the full transition arrives. Private hospitals should be investing in NCDs now — they are the growth market of the next 20 years in Nigeria.",
      sortOrder: 39,
    },
    {
      name: "Health Impact Assessment (HIA)",
      slug: "health-impact-assessment",
      description:
        "HIA is a structured process to evaluate the potential health consequences of a proposed policy, project, or programme before it is implemented — with a focus on equity. Provides evidence to decision-makers to maximise positive health effects and minimise negative ones. Used for urban planning, infrastructure projects, agricultural policy, and trade agreements that affect health.",
      category: "Public Health & M&E",
      dimensions: [
        "Screening (does this proposal warrant a full HIA?)",
        "Scoping (what health determinants and populations are affected?)",
        "Assessment (what are the likely health impacts and who is affected?)",
        "Reporting (recommendations to maximise positive health outcomes)",
        "Monitoring (tracking actual health outcomes post-implementation)",
        "Health Equity Focus (differential impacts on vulnerable groups)",
      ],
      guideText:
        "HIA stages: Screening (quick: is there significant health impact?), Scoping (who is affected, what pathways, what data needed?), Assessment (quantitative + qualitative evidence), Reporting (evidence-based recommendations), Monitoring (post-hoc tracking). Health pathways to assess: direct physical impact, service access changes, social and economic determinants, environmental changes. Nigerian applications: factory siting near residential areas, new road construction in rural areas (positive: improved access; negative: accident risk, pollution).",
      sortOrder: 40,
    },
    {
      name: "FMEA — Failure Mode & Effects Analysis",
      slug: "fmea",
      description:
        "Failure Mode and Effects Analysis (FMEA) is a systematic, proactive method for identifying potential failures in a process, system, or design before they occur. Prioritises failures by Risk Priority Number (RPN = Severity × Occurrence × Detectability). Mandated by JCI and other accreditation bodies for high-risk clinical processes. Prevents catastrophic patient safety events.",
      category: "Clinical",
      dimensions: [
        "Process Step (what is the step being analysed?)",
        "Failure Mode (how could this step go wrong?)",
        "Effect of Failure (what happens to the patient if it goes wrong?)",
        "Severity Score (1-10: how bad is the effect?)",
        "Cause of Failure (why would this failure occur?)",
        "Occurrence Score (1-10: how likely is the failure?)",
        "Current Controls (what prevents detection of failure?)",
        "Detectability Score (1-10: how likely is the failure to go undetected?)",
        "Risk Priority Number — RPN (Severity × Occurrence × Detectability)",
      ],
      guideText:
        "RPN scoring: Severity 9-10 = patient death or serious harm; Occurrence 9-10 = failure happens almost always; Detectability 9-10 = failure almost never detected. Focus on highest RPN failures AND any Severity 9-10 items regardless of RPN. Required for: medication administration (JCI MMU), surgery (JCI ASC), blood transfusion, patient identification. Target RPN reduction of at least 50% for high-priority failures through redesign. Run FMEA BEFORE implementing new high-risk processes, not after adverse events occur.",
      sortOrder: 41,
    },
    {
      name: "Priority Matrix (Impact vs Effort)",
      slug: "priority-matrix",
      description:
        "A simple 2×2 decision tool that plots initiatives, tasks, or projects on axes of Expected Impact (High/Low) and Implementation Effort (Low/High). Rapidly identifies Quick Wins (High Impact, Low Effort), Major Projects (High Impact, High Effort), Fill-Ins (Low Impact, Low Effort), and Thankless Tasks (Low Impact, High Effort to avoid). Universally applicable across any consulting engagement.",
      category: "Operational",
      dimensions: [
        "Quick Wins (High Impact, Low Effort) — Do immediately",
        "Major Projects (High Impact, High Effort) — Plan and prioritise",
        "Fill-Ins (Low Impact, Low Effort) — Do if time allows",
        "Thankless Tasks (Low Impact, High Effort) — Avoid / deprioritise",
      ],
      guideText:
        "Use at the end of any diagnostic or brainstorming phase to prioritise recommendations. Impact criteria: revenue effect, cost saving, clinical outcome improvement, strategic fit, patient experience improvement. Effort criteria: time to implement, cost, change management needed, dependencies. Place each initiative on the matrix. Quick Wins should form the first 90-day plan — they build credibility and momentum. Major Projects need business cases and dedicated project management. Avoid the trap of investing heavily in Thankless Tasks because they appear safe.",
      sortOrder: 42,
    },
    {
      name: "HRH Framework (Human Resources for Health)",
      slug: "hrh-framework",
      description:
        "The WHO Human Resources for Health framework analyses the workforce along six dimensions: availability, accessibility, acceptability, quality, coverage, and the enabling environment. Used to diagnose workforce crises and design strategies across the full health workforce lifecycle: education, recruitment, deployment, retention, and performance management.",
      category: "Organizational",
      dimensions: [
        "Availability (are enough health workers produced by education system?)",
        "Accessibility (are workers deployed where needed, including rural areas?)",
        "Acceptability (do communities trust and accept the health workers?)",
        "Quality (are workers competent, motivated, and supported?)",
        "Coverage (do health workers provide coverage for the entire population?)",
        "Enabling Environment (policies, regulation, leadership, management systems)",
      ],
      guideText:
        "For Nigeria: Availability is improving but maldistributed. Accessibility is severely compromised — most doctors are in urban centres, leaving rural populations underserved. Acceptability is generally high for community health workers. Quality is variable — training quality inconsistent, continuing professional development weak. Coverage is the outcome — measured as population per qualified health worker. The Enabling Environment includes the Medical and Dental Council, Nursing Council, and HEFAMAA — all critical regulators. Diaspora engagement cuts across Availability, Accessibility, and Quality dimensions.",
      sortOrder: 43,
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

  console.log("Final batch seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
