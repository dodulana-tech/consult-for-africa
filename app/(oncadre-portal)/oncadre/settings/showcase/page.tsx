/**
 * Showcase consent. The SHOWCASE_CONSENT week of the digest links straight
 * here, so the page has to answer "what exactly are you going to publish about
 * me" before it asks for anything.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { greetingFor } from "@/lib/cadreSalutation";
import ShowcaseConsentForm from "./ShowcaseConsentForm";

export default async function ShowcaseSettingsPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      state: true,
      currentFacility: true,
      yearsOfExperience: true,
      showcaseOptIn: true,
      featuredAt: true,
    },
  });

  if (!professional) redirect("/oncadre/profile");

  const where = [professional.currentFacility, professional.state].filter(Boolean).join(", ");
  const detail = [
    professional.subSpecialty,
    where || null,
    professional.yearsOfExperience ? `${professional.yearsOfExperience} years in practice` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const previewLine = [greetingFor(professional), detail].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">May we feature you?</h1>
        <p className="mt-2 text-gray-600">
          Every week the CadreHealth email puts one member in front of the whole network: their name,
          their specialty, and where they practise. It runs on consent only, and you can take it back
          whenever you like.
        </p>
      </div>

      <ShowcaseConsentForm
        initialOptIn={professional.showcaseOptIn}
        previewLine={previewLine}
        featuredBefore={!!professional.featuredAt}
      />

      {!detail && (
        <p className="text-sm text-gray-500">
          Your profile has no specialty or place of work on it yet, so there is little to feature.{" "}
          <Link href="/oncadre/profile" className="font-medium" style={{ color: "#0B3C5D" }}>
            Fill that in first
          </Link>{" "}
          and this reads a great deal better.
        </p>
      )}
    </div>
  );
}
