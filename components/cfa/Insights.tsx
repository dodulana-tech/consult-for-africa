import Image from "next/image";
import { getInsights } from "@/sanity/lib/getInsights";
import WhitepaperGate from "@/components/cfa/WhitepaperGate";

export default async function Insights() {
  const { featured, latest } = await getInsights();

  return (
    <section className="py-20 bg-[var(--surface-muted)]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Insights & Publications
          </h2>
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">
            Perspectives on hospital performance, governance, capital projects,
            and health system strengthening across Africa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">

          {/* FEATURED WHITEPAPER */}
          {featured && (
            <div className="md:col-span-2 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 group">

              {featured.imageUrl && (
                <Image
                  src={featured.imageUrl}
                  alt={featured.title}
                  width={1600}
                  height={900}
                  className="h-52 md:h-56 w-full object-cover"
                />
              )}

              <div className="p-6 md:p-8">

                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Featured Whitepaper
                </p>

                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                  {featured.title}
                </h3>

                <p className="text-gray-600 text-sm max-w-xl">
                  {featured.summary}
                </p>

                <WhitepaperGate fileUrl={featured.fileUrl} />

                <p className="text-xs text-gray-400 mt-2">
                  Executive briefing • PDF • Work email required
                </p>
              </div>
            </div>
          )}

          {/* SUPPORTING INSIGHTS */}
          <div className="space-y-6">
            {latest.map((p: any) => (
              <div
                key={p._id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300"
              >
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    width={600}
                    height={400}
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    {p.category}
                  </p>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {p.title}
                  </h3>
                  <div className="mt-3 text-sm text-[var(--brand-primary)] font-medium">
                    Read insight →
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
