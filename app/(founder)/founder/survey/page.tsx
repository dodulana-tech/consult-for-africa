import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClipboardList, TrendingUp, Coins, Users, Star, Stethoscope } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLES = ["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"];
const NAVY = "#0F2744";

const naira = (n: number) => "NGN " + Math.round(n).toLocaleString("en-NG");
const share = (a: number, b: number) => (b === 0 ? 0 : a / b);
const pct = (a: number, b: number) => Math.round(share(a, b) * 100) + "%";

function parseMoney(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const digits = v.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return n < 1000 || n > 5_000_000 ? null : n;
}

/** Price where the two cumulative curves cross. */
function crossover(asc: number[], desc: number[]): number | null {
  if (!asc.length || !desc.length) return null;
  const prices = [...new Set([...asc, ...desc])].sort((a, b) => a - b);
  let prev: { p: number; d: number } | null = null;
  for (const p of prices) {
    const diff =
      asc.filter((x) => x <= p).length / asc.length - desc.filter((x) => x >= p).length / desc.length;
    if (prev && prev.d <= 0 && diff >= 0) return Math.round((prev.p + p) / 2);
    prev = { p, d: diff };
  }
  return null;
}

function tally(rows: { payload: unknown }[], key: string) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = (r.payload as Record<string, unknown>)?.[key];
    for (const item of Array.isArray(v) ? v : v ? [v] : []) {
      counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: NAVY }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bar({ label, n, total, highlight }: { label: string; n: number; total: number; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-52 shrink-0 text-xs text-gray-700">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className="h-2 rounded-full" style={{ width: `${share(n, total) * 100}%`, background: highlight ? "#C6A15B" : NAVY }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-gray-500">{n} · {pct(n, total)}</span>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: NAVY }}>{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-gray-500">{note}</p>}
    </div>
  );
}

