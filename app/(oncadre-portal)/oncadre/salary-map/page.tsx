import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import SalarySurveyForm from "@/components/cadrehealth/SalarySurveyForm";
import SalaryMapExplorer from "./SalaryMapExplorer";

export const metadata = {
  title: "Salary Map | CadreHealth",
  description:
    "See what healthcare professionals earn across Nigeria. Anonymous, crowd-sourced salary data by cadre, state, and facility type.",
};

export default async function SalaryMapPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { salaryReportedAt: true, cadre: true },
  });

  if (!professional) redirect("/oncadre/register");

  const hasContributed = !!professional.salaryReportedAt;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salary Map</h1>
        <p className="mt-1 text-gray-500">
          Anonymous, crowd-sourced compensation data for Nigerian healthcare
          professionals.
        </p>
      </div>

      {!hasContributed ? (
        <div className="mx-auto max-w-2xl">
          {/* Give-to-get prompt */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <svg
                  className="h-7 w-7 text-[#D4AF37]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Share your salary to unlock the map
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your data is always anonymized. We never display individual
                reports or associate them with your name.
              </p>
            </div>
            <SalarySurveyForm />
          </div>
        </div>
      ) : (
        <SalaryMapExplorer defaultCadre={professional.cadre} />
      )}
    </div>
  );
}
