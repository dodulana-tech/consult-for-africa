import type { Metadata } from "next";

export const revalidate = 3600;

import AboutServices from "@/components/cfa/services/AboutServices";

export const metadata: Metadata = {
  title: "Services | Consult For Africa",
  description: "Hospital operations, turnaround and recovery, embedded leadership, clinical governance, digital health, and health systems strengthening across Africa.",
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

export default function ServicesPage() {
  return (
    <main>
      <AboutServices />
      <OurRole />
      <ServicePillars />
      <EngagementModel />
      <Outcomes />
      <PartnerCTA />
    </main>
  );
}
