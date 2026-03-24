"use client";

import { useState } from "react";
import {
  GraduationCap,
  Clock,
  Award,
  BookOpen,
  ChevronRight,
  Lock,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Brain,
  HeartPulse,
  LayoutDashboard,
  MonitorSmartphone,
  Trophy,
} from "lucide-react";

type ModuleProgress = {
  moduleId: string;
  status: string;
  score: number | null;
  completedAt: Date | string | null;
  timeSpentMinutes: number;
};

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: Date | string;
  completedAt: Date | string | null;
  certifiedAt: Date | string | null;
  overallScore: number | null;
  moduleProgress: ModuleProgress[];
};

type TrackModule = {
  id: string;
  name: string;
  slug: string;
  order: number;
  estimatedMinutes: number;
  passingScore: number;
};

type Track = {
  id: string;
  name: string;
  slug: string;
  description: string;
  level: "FOUNDATION" | "SPECIALIST" | "MASTER";
  category: string;
  iconName: string | null;
  colorHex: string | null;
  prerequisites: string[];
  estimatedHours: number;
  pricingType: string;
  priceNGN: number | null;
  discountPct: number | null;
  modules: TrackModule[];
  enrollments: Enrollment[];
  _count: { enrollments: number; modules: number };
};

type Stats = {
  totalTracks: number;
  certified: number;
  hoursLogged: number;
  inProgress: number;
};

const LEVEL_CONFIG = {
  FOUNDATION: { label: "Foundation", color: "#0B3C5D", bg: "#EFF6FF", order: 0 },
  SPECIALIST: { label: "Specialist", color: "#D97706", bg: "#FFFBEB", order: 1 },
  MASTER: { label: "Master", color: "#D4AF37", bg: "#FEF9E7", order: 2 },
};

const ICON_MAP: Record<string, typeof Brain> = {
  brain: Brain,
  "heart-pulse": HeartPulse,
  "layout-dashboard": LayoutDashboard,
  "bar-chart-3": BarChart3,
  "monitor-smartphone": MonitorSmartphone,
  award: Trophy,
};

const STATUS_ICONS = {
  LOCKED: Lock,
  AVAILABLE: PlayCircle,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle2,
  FAILED: PlayCircle,
};

