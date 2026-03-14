"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, Library } from "lucide-react";

type Client = { id: string; name: string; currency: string };
type EM = { id: string; name: string };
type Methodology = { id: string; name: string; category: string; estimatedWeeks: number; phases: { name: string }[] };

interface Props {
  clients: Client[];
  engagementManagers: EM[];
  userRole: string;
  userId: string;
}

const SERVICE_TYPES = [
  { value: "HOSPITAL_OPERATIONS", label: "Hospital Operations" },
  { value: "TURNAROUND", label: "Turnaround & Recovery" },
  { value: "EMBEDDED_LEADERSHIP", label: "Embedded Leadership" },
  { value: "CLINICAL_GOVERNANCE", label: "Clinical Governance" },
  { value: "DIGITAL_HEALTH", label: "Digital Health" },
  { value: "HEALTH_SYSTEMS", label: "Health Systems" },
  { value: "DIASPORA_EXPERTISE", label: "Diaspora Expertise" },
  { value: "EM_AS_SERVICE", label: "EM as a Service" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function NewProjectForm({ clients, engagementManagers, userRole, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(userRole);

  const [form, setForm] = useState({
    clientId: "",
    engagementManagerId: isElevated ? "" : userId,
    name: "",
    description: "",
    serviceType: "",
    budgetAmount: "",
    budgetCurrency: "NGN",
    startDate: "",
    endDate: "",
    methodologyId: "",
  });

  // Fetch methodologies when modal opens
  useEffect(() => {
    if (open && methodologies.length === 0) {
      fetch("/api/methodologies")
        .then((r) => r.json())
        .then((d) => setMethodologies(d.methodologies ?? []))
        .catch(() => {});
    }
  }, [open, methodologies.length]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    // auto-fill currency from client
    if (key === "clientId") {
      const c = clients.find((x) => x.id === value);
      if (c) setForm((f) => ({ ...f, clientId: value, budgetCurrency: c.currency }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.name || !form.serviceType) {
      setError("Client, project name, and service type are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : 0,
          engagementManagerId: form.engagementManagerId || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          description: form.description || undefined,
          methodologyId: form.methodologyId || undefined,
        }),
      });
      if (!res.ok) {
        setError(await res.text().catch(() => "Failed to create project."));
        return;
      }
      const project = await res.json();
      setOpen(false);
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
        style={{ background: "#0F2744" }}
      >
        <Plus size={13} />
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
              <h2 className="text-sm font-semibold text-gray-900">New Project</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              {error && (
                <div className="text-xs text-red-600 px-3 py-2 rounded-lg" style={{ background: "#FEF2F2" }}>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Project Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Lagoon Hospital OPD Turnaround"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Client</label>
                  <div className="relative">
                    <select
                      value={form.clientId}
                      onChange={(e) => set("clientId", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      <option value="">Select client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Service Type</label>
                  <div className="relative">
                    <select
                      value={form.serviceType}
                      onChange={(e) => set("serviceType", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      <option value="">Select type</option>
                      {SERVICE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {isElevated && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Engagement Manager</label>
                    <div className="relative">
                      <select
                        value={form.engagementManagerId}
                        onChange={(e) => set("engagementManagerId", e.target.value)}
                        className={`${inputClass} appearance-none pr-8`}
                        style={inputStyle}
                      >
                        <option value="">Unassigned</option>
                        {engagementManagers.map((em) => (
                          <option key={em.id} value={em.id}>{em.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Budget</label>
                  <input
                    type="number"
                    value={form.budgetAmount}
                    onChange={(e) => set("budgetAmount", e.target.value)}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                  <div className="relative">
                    <select
                      value={form.budgetCurrency}
                      onChange={(e) => set("budgetCurrency", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                {methodologies.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1.5">
                      <Library size={11} className="text-gray-400" />
                      Methodology <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.methodologyId}
                        onChange={(e) => set("methodologyId", e.target.value)}
                        className={`${inputClass} appearance-none pr-8`}
                        style={inputStyle}
                      >
                        <option value="">No methodology selected</option>
                        {methodologies.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.phases.length} phases, ~{m.estimatedWeeks}w)
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {form.methodologyId && (() => {
                      const m = methodologies.find((x) => x.id === form.methodologyId);
                      return m ? (
                        <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                          Phases will be auto-generated: {m.phases.map((p) => p.name).join(" → ")}
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Brief scope and objectives..."
                    className={`${inputClass} resize-none`}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
