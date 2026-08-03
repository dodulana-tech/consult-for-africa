import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import {
  HAVEN_SURVEYS,
  type SurveyMeta,
  type ScaleQuestion,
} from "@/lib/haven-survey";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

// ---- aggregation helpers ---------------------------------------------------

type ScaleStat = ScaleQuestion & {
  n: number;
  mean: number | null;
  dist: Record<string, number>; // "1".."5" and "NA"
};

function aggregateScale(rows: Payload[], questions: ScaleQuestion[]): ScaleStat[] {
  return questions.map((q) => {
    const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, NA: 0 };
    let sum = 0;
    let n = 0;
    for (const p of rows) {
      const v = p[q.key];
      if (v === undefined || v === null || v === "") continue;
      if (v === "NA") {
        dist.NA++;
        continue;
      }
      const num = Number(v);
      if (Number.isFinite(num) && num >= 1 && num <= 5) {
        sum += num;
        n++;
        dist[String(num)] = (dist[String(num)] ?? 0) + 1;
      }
    }
    return { ...q, n, mean: n ? sum / n : null, dist };
  });
}

function aggregateCategorical(rows: Payload[], key: string, options: string[]) {
  const counts = new Map<string, number>();
  let answered = 0;
  for (const p of rows) {
    const v = p[key];
    if (typeof v !== "string" || v === "") continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
    answered++;
  }
  const ordered = options.map((o) => ({ label: o, count: counts.get(o) ?? 0 }));
  // capture any unexpected values not in the known option list
  for (const [label, count] of counts) {
    if (!options.includes(label)) ordered.push({ label, count });
  }
  return { answered, rows: ordered };
}

function collectOpenText(rows: Payload[], key: string): string[] {
  const out: string[] = [];
  for (const p of rows) {
    const v = p[key];
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  }
  return out;
}

// colour by "goodness": on reverse-worded items a low score is the good result
function meanColor(mean: number, reverse?: boolean): { bg: string; color: string } {
  const good = reverse ? 6 - mean : mean;
  if (good >= 4) return { bg: "#D1FAE5", color: "#065F46" };
  if (good >= 3) return { bg: "#FEF3C7", color: "#92400E" };
  return { bg: "#FEE2E2", color: "#991B1B" };
}

// ---- small presentational pieces ------------------------------------------

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: "#0F2744" }}>
        {value}
      </p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function DistBar({ dist, total }: { dist: Record<string, number>; total: number }) {
  // 1..5 low->high, coloured red->green; NA shown separately
  const colors: Record<string, string> = {
    "1": "#EF4444",
    "2": "#F59E0B",
    "3": "#FCD34D",
    "4": "#84CC16",
    "5": "#10B981",
  };
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#eef2f6" }}>
      {["1", "2", "3", "4", "5"].map((k) =>
        dist[k] ? (
          <div
            key={k}
            style={{ width: `${(dist[k] / Math.max(total, 1)) * 100}%`, background: colors[k] }}
            title={`${k}: ${dist[k]}`}
          />
        ) : null
      )}
    </div>
  );
}

