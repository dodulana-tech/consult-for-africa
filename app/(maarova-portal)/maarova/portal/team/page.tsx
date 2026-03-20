import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import TeamOverviewClient from "./TeamOverviewClient";

export default async function TeamPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");
  if (!["MANAGER", "HR_ADMIN"].includes(session.role ?? "USER")) redirect("/maarova/portal/dashboard");

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Team</h1>
        <p className="text-gray-500 text-sm mt-1">Direct reports and their development progress</p>
      </div>
      <TeamOverviewClient />
    </div>
  );
}
