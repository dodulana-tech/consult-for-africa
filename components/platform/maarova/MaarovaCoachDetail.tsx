"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  MapPin,
  Clock,
  Globe,
  Heart,
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Pencil,
  Save,
  ShieldCheck,
  Calendar,
  FileText,
  Users,
  BarChart3,
  ChevronRight,
  Plus,
  Send,
  CreditCard,
  Ban,
  Loader2,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

/* ── Types ────────────────────────────────────────────────────────────── */

interface Coach {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  specialisms: string[];
  certifications: string[];
  country: string;
  city: string | null;
  yearsExperience: number;
  maxClients: number;
  activeClients: number;
  isActive: boolean;
  isPortalEnabled: boolean;
  avatarUrl: string | null;
  languages: string[];
  timezone: string;
  healthcareExperience: boolean;
  developmentFocus: string[];
  vettingStatus: string;
  applicationDate: string | null;
  interviewDate: string | null;
  interviewScore: number | null;
  interviewNotes: string | null;
  vetNotes: string | null;
  reviewedBy: string | null;
  hourlyRate: number | null;
  currency: string;
  avgSessionRating: number | null;
  totalSessions: number;
  completedEngagements: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  organisation: { id: string; name: string } | null;
  matchCount: number;
}

interface Match {
  id: string;
  status: string;
  programme: string;
  matchScore: number | null;
  startDate: string | null;
  endDate: string | null;
  sessionsCompleted: number;
  sessionsScheduled: number;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    title: string | null;
    orgName: string | null;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  matchId: string | null;
  status: string;
  amount: number;
  currency: string;
  description: string;
  lineItems: { description: string; qty: number; unitPrice: number; total: number }[] | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface Props {
  coach: Coach;
  matches: Match[];
  invoices: Invoice[];
}

/* ── Constants ────────────────────────────────────────────────────────── */

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "vetting", label: "Vetting", icon: ShieldCheck },
  { key: "clients", label: "Clients", icon: Users },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "invoices", label: "Invoices", icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PROGRAMME_LABELS: Record<string, string> = {
  standard_6_month: "Standard (6 months)",
  intensive_3_month: "Intensive (3 months)",
  extended_12_month: "Extended (12 months)",
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_MATCH: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  MATCHED: { bg: "#DBEAFE", text: "#1E40AF", label: "Matched" },
  ACTIVE: { bg: "#D1FAE5", text: "#065F46", label: "Active" },
  PAUSED: { bg: "#FEF3C7", text: "#92400E", label: "Paused" },
  COMPLETED: { bg: "#E0E7FF", text: "#3730A3", label: "Completed" },
  CANCELLED: { bg: "#F3F4F6", text: "#6B7280", label: "Cancelled" },
};

const INVOICE_BADGES: Record<string, { bg: string; text: string; label: string; strike?: boolean }> = {
  DRAFT: { bg: "#F3F4F6", text: "#6B7280", label: "Draft" },
  SENT: { bg: "#DBEAFE", text: "#1E40AF", label: "Sent" },
  PAID: { bg: "#D1FAE5", text: "#065F46", label: "Paid" },
  OVERDUE: { bg: "#FEE2E2", text: "#991B1B", label: "Overdue" },
  CANCELLED: { bg: "#F3F4F6", text: "#9CA3AF", label: "Cancelled", strike: true },
};

const VETTING_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  APPLIED: { bg: "#FEF3C7", text: "#92400E", label: "Applied" },
  UNDER_REVIEW: { bg: "#DBEAFE", text: "#1E40AF", label: "Under Review" },
  INTERVIEW_SCHEDULED: { bg: "#E0E7FF", text: "#3730A3", label: "Interview Scheduled" },
  APPROVED: { bg: "#D1FAE5", text: "#065F46", label: "Approved" },
  REJECTED: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
};

/* ── Helper Components ────────────────────────────────────────────────── */

