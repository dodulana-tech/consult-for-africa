/**
 * Stand up the House of Refuge leadership assessment.
 *
 * Three things happen here:
 *   1. A "House of Refuge" Maarova org, on the DEVELOPMENT stream.
 *   2. A shared staff join link, so the team registers itself instead of us
 *      creating and emailing every member of staff by hand.
 *   3. Two named accounts with invite emails:
 *        Bisi Soji-Oyawoye  - the coach Pastor Tony Rapu sent to train the
 *                             staff. Takes the assessment first, as a trial,
 *                             so she knows what the staff will meet.
 *        Morolake Olumogba  - PT's office, overseeing the process. HR_ADMIN so
 *                             she can see who has started and finished, and the
 *                             org contact so her own assessment is not counted
 *                             against the staff places.
 *
 * Usage (dry run first, it prints what it would do and sends nothing):
 *   npx tsx --env-file=.env.local scripts/setup-house-of-refuge-maarova.ts
 *   npx tsx --env-file=.env.local scripts/setup-house-of-refuge-maarova.ts --apply
 *
 * --env-file=.env.local is not optional: without it ZEPTOMAIL_API_KEY is
 * missing and the script refuses to send rather than falling back to SMTP.
 */
import { PrismaClient, type MaarovaUserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendTransactionalEmail } from "@/lib/zeptomail";

const prisma = new PrismaClient();

const SITE = "https://consultforafrica.com";
const PORTAL = `${SITE}/maarova/portal/login`;
const FROM = "Consult For Africa <platform@consultforafrica.com>";
const REPLY_TO = "hello@consultforafrica.com";

const ORG = {
  name: "House of Refuge",
  type: "ngo",
  country: "Nigeria",
  city: "Lagos",
  stream: "DEVELOPMENT" as const,
  // Places on the staff join link. Raise it here if the staff body is larger.
  maxAssessments: 40,
  contactName: "Morolake Olumogba",
  contactEmail: "morolakeolumogba@gmail.com",
  notes:
    "Staff leadership assessment supporting the training Bisi Soji-Oyawoye is running at Pastor Tony Rapu's request (August 2026). " +
    "Staff self-register through the shared join link. Morolake Olumogba oversees on behalf of PT's office.",
};

interface Person {
  name: string;
  email: string;
  title: string;
  role: MaarovaUserRole;
  subject: string;
  body: (firstName: string, email: string, password: string) => string;
}

/* ── Email ────────────────────────────────────────────────────────────────── */

function layout(inner: string) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#F4F5F7;padding:32px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0F2744;padding:24px 32px;">
          <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.08em;">CONSULT FOR AFRICA</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${inner}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#FAFBFC;border-top:1px solid #E8EBF0;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.5;">
            Consult For Africa &nbsp;&middot;&nbsp; hello@consultforafrica.com &nbsp;&middot;&nbsp; consultforafrica.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function credentials(email: string, password: string) {
  return `
  <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;font-weight:600;">Your login</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;width:150px;">Portal</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;"><a href="${PORTAL}" style="color:#0F2744;">${PORTAL}</a></td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Email</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${email}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Temporary password</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;font-family:monospace;letter-spacing:0.5px;">${password}</td>
      </tr>
    </table>
    <p style="margin:14px 0 0;font-size:12px;color:#6B7280;">Please change the password on your first visit.</p>
  </div>`;
}

function signature() {
  return `
  <p style="margin:24px 0 4px;font-size:15px;color:#111827;">With warm regards,</p>
  <p style="margin:0 0 2px;font-size:15px;color:#111827;font-weight:600;">Dr Debo Odulana</p>
  <p style="margin:0;font-size:14px;color:#6B7280;">Founding Partner, Consult For Africa</p>`;
}

const WHAT_IT_IS = `
  <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#4B5563;">
    The assessment takes about 40 minutes. It covers behavioural style, values, emotional intelligence,
    how someone carries authority in a team, and how they read the culture around them. You can pause and
    pick it up again within seven days. At the end it produces a personal leadership profile and a
    development roadmap.
  </p>`;

