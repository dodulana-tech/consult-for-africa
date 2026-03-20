"use client";

import { useState } from "react";

const TIERS = ["INTERN", "EMERGING", "STANDARD", "EXPERIENCED", "ELITE"];

export default function TierChanger({ profileId, currentTier }: { profileId: string; currentTier: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function changeTier(newTier: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/consultants/${profileId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-blue-600 hover:underline"
      >
        (change tier)
      </button>
      {open && (
        <div className="absolute z-20 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg min-w-[140px]" style={{ borderColor: "#e5eaf0" }}>
          {TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => changeTier(tier)}
              disabled={saving || tier === currentTier}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors disabled:opacity-40 ${tier === currentTier ? "bg-blue-50 font-semibold" : ""}`}
            >
              {tier}
            </button>
          ))}
          <button onClick={() => setOpen(false)} className="w-full text-left px-3 py-1.5 text-[10px] text-gray-400 border-t" style={{ borderColor: "#F3F4F6" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
