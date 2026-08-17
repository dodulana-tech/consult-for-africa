import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const schema = z.object({
  // 1 the role
  organisation: z.string().trim().min(1, "Organisation is required"),
  businessUnit: z.string().trim().optional().default(""),
  roleTitle: z.string().trim().min(1, "Role title is required"),
  positions: z.string().trim().optional().default("1"),
  reportsTo: z.string().trim().optional().default(""),
  directReports: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  employmentBasis: z.string().trim().optional().default(""),
  startBy: z.string().trim().optional().default(""),
  urgency: z.string().trim().optional().default(""),

  // 2 accountability
  ownsPnl: z.string().trim().optional().default(""),
  pnlScale: z.string().trim().optional().default(""),
  accountabilities: z.string().trim().optional().default(""),
  first90Days: z.string().trim().optional().default(""),
  successAt12Months: z.string().trim().optional().default(""),

  // 3 person specification
  qualifications: z.array(z.string()).optional().default([]),
  registration: z.string().trim().optional().default(""),
  experienceYears: z.string().trim().optional().default(""),
  sectorExperience: z.array(z.string()).optional().default([]),
  mustHave: z.string().trim().optional().default(""),
  niceToHave: z.string().trim().optional().default(""),
  dealBreakers: z.string().trim().optional().default(""),
  competencies: z.array(z.string()).optional().default([]),
  openToDiaspora: z.string().trim().optional().default(""),

  // 4 package and budget
  baseSalary: z.string().trim().optional().default(""),
  allowances: z.string().trim().optional().default(""),
  variablePay: z.string().trim().optional().default(""),
  benefits: z.array(z.string()).optional().default([]),
  totalPackage: z.string().trim().optional().default(""),
  packageCeiling: z.string().trim().optional().default(""),
  budgetStatus: z.string().trim().optional().default(""),
  secondmentInterest: z.string().trim().optional().default(""),

  // 5 process and contacts
  interviewers: z.string().trim().optional().default(""),
  processPreference: z.string().trim().optional().default(""),
  internalCandidates: z.string().trim().optional().default(""),
  confidential: z.string().trim().optional().default(""),
  blockedCompanies: z.string().trim().optional().default(""),
  contactName: z.string().trim().min(1, "Contact name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
  billingContact: z.string().trim().optional().default(""),
  billingEmail: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  termsAccepted: z.boolean().refine((v) => v, "Terms must be accepted"),
});

const resend = new Resend(process.env.RESEND_API_KEY ?? "noop");

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const POST = handler(async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const list = (a: string[]) => (a.length ? a.join(", ") : "");

  const sections: Array<[string, Array<[string, string]>]> = [
    ["The role", [
      ["Organisation", d.organisation],
      ["Business unit", d.businessUnit],
      ["Role title", d.roleTitle],
      ["Positions", d.positions],
      ["Reports to", d.reportsTo],
      ["Direct reports", d.directReports],
      ["Location", d.location],
      ["Employment basis", d.employmentBasis],
      ["Needed by", d.startBy],
      ["Urgency", d.urgency],
    ]],
    ["Accountability", [
      ["Owns a P&L", d.ownsPnl],
      ["P&L scale", d.pnlScale],
      ["Key accountabilities", d.accountabilities],
      ["First 90 days", d.first90Days],
      ["Success at 12 months", d.successAt12Months],
    ]],
    ["Person specification", [
      ["Qualifications", list(d.qualifications)],
      ["Registration required", d.registration],
      ["Experience", d.experienceYears],
      ["Sector experience", list(d.sectorExperience)],
      ["Must have", d.mustHave],
      ["Nice to have", d.niceToHave],
      ["Deal breakers", d.dealBreakers],
      ["Priority competencies", list(d.competencies)],
      ["Open to diaspora candidates", d.openToDiaspora],
    ]],
    ["Package and budget", [
      ["Base salary", d.baseSalary],
      ["Allowances", d.allowances],
      ["Variable pay", d.variablePay],
      ["Benefits", list(d.benefits)],
      ["Total first-year package", d.totalPackage],
      ["Ceiling", d.packageCeiling],
      ["Budget status", d.budgetStatus],
      ["Interim secondment interest", d.secondmentInterest],
    ]],
    ["Process and contacts", [
      ["Interviewers", d.interviewers],
      ["Process preference", d.processPreference],
      ["Internal candidates", d.internalCandidates],
      ["Confidential search", d.confidential],
      ["Companies not to approach", d.blockedCompanies],
      ["Requested by", d.contactName],
      ["Email", d.email],
      ["Phone", d.phone],
      ["Billing contact", d.billingContact],
      ["Billing email", d.billingEmail],
      ["Notes", d.notes],
    ]],
  ];

  const inboundMessage = sections
    .map(([title, rows]) => {
      const body = rows.filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v}`).join("\n");
      return body ? `${title}\n${body}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  try {
    await prisma.lead.create({
      data: {
        source: "RECRUITMENT_BRIEF",
        status: "NEW",
        organizationName: d.organisation,
        contactName: d.contactName,
        contactEmail: d.email.toLowerCase(),
        contactPhone: d.phone || null,
        inboundMessage,
        inboundProjectType: "RECRUITMENT",
      },
    });
  } catch (err) {
    console.error("[recruitment-brief] lead creation failed", err);
  }

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6B7280;font-size:12px;vertical-align:top;width:170px">${esc(label)}</td><td style="padding:6px 0;font-size:13px;color:#111827">${esc(value).replace(/\n/g, "<br>")}</td></tr>`;

  const html = `
    <div style="font-family:sans-serif;max-width:660px;margin:0 auto">
      <h2 style="color:#0F2744;margin-bottom:4px">Recruitment brief: ${esc(d.roleTitle)}</h2>
      <p style="color:#6B7280;font-size:13px;margin:0 0 18px">${esc(d.organisation)}${d.businessUnit ? " / " + esc(d.businessUnit) : ""}</p>
      <div style="background:#FEF3E2;border-left:3px solid #B8763A;padding:10px 14px;margin-bottom:18px">
        <p style="margin:0;font-size:13px;color:#7A3F14"><strong>Action:</strong> raise the engagement invoice. The search opens on receipt of funds.</p>
      </div>
      ${sections
        .map(([title, rows]) => {
          const body = rows.filter(([, v]) => v).map(([k, v]) => row(k, v)).join("");
          return body
            ? `<h3 style="color:#0F2744;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;margin:20px 0 6px">${esc(title)}</h3><table style="width:100%;border-collapse:collapse">${body}</table>`
            : "";
        })
        .join("")}
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Consult For Africa <platform@consultforafrica.com>",
        to: "hello@consultforafrica.com",
        cc: "finance@consultforafrica.com",
        replyTo: d.email,
        subject: `Recruitment brief: ${d.roleTitle} (${d.organisation})`,
        html,
      });
    } catch (err) {
      console.error("[recruitment-brief] email send failed", err);
    }
  } else {
    console.log("[recruitment-brief] RESEND not configured, skipping email");
  }

  return NextResponse.json({ success: true });
});
