"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseApiError } from "@/lib/parse-api-error";

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await parseApiError(res);
        setError(text || "Invalid credentials");
        return;
      }

      router.push("/agent/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F8F9FB" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 36 }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Agent Portal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to manage your deals and commissions
          </p>
        </div>

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
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="Your password"
              />
            </div>
          </div>

          <div className="mt-2 text-right">
            <Link href="/agent/forgot-password" className="text-sm text-gray-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Not an agent yet?{" "}
            <Link href="/agent/register" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>
              Apply here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
