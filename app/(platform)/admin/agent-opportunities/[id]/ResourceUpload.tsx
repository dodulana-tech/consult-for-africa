"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import FileUpload from "@/components/shared/FileUpload";

interface ResourceUploadProps {
  opportunityId: string;
  pitchDeckUrl: string | null;
  briefingDocUrl: string | null;
}

export default function ResourceUpload({ opportunityId, pitchDeckUrl, briefingDocUrl }: ResourceUploadProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function saveUrl(field: "pitchDeckUrl" | "briefingDocUrl", url: string | null) {
    await fetch(`/api/admin/agent-opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: url }),
    });
    router.refresh();
  }

  async function handleRemove(field: "pitchDeckUrl" | "briefingDocUrl") {
    setRemoving(field);
    try {
      await saveUrl(field, null);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Resources</h2>

      <div className="space-y-5">
        {/* Pitch Deck */}
        <div>
          {pitchDeckUrl ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pitch Deck</p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-3">
                <a
                  href={pitchDeckUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
                  style={{ color: "#0B3C5D" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Pitch Deck
                </a>
                <button
                  onClick={() => handleRemove("pitchDeckUrl")}
                  disabled={removing === "pitchDeckUrl"}
                  className="ml-auto rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <FileUpload
              folder="agent-opportunities/pitch-decks"
              label="Pitch Deck"
              accept=".pdf,.pptx,.ppt,.doc,.docx"
              maxSizeMB={50}
              isPublic={false}
              onUpload={(result) => saveUrl("pitchDeckUrl", result.url)}
            />
          )}
        </div>

        {/* Briefing Document */}
        <div>
          {briefingDocUrl ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Briefing Document</p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-3">
                <a
                  href={briefingDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
                  style={{ color: "#0B3C5D" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Briefing Document
                </a>
                <button
                  onClick={() => handleRemove("briefingDocUrl")}
                  disabled={removing === "briefingDocUrl"}
                  className="ml-auto rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <FileUpload
              folder="agent-opportunities/briefing-docs"
              label="Briefing Document"
              accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls"
              maxSizeMB={50}
              isPublic={false}
              onUpload={(result) => saveUrl("briefingDocUrl", result.url)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
