import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCadreEmail } from "@/lib/cadreEmail";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.consultforafrica.com";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { professionalId, professionalIds } = await req.json();
  const ids: string[] = professionalIds ?? (professionalId ? [professionalId] : []);

  if (ids.length === 0) {
    return Response.json({ error: "No professionals specified." }, { status: 400 });
  }

  const professionals = await prisma.cadreProfessional.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, email: true, cadre: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const p of professionals) {
    if (!p.email || p.email.includes("@cadrehealth.system")) {
      skipped++;
      continue;
    }

    try {
      await sendCadreEmail({
        to: p.email,
        subject: "You are invited to join CadreHealth",
        heading: `Welcome to CadreHealth, ${p.firstName}`,
        body: `You have been invited to join CadreHealth, Nigeria's healthcare workforce platform. Create your profile to access salary intelligence, hospital reviews, career opportunities, mentorship, and more. Your colleagues are already on the platform.`,
        ctaText: "Claim Your Profile",
        ctaHref: `${BASE_URL}/oncadre/claim?email=${encodeURIComponent(p.email)}`,
        footer: "This invitation was sent by Consult For Africa. If you did not expect this email, you can safely ignore it.",
      });
      sent++;
    } catch {
      skipped++;
    }
  }

  return Response.json({ ok: true, sent, skipped, total: professionals.length });
}
