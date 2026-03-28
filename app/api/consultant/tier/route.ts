import { auth } from "@/auth";
import { calculateTierScore } from "@/lib/consultantTier";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/consultant/tier — returns the calling consultant's tier score,
 * or an admin can pass ?userId=xxx to look up another consultant.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ELEVATED.includes(session.user.role);
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId");

  // Only admins can look up other users
  const consultantId = isElevated && targetId ? targetId : session.user.id;

  // Non-elevated users can only see their own tier
  if (!isElevated && session.user.role !== "CONSULTANT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const score = await calculateTierScore(consultantId);
    return Response.json(score);
  } catch {
    return Response.json({ error: "Consultant not found" }, { status: 404 });
  }
}
