"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/cadrehealth/PasswordInput";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/cadre/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
      setTimeout(() => router.push("/oncadre/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#FAFBFC" }}>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "#E8EBF0" }}>
          {success ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-center text-xl font-bold text-gray-900">Password updated</h2>
              <p className="mt-2 text-center text-sm text-gray-500">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link
                href="/oncadre/login"
                className="mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#0B3C5D" }}
              >
                Sign in now
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Set a new password</h1>
              <p className="mt-2 text-sm text-gray-500">
                Choose a strong password with at least 8 characters.
              </p>

              {error && (
                <div
                  className="mt-4 rounded-xl px-4 py-3 text-sm text-red-700"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">New password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
                  <PasswordInput
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full rounded-xl py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)", boxShadow: "0 2px 8px rgba(11,60,93,0.25)", minHeight: "44px" }}
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
