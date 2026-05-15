import Link from "next/link";
import { AlertTriangle, ShieldCheck, Calendar } from "lucide-react";

interface Credential {
  id: string;
  type: string;
  regulatoryBody: string;
  expiryDate: Date | null;
}

const TYPE_LABELS: Record<string, string> = {
  PRACTICING_LICENSE: "Practising license",
  FULL_REGISTRATION: "Full registration",
  COGS: "COGS",
  SPECIALIST_REGISTRATION: "Specialist registration",
  ADDITIONAL_LICENSE: "Additional license",
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function CredentialRenewals({ credentials }: { credentials: Credential[] }) {
  // Only those with an expiry date, sorted soonest first
  const dated = credentials
    .filter((c) => c.expiryDate)
    .map((c) => ({ ...c, days: daysUntil(c.expiryDate!) }))
    .sort((a, b) => a.days - b.days);

  if (dated.length === 0) return null;

  // Surface only "renewal window" credentials (expires within 90 days OR already expired)
  const urgent = dated.filter((c) => c.days <= 90);
  if (urgent.length === 0) return null;

  return (
    <div className="space-y-2">
      {urgent.map((c) => {
        const expired = c.days < 0;
        const critical = c.days <= 30;
        const Icon = expired || critical ? AlertTriangle : Calendar;
        const bg = expired
          ? "#FEE2E2"
          : critical
          ? "#FEF3C7"
          : "#EFF6FF";
        const accent = expired
          ? "#991B1B"
          : critical
          ? "#92400E"
          : "#1E40AF";
        const border = expired ? "#FECACA" : critical ? "#FDE68A" : "#BFDBFE";

        return (
          <Link
            key={c.id}
            href="/oncadre/profile#credentials"
            className="block rounded-xl p-4 transition-all hover:scale-[1.005]"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: accent, color: "#fff" }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: accent }}>
                    {expired ? "Expired:" : ""} {TYPE_LABELS[c.type] ?? c.type} ({c.regulatoryBody})
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: `${accent}cc` }}>
                    {expired
                      ? `Expired ${Math.abs(c.days)} day${Math.abs(c.days) === 1 ? "" : "s"} ago. Renew to keep practising.`
                      : c.days === 0
                      ? "Expires today. Renew now."
                      : `Renews in ${c.days} day${c.days === 1 ? "" : "s"}. Don't let it lapse.`}
                  </p>
                </div>
              </div>
              <ShieldCheck className="h-4 w-4 shrink-0 opacity-50" style={{ color: accent }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
