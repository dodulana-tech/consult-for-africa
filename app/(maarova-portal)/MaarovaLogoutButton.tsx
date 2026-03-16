"use client";

import { useRouter } from "next/navigation";

export default function MaarovaLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/maarova/auth", { method: "DELETE" });
    router.push("/maarova/portal/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left text-gray-400 hover:text-white text-xs py-1 transition-colors"
    >
      Sign out
    </button>
  );
}
