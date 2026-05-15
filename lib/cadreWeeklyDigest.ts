import { prisma } from "@/lib/prisma";
import type { CadreProfessionalCadre } from "@prisma/client";

/**
 * Per-recipient weekly digest content.
 *
 * Composed of cadre-relevant signals from the platform:
 * - Salary insight for their cadre (median + sample size)
 * - Featured hospital review (most recent in their state if any, else national)
 * - Career advisor prompt suggestion
 * - Open mandates relevant to them (cadre match, status OPEN)
 * - Credential renewal nudge if any expire within 30 days
 *
 * Each section degrades gracefully when there is no data, so first-100
 * users still receive a useful email even when network density is thin.
 */

export interface CadreDigestContent {
  professionalId: string;
  firstName: string;
  email: string;
  cadre: string;
  state: string | null;
  sections: {
    salary?: {
      cadre: string;
      median: number;
      sampleSize: number;
      state: string | null;
    };
    hospitalReview?: {
      facilityName: string;
      facilitySlug: string;
      overallRating: number;
      excerpt: string;
      createdAt: string;
    };
    openMandates?: Array<{
      id: string;
      title: string;
      facility: string | null;
      city: string | null;
    }>;
    expiringCredential?: {
      type: string;
      regulatoryBody: string;
      daysLeft: number;
    };
    advisorPrompt: string;
  };
}

const ADVISOR_PROMPTS_BY_CADRE: Record<string, string[]> = {
  MEDICINE: [
    "Compare PLAB vs Royal Colleges for someone with my background",
    "Walk me through Canada's NAC OSCE step-by-step",
    "What's a realistic monthly salary for a registrar in Lagos vs Abuja",
  ],
  NURSING: [
    "How do I prepare for the UK NMC OSCE practically",
    "Compare Canadian provinces for an internationally trained nurse",
    "Which Nigerian hospital cadre pays best for ICU experience",
  ],
  PHARMACY: [
    "Walk me through the US FPGEE process",
    "What's the salary range for a clinical pharmacist in Nigeria",
    "How do UK pharmacy locum rates compare to Nigeria",
  ],
};

const GENERIC_PROMPTS = [
  "Help me plan my next career move in healthcare",
  "What salary band should I be targeting right now",
  "Where in Nigeria pays the best for my cadre",
];

function pickAdvisorPrompt(cadre: string, seed: number): string {
  const pool = ADVISOR_PROMPTS_BY_CADRE[cadre] ?? GENERIC_PROMPTS;
  return pool[seed % pool.length];
}

export async function getDigestRecipients() {
  // Active recipients: verified email, has a hash (claimed), not in suppression
  return prisma.cadreProfessional.findMany({
    where: {
      emailVerified: true,
      passwordHash: { not: null },
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      cadre: true,
      state: true,
    },
  });
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const hit = await prisma.communicationSuppression.findFirst({
    where: {
      email: email.toLowerCase(),
      OR: [{ channel: "EMAIL" }, { channel: null }],
    },
    select: { id: true },
  });
  return !!hit;
}

