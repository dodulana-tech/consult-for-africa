"use client";

import { useState } from "react";
import { KeyRound, Loader2, Copy, Check } from "lucide-react";

interface ResetResult {
  link: string;
  expiresAt: string;
  emailSent: boolean;
  error?: string;
}

export function EmployerResetButton({ employerId }: { employerId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/cadre-employers/${employerId}/password-reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ link: data.resetLink, expiresAt: data.expiresAt, emailSent: data.emailSent });
      } else {
        setResult({ link: "", expiresAt: "", emailSent: false, error: data.error || "Failed" });
      }
    } catch {
      setResult({ link: "", expiresAt: "", emailSent: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
        Send Password Reset
      </button>
      {result?.error && <p className="mt-1 text-xs text-red-500">{result.error}</p>}
      {result?.link && (
        <div className="mt-2 max-w-sm">
          <p className="text-[11px] text-gray-500">
            {result.emailSent ? "Email sent." : "Email send failed."} Expires{" "}
            {new Date(result.expiresAt).toLocaleString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "short",
            })}
            .
          </p>
          <div
            className="mt-1 flex items-center gap-2 rounded-lg p-2"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <code className="flex-1 truncate text-[10px]" style={{ color: "#0F2744" }}>
              {result.link}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.link).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold hover:bg-white"
              style={{ color: "#0B3C5D" }}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
