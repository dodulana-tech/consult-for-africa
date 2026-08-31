import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import {
  HAVEN_SURVEYS,
  type SurveyMeta,
  type ScaleQuestion,
} from "@/lib/haven-survey";
import {
  FOUNDER_ROSTER,
  RUNGS,
  CATS,
  TENSIONS,
  BELIEFS,
  FOUNDER_OPEN_TEXT,
  tensionScore,
  groupSide,
} from "@/lib/haven-founders";

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

// ---- founders' direction survey -------------------------------------------

function FounderChip({ name, done }: { name: string; done: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
      style={{
        background: done ? "#ecfdf5" : "#fff",
        border: `1px solid ${done ? "#a7f3d0" : "#e5eaf0"}`,
        color: done ? "#065f46" : "#94a3b8",
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          width: 18, height: 18,
          background: done ? "#059669" : "#e2e8f0",
          color: done ? "#fff" : "#94a3b8",
        }}
      >
        {done ? "✓" : "–"}
      </span>
      <span className={done ? "font-semibold" : ""}>{name}</span>
    </div>
  );
}

function AllocRow({
  label, hint, own, others,
}: { label: string; hint: string; own: number[]; others: number[] }) {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const spread = own.length > 1 ? Math.max(...own) - Math.min(...own) : 0;
  const ownAvg = avg(own);
  const othersAvg = avg(others);
  const wide = spread >= 25;
  return (
    <div className="py-3" style={{ borderBottom: "1px solid #eef2f6" }}>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "#0F2744" }}>{label}</div>
          <div className="text-xs text-gray-400">{hint}</div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-bold tabular-nums" style={{ color: "#0B3C5D" }}>
            ₦{ownAvg.toFixed(0)}
          </span>
          <span className="text-xs text-gray-400"> avg</span>
          {wide && (
            <div className="text-[10px] font-semibold" style={{ color: "#b45309" }}>
              spread {spread}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] w-14 shrink-0 text-gray-400">theirs</span>
        <div className="flex-1 h-2 rounded" style={{ background: "#eef2f6" }}>
          <div className="h-2 rounded" style={{ width: `${Math.min(ownAvg, 100)}%`, background: "#0B3C5D" }} />
        </div>
        <span className="text-[10px] w-9 text-right tabular-nums text-gray-500">{ownAvg.toFixed(0)}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] w-14 shrink-0 text-gray-400">group</span>
        <div className="flex-1 h-2 rounded" style={{ background: "#eef2f6" }}>
          <div className="h-2 rounded" style={{ width: `${Math.min(othersAvg, 100)}%`, background: "#D4AF37" }} />
        </div>
        <span className="text-[10px] w-9 text-right tabular-nums text-gray-500">{othersAvg.toFixed(0)}</span>
      </div>
    </div>
  );
}

function TensionRow({
  a, b, scores,
}: { a: string; b: string; scores: number[] }) {
  const n = scores.length;
  const aSide = scores.filter((s) => s < 0).length;
  const bSide = scores.filter((s) => s > 0).length;
  const mean = n ? scores.reduce((x, y) => x + y, 0) / n : 0;
  const unanimous = n > 1 && (aSide === n || bSide === n);
  const split = n > 1 && Math.abs(aSide - bSide) <= 1;
  const pct = ((mean + 2) / 4) * 100;
  return (
    <div className="py-3" style={{ borderBottom: "1px solid #eef2f6" }}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-xs font-medium" style={{ color: "#0B3C5D" }}>{a}</span>
        {unanimous && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "#ecfdf5", color: "#065f46" }}>AGREED</span>
        )}
        {split && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "#fef3c7", color: "#92400e" }}>SPLIT {aSide}–{bSide}</span>
        )}
        <span className="text-xs font-medium text-right" style={{ color: "#92400e" }}>{b}</span>
      </div>
      <div className="relative h-2 rounded" style={{ background: "linear-gradient(90deg,#dbeafe,#fef3c7)" }}>
        <div
          className="absolute rounded-full"
          style={{
            left: `calc(${pct}% - 5px)`, top: -2, width: 10, height: 12,
            background: "#0F2744", border: "2px solid #fff",
          }}
        />
      </div>
    </div>
  );
}

