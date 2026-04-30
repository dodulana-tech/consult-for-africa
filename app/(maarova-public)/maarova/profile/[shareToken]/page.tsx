import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const NAVY = "#0F2744";
const GOLD = "#D4A574";
const BORDER = "#e5eaf0";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SignatureStrength {
  dimension?: string;
  title?: string;
  description?: string;
}

interface RadarPoint {
  dimension?: string;
  score?: number;
  benchmark?: number;
}

async function loadProfile(shareToken: string) {
  const report = await prisma.maarovaReport.findUnique({
    where: { shareToken },
    select: {
      id: true,
      shareEnabledAt: true,
      leadershipArchetype: true,
      archetypeNarrative: true,
      signatureStrengths: true,
      radarChartData: true,
      generatedAt: true,
      user: {
        select: {
          name: true,
          title: true,
          department: true,
          organisation: { select: { name: true, country: true } },
        },
      },
    },
  });

  if (!report || !report.shareEnabledAt) return null;
  return report;
}

function absoluteUrl(path: string) {
  const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ shareToken: string }> }
): Promise<Metadata> {
  const { shareToken } = await params;
  const report = await loadProfile(shareToken);

  if (!report) {
    return {
      title: "Profile not found | Maarova",
      robots: { index: false, follow: false },
    };
  }

  const name = report.user.name;
  const archetype = report.leadershipArchetype ?? "Leadership Profile";
  const title = `${name} — ${archetype} | Maarova`;
  const description =
    report.archetypeNarrative?.slice(0, 200) ??
    `${name}'s verified Maarova leadership profile. Healthcare leadership assessment from Consult for Africa.`;

  const url = absoluteUrl(`/maarova/profile/${shareToken}`);

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: "Maarova",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MaarovaProfilePage(
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const report = await loadProfile(shareToken);
  if (!report) notFound();

  const strengths = (report.signatureStrengths as SignatureStrength[] | null) ?? [];
  const radar = (report.radarChartData as RadarPoint[] | null) ?? [];
  const topDimensions = [...radar]
    .filter((r) => typeof r.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  const issuedDate = formatDate(report.shareEnabledAt ?? report.generatedAt);
  const orgLine = [
    report.user.title,
    report.user.organisation?.name,
    report.user.organisation?.country,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <header className="py-6 px-6" style={{ backgroundColor: NAVY }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-white text-lg font-semibold tracking-wide">
            Maarova
          </span>
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: GOLD }}
          >
            Verified Leadership Profile
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section
          className="rounded-lg bg-white p-8 mb-6"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Leadership Archetype
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: NAVY }}
          >
            {report.leadershipArchetype ?? "Leadership Profile"}
          </h1>

          <div className="border-l-4 pl-4 mb-6" style={{ borderColor: GOLD }}>
            <p className="text-xl font-semibold" style={{ color: NAVY }}>
              {report.user.name}
            </p>
            {orgLine && (
              <p className="text-sm text-gray-600 mt-1">{orgLine}</p>
            )}
          </div>

          {report.archetypeNarrative && (
            <p className="text-base leading-relaxed text-gray-700">
              {report.archetypeNarrative}
            </p>
          )}
        </section>

        {strengths.length > 0 && (
          <section className="mb-6">
            <h2
              className="text-xs uppercase tracking-widest text-gray-500 mb-3 px-1"
            >
              Signature Strengths
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {strengths.slice(0, 3).map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white p-5"
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderLeft: `4px solid ${GOLD}`,
                  }}
                >
                  {s.dimension && (
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                      {s.dimension}
                    </p>
                  )}
                  {s.title && (
                    <p
                      className="font-semibold text-base mb-2"
                      style={{ color: NAVY }}
                    >
                      {s.title}
                    </p>
                  )}
                  {s.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {topDimensions.length > 0 && (
          <section
            className="rounded-lg bg-white p-8 mb-6"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
              Top Dimensions
            </h2>
            <div className="space-y-3">
              {topDimensions.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: NAVY }}>
                      {d.dimension}
                    </span>
                    <span className="text-gray-600">{d.score}</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: BORDER }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, d.score ?? 0))}%`,
                        backgroundColor: GOLD,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          className="rounded-lg p-6 mb-6 text-sm"
          style={{ backgroundColor: NAVY, color: "white" }}
        >
          <p className="mb-1" style={{ color: GOLD }}>
            Verified by Maarova
          </p>
          <p className="text-white/80">
            This profile is issued by Maarova, the healthcare leadership
            assessment platform from Consult for Africa. The leader completed a
            psychometric assessment covering behavioural style, values, emotional
            intelligence, clinical-to-leadership identity, and team culture.
            {issuedDate && <> Issued {issuedDate}.</>}
          </p>
        </section>

        <section
          className="rounded-lg bg-white p-8 text-center"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: NAVY }}>
            Get your own leadership profile
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Maarova is a leadership assessment built for African healthcare.
            Complete it once, share your archetype, and use it as a credential
            on your CV and LinkedIn.
          </p>
          <Link
            href="/maarova"
            className="inline-block px-6 py-3 rounded-md font-semibold text-sm"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Learn more about Maarova
          </Link>
        </section>

        <p className="text-center text-xs text-gray-500 mt-8">
          Showing only the public summary. The full report and development areas
          remain private to the leader.
        </p>
      </main>
    </div>
  );
}
