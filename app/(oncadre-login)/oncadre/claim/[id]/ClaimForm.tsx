"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/cadrehealth/PasswordInput";

interface Props {
  professionalId: string;
}

export default function ClaimForm({ professionalId }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorRef, setErrorRef] = useState("");

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setErrorRef("");

    try {
      const res = await fetch("/api/cadre/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.ref) setErrorRef(String(data.ref));
        throw new Error(data.error || `Something went wrong (status ${res.status})`);
      }

      // Send them to the segmentation step before the dashboard so we can
      // tailor what they see based on their self-declared situation.
      router.push(`/oncadre/claim/${professionalId}/where`);
    } catch (err) {
      // Network failures (DNS, offline, CORS) hit here too. Surface the
      // raw message so users can paste it to support instead of guessing.
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {errorRef && (
            <span className="ml-1 text-xs font-mono text-red-500">
              (ref: {errorRef})
            </span>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Create a password
        </label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          style={{}}
        />
        {password.length > 0 && !passwordValid && (
          <p className="mt-1 text-xs text-red-500">
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Confirm password
        </label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          style={{}}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350] disabled:opacity-50"
      >
        {loading ? "Activating your profile..." : "Activate my profile"}
      </button>

      <p className="text-center text-xs text-gray-400">
        By activating, you agree to CadreHealth&apos;s Terms of Service and
        Privacy Policy.
      </p>

      {error && (
        <p className="text-center text-xs text-gray-500">
          Still stuck?{" "}
          <a
            href={`mailto:hello@consultforafrica.com?subject=${encodeURIComponent(
              "Trouble activating my CadreHealth profile",
            )}&body=${encodeURIComponent(
              `Hello,\n\nI tried to activate my CadreHealth profile but got this error:\n  ${error}${errorRef ? `\n  ref: ${errorRef}` : ""}\n\nMy profile reference: ${professionalId}\n\nPlease assist.\n\nThank you.`,
            )}`}
            className="font-medium text-[#0B3C5D] hover:underline"
          >
            Email us and we will activate it for you
          </a>
        </p>
      )}
    </form>
  );
}
