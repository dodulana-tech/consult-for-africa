import { redirect } from "next/navigation";

/**
 * Redirect ACADEMY_LEARNER users to /academy.
 * Call at the top of server components for staff-only pages.
 */
export function requireStaffRole(role: string) {
  if (role === "ACADEMY_LEARNER") redirect("/academy");
}
