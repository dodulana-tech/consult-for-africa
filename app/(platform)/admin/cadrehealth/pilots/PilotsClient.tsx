"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, X, Loader2, AlertCircle, CheckCircle, ArrowRight, Clock,
  Trophy, Building2, User as UserIcon, MapPin, FileText, Star,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface Owner {
  id: string;
  name: string;
}

interface Pilot {
  id: string;
  title: string;
  facilityName: string | null;
  cadre: string;
  subSpecialty: string | null;
  status: string;
  locationState: string | null;
  locationCity: string | null;
  pilotOwner: { id: string; name: string } | null;
  pilotNotes: string | null;
  briefedAt: string | null;
  sourcingStartedAt: string | null;
  shortlistedAt: string | null;
  interviewingAt: string | null;
  offerExtendedAt: string | null;
  placedAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  placementFeeNGN: number | null;
  placedConsultantId: string | null;
  caseStudyApproved: boolean;
  caseStudyQuote: string | null;
  caseStudyContactName: string | null;
  caseStudyContactTitle: string | null;
  candidateCount: number;
  createdAt: string;
}

interface Summary {
  total: number;
  active: number;
  placed: number;
  lost: number;
  placementRate: number;
  avgTimeToShortlistDays: number | null;
  avgTimeToFillDays: number | null;
  caseStudiesReady: number;
}

const STAGES = [
  { key: "OPEN", label: "Briefed", short: "Open" },
  { key: "SOURCING", label: "Sourcing", short: "Sourcing" },
  { key: "SHORTLISTED", label: "Shortlist Sent", short: "Shortlist" },
  { key: "INTERVIEWING", label: "Interviewing", short: "Interview" },
  { key: "OFFER_EXTENDED", label: "Offer Extended", short: "Offer" },
  { key: "PLACED", label: "Placed", short: "Placed" },
] as const;

