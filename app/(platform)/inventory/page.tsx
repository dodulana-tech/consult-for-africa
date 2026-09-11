import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { canUseOfficeDesk } from "@/lib/office";
import InventoryClient from "./InventoryClient";

export const metadata = { title: "Inventory | Consult For Africa" };

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!canUseOfficeDesk(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Inventory" subtitle="What the firm owns, and who has it" />
      <InventoryClient />
    </div>
  );
}
