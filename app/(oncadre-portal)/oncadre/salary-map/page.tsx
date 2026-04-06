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
        <h1
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
        >
          Salary Map
        </h1>
        <p className="mt-1 text-gray-500">
          Anonymous, crowd-sourced compensation data for Nigerian healthcare
          professionals.
        </p>
      </div>

      {!hasContributed ? (
        <div className="mx-auto max-w-2xl">
          {/* Give-to-get prompt */}
          <div
            className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* Subtle top accent band */}
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background: "linear-gradient(90deg, #0B3C5D, #D4AF37, #0B3C5D)",
              }}
            />
            <div className="mb-6 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#D4AF37"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h2
                className="font-bold text-gray-900"
                style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)" }}
              >
                Share your salary to unlock the map
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                Your data is always anonymized. We never display individual
                reports or associate them with your name.
              </p>
            </div>

            {/* Trust signals */}
            <div
              className="mb-6 flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: "shield", text: "Fully anonymous" },
                { icon: "lock", text: "Encrypted" },
                { icon: "eye", text: "Aggregated only" },
              ].map((signal) => (
                <div
                  key={signal.text}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <svg className="h-3.5 w-3.5 text-[#0B3C5D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {signal.icon === "shield" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    )}
                    {signal.icon === "lock" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                    {signal.icon === "eye" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                    )}
                  </svg>
                  {signal.text}
                </div>
              ))}
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
