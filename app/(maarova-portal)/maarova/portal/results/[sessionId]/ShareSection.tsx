"use client";

import { useEffect, useState } from "react";

const NAVY = "#0F2744";
const GOLD = "#D4A574";

interface Props {
  sessionId: string;
  initialShareToken: string | null;
  initialShareEnabledAt: string | null;
  leaderName?: string;
  archetype?: string;
}

function profileUrl(token: string) {
  if (typeof window === "undefined") return `/maarova/profile/${token}`;
  return `${window.location.origin}/maarova/profile/${token}`;
}

export default function ShareSection({
  sessionId,
  initialShareToken,
  initialShareEnabledAt,
  leaderName,
  archetype,
}: Props) {
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [shareEnabledAt, setShareEnabledAt] = useState<string | null>(initialShareEnabledAt);
  const [busy, setBusy] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShared = Boolean(shareToken && shareEnabledAt);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function enableSharing() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/reports/${sessionId}/share`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not enable sharing.");
      }
      const data = await res.json();
      setShareToken(data.shareToken);
      setShareEnabledAt(data.shareEnabledAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable sharing.");
    } finally {
      setBusy(false);
    }
  }

  async function disableSharing() {
    if (!confirm("Disable sharing? Anyone with the existing link will lose access. Re-enabling later will issue a new URL.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/reports/${sessionId}/share`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not disable sharing.");
      }
      setShareToken(null);
      setShareEnabledAt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable sharing.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareToken) return;
    const url = profileUrl(shareToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the link and copy manually.");
    }
  }

  function whatsappUrl() {
    if (!shareToken) return "#";
    const url = profileUrl(shareToken);
    const text = archetype && leaderName
      ? `${leaderName}'s Maarova leadership profile (${archetype}): ${url}`
      : `My Maarova leadership profile: ${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function linkedInUrl() {
    if (!shareToken) return "#";
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl(shareToken))}`;
  }

  async function downloadProfilePdf() {
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/reports/${sessionId}/profile-pdf`);
      if (!res.ok) throw new Error("Could not generate the profile PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "Maarova-Profile.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl bg-white p-6 mb-6"
      style={{ border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: NAVY }}>
            {isShared ? "Your public profile is live" : "Share your leadership profile"}
          </h3>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            {isShared
              ? "Anyone with the link can see your archetype, signature strengths, and top dimensions. Your coaching priorities, development areas, and full report stay private."
              : "Create a public link to share with your network or attach to your CV. Only your archetype, signature strengths, and top dimensions are public. Coaching priorities and development areas remain private."}
          </p>
        </div>
        {isShared ? (
          <span
            className="text-xs px-3 py-1 rounded-full whitespace-nowrap"
            style={{ backgroundColor: "rgba(212,165,116,0.15)", color: NAVY }}
          >
            Shared
          </span>
        ) : null}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isShared && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={enableSharing}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
            style={{ backgroundColor: GOLD }}
          >
            {busy ? "Generating link..." : "Make profile shareable"}
          </button>
          <button
            onClick={downloadProfilePdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            {pdfLoading ? "Preparing PDF..." : "Download CV profile"}
          </button>
        </div>
      )}

      {isShared && shareToken && (
        <>
          <div
            className="flex items-stretch rounded-lg overflow-hidden mb-3"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <input
              readOnly
              value={profileUrl(shareToken)}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 font-mono outline-none"
            />
            <button
              onClick={copyLink}
              className="px-4 text-sm font-medium transition-colors"
              style={{ backgroundColor: NAVY, color: "white" }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadProfilePdf}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: NAVY }}
            >
              {pdfLoading ? "Preparing PDF..." : "Download CV profile"}
            </button>
            <a
              href={profileUrl(shareToken)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#e5eaf0", color: NAVY }}
            >
              View profile
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#25D366" }}
            >
              Share on WhatsApp
            </a>
            <a
              href={linkedInUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#0A66C2" }}
            >
              Share on LinkedIn
            </a>
            <button
              onClick={disableSharing}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50 disabled:opacity-60 ml-auto"
              style={{ borderColor: "#e5eaf0", color: "#6b7280" }}
            >
              {busy ? "Working..." : "Disable sharing"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
