import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CoachingBlastButton from "./CoachingBlastButton";

export const dynamic = "force-dynamic";

export default async function CoachingBlastPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const [pending, alreadyNotified, total] = await Promise.all([
    prisma.maarovaCircleApplication.count({
      where: {
        status: { in: ["APPROVED", "COMPLETED"] },
        coachingOptIn: true,
        coachingNotifiedAt: null,
      },
    }),
    prisma.maarovaCircleApplication.count({
      where: { coachingNotifiedAt: { not: null } },
    }),
    prisma.maarovaCircleApplication.count({
      where: { status: { in: ["APPROVED", "COMPLETED"] }, coachingOptIn: true },
    }),
  ]);

  return (
    <main className="min-h-screen p-6 md:p-10" style={{ background: "#F8F9FB" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/maarova-circle" className="text-xs text-gray-500 hover:text-gray-900">
          ← Back to Founding Circle
        </Link>

        <h1 className="mt-3 text-2xl font-bold" style={{ color: "#0F2744" }}>
          Send June coaching reminder
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          When Maarova coaching opens, click the button below to email all Founding Circle members who opted in. Each
          recipient gets their personal 10% discount code. Members are only emailed once.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E8EBF0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Eligible (opted in)</p>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>{total}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E8EBF0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">To send now</p>
            <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{pending}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E8EBF0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Already notified</p>
            <p className="text-2xl font-bold text-gray-700">{alreadyNotified}</p>
          </div>
        </div>

        <div className="mt-8">
          <CoachingBlastButton pendingCount={pending} />
        </div>
      </div>
    </main>
  );
}
