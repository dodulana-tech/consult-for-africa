"use client";

import { useEffect, useState } from "react";
import { FileStack, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  category: string | null;
  subject: string | null;
  body: string;
  variables: string[];
  usageCount: number;
}

export default function TemplatePicker({
  onPick,
  type = "EMAIL",
}: {
  onPick: (template: { subject: string | null; body: string }) => void;
  type?: string;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || templates.length > 0) return;
    setLoading(true);
    fetch(`/api/communications/templates?type=${type}&activeOnly=true`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, type, templates.length]);

  function handlePick(t: Template) {
    onPick({ subject: t.subject, body: t.body });
    setOpen(false);
    // Increment usage count async
    fetch(`/api/communications/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{ background: "#F3F4F6", color: "#374151" }}
      >
        <FileStack size={11} />
        Use Template
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-1 w-80 rounded-lg bg-white shadow-lg z-50 max-h-96 overflow-y-auto"
            style={{ border: "1px solid #e5eaf0" }}
          >
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 size={11} className="animate-spin" /> Loading...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-2">No active templates yet.</p>
                <Link
                  href="/communications/templates"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#0F2744" }}
                  onClick={() => setOpen(false)}
                >
                  Create one →
                </Link>
              </div>
            ) : (
              <>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handlePick(t)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{t.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      {t.category && <span>{t.category.replace(/_/g, " ")}</span>}
                      <span>· used {t.usageCount}×</span>
                    </div>
                    {t.subject && (
                      <p className="text-[11px] text-gray-500 mt-1 truncate">{t.subject}</p>
                    )}
                  </button>
                ))}
                <Link
                  href="/communications/templates"
                  className="block px-3 py-2 text-center text-xs font-medium hover:bg-gray-50"
                  style={{ color: "#0F2744" }}
                  onClick={() => setOpen(false)}
                >
                  Manage templates →
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
