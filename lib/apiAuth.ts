import { auth } from "@/auth";
import type { Session } from "next-auth";

type AuthSuccess = { error: null; session: Session };
type AuthFailure = { error: Response; session: null };

export async function requireAuth(
  allowedRoles?: readonly string[],
): Promise<AuthSuccess | AuthFailure> {
  const session = await auth();
  if (!session) {
    return { error: new Response("Unauthorized", { status: 401 }), session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: new Response("Forbidden", { status: 403 }), session: null };
  }
  return { error: null, session };
}
