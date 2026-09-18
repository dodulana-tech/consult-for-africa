import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import {
  CLEARVIEW_SURVEYS,
  type SurveyMeta,
  type ScaleQuestion,
} from "@/lib/clearview-survey";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

// ---- aggregation -----------------------------------------------------------

type ScaleStat = ScaleQuestion & { n: number; mean: number | null; na: number };

function scaleStats(rows: Payload[], questions: ScaleQuestion[]): ScaleStat[] {
  return questions.map((q) => {
    let sum = 0;
    let n = 0;
    let na = 0;
    for (const p of rows) {
      const v = p[q.key];
      if (v === undefined || v === null || v === "") continue;
      if (v === "NA") {
        na++;
        continue;
      }
      const num = Number(v);
      if (Number.isFinite(num) && num >= 1 && num <= 5) {
        sum += num;
        n++;
      }
    }
    return { ...q, n, na, mean: n ? sum / n : null };
  });
}

function countCategorical(rows: Payload[], key: string, options: string[]) {
  const counts = new Map<string, number>();
  let answered = 0;
  for (const p of rows) {
    const v = p[key];
    if (typeof v !== "string" || v === "") continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
    answered++;
  }
  const ordered = options.map((o) => ({ label: o, count: counts.get(o) ?? 0 }));
  for (const [label, count] of counts) {
    if (!options.includes(label)) ordered.push({ label, count });
  }
  return { answered, rows: ordered };
}

function openAnswers(rows: Payload[], key: string): string[] {
  return rows
    .map((p) => (typeof p[key] === "string" ? (p[key] as string).trim() : ""))
    .filter((s) => s.length > 0);
}

// A lower score is the good result on a reverse-keyed item, so the colour has
// to flip. Never silently rescored, only recoloured.
function meanColour(mean: number | null, reverse?: boolean) {
  if (mean === null) return "#94a3b8";
  const good = reverse ? 6 - mean : mean;
  if (good >= 4) return "#15803d";
  if (good >= 3.25) return "#b45309";
  return "#b3261e";
}

const fmt = (x: number | null) => (x === null ? "–" : x.toFixed(1));

const CARD = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 } as const;

function Bar({ value, max, colour }: { value: number; max: number; colour: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 20, height: 8, width: "100%" }}>
      <div style={{ background: colour, borderRadius: 20, height: 8, width: `${pct}%` }} />
    </div>
  );
}

function ScaleTable({ stats }: { stats: ScaleStat[] }) {
  const sections = [...new Set(stats.map((s) => s.section))];
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const items = stats.filter((s) => s.section === section);
        return (
          <div key={section}>
            <h4 className="text-sm font-semibold mb-1" style={{ color: "#0B3C5D" }}>{section}</h4>
            <table className="w-full text-sm">
              <tbody>
                {items.map((s) => (
                  <tr key={s.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="py-2 pr-3" style={{ color: "#1F2937" }}>
                      {s.text}
                      {s.reverse && (
                        <span className="ml-2 text-xs" style={{ color: "#94a3b8" }}>
                          (low is good)
                        </span>
                      )}
                    </td>
                    <td className="py-2 w-28">
                      <Bar value={s.mean ?? 0} max={5} colour={meanColour(s.mean, s.reverse)} />
                    </td>
                    <td
                      className="py-2 pl-3 w-14 text-right font-semibold"
                      style={{ color: meanColour(s.mean, s.reverse) }}
                    >
                      {fmt(s.mean)}
                    </td>
                    <td className="py-2 pl-3 w-24 text-right text-xs" style={{ color: "#6B7280" }}>
                      n={s.n}
                      {s.na ? ` · NA ${s.na}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function CountTable({
  title,
  answered,
  rows,
}: {
  title: string;
  answered: number;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="text-sm font-semibold" style={{ color: "#0B3C5D" }}>{title}</h4>
        <span className="text-xs" style={{ color: "#6B7280" }}>{answered} answered</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td className="py-1.5 pr-3" style={{ color: "#1F2937" }}>{r.label}</td>
              <td className="py-1.5 w-28"><Bar value={r.count} max={max} colour="#1F7A8C" /></td>
              <td className="py-1.5 pl-3 w-10 text-right font-semibold">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SurveySection({ meta, rows, latest }: { meta: SurveyMeta; rows: Payload[]; latest: Date | null }) {
  const n = rows.length;
  const stats = scaleStats(rows, meta.questions);
  return (
    <section style={{ ...CARD, padding: 22 }} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#0B3C5D" }}>{meta.title}</h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {meta.audience} · {meta.anonymous ? "anonymous" : "attributed"} ·{" "}
            <a href={meta.formPath} className="underline" style={{ color: "#1F7A8C" }}>the form</a>
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold" style={{ color: n ? "#0B3C5D" : "#94a3b8" }}>{n}</div>
          <div className="text-xs" style={{ color: "#6B7280" }}>
            {latest ? `last ${latest.toLocaleDateString("en-GB")}` : "no responses yet"}
          </div>
        </div>
      </div>

      {n === 0 ? (
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Nothing in yet. The form is live and will collect as soon as the link goes out.
        </p>
      ) : (
        <>
          <ScaleTable stats={stats} />

          {meta.categorical.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {meta.categorical.map((c) => {
                const { answered, rows: counts } = countCategorical(rows, c.key, c.options);
                return <CountTable key={c.key} title={c.label} answered={answered} rows={counts} />;
              })}
            </div>
          )}

          {meta.open.map((o) => {
            const answers = openAnswers(rows, o.key);
            if (!answers.length) return null;
            return (
              <div key={o.key}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#0B3C5D" }}>
                  {o.label}
                  <span className="ml-2 font-normal text-xs" style={{ color: "#6B7280" }}>
                    {answers.length} answered
                  </span>
                </h4>
                <div className="space-y-2">
                  {answers.map((a, i) => (
                    <p
                      key={i}
                      className="text-sm"
                      style={{
                        color: "#1F2937", background: "#f8fafc", borderLeft: "3px solid #D4AF37",
                        borderRadius: 6, padding: "8px 12px", lineHeight: 1.6,
                      }}
                    >
                      {a}
                    </p>
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

export default async function ClearviewAuditPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const allowed = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(session.user.role);
  if (!allowed) redirect("/dashboard");

  const ids = CLEARVIEW_SURVEYS.map((s) => s.id);
  const responses = await prisma.auditSurveyResponse.findMany({
    where: { survey: { in: ids } },
    orderBy: { createdAt: "desc" },
    select: { survey: true, payload: true, createdAt: true },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Clearview Surveys"
        subtitle={`${responses.length} response${responses.length === 1 ? "" : "s"} across five instruments`}
        backHref="/dashboard"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {CLEARVIEW_SURVEYS.map((meta) => {
          const mine = responses.filter((r) => r.survey === meta.id);
          // An attributed respondent may refill; keep only their latest so a
          // resubmission supersedes rather than double-counting. Newest first.
          const seen = new Set<string>();
          const rows = mine
            .map((r) => (r.payload ?? {}) as Payload)
            .filter((p) => {
              if (meta.anonymous) return true;
              const who = String(p.respondent ?? "").trim().toLowerCase();
              if (!who) return true;
              if (seen.has(who)) return false;
              seen.add(who);
              return true;
            });
          return (
            <SurveySection
              key={meta.id}
              meta={meta}
              rows={rows}
              latest={mine[0]?.createdAt ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
