import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import AskAI from "@/components/platform/AskAI";
import { Sparkles, FileText, Users, TrendingUp, MessageSquare, BarChart2, FileEdit } from "lucide-react";

const EM_FEATURES = [
  {
    icon: Users,
    title: "Consultant Matching",
    description: "Imara ranks the best-fit consultants for any project across expertise, performance, availability, and cost.",
    href: "/projects",
    cta: "Open a project",
  },
  {
    icon: FileText,
    title: "Proposal Generator",
    description: "Enter discovery call notes and get an 80% complete proposal draft in under 20 seconds.",
    href: "/proposals",
    cta: "Generate proposal",
  },
  {
    icon: TrendingUp,
    title: "Risk Analysis",
    description: "Real-time risk scoring and outcome predictions for active projects. Catch issues before they escalate.",
    href: "/projects",
    cta: "Open a project",
  },
  {
    icon: BarChart2,
    title: "Data Analysis",
    description: "Upload Excel or CSV hospital data. Imara finds revenue leakage, inefficiencies, and gives actionable recommendations with Nigerian context.",
    href: "/ai/data-analysis",
    cta: "Analyze data",
  },
];

const CONSULTANT_FEATURES = [
  {
    icon: FileEdit,
    title: "Report Generator",
    description: "Enter your findings and recommendations. Imara drafts a polished, executive-ready consulting report with Nigerian healthcare context.",
    href: "/ai/report-generator",
    cta: "Generate report",
  },
  {
    icon: BarChart2,
    title: "Data Analysis",
    description: "Upload hospital data. Imara identifies patterns, inefficiencies, and surfaces actionable recommendations.",
    href: "/ai/data-analysis",
    cta: "Analyze data",
  },
];

export default async function AIPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const features = isEM ? [...EM_FEATURES, { icon: FileEdit, title: "Report Generator", description: "Enter your findings and recommendations. Imara drafts a polished, executive-ready consulting report with Nigerian healthcare context.", href: "/ai/report-generator", cta: "Generate report" }] : CONSULTANT_FEATURES;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Imara" subtitle="CFA Intelligence" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl space-y-6">
          {/* Header */}
          <div
            className="rounded-xl p-5 flex items-start gap-4"
            style={{ background: "#0F2744" }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Imara</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                {isEM
                  ? "CFA's intelligence layer. Match consultants in 5 minutes, write proposals in 20 seconds, predict risks before they become problems."
                  : "Your intelligence layer for drafting reports, analysing data, and getting answers about your engagements."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Available Features</h3>
              {features.map(({ icon: Icon, title, description, href, cta }) => (
                <div
                  key={title}
                  className="rounded-xl bg-white p-4 flex items-start gap-3"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#F0F4FF" }}
                  >
                    <Icon size={15} style={{ color: "#0F2744" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                    <Link
                      href={href}
                      className="mt-2 inline-flex items-center text-xs font-semibold"
                      style={{ color: "#0F2744" }}
                    >
                      {cta} →
                    </Link>
                  </div>
                </div>
              ))}

              {/* Usage note */}
              <div
                className="rounded-xl p-4 text-xs text-gray-500"
                style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
              >
                <p className="font-medium text-gray-700 mb-1">About Imara</p>
                <p>Imara is powered by Claude (Anthropic). Features work best when consultant profiles are complete and project data is up to date.</p>
              </div>
            </div>

            {/* Ask AI chat */}
            <div
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ border: "1px solid #e5eaf0", minHeight: "500px" }}
            >
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #e5eaf0", background: "#F9FAFB" }}>
                <MessageSquare size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Ask Imara</span>
              </div>
              <div className="flex-1">
                <AskAI />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
