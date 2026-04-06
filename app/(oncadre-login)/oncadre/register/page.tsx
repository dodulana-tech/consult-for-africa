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
      {/* Left panel - cinematic branding */}
      <div
        className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between overflow-hidden p-12"
        style={{ background: "#06090f" }}
      >
        {/* Spotlight gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 70% 30%, rgba(11,60,93,0.5) 0%, rgba(11,60,93,0.15) 40%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 80% 10%, rgba(212,175,55,0.15) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 20% 85%, rgba(11,60,93,0.25) 0%, transparent 60%)",
          }}
        />

        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.025,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative">
          <Link href="/oncadre" className="text-2xl font-bold text-white tracking-tight">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] mb-6"
            style={{ color: "#D4AF37" }}
          >
            Career Intelligence Platform
          </p>
          <h2
            className="font-bold text-white leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
          >
            Your career intelligence starts here.
          </h2>
          <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
            Join the network of healthcare professionals who know their worth.
          </p>

          <div className="mt-10 space-y-5">
            {[
              "See what your cadre earns at every facility",
              "Read honest hospital reviews from verified professionals",
              "Track your CPD points and license renewals",
              "Get matched to opportunities you qualify for",
              "Build your verified portable credential",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: "#D4AF37",
                    color: "#06090f",
                  }}
                >
                  {"\u2713"}
                </div>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          By Consult For Africa
        </p>
      </div>

      {/* Right panel - form */}
      <div
        className="flex flex-1 items-center justify-center p-6 sm:p-12"
        style={{ background: "#FAFBFC" }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
              Cadre<span style={{ color: "#D4AF37" }}>Health</span>
            </Link>
          </div>

          <h1
            className="font-bold text-gray-900"
            style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
          >
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
            <Link href="/oncadre/login" className="font-semibold text-[#0B3C5D] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
