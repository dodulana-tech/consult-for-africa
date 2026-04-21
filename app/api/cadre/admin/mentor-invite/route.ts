import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { handler } from "@/lib/api-handler";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.consultforafrica.com";

export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { professionalId } = await req.json();
  if (!professionalId) {
    return Response.json({ error: "professionalId is required." }, { status: 400 });
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: { id: true, firstName: true, lastName: true, email: true, cadre: true },
  });

  if (!professional) {
    return Response.json({ error: "Professional not found." }, { status: 404 });
  }

  // Check if already a mentor
  const existingProfile = await prisma.cadreMentorProfile.findUnique({
    where: { professionalId },
  });

  if (existingProfile) {
    return Response.json({ error: "This professional already has a mentor profile.", status: existingProfile.status }, { status: 409 });
  }

  try {
    await sendCadreEmail({
      to: professional.email,
      subject: "Invitation to become a CadreHealth Mentor",
      heading: `${professional.firstName}, you have been selected as a mentor`,
      body: `Based on your experience and expertise, we would like to invite you to join the CadreHealth Mentorship Programme. As a mentor, you will guide early-career healthcare professionals, share your knowledge, and help shape the next generation of Nigerian healthcare leaders. Mentorship is free, flexible, and entirely on your terms.`,
      ctaText: "Apply to Become a Mentor",
      ctaHref: `${BASE_URL}/oncadre/mentorship/become-mentor`,
      footer: "This invitation was sent by CadreHealth, a Consult For Africa initiative. Your experience makes a difference.",
    });
  } catch {
    return Response.json({ error: "Failed to send email. Check SMTP configuration." }, { status: 500 });
  }

  return Response.json({ ok: true, email: professional.email });
});
