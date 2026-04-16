"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/cadrehealth/PasswordInput";

export default function EmployerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cadre/employer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/oncadre/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div
        className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between overflow-hidden p-12"
        style={{ background: "#06090f" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 70% 30%, rgba(11,60,93,0.5) 0%, rgba(11,60,93,0.15) 40%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 80% 10%, rgba(212,175,55,0.15) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        <div className="relative">
          <Link href="/oncadre" className="text-2xl font-bold text-white tracking-tight">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] mb-6"
            style={{ color: "#D4AF37" }}
          >
            Employer Portal
          </p>
          <h2
            className="font-bold text-white leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
          >
            Manage your recruitment pipeline.
          </h2>
          <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
            Post roles, review applicants, and search verified healthcare
            professionals all in one place.
          </p>
        </div>

        <p className="relative text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          By Consult For Africa
        </p>
      </div>

      {/* Right panel - form */}
      <div
        className="flex flex-1 items-center justify-center p-6 sm:p-12"
        style={{ background: "#FAFBFC" }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
              Cadre<span style={{ color: "#D4AF37" }}>Health</span>
            </Link>
          </div>

          <h1
            className="font-bold text-gray-900"
            style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
          >
            Employer Sign In
          </h1>
          <p className="mt-2 text-gray-500">
            Access your dashboard and manage listings.
          </p>

          {error && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm text-red-700"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@hospital.com"
                required
                className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
                style={{ border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", minHeight: "44px" }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-xl py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
                boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
                minHeight: "44px",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an employer account?{" "}
            <Link
              href="/oncadre/employer/register"
              className="font-semibold text-[#0B3C5D] hover:underline"
            >
              Register your facility
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-gray-400">
            <Link
              href="/oncadre"
              className="hover:text-gray-600 hover:underline transition-colors duration-200"
            >
              Back to CadreHealth
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
