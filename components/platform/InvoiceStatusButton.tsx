"use client";

import { useState } from "react";
import { Send, CheckCircle, Ban, Clock, Eye, AlertTriangle } from "lucide-react";

type Action = {
  label: string;
  status: string;
  color: string;
  icon: typeof Send;
  confirm?: string; // confirmation message
  requiresNote?: boolean;
  api?: string; // custom API endpoint instead of PATCH status
};

const ACTIONS: Record<string, Action[]> = {
  DRAFT: [
    {
      label: "Send Invoice",
      status: "SENT",
      color: "#3B82F6",
      icon: Send,
      confirm: "This will email the invoice to the client. Continue?",
      api: "send", // POST /api/invoices/[id]/send
    },
    {
      label: "Cancel",
      status: "CANCELLED",
      color: "#9CA3AF",
      icon: Ban,
      confirm: "Cancel this draft invoice?",
    },
  ],
  PENDING_APPROVAL: [
    {
      label: "Approve & Send",
      status: "SENT",
      color: "#3B82F6",
      icon: Send,
      confirm: "Approve and send this invoice to the client?",
    },
  ],
  SENT: [
    {
      label: "Mark Paid",
      status: "PAID",
      color: "#10B981",
      icon: CheckCircle,
      confirm: "Confirm full payment received?",
    },
  ],
  VIEWED: [
    {
      label: "Mark Paid",
      status: "PAID",
      color: "#10B981",
      icon: CheckCircle,
      confirm: "Confirm full payment received?",
    },
  ],
  PARTIALLY_PAID: [
    {
      label: "Mark Fully Paid",
      status: "PAID",
      color: "#10B981",
      icon: CheckCircle,
      confirm: "Confirm remaining balance has been paid?",
    },
  ],
  OVERDUE: [
    {
      label: "Mark Paid",
      status: "PAID",
      color: "#10B981",
      icon: CheckCircle,
      confirm: "Confirm payment received for this overdue invoice?",
    },
    {
      label: "Send Reminder",
      status: "",
      color: "#F59E0B",
      icon: AlertTriangle,
      api: "remind",
    },
  ],
};

export default function InvoiceStatusButton({
  invoiceId,
  currentStatus,
  onStatusChange,
}: {
  invoiceId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState<Action | null>(null);

  const actions = ACTIONS[status];
  if (!actions || actions.length === 0) return null;

  async function execute(action: Action) {
    setShowConfirm(null);
    setLoading(action.label);
    setError("");

    try {
      let res: Response;

      if (action.api === "send") {
        res = await fetch(`/api/invoices/${invoiceId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } else if (action.api === "remind") {
        // Trigger a manual reminder
        res = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_reminder" }),
        });
        if (res.ok) {
          setLoading(null);
          return;
        }
      } else {
        res = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action.status }),
        });
      }

      if (res.ok) {
        const newStatus = action.status || status;
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Action failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() =>
              action.confirm ? setShowConfirm(action) : execute(action)
            }
            disabled={loading !== null}
            className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium disabled:opacity-50 hover:opacity-80 transition-opacity"
            style={{
              background: `${action.color}15`,
              color: action.color,
              border: `1px solid ${action.color}33`,
            }}
          >
            <Icon size={10} />
            {loading === action.label ? "..." : action.label}
          </button>
        );
      })}

      {error && (
        <span className="text-[10px] text-red-500 ml-1">{error}</span>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg p-3 min-w-[220px]"
          style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-xs text-gray-700 mb-3">{showConfirm.confirm}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(null)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
              style={{ border: "1px solid #e5eaf0" }}
            >
              Cancel
            </button>
            <button
              onClick={() => execute(showConfirm)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg text-white font-medium"
              style={{ background: showConfirm.color }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
