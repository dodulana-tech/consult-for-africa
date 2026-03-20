import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import OrgGoalsClient from "./OrgGoalsClient";

export default async function OrgGoalsPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");
  if (session.role !== "HR_ADMIN") redirect("/maarova/portal/dashboard");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organisation Goals</h1>
        <p className="text-gray-500 text-sm mt-1">Development goals across your team, grouped by dimension</p>
      </div>
      <OrgGoalsClient />
    </div>
  );
}
