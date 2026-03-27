import ClientBottomTabs from "./ClientBottomTabs";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom,0px))] lg:pb-0">
      {children}
      <ClientBottomTabs />
    </div>
  );
}
