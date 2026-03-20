"use client";

import { useRouter } from "next/navigation";

export default function CoachLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/maarova/coach/auth", { method: "DELETE" });
    router.push("/maarova/coach/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-sm"
    >
      Sign out
    </button>
  );
}
