/**
 * Seed script: Maarova Assessment Modules
 *
 * Idempotently upserts the 6 Maarova modules required by the assessment
 * platform. Must be run BEFORE seed-maarova-questions.ts, which expects
 * modules to already exist (it findUnique's by slug and skips if missing).
 *
 * Run with: npx tsx prisma/seed-maarova-modules.ts
 */

import { PrismaClient, MaarovaModuleType, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface ModuleSeed {
  slug: string;
  type: MaarovaModuleType;
  name: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  scoringConfig: Record<string, unknown>;
}

const modules: ModuleSeed[] = [
  {
    slug: "disc",
    type: "DISC",
    name: "DISC Behavioural Style",
    description:
      "Forced-choice profile of how you approach decisions, communication, conflict, and pace in clinical and administrative settings.",
    order: 1,
    estimatedMinutes: 10,
    scoringConfig: { dimensions: ["D", "I", "S", "C"] },
  },
  {
    slug: "values-drivers",
    type: "VALUES_DRIVERS",
    name: "Values & Drivers",
    description:
      "Ranking-based exploration of the motivators that shape your leadership choices: theoretical, economic, aesthetic, social, political, and regulatory.",
    order: 2,
    estimatedMinutes: 12,
    scoringConfig: {
      dimensions: [
        "theoretical",
        "economic",
        "aesthetic",
        "social",
        "political",
        "regulatory",
      ],
    },
  },
  {
    slug: "eq",
    type: "EMOTIONAL_INTEL",
    name: "Emotional Intelligence",
    description:
      "Scenario-based assessment of self-awareness, empathy, social skills, and emotional regulation in healthcare leadership situations.",
    order: 3,
    estimatedMinutes: 10,
    scoringConfig: {},
  },
  {
    slug: "cilti",
    type: "CILTI",
    name: "Clinical-to-Leadership Identity",
    description:
      "Likert-7 measure of how you are navigating the transition from clinician to leader, including identity friction and transition readiness.",
    order: 4,
    estimatedMinutes: 10,
    scoringConfig: { maxLikert: 7 },
  },
  {
    slug: "culture-team",
    type: "CULTURE_TEAM",
    name: "Culture & Team",
    description:
      "Competing Values Framework profile of your team orientation (Collaborate, Create, Compete, Control), plus engagement drivers and team effectiveness.",
    order: 5,
    estimatedMinutes: 10,
    scoringConfig: { maxLikert: 5 },
  },
  {
    slug: "three-sixty",
    type: "THREE_SIXTY",
    name: "360 Feedback",
    description:
      "Optional multi-rater feedback from supervisors, peers, and direct reports. Runs asynchronously alongside the core assessment.",
    order: 6,
    estimatedMinutes: 10,
    scoringConfig: {},
  },
];

async function main() {
  console.log("Seeding Maarova assessment modules ...\n");

  for (const m of modules) {
    const result = await prisma.maarovaModule.upsert({
      where: { slug: m.slug },
      update: {
        type: m.type,
        name: m.name,
        description: m.description,
        order: m.order,
        estimatedMinutes: m.estimatedMinutes,
        scoringConfig: m.scoringConfig as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        slug: m.slug,
        type: m.type,
        name: m.name,
        description: m.description,
        order: m.order,
        estimatedMinutes: m.estimatedMinutes,
        scoringConfig: m.scoringConfig as Prisma.InputJsonValue,
        isActive: true,
      },
    });
    console.log(`  ${result.slug.padEnd(15)} -> ${result.type} (${result.id})`);
  }

  console.log(`\nDone. ${modules.length} modules upserted.`);
  console.log("Next: npx tsx prisma/seed-maarova-questions.ts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
