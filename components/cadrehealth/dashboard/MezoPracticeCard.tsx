import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

/**
 * The Mezo private practice slot on the dashboard.
 *
 * Deliberately sold rather than announced. A member who has not answered sees
 * the proposition, not an instruction to claim something: "claim your account"
 * tells a consultant nothing about why they would want one. Once their place
 * is open the card turns into the way back into it, because the account is
 * worth nothing until it is claimed and the dashboard is where they return.
 *
 * Renders nothing for cadres Mezo cannot take, rather than showing an offer
 * that ends in a refusal.
 */
export default function MezoPracticeCard({
  eligible,
  answered,
  claimUrl,
}: {
  eligible: boolean;
  answered: boolean;
  claimUrl: string | null;
}) {
  if (!eligible) return null;

  if (answered && claimUrl) {
    return (
      <Link
        href={claimUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
          border: "1px solid rgba(10,123,110,0.25)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: "#065F46" }} />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#065F46" }}
              >
                Mezo place open
              </p>
            </div>
            <h3 className="text-base font-bold" style={{ color: "#065F46" }}>
              Set your password and your practice is live
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "#047857" }}>
              Your Mezo account is waiting. It stays unclaimed until you open it.
            </p>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0" style={{ color: "#065F46" }} />
        </div>
      </Link>
    );
  }

  if (answered) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: "#F9FAFB", border: "1px solid #E8EBF0" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: "#6B7280" }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#6B7280" }}
          >
            Mezo
          </p>
        </div>
        <h3 className="text-base font-bold" style={{ color: "#374151" }}>
          We are opening your place
        </h3>
        <p className="mt-1.5 text-sm" style={{ color: "#6B7280" }}>
          Your answers are recorded. We will email you the moment your account is ready.
        </p>
      </div>
    );
  }

  return (
    <Link
      href="/oncadre/mezo"
      className="relative block overflow-hidden rounded-2xl px-6 py-8 transition-all hover:scale-[1.004] sm:px-8"
      style={{
        background: "linear-gradient(135deg, #0B1F3A 0%, #10314F 55%, #0B1F3A 100%)",
        boxShadow: "0 4px 24px rgba(11,31,58,0.20)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 90% at 90% 15%, rgba(0,196,163,0.20) 0%, transparent 62%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-5">
        <div className="max-w-xl">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "#00C4A3" }}
          >
            Mezo Health · Private practice
          </p>
          <h3
            className="mt-2 font-bold text-white"
            style={{ fontSize: "clamp(1.25rem, 2.4vw, 1.6rem)" }}
          >
            Your own practice, without building one.
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.66)" }}>
            Clinics, theatres, beds and physio bays, patients already searching for your specialty,
            and HMO panels negotiated on the network's volume. Tell us what would actually work and
            your place opens.
          </p>
          <span
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#00C4A3", color: "#06231D" }}
          >
            See what Mezo opens up
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
