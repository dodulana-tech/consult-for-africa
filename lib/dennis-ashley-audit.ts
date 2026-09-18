// The shape of the Dennis Ashley information request, shared by the
// client-facing project page, the uploader and the internal tracker so the
// three cannot disagree about what was asked for.
//
// Modelled on lib/osteon-audit.ts. Section letters here must stay in step with
// the SECTIONS regex in app/api/dennis-ashley-audit/upload/route.ts (A..N).
//
// Client: Dennis Ashley Medical Clinic & Endoscopy Suites (Oniru, Victoria
// Island, Lagos). Premium primary/wellness + endoscopy suites + a corporate
// employee-health book across an eleven-payer panel.

export const DA_ENGAGEMENT = "dennis-ashley";

export type RequestSection = {
  /** Letter as it appears in the document, or a pseudo-section. */
  key: string;
  title: string;
  /** One line telling the uploader what actually belongs here. */
  hint: string;
};

/** The nine that turn a tour into an audit. Ordered by what unlocks the most. */
export const PRIORITY_NINE: { n: number; what: string; why: string; section: string }[] = [
  { n: 1, section: "C", what: "Management accounts or the income and expenditure record, monthly, last 12 months", why: "What the clinic earns, and what it costs to stand still" },
  { n: 2, section: "C", what: "Bank statements for all business accounts, last 6 months", why: "The only unarguable record of what actually came in" },
  { n: 3, section: "E", what: "The eleven payers, with the tariff schedule and claims-settlement history for each, last 12 months", why: "Yield is decided here, and no two payers pay alike" },
  { n: 4, section: "F", what: "The corporate contract book: client, lives covered, scope, annual value and renewal date", why: "The demand base, and where its renewal risk sits" },
  { n: 5, section: "G", what: "Consultation and endoscopy volumes by month, last 12 months, against suite capacity", why: "Utilisation is the profit driver and the suite is the asset" },
  { n: 6, section: "H", what: "The current price card, and how a consultation and an endoscopy quote are built", why: "We cannot judge yield without knowing the list" },
  { n: 7, section: "D", what: "Billings and collections by month, split by payer and self-pay, last 12 months", why: "How much of what is billed actually converts to cash" },
  { n: 8, section: "K", what: "Full staff list with role, employment type and days worked per week, plus the rota", why: "Establishment against service is where small clinics fail" },
  { n: 9, section: "I", what: "Endoscopy scope and stack inventory, and the reprocessing / AER validation records", why: "The suite's core asset, and its single biggest compliance exposure" },
];

export const REQUEST_SECTIONS: RequestSection[] = [
  { key: "A", title: "The company, ownership and how decisions get made", hint: "CAC documents, shareholding, any shareholders' agreement, board or management notes, loans" },
  { key: "B", title: "Licensing, regulatory standing and insurance", hint: "HEFAMAA, MDCN and nursing licences, endoscopy decontamination compliance, NAFDAC where drugs are held, indemnity cover, clinical-waste contract" },
  { key: "C", title: "Money, in and out", hint: "Management accounts, bank statements, trial balance, asset register, monthly fixed costs" },
  { key: "D", title: "Billings, collections and receivables", hint: "Billings and collections by month, by payer and self-pay, claims ageing, denials with reasons, days to payment" },
  { key: "E", title: "Who pays: the payer panel", hint: "The eleven payers, the tariff or contract for each, claims performance and any debtor position" },
  { key: "F", title: "The corporate book", hint: "Employee-health contracts: client, lives, scope, annual value, renewal date, and any capitation or retainer" },
  { key: "G", title: "Activity and capacity", hint: "Consultation volumes by service line, endoscopy volumes by type against suite sessions, wellness and screening packages, no-shows and cancellations" },
  { key: "H", title: "Price card and how a quote is built", hint: "Self-pay price list, endoscopy bundles, and any published corporate or package rates" },
  { key: "I", title: "The endoscopy suite, decontamination and consumables", hint: "Scope and stack inventory, reprocessing and AER service and validation, consumable and reagent suppliers with unit prices, traceability" },
  { key: "J", title: "Clinical governance, outcomes and safety", hint: "Consent forms, incident and complication register, adverse events, follow-up, protocols and any outcome measures" },
  { key: "K", title: "People", hint: "Staff list, payroll, contracts, rota, joiners and leavers, visiting-consultant arrangements and fee splits, opening hours" },
  { key: "L", title: "Systems, records and premises", hint: "EMR, practice-management and billing systems and what they export, patient-database size, equipment register, lease or title, floor plan, power" },
  { key: "M", title: "Brand, referral and demand", hint: "Website analytics, marketing spend, referral sources and records, the corporate pipeline" },
  { key: "N", title: "Where you want to take it", hint: "Service lines designed but not yet launched, and where the board wants to take the clinic. Notes or a conversation are fine" },
];

/** Sections offered in the uploader, priority first and a catch-all last. */
export const UPLOAD_SECTIONS: RequestSection[] = [
  { key: "priority", title: "One of the nine priority items", hint: "The nine we need first" },
  ...REQUEST_SECTIONS,
  { key: "other", title: "Something else", hint: "Anything you think we should see that we did not ask for" },
];

export const sectionLabel = (key: string): string => {
  if (key === "priority") return "Priority nine";
  if (key === "other") return "Other";
  const s = REQUEST_SECTIONS.find((x) => x.key === key);
  return s ? `${s.key}. ${s.title}` : key;
};

/** The four audit surveys, linked from the client project page. */
export const SURVEYS = [
  {
    href: "/dennis-ashley-staff-survey.html",
    who: "Everyone who works at Dennis Ashley",
    title: "Staff survey",
    blurb: "How the clinic and the endoscopy suite actually run on a busy day, and whether people can speak up. Anonymous, and the answers come to Consult for Africa rather than to management.",
    minutes: "10 minutes",
    tag: "Anonymous",
  },
  {
    href: "/dennis-ashley-patient-survey.html",
    who: "Patients seen in the last year",
    title: "Patient survey",
    blurb: "Access, the consultation, the cost and HMO conversation, the endoscopy experience, and whether they would send someone else. Anonymous.",
    minutes: "5 minutes",
    tag: "Anonymous",
  },
  {
    href: "/dennis-ashley-referrer-survey.html",
    who: "Doctors, clinics and corporate partners",
    title: "Referring colleagues",
    blurb: "What colleagues and corporate buyers want from an endoscopy, diagnostics and wellness partner, what they get back today, and what would make them refer more. Please forward this one widely.",
    minutes: "6 minutes",
    tag: "Please forward",
  },
  {
    href: "/dennis-ashley-leadership-survey.html",
    who: "Dr Oti and the board",
    title: "Leadership direction",
    blurb: "Where each of you thinks the clinic should go, and where you disagree without knowing it. Answered in your own name, on purpose.",
    minutes: "10 minutes",
    tag: "In your name",
  },
];
