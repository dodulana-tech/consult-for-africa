import { redirect } from "next/navigation";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  REQUESTED: { bg: "#FFFBEB", color: "#D97706", label: "Requested" },
  ACTIVE: { bg: "#ECFDF5", color: "#059669", label: "Active" },
  COMPLETED: { bg: "#EFF6FF", color: "#2563EB", label: "Completed" },
  DECLINED: { bg: "#FEF2F2", color: "#DC2626", label: "Declined" },
  CANCELLED: { bg: "#F1F5F9", color: "#64748B", label: "Cancelled" },
};

export default async function MentorshipDashboardPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  // Load mentor profile if exists
  const mentorProfile = await prisma.cadreMentorProfile.findUnique({
    where: { professionalId: session.sub },
    include: {
      mentorships: {
        include: {
          mentee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cadre: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  // Load mentee mentorships
  const menteeMentorships = await prisma.cadreMentorship.findMany({
    where: { menteeId: session.sub },
    include: {
      mentorProfile: {
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cadre: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const isMentor = !!mentorProfile;
  const isMentee = menteeMentorships.length > 0;
  const isNeither = !isMentor && !isMentee;

  // Mentor: split by status
  const pendingRequests =
    mentorProfile?.mentorships.filter((m) => m.status === "REQUESTED") ?? [];
  const activeMentorships =
    mentorProfile?.mentorships.filter((m) => m.status === "ACTIVE") ?? [];
  const completedAsMentor =
    mentorProfile?.mentorships.filter((m) => m.status === "COMPLETED") ?? [];

  // Mentee: split
  const activeMentee = menteeMentorships.filter(
    (m) => m.status === "ACTIVE" || m.status === "REQUESTED"
  );
  const completedMentee = menteeMentorships.filter(
    (m) => m.status === "COMPLETED"
  );

  return (
    <div className="py-4">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isMentor
              ? "Manage your mentorships and mentor profile"
              : isMentee
                ? "Your mentorship connections"
                : "Connect with experienced healthcare professionals"}
          </p>
        </div>
        <div className="flex gap-3">
          {!isMentor && (
            <Link
              href="/oncadre/mentorship/become-mentor"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
              style={{ borderColor: "#E8EBF0", color: "#374151" }}
            >
              Become a Mentor
            </Link>
          )}
          <Link
            href="/oncadre/mentorship/mentors"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0B3C5D, #0d4a73)",
            }}
          >
            Find a Mentor
          </Link>
        </div>
      </div>

      {/* Neither mentor nor mentee */}
      {isNeither && (
        <div
          className="rounded-2xl border bg-white p-8 text-center sm:p-12"
          style={{ borderColor: "#E8EBF0" }}
        >
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ background: "#0B3C5D08" }}
          >
            <svg
              className="h-10 w-10"
              style={{ color: "#0B3C5D" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Your mentorship journey starts here
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
            Whether you are looking for career guidance or ready to share your
            experience, the CadreHealth mentorship community is here for you.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/mentorship/mentors"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, #D4AF37, #b8962e)",
                boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
              }}
            >
              Find a Mentor
            </Link>
            <Link
              href="/oncadre/mentorship/become-mentor"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition hover:bg-gray-50"
              style={{ borderColor: "#E8EBF0", color: "#374151" }}
            >
              Become a Mentor
            </Link>
          </div>
        </div>
      )}

      {/* Mentor Profile Summary */}
      {isMentor && mentorProfile && (
        <div className="mb-8 space-y-6">
          <div
            className="rounded-2xl border bg-white p-6"
            style={{ borderColor: "#E8EBF0" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #0B3C5D, #0d4a73)",
                  }}
                >
                  {session.firstName[0]}
                  {session.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Mentor Profile
                  </h3>
                  <p className="text-xs text-gray-500">
                    {mentorProfile.currentMenteeCount}/{mentorProfile.maxMentees}{" "}
                    mentees
                  </p>
                </div>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background:
                    mentorProfile.status === "ACTIVE"
                      ? "#ECFDF5"
                      : mentorProfile.status === "PENDING"
                        ? "#FFFBEB"
                        : "#F1F5F9",
                  color:
                    mentorProfile.status === "ACTIVE"
                      ? "#059669"
                      : mentorProfile.status === "PENDING"
                        ? "#D97706"
                        : "#64748B",
                }}
              >
                {mentorProfile.status}
              </span>
            </div>
            {mentorProfile.status === "PENDING" && (
              <p className="mt-3 text-xs text-gray-400">
                Your mentor application is being reviewed. You will be notified
                once approved.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {mentorProfile.mentorAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "#0B3C5D08",
                    color: "#0B3C5D",
                    border: "1px solid #0B3C5D15",
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    id={m.id}
                    name={`${m.mentee.firstName} ${m.mentee.lastName}`}
                    cadre={getCadreLabel(m.mentee.cadre)}
                    topic={m.topic}
                    status={m.status}
                    lastMessage={m.messages[0]?.content}
                    updatedAt={m.updatedAt}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Mentorships (as mentor) */}
          {activeMentorships.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Active Mentorships ({activeMentorships.length})
              </h2>
              <div className="space-y-3">
                {activeMentorships.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    id={m.id}
                    name={`${m.mentee.firstName} ${m.mentee.lastName}`}
                    cadre={getCadreLabel(m.mentee.cadre)}
                    topic={m.topic}
                    status={m.status}
                    lastMessage={m.messages[0]?.content}
                    updatedAt={m.updatedAt}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed (as mentor) */}
          {completedAsMentor.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Completed ({completedAsMentor.length})
              </h2>
              <div className="space-y-3">
                {completedAsMentor.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    id={m.id}
                    name={`${m.mentee.firstName} ${m.mentee.lastName}`}
                    cadre={getCadreLabel(m.mentee.cadre)}
                    topic={m.topic}
                    status={m.status}
                    lastMessage={m.messages[0]?.content}
                    updatedAt={m.updatedAt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mentee mentorships */}
      {isMentee && (
        <div className="space-y-6">
          {activeMentee.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                {isMentor ? "My Mentors" : "Active Mentorships"} (
                {activeMentee.length})
              </h2>
              <div className="space-y-3">
                {activeMentee.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    id={m.id}
                    name={`${m.mentorProfile.professional.firstName} ${m.mentorProfile.professional.lastName}`}
                    cadre={getCadreLabel(
                      m.mentorProfile.professional.cadre
                    )}
                    topic={m.topic}
                    status={m.status}
                    lastMessage={m.messages[0]?.content}
                    updatedAt={m.updatedAt}
                  />
                ))}
              </div>
            </div>
          )}

          {completedMentee.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Completed Mentorships ({completedMentee.length})
              </h2>
              <div className="space-y-3">
                {completedMentee.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    id={m.id}
                    name={`${m.mentorProfile.professional.firstName} ${m.mentorProfile.professional.lastName}`}
                    cadre={getCadreLabel(
                      m.mentorProfile.professional.cadre
                    )}
                    topic={m.topic}
                    status={m.status}
                    lastMessage={m.messages[0]?.content}
                    updatedAt={m.updatedAt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MentorshipCard({
  id,
  name,
  cadre,
  topic,
  status,
  lastMessage,
  updatedAt,
}: {
  id: string;
  name: string;
  cadre: string;
  topic: string;
  status: string;
  lastMessage?: string;
  updatedAt: Date;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.CANCELLED;

  return (
    <Link
      href={`/oncadre/mentorship/${id}`}
      className="group block rounded-2xl border bg-white p-5 transition-all hover:shadow-md"
      style={{ borderColor: "#E8EBF0" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-gray-900">
              {name}
            </h3>
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: style.bg, color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{cadre}</p>
          <p className="mt-2 text-sm font-medium text-gray-700">{topic}</p>
          {lastMessage && (
            <p className="mt-1.5 line-clamp-1 text-xs text-gray-400">
              {lastMessage}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[10px] text-gray-400">
            {updatedAt.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <svg
            className="h-4 w-4 text-gray-300 transition group-hover:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
