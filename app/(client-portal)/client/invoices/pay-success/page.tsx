import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import { Decimal } from "@prisma/client/runtime/library";
import { CheckCircle2, ArrowLeft, Download, FileText } from "lucide-react";

function formatCurrency(amount: Decimal | number, currency: string): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (currency === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string; reference?: string; trxref?: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { invoice: invoiceId, reference, trxref } = await searchParams;

  let invoice = null;
  if (invoiceId) {
    invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        clientId: true,
        invoiceNumber: true,
        total: true,
        balanceDue: true,
        paidAmount: true,
        currency: true,
        status: true,
      },
    });

    // Verify ownership
    if (invoice && invoice.clientId !== session.clientId) {
      invoice = null;
    }
  }

  // Find latest receipt if available
  let receiptUrl: string | null = null;
  if (invoice) {
    const latestPayment = await prisma.payment.findFirst({
      where: { invoiceId: invoice.id },
      orderBy: { createdAt: "desc" },
      select: { receiptUrl: true },
    });
    receiptUrl = latestPayment?.receiptUrl ?? null;
  }

  const payRef = reference || trxref || null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Client Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full flex items-start justify-center">
        <div
          className="bg-white rounded-2xl p-8 md:p-12 text-center max-w-lg w-full"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {/* Checkmark */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#D1FAE5" }}
          >
            <CheckCircle2 size={32} color="#065F46" />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F2744" }}>
            Payment Submitted
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Thank you! Your payment has been submitted and is being processed.
            You will receive a confirmation once it is verified.
          </p>

          {/* Invoice details */}
          {invoice && (
            <div
              className="rounded-xl p-5 mb-6 text-left space-y-3"
              style={{ background: "#FAFBFC", border: "1px solid #e5eaf0" }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-semibold" style={{ color: "#0F2744" }}>
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Total</span>
                <span className="font-medium" style={{ color: "#0F2744" }}>
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
              {payRef && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Reference</span>
                  <span className="text-xs font-mono text-gray-600 max-w-[200px] truncate">
                    {payRef}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/client/invoices"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl text-white transition-colors hover:opacity-90"
              style={{ background: "#0F2744" }}
            >
              <ArrowLeft size={16} />
              Back to Invoices
            </Link>
            {receiptUrl && (
              <Link
                href={receiptUrl}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors hover:opacity-80"
                style={{
                  color: "#0F2744",
                  background: "#fff",
                  border: "1px solid #e5eaf0",
                }}
              >
                <Download size={16} />
                Download Receipt
              </Link>
            )}
            {invoice && (
              <Link
                href={`/client/invoices/${invoice.id}`}
                className="inline-flex items-center justify-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors hover:opacity-80"
                style={{
                  color: "#0F2744",
                  background: "#fff",
                  border: "1px solid #e5eaf0",
                }}
              >
                <FileText size={16} />
                View Invoice
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
              Consult For Africa
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
