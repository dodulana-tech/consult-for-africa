"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PartnerPortalLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/partner-portal/auth", { method: "DELETE" });
    router.push("/partner/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      style={{
        color: "#6B7280",
        border: "1px solid #e5eaf0",
        background: "#fff",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