export default async function SurveyPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.user.role)) redirect("/dashboard");

  const rows = await prisma.mediparkSurveyResponse.findMany({
    where: { survey: "premium-medipark" },
    orderBy: { createdAt: "asc" },
  });
  const N = rows.length;

  const sess = tally(rows, "sessions");
  const sessTotal = sess.reduce((a, [, c]) => a + c, 0);
  const twoPlus = sess.filter(([k]) => ["2", "3", "4 or more"].includes(k)).reduce((a, [, c]) => a + c, 0);
  const fillHolds = share(twoPlus, sessTotal) >= 0.4;

  const grab = (k: string) =>
    rows.map((r) => parseMoney((r.payload as Record<string, unknown>)?.[k])).filter((x): x is number => x !== null);
  const opp = crossover(grab("vwCheap"), grab("vwTooMuch"));
  const ipp = crossover(grab("vwGood"), grab("vwPricey"));

  const memb = tally(rows, "membership");
  const membTotal = memb.reduce((a, [, c]) => a + c, 0);
  const overOneM = memb.filter(([k]) => /1 to 2|2 to 3|Over NGN 3/.test(k)).reduce((a, [, c]) => a + c, 0);
  const wontPay = memb.find(([k]) => k.startsWith("I would not"))?.[1] ?? 0;

  const wants = rows.filter((r) => r.contactChoice === "contact");

  const MATTERS = ["Address and how it feels", "On-site lab and imaging", "Billing handled",
    "Nurse or chaperone", "Parking and discretion", "Session booking, no lease",
    "Which other consultants", "A room of your own"];

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Medipark survey</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Abuja consultant demand. Read against the assumptions the model rests on.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Responses" value={String(N)} note={N < 25 ? "Below 25. Read with caution" : "Target is 40 to 60"} />
        <Stat label="Two or more a week" value={sessTotal ? pct(twoPlus, sessTotal) : "-"} note={fillHolds ? "Fill assumption holds" : "Below 40%, fill fails"} />
        <Stat label="Optimal price point" value={opp ? naira(opp) : "-"} note="Model assumes 94,000 member" />
        <Stat label="Would pay 1M or more" value={membTotal ? pct(overOneM, membTotal) : "-"} note={`${wontPay} would not, these are panel`} />
      </div>

      {N === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">No responses yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            The form is live at /premium-medipark-survey.html
          </p>
        </div>
      ) : (
        <>
          <Section title="Sessions a week — the fill assumption lives here" icon={<TrendingUp className="h-4 w-4" />}>
            <div className="rounded-xl border border-gray-200 p-4">
              {["None", "1", "2", "3", "4 or more"].map((label) => (
                <Bar key={label} label={label} n={sess.find(([k]) => k === label)?.[1] ?? 0}
                     total={sessTotal} highlight={["2", "3", "4 or more"].includes(label)} />
              ))}
              <p className="mt-3 text-xs" style={{ color: fillHolds ? "#2F6B52" : "#B8763A" }}>
                {fillHolds
                  ? `${pct(twoPlus, sessTotal)} would use two or more sessions a week. At or above 40%, so the fill assumption holds and the membership tiers have a market.`
                  : `Only ${pct(twoPlus, sessTotal)} would use two or more a week. Below 40%, so the fill assumption fails and the plaza needs re-sizing.`}
              </p>
            </div>
          </Section>

          <Section title="Price per session" icon={<Coins className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {([["Too cheap to trust", "vwCheap"], ["Good value", "vwGood"],
                 ["Getting expensive", "vwPricey"], ["Too expensive", "vwTooMuch"]] as const).map(([label, key]) => {
                const a = grab(key).sort((x, y) => x - y);
                return <Stat key={key} label={label} value={a.length ? naira(a[Math.floor(a.length / 2)]) : "-"} note={`median, n=${a.length}`} />;
              })}
            </div>
            <div className="mt-3 rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
              <p><b>OPP {opp ? naira(opp) : "-"}</b> is where "too cheap" and "too expensive" cross: fewest rejections either side.
                <b> IPP {ipp ? naira(ipp) : "-"}</b> is where "good value" and "getting expensive" cross: what the market treats as normal.</p>
              <p className="mt-1">Model assumes a four-hour evening block at NGN 94,000 member, NGN 141,000 guest.</p>
            </div>
          </Section>

          <Section title="Membership willingness" icon={<Star className="h-4 w-4" />}>
            <div className="rounded-xl border border-gray-200 p-4">
              {memb.map(([k, c]) => <Bar key={k} label={k} n={c} total={membTotal} highlight={/1 to 2|2 to 3|Over NGN 3/.test(k)} />)}
              <p className="mt-3 text-xs text-gray-500">Tiers are Associate 1.2M, Full 2.4M, Fellow 4.2M, over a 400,000 panel.</p>
            </div>
          </Section>

          <Section title="What they told us about their practice" icon={<Stethoscope className="h-4 w-4" />}>
            <div className="grid gap-4 lg:grid-cols-2">
              {([["Time bands that work", "bands"], ["Private patients a week", "volume"],
                 ["First consultation fee", "fee"], ["Procedures performed", "procedures"]] as const).map(([title, key]) => {
                const t = tally(rows, key);
                const tt = t.reduce((a, [, c]) => a + c, 0);
                return (
                  <div key={key} className="rounded-xl border border-gray-200 p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
                    {t.slice(0, 6).map(([k, c]) => <Bar key={k} label={k} n={c} total={tt} />)}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="What would matter most" icon={<ClipboardList className="h-4 w-4" />}>
            <div className="rounded-xl border border-gray-200 p-4">
              {MATTERS.map((label, i) => {
                const t = tally(rows, `matters_${i}`);
                const tt = t.reduce((a, [, c]) => a + c, 0);
                const hi = t.filter(([k]) => k === "Important" || k === "Essential").reduce((a, [, c]) => a + c, 0);
                return <Bar key={label} label={label} n={hi} total={tt} />;
              })}
              <p className="mt-3 text-xs text-gray-500">Share rating each Important or Essential.</p>
            </div>
          </Section>

          <Section title={`Founding cohort — ${wants.length} asked to be contacted`} icon={<Users className="h-4 w-4" />}>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              {wants.length === 0 && <p className="p-4 text-xs text-gray-400">Nobody yet.</p>}
              {wants.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
                  <div>
                    <span className="font-semibold" style={{ color: NAVY }}>{r.name ?? "Unnamed"}</span>
                    {r.specialty && <span className="ml-2 text-gray-500">{r.specialty}</span>}
                  </div>
                  <div className="flex gap-3 text-gray-500">
                    {r.email && <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>}
                    {r.phone && <span>{r.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
