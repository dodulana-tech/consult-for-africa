import type { Metadata } from "next";

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
  title: "Consult For Africa",
  description:
    "Hospital management, turnaround, and healthcare systems transformation across Africa.",
  openGraph: {
    title: "Consult For Africa",
    description: "Transforming hospital performance across Africa.",
    images: ["/og-image.jpg"],
  },
};

export default function Page() {
  return (
    <>
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
