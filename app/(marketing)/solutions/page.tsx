import type { Metadata } from "next";
import SolutionsHero from "@/components/cfa/solutions/SolutionsHero";
import SolutionsList from "@/components/cfa/solutions/SolutionsList";
import SolutionsComparison from "@/components/cfa/solutions/SolutionsComparison";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Solutions | Consult For Africa",
  description:
    "Six engagement models for African healthcare. Advisory projects, retainer advisory, embedded secondments, fractional leadership, hospital transformation, and transaction advisory.",
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