function FoundersSection({
  rows, latest, superseded,
}: { rows: Payload[]; latest: Date | null; superseded: number }) {
  const responded = rows
    .map((r) => String(r.respondent ?? "").trim())
    .filter(Boolean);
  const outstanding = FOUNDER_ROSTER.filter(
    (n) => !responded.some((r) => r.toLowerCase() === n.toLowerCase())
  );
  const count = rows.length;

  const num = (p: Payload, k: string) => {
    const v = Number(p[k]);
    return Number.isFinite(v) ? v : 0;
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0F2744" }}>
          Founders&rsquo; Direction Survey
        </h2>
        <p className="text-sm text-gray-500">
          Named, not anonymous. Sets up the strategy session.
        </p>
      </div>

      {/* who has filled it in */}
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Completion
          </h3>
          <span className="text-sm font-bold tabular-nums" style={{ color: count === 5 ? "#059669" : "#0B3C5D" }}>
            {count} of 5
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {FOUNDER_ROSTER.map((n) => (
            <FounderChip key={n} name={n} done={!outstanding.includes(n)} />
          ))}
        </div>
        {outstanding.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            Still to complete: {outstanding.join(", ")}.
            {" "}The synthesis is only meaningful once at least three are in.
          </p>
        )}
        {superseded > 0 && (
          <p className="text-xs mt-2" style={{ color: "#92400e" }}>
            {superseded} earlier submission{superseded === 1 ? " was" : "s were"} replaced by a
            later one from the same founder. Only the most recent counts below.
          </p>
        )}
        {latest && (
          <p className="text-xs text-gray-400 mt-2">
            Last response {latest.toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        )}
      </div>

      {count === 0 ? (
        <p className="text-sm text-gray-400">
          No founder has completed it yet. Results appear here as they submit.
        </p>
      ) : (
        <>
          {/* ambition ladder */}
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Which rung should Haven aim for
            </h3>
            <div className="space-y-2">
              {RUNGS.map((r) => {
                const own = rows.filter((p) => String(p.rung) === r.value).length;
                const guess = rows.filter((p) => String(p.rung_others) === r.value).length;
                return (
                  <div key={r.value} className="flex items-center gap-3">
                    <span className="text-xs w-44 shrink-0" style={{ color: "#0F2744" }}>
                      <b>{r.short}</b>
                    </span>
                    <div className="flex-1 flex items-center gap-1">
                      {Array.from({ length: count }).map((_, i) => (
                        <span key={i} className="h-4 flex-1 rounded-sm"
                              style={{ background: i < own ? "#0B3C5D" : "#eef2f6" }} />
                      ))}
                    </div>
                    <span className="text-[11px] w-24 text-right text-gray-500 tabular-nums">
                      {own} own · {guess} guess
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              &ldquo;Own&rdquo; is where each founder would aim. &ldquo;Guess&rdquo; is where they
              think the others would aim. A gap between the two columns is a misread group.
            </p>
          </div>

          {/* the two ₦100 splits */}
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Where the next ₦100 goes
            </h3>
            <p className="text-[11px] text-gray-400 mb-2">
              Navy is their own split. Gold is how they think the group would split it.
            </p>
            {CATS.map((c) => (
              <AllocRow
                key={c.key}
                label={c.label}
                hint={c.hint}
                own={rows.map((p) => num(p, `own_${c.key}`))}
                others={rows.map((p) => num(p, `others_${c.key}`))}
              />
            ))}
          </div>

          {/* tensions */}
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              The eight tensions
            </h3>
            <p className="text-[11px] text-gray-400 mb-2">
              Marker is the group&rsquo;s centre of gravity. Agreed items are settled;
              split items are the session agenda.
            </p>
            {TENSIONS.map((t) => (
              <TensionRow
                key={t.key}
                a={t.a}
                b={t.b}
                scores={rows
                  .map((p) => tensionScore(p[t.key]))
                  .filter((s): s is number => s !== null)}
              />
            ))}
          </div>

          {/* perception gap */}
          <div className="rounded-xl p-5" style={{ background: "#FBF6E6", border: "1px solid #e8dcb5" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#8a6d1f" }}>
              The perception gap
            </h3>
            <p className="text-[11px] mb-3" style={{ color: "#7a6224" }}>
              What each founder predicted the group believes, against where the group
              actually landed. A mismatch means the group is managing an assumption
              rather than a disagreement.
            </p>
            <div className="space-y-2">
              {BELIEFS.map((b) => {
                const actual = groupSide(
                  rows.map((p) => tensionScore(p[b.tensionKey]))
                      .filter((s): s is number => s !== null)
                );
                const predA = rows.filter((p) => p[b.key] === "a").length;
                const predB = rows.filter((p) => p[b.key] === "b").length;
                const predicted = predA === predB ? "split" : predA > predB ? "a" : "b";
                const match = predicted === actual;
                const word = (s: string) => (s === "a" ? b.a : s === "b" ? b.b : "no clear lean");
                return (
                  <div key={b.key} className="rounded-lg px-4 py-3 text-sm"
                       style={{ background: "#fff", border: "1px solid #e8dcb5" }}>
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ color: "#0F2744" }}>
                        Predicted: <b>{word(predicted)}</b> ({predA}–{predB})
                        {"  ·  "}
                        Actual: <b>{word(actual)}</b>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={match
                              ? { background: "#ecfdf5", color: "#065f46" }
                              : { background: "#fee2e2", color: "#991b1b" }}>
                        {match ? "READ CORRECTLY" : "MISREAD"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* open text */}
          {FOUNDER_OPEN_TEXT.map((f) => {
            const answers = rows
              .map((p) => ({ who: String(p.respondent ?? "—"), text: String(p[f.key] ?? "").trim() }))
              .filter((a) => a.text.length > 1);
            if (answers.length === 0) return null;
            return (
              <div key={f.key}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  {f.label} · {answers.length}
                </h4>
                <div className="space-y-2">
                  {answers.map((a, i) => (
                    <div key={i} className="rounded-lg px-4 py-3 text-sm"
                         style={{ background: "#fff", border: "1px solid #e5eaf0", color: "#374151" }}>
                      <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                           style={{ color: "#0B3C5D" }}>{a.who}</div>
                      {a.text}
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
}

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

  // Founders can submit more than once; the form deliberately does not block a
  // resubmission. Keep only the latest per person so a refill supersedes rather
  // than double-counting them through every average below. `responses` is
  // ordered newest first, so the first sighting of a name is the current one.
  const seenFounders = new Set<string>();
  const founderRows = responses
    .filter((r) => r.survey === "haven-leadership-instinct")
    .map((r) => (r.payload ?? {}) as Payload)
    .filter((p) => {
      const who = String(p.respondent ?? "").trim().toLowerCase();
      if (!who) return true; // unattributed: keep, cannot dedupe it
      if (seenFounders.has(who)) return false;
      seenFounders.add(who);
      return true;
    });
  const founderSupersededCount =
    responses.filter((r) => r.survey === "haven-leadership-instinct").length -
    founderRows.length;
  const founderLatest =
    responses.find((r) => r.survey === "haven-leadership-instinct")?.createdAt ?? null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Haven Diagnostic Survey"
        subtitle={`${total} response${total === 1 ? "" : "s"} on-platform · ${founderRows.length} of 5 founders`}
        backHref="/dashboard"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        <FoundersSection
          rows={founderRows}
          latest={founderLatest}
          superseded={founderSupersededCount}
        />

        {total === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#fff", border: "1px dashed #cbd5e1", color: "#64748b" }}
          >
            No survey responses yet. Submissions from the founder, staff and patient
            forms will appear here.
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
