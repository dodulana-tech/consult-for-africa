"use client";

import { useState, useRef, useCallback } from "react";

interface ExtractedData {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  cadre: string | null;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
  qualifications: {
    type: string;
    name: string;
    institution: string | null;
    yearObtained: number | null;
  }[];
  workHistory: {
    facilityName: string;
    role: string;
    department: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
  }[];
  credentials: {
    type: string;
    regulatoryBody: string;
    licenseNumber: string | null;
  }[];
  certifications: {
    name: string;
    score: string | null;
    type: string;
  }[];
  summary: string | null;
}

type Step = "upload" | "processing" | "review" | "saving" | "success";

export default function CVUploadBuilder() {
  const [step, setStep] = useState<Step>("upload");
  const [data, setData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [savedCounts, setSavedCounts] = useState({ credentials: 0, qualifications: 0, workHistory: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);
    setStep("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cadre/cv-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const result = await res.json();
      setData(result.data);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CV");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleConfirm = async () => {
    if (!data) return;
    setStep("saving");
    setSaveProgress(0);

    try {
      let credCount = 0;
      let qualCount = 0;
      let workCount = 0;

      // Update profile info
      const profileUpdate: Record<string, unknown> = {};
      if (data.phone) profileUpdate.phone = data.phone;
      if (data.subSpecialty) profileUpdate.subSpecialty = data.subSpecialty;
      if (data.yearsOfExperience) profileUpdate.yearsOfExperience = String(data.yearsOfExperience);

      if (Object.keys(profileUpdate).length > 0) {
        await fetch("/api/cadre/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdate),
        });
      }
      setSaveProgress(20);

      // Save credentials
      for (const cred of data.credentials) {
        try {
          const res = await fetch("/api/cadre/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cred),
          });
          if (res.ok) credCount++;
        } catch {
          // Continue with other items
        }
      }
      setSaveProgress(40);

      // Save qualifications (primary degrees + postgrad + certifications)
      const allQuals = [
        ...data.qualifications,
        ...data.certifications.map((c) => ({
          type: c.type,
          name: c.name,
          institution: null,
          yearObtained: null,
          score: c.score,
        })),
      ];

      for (const qual of allQuals) {
        try {
          const res = await fetch("/api/cadre/qualifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(qual),
          });
          if (res.ok) qualCount++;
        } catch {
          // Continue
        }
      }
      setSaveProgress(70);

      // Save work history
      for (const work of data.workHistory) {
        try {
          const res = await fetch("/api/cadre/work-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(work),
          });
          if (res.ok) workCount++;
        } catch {
          // Continue
        }
      }
      setSaveProgress(100);

      setSavedCounts({ credentials: credCount, qualifications: qualCount, workHistory: workCount });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
      setStep("review");
    }
  };

  // UPLOAD state
  if (step === "upload") {
    return (
      <div
        className="rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200"
        style={{
          borderColor: dragOver ? "#D4AF37" : "#E8EBF0",
          background: dragOver ? "rgba(212,175,55,0.04)" : "white",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "#0B3C5D10" }}>
          <svg className="h-8 w-8" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 0l3-3m-3 3l3 3m6 3V7a2 2 0 00-2-2H7a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Upload your CV</h3>
        <p className="mt-1 text-sm text-gray-500">
          We will extract your professional details and pre-fill your profile
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Choose File
        </button>
        <p className="mt-3 text-xs text-gray-400">PDF or DOCX, up to 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  // PROCESSING state
  if (step === "processing") {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "#E8EBF0" }}>
        <div className="mx-auto mb-6 h-12 w-12">
          <svg className="h-12 w-12 animate-spin" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Analyzing your CV</h3>
        <p className="mt-2 text-sm text-gray-500">
          Extracting professional details from <span className="font-medium text-gray-700">{fileName}</span>
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <ProcessingSteps />
        </div>
      </div>
    );
  }

  // REVIEW state
  if (step === "review" && data) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white" style={{ borderColor: "#E8EBF0" }}>
          <div className="border-b p-4" style={{ borderColor: "#E8EBF0" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review extracted data</h3>
                <p className="text-sm text-gray-500">
                  Verify the information below, then confirm to add it to your profile
                </p>
              </div>
              <button
                onClick={() => { setStep("upload"); setData(null); }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Upload different CV
              </button>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "#E8EBF0" }}>
            {/* Summary */}
            {data.summary && (
              <div className="p-4">
                <p className="text-sm italic text-gray-600">{data.summary}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoField label="Name" value={data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()} />
                <InfoField label="Email" value={data.email} />
                <InfoField label="Phone" value={data.phone} />
                <InfoField label="Cadre" value={data.cadre?.replace(/_/g, " ")} />
                <InfoField label="Sub-specialty" value={data.subSpecialty} />
                <InfoField label="Years of Experience" value={data.yearsOfExperience?.toString()} />
              </div>
            </div>

            {/* Credentials */}
            {data.credentials.length > 0 && (
              <div className="p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Regulatory Credentials ({data.credentials.length})
                </h4>
                <div className="space-y-2">
                  {data.credentials.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg p-2"
                      style={{ background: "#F8F9FB" }}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#0B3C5D15" }}>
                        <svg className="h-4 w-4" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.type.replace(/_/g, " ")} - {c.regulatoryBody}
                        </p>
                        {c.licenseNumber && (
                          <p className="text-xs text-gray-500">License: {c.licenseNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {data.qualifications.length > 0 && (
              <div className="p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Qualifications ({data.qualifications.length})
                </h4>
                <div className="space-y-2">
                  {data.qualifications.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg p-2"
                      style={{ background: "#F8F9FB" }}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#D4AF3715" }}>
                        <svg className="h-4 w-4" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{q.name}</p>
                        <p className="text-xs text-gray-500">
                          {[q.institution, q.yearObtained].filter(Boolean).join(" - ") || q.type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {data.certifications.length > 0 && (
              <div className="p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Certifications & Exams ({data.certifications.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.certifications.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: "#0B3C5D10", color: "#0B3C5D" }}
                    >
                      {c.name}
                      {c.score && <span className="font-semibold" style={{ color: "#D4AF37" }}>({c.score})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work History */}
            {data.workHistory.length > 0 && (
              <div className="p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Work History ({data.workHistory.length})
                </h4>
                <div className="space-y-2">
                  {data.workHistory.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{ background: "#F8F9FB" }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{w.role}</p>
                          <p className="text-xs text-gray-500">{w.facilityName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {w.startDate?.slice(0, 7) || "?"} - {w.isCurrent ? "Present" : w.endDate?.slice(0, 7) || "?"}
                          </p>
                          {w.isCurrent && (
                            <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#dcfce7", color: "#166534" }}>
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t p-4" style={{ borderColor: "#E8EBF0" }}>
            <button
              onClick={() => { setStep("upload"); setData(null); }}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              style={{ borderColor: "#E8EBF0" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Add to Profile
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }

  // SAVING state
  if (step === "saving") {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "#E8EBF0" }}>
        <div className="mx-auto mb-4 h-12 w-12">
          <svg className="h-12 w-12 animate-spin" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Saving to your profile</h3>
        <div className="mx-auto mt-4 max-w-xs">
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "#E8EBF0" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${saveProgress}%`, background: "#D4AF37" }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">{saveProgress}% complete</p>
        </div>
      </div>
    );
  }

  // SUCCESS state
  if (step === "success") {
    const total = savedCounts.credentials + savedCounts.qualifications + savedCounts.workHistory;
    return (
      <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "#E8EBF0" }}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#dcfce7" }}>
          <svg className="h-8 w-8" style={{ color: "#166534" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Profile updated successfully</h3>
        <p className="mt-2 text-sm text-gray-500">
          {total} items added to your profile from your CV
        </p>
        <div className="mx-auto mt-4 flex max-w-sm justify-center gap-4">
          {savedCounts.credentials > 0 && (
            <CountBadge count={savedCounts.credentials} label="Credentials" />
          )}
          {savedCounts.qualifications > 0 && (
            <CountBadge count={savedCounts.qualifications} label="Qualifications" />
          )}
          {savedCounts.workHistory > 0 && (
            <CountBadge count={savedCounts.workHistory} label="Work History" />
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
        >
          View Updated Profile
        </button>
      </div>
    );
  }

  return null;
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "Not found"}</p>
    </div>
  );
}

function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <div className="rounded-lg px-3 py-2 text-center" style={{ background: "#F8F9FB" }}>
      <p className="text-lg font-bold" style={{ color: "#0B3C5D" }}>{count}</p>
      <p className="text-[10px] font-medium text-gray-500">{label}</p>
    </div>
  );
}

function ProcessingSteps() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Reading document...",
    "Extracting professional details...",
    "Identifying credentials...",
    "Mapping qualifications...",
  ];

  useState(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setCurrentStep(i);
      } else {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-2 text-left">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          {i < currentStep ? (
            <svg className="h-4 w-4 flex-shrink-0" style={{ color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : i === currentStep ? (
            <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded-full" style={{ background: "#D4AF37" }} />
          ) : (
            <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ background: "#E8EBF0" }} />
          )}
          <span className={`text-xs ${i <= currentStep ? "text-gray-700" : "text-gray-400"}`}>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}
