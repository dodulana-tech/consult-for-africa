import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/platform/Sidebar";
import PlatformBottomTabs from "@/components/platform/PlatformBottomTabs";
import PullToRefresh from "@/components/shared/PullToRefresh";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
        <Sidebar />
        {/* Main content - offset by sidebar on desktop, padded for bottom tabs on mobile */}
        <div className="flex flex-col flex-1 lg:ml-60 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0 pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <PullToRefresh>
            {children}
          </PullToRefresh>
        </div>
        <PlatformBottomTabs />
      </div>
    </SessionProvider>
  );
}
