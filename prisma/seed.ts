import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean slate
  await prisma.consultantRating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.consultantProfile.deleteMany();
  await prisma.engagementManagerProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ─── Users ────────────────────────────────────────────────────────────────

  const debo = await prisma.user.upsert({
    where: { email: "debo.odulana@consultforafrica.com" },
    update: {},
    create: {
      email: "debo.odulana@consultforafrica.com",
      name: "Dr. Debo Odulana",
      passwordHash: await hash("password123"),
      role: "PARTNER",
    },
  });

  const funke = await prisma.user.upsert({
    where: { email: "funke@consultforafrica.com" },
    update: {},
    create: {
      email: "funke@consultforafrica.com",
      name: "Funke Adeyemi",
      passwordHash: await hash("password123"),
      role: "DIRECTOR",
    },
  });

  const chidi = await prisma.user.upsert({
    where: { email: "chidi@consultforafrica.com" },
    update: {},
    create: {
      email: "chidi@consultforafrica.com",
      name: "Chidi Okonkwo",
      passwordHash: await hash("password123"),
      role: "ENGAGEMENT_MANAGER",
      engagementManagerProfile: {
        create: {
          title: "Engagement Manager",
          bio: "Chidi brings 9 years of health systems experience across West Africa, with deep expertise in hospital operations and quality improvement.",
          yearsExperience: 9,
          maxProjects: 4,
        },
      },
    },
  });

  const amara = await prisma.user.upsert({
    where: { email: "amara@consultforafrica.com" },
    update: {},
    create: {
      email: "amara@consultforafrica.com",
      name: "Amara Nwosu",
      passwordHash: await hash("password123"),
      role: "ENGAGEMENT_MANAGER",
      engagementManagerProfile: {
        create: {
          title: "Senior Engagement Manager",
          bio: "Amara specialises in digital health and clinical governance, having led health tech implementations across Nigeria and Ghana.",
          yearsExperience: 7,
          maxProjects: 4,
        },
      },
    },
  });

  // ─── Consultants ──────────────────────────────────────────────────────────

  const tunde = await prisma.user.upsert({
    where: { email: "tunde.afolabi@consultforafrica.com" },
    update: {},
    create: {
      email: "tunde.afolabi@consultforafrica.com",
      name: "Tunde Afolabi",
      passwordHash: await hash("password123"),
      role: "CONSULTANT",
      consultantProfile: {
        create: {
          title: "Senior Hospital Operations Consultant",
          bio: "Former COO of a 400-bed private hospital in Lagos. Specialist in OPD flow, bed management, and cost reduction.",
          location: "Lagos, Nigeria",
          isDiaspora: false,
          expertiseAreas: ["Hospital Operations", "Process Improvement", "Cost Reduction"],
          yearsExperience: 14,
          tier: "ELITE",
          monthlyRateNGN: 1800000,
          currency: "NGN",
          availabilityStatus: "AVAILABLE",
          hoursPerWeek: 40,
          averageRating: 4.8,
          totalProjects: 11,
        },
      },
    },
  });

  const ngozi = await prisma.user.upsert({
    where: { email: "ngozi.eze@consultforafrica.com" },
    update: {},
    create: {
      email: "ngozi.eze@consultforafrica.com",
      name: "Dr. Ngozi Eze",
      passwordHash: await hash("password123"),
      role: "CONSULTANT",
      consultantProfile: {
        create: {
          title: "Clinical Governance Lead",
          bio: "Physician turned healthcare consultant. Former medical director with expertise in clinical audit, patient safety, and accreditation.",
          location: "Abuja, Nigeria",
          isDiaspora: false,
          expertiseAreas: ["Clinical Governance", "Patient Safety", "Accreditation"],
          yearsExperience: 12,
          tier: "ELITE",
          monthlyRateNGN: 2000000,
          currency: "NGN",
          availabilityStatus: "PARTIALLY_AVAILABLE",
          hoursPerWeek: 20,
          averageRating: 4.9,
          totalProjects: 8,
        },
      },
    },
  });

  const kemi = await prisma.user.upsert({
    where: { email: "kemi.adeleke@consultforafrica.com" },
    update: {},
    create: {
      email: "kemi.adeleke@consultforafrica.com",
      name: "Kemi Adeleke",
      passwordHash: await hash("password123"),
      role: "CONSULTANT",
      consultantProfile: {
        create: {
          title: "Revenue Cycle Specialist",
          bio: "10 years in healthcare finance across Nigeria and South Africa. Expert in billing optimisation, NHIS claims, and revenue leakage.",
          location: "Lagos, Nigeria",
          isDiaspora: false,
          expertiseAreas: ["Revenue Cycle", "NHIS", "Healthcare Finance"],
          yearsExperience: 10,
          tier: "EXPERIENCED",
          monthlyRateNGN: 1400000,
          currency: "NGN",
          availabilityStatus: "AVAILABLE",
          hoursPerWeek: 40,
          averageRating: 4.6,
          totalProjects: 7,
        },
      },
    },
  });

  const david = await prisma.user.upsert({
    where: { email: "david.osei@consultforafrica.com" },
    update: {},
    create: {
      email: "david.osei@consultforafrica.com",
      name: "Dr. David Osei",
      passwordHash: await hash("password123"),
      role: "CONSULTANT",
      consultantProfile: {
        create: {
          title: "Digital Health Architect",
          bio: "NHS-trained informatician now focused on Africa. Led EMR implementations in Ghana, Nigeria and Kenya. Based in London.",
          location: "London, UK",
          isDiaspora: true,
          expertiseAreas: ["EMR Implementation", "Health IT", "Digital Strategy"],
          yearsExperience: 11,
          tier: "ELITE",
          hourlyRateUSD: 180,
          currency: "USD",
          availabilityStatus: "AVAILABLE",
          hoursPerWeek: 30,
          averageRating: 4.7,
          totalProjects: 9,
        },
      },
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah.mensah@consultforafrica.com" },
    update: {},
    create: {
      email: "sarah.mensah@consultforafrica.com",
      name: "Sarah Mensah",
      passwordHash: await hash("password123"),
      role: "CONSULTANT",
      consultantProfile: {
        create: {
          title: "Health Systems Strengthening Advisor",
          bio: "MPH from Johns Hopkins. Worked with WHO and USAID on primary care reform across Sub-Saharan Africa. Based in Washington DC.",
          location: "Washington DC, USA",
          isDiaspora: true,
          expertiseAreas: ["Health Systems", "Primary Care", "Donor-funded Programs"],
          yearsExperience: 8,
          tier: "EXPERIENCED",
          hourlyRateUSD: 150,
          currency: "USD",
          availabilityStatus: "AVAILABLE",
          hoursPerWeek: 40,
          averageRating: 4.5,
          totalProjects: 5,
        },
      },
    },
  });

  // ─── Clients ──────────────────────────────────────────────────────────────

  const lagoon = await prisma.client.create({
    data: {
      name: "Lagoon Hospitals",
      type: "PRIVATE_ELITE",
      primaryContact: "Dr. Adaeze Oreh",
      email: "ceo@lagoonhospitals.com",
      phone: "+234 1 270 4444",
      address: "1 Layi Yusuf Crescent, Ikeja GRA, Lagos",
      paymentTerms: 30,
      currency: "NGN",
      status: "ACTIVE",
      creditScore: 5,
      notes: "Tier 1 private hospital group. Prompt payer. Key strategic account.",
    },
  });

  const eko = await prisma.client.create({
    data: {
      name: "Eko Hospital & Specialist Centre",
      type: "PRIVATE_MIDTIER",
      primaryContact: "Mr. Babatunde Ogun",
      email: "admin@ekohospital.com",
      phone: "+234 1 740 0440",
      address: "Plot 1 Eko Hospital Road, Ikeja, Lagos",
      paymentTerms: 45,
      currency: "NGN",
      status: "ACTIVE",
      creditScore: 3,
      notes: "Revenue cycle project. Payment has been slightly slow. Watch payment terms.",
    },
  });

  const riversState = await prisma.client.create({
    data: {
      name: "Rivers State Primary Health Care Management Board",
      type: "GOVERNMENT",
      primaryContact: "Dr. Princewill Nwiloh",
      email: "dg@riversphc.gov.ng",
      phone: "+234 84 230 450",
      address: "Peter Odili Road, Port Harcourt, Rivers State",
      paymentTerms: 60,
      currency: "NGN",
      status: "ACTIVE",
      creditScore: 2,
      notes: "Government client. Payment tied to quarterly budget releases. Build in 60-day payment buffer. Good political support from Commissioner.",
    },
  });

  const chai = await prisma.client.create({
    data: {
      name: "Clinton Health Access Initiative (CHAI) Nigeria",
      type: "DEVELOPMENT",
      primaryContact: "Ifeoma Obi",
      email: "nigeria@clintonhealth.org",
      phone: "+234 9 461 7000",
      address: "Plot 1261 Cadastral Zone, Jabi, Abuja",
      paymentTerms: 30,
      currency: "USD",
      status: "ACTIVE",
      creditScore: 5,
      notes: "Development partner. USD-denominated contracts. Grant-funded so requires strict deliverables documentation.",
    },
  });

  // ─── Projects ─────────────────────────────────────────────────────────────

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // Project 1: Lagoon Turnaround — ACTIVE, healthy
  const lagoonProject = await prisma.project.create({
    data: {
      clientId: lagoon.id,
      engagementManagerId: chidi.id,
      name: "Lagoon Hospitals OPD & Theatre Turnaround",
      description:
        "Full operational turnaround of Lagoon's flagship Ikeja campus. Focus areas: OPD patient flow (targeting 30% wait time reduction), theatre utilisation (from 58% to 80%), and bed management protocol redesign.",
      serviceType: "TURNAROUND",
      startDate: daysAgo(75),
      endDate: daysFromNow(90),
      status: "ACTIVE",
      budgetAmount: 48000000,
      budgetCurrency: "NGN",
      actualSpent: 22400000,
      healthScore: 4,
      riskLevel: "LOW",
    },
  });

  // Project 2: Eko Revenue Cycle — AT_RISK
  const ekoProject = await prisma.project.create({
    data: {
      clientId: eko.id,
      engagementManagerId: chidi.id,
      name: "Eko Hospital Revenue Cycle Optimisation",
      description:
        "Comprehensive revenue cycle review and implementation. Scope includes billing audit, NHIS claims clean-up, credit control process redesign, and finance team capacity building.",
      serviceType: "HOSPITAL_OPERATIONS",
      startDate: daysAgo(45),
      endDate: daysFromNow(75),
      status: "AT_RISK",
      budgetAmount: 22000000,
      budgetCurrency: "NGN",
      actualSpent: 14800000,
      healthScore: 2,
      riskLevel: "HIGH",
      notes:
        "Client has been slow to provide finance data access. CFO change mid-project caused 2-week delay. Escalation meeting with MD scheduled.",
    },
  });

  // Project 3: Rivers State PHC — AT_RISK/CRITICAL
  const riversProject = await prisma.project.create({
    data: {
      clientId: riversState.id,
      engagementManagerId: amara.id,
      name: "Rivers State PHC Revitalisation Programme",
      description:
        "State-wide assessment and revitalisation of 120 primary health centres across Rivers State. Phase 1: diagnostic audit of 40 PHCs. Phase 2: infrastructure gap analysis. Phase 3: staff retraining and clinical protocol standardisation.",
      serviceType: "HEALTH_SYSTEMS",
      startDate: daysAgo(90),
      endDate: daysFromNow(180),
      status: "AT_RISK",
      budgetAmount: 85000000,
      budgetCurrency: "NGN",
      actualSpent: 51000000,
      healthScore: 2,
      riskLevel: "CRITICAL",
      notes:
        "Security concerns in Ogoniland delayed Phase 1 audit by 3 weeks. Government budget freeze threatened milestone payments. Now resolved but team morale affected.",
    },
  });

  // Project 4: CHAI Health Systems — PLANNING
  const chaiProject = await prisma.project.create({
    data: {
      clientId: chai.id,
      engagementManagerId: amara.id,
      name: "CHAI Nigeria Health Systems Advisory",
      description:
        "Technical advisory support to CHAI Nigeria on health financing reform. Deliverables include a state-level costing model, BHCPF implementation roadmap, and PHC governance framework.",
      serviceType: "HEALTH_SYSTEMS",
      startDate: daysFromNow(14),
      endDate: daysFromNow(180),
      status: "PLANNING",
      budgetAmount: 280000,
      budgetCurrency: "USD",
      actualSpent: 0,
      healthScore: 5,
      riskLevel: "LOW",
    },
  });

  // ─── Assignments ──────────────────────────────────────────────────────────

  const lagoonAssign1 = await prisma.assignment.create({
    data: {
      projectId: lagoonProject.id,
      consultantId: tunde.id,
      role: "Lead Operations Consultant",
      responsibilities:
        "Own OPD redesign and theatre utilisation stream. Weekly progress reports to EM. Direct interface with hospital COO.",
      startDate: daysAgo(75),
      status: "ACTIVE",
      rateAmount: 1800000,
      rateCurrency: "NGN",
      rateType: "MONTHLY",
      estimatedHours: 160,
    },
  });

  const lagoonAssign2 = await prisma.assignment.create({
    data: {
      projectId: lagoonProject.id,
      consultantId: ngozi.id,
      role: "Clinical Governance Advisor",
      responsibilities:
        "Review clinical protocols, support JCI preparation, conduct ward rounds with clinical teams.",
      startDate: daysAgo(60),
      status: "ACTIVE",
      rateAmount: 800000,
      rateCurrency: "NGN",
      rateType: "MONTHLY",
      estimatedHours: 80,
    },
  });

  const ekoAssign1 = await prisma.assignment.create({
    data: {
      projectId: ekoProject.id,
      consultantId: kemi.id,
      role: "Revenue Cycle Lead",
      responsibilities:
        "Lead billing audit, NHIS reconciliation, and credit control redesign. Train finance team on new processes.",
      startDate: daysAgo(45),
      status: "ACTIVE",
      rateAmount: 1400000,
      rateCurrency: "NGN",
      rateType: "MONTHLY",
      estimatedHours: 160,
    },
  });

  const riversAssign1 = await prisma.assignment.create({
    data: {
      projectId: riversProject.id,
      consultantId: sarah.id,
      role: "Health Systems Lead",
      responsibilities:
        "Lead PHC diagnostic methodology, coordinate field team, produce phase reports, liaise with SPHCMB technical team.",
      startDate: daysAgo(90),
      status: "ACTIVE",
      rateAmount: 150,
      rateCurrency: "USD",
      rateType: "HOURLY",
      estimatedHours: 400,
    },
  });

  const chaiAssign1 = await prisma.assignment.create({
    data: {
      projectId: chaiProject.id,
      consultantId: david.id,
      role: "Digital Health & Data Advisor",
      responsibilities:
        "Design costing model architecture, lead data collection framework, produce health financing analytics.",
      startDate: daysFromNow(14),
      status: "PENDING",
      rateAmount: 180,
      rateCurrency: "USD",
      rateType: "HOURLY",
      estimatedHours: 300,
    },
  });

  // ─── Milestones ───────────────────────────────────────────────────────────

  // Lagoon milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: lagoonProject.id,
        name: "Baseline Assessment Complete",
        description: "Full operational baseline documented across OPD, theatres, wards, and pharmacy.",
        dueDate: daysAgo(55),
        status: "COMPLETED",
        completionDate: daysAgo(57),
        order: 1,
      },
      {
        projectId: lagoonProject.id,
        name: "Redesigned OPD Flow Live",
        description: "New patient journey protocols implemented and staff trained. KPI dashboards activated.",
        dueDate: daysAgo(10),
        status: "COMPLETED",
        completionDate: daysAgo(8),
        order: 2,
      },
      {
        projectId: lagoonProject.id,
        name: "Theatre Utilisation Improvement",
        description: "Theatre scheduling optimised. Target: utilisation rate above 75%.",
        dueDate: daysFromNow(30),
        status: "IN_PROGRESS",
        order: 3,
      },
      {
        projectId: lagoonProject.id,
        name: "Final Report & Handover",
        description: "Full project report, playbooks, and capability handover to hospital leadership.",
        dueDate: daysFromNow(85),
        status: "PENDING",
        order: 4,
      },
    ],
  });

  // Eko milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: ekoProject.id,
        name: "Billing Audit Complete",
        description: "Full audit of 12-month billing records. Leakage quantified.",
        dueDate: daysAgo(15),
        status: "DELAYED",
        order: 1,
      },
      {
        projectId: ekoProject.id,
        name: "NHIS Claims Reconciliation",
        description: "All outstanding NHIS claims identified, categorised, and submitted.",
        dueDate: daysFromNow(20),
        status: "IN_PROGRESS",
        order: 2,
      },
      {
        projectId: ekoProject.id,
        name: "Revenue Cycle Process Redesign",
        description: "New end-to-end revenue cycle processes documented, approved, and team trained.",
        dueDate: daysFromNow(60),
        status: "PENDING",
        order: 3,
      },
    ],
  });

  // Rivers milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: riversProject.id,
        name: "Phase 1 PHC Audit (40 facilities)",
        description: "On-site audit of 40 PHCs across 5 LGAs. Findings report submitted.",
        dueDate: daysAgo(30),
        status: "DELAYED",
        order: 1,
      },
      {
        projectId: riversProject.id,
        name: "Infrastructure Gap Analysis",
        description: "Costed infrastructure needs assessment across all 120 PHCs.",
        dueDate: daysFromNow(45),
        status: "PENDING",
        order: 2,
      },
      {
        projectId: riversProject.id,
        name: "Staff Retraining Programme Launch",
        description: "Clinical protocols standardised. First cohort of 200 CHEWs trained.",
        dueDate: daysFromNow(120),
        status: "PENDING",
        order: 3,
      },
    ],
  });

  // ─── Deliverables ─────────────────────────────────────────────────────────

  await prisma.deliverable.createMany({
    data: [
      {
        projectId: lagoonProject.id,
        assignmentId: lagoonAssign1.id,
        name: "OPD Process Redesign Report",
        description:
          "Detailed report outlining current state, root causes of bottlenecks, and redesigned OPD patient journey with implementation roadmap.",
        status: "APPROVED",
        submittedAt: daysAgo(30),
        reviewedAt: daysAgo(27),
        approvedAt: daysAgo(25),
        reviewScore: 9,
        reviewNotes: "Excellent analysis. Clear recommendations. Client very satisfied.",
        version: 1,
      },
      {
        projectId: lagoonProject.id,
        assignmentId: lagoonAssign1.id,
        name: "Theatre Utilisation Improvement Plan",
        description:
          "Root cause analysis of theatre inefficiency and detailed implementation plan for scheduling optimisation.",
        status: "IN_REVIEW",
        submittedAt: daysAgo(3),
        version: 1,
      },
      {
        projectId: ekoProject.id,
        assignmentId: ekoAssign1.id,
        name: "Revenue Leakage Audit Report",
        description:
          "Quantified revenue leakage across billing, NHIS claims, and credit control for FY2024. Root causes and recovery plan.",
        status: "SUBMITTED",
        submittedAt: daysAgo(5),
        version: 1,
      },
      {
        projectId: ekoProject.id,
        assignmentId: ekoAssign1.id,
        name: "NHIS Claims Recovery Tracker",
        description:
          "Live tracker of all outstanding NHIS claims by status, value, and submission date. Updated weekly.",
        status: "DRAFT",
        version: 1,
      },
      {
        projectId: riversProject.id,
        assignmentId: riversAssign1.id,
        name: "Phase 1 PHC Diagnostic Report",
        description:
          "Findings from on-site assessment of 38 of 40 PHCs. Infrastructure, staffing, drug supply chain, and service utilisation data.",
        status: "NEEDS_REVISION",
        submittedAt: daysAgo(18),
        reviewedAt: daysAgo(12),
        reviewScore: 6,
        reviewNotes:
          "Good data collection but analysis section needs strengthening. Recommendations too generic. Please revise Section 4 and 5.",
        version: 1,
      },
    ],
  });

  // ─── Time Entries ─────────────────────────────────────────────────────────

  const timeEntries = [];
  // Tunde — 3 months of entries on Lagoon project
  for (let week = 0; week < 10; week++) {
    timeEntries.push({
      assignmentId: lagoonAssign1.id,
      consultantId: tunde.id,
      date: daysAgo(week * 7 + 1),
      hours: 8.0,
      description: week < 8 ? "OPD process redesign — stakeholder interviews and workflow mapping" : "Theatre utilisation analysis and scheduling review",
      status: week < 8 ? ("APPROVED" as const) : ("PENDING" as const),
      billableAmount: week < 8 ? 450000 : 450000,
      currency: "NGN" as const,
    });
  }

  // Kemi — Eko project
  for (let week = 0; week < 6; week++) {
    timeEntries.push({
      assignmentId: ekoAssign1.id,
      consultantId: kemi.id,
      date: daysAgo(week * 7 + 2),
      hours: 7.5,
      description: week < 4 ? "Billing audit — reviewing 12 months of billing records and NHIS claims" : "Finance team interviews and process documentation",
      status: week < 4 ? ("APPROVED" as const) : ("PENDING" as const),
      billableAmount: week < 4 ? 350000 : 350000,
      currency: "NGN" as const,
    });
  }

  // Sarah — Rivers project
  for (let week = 0; week < 12; week++) {
    timeEntries.push({
      assignmentId: riversAssign1.id,
      consultantId: sarah.id,
      date: daysAgo(week * 7 + 1),
      hours: 8.0,
      description: week < 10 ? "PHC field audit — facility assessments across Rivers State LGAs" : "Diagnostic report write-up and data analysis",
      status: week < 10 ? ("APPROVED" as const) : ("PENDING" as const),
      billableAmount: week < 10 ? 1200 : 1200,
      currency: "USD" as const,
    });
  }

  await prisma.timeEntry.createMany({ data: timeEntries });

  // ─── Project Updates ──────────────────────────────────────────────────────

  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: lagoonProject.id,
        content: "New OPD triage protocol launched. Initial data shows 22% reduction in average wait time in week one.",
        type: "MILESTONE_COMPLETED",
        createdById: chidi.id,
        createdAt: daysAgo(8),
      },
      {
        projectId: lagoonProject.id,
        content: "Theatre utilisation analysis submitted for review. Key finding: 34% of delayed starts attributable to anaesthetist scheduling gaps.",
        type: "GENERAL",
        createdById: chidi.id,
        createdAt: daysAgo(3),
      },
      {
        projectId: ekoProject.id,
        content: "CFO transition complete. New CFO Dr. Yemi Adisa onboarded into project. Full data access now granted.",
        type: "TEAM_CHANGE",
        createdById: chidi.id,
        createdAt: daysAgo(10),
      },
      {
        projectId: ekoProject.id,
        content: "Revenue leakage audit submitted. Preliminary findings show N48M in unrecovered NHIS claims over 18 months.",
        type: "GENERAL",
        createdById: chidi.id,
        createdAt: daysAgo(5),
      },
      {
        projectId: riversProject.id,
        content: "Security clearance received for Ogoniland LGAs. Field team resuming audits from Monday.",
        type: "ISSUE",
        createdById: amara.id,
        createdAt: daysAgo(14),
      },
      {
        projectId: riversProject.id,
        content: "Phase 1 report revision in progress. EM feedback addressed. New submission expected by end of week.",
        type: "GENERAL",
        createdById: amara.id,
        createdAt: daysAgo(7),
      },
      {
        projectId: chaiProject.id,
        content: "Kick-off call scheduled with CHAI Nigeria team for March 28. Project charter under review.",
        type: "GENERAL",
        createdById: amara.id,
        createdAt: daysAgo(2),
      },
    ],
  });

  // ─── Invoices ─────────────────────────────────────────────────────────────

  await prisma.invoice.createMany({
    data: [
      {
        clientId: lagoon.id,
        projectId: lagoonProject.id,
        invoiceNumber: "CFA-2025-001",
        subtotal: 12000000,
        tax: 0,
        total: 12000000,
        currency: "NGN",
        status: "PAID",
        issuedDate: daysAgo(60),
        dueDate: daysAgo(30),
        paidDate: daysAgo(28),
        paymentMethod: "Bank Transfer",
        paymentReference: "LAGOON-T001-JAN25",
        lineItems: [
          { description: "Consulting fees — January 2025", amount: 10200000 },
          { description: "Project management fee", amount: 1800000 },
        ],
      },
      {
        clientId: lagoon.id,
        projectId: lagoonProject.id,
        invoiceNumber: "CFA-2025-004",
        subtotal: 10200000,
        tax: 0,
        total: 10200000,
        currency: "NGN",
        status: "SENT",
        issuedDate: daysAgo(10),
        dueDate: daysFromNow(20),
        lineItems: [
          { description: "Consulting fees — February 2025", amount: 9000000 },
          { description: "Project management fee", amount: 1200000 },
        ],
      },
      {
        clientId: eko.id,
        projectId: ekoProject.id,
        invoiceNumber: "CFA-2025-002",
        subtotal: 7000000,
        tax: 0,
        total: 7000000,
        currency: "NGN",
        status: "OVERDUE",
        issuedDate: daysAgo(50),
        dueDate: daysAgo(5),
        lineItems: [
          { description: "Consulting fees — January 2025", amount: 5600000 },
          { description: "Project management fee", amount: 1400000 },
        ],
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Clients: ${await prisma.client.count()}`);
  console.log(`  Projects: ${await prisma.project.count()}`);
  console.log(`  Assignments: ${await prisma.assignment.count()}`);
  console.log(`  Milestones: ${await prisma.milestone.count()}`);
  console.log(`  Deliverables: ${await prisma.deliverable.count()}`);
  console.log(`  Time entries: ${await prisma.timeEntry.count()}`);
  console.log(`  Invoices: ${await prisma.invoice.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
