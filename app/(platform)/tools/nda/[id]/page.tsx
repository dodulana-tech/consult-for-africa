"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Download, CheckCircle, Clock, Send, Trash2, Sparkles,
} from "lucide-react";
import SignaturePad from "@/components/platform/SignaturePad";

interface Nda {
  id: string;
  type: string;
  status: string;
  version: string;
  partyAName: string;
  partyAOrg: string;
  partyATitle: string | null;
  partyAEmail: string;
  partyASignedAt: string | null;
  partyBName: string;
  partyBOrg: string;
  partyBTitle: string | null;
  partyBEmail: string | null;
  partyBSignedAt: string | null;
  effectiveDate: string;
  expiresAt: string | null;
  signedPdfUrl: string | null;
  engagement: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  consultant: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string };
}

const TYPE_LABELS: Record<string, string> = {
  MUTUAL_CLIENT: "Mutual Non-Disclosure Agreement",
  CONSULTANT_MASTER: "Consultant Confidentiality Agreement",
  PROJECT_SPECIFIC: "Project-Specific NDA",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "Draft", bg: "#F3F4F6", text: "#6B7280" },
  PENDING_PARTY_A: { label: "Awaiting External Signature", bg: "#FEF3C7", text: "#92400E" },
  PENDING_PARTY_B: { label: "Awaiting C4A Countersignature", bg: "#EFF6FF", text: "#1D4ED8" },
  ACTIVE: { label: "Fully Executed", bg: "#ECFDF5", text: "#065F46" },
  EXPIRED: { label: "Expired", bg: "#FEF2F2", text: "#991B1B" },
  TERMINATED: { label: "Terminated", bg: "#FEF2F2", text: "#991B1B" },
};

export default function NdaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [nda, setNda] = useState<Nda | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState("");
  const [signError, setSignError] = useState("");

  useEffect(() => {
    fetch(`/api/ndas/${id}`)
      .then((r) => r.json())
      .then((data) => setNda(data.nda ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCountersign() {
    if (!signature) {
      setSignError("Please draw your signature first");
      return;
    }
    setSigning(true);
    setSignError("");
    try {
      const res = await fetch(`/api/ndas/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ party: "B", signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh
      const updated = await fetch(`/api/ndas/${id}`).then((r) => r.json());
      setNda(updated.nda);
    } catch (err) {
      console.error("NDA sign failed:", err);
      setSignError("Unable to sign the NDA. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to cancel this NDA?")) return;
    await fetch(`/api/ndas/${id}`, { method: "DELETE" });
    router.push("/tools/nda");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!nda) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">NDA not found</p>
      </div>
    );
  }

  const config = STATUS_CONFIG[nda.status] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          NDA Manager
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {TYPE_LABELS[nda.type]}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Version {nda.version} · {nda.partyAOrg}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: config.bg, color: config.text }}
          >
            {config.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: "#D4A574" }}>
                  {nda.type === "CONSULTANT_MASTER" ? "Consultant" : "Party A"}
                </h3>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{nda.partyAName}</p>
                <p className="text-xs text-gray-500">{nda.partyAOrg}</p>
                {nda.partyATitle && <p className="text-xs text-gray-400">{nda.partyATitle}</p>}
                <p className="text-xs text-gray-400">{nda.partyAEmail}</p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                  {nda.partyASignedAt ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Signed {new Date(nda.partyASignedAt).toLocaleDateString("en-GB")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="w-3.5 h-3.5" />
                      Pending signature
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
                <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: "#D4A574" }}>
                  {nda.type === "CONSULTANT_MASTER" ? "Company" : "Party B"}
                </h3>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{nda.partyBName}</p>
                <p className="text-xs text-gray-500">{nda.partyBOrg}</p>
                {nda.partyBTitle && <p className="text-xs text-gray-400">{nda.partyBTitle}</p>}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                  {nda.partyBSignedAt ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Countersigned {new Date(nda.partyBSignedAt).toLocaleDateString("en-GB")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      <Clock className="w-3.5 h-3.5" />
                      Pending countersign
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Countersign Section */}
            {nda.status === "PENDING_PARTY_B" && (
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#D4AF37" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" style={{ color: "#D4AF37" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    Countersign this NDA
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {nda.partyAName} has signed. Add your signature to activate this agreement.
                </p>

                <SignaturePad onSignature={setSignature} />

                {signError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mt-4">{signError}</div>
                )}

                <button
                  onClick={handleCountersign}
                  disabled={signing || !signature}
                  className="mt-4 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {signing ? "Signing..." : "Countersign NDA"}
                </button>
              </div>
            )}

            {/* Active NDA confirmation */}
            {nda.status === "ACTIVE" && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-green-800 mb-1">NDA is Active</h3>
                <p className="text-xs text-green-600">
                  Fully executed on {nda.partyBSignedAt ? new Date(nda.partyBSignedAt).toLocaleDateString("en-GB") : "-"}.
                  {nda.expiresAt && ` Expires ${new Date(nda.expiresAt).toLocaleDateString("en-GB")}.`}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl border p-4 space-y-2" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Actions</h3>

              <a
                href={`/api/ndas/${nda.id}/pdf`}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                style={{ color: "#0F2744" }}
              >
                <Download className="w-4 h-4 text-gray-400" />
                Download PDF
              </a>

              {nda.status === "PENDING_PARTY_A" && (
                <button
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  style={{ color: "#0F2744" }}
                >
                  <Send className="w-4 h-4 text-gray-400" />
                  Resend Signing Link
                </button>
              )}

              {(nda.status === "DRAFT" || nda.status.startsWith("PENDING")) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel NDA
                </button>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Type</dt>
                  <dd className="font-medium" style={{ color: "#0F2744" }}>{TYPE_LABELS[nda.type]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Effective Date</dt>
                  <dd>{new Date(nda.effectiveDate).toLocaleDateString("en-GB")}</dd>
                </div>
                {nda.expiresAt && (
                  <div>
                    <dt className="text-xs text-gray-400">Expires</dt>
                    <dd>{new Date(nda.expiresAt).toLocaleDateString("en-GB")}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400">Created by</dt>
                  <dd>{nda.createdBy.name}</dd>
                </div>
                {nda.engagement && (
                  <div>
                    <dt className="text-xs text-gray-400">Project</dt>
                    <dd>
                      <a href={`/projects/${nda.engagement.id}`} className="hover:underline" style={{ color: "#D4AF37" }}>
                        {nda.engagement.name}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
