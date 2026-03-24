"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/platform/TopBar";
import {
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface AgingBucket {
  clientName: string;
  clientId: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

interface RevenueMonth {
  month: string;
  label: string;
  amount: number;
}

interface TopClient {
  clientName: string;
  revenue: number;
  invoiceCount: number;
}

interface MarginCard {
  engagementId: string;
  engagementName: string;
  clientName: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number;
}

interface ClientHistoryEntry {
  id: string;
  type: "invoice" | "payment";
  date: string;
  amount: number;
  currency: string;
  label: string;
  status: string;
}

interface ClientOption {
  id: string;
  name: string;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const TABS = [
  { key: "aging", label: "AR Aging", icon: Clock },
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "margins", label: "Margins", icon: BarChart3 },
  { key: "history", label: "Client History", icon: Users },
] as const;

type TabKey = typeof TABS[number]["key"];

const AGING_COLORS = {
  current: "#10B981",
  days1to30: "#84CC16",
  days31to60: "#F59E0B",
  days61to90: "#F97316",
  days90plus: "#EF4444",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtCurrency(amount: number, currency = "NGN") {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function fmtCompact(amount: number) {
  const sym = "₦";
  if (amount >= 1_000_000_000) return `${sym}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${sym}${(amount / 1_000).toFixed(0)}K`;
  return `${sym}${amount.toLocaleString()}`;
}

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("aging");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Financial Reports" subtitle="Analytics and insights" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl space-y-6">

          {/* ─── Tab Navigation ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1" style={{ border: "1px solid #e5eaf0" }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center"
                  style={{
                    background: active ? "#0F2744" : "transparent",
                    color: active ? "#fff" : "#64748B",
                  }}
                >
                  <tab.icon size={15} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ─── Tab Content ─────────────────────────────────────────── */}
          {activeTab === "aging" && <AgingTab />}
          {activeTab === "revenue" && <RevenueTab />}
          {activeTab === "margins" && <MarginsTab />}
          {activeTab === "history" && <ClientHistoryTab />}
        </div>
      </main>
    </div>
  );
}

/* ─── AR Aging Tab ────────────────────────────────────────────────────────── */

function AgingTab() {
  const [data, setData] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finance/reports/aging");
        if (res.ok) setData(await res.json());
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = data.reduce(
    (acc, b) => ({
      current: acc.current + b.current,
      days1to30: acc.days1to30 + b.days1to30,
      days31to60: acc.days31to60 + b.days31to60,
      days61to90: acc.days61to90 + b.days61to90,
      days90plus: acc.days90plus + b.days90plus,
      total: acc.total + b.total,
    }),
    { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 0 },
  );

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading aging data...</div>;

  const bucketLabels = [
    { key: "current" as const, label: "Current", color: AGING_COLORS.current },
    { key: "days1to30" as const, label: "1-30 days", color: AGING_COLORS.days1to30 },
    { key: "days31to60" as const, label: "31-60 days", color: AGING_COLORS.days31to60 },
    { key: "days61to90" as const, label: "61-90 days", color: AGING_COLORS.days61to90 },
    { key: "days90plus" as const, label: "90+ days", color: AGING_COLORS.days90plus },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {bucketLabels.map((b) => (
          <div key={b.key} className="bg-white rounded-xl p-4" style={{ border: "1px solid #e5eaf0" }}>
            <p className="text-lg font-bold" style={{ color: b.color }}>{fmtCompact(totals[b.key])}</p>
            <p className="text-xs text-gray-500 mt-0.5">{b.label}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-lg font-bold" style={{ color: "#0F2744" }}>{fmtCompact(totals.total)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total AR</p>
        </div>
      </div>

      {/* Client bars */}
      <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900">Aging by Client</h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-6 py-3 text-xs">
          {bucketLabels.map((b) => (
            <div key={b.key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: b.color }} />
              <span className="text-gray-500">{b.label}</span>
            </div>
          ))}
        </div>

        {data.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No outstanding invoices found</div>
        ) : (
          <div className="px-6 pb-4 space-y-4">
            {data.map((bucket) => {
              const maxVal = Math.max(...data.map((d) => d.total), 1);
              return (
                <div key={bucket.clientId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{bucket.clientName}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-2 shrink-0">{fmtCurrency(bucket.total)}</span>
                  </div>
                  <div className="flex h-6 rounded-md overflow-hidden bg-gray-100">
                    {bucketLabels.map((b) => {
                      const val = bucket[b.key];
                      if (val <= 0) return null;
                      const widthPct = (val / maxVal) * 100;
                      return (
                        <div
                          key={b.key}
                          className="h-full transition-all"
                          style={{ width: `${widthPct}%`, background: b.color }}
                          title={`${b.label}: ${fmtCurrency(val)}`}
                        />
                      );
                    })}
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

/* ─── Revenue Tab ─────────────────────────────────────────────────────────── */

function RevenueTab() {
  const [months, setMonths] = useState<RevenueMonth[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finance/reports/revenue");
        if (res.ok) {
          const data = await res.json();
          setMonths(data.months ?? []);
          setTopClients(data.topClients ?? []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading revenue data...</div>;

  const maxAmount = Math.max(...months.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Monthly Revenue (Last 12 Months)</h3>
        {months.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No revenue data available</div>
        ) : (
          <div className="flex items-end gap-2 sm:gap-3 h-48 sm:h-64">
            {months.map((m) => {
              const heightPct = (m.amount / maxAmount) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end">
                  <div className="text-xs font-medium text-gray-700 mb-1 hidden sm:block">
                    {fmtCompact(m.amount)}
                  </div>
                  <div
                    className="w-full rounded-t-md transition-all hover:opacity-80 cursor-default min-h-[4px]"
                    style={{
                      height: `${Math.max(heightPct, 2)}%`,
                      background: "linear-gradient(180deg, #D4AF37 0%, #0F2744 100%)",
                    }}
                    title={`${m.label}: ${fmtCurrency(m.amount)}`}
                  />
                  <div className="text-[10px] text-gray-400 mt-1.5 text-center">{m.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900">Top Clients by Revenue</h3>
        </div>
        {topClients.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No client revenue data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e5eaf0" }}>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Invoices</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-6 py-3 font-medium text-gray-800">{c.clientName}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{fmtCurrency(c.revenue)}</td>
                    <td className="px-6 py-3 text-right text-gray-500">{c.invoiceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Margins Tab ─────────────────────────────────────────────────────────── */

function MarginsTab() {
  const [data, setData] = useState<MarginCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finance/reports/margins");
        if (res.ok) setData(await res.json());
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading margin data...</div>;

  function healthColor(pct: number) {
    if (pct >= 40) return { bg: "#D1FAE5", color: "#065F46", label: "Healthy" };
    if (pct >= 20) return { bg: "#FEF3C7", color: "#92400E", label: "Watch" };
    return { bg: "#FEE2E2", color: "#991B1B", label: "At Risk" };
  }

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <div className="bg-white rounded-xl py-12 text-center text-gray-400 text-sm" style={{ border: "1px solid #e5eaf0" }}>
          No engagement margin data available
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((m) => {
            const h = healthColor(m.marginPct);
            return (
              <div key={m.engagementId} className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.engagementName}</p>
                    <p className="text-xs text-gray-400 truncate">{m.clientName}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2" style={{ background: h.bg, color: h.color }}>
                    {h.label}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Revenue</span>
                    <span className="text-gray-700 font-medium">{fmtCurrency(m.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cost</span>
                    <span className="text-gray-700">{fmtCurrency(m.cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                    <span className="text-gray-900">Margin</span>
                    <span style={{ color: h.color }}>{m.marginPct.toFixed(1)}%</span>
                  </div>
                  {/* Margin bar */}
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(Math.max(m.marginPct, 0), 100)}%`, background: h.color }}
                    />
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

/* ─── Client History Tab ──────────────────────────────────────────────────── */

function ClientHistoryTab() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [history, setHistory] = useState<ClientHistoryEntry[]>([]);
  const [stats, setStats] = useState({ avgDaysToPay: 0, lifetimeValue: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finance/clients");
        if (res.ok) setClients(await res.json());
      } catch {
        // silently handle
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedClient) { setHistory([]); return; }
    setLoading(true);
    async function load() {
      try {
        const res = await fetch(`/api/finance/reports/client-history?clientId=${selectedClient}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.entries ?? []);
          setStats(data.stats ?? { avgDaysToPay: 0, lifetimeValue: 0 });
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedClient]);

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    PAID:             { bg: "#D1FAE5", color: "#065F46" },
    SENT:             { bg: "#EFF6FF", color: "#1D4ED8" },
    OVERDUE:          { bg: "#FEE2E2", color: "#991B1B" },
    PARTIALLY_PAID:   { bg: "#FEF9C3", color: "#854D0E" },
    CONFIRMED:        { bg: "#D1FAE5", color: "#065F46" },
    PENDING:          { bg: "#FEF3C7", color: "#92400E" },
    DRAFT:            { bg: "#F3F4F6", color: "#6B7280" },
  };

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Choose a client...</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClient && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>{stats.avgDaysToPay} days</p>
              <p className="text-xs text-gray-500 mt-0.5">Average Days to Pay</p>
            </div>
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
              <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{fmtCurrency(stats.lifetimeValue)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Lifetime Value</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
              <h3 className="text-sm font-semibold text-gray-900">Invoice & Payment Timeline</h3>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No invoice or payment records found</div>
            ) : (
              <div className="p-6">
                <div className="space-y-3">
                  {history.map((entry) => {
                    const sc = STATUS_COLORS[entry.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg"
                        style={{ background: entry.type === "payment" ? "#F0FDF4" : "#F8FAFC" }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: entry.type === "payment" ? "#10B981" : "#D4AF37" }}
                          />
                          <span className="text-xs text-gray-400 w-20 shrink-0">{fmtDate(entry.date)}</span>
                        </div>
                        <span className="text-sm text-gray-800 flex-1">{entry.label}</span>
                        <span className="text-sm font-medium text-gray-900">{fmtCurrency(entry.amount, entry.currency)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>
                          {entry.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
