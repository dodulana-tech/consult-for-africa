import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import EditConsultantProfile from "@/components/platform/EditConsultantProfile";
import ChangePasswordForm from "@/components/platform/ChangePasswordForm";
import { User, Lock, Bell, Building2 } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });

  if (!user) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(user.role);
  const isConsultant = user.role === "CONSULTANT";

  const consultantProfile = isConsultant
    ? await prisma.consultantProfile.findUnique({
        where: { userId: user.id },
        select: {
          title: true, bio: true, location: true, isDiaspora: true,
          expertiseAreas: true, yearsExperience: true, hoursPerWeek: true,
          availabilityStatus: true,
          hourlyRateUSD: true, monthlyRateNGN: true,
          bankName: true, accountNumber: true, accountName: true, swiftCode: true,
        },
      })
    : null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Settings" subtitle="Account and preferences" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Profile */}
          <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Account</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Full Name</label>
                <div className="rounded-lg px-3 py-2.5 text-sm text-gray-700" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                  {user.name}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email Address</label>
                <div className="rounded-lg px-3 py-2.5 text-sm text-gray-700" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Role</label>
                <div className="rounded-lg px-3 py-2.5 text-sm text-gray-500 capitalize" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                  {user.role.replace(/_/g, " ").toLowerCase()}
                </div>
              </div>
            </div>
            {!isConsultant && (
              <p className="mt-4 text-xs text-gray-400">
                To update your profile, contact your administrator.
              </p>
            )}
          </div>

          {/* Consultant profile edit */}
          {isConsultant && consultantProfile && (
            <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
              <div className="flex items-center gap-2 mb-5">
                <User size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Consultant Profile</h2>
              </div>
              <EditConsultantProfile
                initialProfile={{
                  title: consultantProfile.title ?? "",
                  bio: consultantProfile.bio ?? "",
                  location: consultantProfile.location ?? "",
                  isDiaspora: consultantProfile.isDiaspora,
                  expertiseAreas: consultantProfile.expertiseAreas,
                  yearsExperience: consultantProfile.yearsExperience,
                  hoursPerWeek: consultantProfile.hoursPerWeek,
                  availabilityStatus: consultantProfile.availabilityStatus,
                  hourlyRateUSD: consultantProfile.hourlyRateUSD ? Number(consultantProfile.hourlyRateUSD) : null,
                  monthlyRateNGN: consultantProfile.monthlyRateNGN ? Number(consultantProfile.monthlyRateNGN) : null,
                  bankName: consultantProfile.bankName,
                  accountNumber: consultantProfile.accountNumber,
                  accountName: consultantProfile.accountName,
                  swiftCode: consultantProfile.swiftCode,
                }}
              />
            </div>
          )}
          {isConsultant && !consultantProfile && (
            <div className="rounded-xl bg-white p-5 text-sm text-gray-400" style={{ border: "1px solid #e5eaf0" }}>
              No consultant profile found. Contact your administrator.
            </div>
          )}

          {/* Security */}
          <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Security</h2>
            </div>
            <ChangePasswordForm />
          </div>

          {/* Notifications */}
          <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Deliverable submitted", sub: "When a consultant submits a deliverable for review" },
                { label: "Deliverable approved/revised", sub: "When your deliverable is reviewed by an EM" },
                { label: "Timesheet approved", sub: "When your time entries are approved" },
                { label: "Payment processed", sub: "When a payment is marked as paid" },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "#F3F4F6" }}>
                  <div>
                    <p className="text-sm text-gray-700">{n.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                  </div>
                  <div
                    className="w-9 h-5 rounded-full relative"
                    style={{ background: "#10B981" }}
                  >
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Email notifications are active. Granular control coming in a future update.
            </p>
          </div>

          {/* Admin: Platform info */}
          {isAdmin && (
            <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Platform</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span>1.0.0 MVP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Environment</span>
                  <span>{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span>{process.env.RESEND_API_KEY ? "Resend configured" : "Console only"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
