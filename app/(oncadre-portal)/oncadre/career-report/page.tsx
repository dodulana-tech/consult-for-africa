import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";
import GenerateReport from "./GenerateReport";

interface MarketPosition {
  percentile: number;
  peerComparison: string;
  strengths: string[];
  standoutFactors: string[];
}

interface CompensationBenchmark {
  estimatedRangeLow: number;
  estimatedRangeHigh: number;
  estimatedMedian: number;
  currentPositionLabel: string;
  narrative: string;
  growthPotential: string;
}

interface SkillGap {
  skill: string;
  category: string;
  impact: number;
  timeToAcquire: string;
  rationale: string;
}

interface CareerPath {
  title: string;
  description: string;
  timeline: string;
  requirements: string[];
  salaryImpact: string;
  suitabilityScore: number;
}

interface Country {
  country: string;
  readinessScore: number;
  status: string;
  completedSteps: string[];
  remainingSteps: string[];
  estimatedTimeline: string;
}

interface InternationalReadiness {
  overall: string;
  countries: Country[];
}

interface NextStep {
  priority: number;
  action: string;
  category: string;
  impact: string;
  timeframe: string;
}

export default async function CareerReportPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { cadre: true, firstName: true },
  });

  if (!professional) redirect("/oncadre/register");

  const report = await prisma.cadreCareerReport.findFirst({
    where: { professionalId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  const cadreLabel = getCadreLabel(professional.cadre);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Career Intelligence Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {cadreLabel} - Personalized career assessment and growth roadmap
          </p>
        </div>
        <Link
          href="/oncadre/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      {!report ? (
        <GenerateReport hasExisting={false} />
      ) : (
        <>
          <GenerateReport hasExisting={true} />

          <div className="text-xs text-gray-400">
            Generated {new Date(report.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Market Position */}
          <MarketPositionCard data={report.marketPosition as MarketPosition | null} />

          {/* Compensation */}
          <CompensationCard data={report.compensationBenchmark as CompensationBenchmark | null} />

          {/* Skills Gap */}
          <SkillsGapCard data={report.skillsGap as SkillGap[] | null} />

          {/* Career Paths */}
          <CareerPathsCard data={report.careerPaths as CareerPath[] | null} />

          {/* International Readiness */}
          <InternationalCard data={report.internationalReadiness as InternationalReadiness | null} />

          {/* Next Steps */}
          <NextStepsCard data={report.nextSteps as NextStep[] | null} />
        </>
      )}
    </div>
  );
}

