"use client";

/**
 * The signups table on the CadreHealth admin dashboard.
 *
 * Lifted out of the server page because verification needs selection state:
 * a tick on a single row, and a bulk action over whatever is selected. The
 * markup is the same table the page rendered before, plus a checkbox column
 * and an action column.
 *
 * Rows update optimistically and then router.refresh() reconciles the header
 * counts, so the VERIFIED tile and verification rate follow along without a
 * manual reload.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, AlertTriangle, X } from "lucide-react";

export interface SignupRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cadre: string;
  state: string | null;
  accountStatus: string;
  createdAt: string;
}

function statusClasses(status: string) {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
}

export function SignupsTable({ rows }: { rows: SignupRow[] }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.accountStatus])),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only rows that are not already verified can be acted on.
  const verifiable = useMemo(
    () => rows.filter((r) => (statuses[r.id] ?? r.accountStatus) !== "VERIFIED"),
    [rows, statuses],
  );
  const allSelected = verifiable.length > 0 && verifiable.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(verifiable.map((r) => r.id)));
  }

  async function verify(ids: string[]) {
    if (ids.length === 0) return;
    setError(null);
    const isBulk = ids.length > 1;
    if (isBulk) setBulkBusy(true);
    else setBusy((prev) => new Set(prev).add(ids[0]));

    try {
      const res = await fetch("/api/admin/cadrehealth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "VERIFIED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not verify");
        return;
      }
      setStatuses((prev) => {
        const next = { ...prev };
        for (const id of data.ids as string[]) next[id] = "VERIFIED";
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBulkBusy(false);
      setBusy((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }
  }

  return (
    <>
      {(selected.size > 0 || error) && (
        <div className="flex items-center gap-3 border-b border-gray-100/80 bg-white/70 px-6 py-2.5">
          {error ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-700">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
                {selected.size} selected
              </span>
              <button
                type="button"
                onClick={() => verify([...selected])}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "#0B3C5D" }}
              >
                {bulkBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Verify {selected.size}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-gray-100/80 text-left"
              style={{ background: "rgba(15,39,68,0.03)" }}
            >
              <th className="w-10 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={verifiable.length === 0}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#0B3C5D] disabled:cursor-not-allowed"
                  aria-label="Select all unverified on this page"
                />
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Name
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cadre
              </th>
              <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">
                State
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">
                Joined
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const status = statuses[p.id] ?? p.accountStatus;
              const isVerified = status === "VERIFIED";
              const rowBusy = busy.has(p.id);
              return (
                <tr
                  key={p.id}
                  className="border-b border-gray-50/80 transition-colors last:border-0 hover:bg-white/60"
                >
                  <td className="px-4 py-4">
                    {!isVerified && (
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#0B3C5D]"
                        aria-label={`Select ${p.firstName} ${p.lastName}`}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/cadrehealth/${p.id}`}
                      className="font-semibold hover:underline"
                      style={{ color: "#0B3C5D" }}
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                    <div className="mt-0.5 text-xs text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.cadre.replace(/_/g, " ")}</td>
                  <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                    {p.state || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-gray-400 md:table-cell">{p.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => verify([p.id])}
                        disabled={rowBusy || bulkBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-50"
                        style={{ color: "#0B3C5D", borderColor: "#e5eaf0" }}
                        title={`Mark ${p.firstName} ${p.lastName} as licence verified`}
                      >
                        {rowBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
