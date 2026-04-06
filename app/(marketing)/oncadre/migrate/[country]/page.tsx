import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MIGRATION_PATHWAYS,
  MIGRATION_COUNTRY_SLUGS,
  getMigrationPathway,
} from "@/lib/cadreHealth/migrationData";
import CountryPathwayContent from "./CountryPathwayContent";

/* ─── Static Params ────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return MIGRATION_COUNTRY_SLUGS.map((country) => ({ country }));
}

/* ─── Dynamic Metadata ─────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const pathway = getMigrationPathway(country);
  if (!pathway) return {};

  const title = `How to Work in ${pathway.country} as a Nigerian Doctor, Nurse, or Healthcare Professional | CadreHealth`;
  const description = `${pathway.overview} Processing time: ${pathway.processingTime}. Estimated cost: ${pathway.estimatedCostNaira}. Step-by-step guide with exams, costs in Naira, visa details, and tips for Nigerian professionals.`;

  return {
    title,
    description,
    keywords: [
      `${pathway.country} healthcare migration Nigeria`,
      `Nigerian doctor ${pathway.country}`,
      `Nigerian nurse ${pathway.country}`,
      `${pathway.primaryExam} guide Nigeria`,
      `how to work in ${pathway.country} as Nigerian doctor`,
      `how to work in ${pathway.country} as Nigerian nurse`,
      `${pathway.country} healthcare visa Nigeria`,
      `${pathway.country} medical registration Nigeria`,
      `${pathway.primaryRegulator}`,
      "CadreHealth migration",
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://consultforafrica.com/oncadre/migrate/${pathway.slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title: `Work in ${pathway.country} | CadreHealth Migration Guide`,
      description,
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/migrate/${pathway.slug}`,
    },
  };
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function CountryPathwayPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const pathway = getMigrationPathway(country);
  if (!pathway) notFound();

  const relatedCountries = MIGRATION_PATHWAYS.filter(
    (p) => p.slug !== pathway.slug
  ).slice(0, 4);

  return <CountryPathwayContent pathway={pathway} relatedCountries={relatedCountries} />;
}
