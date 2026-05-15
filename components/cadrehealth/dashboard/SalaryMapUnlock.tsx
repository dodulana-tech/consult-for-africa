"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, Lock, Unlock } from "lucide-react";

interface Stats {
  cadre: string;
  state: string | null;
  salaryReportsInCadre: number;
  salaryReportsInState: number;
  peersInCadre: number;
}

const CADRE_LABELS: Record<string, string> = {
  MEDICINE: "doctors",
  DENTISTRY: "dentists",
  NURSING: "nurses",
  MIDWIFERY: "midwives",
  PHARMACY: "pharmacists",
  MEDICAL_LABORATORY_SCIENCE: "med lab scientists",
  RADIOGRAPHY_IMAGING: "radiographers",
  REHABILITATION_THERAPY: "physiotherapists",
  OPTOMETRY: "optometrists",
  COMMUNITY_HEALTH: "community health workers",
  ENVIRONMENTAL_HEALTH: "environmental health officers",
  NUTRITION_DIETETICS: "nutritionists",
  PSYCHOLOGY_SOCIAL_WORK: "clinical psychologists / social workers",
  PUBLIC_HEALTH: "public health professionals",
  HEALTH_ADMINISTRATION: "health administrators",
  HEALTH_RECORDS: "health records officers",
  HOSPITAL_MANAGEMENT: "hospital managers",
  BIOMEDICAL_ENGINEERING: "biomedical engineers",
};

export default function SalaryMapUnlock({ hasReported }: { hasReported: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/cadre/dashboard-stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const cadreWord = stats ? CADRE_LABELS[stats.cadre] ?? "professionals" : "professionals";
  const cadreCount = stats?.salaryReportsInCadre ?? 0;
  const stateCount = stats?.salaryReportsInState ?? 0;

  // Useful threshold: with <10 reports in your cadre, the map is thin.
  const isUsefulNationally = cadreCount >= 10;
  const isUsefulInState = stateCount >= 5;

  if (hasReported) {
    return (
      <Link
        href="/oncadre/salary-map"
        className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
          border: "1px solid rgba(5,150,105,0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Unlock className="h-4 w-4" style={{ color: "#065F46" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#065F46" }}>
                Salary map unlocked
              </p>
            </div>
            <h3 className="text-base font-bold" style={{ color: "#065F46" }}>
              See what {cadreWord} earn
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "#047857" }}>
              {cadreCount} report{cadreCount === 1 ? "" : "s"} from {cadreWord} nationwide
              {stats?.state && stateCount > 0 && ` · ${stateCount} in ${stats.state}`}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 mt-1" style={{ color: "#065F46" }} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/oncadre/salary-map"
      className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
      style={{
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4" style={{ color: "#92400E" }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#92400E" }}>
              Salary map locked
            </p>
          </div>
          <h3 className="text-base font-bold" style={{ color: "#92400E" }}>
            Share your salary, see everyone else's
          </h3>
          <p className="mt-1.5 text-sm" style={{ color: "#B45309" }}>
            {cadreCount > 0 ? (
              <>
                <span className="font-semibold">{cadreCount}</span> {cadreWord} have already contributed
                {stats?.state && stateCount > 0 && (
                  <> ({stateCount} in {stats.state})</>
                )}
                . Add yours to unlock the full picture.
              </>
            ) : (
              <>You'll be the first {cadreWord.replace(/s$/, "")} in this cadre to share. Be the seed.</>
            )}
          </p>

          {/* Density indicator */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <DensityPill label="Nationally" count={cadreCount} useful={isUsefulNationally} />
            {stats?.state && (
              <DensityPill label={stats.state} count={stateCount} useful={isUsefulInState} />
            )}
          </div>
        </div>
        <BarChart3 className="h-6 w-6 shrink-0" style={{ color: "#92400E" }} />
      </div>
    </Link>
  );
}

function DensityPill({ label, count, useful }: { label: string; count: number; useful: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
      style={{
        background: useful ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
        color: useful ? "#047857" : "#92400E",
      }}
    >
      <span className="font-semibold">{count}</span>
      <span className="opacity-70">in {label}</span>
      {useful && <span className="opacity-70">· useful</span>}
    </div>
  );
}
