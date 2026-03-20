"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Target {
  id: string;
  name: string;
  title: string | null;
  organization: string | null;
  email: string | null;
  linkedinUrl: string | null;
  city: string | null;
  source: string | null;
  status: string;
  invitedAt: string | null;
  respondedAt: string | null;
  notes: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  month: string;
  status: string;
  targets: Target[];
}

const TARGET_STATUSES = [
  { value: "IDENTIFIED", label: "Identified", color: "#6B7280", bg: "#F3F4F6", next: "INVITED", nextLabel: "Send Invite" },
  { value: "INVITED", label: "Invited", color: "#2563EB", bg: "#EFF6FF", next: "RESPONDED", nextLabel: "Mark Responded" },
  { value: "RESPONDED", label: "Responded", color: "#059669", bg: "#F0FDF4", next: "ASSESSMENT_STARTED", nextLabel: "Assessment Started" },
  { value: "ASSESSMENT_STARTED", label: "Assessment Started", color: "#D97706", bg: "#FFFBEB", next: "ASSESSMENT_COMPLETED", nextLabel: "Assessment Done" },
  { value: "ASSESSMENT_COMPLETED", label: "Assessed", color: "#059669", bg: "#DCFCE7", next: null, nextLabel: null },
  { value: "DECLINED", label: "Declined", color: "#DC2626", bg: "#FEF2F2", next: null, nextLabel: null },
  { value: "NO_RESPONSE", label: "No Response", color: "#9CA3AF", bg: "#F3F4F6", next: null, nextLabel: null },
];

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add target
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", title: "", organization: "", email: "", linkedinUrl: "", city: "", source: "LinkedIn" });
  const [addSaving, setAddSaving] = useState(false);

  // Bulk
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Nuru
  const [nuruSuggesting, setNuruSuggesting] = useState(false);
  const [nuruTargets, setNuruTargets] = useState<Array<{ name: string; title: string; organization: string; city: string; source: string; outreachAngle: string }>>([]);
  const [nuruTip, setNuruTip] = useState("");
  const [nuruError, setNuruError] = useState("");

  async function refresh() {
    const res = await fetch(`/api/admin/outreach/${id}`);
    if (res.ok) setCampaign((await res.json()).campaign);
  }

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [id]);

  async function addTarget(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await fetch(`/api/admin/outreach/${id}/targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      if (res.ok) { await refresh(); setAddForm({ name: "", title: "", organization: "", email: "", linkedinUrl: "", city: "", source: "LinkedIn" }); setShowAdd(false); }
    } catch {} finally { setAddSaving(false); }
  }

  async function bulkAdd() {
    const lines = bulkText.split("\n").filter(Boolean);
    const targets = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      return { name: parts[0] || "", title: parts[1] || "", organization: parts[2] || "", email: parts[3] || "", city: parts[4] || "", source: parts[5] || "Bulk import" };
    }).filter((t) => t.name);
    if (targets.length === 0) return;
    setAddSaving(true);
    try { await fetch(`/api/admin/outreach/${id}/targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(targets) }); await refresh(); setBulkText(""); setShowBulk(false); }
    catch {} finally { setAddSaving(false); }
  }

  async function updateTargetStatus(targetId: string, status: string) {
    await fetch(`/api/admin/outreach/${id}/targets`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, status }) });
    await refresh();
  }

  async function updateCampaignStatus(status: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/outreach/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      await refresh();
    } catch { setError("Network error"); }
  }

  async function askNuru() {
    setNuruSuggesting(true);
    setNuruError("");
    setNuruTargets([]);
    try {
      const res = await fetch("/api/ai/suggest-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignName: campaign?.name, existingTargets: campaign?.targets.map((t) => t.name) ?? [] }),
      });
      if (!res.ok) { const d = await res.json(); setNuruError(d.error || "Nuru couldn't generate suggestions. Check API key."); return; }
      const data = await res.json();
      setNuruTargets(data.targets ?? []);
      setNuruTip(data.messagingTip ?? "");
    } catch { setNuruError("Network error calling Nuru"); }
    finally { setNuruSuggesting(false); }
  }

  async function addNuruTarget(target: typeof nuruTargets[0], idx: number) {
    await fetch(`/api/admin/outreach/${id}/targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: target.name, title: target.title, organization: target.organization, city: target.city, source: target.source }) });
    setNuruTargets((prev) => prev.filter((_, i) => i !== idx));
    await refresh();
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  if (!campaign) return <div className="flex-1 p-6 text-center text-gray-400">Campaign not found.</div>;

  const targets = campaign.targets;
  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";
  const inputStyle = { borderColor: "#e5eaf0" };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push("/admin/outreach")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Campaigns
        </button>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>{campaign.name}</h1>
            <p className="text-sm text-gray-500">{campaign.month} | {targets.length} targets</p>
          </div>
          <div className="flex gap-2">
            {campaign.status === "DRAFT" && <button onClick={() => updateCampaignStatus("ACTIVE")} className="text-sm px-4 py-2 rounded-lg text-white font-medium" style={{ background: "#059669" }}>Activate Campaign</button>}
            {campaign.status === "ACTIVE" && <button onClick={() => updateCampaignStatus("COMPLETED")} className="text-sm px-4 py-2 rounded-lg text-white font-medium" style={{ background: "#0F2744" }}>Mark Complete</button>}
            {campaign.status !== "DRAFT" && (
              <span className={`text-xs font-medium px-3 py-2 rounded-lg ${campaign.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                {campaign.status}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Targets", value: targets.length, color: "#0F2744" },
            { label: "Invited", value: targets.filter((t) => !["IDENTIFIED"].includes(t.status)).length, color: "#2563EB" },
            { label: "Responded", value: targets.filter((t) => ["RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length, color: "#059669" },
            { label: "Assessed", value: targets.filter((t) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length, color: "#D97706" },
            { label: "Conversion", value: `${targets.filter((t) => !["IDENTIFIED"].includes(t.status)).length > 0 ? Math.round((targets.filter((t) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length / targets.filter((t) => !["IDENTIFIED"].includes(t.status)).length) * 100) : 0}%`, color: "#7C3AED" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-3 text-center" style={{ borderColor: "#e5eaf0" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F2744" }}>
            {showAdd ? "Cancel" : "+ Add Target"}
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#e5eaf0" }}>
            {showBulk ? "Cancel" : "Bulk Import (CSV)"}
          </button>
          <button onClick={askNuru} disabled={nuruSuggesting} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50" style={{ background: "#D4AF37" + "15", color: "#92400E", border: "1px solid " + "#D4AF37" + "40" }}>
            {nuruSuggesting ? "Researching..." : "Nuru: Suggest Targets"}
          </button>
        </div>

        {nuruError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{nuruError}</div>}

        {/* Nuru suggestions */}
        {nuruTargets.length > 0 && (
          <div className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#D4AF37" + "40", background: "#D4AF37" + "05" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>Nuru suggests {nuruTargets.length} target profiles</p>
              <button onClick={() => setNuruTargets([])} className="text-[10px] text-gray-400">Dismiss</button>
            </div>
            {nuruTip && <p className="text-xs text-gray-500 italic bg-amber-50 rounded px-3 py-2">Messaging tip: {nuruTip}</p>}
            <div className="space-y-2">
              {nuruTargets.map((t, i) => (
                <div key={i} className="flex items-start justify-between bg-white rounded-lg border p-3" style={{ borderColor: "#e5eaf0" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{t.name}</p>
                    <p className="text-xs text-gray-500">{t.title} at {t.organization} | {t.city}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.outreachAngle}</p>
                  </div>
                  <button onClick={() => addNuruTarget(t, i)} className="text-[10px] px-2.5 py-1 rounded-lg text-white shrink-0" style={{ background: "#0F2744" }}>Add</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <form onSubmit={addTarget} className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <div className="grid grid-cols-3 gap-3">
              <input required value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Full name *" />
              <input value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Title (CEO, MD, CMO)" />
              <input value={addForm.organization} onChange={(e) => setAddForm((p) => ({ ...p, organization: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Hospital/Organisation" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <input value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Email" />
              <input value={addForm.linkedinUrl} onChange={(e) => setAddForm((p) => ({ ...p, linkedinUrl: e.target.value }))} className={inputClass} style={inputStyle} placeholder="LinkedIn URL" />
              <input value={addForm.city} onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} style={inputStyle} placeholder="City" />
              <select value={addForm.source} onChange={(e) => setAddForm((p) => ({ ...p, source: e.target.value }))} className={inputClass} style={inputStyle}>
                <option>LinkedIn</option><option>Conference</option><option>Referral</option><option>MDCN Registry</option><option>Industry Directory</option><option>Other</option>
              </select>
            </div>
            <button type="submit" disabled={addSaving} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>{addSaving ? "Adding..." : "Add Target"}</button>
          </form>
        )}

        {showBulk && (
          <div className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-xs text-gray-500">Paste CSV: Name, Title, Organisation, Email, City, Source (one per line)</p>
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={5} className={`${inputClass} resize-none font-mono text-xs`} style={inputStyle} placeholder={"Dr. Ade Ogunleye, CEO, General Hospital Lagos, ade@hospital.com, Lagos, LinkedIn"} />
            <button onClick={bulkAdd} disabled={addSaving || !bulkText.trim()} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>{addSaving ? "Importing..." : `Import ${bulkText.split("\n").filter(Boolean).length} targets`}</button>
          </div>
        )}

        {/* Targets */}
        {targets.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-gray-400">No targets yet. Add individuals, bulk import, or ask Nuru to suggest.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {targets.map((t) => {
              const statusConfig = TARGET_STATUSES.find((s) => s.value === t.status) ?? TARGET_STATUSES[0];
              return (
                <div key={t.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>{t.name}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t.title && `${t.title} | `}{t.organization ?? ""}{t.city ? ` | ${t.city}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        {t.email && <span>{t.email}</span>}
                        {t.linkedinUrl && <a href={t.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Profile</a>}
                        {t.source && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">{t.source}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {statusConfig.next && (
                        <button
                          onClick={() => updateTargetStatus(t.id, statusConfig.next!)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                          style={{ background: "#0F2744" }}
                        >
                          {statusConfig.nextLabel}
                        </button>
                      )}
                      {t.status === "IDENTIFIED" && (
                        <button
                          onClick={() => updateTargetStatus(t.id, "NO_RESPONSE")}
                          className="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500"
                        >
                          Skip
                        </button>
                      )}
                      {(t.status === "INVITED" || t.status === "NO_RESPONSE") && t.email && (
                        <button
                          onClick={() => updateTargetStatus(t.id, "INVITED")}
                          className="text-xs px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          Resend Invite
                        </button>
                      )}
                      {t.status === "INVITED" && (
                        <button
                          onClick={() => updateTargetStatus(t.id, "DECLINED")}
                          className="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500"
                        >
                          Declined
                        </button>
                      )}
                      {t.status === "INVITED" && (
                        <button
                          onClick={() => updateTargetStatus(t.id, "NO_RESPONSE")}
                          className="text-xs px-2 py-1.5 rounded-lg text-gray-400"
                        >
                          No Response
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