function MarketPositionCard({ data }: { data: MarketPosition | null }) {
  if (!data) return null;

  const percentile = data.percentile || 50;
  const ringPct = (percentile / 100) * 283; // circumference of circle with r=45

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <h2 className="text-lg font-bold text-gray-900">Market Position</h2>
      <p className="mt-1 text-sm text-gray-500">{data.peerComparison}</p>

      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row">
        {/* Percentile ring */}
        <div className="relative flex-shrink-0">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#E8EBF0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="#D4AF37"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${ringPct} 283`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: "#0B3C5D" }}>{percentile}</span>
            <span className="text-xs text-gray-500">percentile</span>
          </div>
        </div>

        {/* Strengths & standout */}
        <div className="flex-1 space-y-4">
          {data.strengths?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Key Strengths</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.strengths.map((s, i) => (
                  <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "#0B3C5D10", color: "#0B3C5D" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.standoutFactors?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Standout Factors</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.standoutFactors.map((s, i) => (
                  <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "#D4AF3715", color: "#92700C" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompensationCard({ data }: { data: CompensationBenchmark | null }) {
  if (!data) return null;

  const low = data.estimatedRangeLow || 0;
  const high = data.estimatedRangeHigh || 0;
  const median = data.estimatedMedian || 0;

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const medianPct = high > low ? ((median - low) / (high - low)) * 100 : 50;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <h2 className="text-lg font-bold text-gray-900">Compensation Benchmark</h2>
      <p className="mt-1 text-sm text-gray-500">{data.narrative}</p>

      <div className="mt-6">
        {/* Salary bar */}
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>NGN {fmt(low)}/mo</span>
            <span>NGN {fmt(high)}/mo</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full" style={{ background: "linear-gradient(90deg, #E8EBF0, #D4AF3730, #0B3C5D30)" }}>
            {/* Median marker */}
            <div
              className="absolute top-0 h-full w-0.5"
              style={{ left: `${medianPct}%`, background: "#0B3C5D" }}
            />
          </div>
          <div
            className="relative mt-1"
            style={{ paddingLeft: `${Math.max(0, medianPct - 5)}%` }}
          >
            <div className="inline-flex flex-col items-center">
              <div className="h-2 w-0.5" style={{ background: "#0B3C5D" }} />
              <span className="text-xs font-semibold" style={{ color: "#0B3C5D" }}>
                Median: NGN {fmt(median)}
              </span>
            </div>
          </div>
        </div>

        {/* Position label */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background:
                data.currentPositionLabel === "above market" ? "#dcfce7" :
                data.currentPositionLabel === "at market" ? "#D4AF3720" : "#fef2f2",
              color:
                data.currentPositionLabel === "above market" ? "#166534" :
                data.currentPositionLabel === "at market" ? "#92700C" : "#991b1b",
            }}
          >
            {data.currentPositionLabel === "above market" ? "Above Market" :
             data.currentPositionLabel === "at market" ? "At Market" : "Below Market"}
          </span>
        </div>

        {data.growthPotential && (
          <div className="mt-4 rounded-xl p-3" style={{ background: "#F8F9FB" }}>
            <p className="text-xs font-semibold text-gray-400">GROWTH POTENTIAL</p>
            <p className="mt-1 text-sm text-gray-700">{data.growthPotential}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillsGapCard({ data }: { data: SkillGap[] | null }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <h2 className="text-lg font-bold text-gray-900">Skills Gap Analysis</h2>
      <p className="mt-1 text-sm text-gray-500">Prioritized skills and certifications to strengthen your profile</p>

      <div className="mt-6 space-y-3">
        {data.map((item, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ borderColor: "#E8EBF0" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{item.skill}</h4>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "#E8EBF0", color: "#6b7280" }}>
                    {item.category?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.rationale}</p>
                <p className="mt-1.5 text-xs text-gray-400">
                  Estimated time: {item.timeToAcquire}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{
                    background: item.impact >= 8 ? "#0B3C5D" : item.impact >= 5 ? "#D4AF37" : "#9ca3af",
                  }}
                >
                  {item.impact}
                </div>
                <span className="mt-1 text-[10px] text-gray-400">Impact</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CareerPathsCard({ data }: { data: CareerPath[] | null }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <h2 className="text-lg font-bold text-gray-900">Career Trajectories</h2>
      <p className="mt-1 text-sm text-gray-500">Three personalized career paths based on your profile</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {data.map((path, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border p-5"
            style={{
              borderColor: i === 0 ? "#D4AF37" : "#E8EBF0",
              background: i === 0 ? "linear-gradient(135deg, #FFFDF5, #FFF)" : "white",
            }}
          >
            {i === 0 && (
              <div
                className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "#D4AF37", color: "white" }}
              >
                BEST FIT
              </div>
            )}
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ background: "#0B3C5D" }}
              >
                {i + 1}
              </div>
              <h4 className="text-sm font-bold text-gray-900">{path.title}</h4>
            </div>
            <p className="text-xs text-gray-600">{path.description}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {path.timeline}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#166534" }}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {path.salaryImpact}
              </div>
            </div>

            {path.requirements?.length > 0 && (
              <div className="mt-3 border-t pt-3" style={{ borderColor: "#E8EBF0" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Requirements</p>
                <ul className="mt-1.5 space-y-1">
                  {path.requirements.map((req, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full" style={{ background: "#D4AF37" }} />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suitability */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EBF0" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(path.suitabilityScore / 10) * 100}%`,
                    background: path.suitabilityScore >= 7 ? "#D4AF37" : "#9ca3af",
                  }}
                />
              </div>
              <span className="text-xs font-semibold" style={{ color: "#0B3C5D" }}>
                {path.suitabilityScore}/10
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InternationalCard({ data }: { data: InternationalReadiness | null }) {
  if (!data) return null;

  const statusColors: Record<string, { bg: string; text: string }> = {
    "Ready": { bg: "#dcfce7", text: "#166534" },
    "Nearly Ready": { bg: "#D4AF3720", text: "#92700C" },
    "In Progress": { bg: "#dbeafe", text: "#1e40af" },
    "Not Started": { bg: "#f3f4f6", text: "#6b7280" },
  };

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
      <h2 className="text-lg font-bold text-gray-900">International Readiness</h2>
      <p className="mt-1 text-sm text-gray-500">{data.overall}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.countries?.map((c, i) => {
          const colors = statusColors[c.status] || statusColors["Not Started"];
          const ringPct = (c.readinessScore / 100) * 283;

          return (
            <div key={i} className="rounded-xl border p-4" style={{ borderColor: "#E8EBF0" }}>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E8EBF0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke={c.readinessScore >= 70 ? "#16a34a" : c.readinessScore >= 40 ? "#D4AF37" : "#9ca3af"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${ringPct} 283`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: "#0B3C5D" }}>{c.readinessScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{c.country}</h4>
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {c.status}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">{c.estimatedTimeline}</p>
                </div>
              </div>

              {c.completedSteps?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Completed</p>
                  <ul className="mt-1 space-y-0.5">
                    {c.completedSteps.map((s, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="h-3 w-3 flex-shrink-0" style={{ color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.remainingSteps?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Remaining</p>
                  <ul className="mt-1 space-y-0.5">
                    {c.remainingSteps.map((s, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "#E8EBF0" }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextStepsCard({ data }: { data: NextStep[] | null }) {
  if (!data || data.length === 0) return null;

  const categoryColors: Record<string, string> = {
    CREDENTIAL: "#0B3C5D",
    QUALIFICATION: "#D4AF37",
    CAREER_MOVE: "#7c3aed",
    SKILL: "#0891b2",
    DOCUMENTATION: "#6b7280",
  };

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        borderColor: "#0B3C5D",
        background: "linear-gradient(135deg, #0B3C5D, #0d4a73)",
      }}
    >
      <h2 className="text-lg font-bold text-white">Your Action Plan</h2>
      <p className="mt-1 text-sm text-white/60">Prioritized next steps for career advancement</p>

      <div className="mt-6 space-y-3">
        {data.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
              style={{ background: "#D4AF37", color: "#0B3C5D" }}
            >
              {step.priority}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">{step.action}</h4>
              <p className="mt-0.5 text-xs text-white/60">{step.impact}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `${categoryColors[step.category] || "#6b7280"}30`,
                    color: "white",
                  }}
                >
                  {step.category?.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-white/40">{step.timeframe}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
