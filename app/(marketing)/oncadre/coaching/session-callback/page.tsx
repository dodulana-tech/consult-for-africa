import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import SessionCallbackClient from "./SessionCallbackClient";

interface PageProps {
  searchParams: Promise<{ reference?: string; trxref?: string; sessionId?: string }>;
}

export default async function SessionCallbackPage({ searchParams }: PageProps) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const params = await searchParams;
  const reference = params.reference || params.trxref;
  const sessionId = params.sessionId;

  let coachingSession = null;
  if (sessionId) {
    coachingSession = await prisma.cadreCoachingSession.findFirst({
      where: { id: sessionId, menteeId: session.sub },
      include: {
        mentorProfile: {
          include: { professional: { select: { firstName: true, lastName: true, photo: true } } },
        },
      },
    });
  }

  return <SessionCallbackClient reference={reference} coachingSession={coachingSession} />;
}
