"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Lock, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 10 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/client-portal/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to reset password.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h1 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>Invalid reset link</h1>
        <p className="text-sm text-gray-500 mb-4">This password reset link is missing or invalid.</p>
        <Link
          href="/client/forgot-password"
          className="text-sm font-medium"
          style={{ color: "#0F2744" }}
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 48, width: "auto" }} />
        <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
          Client Portal
        </h1>
      </div>

      <div
        className="rounded-2xl bg-white p-8 shadow-sm"
        style={{ border: "1px solid #e5eaf0" }}
      >
        {success ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>
              Password reset successful
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Your password has been updated. You can now log in.
            </p>
            <Link
              href="/client/login"
              className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0F2744" }}
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "#0F2744" }}>
              Set new password
            </h2>

            {error && (
              <div
                className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#991B1B",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                  New password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Minimum 10 characters"
                    className="w-full rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #e5eaf0", color: "#111827" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Uppercase, lowercase, number, and special character required
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    className="w-full rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #e5eaf0", color: "#111827" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/client/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "#0F2744" }}
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F8FAFB" }}
    >
      <Suspense
        fallback={
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
