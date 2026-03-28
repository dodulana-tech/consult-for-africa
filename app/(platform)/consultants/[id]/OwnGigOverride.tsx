"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

interface Override {
  enabled: boolean;
  maxConcurrent: number;
  maxBudgetNGN: number;
  maxBudgetUSD: number;
  minFeePct: number;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export default function OwnGigOverride({
  consultantId,
  consultantName,
  currentOverride,
}: {
  consultantId: string;
  consultantName: string;
  currentOverride: Override | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    maxConcurrent: String(currentOverride?.maxConcurrent ?? 2),
    maxBudgetNGN: String(currentOverride?.maxBudgetNGN ?? 10_000_000),
    maxBudgetUSD: String(currentOverride?.maxBudgetUSD ?? 7_500),
    minFeePct: String(currentOverride?.minFeePct ?? 10),
    reason: currentOverride?.reason ?? "",
  });

  async function grant() {
    if (!form.reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/consultants/${consultantId}/own-gig-override`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxConcurrent: parseInt(form.maxConcurrent) || 1,
          maxBudgetNGN: parseInt(form.maxBudgetNGN) || 5_000_000,
          maxBudgetUSD: parseInt(form.maxBudgetUSD) || 3_500,
          minFeePct: parseInt(form.minFeePct) || 10,
          reason: form.reason.trim(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function revoke() {
    if (!confirm(`Revoke own gig access for ${consultantName}?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/consultants/${consultantId}/own-gig-override`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (currentOverride) {
    return (
      <div className="rounded-lg p-3 mt-3" style={{ background: "#D1FAE5", border: "1px solid #A7F3D0" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">Own Gig Access Granted</span>
          </div>
          <button
            onClick={revoke}
            disabled={saving}
            className="text-[10px] text-red-500 hover:text-red-700 font-medium"
          >
            {saving ? "Revoking..." : "Revoke"}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-emerald-700">
          <span>Max concurrent: {currentOverride.maxConcurrent}</span>
          <span>Min fee: {currentOverride.minFeePct}%</span>
          <span>Max NGN: N{currentOverride.maxBudgetNGN.toLocaleString()}</span>
          <span>Max USD: ${currentOverride.maxBudgetUSD.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-emerald-600 mt-1">Reason: {currentOverride.reason}</p>
        <p className="text-[10px] text-emerald-500 mt-0.5">
          Granted {new Date(currentOverride.grantedAt).toLocaleDateString()}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-[10px] text-emerald-700 hover:underline mt-1"
        >
          Edit limits
        </button>
        {showForm && (
          <div className="mt-2 space-y-2 pt-2" style={{ borderTop: "1px solid #A7F3D0" }}>
            {renderForm()}
          </div>
        )}
      </div>
    );
  }

  function renderForm() {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Max concurrent gigs</label>
            <input
              type="number" min={1} max={10}
              value={form.maxConcurrent}
              onChange={(e) => setForm((f) => ({ ...f, maxConcurrent: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Min platform fee %</label>
            <input
              type="number" min={8} max={15} step={0.5}
              value={form.minFeePct}
              onChange={(e) => setForm((f) => ({ ...f, minFeePct: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Max budget (NGN)</label>
            <input
              type="number" min={500000}
              value={form.maxBudgetNGN}
              onChange={(e) => setForm((f) => ({ ...f, maxBudgetNGN: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Max budget (USD)</label>
            <input
              type="number" min={500}
              value={form.maxBudgetUSD}
              onChange={(e) => setForm((f) => ({ ...f, maxBudgetUSD: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Reason *</label>
          <input
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="e.g. Early partner, strong pipeline"
            className="w-full text-xs border rounded px-2 py-1.5"
            style={{ borderColor: "#e5eaf0" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={grant}
            disabled={saving || !form.reason.trim()}
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {saving ? <Loader2 size={10} className="animate-spin" /> : "Save"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-[10px] text-gray-400 px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="mt-3">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: "#F3F4F6", color: "#374151" }}
        >
          <ShieldOff size={11} />
          Grant Own Gig Access
        </button>
      ) : (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <p className="text-xs font-semibold text-gray-700">Grant Own Gig Access to {consultantName}</p>
          <p className="text-[10px] text-gray-400">This overrides tier requirements and allows the consultant to bring their own clients.</p>
          {renderForm()}
        </div>
      )}
    </div>
  );
}