function Badge({ bg, text, label, strike }: { bg: string; text: string; label: string; strike?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${strike ? "line-through" : ""}`}
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ background: "#F1F5F9", color: "#334155" }}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ background: "#F8F4EF" }}
        >
          <Icon size={18} style={{ color: "#D4A574" }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: "#64748B" }}>
            {label}
          </p>
          <p className="text-xl font-bold truncate" style={{ color: "#0F2744" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium" style={{ color: "#334155" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow focus:ring-2"
        style={{
          border: "1px solid #e5eaf0",
          color: "#0F2744",
          background: "#fff",
        }}
      />
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium" style={{ color: "#334155" }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow focus:ring-2 resize-none"
        style={{
          border: "1px solid #e5eaf0",
          color: "#0F2744",
          background: "#fff",
        }}
      />
    </label>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatFocusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ── Main Component ───────────────────────────────────────────────────── */

export default function MaarovaCoachDetail({ coach, matches, invoices }: Props) {
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // Global feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: coach.name,
    email: coach.email,
    title: coach.title,
    bio: coach.bio,
    country: coach.country,
    city: coach.city ?? "",
    yearsExperience: String(coach.yearsExperience),
    maxClients: String(coach.maxClients),
    languages: coach.languages.join(", "),
    timezone: coach.timezone,
    healthcareExperience: coach.healthcareExperience,
    specialisms: coach.specialisms.join(", "),
    certifications: coach.certifications.join(", "),
    developmentFocus: coach.developmentFocus.join(", "),
    hourlyRate: coach.hourlyRate ? String(coach.hourlyRate) : "",
    currency: coach.currency,
  });

  // Vetting actions
  const [vettingAction, setVettingAction] = useState<string | null>(null);
  const [vettingLoading, setVettingLoading] = useState(false);
  const [vetNotes, setVetNotes] = useState("");
  const [interviewDateInput, setInterviewDateInput] = useState("");
  const [interviewScoreInput, setInterviewScoreInput] = useState("");

  // Portal enable
  const [portalLoading, setPortalLoading] = useState(false);

  // Invoice creation
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    matchId: "",
    description: "",
    currency: coach.currency,
    dueAt: "",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<{ description: string; qty: string; unitPrice: string }[]>([
    { description: "", qty: "1", unitPrice: "" },
  ]);

  // Invoice actions
  const [invoiceActionLoading, setInvoiceActionLoading] = useState<string | null>(null);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /* ── Profile Edit ───────────────────────────────────────────────────── */

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/coaches/${coach.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          title: editForm.title.trim(),
          bio: editForm.bio.trim(),
          country: editForm.country.trim(),
          city: editForm.city.trim() || null,
          yearsExperience: parseInt(editForm.yearsExperience, 10) || 0,
          maxClients: parseInt(editForm.maxClients, 10) || 8,
          languages: editForm.languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
          timezone: editForm.timezone.trim(),
          healthcareExperience: editForm.healthcareExperience,
          specialisms: editForm.specialisms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          certifications: editForm.certifications
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          developmentFocus: editForm.developmentFocus
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : null,
          currency: editForm.currency.trim(),
        }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        throw new Error(msg || "Failed to update coach");
      }

      setSuccess("Coach profile updated.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      console.error("Coach update failed:", err);
      setError("Unable to update the coach profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Portal Enable ──────────────────────────────────────────────────── */

  async function handleEnablePortal() {
    setPortalLoading(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/coaches/${coach.id}/enable`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await parseApiError(res)) || "Failed to enable portal");

      setSuccess("Portal enabled and credentials sent.");
      router.refresh();
    } catch (err) {
      console.error("Portal enable failed:", err);
      setError("Unable to enable the coach portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  /* ── Vetting Actions ────────────────────────────────────────────────── */

  async function handleVettingAction(action: string) {
    setVettingLoading(true);
    clearFeedback();

    try {
      const payload: Record<string, unknown> = { action };
      if (vetNotes.trim()) payload.notes = vetNotes.trim();
      if (action === "schedule_interview" && interviewDateInput) {
        payload.interviewDate = new Date(interviewDateInput).toISOString();
      }
      if (action === "approve" && interviewScoreInput) {
        payload.interviewScore = parseInt(interviewScoreInput, 10);
      }

      const res = await fetch(`/api/maarova/admin/coaches/${coach.id}/vet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update vetting status");
      }

      const data = await res.json();
      setSuccess(data.message || "Vetting status updated.");
      setVettingAction(null);
      setVetNotes("");
      setInterviewDateInput("");
      setInterviewScoreInput("");
      router.refresh();
    } catch (err) {
      console.error("Vetting action failed:", err);
      setError("Unable to update the vetting status. Please try again.");
    } finally {
      setVettingLoading(false);
    }
  }

  /* ── Invoice Create ─────────────────────────────────────────────────── */

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setInvoiceLoading(true);
    clearFeedback();

    const computedItems = lineItems
      .filter((li) => li.description.trim() && li.unitPrice)
      .map((li) => ({
        description: li.description.trim(),
        qty: parseInt(li.qty, 10) || 1,
        unitPrice: parseFloat(li.unitPrice) || 0,
        total: (parseInt(li.qty, 10) || 1) * (parseFloat(li.unitPrice) || 0),
      }));

    const totalAmount = computedItems.reduce((sum, li) => sum + li.total, 0);

    try {
      const res = await fetch(`/api/maarova/admin/coaches/${coach.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: invoiceForm.matchId || null,
          description: invoiceForm.description.trim(),
          amount: totalAmount,
          currency: invoiceForm.currency || coach.currency,
          lineItems: computedItems,
          dueAt: invoiceForm.dueAt ? new Date(invoiceForm.dueAt).toISOString() : null,
          notes: invoiceForm.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        throw new Error(msg || "Failed to create invoice");
      }

      setSuccess("Invoice created.");
      setShowInvoiceForm(false);
      setInvoiceForm({ matchId: "", description: "", currency: coach.currency, dueAt: "", notes: "" });
      setLineItems([{ description: "", qty: "1", unitPrice: "" }]);
      router.refresh();
    } catch (err) {
      console.error("Invoice create failed:", err);
      setError("Unable to create the invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  }

  /* ── Invoice Status Actions ─────────────────────────────────────────── */

  async function handleInvoiceAction(invoiceId: string, action: string) {
    setInvoiceActionLoading(invoiceId);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/coaches/${coach.id}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        throw new Error(msg || "Failed to update invoice");
      }

      setSuccess(`Invoice ${action === "send" ? "sent" : action === "mark_paid" ? "marked as paid" : "cancelled"}.`);
      router.refresh();
    } catch (err) {
      console.error("Invoice action failed:", err);
      setError("Unable to update the invoice. Please try again.");
    } finally {
      setInvoiceActionLoading(null);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  const capacityPct = coach.maxClients > 0 ? Math.round((coach.activeClients / coach.maxClients) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Feedback */}
      <div className="px-4 sm:px-6 pt-4 space-y-2">
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ background: "#FEE2E2", color: "#991B1B" }}
          >
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1 min-w-0">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ background: "#D1FAE5", color: "#065F46" }}
          >
            <CheckCircle size={16} className="shrink-0" />
            <span className="flex-1 min-w-0">{success}</span>
            <button onClick={() => setSuccess(null)} className="shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div
        ref={tabsRef}
        className="flex overflow-x-auto px-4 sm:px-6 pt-4 gap-1 no-scrollbar"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg shrink-0"
              style={{
                color: isActive ? "#0F2744" : "#94A3B8",
                borderBottom: isActive ? "2px solid #D4A574" : "2px solid transparent",
                background: isActive ? "#FAFBFC" : "transparent",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "profile" && renderProfile()}
        {activeTab === "vetting" && renderVetting()}
        {activeTab === "clients" && renderClients()}
        {activeTab === "performance" && renderPerformance()}
        {activeTab === "invoices" && renderInvoices()}
      </div>
    </div>
  );

  /* ── Profile Tab ────────────────────────────────────────────────────── */

  function renderProfile() {
    if (editing) return renderEditForm();

    return (
      <div className="space-y-5">
        {/* Coach Info Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div
            className="h-20 sm:h-24"
            style={{
              background: "linear-gradient(135deg, #0F2744 0%, #1a3a5c 100%)",
            }}
          />
          <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg shrink-0"
                style={{
                  background: "linear-gradient(135deg, #D4A574 0%, #C4956A 100%)",
                  color: "#fff",
                  border: "3px solid #fff",
                }}
              >
                {getInitials(coach.name)}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: "#0F2744" }}>
                  {coach.name}
                </h2>
                <p className="text-sm truncate" style={{ color: "#64748B" }}>
                  {coach.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge {...(VETTING_BADGES[coach.vettingStatus] ?? { bg: "#F3F4F6", text: "#6B7280", label: coach.vettingStatus })} />
                  {coach.isActive && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#065F46" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Active
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90 shrink-0 self-start sm:self-end"
                style={{ background: "#0F2744", color: "#fff" }}
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            </div>

            {/* Bio */}
            {coach.bio && (
              <p className="text-sm mt-4 leading-relaxed" style={{ color: "#475569" }}>
                {coach.bio}
              </p>
            )}

            {/* Email */}
            <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: "#64748B" }}>
              <Mail size={14} className="shrink-0" />
              <a href={`mailto:${coach.email}`} className="hover:underline truncate">
                {coach.email}
              </a>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div
          className="rounded-xl"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div
            className="px-4 sm:px-6 py-3.5"
            style={{ borderBottom: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Details
            </h3>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow icon={MapPin} label="Location" value={[coach.city, coach.country].filter(Boolean).join(", ")} />
            <DetailRow icon={Clock} label="Years Experience" value={String(coach.yearsExperience)} />
            <DetailRow icon={Globe} label="Languages">
              <div className="flex flex-wrap gap-1.5">
                {coach.languages.map((l) => (
                  <Tag key={l}>{l}</Tag>
                ))}
              </div>
            </DetailRow>
            <DetailRow icon={Clock} label="Timezone" value={coach.timezone} />
            <DetailRow icon={Heart} label="Healthcare Experience">
              <Badge
                bg={coach.healthcareExperience ? "#D1FAE5" : "#FEE2E2"}
                text={coach.healthcareExperience ? "#065F46" : "#991B1B"}
                label={coach.healthcareExperience ? "Yes" : "No"}
              />
            </DetailRow>
            <DetailRow icon={Award} label="Certifications">
              <div className="flex flex-wrap gap-1.5">
                {coach.certifications.length > 0
                  ? coach.certifications.map((c) => <Tag key={c}>{c}</Tag>)
                  : <span className="text-xs" style={{ color: "#94A3B8" }}>None listed</span>}
              </div>
            </DetailRow>
            <DetailRow icon={Star} label="Specialisms">
              <div className="flex flex-wrap gap-1.5">
                {coach.specialisms.length > 0
                  ? coach.specialisms.map((s) => <Tag key={s}>{s}</Tag>)
                  : <span className="text-xs" style={{ color: "#94A3B8" }}>None listed</span>}
              </div>
            </DetailRow>
            <DetailRow icon={BarChart3} label="Development Focus">
              <div className="flex flex-wrap gap-1.5">
                {coach.developmentFocus.length > 0
                  ? coach.developmentFocus.map((d) => <Tag key={d}>{formatFocusLabel(d)}</Tag>)
                  : <span className="text-xs" style={{ color: "#94A3B8" }}>None listed</span>}
              </div>
            </DetailRow>
          </div>
        </div>

        {/* Capacity and Financial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Capacity */}
          <div
            className="rounded-xl p-4 sm:p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Client Capacity
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {coach.activeClients}
              </span>
              <span className="text-sm" style={{ color: "#94A3B8" }}>
                / {coach.maxClients} clients
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(capacityPct, 100)}%`,
                  background:
                    capacityPct >= 90
                      ? "#EF4444"
                      : capacityPct >= 70
                        ? "#F59E0B"
                        : "#D4A574",
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>
              {capacityPct}% utilisation
            </p>
          </div>

          {/* Financial */}
          <div
            className="rounded-xl p-4 sm:p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Financial
            </h3>
            {coach.hourlyRate ? (
              <>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                    {formatCurrency(coach.hourlyRate, coach.currency)}
                  </span>
                  <span className="text-sm" style={{ color: "#94A3B8" }}>/ hour</span>
                </div>
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Currency: {coach.currency}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "#94A3B8" }}>
                No rate set
              </p>
            )}
          </div>
        </div>

        {/* Portal Status */}
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Coach Portal Access
              </h3>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                {coach.isPortalEnabled
                  ? `Portal enabled. Last login: ${coach.lastLoginAt ? formatDate(coach.lastLoginAt) : "Never"}`
                  : "Portal not yet enabled for this coach."}
              </p>
            </div>
            {!coach.isPortalEnabled && (
              <button
                onClick={handleEnablePortal}
                disabled={portalLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{ background: "#D4A574", color: "#fff" }}
              >
                {portalLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Enable Portal
              </button>
            )}
            {coach.isPortalEnabled && (
              <Badge bg="#D1FAE5" text="#065F46" label="Enabled" />
            )}
          </div>
        </div>
      </div>
    );
  }

  function DetailRow({
    icon: Icon,
    label,
    value,
    children,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string;
    children?: React.ReactNode;
  }) {
    return (
      <div className="flex gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
          style={{ background: "#F8F4EF" }}
        >
          <Icon size={14} style={{ color: "#D4A574" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>
            {label}
          </p>
          {value ? (
            <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
              {value}
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }

  /* ── Edit Form ──────────────────────────────────────────────────────── */

  function renderEditForm() {
    return (
      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div
          className="rounded-xl"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div
            className="px-4 sm:px-6 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Edit Coach Profile
            </h3>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: "#64748B" }}
            >
              <X size={13} /> Cancel
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Full Name *"
                value={editForm.name}
                onChange={(v) => setEditForm({ ...editForm, name: v })}
                required
              />
              <FormInput
                label="Email *"
                value={editForm.email}
                onChange={(v) => setEditForm({ ...editForm, email: v })}
                type="email"
                required
              />
              <FormInput
                label="Title *"
                value={editForm.title}
                onChange={(v) => setEditForm({ ...editForm, title: v })}
                required
              />
              <FormInput
                label="Country *"
                value={editForm.country}
                onChange={(v) => setEditForm({ ...editForm, country: v })}
                required
              />
              <FormInput
                label="City"
                value={editForm.city}
                onChange={(v) => setEditForm({ ...editForm, city: v })}
              />
              <FormInput
                label="Years Experience"
                value={editForm.yearsExperience}
                onChange={(v) => setEditForm({ ...editForm, yearsExperience: v })}
                type="number"
                min={0}
              />
              <FormInput
                label="Max Clients"
                value={editForm.maxClients}
                onChange={(v) => setEditForm({ ...editForm, maxClients: v })}
                type="number"
                min={1}
              />
              <FormInput
                label="Timezone"
                value={editForm.timezone}
                onChange={(v) => setEditForm({ ...editForm, timezone: v })}
              />
              <FormInput
                label="Languages (comma separated)"
                value={editForm.languages}
                onChange={(v) => setEditForm({ ...editForm, languages: v })}
              />
              <FormInput
                label="Hourly Rate"
                value={editForm.hourlyRate}
                onChange={(v) => setEditForm({ ...editForm, hourlyRate: v })}
                type="number"
                min={0}
              />
              <FormInput
                label="Currency"
                value={editForm.currency}
                onChange={(v) => setEditForm({ ...editForm, currency: v })}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={editForm.healthcareExperience}
                  onChange={(e) => setEditForm({ ...editForm, healthcareExperience: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Healthcare Experience
              </label>
            </div>

            <FormTextarea
              label="Bio"
              value={editForm.bio}
              onChange={(v) => setEditForm({ ...editForm, bio: v })}
              rows={4}
            />
            <FormInput
              label="Specialisms (comma separated)"
              value={editForm.specialisms}
              onChange={(v) => setEditForm({ ...editForm, specialisms: v })}
            />
            <FormInput
              label="Certifications (comma separated)"
              value={editForm.certifications}
              onChange={(v) => setEditForm({ ...editForm, certifications: v })}
            />
            <FormInput
              label="Development Focus (comma separated)"
              value={editForm.developmentFocus}
              onChange={(v) => setEditForm({ ...editForm, developmentFocus: v })}
              placeholder="e.g. emotional_intelligence, strategic_thinking"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: "#64748B", border: "1px solid #e5eaf0" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ background: "#0F2744", color: "#fff" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  /* ── Vetting Tab ────────────────────────────────────────────────────── */

  function renderVetting() {
    const status = coach.vettingStatus;
    const badge = VETTING_BADGES[status] ?? { bg: "#F3F4F6", text: "#6B7280", label: status };

    const stages = [
      {
        key: "APPLIED",
        label: "Applied",
        date: coach.applicationDate || coach.createdAt,
        reached: true,
      },
      {
        key: "UNDER_REVIEW",
        label: "Under Review",
        date: status === "UNDER_REVIEW" || ["INTERVIEW_SCHEDULED", "APPROVED", "REJECTED"].includes(status) ? coach.updatedAt : null,
        reached: ["UNDER_REVIEW", "INTERVIEW_SCHEDULED", "APPROVED", "REJECTED"].includes(status),
      },
      {
        key: "INTERVIEW_SCHEDULED",
        label: "Interview Scheduled",
        date: coach.interviewDate,
        reached: ["INTERVIEW_SCHEDULED", "APPROVED", "REJECTED"].includes(status),
        extra: coach.interviewDate ? `Interview: ${formatDate(coach.interviewDate)}` : null,
      },
      {
        key: status === "REJECTED" ? "REJECTED" : "APPROVED",
        label: status === "REJECTED" ? "Rejected" : "Approved",
        date: status === "APPROVED" || status === "REJECTED" ? coach.updatedAt : null,
        reached: status === "APPROVED" || status === "REJECTED",
        extra:
          status === "APPROVED" && coach.interviewScore
            ? `Score: ${coach.interviewScore}/100`
            : null,
      },
    ];

    return (
      <div className="space-y-5">
        {/* Current Status */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>
                Current Vetting Status
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
                {coach.interviewScore && status === "APPROVED" && (
                  <span className="text-sm font-medium" style={{ color: "#64748B" }}>
                    Score: {coach.interviewScore}/100
                  </span>
                )}
              </div>
            </div>
            {status === "APPROVED" && (
              <div className="flex items-center gap-2">
                <CheckCircle size={20} style={{ color: "#10B981" }} />
                <span className="text-sm font-medium" style={{ color: "#065F46" }}>
                  Coach is approved and ready for matching
                </span>
              </div>
            )}
            {status === "REJECTED" && (
              <div className="flex items-center gap-2">
                <XCircle size={20} style={{ color: "#EF4444" }} />
                <span className="text-sm font-medium" style={{ color: "#991B1B" }}>
                  Application rejected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <h3 className="text-sm font-semibold mb-5" style={{ color: "#0F2744" }}>
            Vetting Timeline
          </h3>
          <div className="relative pl-6 sm:pl-8">
            {/* Vertical line */}
            <div
              className="absolute left-2.5 sm:left-3.5 top-1 bottom-1 w-px"
              style={{ background: "#e5eaf0" }}
            />
            <div className="space-y-6">
              {stages.map((stage, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div
                    className="absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: stage.reached
                        ? stage.key === "REJECTED"
                          ? "#FEE2E2"
                          : "#D1FAE5"
                        : "#F1F5F9",
                      border: `2px solid ${stage.reached ? (stage.key === "REJECTED" ? "#EF4444" : "#10B981") : "#CBD5E1"}`,
                    }}
                  >
                    {stage.reached && stage.key !== "REJECTED" && (
                      <CheckCircle size={12} style={{ color: "#10B981" }} />
                    )}
                    {stage.reached && stage.key === "REJECTED" && (
                      <XCircle size={12} style={{ color: "#EF4444" }} />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: stage.reached ? "#0F2744" : "#94A3B8" }}
                    >
                      {stage.label}
                    </p>
                    {stage.date && stage.reached && (
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                        {formatDate(stage.date)}
                      </p>
                    )}
                    {stage.extra && stage.reached && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: "#D4A574" }}>
                        {stage.extra}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rejection Notes */}
        {status === "REJECTED" && coach.vetNotes && (
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#991B1B" }}>
              Rejection Notes
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#7F1D1D" }}>
              {coach.vetNotes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {status !== "APPROVED" && status !== "REJECTED" && (
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Actions
            </h3>

            {status === "APPLIED" && !vettingAction && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleVettingAction("review")}
                  disabled={vettingLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {vettingLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  Start Review
                </button>
                <button
                  onClick={() => setVettingAction("reject")}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            )}

            {status === "UNDER_REVIEW" && !vettingAction && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setVettingAction("schedule_interview")}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  <Calendar size={14} />
                  Schedule Interview
                </button>
                <button
                  onClick={() => setVettingAction("reject")}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            )}

            {status === "INTERVIEW_SCHEDULED" && !vettingAction && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setVettingAction("approve")}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: "#D1FAE5", color: "#065F46" }}
                >
                  <CheckCircle size={14} />
                  Approve Coach
                </button>
                <button
                  onClick={() => setVettingAction("reject")}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            )}

            {/* Schedule Interview Form */}
            {vettingAction === "schedule_interview" && (
              <div className="space-y-4">
                <FormInput
                  label="Interview Date and Time *"
                  value={interviewDateInput}
                  onChange={setInterviewDateInput}
                  type="datetime-local"
                  required
                />
                <FormTextarea
                  label="Notes (optional)"
                  value={vetNotes}
                  onChange={setVetNotes}
                  placeholder="Any notes about the interview scheduling..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVettingAction("schedule_interview")}
                    disabled={vettingLoading || !interviewDateInput}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#0F2744", color: "#fff" }}
                  >
                    {vettingLoading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                    Confirm Schedule
                  </button>
                  <button
                    onClick={() => { setVettingAction(null); setInterviewDateInput(""); setVetNotes(""); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    style={{ color: "#64748B", border: "1px solid #e5eaf0" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Approve Form */}
            {vettingAction === "approve" && (
              <div className="space-y-4">
                <FormInput
                  label="Interview Score (1 to 100) *"
                  value={interviewScoreInput}
                  onChange={setInterviewScoreInput}
                  type="number"
                  min={1}
                  max={100}
                  required
                />
                <FormTextarea
                  label="Notes (optional)"
                  value={vetNotes}
                  onChange={setVetNotes}
                  placeholder="Assessment notes, strengths, areas of expertise..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVettingAction("approve")}
                    disabled={vettingLoading || !interviewScoreInput}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#D1FAE5", color: "#065F46" }}
                  >
                    {vettingLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => { setVettingAction(null); setInterviewScoreInput(""); setVetNotes(""); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    style={{ color: "#64748B", border: "1px solid #e5eaf0" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reject Form */}
            {vettingAction === "reject" && (
              <div className="space-y-4">
                <FormTextarea
                  label="Rejection Notes *"
                  value={vetNotes}
                  onChange={setVetNotes}
                  rows={4}
                  placeholder="Please provide a reason for rejecting this coach application..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVettingAction("reject")}
                    disabled={vettingLoading || !vetNotes.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#FEE2E2", color: "#991B1B" }}
                  >
                    {vettingLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => { setVettingAction(null); setVetNotes(""); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    style={{ color: "#64748B", border: "1px solid #e5eaf0" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vet Notes (if any, shown when approved) */}
        {status === "APPROVED" && coach.vetNotes && (
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#065F46" }}>
              Vetting Notes
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#14532D" }}>
              {coach.vetNotes}
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── Clients Tab ────────────────────────────────────────────────────── */

  function renderClients() {
    if (matches.length === 0) {
      return (
        <div
          className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "#F8F4EF" }}
          >
            <Users size={24} style={{ color: "#D4A574" }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#0F2744" }}>
            No clients matched yet
          </h3>
          <p className="text-xs max-w-xs" style={{ color: "#94A3B8" }}>
            When this coach is matched with clients, they will appear here with session progress and engagement details.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {matches.map((m) => {
          const statusBadge = STATUS_BADGES[m.status] ?? { bg: "#F3F4F6", text: "#6B7280", label: m.status };
          const totalSessions = m.sessionsScheduled || 12;
          const sessionPct = totalSessions > 0 ? Math.round((m.sessionsCompleted / totalSessions) * 100) : 0;

          return (
            <div
              key={m.id}
              className="rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold truncate" style={{ color: "#0F2744" }}>
                      {m.user.name}
                    </h4>
                    <Badge {...statusBadge} />
                  </div>
                  {m.user.title && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>
                      {m.user.title}
                    </p>
                  )}
                  {m.user.orgName && (
                    <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                      {m.user.orgName}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    {PROGRAMME_LABELS[m.programme] ?? m.programme}
                    {m.startDate && ` | Started ${formatDate(m.startDate)}`}
                  </p>
                </div>

                {/* Sessions Progress */}
                <div className="sm:text-right shrink-0 min-w-[120px]">
                  <p className="text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>
                    Sessions: {m.sessionsCompleted}/{totalSessions}
                  </p>
                  <div
                    className="w-full sm:w-28 h-2 rounded-full overflow-hidden"
                    style={{ background: "#F1F5F9" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(sessionPct, 100)}%`,
                        background: "#D4A574",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    {sessionPct}% complete
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Performance Tab ────────────────────────────────────────────────── */

  function renderPerformance() {
    const hasData = coach.totalSessions > 0 || coach.completedEngagements > 0 || coach.avgSessionRating;

    if (!hasData) {
      return (
        <div
          className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "#F8F4EF" }}
          >
            <BarChart3 size={24} style={{ color: "#D4A574" }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#0F2744" }}>
            No performance data yet
          </h3>
          <p className="text-xs max-w-xs" style={{ color: "#94A3B8" }}>
            Performance metrics will appear here once the coach begins conducting sessions and completing engagements.
          </p>
        </div>
      );
    }

    const rating = coach.avgSessionRating ?? 0;
    const fullStars = Math.round(rating);

    return (
      <div className="space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Sessions"
            value={coach.totalSessions}
            icon={Calendar}
          />
          <StatCard
            label="Avg Rating"
            value={rating ? rating.toFixed(1) : "N/A"}
            sub="out of 5.0"
            icon={Star}
          />
          <StatCard
            label="Completed"
            value={coach.completedEngagements}
            sub="engagements"
            icon={CheckCircle}
          />
          <StatCard
            label="Active Clients"
            value={coach.activeClients}
            sub={`of ${coach.maxClients} capacity`}
            icon={Users}
          />
        </div>

        {/* Rating Display */}
        {rating > 0 && (
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Client Satisfaction Rating
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-bold" style={{ color: "#0F2744" }}>
                {rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      fill={i < fullStars ? "#D4A574" : "none"}
                      stroke={i < fullStars ? "#D4A574" : "#CBD5E1"}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                  Based on {coach.totalSessions} session{coach.totalSessions !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Summary */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
            Engagement Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ background: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {matches.filter((m) => m.status === "ACTIVE").length}
              </p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Active Engagements</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {matches.filter((m) => m.status === "COMPLETED").length}
              </p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {matches.reduce((sum, m) => sum + m.sessionsCompleted, 0)}
              </p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Total Sessions Delivered</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Invoices Tab ───────────────────────────────────────────────────── */

  function renderInvoices() {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Invoices ({invoices.length})
          </h3>
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90 shrink-0"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <Plus size={13} />
            Create Invoice
          </button>
        </div>

        {/* Invoice Form */}
        {showInvoiceForm && (
          <div
            className="rounded-xl"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <div
              className="px-4 sm:px-6 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid #e5eaf0" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                New Invoice
              </h3>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X size={14} style={{ color: "#64748B" }} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium" style={{ color: "#334155" }}>
                    Client (optional)
                  </span>
                  <select
                    value={invoiceForm.matchId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, matchId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #e5eaf0", color: "#0F2744", background: "#fff" }}
                  >
                    <option value="">No specific client</option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.user.name} ({PROGRAMME_LABELS[m.programme] ?? m.programme})
                      </option>
                    ))}
                  </select>
                </label>
                <FormInput
                  label="Currency"
                  value={invoiceForm.currency}
                  onChange={(v) => setInvoiceForm({ ...invoiceForm, currency: v })}
                />
                <FormInput
                  label="Due Date"
                  value={invoiceForm.dueAt}
                  onChange={(v) => setInvoiceForm({ ...invoiceForm, dueAt: v })}
                  type="date"
                />
              </div>

              <FormTextarea
                label="Description *"
                value={invoiceForm.description}
                onChange={(v) => setInvoiceForm({ ...invoiceForm, description: v })}
                placeholder="Coaching services for Q1 2026..."
              />

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "#334155" }}>
                    Line Items
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLineItems([...lineItems, { description: "", qty: "1", unitPrice: "" }])
                    }
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    style={{ color: "#D4A574" }}
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Header row (desktop) */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_80px_120px_40px] gap-2 text-xs font-medium" style={{ color: "#94A3B8" }}>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span />
                  </div>
                  {lineItems.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_40px] gap-2">
                      <input
                        value={li.description}
                        onChange={(e) => {
                          const items = [...lineItems];
                          items[idx] = { ...items[idx], description: e.target.value };
                          setLineItems(items);
                        }}
                        placeholder="Description"
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
                      />
                      <input
                        value={li.qty}
                        onChange={(e) => {
                          const items = [...lineItems];
                          items[idx] = { ...items[idx], qty: e.target.value };
                          setLineItems(items);
                        }}
                        placeholder="Qty"
                        type="number"
                        min={1}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
                      />
                      <input
                        value={li.unitPrice}
                        onChange={(e) => {
                          const items = [...lineItems];
                          items[idx] = { ...items[idx], unitPrice: e.target.value };
                          setLineItems(items);
                        }}
                        placeholder="Unit price"
                        type="number"
                        min={0}
                        step="0.01"
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
                      />
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <X size={14} style={{ color: "#94A3B8" }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end mt-3">
                  <div className="text-right">
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Total: </span>
                    <span className="text-sm font-bold" style={{ color: "#0F2744" }}>
                      {formatCurrency(
                        lineItems.reduce(
                          (sum, li) => sum + (parseInt(li.qty, 10) || 0) * (parseFloat(li.unitPrice) || 0),
                          0,
                        ),
                        invoiceForm.currency || coach.currency,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <FormTextarea
                label="Notes (optional)"
                value={invoiceForm.notes}
                onChange={(v) => setInvoiceForm({ ...invoiceForm, notes: v })}
                rows={2}
                placeholder="Payment terms, bank details, etc."
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                  style={{ color: "#64748B", border: "1px solid #e5eaf0" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceLoading || !invoiceForm.description.trim() || lineItems.every((li) => !li.unitPrice)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {invoiceLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoice List */}
        {invoices.length === 0 && !showInvoiceForm ? (
          <div
            className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "#F8F4EF" }}
            >
              <FileText size={24} style={{ color: "#D4A574" }} />
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "#0F2744" }}>
              No invoices yet
            </h3>
            <p className="text-xs max-w-xs" style={{ color: "#94A3B8" }}>
              Create an invoice to track payments for this coach's services.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const badge = INVOICE_BADGES[inv.status] ?? { bg: "#F3F4F6", text: "#6B7280", label: inv.status };
              return (
                <div
                  key={inv.id}
                  className="rounded-xl p-4 sm:p-5"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                          {inv.invoiceNumber}
                        </span>
                        <Badge {...badge} strike={badge.strike} />
                      </div>
                      <p className="text-xs mt-1 truncate" style={{ color: "#64748B" }}>
                        {inv.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "#94A3B8" }}>
                        {inv.issuedAt && <span>Issued: {formatDate(inv.issuedAt)}</span>}
                        {inv.dueAt && <span>Due: {formatDate(inv.dueAt)}</span>}
                        {inv.paidAt && <span>Paid: {formatDate(inv.paidAt)}</span>}
                        {!inv.issuedAt && <span>Created: {formatDate(inv.createdAt)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span className="text-lg font-bold" style={{ color: "#0F2744" }}>
                        {formatCurrency(inv.amount, inv.currency)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {inv.status === "DRAFT" && (
                          <button
                            onClick={() => handleInvoiceAction(inv.id, "send")}
                            disabled={invoiceActionLoading === inv.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ background: "#DBEAFE", color: "#1E40AF" }}
                          >
                            {invoiceActionLoading === inv.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            Send
                          </button>
                        )}
                        {inv.status === "SENT" && (
                          <button
                            onClick={() => handleInvoiceAction(inv.id, "mark_paid")}
                            disabled={invoiceActionLoading === inv.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ background: "#D1FAE5", color: "#065F46" }}
                          >
                            {invoiceActionLoading === inv.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CreditCard size={12} />
                            )}
                            Mark Paid
                          </button>
                        )}
                        {(inv.status === "DRAFT" || inv.status === "SENT") && (
                          <button
                            onClick={() => handleInvoiceAction(inv.id, "cancel")}
                            disabled={invoiceActionLoading === inv.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ background: "#FEE2E2", color: "#991B1B" }}
                          >
                            <Ban size={12} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
