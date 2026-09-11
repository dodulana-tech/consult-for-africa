"use client";

/**
 * Claiming a free Maarova assessment won in the weekly digest.
 *
 * One field. The member has already earned this by contributing, so the page
 * asks for a password and nothing else: everything Maarova needs about them is
 * already on their CadreHealth record.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/cadrehealth/PasswordInput";

interface AwardInfo {
  name: string;
  greeting: string;
  email: string;
  expiresAt: string;
}

export default function ClaimMaarovaAwardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<AwardInfo | null>(null);
  const [blocked, setBlocked] = useState("");
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cadre/maarova-award/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setBlocked(data.message || data.error || "This claim link cannot be used.");
        return;
      }
      setInfo(data);
    } catch {
      setBlocked("We could not check this link. Please try again in a moment.");
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
      const res = await fetch(`/api/cadre/maarova-award/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(data.redirect || "/maarova/portal/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const expiry = info
    ? new Date(info.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#FAFBFC" }}>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "#E8EBF0" }}>
          {checking ? (
            <p className="text-center text-sm text-gray-500">Checking your link...</p>
          ) : blocked ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">We cannot open this one</h1>
              <p className="mt-3 text-sm text-gray-600">{blocked}</p>
              <Link
                href="/maarova/portal/login"
                className="mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#0B3C5D" }}
              >
                Go to the Maarova portal
              </Link>
              <Link
                href="/oncadre/dashboard"
                className="mt-3 block text-center text-sm font-medium"
                style={{ color: "#0B3C5D" }}
              >
                Back to CadreHealth
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#D4AF37" }}>
                Yours this week
              </p>
              <h1 className="mt-2 text-xl font-bold text-gray-900">
                {info?.greeting ? `${info.greeting}, your assessment is ready` : "Your assessment is ready"}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                One of five given out this week, for what you contributed. It is the same leadership
                instrument we run for hospital boards, and the full report is yours. Set a password and
                you can start now.
              </p>

              <div
                className="mt-5 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#F8FAFC", border: "1px solid #E8EBF0", color: "#334155" }}
              >
                <p className="font-medium text-gray-900">{info?.email}</p>
                <p className="mt-1 text-xs text-gray-500">Yours until {expiry}</p>
              </div>

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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Choose a password</label>
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
                  style={{
                    background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
                    boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
                    minHeight: "44px",
                  }}
                >
                  {loading ? "Setting up..." : "Claim my assessment"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                This creates your Maarova account on the email above. It is separate from your
                CadreHealth sign in.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
