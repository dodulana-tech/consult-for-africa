import { auth } from "@/auth";
import { getConsultantCapacity } from "@/lib/capacity";
import { handler } from "@/lib/api-handler";

// GET: Get current user's capacity (or specify consultantId for EM/elevated)
export const GET = handler(async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const consultantId = searchParams.get("consultantId");

  // Consultants can only see their own capacity
  const targetId = session.user.role === "CONSULTANT"
    ? session.user.id
    : consultantId ?? session.user.id;

  // Non-elevated users can only check their own
  if (session.user.role === "CONSULTANT" && targetId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const capacity = await getConsultantCapacity(targetId);
  if (!capacity) {
    return Response.json({ error: "Consultant profile not found" }, { status: 404 });
  }

  return Response.json(capacity);
});
