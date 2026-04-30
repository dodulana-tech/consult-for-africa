"use client";

import { useState } from "react";
import { Plus, Edit3, Archive, X, Loader2, AlertCircle, Eye, ArchiveRestore } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "", label: "Uncategorised" },
  { value: "CONSULTANT_OUTREACH", label: "Consultant Outreach" },
  { value: "CONSULTANT_FOLLOW_UP", label: "Consultant Follow-up" },
  { value: "CLIENT_INTRO", label: "Client Intro" },
  { value: "CLIENT_FOLLOW_UP", label: "Client Follow-up" },
  { value: "TALENT_RESPONSE", label: "Talent Application Response" },
  { value: "CADRE_OUTREACH", label: "CadreHealth Outreach" },
  { value: "PARTNER_OUTREACH", label: "Partner Outreach" },
  { value: "INTERNAL_NOTE", label: "Internal Template" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const visible = templates.filter((t) => showInactive || t.isActive);

  function refresh(t: Template) {
    setTemplates((prev) => {
      const found = prev.findIndex((p) => p.id === t.id);
      if (found === -1) return [t, ...prev];
      const next = [...prev];
      next[found] = t;
      return next;
    });
  }

  function remove(id: string) {
    setTemplates((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600">
          Reusable subject and body blocks for outreach. Use <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100">{"{{firstName}}"}</code> for personalization.
        </p>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
          <button
            onClick={() => setEditingId("new")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "#0F2744" }}
          >
            <Plus size={11} /> New Template
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-sm text-gray-400">No templates yet. Create one to reuse common outreach patterns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => setEditingId(t.id)}
              onRemove={() => remove(t.id)}
              onRestore={refresh}
            />
          ))}
        </div>
      )}

      {editingId && (
        <TemplateEditor
          template={editingId === "new" ? null : templates.find((t) => t.id === editingId) ?? null}
          onClose={() => setEditingId(null)}
          onSaved={(t) => {
            refresh(t);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onEdit,
  onRemove,
  onRestore,
}: {
  template: Template;
  onEdit: () => void;
  onRemove: () => void;
  onRestore: (t: Template) => void;
}) {
  async function handleArchive() {
    if (!confirm(template.isActive ? "Archive this template?" : "Restore this template?")) return;
    if (template.isActive) {
      const res = await fetch(`/api/communications/templates/${template.id}`, { method: "DELETE" });
      if (res.ok) onRemove();
    } else {
      const res = await fetch(`/api/communications/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        onRestore(updated);
      }
    }
  }

  return (
    <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0", opacity: template.isActive ? 1 : 0.6 }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#0F2744" }}>{template.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
            <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100">{template.type}</span>
            {template.category && <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{template.category.replace(/_/g, " ")}</span>}
            <span>· used {template.usageCount}×</span>
            {!template.isActive && <span className="text-red-500">· archived</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-[#0F2744]" title="Edit">
            <Edit3 size={12} />
          </button>
          <button onClick={handleArchive} className="p-1.5 text-gray-400 hover:text-red-500" title={template.isActive ? "Archive" : "Restore"}>
            {template.isActive ? <Archive size={12} /> : <ArchiveRestore size={12} />}
          </button>
        </div>
      </div>
      {template.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
      )}
      {template.subject && (
        <p className="text-xs font-medium mt-2 line-clamp-1" style={{ color: "#374151" }}>{template.subject}</p>
      )}
      <p className="text-xs text-gray-400 mt-1 line-clamp-3 leading-relaxed">{template.body}</p>
      {template.variables.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {template.variables.map((v) => (
            <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1E40AF" }}>
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: Template | null;
  onClose: () => void;
  onSaved: (t: Template) => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [type] = useState(template?.type ?? "EMAIL");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sampleVars = {
    firstName: "Adaeze",
    lastName: "Okafor",
    fullName: "Adaeze Okafor",
    email: "adaeze@example.com",
    company: "Sample Hospital",
  };
  const previewSubject = subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (sampleVars as Record<string, string>)[k] ?? `{{${k}}}`);
  const previewBody = body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (sampleVars as Record<string, string>)[k] ?? `{{${k}}}`);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = template ? `/api/communications/templates/${template.id}` : "/api/communications/templates";
      const method = template ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category, type, subject, body }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to save template."));
        return;
      }
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>
            {template ? "Edit Template" : "New Template"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Monthly consultant check-in"
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sent on the 1st of each month to the active network"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quick update from CFA, {{firstName}}"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass}>Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder={"Hi {{firstName}},\n\n..."}
              className={inputClass}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: "13px" }}
              required
            />
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {["firstName", "lastName", "fullName", "email", "company"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBody((b) => b + ` {{${v}}}`)}
                  className="text-[10px] px-2 py-0.5 rounded-full hover:bg-gray-100"
                  style={{ background: "#F3F4F6", color: "#374151" }}
                >
                  + {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          {(subject || body) && (
            <div className="rounded-lg p-3" style={{ background: "#FAFBFC", border: "1px solid #E8EBF0" }}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                <Eye size={10} /> Preview
              </div>
              {previewSubject && (
                <p className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>{previewSubject}</p>
              )}
              {previewBody && (
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{previewBody}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !body.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
