export const ELEVATED_ROLES = ["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"] as const;
export const EM_AND_ABOVE = ["ENGAGEMENT_MANAGER", "ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"] as const;
export const ALL_STAFF_ROLES = ["CONSULTANT", "ENGAGEMENT_MANAGER", "ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"] as const;

/**
 * Office of the Founding Partner. The Executive Assistant and the Administrative
 * Assistant who reports to her.
 *
 * These two run the office AND carry client work, because everybody at C4A
 * works. They therefore reach the delivery surfaces as well as the office ones.
 *
 * They are still kept out of ALL_STAFF_ROLES so that access stays granted
 * surface by surface rather than inherited from a single line, and so the
 * places where the two roles differ stay explicit: Finance read, campaign
 * sending and meeting organiser rights are Executive Assistant only, and
 * Admin, rates, commissions and the portals are neither.
 */
export const OFFICE_ROLES = ["EXECUTIVE_ASSISTANT", "ADMINISTRATIVE_ASSISTANT"] as const;

/**
 * Who may assign a task to someone else. Anyone above EM, plus the Executive
 * Assistant, who breaks the Founding Partner's tasks into sub-tasks for the
 * Administrative Assistant. Anyone with task access can always raise a task for
 * themselves, which is handled in the API rather than here.
 */
export const TASK_ASSIGNER_ROLES = [...ELEVATED_ROLES, "EXECUTIVE_ASSISTANT"] as const;

/** Everyone who can reach the task board at all. */
export const TASK_ROLES = [...EM_AND_ABOVE, ...OFFICE_ROLES] as const;

// ─── Surface grants for the Office of the Founding Partner ───────────────────
// One place to read what the two office roles can actually reach. Each of these
// is an exact superset of the role list that guarded the surface before, so
// nothing changes for anyone else. The API route is the real boundary; the
// sidebar is cosmetic.

/** Leads, discovery calls and the pipeline board. Hygiene and chasing. */
export const PIPELINE_ROLES = [...EM_AND_ABOVE, ...OFFICE_ROLES] as const;

/** Communications CRM: logging calls and emails, setting next actions, templates. */
export const COMMS_ROLES = [...EM_AND_ABOVE, ...OFFICE_ROLES] as const;

/**
 * Pressing send. The Administrative Assistant prepares a send, she does not
 * make one. Nothing leaves the building under a fresh graduate's name in week one.
 */
export const COMMS_SEND_ROLES = [...EM_AND_ABOVE, "EXECUTIVE_ASSISTANT"] as const;

/** Campaigns and outreach: list building and send preparation. */
export const CAMPAIGN_ROLES = [...EM_AND_ABOVE, ...OFFICE_ROLES] as const;

/** Publishing or sending a campaign. Executive Assistant only. */
export const CAMPAIGN_SEND_ROLES = [...EM_AND_ABOVE, "EXECUTIVE_ASSISTANT"] as const;

/**
 * Invoice and payment status, read only, so the office can chase. No rates, no
 * commissions, no write access, and nothing for the Administrative Assistant.
 */
export const FINANCE_READ_ROLES = [...EM_AND_ABOVE, "EXECUTIVE_ASSISTANT"] as const;

/** Organiser rights on a meeting: reschedule, cancel, control the bot. */
export const MEETING_ORGANIZER_ROLES = [...EM_AND_ABOVE, "EXECUTIVE_ASSISTANT"] as const;

/** Sees every meeting rather than only their own and the ones they are in. */
export const MEETING_VIEW_ALL_ROLES = [...ELEVATED_ROLES, ...OFFICE_ROLES] as const;

export function inRoles(role: string | undefined | null, roles: readonly string[]): boolean {
  return !!role && roles.includes(role);
}

export type ElevatedRole = typeof ELEVATED_ROLES[number];
export type StaffRole = typeof ALL_STAFF_ROLES[number];
export type OfficeRole = typeof OFFICE_ROLES[number];

export function isOfficeRole(role: string | undefined | null): boolean {
  return OFFICE_ROLES.includes(role as OfficeRole);
}
