import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import FounderSidebar from "@/components/founder/FounderSidebar";
import FounderBottomTabs from "@/components/founder/FounderBottomTabs";

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  const allowed = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  if (!allowed) redirect("/dashboard");

  return (
    <SessionProvider session={session}>
      <div className="flex h-[100dvh] overflow-hidden">
        <FounderSidebar />
        <div className="flex-1 overflow-y-auto bg-gray-50 pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom,0px))] lg:pb-0">
          {children}
        </div>
        <FounderBottomTabs />
      </div>
    </SessionProvider>
  );
}
