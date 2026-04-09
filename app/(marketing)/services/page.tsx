import type { Metadata } from "next";

export const revalidate = 3600;

import AboutServices from "@/components/cfa/services/AboutServices";

export const metadata: Metadata = {
  title: "Services | Consult For Africa",
  description: "Hospital operations, turnaround and recovery, embedded leadership, clinical governance, digital health, and health systems strengthening across Africa.",
  keywords: [
    "hospital turnaround services",
    "clinical governance consulting",
    "healthcare operations Africa",
    "fractional hospital leadership",
    "digital health consulting",
    "health systems strengthening",
    "hospital recovery consulting",
    "embedded leadership healthcare",
  ],
  alternates: {
    canonical: "https://consultforafrica.com/services",
  },
  openGraph: {
    title: "Services | Consult For Africa",
    description: "Hospital operations, turnaround, embedded leadership, clinical governance, digital health, and health systems strengthening across Africa.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};
import OurRole from "@/components/cfa/services/OurRole";
import ServicePillars from "@/components/cfa/services/CoreTransformation";
import EngagementModel from "@/components/cfa/services/EngagementModel";
import Outcomes from "@/components/cfa/services/Outcomes";
import PartnerCTA from "@/components/cfa/PartnerCTA";

const servicesJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Consult For Africa",
    url: "https://consultforafrica.com/services",
    serviceType: "Healthcare Management Consulting",
    areaServed: "Africa",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Healthcare Consulting Services",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Clinical Governance", url: "https://consultforafrica.com/services/clinical-governance" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Strategy & Growth", url: "https://consultforafrica.com/services/strategy-growth" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Fractional Leadership", url: "https://consultforafrica.com/services/fractional-leadership" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Digital Health", url: "https://consultforafrica.com/services/digital-health" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Health Systems Strengthening", url: "https://consultforafrica.com/services/health-systems" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diaspora Expertise", url: "https://consultforafrica.com/services/diaspora-expertise" } },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://consultforafrica.com" },
      { "@type": "ListItem", position: 2, name: "Services", item: "https://consultforafrica.com/services" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <main>
      {servicesJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <AboutServices />
      <OurRole />
      <ServicePillars />
      <EngagementModel />
      <Outcomes />
      <PartnerCTA />
    </main>
  );
}
