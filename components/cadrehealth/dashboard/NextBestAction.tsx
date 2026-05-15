import Link from "next/link";
import { ArrowRight, Sparkles, Award, BarChart3, FileText, Star } from "lucide-react";

interface ProfessionalState {
  hasReadiness: boolean;
  hasCredentials: boolean;
  hasSalaryReport: boolean;
  hasQualifications: boolean;
  hasCv: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  daysSinceJoined: number;
}

/**
 * Pick the highest-value next action for this user based on what they
 * have and haven't done. Returns null if they've done everything --
 * we just nudge them to revisit the advisor.
 */
function pickAction(s: ProfessionalState) {
  if (!s.emailVerified) {
    return {
      key: "verify-email",
      icon: Star,
      title: "Verify your email",
      body: "Check your inbox for the verification link. It unlocks everything else on the platform.",
      cta: "Resend Verification",
      href: "/oncadre/profile",
      bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      accent: "#92400E",
      tagline: "1 minute",
    };
  }

  if (!s.hasReadiness) {
    return {
      key: "readiness",
      icon: BarChart3,
      title: "Get your career readiness score",
      body: "A 5-minute assessment gives you a personalised score for Nigeria, UK, US, Canada and the Gulf. Most valuable thing you can do today.",
      cta: "Take the assessment",
      href: "/oncadre/career-report",
      bg: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
      accent: "#1E40AF",
      tagline: "5 minutes",
    };
  }

  if (!s.hasCredentials) {
    return {
      key: "credentials",
      icon: Award,
      title: "Add your practising license",
      body: "Get verified against your regulatory body (MDCN, NMCN, PCN, etc.). Verified professionals appear higher in matches and can write hospital reviews.",
      cta: "Add license details",
      href: "/oncadre/profile#credentials",
      bg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
      accent: "#5B21B6",
      tagline: "2 minutes",
    };
  }

  if (!s.hasSalaryReport) {
    return {
      key: "salary",
      icon: BarChart3,
      title: "Share your salary, unlock the map",
      body: "Anonymously contribute one salary data point and see what your cadre earns nationwide, state by state. The more contributors, the sharper the picture.",
      cta: "Share your salary",
      href: "/oncadre/salary-map",
      bg: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
      accent: "#065F46",
      tagline: "1 minute",
    };
  }

  if (!s.hasCv) {
    return {
      key: "cv",
      icon: FileText,
      title: "Upload your CV",
      body: "Drop your latest CV so engagement managers can match you to opportunities without back-and-forth.",
      cta: "Upload CV",
      href: "/oncadre/profile",
      bg: "linear-gradient(135deg, #FCE7F3, #FBCFE8)",
      accent: "#9D174D",
      tagline: "30 seconds",
    };
  }

  if (!s.hasQualifications) {
    return {
      key: "qualifications",
      icon: Award,
      title: "Add your qualifications",
      body: "MBBS, FWACS, fellowships, postgraduate diplomas - list everything you have. Surfaces you for specialist mandates.",
      cta: "Add qualifications",
      href: "/oncadre/profile#qualifications",
      bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      accent: "#92400E",
      tagline: "3 minutes",
    };
  }

  // Profile is solid — point them at the career advisor.
  return {
    key: "advisor",
    icon: Sparkles,
    title: "Ask the career advisor",
    body: "Stuck on a career decision? Considering relocation? Negotiating a contract? The advisor knows the Nigerian healthcare landscape and the diaspora pathways.",
    cta: "Start a conversation",
    href: "/oncadre/advisor",
    bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    accent: "#92400E",
    tagline: "Anytime",
  };
}

export default function NextBestAction({ state }: { state: ProfessionalState }) {
  const action = pickAction(state);
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group block rounded-2xl p-6 sm:p-7 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: action.bg,
        border: `1px solid ${action.accent}22`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: action.accent, color: "#fff" }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: action.accent }}>
              Next best step
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${action.accent}15`, color: action.accent }}>
              {action.tagline}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg sm:text-xl font-bold" style={{ color: action.accent }}>
            {action.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: `${action.accent}cc` }}>
            {action.body}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 mt-2 transition-transform group-hover:translate-x-1" style={{ color: action.accent }} />
      </div>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: action.accent }}>
        {action.cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
