"use client";

import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface Props {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnablePartnerPortalModal({
  contactId,
  contactName,
  onClose,
  onSuccess,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/.test(password)) {
      setError("Password must be at least 10 characters with uppercase, lowercase, number, and special character.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/partner-portal/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, password }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        setError(msg || "Failed to set password.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl"
        style={{ border: "1px solid #e5eaf0" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #e5eaf0" }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "#0F2744" }}
            >
              Enable Portal Access
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set a password for {contactName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {success ? (
            <div
              className="rounded-lg px-4 py-3 text-sm text-center"
              style={{
                background: "#D1FAE5",
                color: "#065F46",
                border: "1px solid #A7F3D0",
              }}
            >
              Portal access enabled successfully.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "#FEF2F2",
                    color: "#991B1B",
                    border: "1px solid #FECACA",
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="partner-portal-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Password
                </label>
                <input
                  id="partner-portal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={10}
                  placeholder="Minimum 10 characters"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{
                    border: "1px solid #e5eaf0",
                    color: "#111827",
                    background: "#fff",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#0F2744")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e5eaf0")
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="partner-portal-confirm-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Confirm Password
                </label>
                <input
                  id="partner-portal-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={10}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{
                    border: "1px solid #e5eaf0",
                    color: "#111827",
                    background: "#fff",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#0F2744")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e5eaf0")
                  }
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
                  style={{
                    border: "1px solid #e5eaf0",
                    color: "#6B7280",
                    background: "#fff",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity"
                  style={{
                    background: "#0F2744",
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Saving..." : "Enable Access"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
