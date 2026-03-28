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

const FROM = process.env.SMTP_FROM ?? "Consult For Africa <platform@consultforafrica.com>";

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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consult For Africa</title></head>
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

const BASE_URL = process.env.NEXTAUTH_URL ?? "";

export async function emailDeliverableSubmitted({
  emEmail,
  emName,
  consultantName,
  deliverableName,
  projectName,
  deliverableId,
  projectId,
  trackName,
}: {
  emEmail: string;
  emName: string;
  consultantName: string;
  deliverableName: string;
  projectName: string;
  deliverableId: string;
  projectId: string;
  trackName?: string;
}) {
  await send(
    emEmail,
    `New deliverable submitted: ${deliverableName}`,
    layout(`
      ${h1("Deliverable Submitted for Review")}
      ${p(`Hi ${emName}, a new deliverable has been submitted and is waiting for your review.`)}
      ${infoTable([
        ["Project", projectName],
        ...(trackName ? [["Track", trackName] as [string, string]] : []),
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
  trackName,
}: {
  consultantEmail: string;
  consultantName: string;
  totalHours: number;
  totalAmount: number;
  currency: string;
  projectName: string;
  trackName?: string;
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
        ...(trackName ? [["Track", trackName] as [string, string]] : []),
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
    Director: "As a Director, you will have oversight of practice-level performance, project portfolios, and team capacity across Consult For Africa.",
    Partner: "As a Partner, you will have full visibility into firm performance, client relationships, financial metrics, and strategic planning tools.",
    Admin: "As an Administrator, you will have full access to manage users, configure the platform, and oversee all operations.",
    "Academy Learner": "As an Academy Learner, you have access to C4A's training tracks, certifications, and learning resources to build your healthcare consulting capabilities.",
  };

  const intro = roleIntro[roleLabel] ?? "You now have access to project management, collaboration tools, and knowledge resources.";

  await send(
    email,
    `Welcome to Consult For Africa, ${name}`,
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been invited to join <strong>Consult For Africa</strong>, a specialist management consulting firm focused on healthcare and social impact across Africa.
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
    "Your Client Portal Access | Consult For Africa",
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Your client portal account for <strong>${safeClientName}</strong> is now active on the Consult For Africa platform.
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

export async function emailPartnerPortalInvite({
  contactEmail,
  contactName,
  partnerName,
  password,
}: {
  contactEmail: string;
  contactName: string;
  partnerName: string;
  password: string;
}) {
  const firstName = esc(contactName.split(" ")[0]);
  const safeEmail = esc(contactEmail);
  const safePassword = esc(password);
  const safePartnerName = esc(partnerName);

  await send(
    contactEmail,
    "Your Partner Portal Access | Consult For Africa",
    layout(`
      ${h1(`Welcome, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Your partner portal account for <strong>${safePartnerName}</strong> is now active on the Consult For Africa platform.
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6B7280;">
        Through the portal you can manage staffing requests, track consultant placements, view invoices, and communicate with the C4A team directly.
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
      ${btn("Log In to Portal", `${BASE_URL}/partner/login`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you did not expect this email, please disregard it or contact us at hello@consultforafrica.com.
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
        You have been added as a contact person for <strong>${safeClientName}</strong> on the Consult For Africa platform.
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
    "Password Reset | Consult For Africa Platform",
    layout(`
      ${h1("Password Reset")}
      ${p(`Hi ${firstName}, we received a request to reset your Consult For Africa platform password.`)}
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
    "Password Reset | Consult For Africa Client Portal",
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
    `360 Feedback Request | Consult For Africa`,
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
    `Your Week at C4A | ${weekEnding}`,
    layout(`
      ${h1(`Hi ${firstName}`)}
      <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">Week ending ${esc(weekEnding)}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Here is your weekly snapshot from the C4A platform.</p>

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
    `Your Maarova Assessment Access | Consult For Africa`,
    layout(`
      ${h1(`Welcome to Maarova, ${firstName}`)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        You have been invited by <strong>${safeOrg}</strong> to complete a Maarova leadership assessment through Consult For Africa.
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

export async function emailMaarovaCoachCredentials({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password: string;
}) {
  const firstName = esc(name.split(" ")[0]);
  const safeEmail = esc(email);
  const safePassword = esc(password);

  await send(
    email,
    `Your Maarova Coach Portal Access | Consult For Africa`,
    layout(`
      ${h1(`Welcome to Maarova Coach Portal, ${firstName}`)}
      ${p("Your coach portal access has been enabled. Use the credentials below to sign in.")}
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;">Your login credentials</p>
        ${infoTable([
          ["Email", safeEmail],
          ["Temporary password", safePassword],
        ])}
      </div>
      ${p("Please change your password after first login.")}
      ${btn("Sign In", `${BASE_URL}/maarova/coach/login`)}
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
  consultantEmail, consultantName, projectName, role, rateType, rateAmount, currency, trackName,
}: {
  consultantEmail: string; consultantName: string; projectName: string; role: string; rateType: string; rateAmount: string; currency: string; trackName?: string;
}) {
  await send(consultantEmail, `Assignment request: ${role} on ${projectName}`,
    layout(`${h1("New Assignment Request")}${p(`You have been requested for a role on a C4A engagement. Please review and respond.`)}${infoTable([["Project", projectName], ...(trackName ? [["Track", trackName] as [string, string]] : []), ["Role", role], ["Rate", `${currency} ${rateAmount} (${rateType})`]])}${p("You will need to accept this assignment before it becomes active.")}${btn("Review Assignment", `${BASE_URL}/opportunities`)}`)
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

// ─── Secondment Recall ───────────────────────────────────────────────────────

export async function emailSecondmentRecall({
  recipientEmail, recipientName, engagementName, reason, effectiveDate, isClient,
}: {
  recipientEmail: string; recipientName: string; engagementName: string;
  reason: string; effectiveDate: string; isClient: boolean;
}) {
  const roleContext = isClient
    ? "We are writing to inform you that the secondment arrangement"
    : "We are writing to inform you that your secondment";

  await send(recipientEmail, `Secondment Recall Notice: ${engagementName}`,
    layout(`
      ${h1("Secondment Recall Notice")}
      ${p(`Dear ${esc(recipientName)},`)}
      ${p(`${roleContext} for ${esc(engagementName)} is being recalled, effective ${esc(effectiveDate)}.`)}
      ${p(`<strong>Reason:</strong> ${esc(reason)}`)}
      ${p(`Our team will be in touch to discuss transition arrangements and next steps.`)}
      ${p(`If you have any questions, please contact us at hello@consultforafrica.com.`)}
    `)
  );
}

// ─── Meeting Invite ──────────────────────────────────────────────────────────

export async function sendMeetingInvite({
  to, participantName, meetingTitle, meetLink, scheduledAt, scheduledEndAt,
  organizerName, nuruEnabled,
}: {
  to: string; participantName: string; meetingTitle: string; meetLink: string;
  scheduledAt: Date; scheduledEndAt: Date; organizerName: string; nuruEnabled: boolean;
}) {
  const dateStr = scheduledAt.toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Africa/Lagos",
  });
  const startStr = scheduledAt.toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
  });
  const endStr = scheduledEndAt.toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
  });

  const nuruLine = nuruEnabled
    ? `<p style="margin:12px 0;padding:12px;background:#F0F7FF;border-radius:8px;font-size:13px;color:#374151;">
        <strong>Nuru</strong>, our meeting assistant, will join to take notes and capture action items automatically.
      </p>`
    : "";

  await send(to, `Meeting: ${meetingTitle}`,
    layout(`
      ${h1(meetingTitle)}
      ${p(`Hi ${esc(participantName)},`)}
      ${p(`${esc(organizerName)} has scheduled a meeting with you.`)}
      ${infoTable([
        ["Date", dateStr],
        ["Time", `${startStr} - ${endStr} (WAT)`],
        ["Organized by", organizerName],
      ])}
      ${nuruLine}
      ${btn("Join Google Meet", meetLink, "#1a73e8")}
      ${p("You can also join using this link:")}
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all;">
        <a href="${esc(meetLink)}" style="color:#1a73e8;">${esc(meetLink)}</a>
      </p>
    `)
  );
}

// ─── Meeting Summary ─────────────────────────────────────────────────────────

export async function sendMeetingSummary({
  to, participantName, meetingTitle, summary, actionItems, meetingDate,
}: {
  to: string; participantName: string; meetingTitle: string;
  summary: string; actionItems: string[]; meetingDate: Date;
}) {
  const dateStr = meetingDate.toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Africa/Lagos",
  });

  const actionList = actionItems.length > 0
    ? `<ul style="margin:12px 0;padding-left:20px;">
        ${actionItems.map(item => `<li style="margin:4px 0;font-size:14px;color:#374151;">${esc(item)}</li>`).join("")}
      </ul>`
    : "";

  await send(to, `Meeting Notes: ${meetingTitle}`,
    layout(`
      ${h1("Meeting Notes")}
      ${p(`Hi ${esc(participantName)},`)}
      ${p(`Here are the notes from your meeting "${esc(meetingTitle)}" on ${esc(dateStr)}.`)}
      <div style="margin:16px 0;padding:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0F2744;">Summary</h3>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">${esc(summary)}</p>
      </div>
      ${actionItems.length > 0 ? `
        <div style="margin:16px 0;">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0F2744;">Action Items</h3>
          ${actionList}
        </div>
      ` : ""}
      ${p("These notes were captured by Nuru, our meeting assistant.")}
    `)
  );
}

// ─── NDA Signing Invite ──────────────────────────────────────────────────────

export async function sendNdaSigningInvite({
  to, recipientName, ndaType, senderName, senderOrg, signingUrl, projectName,
}: {
  to: string; recipientName: string; ndaType: string;
  senderName: string; senderOrg: string; signingUrl: string;
  projectName?: string;
}) {
  const projectLine = projectName
    ? `<p style="margin:8px 0;padding:10px;background:#F9FAFB;border-radius:6px;font-size:12px;color:#374151;">
        Related engagement: <strong>${esc(projectName)}</strong>
      </p>`
    : "";

  await send(to, `NDA for your review: ${senderOrg}`,
    layout(`
      ${h1("Non-Disclosure Agreement")}
      ${p(`Dear ${esc(recipientName)},`)}
      ${p(`${esc(senderName)} from ${esc(senderOrg)} has prepared a ${esc(ndaType)} for your review and signature.`)}
      ${projectLine}
      ${p("Please click the button below to review the agreement and provide your electronic signature. The signing link is valid for 30 days.")}
      ${btn("Review & Sign NDA", signingUrl)}
      ${p("If you have questions about the agreement, please contact us at hello@consultforafrica.com.")}
      <p style="margin:16px 0 0;font-size:11px;color:#9CA3AF;">
        This NDA is governed by the laws of the Federal Republic of Nigeria. Electronic signatures are legally binding.
      </p>
    `)
  );
}

// ─── NDA Countersigned Notification ──────────────────────────────────────────

export async function sendNdaCountersigned({
  to, recipientName, ndaType, pdfUrl,
}: {
  to: string; recipientName: string; ndaType: string; pdfUrl?: string;
}) {
  await send(to, `NDA Fully Executed: ${ndaType}`,
    layout(`
      ${h1("NDA Fully Executed")}
      ${p(`Dear ${esc(recipientName)},`)}
      ${p(`Your ${esc(ndaType)} with Consult For Africa has been countersigned and is now active.`)}
      ${p("The confidentiality obligations outlined in the agreement are now in effect. A copy of the signed agreement is attached for your records.")}
      ${pdfUrl ? btn("Download Signed NDA", pdfUrl) : ""}
      ${p("Thank you for your cooperation. If you have any questions, please contact us at hello@consultforafrica.com.")}
    `)
  );
}

// ─── Invoice Sent Notification ───────────────────────────────────────────────

export async function emailInvoiceSent({
  clientEmail,
  clientName,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  viewUrl,
}: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  viewUrl: string;
}) {
  const firstName = esc(clientName.split(" ")[0]);

  await send(
    clientEmail,
    `Invoice ${invoiceNumber} from Consult For Africa`,
    layout(`
      ${h1("Invoice from Consult For Africa")}
      ${p(`Dear ${firstName},`)}
      ${p("Please find below the details of your invoice. We appreciate your continued partnership.")}
      ${infoTable([
        ["Invoice Number", invoiceNumber],
        ["Amount Due", amount],
        ["Currency", currency],
        ["Due Date", dueDate],
      ])}
      ${btn("View Invoice", viewUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#6B7280;line-height:1.6;">
        Please quote invoice number <strong>${esc(invoiceNumber)}</strong> on all payments and correspondence.
        If you have any questions about this invoice, please contact your engagement manager or reach out to us at
        <a href="mailto:finance@consultforafrica.com" style="color:#0F2744;font-weight:600;">finance@consultforafrica.com</a>.
      </p>
    `)
  );
}

// ─── Payment Received Confirmation ───────────────────────────────────────────

export async function emailPaymentReceived({
  clientEmail,
  clientName,
  invoiceNumber,
  amountPaid,
  balanceDue,
  currency,
}: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amountPaid: string;
  balanceDue: string;
  currency: string;
}) {
  const firstName = esc(clientName.split(" ")[0]);

  await send(
    clientEmail,
    `Payment received for ${invoiceNumber}`,
    layout(`
      ${h1("Payment Received")}
      ${p(`Dear ${firstName},`)}
      ${p("Thank you for your payment. This email confirms that we have received and recorded the following.")}
      ${infoTable([
        ["Invoice", invoiceNumber],
        ["Amount Received", amountPaid],
        ["Balance Remaining", balanceDue],
        ["Currency", currency],
      ])}
      ${p("Please retain this email as confirmation of your payment.")}
      <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
        If you believe there is a discrepancy, please contact us at
        <a href="mailto:finance@consultforafrica.com" style="color:#0F2744;font-weight:600;">finance@consultforafrica.com</a>.
      </p>
    `)
  );
}

// ─── Invoice Reminder (Dunning) ─────────────────────────────────────────────

const REMINDER_SUBJECTS: Record<string, string> = {
  FIRST_REMINDER: "Friendly reminder: Invoice {num} is past due",
  SECOND_REMINDER: "Invoice {num} requires your attention",
  FINAL_NOTICE: "Final notice: Invoice {num} is overdue",
  ESCALATION: "Urgent: Invoice {num} requires immediate attention",
};

const REMINDER_BODIES: Record<string, (name: string, days: number) => string> = {
  FIRST_REMINDER: (name, days) =>
    `We hope this finds you well. This is a friendly reminder that Invoice {num} was due ${days} day(s) ago. We would appreciate your prompt attention to this outstanding balance.`,
  SECOND_REMINDER: (name, days) =>
    `We are following up regarding Invoice {num}, which is now ${days} days past due. Please arrange payment at your earliest convenience to avoid any disruption to our engagement.`,
  FINAL_NOTICE: (name, days) =>
    `This is a final notice regarding Invoice {num}, which is now ${days} days overdue. We kindly request immediate payment to maintain good standing.`,
  ESCALATION: (name, days) =>
    `Invoice {num} is now ${days} days overdue and has been escalated to our senior leadership team. Please contact us immediately to arrange payment and discuss any concerns.`,
};

export async function emailInvoiceReminder({
  clientEmail,
  clientName,
  invoiceNumber,
  amount,
  currency,
  daysOverdue,
  reminderType,
}: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  daysOverdue: number;
  reminderType: string;
}) {
  const formatted = currency === "USD"
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${amount.toLocaleString("en-NG")}`;

  const subject = (REMINDER_SUBJECTS[reminderType] ?? "Invoice reminder: {num}").replace("{num}", invoiceNumber);
  const bodyFn = REMINDER_BODIES[reminderType] ?? REMINDER_BODIES.FIRST_REMINDER;
  const bodyText = bodyFn(clientName, daysOverdue).replace(/\{num\}/g, invoiceNumber);

  await send(clientEmail, subject,
    layout(`
      ${h1("Invoice Reminder")}
      ${p(`Dear ${esc(clientName)},`)}
      ${p(bodyText)}
      ${infoTable([
        ["Invoice", invoiceNumber],
        ["Amount due", formatted],
        ["Days overdue", String(daysOverdue)],
      ])}
      ${p("If you have already made payment, please disregard this notice and share the payment confirmation with us.")}
      ${p("Questions? Reach out at hello@consultforafrica.com.")}
    `)
  );
}

// ─── Payment Receipt ────────────────────────────────────────────────────────

export async function emailPaymentReceipt({
  clientEmail,
  clientName,
  invoiceNumber,
  amountPaid,
  balanceDue,
  currency,
  reference,
}: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  reference: string;
}) {
  const fmtPaid = currency === "USD"
    ? `$${amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${amountPaid.toLocaleString("en-NG")}`;
  const fmtBalance = currency === "USD"
    ? `$${balanceDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${balanceDue.toLocaleString("en-NG")}`;

  await send(clientEmail, `Payment received: ${invoiceNumber}`,
    layout(`
      ${h1("Payment Received")}
      ${p(`Dear ${esc(clientName)}, thank you for your payment.`)}
      ${infoTable([
        ["Invoice", invoiceNumber],
        ["Amount paid", fmtPaid],
        ["Balance remaining", fmtBalance],
        ["Reference", reference],
      ])}
      ${p("This email serves as your payment receipt. If you have any questions, please contact us at hello@consultforafrica.com.")}
    `)
  );
}

// ─── Rejection emails (segmented) ────────────────────────────────────────────

import type { RejectionSegment } from "./rejectionSegments";

interface RejectionEmailParams {
  email: string;
  firstName: string;
  segment: RejectionSegment;
  tempPassword: string;
}

const REJECTION_BODIES: Record<RejectionSegment, (firstName: string) => string> = {
  JUNIOR: (firstName) => `
    ${h1(`Thank you for applying, ${firstName}`)}
    ${p("We appreciate your interest in Consult For Africa. After reviewing your application, we believe you are at an early stage in your career and would benefit from structured development before joining our consulting engagements.")}
    ${p("We have created a C4A Academy account for you with free access to our Foundation training tracks. These cover core consulting skills, healthcare fundamentals, and professional standards that will prepare you for a consulting career in healthcare.")}
    ${p("We also encourage you to explore our Intern and SIWES programmes, which are designed specifically for early-career professionals looking to gain hands-on consulting experience in African healthcare.")}
    ${p("Once you complete the Foundation tracks and gain more experience, you are welcome to reapply. We would love to see you grow with us.")}
  `,

  WRONG_FIT: (firstName) => `
    ${h1(`Thank you for applying, ${firstName}`)}
    ${p("We appreciate your interest in Consult For Africa. After reviewing your application, we feel there are gaps between your current experience and the specific requirements of our healthcare consulting practice.")}
    ${p("We have created a C4A Academy account for you with free access to our Foundation training tracks. These will introduce you to our consulting methodology and the healthcare landscape we operate in.")}
    ${p("We also offer Specialist tracks that can help you build targeted expertise in areas like hospital operations, clinical governance, revenue cycle management, and health economics. Completing these tracks alongside your existing experience would strengthen a future application significantly.")}
    ${p("We encourage you to explore the Academy and consider reapplying after completing the Foundation programme and at least one Specialist track.")}
  `,

  WEAK_COMMS: (firstName) => `
    ${h1(`Thank you for applying, ${firstName}`)}
    ${p("We appreciate your interest in Consult For Africa. As a specialist management consulting firm, executive-level communication is central to how we deliver value to our clients. Based on our review, we believe there is room to strengthen this area before joining our engagements.")}
    ${p("We have created a C4A Academy account for you with free access to our Foundation training tracks, which include Professional Standards and Core Consulting Skills modules focused on executive communication, stakeholder presentations, and structured reporting.")}
    ${p("We also recommend our leadership assessment and coaching programmes, which provide personalised development plans and one-on-one coaching with experienced professionals.")}
    ${p("After developing these capabilities, we would welcome a future application from you.")}
  `,

  NOT_READY: (firstName) => `
    ${h1(`Thank you for applying, ${firstName}`)}
    ${p("We appreciate your interest in Consult For Africa. After careful review, we are unable to proceed with your application at this time.")}
    ${p("We have created a C4A Academy account for you with free access to our Foundation training tracks. These cover core consulting skills, healthcare fundamentals, and professional standards that are central to our work.")}
    ${p("The Academy is designed to help professionals develop the capabilities needed for healthcare consulting in Africa. We encourage you to take advantage of these resources and consider reapplying in the future.")}
  `,

  INTEGRITY_FLAGS: (firstName) => `
    ${h1(`Thank you for applying, ${firstName}`)}
    ${p("We appreciate your interest in Consult For Africa. After careful review, we are unable to proceed with your application at this time.")}
    ${p("We encourage you to explore the C4A Academy, our learning platform with training tracks covering healthcare consulting, leadership, and professional development.")}
    ${p("We wish you the best in your career.")}
  `,
};

export async function emailTalentRejection({
  email,
  firstName,
  segment,
  tempPassword,
}: RejectionEmailParams) {
  const safeFirst = esc(firstName);
  const safeEmail = esc(email);
  const safePassword = esc(tempPassword);
  const body = REJECTION_BODIES[segment](safeFirst);

  // Integrity flags get no account credentials
  const credentialsBlock = segment !== "INTEGRITY_FLAGS" ? `
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;">Your Academy login</p>
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
      Please change your password after your first login.
    </p>
    ${btn("Start Your Academy Journey", `${BASE_URL}/login`)}
  ` : `
    ${btn("Explore the Academy", `${BASE_URL}/academy`)}
  `;

  await send(
    email,
    "Your Application to Consult For Africa",
    layout(`
      ${body}
      ${credentialsBlock}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">
        If you have questions, please contact us at hello@consultforafrica.com.
      </p>
    `)
  );
}

export async function emailTrackPurchaseConfirmation({
  email,
  firstName,
  trackName,
  amountPaid,
}: {
  email: string;
  firstName: string;
  trackName: string;
  amountPaid: number;
}) {
  const fmtAmount = `\u20A6${amountPaid.toLocaleString("en-NG")}`;
  await send(
    email,
    `Enrollment confirmed: ${trackName}`,
    layout(`
      ${h1("Enrollment Confirmed")}
      ${p(`Hi ${esc(firstName)}, your payment has been received and you are now enrolled in the ${esc(trackName)} track.`)}
      ${infoTable([
        ["Track", trackName],
        ["Amount paid", fmtAmount],
      ])}
      ${btn("Start Learning", `${BASE_URL}/academy`)}
    `)
  );
}

// ─── Own Gig Approval Emails ─────────────────────────────────────────────────

export async function emailOwnGigPendingReview({
  adminEmail,
  adminName,
  consultantName,
  projectName,
  clientName,
  engagementId,
  hasConflict,
}: {
  adminEmail: string;
  adminName: string;
  consultantName: string;
  projectName: string;
  clientName: string;
  engagementId: string;
  hasConflict: boolean;
}) {
  const conflictWarning = hasConflict
    ? `<p style="margin:8px 0 16px;padding:8px 12px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:6px;font-size:13px;color:#92400E;">Potential client conflict detected. Please review carefully.</p>`
    : "";
  await send(
    adminEmail,
    `Own gig pending review: ${projectName}`,
    layout(`
      ${h1("New Own Gig Submitted")}
      ${p(`Hi ${adminName}, ${consultantName} has submitted a new own gig for approval.`)}
      ${conflictWarning}
      ${infoTable([
        ["Project", projectName],
        ["Client", clientName],
        ["Submitted by", consultantName],
      ])}
      ${btn("Review Now", `${BASE_URL}/admin/own-gig-approvals`)}
    `)
  );
}

export async function emailOwnGigApproved({
  consultantEmail,
  consultantName,
  projectName,
  clientName,
  engagementId,
  note,
}: {
  consultantEmail: string;
  consultantName: string;
  projectName: string;
  clientName: string;
  engagementId: string;
  note?: string;
}) {
  const noteSection = note ? p(`Note from reviewer: ${note}`) : "";
  await send(
    consultantEmail,
    `Your own gig has been approved: ${projectName}`,
    layout(`
      ${h1("Own Gig Approved")}
      ${p(`Hi ${consultantName}, your own gig has been approved. You can now proceed with project delivery.`)}
      ${infoTable([
        ["Project", projectName],
        ["Client", clientName],
      ])}
      ${noteSection}
      ${btn("View Project", `${BASE_URL}/projects/${engagementId}`)}
    `)
  );
}

export async function emailOwnGigRejected({
  consultantEmail,
  consultantName,
  projectName,
  clientName,
  note,
}: {
  consultantEmail: string;
  consultantName: string;
  projectName: string;
  clientName: string;
  note: string;
}) {
  await send(
    consultantEmail,
    `Your own gig was not approved: ${projectName}`,
    layout(`
      ${h1("Own Gig Not Approved")}
      ${p(`Hi ${consultantName}, your own gig submission was not approved.`)}
      ${infoTable([
        ["Project", projectName],
        ["Client", clientName],
        ["Reason", note],
      ])}
      ${p("If you have questions, please reach out to your engagement manager or a partner.")}
    `)
  );
}

export async function emailOwnGigChangesRequested({
  consultantEmail,
  consultantName,
  projectName,
  clientName,
  note,
  engagementId,
}: {
  consultantEmail: string;
  consultantName: string;
  projectName: string;
  clientName: string;
  note: string;
  engagementId: string;
}) {
  await send(
    consultantEmail,
    `Changes requested for your own gig: ${projectName}`,
    layout(`
      ${h1("Changes Requested")}
      ${p(`Hi ${consultantName}, a reviewer has requested changes to your own gig submission before it can be approved.`)}
      ${infoTable([
        ["Project", projectName],
        ["Client", clientName],
        ["Requested changes", note],
      ])}
      ${btn("View Gig", `${BASE_URL}/projects/${engagementId}`)}
    `)
  );
}
