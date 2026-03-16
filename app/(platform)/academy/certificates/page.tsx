import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import { Award, Calendar, GraduationCap, Download } from "lucide-react";

const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  FOUNDATION: { bg: "#EFF6FF", color: "#0B3C5D", border: "#BFDBFE" },
  SPECIALIST: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  MASTER: { bg: "#FEF9E7", color: "#D4AF37", border: "#D4AF37" },
};

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const enrollments = await prisma.trainingEnrollment.findMany({
    where: {
      userId: session.user.id,
      certifiedAt: { not: null },
    },
    orderBy: { certifiedAt: "desc" },
    include: {
      track: {
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          category: true,
          iconName: true,
          colorHex: true,
          estimatedHours: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="My Certificates"
        subtitle={`${enrollments.length} earned`}
        backHref="/academy"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {enrollments.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-600 mb-2">
              No certificates yet
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Complete a training track to earn your first certification. Head over to the
              Academy to get started.
            </p>
            <a
              href="/academy"
              className="inline-block mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0B3C5D" }}
            >
              Browse Academy
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
            {enrollments.map((enrollment) => {
              const track = enrollment.track;
              const style = LEVEL_STYLE[track.level] ?? LEVEL_STYLE.FOUNDATION;
              const certDate = enrollment.certifiedAt!;

              return (
                <div
                  key={enrollment.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "#fff", border: `1px solid ${style.border}` }}
                >
                  {/* Certificate visual header */}
                  <div
                    className="px-6 py-8 text-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${track.colorHex ?? "#0B3C5D"} 0%, ${track.colorHex ? track.colorHex + "cc" : "#0a1e32"} 100%)`,
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <Award size={28} className="text-white" />
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight">
                      {track.name}
                    </h3>
                    <p className="text-white/60 text-xs mt-1 uppercase tracking-wider">
                      {track.level} Certification
                    </p>
                  </div>

                  {/* Certificate details */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        Awarded to
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                        {session.user.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        Date
                      </span>
                      <span className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {certDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {enrollment.overallScore != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          Score
                        </span>
                        <span className="text-sm font-medium" style={{ color: "#059669" }}>
                          {enrollment.overallScore}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        Level
                      </span>
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {track.level}
                      </span>
                    </div>

                    {enrollment.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          Valid until
                        </span>
                        <span className="text-sm text-gray-600">
                          {enrollment.expiresAt.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Download button (placeholder for future PDF) */}
                  <div
                    className="px-6 py-4"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                  >
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: style.bg, color: style.color }}
                      title="PDF generation coming soon"
                    >
                      <Download size={14} />
                      Download Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
