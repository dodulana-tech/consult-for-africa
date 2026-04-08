"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function DealProofUpload({
  dealId,
  currentProofUrl,
}: {
  dealId: string;
  currentProofUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<"idle" | "uploading" | "saving" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [proofUrl, setProofUrl] = useState(currentProofUrl);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      const maxBytes = 20 * 1024 * 1024;
      if (file.size > maxBytes) {
        setError("File is too large. Maximum size is 20MB.");
        setState("error");
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("File type not accepted. Upload a PDF, DOC, DOCX, JPG, PNG, or WebP file.");
        setState("error");
        return;
      }

      setState("uploading");
      setProgress(0);
      setError("");

      try {
        // Step 1: Get presigned URL
        const res = await fetch("/api/agent-portal/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder: "documents",
            fileSize: file.size,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Upload failed (${res.status})`);
        }

        const { uploadUrl, publicUrl } = await res.json();

        // Step 2: Upload directly to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload to storage failed (${xhr.status})`));
          });

          xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // Step 3: Save the URL to the deal
        setState("saving");
        const patchRes = await fetch(`/api/agent-portal/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proofDocUrl: publicUrl }),
        });

        if (!patchRes.ok) throw new Error("Failed to save document URL to deal");

        setProofUrl(publicUrl);
        setState("success");
        router.refresh();
      } catch (err) {
        console.error("Proof upload failed:", err);
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        setState("error");
      }
    },
    [dealId, router],
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <h2 className="mb-1 text-base font-bold" style={{ color: "#0F2744" }}>
        Proof of Deal
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        Upload an invoice, receipt, screenshot, or contract as proof.
      </p>

      {/* Show existing proof */}
      {proofUrl && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-emerald-500">
            <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Document uploaded</p>
          </div>
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ background: "#0F2744", color: "#FFFFFF" }}
          >
            View
          </a>
        </div>
      )}

      {/* Upload progress */}
      {(state === "uploading" || state === "saving") && (
        <div
          className="rounded-xl px-4 py-4"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-center gap-3 mb-2.5">
            <svg className="h-4 w-4 animate-spin text-[#0F2744]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-gray-600">
              {state === "saving" ? "Saving..." : `Uploading... ${progress}%`}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${state === "saving" ? 100 : progress}%`, background: "#0F2744" }}
            />
          </div>
        </div>
      )}

      {/* Drop zone (idle, success, error) */}
      {state !== "uploading" && state !== "saving" && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          className="rounded-xl px-4 py-6 text-center cursor-pointer transition-colors"
          style={{
            background: isDragging ? "#EFF6FF" : "#F9FAFB",
            border: isDragging ? "2px dashed #0F2744" : "2px dashed #d1d5db",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: isDragging ? "#DBEAFE" : "#F3F4F6" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={isDragging ? "text-[#0F2744]" : "text-gray-400"}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold" style={{ color: "#0F2744" }}>
                  {proofUrl ? "Upload a new file" : "Click to browse"}
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                PDF, DOC, DOCX, JPG, PNG (max 20MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {state === "success" && !proofUrl && (
        <p className="mt-2 text-xs text-emerald-600 font-medium">Uploaded successfully.</p>
      )}

      {/* Error */}
      {state === "error" && error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
