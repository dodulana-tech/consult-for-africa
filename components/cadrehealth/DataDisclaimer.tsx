/**
 * Accuracy disclaimer for migration pathways and exam guides.
 * Fees and requirements change frequently. We encourage users to verify
 * with the official source before making decisions.
 */
export default function DataDisclaimer({
  lastUpdated = "April 2026",
  sources,
}: {
  lastUpdated?: string;
  sources?: { name: string; url: string }[];
}) {
  return (
    <div
      className="rounded-xl p-5 mt-10"
      style={{
        background: "#FFFBEB",
        border: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      <div className="flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(245,158,11,0.15)" }}
        >
          <svg
            className="h-4 w-4 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Verify before you act
          </p>
          <p className="mt-1 text-xs text-amber-700 leading-relaxed">
            Exam fees, visa costs, and requirements change frequently. The
            information on this page was last reviewed in {lastUpdated}. Always
            confirm fees and requirements directly with the official body before
            making payments or decisions.
          </p>
          {sources && sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-amber-800 transition hover:bg-amber-100"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(245,158,11,0.15)" }}
                >
                  {s.name}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-amber-600">
            Exchange rates are approximate and fluctuate daily.
          </p>
        </div>
      </div>
    </div>
  );
}
