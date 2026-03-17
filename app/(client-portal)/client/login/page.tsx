"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientPortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/client-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Login failed. Please check your credentials.");
        return;
      }

      router.push("/client/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F8FAFB" }}
    >
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult for Africa" className="mx-auto mb-4" style={{ height: 48, width: "auto" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Client Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consult For Africa
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl bg-white p-8 shadow-sm"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: "#0F2744" }}
          >
            Sign in to your account
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
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@organisation.com"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
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
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
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

            <div className="flex justify-end">
              <Link
                href="/client/forgot-password"
                className="text-xs font-medium hover:underline"
                style={{ color: "#0F2744" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity mt-2"
              style={{
                background: "#0F2744",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Need access? Contact your engagement manager.
        </p>
      </div>
    </div>
  );
}
