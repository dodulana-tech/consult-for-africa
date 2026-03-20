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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  IDENTIFIED: { bg: "bg-gray-100", text: "text-gray-600" },
  INVITED: { bg: "bg-blue-50", text: "text-blue-700" },
  RESPONDED: { bg: "bg-green-50", text: "text-green-700" },
  ASSESSMENT_STARTED: { bg: "bg-amber-50", text: "text-amber-700" },
  ASSESSMENT_COMPLETED: { bg: "bg-green-50", text: "text-green-800" },
  DECLINED: { bg: "bg-red-50", text: "text-red-700" },
  NO_RESPONSE: { bg: "bg-gray-100", text: "text-gray-400" },
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", title: "", organization: "", email: "", linkedinUrl: "", city: "", source: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [nuruSuggesting, setNuruSuggesting] = useState(false);
  const [nuruTargets, setNuruTargets] = useState<Array<{ name: string; title: string; organization: string; city: string; source: string; outreachAngle: string }>>([]);
  const [nuruTip, setNuruTip] = useState("");

  async function askNuruForTargets() {
    setNuruSuggesting(true);
    setNuruTargets([]);
    try {
      const res = await fetch("/api/ai/suggest-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaign?.name,
          existingTargets: campaign?.targets.map((t) => t.name) ?? [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNuruTargets(data.targets ?? []);
        setNuruTip(data.messagingTip ?? "");
      }
    } catch {}
    finally { setNuruSuggesting(false); }
  }

  async function addNuruTarget(target: typeof nuruTargets[0], idx: number) {
    try {
      await fetch(`/api/admin/outreach/${id}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: target.name, title: target.title, organization: target.organization, city: target.city, source: target.source }),
      });
      setNuruTargets((prev) => prev.filter((_, i) => i !== idx));
      const refreshRes = await fetch(`/api/admin/outreach/${id}`);
      setCampaign((await refreshRes.json()).campaign);
    } catch {}
  }

  useEffect(() => {
    fetch(`/api/admin/outreach/${id}`).then((r) => r.json()).then((d) => setCampaign(d.campaign)).finally(() => setLoading(false));
  }, [id]);

  async function addTarget(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await fetch(`/api/admin/outreach/${id}/targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      if (res.ok) {
        const refreshRes = await fetch(`/api/admin/outreach/${id}`);
        setCampaign((await refreshRes.json()).campaign);
        setAddForm({ name: "", title: "", organization: "", email: "", linkedinUrl: "", city: "", source: "" });
        setShowAdd(false);
      }
    } catch {}
    finally { setAddSaving(false); }
  }

  async function bulkAdd() {
    const lines = bulkText.split("\n").filter(Boolean);
    const targets = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      return { name: parts[0] || "", title: parts[1] || "", organization: parts[2] || "", email: parts[3] || "", city: parts[4] || "", source: parts[5] || "Bulk import" };
    }).filter((t) => t.name);
    if (targets.length === 0) return;
    setAddSaving(true);
    try {
      await fetch(`/api/admin/outreach/${id}/targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(targets) });
      const refreshRes = await fetch(`/api/admin/outreach/${id}`);
      setCampaign((await refreshRes.json()).campaign);
      setBulkText("");
      setShowBulk(false);
    } catch {}
    finally { setAddSaving(false); }
  }

  async function updateTargetStatus(targetId: string, status: string) {
    await fetch(`/api/admin/outreach/${id}/targets`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, status }) });
    const refreshRes = await fetch(`/api/admin/outreach/${id}`);
    setCampaign((await refreshRes.json()).campaign);
  }

  async function updateCampaignStatus(status: string) {
    await fetch(`/api/admin/outreach/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const refreshRes = await fetch(`/api/admin/outreach/${id}`);
    setCampaign((await refreshRes.json()).campaign);
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  if (!campaign) return <div className="flex-1 p-6 text-center text-gray-400">Campaign not found.</div>;

  const targets = campaign.targets;
  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push("/admin/outreach")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Campaigns
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>{campaign.name}</h1>
            <p className="text-sm text-gray-500">{campaign.month} | {targets.length} targets</p>
          </div>
          <div className="flex gap-2">
            {campaign.status === "DRAFT" && <button onClick={() => updateCampaignStatus("ACTIVE")} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#059669" }}>Activate</button>}
            {campaign.status === "ACTIVE" && <button onClick={() => updateCampaignStatus("COMPLETED")} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F2744" }}>Complete</button>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Targets", value: targets.length, color: "#0F2744" },
            { label: "Invited", value: targets.filter((t) => t.status !== "IDENTIFIED").length, color: "#D97706" },
            { label: "Responded", value: targets.filter((t) => ["RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length, color: "#2563EB" },
            { label: "Assessed", value: targets.filter((t) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length, color: "#059669" },
            { label: "Conversion", value: targets.length > 0 ? `${Math.round((targets.filter((t) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(t.status)).length / Math.max(1, targets.filter((t) => t.status !== "IDENTIFIED").length)) * 100)}%` : "0%", color: "#7C3AED" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-3 text-center" style={{ borderColor: "#e5eaf0" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add targets */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F2744" }}>
            {showAdd ? "Cancel" : "Add Target"}
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#e5eaf0" }}>
            {showBulk ? "Cancel" : "Bulk Import (CSV)"}
          </button>
          <button onClick={askNuruForTargets} disabled={nuruSuggesting} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50" style={{ background: "#D4AF37" + "15", color: "#92400E", border: "1px solid #D4AF37" + "40" }}>
            {nuruSuggesting ? "Researching..." : "Nuru: Suggest Targets"}
          </button>
        </div>

        {/* Nuru suggestions */}
        {nuruTargets.length > 0 && (
          <div className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#D4AF37" + "40", background: "#D4AF37" + "05" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>Nuru suggests {nuruTargets.length} targets</p>
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

        {showAdd && (
          <form onSubmit={addTarget} className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <div className="grid grid-cols-3 gap-3">
              <input required value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="Full name *" />
              <input value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="Title (CEO, MD, CMO)" />
              <input value={addForm.organization} onChange={(e) => setAddForm((p) => ({ ...p, organization: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="Hospital/Organisation" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="Email" />
              <input value={addForm.linkedinUrl} onChange={(e) => setAddForm((p) => ({ ...p, linkedinUrl: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="LinkedIn URL" />
              <input value={addForm.city} onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="City (Lagos, Abuja)" />
            </div>
            <button type="submit" disabled={addSaving} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>{addSaving ? "Adding..." : "Add"}</button>
          </form>
        )}

        {showBulk && (
          <div className="bg-white rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-xs text-gray-500">Paste CSV: Name, Title, Organisation, Email, City, Source (one per line)</p>
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={6} className={`${inputClass} resize-none font-mono text-xs`} style={{ borderColor: "#e5eaf0" }} placeholder={"Dr. Ade Ogunleye, CEO, General Hospital Lagos, ade@hospital.com, Lagos, LinkedIn\nDr. Bola Ige, CMO, Cedarcrest Hospitals, bola@cedarcrest.com, Abuja, Conference"} />
            <button onClick={bulkAdd} disabled={addSaving || !bulkText.trim()} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>{addSaving ? "Importing..." : `Import ${bulkText.split("\n").filter(Boolean).length} targets`}</button>
          </div>
        )}

        {/* Targets table */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No targets yet. Add individuals or bulk import.</td></tr>
              ) : targets.map((t) => {
                const st = STATUS_COLORS[t.status] ?? STATUS_COLORS.IDENTIFIED;
                return (
                  <tr key={t.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "#0F2744" }}>{t.name}</p>
                      {t.title && <p className="text-[10px] text-gray-400">{t.title}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.organization ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {t.email && <p className="text-gray-500">{t.email}</p>}
                        {t.linkedinUrl && <a href={t.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>}
                        {t.city && <p className="text-[10px] text-gray-400">{t.city}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{t.status.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        onChange={(e) => updateTargetStatus(t.id, e.target.value)}
                        className="text-[10px] border rounded px-1.5 py-1"
                        style={{ borderColor: "#e5eaf0" }}
                      >
                        <option value="IDENTIFIED">Identified</option>
                        <option value="INVITED">Invited</option>
                        <option value="RESPONDED">Responded</option>
                        <option value="ASSESSMENT_STARTED">Assessment Started</option>
                        <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
                        <option value="DECLINED">Declined</option>
                        <option value="NO_RESPONSE">No Response</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
