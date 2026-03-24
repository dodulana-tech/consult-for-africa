import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

/**
 * Set pricing on training tracks:
 * - FOUNDATION: FREE
 * - SPECIALIST: PAID (N25,000 - N50,000)
 * - MASTER: PAID (N75,000 - N100,000)
 */
async function main() {
  // Foundation tracks -> FREE
  const foundationResult = await prisma.trainingTrack.updateMany({
    where: { level: "FOUNDATION" },
    data: { pricingType: "FREE", priceNGN: null },
  });
  console.log(`Set ${foundationResult.count} Foundation tracks to FREE`);

  // Specialist tracks -> PAID
  const specialistTracks = await prisma.trainingTrack.findMany({
    where: { level: "SPECIALIST" },
    orderBy: { sortOrder: "asc" },
  });

  const specialistPrices: Record<string, number> = {
    "hospital-turnaround": 35000,
    "clinical-governance": 35000,
    "revenue-cycle": 40000,
    "health-economics": 45000,
    "digital-health": 30000,
    "healthcare-hr": 25000,
    "lean-quality": 30000,
  };

  for (const track of specialistTracks) {
    const price = specialistPrices[track.slug] ?? 35000;
    await prisma.trainingTrack.update({
      where: { id: track.id },
      data: { pricingType: "PAID", priceNGN: new Decimal(price) },
    });
    console.log(`  ${track.name}: N${price.toLocaleString()}`);
  }

  // Master tracks -> PAID
  const masterTracks = await prisma.trainingTrack.findMany({
    where: { level: "MASTER" },
    orderBy: { sortOrder: "asc" },
  });

  const masterPrices: Record<string, number> = {
    "strategic-advisory": 85000,
    "public-sector": 75000,
    "master-consultant": 100000,
  };

  for (const track of masterTracks) {
    const price = masterPrices[track.slug] ?? 85000;
    await prisma.trainingTrack.update({
      where: { id: track.id },
      data: { pricingType: "PAID", priceNGN: new Decimal(price) },
    });
    console.log(`  ${track.name}: N${price.toLocaleString()}`);
  }

  console.log("\nTrack pricing configured successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
