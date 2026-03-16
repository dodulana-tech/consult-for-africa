import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PasswordChangeForm from "./PasswordChangeForm";

export default async function MaarovaProfilePage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const user = await prisma.maarovaUser.findUnique({
    where: { id: session.sub },
    include: {
      organisation: { select: { name: true } },
    },
  });

  if (!user) redirect("/maarova/portal/login");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Your account information</p>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Full Name
            </p>
            <p className="text-sm text-gray-900 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Email
            </p>
            <p className="text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Title
            </p>
            <p className="text-sm text-gray-900">
              {user.title ?? "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Department
            </p>
            <p className="text-sm text-gray-900">
              {user.department ?? "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Organisation
            </p>
            <p className="text-sm text-gray-900">{user.organisation.name}</p>
          </div>
        </div>
      </div>

      {/* Professional Background */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Professional Background
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Clinical Background
            </p>
            <p className="text-sm text-gray-900">
              {user.clinicalBackground ?? "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Years in Healthcare
            </p>
            <p className="text-sm text-gray-900">
              {user.yearsInHealthcare != null
                ? `${user.yearsInHealthcare} years`
                : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Years in Current Role
            </p>
            <p className="text-sm text-gray-900">
              {user.yearsInRole != null
                ? `${user.yearsInRole} years`
                : "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Change Password
        </h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
