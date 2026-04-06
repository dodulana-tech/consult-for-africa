import type { Metadata } from "next";
import RegisterForm from "@/components/cadrehealth/RegisterForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join CadreHealth | Free Professional Profile",
  description:
    "Create your free CadreHealth profile. Access salary intelligence, hospital reviews, CPD tracking, and career opportunities for Nigerian healthcare professionals.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-[#0B3C5D] via-[#0E4D6E] to-[#0B3C5D] p-12">
        <div>
          <Link href="/oncadre" className="text-2xl font-bold text-white">
            Cadre<span className="text-[#D4AF37]">Health</span>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white">
            Your career intelligence starts here.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Join the network of healthcare professionals who know their worth.
          </p>

          <div className="mt-10 space-y-6">
            {[
              { icon: "\u2713", text: "See what your cadre earns at every facility" },
              { icon: "\u2713", text: "Read honest hospital reviews from verified professionals" },
              { icon: "\u2713", text: "Track your CPD points and license renewals" },
              { icon: "\u2713", text: "Get matched to opportunities you qualify for" },
              { icon: "\u2713", text: "Build your verified portable credential" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#0B3C5D]">
                  {item.icon}
                </div>
                <span className="text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">
          By Consult For Africa
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/oncadre" className="text-2xl font-bold text-[#0B3C5D]">
              Cadre<span className="text-[#D4AF37]">Health</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Create your free profile
          </h1>
          <p className="mt-2 text-gray-500">
            Takes less than 2 minutes. No card required.
          </p>

          <div className="mt-8">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/oncadre/login" className="font-medium text-[#0B3C5D] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
