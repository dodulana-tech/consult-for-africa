"use client";

import { useState, useCallback } from "react";

interface WorkHistoryEntry {
  id: string;
  facilityName: string;
  facilityId: string | null;
  role: string;
  department: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  confirmedByFacility: boolean;
}

interface HospitalSuggestion {
  id: string;
  name: string;
  state: string;
  city: string;
}

export default function ProfileWorkHistory({
  initialHistory,
}: {
  initialHistory: WorkHistoryEntry[];
}) {
  const [history, setHistory] = useState(initialHistory);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<HospitalSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState({
    facilityName: "",
    facilityId: "",
    role: "",
    department: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const searchHospitals = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/cadre/hospitals?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.facilities?.slice(0, 5) || []);
        setShowSuggestions(true);
      }
    } catch {
      // Autocomplete failure is non-critical
    }
  }, []);

  function selectHospital(hospital: HospitalSuggestion) {
    setForm({
      ...form,
      facilityName: hospital.name,
      facilityId: hospital.id,
    });
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.facilityName.trim() || !form.role.trim() || !form.startDate) {
      setError("Facility name, role, and start date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cadre/work-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to add position");
        return;
      }
      const newEntry = await res.json();
      // If new entry is current, unmark others locally
      let updated = history;
      if (newEntry.isCurrent) {
        updated = history.map((h) => ({ ...h, isCurrent: false }));
      }
      setHistory([newEntry, ...updated]);
      setShowForm(false);
      setForm({
        facilityName: "",
        facilityId: "",
        role: "",
        department: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
    });
  }

  return (
    <div
      id="work-history"
      className="scroll-mt-20 rounded-xl border border-gray-100 bg-white shadow-sm"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-6"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Work History</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {history.length}
          </span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 px-6 pb-6">
          {history.length === 0 && !showForm && (
            <p className="py-4 text-sm text-gray-400">
              No work history added yet. Add your positions to build your
              professional timeline.
            </p>
          )}

          <div className="mt-2 space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {entry.role}
                    </span>
                    {entry.isCurrent && (
                      <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                        Current
                      </span>
                    )}
                    {entry.confirmedByFacility && (
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Confirmed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    {entry.facilityName}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {entry.department ? `${entry.department} - ` : ""}
                    {formatDate(entry.startDate)} -{" "}
                    {entry.isCurrent
                      ? "Present"
                      : entry.endDate
                        ? formatDate(entry.endDate)
                        : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Facility / Hospital name
                  </label>
                  <input
                    type="text"
                    value={form.facilityName}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        facilityName: e.target.value,
                        facilityId: "",
                      });
                      searchHospitals(e.target.value);
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Start typing to search hospitals..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {suggestions.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => selectHospital(h)}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">
                            {h.name}
                          </span>
                          <span className="ml-2 text-gray-500">
                            {h.city}, {h.state}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    placeholder="e.g. Senior Registrar"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    placeholder="e.g. Internal Medicine"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    disabled={form.isCurrent}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isCurrent: e.target.checked,
                          endDate: e.target.checked ? "" : form.endDate,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
                    />
                    This is my current position
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0B3C5D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A3350] disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add position"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-[#0B3C5D] transition hover:border-[#0B3C5D] hover:bg-[#0B3C5D]/5"
            >
              + Add position
            </button>
          )}
        </div>
      )}
    </div>
  );
}
