import { redirect } from "next/navigation";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";
import BecomeMentorForm from "./BecomeMentorForm";

export default async function BecomeMentorPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  // Check if already has a mentor profile
  const existing = await prisma.cadreMentorProfile.findUnique({
    where: { professionalId: session.sub },
  });

  if (existing) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Link
          href="/oncadre/mentorship"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Mentorship
        </Link>

        <div
          className="rounded-2xl border bg-white p-8 text-center"
          style={{ borderColor: "#E8EBF0" }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "#0B3C5D10" }}
          >
            <svg
              className="h-8 w-8"
              style={{ color: "#0B3C5D" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            You already have a mentor profile
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Your status:{" "}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background:
                  existing.status === "ACTIVE"
                    ? "#ECFDF5"
                    : existing.status === "PENDING"
                      ? "#FFFBEB"
                      : "#F1F5F9",
                color:
                  existing.status === "ACTIVE"
                    ? "#059669"
                    : existing.status === "PENDING"
                      ? "#D97706"
                      : "#64748B",
              }}
            >
              {existing.status}
            </span>
          </p>
          {existing.status === "PENDING" && (
            <p className="mt-3 text-xs text-gray-400">
              Your application is under review. We will notify you once
              approved.
            </p>
          )}
          <Link
            href="/oncadre/mentorship"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0B3C5D, #0d4a73)",
            }}
          >
            Go to Mentorship Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Link
        href="/oncadre/mentorship"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Mentorship
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Become a Mentor</h1>
        <p className="mt-2 text-base text-gray-500">
          Share your experience and help the next generation of healthcare
          professionals navigate their career path.
        </p>
      </div>

      <div
        className="rounded-2xl border bg-white p-6 sm:p-8"
        style={{ borderColor: "#E8EBF0" }}
      >
        <BecomeMentorForm cadreOptions={CADRE_OPTIONS} />
      </div>
    </div>
  );
}
