export const ELEVATED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"] as const;
export const EM_AND_ABOVE = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"] as const;
export const ALL_STAFF_ROLES = ["CONSULTANT", "ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"] as const;

export type ElevatedRole = typeof ELEVATED_ROLES[number];
export type StaffRole = typeof ALL_STAFF_ROLES[number];
