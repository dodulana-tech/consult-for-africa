import type { Metadata } from "next";
import SolutionsHero from "@/components/cfa/solutions/SolutionsHero";
import SolutionsList from "@/components/cfa/solutions/SolutionsList";
import SolutionsComparison from "@/components/cfa/solutions/SolutionsComparison";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Solutions | Consult For Africa",
  description:
    "Seven engagement models for African healthcare. Advisory projects, retainer advisory, embedded secondments, fractional leadership, hospital transformation, transaction advisory, and healthcare recruitment.",
  openGraph: {
    title: "Solutions | Consult For Africa",
    description: "Seven engagement models designed for African healthcare challenges.",
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
