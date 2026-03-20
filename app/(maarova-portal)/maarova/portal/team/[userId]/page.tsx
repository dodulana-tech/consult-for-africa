import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import ReportGoalsClient from "./ReportGoalsClient";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");
  if (!["MANAGER", "HR_ADMIN"].includes(session.role ?? "USER")) redirect("/maarova/portal/dashboard");

  const { userId } = await params;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <ReportGoalsClient userId={userId} />
    </div>
  );
}
