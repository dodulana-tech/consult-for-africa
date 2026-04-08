import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ActivateForm from "./ActivateForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Your Account | CadreHealth",
};

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, firstName: true, passwordHash: true },
  });

  if (!professional || professional.passwordHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-sm text-gray-600">
            {professional?.passwordHash
              ? "This account is already activated."
              : "No account found with this email."}
          </p>
          <Link
            href="/oncadre/login"
            className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#0B3C5D" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#0B3C5D]">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </h1>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome, {professional.firstName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Set a password to activate your account and track your applications.
          </p>
          <ActivateForm email={email.toLowerCase().trim()} />
        </div>
      </div>
    </div>
  );
}
