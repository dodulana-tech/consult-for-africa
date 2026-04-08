"use client";

import { useRouter } from "next/navigation";

export default function AgentLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/agent-portal/auth", { method: "DELETE" });
    router.push("/agent/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-medium text-gray-400 transition hover:text-gray-600"
    >
      Sign out
    </button>
  );
}
