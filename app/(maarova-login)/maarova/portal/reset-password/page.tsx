"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, AlertCircle, Lock, Loader2 } from "lucide-react";

function ResetForm() {
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
      const res = await fetch("/api/maarova/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      setSuccess(true);
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h1 className="text-white text-lg font-semibold mb-2">Invalid reset link</h1>
        <Link href="/maarova/portal/forgot-password" className="text-sm" style={{ color: "#D4A574" }}>Request a new link</Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image src="/cfa-logo-white.svg" alt="C4A" width={40} height={40} className="rounded" />
          <span className="text-white font-bold text-2xl tracking-tight">Maarova</span>
        </div>
      </div>
      <div className="rounded-2xl p-8 space-y-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
        {success ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
            <h2 className="text-white text-xl font-semibold mb-2">Password reset successful</h2>
            <p className="text-gray-400 text-sm mb-4">You can now log in with your new password.</p>
            <Link href="/maarova/portal/login" className="inline-block px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#D4A574" }}>Go to login</Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-white text-xl font-semibold">Set new password</h2>
              <p className="text-gray-400 text-sm mt-1">Choose a strong password.</p>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">New password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Minimum 10 characters" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none text-sm" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Uppercase, lowercase, number, and special character</p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" placeholder="Re-enter password" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading || !password || !confirm} className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50" style={{ backgroundColor: "#D4A574" }}>{loading ? "Resetting..." : "Reset password"}</button>
            </form>
            <div className="text-center">
              <Link href="/maarova/portal/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={14} /> Back to login</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function MaarovaResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#0f1a2a" }}>
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center"><Loader2 size={24} className="animate-spin text-gray-500 mx-auto" /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
