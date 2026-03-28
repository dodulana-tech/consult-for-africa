"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCompactCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Building2,
  DollarSign,
  Heart,
  Settings,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  FileCheck,
  Users,
  Target,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface KPISnapshot {
  id: string;
  period: string;
  revenueMonthly: string | number | null;
  revenuePerBedDay: string | number | null;
  ebitdaMarginPct: string | number | null;
  bedOccupancyPct: string | number | null;
  opdVolumeDaily: string | number | null;
  hmoDenialRatePct: string | number | null;
  arDays: string | number | null;
  hmoPanelsCount: number | null;
  cleanClaimRatePct: string | number | null;
  collectionRatePct: string | number | null;
  staffTurnoverPct: string | number | null;
  doctorBedRatio: string | number | null;
  nurseBedRatio: string | number | null;
  readmissionRatePct: string | number | null;
  redCount: number | null;
  amberCount: number | null;
  greenCount: number | null;
  notes: string | null;
  boardPackIncluded: boolean;
  createdAt: string;
}

interface ExitDossierData {
  id: string;
  exitEbitda: string | number | null;
  exitMultipleApplied: string | number | null;
  exitValuation: string | number | null;
  exitValRangeLow: string | number | null;
  exitValRangeHigh: string | number | null;
  dataRoomCompletenessPct: number | null;
  buyersJson: Array<{ name: string; type: string; status: string }> | null;
  imVersion: number | null;
  preferredBidder: string | null;
  equityProceeds: string | number | null;
  managementFeesTotal: string | number | null;
  totalCfaReturn: string | number | null;
  realisedMoic: string | number | null;
  realisedIrr: string | number | null;
  status: string;
}

interface TransformOSProps {
  engagementId: string;
  hospitalId: string;
  equityPct: number;
  dealStructure: string;
  entryValuation: number;
  exitMonths: number;
  boardSeat: boolean;
  stepInTrigger: number | null;
  isEM: boolean;
}

/* ── RAG thresholds (mirror server) ─────────────────────────────────────────── */

type Threshold = { green: number; amber: number; lowerIsBetter?: boolean };

const RAG_THRESHOLDS: Record<string, Threshold> = {
  bedOccupancyPct:    { green: 75, amber: 60 },
  ebitdaMarginPct:    { green: 15, amber: 5 },
  readmissionRatePct: { green: 5,  amber: 10, lowerIsBetter: true },
  staffTurnoverPct:   { green: 10, amber: 20, lowerIsBetter: true },
  collectionRatePct:  { green: 90, amber: 75 },
};

function getRag(field: string, value: number | null): "GREEN" | "AMBER" | "RED" | null {
  if (value == null) return null;
  const t = RAG_THRESHOLDS[field];
  if (!t) return null;
  if (t.lowerIsBetter) {
    if (value <= t.green) return "GREEN";
    if (value <= t.amber) return "AMBER";
    return "RED";
  }
  if (value >= t.green) return "GREEN";
  if (value >= t.amber) return "AMBER";
  return "RED";
}

const RAG_DOT: Record<string, string> = {
  GREEN: "#10B981",
  AMBER: "#F59E0B",
  RED:   "#EF4444",
};

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function num(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function pct(v: number | null): string {
  if (v == null) return "-";
  return `${v.toFixed(1)}%`;
}

function decimal1(v: number | null): string {
  if (v == null) return "-";
  return v.toFixed(1);
}

function trendArrow(current: number | null, previous: number | null, lowerIsBetter?: boolean) {
  if (current == null || previous == null) return <Minus size={12} className="text-gray-300" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus size={12} className="text-gray-400" />;
  const isUp = diff > 0;
  const isGood = lowerIsBetter ? !isUp : isUp;
  const color = isGood ? "text-emerald-500" : "text-red-500";
  return isUp
    ? <TrendingUp size={12} className={color} />
    : <TrendingDown size={12} className={color} />;
}

/* ── KPI Card ───────────────────────────────────────────────────────────────── */

function KPICard({
  label,
  field,
  value,
  prevValue,
  format,
  lowerIsBetter,
}: {
  label: string;
  field: string;
  value: number | null;
  prevValue: number | null;
  format: "pct" | "currency" | "number" | "ratio" | "days";
  lowerIsBetter?: boolean;
}) {
  const rag = getRag(field, value);

  let display = "-";
  if (value != null) {
    switch (format) {
      case "pct":      display = pct(value); break;
      case "currency": display = formatCompactCurrency(value, "NGN"); break;
      case "number":   display = Math.round(value).toLocaleString(); break;
      case "ratio":    display = decimal1(value); break;
      case "days":     display = `${decimal1(value)}d`; break;
    }
  }

  return (
    <div
      className="rounded-xl p-4 bg-white"
      style={{ border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1.5">
          {trendArrow(value, prevValue, lowerIsBetter)}
          {rag && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: RAG_DOT[rag] }}
              title={rag}
            />
          )}
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">{display}</p>
    </div>
  );
}

