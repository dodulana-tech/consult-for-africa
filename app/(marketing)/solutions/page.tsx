import type { Metadata } from "next";

export const revalidate = 3600;

import SolutionsHero from "@/components/cfa/solutions/SolutionsHero";
import SolutionsList from "@/components/cfa/solutions/SolutionsList";
import SolutionsComparison from "@/components/cfa/solutions/SolutionsComparison";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Solutions | Consult For Africa",
  description:
    "Eight engagement models for African healthcare. Advisory, retainer, secondments, fractional leadership, transformation, transaction advisory, recruitment, and commercial distribution.",
  openGraph: {
    title: "Solutions | Consult For Africa",
    description: "Eight engagement models designed for African healthcare challenges.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

export default function SolutionsPage() {
  return (
    <main>
      <SolutionsHero />
      <SolutionsList />
      <SolutionsComparison />
      <PartnerCTA />
    </main>
  );
}
