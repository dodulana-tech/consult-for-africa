"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  X,
  Search,
  Tag,
  Trash2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

export type KnowledgeAssetType =
  | "INSIGHT"
  | "FRAMEWORK"
  | "TEMPLATE"
  | "CASE_STUDY"
  | "LESSON_LEARNED"
  | "TOOL"
  | "GUIDE";

export interface KnowledgeAsset {
  id: string;
  title: string;
  content: string;
  assetType: KnowledgeAssetType;
  tags: string[];
  isReusable: boolean;
  fileUrl: string | null;
  authorId: string;
  engagementId: string | null;
  engagement: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<KnowledgeAssetType, string> = {
  INSIGHT: "Insight",
  FRAMEWORK: "Framework",
  TEMPLATE: "Template",
  CASE_STUDY: "Case Study",
  LESSON_LEARNED: "Lesson Learned",
  TOOL: "Tool",
  GUIDE: "Guide",
};

const TYPE_COLORS: Record<KnowledgeAssetType, { bg: string; color: string }> = {
  INSIGHT: { bg: "#EFF6FF", color: "#3B82F6" },
  FRAMEWORK: { bg: "#F0FDF4", color: "#16A34A" },
  TEMPLATE: { bg: "#FFF7ED", color: "#EA580C" },
  CASE_STUDY: { bg: "#FAF5FF", color: "#9333EA" },
  LESSON_LEARNED: { bg: "#FFF1F2", color: "#E11D48" },
  TOOL: { bg: "#F0F9FF", color: "#0891B2" },
  GUIDE: { bg: "#ECFDF5", color: "#059669" },
};

const ASSET_TYPES: KnowledgeAssetType[] = [
  "INSIGHT",
  "FRAMEWORK",
  "TEMPLATE",
  "CASE_STUDY",
  "LESSON_LEARNED",
  "TOOL",
  "GUIDE",
];

const defaultForm = {
  title: "",
  content: "",
  assetType: "INSIGHT" as KnowledgeAssetType,
  tagsInput: "",
  tags: [] as string[],
  isReusable: false,
  fileUrl: "",
  projectId: "",
};

export default function KnowledgeBase({
  initialAssets,
  userId,
}: {
  initialAssets: KnowledgeAsset[];
  userId: string;
}) {
  const [assets, setAssets] = useState<KnowledgeAsset[]>(initialAssets);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<KnowledgeAssetType | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewAsset, setViewAsset] = useState<KnowledgeAsset | null>(null);

