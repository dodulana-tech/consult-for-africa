"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UploadResult {
  key: string;
  url: string;
  filename: string;
}

interface FileUploadProps {
  folder: string;
  onUpload: (result: UploadResult) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  isPublic?: boolean;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function FileUpload({
  folder,
  onUpload,
  accept,
  maxSizeMB = 50,
  label = "Upload a file",
  isPublic = false,
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; key: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const acceptedExtensions = accept
    ? accept.split(",").map((a) => a.trim().toLowerCase())
    : null;

  function validateFile(file: File): string | null {
    if (file.size > maxBytes) {
      return `File is too large. Maximum size is ${maxSizeMB}MB.`;
    }
    if (acceptedExtensions) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!acceptedExtensions.includes(ext)) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }
    return null;
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setState("error");
        return;
      }

      setState("uploading");
      setProgress(0);
      setError("");

      try {
        // Step 1: Get presigned URL from our API
        const endpoint = isPublic ? "/api/upload/public" : "/api/upload";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            folder,
            fileSize: file.size,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Upload failed (${res.status})`);
        }

        const { uploadUrl, key, publicUrl } = await res.json();

        // Step 2: Upload directly to R2 via presigned URL with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload to storage failed (${xhr.status})`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.send(file);
        });

        // Step 3: Success
        setUploadedFile({ name: file.name, key });
        setState("success");
        onUpload({ key, url: publicUrl, filename: file.name });
      } catch (err) {
        console.error("File upload failed:", err);
        setError("Upload failed. Please check your connection and try again.");
        setState("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folder, isPublic, maxBytes, onUpload]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so re-selecting the same file triggers onChange
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function reset() {
    setState("idle");
    setProgress(0);
    setError("");
    setUploadedFile(null);
  }

  // Success state
  if (state === "success" && uploadedFile) {
    return (
      <div className="space-y-1.5">
        {label && (
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
        )}
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</p>
            <p className="text-[11px] text-emerald-600">Uploaded successfully</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded hover:bg-emerald-100 transition-colors"
            aria-label="Remove file"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  // Uploading state
  if (state === "uploading") {
    return (
      <div className="space-y-1.5">
        {label && (
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
        )}
        <div
          className="rounded-lg px-4 py-4"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-center gap-3 mb-2.5">
            <Loader2 size={16} className="text-[#0F2744] animate-spin shrink-0" />
            <span className="text-sm text-gray-600">Uploading... {progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "#0F2744" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Idle / Error state (drop zone)
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="rounded-lg px-4 py-6 text-center cursor-pointer transition-colors"
        style={{
          background: isDragging ? "#EFF6FF" : "#F9FAFB",
          border: isDragging ? "2px dashed #0F2744" : "2px dashed #d1d5db",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: isDragging ? "#DBEAFE" : "#F3F4F6" }}
          >
            {isDragging ? (
              <FileText size={18} className="text-[#0F2744]" />
            ) : (
              <Upload size={18} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold" style={{ color: "#0F2744" }}>
                Click to browse
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {accept ? `Accepted: ${accept}` : "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, images"} (max{" "}
              {maxSizeMB}MB)
            </p>
          </div>
        </div>
      </div>

      {state === "error" && error && (
        <div className="flex items-start gap-2 text-xs text-red-600 mt-1.5">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