/* ── KPI Form ───────────────────────────────────────────────────────────────── */

const KPI_FIELDS = [
  { key: "revenueMonthly",    label: "Monthly Revenue (NGN)", type: "number" },
  { key: "revenuePerBedDay",  label: "Revenue per Bed Day",   type: "number" },
  { key: "ebitdaMarginPct",   label: "EBITDA Margin %",       type: "number" },
  { key: "bedOccupancyPct",   label: "Bed Occupancy %",       type: "number" },
  { key: "opdVolumeDaily",    label: "OPD Volume (Daily)",    type: "number" },
  { key: "hmoDenialRatePct",  label: "HMO Denial Rate %",    type: "number" },
  { key: "arDays",            label: "AR Days Outstanding",   type: "number" },
  { key: "hmoPanelsCount",    label: "HMO Panels Count",      type: "number" },
  { key: "cleanClaimRatePct", label: "Clean Claim Rate %",    type: "number" },
  { key: "collectionRatePct", label: "Collection Rate %",     type: "number" },
  { key: "staffTurnoverPct",  label: "Staff Turnover %",      type: "number" },
  { key: "doctorBedRatio",    label: "Doctor:Bed Ratio",      type: "number" },
  { key: "nurseBedRatio",     label: "Nurse:Bed Ratio",       type: "number" },
  { key: "readmissionRatePct",label: "Readmission Rate %",    type: "number" },
];