  // Filter
  const filtered = assets.filter((a) => {
    const matchType = activeType === "ALL" || a.assetType === activeType;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  function addTag() {
    const raw = form.tagsInput.trim();
    if (!raw) return;
    const newTags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...form.tags, ...newTags]));
    setForm((f) => ({ ...f, tags: merged, tagsInput: "" }));
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          assetType: form.assetType,
          tags: form.tags,
          isReusable: form.isReusable,
          fileUrl: form.fileUrl || null,
          projectId: form.projectId || null,
        }),
      });
      if (res.ok) {
        const asset = await res.json();
        setAssets((prev) => [asset, ...prev]);
        setForm(defaultForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this knowledge asset? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg px-3 py-2"
          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        >
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge base..."
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
          style={{
            background: showForm ? "#F3F4F6" : "#0F2744",
            color: showForm ? "#374151" : "#fff",
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add Knowledge"}
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", ...ASSET_TYPES] as (KnowledgeAssetType | "ALL")[]).map((t) => {
          const isActive = activeType === t;
          const colors = t !== "ALL" ? TYPE_COLORS[t as KnowledgeAssetType] : null;
          return (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive
                  ? colors?.bg ?? "#0F2744"
                  : "#fff",
                color: isActive
                  ? colors?.color ?? "#fff"
                  : "#6B7280",
                border: isActive
                  ? `1px solid ${colors?.color ?? "#0F2744"}40`
                  : "1px solid #e5eaf0",
              }}
            >
              {t === "ALL" ? "All Types" : TYPE_LABELS[t as KnowledgeAssetType]}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-xl p-5 space-y-4"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <h4 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            New Knowledge Asset
          </h4>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title *"
            required
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Type *</label>
              <select
                value={form.assetType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    assetType: e.target.value as KnowledgeAssetType,
                  }))
                }
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">
                Project ID (optional)
              </label>
              <input
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                placeholder="Link to project ID"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Content / body of knowledge *"
            rows={5}
            required
            className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          {/* Tags */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">
              Tags (comma-separated)
            </label>
            <div className="flex gap-2">
              <input
                value={form.tagsInput}
                onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g. hospital, efficiency, Nigeria"
                className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#E5EAF0", color: "#374151" }}
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: "#EFF6FF", color: "#3B82F6" }}
                  >
                    <Tag size={9} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-red-500"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">
                File URL (optional)
              </label>
              <input
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, isReusable: !f.isReusable }))}
                  className="relative w-8 h-4 rounded-full transition-colors cursor-pointer"
                  style={{
                    background: form.isReusable ? "#0F2744" : "#D1D5DB",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: form.isReusable
                        ? "translateX(18px)"
                        : "translateX(2px)",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600">Mark as reusable</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!form.title.trim() || !form.content.trim() || saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {saving ? "Saving..." : "Save Asset"}
            </button>
          </div>
        </form>
      )}

      {/* Asset cards */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <BookOpen size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {search || activeType !== "ALL"
              ? "No assets match your search."
              : "No knowledge assets yet. Add the first one."}
          </p>
          {(search || activeType !== "ALL") && (
            <button
              onClick={() => { setSearch(""); setActiveType("ALL"); }}
              className="mt-3 flex items-center gap-1.5 text-xs text-blue-500 mx-auto"
            >
              <RotateCcw size={12} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((asset) => {
            const typeStyle = TYPE_COLORS[asset.assetType];
            const canDelete = asset.authorId === userId;
            return (
              <div
                key={asset.id}
                className="rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md hover:border-gray-200"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                onClick={() => setViewAsset(asset)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                      }}
                    >
                      {TYPE_LABELS[asset.assetType]}
                    </span>
                    {asset.isReusable && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#D4AF3720", color: "#B8890A" }}
                      >
                        Reusable
                      </span>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      disabled={deletingId === asset.id}
                      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Title */}
                <h4
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "#0F2744" }}
                >
                  {asset.title}
                </h4>

                {/* Content preview */}
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {asset.content}
                </p>

                {/* Tags */}
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-2 mt-auto"
                  style={{ borderTop: "1px solid #F3F4F6" }}
                >
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    {asset.engagement && (
                      <Link
                        href={`/projects/${asset.engagement.id}`}
                        className="hover:underline flex items-center gap-1"
                        style={{ color: "#3B82F6" }}
                      >
                        <ExternalLink size={9} />
                        {asset.engagement.name}
                      </Link>
                    )}
                    <span>
                      {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {asset.fileUrl && (
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium flex items-center gap-1 hover:underline"
                      style={{ color: "#0F2744" }}
                    >
                      <ExternalLink size={10} />
                      View File
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel overlay */}
      {viewAsset && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setViewAsset(null)}
          />
          {/* Panel */}
          <div
            className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
            style={{ animation: "slideIn 0.2s ease-out" }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-start justify-between gap-4 px-8 py-6"
              style={{ background: "#fff", borderBottom: "1px solid #e5eaf0" }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: TYPE_COLORS[viewAsset.assetType].bg,
                      color: TYPE_COLORS[viewAsset.assetType].color,
                    }}
                  >
                    {TYPE_LABELS[viewAsset.assetType]}
                  </span>
                  {viewAsset.isReusable && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#D4AF3720", color: "#B8890A" }}
                    >
                      Reusable
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
                  {viewAsset.title}
                </h2>
                <p className="text-xs text-gray-400">
                  {new Date(viewAsset.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {viewAsset.engagement && (
                    <> · {viewAsset.engagement.name}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setViewAsset(null)}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              <div
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ lineHeight: 1.8 }}
              >
                {viewAsset.content}
              </div>

              {/* Tags */}
              {viewAsset.tags.length > 0 && (
                <div
                  className="pt-4"
                  style={{ borderTop: "1px solid #F3F4F6" }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewAsset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* File link */}
              {viewAsset.fileUrl && (
                <div
                  className="pt-4"
                  style={{ borderTop: "1px solid #F3F4F6" }}
                >
                  <a
                    href={viewAsset.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
                  >
                    <ExternalLink size={14} />
                    Open Attached File
                  </a>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
