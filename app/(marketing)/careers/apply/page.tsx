import type { Metadata } from "next";
import ApplicationForm from "@/components/talent/ApplicationForm";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Join the Network | Consult For Africa",
  description:
    "Apply to join Africa's premier healthcare management consulting network. Work with leading hospitals, health systems, and governments across the continent.",
  keywords: [
    "healthcare consultant application",
    "join consulting network Africa",
    "hospital management consultant",
    "healthcare careers Nigeria",
    "clinical governance consultant",
    "health systems consultant Africa",
  ],
  alternates: {
    canonical: "https://consultforafrica.com/careers/apply",
  },
  openGraph: {
    title: "Join the Network | Consult For Africa",
    description:
      "Apply to join Africa's premier healthcare management consulting network.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const VALID_TRACKS = ["CONSULTANT", "NYSC", "INTERN", "SIWES", "FELLOWSHIP"];

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  const defaultTrack = track && VALID_TRACKS.includes(track.toUpperCase())
    ? track.toUpperCase()
    : "CONSULTANT";
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: "#FAFAFA" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/careers" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 mb-8">
          <ArrowLeft size={13} />
          Back to Talent Network
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: "#D4AF37" }}>
            Join C4A
          </p>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#0F2744" }}>
            {defaultTrack === "NYSC" ? "Junior Analyst Application" : "Consultant Application"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {defaultTrack === "NYSC"
              ? "Complete the form below to apply for a junior analyst placement at C4A. Applications are reviewed by our team within 5 business days."
              : "Complete the form below to apply to C4A's exclusive consultant network. Applications are reviewed by our team within 5 business days."}
          </p>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Clock, text: "5-day review" },
            { icon: Shield, text: "Confidential" },
            { icon: Star, text: "Premium network" },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2 p-3 rounded-lg bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <t.icon size={14} style={{ color: "#0F2744" }} className="shrink-0" />
              <span className="text-xs text-gray-600">{t.text}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-8" style={{ border: "1px solid #e5eaf0" }}>
          <ApplicationForm defaultTrack={defaultTrack} />
        </div>
      </div>
    </div>
  );
}
