import { redirect } from "next/navigation";

// Redirect to the public (unauthenticated) rater page.
// The portal layout requires auth, but raters are external users.
export default async function PortalRateRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/maarova/rate/${token}`);
}
