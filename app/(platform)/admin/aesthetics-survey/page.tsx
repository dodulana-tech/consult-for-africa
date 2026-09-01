import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";

export const dynamic = "force-dynamic";

// Results view for the aesthetics partnership positions survey
// (public/aesthetics-partnership-survey.html).
//
// There are only three respondents, so aggregation would tell us nothing. What
// matters is divergence: the same question, the three answers, side by side.
// The shared block is therefore rendered first and as one comparison table,
// because that is the view the negotiation actually turns on.

type Payload = Record<string, unknown>;

const ROLES = [
  { id: "aesthetics-capital-partner", who: "Dr Itunu Akinware", label: "Capital partner" },
  { id: "aesthetics-clinical-partner", who: "Dr Chinwe Kpaduwa", label: "Clinical partner" },
  { id: "aesthetics-operating-partner", who: "Dr Adebowale Odulana", label: "Operating partner" },
] as const;

const SHARED: [string, string][] = [
  ["success_november", "What success looks like in November"],
  ["walk_away", "What would make them walk away"],
  ["confidence", "Confidence it survives three years (1 to 5)"],
  ["confidence_lever", "What the other two could do to raise that"],
  ["unsaid", "Not yet said in the group (for Debo only)"],
];

const CLINICAL: [string, string][] = [
  ["visits_per_year", "Visits per year she can sustain"],
  ["days_per_visit", "Working days per visit"],
  ["commitment_years", "For how long she can hold that level"],
  ["impossible_months", "Months that are impossible"],
  ["remote_sessions", "Remote governance sessions per month"],
  ["notice_period", "Notice if a visit must move"],
  ["cover_model", "Post-operative cover model"],
  ["resident_surgeon_criteria", "What a resident surgeon must be, to take a transfer"],
  ["asps_standard", "Accepts the ASPS itinerant surgery standard"],
  ["procedures_yes", "Procedures she will perform in Lagos"],
  ["procedures_no", "Procedures she will not perform"],
  ["pay_mix", "Pay versus equity preference"],
  ["vesting_comfort", "Share of equity she will earn over time"],
  ["brand_misuse", "What would count as misuse of her name"],
  ["need_from_medbury", "What she needs from Medbury and has not asked for"],
];

const CAPITAL: [string, string][] = [
  ["funding_to_review", "Funding ceiling before the November review (NGN m)"],
  ["funding_total", "Total funding ceiling (NGN m)"],
  ["fitout_equipment", "Fit-out and equipment (NGN m)"],
  ["clinic_sqm", "Clinic area allocated (sqm)"],
  ["rent_basis", "How the space is charged"],
  ["waiver_limit", "Waiver period and cap"],
  ["referrals_per_month", "Referrals per month she can commit"],
  ["min_holding", "Minimum acceptable shareholding (%)"],
  ["casting_vote_scope", "Decisions needing a casting vote"],
  ["clinical_autonomy", "Content that clinical decisions stay with the Clinical Director"],
  ["priority_return", "Priority return preference"],
  ["priority_rate", "Rate, if a stated return"],
  ["vesting_expectation", "Share of others' equity that should vest"],
  ["registration_delay", "If registration takes eighteen months"],
];

const OPERATING: [string, string][] = [
  ["market_fee", "Full market operating fee (% of revenue)"],
  ["proposed_fee", "Fee proposed to this company (%)"],
  ["min_holding", "Minimum acceptable shareholding (%)"],
  ["milestones", "Milestones equity may vest against"],
  ["undeliverable", "What would make this undeliverable"],
];

function val(p: Payload | undefined, k: string): string {
  const v = p?.[k];
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s;
}

function Cell({ text }: { text: string }) {
  if (!text) return <span className="text-gray-300">not answered</span>;
  return <span className="whitespace-pre-wrap">{text}</span>;
}

