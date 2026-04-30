import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";
import { isCommsElevated, getCommSummary, type CommSubjectFilter } from "@/lib/communications";
import type { CommunicationSubjectType } from "@prisma/client";

/**
 * GET /api/communications/summary
 * Returns summary stats for a contact's communication history.
 * Pass any subject filter (consultantId, clientId, etc.).
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filter: CommSubjectFilter = {
    subjectType: (searchParams.get("subjectType") as CommunicationSubjectType) || undefined,
    consultantId: searchParams.get("consultantId") || undefined,
    clientId: searchParams.get("clientId") || undefined,
    clientContactId: searchParams.get("clientContactId") || undefined,
    applicationId: searchParams.get("applicationId") || undefined,
    cadreProfessionalId: searchParams.get("cadreProfessionalId") || undefined,
    partnerFirmId: searchParams.get("partnerFirmId") || undefined,
    salesAgentId: searchParams.get("salesAgentId") || undefined,
    discoveryCallId: searchParams.get("discoveryCallId") || undefined,
    maarovaUserId: searchParams.get("maarovaUserId") || undefined,
  };

  const summary = await getCommSummary(filter);
  return Response.json(summary);
});
