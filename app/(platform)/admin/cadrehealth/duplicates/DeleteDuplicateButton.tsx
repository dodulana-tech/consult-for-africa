"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export function DeleteDuplicateButton({
  professionalId,
  name,
  email,
  unsafe,
}: {
  professionalId: string;
  name: string;
  email: string;
  unsafe: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirming" | "deleting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [requiresForce, setRequiresForce] = useState(false);

  async function doDelete(force: boolean) {
    setStage("deleting");
    setError(null);
    try {
      const res = await fetch(`/api/admin/cadrehealth/${professionalId}/delete-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(force ? { force: true } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else if (data.requiresForce) {
        setRequiresForce(true);
        setError(data.error);
        setStage("error");
      } else {
        setError(data.error || "Failed to delete");
        setStage("error");
      }
    } catch {
      setError("Network error");
      setStage("error");
    }
  }

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("confirming")}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-red-50"
        style={{ borderColor: "#FECACA", color: "#B91C1C" }}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    );
  }

  if (stage === "confirming") {
    return (
      <div className="flex flex-col items-end gap-2">
        {unsafe && (
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Claimed or has a CV
          </p>
        )}
        <p className="text-[11px] text-gray-500">Delete {name} ({email})?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStage("idle")}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => doDelete(unsafe)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ background: unsafe ? "#B91C1C" : "#0B3C5D" }}
          >
            {unsafe ? "Force delete" : "Confirm delete"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "deleting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Deleting...
      </span>
    );
  }

  // error
  return (
    <div className="flex flex-col items-end gap-1">
      <p className="text-[11px] text-red-600">{error}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setStage("idle");
            setError(null);
            setRequiresForce(false);
          }}
          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
        >
          Dismiss
        </button>
        {requiresForce && (
          <button
            type="button"
            onClick={() => doDelete(true)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ background: "#B91C1C" }}
          >
            Force delete
          </button>
        )}
      </div>
    </div>
  );
}
