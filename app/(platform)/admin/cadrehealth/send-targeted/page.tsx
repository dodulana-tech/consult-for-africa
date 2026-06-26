import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SendTargetedClient } from "./SendTargetedClient";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"];

export default async function SendTargetedPage({
  searchParams,
}: {
  searchParams: Promise<{ emails?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  const params = await searchParams;
  // Allow pre-filling via ?emails=a@b.com,c@d.com so links from elsewhere can
  // hand a curated list directly into the form.
  const prefillEmails = (params.emails ?? "")
    .split(/[,\n\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"))
    .join("\n");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cadrehealth"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          CadreHealth Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Send to specific list
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a list of email addresses, edit the message, and send. Each recipient is matched against CadreProfessional records and personalised. Bounced or opted-out addresses are skipped automatically.
        </p>
      </div>

      <SendTargetedClient prefillEmails={prefillEmails} />
    </div>
  );
}
