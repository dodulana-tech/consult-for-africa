import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import {
  OSTEON_SURVEYS,
  tensionSide,
  type SurveyMeta,
  type ScaleQuestion,
} from "@/lib/osteon-survey";

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

function countMulti(rows: Payload[], key: string, options: string[]) {
  const counts = new Map<string, number>();
  let answered = 0;
  for (const p of rows) {
    const v = p[key];
    const list = Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
    if (!list.length) continue;
    answered++;
    for (const item of list) counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
  }
  const ordered = options.map((o) => ({ label: o, count: counts.get(o) ?? 0 }));
  for (const [label, count] of counts) {
    if (!options.includes(label)) ordered.push({ label, count });
  }
  ordered.sort((a, b) => b.count - a.count);
  return { answered, rows: ordered };
}

/** Mean of a constant-sum split, plus the spread between the highest and lowest respondent. */
function splitStats(rows: Payload[], items: { key: string; label: string }[]) {
  return items
    .map((it) => {
      const vals = rows
        .map((p) => Number(p[it.key]))
        .filter((n) => Number.isFinite(n));
      if (!vals.length) return { ...it, mean: 0, min: 0, max: 0, n: 0 };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { ...it, mean, min: Math.min(...vals), max: Math.max(...vals), n: vals.length };
    })
    .sort((a, b) => b.mean - a.mean);
}

const fmt = (n: number | null, dp = 2) => (n === null ? "—" : n.toFixed(dp));

function meanColour(mean: number | null, reverse?: boolean) {
  if (mean === null) return "#94a3b8";
  const good = reverse ? 6 - mean : mean;
  if (good >= 4) return "#15803d";
  if (good >= 3.25) return "#b45309";
  return "#b3261e";
}

