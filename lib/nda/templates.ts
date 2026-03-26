/**
 * NDA template content matching C4A Standard Form v1.0
 *
 * Variables are filled at generation time from DB records.
 * The PDF renderer in nda-pdf.tsx uses these sections.
 */

export interface NdaParty {
  name: string;
  organisation: string;
  title: string;
  email: string;
}

export interface NdaTemplateData {
  type: "MUTUAL_CLIENT" | "CONSULTANT_MASTER" | "PROJECT_SPECIFIC";
  version: string;
  partyA: NdaParty;
  partyB: NdaParty;
  effectiveDate: string; // DD/MM/YYYY
  // Signatures (filled after signing)
  partyASignature?: string; // base64 image
  partyASignedDate?: string;
  partyBSignature?: string;
  partyBSignedDate?: string;
  // Optional project-specific context
  projectName?: string;
  projectScope?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NDA_SECTIONS: Record<string, any[]> = {
  MUTUAL_CLIENT: [
    {
      number: "1",
      title: "Definition of Confidential Information",
      body: `"Confidential Information" means any information disclosed by one Party to the other - whether orally, in writing, electronically, or by any other means - that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.`,
      subsections: [
        { label: "a", text: "Client Data & Business Information - operational data, patient records, strategic plans, financial records, organisational structures, and any other non-public business information belonging to the Client." },
        { label: "b", text: "C4A Methodologies, Frameworks & IP - proprietary consulting tools, assessment frameworks, analytical models, standard operating procedures, templates, and any other intellectual property developed or owned by Consult For Africa." },
        { label: "c", text: "Personnel & Staffing Information - details of employees, consultants, remuneration structures, hiring plans, and human resources data of either Party." },
        { label: "d", text: "Financial & Pricing Information - fee structures, cost models, budget documents, financial projections, and commercial terms exchanged between the Parties." },
        { label: "e", text: "Third-Party Data - information belonging to third parties that either Party shares in the course of the engagement, subject to any applicable third-party confidentiality obligations." },
      ],
      footer: `Confidential Information does not include information that: (i) is or becomes publicly known through no breach of this Agreement; (ii) was rightfully known to the Receiving Party before disclosure; (iii) is independently developed by the Receiving Party without use of Confidential Information; or (iv) is required to be disclosed by law or court order, provided the Receiving Party gives prompt written notice where legally permissible.`,
    },
    {
      number: "2",
      title: "Obligations of Receiving Party",
      body: "Each Receiving Party agrees to:",
      subsections: [
        { label: "i", text: "Hold all Confidential Information in strict confidence and protect it with at least the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care." },
        { label: "ii", text: 'Use Confidential Information solely for the purposes of evaluating, establishing, or performing the consulting engagement between the Parties ("Permitted Purpose").' },
        { label: "iii", text: "Not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party, except to employees, officers, or professional advisors who have a need to know for the Permitted Purpose and who are bound by confidentiality obligations no less protective than those in this Agreement." },
        { label: "iv", text: "Promptly notify the Disclosing Party upon becoming aware of any actual or suspected unauthorised disclosure or use of Confidential Information." },
        { label: "v", text: "Not copy, reproduce, or reduce to writing any Confidential Information except as reasonably necessary for the Permitted Purpose." },
      ],
    },
    {
      number: "3",
      title: "Duration of Confidentiality Obligations",
      body: "The obligations of confidentiality under this Agreement shall commence on the Effective Date and shall continue for the duration of the consulting engagement and for a period of three (3) years following the termination or expiry of the engagement. Notwithstanding the foregoing, obligations with respect to trade secrets shall continue for as long as the information remains a trade secret under applicable law.",
    },
    {
      number: "4",
      title: "Intellectual Property",
      body: "Nothing in this Agreement grants either Party any licence, right, title, or interest in the other Party's Confidential Information or intellectual property beyond what is strictly necessary for the Permitted Purpose.\n\nAll Confidential Information remains the exclusive property of the Disclosing Party. The disclosure of Confidential Information shall not be construed as a grant - by implication, estoppel, or otherwise - of any rights in respect of any intellectual property of the Disclosing Party.",
    },
    {
      number: "5",
      title: "Return and Destruction of Confidential Information",
      body: "Upon written request by the Disclosing Party, or upon termination of the engagement, the Receiving Party shall promptly return or destroy (as directed) all Confidential Information in its possession or control - including all copies, extracts, and summaries - and shall certify in writing that it has done so.\n\nThe Receiving Party may retain one archival copy solely for legal compliance purposes, subject to the continuing confidentiality obligations of this Agreement.",
    },
    {
      number: "6",
      title: "Non-Solicitation",
      body: "During the engagement and for a period of twelve (12) months following its termination, neither Party shall, without the prior written consent of the other, directly or indirectly solicit or engage for employment any employee, consultant, or contractor of the other Party who was involved in the engagement.",
    },
    {
      number: "7",
      title: "Remedies",
      body: "Each Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity, without the requirement to post bond or prove actual damages.",
    },
    {
      number: "8",
      title: "General Provisions",
      provisions: [
        { label: "Governing Law", text: "This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved by good-faith negotiation, and if unresolved within 14 days, by a mutually agreed mediator." },
        { label: "Entire Agreement", text: "This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior discussions, representations, or agreements relating to confidentiality." },
        { label: "Amendment", text: "This Agreement may only be amended or modified by a written instrument signed by both Parties." },
        { label: "Severability", text: "If any provision of this Agreement is found to be unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force." },
        { label: "Waiver", text: "Failure to enforce any provision of this Agreement shall not constitute a waiver of either Party's right to enforce it at a later time." },
        { label: "Counterparts", text: "This Agreement may be executed in counterparts, including electronic signatures, each of which shall be deemed an original and together shall constitute one and the same instrument." },
      ],
    },
  ],

  // Consultant Master NDA has similar language but is unilateral
  CONSULTANT_MASTER: [
    {
      number: "1",
      title: "Definition of Confidential Information",
      body: `"Confidential Information" means any information disclosed by Consult For Africa to the Consultant - whether orally, in writing, electronically, or by any other means - that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.`,
      subsections: [
        { label: "a", text: "Client Data & Business Information - operational data, patient records, strategic plans, financial records, and organisational structures of CFA clients." },
        { label: "b", text: "C4A Methodologies, Frameworks & IP - proprietary consulting tools, assessment frameworks, analytical models, standard operating procedures, templates, and any other intellectual property developed or owned by Consult For Africa." },
        { label: "c", text: "Personnel & Staffing Information - details of employees, other consultants, remuneration structures, hiring plans, and human resources data." },
        { label: "d", text: "Financial & Pricing Information - fee structures, cost models, budget documents, financial projections, and commercial terms." },
        { label: "e", text: "Engagement Details - project scopes, client identities, deliverables, timelines, and any information related to active or past consulting engagements." },
      ],
      footer: `Confidential Information does not include information that: (i) is or becomes publicly known through no breach of this Agreement; (ii) was rightfully known to the Consultant before engagement with CFA; (iii) is independently developed by the Consultant without use of Confidential Information; or (iv) is required to be disclosed by law or court order, provided the Consultant gives prompt written notice where legally permissible.`,
    },
    {
      number: "2",
      title: "Obligations of the Consultant",
      body: "The Consultant agrees to:",
      subsections: [
        { label: "i", text: "Hold all Confidential Information in strict confidence and protect it with at least the same degree of care used to protect their own confidential information, but in no event less than reasonable care." },
        { label: "ii", text: "Use Confidential Information solely for the purposes of performing consulting services for Consult For Africa and its clients." },
        { label: "iii", text: "Not disclose Confidential Information to any third party, including other consultants not assigned to the same engagement, without prior written consent from CFA." },
        { label: "iv", text: "Promptly notify CFA upon becoming aware of any actual or suspected unauthorised disclosure or use of Confidential Information." },
        { label: "v", text: "Not retain copies of Confidential Information beyond the duration of each engagement, except as directed by CFA." },
      ],
    },
    {
      number: "3",
      title: "Duration",
      body: "This Agreement is effective from the date of execution and remains in force for the duration of the Consultant's engagement with CFA and for a period of three (3) years following the last engagement. Obligations with respect to trade secrets shall continue for as long as the information remains a trade secret under applicable law.",
    },
    {
      number: "4",
      title: "Intellectual Property",
      body: "All work product, deliverables, and intellectual property created by the Consultant in the course of CFA engagements shall be the property of Consult For Africa unless otherwise agreed in writing. The Consultant retains no rights to use CFA methodologies, frameworks, or client data for personal or third-party purposes.",
    },
    {
      number: "5",
      title: "Return of Materials",
      body: "Upon termination of each engagement or upon request by CFA, the Consultant shall promptly return or destroy all Confidential Information, work products, and materials in their possession and certify in writing that they have done so.",
    },
    {
      number: "6",
      title: "Non-Solicitation",
      body: "For a period of twelve (12) months following the last engagement with CFA, the Consultant shall not directly or indirectly solicit any CFA client for competing services, or recruit any CFA employee or fellow consultant, without prior written consent from CFA.",
    },
    {
      number: "7",
      title: "Remedies",
      body: "The Consultant acknowledges that any breach of this Agreement may cause irreparable harm to CFA and its clients. CFA shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.",
    },
    {
      number: "8",
      title: "General Provisions",
      provisions: [
        { label: "Governing Law", text: "This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria." },
        { label: "Entire Agreement", text: "This Agreement constitutes the entire agreement between the parties regarding confidentiality and supersedes all prior discussions or agreements." },
        { label: "Amendment", text: "This Agreement may only be amended by a written instrument signed by both parties." },
        { label: "Severability", text: "If any provision is found unenforceable, the remaining provisions shall continue in full force." },
        { label: "Electronic Signatures", text: "This Agreement may be executed electronically, which shall be deemed an original and legally binding." },
      ],
    },
  ],

};

// PROJECT_SPECIFIC reuses MUTUAL_CLIENT sections
NDA_SECTIONS.PROJECT_SPECIFIC = NDA_SECTIONS.MUTUAL_CLIENT;

export const NDA_TITLES: Record<string, string> = {
  MUTUAL_CLIENT: "Mutual Non-Disclosure Agreement",
  CONSULTANT_MASTER: "Consultant Confidentiality Agreement",
  PROJECT_SPECIFIC: "Project-Specific Non-Disclosure Agreement",
};

export const NDA_SUBTITLES: Record<string, string> = {
  MUTUAL_CLIENT: "Standard Form",
  CONSULTANT_MASTER: "Master Agreement",
  PROJECT_SPECIFIC: "Project-Specific",
};
