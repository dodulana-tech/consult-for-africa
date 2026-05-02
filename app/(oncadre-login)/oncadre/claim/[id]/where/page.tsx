import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import Link from "next/link";
import { WhereClient } from "./WhereClient";

export const dynamic = "force-dynamic";

export default async function WhereAreYouPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCadreSession();

  // The claim flow sets the cookie before redirecting here. If the cookie is
  // missing or for a different professional, send them to login.
  if (!session || session.sub !== id) {
    redirect(`/oncadre/login?next=${encodeURIComponent(`/oncadre/claim/${id}/where`)}`);
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: { id: true, firstName: true, practiceLocation: true },
  });
  if (!professional) notFound();

  // Already answered. Drop them on the dashboard.
  if (professional.practiceLocation) {
    redirect("/oncadre/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#FAFBFC" }}>
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm sm:p-10" style={{ borderColor: "#E8EBF0" }}>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            One question, Dr {professional.firstName}.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Where are you in your career today? Your answer shapes what we surface to you and how often we will be in touch. You can change this at any time.
          </p>

          <WhereClient professionalId={id} />

          <p className="mt-8 text-[11px] leading-relaxed text-gray-400">
            None of these is a permanent label. The platform is built so you can move between modes as your situation changes.
          </p>
        </div>
      </div>
    </div>
  );
}
