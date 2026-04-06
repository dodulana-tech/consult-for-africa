"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
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
      const res = await fetch("/api/cadre/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/oncadre/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-[#0B3C5D] via-[#0E4D6E] to-[#0B3C5D] p-12">
        <div>
          <Link href="/oncadre" className="text-2xl font-bold text-white">
            Cadre<span className="text-[#D4AF37]">Health</span>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white">
            Welcome back.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Your career intelligence, salary data, and professional network are
            right where you left them.
          </p>

          <div className="mt-10 space-y-6">
            {[
              { icon: "\u2713", text: "Check what your cadre earns nationwide" },
              { icon: "\u2713", text: "Track your CPD points and renewals" },
              { icon: "\u2713", text: "Read honest hospital reviews" },
              { icon: "\u2713", text: "Discover opportunities matched to you" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#0B3C5D]">
                  {item.icon}
                </div>
                <span className="text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">
          By Consult For Africa
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/oncadre" className="text-2xl font-bold text-[#0B3C5D]">
              Cadre<span className="text-[#D4AF37]">Health</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-gray-500">
            Access your profile, salary map, and more.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chioma@example.com"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/oncadre/register"
              className="font-medium text-[#0B3C5D] hover:underline"
            >
              Create a free profile
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-gray-400">
            <Link
              href="/oncadre"
              className="hover:text-gray-600 hover:underline"
            >
              Back to CadreHealth
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
