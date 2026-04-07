import { prisma } from "@/lib/prisma";

export async function notifyLicenseExpiry(
  professionalId: string,
  credentialType: string,
  expiryDate: Date
): Promise<void> {
  const daysLeft = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const urgency = daysLeft <= 7 ? "expires in " + daysLeft + " days" : "expires on " + expiryDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  await prisma.cadreNotification.create({
    data: {
      professionalId,
      type: "LICENSE_EXPIRY",
      title: "License expiring soon",
      message: `Your ${credentialType} ${urgency}. Renew it to keep your profile verified.`,
      link: "/oncadre/profile#credentials",
    },
  });
}

export async function notifyJobMatch(
  professionalId: string,
  mandateTitle: string,
  mandateId: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId,
      type: "JOB_MATCH",
      title: "New opportunity match",
      message: `You matched with "${mandateTitle}". Review the details and express interest.`,
      link: `/oncadre/opportunities/${mandateId}`,
    },
  });
}

export async function notifyMentorshipRequest(
  mentorProfessionalId: string,
  menteeName: string,
  mentorshipId: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId: mentorProfessionalId,
      type: "MENTORSHIP_REQUEST",
      title: "New mentorship request",
      message: `${menteeName} has requested you as a mentor. Review and respond.`,
      link: `/oncadre/mentorship/${mentorshipId}`,
    },
  });
}

export async function notifyMentorshipAccepted(
  menteeProfessionalId: string,
  mentorName: string,
  mentorshipId: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId: menteeProfessionalId,
      type: "MENTORSHIP_ACCEPTED",
      title: "Mentorship accepted",
      message: `${mentorName} has accepted your mentorship request. Start the conversation.`,
      link: `/oncadre/mentorship/${mentorshipId}`,
    },
  });
}

export async function notifyNewReview(
  professionalId: string,
  facilityName: string,
  facilitySlug: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId,
      type: "NEW_REVIEW",
      title: "New facility review",
      message: `A new review was posted for ${facilityName}. See what your colleagues are saying.`,
      link: `/oncadre/explore/${facilitySlug}`,
    },
  });
}

export async function notifyProfileView(
  professionalId: string,
  viewerName?: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId,
      type: "PROFILE_VIEW",
      title: "Someone viewed your profile",
      message: viewerName
        ? `${viewerName} viewed your profile.`
        : "An employer viewed your profile. Keep it updated to stand out.",
      link: "/oncadre/profile",
    },
  });
}

export async function notifySystem(
  professionalId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await prisma.cadreNotification.create({
    data: {
      professionalId,
      type: "SYSTEM",
      title,
      message,
      link: link || null,
    },
  });
}
