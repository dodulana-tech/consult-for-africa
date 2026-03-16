import Link from "next/link";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/impact", label: "Impact & Results" },
  { href: "/documents", label: "Documents" },
  { href: "/report", label: "Executive Summary" },
];

export default function ClientProjectNav({
  projectId,
  current,
}: {
  projectId: string;
  current: string;
}) {
  const base = `/client/projects/${projectId}`;

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto px-1 py-1 rounded-xl"
      style={{ background: "#F1F5F9" }}
    >
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = current === tab.href;
        return (
          <Link
            key={tab.href}
            href={href}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "#0F2744" : "#6B7280",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
