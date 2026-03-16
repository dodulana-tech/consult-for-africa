"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] pr-10";
  const inputStyle = { borderColor: "#e5eaf0" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !next || !confirm) { setError("All fields are required."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("New passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        setError(await res.text().catch(() => "Failed to change password."));
        return;
      }
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-emerald-700" style={{ background: "#ECFDF5" }}>
        <CheckCircle2 size={14} />
        Password changed successfully.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            placeholder="Minimum 10 characters"
            className={inputClass}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowNext(!showNext)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showNext ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={`${inputClass} pr-3`}
          style={{ ...inputStyle, borderColor: confirm && confirm !== next ? "#FECACA" : "#e5eaf0" }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        {loading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}
