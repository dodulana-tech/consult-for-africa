import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function beginAssessmentAction() {
  "use server";
  const auth = await getMaarovaSession();
  if (!auth) redirect("/maarova/portal/login");

  const user = await prisma.maarovaUser.findUnique({
    where: { id: auth.sub },
    include: { organisation: true },
  });
  if (!user || !user.organisation) {
    redirect("/maarova/portal/assessment?error=no-org");
  }

  const org = user.organisation;
  if (org.usedAssessments >= org.maxAssessments) {
    redirect("/maarova/portal/assessment?error=no-slots");
  }

  const existing = await prisma.maarovaAssessmentSession.findFirst({
    where: {
      userId: user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    revalidatePath("/maarova/portal/assessment");
    redirect("/maarova/portal/assessment");
  }

  const allModules = await prisma.maarovaModule.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  // Gate CILTI to users with a clinical background. Non-clinical users skip it.
  const hasClinicalBackground = !!user.clinicalBackground?.trim();
  const modules = allModules.filter(
    (m) => m.type !== "CILTI" || hasClinicalBackground
  );

  if (modules.length === 0) {
    redirect("/maarova/portal/assessment?error=no-modules");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction([
    prisma.maarovaAssessmentSession.create({
      data: {
        userId: user.id,
        status: "NOT_STARTED",
        sessionType: "full",
        stream: org.stream,
        expiresAt,
        moduleResponses: {
          create: modules.map((mod) => ({
            moduleId: mod.id,
            status: "NOT_STARTED",
          })),
        },
      },
    }),
    prisma.maarovaOrganisation.update({
      where: { id: org.id },
      data: { usedAssessments: { increment: 1 } },
    }),
  ]);

  revalidatePath("/maarova/portal/assessment");
  redirect("/maarova/portal/assessment");
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    bg: "rgba(255,255,255,0.05)",
    text: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.08)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "rgba(212,165,116,0.1)",
    text: "#D4A574",
    border: "rgba(212,165,116,0.3)",
  },
  COMPLETED: {
    label: "Completed",
    bg: "rgba(16,185,129,0.1)",
    text: "#10B981",
    border: "rgba(16,185,129,0.3)",
  },
  EXPIRED: {
    label: "Expired",
    bg: "rgba(239,68,68,0.1)",
    text: "#EF4444",
    border: "rgba(239,68,68,0.3)",
  },
};

const moduleIcons: Record<string, React.ReactNode> = {
  DISC: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  VALUES_DRIVERS: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  EMOTIONAL_INTEL: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  CILTI: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  THREE_SIXTY: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  CULTURE_TEAM: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

export default async function AssessmentLauncherPage() {
  const auth = await getMaarovaSession();
  if (!auth) redirect("/maarova/portal/login");

  // Prefer completed session, fall back to active incomplete session
  const sessionInclude = {
    moduleResponses: {
      include: {
        module: true,
        itemResponses: { select: { id: true } },
      },
      orderBy: { module: { order: "asc" } } as const,
    },
  };

  const session =
    (await prisma.maarovaAssessmentSession.findFirst({
      where: { userId: auth.sub, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: sessionInclude,
    })) ??
    (await prisma.maarovaAssessmentSession.findFirst({
      where: { userId: auth.sub, status: { in: ["IN_PROGRESS", "NOT_STARTED"] }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: sessionInclude,
    }));

  const coreResponses = session
    ? session.moduleResponses.filter((mr) => mr.module.type !== "THREE_SIXTY")
    : [];
  const threeSixtyResponse = session
    ? session.moduleResponses.find((mr) => mr.module.type === "THREE_SIXTY")
    : null;
  const completedCount = coreResponses.filter((mr) => mr.status === "COMPLETED").length;
  const totalCoreModules = coreResponses.length;
  const progressPercent =
    totalCoreModules > 0 ? Math.round((completedCount / totalCoreModules) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Leadership Assessment
        </h1>
        <p className="text-gray-500 text-sm">
          Complete the five core modules to generate your leadership profile.
          Results are available after each module. 360 Feedback runs separately.
        </p>
      </div>

      {!session ? (
        /* No session - show begin button */
        <div
          className="rounded-2xl p-6 sm:p-12 text-center"
          style={{
            background: "linear-gradient(135deg, #0f1a2a 0%, #1a2d45 100%)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(212,165,116,0.15)" }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "#D4A574" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">
            Ready to begin your assessment?
          </h2>
          <p
            className="mb-5 sm:mb-8 max-w-md mx-auto text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            The Maarova Leadership Assessment takes approximately 45 to 60
            minutes to complete. You have 7 days from when you start, and you
            can save your progress at any time.
          </p>
          <form action={beginAssessmentAction}>
            <BeginAssessmentButton />
          </form>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {completedCount} of {totalCoreModules} core modules completed
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background:
                    progressPercent === 100
                      ? "#10B981"
                      : "linear-gradient(90deg, #D4A574, #e8c9a0)",
                }}
              />
            </div>
            {session.status === "COMPLETED" && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800 font-medium">
                  Core assessment complete. Your comprehensive leadership report
                  is ready.
                </p>
                <Link
                  href="/maarova/portal/results"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  View Results
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Core module cards */}
          <div className="grid gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Core Assessment ({totalCoreModules} modules)
            </h2>
            {coreResponses.map((mr) => {
              const mod = mr.module;
              const status = statusConfig[mr.status] ?? statusConfig.NOT_STARTED;
              const isCompleted = mr.status === "COMPLETED";
              const isInProgress = mr.status === "IN_PROGRESS";
              const answeredCount = mr.itemResponses.length;

              return (
                <div
                  key={mr.id}
                  className="rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 transition-all hover:shadow-md"
                  style={{
                    borderColor: isCompleted
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(0,0,0,0.06)",
                    background: isCompleted
                      ? "rgba(16,185,129,0.02)"
                      : "#fff",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isCompleted
                        ? "rgba(16,185,129,0.1)"
                        : isInProgress
                          ? "rgba(212,165,116,0.1)"
                          : "rgba(0,0,0,0.04)",
                      color: isCompleted
                        ? "#10B981"
                        : isInProgress
                          ? "#D4A574"
                          : "#9CA3AF",
                    }}
                  >
                    {moduleIcons[mod.type] ?? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {mod.name}
                      </h3>
                      <span
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{
                          background: status.bg,
                          color: status.text,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1 line-clamp-1">
                      {mod.description}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-400">
                      <span>{mod.estimatedMinutes} min</span>
                      {answeredCount > 0 && !isCompleted && (
                        <span>{answeredCount} answers saved</span>
                      )}
                      {isCompleted && mr.completedAt && (
                        <span>
                          Completed{" "}
                          {new Date(mr.completedAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    {isCompleted ? (
                      <Link
                        href={`/maarova/portal/results#module-${mod.type}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-emerald-50"
                        style={{ color: "#10B981" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        View Scores
                      </Link>
                    ) : (
                      <Link
                        href={`/maarova/portal/assessment/${mod.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                        style={{
                          background: isInProgress ? "#D4A574" : "#0f1a2a",
                          color: isInProgress ? "#06090f" : "#fff",
                        }}
                      >
                        {isInProgress ? "Continue" : "Start"}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 360 Feedback - Separate Track */}
          {threeSixtyResponse && (
            <div className="grid gap-4 mt-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                360 Feedback (Separate Track)
              </h2>
              {(() => {
                const mr = threeSixtyResponse;
                const mod = mr.module;
                const status = statusConfig[mr.status] ?? statusConfig.NOT_STARTED;
                const isCompleted = mr.status === "COMPLETED";
                return (
                  <div
                    className="rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-3 sm:gap-5"
                    style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FAFBFC" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCompleted ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.04)",
                        color: isCompleted ? "#10B981" : "#9CA3AF",
                      }}
                    >
                      {moduleIcons[mod.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{mod.name}</h3>
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                          style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{mod.description}</p>
                      <p className="text-xs text-gray-400">
                        This module runs separately. Invite raters from the{" "}
                        <Link href="/maarova/portal/three-sixty" className="underline hover:text-gray-600">
                          360 Feedback
                        </Link>{" "}
                        page. Results will enrich your comprehensive report when available.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Session info */}
          <div className="mt-6 sm:mt-8 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span>
              Session expires:{" "}
              {new Date(session.expiresAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>Session ID: {session.id.slice(0, 8)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* Client component for the begin button (needs form submission via JS) */
function BeginAssessmentButton() {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ background: "#D4A574", color: "#06090f" }}
    >
      Begin Assessment
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </button>
  );
}
