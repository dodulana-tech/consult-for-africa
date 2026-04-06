import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import Link from "next/link";
import FacilityReferralForm from "./FacilityReferralForm";

export default async function ReferFacilityPage() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/oncadre/referrals"
          className="text-sm text-[#0B3C5D] hover:underline"
        >
          &larr; Back to Referrals
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Refer a Facility
        </h1>
        <p className="mt-1 text-gray-500">
          Know a hospital or clinic that needs staffing support? Let us know and
          we will reach out to them.
        </p>
      </div>

      <FacilityReferralForm />
    </div>
  );
}
