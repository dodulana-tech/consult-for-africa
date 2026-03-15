"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Clock, Plus, X } from "lucide-react";

interface Version {
  id: string;
  version: number;
  fileUrl: string;
  fileName: string;
  changes: string | null;
  uploadedById: string;
  createdAt: string;
}

export default function VersionHistory({
  deliverableId,
  currentVersion,
  canUpload,
}: {
  deliverableId: string;
  currentVersion: number;
  canUpload: boolean;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changes, setChanges] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/deliverables/${deliverableId}/versions`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setVersions(data);
      })
      .finally(() => setLoading(false));
  }, [deliverableId]);

  async function uploadVersion() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      // 1. Upload file
      const fd = new FormData();
      fd.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Upload failed");
        return;
      }
      const { url } = await uploadRes.json();

      // 2. Create version
      const res = await fetch(`/api/deliverables/${deliverableId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url, fileName: selectedFile.name, changes }),
      });
      if (!res.ok) {
        setError("Failed to save version");
        return;
      }
      const { version } = await res.json();
      setVersions((prev) => [version, ...prev]);
      setShowForm(false);
      setSelectedFile(null);
      setChanges("");
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
        {canUpload && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
            style={{
              background: showForm ? "#F3F4F6" : "#0F2744",
              color: showForm ? "#374151" : "#fff",
            }}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Cancel" : "Upload New Version"}
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          {/* Styled file picker */}
          <label
            className="flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors hover:border-blue-400"
            style={{
              border: "1.5px dashed #d1d5db",
              background: selectedFile ? "#EFF6FF" : "#fff",
            }}
          >
            <Upload size={15} className={selectedFile ? "text-blue-500" : "text-gray-400"} />
            <span className={`text-xs ${selectedFile ? "text-blue-700 font-medium" : "text-gray-500"}`}>
              {selectedFile ? selectedFile.name : "Choose file to upload"}
            </span>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              className="hidden"
            />
          </label>

          <textarea
            value={changes}
            onChange={(e) => setChanges(e.target.value)}
            placeholder="What changed in this version?"
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={uploadVersion}
            disabled={!selectedFile || uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            {uploading ? (
              <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Uploading...</>
            ) : (
              <><Upload size={12} /> Upload v{currentVersion + 1}</>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-gray-400">
          No version history. The original submission is version 1.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "#EFF6FF", color: "#3B82F6" }}
              >
                v{v.version}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline truncate"
                  >
                    <FileText size={11} className="inline mr-1" />
                    {v.fileName}
                  </a>
                  <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock size={9} />
                    {new Date(v.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {v.changes && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{v.changes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
