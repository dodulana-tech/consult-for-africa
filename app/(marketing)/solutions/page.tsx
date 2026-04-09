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
  keywords: [
    "healthcare advisory services Africa",
    "hospital retainer consulting",
    "healthcare secondment",
    "fractional leadership healthcare",
    "hospital transformation consulting",
    "healthcare transaction advisory",
    "medical recruitment Africa",
    "healthcare distribution Nigeria",
  ],
  alternates: {
    canonical: "https://consultforafrica.com/solutions",
  },
  openGraph: {
    title: "Solutions | Consult For Africa",
    description: "Eight engagement models designed for African healthcare challenges.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const solutionsBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://consultforafrica.com" },
    { "@type": "ListItem", position: 2, name: "Solutions", item: "https://consultforafrica.com/solutions" },
  ],
};

export default function SolutionsPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionsBreadcrumb) }}
      />
      <SolutionsHero />
      <SolutionsList />
      <SolutionsComparison />
      <PartnerCTA />
    </main>
  );
}