const STAGE_COLORS: Record<string, { bg: string; color: string; ring: string }> = {
  OPEN: { bg: "#F3F4F6", color: "#374151", ring: "#9CA3AF" },
  SOURCING: { bg: "#EFF6FF", color: "#1E40AF", ring: "#3B82F6" },
  SHORTLISTED: { bg: "#FEF3C7", color: "#92400E", ring: "#F59E0B" },
  INTERVIEWING: { bg: "#EDE9FE", color: "#5B21B6", ring: "#8B5CF6" },
  OFFER_EXTENDED: { bg: "#FCE7F3", color: "#9D174D", ring: "#EC4899" },
  PLACED: { bg: "#D1FAE5", color: "#065F46", ring: "#10B981" },
  CLOSED: { bg: "#F3F4F6", color: "#6B7280", ring: "#9CA3AF" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", ring: "#EF4444" },
};

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

function daysAgo(a: string | null): number | null {
  if (!a) return null;
  return Math.round((Date.now() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export default function PilotsClient({
  initialPilots,
  owners,
  summary,
}: {
  initialPilots: Pilot[];
  owners: Owner[];
  summary: Summary;
}) {
  const router = useRouter();
  const [pilots, setPilots] = useState(initialPilots);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selected = pilots.find((p) => p.id === selectedId) ?? null;

  function upsert(p: Pilot) {
    setPilots((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i === -1) return [p, ...prev];
      const next = [...prev];
      next[i] = p;
      return next;
    });
  }

  async function handleAdvance(p: Pilot, nextStatus: string, extra: Record<string, unknown> = {}) {
    setError("");
    const res = await fetch(`/api/admin/cadrehealth/pilots/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, ...extra }),
    });
    if (!res.ok) {
      setError(await parseApiError(res, "Failed to advance stage"));
      return;
    }
    const updated = await res.json();
    // Refetch the merged record (we want the new timestamps + everything)
    const fresh = await fetch(`/api/admin/cadrehealth/pilots/${p.id}`).then((r) => r.json()).catch(() => updated);
    upsert({ ...p, ...fresh, status: nextStatus });
    router.refresh();
  }

  async function handleCaseStudy(p: Pilot, fields: Record<string, unknown>) {
    setError("");
    const res = await fetch(`/api/admin/cadrehealth/pilots/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      setError(await parseApiError(res, "Failed to save case study"));
      return;
    }
    const updated = await res.json();
    upsert({ ...p, ...updated, caseStudyApproved: fields.caseStudyApproved !== undefined ? !!fields.caseStudyApproved : p.caseStudyApproved });
    router.refresh();
  }

  if (selected) {
    return (
      <PilotDetail
        pilot={selected}
        owners={owners}
        onClose={() => setSelectedId(null)}
        onAdvance={handleAdvance}
        onCaseStudy={handleCaseStudy}
        error={error}
      />
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Funnel summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Active pilots" value={summary.active} accent="#1E40AF" />
        <StatBox label="Placed" value={summary.placed} accent="#065F46" suffix={summary.total > 0 ? `${summary.placementRate}% rate` : undefined} />
        <StatBox
          label="Avg time to shortlist"
          value={summary.avgTimeToShortlistDays ?? "—"}
          suffix={summary.avgTimeToShortlistDays != null ? "days" : undefined}
          accent="#92400E"
        />
        <StatBox
          label="Avg time to fill"
          value={summary.avgTimeToFillDays ?? "—"}
          suffix={summary.avgTimeToFillDays != null ? "days" : undefined}
          accent="#065F46"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>
            {pilots.length} pilot{pilots.length === 1 ? "" : "s"}
          </h2>
          {summary.caseStudiesReady > 0 && (
            <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
              <Trophy size={11} />
              {summary.caseStudiesReady} case stud{summary.caseStudiesReady === 1 ? "y" : "ies"} ready for outreach
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#0F2744" }}
        >
          <Plus size={13} /> New Pilot
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* List */}
      {pilots.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center" style={{ border: "1px solid #e5eaf0" }}>
          <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">No pilots yet.</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
            Mark a mandate as a pilot to hand-manage the search for a hospital you already have a relationship with.
            Track time-to-shortlist, time-to-fill, and capture testimonials.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            <Plus size={11} /> Start a pilot
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pilots.map((p) => (
            <PilotRow key={p.id} pilot={p} onClick={() => setSelectedId(p.id)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePilotModal
          owners={owners}
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            upsert(p);
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, suffix, accent }: { label: string; value: number | string; suffix?: string; accent: string }) {
  return (
    <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold" style={{ color: accent }}>{value}</p>
      {suffix && <p className="text-[11px] text-gray-400 mt-0.5">{suffix}</p>}
    </div>
  );
}

function PilotRow({ pilot, onClick }: { pilot: Pilot; onClick: () => void }) {
  const style = STAGE_COLORS[pilot.status] ?? STAGE_COLORS.OPEN;
  const ttShortlist = daysBetween(pilot.briefedAt, pilot.shortlistedAt);
  const ttFill = daysBetween(pilot.briefedAt, pilot.placedAt);
  const daysOpen = pilot.placedAt || pilot.lostAt ? null : daysAgo(pilot.briefedAt);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-white p-4 text-left transition-shadow hover:shadow-sm flex items-start gap-3"
      style={{ border: "1px solid #e5eaf0" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${style.ring}15`, color: style.ring }}
      >
        <Building2 size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: "#0F2744" }}>
            {pilot.title}
          </p>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: style.bg, color: style.color }}
          >
            {STAGES.find((s) => s.key === pilot.status)?.short ?? pilot.status}
          </span>
          {pilot.caseStudyApproved && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "#FEF3C7", color: "#92400E" }}>
              <Trophy size={9} /> Case study
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
          {pilot.facilityName && <span className="flex items-center gap-1"><Building2 size={10} /> {pilot.facilityName}</span>}
          <span>{pilot.cadre.replace(/_/g, " ")}</span>
          {pilot.locationState && <span className="flex items-center gap-1"><MapPin size={10} /> {pilot.locationCity ? `${pilot.locationCity}, ` : ""}{pilot.locationState}</span>}
          {pilot.pilotOwner && <span className="flex items-center gap-1"><UserIcon size={10} /> {pilot.pilotOwner.name}</span>}
          <span>{pilot.candidateCount} candidate{pilot.candidateCount === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {ttFill != null ? (
          <>
            <p className="text-xs font-semibold text-emerald-600">Placed in {ttFill}d</p>
            <p className="text-[10px] text-gray-400">Shortlist in {ttShortlist ?? "?"}d</p>
          </>
        ) : pilot.lostAt ? (
          <p className="text-xs font-medium text-red-500">Lost</p>
        ) : daysOpen != null ? (
          <>
            <p className="text-xs font-semibold flex items-center gap-1 justify-end" style={{ color: daysOpen > 21 ? "#DC2626" : daysOpen > 14 ? "#D97706" : "#6B7280" }}>
              <Clock size={11} /> {daysOpen}d open
            </p>
            {ttShortlist != null && <p className="text-[10px] text-gray-400">Shortlisted in {ttShortlist}d</p>}
          </>
        ) : null}
      </div>
    </button>
  );
}

function PilotDetail({
  pilot,
  owners,
  onClose,
  onAdvance,
  onCaseStudy,
  error,
}: {
  pilot: Pilot;
  owners: Owner[];
  onClose: () => void;
  onAdvance: (p: Pilot, status: string, extra?: Record<string, unknown>) => Promise<void>;
  onCaseStudy: (p: Pilot, fields: Record<string, unknown>) => Promise<void>;
  error: string;
}) {
  const [advancing, setAdvancing] = useState(false);
  const [showPlace, setShowPlace] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [showCaseStudy, setShowCaseStudy] = useState(false);

  const currentStageIdx = STAGES.findIndex((s) => s.key === pilot.status);
  const nextStage = currentStageIdx >= 0 && currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

  async function advance(status: string, extra?: Record<string, unknown>) {
    setAdvancing(true);
    await onAdvance(pilot, status, extra);
    setAdvancing(false);
  }

  return (
    <div className="max-w-4xl space-y-4">
      <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1.5">
        <ArrowRight size={12} className="rotate-180" /> Back to pilots
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #e5eaf0" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#0F2744" }}>{pilot.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pilot.facilityName ?? "Facility tbc"} · {pilot.cadre.replace(/_/g, " ")}
              {pilot.subSpecialty && ` / ${pilot.subSpecialty}`}
              {pilot.locationState && ` · ${pilot.locationCity ? `${pilot.locationCity}, ` : ""}${pilot.locationState}`}
            </p>
            {pilot.pilotOwner && <p className="text-xs text-gray-400 mt-1">Owner: {pilot.pilotOwner.name}</p>}
          </div>
          {pilot.placementFeeNGN && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Placement Fee</p>
              <p className="text-base font-bold" style={{ color: "#065F46" }}>
                ₦{pilot.placementFeeNGN.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Stage funnel */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            {STAGES.map((s, i) => {
              const reached = currentStageIdx >= i || pilot.status === "PLACED";
              const isCurrent = pilot.status === s.key;
              const style = STAGE_COLORS[s.key];
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: reached ? style.ring : "#F3F4F6",
                        color: reached ? "#fff" : "#9CA3AF",
                        boxShadow: isCurrent ? `0 0 0 3px ${style.ring}33` : "none",
                      }}
                    >
                      {reached ? <CheckCircle size={14} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                    </div>
                    <p className="text-[10px] text-center" style={{ color: reached ? style.color : "#9CA3AF" }}>{s.short}</p>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="flex-1 h-px" style={{ background: reached ? style.ring : "#E5E7EB" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
          <Timestamp label="Briefed" value={pilot.briefedAt} />
          <Timestamp label="Sourcing started" value={pilot.sourcingStartedAt} />
          <Timestamp label="Shortlist sent" value={pilot.shortlistedAt} />
          <Timestamp label="Interviews started" value={pilot.interviewingAt} />
          <Timestamp label="Offer extended" value={pilot.offerExtendedAt} />
          <Timestamp label="Placed" value={pilot.placedAt} highlight={!!pilot.placedAt} />
        </div>

        {/* Advance actions */}
        <div className="flex gap-2 mt-5 pt-5 border-t flex-wrap" style={{ borderColor: "#F3F4F6" }}>
          {pilot.status !== "PLACED" && pilot.status !== "CANCELLED" && nextStage && nextStage.key !== "PLACED" && (
            <button
              onClick={() => advance(nextStage.key)}
              disabled={advancing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {advancing && <Loader2 size={13} className="animate-spin" />}
              Advance to {nextStage.label}
              <ArrowRight size={12} />
            </button>
          )}
          {pilot.status === "OFFER_EXTENDED" && (
            <button
              onClick={() => setShowPlace(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#065F46" }}
            >
              <Trophy size={13} /> Mark as Placed
            </button>
          )}
          {pilot.status !== "PLACED" && pilot.status !== "CANCELLED" && (
            <button
              onClick={() => setShowLost(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ border: "1px solid #FECACA", color: "#991B1B" }}
            >
              Mark as Lost
            </button>
          )}
          {pilot.status === "PLACED" && !pilot.caseStudyApproved && (
            <button
              onClick={() => setShowCaseStudy(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#D97706" }}
            >
              <Star size={13} /> Capture Case Study
            </button>
          )}
        </div>
      </div>

      {/* Case study card */}
      {pilot.caseStudyApproved && (
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1px solid #FDE68A" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: "#92400E" }} />
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#92400E" }}>Case study approved</p>
          </div>
          {pilot.caseStudyQuote && (
            <p className="text-sm italic" style={{ color: "#78350F" }}>&ldquo;{pilot.caseStudyQuote}&rdquo;</p>
          )}
          {pilot.caseStudyContactName && (
            <p className="text-xs mt-3" style={{ color: "#92400E" }}>
              — {pilot.caseStudyContactName}{pilot.caseStudyContactTitle ? `, ${pilot.caseStudyContactTitle}` : ""}{pilot.facilityName ? `, ${pilot.facilityName}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {pilot.pilotNotes && (
        <div className="rounded-2xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={13} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-500">Internal notes</p>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{pilot.pilotNotes}</p>
        </div>
      )}

      {/* Modals */}
      {showPlace && (
        <PlaceModal pilot={pilot} onClose={() => setShowPlace(false)} onConfirm={async (consultantId, fee) => {
          await advance("PLACED", { placedConsultantId: consultantId, placementFeeNGN: fee });
          setShowPlace(false);
        }} />
      )}
      {showLost && (
        <LostModal pilot={pilot} onClose={() => setShowLost(false)} onConfirm={async (reason) => {
          await advance("CANCELLED", { lostReason: reason });
          setShowLost(false);
        }} />
      )}
      {showCaseStudy && (
        <CaseStudyModal pilot={pilot} onClose={() => setShowCaseStudy(false)} onConfirm={async (fields) => {
          await onCaseStudy(pilot, fields);
          setShowCaseStudy(false);
        }} />
      )}
    </div>
  );
}

function Timestamp({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: value ? (highlight ? "#065F46" : "#374151") : "#D1D5DB" }}>
        {value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
      </p>
    </div>
  );
}

function CreatePilotModal({
  owners,
  onClose,
  onCreated,
}: {
  owners: Owner[];
  onClose: () => void;
  onCreated: (p: Pilot) => void;
}) {
  const [title, setTitle] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [cadre, setCadre] = useState("MEDICINE");
  const [type, setType] = useState("PERMANENT");
  const [locationState, setLocationState] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [pilotOwnerId, setPilotOwnerId] = useState(owners[0]?.id ?? "");
  const [pilotNotes, setPilotNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/cadrehealth/pilots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, facilityName, cadre, type, locationState, locationCity, subSpecialty, pilotOwnerId, pilotNotes }),
    });
    if (!res.ok) {
      setError(await parseApiError(res, "Failed to create pilot"));
      setSaving(false);
      return;
    }
    const p = await res.json();
    onCreated({ ...p, candidateCount: 0, pilotOwner: owners.find((o) => o.id === pilotOwnerId) ?? null, briefedAt: new Date().toISOString(), caseStudyApproved: false } as Pilot);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>New Pilot</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <Field label="Role title" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ICU Lead Consultant" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} required />
          </Field>
          <Field label="Hospital / facility">
            <input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="Lagoon Hospitals" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadre" required>
              <select value={cadre} onChange={(e) => setCadre(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }}>
                {["MEDICINE","DENTISTRY","NURSING","MIDWIFERY","PHARMACY","MEDICAL_LABORATORY_SCIENCE","RADIOGRAPHY_IMAGING","REHABILITATION_THERAPY","OPTOMETRY","COMMUNITY_HEALTH","ENVIRONMENTAL_HEALTH","NUTRITION_DIETETICS","PSYCHOLOGY_SOCIAL_WORK","PUBLIC_HEALTH","HEALTH_RECORDS","HOSPITAL_MANAGEMENT","HEALTH_ADMINISTRATION","BIOMEDICAL_ENGINEERING"].map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
            <Field label="Type" required>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }}>
                {["PERMANENT","LOCUM","CONTRACT","CONSULTING","INTERNATIONAL"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Sub-specialty">
            <input value={subSpecialty} onChange={(e) => setSubSpecialty(e.target.value)} placeholder="Cardiology / ICU / etc." className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <input value={locationState} onChange={(e) => setLocationState(e.target.value)} placeholder="Lagos" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
            </Field>
            <Field label="City">
              <input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="Ikoyi" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
            </Field>
          </div>
          <Field label="Owner">
            <select value={pilotOwnerId} onChange={(e) => setPilotOwnerId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }}>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Internal notes">
            <textarea value={pilotNotes} onChange={(e) => setPilotNotes(e.target.value)} rows={3} placeholder="How we know this hospital, sourcing approach, target salary band..." className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0", resize: "vertical" }} />
          </Field>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
              {saving && <Loader2 size={12} className="animate-spin" />} Create Pilot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function PlaceModal({ pilot, onClose, onConfirm }: { pilot: Pilot; onClose: () => void; onConfirm: (consultantId: string, fee: number | null) => Promise<void> }) {
  const [consultantId, setConsultantId] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Mark as Placed" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">Capture the consultant who got the role and the placement fee for {pilot.title}.</p>
      <Field label="Placed consultant ID (CadreProfessional)" required>
        <input value={consultantId} onChange={(e) => setConsultantId(e.target.value)} placeholder="Paste their CadreProfessional id" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} required />
      </Field>
      <Field label="Placement fee (NGN)">
        <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="1500000" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
      </Field>
      <ModalActions onClose={onClose} onConfirm={async () => {
        if (!consultantId.trim()) return;
        setSaving(true);
        await onConfirm(consultantId.trim(), fee ? parseFloat(fee) : null);
        setSaving(false);
      }} disabled={!consultantId.trim() || saving} confirmLabel="Mark as Placed" confirmColor="#065F46" loading={saving} />
    </Modal>
  );
}

function LostModal({ pilot, onClose, onConfirm }: { pilot: Pilot; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Mark as Lost" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">Briefly capture why {pilot.title} did not result in a placement. We learn from these.</p>
      <Field label="Reason" required>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Hospital paused hiring · candidate accepted competing offer · budget pulled..." className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0", resize: "vertical" }} required />
      </Field>
      <ModalActions onClose={onClose} onConfirm={async () => {
        if (!reason.trim()) return;
        setSaving(true);
        await onConfirm(reason.trim());
        setSaving(false);
      }} disabled={!reason.trim() || saving} confirmLabel="Mark as Lost" confirmColor="#DC2626" loading={saving} />
    </Modal>
  );
}

function CaseStudyModal({ pilot, onClose, onConfirm }: { pilot: Pilot; onClose: () => void; onConfirm: (fields: Record<string, unknown>) => Promise<void> }) {
  const [quote, setQuote] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Capture Case Study" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Get a quote from {pilot.facilityName ?? "the hospital"} and confirm they have approved using this as a public reference for cold outreach.
      </p>
      <Field label="Quote">
        <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} placeholder="We filled our ICU lead role in 11 days with a consultant who has stayed for 18 months. CadreHealth is now our first call." className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0", resize: "vertical" }} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Dr. Funmi Aderonke" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
        </Field>
        <Field label="Contact title">
          <input value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="HR Director" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]" style={{ borderColor: "#e5eaf0" }} />
        </Field>
      </div>
      <ModalActions onClose={onClose} onConfirm={async () => {
        setSaving(true);
        await onConfirm({ caseStudyApproved: true, caseStudyQuote: quote, caseStudyContactName: contactName, caseStudyContactTitle: contactTitle });
        setSaving(false);
      }} disabled={saving} confirmLabel="Save & Approve" confirmColor="#D97706" loading={saving} />
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onConfirm, disabled, confirmLabel, confirmColor, loading }: { onClose: () => void; onConfirm: () => void; disabled?: boolean; confirmLabel: string; confirmColor: string; loading?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
      <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button onClick={onConfirm} disabled={disabled} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: confirmColor }}>
        {loading && <Loader2 size={12} className="animate-spin" />} {confirmLabel}
      </button>
    </div>
  );
}
