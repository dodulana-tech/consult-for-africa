export default function Insights() {
  const posts = [
    {
      title: "Revenue Leakage in African Hospitals",
      img: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1200&auto=format&fit=crop",
      tag: "Finance & Performance",
    },
    {
      title: "Building Sustainable Health Systems",
      img: "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop",
      tag: "Health Systems",
    },
  ];

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
          <div className="md:col-span-2 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 group">

            <div className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=1600&auto=format&fit=crop"
                className="h-52 md:h-56 w-full object-cover group-hover:scale-105 transition duration-700"
                alt="Featured whitepaper"
              />
            </div>

            <div className="p-6 md:p-8">

              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Featured Whitepaper
              </p>

              <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug mb-3">
                The Hospital Turnaround Playbook for African Healthcare Operators
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
                A practical framework for restoring financial discipline,
                strengthening governance, and rebuilding operational performance
                in complex hospital environments.
              </p>

              {/* Email capture */}
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Work email"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <button className="px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-semibold hover:shadow-md transition">
                  Download PDF
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Executive briefing • PDF • Instant download
              </p>
            </div>
          </div>

          {/* SUPPORTING INSIGHTS */}
          <div className="space-y-6">
            {posts.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
              >
                <img
                  src={p.img}
                  className="h-36 w-full object-cover"
                  alt={p.title}
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    {p.tag}
                  </p>
                  <h3 className="font-semibold text-gray-900 leading-snug text-sm">
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
