"use client";

import { useState } from "react";
import { Building2, UserPlus, Users, Clock, ChevronDown } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type ReferralStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "REJECTED";

interface Referral {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  suggestedRole: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  referrer: { id: string; name: string; email: string; role: string };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#F3F4F6", color: "#6B7280", label: "Pending" },
  CONTACTED: { bg: "#EFF6FF", color: "#1D4ED8", label: "Contacted" },
  CONVERTED: { bg: "#D1FAE5", color: "#065F46", label: "Converted" },
  REJECTED:  { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  CLIENT: Building2,
  CONSULTANT: UserPlus,
  STAFF: Users,
};

const TYPE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  CONSULTANT: "Consultant",
  STAFF: "Staff",
};

const STATUS_OPTIONS: ReferralStatus[] = ["PENDING", "CONTACTED", "CONVERTED", "REJECTED"];

export default function AdminReferralsManager({
  referrals: initial,
  counts,
}: {
  referrals: Referral[];
  counts: { total: number; pending: number; contacted: number; converted: number };
}) {
  const [referrals, setReferrals] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertLevel, setConvertLevel] = useState("STANDARD");
  const [convertError, setConvertError] = useState("");

  const filtered = filter === "all" ? referrals : referrals.filter((r) => r.status === filter.toUpperCase());

  async function updateStatus(id: string, status: ReferralStatus, assessmentLevel?: string) {
    setUpdating(id);
    setConvertError("");
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assessmentLevel }),
      });
      if (res.ok) {
        setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        setConvertingId(null);
      } else {
        const msg = await res.text().catch(() => "Failed");
        setConvertError(msg);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: counts.total, color: "#6B7280" },
            { label: "Pending", value: counts.pending, color: "#F59E0B" },
            { label: "Contacted", value: counts.contacted, color: "#3B82F6" },
            { label: "Converted", value: counts.converted, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "contacted", label: "Contacted" },
            { key: "converted", label: "Converted" },
            { key: "rejected", label: "Rejected" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? "#0F2744" : "#fff",
                color: filter === f.key ? "#fff" : "#6B7280",
                border: filter === f.key ? "1px solid #0F2744" : "1px solid #e5eaf0",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Referral cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <UserPlus size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No referrals in this category.</p>
            </div>
          )}
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.type] ?? UserPlus;
            const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
            return (
              <div
                key={r.id}
                className="rounded-xl p-5 bg-white"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#F0F4FF" }}
                  >
                    <Icon size={16} style={{ color: "#0F2744" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "#F0F4FF", color: "#0F2744" }}
                          >
                            {TYPE_LABELS[r.type] ?? r.type}
                          </span>
                          {r.suggestedRole && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {r.suggestedRole}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{r.email}</p>
                        {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                        {r.organisation && (
                          <p className="text-xs text-gray-500 mt-0.5">{r.organisation}</p>
                        )}
                      </div>

                      {/* Status selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <select
                            value={r.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as ReferralStatus;
                              if (newStatus === "CONVERTED" && r.type === "CONSULTANT" && r.status !== "CONVERTED") {
                                setConvertingId(r.id);
                              } else {
                                updateStatus(r.id, newStatus);
                              }
                            }}
                            disabled={updating === r.id}
                            className="text-[11px] font-semibold rounded-full px-3 py-1 pr-6 appearance-none cursor-pointer focus:outline-none"
                            style={{ background: statusStyle.bg, color: statusStyle.color, border: "none" }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusStyle.color }} />
                        </div>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="mt-3 text-xs text-gray-600 leading-relaxed p-3 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                        {r.notes}
                      </p>
                    )}

                    {/* Convert confirmation for consultant referrals */}
                    {convertingId === r.id && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <p className="text-xs font-semibold text-emerald-800 mb-2">Convert to CFA Consultant</p>
                        <p className="text-[11px] text-emerald-700 mb-3">This will create a platform account, send an invite email, and start the onboarding process.</p>
                        <label className="text-[11px] text-emerald-700 block mb-1">Assessment Level</label>
                        <select
                          value={convertLevel}
                          onChange={(e) => setConvertLevel(e.target.value)}
                          className="w-full rounded-lg border px-2 py-1.5 text-xs mb-3 focus:outline-none"
                          style={{ borderColor: "#BBF7D0" }}
                        >
                          <option value="LIGHT">Light (profile only)</option>
                          <option value="STANDARD">Standard (profile + proctored assessment)</option>
                          <option value="MAAROVA">Maarova assessment only</option>
                          <option value="FULL">Full (profile + assessment + Maarova)</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, "CONVERTED", convertLevel)}
                            disabled={updating === r.id}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                            style={{ background: "#059669" }}
                          >
                            {updating === r.id ? "Creating account..." : "Confirm and Send Invite"}
                          </button>
                          <button
                            onClick={() => { setConvertingId(null); setConvertError(""); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-white"
                            style={{ border: "1px solid #e5eaf0" }}
                          >
                            Cancel
                          </button>
                        </div>
                        {convertError && (
                          <p className="text-xs text-red-600 mt-2">{convertError}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(new Date(r.createdAt))}
                      </span>
                      <span>Referred by {r.referrer.name}</span>
                      <span className="capitalize">{r.referrer.role.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
