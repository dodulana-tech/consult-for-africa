"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronUp, Clock, Layers, Grid3X3,
  CheckCircle2, Circle, ArrowRight, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Gate {
  id: string;
  name: string;
  criteria: string;
  order: number;
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  order: number;
  typicalWeeks: number;
  keyActivities: string[];
  keyDeliverables: string[];
  gates: Gate[];
}

interface Methodology {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  serviceTypes: string[];
  estimatedWeeks: number;
  phases: Phase[];
  _count: { engagements: number };
}

interface Framework {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  dimensions: string[];
  guideText: string | null;
  sortOrder: number;
}

// ─── Category Badge ───────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; color: string }> = {
  Strategy: { bg: "#EFF6FF", color: "#1D4ED8" },
  Operations: { bg: "#F0FDF4", color: "#059669" },
  Quality: { bg: "#FFF7ED", color: "#D97706" },
  Revenue: { bg: "#FDF4FF", color: "#9333EA" },
  cfa_proprietary: { bg: "#0F2744", color: "#fff" },
  "Public Health & M&E": { bg: "#ECFDF5", color: "#065F46" },
  "Health Economics": { bg: "#F5F3FF", color: "#5B21B6" },
  "Tech & Startup": { bg: "#E0F2FE", color: "#075985" },
  Feasibility: { bg: "#FEF9C3", color: "#713F12" },
  "Strategic Analysis": { bg: "#EFF6FF", color: "#1D4ED8" },
  Operational: { bg: "#F0FDF4", color: "#059669" },
  Financial: { bg: "#FDF4FF", color: "#9333EA" },
  Stakeholder: { bg: "#FFF7ED", color: "#D97706" },
  Clinical: { bg: "#FEF2F2", color: "#DC2626" },
  Digital: { bg: "#F0F9FF", color: "#0284C7" },
  Organizational: { bg: "#EFF6FF", color: "#1D4ED8" },
  Innovation: { bg: "#FDF2F8", color: "#9D174D" },
};

function CategoryBadge({ category }: { category: string }) {
  const c = categoryColors[category] ?? { bg: "#F3F4F6", color: "#374151" };
  const label = category === "cfa_proprietary" ? "C4A Proprietary" : category;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {label}
    </span>
  );
}

// ─── Methodology Card ─────────────────────────────────────────────────────────

