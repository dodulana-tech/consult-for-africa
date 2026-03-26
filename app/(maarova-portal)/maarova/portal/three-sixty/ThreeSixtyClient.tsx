"use client";

import { useState } from "react";

interface RaterInvite {
  id: string;
  raterEmail: string;
  raterName: string;
  role: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

interface ThreeSixtyRequest {
  id: string;
  status: string;
  minRaters: number;
  deadline: string;
  createdAt: string;
  invites: RaterInvite[];
}

interface Props {
  request: ThreeSixtyRequest | null;
  userName: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPERVISOR: "Supervisor",
  PEER: "Peer",
  DIRECT_REPORT: "Direct Report",
  SELF: "Self",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  INVITED: { bg: "bg-blue-50", text: "text-blue-700", label: "Invited" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  EXPIRED: { bg: "bg-red-50", text: "text-red-700", label: "Expired" },
  DECLINED: { bg: "bg-gray-100", text: "text-gray-600", label: "Declined" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ThreeSixtyClient({ request, userName }: Props) {
  const [localRequest, setLocalRequest] = useState<ThreeSixtyRequest | null>(
    request
  );
  const [starting, setStarting] = useState(false);
  const [showAddRater, setShowAddRater] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [newRaters, setNewRaters] = useState([
    { raterName: "", raterEmail: "", role: "PEER" },
  ]);

  async function handleStartProcess() {
    setStarting(true);
    try {
      const res = await fetch("/api/maarova/three-sixty/request", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create request");
      const data = await res.json();
      setLocalRequest({
        id: data.id,
        status: data.status,
        minRaters: data.minRaters,
        deadline: data.deadline,
        createdAt: data.createdAt,
        invites: [],
      });
    } catch {
      alert("Failed to start 360 process. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function addRaterRow() {
    setNewRaters((prev) => [...prev, { raterName: "", raterEmail: "", role: "PEER" }]);
  }

  function removeRaterRow(index: number) {
    setNewRaters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRater(index: number, field: string, value: string) {
    setNewRaters((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  async function handleInviteRaters(e: React.FormEvent) {
    e.preventDefault();
    const valid = newRaters.filter(
      (r) => r.raterName.trim() && r.raterEmail.trim()
    );
    if (valid.length === 0) return;

    setInviting(true);
    try {
      const res = await fetch("/api/maarova/three-sixty/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: localRequest!.id,
          raters: valid,
        }),
      });
      if (!res.ok) throw new Error("Failed to send invitations");
      const data = await res.json();
      setLocalRequest((prev) =>
        prev
          ? {
              ...prev,
              invites: [...prev.invites, ...data.invites],
            }
          : prev
      );
      setNewRaters([{ raterName: "", raterEmail: "", role: "PEER" }]);
      setShowAddRater(false);
    } catch {
      alert("Failed to send invitations. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  const completedCount =
    localRequest?.invites.filter((i) => i.status === "COMPLETED").length ?? 0;
  const totalInvites = localRequest?.invites.length ?? 0;
  const minReached = completedCount >= (localRequest?.minRaters ?? 5);
  const isCollecting = localRequest?.status === "COLLECTING";
  const isComplete = localRequest?.status === "COMPLETE";

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
          360 Feedback
        </h1>
        <p className="text-gray-500 mt-1">
          Collect multi-rater feedback on your leadership, {userName.split(" ")[0]}.
        </p>
      </div>

      {/* No request state */}
      {!localRequest && (
        <section
          className="bg-white rounded-xl border shadow-sm"
          style={{ borderColor: "#e5eaf0" }}
        >
          <div className="p-10 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#0F2744" + "10" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "#0F2744" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "#0F2744" }}
            >
              Start Your 360 Feedback Process
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-6 leading-relaxed">
              360 feedback gathers perspectives from your supervisor, peers, and direct
              reports to give you a well-rounded view of your leadership strengths
              and growth areas. The process is confidential and responses are
              aggregated to protect individual raters.
            </p>
            <button
              onClick={handleStartProcess}
              disabled={starting}
              className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#0F2744" }}
            >
              {starting ? "Starting..." : "Start 360 Process"}
            </button>
          </div>
        </section>
      )}

      {/* Active request */}
      {localRequest && (
        <>
          {/* Request status */}
          <section
            className="bg-white rounded-xl border shadow-sm"
            style={{ borderColor: "#e5eaf0" }}
          >
            <div
              className="px-6 py-5 border-b flex items-center justify-between flex-wrap gap-3"
              style={{ borderColor: "#e5eaf0" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
                Request Status
              </h2>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  isComplete
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {isComplete ? "Complete" : "Collecting responses"}
              </span>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                    {completedCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                    {totalInvites}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Invited</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                    {localRequest.minRaters}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Minimum required</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    {formatDate(localRequest.deadline)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Deadline</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>
                    {completedCount} of {localRequest.minRaters} minimum raters
                  </span>
                  <span>
                    {minReached ? "Minimum reached" : `${localRequest.minRaters - completedCount} more needed`}
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (completedCount / localRequest.minRaters) * 100)}%`,
                      backgroundColor: minReached ? "#16a34a" : "#D4A574",
                    }}
                  />
                </div>
              </div>

              {/* Complete link */}
              {isComplete && (
                <div
                  className="mt-5 p-4 rounded-lg border text-center"
                  style={{
                    backgroundColor: "#D4A574" + "08",
                    borderColor: "#D4A574" + "30",
                  }}
                >
                  <p className="text-sm text-gray-700 mb-2">
                    Your 360 feedback is complete and integrated into your results.
                  </p>
                  <a
                    href="/maarova/portal/results"
                    className="inline-block text-sm font-medium px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: "#0F2744" }}
                  >
                    View Results
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Rater Management */}
          <section
            className="bg-white rounded-xl border shadow-sm"
            style={{ borderColor: "#e5eaf0" }}
          >
            <div
              className="px-6 py-5 border-b flex items-center justify-between flex-wrap gap-3"
              style={{ borderColor: "#e5eaf0" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
                Raters
              </h2>
              {isCollecting && (
                <button
                  onClick={() => setShowAddRater(!showAddRater)}
                  className="text-sm px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: "#0F2744" }}
                >
                  Add Raters
                </button>
              )}
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Add rater form */}
              {showAddRater && (
                <form
                  onSubmit={handleInviteRaters}
                  className="rounded-lg border p-5 space-y-4 mb-2"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  {newRaters.map((rater, i) => (
                    <div key={i} className="flex items-end gap-3 flex-wrap">
                      <div className="flex-1 min-w-[150px]">
                        {i === 0 && (
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Name
                          </label>
                        )}
                        <input
                          required
                          value={rater.raterName}
                          onChange={(e) =>
                            updateRater(i, "raterName", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          style={{ borderColor: "#e5eaf0" }}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        {i === 0 && (
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Email
                          </label>
                        )}
                        <input
                          required
                          type="email"
                          value={rater.raterEmail}
                          onChange={(e) =>
                            updateRater(i, "raterEmail", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          style={{ borderColor: "#e5eaf0" }}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="w-40">
                        {i === 0 && (
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Role
                          </label>
                        )}
                        <select
                          value={rater.role}
                          onChange={(e) => updateRater(i, "role", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          style={{ borderColor: "#e5eaf0" }}
                        >
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="PEER">Peer</option>
                          <option value="DIRECT_REPORT">Direct Report</option>
                        </select>
                      </div>
                      {newRaters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRaterRow(i)}
                          className="text-gray-400 hover:text-red-500 p-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={addRaterRow}
                      className="text-sm px-3 py-1.5 rounded-lg border font-medium text-gray-600 hover:bg-gray-50"
                      style={{ borderColor: "#e5eaf0" }}
                    >
                      + Add another
                    </button>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => setShowAddRater(false)}
                      className="text-sm px-4 py-2 rounded-lg border font-medium text-gray-600"
                      style={{ borderColor: "#e5eaf0" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: "#D4A574" }}
                    >
                      {inviting ? "Sending..." : "Send Invitations"}
                    </button>
                  </div>
                </form>
              )}

              {/* Rater list */}
              {localRequest.invites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No raters invited yet. Add raters to start collecting feedback.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 border-b" style={{ borderColor: "#e5eaf0" }}>
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4 hidden md:table-cell">Email</th>
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4 hidden md:table-cell">Completed</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localRequest.invites.map((invite) => {
                        const badge =
                          STATUS_BADGE[invite.status] ?? STATUS_BADGE.INVITED;
                        return (
                          <tr
                            key={invite.id}
                            className="border-b last:border-0"
                            style={{ borderColor: "#e5eaf0" }}
                          >
                            <td className="py-3 pr-4">
                              <span
                                className="text-sm font-medium"
                                style={{ color: "#0F2744" }}
                              >
                                {invite.raterName}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-sm text-gray-500 hidden md:table-cell">
                              {invite.raterEmail}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-xs text-gray-600">
                                {ROLE_LABELS[invite.role] ?? invite.role}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-500 hidden md:table-cell">
                              {invite.completedAt
                                ? formatDate(invite.completedAt)
                                : "-"}
                            </td>
                            <td className="py-3">
                              {invite.status === "INVITED" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/maarova/three-sixty/resend", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ inviteId: invite.id }),
                                      });
                                      if (res.ok) {
                                        alert(`Invite resent to ${invite.raterEmail}`);
                                      } else {
                                        const data = await res.json();
                                        alert(data.error || "Failed to resend");
                                      }
                                    } catch {
                                      alert("Failed to resend invite");
                                    }
                                  }}
                                  className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-gray-50"
                                  style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                                >
                                  Resend
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
