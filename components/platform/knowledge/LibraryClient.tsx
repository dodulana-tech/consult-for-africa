"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  Link2,
  X,
  Loader2,
  FileText,
  LayoutTemplate,
  Box,
  CheckSquare,
  Database,
  BookOpen,
  ClipboardList,
} from "lucide-react";

type Asset = {
  id: string;
  title: string;
  description: string;
  assetType: string;
  streamTags: string[];
  problemTags: string[];
  outputFormat: string | null;
  geographyTags: string[];
  maturity: string;
  fileUrl: string | null;
  fileType: string | null;
  version: number;
  viewCount: number;
  downloadCount: number;
  engagementAssociationCount: number;
  publishedAt: string | null;
  lastUpdatedAt: string | null;
  createdAt: string;
  authorId: string;
  reviewerId: string | null;
};

const ASSET_TYPES = [
  "FRAMEWORK",
  "TEMPLATE",
  "MODEL",
  "CHECKLIST",
  "DATASET",
  "CASE_STUDY",
  "PLAYBOOK",
] as const;

const MATURITY_LEVELS = ["DRAFT", "VALIDATED", "BATTLE_TESTED", "RETIRED"] as const;

const TYPE_ICONS: Record<string, typeof FileText> = {
  FRAMEWORK: Box,
  TEMPLATE: LayoutTemplate,
  MODEL: Database,
  CHECKLIST: CheckSquare,
  DATASET: Database,
  CASE_STUDY: BookOpen,
  PLAYBOOK: ClipboardList,
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

const MATURITY_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#F3F4F6", text: "#6B7280" },
  VALIDATED: { bg: "#EFF6FF", text: "#3B82F6" },
  BATTLE_TESTED: { bg: "#ECFDF5", text: "#059669" },
  RETIRED: { bg: "#FEF2F2", text: "#DC2626" },
};

export default function LibraryClient({
  initialAssets,
  allStreams,
  canCreate,
  userId,
}: {
  initialAssets: Asset[];
  allStreams: string[];
  canCreate: boolean;
  userId: string;
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maturityFilter, setMaturityFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (typeFilter && a.assetType !== typeFilter) return false;
      if (maturityFilter && a.maturity !== maturityFilter) return false;
      if (streamFilter && !a.streamTags.includes(streamFilter)) return false;
      return true;
    });
  }, [assets, search, typeFilter, maturityFilter, streamFilter]);

  const hasFilters = search || typeFilter || maturityFilter || streamFilter;

  async function handleCreate(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { asset } = await res.json();
        setAssets((prev) => [asset, ...prev]);
        setShowCreateModal(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ border: "1px solid #e5eaf0" }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg bg-white focus:outline-none"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <option value="">All Types</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg bg-white focus:outline-none"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <option value="">All Maturity</option>
            {MATURITY_LEVELS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {allStreams.length > 0 && (
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg bg-white focus:outline-none"
              style={{ border: "1px solid #e5eaf0" }}
            >
              <option value="">All Streams</option>
              {allStreams.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setMaturityFilter("");
                setStreamFilter("");
              }}
              className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white whitespace-nowrap"
            style={{ background: "#0F2744" }}
          >
            <Plus size={16} /> Add Asset
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
        {hasFilters ? " matching filters" : ""}
      </p>

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <FileText className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-sm text-gray-500">
            {hasFilters ? "No assets match your filters" : "No assets in the library yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const TypeIcon = TYPE_ICONS[asset.assetType] ?? FileText;
            const typeColor = TYPE_COLORS[asset.assetType] ?? { bg: "#F3F4F6", text: "#6B7280" };
            const matColor = MATURITY_COLORS[asset.maturity] ?? { bg: "#F3F4F6", text: "#6B7280" };

            return (
              <div
                key={asset.id}
                className="rounded-xl bg-white p-5 hover:shadow-md transition-shadow"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {asset.title}
                  </h3>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: typeColor.bg, color: typeColor.text }}
                  >
                    <TypeIcon size={10} />
                    {asset.assetType.replace(/_/g, " ")}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: matColor.bg, color: matColor.text }}
                  >
                    {asset.maturity.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {asset.description || "No description provided"}
                </p>

                {/* Tags */}
                {asset.streamTags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {asset.streamTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.streamTags.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                        +{asset.streamTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <span className="text-[10px] text-gray-400">
                    v{asset.version}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Eye size={10} /> {asset.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Download size={10} /> {asset.downloadCount}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Link2 size={10} /> {asset.engagementAssociationCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAssetModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
    </div>
  );
}

function CreateAssetModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState("FRAMEWORK");
  const [maturity, setMaturity] = useState("DRAFT");
  const [streamTags, setStreamTags] = useState("");
  const [problemTags, setProblemTags] = useState("");
  const [geographyTags, setGeographyTags] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      assetType,
      maturity,
      streamTags: streamTags ? streamTags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      problemTags: problemTags ? problemTags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      geographyTags: geographyTags ? geographyTags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      outputFormat: outputFormat.trim() || null,
      fileUrl: fileUrl.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add New Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid #e5eaf0" }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              style={{ border: "1px solid #e5eaf0" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Maturity</label>
              <select
                value={maturity}
                onChange={(e) => setMaturity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {MATURITY_LEVELS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Stream Tags <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={streamTags}
              onChange={(e) => setStreamTags(e.target.value)}
              placeholder="e.g. Healthcare, Strategy, Operations"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid #e5eaf0" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Problem Tags <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={problemTags}
              onChange={(e) => setProblemTags(e.target.value)}
              placeholder="e.g. Revenue Leakage, Process Inefficiency"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid #e5eaf0" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Geography Tags <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={geographyTags}
              onChange={(e) => setGeographyTags(e.target.value)}
              placeholder="e.g. Nigeria, East Africa, Pan-African"
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid #e5eaf0" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Output Format</label>
              <input
                type="text"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. PDF, Excel, Slides"
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #e5eaf0" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">File URL</label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #e5eaf0" }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
              style={{ border: "1px solid #e5eaf0" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "#0F2744" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
