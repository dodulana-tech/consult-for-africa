import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import CreateInvoiceForm from "@/components/platform/CreateInvoiceForm";
import InvoiceStatusButton from "@/components/platform/InvoiceStatusButton";
import ClientContactsSection from "@/components/client-portal/ClientContactsSection";
import { formatCurrency, formatCompactCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FolderOpen,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const PROJECT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
};

const INVOICE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: "#F3F4F6", color: "#6B7280" },
  SENT:      { bg: "#EFF6FF", color: "#1D4ED8" },
  PAID:      { bg: "#D1FAE5", color: "#065F46" },
  OVERDUE:   { bg: "#FEE2E2", color: "#991B1B" },
  CANCELLED: { bg: "#F3F4F6", color: "#9CA3AF" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        include: {
          engagementManager: { select: { name: true } },
          _count: { select: { assignments: true, deliverables: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!client) notFound();

  const canManageInvoices = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const canEnablePortal = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"].includes(session.user.role);

  const totalRevenue = client.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.total), 0);
  const outstanding = client.invoices
    .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + Number(i.total), 0);
  const overdueAmount = client.invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={client.name}
        subtitle={client.primaryContact}
        backHref="/clients"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Overdue alert */}
          {overdueAmount > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
            >
              <AlertCircle size={16} />
              <span>
                {formatCompactCurrency(overdueAmount, client.currency)} in overdue invoices. Payment
                terms: {client.paymentTerms} days.
              </span>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total Collected",
                value: formatCompactCurrency(totalRevenue, client.currency),
                color: "#10B981",
              },
              {
                label: "Outstanding",
                value: formatCompactCurrency(outstanding, client.currency),
                color: outstanding > 0 ? "#F59E0B" : "#10B981",
              },
              {
                label: "Projects",
                value: client.projects.length,
                color: "#3B82F6",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 bg-white"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Client info */}
          <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400" />
                {client.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400" />
                {client.phone}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400" />
                {client.address}
              </span>
              <span className="flex items-center gap-2">
                <CreditCard size={13} className="text-gray-400" />
                {client.paymentTerms}-day payment terms &middot; {client.currency}
              </span>
            </div>
            {client.notes && (
              <p className="mt-3 text-xs text-gray-500 border-t pt-3" style={{ borderColor: "#e5eaf0" }}>
                {client.notes}
              </p>
            )}
          </div>

          {/* Contacts */}
          <ClientContactsSection
            clientId={client.id}
            contacts={client.contacts}
            canEnablePortal={canEnablePortal}
            canAdd={canEnablePortal}
          />

          {/* Projects */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FolderOpen size={15} />
              Projects ({client.projects.length})
            </h2>
            <div className="space-y-2">
              {client.projects.map((p) => {
                const statusStyle = PROJECT_STATUS_COLORS[p.status] ?? PROJECT_STATUS_COLORS.PLANNING;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white group hover:shadow-sm transition-shadow"
                    style={{ border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-[#0F2744]">
                          {p.name}
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={statusStyle}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        EM: {p.engagementManager.name} &middot; {p._count.assignments} consultant
                        {p._count.assignments !== 1 ? "s" : ""} &middot; {p._count.deliverables}{" "}
                        deliverable{p._count.deliverables !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 shrink-0">
                      {formatCompactCurrency(Number(p.budgetAmount), p.budgetCurrency)}
                    </p>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                );
              })}
              {client.projects.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No projects yet</p>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={15} />
              Invoices ({client.invoices.length})
            </h2>

            {canManageInvoices && (
              <div className="mb-3">
                <CreateInvoiceForm
                  clientId={client.id}
                  projects={client.projects.map((p) => ({ id: p.id, name: p.name }))}
                  defaultCurrency={client.currency}
                  paymentTerms={client.paymentTerms}
                />
              </div>
            )}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
              {client.invoices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No invoices yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b" style={{ borderColor: "#e5eaf0", background: "#F9FAFB" }}>
                      <th className="text-left px-4 py-2.5 font-medium">Invoice</th>
                      <th className="text-left px-4 py-2.5 font-medium">Amount</th>
                      <th className="text-left px-4 py-2.5 font-medium">Issued</th>
                      <th className="text-left px-4 py-2.5 font-medium">Due</th>
                      <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  {canManageInvoices && <th className="px-4 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y" style={{ borderColor: "#e5eaf0" }}>
                    {client.invoices.map((inv) => {
                      const invStyle = INVOICE_STATUS_COLORS[inv.status] ?? INVOICE_STATUS_COLORS.DRAFT;
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 font-semibold">
                            {formatCurrency(Number(inv.total), inv.currency)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {inv.issuedDate ? formatDate(new Date(inv.issuedDate)) : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {inv.dueDate ? formatDate(new Date(inv.dueDate)) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={invStyle}
                            >
                              {inv.status}
                            </span>
                          </td>
                          {canManageInvoices && (
                            <td className="px-4 py-3 text-right">
                              <InvoiceStatusButton invoiceId={inv.id} currentStatus={inv.status} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
