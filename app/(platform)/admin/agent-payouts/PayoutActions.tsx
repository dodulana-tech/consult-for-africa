"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Banknote, ArrowRight, CheckCircle } from "lucide-react";

type PayoutActionsProps =
  | {
      type: "create";
      commissionIds: string[];
      agentName: string;
      total: number;
      payoutId?: never;
      currentStatus?: never;
    }
  | {
      type: "update";
      payoutId: string;
      currentStatus: string;
      commissionIds?: never;
      agentName?: never;
      total?: never;
    };

export default function PayoutActions(props: PayoutActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [showRefInput, setShowRefInput] = useState(false);

  async function createPayout() {
    if (props.type !== "create") return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agent-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionIds: props.commissionIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Failed to create payout");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (props.type !== "update") return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === "PAID" && paymentRef) {
        payload.paymentRef = paymentRef;
        payload.paymentMethod = "BANK_TRANSFER";
      }

      const res = await fetch(`/api/admin/agent-payouts/${props.payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Failed to update payout");
        return;
      }
      setShowRefInput(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (props.type === "create") {
    return (
      <button
        onClick={createPayout}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Banknote className="h-3.5 w-3.5" />
        )}
        Create Payout
      </button>
    );
  }

  // Update mode
  const { currentStatus } = props;

  if (currentStatus === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (currentStatus === "PROCESSING" && showRefInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder="Payment reference"
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#0F2744]"
        />
        <button
          onClick={() => updateStatus("PAID")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Confirm Paid
        </button>
        <button
          onClick={() => setShowRefInput(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "PENDING" && (
        <button
          onClick={() => updateStatus("PROCESSING")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
          Start Processing
        </button>
      )}
      {currentStatus === "PROCESSING" && (
        <button
          onClick={() => setShowRefInput(true)}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <CheckCircle className="h-3 w-3" />
          Mark as Paid
        </button>
      )}
    </div>
  );
}
