import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMoney(amount: number, currency: string): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "N/A";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canView = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canView) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      engagement: { select: { id: true, name: true, serviceType: true } },
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      payments: { where: { status: "CONFIRMED" }, orderBy: { paymentDate: "desc" } },
    },
  });

  if (!invoice) return new Response("Not found", { status: 404 });

  // IDOR check for EMs
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const withEM = await prisma.invoice.findUnique({
      where: { id },
      select: { engagement: { select: { engagementManagerId: true } } },
    });
    if (!withEM?.engagement || withEM.engagement.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const cur = invoice.currency;
  const subtotal = Number(invoice.subtotal);
  const tax = Number(invoice.tax);
  const wht = Number(invoice.whtAmount);
  const discount = Number(invoice.discountAmount);
  const total = Number(invoice.total);
  const paidAmount = Number(invoice.paidAmount);
  const balanceDue = Number(invoice.balanceDue);

  // Parse [TrackName] from description
  function parseTrack(desc: string): { text: string; trackName: string | null } {
    const m = desc.match(/\[([^\]]+)\]/);
    if (!m) return { text: desc, trackName: null };
    return { text: desc.replace(`[${m[1]}]`, "").replace(/\s{2,}/g, " ").trim(), trackName: m[1] };
  }

  // Use lineItemRecords if available, fall back to legacy JSON
  const items = invoice.lineItemRecords.length > 0
    ? invoice.lineItemRecords.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        amount: Number(li.amount),
      }))
    : (invoice.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[] || []);

  // Bank details
  const bank = invoice.bankDetails as Record<string, string> | null;

  // Status badge colours
  const statusColors: Record<string, string> = {
    DRAFT: "#6B7280",
    PENDING_APPROVAL: "#F59E0B",
    SENT: "#3B82F6",
    VIEWED: "#8B5CF6",
    PARTIALLY_PAID: "#F59E0B",
    PAID: "#10B981",
    OVERDUE: "#DC2626",
    DISPUTED: "#DC2626",
    WRITTEN_OFF: "#6B7280",
    CANCELLED: "#6B7280",
  };
  const badgeColor = statusColors[invoice.status] ?? "#6B7280";

  // Group items by track for display
  const trackGroups = new Map<string, typeof items>();
  for (const item of items) {
    const { trackName } = parseTrack(item.description);
    const key = trackName ?? "__none__";
    if (!trackGroups.has(key)) trackGroups.set(key, []);
    trackGroups.get(key)!.push(item);
  }
  const hasMultipleTracks = trackGroups.size > 1 || (trackGroups.size === 1 && !trackGroups.has("__none__"));

  let lineItemRows = "";
  let rowIdx = 0;
  for (const [trackKey, groupItems] of trackGroups) {
    if (hasMultipleTracks && trackKey !== "__none__") {
      lineItemRows += `
        <tr>
          <td colspan="4" style="padding:10px 14px 6px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:600;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;background:#F9FAFB;">
            <span style="display:inline-block;padding:2px 10px;border-radius:4px;background:#DBEAFE;color:#1E40AF;font-size:11px;font-weight:600;text-transform:none;letter-spacing:normal;">${esc(trackKey)}</span>
          </td>
        </tr>`;
    }
    for (const item of groupItems) {
      const { text, trackName } = parseTrack(item.description);
      const descHtml = trackName && !hasMultipleTracks
        ? `<span style="display:inline-block;padding:1px 8px;border-radius:4px;background:#DBEAFE;color:#1E40AF;font-size:10px;font-weight:600;margin-right:6px;vertical-align:middle;">${esc(trackName)}</span>${esc(text)}`
        : esc(hasMultipleTracks ? text : item.description);
      lineItemRows += `
        <tr style="background:${rowIdx % 2 === 0 ? "#fff" : "#F9FAFB"};">
          <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;">${descHtml}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;text-align:right;">${fmtMoney(item.unitPrice, cur)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;text-align:right;font-weight:500;">${fmtMoney(item.amount, cur)}</td>
        </tr>`;
      rowIdx++;
    }
  }

  const paymentRows = invoice.payments.length > 0
    ? `
      <div style="margin-top:32px;">
        <h3 style="color:#0F2744;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">Payments Received</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;">Date</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;">Method</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;">Reference</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.payments.map((p) => `
              <tr>
                <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #F3F4F6;">${fmtDate(p.paymentDate)}</td>
                <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #F3F4F6;">${esc(p.paymentMethod)}</td>
                <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #F3F4F6;">${esc(p.reference ?? "")}</td>
                <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #F3F4F6;text-align:right;">${fmtMoney(Number(p.amount), cur)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : "";

  const bankSection = bank
    ? `
      <div style="margin-top:32px;padding:20px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;">
        <h3 style="color:#0F2744;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">Bank Details</h3>
        <table style="border-collapse:collapse;font-size:13px;">
          ${bank.bankName ? `<tr><td style="padding:4px 16px 4px 0;color:#6B7280;">Bank</td><td style="padding:4px 0;font-weight:500;color:#111827;">${esc(bank.bankName)}</td></tr>` : ""}
          ${bank.accountName ? `<tr><td style="padding:4px 16px 4px 0;color:#6B7280;">Account Name</td><td style="padding:4px 0;font-weight:500;color:#111827;">${esc(bank.accountName)}</td></tr>` : ""}
          ${bank.accountNumber ? `<tr><td style="padding:4px 16px 4px 0;color:#6B7280;">Account Number</td><td style="padding:4px 0;font-weight:500;color:#111827;">${esc(bank.accountNumber)}</td></tr>` : ""}
          ${bank.sortCode ? `<tr><td style="padding:4px 16px 4px 0;color:#6B7280;">Sort Code</td><td style="padding:4px 0;font-weight:500;color:#111827;">${esc(bank.sortCode)}</td></tr>` : ""}
          ${bank.swiftCode ? `<tr><td style="padding:4px 16px 4px 0;color:#6B7280;">SWIFT/BIC</td><td style="padding:4px 0;font-weight:500;color:#111827;">${esc(bank.swiftCode)}</td></tr>` : ""}
        </table>
      </div>
    `
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${esc(invoice.invoiceNumber)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 15mm; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; margin: 0; padding: 0; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <table style="width:100%;margin-bottom:40px;">
      <tr>
        <td style="vertical-align:top;">
          <img src="/logo-mark.png" alt="Consult For Africa" style="height:48px;margin-bottom:16px;" />
          <div style="font-size:12px;color:#6B7280;line-height:1.6;">
            Healthcare Management Consulting<br>
            Lagos, Nigeria<br>
            hello@consultforafrica.com
          </div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <h1 style="margin:0 0 8px;font-size:28px;color:#0F2744;font-weight:700;">INVOICE</h1>
          <div style="font-size:14px;color:#374151;margin-bottom:4px;">${esc(invoice.invoiceNumber)}</div>
          <div style="display:inline-block;padding:4px 12px;border-radius:4px;background:${badgeColor};color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;">${invoice.status.replace(/_/g, " ")}</div>
        </td>
      </tr>
    </table>

    <!-- Invoice meta + client details -->
    <table style="width:100%;margin-bottom:32px;">
      <tr>
        <td style="vertical-align:top;width:50%;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;margin-bottom:8px;">Bill To</div>
          <div style="font-size:15px;font-weight:600;color:#0F2744;margin-bottom:4px;">${esc(invoice.client.name)}</div>
          <div style="font-size:13px;color:#6B7280;line-height:1.6;">
            ${esc(invoice.client.primaryContact)}<br>
            ${esc(invoice.client.address)}<br>
            ${esc(invoice.client.email)}
          </div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <table style="margin-left:auto;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 16px 4px 0;font-size:13px;color:#6B7280;">Invoice Date</td>
              <td style="padding:4px 0;font-size:13px;font-weight:500;color:#111827;">${fmtDate(invoice.issuedDate)}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;font-size:13px;color:#6B7280;">Due Date</td>
              <td style="padding:4px 0;font-size:13px;font-weight:500;color:#111827;">${fmtDate(invoice.dueDate)}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;font-size:13px;color:#6B7280;">Invoice Type</td>
              <td style="padding:4px 0;font-size:13px;font-weight:500;color:#111827;">${invoice.invoiceType.replace(/_/g, " ")}</td>
            </tr>
            ${invoice.engagement ? `
            <tr>
              <td style="padding:4px 16px 4px 0;font-size:13px;color:#6B7280;">Engagement</td>
              <td style="padding:4px 0;font-size:13px;font-weight:500;color:#111827;">${esc(invoice.engagement.name)}</td>
            </tr>
            ` : ""}
            ${invoice.billingPeriodStart && invoice.billingPeriodEnd ? `
            <tr>
              <td style="padding:4px 16px 4px 0;font-size:13px;color:#6B7280;">Billing Period</td>
              <td style="padding:4px 0;font-size:13px;font-weight:500;color:#111827;">${fmtDate(invoice.billingPeriodStart)} - ${fmtDate(invoice.billingPeriodEnd)}</td>
            </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Line Items -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#0F2744;">
          <th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.05em;">Description</th>
          <th style="padding:12px 14px;text-align:center;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.05em;width:80px;">Qty</th>
          <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Unit Price</th>
          <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <table style="margin-left:auto;border-collapse:collapse;min-width:300px;">
      <tr>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#6B7280;">Subtotal</td>
        <td style="padding:8px 0;font-size:13px;font-weight:500;color:#111827;text-align:right;">${fmtMoney(subtotal, cur)}</td>
      </tr>
      ${tax > 0 ? `
      <tr>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#6B7280;">VAT/Tax</td>
        <td style="padding:8px 0;font-size:13px;font-weight:500;color:#111827;text-align:right;">+ ${fmtMoney(tax, cur)}</td>
      </tr>
      ` : ""}
      ${wht > 0 ? `
      <tr>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#6B7280;">Withholding Tax (WHT)</td>
        <td style="padding:8px 0;font-size:13px;font-weight:500;color:#DC2626;text-align:right;">- ${fmtMoney(wht, cur)}</td>
      </tr>
      ` : ""}
      ${discount > 0 ? `
      <tr>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#6B7280;">Discount</td>
        <td style="padding:8px 0;font-size:13px;font-weight:500;color:#DC2626;text-align:right;">- ${fmtMoney(discount, cur)}</td>
      </tr>
      ` : ""}
      <tr style="border-top:2px solid #0F2744;">
        <td style="padding:12px 20px 8px 0;font-size:15px;font-weight:700;color:#0F2744;">Total</td>
        <td style="padding:12px 0 8px;font-size:15px;font-weight:700;color:#0F2744;text-align:right;">${fmtMoney(total, cur)}</td>
      </tr>
      ${paidAmount > 0 ? `
      <tr>
        <td style="padding:4px 20px 4px 0;font-size:13px;color:#10B981;">Paid</td>
        <td style="padding:4px 0;font-size:13px;font-weight:500;color:#10B981;text-align:right;">- ${fmtMoney(paidAmount, cur)}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB;">
        <td style="padding:8px 20px 8px 0;font-size:15px;font-weight:700;color:#0F2744;">Balance Due</td>
        <td style="padding:8px 0;font-size:15px;font-weight:700;color:#0F2744;text-align:right;">${fmtMoney(balanceDue, cur)}</td>
      </tr>
      ` : ""}
    </table>

    ${paymentRows}

    ${bankSection}

    <!-- Client Notes -->
    ${invoice.clientNotes ? `
    <div style="margin-top:32px;padding:16px 20px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
      <h3 style="color:#92400E;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Notes</h3>
      <p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;">${esc(invoice.clientNotes)}</p>
    </div>
    ` : ""}

    <!-- Payment Terms -->
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;">
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;margin:0;">
        Payment is due ${invoice.dueDate ? `by ${fmtDate(invoice.dueDate)}` : "on receipt"}.
        Please quote invoice number <strong>${esc(invoice.invoiceNumber)}</strong> on all payments and correspondence.
      </p>
      <p style="font-size:11px;color:#D1D5DB;margin:16px 0 0;">
        Consult For Africa Ltd. This invoice was generated by the C4A Platform.
      </p>
    </div>
  </div>
</body>
</html>`;

  const safeName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_");

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeName}.pdf"`,
    },
  });
}
