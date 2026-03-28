"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  Search,
  Link2,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  CheckCircle2,
  Circle,
  Archive,
} from "lucide-react";

type AssetLink = {
  id: string;
  phase: string | null;
  notes: string | null;
  asset: {
    id: string;
    title: string;
    assetType: string;
    maturity: string;
    description: string;
    author: { id: string; name: string | null };
  };
};

type Phase = {
  name: string;
  order: number;
};

type Playbook = {
  id: string;
  engagementId: string;
  templateUsed: string | null;
  phasesJson: Phase[];
  notes: string | null;
  status: string;
  assets: AssetLink[];
};

type LibraryAsset = {
  id: string;
  title: string;
  assetType: string;
  maturity: string;
  description: string;
  author: { id: string; name: string | null };
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  DRAFT: { bg: "#F3F4F6", text: "#6B7280", icon: Circle },
  ACTIVE: { bg: "#ECFDF5", text: "#059669", icon: CheckCircle2 },
  ARCHIVED: { bg: "#FEF2F2", text: "#DC2626", icon: Archive },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  FRAMEWORK: { bg: "#EFF6FF", text: "#3B82F6" },
  TEMPLATE: { bg: "#F0FDF4", text: "#16A34A" },
  MODEL: { bg: "#FFF7ED", text: "#EA580C" },
  CHECKLIST: { bg: "#FAF5FF", text: "#9333EA" },
  DATASET: { bg: "#ECFDF5", text: "#059669" },
  CASE_STUDY: { bg: "#FEF2F2", text: "#DC2626" },
  PLAYBOOK: { bg: "#FFFBEB", text: "#D97706" },
};

