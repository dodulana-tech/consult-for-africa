"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Users, UserPlus, Loader2, KeyRound, MailCheck, Copy, Check } from "lucide-react";

export function InviteProfessionalButton({ professionalId }: { professionalId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function invite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cadre/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Invite sent (${data.sent} delivered)`);
      } else {
        setResult(data.error || "Failed to send");
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={invite}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0B3C5D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Invite Email
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.includes("sent") ? "text-emerald-600" : "text-red-500"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

export function InviteMentorButton({ professionalId }: { professionalId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function invite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cadre/admin/mentor-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult("Mentor invitation sent");
      } else {
        setResult(data.error || "Failed to send");
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={invite}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Invite as Mentor
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.includes("sent") ? "text-emerald-600" : "text-red-500"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

export function PushToOutreachButton({ mode }: { mode: "all" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function push() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cadre/admin/outreach-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter: "all_without_outreach" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`${data.created} professionals added to outreach pipeline`);
        router.refresh();
      } else {
        setResult(data.error || "Failed");
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={push}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        {loading ? "Initializing..." : "Push All to Outreach"}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.includes("added") ? "text-emerald-600" : "text-red-500"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

interface AuthLinkResult {
  link: string;
  expiresAt: string;
  emailSent: boolean;
  alreadyVerified?: boolean;
  error?: string;
}

function CopyableLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg p-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <code className="flex-1 truncate text-[11px]" style={{ color: "#0F2744" }}>{link}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold hover:bg-white"
        style={{ color: "#0B3C5D" }}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function GenerateResetLinkButton({ professionalId }: { professionalId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthLinkResult | null>(null);

  async function generate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/cadrehealth/${professionalId}/password-reset`, {
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
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Send Password Reset
      </button>
      {result?.error && <p className="mt-2 text-xs text-red-500">{result.error}</p>}
      {result?.link && (
        <div className="mt-2 max-w-md">
          <p className="text-xs text-gray-500">
            {result.emailSent ? "Email sent." : "Email send failed."} Link expires {new Date(result.expiresAt).toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}.
            {!result.emailSent && " Share the link manually:"}
          </p>
          <CopyableLink link={result.link} />
        </div>
      )}
    </div>
  );
}

export function ResendVerificationButton({
  professionalId,
  alreadyVerified,
}: {
  professionalId: string;
  alreadyVerified: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthLinkResult | null>(null);

  if (alreadyVerified) return null;

  async function generate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/cadrehealth/${professionalId}/resend-verification`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyVerified) {
          setResult({ link: "", expiresAt: "", emailSent: false, alreadyVerified: true });
        } else {
          setResult({ link: data.verifyLink, expiresAt: data.expiresAt, emailSent: data.emailSent });
        }
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
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        Resend Verification
      </button>
      {result?.alreadyVerified && (
        <p className="mt-2 text-xs text-emerald-600">Already verified.</p>
      )}
      {result?.error && <p className="mt-2 text-xs text-red-500">{result.error}</p>}
      {result?.link && (
        <div className="mt-2 max-w-md">
          <p className="text-xs text-gray-500">
            {result.emailSent ? "Email sent." : "Email send failed."} Link expires {new Date(result.expiresAt).toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}.
            {!result.emailSent && " Share the link manually:"}
          </p>
          <CopyableLink link={result.link} />
        </div>
      )}
    </div>
  );
}

export function PushSingleToOutreachButton({ professionalId }: { professionalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function push() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cadre/admin/outreach-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalIds: [professionalId] }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.created > 0 ? "Added to outreach pipeline" : "Already in pipeline");
        router.refresh();
      } else {
        setResult(data.error || "Failed");
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={push}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
      {result ?? "Add to Outreach"}
    </button>
  );
}