export default function AcademyClient({
  tracks,
  stats,
  userId,
  userRole,
}: {
  tracks: Track[];
  stats: Stats;
  userId: string;
  userRole?: string;
}) {
  const [activeLevel, setActiveLevel] = useState<string>("ALL");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const filtered =
    activeLevel === "ALL" ? tracks : tracks.filter((t) => t.level === activeLevel);

  const grouped = filtered.reduce(
    (acc, track) => {
      const level = track.level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(track);
      return acc;
    },
    {} as Record<string, Track[]>
  );

  const sortedLevels = Object.keys(grouped).sort(
    (a, b) =>
      LEVEL_CONFIG[a as keyof typeof LEVEL_CONFIG].order -
      LEVEL_CONFIG[b as keyof typeof LEVEL_CONFIG].order
  );

  async function handleEnroll(trackId: string) {
    setEnrolling(trackId);
    try {
      const res = await fetch("/api/training/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        if (data.requiresPayment) {
          handlePurchase(trackId);
        } else {
          alert(data.error || "Failed to enroll");
        }
      }
    } catch {
      alert("Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  }

  async function handlePurchase(trackId: string) {
    setPurchasing(trackId);
    try {
      const res = await fetch("/api/training/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || "Failed to initialize payment");
      }
    } catch {
      alert("Failed to initialize payment");
    } finally {
      setPurchasing(null);
    }
  }

  function formatPrice(price: number) {
    return `\u20A6${price.toLocaleString("en-NG")}`;
  }

  function getTrackProgress(track: Track) {
    const enrollment = track.enrollments[0];
    if (!enrollment) return null;
    const completed = enrollment.moduleProgress.filter((p) => p.status === "COMPLETED").length;
    const total = track.modules.length;
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0, enrollment };
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0a1e32 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap size={20} className="text-white/70" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              CFA Academy
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-6">Training & Certification</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Available Tracks", value: stats.totalTracks, icon: BookOpen },
              { label: "In Progress", value: stats.inProgress, icon: PlayCircle },
              { label: "Certified", value: stats.certified, icon: Award },
              { label: "Hours Logged", value: stats.hoursLogged, icon: Clock },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <s.icon size={16} className="text-white/40 mb-2" />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reapply banner for Academy Learners */}
      {userRole === "ACADEMY_LEARNER" && (
        <div className="px-8 py-4" style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Ready to reapply to Consult For Africa?
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Complete at least 1 Foundation and 1 Specialist track to unlock reapplication.
              </p>
            </div>
            <a
              href="/academy/reapply"
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#D97706", color: "#fff" }}
            >
              Check Eligibility
            </a>
          </div>
        </div>
      )}

      {/* Level filter tabs */}
      <div className="px-8 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto flex gap-2">
          {["ALL", "FOUNDATION", "SPECIALIST", "MASTER"].map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeLevel === level ? "#0B3C5D" : "transparent",
                color: activeLevel === level ? "#fff" : "#64748B",
                border: activeLevel === level ? "none" : "1px solid #E2E8F0",
              }}
            >
              {level === "ALL" ? "All Levels" : LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG].label}
            </button>
          ))}
        </div>
      </div>

      {/* Track cards */}
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {sortedLevels.map((level) => {
            const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
            return (
              <div key={level}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {config.label}
                  </div>
                  <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grouped[level].map((track) => {
                    const Icon = ICON_MAP[track.iconName ?? "brain"] ?? BookOpen;
                    const progress = getTrackProgress(track);
                    const isExpanded = expandedTrack === track.id;
                    const completedModuleIds = new Set(
                      progress?.enrollment.moduleProgress
                        .filter((p) => p.status === "COMPLETED")
                        .map((p) => p.moduleId) ?? []
                    );
                    const nextModule = track.modules.find((m) => !completedModuleIds.has(m.id));

                    return (
                      <div
                        key={track.id}
                        className="rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                        style={{ border: "1px solid #E2E8F0", background: "#fff" }}
                      >
                        {/* Card header */}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ background: track.colorHex ?? "#0B3C5D", opacity: 0.9 }}
                            >
                              <Icon size={18} className="text-white" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {track.pricingType === "PAID" && track.priceNGN && !progress && (
                                <div className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                                  {formatPrice(track.priceNGN)}
                                </div>
                              )}
                              {track.pricingType === "FREE" && !progress && (
                                <div className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: "#ECFDF5", color: "#059669" }}>
                                  Free
                                </div>
                              )}
                              {progress?.enrollment.status === "CERTIFIED" && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#ECFDF5", color: "#059669" }}>
                                  <CheckCircle2 size={12} /> Certified
                                </div>
                              )}
                            </div>
                          </div>

                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{track.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{track.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <BookOpen size={12} /> {track._count.modules} modules
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {track.estimatedHours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap size={12} /> {track._count.enrollments} enrolled
                            </span>
                          </div>

                          {/* Progress bar */}
                          {progress && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">
                                  {progress.completed}/{progress.total} modules
                                </span>
                                <span className="font-medium" style={{ color: track.colorHex ?? "#0B3C5D" }}>
                                  {progress.pct}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${progress.pct}%`,
                                    background: track.colorHex ?? "#0B3C5D",
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Prerequisites */}
                          {track.prerequisites.length > 0 && !progress && (
                            <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                              <Lock size={10} />
                              <span>Requires: {track.prerequisites.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        {/* Expandable module list */}
                        <div style={{ borderTop: "1px solid #E2E8F0" }}>
                          <button
                            onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                            className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <span>View modules</span>
                            <ChevronRight
                              size={14}
                              className="transition-transform"
                              style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                            />
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-4 space-y-2">
                              {track.modules.map((mod) => {
                                const modProgress = progress?.enrollment.moduleProgress.find(
                                  (p) => p.moduleId === mod.id
                                );
                                const status = modProgress?.status ?? "LOCKED";
                                const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? Lock;

                                return (
                                  <div
                                    key={mod.id}
                                    className="flex items-center gap-3 p-2.5 rounded-lg text-sm"
                                    style={{
                                      background: status === "COMPLETED" ? "#F0FDF4" : status === "IN_PROGRESS" || status === "AVAILABLE" ? "#EFF6FF" : "#F9FAFB",
                                      opacity: status === "LOCKED" ? 0.6 : 1,
                                    }}
                                  >
                                    <StatusIcon
                                      size={14}
                                      style={{
                                        color:
                                          status === "COMPLETED" ? "#059669" : status === "LOCKED" ? "#94A3B8" : "#0B3C5D",
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{mod.name}</p>
                                      <p className="text-[10px] text-gray-400">{mod.estimatedMinutes} min</p>
                                    </div>
                                    {modProgress?.score != null && (
                                      <span className="text-xs font-medium" style={{ color: modProgress.score >= mod.passingScore ? "#059669" : "#DC2626" }}>
                                        {modProgress.score}%
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action button */}
                        <div className="px-5 pb-5">
                          {progress ? (
                            progress.enrollment.status === "CERTIFIED" ? (
                              <a
                                href="/academy/certificates"
                                className="block w-full py-2.5 rounded-lg text-xs font-semibold text-center transition-all"
                                style={{ background: "#ECFDF5", color: "#059669" }}
                              >
                                View Certificate
                              </a>
                            ) : (
                              <a
                                href={`/academy/${nextModule?.slug ?? track.modules[0]?.slug ?? ""}`}
                                className="block w-full py-2.5 rounded-lg text-xs font-semibold text-white text-center transition-all"
                                style={{ background: track.colorHex ?? "#0B3C5D" }}
                              >
                                Continue Learning
                              </a>
                            )
                          ) : track.pricingType === "PAID" && track.priceNGN ? (
                            <button
                              onClick={() => handlePurchase(track.id)}
                              disabled={purchasing === track.id}
                              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                              style={{ background: "#D97706" }}
                            >
                              {purchasing === track.id
                                ? "Redirecting to payment..."
                                : `Pay ${formatPrice(track.priceNGN)} & Enroll`}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(track.id)}
                              disabled={enrolling === track.id}
                              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                              style={{ background: track.colorHex ?? "#0B3C5D" }}
                            >
                              {enrolling === track.id ? "Enrolling..." : "Start Track"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No training tracks available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
