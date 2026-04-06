import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ClaimForm from "./ClaimForm";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Claim Your Profile | CadreHealth",
  description:
    "Set your password and activate your CadreHealth specialist profile. Access salary data, hospital reviews, and career opportunities.",
};

export default async function ClaimPage({ params }: Props) {
  const { id } = await params;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      subSpecialty: true,
    },
  });

  if (!professional) {
    notFound();
  }

  const cadreLabel = getCadreLabel(professional.cadre);
  const specialty = professional.subSpecialty ?? cadreLabel;

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-[#0B3C5D] via-[#0E4D6E] to-[#0B3C5D] p-12">
        <div>
          <span className="text-2xl font-bold text-white">
            Cadre<span className="text-[#D4AF37]">Health</span>
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white">
            Welcome, Dr. {professional.lastName}.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Your {specialty} specialist profile is ready. Set a password to
            activate it and unlock everything CadreHealth has to offer.
          </p>

          <div className="mt-10 space-y-6">
            {[
              { text: "See what your cadre earns at every facility" },
              { text: "Read honest hospital reviews from verified professionals" },
              { text: "Get matched to opportunities you qualify for" },
              { text: "Track your CPD points and license renewals" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#0B3C5D]">
                  &#10003;
                </div>
                <span className="text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">By Consult For Africa</p>
      </div>

      {/* Right panel - claim form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold text-[#0B3C5D]">
              Cadre<span className="text-[#D4AF37]">Health</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Claim your profile
          </h1>
          <p className="mt-2 text-gray-500">
            Set a password to activate your specialist profile.
          </p>

          {/* Pre-filled info */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">
                  Dr. {professional.firstName} {professional.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Specialty</span>
                <span className="text-sm font-medium text-gray-900">
                  {specialty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-900">
                  {professional.email}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ClaimForm professionalId={professional.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
