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
    console.log(`[email] sending to ${to}: ${subject}`);
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[email] sent to ${to}`);
  } catch (err) {
    console.error(`[email] send error to ${to}:`, err);
    throw err; // re-throw so callers can catch
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

export async function emailClientPortalInvite({
  contactEmail,
  contactName,
  clientName,
  password,
}: {
  contactEmail: string;
  contactName: string;
  clientName: string;
  password: string;
}) {
  const firstName = esc(contactName.split(" ")[0]);
  const safeEmail = esc(contactEmail);
  const safePassword = esc(password);
  const safeClientName = esc(clientName);

  await send(
    contactEmail,
    "Your Client Portal Access | Consult for Africa",
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Your client portal account for <strong>${safeClientName}</strong> is now active on the Consult for Africa platform.
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6B7280;">
        Through the portal you can track project progress, view deliverables, see milestones, and contact your engagement manager directly.
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;">Your login credentials</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6B7280;width:140px;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;"><a href="mailto:${safeEmail}" style="color:#0F2744;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6B7280;">Password</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;font-family:monospace;letter-spacing:0.5px;">${safePassword}</td>
          </tr>
        </table>
      </div>
      <p style="margin:16px 0;font-size:14px;line-height:1.6;color:#374151;">
        Please change your password after your first login for security.
      </p>
      ${btn("Log In to Portal", `${BASE_URL}/client/login`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you did not expect this email, please disregard it or contact us at hello@consultforafrica.com.
      </p>
    `)
  );
}

