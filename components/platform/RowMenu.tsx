"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

/**
 * The three-dot menu Abigail asked for: "I need to be able to make edits or
 * delete it. You can put something like this at the top right corner."
 *
 * Deliberately not a status dropdown. Debo's standing rule is that admin review
 * UIs get explicit action buttons rather than a select, because a dropdown
 * hides what is possible and makes a destructive option a scroll away from a
 * harmless one.
 *
 * Delete confirms in place rather than through window.confirm, so the thing
 * being deleted stays on screen while you decide.
 */
export default function RowMenu({
  onEdit,
  onDelete,
  deleteLabel = "Delete",
  confirmLabel = "Delete for good",
  disabled,
}: {
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  confirmLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setConfirming(false); }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!onEdit && !onDelete) return null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label="More actions"
        disabled={disabled}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); setConfirming(false); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
        style={{ color: "#94A3B8" }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl bg-white py-1 shadow-lg"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50"
              style={{ color: "#334155" }}
            >
              <Pencil size={14} style={{ color: "#94A3B8" }} /> Edit
            </button>
          )}
          {onDelete && !confirming && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-red-50"
              style={{ color: "#B91C1C" }}
            >
              <Trash2 size={14} /> {deleteLabel}
            </button>
          )}
          {onDelete && confirming && (
            <div className="px-3 py-2">
              <p className="text-xs mb-2" style={{ color: "#64748B" }}>This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    setBusy(true);
                    try { await onDelete(); } finally { setBusy(false); setOpen(false); setConfirming(false); }
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "#DC2626" }}
                >
                  {busy ? "Deleting" : confirmLabel}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border"
                  style={{ borderColor: "#e5eaf0", color: "#64748B" }}
                >
                  Keep
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
