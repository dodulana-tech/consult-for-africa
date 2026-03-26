"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  month: string;
  status: string;
  targetCount: number;
  sentCount: number;
  respondedCount: number;
  assessmentCount: number;
  createdBy: { name: string };
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600" },
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-700" },
};

export default function OutreachCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", month: new Date().toISOString().slice(0, 7) });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/outreach").then((r) => r.json()).then((d) => setCampaigns(d.campaigns ?? [])).finally(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const { campaign } = await res.json();
        setCampaigns((prev) => [{ ...campaign, targetCount: 0, sentCount: 0, respondedCount: 0, assessmentCount: 0, createdBy: { name: "You" }, createdAt: new Date().toISOString() }, ...prev]);
        setForm({ name: "", description: "", month: new Date().toISOString().slice(0, 7) });
        setShowCreate(false);
      }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>Outreach Campaigns</h1>
            <p className="text-sm text-gray-500">Monthly leadership outreach for Maarova assessment pipeline</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="text-sm px-4 py-2 rounded-lg text-white font-semibold" style={{ background: "#0F2744" }}>
            {showCreate ? "Cancel" : "New Campaign"}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={create} className="bg-white rounded-xl border p-5 mb-6 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Name</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="e.g. March 2026 - Lagos Hospital CEOs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target Month</label>
                <input type="month" required value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} placeholder="Target audience, source strategy, messaging approach..." />
            </div>
            <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "#D4AF37" }}>
              {saving ? "Creating..." : "Create Campaign"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-gray-400">No outreach campaigns yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create your first campaign to start building the Maarova assessment pipeline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const st = STATUS_COLORS[c.status] ?? STATUS_COLORS.DRAFT;
              const conversionRate = c.sentCount > 0 ? Math.round((c.assessmentCount / c.sentCount) * 100) : 0;
              return (
                <Link key={c.id} href={`/admin/outreach/${c.id}`} className="block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5eaf0" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>{c.name}</h3>
                      <p className="text-xs text-gray-400">{c.month} | Created by {c.createdBy.name}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{c.status}</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mb-3">{c.description}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                    <div><p className="text-lg font-bold" style={{ color: "#0F2744" }}>{c.targetCount}</p><p className="text-xs text-gray-400">Targets</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "#D97706" }}>{c.sentCount}</p><p className="text-xs text-gray-400">Invited</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "#2563EB" }}>{c.respondedCount}</p><p className="text-xs text-gray-400">Responded</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "#059669" }}>{c.assessmentCount}</p><p className="text-xs text-gray-400">Assessed</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "#7C3AED" }}>{conversionRate}%</p><p className="text-xs text-gray-400">Conversion</p></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