function SectionTable({ stats }: { stats: ScaleStat[] }) {
  // group by section, preserving order
  const groups: { section: string; items: ScaleStat[] }[] = [];
  for (const s of stats) {
    const last = groups[groups.length - 1];
    if (last && last.section === s.section) last.items.push(s);
    else groups.push({ section: s.section, items: [s] });
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.section}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {g.section}
          </h4>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
            {g.items.map((s, i) => {
              const answered = s.n + (s.dist.NA ?? 0);
              return (
                <div
                  key={s.key}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-center px-4 py-3"
                  style={{
                    background: "#fff",
                    borderTop: i === 0 ? "none" : "1px solid #eef2f6",
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: "#1F2937" }}>
                      {s.text}
                      {s.reverse && (
                        <span
                          className="ml-2 text-[10px] font-semibold uppercase tracking-wide align-middle"
                          style={{ color: "#92400E", background: "#FEF3C7", padding: "1px 6px", borderRadius: 6 }}
                          title="Negatively worded: a lower score is the good result"
                        >
                          reverse
                        </span>
                      )}
                    </p>
                    <div className="mt-2 max-w-md">
                      <DistBar dist={s.dist} total={s.n} />
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    {s.mean === null ? (
                      <span className="text-sm text-gray-400">no data</span>
                    ) : (
                      <span
                        className="inline-block text-sm font-bold rounded-lg px-2.5 py-1 tabular-nums"
                        style={meanColor(s.mean, s.reverse)}
                      >
                        {s.mean.toFixed(2)}
                      </span>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                      n={s.n}
                      {s.dist.NA ? ` · NA=${s.dist.NA}` : ""}
                      {answered ? ` · ${answered} ans` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoricalBlock({
  field,
  data,
}: {
  field: { key: string; label: string; options: string[] };
  data: { answered: number; rows: { label: string; count: number }[] };
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
        {field.label}
      </p>
      <p className="text-[11px] text-gray-400 mb-3 tabular-nums">{data.answered} answered</p>
      <div className="space-y-2">
        {data.rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-xs w-40 shrink-0 truncate" style={{ color: "#374151" }} title={r.label}>
              {r.label}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#eef2f6" }}>
              <div
                style={{
                  width: `${(r.count / Math.max(data.answered, 1)) * 100}%`,
                  background: "#0B3C5D",
                  height: "100%",
                }}
              />
            </div>
            <span className="text-xs tabular-nums w-8 text-right text-gray-500">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- page ------------------------------------------------------------------

export default async function HavenSurveyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(
    session.user.role
  );
  if (!allowed) redirect("/dashboard");

  const responses = await prisma.auditSurveyResponse.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, survey: true, payload: true, createdAt: true },
  });

  const total = responses.length;
  const latest = responses[0]?.createdAt ?? null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Haven Diagnostic Survey"
        subtitle={`${total} anonymous response${total === 1 ? "" : "s"} on-platform`}
        backHref="/dashboard"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {total === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#fff", border: "1px dashed #cbd5e1", color: "#64748b" }}
          >
            No survey responses yet. Submissions from the staff and patient forms will appear here.
          </div>
        )}

        {HAVEN_SURVEYS.map((meta: SurveyMeta) => {
          const rows = responses
            .filter((r) => r.survey === meta.id)
            .map((r) => (r.payload ?? {}) as Payload);
          const count = rows.length;

          const scaleStats = aggregateScale(rows, meta.questions);
          const positive = scaleStats.filter((s) => !s.reverse && s.mean !== null);
          const positiveAvg =
            positive.length > 0
              ? (positive.reduce((sum, s) => sum + (s.mean ?? 0), 0) / positive.length).toFixed(2)
              : "N/A";

          const surveyLatest =
            responses.find((r) => r.survey === meta.id)?.createdAt ?? null;

          return (
            <section key={meta.id} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F2744" }}>
                  {meta.title}
                </h2>
                <p className="text-sm text-gray-500">{meta.audience}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card label="Responses" value={String(count)} />
                <Card
                  label="Avg (positive items)"
                  value={positiveAvg}
                  hint="Mean of positively worded 1-5 items"
                />
                <Card
                  label="Latest"
                  value={
                    surveyLatest
                      ? surveyLatest.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
              </div>

              {count === 0 ? (
                <p className="text-sm text-gray-400">No responses for this survey yet.</p>
              ) : (
                <>
                  <SectionTable stats={scaleStats} />

                  {meta.categorical.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meta.categorical.map((f) => (
                        <CategoricalBlock
                          key={f.key}
                          field={f}
                          data={aggregateCategorical(rows, f.key, f.options)}
                        />
                      ))}
                    </div>
                  )}

                  {meta.openText.map((f) => {
                    const answers = collectOpenText(rows, f.key);
                    if (answers.length === 0) return null;
                    return (
                      <div key={f.key}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          {f.label} · {answers.length}
                        </h4>
                        <div className="space-y-2">
                          {answers.map((a, i) => (
                            <div
                              key={i}
                              className="rounded-lg px-4 py-3 text-sm"
                              style={{ background: "#fff", border: "1px solid #e5eaf0", color: "#374151" }}
                            >
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
