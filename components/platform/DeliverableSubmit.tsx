"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Send,
  CheckCircle,
  Loader2,
  FileText,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { timeAgo } from "@/lib/utils";
import FileUpload from "@/components/shared/FileUpload";

interface Deliverable {
  id: string;
  name: string;
  description: string;
  status: string;
  version: number;
  submittedAt: string | null;
  reviewScore: number | null;
  reviewNotes: string | null;
  fileUrl: string | null;
  project: { id: string; name: string };
  assignment: { consultant: { id: string; name: string } } | null;
}

export default function DeliverableSubmit({
  deliverable,
  userId,
}: {
  deliverable: Deliverable;
  userId: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(deliverable.description);
  const [fileUrl, setFileUrl] = useState(deliverable.fileUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isResubmission = deliverable.status === "NEEDS_REVISION";
  const alreadySubmitted = deliverable.status === "SUBMITTED" || deliverable.status === "IN_REVIEW";
  const isApproved = deliverable.status === "APPROVED" || deliverable.status === "DELIVERED_TO_CLIENT";
  const canSubmit = deliverable.status === "DRAFT" || deliverable.status === "NEEDS_REVISION";

  async function handleSubmit() {
    if (!description.trim()) {
      setError("Please describe what you've delivered.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          fileUrl: fileUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setTimeout(() => router.push(`/projects/${deliverable.project.id}`), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/projects/${deliverable.project.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to {deliverable.project.name}
        </Link>

        {/* Success */}
        {submitted && (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
          >
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Submitted for review</p>
            <p className="text-sm text-gray-500 mt-1">Your EM has been notified. Redirecting...</p>
          </div>
        )}

        {/* Deliverable info */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge status={deliverable.status} />
                {deliverable.version > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    v{deliverable.version}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-gray-900">{deliverable.name}</h2>
            </div>
          </div>

          {/* Revision feedback */}
          {isResubmission && deliverable.reviewNotes && (
            <div
              className="mb-4 p-4 rounded-lg"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">EM Feedback (revision requested)</p>
                  <p className="text-sm text-amber-800">{deliverable.reviewNotes}</p>
                </div>
              </div>
            </div>
          )}

          {alreadySubmitted && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg text-sm text-blue-700"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                This deliverable was submitted {deliverable.submittedAt ? timeAgo(new Date(deliverable.submittedAt)) : ""} and is currently under review.
              </div>
              {deliverable.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Description / Summary</p>
                  <div
                    className="rounded-lg px-3 py-2.5 text-sm text-gray-700 whitespace-pre-wrap"
                    style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
                  >
                    {deliverable.description}
                  </div>
                </div>
              )}
              {deliverable.fileUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Submitted File</p>
                  <a
                    href={deliverable.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors hover:opacity-80"
                    style={{ background: "#F0F4FF", color: "#0F2744", border: "1px solid #e5eaf0" }}
                  >
                    <Upload size={13} />
                    View submitted file
                  </a>
                </div>
              )}
            </div>
          )}

          {isApproved && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg text-sm text-emerald-700"
                style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
              >
                <CheckCircle size={14} className="inline mr-1.5" />
                This deliverable has been approved.
                {deliverable.reviewScore && ` Score: ${deliverable.reviewScore}/10.`}
              </div>
              {deliverable.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Description / Summary</p>
                  <div
                    className="rounded-lg px-3 py-2.5 text-sm text-gray-700 whitespace-pre-wrap"
                    style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
                  >
                    {deliverable.description}
                  </div>
                </div>
              )}
              {deliverable.fileUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Submitted File</p>
                  <a
                    href={deliverable.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors hover:opacity-80"
                    style={{ background: "#F0F4FF", color: "#0F2744", border: "1px solid #e5eaf0" }}
                  >
                    <Upload size={13} />
                    View submitted file
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit form */}
        {canSubmit && !submitted && (
          <>
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <h3 className="text-sm font-semibold text-gray-900">
                {isResubmission ? "Submit Revised Version" : "Submit Deliverable"}
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Description / Summary
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you've delivered, key findings, and any context the EM needs to review it..."
                  rows={5}
                  className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>

              <FileUpload
                folder="deliverables"
                label="Upload a file"
                onUpload={({ url }) => setFileUrl(url)}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full" style={{ borderTop: "1px solid #e5eaf0" }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] text-gray-400">Or paste a link</span>
                </div>
              </div>

              <div>
                <div className="relative">
                  <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Paste a shareable link to your file (Google Drive, Dropbox, OneDrive).
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isResubmission ? (
                <RotateCcw size={15} />
              ) : (
                <Send size={15} />
              )}
              {submitting
                ? "Submitting..."
                : isResubmission
                ? "Resubmit for Review"
                : "Submit for Review"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
