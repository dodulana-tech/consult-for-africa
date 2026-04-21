"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, AlertCircle, Lock, Loader2 } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

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
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!PASSWORD_REGEX.test(password)) { setError("Password must be at least 10 characters with uppercase, lowercase, number, and special character."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) { setError(await parseApiError(res)); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h1 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>Invalid reset link</h1>
        <p className="text-sm text-gray-500 mb-4">This password reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-sm font-medium" style={{ color: "#0F2744" }}>Request a new reset link</Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-3 mb-8">
        <Image src="/logo-cfa.png" alt="C4A" width={36} height={36} style={{ mixBlendMode: "multiply" }} />
        <div>
          <p className="font-semibold" style={{ color: "#0F2744" }}>Consult For Africa</p>
          <p className="text-xs" style={{ color: "#D4AF37" }}>Platform</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-8"
        style={{ background: "#ffffff", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(15,39,68,0.07)" }}
      >
        {success ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#0F2744" }}>Password reset successful</h1>
            <p className="text-sm text-gray-500 mb-4">You can now log in with your new password.</p>
            <Link href="/login" className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#0F2744" }}>Go to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "#0F2744" }}>Set new password</h1>
            <p className="text-sm mb-6 text-gray-500">Choose a strong password for your account.</p>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">New password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Minimum 10 characters" className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")} onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Uppercase, lowercase, number, and special character required</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" placeholder="Re-enter password" className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")} onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")} />
                </div>
              </div>
              <button type="submit" disabled={loading || !password || !confirm} className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60" style={{ background: "#0F2744", color: "#fff" }}>{loading ? "Resetting..." : "Reset password"}</button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={14} /> Back to login</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center"><Loader2 size={24} className="animate-spin text-gray-400 mx-auto" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
