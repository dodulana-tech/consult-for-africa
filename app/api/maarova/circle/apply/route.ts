import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { handler } from "@/lib/api-handler";
import { generateUploadUrl, buildKey, getPublicUrl } from "@/lib/r2";
import { screenCircleApplication } from "@/lib/maarovaCircleScreening";
import {
  emailMaarovaCircleReceived,
  emailMaarovaCircleApproved,
  emailMaarovaCircleDeclined,
} from "@/lib/email";

// Pipeline does PDF parse + R2 upload + Claude screening + DB writes.
// Default 10s Vercel cap is too tight; bump to 60s to avoid mid-flight kill.
export const maxDuration = 60;

const TOTAL_SLOTS = 50;
const FOUNDING_CIRCLE_CAMPAIGN_NAME = "2026-05 Maarova Founding Circle";

export const POST = handler(async function POST(req: NextRequest) {
  const formData = await req.formData();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
  const currentRole = String(formData.get("currentRole") ?? "").trim();
  const currentEmployer = String(formData.get("currentEmployer") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "").trim() || null;
  const yearsInRoleStr = String(formData.get("yearsInRole") ?? "").trim();
  const yearsInRole = yearsInRoleStr ? parseInt(yearsInRoleStr, 10) || null : null;
  const coachingOptIn = String(formData.get("coachingOptIn") ?? "true") !== "false";

  if (!firstName || !lastName || !email || !linkedinUrl || !currentRole || !currentEmployer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Dedupe across BOTH tables: prior application AND prior outreach target on
  // the Founding Circle campaign. Looking only at MaarovaCircleApplication
  // missed cases where the application save failed (timeout) but the
  // OutreachTarget was already written, leaving the email un-deduplicated.
  const [existingApp, existingTarget] = await Promise.all([
    prisma.maarovaCircleApplication.findUnique({ where: { email } }),
    prisma.outreachTarget.findFirst({
      where: {
        email,
        campaign: { name: FOUNDING_CIRCLE_CAMPAIGN_NAME },
      },
      select: { id: true },
    }),
  ]);

  if (existingApp || existingTarget) {
    return NextResponse.json(
      { error: "An application with this email already exists. Each person may apply once." },
      { status: 409 },
    );
  }

  const cvFile = formData.get("cv") as File | null;
  if (!cvFile) {
    return NextResponse.json({ error: "CV is required" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (!allowedTypes.includes(cvFile.type)) {
    return NextResponse.json({ error: "CV must be PDF or Word document" }, { status: 415 });
  }
  if (cvFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "CV must be smaller than 5 MB" }, { status: 413 });
  }

  // Extract CV text
  const buffer = Buffer.from(await cvFile.arrayBuffer());
  let extractedText = "";
  try {
    if (cvFile.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      extractedText = textResult.text;
      await parser.destroy();
    } else {
      extractedText = buffer.toString("utf-8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  } catch (err) {
    console.error("[maarova/circle/apply] CV extraction failed:", err);
  }

  // Upload CV to R2
  let cvFileUrl: string | null = null;
  try {
    const key = buildKey("maarova-circle-cvs", cvFile.name);
    const uploadUrl = await generateUploadUrl(key, cvFile.type, 600, buffer.length);
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": cvFile.type },
      body: buffer,
    });
    if (putRes.ok) {
      cvFileUrl = await getPublicUrl(key);
    }
  } catch (err) {
    console.error("[maarova/circle/apply] R2 upload failed:", err);
  }

  // Get/create the campaign
  let campaign = await prisma.outreachCampaign.findFirst({
    where: { name: FOUNDING_CIRCLE_CAMPAIGN_NAME },
  });
  if (!campaign) {
    campaign = await prisma.outreachCampaign.create({
      data: {
        name: FOUNDING_CIRCLE_CAMPAIGN_NAME,
        description:
          "Public-apply Founding Circle: 50 free Maarova assessments for healthcare leaders across Africa.",
        month: "2026-05",
        status: "ACTIVE",
        targetCount: TOTAL_SLOTS,
      },
    });
  }

  // Run Claude screening
  const screening = await screenCircleApplication({
    firstName,
    lastName,
    currentRole,
    currentEmployer,
    yearsInRole: yearsInRole ?? undefined,
    city: city ?? undefined,
    country: country ?? undefined,
    linkedinUrl,
    cvText: extractedText || null,
  });

  // Determine status based on screening + slot availability
  let status: "PENDING_REVIEW" | "APPROVED" | "DECLINED" | "WAITLISTED" = "PENDING_REVIEW";
  let reviewedAt: Date | null = null;
  let inviteToken: string | null = null;
  let tokenExpiresAt: Date | null = null;
  let coachingDiscountCode: string | null = null;
  let invitedAt: Date | null = null;
  let outreachTargetId: string | null = null;
  let declineReason: string | null = null;

  if (screening) {
    // Atomic slot check: count APPROVED + COMPLETED to avoid race
    const approvedCount = await prisma.maarovaCircleApplication.count({
      where: { status: { in: ["APPROVED", "COMPLETED"] } },
    });
    const slotsLeft = TOTAL_SLOTS - approvedCount;

    if (screening.recommendation === "AUTO_APPROVE" && slotsLeft > 0) {
      status = "APPROVED";
      reviewedAt = new Date();
      inviteToken = randomBytes(32).toString("base64url");
      tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      coachingDiscountCode = `FOUNDING-${randomBytes(3).toString("hex").toUpperCase()}`;
      invitedAt = new Date();
    } else if (screening.recommendation === "AUTO_DECLINE") {
      status = "DECLINED";
      reviewedAt = new Date();
      declineReason = screening.declineReason || null;
    } else if (slotsLeft <= 0) {
      status = "WAITLISTED";
    } else {
      status = "PENDING_REVIEW";
    }
  } else {
    // Screening failed: queue for manual review
    status = "PENDING_REVIEW";
  }

  // Atomic write: application + (optional) outreach target + counter bump.
  // If any step fails, none persist. This eliminates the partial-state class
  // of bug where an OutreachTarget was created but the application save
  // timed out, leaving the email un-deduplicated on retry.
  const ipAddress = req.headers.get("x-forwarded-for") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const source = req.headers.get("referer") || null;

  const application = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction in case a concurrent submission
    // beat us to it.
    const dupApp = await tx.maarovaCircleApplication.findUnique({ where: { email } });
    if (dupApp) throw new Error("DUPLICATE_EMAIL");
    const dupTarget = await tx.outreachTarget.findFirst({
      where: { email, campaignId: campaign.id },
      select: { id: true },
    });
    if (dupTarget) throw new Error("DUPLICATE_EMAIL");

    let createdTargetId: string | null = null;
    if (status === "APPROVED" && inviteToken) {
      const target = await tx.outreachTarget.create({
        data: {
          campaignId: campaign.id,
          name: `${firstName} ${lastName}`,
          title: currentRole,
          organization: currentEmployer,
          email,
          phone,
          linkedinUrl,
          city,
          source: "Maarova Founding Circle (public apply)",
          status: "INVITED",
          invitedAt,
          inviteToken,
          tokenExpiresAt,
        },
      });
      createdTargetId = target.id;

      await tx.outreachCampaign.update({
        where: { id: campaign.id },
        data: { sentCount: { increment: 1 } },
      });
    }

    return tx.maarovaCircleApplication.create({
      data: {
        campaignId: campaign.id,
        firstName,
        lastName,
        email,
        phone,
        linkedinUrl,
        currentRole,
        currentEmployer,
        city,
        country,
        yearsInRole,
        cvFileUrl,
        cvText: extractedText ? extractedText.slice(0, 30000) : null,
        status,
        aiScore: screening?.score ?? null,
        aiSummary: screening?.summary ?? null,
        aiStrengths: screening?.strengths ?? [],
        aiConcerns: screening?.concerns ?? [],
        aiRecommendation: screening?.recommendation ?? null,
        aiBreakdown: (screening?.breakdown as never) ?? undefined,
        reviewedAt,
        declineReason,
        outreachTargetId: createdTargetId,
        inviteToken,
        tokenExpiresAt,
        invitedAt,
        coachingOptIn,
        coachingDiscountCode,
        ipAddress,
        userAgent,
        source,
      },
    });
  }).catch((err: Error) => {
    if (err.message === "DUPLICATE_EMAIL") return null;
    throw err;
  });

  if (!application) {
    return NextResponse.json(
      { error: "An application with this email already exists. Each person may apply once." },
      { status: 409 },
    );
  }
  outreachTargetId = application.outreachTargetId;

  // Send appropriate email (best-effort)
  try {
    if (status === "APPROVED" && inviteToken) {
      await emailMaarovaCircleApproved({
        email,
        firstName,
        inviteToken,
        discountCode: coachingDiscountCode!,
      });
    } else if (status === "DECLINED") {
      await emailMaarovaCircleDeclined({ email, firstName, reason: declineReason });
    } else {
      await emailMaarovaCircleReceived({ email, firstName });
    }
  } catch (err) {
    console.error("[maarova/circle/apply] email failed:", err);
  }

  return NextResponse.json({
    ok: true,
    applicationId: application.id,
    status,
  });
});
