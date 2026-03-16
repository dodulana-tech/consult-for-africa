import nodemailer from "nodemailer";

/** Escape HTML entities in user-supplied values to prevent XSS in emails */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "CFA Platform <platform@consultforafrica.com>";

// ─── Send helper ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) {
    console.log(`[email] SMTP not configured. To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send error:", err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CFA Platform</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5eaf0;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#0F2744;padding:24px 32px;">
          <span style="color:#D4AF37;font-weight:700;font-size:16px;">Consult For Africa</span>
          <span style="color:rgba(255,255,255,0.45);font-size:12px;margin-left:8px;">Platform</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #e5eaf0;color:#9CA3AF;font-size:11px;">
          Consult For Africa · Engagement Platform · This email was sent automatically.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F2744;">${esc(text)}</h1>`;
}
function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${esc(text)}</p>`;
}
function infoTable(rows: [string, string][]) {
  const cells = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${esc(k)}</td>
             <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #F3F4F6;">${esc(v)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:16px 0;">${cells}</table>`;
}
function btn(text: string, href: string, color = "#D4AF37") {
  const safeHref = esc(href);
  return `<a href="${safeHref}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:${color};color:${color === "#D4AF37" ? "#06090f" : "#fff"};font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">${esc(text)}</a>`;
}

// ─── Email functions ──────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://platform.consultforafrica.com";

export async function emailDeliverableSubmitted({
  emEmail,
  emName,
  consultantName,
  deliverableName,
  projectName,
  deliverableId,
  projectId,
}: {
  emEmail: string;
  emName: string;
  consultantName: string;
  deliverableName: string;
  projectName: string;
  deliverableId: string;
  projectId: string;
}) {
  await send(
    emEmail,
    `New deliverable submitted: ${deliverableName}`,
    layout(`
      ${h1("Deliverable Submitted for Review")}
      ${p(`Hi ${emName}, a new deliverable has been submitted and is waiting for your review.`)}
      ${infoTable([
        ["Project", projectName],
        ["Deliverable", deliverableName],
        ["Submitted by", consultantName],
      ])}
      ${btn("Review Now", `${BASE_URL}/deliverables/${deliverableId}`)}
    `)
  );
}

export async function emailDeliverableApproved({
  consultantEmail,
  consultantName,
  deliverableName,
  projectName,
  reviewScore,
  reviewNotes,
  deliverableId,
}: {
  consultantEmail: string;
  consultantName: string;
  deliverableName: string;
  projectName: string;
  reviewScore: number | null;
  reviewNotes: string | null;
  deliverableId: string;
}) {
  await send(
    consultantEmail,
    `Deliverable approved: ${deliverableName}`,
    layout(`
      ${h1("Deliverable Approved")}
      ${p(`Hi ${consultantName}, your deliverable has been reviewed and approved.`)}
      ${infoTable([
        ["Project", projectName],
        ["Deliverable", deliverableName],
        ...(reviewScore ? [["Score", `${reviewScore}/10`] as [string, string]] : []),
        ...(reviewNotes ? [["Feedback", reviewNotes] as [string, string]] : []),
      ])}
      ${p("Great work. This deliverable is now marked as approved.")}
      ${btn("View Deliverable", `${BASE_URL}/deliverables/${deliverableId}/submit`)}
    `)
  );
}

export async function emailRevisionRequested({
  consultantEmail,
  consultantName,
  deliverableName,
  projectName,
  reviewNotes,
  deliverableId,
}: {
  consultantEmail: string;
  consultantName: string;
  deliverableName: string;
  projectName: string;
  reviewNotes: string | null;
  deliverableId: string;
}) {
  await send(
    consultantEmail,
    `Revision requested: ${deliverableName}`,
    layout(`
      ${h1("Revision Requested")}
      ${p(`Hi ${consultantName}, your submission has been reviewed and the EM has requested a revision.`)}
      ${infoTable([
        ["Project", projectName],
        ["Deliverable", deliverableName],
        ...(reviewNotes ? [["Feedback", reviewNotes] as [string, string]] : []),
      ])}
      ${p("Please review the feedback above and resubmit an updated version.")}
      ${btn("Resubmit", `${BASE_URL}/deliverables/${deliverableId}/submit`, "#EF4444")}
    `)
  );
}

