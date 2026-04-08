"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Deliverable, Assignment } from "./types";

export function DeliverableFeeEditor({ deliverable, projectServiceType, budgetSensitivity, consultantTierMin, consultantTierMax }: { deliverable: Deliverable; projectServiceType?: string; budgetSensitivity?: string | null; consultantTierMin?: string | null; consultantTierMax?: string | null }) {
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(deliverable.fee?.toString() ?? "");
  const [currency, setCurrency] = useState(deliverable.feeCurrency ?? "NGN");
  const [saving, setSaving] = useState(false);
  const [savedFee, setSavedFee] = useState(deliverable.fee);
  const [savedCurrency, setSavedCurrency] = useState(deliverable.feeCurrency ?? "NGN");
  const [savedPaidAt, setSavedPaidAt] = useState(deliverable.feePaidAt);
  const [nuruPricing, setNuruPricing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ suggestedPriceNGN?: { mid: number }; suggestedPriceUSD?: { mid: number }; estimatedHours?: number; rationale?: string } | null>(null);

  async function askNuru() {
    setNuruPricing(true);
    try {
      const res = await fetch("/api/ai/price-deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableName: deliverable.name, description: deliverable.description, serviceType: projectServiceType, budgetSensitivity, consultantTierMin, consultantTierMax }),
      });
      if (res.ok) {
        const { pricing } = await res.json();
        setSuggestion(pricing);
        // Auto-fill the suggested price
        if (currency === "NGN" && pricing.suggestedPriceNGN?.mid) {
          setFee(pricing.suggestedPriceNGN.mid.toString());
        } else if (currency === "USD" && pricing.suggestedPriceUSD?.mid) {
          setFee(pricing.suggestedPriceUSD.mid.toString());
        }
      }
    } catch {}
    finally { setNuruPricing(false); }
  }

  // Don't show if deliverable is already paid
  if (savedPaidAt) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
          Paid: {savedCurrency === "USD" ? "$" : "\u20A6"}{Number(savedFee).toLocaleString()}
        </span>
      </div>
    );
  }

  // Show fee if set but not editing
  if (savedFee && !editing) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="font-medium" style={{ color: "#0F2744" }}>
          Fee: {savedCurrency === "USD" ? "$" : "\u20A6"}{Number(savedFee).toLocaleString()}
        </span>
        <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline text-[10px]">(edit)</button>
      </div>
    );
  }

  async function saveFee() {
    setSaving(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: parseFloat(fee) || null, feeCurrency: currency }),
      });
      if (res.ok) {
        setSavedFee(parseFloat(fee) || null);
        setSavedCurrency(currency);
        setEditing(false);
      }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="mt-2">
      {!editing ? (
        <button onClick={() => setEditing(true)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
          + Set deliverable fee
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="text-[10px] border rounded px-1.5 py-1" style={{ borderColor: "#e5eaf0" }}>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="Amount"
            className="w-24 text-xs border rounded px-2 py-1"
            style={{ borderColor: "#e5eaf0" }}
          />
          <button onClick={saveFee} disabled={saving || !fee} className="text-[10px] px-2 py-1 rounded text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
            {saving ? "..." : "Save"}
          </button>
          <button onClick={askNuru} disabled={nuruPricing} className="text-[10px] px-2 py-1 rounded font-medium disabled:opacity-50 flex items-center gap-1" style={{ background: "#D4AF37" + "15", color: "#92400E" }}>
            <Sparkles size={9} />
            {nuruPricing ? "..." : "Nuru"}
          </button>
          <button onClick={() => { setEditing(false); setSuggestion(null); }} className="text-[10px] text-gray-400">Cancel</button>
          </div>
          {suggestion && (
            <div className="text-[10px] text-gray-500 bg-amber-50 rounded px-2 py-1.5">
              <span className="font-medium" style={{ color: "#92400E" }}>Nuru suggests: </span>
              {currency === "NGN" ? `\u20A6${suggestion.suggestedPriceNGN?.mid?.toLocaleString() ?? "N/A"}` : `$${suggestion.suggestedPriceUSD?.mid?.toLocaleString() ?? "N/A"}`}
              {suggestion.estimatedHours ? ` (${suggestion.estimatedHours}h est.)` : ""}
              {suggestion.rationale ? ` - ${suggestion.rationale}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AssignDeliverableDropdown({
  deliverableId,
  projectId,
  assignments,
  currentAssignmentId,
  onAssigned,
}: {
  deliverableId: string;
  projectId: string;
  assignments: Assignment[];
  currentAssignmentId: string | null;
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function assign(assignmentId: string | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      if (res.ok) {
        setOpen(false);
        onAssigned();
      }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-[10px] text-blue-600 hover:underline"
      >
        {currentAssignmentId ? "(reassign)" : "(assign)"}
      </button>
      {open && (
        <div className="absolute z-20 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg min-w-[180px]" style={{ borderColor: "#e5eaf0" }}>
          {assignments.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">No consultants assigned to this project</p>
          ) : (
            <>
              {assignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => assign(a.id)}
                  disabled={saving || a.id === currentAssignmentId}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors disabled:opacity-40 ${a.id === currentAssignmentId ? "bg-blue-50 font-medium" : ""}`}
                >
                  {a.consultant.name} <span className="text-gray-400">({a.role})</span>
                </button>
              ))}
              {currentAssignmentId && (
                <button
                  onClick={() => assign(null)}
                  disabled={saving}
                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 border-t transition-colors"
                  style={{ borderColor: "#F3F4F6" }}
                >
                  Unassign
                </button>
              )}
            </>
          )}
          <button onClick={() => setOpen(false)} className="w-full text-left px-3 py-1.5 text-[10px] text-gray-400 border-t" style={{ borderColor: "#F3F4F6" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
