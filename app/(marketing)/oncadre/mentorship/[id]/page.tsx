import { redirect, notFound } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import MentorshipChat from "./MentorshipChat";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MentorshipChatPage({ params }: PageProps) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const { id } = await params;

  const mentorship = await prisma.cadreMentorship.findUnique({
    where: { id },
    include: {
      mentorProfile: {
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cadre: true,
            },
          },
        },
      },
      mentee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          cadre: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!mentorship) notFound();

  const isMentor = mentorship.mentorProfile.professionalId === session.sub;
  const isMentee = mentorship.menteeId === session.sub;

  if (!isMentor && !isMentee) notFound();

  const serializedMessages = mentorship.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <MentorshipChat
      mentorshipId={mentorship.id}
      currentUserId={session.sub}
      role={isMentor ? "mentor" : "mentee"}
      status={mentorship.status}
      initialMessages={serializedMessages}
      mentorName={`${mentorship.mentorProfile.professional.firstName} ${mentorship.mentorProfile.professional.lastName}`}
      menteeName={`${mentorship.mentee.firstName} ${mentorship.mentee.lastName}`}
      topic={mentorship.topic}
      rating={mentorship.rating}
    />
  );
}
