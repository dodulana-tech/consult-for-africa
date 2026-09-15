"use client";

import { useRef, useState } from "react";
import { UPLOAD_SECTIONS } from "@/lib/osteon-audit";

type Row = {
  id: string;
  file: File;
  status: "waiting" | "uploading" | "done" | "failed";
  message?: string;
};

const NAVY = "#0B3C5D";
const TEAL = "#1F7A8C";
const LINE = "#E2E8F0";

const prettySize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function DocumentUploader() {
  const [section, setSection] = useState("priority");
  const [who, setWho] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (files: FileList | null) => {
    if (!files?.length) return;
    setRows((prev) => [
      ...prev,
      ...Array.from(files).map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: "waiting" as const,
      })),
    ]);
  };

  const patch = (id: string, next: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  async function sendOne(row: Row) {
    patch(row.id, { status: "uploading", message: undefined });
    try {
      const presign = await fetch("/api/osteon-audit/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: row.file.name,
          contentType: row.file.type || undefined,
          fileSize: row.file.size,
          section,
        }),
      });
      const meta = await presign.json();
      if (!presign.ok) throw new Error(meta.error || "Could not start the upload");

      // Straight to storage, so a large export never passes through the app.
      const put = await fetch(meta.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": meta.contentType },
        body: row.file,
      });
      if (!put.ok) throw new Error("The file did not finish uploading");

      const record = await fetch("/api/osteon-audit/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey: meta.storageKey,
          filename: row.file.name,
          contentType: meta.contentType,
          fileSize: row.file.size,
          section,
          uploadedBy: who.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      if (!record.ok) throw new Error("Uploaded, but we could not log it. Please tell us.");

      patch(row.id, { status: "done" });
    } catch (err) {
      patch(row.id, { status: "failed", message: (err as Error).message });
    }
  }

  async function sendAll() {
    setBusy(true);
    // One at a time: a clinic on a Lagos connection does better with a queue
    // than with six parallel uploads competing for the same uplink.
    for (const row of rows.filter((r) => r.status === "waiting" || r.status === "failed")) {
      await sendOne(row);
    }
    setBusy(false);
  }

  const pending = rows.filter((r) => r.status === "waiting" || r.status === "failed").length;
  const done = rows.filter((r) => r.status === "done").length;
  const current = UPLOAD_SECTIONS.find((s) => s.key === section);

  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 20 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
        What is this document?
      </label>
      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        style={{ width: "100%", font: "inherit", padding: "11px 12px", border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff" }}
      >
        {UPLOAD_SECTIONS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.key === "priority" || s.key === "other" ? s.title : `${s.key}. ${s.title}`}
          </option>
        ))}
      </select>
      {current && (
        <p style={{ fontSize: 13, color: "#64748b", margin: "7px 2px 16px" }}>{current.hint}</p>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? TEAL : "#CBD5E1"}`,
          background: dragging ? "#F1F5F9" : "#FAFCFD",
          borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Choose files, or drag them here</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
          PDF, Word, Excel, CSV, photographs and zip. Up to 25MB each. Photographs of a paper
          register are perfectly fine.
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => { add(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }}
        />
      </div>

      {rows.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0" }}>
          {rows.map((r) => (
            <li key={r.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderTop: `1px solid #F1F5F9`, fontSize: 14 }}>
              <span style={{ flex: 1, color: "#1F2937", wordBreak: "break-word" }}>{r.file.name}</span>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{prettySize(r.file.size)}</span>
              <span
                style={{
                  fontSize: 12, fontWeight: 700, minWidth: 74, textAlign: "right",
                  color: r.status === "done" ? "#15803d" : r.status === "failed" ? "#b3261e" : TEAL,
                }}
              >
                {r.status === "done" ? "received" : r.status === "uploading" ? "sending" : r.status === "failed" ? "failed" : "ready"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.some((r) => r.status === "failed") && (
        <p style={{ fontSize: 13, color: "#b3261e", margin: "8px 2px 0" }}>
          {rows.find((r) => r.status === "failed")?.message} Press send again to retry just the ones that failed.
        </p>
      )}

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 5 }}>Your name</label>
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="So we know who to thank"
            style={{ width: "100%", font: "inherit", padding: "10px 12px", border: `1px solid ${LINE}`, borderRadius: 10 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 5 }}>Anything we should know</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional. For example: only from March onwards"
            style={{ width: "100%", font: "inherit", padding: "10px 12px", border: `1px solid ${LINE}`, borderRadius: 10 }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={sendAll}
        disabled={busy || pending === 0}
        style={{
          width: "100%", marginTop: 14, padding: 15, border: 0, borderRadius: 11,
          background: pending === 0 ? "#94a3b8" : NAVY, color: "#fff",
          fontSize: 16, fontWeight: 700, cursor: pending === 0 || busy ? "default" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Sending..." : pending === 0 ? (done ? `${done} sent. Add more any time` : "Choose a file first") : `Send ${pending} file${pending === 1 ? "" : "s"}`}
      </button>

      {done > 0 && !busy && (
        <p style={{ fontSize: 13, color: "#15803d", margin: "10px 2px 0", fontWeight: 600 }}>
          Received, thank you. You can change the section above and send more, and you can come
          back to this page as often as you like.
        </p>
      )}

      <p style={{ fontSize: 12, color: "#94a3b8", margin: "12px 2px 0", lineHeight: 1.6 }}>
        Files go straight to Consult for Africa&rsquo;s private storage, not to a public link, and
        they are used only for this audit. Nothing you upload here is shared with any hospital or
        any third party. Anything over 25MB, or anything you would rather not put through a
        browser, can go to <span style={{ color: TEAL }}>hello@consultforafrica.com</span> instead.
      </p>
    </div>
  );
}
