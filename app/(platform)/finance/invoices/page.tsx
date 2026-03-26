"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import {
  Plus,
  Search,
  Send,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  currency: string;
  subtotal: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  issuedDate: string | null;
  dueDate: string | null;
  client: { id: string; name: string };
  engagement: { id: string; name: string } | null;
}

interface SummaryData {
  totalOutstanding: number;
  overdue: number;
  collectedThisMonth: number;
  draftsPending: number;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:            { bg: "#F3F4F6", color: "#6B7280" },
  PENDING_APPROVAL: { bg: "#FEF3C7", color: "#92400E" },
  SENT:             { bg: "#EFF6FF", color: "#1D4ED8" },
  VIEWED:           { bg: "#E0E7FF", color: "#3730A3" },
  PARTIALLY_PAID:   { bg: "#FEF9C3", color: "#854D0E" },
  PAID:             { bg: "#D1FAE5", color: "#065F46" },
  OVERDUE:          { bg: "#FEE2E2", color: "#991B1B" },
  DISPUTED:         { bg: "#FCE7F3", color: "#9D174D" },
  WRITTEN_OFF:      { bg: "#F3F4F6", color: "#9CA3AF" },
  CANCELLED:        { bg: "#F3F4F6", color: "#9CA3AF" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  SENT: "Sent",
  VIEWED: "Viewed",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  DISPUTED: "Disputed",
  WRITTEN_OFF: "Written Off",
  CANCELLED: "Cancelled",
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  PROFORMA: "Proforma",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
  MOBILIZATION: "Mobilization",
  MILESTONE: "Milestone",
  RETAINER: "Retainer",
  FINAL_SETTLEMENT: "Final Settlement",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);
const ALL_TYPES = Object.keys(TYPE_LABELS);
const PAGE_SIZE = 20;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatCurrency(amount: number, currency: string) {
  const sym = currency === "USD" ? "$" : "₦";
  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${sym}${(amount / 1_000).toFixed(0)}K`;
  return `${sym}${amount.toLocaleString()}`;
}

function formatFullCurrency(amount: number, currency: string) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d: string | null) {
  if (!d) return "--";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const diff = Date.now() - new Date(dueDate).getTime();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalOutstanding: 0, overdue: 0, collectedThisMonth: 0, draftsPending: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Bulk
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (currencyFilter) params.set("currency", currencyFilter);
      if (clientSearch) params.set("clientSearch", clientSearch);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/finance/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices ?? []);
        setTotalCount(data.totalCount ?? 0);
        setSummary(data.summary ?? { totalOutstanding: 0, overdue: 0, collectedThisMonth: 0, draftsPending: 0 });
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, currencyFilter, clientSearch, dateFrom, dateTo]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((i) => i.id)));
    }
  }

  function clearFilters() {
    setStatusFilter("");
    setTypeFilter("");
    setCurrencyFilter("");
    setClientSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hasActiveFilters = statusFilter || typeFilter || currencyFilter || clientSearch || dateFrom || dateTo;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Invoices"
        subtitle={`${totalCount} invoice${totalCount !== 1 ? "s" : ""}`}
        action={
          <Link
            href="/finance/invoices/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: "#0F2744" }}
          >
            <Plus size={15} />
            New Invoice
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl space-y-6">

          {/* ─── Summary Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Outstanding", value: summary.totalOutstanding, color: "#F59E0B", bgColor: "#FFFBEB" },
              { label: "Overdue", value: summary.overdue, color: "#EF4444", bgColor: "#FEF2F2" },
              { label: "Collected This Month", value: summary.collectedThisMonth, color: "#10B981", bgColor: "#ECFDF5" },
              { label: "Drafts Pending", value: summary.draftsPending, color: "#6B7280", bgColor: "#F9FAFB", isCount: true },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl p-4"
                style={{ background: card.bgColor, border: "1px solid #e5eaf0" }}
              >
                <p className="text-2xl font-bold" style={{ color: card.color }}>
                  {card.isCount ? card.value : formatCurrency(card.value, "NGN")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* ─── Filters ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex flex-wrap items-center gap-3 p-4">
              {/* Search */}
              <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by client name..."
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>

              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none"
              >
                <option value="">All Types</option>
                {ALL_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>

              {/* Currency */}
              <select
                value={currencyFilter}
                onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none"
              >
                <option value="">All Currencies</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>

              {/* Toggle extra filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: "#64748B" }}
              >
                <Filter size={14} />
                Dates
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-red-600 hover:bg-red-50"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ─── Bulk Actions ────────────────────────────────────────── */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid #e5eaf0", background: "#F8FAFC" }}>
                <span className="text-sm text-gray-600 font-medium">{selected.size} selected</span>
                <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <Send size={13} />
                  Send Selected
                </button>
                <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700">
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
            )}

            {/* ─── Table ───────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderTop: "1px solid #e5eaf0", borderBottom: "1px solid #e5eaf0" }}>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">
                      <input
                        type="checkbox"
                        checked={invoices.length > 0 && selected.size === invoices.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Issued</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Due</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading invoices...</td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        No invoices found. Create your first invoice to get started.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const overdueDays = daysOverdue(inv.dueDate);
                      const isOverdue = inv.status !== "PAID" && inv.status !== "CANCELLED" && inv.status !== "WRITTEN_OFF" && overdueDays > 0;
                      const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.DRAFT;

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          onClick={() => router.push(`/finance/invoices/${inv.id}`)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(inv.id)}
                              onChange={() => toggleSelect(inv.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/finance/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{inv.client.name}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                              {TYPE_LABELS[inv.invoiceType] ?? inv.invoiceType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>
                              {STATUS_LABELS[inv.status] ?? inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatFullCurrency(inv.total, inv.currency)}
                            {inv.balanceDue > 0 && inv.balanceDue < inv.total && (
                              <div className="text-xs text-gray-400">Bal: {formatFullCurrency(inv.balanceDue, inv.currency)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(inv.issuedDate)}</td>
                          <td className="px-4 py-3">
                            <span className="text-gray-500">{formatDate(inv.dueDate)}</span>
                            {isOverdue && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <AlertTriangle size={11} className="text-red-500" />
                                <span className="text-xs text-red-500 font-medium">{overdueDays}d overdue</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/finance/invoices/${inv.id}`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                title="View"
                              >
                                <Eye size={14} />
                              </Link>
                              {inv.status === "DRAFT" && (
                                <Link
                                  href={`/finance/invoices/${inv.id}/edit`}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                  title="Edit"
                                >
                                  <Send size={14} />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination ─────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #e5eaf0" }}>
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: page === p ? "#0F2744" : "transparent",
                          color: page === p ? "#fff" : "#64748B",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