// ---- presentation ----------------------------------------------------------

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
        const scored = items.filter((s) => s.mean !== null);
        const sectionMean = scored.length
          ? scored.reduce((a, b) => a + (b.reverse ? 6 - (b.mean ?? 0) : (b.mean ?? 0)), 0) / scored.length
          : null;
        return (
          <div key={section}>
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="text-sm font-semibold" style={{ color: "#0B3C5D" }}>{section}</h4>
              <span className="text-xs" style={{ color: meanColour(sectionMean) }}>
                section mean {fmt(sectionMean)} (reverse items re-oriented)
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map((s) => (
                  <tr key={s.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="py-2 pr-3" style={{ color: "#1F2937" }}>
                      {s.text}
                      {s.reverse && (
                        <span className="ml-2 text-xs" style={{ color: "#6B7280" }}>
                          (lower is better)
                        </span>
                      )}
                    </td>
                    <td className="py-2 w-32">
                      <Bar value={s.mean ?? 0} max={5} colour={meanColour(s.mean, s.reverse)} />
                    </td>
                    <td className="py-2 pl-3 w-16 text-right font-semibold" style={{ color: meanColour(s.mean, s.reverse) }}>
                      {fmt(s.mean)}
                    </td>
                    <td className="py-2 pl-3 w-20 text-right text-xs" style={{ color: "#6B7280" }}>
                      n={s.n}{s.na ? ` · NA ${s.na}` : ""}
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

      {n === 0 && (
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Nothing in yet. Responses appear here the moment the first one lands.
        </p>
      )}

      {n > 0 && (
        <>
          {!meta.anonymous && (
            <div className="text-sm" style={{ color: "#1F2937" }}>
              <span className="font-semibold" style={{ color: "#0B3C5D" }}>Who has answered: </span>
              {rows.map((p) => String(p.respondent ?? "unnamed")).join(", ")}
            </div>
          )}

          {meta.splits.map((split) => {
            const stats = splitStats(rows, split.items);
            const max = Math.max(1, ...stats.map((s) => s.mean));
            return (
              <div key={split.label}>
                <h4 className="text-sm font-semibold mb-1" style={{ color: "#0B3C5D" }}>{split.label}</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {stats.map((s) => {
                      const spread = s.max - s.min;
                      return (
                        <tr key={s.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td className="py-1.5 pr-3" style={{ color: "#1F2937" }}>{s.label}</td>
                          <td className="py-1.5 w-28"><Bar value={s.mean} max={max} colour="#D4AF37" /></td>
                          <td className="py-1.5 pl-3 w-12 text-right font-semibold">{s.mean.toFixed(0)}</td>
                          <td
                            className="py-1.5 pl-3 w-28 text-right text-xs"
                            style={{ color: spread >= 25 ? "#b3261e" : "#6B7280" }}
                          >
                            {s.n > 1 ? `${s.min} to ${s.max}${spread >= 25 ? " · split" : ""}` : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {meta.tensions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1" style={{ color: "#0B3C5D" }}>
                The eight choices
              </h4>
              <table className="w-full text-sm">
                <tbody>
                  {meta.tensions.map((t) => {
                    const vals = rows.map((p) => Number(p[t.key])).filter((v) => Number.isFinite(v));
                    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                    const spread = vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
                    const side = mean === null ? "—" : tensionSide(mean);
                    const agreed = vals.length > 1 && spread <= 1;
                    return (
                      <tr key={t.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td className="py-2 pr-3 text-right w-1/3" style={{ color: side === "A" ? "#0B3C5D" : "#6B7280", fontWeight: side === "A" ? 700 : 400 }}>
                          {t.a}
                        </td>
                        <td className="py-2 w-20 text-center font-semibold" style={{ color: "#1F7A8C" }}>
                          {mean === null ? "—" : mean.toFixed(1)}
                        </td>
                        <td className="py-2 pl-3 w-1/3" style={{ color: side === "B" ? "#0B3C5D" : "#6B7280", fontWeight: side === "B" ? 700 : 400 }}>
                          {t.b}
                        </td>
                        <td className="py-2 pl-3 text-xs text-right w-24" style={{ color: agreed ? "#15803d" : "#b3261e" }}>
                          {vals.length > 1 ? (agreed ? "agreed" : "split") : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta.questions.length > 0 && <ScaleTable stats={scaleStats(rows, meta.questions)} />}

          <div className="grid gap-5 md:grid-cols-2">
            {meta.categorical.map((c) => {
              const { answered, rows: r } = countCategorical(rows, c.key, c.options);
              return answered ? <CountTable key={c.key} title={c.label} answered={answered} rows={r} /> : null;
            })}
            {meta.multi.map((m) => {
              const { answered, rows: r } = countMulti(rows, m.key, m.options);
              return answered ? <CountTable key={m.key} title={m.label} answered={answered} rows={r} /> : null;
            })}
          </div>

          {meta.open.map((o) => {
            const said = rows
              .map((p) => ({ who: String(p.respondent ?? ""), text: String(p[o.key] ?? "").trim() }))
              .filter((x) => x.text);
            if (!said.length) return null;
            return (
              <div key={o.key}>
                <h4 className="text-sm font-semibold mb-1" style={{ color: "#0B3C5D" }}>{o.label}</h4>
                <ul className="space-y-1.5">
                  {said.map((x, i) => (
                    <li
                      key={i}
                      className="text-sm"
                      style={{ background: "#f8fafc", borderLeft: "3px solid #D4AF37", padding: "8px 12px", color: "#1F2937" }}
                    >
                      {x.text}
                      {!meta.anonymous && x.who && (
                        <span className="ml-2 text-xs" style={{ color: "#6B7280" }}>— {x.who}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

// ---- page ------------------------------------------------------------------

export default async function OsteonSurveyPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const allowed = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(session.user.role);
  if (!allowed) redirect("/dashboard");

  const ids = OSTEON_SURVEYS.map((s) => s.id);
  const responses = await prisma.auditSurveyResponse.findMany({
    where: { survey: { in: ids } },
    orderBy: { createdAt: "desc" },
    select: { survey: true, payload: true, createdAt: true },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Osteon Clinics Audit Surveys"
        subtitle={`${responses.length} response${responses.length === 1 ? "" : "s"} across four instruments`}
        backHref="/dashboard"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {OSTEON_SURVEYS.map((meta) => {
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