export default function PlaybookBuilder({ engagementId, isEM }: { engagementId: string; isEM: boolean }) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [linkModalPhase, setLinkModalPhase] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");

  const fetchPlaybook = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${engagementId}/playbook`);
      if (res.ok) {
        const data = await res.json();
        if (data.playbook) {
          setPlaybook(data.playbook);
          // Expand all phases by default
          const phases = (data.playbook.phasesJson as Phase[]) ?? [];
          setExpandedPhases(new Set(phases.map((p) => p.name)));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => {
    fetchPlaybook();
  }, [fetchPlaybook]);

  async function createPlaybook() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${engagementId}/playbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchPlaybook();
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(status: string) {
    if (!playbook) return;
    const res = await fetch(`/api/projects/${engagementId}/playbook`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaybook(data.playbook);
    }
  }

  async function addPhase() {
    if (!playbook || !newPhaseName.trim()) return;
    const phases = (playbook.phasesJson as Phase[]) ?? [];
    const updated = [...phases, { name: newPhaseName.trim(), order: phases.length + 1 }];
    const res = await fetch(`/api/projects/${engagementId}/playbook`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phasesJson: updated }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaybook(data.playbook);
      setExpandedPhases((prev) => new Set([...prev, newPhaseName.trim()]));
      setNewPhaseName("");
      setAddingPhase(false);
    }
  }

  async function removePhase(phaseName: string) {
    if (!playbook) return;
    const phases = (playbook.phasesJson as Phase[]) ?? [];
    const updated = phases
      .filter((p) => p.name !== phaseName)
      .map((p, i) => ({ ...p, order: i + 1 }));
    const res = await fetch(`/api/projects/${engagementId}/playbook`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phasesJson: updated }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaybook(data.playbook);
    }
  }

  async function unlinkAsset(linkId: string) {
    const res = await fetch(`/api/projects/${engagementId}/playbook/assets`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    });
    if (res.ok) {
      await fetchPlaybook();
    }
  }

  async function linkAsset(assetId: string, phase: string) {
    const res = await fetch(`/api/projects/${engagementId}/playbook/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, phase }),
    });
    if (res.ok) {
      await fetchPlaybook();
      setLinkModalPhase(null);
    }
  }

  function togglePhase(name: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div
        className="rounded-xl bg-white p-12 text-center"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <BookOpen className="mx-auto mb-3 text-gray-300" size={40} />
        <h3 className="text-sm font-semibold text-gray-700 mb-1">No Playbook Yet</h3>
        <p className="text-xs text-gray-500 mb-4">
          {isEM
            ? "Create a playbook to organise frameworks, templates, and assets for each engagement phase."
            : "No playbook has been created for this engagement yet."}
        </p>
        {isEM && (
          <button
            onClick={createPlaybook}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Playbook
          </button>
        )}
      </div>
    );
  }

  const phases = (playbook.phasesJson as Phase[]) ?? [];
  const statusStyle = STATUS_STYLES[playbook.status] ?? STATUS_STYLES.DRAFT;
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-xl bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div className="flex items-center gap-3">
          <BookOpen size={18} style={{ color: "#0F2744" }} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Engagement Playbook</h3>
            <p className="text-xs text-gray-500">
              {phases.length} phase{phases.length !== 1 ? "s" : ""} / {playbook.assets.length} asset{playbook.assets.length !== 1 ? "s" : ""} linked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status toggle (EM only) / Status badge (read-only) */}
          {isEM ? (
            (["DRAFT", "ACTIVE", "ARCHIVED"] as const).map((s) => {
              const st = STATUS_STYLES[s];
              const Icon = st.icon;
              const isActive = playbook.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity"
                  style={{
                    background: isActive ? st.bg : "transparent",
                    color: isActive ? st.text : "#9CA3AF",
                    border: isActive ? "none" : "1px solid #e5eaf0",
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <Icon size={10} />
                  {s}
                </button>
              );
            })
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              <StatusIcon size={10} />
              {playbook.status}
            </span>
          )}
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="relative space-y-0">
        {phases.map((phase, idx) => {
          const isExpanded = expandedPhases.has(phase.name);
          const phaseAssets = playbook.assets.filter((a) => a.phase === phase.name);
          const isLast = idx === phases.length - 1;

          return (
            <div key={phase.name} className="relative flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full mt-4 flex-shrink-0"
                  style={{ background: "#0F2744" }}
                />
                {!isLast && (
                  <div className="w-0.5 flex-1 min-h-[20px]" style={{ background: "#e5eaf0" }} />
                )}
              </div>

              {/* Phase card */}
              <div
                className="rounded-xl bg-white flex-1 mb-3"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {/* Phase header */}
                <button
                  onClick={() => togglePhase(phase.name)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">
                      {String(phase.order).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{phase.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {phaseAssets.length} asset{phaseAssets.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEM && playbook.status === "DRAFT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhase(phase.name);
                        }}
                        className="text-gray-300 hover:text-red-400 p-1"
                        title="Remove phase"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                    {phaseAssets.length === 0 ? (
                      <p className="text-xs text-gray-400 pt-3">No assets linked to this phase</p>
                    ) : (
                      <div className="pt-3 space-y-2">
                        {phaseAssets.map((link) => {
                          const tc = TYPE_COLORS[link.asset.assetType] ?? {
                            bg: "#F3F4F6",
                            text: "#6B7280",
                          };
                          return (
                            <div
                              key={link.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Link2 size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-800 truncate">
                                  {link.asset.title}
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
                                  style={{ background: tc.bg, color: tc.text }}
                                >
                                  {link.asset.assetType.replace(/_/g, " ")}
                                </span>
                              </div>
                              {isEM && (
                                <button
                                  onClick={() => unlinkAsset(link.id)}
                                  className="text-gray-300 hover:text-red-400 p-1 flex-shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isEM && (
                      <button
                        onClick={() => setLinkModalPhase(phase.name)}
                        className="inline-flex items-center gap-1 text-xs font-medium mt-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                        style={{ color: "#0F2744" }}
                      >
                        <Plus size={12} /> Link Asset
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Phase */}
      {isEM && playbook.status === "DRAFT" && (
        <div className="flex gap-4 pl-7">
          {addingPhase ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="Phase name"
                className="px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #e5eaf0" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPhase();
                  if (e.key === "Escape") {
                    setAddingPhase(false);
                    setNewPhaseName("");
                  }
                }}
                autoFocus
              />
              <button
                onClick={addPhase}
                disabled={!newPhaseName.trim()}
                className="px-3 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingPhase(false);
                  setNewPhaseName("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPhase(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <Plus size={12} /> Add Phase
            </button>
          )}
        </div>
      )}

      {/* Link Asset Modal */}
      {linkModalPhase && (
        <AssetSearchModal
          phase={linkModalPhase}
          existingAssetIds={playbook.assets.map((a) => a.asset.id)}
          onLink={linkAsset}
          onClose={() => setLinkModalPhase(null)}
        />
      )}
    </div>
  );
}

function AssetSearchModal({
  phase,
  existingAssetIds,
  onLink,
  onClose,
}: {
  phase: string;
  existingAssetIds: string[];
  onLink: (assetId: string, phase: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doSearch() {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/knowledge/library?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(
          (data.assets as LibraryAsset[]).filter((a) => !existingAssetIds.includes(a.id))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Link Asset to Phase</h3>
            <p className="text-xs text-gray-500">{phase}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search library assets..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #e5eaf0" }}
                autoFocus
              />
            </div>
            <button
              onClick={doSearch}
              className="px-3 py-2 text-sm rounded-lg text-white font-medium"
              style={{ background: "#0F2744" }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          ) : results.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">
              {searched ? "No matching assets found" : "Search the library to find assets"}
            </p>
          ) : (
            results.map((asset) => {
              const tc = TYPE_COLORS[asset.assetType] ?? { bg: "#F3F4F6", text: "#6B7280" };
              return (
                <button
                  key={asset.id}
                  onClick={() => onLink(asset.id, phase)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-800 truncate">
                        {asset.title}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
                        style={{ background: tc.bg, color: tc.text }}
                      >
                        {asset.assetType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{asset.description}</p>
                  </div>
                  <Plus size={14} className="text-gray-400 flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
