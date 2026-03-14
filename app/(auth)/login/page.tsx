"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <Image src="/logo-cfa.png" alt="CFA" width={36} height={36} style={{ mixBlendMode: "multiply" }} />
        <div>
          <p className="font-semibold" style={{ color: "#0F2744" }}>Consult For Africa</p>
          <p className="text-xs" style={{ color: "#D4AF37" }}>Platform</p>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 24px rgba(15,39,68,0.07), 0 1px 4px rgba(15,39,68,0.05)",
        }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#0F2744" }}>Sign in</h1>
        <p className="text-sm mb-8 text-gray-500">
          Access your engagement management dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@consultforafrica.com"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition"
              style={{
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition pr-10"
                style={{
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            style={{ background: "#0F2744", color: "#ffffff" }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs mt-6 text-gray-400">
        Consult For Africa · Engagement Platform
      </p>
    </>
  );
}
