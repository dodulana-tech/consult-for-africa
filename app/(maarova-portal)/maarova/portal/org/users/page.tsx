import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import OrgUsersClient from "./OrgUsersClient";

export default async function OrgUsersPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");
  if (session.role !== "HR_ADMIN") redirect("/maarova/portal/dashboard");

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
        <p className="text-gray-500 text-sm mt-1">Manage users, assign roles, and set reporting lines</p>
      </div>
      <OrgUsersClient />
    </div>
  );
}
