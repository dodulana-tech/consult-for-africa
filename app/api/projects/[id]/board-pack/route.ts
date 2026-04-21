import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/* ── helpers ──────────────────────────────────────────────────────────────────── */

function fmt(val: unknown, suffix = ""): string {
  if (val == null) return "N/A";
  const n = Number(val);
  if (isNaN(n)) return "N/A";
  return `${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}${suffix}`;
}

function fmtMoney(val: unknown): string {
  if (val == null) return "N/A";
  const n = Number(val);
  if (isNaN(n)) return "N/A";
  if (n >= 1_000_000_000)
    return `NGN ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)
    return `NGN ${(n / 1_000_000).toFixed(2)}M`;
  return `NGN ${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function ragDot(color: "GREEN" | "AMBER" | "RED" | null): string {
  const map = { GREEN: "#10B981", AMBER: "#F59E0B", RED: "#DC2626" };
  const c = color ? map[color] : "#D1D5DB";
  return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${c};margin-right:6px;vertical-align:middle;"></span>`;
}

type Threshold = {
  field: string;
  label: string;
  green: number;
  amber: number;
  lowerIsBetter?: boolean;
  suffix?: string;
  formatFn?: (v: unknown) => string;
};

const RAG_THRESHOLDS: Threshold[] = [
  { field: "bedOccupancyPct",    label: "Bed Occupancy",       green: 75, amber: 60, suffix: "%" },
  { field: "ebitdaMarginPct",    label: "EBITDA Margin",       green: 15, amber: 5,  suffix: "%" },
  { field: "readmissionRatePct", label: "Readmission Rate",    green: 5,  amber: 10, lowerIsBetter: true, suffix: "%" },
  { field: "staffTurnoverPct",   label: "Staff Turnover",      green: 10, amber: 20, lowerIsBetter: true, suffix: "%" },
  { field: "collectionRatePct",  label: "Collection Rate",     green: 90, amber: 75, suffix: "%" },
];

function computeRag(
  value: number | null | undefined,
  t: Threshold
): "GREEN" | "AMBER" | "RED" | null {
  if (value == null) return null;
  if (t.lowerIsBetter) {
    if (value <= t.green) return "GREEN";
    if (value <= t.amber) return "AMBER";
    return "RED";
  }
  if (value >= t.green) return "GREEN";
  if (value >= t.amber) return "AMBER";
  return "RED";
}

/* ── KPI table builder ────────────────────────────────────────────────────────── */

interface Snapshot {
  period: string;
  [key: string]: unknown;
}

function kpiTable(
  title: string,
  rows: { field: string; label: string; suffix?: string; formatFn?: (v: unknown) => string; threshold?: Threshold }[],
  snapshots: Snapshot[]
): string {
  const periods = snapshots.map((s) => s.period);
  let html = `
    <h3 style="color:#0F2744;margin:0 0 12px;font-size:16px;">${title}</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
      <thead>
        <tr style="background:#0F2744;color:#fff;">
          <th style="text-align:left;padding:10px 12px;border:1px solid #E5E7EB;">KPI</th>
          ${periods.map((p) => `<th style="text-align:center;padding:10px 12px;border:1px solid #E5E7EB;">${p}</th>`).join("")}
        </tr>
      </thead>
      <tbody>`;

  rows.forEach((row, i) => {
    const bg = i % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
    html += `<tr style="background:${bg};">`;
    html += `<td style="padding:8px 12px;border:1px solid #E5E7EB;font-weight:500;">${row.label}</td>`;
    for (const snap of snapshots) {
      const raw = snap[row.field];
      const numVal = raw != null ? Number(raw) : null;
      const display = row.formatFn
        ? row.formatFn(raw)
        : fmt(raw, row.suffix || "");
      const rag = row.threshold ? computeRag(numVal, row.threshold) : null;
      html += `<td style="padding:8px 12px;border:1px solid #E5E7EB;text-align:center;">${rag ? ragDot(rag) : ""}${display}</td>`;
    }
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

/* ── GET: generate board pack HTML ────────────────────────────────────────────── */

export const GET = handler(async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: engagementId } = await params;
  const url = new URL(req.url);
  const periodsCount = Math.min(
    Math.max(parseInt(url.searchParams.get("periods") || "3", 10) || 3, 1),
    12
  );

  // 1. Fetch engagement + client
  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: { client: true },
  });

  if (!engagement)
    return Response.json({ error: "Engagement not found" }, { status: 404 });

  // 2. Fetch KPI snapshots (board-pack-included only)
  const snapshots = await prisma.transformKPISnapshot.findMany({
    where: { engagementId, boardPackIncluded: true },
    orderBy: { period: "desc" },
    take: periodsCount,
  });

  // Reverse so oldest first in tables
  const orderedSnapshots: Snapshot[] = [...snapshots]
    .reverse()
    .map((s) => ({ ...s } as unknown as Snapshot));

  // 3. Fetch exit dossier if exists
  const exitDossier = engagement.transformHospitalId
    ? await prisma.exitDossier.findFirst({
        where: { engagementId },
      })
    : null;

  // 4. Fetch hospital name
  const hospital = engagement.transformHospitalId
    ? await prisma.hospital.findUnique({
        where: { id: engagement.transformHospitalId },
      })
    : null;

  const hospitalName = hospital?.name || engagement.client.name;
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const safeName = engagement.name.replace(/[^a-zA-Z0-9-_ ]/g, "");

  // Latest snapshot for executive summary
  const latest = snapshots[0] || null;

  /* ── Build HTML ────────────────────────────────────────────────────────────── */

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Board Pack - ${safeName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 28mm 18mm;
      @bottom-center {
        content: "Confidential - Consult For Africa";
        font-size: 9px;
        color: #9CA3AF;
      }
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9px;
        color: #9CA3AF;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 13px;
      color: #1F2937;
      line-height: 1.6;
      background: #fff;
    }

    .page-break { page-break-before: always; }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }

    .cover-logo {
      font-size: 36px;
      font-weight: 800;
      color: #0F2744;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }

    .cover-logo span { color: #D4AF37; }

    .cover-subtitle {
      font-size: 14px;
      color: #6B7280;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 48px;
    }

    .cover-title {
      font-size: 28px;
      font-weight: 700;
      color: #0F2744;
      margin-bottom: 8px;
    }

    .cover-hospital {
      font-size: 20px;
      color: #D4AF37;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .cover-engagement {
      font-size: 16px;
      color: #6B7280;
      margin-bottom: 32px;
    }

    .cover-date {
      font-size: 14px;
      color: #9CA3AF;
      margin-bottom: 48px;
    }

    .cover-confidential {
      font-size: 11px;
      color: #DC2626;
      text-transform: uppercase;
      letter-spacing: 2px;
      border: 1px solid #DC2626;
      padding: 6px 20px;
      border-radius: 4px;
    }

    .section-header {
      border-bottom: 3px solid #D4AF37;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0F2744;
      margin: 0;
    }

    .rag-summary {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }

    .rag-card {
      flex: 1;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .rag-card .count {
      font-size: 32px;
      font-weight: 700;
    }

    .rag-card .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .summary-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }

    .summary-box h4 {
      color: #0F2744;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .exit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .exit-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px;
    }

    .exit-card .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #6B7280;
      letter-spacing: 0.5px;
    }

    .exit-card .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: #0F2744;
      margin-top: 4px;
    }

    .footer-print {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      color: #9CA3AF;
      padding: 8px;
      border-top: 1px solid #E5E7EB;
    }

    .notes-block {
      background: #FFFBEB;
      border-left: 4px solid #D4AF37;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }

    .notes-block .notes-period {
      font-weight: 700;
      color: #0F2744;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .notes-block .notes-text {
      color: #4B5563;
      font-size: 12px;
      white-space: pre-wrap;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0F2744;
      color: #fff;
      padding: 10px 24px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9999;
    }

    .print-bar button {
      background: #D4AF37;
      color: #0F2744;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }

    .print-bar button:hover { opacity: 0.9; }
  </style>
</head>
<body>

  <!-- Print helper bar -->
  <div class="print-bar no-print">
    <span>Board Pack Preview</span>
    <button onclick="window.print()">Save as PDF (Cmd+P)</button>
  </div>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-logo">CONSULT <span>FOR</span> AFRICA</div>
    <div class="cover-subtitle">Management Consulting</div>
    <div class="cover-title">Board Pack</div>
    <div class="cover-hospital">${escapeHtml(hospitalName)}</div>
    <div class="cover-engagement">${escapeHtml(engagement.name)}</div>
    <div class="cover-date">${today}</div>
    <div class="cover-confidential">Strictly Confidential</div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="page-break">
    <div class="section-header">
      <h2>1. Executive Summary</h2>
    </div>

    ${latest ? `
    <p style="margin-bottom:16px;color:#6B7280;font-size:13px;">
      Latest reporting period: <strong style="color:#0F2744;">${latest.period}</strong>
    </p>

    <div class="rag-summary">
      <div class="rag-card" style="background:#ECFDF5;border:1px solid #A7F3D0;">
        <div class="count" style="color:#10B981;">${latest.greenCount ?? 0}</div>
        <div class="label" style="color:#059669;">Green</div>
      </div>
      <div class="rag-card" style="background:#FFFBEB;border:1px solid #FDE68A;">
        <div class="count" style="color:#F59E0B;">${latest.amberCount ?? 0}</div>
        <div class="label" style="color:#D97706;">Amber</div>
      </div>
      <div class="rag-card" style="background:#FEF2F2;border:1px solid #FECACA;">
        <div class="count" style="color:#DC2626;">${latest.redCount ?? 0}</div>
        <div class="label" style="color:#DC2626;">Red</div>
      </div>
    </div>

    <div class="summary-box">
      <h4>Engagement Overview</h4>
      <table style="width:100%;font-size:13px;border:none;">
        <tr>
          <td style="padding:4px 0;color:#6B7280;width:200px;">Client</td>
          <td style="padding:4px 0;font-weight:500;">${escapeHtml(engagement.client.name)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Engagement Type</td>
          <td style="padding:4px 0;font-weight:500;">Transformation</td>
        </tr>
        ${engagement.transformEquityPct != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Equity Stake</td>
          <td style="padding:4px 0;font-weight:500;">${fmt(engagement.transformEquityPct, "%")}</td>
        </tr>` : ""}
        ${engagement.transformEntryValuation != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Entry Valuation</td>
          <td style="padding:4px 0;font-weight:500;">${fmtMoney(engagement.transformEntryValuation)}</td>
        </tr>` : ""}
        ${engagement.transformExitMonths != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Target Exit Timeline</td>
          <td style="padding:4px 0;font-weight:500;">${engagement.transformExitMonths} months</td>
        </tr>` : ""}
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Periods Included</td>
          <td style="padding:4px 0;font-weight:500;">${orderedSnapshots.map((s) => s.period).join(", ") || "None"}</td>
        </tr>
      </table>
    </div>
    ` : `
    <div class="summary-box">
      <p style="color:#6B7280;">No KPI snapshots have been marked for board pack inclusion. Mark snapshots as "Board Pack Included" to populate this report.</p>
    </div>
    `}
  </div>

  <!-- FINANCIAL PERFORMANCE -->
  <div class="page-break">
    <div class="section-header">
      <h2>2. Financial Performance</h2>
    </div>

    ${orderedSnapshots.length > 0 ? kpiTable("Revenue and Profitability", [
      { field: "revenueMonthly", label: "Monthly Revenue", formatFn: fmtMoney },
      { field: "revenuePerBedDay", label: "Revenue per Bed Day", formatFn: fmtMoney },
      {
        field: "ebitdaMarginPct",
        label: "EBITDA Margin",
        suffix: "%",
        threshold: RAG_THRESHOLDS.find((t) => t.field === "ebitdaMarginPct")!,
      },
      {
        field: "collectionRatePct",
        label: "Collection Rate",
        suffix: "%",
        threshold: RAG_THRESHOLDS.find((t) => t.field === "collectionRatePct")!,
      },
      { field: "arDays", label: "AR Days", suffix: " days" },
      { field: "hmoDenialRatePct", label: "HMO Denial Rate", suffix: "%" },
      { field: "cleanClaimRatePct", label: "Clean Claim Rate", suffix: "%" },
    ], orderedSnapshots) : `<div class="summary-box"><p style="color:#6B7280;">No data available.</p></div>`}
  </div>

  <!-- CLINICAL PERFORMANCE -->
  <div class="page-break">
    <div class="section-header">
      <h2>3. Clinical Performance</h2>
    </div>

    ${orderedSnapshots.length > 0 ? kpiTable("Clinical Metrics", [
      {
        field: "bedOccupancyPct",
        label: "Bed Occupancy",
        suffix: "%",
        threshold: RAG_THRESHOLDS.find((t) => t.field === "bedOccupancyPct")!,
      },
      { field: "opdVolumeDaily", label: "OPD Volume (Daily)" },
      {
        field: "readmissionRatePct",
        label: "Readmission Rate",
        suffix: "%",
        threshold: RAG_THRESHOLDS.find((t) => t.field === "readmissionRatePct")!,
      },
    ], orderedSnapshots) : `<div class="summary-box"><p style="color:#6B7280;">No data available.</p></div>`}
  </div>

  <!-- OPERATIONAL PERFORMANCE -->
  <div class="page-break">
    <div class="section-header">
      <h2>4. Operational Performance</h2>
    </div>

    ${orderedSnapshots.length > 0 ? kpiTable("Operational Metrics", [
      {
        field: "staffTurnoverPct",
        label: "Staff Turnover",
        suffix: "%",
        threshold: RAG_THRESHOLDS.find((t) => t.field === "staffTurnoverPct")!,
      },
      { field: "hmoPanelsCount", label: "HMO Panels" },
    ], orderedSnapshots) : `<div class="summary-box"><p style="color:#6B7280;">No data available.</p></div>`}
  </div>

  <!-- GOVERNANCE & QUALITY -->
  <div class="page-break">
    <div class="section-header">
      <h2>5. Governance and Quality</h2>
    </div>

    ${orderedSnapshots.length > 0 ? kpiTable("Governance Metrics", [
      { field: "nurseBedRatio", label: "Nurse-to-Bed Ratio" },
      { field: "doctorBedRatio", label: "Doctor-to-Bed Ratio" },
    ], orderedSnapshots) : `<div class="summary-box"><p style="color:#6B7280;">No data available.</p></div>`}
  </div>

  <!-- EXIT READINESS -->
  ${exitDossier ? `
  <div class="page-break">
    <div class="section-header">
      <h2>6. Exit Readiness</h2>
    </div>

    <div class="exit-grid">
      <div class="exit-card">
        <div class="metric-label">Exit Valuation</div>
        <div class="metric-value">${fmtMoney(exitDossier.exitValuation)}</div>
      </div>
      <div class="exit-card">
        <div class="metric-label">Valuation Range</div>
        <div class="metric-value" style="font-size:16px;">
          ${fmtMoney(exitDossier.exitValRangeLow)} - ${fmtMoney(exitDossier.exitValRangeHigh)}
        </div>
      </div>
      <div class="exit-card">
        <div class="metric-label">Data Room Completeness</div>
        <div class="metric-value">${exitDossier.dataRoomCompletenessPct != null ? `${exitDossier.dataRoomCompletenessPct}%` : "N/A"}</div>
      </div>
      <div class="exit-card">
        <div class="metric-label">Realised MOIC</div>
        <div class="metric-value">${exitDossier.realisedMoic != null ? `${Number(exitDossier.realisedMoic).toFixed(2)}x` : "N/A"}</div>
      </div>
    </div>

    <div class="summary-box">
      <h4>Exit Process Status</h4>
      <p style="margin-top:8px;">
        <span class="status-badge" style="background:${
          exitDossier.status === "CLOSED"
            ? "#ECFDF5;color:#059669"
            : exitDossier.status === "ACTIVE_PROCESS"
            ? "#FFFBEB;color:#D97706"
            : exitDossier.status === "PREPARATION"
            ? "#EFF6FF;color:#2563EB"
            : "#F3F4F6;color:#6B7280"
        }">
          ${exitDossier.status.replace(/_/g, " ")}
        </span>
      </p>
      ${exitDossier.exitEbitda != null ? `
      <table style="width:100%;font-size:13px;margin-top:12px;">
        <tr>
          <td style="padding:4px 0;color:#6B7280;width:200px;">Exit EBITDA</td>
          <td style="padding:4px 0;font-weight:500;">${fmtMoney(exitDossier.exitEbitda)}</td>
        </tr>
        ${exitDossier.exitMultipleApplied != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Multiple Applied</td>
          <td style="padding:4px 0;font-weight:500;">${Number(exitDossier.exitMultipleApplied).toFixed(1)}x</td>
        </tr>` : ""}
        ${exitDossier.equityProceeds != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Equity Proceeds</td>
          <td style="padding:4px 0;font-weight:500;">${fmtMoney(exitDossier.equityProceeds)}</td>
        </tr>` : ""}
        ${exitDossier.totalCfaReturn != null ? `
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Total C4A Return</td>
          <td style="padding:4px 0;font-weight:500;">${fmtMoney(exitDossier.totalCfaReturn)}</td>
        </tr>` : ""}
      </table>` : ""}
    </div>
  </div>
  ` : ""}

  <!-- APPENDIX: NOTES -->
  <div class="page-break">
    <div class="section-header">
      <h2>${exitDossier ? "7" : "6"}. Appendix: Period Notes</h2>
    </div>

    ${orderedSnapshots.filter((s) => s.notes).length > 0
      ? orderedSnapshots
          .filter((s) => s.notes)
          .map(
            (s) => `
        <div class="notes-block">
          <div class="notes-period">${s.period}</div>
          <div class="notes-text">${escapeHtml(String(s.notes))}</div>
        </div>`
          )
          .join("")
      : `<div class="summary-box"><p style="color:#6B7280;">No notes recorded for the included periods.</p></div>`
    }

    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="color:#9CA3AF;font-size:11px;">End of Board Pack</p>
      <p style="color:#9CA3AF;font-size:11px;">Confidential - Consult For Africa</p>
      <p style="color:#9CA3AF;font-size:11px;">Generated ${today}</p>
    </div>
  </div>

  <div class="footer-print no-print" style="position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:9px;color:#9CA3AF;padding:8px;border-top:1px solid #E5E7EB;background:#fff;">
    Confidential - Consult For Africa
  </div>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="board-pack-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
});

/* ── HTML escape ──────────────────────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
