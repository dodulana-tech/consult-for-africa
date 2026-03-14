"use client";

import { useState } from "react";
import { BookOpen, Search } from "lucide-react";

interface DocEntry {
  name: string;
  status: "done" | "current" | "review" | "locked" | "reading";
  note?: string;
}

interface DocCategory {
  category: string;
  label?: string;
  docs: DocEntry[];
}

const LIBRARY: DocCategory[] = [
  {
    category: "Getting Started",
    label: "READ FIRST",
    docs: [
      { name: "START-HERE-MASTER-GUIDE.md",   status: "done" },
      { name: "DOCUMENT-INDEX.md",             status: "done" },
    ],
  },
  {
    category: "Strategy & Market",
    docs: [
      { name: "cfa-nigerian-market-reality.md",           status: "done" },
      { name: "cfa-engagement-management-framework.md",   status: "done" },
      { name: "cfa-operational-playbook.md",              status: "review", note: "Review before launch" },
      { name: "cfa-90-day-critical-path.md",              status: "done" },
    ],
  },
  {
    category: "Platform Development",
    label: "ACTIVE",
    docs: [
      { name: "claude-code-START-HERE.md",         status: "done",    note: "Week 1" },
      { name: "claude-code-WEEK-2.md",             status: "done" },
      { name: "claude-code-WEEK-3.md",             status: "done" },
      { name: "claude-code-WEEK-4.md",             status: "done" },
      { name: "claude-code-WEEK-5.md",             status: "current", note: "CURRENT" },
      { name: "claude-code-WEEK-6.md",             status: "locked" },
      { name: "claude-code-WEEK-7.md",             status: "locked" },
      { name: "claude-code-WEEK-8.md",             status: "locked" },
      { name: "CFA-COMPLETE-MVP-ROADMAP.md",       status: "done" },
    ],
  },
  {
    category: "AI Integration",
    label: "Future",
    docs: [
      { name: "AI-INTEGRATION-MASTERPLAN.md",          status: "reading" },
      { name: "CLAUDE-CODE-AI-FEATURES.md",            status: "reading" },
      { name: "POST-MVP-PRODUCT-ROADMAP-MECE.md",      status: "reading" },
    ],
  },
  {
    category: "Execution & Management",
    docs: [
      { name: "DEVELOPER-ONBOARDING-GUIDE.md",         status: "done" },
      { name: "PRODUCTION-DEPLOYMENT-CHECKLIST.md",    status: "review", note: "Review Week 8" },
      { name: "POST-MVP-ROADMAP.md",                   status: "reading" },
    ],
  },
];

function statusBadge(status: DocEntry["status"]): {
  icon: string;
  label: string;
  bg: string;
  color: string;
} {
  switch (status) {
    case "done":
      return { icon: "✅", label: "Read",    bg: "#F0FDF4", color: "#15803D" };
    case "current":
      return { icon: "⏳", label: "Current", bg: "rgba(212,175,55,0.12)", color: "#B45309" };
    case "review":
      return { icon: "📋", label: "Review",  bg: "#FFF7ED", color: "#C2410C" };
    case "locked":
      return { icon: "🔒", label: "Locked",  bg: "#F3F4F6", color: "#9CA3AF" };
    case "reading":
      return { icon: "📖", label: "Reading", bg: "#EFF6FF", color: "#1D4ED8" };
  }
}

export default function KnowledgeClient() {
  const [search, setSearch] = useState("");

  const query = search.toLowerCase().trim();

  const filtered = LIBRARY.map((cat) => ({
    ...cat,
    docs: cat.docs.filter(
      (d) =>
        !query ||
        d.name.toLowerCase().includes(query) ||
        cat.category.toLowerCase().includes(query) ||
        (d.note?.toLowerCase().includes(query) ?? false)
    ),
  })).filter((cat) => cat.docs.length > 0);

  const totalDocs  = LIBRARY.flatMap((c) => c.docs).length;
  const readCount  = LIBRARY.flatMap((c) => c.docs).filter((d) => d.status === "done").length;

  return (
    <div className="p-6 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Document library, {readCount} of {totalDocs} read
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #e5eaf0" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">Reading progress</p>
          <span className="text-xs font-semibold text-gray-700">
            {readCount}/{totalDocs} docs
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${Math.round((readCount / totalDocs) * 100)}%`, background: "#059669" }}
          />
        </div>
      </div>

      {/* Categories */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No documents match your search.</p>
        </div>
      )}

      {filtered.map((cat) => (
        <div key={cat.category} className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{cat.category}</h3>
            {cat.label && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "#0F2744", color: "#D4AF37" }}
              >
                {cat.label}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {cat.docs.map((doc) => {
              const badge = statusBadge(doc.status);
              return (
                <div
                  key={doc.name}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "#F9FAFB" }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{badge.icon}</span>
                    <span
                      className={`text-xs font-mono truncate ${
                        doc.status === "locked" ? "text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {doc.name}
                    </span>
                    {doc.note && (
                      <span className="text-[10px] text-gray-400 shrink-0 italic">{doc.note}</span>
                    )}
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-3"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}
