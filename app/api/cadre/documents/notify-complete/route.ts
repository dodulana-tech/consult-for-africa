import { NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { handler } from "@/lib/api-handler";

const ADMIN_EMAIL = process.env.CADRE_ADMIN_EMAIL || process.env.SMTP_FROM || "hello@consultforafrica.com";

export const POST = handler(async function POST() {
  const session = await getCadreSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      cvFileUrl: true,
      governmentIdUrl: true,
      passportPhotoUrl: true,
      documentsSubmittedAt: true,
      recruitmentNotes: true,
      credentials: { select: { type: true, documentUrl: true } },
      qualifications: { select: { type: true, documentUrl: true } },
    },
  });

  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already notified
  if (professional.documentsSubmittedAt) {
    return NextResponse.json({ success: true, alreadyNotified: true });
  }

  // Verify all required docs are present
  const hasCV = !!professional.cvFileUrl;
  const hasLicense = professional.credentials.some(
    (c) => c.type === "PRACTICING_LICENSE" && c.documentUrl
  );
  const hasRegistration = professional.credentials.some(
    (c) => c.type === "FULL_REGISTRATION" && c.documentUrl
  );
  const hasDegree = professional.qualifications.some(
    (q) => q.type === "PRIMARY_DEGREE" && q.documentUrl
  );
  const hasGovId = !!professional.governmentIdUrl;
  const hasPhoto = !!professional.passportPhotoUrl;

  const allRequired = hasCV && hasLicense && hasRegistration && hasDegree && hasGovId && hasPhoto;

  // Check specialist if applicable
  const SPECIALIST_CADRES = ["MEDICINE", "DENTISTRY", "NURSING", "PHARMACY"];
  const needsSpecialist =
    professional.subSpecialty && SPECIALIST_CADRES.includes(professional.cadre);
  if (needsSpecialist) {
    const hasSpecialist = professional.credentials.some(
      (c) => c.type === "SPECIALIST_REGISTRATION" && c.documentUrl
    );
    if (!hasSpecialist) {
      return NextResponse.json({ success: false, reason: "Missing specialist registration document" });
    }
  }

  if (!allRequired) {
    return NextResponse.json({ success: false, reason: "Not all required documents are submitted" });
  }

  // Mark as submitted and notify admin
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const existingNotes = professional.recruitmentNotes || "";
  const noteAppend = `${existingNotes ? existingNotes + "\n" : ""}[Auto] All required documents submitted on ${dateStr}`;

  await prisma.cadreProfessional.update({
    where: { id: session.sub },
    data: {
      documentsSubmittedAt: now,
      recruitmentNotes: noteAppend,
    },
  });

  // Notify admin
  try {
    await sendCadreEmail({
      to: ADMIN_EMAIL,
      subject: `Document submission complete: ${professional.firstName} ${professional.lastName}`,
      heading: "Document Submission Complete",
      body: `${professional.firstName} ${professional.lastName} (${professional.cadre}) has submitted all required recruitment documents. Their file is ready for review.`,
      ctaText: "Review Candidate",
      ctaHref: `${process.env.NEXTAUTH_URL || ""}/admin/cadrehealth`,
    });
  } catch (err) {
    console.error("[notify-complete] Failed to send admin email:", err);
  }

  return NextResponse.json({ success: true, alreadyNotified: false });
});
