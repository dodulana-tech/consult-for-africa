// The shape of the Osteon information request, shared by the client-facing
// project page and the internal tracker so the two cannot disagree about what
// was asked for.
//
// Source of truth for the wording is docs/osteon/osteon-audit-information-request-cfa.md.
// Section letters here must match the "## X." headings in that document.

export const OSTEON_ENGAGEMENT = "osteon";

export type RequestSection = {
  /** Letter as it appears in the document, or a pseudo-section. */
  key: string;
  title: string;
  /** One line telling the uploader what actually belongs here. */
  hint: string;
};

/** The nine that turn a tour into an audit. Ordered as in the document. */
export const PRIORITY_NINE: { n: number; what: string; why: string; section: string }[] = [
  { n: 1, section: "E", what: "The surgical case log, last 24 months, every case, every site", why: "It is the spine of the audit. Everything else is checked against it" },
  { n: 2, section: "D", what: "Management accounts or the income and expenditure record, monthly, last 12 months", why: "What the business earns, and what it costs to stand still" },
  { n: 3, section: "G", what: "The current price list or tariff, and how a surgical quote is built", why: "We cannot judge yield without knowing the list" },
  { n: 4, section: "N", what: "Full staff list with role, employment type and days worked per week", why: "Establishment against service is where small clinics fail" },
  { n: 5, section: "I", what: "Implant and consumable purchase records, last 12 months, with unit prices", why: "Implants are the largest single cost in your bill" },
  { n: 6, section: "D", what: "Bank statements for all business accounts, last 6 months", why: "The only unarguable record of what actually came in" },
  { n: 7, section: "B", what: "Facility registration and licence documents, whatever is held", why: "Category registered against service delivered is a live exposure" },
  { n: 8, section: "C", what: "The arrangements at Cedarcrest, Diamed and elsewhere, written or described", why: "Most of the practice may sit outside the company" },
  { n: 9, section: "H", what: "Theatre list schedule or diary, last 6 months", why: "Utilisation is the profit driver and nobody measures it" },
];

export const REQUEST_SECTIONS: RequestSection[] = [
  { key: "A", title: "The company, ownership and how decisions get made", hint: "CAC documents, shareholding, any shareholders' agreement, board or management notes, loans" },
  { key: "B", title: "Licensing, regulatory standing and insurance", hint: "HEFAMAA, MDCN and nursing licences, radiation licence and dosimetry, NAFDAC, indemnity, waste contract" },
  { key: "C", title: "The practice across sites", hint: "Cedarcrest, Diamed and anywhere else: the agreement or a description, days per month, how you are paid" },
  { key: "D", title: "Money, in and out", hint: "Management accounts, bank statements, trial balance, asset register, monthly fixed costs" },
  { key: "E", title: "The surgical ledger", hint: "One row per case: procedure, implant, payer, quoted, collected, complications, follow up" },
  { key: "F", title: "The funnel", hint: "Enquiries, consultations, who was quoted, who paid a deposit, who was operated on, who did not proceed" },
  { key: "G", title: "Who pays, and how well", hint: "Price list, how a quote is built, payer split, HMO contracts and claims, debtors ageing" },
  { key: "H", title: "Theatre and the perioperative pathway", hint: "List schedule, start and finish times, cancellations, anaesthetic cover, checklists, transfer arrangement" },
  { key: "I", title: "Implants, instruments and consumables", hint: "Supplier invoices with unit prices, current stock with lot numbers, traceability records, loan kit process" },
  { key: "J", title: "Sterile services and infection prevention", hint: "Autoclave service and validation, cycle and indicator records, load traceability, any IPC policy" },
  { key: "K", title: "Clinical governance, outcomes and safety", hint: "Blank forms, consent, incident and complication register, follow up, any outcome scores, protocols" },
  { key: "L", title: "Imaging and diagnostics", hint: "What is on site, service records, who reports, the arrangement for CT, MRI and laboratory work" },
  { key: "M", title: "Physiotherapy and recovery", hint: "Who delivers it, the rehabilitation protocol, sessions per month, what is charged" },
  { key: "N", title: "People", hint: "Staff list, payroll, contracts, rota, joiners and leavers, training records" },
  { key: "O", title: "The building, the equipment and the power", hint: "Lease, floor plan, asset register, generator and fuel, gases, water, anything currently broken" },
  { key: "P", title: "Systems, records and reporting", hint: "What software holds what, who has access, backups, any management report you look at" },
  { key: "Q", title: "Brand, referral and demand", hint: "Website analytics, marketing spend, any referral records, what a referrer gets back" },
  { key: "R", title: "Where you want to take it", hint: "Answer this one in writing or in conversation. Notes are fine" },
];

