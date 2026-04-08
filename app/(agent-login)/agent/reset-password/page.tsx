"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/agent-portal/reset-password", {
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
      <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Invalid reset link. Please request a new password reset.
        </div>
        <Link
          href="/agent/forgot-password"
          className="block text-center text-sm font-semibold hover:underline"
          style={{ color: "#D4AF37" }}
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Your password has been reset successfully.
        </div>
        <Link
          href="/agent/login"
          className="block text-center text-sm font-semibold hover:underline"
          style={{ color: "#D4AF37" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-8 shadow-sm"
      style={{ border: "1px solid #E8EBF0" }}
    >
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            New Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            placeholder="Repeat your password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}

export default function AgentResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F8F9FB" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 36 }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Set New Password
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a new password for your agent account
          </p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center text-sm text-gray-500" style={{ border: "1px solid #E8EBF0" }}>
            Loading...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
