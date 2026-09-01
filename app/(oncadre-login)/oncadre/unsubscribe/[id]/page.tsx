/**
 * /oncadre/unsubscribe/[id]
 *
 * The destination of the unsubscribe link at the foot of every CadreHealth
 * outreach email. It did not exist, so that link returned 404 for the whole
 * of the 19,232-message campaign and nobody who wanted out could get out.
 *
 * Deliberately a page with a button rather than a link that acts on load:
 * corporate mail scanners and link-preview bots fetch every URL in an email,
 * so a GET that unsubscribed on sight would opt people out who never clicked.
 * One click on this page is still one click, as the copy promises.
 */

import { prisma } from "@/lib/prisma";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata = {
  // The root layout appends "| Consult For Africa" via its title template.
  title: "Unsubscribe | CadreHealth",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: { firstName: true, lastName: true, email: true },
  });

  // Masked so the page confirms which address is affected without printing a
  // full address for anyone who happens to open the link.
  const masked = professional?.email
    ? professional.email.replace(/^(.{2}).*(@.*)$/, "$1…$2")
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <UnsubscribeForm id={id} maskedEmail={masked} />
      </div>
    </div>
  );
}
