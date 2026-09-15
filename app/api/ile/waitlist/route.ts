import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { isRateLimited } from "@/lib/rate-limit";
import {
  FOUNDING_FAMILY_LIMIT,
  ILE_CONSENT_TEXT,
  ILE_CONTACT_EMAIL,
  clientIpFrom,
  generateReferralCode,
  hashIp,
} from "@/lib/ile";
import { emailIleWaitlistConfirmation, emailIleWaitlistInternal } from "@/lib/ileEmail";

const schema = z.object({
  fullName: z.string().trim().min(2, "Please give your name").max(120),
  email: z.string().trim().toLowerCase().email("That email does not look right").max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  relationship: z.enum([
    "PARENT",
    "GRANDPARENT",
    "SPOUSE",
    "OTHER_RELATIVE",
    "SELF",
    "PROFESSIONAL",
  ]),
  basedOutsideNigeria: z.boolean(),
  basedCountry: z.string().trim().max(80).optional().nullable(),
  careCity: z.string().trim().max(80).optional().nullable(),
  interest: z.enum(["RESIDENTIAL", "HOME_CARE", "BOTH", "UNDECIDED"]),
  careNeeds: z
    .array(
      z.enum([
        "COMPANIONSHIP",
        "PERSONAL_CARE",
        "SKILLED_NURSING",
        "DEMENTIA_SUPPORT",
        "POST_HOSPITAL",
        "END_OF_LIFE",
        "NOT_SURE",
      ]),
    )
    .max(7)
    .default([]),
  urgency: z.enum(["NOW", "WITHIN_3_MONTHS", "WITHIN_6_MONTHS", "PLANNING_AHEAD"]),
  notes: z.string().trim().max(2000).optional().nullable(),
  referredByCode: z.string().trim().max(12).optional().nullable(),
  consent: z.literal(true, { message: "We need your agreement before we can hold your details" }),
  // Honeypot. Accept any value here rather than rejecting it: a schema that
  // fails on a filled honeypot tells the bot exactly which field is the trap,
  // and it would also block a real person whose browser autofilled it. The
  // check happens after parsing, and answers with a cheerful lie.
  company: z.string().max(200).optional(),
});

function baseUrl(req: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  return req.nextUrl.origin;
}

export const POST = handler(async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (isRateLimited(ip, "ile-waitlist", { windowMs: 60 * 60 * 1000, max: 8 })) {
    return NextResponse.json(
      { error: "That is a lot of sign-ups from one place. Please try again a little later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "We could not read that. Please try again." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Please check the form and try again." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Silently accept the honeypot so a bot learns nothing from the response.
  if (data.company) {
    return NextResponse.json({ ok: true, alreadyOnList: false, foundingFamily: false });
  }

  const existing = await prisma.ileWaitlistEntry.findUnique({
    where: { email: data.email },
    select: { id: true, fullName: true, referralCode: true, foundingFamily: true },
  });
  if (existing) {
    // Not an error worth alarming anyone about. They are on the list, which is
    // what they wanted, so tell them so and hand back their referral link.
    return NextResponse.json({
      ok: true,
      alreadyOnList: true,
      foundingFamily: existing.foundingFamily,
      referralCode: existing.referralCode,
      shareUrl: `${baseUrl(req)}/ile?ref=${existing.referralCode}`,
    });
  }

  const priorCount = await prisma.ileWaitlistEntry.count();
  const foundingFamily = priorCount < FOUNDING_FAMILY_LIMIT;

  // Referral codes are short enough to collide occasionally. Retry rather than
  // fail a real sign-up over it.
  let entry = null as Awaited<ReturnType<typeof prisma.ileWaitlistEntry.create>> | null;
  for (let attempt = 0; attempt < 5 && !entry; attempt++) {
    try {
      entry = await prisma.ileWaitlistEntry.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          relationship: data.relationship,
          basedOutsideNigeria: data.basedOutsideNigeria,
          basedCountry: data.basedOutsideNigeria ? data.basedCountry || null : "Nigeria",
          careCity: data.careCity || null,
          interest: data.interest,
          careNeeds: data.careNeeds,
          urgency: data.urgency,
          notes: data.notes || null,
          foundingFamily,
          referralCode: generateReferralCode(),
          referredByCode: data.referredByCode || null,
          consentedAt: new Date(),
          consentText: ILE_CONSENT_TEXT,
          sourcePath: req.headers.get("referer") ?? null,
          ipHash: hashIp(ip),
        },
      });
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes("referralCode");
      if (!isCodeCollision) throw err;
    }
  }

  if (!entry) {
    return NextResponse.json(
      { error: "We could not add you just then. Please try again." },
      { status: 500 },
    );
  }

  const shareUrl = `${baseUrl(req)}/ile?ref=${entry.referralCode}`;

  // The row is saved. Email is best effort from here: a family that is on the
  // list but did not get the confirmation is a much smaller problem than a
  // family who filled the form in and was told it failed.
  try {
    await emailIleWaitlistConfirmation({
      to: entry.email,
      fullName: entry.fullName,
      foundingFamily: entry.foundingFamily,
      interest: entry.interest,
      urgency: entry.urgency,
      referralCode: entry.referralCode,
      shareUrl,
    });
  } catch (err) {
    console.error("[ile/waitlist] confirmation email failed:", err);
  }

  try {
    await emailIleWaitlistInternal({
      to: ILE_CONTACT_EMAIL,
      fullName: entry.fullName,
      email: entry.email,
      phone: entry.phone,
      relationship: entry.relationship,
      basedOutsideNigeria: entry.basedOutsideNigeria,
      basedCountry: entry.basedCountry,
      careCity: entry.careCity,
      interest: entry.interest,
      careNeeds: entry.careNeeds,
      urgency: entry.urgency,
      notes: entry.notes,
      foundingFamily: entry.foundingFamily,
      referredByCode: entry.referredByCode,
      position: priorCount + 1,
    });
  } catch (err) {
    console.error("[ile/waitlist] internal notification failed:", err);
  }

  return NextResponse.json({
    ok: true,
    alreadyOnList: false,
    foundingFamily: entry.foundingFamily,
    referralCode: entry.referralCode,
    shareUrl,
  });
});
