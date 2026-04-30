import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ComposeClient from "./ComposeClient";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export default async function ComposePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Compose Email"
        subtitle="Send to a single contact or an audience"
        backHref="/communications"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <ComposeClient />
      </main>
    </div>
  );
}
