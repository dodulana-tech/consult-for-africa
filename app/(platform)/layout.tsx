import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/platform/Sidebar";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
        <Sidebar />
        {/* Main content - offset by sidebar width on desktop */}
        <div className="flex flex-col flex-1 lg:ml-60 min-w-0 overflow-y-auto pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