export async function buildDigestForProfessional(
  professional: { id: string; firstName: string; email: string; cadre: string; state: string | null },
  seed: number,
): Promise<CadreDigestContent | null> {
  const cadre = professional.cadre as CadreProfessionalCadre;

  const [salaryReports, hospitalReview, openMandates, expiringCredential] = await Promise.all([
    // Salary insight for this cadre (prefer their state if data exists)
    professional.state
      ? prisma.cadreSalaryReport.findMany({
          where: { cadre, state: professional.state },
          select: { totalMonthlyTakeHome: true, baseSalary: true },
          orderBy: { reportedAt: "desc" },
          take: 100,
        })
      : prisma.cadreSalaryReport.findMany({
          where: { cadre },
          select: { totalMonthlyTakeHome: true, baseSalary: true },
          orderBy: { reportedAt: "desc" },
          take: 100,
        }),

    // One featured hospital review (recent, prefer same state)
    prisma.cadreFacilityReview.findFirst({
      where: professional.state ? { facility: { state: professional.state } } : {},
      orderBy: { createdAt: "desc" },
      select: {
        overallRating: true,
        pros: true,
        cons: true,
        bestThing: true,
        worstThing: true,
        createdAt: true,
        facility: { select: { name: true, slug: true } },
      },
    }),

    // Open mandates relevant to this cadre (cap at 3)
    prisma.cadreMandate.findMany({
      where: { status: "OPEN", cadre },
      select: { id: true, title: true, facilityName: true, locationCity: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }).catch(() => [] as Array<{ id: string; title: string; facilityName: string | null; locationCity: string | null }>),

    // Credential expiring within 30 days
    prisma.cadreCredential.findFirst({
      where: {
        professionalId: professional.id,
        expiryDate: {
          gte: new Date(),
          lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { expiryDate: "asc" },
      select: { type: true, regulatoryBody: true, expiryDate: true },
    }),
  ]);

  const sections: CadreDigestContent["sections"] = {
    advisorPrompt: pickAdvisorPrompt(professional.cadre, seed),
  };

  // Salary
  if (salaryReports.length >= 3) {
    const figures = salaryReports
      .map((r) => Number(r.totalMonthlyTakeHome ?? r.baseSalary ?? 0))
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    if (figures.length >= 3) {
      const median = figures[Math.floor(figures.length / 2)];
      sections.salary = {
        cadre: professional.cadre,
        median,
        sampleSize: figures.length,
        state: professional.state,
      };
    }
  }

  // Hospital review
  if (hospitalReview) {
    const positives = hospitalReview.pros ?? hospitalReview.bestThing ?? "";
    const negatives = hospitalReview.cons ?? hospitalReview.worstThing ?? "";
    const excerpt = (positives + (negatives ? " · " + negatives : "")).slice(0, 200).trim();
    if (excerpt) {
      sections.hospitalReview = {
        facilityName: hospitalReview.facility.name,
        facilitySlug: hospitalReview.facility.slug,
        overallRating: hospitalReview.overallRating,
        excerpt,
        createdAt: hospitalReview.createdAt.toISOString(),
      };
    }
  }

  // Open mandates
  if (openMandates.length > 0) {
    sections.openMandates = openMandates.map((m) => ({
      id: m.id,
      title: m.title,
      facility: m.facilityName,
      city: m.locationCity,
    }));
  }

  // Credential renewal
  if (expiringCredential?.expiryDate) {
    const daysLeft = Math.ceil(
      (expiringCredential.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    sections.expiringCredential = {
      type: expiringCredential.type,
      regulatoryBody: expiringCredential.regulatoryBody,
      daysLeft,
    };
  }

  // Skip the digest entirely if there's nothing beyond a generic prompt.
  // Cuts noise for first-week users with no actionable content yet.
  const meaningfulSections =
    !!sections.salary ||
    !!sections.hospitalReview ||
    !!(sections.openMandates && sections.openMandates.length > 0) ||
    !!sections.expiringCredential;

  if (!meaningfulSections) return null;

  return {
    professionalId: professional.id,
    firstName: professional.firstName,
    email: professional.email,
    cadre: professional.cadre,
    state: professional.state,
    sections,
  };
}

const CADRE_LABELS: Record<string, string> = {
  MEDICINE: "Doctors",
  DENTISTRY: "Dentists",
  NURSING: "Nurses",
  MIDWIFERY: "Midwives",
  PHARMACY: "Pharmacists",
  MEDICAL_LABORATORY_SCIENCE: "Medical lab scientists",
  RADIOGRAPHY_IMAGING: "Radiographers",
  REHABILITATION_THERAPY: "Physiotherapists",
  OPTOMETRY: "Optometrists",
  COMMUNITY_HEALTH: "Community health workers",
  ENVIRONMENTAL_HEALTH: "Environmental health officers",
  NUTRITION_DIETETICS: "Nutritionists",
  PSYCHOLOGY_SOCIAL_WORK: "Clinical psychologists / social workers",
  PUBLIC_HEALTH: "Public health professionals",
  HEALTH_ADMINISTRATION: "Health administrators",
  HEALTH_RECORDS: "Health records officers",
  HOSPITAL_MANAGEMENT: "Hospital managers",
  BIOMEDICAL_ENGINEERING: "Biomedical engineers",
};

const CRED_LABELS: Record<string, string> = {
  PRACTICING_LICENSE: "practising license",
  FULL_REGISTRATION: "full registration",
  COGS: "COGS",
  SPECIALIST_REGISTRATION: "specialist registration",
  ADDITIONAL_LICENSE: "additional license",
};

function formatNgn(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

export function renderDigestHtml(d: CadreDigestContent, baseUrl: string): { subject: string; html: string; text: string } {
  const cadreWord = CADRE_LABELS[d.cadre] ?? "your cadre";
  const subjectParts: string[] = [];
  if (d.sections.salary) {
    subjectParts.push(
      `${cadreWord} ${d.sections.salary.state ? "in " + d.sections.salary.state + " " : ""}earn ${formatNgn(d.sections.salary.median)}`,
    );
  }
  if (d.sections.expiringCredential) {
    subjectParts.push(`${d.sections.expiringCredential.daysLeft}-day renewal alert`);
  }
  if (d.sections.openMandates && d.sections.openMandates.length > 0) {
    subjectParts.push(`${d.sections.openMandates.length} new mandate${d.sections.openMandates.length === 1 ? "" : "s"}`);
  }
  const subject = subjectParts.length > 0
    ? `${subjectParts.slice(0, 2).join(" · ")} (this week on CadreHealth)`
    : `This week on CadreHealth, ${d.firstName}`;

  const sections: string[] = [];
  const textSections: string[] = [];

  if (d.sections.expiringCredential) {
    const c = d.sections.expiringCredential;
    sections.push(`
      <div style="background:#FEE2E2;border:1px solid #FECACA;border-radius:12px;padding:18px;margin-bottom:14px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#991B1B;">Renewal due</p>
        <p style="margin:0;font-size:15px;color:#7F1D1D;">Your ${CRED_LABELS[c.type] ?? c.type} (${c.regulatoryBody}) expires in <strong>${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"}</strong>.</p>
        <a href="${baseUrl}/oncadre/profile#credentials" style="display:inline-block;margin-top:10px;background:#991B1B;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;">Renew now</a>
      </div>
    `);
    textSections.push(`RENEWAL DUE: Your ${c.type} (${c.regulatoryBody}) expires in ${c.daysLeft} days. ${baseUrl}/oncadre/profile#credentials`);
  }

  if (d.sections.salary) {
    const s = d.sections.salary;
    sections.push(`
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:18px;margin-bottom:14px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#065F46;">Salary insight</p>
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#065F46;">${formatNgn(s.median)} / month</p>
        <p style="margin:0;font-size:13px;color:#047857;">Median take-home for ${cadreWord.toLowerCase()}${s.state ? " in " + s.state : " nationwide"}, based on ${s.sampleSize} recent report${s.sampleSize === 1 ? "" : "s"}.</p>
        <a href="${baseUrl}/oncadre/salary-map" style="display:inline-block;margin-top:10px;background:#047857;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;">See the full map</a>
      </div>
    `);
    textSections.push(`SALARY INSIGHT: ${cadreWord} ${s.state ? "in " + s.state : "nationwide"} earn ${formatNgn(s.median)}/mo (n=${s.sampleSize}). ${baseUrl}/oncadre/salary-map`);
  }

  if (d.sections.hospitalReview) {
    const r = d.sections.hospitalReview;
    const stars = "★".repeat(r.overallRating) + "☆".repeat(5 - r.overallRating);
    sections.push(`
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:18px;margin-bottom:14px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#1E40AF;">Hospital spotlight</p>
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1E3A8A;">${r.facilityName}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#3B82F6;letter-spacing:0.1em;">${stars}</p>
        <p style="margin:0;font-size:13px;color:#1E40AF;font-style:italic;">&ldquo;${r.excerpt}&rdquo;</p>
        <a href="${baseUrl}/oncadre/hospitals/${r.facilitySlug}" style="display:inline-block;margin-top:10px;background:#1E40AF;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;">Read full review</a>
      </div>
    `);
    textSections.push(`HOSPITAL: ${r.facilityName} (${r.overallRating}/5). ${r.excerpt} -- ${baseUrl}/oncadre/hospitals/${r.facilitySlug}`);
  }

  if (d.sections.openMandates && d.sections.openMandates.length > 0) {
    const items = d.sections.openMandates
      .map(
        (m) => `<li style="margin:0 0 6px;">
          <a href="${baseUrl}/oncadre/mandates/${m.id}" style="color:#0B3C5D;font-weight:600;text-decoration:none;">${m.title}</a>
          ${m.facility ? `<span style="color:#6B7280;"> · ${m.facility}${m.city ? ", " + m.city : ""}</span>` : ""}
        </li>`,
      )
      .join("");
    sections.push(`
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:18px;margin-bottom:14px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#92400E;">Mandates open for your cadre</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#92400E;">${items}</ul>
      </div>
    `);
    textSections.push(
      `MANDATES: ${d.sections.openMandates.map((m) => `${m.title} (${m.facility ?? "facility tbc"})`).join("; ")}`,
    );
  }

  // Advisor prompt -- always present
  const advisorLink = `${baseUrl}/oncadre/advisor?q=${encodeURIComponent(d.sections.advisorPrompt)}`;
  sections.push(`
    <div style="background:linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 100%);border-radius:12px;padding:18px;margin-bottom:14px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#D4AF37;">Career advisor</p>
      <p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.85);">&ldquo;${d.sections.advisorPrompt}&rdquo;</p>
      <a href="${advisorLink}" style="display:inline-block;background:#D4AF37;color:#0B3C5D;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;">Ask Nuru</a>
    </div>
  `);
  textSections.push(`ADVISOR: "${d.sections.advisorPrompt}" -- ${advisorLink}`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1F2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #E5EAF0;overflow:hidden;">
        <tr><td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#D4AF37;">CadreHealth weekly</p>
          <h1 style="margin:6px 0 0;font-size:22px;color:#0B3C5D;">Hi ${d.firstName},</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#6B7280;">A short, curated read for your week.</p>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;">
          ${sections.join("")}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;text-align:center;">
          You're getting this because you joined CadreHealth. <a href="${baseUrl}/oncadre/settings/notifications" style="color:#6B7280;">Manage emails</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${d.firstName},

A short, curated read for your week on CadreHealth.

${textSections.join("\n\n")}

--
Manage email preferences: ${baseUrl}/oncadre/settings/notifications`;

  return { subject, html, text };
}
