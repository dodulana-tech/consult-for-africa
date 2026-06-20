/**
 * Set logoUrl and/or bannerUrl on a CadreFacility. Idempotent.
 *
 * Usage:
 *   source /tmp/cfa-prod.env
 *   npx tsx scripts/set-facility-branding.ts \
 *     --slug pearl-oncology \
 *     --logo "https://pearloncology.com/wp-content/uploads/2024/01/logo.png" \
 *     --banner "https://example.com/pearl-banner.jpg"
 *
 * Either --logo or --banner may be omitted; the corresponding column is
 * untouched. Pass --clear-logo or --clear-banner to set the column to NULL.
 *
 * The script lightly validates the URL (must be https and resolvable as an
 * image content-type when fetched). Pass --skip-validate to bypass.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Args {
  slug?: string;
  logo?: string;
  banner?: string;
  clearLogo?: boolean;
  clearBanner?: boolean;
  skipValidate?: boolean;
}

function parseArgs(): Args {
  const out: Args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--slug":   out.slug = argv[++i]; break;
      case "--logo":   out.logo = argv[++i]; break;
      case "--banner": out.banner = argv[++i]; break;
      case "--clear-logo":   out.clearLogo = true; break;
      case "--clear-banner": out.clearBanner = true; break;
      case "--skip-validate": out.skipValidate = true; break;
      default:
        console.error(`unknown arg: ${a}`);
        process.exit(2);
    }
  }
  return out;
}

async function validateImageUrl(url: string): Promise<void> {
  if (!url.startsWith("https://")) {
    throw new Error(`URL must be https: ${url}`);
  }
  const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`URL returned ${res.status}: ${url}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) {
    throw new Error(`URL content-type is "${ct}", expected image/*: ${url}`);
  }
}

async function main() {
  const args = parseArgs();
  if (!args.slug) {
    console.error("Missing --slug");
    process.exit(2);
  }

  const facility = await prisma.cadreFacility.findFirst({
    where: { slug: args.slug },
    select: { id: true, name: true, logoUrl: true, bannerUrl: true },
  });
  if (!facility) {
    console.error(`Facility not found: ${args.slug}`);
    process.exit(1);
  }

  if (args.logo && !args.skipValidate) await validateImageUrl(args.logo);
  if (args.banner && !args.skipValidate) await validateImageUrl(args.banner);

  const data: { logoUrl?: string | null; bannerUrl?: string | null } = {};
  if (args.logo) data.logoUrl = args.logo;
  if (args.clearLogo) data.logoUrl = null;
  if (args.banner) data.bannerUrl = args.banner;
  if (args.clearBanner) data.bannerUrl = null;

  if (Object.keys(data).length === 0) {
    console.log(`No changes requested. Current values for ${facility.name}:`);
    console.log(`  logoUrl   : ${facility.logoUrl ?? "(null)"}`);
    console.log(`  bannerUrl : ${facility.bannerUrl ?? "(null)"}`);
    return;
  }

  const updated = await prisma.cadreFacility.update({
    where: { id: facility.id },
    data,
    select: { name: true, slug: true, logoUrl: true, bannerUrl: true },
  });

  console.log(`Updated ${updated.name}  (${updated.slug})`);
  console.log(`  logoUrl   : ${updated.logoUrl ?? "(null)"}`);
  console.log(`  bannerUrl : ${updated.bannerUrl ?? "(null)"}`);
  console.log(`  preview   : https://consultforafrica.com/oncadre/hospitals/${updated.slug}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
