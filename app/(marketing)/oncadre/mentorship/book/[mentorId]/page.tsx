import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSubscription } from "@/lib/cadreHealth/subscription";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import BookingForm from "./BookingForm";

interface PageProps {
  params: Promise<{ mentorId: string }>;
}

export default async function BookCoachingPage({ params }: PageProps) {
  const { mentorId } = await params;
  const session = await getCadreSession();

  if (!session) {
    redirect(`/oncadre/login?redirect=/oncadre/mentorship/book/${mentorId}`);
  }

  const mentor = await prisma.cadreMentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      professional: {
        select: {
          firstName: true,
          lastName: true,
          cadre: true,
          subSpecialty: true,
          photo: true,
        },
      },
    },
  });

  if (!mentor || mentor.status !== "ACTIVE") notFound();

  // Check Pro status
  const sub = await getOrCreateSubscription(session.sub);
  const isPro = sub.plan === "PRO" && sub.status === "ACTIVE";

  return (
    <main className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/oncadre/mentorship/mentors"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-6"
        >
          <span>←</span> Back to mentors
        </Link>

        <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: "#E8EBF0" }}>
          <div className="flex items-start gap-3 mb-4">
            {mentor.professional.photo ? (
              <img
                src={mentor.professional.photo}
                alt=""
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
              >
                {mentor.professional.firstName[0]}
                {mentor.professional.lastName[0]}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mentor.professional.firstName} {mentor.professional.lastName}
              </h2>
              <p className="text-xs text-gray-500">
                {getCadreLabel(mentor.professional.cadre)}
                {mentor.professional.subSpecialty && ` / ${mentor.professional.subSpecialty}`}
              </p>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#F8F9FB" }}>
            <p className="text-sm font-semibold text-gray-900 mb-1">45-minute coaching session</p>
            <p className="text-xs text-gray-500">
              Live 1:1 conversation. Pick a topic and we will arrange the schedule once payment is confirmed.
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: "#0B3C5D" }}>
                N5,000
              </span>
              <span className="text-xs text-gray-500">/ session</span>
            </div>
          </div>
        </div>

        {isPro ? (
          <BookingForm mentorId={mentor.id} />
        ) : (
          <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "#D4AF37", background: "rgba(212,175,55,0.05)" }}>
            <p className="text-sm font-semibold text-gray-900 mb-2">Pro subscription required</p>
            <p className="text-xs text-gray-600 mb-4">
              Coaching sessions are available to Pro subscribers only. Upgrade for N1,500/month.
            </p>
            <Link
              href="/oncadre/coaching/upgrade"
              className="inline-block rounded-xl py-2.5 px-6 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