export async function emailClientWelcome({
  contactEmail,
  contactName,
  clientName,
}: {
  contactEmail: string;
  contactName: string;
  clientName: string;
}) {
  const firstName = esc(contactName.split(" ")[0]);
  const safeClientName = esc(clientName);

  await send(
    contactEmail,
    `Welcome to Consult for Africa | ${clientName}`,
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        <strong>${safeClientName}</strong> has been onboarded to the Consult for Africa engagement platform. We look forward to working together.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280;">
        Your engagement manager will be in touch shortly to discuss next steps. In the meantime, you can expect:
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.8;color:#374151;">
        <li>A dedicated engagement manager for your projects</li>
        <li>Access to a client portal where you can track progress and deliverables</li>
        <li>Regular updates on milestones and project health</li>
      </ul>
      <p style="margin:0 0 0;font-size:14px;line-height:1.6;color:#374151;">
        If you have any questions, please reach out to us at <a href="mailto:hello@consultforafrica.com" style="color:#0F2744;font-weight:600;">hello@consultforafrica.com</a>.
      </p>
    `)
  );
}

export async function emailContactAdded({
  contactEmail,
  contactName,
  clientName,
}: {
  contactEmail: string;
  contactName: string;
  clientName: string;
}) {
  const firstName = esc(contactName.split(" ")[0]);
  const safeClientName = esc(clientName);

  await send(
    contactEmail,
    `You've been added as a contact | ${clientName}`,
    layout(`
      ${h1(`Hello, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been added as a contact person for <strong>${safeClientName}</strong> on the Consult for Africa platform.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280;">
        As a listed contact, you may receive project updates and communications related to your organisation's engagements with us.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
        Your engagement manager may also set up client portal access for you, which will give you visibility into project progress, deliverables, and milestones.
      </p>
      <p style="margin:0 0 0;font-size:14px;line-height:1.6;color:#374151;">
        Questions? Reach out to us at <a href="mailto:hello@consultforafrica.com" style="color:#0F2744;font-weight:600;">hello@consultforafrica.com</a>.
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

export async function emailPlatformPasswordReset({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const firstName = esc(name.split(" ")[0]);

  await send(
    email,
    "Password Reset | Consult for Africa Platform",
    layout(`
      ${h1("Password Reset")}
      ${p(`Hi ${firstName}, we received a request to reset your Consult for Africa platform password.`)}
      ${btn("Reset Password", resetUrl, "#0F2744")}
      <p style="margin:16px 0;font-size:13px;color:#6B7280;line-height:1.6;">
        This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
    `)
  );
}

export async function emailMaarovaPasswordReset({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const firstName = esc(name.split(" ")[0]);

  await send(
    email,
    "Password Reset | Maarova Assessment Portal",
    layout(`
      ${h1("Password Reset")}
      ${p(`Hi ${firstName}, we received a request to reset your Maarova assessment portal password.`)}
      ${btn("Reset Password", resetUrl, "#0F2744")}
      <p style="margin:16px 0;font-size:13px;color:#6B7280;line-height:1.6;">
        This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
    `)
  );
}

export async function emailClientPortalPasswordReset({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const firstName = esc(name.split(" ")[0]);

  await send(
    email,
    "Password Reset | Consult for Africa Client Portal",
    layout(`
      ${h1(`Password Reset`)}
      ${p(`Hi ${firstName}, we received a request to reset your Client Portal password.`)}
      ${btn("Reset Password", resetUrl, "#0F2744")}
      <p style="margin:16px 0;font-size:13px;color:#6B7280;line-height:1.6;">
        This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
    `)
  );
}

export async function email360RaterInvite({
  raterEmail,
  raterName,
  subjectName,
  role,
  token,
}: {
  raterEmail: string;
  raterName: string;
  subjectName: string;
  role: string;
  token: string;
}) {
  const firstName = esc(raterName.split(" ")[0]);
  const safeSubject = esc(subjectName);
  const roleLabel = role.replace(/_/g, " ").toLowerCase();

  await send(
    raterEmail,
    `360 Feedback Request | Consult for Africa`,
    layout(`
      ${h1(`Hi ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been invited to provide <strong>360-degree feedback</strong> for <strong>${safeSubject}</strong> as part of their Maarova leadership assessment.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280;">
        Your role in this assessment: <strong>${esc(roleLabel)}</strong>. Your responses are confidential and will be aggregated with other raters to produce a development profile. The feedback takes approximately 10 to 15 minutes to complete.
      </p>
      ${btn("Provide Feedback", `${BASE_URL}/maarova/rate/${esc(token)}`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you do not recognise the person named above, please disregard this email or contact us at hello@consultforafrica.com.
      </p>
    `)
  );
}

export async function emailWeeklyDigest({
  email,
  name,
  role,
  activeProjects,
  atRiskProjects,
  completedThisWeek,
  overdueDeliverables,
  pendingTimesheets,
  hoursSubmittedThisWeek,
  deliverablesSubmitted,
  deliverablesApproved,
  deliverablesNeedingRevision,
  totalConsultants,
  avgUtilization,
  invoicesSentThisWeek,
  invoicesSentAmount,
  outstandingAmount,
  collectedThisWeek,
  newReferrals,
  proposalsSent,
  newApplications,
  consultantsOnboarded,
  avgSatisfaction,
  expansionRequests,
  referralUpdates,
  nuruInsight,
}: {
  email: string;
  name: string;
  role: string;
  activeProjects: number;
  atRiskProjects: number;
  completedThisWeek: number;
  overdueDeliverables: number;
  pendingTimesheets: number;
  hoursSubmittedThisWeek: number;
  deliverablesSubmitted: number;
  deliverablesApproved: number;
  deliverablesNeedingRevision: number;
  totalConsultants: number;
  avgUtilization: number;
  invoicesSentThisWeek: number;
  invoicesSentAmount: number;
  outstandingAmount: number;
  collectedThisWeek: number;
  newReferrals: number;
  proposalsSent: number;
  newApplications: number;
  consultantsOnboarded: number;
  avgSatisfaction: number | null;
  expansionRequests: number;
  referralUpdates: { name: string; status: string }[];
  nuruInsight: string;
}) {
  const firstName = esc(name.split(" ")[0]);
  const isDirectorPlus = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const fmt = (n: number) => n.toLocaleString("en-NG");

  // Stat card helper
  const stat = (label: string, value: string, accent = false) =>
    `<td style="padding:12px;text-align:center;${accent ? "background:#FFFBEB;" : ""}">
      <p style="margin:0;font-size:20px;font-weight:700;color:${accent ? "#92400E" : "#0F2744"};">${value}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
    </td>`;

  // Project pulse row
  const projectRow = `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:16px 0;">
    <tr>
      ${stat("Active Projects", String(activeProjects))}
      ${stat("At Risk", String(atRiskProjects), atRiskProjects > 0)}
      ${stat("Completed", String(completedThisWeek))}
      ${stat("Overdue", String(overdueDeliverables), overdueDeliverables > 0)}
    </tr>
  </table>`;

  // Deliverables & timesheets
  const deliverableRow = `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:16px 0;">
    <tr>
      ${stat("Submitted", String(deliverablesSubmitted))}
      ${stat("Approved", String(deliverablesApproved))}
      ${stat("Needs Revision", String(deliverablesNeedingRevision), deliverablesNeedingRevision > 0)}
      ${stat("Hours Logged", `${fmt(hoursSubmittedThisWeek)}h`)}
    </tr>
  </table>`;

  // Pending action
  const pendingSection = pendingTimesheets > 0
    ? `<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#92400E;font-weight:600;">${pendingTimesheets} timesheet${pendingTimesheets > 1 ? "s" : ""} awaiting your approval</p>
      </div>`
    : "";

  // Revenue (Director+)
  const revenueSection = isDirectorPlus
    ? `<h2 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;">Revenue & Pipeline</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:8px 0;">
        <tr>
          ${stat("Invoiced", `\u20A6${fmt(invoicesSentAmount)}`)}
          ${stat("Collected", `\u20A6${fmt(collectedThisWeek)}`)}
          ${stat("Outstanding", `\u20A6${fmt(outstandingAmount)}`, outstandingAmount > 0)}
          ${stat("Invoices Sent", String(invoicesSentThisWeek))}
        </tr>
      </table>`
    : "";

  // Growth (Director+)
  const growthSection = isDirectorPlus
    ? `<h2 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;">Growth & Talent</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:8px 0;">
        <tr>
          ${stat("Referrals", String(newReferrals))}
          ${stat("Proposals Sent", String(proposalsSent))}
          ${stat("Applications", String(newApplications))}
          ${stat("Onboarded", String(consultantsOnboarded))}
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:8px 0;">
        <tr>
          ${stat("Consultants", String(totalConsultants))}
          ${stat("Utilization", `${avgUtilization}%`)}
          ${stat("Satisfaction", avgSatisfaction ? `${avgSatisfaction}/5` : "N/A")}
          ${stat("Expansion Asks", String(expansionRequests))}
        </tr>
      </table>`
    : "";

  // Nuru insight
  const insightSection = nuruInsight
    ? `<div style="background:#0F2744;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#D4AF37;font-weight:600;">Nuru Insight</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);font-style:italic;">${esc(nuruInsight)}</p>
      </div>`
    : "";

  const weekEnding = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  await send(
    email,
    `Your Week at CFA | ${weekEnding}`,
    layout(`
      ${h1(`Hi ${firstName}`)}
      <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">Week ending ${esc(weekEnding)}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Here is your weekly snapshot from the CFA platform.</p>

      <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;">Project Pulse</h2>
      ${projectRow}
      ${pendingSection}

      <h2 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;">Deliverables & Time</h2>
      ${deliverableRow}

      ${revenueSection}
      ${growthSection}
      ${referralUpdates.length > 0 ? `
      <h2 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#0F2744;text-transform:uppercase;letter-spacing:0.05em;">Your Referrals</h2>
      ${referralUpdates.map((r) => `<div style="padding:8px 12px;border-left:3px solid ${r.status === "CONVERTED" ? "#10B981" : "#3B82F6"};background:#F9FAFB;border-radius:0 6px 6px 0;margin:6px 0;">
        <p style="margin:0;font-size:13px;color:#374151;"><strong>${esc(r.name)}</strong> has been ${r.status === "CONVERTED" ? "onboarded" : "contacted"}.</p>
      </div>`).join("")}` : ""}
      ${insightSection}

      ${btn("Open Dashboard", `${BASE_URL}/dashboard`, "#0F2744")}
    `)
  );
}

export async function emailMaarovaInvite({
  email,
  name,
  organisationName,
  password,
}: {
  email: string;
  name: string;
  organisationName: string;
  password: string;
}) {
  const firstName = esc(name.split(" ")[0]);
  const safeEmail = esc(email);
  const safePassword = esc(password);
  const safeOrg = esc(organisationName);

  await send(
    email,
    `Your Maarova Assessment Access | Consult for Africa`,
    layout(`
      ${h1(`Welcome to Maarova, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been invited by <strong>${safeOrg}</strong> to complete a Maarova leadership assessment through Consult for Africa.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280;">
        Maarova is a psychometric assessment platform built specifically for healthcare leaders in Africa. Over the next 60 minutes, you will complete six assessment dimensions covering behavioural style, values, emotional intelligence, clinical leadership transition, and organisational culture. Your results will generate a personalised leadership profile and development roadmap.
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
        Please log in and change your password after your first session. The assessment can be completed in one sitting or across multiple sessions within 7 days.
      </p>
      ${btn("Start Your Assessment", `${BASE_URL}/maarova/portal/login`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you did not expect this invitation, please disregard this email or contact us at hello@consultforafrica.com.
      </p>
    `)
  );
}

// ─── Project & Team Notifications ─────────────────────────────────────────────

export async function emailEMChanged({
  oldEMEmail, oldEMName, newEMEmail, newEMName, projectName, changedByName,
}: {
  oldEMEmail: string; oldEMName: string; newEMEmail: string; newEMName: string; projectName: string; changedByName: string;
}) {
  await send(oldEMEmail, `Project reassigned: ${projectName}`,
    layout(`${h1("Project Reassigned")}${p(`You have been removed as Engagement Manager for ${projectName}.`)}${infoTable([["Project", projectName], ["New EM", newEMName], ["Changed by", changedByName]])}${p("If you believe this is an error, please contact the project director.")}`)
  );
  await send(newEMEmail, `New project assignment: ${projectName}`,
    layout(`${h1("You've Been Assigned as EM")}${p(`You have been assigned as the Engagement Manager for ${projectName}.`)}${infoTable([["Project", projectName], ["Previous EM", oldEMName], ["Assigned by", changedByName]])}${btn("View Project", `${BASE_URL}/projects`)}`)
  );
}

export async function emailAssignmentCreated({
  consultantEmail, consultantName, projectName, role, rateType, rateAmount, currency,
}: {
  consultantEmail: string; consultantName: string; projectName: string; role: string; rateType: string; rateAmount: string; currency: string;
}) {
  await send(consultantEmail, `Assignment request: ${role} on ${projectName}`,
    layout(`${h1("New Assignment Request")}${p(`You have been requested for a role on a CFA engagement. Please review and respond.`)}${infoTable([["Project", projectName], ["Role", role], ["Rate", `${currency} ${rateAmount} (${rateType})`]])}${p("You will need to accept this assignment before it becomes active.")}${btn("Review Assignment", `${BASE_URL}/opportunities`)}`)
  );
}

export async function emailAssignmentResponse({
  emEmail, consultantName, projectName, role, accepted, reason,
}: {
  emEmail: string; consultantName: string; projectName: string; role: string; accepted: boolean; reason?: string;
}) {
  await send(emEmail, `${consultantName} ${accepted ? "accepted" : "declined"}: ${role}`,
    layout(`${h1(`Assignment ${accepted ? "Accepted" : "Declined"}`)}${p(`${consultantName} has ${accepted ? "accepted" : "declined"} the ${role} role on ${projectName}.`)}${!accepted && reason ? p(`Reason: ${reason}`) : ""}${btn("View Project", `${BASE_URL}/projects`)}`)
  );
}

export async function emailStaffingInterest({
  emEmail, consultantName, role, projectName, note,
}: {
  emEmail: string; consultantName: string; role: string; projectName: string; note?: string;
}) {
  await send(emEmail, `${consultantName} interested in: ${role}`,
    layout(`${h1("Staffing Interest Received")}${p(`${consultantName} has expressed interest in the ${role} role on ${projectName}.`)}${note ? p(`Note: "${note}"`) : ""}${btn("Review in Pipeline", `${BASE_URL}/pipeline`)}`)
  );
}

export async function emailAssessmentComplete({
  adminEmail, candidateName, specialty, contentScore, integrityScore,
}: {
  adminEmail: string; candidateName: string; specialty: string; contentScore: number | null; integrityScore: number | null;
}) {
  await send(adminEmail, `Assessment complete: ${candidateName}`,
    layout(`${h1("Assessment Ready for Review")}${p(`${candidateName} has completed their consultant assessment.`)}${infoTable([["Candidate", candidateName], ["Specialty", specialty], ["Content Score", contentScore !== null ? `${contentScore}/100` : "Pending"], ["Integrity Score", integrityScore !== null ? `${integrityScore}/100` : "Pending"]])}${btn("Review Assessment", `${BASE_URL}/admin/assessments`)}`)
  );
}

export async function emailLeadConverted({
  emEmail, organizationName, projectName, convertedBy,
}: {
  emEmail: string; organizationName: string; projectName: string; convertedBy: string;
}) {
  await send(emEmail, `New client: ${organizationName}`,
    layout(`${h1("Lead Converted to Client")}${p(`${organizationName} has been converted from a lead to an active client.`)}${infoTable([["Client", organizationName], ["Project", projectName], ["Converted by", convertedBy]])}${btn("View Client", `${BASE_URL}/clients`)}`)
  );
}

export async function emailCoachingSessionScheduled({
  coacheeEmail, coacheeName, coachName, scheduledAt, meetingLink,
}: {
  coacheeEmail: string; coacheeName: string; coachName: string; scheduledAt: string; meetingLink?: string;
}) {
  const dateStr = new Date(scheduledAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  await send(coacheeEmail, `Coaching session: ${dateStr}`,
    layout(`${h1("Session Scheduled")}${p(`Your coaching session with ${coachName} has been scheduled.`)}${infoTable([["Date", dateStr], ["Coach", coachName]])}${meetingLink ? btn("Join Google Meet", meetingLink) : ""}`)
  );
}

export async function emailGoalAssigned({
  userEmail, userName, goalTitle, assignedBy, source,
}: {
  userEmail: string; userName: string; goalTitle: string; assignedBy: string; source: string;
}) {
  await send(userEmail, `New goal: ${goalTitle}`,
    layout(`${h1("Development Goal Assigned")}${p(`A new development goal has been assigned to you by ${assignedBy}.`)}${infoTable([["Goal", goalTitle], ["Source", source]])}${btn("View Goals", `${BASE_URL}/maarova/portal/development`)}`)
  );
}

export async function emailOutreachInvite({
  targetEmail, targetName, targetTitle, targetOrg, campaignName, inviteToken,
}: {
  targetEmail: string; targetName: string; targetTitle?: string; targetOrg?: string; campaignName: string; inviteToken: string;
}) {
  const firstName = targetName.split(" ")[0];
  const personalContext = targetTitle && targetOrg
    ? `As ${esc(targetTitle)} at ${esc(targetOrg)}, you are navigating`
    : "As a senior healthcare leader, you are navigating";

  const onboardUrl = `${BASE_URL}/maarova/onboard/${inviteToken}`;

  await send(targetEmail, `${firstName}, how do Africa's top healthcare leaders compare?`,
    layout(`
      ${h1(`${esc(firstName)}, where do you rank?`)}
      ${p(`${personalContext} one of the most complex leadership environments in the world: African healthcare.`)}
      ${p(`We built Maarova to answer a question most healthcare leaders never get objective data on: what are my actual leadership strengths, and where are my blind spots?`)}
      <div style="margin:16px 0;padding:16px 20px;background:#F9FAFB;border-radius:8px;border-left:4px solid #D4AF37;">
        <p style="margin:0;font-size:14px;color:#0F2744;font-weight:600;">What you get (completely free):</p>
        <ul style="margin:8px 0 0;padding-left:16px;color:#374151;font-size:13px;line-height:1.8;">
          <li>Your leadership archetype (how you lead under pressure)</li>
          <li>Emotional intelligence profile scored against African healthcare benchmarks</li>
          <li>Your top 3 signature strengths and 2 development edges</li>
          <li>How you compare to 100+ healthcare leaders across the continent</li>
        </ul>
      </div>
      ${p(`The assessment takes about 40 minutes. No preparation needed. You can pause and resume within 7 days.`)}
      ${btn("Take the Assessment", onboardUrl)}
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">
        This is a personal invitation, not a mass email. We select 20-30 leaders each month for this programme. Your results are private and shared only with you.
      </p>
      <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">
        Dr. Debo Odulana, Founding Partner<br/>Consult For Africa | hello@consultforafrica.com
      </p>
    `)
  );
}
