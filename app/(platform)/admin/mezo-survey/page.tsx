import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import { MEZO_SURVEY, labelFor } from "@/lib/cadreHealth/mezoSurvey";

export const dynamic = "force-dynamic";

// Results for the Mezo private practice survey.
//
// The survey exists to settle three commercial questions before any room is
// leased: whether doctors will take sessional space at all, what a session is
// worth to them, and whether a monthly fee is payable. Those three are
// therefore rendered first and as distributions, because a decision about
// rooms turns on the shape of the answers rather than on any one of them.
//
// City comes next, since it is the question that decides where the first room
// opens, and it is free text so it is grouped case-insensitively rather than
// counted raw.

const HEADLINE = [
  "sessionalAppetite",
  "sessionBudget",
  "billingPreference",
  "membershipBudget",
  "consultationFee",
  "weeklyPatients",
  "hmo",
  "startTimeline",
  "seesPrivatePatients",
  "teleconsult",
] as const;

export default async function MezoSurveyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await prisma.cadreMezoInterest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      professional: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          subSpecialty: true,
          state: true,
          yearsOfExperience: true,
          isDiaspora: true,
        },
      },
    },
  });

  const total = rows.length;
  const opened = rows.filter((r) => r.mezoClaimUrl).length;
  const failed = rows.filter((r) => r.mezoStatus === "FAILED").length;

  // Cities, grouped case and whitespace insensitively so "ikeja" and "Ikeja "
  // do not read as two markets.
  const cityCounts = new Map<string, number>();
  for (const r of rows) {
    const raw = (r.practiceCity ?? "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1);
  }
  const cities = [...cityCounts.entries()]
    .map(([key, count]) => ({
      label: key.replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const notes = rows
    .map((r) => ({
      who: `${r.professional.firstName} ${r.professional.lastName}`.trim(),
      text: typeof (r.payload as Record<string, unknown>)?.notes === "string"
        ? ((r.payload as Record<string, unknown>).notes as string)
        : "",
    }))
    .filter((n) => n.text.length > 0);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <TopBar title="Mezo survey" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-[#0F2744]">Mezo private practice survey</h1>
        <p className="mt-1 text-sm text-gray-500">
          What CadreHealth doctors say they would rent, and what they would pay for it.
        </p>

        {total === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-500">
            No responses yet.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Responses" value={total} />
              <Stat label="Mezo places opened" value={opened} />
              <Stat label="Failed to open" value={failed} tone={failed > 0 ? "warn" : undefined} />
            </div>

            <Section title="The commercial questions">
              <div className="grid gap-6 lg:grid-cols-2">
                {HEADLINE.map((id) => (
                  <Distribution key={id} questionId={id} rows={rows} />
                ))}
              </div>
            </Section>

            <Section title="Where they would practise">
              {cities.length === 0 ? (
                <p className="text-sm text-gray-500">No cities given yet.</p>
              ) : (
                <div className="space-y-2">
                  {cities.map((c) => (
                    <Bar key={c.label} label={c.label} count={c.count} total={total} />
                  ))}
                </div>
              )}
            </Section>

            {notes.length > 0 && (
              <Section title="What would make it an easy yes">
                <div className="space-y-3">
                  {notes.map((n, i) => (
                    <div key={i} className="rounded-xl border bg-white p-4">
                      <p className="text-[13px] font-semibold text-[#0F2744]">{n.who}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{n.text}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Respondents">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Specialty</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Would rent</th>
                      <th className="px-4 py-3">Session budget</th>
                      <th className="px-4 py-3">Monthly fee</th>
                      <th className="px-4 py-3">Mezo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0F2744]">
                            {r.professional.firstName} {r.professional.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{r.professional.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.professional.subSpecialty ?? "Not given"}
                          {r.professional.isDiaspora && (
                            <span className="ml-1.5 text-xs text-gray-400">diaspora</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.practiceCity ?? "Not given"}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.sessionalAppetite ? labelFor("sessionalAppetite", r.sessionalAppetite) : "Not given"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.sessionBudget ? labelFor("sessionBudget", r.sessionBudget) : "Not given"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.membershipBudget ? labelFor("membershipBudget", r.membershipBudget) : "Not given"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={
                              r.mezoClaimUrl
                                ? { background: "#D1FAE5", color: "#065F46" }
                                : r.mezoStatus === "FAILED"
                                  ? { background: "#FEE2E2", color: "#991B1B" }
                                  : { background: "#F3F4F6", color: "#6B7280" }
                            }
                          >
                            {r.mezoStatus}
                          </span>
                          {r.mezoError && (
                            <div className="mt-1 max-w-[220px] text-[11px] text-red-600">{r.mezoError}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className="mt-1 text-3xl font-bold"
        style={{ color: tone === "warn" ? "#B91C1C" : "#0F2744" }}
      >
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Distribution({
  questionId,
  rows,
}: {
  questionId: string;
  rows: { payload: unknown }[];
}) {
  const question = MEZO_SURVEY.find((q) => q.id === questionId);
  if (!question?.options) return null;

  const counts = new Map<string, number>();
  for (const r of rows) {
    const payload = r.payload as Record<string, unknown> | null;
    const value = payload?.[questionId];
    if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const answered = [...counts.values()].reduce((a, b) => a + b, 0);
  if (answered === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-[13px] font-semibold text-[#0F2744]">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((o) => (
          <Bar
            key={o.value}
            label={o.label}
            count={counts.get(o.value) ?? 0}
            total={answered}
          />
        ))}
      </div>
    </div>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-gray-700">{label}</span>
        <span className="shrink-0 tabular-nums text-gray-500">
          {count} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0A7B6E" }} />
      </div>
    </div>
  );
}
