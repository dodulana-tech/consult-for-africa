import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying facility branding migration");
  // Idempotent: IF NOT EXISTS guards re-runs
  await prisma.$executeRawUnsafe(`ALTER TABLE "CadreFacility" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;`);
  console.log("  logoUrl added");
  await prisma.$executeRawUnsafe(`ALTER TABLE "CadreFacility" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;`);
  console.log("  bannerUrl added");

  // Record the migration in Prisma's history so future migrate deploy runs do not retry it
  const migrationName = "20260515000000_facility_branding";
  await prisma.$executeRawUnsafe(`
    INSERT INTO "_prisma_migrations"
      ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
    VALUES
      (gen_random_uuid()::text, 'manual-apply', now(), '${migrationName}', NULL, NULL, now(), 1)
    ON CONFLICT DO NOTHING;
  `);
  console.log(`  history row for ${migrationName} recorded`);

  // Verify
  const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'CadreFacility' AND column_name IN ('logoUrl', 'bannerUrl')
    ORDER BY column_name;
  `);
  console.log("Columns present:", result.map((r) => r.column_name).join(", "));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
