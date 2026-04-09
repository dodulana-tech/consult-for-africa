import type { Metadata } from "next";

export const revalidate = 3600;

import Hero from "@/components/cfa/Hero";
import TrustStrip from "@/components/cfa/TrustStrip";
import Impact from "@/components/cfa/Impact";
import ContextImages from "@/components/cfa/ContextImages";
import WhoWeAre from "@/components/cfa/WhoWeAre";
import ValueCards from "@/components/cfa/ValueCards";
import Capabilities from "@/components/cfa/Capabilities";
import Process from "@/components/cfa/Process";
import Credibility from "@/components/cfa/Credibility";
import Testimonial from "@/components/cfa/Testimonial";
import Partners from "@/components/cfa/Partners";
import Network from "@/components/cfa/Network";
import Insights from "@/components/cfa/Insights";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Consult For Africa | Healthcare Transformation Across Africa",
  description:
    "Africa's leading healthcare management consulting firm. Hospital turnaround, clinical governance, fractional leadership, and health systems strengthening. Operations in Nigeria, Ghana, Kenya, and across the continent.",
  keywords: [
    "healthcare consulting Africa",
    "hospital turnaround Nigeria",
    "clinical governance consulting",
    "healthcare management consulting",
    "hospital management Africa",
    "health systems strengthening",
    "fractional hospital leadership",
    "healthcare transformation",
    "hospital operations consulting",
    "African healthcare consulting firm",
  ],
  alternates: {
    canonical: "https://consultforafrica.com",
  },
  openGraph: {
    title: "Consult For Africa | Healthcare Transformation Across Africa",
    description: "Africa's leading healthcare management consulting firm. Hospital turnaround, clinical governance, and health systems strengthening.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Consult For Africa",
  url: "https://consultforafrica.com",
  logo: "https://consultforafrica.com/logo-cfa.png",
  description:
    "Africa's leading healthcare management consulting firm. Hospital turnaround, clinical governance, fractional leadership, and health systems strengthening.",
  foundingDate: "2024",
  founder: {
    "@type": "Person",
    name: "Dr. Debo Odulana",
    jobTitle: "Founding Partner",
  },
  address: [
    {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    {
      "@type": "PostalAddress",
      addressLocality: "Abuja",
      addressCountry: "NG",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+234-913-813-8553",
    contactType: "sales",
    email: "hello@consultforafrica.com",
    availableLanguage: "English",
  },
  sameAs: [],
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: { "@type": "GeoCoordinates", latitude: 6.5244, longitude: 3.3792 },
    description: "Africa",
  },
  knowsAbout: [
    "Hospital Turnaround",
    "Clinical Governance",
    "Healthcare Operations",
    "Health Systems Strengthening",
    "Fractional Leadership",
    "Digital Health",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Consult For Africa",
  url: "https://consultforafrica.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://consultforafrica.com/oncadre/hospitals?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main>
        <Hero />
        <TrustStrip />
        <Impact />
        <ContextImages />
        <WhoWeAre />
        <ValueCards />
        <Capabilities />
        <Process />
        <Credibility />
        <Testimonial />
        <Partners />
        <Network />
        <Insights />
        <PartnerCTA />
      </main>

    </>
  );
}
