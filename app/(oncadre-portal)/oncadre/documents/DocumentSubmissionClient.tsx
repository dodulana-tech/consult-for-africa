"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle,
  Circle,
  FileText,
  Shield,
  GraduationCap,
  CreditCard,
  Camera,
  Upload,
  ExternalLink,
  Loader2,
  PartyPopper,
} from "lucide-react";
import FileUpload from "@/components/shared/FileUpload";

interface Credential {
  id: string;
  type: string;
  regulatoryBody: string;
  licenseNumber: string | null;
  documentUrl: string | null;
}

interface Qualification {
  id: string;
  type: string;
  name: string;
  institution: string | null;
  yearObtained: number | null;
  documentUrl: string | null;
}

interface ProfessionalData {
  id: string;
  firstName: string;
  lastName: string;
  cadre: string;
  subSpecialty: string | null;
  regulatoryBody: string;
  cvFileUrl: string | null;
  governmentIdUrl: string | null;
  passportPhotoUrl: string | null;
  documentsSubmittedAt: string | null;
  credentials: Credential[];
  qualifications: Qualification[];
}

const SPECIALIST_CADRES = ["MEDICINE", "DENTISTRY", "NURSING", "PHARMACY"];

function getRegulatoryAbbrev(body: string): string {
  const map: Record<string, string> = {
    "Medical and Dental Council of Nigeria": "MDCN",
    "Nursing and Midwifery Council of Nigeria": "NMCN",
    "Pharmacists Council of Nigeria": "PCN",
    "Medical Laboratory Science Council of Nigeria": "MLSCN",
    "Radiographers Registration Board of Nigeria": "RRBN",
    "Medical Rehabilitation Therapists Board": "MRTB",
    "Optometrists and Dispensing Opticians Registration Board of Nigeria": "ODORBN",
    "Community Health Practitioners Registration Board of Nigeria": "CHPRBN",
    "Environmental Health Officers Registration Council of Nigeria": "EHORECON",
    "Institute of Chartered Nutritionists and Dietitians of Nigeria": "ICNDN",
    "Council for the Regulation of Engineering in Nigeria": "COREN",
  };
  return map[body] || body;
}

