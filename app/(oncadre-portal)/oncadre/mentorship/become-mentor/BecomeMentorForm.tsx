"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MENTOR_AREAS = [
  "UK Migration",
  "US Residency Match",
  "Fellowship Preparation",
  "Career Transition",
  "Specialty Selection",
  "Locum Strategy",
  "Exam Preparation",
  "Research & Publications",
  "Leadership Development",
  "Private Practice Setup",
  "NGO & Development Work",
  "Diaspora Return Planning",
];

const PARTNER_ORGS = [
  { value: "NONE", label: "None" },
  { value: "MANSAG", label: "MANSAG" },
  { value: "ANPA", label: "ANPA" },
  { value: "DFC", label: "Doctors Foundation for Care" },
  { value: "NDF_SA", label: "NDF-SA" },
  { value: "OTHER", label: "Other" },
];

const AVAILABILITY_TYPES = [
  { value: "ASYNC", label: "Async (messages only)" },
  { value: "SCHEDULED", label: "Scheduled calls" },
  { value: "BOTH", label: "Both async and scheduled" },
];

interface CadreOption {
  value: string;
  label: string;
}

export default function BecomeMentorForm({
  cadreOptions,
}: {
  cadreOptions: CadreOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCadres, setSelectedCadres] = useState<string[]>([]);
  const [maxMentees, setMaxMentees] = useState("3");
  const [availabilityType, setAvailabilityType] = useState("ASYNC");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [partnerOrg, setPartnerOrg] = useState("NONE");
  const [countryOfPractice, setCountryOfPractice] = useState("");
  const [yearsAbroad, setYearsAbroad] = useState("");

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  };

  const toggleCadre = (cadre: string) => {
    setSelectedCadres((prev) =>
      prev.includes(cadre)
        ? prev.filter((c) => c !== cadre)
        : [...prev, cadre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAreas.length === 0) {
      setError("Please select at least one mentor area.");
      return;
    }
    if (selectedCadres.length === 0) {
      setError("Please select at least one cadre you can mentor.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cadre/mentorship/become-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim(),
          mentorAreas: selectedAreas,
          mentorCadres: selectedCadres,
          maxMentees: parseInt(maxMentees),
          availabilityType,
          availabilityNote: availabilityNote.trim(),
          partnerOrg,
          countryOfPractice: countryOfPractice.trim(),
          yearsAbroad: yearsAbroad ? parseInt(yearsAbroad) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create mentor profile");
      }

      router.push("/oncadre/mentorship?applied=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          About You as a Mentor
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Share your experience and what drives you to mentor others. This will
          be visible to potential mentees.
        </p>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="I have been practising in the UK for 8 years and love helping junior colleagues navigate the migration process..."
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
          style={{ borderColor: "#E8EBF0" }}
        />
        <p className="mt-1 text-right text-[10px] text-gray-400">
          {bio.length}/1000
        </p>
      </div>

      {/* Mentor Areas */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          What can you mentor on? <span className="text-red-500">*</span>
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Select all areas where you can provide guidance.
        </p>
        <div className="flex flex-wrap gap-2">
          {MENTOR_AREAS.map((area) => {
            const selected = selectedAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: selected ? "#0B3C5D" : "white",
                  color: selected ? "white" : "#374151",
                  borderColor: selected ? "#0B3C5D" : "#E8EBF0",
                }}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cadres to mentor */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Which cadres can you mentor? <span className="text-red-500">*</span>
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Select the professional cadres you are qualified to mentor.
        </p>
        <div className="flex flex-wrap gap-2">
          {cadreOptions.map((c) => {
            const selected = selectedCadres.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCadre(c.value)}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: selected ? "#0B3C5D" : "white",
                  color: selected ? "white" : "#374151",
                  borderColor: selected ? "#0B3C5D" : "#E8EBF0",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Mentees + Availability */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="maxMentees"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Maximum Mentees
          </label>
          <select
            id="maxMentees"
            value={maxMentees}
            onChange={(e) => setMaxMentees(e.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} mentee{n !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="availability"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Availability
          </label>
          <select
            id="availability"
            value={availabilityType}
            onChange={(e) => setAvailabilityType(e.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            {AVAILABILITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Availability Note */}
      <div>
        <label
          htmlFor="availabilityNote"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Availability Note{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="availabilityNote"
          type="text"
          value={availabilityNote}
          onChange={(e) => setAvailabilityNote(e.target.value)}
          placeholder="e.g., Available weekday evenings GMT, respond within 48 hours"
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
          style={{ borderColor: "#E8EBF0" }}
        />
      </div>

      {/* Partner Org + Country */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="partnerOrg"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Partner Organization
          </label>
          <select
            id="partnerOrg"
            value={partnerOrg}
            onChange={(e) => setPartnerOrg(e.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            {PARTNER_ORGS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="country"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Country of Practice
          </label>
          <input
            id="country"
            type="text"
            value={countryOfPractice}
            onChange={(e) => setCountryOfPractice(e.target.value)}
            placeholder="e.g., United Kingdom"
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          />
        </div>
      </div>

      {/* Years Abroad */}
      <div className="max-w-xs">
        <label
          htmlFor="yearsAbroad"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Years Abroad{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="yearsAbroad"
          type="number"
          min={0}
          max={50}
          value={yearsAbroad}
          onChange={(e) => setYearsAbroad(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
          style={{ borderColor: "#E8EBF0" }}
        />
      </div>

      {/* Submit */}
      <div
        className="flex items-center justify-between rounded-2xl border p-6"
        style={{ background: "#F8F9FB", borderColor: "#E8EBF0" }}
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Ready to give back?
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your application will be reviewed by our team before you become
            visible to mentees.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #0B3C5D, #0d4a73)",
          }}
        >
          {loading ? "Submitting..." : "Apply as Mentor"}
        </button>
      </div>
    </form>
  );
}