/** Sections offered in the uploader, priority first and a catch-all last. */
export const UPLOAD_SECTIONS: RequestSection[] = [
  { key: "priority", title: "One of the nine priority items", hint: "The nine we need before Thursday" },
  ...REQUEST_SECTIONS,
  { key: "other", title: "Something else", hint: "Anything you think we should see that we did not ask for" },
];

export const sectionLabel = (key: string): string => {
  if (key === "priority") return "Priority nine";
  if (key === "other") return "Other";
  const s = REQUEST_SECTIONS.find((x) => x.key === key);
  return s ? `${s.key}. ${s.title}` : key;
};

export const SURVEYS = [
  {
    href: "/osteon-staff-survey.html",
    who: "Everyone who works at Osteon",
    title: "Staff survey",
    blurb: "How the place actually runs on a busy day, and whether people can speak up. Anonymous, and the answers come to Consult for Africa rather than to management.",
    minutes: "10 minutes",
    tag: "Anonymous",
  },
  {
    href: "/osteon-patient-survey.html",
    who: "Patients seen in the last year",
    title: "Patient survey",
    blurb: "Access, how things were explained, the cost conversation, recovery, and whether they would send someone else. Anonymous.",
    minutes: "5 minutes",
    tag: "Anonymous",
  },
  {
    href: "/osteon-referrer-survey.html",
    who: "Doctors, physiotherapists and clinics",
    title: "Referring colleagues",
    blurb: "What colleagues want from an orthopaedic service, what they get back today, and what would make them refer more. Please forward this one widely.",
    minutes: "6 minutes",
    tag: "Please forward",
  },
  {
    href: "/osteon-leadership-survey.html",
    who: "Dr Bola and the senior team",
    title: "Leadership direction",
    blurb: "Where each of you thinks the business should go, and where you disagree without knowing it. Answered in your own name, on purpose.",
    minutes: "10 minutes",
    tag: "In your name",
  },
];

export const DOCUMENTS = [
  {
    href: "/osteon/osteon-audit-scope-cfa.pdf",
    title: "Scope, method and timetable",
    pages: "6 pages",
    blurb: "What we are looking at and why, how Thursday runs, and what you get at the end.",
  },
  {
    href: "/osteon/osteon-audit-information-request-cfa.pdf",
    title: "Information and data request",
    pages: "10 pages",
    blurb: "Everything we have asked for, section by section, with the nine that matter before Thursday at the front.",
  },
];

export const PRINT_PACK = [
  { href: "/osteon/osteon-patient-survey-poster-cfa.pdf", title: "Patient survey poster", blurb: "A4, for the waiting room" },
  { href: "/osteon/osteon-staff-survey-poster-cfa.pdf", title: "Staff survey poster", blurb: "A4, for the staff room" },
  { href: "/osteon/osteon-patient-survey-cfa.pdf", title: "Patient survey on paper", blurb: "For anyone who would rather use a pen" },
  { href: "/osteon/osteon-staff-survey-cfa.pdf", title: "Staff survey on paper", blurb: "For anyone who would rather use a pen" },
  { href: "/osteon/osteon-referrer-survey-cfa.pdf", title: "Referrer survey on paper", blurb: "What colleagues are asked" },
  { href: "/osteon/osteon-leadership-survey-cfa.pdf", title: "Leadership survey on paper", blurb: "What the senior team is asked" },
];