export default function DocumentSubmissionClient({
  professional,
}: {
  professional: ProfessionalData;
}) {
  const [data, setData] = useState(professional);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(!!professional.documentsSubmittedAt);

  const regAbbrev = getRegulatoryAbbrev(data.regulatoryBody);
  const needsSpecialist =
    !!data.subSpecialty && SPECIALIST_CADRES.includes(data.cadre);

  // Find existing records
  const licenseRecord = data.credentials.find((c) => c.type === "PRACTICING_LICENSE");
  const registrationRecord = data.credentials.find((c) => c.type === "FULL_REGISTRATION");
  const specialistRecord = data.credentials.find((c) => c.type === "SPECIALIST_REGISTRATION");
  const degreeRecord = data.qualifications.find((q) => q.type === "PRIMARY_DEGREE");

  // Completion checks
  const items = [
    { id: "cv", label: "CV / Resume", required: true, complete: !!data.cvFileUrl },
    { id: "license", label: `Practicing License (${regAbbrev})`, required: true, complete: !!licenseRecord?.documentUrl },
    { id: "registration", label: `Full Registration Certificate (${regAbbrev})`, required: true, complete: !!registrationRecord?.documentUrl },
    { id: "degree", label: "Primary Degree Certificate", required: true, complete: !!degreeRecord?.documentUrl },
    ...(needsSpecialist
      ? [{ id: "specialist", label: "Specialist Registration", required: true, complete: !!specialistRecord?.documentUrl }]
      : []),
    { id: "govid", label: "Government-issued ID", required: true, complete: !!data.governmentIdUrl },
    { id: "photo", label: "Passport Photograph", required: true, complete: !!data.passportPhotoUrl },
    { id: "postgrad", label: "Postgraduate Qualifications", required: false, complete: data.qualifications.some((q) => (q.type === "POSTGRADUATE" || q.type === "FELLOWSHIP") && q.documentUrl) },
  ];

  const requiredItems = items.filter((i) => i.required);
  const completedRequired = requiredItems.filter((i) => i.complete).length;
  const totalRequired = requiredItems.length;
  const allRequiredComplete = completedRequired === totalRequired;
  const progressPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  // Notify admin when all required complete
  const notifyComplete = useCallback(async () => {
    if (notified || notifying) return;
    setNotifying(true);
    try {
      await fetch("/api/cadre/documents/notify-complete", { method: "POST" });
      setNotified(true);
    } catch {
      // Silently fail
    } finally {
      setNotifying(false);
    }
  }, [notified, notifying]);

  // Helper: update profile field
  async function updateProfile(field: string, url: string) {
    await fetch("/api/cadre/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: url }),
    });
  }

  // Helper: update or create credential
  async function upsertCredential(
    type: string,
    documentUrl: string,
    existingId?: string,
    extra?: Record<string, unknown>
  ) {
    if (existingId) {
      await fetch("/api/cadre/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existingId, documentUrl }),
      });
    } else {
      await fetch("/api/cadre/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, regulatoryBody: regAbbrev, documentUrl, ...extra }),
      });
    }
  }

  // Helper: update or create qualification
  async function upsertQualification(
    type: string,
    documentUrl: string,
    existingId?: string,
    extra?: Record<string, unknown>
  ) {
    if (existingId) {
      await fetch("/api/cadre/qualifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existingId, documentUrl }),
      });
    } else {
      await fetch("/api/cadre/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, documentUrl, ...extra }),
      });
    }
  }

  // Refresh data after upload
  function refreshField(field: string, url: string) {
    setData((prev) => ({ ...prev, [field]: url }));
  }

  function refreshCredential(type: string, url: string, id?: string) {
    setData((prev) => {
      const creds = [...prev.credentials];
      const idx = creds.findIndex((c) => c.type === type);
      if (idx >= 0) {
        creds[idx] = { ...creds[idx], documentUrl: url };
      } else {
        creds.push({ id: id || "new", type, regulatoryBody: regAbbrev, licenseNumber: null, documentUrl: url });
      }
      return { ...prev, credentials: creds };
    });
  }

  function refreshQualification(type: string, url: string) {
    setData((prev) => {
      const quals = [...prev.qualifications];
      const idx = quals.findIndex((q) => q.type === type);
      if (idx >= 0) {
        quals[idx] = { ...quals[idx], documentUrl: url };
      } else {
        quals.push({ id: "new", type, name: "", institution: null, yearObtained: null, documentUrl: url });
      }
      return { ...prev, qualifications: quals };
    });
  }

  // Check completion after state update
  function checkAndNotify() {
    // We defer the check since state updates are async
    setTimeout(async () => {
      const currentRequired = items.filter((i) => i.required);
      const currentComplete = currentRequired.filter((i) => i.complete).length;
      if (currentComplete === currentRequired.length) {
        await notifyComplete();
      }
    }, 500);
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B3C5D" }}>
          Document Submission
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Hi {data.firstName}, please upload the following documents to proceed with your application.
          Required items are marked with an asterisk (*).
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 rounded-xl border p-4" style={{ borderColor: "#E8EBF0", background: "#FAFBFC" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: "#0B3C5D" }}>
            {completedRequired} of {totalRequired} required documents
          </span>
          <span className="text-sm font-bold" style={{ color: allRequiredComplete ? "#059669" : "#D4AF37" }}>
            {progressPercent}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E8EBF0" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: allRequiredComplete ? "#059669" : "linear-gradient(90deg, #D4AF37, #e8c9a0)",
            }}
          />
        </div>
      </div>

      {/* Completion banner */}
      {(allRequiredComplete || notified) && (
        <div className="mb-6 rounded-xl border p-5 flex items-start gap-3" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <PartyPopper className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All required documents submitted</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {notified
                ? "The CadreHealth recruitment team has been notified and will review your submission."
                : "Notifying the recruitment team..."}
            </p>
          </div>
        </div>
      )}

      {/* Document sections */}
      <div className="space-y-4">
        {/* 1. CV */}
        <DocumentSection
          icon={<FileText className="h-5 w-5" />}
          title="CV / Resume"
          required
          complete={!!data.cvFileUrl}
          existingUrl={data.cvFileUrl}
        >
          <FileUpload
            folder="cvs"
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
            label="Upload your CV"
            onUpload={async ({ url }) => {
              await updateProfile("cvFileUrl", url);
              refreshField("cvFileUrl", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>

        {/* 2. Practicing License */}
        <DocumentSection
          icon={<Shield className="h-5 w-5" />}
          title={`Practicing License (${regAbbrev})`}
          required
          complete={!!licenseRecord?.documentUrl}
          existingUrl={licenseRecord?.documentUrl}
        >
          <CredentialUploadSection
            type="PRACTICING_LICENSE"
            regAbbrev={regAbbrev}
            existingRecord={licenseRecord}
            onUpload={async (url) => {
              await upsertCredential("PRACTICING_LICENSE", url, licenseRecord?.id);
              refreshCredential("PRACTICING_LICENSE", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>

        {/* 3. Full Registration */}
        <DocumentSection
          icon={<Shield className="h-5 w-5" />}
          title={`Full Registration Certificate (${regAbbrev})`}
          required
          complete={!!registrationRecord?.documentUrl}
          existingUrl={registrationRecord?.documentUrl}
        >
          <CredentialUploadSection
            type="FULL_REGISTRATION"
            regAbbrev={regAbbrev}
            existingRecord={registrationRecord}
            onUpload={async (url) => {
              await upsertCredential("FULL_REGISTRATION", url, registrationRecord?.id);
              refreshCredential("FULL_REGISTRATION", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>

        {/* 4. Primary Degree */}
        <DocumentSection
          icon={<GraduationCap className="h-5 w-5" />}
          title="Primary Degree Certificate"
          subtitle="e.g. MBBS, BNSc, B.Pharm, PharmD"
          required
          complete={!!degreeRecord?.documentUrl}
          existingUrl={degreeRecord?.documentUrl}
        >
          <QualificationUploadSection
            type="PRIMARY_DEGREE"
            existingRecord={degreeRecord}
            onUpload={async (url) => {
              await upsertQualification("PRIMARY_DEGREE", url, degreeRecord?.id, { name: "Primary Degree" });
              refreshQualification("PRIMARY_DEGREE", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>

        {/* 5. Postgraduate (Optional) */}
        <DocumentSection
          icon={<GraduationCap className="h-5 w-5" />}
          title="Postgraduate Qualifications"
          subtitle="Fellowship, MSc, MPH, MBA, etc."
          required={false}
          complete={data.qualifications.some((q) => (q.type === "POSTGRADUATE" || q.type === "FELLOWSHIP") && q.documentUrl)}
          existingUrl={data.qualifications.find((q) => (q.type === "POSTGRADUATE" || q.type === "FELLOWSHIP") && q.documentUrl)?.documentUrl}
        >
          <FileUpload
            folder="documents"
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={10}
            label="Upload certificate"
            onUpload={async ({ url }) => {
              const existing = data.qualifications.find((q) => q.type === "POSTGRADUATE" || q.type === "FELLOWSHIP");
              await upsertQualification("POSTGRADUATE", url, existing?.id, { name: "Postgraduate Qualification" });
              refreshQualification("POSTGRADUATE", url);
            }}
          />
        </DocumentSection>

        {/* 6. Specialist Registration (Conditional) */}
        {needsSpecialist && (
          <DocumentSection
            icon={<Shield className="h-5 w-5" />}
            title="Specialist Registration"
            required
            complete={!!specialistRecord?.documentUrl}
            existingUrl={specialistRecord?.documentUrl}
          >
            <CredentialUploadSection
              type="SPECIALIST_REGISTRATION"
              regAbbrev={regAbbrev}
              existingRecord={specialistRecord}
              onUpload={async (url) => {
                await upsertCredential("SPECIALIST_REGISTRATION", url, specialistRecord?.id);
                refreshCredential("SPECIALIST_REGISTRATION", url);
                checkAndNotify();
              }}
            />
          </DocumentSection>
        )}

        {/* 7. Government ID */}
        <DocumentSection
          icon={<CreditCard className="h-5 w-5" />}
          title="Government-issued ID"
          subtitle="NIN slip, international passport, or driver's license"
          required
          complete={!!data.governmentIdUrl}
          existingUrl={data.governmentIdUrl}
        >
          <FileUpload
            folder="documents"
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={5}
            label="Upload ID document"
            onUpload={async ({ url }) => {
              await updateProfile("governmentIdUrl", url);
              refreshField("governmentIdUrl", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>

        {/* 8. Passport Photo */}
        <DocumentSection
          icon={<Camera className="h-5 w-5" />}
          title="Passport Photograph"
          subtitle="Professional headshot, white or plain background"
          required
          complete={!!data.passportPhotoUrl}
          existingUrl={data.passportPhotoUrl}
        >
          <FileUpload
            folder="documents"
            accept=".jpg,.jpeg,.png"
            maxSizeMB={3}
            label="Upload passport photo"
            onUpload={async ({ url }) => {
              await updateProfile("passportPhotoUrl", url);
              refreshField("passportPhotoUrl", url);
              checkAndNotify();
            }}
          />
        </DocumentSection>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DocumentSection({
  icon,
  title,
  subtitle,
  required,
  complete,
  existingUrl,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  required: boolean;
  complete: boolean;
  existingUrl?: string | null;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(!complete);

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: complete ? "rgba(16,185,129,0.3)" : "#E8EBF0",
        background: complete ? "rgba(16,185,129,0.02)" : "#fff",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: complete ? "rgba(16,185,129,0.1)" : "#F3F4F6",
            color: complete ? "#059669" : "#9CA3AF",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {required && (
              <span className="text-xs font-medium text-red-400">*</span>
            )}
            {!required && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                Optional
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="shrink-0">
          {complete ? (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {complete && existingUrl && (
            <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "#F0FDF4" }}>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-700 font-medium">Document uploaded</span>
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {!complete && children}
          {complete && (
            <details className="mt-1">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Replace document
              </summary>
              <div className="mt-2">{children}</div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function CredentialUploadSection({
  type,
  regAbbrev,
  existingRecord,
  onUpload,
}: {
  type: string;
  regAbbrev: string;
  existingRecord?: Credential;
  onUpload: (url: string) => Promise<void>;
}) {
  const [licenseNumber, setLicenseNumber] = useState(existingRecord?.licenseNumber || "");

  return (
    <div className="space-y-3">
      {!existingRecord && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            License / Registration Number
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder={`e.g. ${regAbbrev}/12345`}
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
      )}
      {existingRecord?.licenseNumber && (
        <p className="text-xs text-gray-500">
          License: <span className="font-medium text-gray-700">{existingRecord.licenseNumber}</span>
        </p>
      )}
      <FileUpload
        folder="documents"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={5}
        label={`Upload ${type.replace(/_/g, " ").toLowerCase()} document`}
        onUpload={async ({ url }) => {
          await onUpload(url);
        }}
      />
    </div>
  );
}

function QualificationUploadSection({
  type,
  existingRecord,
  onUpload,
}: {
  type: string;
  existingRecord?: Qualification;
  onUpload: (url: string) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {existingRecord?.name && (
        <p className="text-xs text-gray-500">
          {existingRecord.name}
          {existingRecord.institution && ` - ${existingRecord.institution}`}
          {existingRecord.yearObtained && ` (${existingRecord.yearObtained})`}
        </p>
      )}
      <FileUpload
        folder="documents"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={5}
        label="Upload certificate"
        onUpload={async ({ url }) => {
          await onUpload(url);
        }}
      />
    </div>
  );
}
