"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Pin, X, Sparkles, Loader2, Trash2,
  FileText, Upload, ExternalLink, Calendar, Eye,
} from "lucide-react";

interface Doc {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number | null;
  category: string;
  tags: string[];
  isPinned: boolean;
  reviewDate: string | null;
  reviewNote: string | null;
  nuruSummary: string | null;
  nuruNotes: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "STRATEGY", label: "Strategy", color: "#0B3C5D" },
  { value: "FINANCE", label: "Finance", color: "#059669" },
  { value: "LEGAL", label: "Legal", color: "#7C3AED" },
  { value: "CLIENT", label: "Client", color: "#D4AF37" },
  { value: "OPERATIONS", label: "Operations", color: "#1D4ED8" },
  { value: "MARKET_INTEL", label: "Market Intel", color: "#DC2626" },
  { value: "PARTNERSHIP", label: "Partnership", color: "#06B6D4" },
  { value: "PERSONAL", label: "Personal", color: "#8B5CF6" },
];

function getCategoryColor(cat: string): string {
  return CATEGORIES.find(c => c.value === cat)?.color ?? "#6B7280";
}

export default function KnowledgeHub() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [nuruLoading, setNuruLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", content: "", category: "STRATEGY",
    fileUrl: "", fileType: "", tags: "",
    reviewDate: "", reviewNote: "",
  });

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    const res = await fetch("/api/founder/documents");
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/founder/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        reviewDate: form.reviewDate || null,
      }),
    });
    if (res.ok) {
      const doc = await res.json();
      setDocs([doc, ...docs]);
      setForm({ title: "", description: "", content: "", category: "STRATEGY", fileUrl: "", fileType: "", tags: "", reviewDate: "", reviewNote: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function togglePin(id: string, current: boolean) {
    await fetch(`/api/founder/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    setDocs(docs.map(d => d.id === id ? { ...d, isPinned: !current } : d));
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/founder/documents/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocs(docs.filter(d => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  }

  async function askNuru(doc: Doc) {
    setNuruLoading(doc.id);
    try {
      const res = await fetch(`/api/founder/documents/${doc.id}/nuru`, { method: "POST" });
      if (res.ok) {
        const { nuruNotes, nuruSummary } = await res.json();
        setDocs(docs.map(d => d.id === doc.id ? { ...d, nuruNotes, nuruSummary } : d));
        if (selectedDoc?.id === doc.id) setSelectedDoc({ ...doc, nuruNotes, nuruSummary });
      }
    } finally {
      setNuruLoading(null);
    }
  }

  // File upload handler
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Get presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "founder-docs", contentType: file.type, filename: file.name }),
      });
      if (!presignRes.ok) throw new Error("Upload failed");
      const { uploadUrl, publicUrl, key } = await presignRes.json();

      // Upload to R2
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
      setForm(prev => ({
        ...prev,
        fileUrl: publicUrl || key,
        fileType: ext,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      }));
    } catch {
      alert("File upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  // Filter
  const query = search.toLowerCase().trim();
  const filtered = docs.filter(d => {
    if (filterCat && d.category !== filterCat) return false;
    if (!query) return true;
    return d.title.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query)) ||
      d.category.toLowerCase().includes(query);
  });

  const pinned = filtered.filter(d => d.isPinned);
  const unpinned = filtered.filter(d => !d.isPinned);

  // Review reminders
  const now = new Date();
  const needsReview = docs.filter(d => d.reviewDate && new Date(d.reviewDate) <= now);

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>Knowledge Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">{docs.length} document{docs.length !== 1 ? "s" : ""} in your strategic library</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          style={{ background: "#0F2744" }}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Document"}
        </button>
      </div>

      {/* Review alerts */}
      {needsReview.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 flex items-center gap-3" style={{ border: "1px solid rgba(217,119,6,0.2)" }}>
          <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">{needsReview.length} document{needsReview.length !== 1 ? "s" : ""} due for review:</span>{" "}
            {needsReview.map(d => d.title).join(", ")}
          </p>
        </div>
      )}

      {/* New document form */}
      {showForm && (
        <form onSubmit={createDoc} className="rounded-2xl bg-white p-6 shadow-sm space-y-4" style={{ border: "1px solid #E8EBF0" }}>
          <div className="flex gap-3">
            <input
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Document title"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description (optional)"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />

          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Paste content here, or upload a file below"
            rows={5}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />

          {/* File upload */}
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.png,.jpg" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            {form.fileUrl && (
              <span className="text-xs text-emerald-600 font-medium">
                {form.fileType} uploaded
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags (comma separated)"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            <input type="date" value={form.reviewDate} onChange={e => setForm({ ...form, reviewDate: e.target.value })}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none"
              title="Review reminder date" />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>
              {saving ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      )}

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            style={{ border: "1px solid #E8EBF0" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat("")}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition ${!filterCat ? "text-white" : "border border-gray-200 text-gray-600"}`}
            style={!filterCat ? { background: "#0F2744" } : {}}>
            All
          </button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setFilterCat(filterCat === c.value ? "" : c.value)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${filterCat === c.value ? "text-white" : "border border-gray-200 text-gray-600"}`}
              style={filterCat === c.value ? { background: c.color } : {}}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <FileText className="h-10 w-10 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-bold" style={{ color: "#0F2744" }}>Your knowledge hub is empty</p>
          <p className="text-sm text-gray-500 mt-1">Upload proposals, strategies, contracts, market research, or paste notes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                <Pin className="h-3 w-3" /> Pinned ({pinned.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map(doc => (
                  <DocCard key={doc.id} doc={doc} onSelect={() => setSelectedDoc(doc)} onPin={togglePin} onDelete={deleteDoc} onAskNuru={askNuru} nuruLoading={nuruLoading === doc.id} />
                ))}
              </div>
            </div>
          )}

          {/* Rest */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">All Documents ({unpinned.length})</p>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unpinned.map(doc => (
                  <DocCard key={doc.id} doc={doc} onSelect={() => setSelectedDoc(doc)} onPin={togglePin} onDelete={deleteDoc} onAskNuru={askNuru} nuruLoading={nuruLoading === doc.id} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No documents match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDoc(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-6 py-4 flex items-start justify-between" style={{ borderBottom: "1px solid #E8EBF0" }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>{selectedDoc.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: getCategoryColor(selectedDoc.category) }}>
                    {selectedDoc.category.replace(/_/g, " ")}
                  </span>
                  {selectedDoc.tags.map(t => (
                    <span key={t} className="text-[10px] text-gray-400">#{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {selectedDoc.description && (
                <p className="text-sm text-gray-600">{selectedDoc.description}</p>
              )}

              {selectedDoc.content && (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedDoc.content}
                </div>
              )}

              {selectedDoc.fileUrl && (
                <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F2744] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                  <ExternalLink className="h-4 w-4" />
                  Open {selectedDoc.fileType || "File"}
                </a>
              )}

              {selectedDoc.nuruNotes && (
                <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
                    <p className="text-xs font-semibold" style={{ color: "#D4AF37" }}>Nuru&apos;s Analysis</p>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedDoc.nuruNotes}</p>
                </div>
              )}

              {selectedDoc.reviewDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Review by: {new Date(selectedDoc.reviewDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  {selectedDoc.reviewNote && <span className="text-gray-400">({selectedDoc.reviewNote})</span>}
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Eye className="h-3 w-3" /> {selectedDoc.viewCount} views
                <span>Added {new Date(selectedDoc.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocCard({ doc, onSelect, onPin, onDelete, onAskNuru, nuruLoading }: {
  doc: Doc; onSelect: () => void; onPin: (id: string, current: boolean) => void;
  onDelete: (id: string) => void; onAskNuru: (doc: Doc) => void; nuruLoading: boolean;
}) {
  const catColor = getCategoryColor(doc.category);

  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm cursor-pointer transition hover:shadow-md relative"
      style={{ border: "1px solid #E8EBF0", borderTop: `3px solid ${catColor}` }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold leading-tight" style={{ color: "#0F2744" }}>{doc.title}</h3>
        {doc.fileType && (
          <span className="shrink-0 rounded-lg bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
            {doc.fileType}
          </span>
        )}
      </div>

      {doc.nuruSummary && (
        <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{doc.nuruSummary}</p>
      )}
      {!doc.nuruSummary && doc.description && (
        <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{doc.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white" style={{ background: catColor }}>
          {doc.category.replace(/_/g, " ")}
        </span>
        {doc.tags.slice(0, 2).map(t => (
          <span key={t} className="text-[9px] text-gray-400">#{t}</span>
        ))}
      </div>

      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => onPin(doc.id, doc.isPinned)}
          className={`rounded-lg p-1.5 transition hover:bg-gray-100 ${doc.isPinned ? "" : "opacity-40 hover:opacity-100"}`}
          title={doc.isPinned ? "Unpin" : "Pin"}>
          <Pin className="h-3.5 w-3.5" style={{ color: doc.isPinned ? "#D4AF37" : "#9CA3AF" }} />
        </button>
        <button onClick={() => onAskNuru(doc)} disabled={nuruLoading}
          className="rounded-lg p-1.5 transition hover:bg-gray-100" title="Ask Nuru">
          {nuruLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" /> : <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />}
        </button>
        <button onClick={() => onDelete(doc.id)}
          className="rounded-lg p-1.5 transition hover:bg-red-50 ml-auto" title="Delete">
          <Trash2 className="h-3.5 w-3.5 text-gray-300 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}
