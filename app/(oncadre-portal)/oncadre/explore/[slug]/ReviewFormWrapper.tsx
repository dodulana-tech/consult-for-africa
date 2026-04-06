"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HospitalReviewForm from "@/components/cadrehealth/HospitalReviewForm";

export default function HospitalReviewFormWrapper({
  facilitySlug,
  facilityName,
}: {
  facilitySlug: string;
  facilityName: string;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-7 w-7 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Thank you for your review!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your feedback helps colleagues across Nigeria make better career decisions.
        </p>
      </div>
    );
  }

  return (
    <HospitalReviewForm
      facilitySlug={facilitySlug}
      facilityName={facilityName}
      onSuccess={() => {
        setSubmitted(true);
        router.refresh();
      }}
    />
  );
}
