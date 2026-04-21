"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface ExpansionRequest {
  id: string;
  clientName: string;
  clientId: string;
  contactId: string;
  serviceType: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "PROPOSAL_SENT", "WON", "LOST"];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#DBEAFE", color: "#1E40AF" },
  CONTACTED: { bg: "#FEF3C7", color: "#92400E" },
  PROPOSAL_SENT: { bg: "#E0E7FF", color: "#4338CA" },
  WON: { bg: "#D1FAE5", color: "#065F46" },
  LOST: { bg: "#FEE2E2", color: "#991B1B" },
};

const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  low: { bg: "#F3F4F6", color: "#6B7280" },
  normal: { bg: "#DBEAFE", color: "#1E40AF" },
  high: { bg: "#FEF3C7", color: "#92400E" },
  critical: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function ExpansionRequestsClient({
  requests,
}: {
  requests: ExpansionRequest[];
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdating(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/expansion-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        throw new Error(msg || "Failed to update status");
      }

      setSuccess(`Request updated to ${newStatus}`);
      router.refresh();
    } catch (err) {
      console.error("Expansion request update failed:", err);
      setError("Unable to update the request. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4"
          style={{ background: "#D1FAE5", color: "#065F46" }}
        >
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Client
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contact ID
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Service
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Urgency
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const urgStyle = URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.normal;
                const statStyle = STATUS_STYLE[r.status] ?? STATUS_STYLE.NEW;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: "#0F2744" }}>
                      {r.clientName}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                      {r.contactId.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.serviceType?.replace(/_/g, " ") ?? "-"}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                      {r.description}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium capitalize"
                        style={{ background: urgStyle.bg, color: urgStyle.color }}
                      >
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        disabled={updating === r.id}
                        className="px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                        style={{ background: statStyle.bg, color: statStyle.color }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No expansion requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