function Block({
  title,
  rows,
  payload,
  who,
}: {
  title: string;
  rows: [string, string][];
  payload: Payload | undefined;
  who: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "#3B2A45" }}>
          {title}
        </h2>
        <p className="text-sm text-gray-500">{who}</p>
      </div>
      {!payload ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ background: "#fff", border: "1px dashed #cbd5e1", color: "#64748b" }}
        >
          No response yet.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E3D3DE" }}>
          <table className="w-full text-sm bg-white">
            <tbody>
              {rows.map(([k, label], i) => (
                <tr key={k} style={{ borderTop: i ? "1px solid #F1E9EE" : undefined }}>
                  <td className="p-3 align-top w-1/3 text-gray-500">{label}</td>
                  <td className="p-3 align-top" style={{ color: "#2C2530" }}>
                    <Cell text={val(payload, k)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AestheticsSurveyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(
    session.user.role,
  );
  if (!allowed) redirect("/dashboard");

  const responses = await prisma.auditSurveyResponse.findMany({
    where: { survey: { in: ROLES.map((r) => r.id) } },
    orderBy: { createdAt: "desc" },
    select: { id: true, survey: true, payload: true, createdAt: true },
  });

  // Newest submission per role wins; earlier ones are superseded, not deleted.
  const latest = new Map<string, { payload: Payload; createdAt: Date }>();
  for (const r of responses) {
    if (!latest.has(r.survey)) {
      latest.set(r.survey, { payload: (r.payload ?? {}) as Payload, createdAt: r.createdAt });
    }
  }
  const inCount = latest.size;
  const outstanding = ROLES.filter((r) => !latest.has(r.id));
  const superseded = responses.length - inCount;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Aesthetics Partnership Survey"
        subtitle={`${inCount} of 3 in${
          outstanding.length ? ` · awaiting ${outstanding.map((o) => o.who).join(", ")}` : ""
        }${superseded ? ` · ${superseded} superseded` : ""}`}
        backHref="/dashboard"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {inCount === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#fff", border: "1px dashed #cbd5e1", color: "#64748b" }}
          >
            No responses yet. The form is at{" "}
            <span className="font-mono text-xs">/aesthetics-partnership-survey.html</span>.
          </div>
        )}

        {inCount > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#3B2A45" }}>
                The four questions all three answer
              </h2>
              <p className="text-sm text-gray-500">
                Read across. Divergence here is the negotiation.
              </p>
            </div>
            <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #E3D3DE" }}>
              <table className="w-full text-sm bg-white" style={{ minWidth: 860 }}>
                <thead>
                  <tr style={{ background: "#F6F1EA" }}>
                    <th className="p-3 text-left font-semibold text-gray-500 w-56">Question</th>
                    {ROLES.map((r) => (
                      <th
                        key={r.id}
                        className="p-3 text-left font-semibold"
                        style={{ color: "#3B2A45" }}
                      >
                        {r.who}
                        <span className="block text-xs font-normal text-gray-500">{r.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHARED.map(([k, label], i) => (
                    <tr key={k} style={{ borderTop: i ? "1px solid #F1E9EE" : undefined }}>
                      <td className="p-3 align-top text-gray-500">{label}</td>
                      {ROLES.map((r) => (
                        <td
                          key={r.id}
                          className="p-3 align-top"
                          style={{ color: "#2C2530", verticalAlign: "top" }}
                        >
                          <Cell text={val(latest.get(r.id)?.payload, k)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Block
          title="Time, cover, pay and the brand"
          who="Dr Chinwe Kpaduwa, clinical partner"
          rows={CLINICAL}
          payload={latest.get("aesthetics-clinical-partner")?.payload}
        />
        <Block
          title="Money, control and ownership"
          who="Dr Itunu Akinware, capital partner"
          rows={CAPITAL}
          payload={latest.get("aesthetics-capital-partner")?.payload}
        />
        <Block
          title="The operating position"
          who="Dr Adebowale Odulana, operating partner"
          rows={OPERATING}
          payload={latest.get("aesthetics-operating-partner")?.payload}
        />

        {inCount > 0 && (
          <p className="text-xs text-gray-400">
            Latest submission per role is shown. Earlier submissions are retained but superseded.
          </p>
        )}
      </div>
    </div>
  );
}
