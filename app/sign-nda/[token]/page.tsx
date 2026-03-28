"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle, FileText } from "lucide-react";
import SignaturePad from "@/components/platform/SignaturePad";

interface NdaInfo {
  id: string;
  type: string;
  version: string;
  status: string;
  partyAName: string;
  partyAOrg: string;
  partyATitle: string | null;
  partyAEmail: string;
  partyBName: string;
  partyBOrg: string;
  effectiveDate: string;
  engagement: { id: string; name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  MUTUAL_CLIENT: "Mutual Non-Disclosure Agreement",
  CONSULTANT_MASTER: "Consultant Confidentiality Agreement",
  PROJECT_SPECIFIC: "Project-Specific NDA",
};

export default function ExternalSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [nda, setNda] = useState<NdaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetch(`/api/ndas/sign/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setNda(data.nda);
      })
      .catch((err) => { console.error("NDA load failed:", err); setError("Unable to load this NDA. The link may be invalid or expired."); })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSign() {
    if (!signature) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/ndas/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSigned(true);
    } catch (err) {
      console.error("NDA sign failed:", err);
      setError("Unable to sign the NDA. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !nda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8 max-w-md text-center" style={{ borderColor: "#e5eaf0" }}>
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2" style={{ color: "#0F2744" }}>
            Unable to load NDA
          </h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8 max-w-md text-center" style={{ borderColor: "#e5eaf0" }}>
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2" style={{ color: "#0F2744" }}>
            NDA Signed Successfully
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Thank you, {nda?.partyAName}. Your signature has been recorded.
            The Consult For Africa team will countersign and you will receive
            a copy of the fully executed agreement via email.
          </p>
          <div className="p-3 rounded-lg bg-green-50 text-xs text-green-700">
            Signature recorded at {new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
          </div>
        </div>
      </div>
    );
  }

  if (!nda) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "#0F2744" }} className="py-6 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-bold">
            <span style={{ color: "#D4AF37" }}>CONSULT </span>
            <span className="text-white">FOR </span>
            <span className="text-white font-bold">AFRICA</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Healthcare Transformation & Management</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-8 px-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#0F2744" }}>
          {TYPE_LABELS[nda.type]}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Version {nda.version} · Please review and sign below
        </p>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: "#D4A574" }}>
              {nda.type === "CONSULTANT_MASTER" ? "Consultant" : "Party A"}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{nda.partyAName}</p>
            <p className="text-xs text-gray-500">{nda.partyAOrg}</p>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: "#D4A574" }}>
              {nda.type === "CONSULTANT_MASTER" ? "Company" : "Party B"}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{nda.partyBName}</p>
            <p className="text-xs text-gray-500">{nda.partyBOrg}</p>
          </div>
        </div>

        {/* NDA Summary */}
        <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#0F2744" }}>Agreement Summary</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              This agreement protects confidential information shared between the parties during
              the consulting engagement. Key terms include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>All confidential information must be held in strict confidence</li>
              <li>Information may only be used for the permitted purpose of the engagement</li>
              <li>Confidentiality obligations continue for 3 years after the engagement ends</li>
              <li>12-month non-solicitation period applies</li>
              <li>Governed by the laws of the Federal Republic of Nigeria</li>
            </ul>
            <p className="text-xs text-gray-400">
              This is a summary. The full agreement will be generated as a PDF upon signing.
              You can download the full text before signing using the link below.
            </p>
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>Your Signature</h2>

          <div className="mb-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I, <strong>{nda.partyAName}</strong>, have read and agree to the terms of this{" "}
                {TYPE_LABELS[nda.type]}. I understand that this electronic signature
                is legally binding under the laws of the Federal Republic of Nigeria.
              </span>
            </label>
          </div>

          {agreed && (
            <>
              <SignaturePad onSignature={setSignature} />

              {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mt-4">{error}</div>}

              <button
                onClick={handleSign}
                disabled={signing || !signature}
                className="mt-4 w-full px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {signing ? "Signing..." : "Sign Agreement"}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          Consult For Africa · Engagement Platform · This document is confidential
        </p>
      </div>
    </div>
  );
}