const PEOPLE: Person[] = [
  {
    name: "Bisi Soji-Oyawoye",
    email: "bisobee@gmail.com",
    title: "Coach",
    role: "USER",
    subject: "Your place on the House of Refuge leadership assessment",
    body: (firstName, email, password) => `
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0F2744;">Dear ${firstName},</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        Pastor Tony Rapu has asked you to train the staff at House of Refuge, and we are glad to support
        that work. We are putting a structured leadership assessment behind it, so your sessions can start
        from what the team actually needs rather than from a blank page.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        Before it goes to the staff, we would like you to go through it yourself. You will see exactly what
        they will be asked, and you can shape the training around what it surfaces.
      </p>
      ${WHAT_IT_IS}
      ${credentials(email, password)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        Once you have been through it, tell us what you would want the staff to be asked. We can tune the
        group read before the team starts.
      </p>
      ${signature()}`,
  },
  {
    name: "Morolake Olumogba",
    email: "morolakeolumogba@gmail.com",
    title: "Oversight, Pastor Tony Rapu's office",
    role: "HR_ADMIN",
    subject: "Your access to the House of Refuge leadership assessment",
    body: (firstName, email, password) => `
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0F2744;">Dear ${firstName},</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        We understand you are keeping an eye on the House of Refuge staff training on behalf of Pastor Tony
        Rapu's office. A structured leadership assessment sits behind that work, and your login gives you
        two things.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        The first is your own assessment, so you have been through what you are overseeing. The second is an
        oversight view showing who has started and who has finished. Individual results stay private to each
        member of staff. What informs the training is the group picture, not anyone's personal profile.
      </p>
      ${WHAT_IT_IS}
      ${credentials(email, password)}
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
        If anything looks off as the team works through it, tell us early and we will put it right.
      </p>
      ${signature()}`,
  },
];

/* ── Run ──────────────────────────────────────────────────────────────────── */

async function main() {
  const apply = process.argv.includes("--apply");

  if (apply && !process.env.ZEPTOMAIL_API_KEY) {
    throw new Error(
      "ZEPTOMAIL_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/setup-house-of-refuge-maarova.ts --apply"
    );
  }

  console.log(apply ? "APPLYING\n" : "DRY RUN, nothing is written or sent. Add --apply to run it for real.\n");

  // 1. Organisation
  let org = await prisma.maarovaOrganisation.findFirst({
    where: { name: { equals: ORG.name, mode: "insensitive" } },
    select: { id: true, name: true, joinToken: true, joinEnabled: true, maxAssessments: true },
  });

  if (!org) {
    console.log(`Org:   create "${ORG.name}" (${ORG.stream}, ${ORG.maxAssessments} places)`);
    if (apply) {
      org = await prisma.maarovaOrganisation.create({
        data: { ...ORG, isActive: true },
        select: { id: true, name: true, joinToken: true, joinEnabled: true, maxAssessments: true },
      });
      console.log(`       created ${org.id}`);
    }
  } else {
    console.log(`Org:   using existing "${org.name}" (${org.id})`);
  }

  // 2. Staff join link
  const token = org?.joinToken ?? randomBytes(24).toString("base64url");
  const joinUrl = `${SITE}/maarova/join/${token}`;
  console.log(`Link:  ${joinUrl}`);
  if (apply && org && (!org.joinToken || !org.joinEnabled)) {
    await prisma.maarovaOrganisation.update({
      where: { id: org.id },
      data: { joinToken: token, joinEnabled: true },
    });
    console.log("       opened");
  }

  // 3. Named accounts
  console.log("");
  for (const person of PEOPLE) {
    const email = person.email.toLowerCase();
    const existing = await prisma.maarovaUser.findUnique({ where: { email }, select: { id: true } });
    console.log(`User:  ${person.name} <${email}> as ${person.role}${existing ? " (exists, password reset)" : ""}`);

    if (!apply) continue;
    if (!org) throw new Error("Organisation missing");

    const tempPassword = randomBytes(9).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = existing
      ? await prisma.maarovaUser.update({
          where: { id: existing.id },
          data: {
            organisationId: org.id,
            name: person.name,
            title: person.title,
            role: person.role,
            passwordHash,
            isPortalEnabled: true,
            invitedAt: new Date(),
          },
          select: { id: true },
        })
      : await prisma.maarovaUser.create({
          data: {
            organisationId: org.id,
            email,
            name: person.name,
            title: person.title,
            role: person.role,
            passwordHash,
            isPortalEnabled: true,
            invitedAt: new Date(),
          },
          select: { id: true },
        });

    const firstName = person.name.split(" ")[0];
    const result = await sendTransactionalEmail({
      from: FROM,
      replyTo: REPLY_TO,
      to: email,
      subject: person.subject,
      html: layout(person.body(firstName, email, tempPassword)),
    });

    await prisma.maarovaUser.update({
      where: { id: user.id },
      data: result.ok
        ? { inviteEmailStatus: "SENT", inviteEmailSentAt: new Date(), inviteEmailError: null }
        : { inviteEmailStatus: "FAILED", inviteEmailError: String(result.error).slice(0, 1000) },
    });

    console.log(`       ${result.ok ? "invite sent" : `SEND FAILED: ${result.error}`}`);
  }

  console.log(`\nStaff link to circulate: ${joinUrl}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
