"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Plus, Send, Download, CheckCircle, Clock,
  AlertCircle, Building2, Users,
} from "lucide-react";

interface Nda {
  id: string;
  type: string;
  status: string;
  partyAName: string;
  partyAOrg: string;
  partyAEmail: string;
  partyBName: string;
  effectiveDate: string;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  signedPdfUrl: string | null;
  engagement: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  consultant: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  MUTUAL_CLIENT: "Mutual Client NDA",
  CONSULTANT_MASTER: "Consultant NDA",
  PROJECT_SPECIFIC: "Project NDA",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: "Draft", bg: "#F3F4F6", text: "#6B7280", icon: FileText },
  PENDING_PARTY_A: { label: "Awaiting Signature", bg: "#FEF3C7", text: "#92400E", icon: Clock },
  PENDING_PARTY_B: { label: "Awaiting Countersign", bg: "#EFF6FF", text: "#1D4ED8", icon: Clock },
  ACTIVE: { label: "Active", bg: "#ECFDF5", text: "#065F46", icon: CheckCircle },
  EXPIRED: { label: "Expired", bg: "#FEF2F2", text: "#991B1B", icon: AlertCircle },
  TERMINATED: { label: "Terminated", bg: "#FEF2F2", text: "#991B1B", icon: AlertCircle },
};

const NDA_TYPES = [
  { value: "MUTUAL_CLIENT", label: "Mutual Client NDA", desc: "Standard mutual NDA for client engagements" },
  { value: "CONSULTANT_MASTER", label: "Consultant NDA", desc: "Master confidentiality agreement for consultants" },
  { value: "PROJECT_SPECIFIC", label: "Project NDA", desc: "Extra NDA for sensitive engagements" },
];

export default function NdaToolPage() {
  const [ndas, setNdas] = useState<Nda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "MUTUAL_CLIENT",
    partyAName: "",
    partyAOrg: "",
    partyATitle: "",
    partyAEmail: "",
    partyBName: "",
    partyBTitle: "",
    engagementId: "",
    clientId: "",
    consultantId: "",
  });

  const [clients, setClients] = useState<{ id: string; name: string; email: string; primaryContact: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; clientId: string }[]>([]);
  const [consultants, setConsultants] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ndas").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/consultants").then((r) => r.json()),
    ])
      .then(([ndaData, clientData, projectData, consultantData]) => {
        setNdas(ndaData.ndas ?? []);
        setClients(clientData.clients ?? []);
        setProjects(projectData.engagements ?? projectData.projects ?? []);
        setConsultants(consultantData.consultants ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function prefillFromClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((f) => ({
        ...f,
        clientId,
        partyAName: client.primaryContact,
        partyAOrg: client.name,
        partyAEmail: client.email,
      }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/ndas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Send signing link email
      await fetch("/api/ndas/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ndaId: data.nda.id }),
      }).catch(() => {});

      setNdas((prev) => [data.nda, ...prev]);
      setShowCreate(false);
      setForm({
        type: "MUTUAL_CLIENT", partyAName: "", partyAOrg: "", partyATitle: "",
        partyAEmail: "", partyBName: "", partyBTitle: "", engagementId: "", clientId: "", consultantId: "",
      });
    } catch (err) {
      console.error("NDA creation failed:", err);
      setError("Unable to create the NDA. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
  const inputStyle = { borderColor: "#e5eaf0" };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>NDA Manager</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate, send, and track non-disclosure agreements
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            <Plus className="w-4 h-4" />
            New NDA
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#e5eaf0" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>Create NDA</h2>

            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* NDA Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {NDA_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className="text-left p-3 rounded-lg border transition-all"
                    style={{
                      borderColor: form.type === t.value ? "#D4AF37" : "#e5eaf0",
                      background: form.type === t.value ? "#FFFBEB" : "#fff",
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Pre-fill from client (Client/Project NDA) */}
              {form.type !== "CONSULTANT_MASTER" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pre-fill from Client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => prefillFromClient(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pre-fill from consultant (Consultant NDA) */}
              {form.type === "CONSULTANT_MASTER" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Consultant</label>
                  <select
                    value={form.consultantId}
                    onChange={(e) => {
                      const c = consultants.find((x) => x.id === e.target.value);
                      if (c) {
                        setForm((f) => ({
                          ...f,
                          consultantId: c.id,
                          partyAName: c.name,
                          partyAEmail: c.email,
                        }));
                      }
                    }}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">Select consultant...</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Party A details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {form.type === "CONSULTANT_MASTER" ? "Consultant Name *" : "Contact Name *"}
                  </label>
                  <input
                    required
                    value={form.partyAName}
                    onChange={(e) => setForm((f) => ({ ...f, partyAName: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Organisation</label>
                  <input
                    value={form.partyAOrg}
                    onChange={(e) => setForm((f) => ({ ...f, partyAOrg: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input
                    value={form.partyATitle}
                    onChange={(e) => setForm((f) => ({ ...f, partyATitle: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Managing Director"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.partyAEmail}
                    onChange={(e) => setForm((f) => ({ ...f, partyAEmail: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Link to project */}
              {form.type !== "CONSULTANT_MASTER" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link to Project (optional)</label>
                  <select
                    value={form.engagementId}
                    onChange={(e) => setForm((f) => ({ ...f, engagementId: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* CFA signer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CFA Signer Name</label>
                  <input
                    value={form.partyBName}
                    onChange={(e) => setForm((f) => ({ ...f, partyBName: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Defaults to Consult For Africa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CFA Signer Title</label>
                  <input
                    value={form.partyBTitle}
                    onChange={(e) => setForm((f) => ({ ...f, partyBTitle: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Founding Partner"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {creating ? "Creating..." : "Create & Send NDA"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* NDA List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : ndas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No NDAs created yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium"
              style={{ color: "#D4AF37" }}
            >
              <Plus className="w-4 h-4" /> Create your first NDA
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ndas.map((nda) => {
              const config = STATUS_CONFIG[nda.status] ?? STATUS_CONFIG.DRAFT;
              const Icon = config.icon;
              return (
                <div
                  key={nda.id}
                  className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/tools/nda/${nda.id}`}
                          className="text-sm font-semibold hover:underline truncate"
                          style={{ color: "#0F2744" }}
                        >
                          {nda.partyAOrg} - {TYPE_LABELS[nda.type]}
                        </Link>
                        <span
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ background: config.bg, color: config.text }}
                        >
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {nda.partyAOrg}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {nda.partyAName}
                        </span>
                        <span>
                          Created {new Date(nda.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                        </span>
                        {nda.engagement && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]">
                            {nda.engagement.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {nda.status === "PENDING_PARTY_B" && (
                        <Link
                          href={`/tools/nda/${nda.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "#D4AF37" }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Countersign
                        </Link>
                      )}
                      {nda.signedPdfUrl && (
                        <a
                          href={`/api/ndas/${nda.id}/pdf`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border"
                          style={{ borderColor: "#e5eaf0" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
