import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_CLIENT_NAMES = [
  'Cooked Indoors',
  'Covally Healthcare Cooperative',
  'Connexxum',
  'Cureva Health',
  'Priscilla Specialist Hospital',
]

async function main() {
  console.log('Seeding CFA Client Projects...\n')

  // Find engagement manager user
  const em = await prisma.user.findFirst({
    where: { role: { in: ['PARTNER', 'ADMIN', 'DIRECTOR'] } },
  })
  if (!em) {
    console.error('No admin/partner/director user found. Seed a user first.')
    return
  }
  console.log(`Using engagement manager: ${em.name} (${em.email})\n`)

  // ── Clean up previous seed data ──────────────────────────────────────────────
  console.log('Cleaning up previous seed data...')

  const existingClients = await prisma.client.findMany({
    where: { name: { in: SEED_CLIENT_NAMES } },
    select: { id: true, name: true },
  })

  if (existingClients.length > 0) {
    const clientIds = existingClients.map((c) => c.id)

    // Find projects for these clients
    const existingProjects = await prisma.project.findMany({
      where: { clientId: { in: clientIds } },
      select: { id: true },
    })
    const projectIds = existingProjects.map((p) => p.id)

    if (projectIds.length > 0) {
      // Delete in dependency order
      await prisma.deliverable.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.milestone.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.paymentMilestone.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.projectPhase.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.riskItem.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.clientInteraction.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.projectImpactMetric.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.knowledgeAsset.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.projectFramework.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.projectUpdate.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.assignment.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.invoice.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.message.deleteMany({ where: { projectId: { in: projectIds } } })
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
    }

    await prisma.clientContact.deleteMany({ where: { clientId: { in: clientIds } } })
    await prisma.invoice.deleteMany({ where: { clientId: { in: clientIds } } })
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } })

    console.log(`  Removed ${existingClients.length} clients and ${projectIds.length} projects.\n`)
  } else {
    console.log('  No previous seed data found.\n')
  }

  // ── 1. COOKED INDOORS ────────────────────────────────────────────────────────
  console.log('Creating Cooked Indoors...')

  const cookedIndoorsClient = await prisma.client.create({
    data: {
      name: 'Cooked Indoors',
      type: 'STARTUP',
      primaryContact: 'Founder',
      email: 'hello@cookedindoors.com',
      phone: '+234-800-COOKED',
      address: 'Lagos, Nigeria',
      paymentTerms: 30,
      currency: 'NGN',
      status: 'ACTIVE',
      creditScore: 5,
      notes: 'MedTech / Food-as-Medicine platform. Website live at cookedindoors.com. Long-term partner for ongoing platform enhancements.',
    },
  })

  const cookedIndoorsProject = await prisma.project.create({
    data: {
      clientId: cookedIndoorsClient.id,
      engagementManagerId: em.id,
      name: 'Cooked Indoors Platform Build',
      description:
        'End-to-end digital platform strategy and build for Cooked Indoors, a MedTech / Food-as-Medicine venture. Scope included platform strategy, website development, business model design, service categorization, operational setup, and e-commerce integration. Successfully launched at cookedindoors.com.',
      serviceType: 'DIGITAL_HEALTH',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      status: 'COMPLETED',
      budgetAmount: 15_000_000,
      budgetCurrency: 'NGN',
      actualSpent: 14_200_000,
      healthScore: 10,
      riskLevel: 'LOW',
      clientSatisfactionScore: 9,
      notes: 'Delivered on time and within budget. Platform is live and generating revenue.',
    },
  })

  // Milestones for Cooked Indoors
  const ciMilestone1 = await prisma.milestone.create({
    data: {
      projectId: cookedIndoorsProject.id,
      name: 'Discovery and Strategy',
      description: 'Market research, competitive analysis, and platform strategy development for the Food-as-Medicine concept.',
      dueDate: new Date('2024-04-30'),
      status: 'COMPLETED',
      completionDate: new Date('2024-04-25'),
      order: 1,
    },
  })

  const ciMilestone2 = await prisma.milestone.create({
    data: {
      projectId: cookedIndoorsProject.id,
      name: 'Platform Design and Architecture',
      description: 'UX/UI design, technical architecture, service categorization framework, and business model finalization.',
      dueDate: new Date('2024-07-31'),
      status: 'COMPLETED',
      completionDate: new Date('2024-07-20'),
      order: 2,
    },
  })

  const ciMilestone3 = await prisma.milestone.create({
    data: {
      projectId: cookedIndoorsProject.id,
      name: 'Development and Integration',
      description: 'Full-stack website build, e-commerce integration, payment gateway setup, and operational tooling.',
      dueDate: new Date('2024-11-30'),
      status: 'COMPLETED',
      completionDate: new Date('2024-11-28'),
      order: 3,
    },
  })

  const ciMilestone4 = await prisma.milestone.create({
    data: {
      projectId: cookedIndoorsProject.id,
      name: 'Launch and Go-Live',
      description: 'QA testing, soft launch, marketing site go-live, and post-launch support.',
      dueDate: new Date('2025-02-28'),
      status: 'COMPLETED',
      completionDate: new Date('2025-02-15'),
      order: 4,
    },
  })

  // Deliverables for Cooked Indoors
  const ciDeliverables = [
    {
      name: 'Platform Strategy Document',
      description: 'Comprehensive platform strategy covering market positioning, revenue model, and growth roadmap for the Food-as-Medicine vertical.',
      milestoneId: ciMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-04-15'),
      submittedAt: new Date('2024-04-10'),
      approvedAt: new Date('2024-04-20'),
      reviewScore: 9,
    },
    {
      name: 'Business Model Canvas',
      description: 'Detailed business model including revenue streams, cost structure, value propositions, and customer segments for the meal delivery and nutrition platform.',
      milestoneId: ciMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-04-25'),
      submittedAt: new Date('2024-04-22'),
      approvedAt: new Date('2024-04-25'),
      reviewScore: 8,
    },
    {
      name: 'Service Categorization Framework',
      description: 'Taxonomy and categorization system for meal plans, dietary programs, and health-focused food services.',
      milestoneId: ciMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-06-15'),
      submittedAt: new Date('2024-06-12'),
      approvedAt: new Date('2024-06-18'),
      reviewScore: 9,
    },
    {
      name: 'Website Build and Frontend',
      description: 'Full responsive website build with Next.js, including landing pages, service pages, meal plans, and customer-facing UI.',
      milestoneId: ciMilestone3.id,
      status: 'APPROVED' as const,
      reviewStage: 'DELIVERED' as const,
      clientVisible: true,
      dueDate: new Date('2024-10-31'),
      submittedAt: new Date('2024-10-28'),
      approvedAt: new Date('2024-11-05'),
      reviewScore: 9,
    },
    {
      name: 'E-commerce Integration',
      description: 'Payment gateway integration, order management system, and e-commerce workflow for meal ordering and subscription management.',
      milestoneId: ciMilestone3.id,
      status: 'APPROVED' as const,
      reviewStage: 'DELIVERED' as const,
      clientVisible: true,
      dueDate: new Date('2024-11-15'),
      submittedAt: new Date('2024-11-10'),
      approvedAt: new Date('2024-11-20'),
      reviewScore: 8,
    },
    {
      name: 'Operational Setup Playbook',
      description: 'Standard operating procedures, vendor onboarding process, quality control checklist, and logistics workflow documentation.',
      milestoneId: ciMilestone4.id,
      status: 'APPROVED' as const,
      reviewStage: 'DELIVERED' as const,
      clientVisible: true,
      dueDate: new Date('2025-01-31'),
      submittedAt: new Date('2025-01-28'),
      approvedAt: new Date('2025-02-05'),
      reviewScore: 9,
    },
  ]

  for (const d of ciDeliverables) {
    await prisma.deliverable.create({
      data: { projectId: cookedIndoorsProject.id, ...d },
    })
  }
  console.log('  Created project with 4 milestones, 6 deliverables.\n')

  // ── 2. COVALLY HEALTHCARE COOPERATIVE ────────────────────────────────────────
  console.log('Creating Covally Healthcare Cooperative...')

  const covallyClient = await prisma.client.create({
    data: {
      name: 'Covally Healthcare Cooperative',
      type: 'STARTUP',
      primaryContact: 'Dr. Debo Odulana',
      email: 'debo@covally.health',
      phone: '+234-800-COVALLY',
      address: 'Lagos, Nigeria',
      paymentTerms: 30,
      currency: 'NGN',
      status: 'ACTIVE',
      creditScore: 5,
      notes: 'HealthTech / Healthcare Cooperative. Founder-led engagement with Dr. Debo Odulana. Complex multi-module platform with fund management, claims processing, and provider network.',
    },
  })

  const covallyProject = await prisma.project.create({
    data: {
      clientId: covallyClient.id,
      engagementManagerId: em.id,
      name: 'Covally Platform Strategy and Architecture',
      description:
        'Full-scope strategy and technical architecture for the Covally Healthcare Cooperative platform. Deliverables include a 31-page platform strategy, complete database schema, technical architecture, fund management engine, claims processing system, provider network strategy, procurement engine, governance module, 16-week sprint plan, and user journey maps. Target launch Q3 2026.',
      serviceType: 'HEALTH_SYSTEMS',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2026-09-30'),
      status: 'ACTIVE',
      budgetAmount: 25_000_000,
      budgetCurrency: 'NGN',
      actualSpent: 8_500_000,
      healthScore: 8,
      riskLevel: 'MEDIUM',
      clientSatisfactionScore: 8,
      notes: 'High-complexity engagement. Multiple interdependent modules. On track for Q3 2026 launch.',
    },
  })

  const covMilestone1 = await prisma.milestone.create({
    data: {
      projectId: covallyProject.id,
      name: 'Platform Strategy and Vision',
      description: '31-page platform strategy document covering cooperative model, market analysis, regulatory landscape, and product vision.',
      dueDate: new Date('2024-11-30'),
      status: 'COMPLETED',
      completionDate: new Date('2024-11-25'),
      order: 1,
    },
  })

  const covMilestone2 = await prisma.milestone.create({
    data: {
      projectId: covallyProject.id,
      name: 'Technical Architecture and DB Schema',
      description: 'Complete database schema design, system architecture, API contract definitions, and infrastructure planning.',
      dueDate: new Date('2025-02-28'),
      status: 'COMPLETED',
      completionDate: new Date('2025-02-20'),
      order: 2,
    },
  })

  const covMilestone3 = await prisma.milestone.create({
    data: {
      projectId: covallyProject.id,
      name: 'Core Engine Development',
      description: 'Fund management engine, claims processing system, and provider network module development.',
      dueDate: new Date('2025-08-31'),
      status: 'IN_PROGRESS',
      order: 3,
    },
  })

  const covMilestone4 = await prisma.milestone.create({
    data: {
      projectId: covallyProject.id,
      name: 'Governance and Procurement Modules',
      description: 'Governance module, procurement engine, and cooperative decision-making tools.',
      dueDate: new Date('2026-02-28'),
      status: 'PENDING',
      order: 4,
    },
  })

  const covMilestone5 = await prisma.milestone.create({
    data: {
      projectId: covallyProject.id,
      name: 'Integration Testing and Launch',
      description: 'End-to-end integration testing, user acceptance testing, pilot rollout, and production launch.',
      dueDate: new Date('2026-09-30'),
      status: 'PENDING',
      order: 5,
    },
  })

  const covDeliverables = [
    {
      name: '31-Page Platform Strategy',
      description: 'Comprehensive platform strategy covering cooperative healthcare model, market sizing, regulatory compliance framework, competitive positioning, and phased rollout plan.',
      milestoneId: covMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-11-15'),
      submittedAt: new Date('2024-11-10'),
      approvedAt: new Date('2024-11-22'),
      reviewScore: 9,
    },
    {
      name: 'User Journey Maps',
      description: 'Detailed user journey maps for members, providers, administrators, and cooperative governance participants.',
      milestoneId: covMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-11-25'),
      submittedAt: new Date('2024-11-20'),
      approvedAt: new Date('2024-11-25'),
      reviewScore: 8,
    },
    {
      name: 'Complete Database Schema',
      description: 'Full relational database schema covering members, providers, funds, claims, procurement, governance, and audit tables.',
      milestoneId: covMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-01-31'),
      submittedAt: new Date('2025-01-28'),
      approvedAt: new Date('2025-02-05'),
      reviewScore: 9,
    },
    {
      name: 'Technical Architecture Document',
      description: 'System architecture covering microservices design, API gateway, event-driven processing, and infrastructure-as-code templates.',
      milestoneId: covMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-02-15'),
      submittedAt: new Date('2025-02-12'),
      approvedAt: new Date('2025-02-18'),
      reviewScore: 9,
    },
    {
      name: '16-Week Sprint Plan',
      description: 'Detailed sprint-by-sprint development plan with story points, team allocation, and dependency mapping for all platform modules.',
      milestoneId: covMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-02-28'),
      submittedAt: new Date('2025-02-22'),
      approvedAt: new Date('2025-02-28'),
      reviewScore: 8,
    },
    {
      name: 'Fund Management Engine',
      description: 'Core fund management engine handling member contributions, pooled fund accounting, investment tracking, and disbursement workflows.',
      milestoneId: covMilestone3.id,
      status: 'IN_REVIEW' as const,
      reviewStage: 'INTERNAL_QA' as const,
      clientVisible: false,
      dueDate: new Date('2025-06-30'),
      submittedAt: new Date('2025-06-25'),
    },
    {
      name: 'Claims Processing System',
      description: 'Automated claims intake, adjudication rules engine, fraud detection flags, and provider payment settlement workflows.',
      milestoneId: covMilestone3.id,
      status: 'SUBMITTED' as const,
      reviewStage: 'PEER_REVIEW' as const,
      clientVisible: false,
      dueDate: new Date('2025-07-31'),
      submittedAt: new Date('2025-07-28'),
    },
    {
      name: 'Provider Network Strategy',
      description: 'Provider onboarding framework, credentialing workflows, network adequacy analysis, and referral routing algorithms.',
      milestoneId: covMilestone3.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2025-08-31'),
    },
    {
      name: 'Procurement Engine',
      description: 'Medical supply procurement module with vendor management, bulk purchasing workflows, and inventory optimization.',
      milestoneId: covMilestone4.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2025-12-31'),
    },
    {
      name: 'Governance Module',
      description: 'Cooperative governance tools including voting mechanisms, board management, policy documentation, and member communication.',
      milestoneId: covMilestone4.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-02-28'),
    },
  ]

  for (const d of covDeliverables) {
    await prisma.deliverable.create({
      data: { projectId: covallyProject.id, ...d },
    })
  }
  console.log('  Created project with 5 milestones, 10 deliverables.\n')

  // ── 3. CONNEXXUM ─────────────────────────────────────────────────────────────
  console.log('Creating Connexxum...')

  const connexxumClient = await prisma.client.create({
    data: {
      name: 'Connexxum',
      type: 'STARTUP',
      primaryContact: 'Founder',
      email: 'team@connexxum.com',
      phone: '+234-800-CONNEX',
      address: 'Lagos, Nigeria',
      paymentTerms: 30,
      currency: 'NGN',
      status: 'ACTIVE',
      creditScore: 4,
      notes: 'HealthTech / B2B Procurement platform. Complex technical engagement with escrow, biomedical SLA models, and buying pool mechanics. Beta target Q2 2026.',
    },
  })

  const connexxumProject = await prisma.project.create({
    data: {
      clientId: connexxumClient.id,
      engagementManagerId: em.id,
      name: 'Connexxum B2B Healthcare Procurement Platform',
      description:
        'Technical strategy and architecture for the Connexxum B2B healthcare procurement marketplace. Deliverables include a technical handoff document, 943-line database schema, 80+ API endpoint contracts, escrow state machine, biomedical SLA model, buying pool lifecycle, frontend architecture, and 16-week build plan. Beta target Q2 2026.',
      serviceType: 'DIGITAL_HEALTH',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2026-06-30'),
      status: 'ACTIVE',
      budgetAmount: 20_000_000,
      budgetCurrency: 'NGN',
      actualSpent: 7_800_000,
      healthScore: 7,
      riskLevel: 'MEDIUM',
      clientSatisfactionScore: 8,
      notes: 'Highly technical engagement. Escrow and procurement state machines are core complexity drivers. On track for Q2 2026 beta.',
    },
  })

  const cxMilestone1 = await prisma.milestone.create({
    data: {
      projectId: connexxumProject.id,
      name: 'Technical Discovery and Handoff',
      description: 'Technical discovery, existing codebase audit, and comprehensive handoff documentation for development team.',
      dueDate: new Date('2024-12-31'),
      status: 'COMPLETED',
      completionDate: new Date('2024-12-20'),
      order: 1,
    },
  })

  const cxMilestone2 = await prisma.milestone.create({
    data: {
      projectId: connexxumProject.id,
      name: 'Schema and API Architecture',
      description: '943-line database schema, 80+ API endpoint contracts, and system architecture documentation.',
      dueDate: new Date('2025-03-31'),
      status: 'COMPLETED',
      completionDate: new Date('2025-03-25'),
      order: 2,
    },
  })

  const cxMilestone3 = await prisma.milestone.create({
    data: {
      projectId: connexxumProject.id,
      name: 'Core Business Logic Engines',
      description: 'Escrow state machine, biomedical SLA model, buying pool lifecycle engine, and procurement workflow automation.',
      dueDate: new Date('2025-09-30'),
      status: 'IN_PROGRESS',
      order: 3,
    },
  })

  const cxMilestone4 = await prisma.milestone.create({
    data: {
      projectId: connexxumProject.id,
      name: 'Frontend Architecture and Beta',
      description: 'Frontend architecture implementation, buyer/seller dashboards, and beta launch preparation.',
      dueDate: new Date('2026-06-30'),
      status: 'PENDING',
      order: 4,
    },
  })

  const cxDeliverables = [
    {
      name: 'Technical Handoff Document',
      description: 'Comprehensive technical handoff covering existing codebase analysis, architecture decisions, technology stack rationale, and development environment setup guide.',
      milestoneId: cxMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-12-15'),
      submittedAt: new Date('2024-12-10'),
      approvedAt: new Date('2024-12-18'),
      reviewScore: 9,
    },
    {
      name: '943-Line Database Schema',
      description: 'Complete relational database schema covering products, vendors, hospitals, procurement orders, escrow accounts, SLA contracts, buying pools, and audit trails.',
      milestoneId: cxMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-02-15'),
      submittedAt: new Date('2025-02-10'),
      approvedAt: new Date('2025-02-18'),
      reviewScore: 10,
    },
    {
      name: '80+ API Endpoint Contracts',
      description: 'OpenAPI-style contract definitions for all platform endpoints covering authentication, product catalog, order management, escrow operations, SLA tracking, and buying pool workflows.',
      milestoneId: cxMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-03-15'),
      submittedAt: new Date('2025-03-10'),
      approvedAt: new Date('2025-03-20'),
      reviewScore: 9,
    },
    {
      name: '16-Week Build Plan',
      description: 'Sprint-by-sprint development roadmap with resource allocation, dependency mapping, and risk mitigation strategies for the platform build.',
      milestoneId: cxMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-03-31'),
      submittedAt: new Date('2025-03-25'),
      approvedAt: new Date('2025-03-30'),
      reviewScore: 8,
    },
    {
      name: 'Escrow State Machine',
      description: 'Finite state machine for escrow operations covering fund holds, release conditions, dispute resolution, partial releases, and timeout handling.',
      milestoneId: cxMilestone3.id,
      status: 'SUBMITTED' as const,
      reviewStage: 'PEER_REVIEW' as const,
      clientVisible: false,
      dueDate: new Date('2025-07-31'),
      submittedAt: new Date('2025-07-25'),
    },
    {
      name: 'Biomedical SLA Model',
      description: 'Service-level agreement framework for biomedical equipment covering delivery timelines, maintenance schedules, uptime guarantees, and penalty calculations.',
      milestoneId: cxMilestone3.id,
      status: 'SUBMITTED' as const,
      reviewStage: 'PEER_REVIEW' as const,
      clientVisible: false,
      dueDate: new Date('2025-08-31'),
      submittedAt: new Date('2025-08-20'),
    },
    {
      name: 'Buying Pool Lifecycle Engine',
      description: 'Complete buying pool management system covering pool creation, member enrollment, price negotiation, order aggregation, and settlement distribution.',
      milestoneId: cxMilestone3.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2025-09-30'),
    },
    {
      name: 'Frontend Architecture',
      description: 'Frontend component architecture, design system, dashboard layouts for buyers and sellers, and real-time notification system design.',
      milestoneId: cxMilestone4.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-03-31'),
    },
  ]

  for (const d of cxDeliverables) {
    await prisma.deliverable.create({
      data: { projectId: connexxumProject.id, ...d },
    })
  }
  console.log('  Created project with 4 milestones, 8 deliverables.\n')

  // ── 4. CUREVA HEALTH ─────────────────────────────────────────────────────────
  console.log('Creating Cureva Health...')

  const curevaClient = await prisma.client.create({
    data: {
      name: 'Cureva Health',
      type: 'STARTUP',
      primaryContact: 'Founder',
      email: 'team@curevahealth.com',
      phone: '+234-800-CUREVA',
      address: 'Lagos, Nigeria',
      paymentTerms: 30,
      currency: 'NGN',
      status: 'ACTIVE',
      creditScore: 4,
      notes: 'HealthTech / Medical Tourism platform. Features AI patient advisor "Ara", procedure packages, doctor profiles, CurevaFinance, and booking system. Pilot target Q2 2026.',
    },
  })

  const curevaProject = await prisma.project.create({
    data: {
      clientId: curevaClient.id,
      engagementManagerId: em.id,
      name: 'Cureva Health Medical Tourism Platform',
      description:
        'Frontend prototype and platform strategy for the Cureva Health medical tourism platform. Deliverables include an 806-line frontend prototype, AI patient advisor "Ara", 6 procedure packages, doctor profiles, CurevaFinance payment system, patient journey map, design system, and booking widget. Pilot target Q2 2026.',
      serviceType: 'DIGITAL_HEALTH',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2026-06-30'),
      status: 'ACTIVE',
      budgetAmount: 20_000_000,
      budgetCurrency: 'NGN',
      actualSpent: 6_200_000,
      healthScore: 8,
      riskLevel: 'LOW',
      clientSatisfactionScore: 9,
      notes: 'Strong founder engagement. AI advisor "Ara" is a differentiator. Frontend prototype well-received by early testers.',
    },
  })

  const cuMilestone1 = await prisma.milestone.create({
    data: {
      projectId: curevaProject.id,
      name: 'Product Strategy and Patient Journey',
      description: 'Market analysis, patient journey mapping, procedure package definition, and platform positioning for medical tourism.',
      dueDate: new Date('2025-01-31'),
      status: 'COMPLETED',
      completionDate: new Date('2025-01-28'),
      order: 1,
    },
  })

  const cuMilestone2 = await prisma.milestone.create({
    data: {
      projectId: curevaProject.id,
      name: 'Design System and Prototype',
      description: 'Design system creation, 806-line frontend prototype, booking widget, and doctor profile components.',
      dueDate: new Date('2025-05-31'),
      status: 'COMPLETED',
      completionDate: new Date('2025-05-20'),
      order: 2,
    },
  })

  const cuMilestone3 = await prisma.milestone.create({
    data: {
      projectId: curevaProject.id,
      name: 'AI Advisor and Finance Module',
      description: 'AI patient advisor "Ara" integration, CurevaFinance payment system, and financing workflow development.',
      dueDate: new Date('2025-11-30'),
      status: 'IN_PROGRESS',
      order: 3,
    },
  })

  const cuMilestone4 = await prisma.milestone.create({
    data: {
      projectId: curevaProject.id,
      name: 'Pilot Launch',
      description: 'Provider onboarding, pilot patient cohort, booking system go-live, and initial marketing campaign.',
      dueDate: new Date('2026-06-30'),
      status: 'PENDING',
      order: 4,
    },
  })

  const cuDeliverables = [
    {
      name: 'Patient Journey Map',
      description: 'End-to-end patient journey map covering discovery, consultation, travel planning, procedure, recovery, and follow-up touchpoints.',
      milestoneId: cuMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2024-12-31'),
      submittedAt: new Date('2024-12-28'),
      approvedAt: new Date('2025-01-05'),
      reviewScore: 9,
    },
    {
      name: '6 Procedure Packages',
      description: 'Detailed procedure packages covering dental, cosmetic, orthopedic, fertility, cardiac, and ophthalmology services with pricing, provider matching, and travel logistics.',
      milestoneId: cuMilestone1.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-01-15'),
      submittedAt: new Date('2025-01-12'),
      approvedAt: new Date('2025-01-20'),
      reviewScore: 8,
    },
    {
      name: 'Design System',
      description: 'Complete design system with color palette, typography, component library, spacing system, and accessibility guidelines for the Cureva Health brand.',
      milestoneId: cuMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-03-31'),
      submittedAt: new Date('2025-03-28'),
      approvedAt: new Date('2025-04-05'),
      reviewScore: 9,
    },
    {
      name: 'Frontend Prototype (806 Lines)',
      description: 'Interactive frontend prototype covering homepage, procedure catalog, doctor profiles, booking flow, and patient dashboard. 806 lines of production-ready React components.',
      milestoneId: cuMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'DELIVERED' as const,
      clientVisible: true,
      dueDate: new Date('2025-05-15'),
      submittedAt: new Date('2025-05-10'),
      approvedAt: new Date('2025-05-18'),
      reviewScore: 10,
    },
    {
      name: 'Doctor Profiles Module',
      description: 'Doctor profile system with credentials, specialties, patient reviews, availability calendar, and consultation booking integration.',
      milestoneId: cuMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'APPROVED' as const,
      clientVisible: true,
      dueDate: new Date('2025-05-31'),
      submittedAt: new Date('2025-05-22'),
      approvedAt: new Date('2025-05-28'),
      reviewScore: 8,
    },
    {
      name: 'Booking Widget',
      description: 'Embeddable booking widget for procedure scheduling with real-time availability, price estimation, and travel date coordination.',
      milestoneId: cuMilestone2.id,
      status: 'APPROVED' as const,
      reviewStage: 'DELIVERED' as const,
      clientVisible: true,
      dueDate: new Date('2025-05-31'),
      submittedAt: new Date('2025-05-25'),
      approvedAt: new Date('2025-05-30'),
      reviewScore: 9,
    },
    {
      name: 'AI Patient Advisor "Ara"',
      description: 'AI-powered patient advisor chatbot providing procedure recommendations, cost estimates, provider matching, and pre-travel preparation guidance.',
      milestoneId: cuMilestone3.id,
      status: 'IN_REVIEW' as const,
      reviewStage: 'INTERNAL_QA' as const,
      clientVisible: false,
      dueDate: new Date('2025-09-30'),
      submittedAt: new Date('2025-09-25'),
    },
    {
      name: 'CurevaFinance System',
      description: 'Patient financing system with installment plans, partner lending integration, insurance pre-authorization, and transparent pricing breakdowns.',
      milestoneId: cuMilestone3.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2025-11-30'),
    },
  ]

  for (const d of cuDeliverables) {
    await prisma.deliverable.create({
      data: { projectId: curevaProject.id, ...d },
    })
  }
  console.log('  Created project with 4 milestones, 8 deliverables.\n')

  // ── 5. PRISCILLA SPECIALIST HOSPITAL ────────────────────────────────────────
  console.log('Creating Priscilla Specialist Hospital...')

  const priscillaClient = await prisma.client.create({
    data: {
      name: 'Priscilla Specialist Hospital',
      type: 'PRIVATE_MIDTIER',
      primaryContact: 'Dr. Debo Odulana',
      email: 'admin@priscillaspecialist.com',
      phone: '+234 800 000 0005',
      address: 'Ajah, Lagos, Nigeria',
      paymentTerms: 30,
      currency: 'NGN',
      status: 'ACTIVE',
      creditScore: 4,
      notes: '30-bed specialist hospital in Ajah, Lagos. Discovery phase. Full hospital management engagement under evaluation. Website: priscilla-specialist.onrender.com',
    },
  })

  const priscillaProject = await prisma.project.create({
    data: {
      clientId: priscillaClient.id,
      engagementManagerId: em.id,
      name: 'Priscilla Hospital Management & Digital Transformation',
      description: 'Full hospital management engagement for a 30-bed specialist hospital in Ajah, Lagos. Scope includes HMIS/EMR implementation, web platform optimization, patient acquisition strategy, clinical operations setup, staff management (70-100 employees), HMO claims processing, and financial reporting systems.',
      serviceType: 'HOSPITAL_OPERATIONS',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-02-01'),
      status: 'PLANNING',
      budgetAmount: 50000000,
      budgetCurrency: 'NGN',
      actualSpent: 0,
      healthScore: 5,
      riskLevel: 'LOW',
      notes: 'Discovery phase. Project pending final approval. 30-bed facility with 70-100 staff.',
    },
  })

  const prMilestone1 = await prisma.milestone.create({
    data: {
      projectId: priscillaProject.id,
      name: 'Discovery & Assessment',
      description: 'Initial hospital assessment, stakeholder interviews, systems audit, gap analysis, and engagement scoping.',
      dueDate: new Date('2026-04-30'),
      status: 'IN_PROGRESS',
      order: 1,
    },
  })

  const prMilestone2 = await prisma.milestone.create({
    data: {
      projectId: priscillaProject.id,
      name: 'HMIS Selection & Implementation Plan',
      description: 'Evaluate HMIS/EMR options (Helium Health, custom-built), select platform, design implementation roadmap.',
      dueDate: new Date('2026-06-30'),
      status: 'PENDING',
      order: 2,
    },
  })

  const prMilestone3 = await prisma.milestone.create({
    data: {
      projectId: priscillaProject.id,
      name: 'Operations & Systems Setup',
      description: 'Clinical operations framework, staff management systems, HMO claims processing, financial reporting, patient acquisition funnel.',
      dueDate: new Date('2026-10-31'),
      status: 'PENDING',
      order: 3,
    },
  })

  const prMilestone4 = await prisma.milestone.create({
    data: {
      projectId: priscillaProject.id,
      name: 'Go-Live & Optimization',
      description: 'Full system go-live, staff training, performance monitoring, optimization cycles.',
      dueDate: new Date('2027-02-01'),
      status: 'PENDING',
      order: 4,
    },
  })

  const prDeliverables = [
    {
      name: 'Hospital Diagnostic Assessment',
      description: 'Comprehensive assessment of current hospital operations, clinical workflows, IT infrastructure, financial performance, staffing, and patient satisfaction.',
      milestoneId: prMilestone1.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-03-31'),
    },
    {
      name: 'Stakeholder Mapping & Interview Report',
      description: 'Stakeholder analysis, interview findings, and recommendations for engagement governance structure.',
      milestoneId: prMilestone1.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-04-15'),
    },
    {
      name: 'HMIS/EMR Evaluation Report',
      description: 'Comparative analysis of HMIS/EMR options (Helium Health vs custom-built) with recommendation, cost projections, and implementation timeline.',
      milestoneId: prMilestone2.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-06-15'),
    },
    {
      name: 'Patient Acquisition Strategy',
      description: 'Digital marketing plan, referral network development, community outreach, and patient engagement systems for the hospital.',
      milestoneId: prMilestone3.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-08-31'),
    },
    {
      name: 'Clinical Operations Framework',
      description: 'Standard operating procedures, clinical pathways, quality metrics, patient safety protocols, and departmental workflows.',
      milestoneId: prMilestone3.id,
      status: 'DRAFT' as const,
      reviewStage: 'DRAFT' as const,
      clientVisible: false,
      dueDate: new Date('2026-09-30'),
    },
  ]

  for (const d of prDeliverables) {
    await prisma.deliverable.create({
      data: { projectId: priscillaProject.id, ...d },
    })
  }
  console.log('  Created project with 4 milestones, 5 deliverables.\n')

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('='.repeat(60))
  console.log('Seed complete! Summary:')
  console.log('='.repeat(60))
  console.log('')
  console.log('  1. Cooked Indoors          - COMPLETED  - N15M')
  console.log('  2. Covally Healthcare Coop - ACTIVE     - N25M')
  console.log('  3. Connexxum               - ACTIVE     - N20M')
  console.log('  4. Cureva Health           - ACTIVE     - N20M')
  console.log('  5. Priscilla Specialist    - PLANNING   - N50M')
  console.log('')
  console.log('  Total portfolio value: N130M')
  console.log('')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
