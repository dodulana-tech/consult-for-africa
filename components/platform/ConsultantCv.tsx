"use client";

import { useState } from "react";
import { FileText, Download, Upload, Trash2, Loader2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import FileUpload from "@/components/shared/FileUpload";
import { parseApiError } from "@/lib/parse-api-error";

interface Props {
  consultantUserId: string;
  consultantName: string;
  initialCvFileUrl: string | null;
  initialCvUploadedAt: string | null;
  uploadedByName?: string | null;
  isOwn: boolean;          // viewing user is the consultant themselves
  isElevated: boolean;     // viewing user is EM+ (can upload on their behalf)
}

export default function ConsultantCv({
  consultantUserId,
  consultantName,
  initialCvFileUrl,
  initialCvUploadedAt,
  uploadedByName,
  isOwn,
  isElevated,
}: Props) {
  const [cvFileUrl, setCvFileUrl] = useState<string | null>(initialCvFileUrl);
  const [cvUploadedAt, setCvUploadedAt] = useState<string | null>(initialCvUploadedAt);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canManage = isOwn || isElevated;
  if (!canManage && !cvFileUrl) {
    return null; // hide entirely from non-elevated viewers when nothing to show
  }

  async function persistUrl(url: string) {
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/consultant-profile/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: consultantUserId, cvFileUrl: url }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to save CV."));
        return;
      }
      const data = await res.json();
      setCvFileUrl(data.cvFileUrl);
      setCvUploadedAt(data.cvUploadedAt);
    } catch {
      setError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this consultant's CV?")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/consultant-profile/cv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: consultantUserId }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to remove CV."));
        return;
      }
      setCvFileUrl(null);
      setCvUploadedAt(null);
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#EFF6FF" }}>
            <FileText size={14} className="text-blue-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>CV / Resume</h3>
            {cvFileUrl && cvUploadedAt && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Uploaded {new Date(cvUploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {uploadedByName && ` by ${uploadedByName}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600 mb-3" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}

      {cvFileUrl ? (
        <div className="rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle size={14} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-medium truncate" style={{ color: "#065F46" }}>CV on file</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={cvFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90"
              style={{ background: "#0F2744" }}
            >
              <ExternalLink size={11} /> View CV
            </a>
            <a
              href={cvFileUrl}
              download
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid #BBF7D0", color: "#065F46" }}
            >
              <Download size={11} /> Download
            </a>
            {canManage && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                style={{ background: "#FEE2E2", color: "#991B1B" }}
                title="Remove CV"
              >
                {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            )}
          </div>
        </div>
      ) : canManage ? (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            {isOwn
              ? "No CV uploaded yet. Add one so engagement managers can match you to mandates."
              : `${consultantName} has not uploaded a CV. You can upload one on their behalf below.`}
          </p>
          <FileUpload
            folder="cvs"
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
            isPublic={true}
            label={isOwn ? "Upload your CV" : "Upload CV on their behalf"}
            onUpload={(result) => persistUrl(result.url)}
          />
          {uploading && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Saving...
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No CV on file yet.</p>
      )}
    </div>
  );
}