function MethodologyCard({ m }: { m: Methodology }) {
  const [expanded, setExpanded] = useState(false);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0", background: "#fff" }}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <CategoryBadge category={m.category} />
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={9} /> {m.estimatedWeeks}w
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Layers size={9} /> {m.phases.length} phases
              </span>
              {m._count.engagements > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Users size={9} /> used on {m._count.engagements} project{m._count.engagements !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{m.name}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{m.description}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 shrink-0"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Service type chips */}
        <div className="flex flex-wrap gap-1 mt-3">
          {m.serviceTypes.map((st) => (
            <span
              key={st}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "#F3F4F6", color: "#6B7280" }}
            >
              {st.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Phase timeline strip */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          {/* Timeline bar */}
          <div className="px-5 py-3 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {m.phases.map((phase, idx) => (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
                  className="flex items-center group"
                >
                  <div
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: activePhase === phase.id ? "#0F2744" : "#F3F4F6",
                      color: activePhase === phase.id ? "#fff" : "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span className="text-[10px] opacity-60 mr-1">{idx + 1}.</span>
                    {phase.name}
                    <span className="ml-1.5 text-[10px] opacity-60">{phase.typicalWeeks}w</span>
                  </div>
                  {idx < m.phases.length - 1 && (
                    <ArrowRight size={12} className="text-gray-300 mx-0.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phase detail */}
          {activePhase && (() => {
            const phase = m.phases.find((p) => p.id === activePhase);
            if (!phase) return null;
            return (
              <div className="mx-5 mb-4 rounded-lg p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                {phase.description && (
                  <p className="text-xs text-gray-600">{phase.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Key Activities</p>
                    <ul className="space-y-1">
                      {phase.keyActivities.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <Circle size={5} className="text-gray-300 mt-1.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deliverables</p>
                    <ul className="space-y-1">
                      {phase.keyDeliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <CheckCircle2 size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {phase.gates.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quality Gates</p>
                    {phase.gates.map((g) => (
                      <div key={g.id} className="flex items-start gap-2 rounded px-2.5 py-1.5" style={{ background: "#FFF7ED", border: "1px solid #FDE68A" }}>
                        <span className="text-[10px] font-semibold text-amber-700 mt-0.5 shrink-0">GATE</span>
                        <div>
                          <p className="text-xs font-medium text-amber-900">{g.name}</p>
                          <p className="text-[10px] text-amber-700">{g.criteria}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Framework Card ───────────────────────────────────────────────────────────

function FrameworkCard({ f }: { f: Framework }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid #e5eaf0", background: "#fff" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <CategoryBadge category={f.category} />
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Grid3X3 size={9} /> {f.dimensions.length} dimensions
            </span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900">{f.name}</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {expanded ? f.description : `${f.description.slice(0, 100)}${f.description.length > 100 ? "..." : ""}`}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Dimension chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {f.dimensions.map((d) => (
          <span
            key={d}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "#F3F4F6", color: "#374151" }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Guide text */}
      {expanded && f.guideText && (
        <div className="mt-3 rounded-lg px-3 py-2.5" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">Usage Guide</p>
          <p className="text-xs text-emerald-800 leading-relaxed">{f.guideText}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ["Methodologies", "Frameworks"] as const;

export default function MethodologyLibraryClient({
  methodologies,
  frameworksByCategory,
}: {
  methodologies: Methodology[];
  frameworksByCategory: Record<string, Framework[]>;
  userRole: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Methodologies");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const methodologyCategories = ["All", ...Array.from(new Set(methodologies.map((m) => m.category)))];
  const frameworkCategories = ["All", ...Object.keys(frameworksByCategory)];

  const filteredMethodologies = methodologies.filter((m) => {
    const matchCat = categoryFilter === "All" || m.category === categoryFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const allFrameworks = Object.values(frameworksByCategory).flat();
  const filteredFrameworks = allFrameworks.filter((f) => {
    const matchCat = categoryFilter === "All" || f.category === categoryFilter;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = tab === "Methodologies" ? methodologyCategories : frameworkCategories;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-[#0F2744]" />
            <h1 className="text-lg font-semibold text-gray-900">Methodology Library</h1>
          </div>
          <p className="text-sm text-gray-500">
            {methodologies.length} methodologies &middot; {allFrameworks.length} analysis frameworks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F3F4F6" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setCategoryFilter("All"); }}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              tab === t
                ? { background: "#fff", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#6B7280" }
            }
          >
            {t}
            <span className="ml-1.5 text-[10px] opacity-60">
              {t === "Methodologies" ? methodologies.length : allFrameworks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab.toLowerCase()}...`}
          className="text-sm rounded-lg px-3 py-2 focus:outline-none w-64"
          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={
                categoryFilter === c
                  ? { background: "#0F2744", color: "#fff" }
                  : { background: "#F3F4F6", color: "#374151" }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "Methodologies" && (
        <div className="space-y-4">
          {filteredMethodologies.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No methodologies match your search.</p>
          ) : (
            filteredMethodologies.map((m) => <MethodologyCard key={m.id} m={m} />)
          )}
        </div>
      )}

      {tab === "Frameworks" && (
        <div className="space-y-6">
          {categoryFilter === "All" ? (
            Object.entries(frameworksByCategory)
              .filter(([, items]) =>
                !search || items.some((f) =>
                  f.name.toLowerCase().includes(search.toLowerCase()) ||
                  f.description.toLowerCase().includes(search.toLowerCase())
                )
              )
              .map(([cat, items]) => {
                const visible = items.filter(
                  (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())
                );
                if (visible.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryBadge category={cat} />
                      <span className="text-xs text-gray-400">{visible.length} framework{visible.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visible.map((f) => <FrameworkCard key={f.id} f={f} />)}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFrameworks.map((f) => <FrameworkCard key={f.id} f={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
