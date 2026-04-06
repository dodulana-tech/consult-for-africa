"use client";

import { useRef } from "react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  cadre: string;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
  currentRole: string | null;
  currentFacility: string | null;
  state: string | null;
  city: string | null;
  country: string;
  qualifications: {
    id: string;
    type: string;
    name: string;
    institution: string | null;
    yearObtained: number | null;
    score: string | null;
  }[];
  credentials: {
    id: string;
    type: string;
    regulatoryBody: string;
    licenseNumber: string | null;
    issuedDate: string | null;
    expiryDate: string | null;
  }[];
  workHistory: {
    id: string;
    facilityName: string;
    role: string;
    department: string | null;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
  }[];
  cpdSummary: {
    totalPoints: number;
    recentEntries: {
      id: string;
      title: string;
      points: number;
      dateCompleted: string;
    }[];
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    year: "numeric",
  });
}

function credentialTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PRACTICING_LICENSE: "Practicing License",
    FULL_REGISTRATION: "Full Registration",
    COGS: "Certificate of Good Standing",
    SPECIALIST_REGISTRATION: "Specialist Registration",
    ADDITIONAL_LICENSE: "Additional License",
  };
  return map[type] ?? type;
}

function qualTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PRIMARY_DEGREE: "Primary Degree",
    POSTGRADUATE: "Postgraduate",
    FELLOWSHIP: "Fellowship",
    CERTIFICATION: "Certification",
    INTERNATIONAL_EXAM: "International Exam",
  };
  return map[type] ?? type;
}

export default function CVPreview({ profile }: { profile: ProfileData }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

  // Auto-generate a professional summary
  const summary = generateSummary(profile);

  return (
    <div>
      {/* Action bar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-xs text-gray-500">
          Preview your CV below. Use your browser&apos;s print dialog to save as
          PDF.
        </p>
        <button
          onClick={handlePrint}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#0B3C5D" }}
        >
          Download as PDF
        </button>
      </div>

      {/* CV Content */}
      <div
        ref={printRef}
        className="mx-auto max-w-[800px] rounded-xl bg-white p-8 sm:p-10 print:rounded-none print:shadow-none print:p-0"
        style={{
          border: "1px solid #E8EBF0",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div className="border-b-2 border-[#0B3C5D] pb-6">
          <h1 className="text-3xl font-bold text-[#0B3C5D]">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-1 text-lg text-gray-700">
            {profile.cadre}
            {profile.subSpecialty ? ` - ${profile.subSpecialty}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              {profile.email}
            </span>
            {profile.phone && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {profile.phone}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {summary && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B3C5D]">
              Professional Summary
            </h2>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              {summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {profile.workHistory.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B3C5D]">
              Work Experience
            </h2>
            <div className="mt-3 space-y-4">
              {profile.workHistory.map((w) => (
                <div key={w.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {w.role}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {w.facilityName}
                        {w.department ? ` - ${w.department}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(w.startDate)} -{" "}
                      {w.isCurrent ? "Present" : w.endDate ? formatDate(w.endDate) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Qualifications */}
        {profile.qualifications.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B3C5D]">
              Qualifications
            </h2>
            <div className="mt-3 space-y-3">
              {profile.qualifications.map((q) => (
                <div key={q.id} className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {q.name}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {qualTypeLabel(q.type)}
                      {q.institution ? ` - ${q.institution}` : ""}
                      {q.score ? ` (${q.score})` : ""}
                    </p>
                  </div>
                  {q.yearObtained && (
                    <p className="text-xs text-gray-500">{q.yearObtained}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credentials / Licenses */}
        {profile.credentials.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B3C5D]">
              Professional Credentials
            </h2>
            <div className="mt-3 space-y-2">
              {profile.credentials.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">
                      {credentialTypeLabel(c.type)} - {c.regulatoryBody}
                    </p>
                    {c.licenseNumber && (
                      <p className="text-xs text-gray-500">
                        License: {c.licenseNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {c.issuedDate && <p>Issued: {formatDate(c.issuedDate)}</p>}
                    {c.expiryDate && <p>Expires: {formatDate(c.expiryDate)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CPD */}
        {profile.cpdSummary.totalPoints > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B3C5D]">
              Continuing Professional Development
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Total CPD points (current cycle):{" "}
              <span className="font-semibold">
                {profile.cpdSummary.totalPoints}
              </span>
            </p>
            {profile.cpdSummary.recentEntries.length > 0 && (
              <div className="mt-2 space-y-1">
                {profile.cpdSummary.recentEntries.slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-xs text-gray-600"
                  >
                    <span>{e.title}</span>
                    <span className="text-gray-500">
                      {e.points} pts - {formatDate(e.dateCompleted)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-center">
          <p className="text-[10px] text-gray-400">
            Generated via CadreHealth by Consult For Africa |
            consultforafrica.com/oncadre
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              [data-print-cv], [data-print-cv] * { visibility: visible; }
              nav, footer, .print\\:hidden { display: none !important; }
              @page { margin: 1.5cm; }
            }
          `,
        }}
      />
    </div>
  );
}

function generateSummary(profile: ProfileData): string {
  const parts: string[] = [];

  const name = `${profile.firstName} ${profile.lastName}`;
  const exp = profile.yearsOfExperience;

  if (exp) {
    parts.push(
      `${profile.cadre} professional with ${exp} year${exp > 1 ? "s" : ""} of experience`
    );
  } else {
    parts.push(`${profile.cadre} professional`);
  }

  if (profile.subSpecialty) {
    parts[0] += ` specialising in ${profile.subSpecialty}`;
  }

  if (profile.currentRole && profile.currentFacility) {
    parts.push(
      `Currently serving as ${profile.currentRole} at ${profile.currentFacility}`
    );
  }

  if (profile.qualifications.length > 0) {
    const degrees = profile.qualifications
      .filter((q) => q.type === "PRIMARY_DEGREE" || q.type === "POSTGRADUATE" || q.type === "FELLOWSHIP")
      .map((q) => q.name);
    if (degrees.length > 0) {
      parts.push(`Holds ${degrees.join(", ")}`);
    }
  }

  if (profile.state) {
    parts.push(`Based in ${profile.city ? `${profile.city}, ` : ""}${profile.state}, ${profile.country}`);
  }

  return parts.join(". ") + ".";
}