export async function emailTimesheetApproved({
  consultantEmail,
  consultantName,
  totalHours,
  totalAmount,
  currency,
  projectName,
}: {
  consultantEmail: string;
  consultantName: string;
  totalHours: number;
  totalAmount: number;
  currency: string;
  projectName: string;
}) {
  const formatted = currency === "USD"
    ? `$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${totalAmount.toLocaleString("en-NG")}`;

  await send(
    consultantEmail,
    "Timesheet approved",
    layout(`
      ${h1("Timesheet Approved")}
      ${p(`Hi ${consultantName}, your timesheet has been approved and is queued for payment.`)}
      ${infoTable([
        ["Project", projectName],
        ["Hours", `${totalHours}h`],
        ["Amount", formatted],
        ["Status", "Approved, payment processing"],
      ])}
      ${p("Payment will be processed within 5 business days.")}
    `)
  );
}

export async function emailTimesheetRejected({
  consultantEmail,
  consultantName,
  totalHours,
  projectName,
  reason,
}: {
  consultantEmail: string;
  consultantName: string;
  totalHours: number;
  projectName: string;
  reason: string;
}) {
  await send(
    consultantEmail,
    "Timesheet returned for correction",
    layout(`
      ${h1("Timesheet Returned")}
      ${p(`Hi ${consultantName}, your timesheet has been returned and needs to be corrected.`)}
      ${infoTable([
        ["Project", projectName],
        ["Hours submitted", `${totalHours}h`],
        ["Reason", reason],
      ])}
      ${p("Please update your time entries and resubmit.")}
      ${btn("View Timesheets", `${BASE_URL}/timesheets`, "#0F2744")}
    `)
  );
}

export async function sendInvite(
  email: string,
  name: string,
  role: string,
  tempPassword: string,
) {
  const roleLabel = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const firstName = esc(name.split(" ")[0]);
  const safeName = esc(name);
  const safeEmail = esc(email);
  const safePassword = esc(tempPassword);
  const safeRole = esc(roleLabel);

  const roleIntro: Record<string, string> = {
    Consultant: "As a consultant, you will be assigned to client projects, submit deliverables, track your time, and collaborate with engagement managers through the platform.",
    "Engagement Manager": "As an Engagement Manager, you will oversee project delivery, review deliverables, manage consultant assignments, and ensure client satisfaction across your portfolio.",
    Director: "As a Director, you will have oversight of practice-level performance, project portfolios, and team capacity across Consult for Africa.",
    Partner: "As a Partner, you will have full visibility into firm performance, client relationships, financial metrics, and strategic planning tools.",
    Admin: "As an Administrator, you will have full access to manage users, configure the platform, and oversee all operations.",
  };

  const intro = roleIntro[roleLabel] ?? "You now have access to project management, collaboration tools, and knowledge resources.";

  await send(
    email,
    `Welcome to Consult for Africa, ${name}`,
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been invited to join <strong>Consult for Africa</strong>, a specialist management consulting firm focused on healthcare and social impact across Africa.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Your role: <strong>${safeRole}</strong>
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6B7280;">
        ${esc(intro)}
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;">Your login credentials</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6B7280;width:140px;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;"><a href="mailto:${safeEmail}" style="color:#0F2744;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6B7280;">Temporary Password</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;font-family:monospace;letter-spacing:0.5px;">${safePassword}</td>
          </tr>
        </table>
      </div>
      <p style="margin:16px 0;font-size:14px;line-height:1.6;color:#374151;">
        Please log in and change your password immediately. Your temporary password should be changed after first use for security.
      </p>
      ${btn("Log In to Platform", `${BASE_URL}/login`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you did not expect this invitation, please disregard this email or contact us at hello@consultforafrica.com.
      </p>
    `)
  );
}

export async function emailPaymentProcessed({
  consultantEmail,
  consultantName,
  totalAmount,
  currency,
  paymentMethod,
  paymentReference,
}: {
  consultantEmail: string;
  consultantName: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
}) {
  const formatted = currency === "USD"
    ? `$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${totalAmount.toLocaleString("en-NG")}`;

  await send(
    consultantEmail,
    `Payment processed: ${formatted}`,
    layout(`
      ${h1("Payment Processed")}
      ${p(`Hi ${consultantName}, your payment has been processed.`)}
      ${infoTable([
        ["Amount", formatted],
        ["Method", paymentMethod],
        ["Reference", paymentReference],
        ["Expected arrival", "3-5 business days"],
      ])}
      ${p("Keep this email for your records.")}
    `)
  );
}
