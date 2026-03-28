"use client";

import { useState } from "react";
import {
  UserPlus, Building2, Users, CheckCircle, Loader2,
  Clock, AlertCircle, ChevronRight,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

type ReferralType = "CLIENT" | "CONSULTANT" | "STAFF";

interface MyReferral {
  id: string;
  type: string;
  name: string;
  email: string;
  organisation: string | null;
  status: string;
  createdAt: string;
}

const TYPE_OPTIONS: { type: ReferralType; icon: typeof UserPlus; label: string; description: string }[] = [
  {
    type: "CLIENT",
    icon: Building2,
    label: "Potential Client",
    description: "A hospital, government body, or development organisation that could benefit from C4A services.",
  },
  {
    type: "CONSULTANT",
    icon: UserPlus,
    label: "Consultant",
    description: "A healthcare professional or operations expert you think would be a strong C4A consultant.",
  },
  {
    type: "STAFF",
    icon: Users,
    label: "Staff / Leadership",
    description: "Someone suited for an Engagement Manager, Director, or other internal C4A role.",
  },
];

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

const STAFF_ROLES = [
  "Engagement Manager",
  "Director",
  "Partner",
  "Other",
];

export default function ReferralForm({ myReferrals }: { myReferrals: MyReferral[] }) {
  const [selectedType, setSelectedType] = useState<ReferralType | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", organisation: "", suggestedRole: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [referrals, setReferrals] = useState(myReferrals);

  function reset() {
    setSelectedType(null);
    setForm({ name: "", email: "", phone: "", organisation: "", suggestedRole: "", notes: "" });
    setSuccess(false);
    setError("");
  }

  async function handleSubmit() {
    if (!selectedType || !form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          organisation: form.organisation || undefined,
          suggestedRole: form.suggestedRole || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Something went wrong.");
        return;
      }
      const data = await res.json();
      setSuccess(true);
      setReferrals((prev) => [
        {
          id: data.referral.id,
          type: data.referral.type,
          name: data.referral.name,
          email: data.referral.email,
          organisation: data.referral.organisation,
          status: data.referral.status,
          createdAt: data.referral.createdAt,
        },
        ...prev,
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Hero prompt */}
        <div
          className="rounded-xl p-5 flex items-start gap-4"
          style={{ background: "#0F2744" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <UserPlus size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Grow the C4A Network</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              Know a healthcare organisation that needs transformation support? A talented consultant or potential team member?
              Refer them here and we will take it from there.
            </p>
          </div>
        </div>

        {success ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
          >
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Referral submitted</p>
            <p className="text-sm text-gray-500 mt-1">The C4A team will follow up. Thank you for growing the network.</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0F2744" }}
            >
              Make another referral
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Choose type */}
            {!selectedType ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Who are you referring?</p>
                {TYPE_OPTIONS.map(({ type, icon: Icon, label, description }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="w-full flex items-start gap-4 rounded-xl p-4 text-left transition-shadow hover:shadow-sm"
                    style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#F0F4FF" }}
                    >
                      <Icon size={16} style={{ color: "#0F2744" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 mt-2 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              /* Step 2: Fill in details */
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {TYPE_OPTIONS.find((t) => t.type === selectedType)?.label} Details
                  </p>
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Change type
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder={selectedType === "CLIENT" ? "Organisation contact name" : "Full name"}
                      className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                      style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                      style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+234 80x xxx xxxx"
                      className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                      style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                    />
                  </div>

                  {(selectedType === "CLIENT" || selectedType === "CONSULTANT") && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {selectedType === "CLIENT" ? "Organisation Name" : "Current Organisation"}
                      </label>
                      <input
                        type="text"
                        value={form.organisation}
                        onChange={(e) => setForm((p) => ({ ...p, organisation: e.target.value }))}
                        placeholder={selectedType === "CLIENT" ? "e.g. Eko Hospital, Rivers State PHC Board" : "e.g. Lagos University Teaching Hospital"}
                        className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                      />
                    </div>
                  )}

                  {selectedType === "STAFF" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Suggested Role
                      </label>
                      <select
                        value={form.suggestedRole}
                        onChange={(e) => setForm((p) => ({ ...p, suggestedRole: e.target.value }))}
                        className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#F9FAFB", color: form.suggestedRole ? "#111" : "#9CA3AF" }}
                      >
                        <option value="">Select a role</option>
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Why are you recommending them?
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder={
                        selectedType === "CLIENT"
                          ? "Describe their needs, the size of the opportunity, how you know them..."
                          : "How do you know them? What makes them a strong fit for C4A?"
                      }
                      rows={4}
                      className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none"
                      style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.name.trim() || !form.email.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#0F2744" }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                  {submitting ? "Submitting..." : "Submit Referral"}
                </button>
              </div>
            )}
          </>
        )}

        {/* My referrals */}
        {referrals.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Your Referrals</p>
            {referrals.map((r) => {
              const Icon = TYPE_ICONS[r.type] ?? UserPlus;
              const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#F0F4FF" }}
                  >
                    <Icon size={14} style={{ color: "#0F2744" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.organisation && (
                      <p className="text-xs text-gray-400">{r.organisation}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(new Date(r.createdAt))}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