function KPIEntryForm({
  engagementId,
  hospitalId,
  onSaved,
  onCancel,
}: {
  engagementId: string;
  hospitalId: string;
  onSaved: (snap: KPISnapshot) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    period: new Date().toISOString().slice(0, 7),
    notes: "",
    boardPackIncluded: "false",
  });

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit() {
    setError("");
    if (!form.period) { setError("Period is required"); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        hospitalId,
        period: form.period,
        notes: form.notes || null,
        boardPackIncluded: form.boardPackIncluded === "true",
      };
      for (const f of KPI_FIELDS) {
        const val = form[f.key];
        if (val !== undefined && val !== "") {
          body[f.key] = f.key === "hmoPanelsCount" ? parseInt(val) : parseFloat(val);
        }
      }
      const res = await fetch(`/api/projects/${engagementId}/transform/kpis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save");
        return;
      }
      const { snapshot } = await res.json();
      onSaved(snapshot);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl p-5 bg-white space-y-4" style={{ border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Record Monthly KPIs</h3>
        <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-xs text-red-700" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Period (YYYY-MM)</label>
        <input
          type="month"
          value={form.period}
          onChange={(e) => setField("period", e.target.value)}
          className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none"
          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {KPI_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-[10px] text-gray-500 mb-1 block">{f.label}</label>
            <input
              type="number"
              step="any"
              value={form[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none"
          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="boardPack"
          checked={form.boardPackIncluded === "true"}
          onChange={(e) => setField("boardPackIncluded", e.target.checked ? "true" : "false")}
          className="rounded"
        />
        <label htmlFor="boardPack" className="text-xs text-gray-600">Include in board pack</label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ background: "#0F2744", color: "#fff" }}
        >
          {saving ? "Saving..." : "Save Snapshot"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export default function TransformOS({
  engagementId,
  hospitalId,
  equityPct,
  dealStructure,
  entryValuation,
  exitMonths,
  boardSeat,
  stepInTrigger,
  isEM,
}: TransformOSProps) {
  const [snapshots, setSnapshots] = useState<KPISnapshot[]>([]);
  const [exitDossier, setExitDossier] = useState<ExitDossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [exitExpanded, setExitExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, exitRes] = await Promise.all([
        fetch(`/api/projects/${engagementId}/transform/kpis`),
        fetch(`/api/projects/${engagementId}/transform/exit`),
      ]);
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setSnapshots(Array.isArray(data) ? data : []);
      }
      if (exitRes.ok) {
        const data = await exitRes.json();
        if (data && data.id) setExitDossier(data);
      }
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const latest = snapshots[0] ?? null;
  const previous = snapshots[1] ?? null;

  // Check for step-in trigger: any reds?
  const hasRedKPIs = latest && (latest.redCount ?? 0) > 0;

  // Deal structure labels
  const dealLabels: Record<string, string> = {
    SWEAT: "Sweat Equity",
    CAPITAL: "Capital Injection",
    HYBRID: "Hybrid",
  };

  // Exit status labels
  const exitStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
    NOT_STARTED:    { label: "Not Started",     color: "#9CA3AF", bg: "#F9FAFB" },
    PREPARATION:    { label: "Preparation",     color: "#3B82F6", bg: "#EFF6FF" },
    ACTIVE_PROCESS: { label: "Active Process",  color: "#D97706", bg: "#FFFBEB" },
    CLOSED:         { label: "Closed",          color: "#10B981", bg: "#ECFDF5" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Deal Summary ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} style={{ color: "#D4AF37" }} />
          <h3 className="text-sm font-semibold text-gray-900">Deal Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Equity Stake</p>
            <p className="text-sm font-bold text-gray-900">{equityPct}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Deal Structure</p>
            <p className="text-sm font-bold text-gray-900">{dealLabels[dealStructure] || dealStructure}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Entry Valuation</p>
            <p className="text-sm font-bold text-gray-900">{formatCompactCurrency(entryValuation, "NGN")}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Board Seat</p>
            <p className="text-sm font-bold text-gray-900">{boardSeat ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Exit Horizon</p>
            <p className="text-sm font-bold text-gray-900">{exitMonths} months</p>
          </div>
        </div>
      </div>

      {/* ── Step-In Alert ─────────────────────────────────────────────────────── */}
      {hasRedKPIs && stepInTrigger && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Step-In Trigger Warning</p>
            <p className="text-xs text-red-600 mt-1">
              {latest?.redCount} KPI{(latest?.redCount ?? 0) > 1 ? "s" : ""} in red zone.
              Step-in clause activates after {stepInTrigger} consecutive months of missed KPI targets.
            </p>
          </div>
        </div>
      )}

      {/* ── RAG Summary Bar ───────────────────────────────────────────────────── */}
      {latest && (
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400 font-medium">Latest: {latest.period}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
            <span className="text-gray-600">{latest.greenCount ?? 0} green</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
            <span className="text-gray-600">{latest.amberCount ?? 0} amber</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />
            <span className="text-gray-600">{latest.redCount ?? 0} red</span>
          </div>
        </div>
      )}

      {/* ── KPI Dashboard ─────────────────────────────────────────────────────── */}
      {latest ? (
        <div className="space-y-5">
          {/* Financial */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Financial</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Revenue" field="revenueMonthly" value={num(latest.revenueMonthly)} prevValue={num(previous?.revenueMonthly)} format="currency" />
              <KPICard label="EBITDA Margin" field="ebitdaMarginPct" value={num(latest.ebitdaMarginPct)} prevValue={num(previous?.ebitdaMarginPct)} format="pct" />
              <KPICard label="Collection Rate" field="collectionRatePct" value={num(latest.collectionRatePct)} prevValue={num(previous?.collectionRatePct)} format="pct" />
              <KPICard label="AR Days" field="arDays" value={num(latest.arDays)} prevValue={num(previous?.arDays)} format="days" lowerIsBetter />
            </div>
          </div>

          {/* Clinical */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clinical</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Bed Occupancy" field="bedOccupancyPct" value={num(latest.bedOccupancyPct)} prevValue={num(previous?.bedOccupancyPct)} format="pct" />
              <KPICard label="OPD Volume" field="opdVolumeDaily" value={num(latest.opdVolumeDaily)} prevValue={num(previous?.opdVolumeDaily)} format="number" />
              <KPICard label="Readmission Rate" field="readmissionRatePct" value={num(latest.readmissionRatePct)} prevValue={num(previous?.readmissionRatePct)} format="pct" lowerIsBetter />
              <KPICard label="HMO Denial Rate" field="hmoDenialRatePct" value={num(latest.hmoDenialRatePct)} prevValue={num(previous?.hmoDenialRatePct)} format="pct" lowerIsBetter />
            </div>
          </div>

          {/* Operational */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Operational</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Staff Turnover" field="staffTurnoverPct" value={num(latest.staffTurnoverPct)} prevValue={num(previous?.staffTurnoverPct)} format="pct" lowerIsBetter />
              <KPICard label="Clean Claim Rate" field="cleanClaimRatePct" value={num(latest.cleanClaimRatePct)} prevValue={num(previous?.cleanClaimRatePct)} format="pct" />
              <KPICard label="Rev per Bed Day" field="revenuePerBedDay" value={num(latest.revenuePerBedDay)} prevValue={num(previous?.revenuePerBedDay)} format="currency" />
              <KPICard label="HMO Panels" field="hmoPanelsCount" value={latest.hmoPanelsCount ?? null} prevValue={previous?.hmoPanelsCount ?? null} format="number" />
            </div>
          </div>

          {/* Governance / Ratios */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Governance / Ratios</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard label="Doctor:Bed Ratio" field="doctorBedRatio" value={num(latest.doctorBedRatio)} prevValue={num(previous?.doctorBedRatio)} format="ratio" />
              <KPICard label="Nurse:Bed Ratio" field="nurseBedRatio" value={num(latest.nurseBedRatio)} prevValue={num(previous?.nurseBedRatio)} format="ratio" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-8 bg-white text-center" style={{ border: "1px solid #e5eaf0" }}>
          <Target size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No KPI snapshots recorded yet.</p>
          <p className="text-xs text-gray-400 mt-1">Record the first monthly snapshot to start tracking transformation progress.</p>
        </div>
      )}

      {/* ── Record KPIs Button / Form (EM only) ──────────────────────────────── */}
      {isEM && (
        showKPIForm ? (
          <KPIEntryForm
            engagementId={engagementId}
            hospitalId={hospitalId}
            onSaved={(snap) => {
              setSnapshots((prev) => [snap, ...prev]);
              setShowKPIForm(false);
            }}
            onCancel={() => setShowKPIForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowKPIForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <Plus size={14} />
            Record KPIs
          </button>
        )
      )}

      {/* ── Historical Snapshots ──────────────────────────────────────────────── */}
      {snapshots.length > 1 && (
        <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Snapshot History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Period</th>
                  <th className="pb-2 pr-4 font-medium">Revenue</th>
                  <th className="pb-2 pr-4 font-medium">EBITDA %</th>
                  <th className="pb-2 pr-4 font-medium">Occupancy %</th>
                  <th className="pb-2 pr-4 font-medium">Collection %</th>
                  <th className="pb-2 pr-4 font-medium">RAG</th>
                  <th className="pb-2 font-medium">Board Pack</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                    <td className="py-2 pr-4 font-medium text-gray-900">{s.period}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {num(s.revenueMonthly) != null ? formatCompactCurrency(num(s.revenueMonthly)!, "NGN") : "-"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{pct(num(s.ebitdaMarginPct))}</td>
                    <td className="py-2 pr-4 text-gray-600">{pct(num(s.bedOccupancyPct))}</td>
                    <td className="py-2 pr-4 text-gray-600">{pct(num(s.collectionRatePct))}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-600">{s.greenCount ?? 0}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-amber-500">{s.amberCount ?? 0}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-500">{s.redCount ?? 0}</span>
                      </div>
                    </td>
                    <td className="py-2 text-gray-600">{s.boardPackIncluded ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Exit Engine ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
        <button
          onClick={() => setExitExpanded(!exitExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileCheck size={16} style={{ color: "#D4AF37" }} />
            <h3 className="text-sm font-semibold text-gray-900">Exit Engine</h3>
            {exitDossier && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: exitStatusLabels[exitDossier.status]?.color ?? "#9CA3AF",
                  background: exitStatusLabels[exitDossier.status]?.bg ?? "#F9FAFB",
                }}
              >
                {exitStatusLabels[exitDossier.status]?.label ?? exitDossier.status}
              </span>
            )}
          </div>
          {exitExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {exitExpanded && (
          <div className="mt-4 space-y-4">
            {exitDossier ? (
              <>
                {/* Data Room Completeness */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Data Room Completeness</span>
                    <span className="font-semibold">{exitDossier.dataRoomCompletenessPct ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(exitDossier.dataRoomCompletenessPct ?? 0, 100)}%`,
                        background: (exitDossier.dataRoomCompletenessPct ?? 0) >= 80 ? "#10B981" : (exitDossier.dataRoomCompletenessPct ?? 0) >= 50 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                  </div>
                </div>

                {/* Valuation Range */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                    <p className="text-[10px] text-gray-400 mb-1">Exit Valuation</p>
                    <p className="text-sm font-bold text-gray-900">
                      {num(exitDossier.exitValuation) != null ? formatCompactCurrency(num(exitDossier.exitValuation)!, "NGN") : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                    <p className="text-[10px] text-gray-400 mb-1">Range</p>
                    <p className="text-sm font-bold text-gray-900">
                      {num(exitDossier.exitValRangeLow) != null && num(exitDossier.exitValRangeHigh) != null
                        ? `${formatCompactCurrency(num(exitDossier.exitValRangeLow)!, "NGN")} - ${formatCompactCurrency(num(exitDossier.exitValRangeHigh)!, "NGN")}`
                        : "-"
                      }
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                    <p className="text-[10px] text-gray-400 mb-1">Exit EBITDA</p>
                    <p className="text-sm font-bold text-gray-900">
                      {num(exitDossier.exitEbitda) != null ? formatCompactCurrency(num(exitDossier.exitEbitda)!, "NGN") : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                    <p className="text-[10px] text-gray-400 mb-1">Multiple Applied</p>
                    <p className="text-sm font-bold text-gray-900">
                      {num(exitDossier.exitMultipleApplied) != null ? `${decimal1(num(exitDossier.exitMultipleApplied))}x` : "-"}
                    </p>
                  </div>
                </div>

                {/* Buyer Pipeline */}
                <div className="flex items-center gap-3">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {Array.isArray(exitDossier.buyersJson) ? exitDossier.buyersJson.length : 0} buyers in pipeline
                  </span>
                  {exitDossier.preferredBidder && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>
                      Preferred: {exitDossier.preferredBidder}
                    </span>
                  )}
                </div>

                {/* MOIC / IRR */}
                {(num(exitDossier.realisedMoic) != null || num(exitDossier.realisedIrr) != null) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                      <p className="text-[10px] text-gray-500 mb-1">Realised MOIC</p>
                      <p className="text-sm font-bold text-emerald-700">
                        {num(exitDossier.realisedMoic) != null ? `${decimal1(num(exitDossier.realisedMoic))}x` : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                      <p className="text-[10px] text-gray-500 mb-1">Realised IRR</p>
                      <p className="text-sm font-bold text-emerald-700">
                        {num(exitDossier.realisedIrr) != null ? `${decimal1(num(exitDossier.realisedIrr))}%` : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                      <p className="text-[10px] text-gray-400 mb-1">Equity Proceeds</p>
                      <p className="text-sm font-bold text-gray-900">
                        {num(exitDossier.equityProceeds) != null ? formatCompactCurrency(num(exitDossier.equityProceeds)!, "NGN") : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                      <p className="text-[10px] text-gray-400 mb-1">Total C4A Return</p>
                      <p className="text-sm font-bold text-gray-900">
                        {num(exitDossier.totalCfaReturn) != null ? formatCompactCurrency(num(exitDossier.totalCfaReturn)!, "NGN") : "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* IM Version */}
                {exitDossier.imVersion && (
                  <p className="text-xs text-gray-400">Information Memorandum: v{exitDossier.imVersion}</p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <FileCheck size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No exit dossier created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
