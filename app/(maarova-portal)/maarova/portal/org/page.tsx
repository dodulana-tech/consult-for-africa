import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import OrgDashboardClient from "./OrgDashboardClient";

export default async function OrgDashboardPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");
  if (session.role !== "HR_ADMIN") redirect("/maarova/portal/dashboard");

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organisation Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your team's assessment, coaching, and development progress</p>
      </div>
      <OrgDashboardClient />
    </div>
  );
}
