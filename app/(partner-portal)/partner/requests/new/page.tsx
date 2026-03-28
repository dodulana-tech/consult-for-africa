"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SERVICE_AREAS = [
  "Hospital Operations",
  "Turnaround",
  "Digital Health",
  "Health Systems",
  "Clinical Governance",
  "Embedded Leadership",
];

const SENIORITY_LEVELS = [
  { value: "", label: "Any" },
  { value: "EMERGING", label: "Emerging" },
  { value: "STANDARD", label: "Standard" },
  { value: "EXPERIENCED", label: "Experienced" },
  { value: "ELITE", label: "Elite" },
];

export default function NewStaffingRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState(1);
  const [skillsInput, setSkillsInput] = useState("");
  const [serviceArea, setServiceArea] = useState(SERVICE_AREAS[0]);
  const [seniority, setSeniority] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number | "">("");
  const [budgetPerDay, setBudgetPerDay] = useState<number | "">("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        projectName,
        projectDescription,
        rolesNeeded,
        skillsRequired: skills,
        serviceTypes: [serviceArea],
        seniority: seniority || null,
        hoursPerWeek: hoursPerWeek || null,
        startDate: startDate || null,
        durationWeeks: durationWeeks || null,
        clientBudgetPerDay: budgetPerDay || null,
      };

      const res = await fetch("/api/partner-portal/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Failed to submit request.");
        return;
      }

      router.push("/partner/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: "1px solid #e5eaf0",
    color: "#111827",
    background: "#fff",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Partner Portal
            </span>
          </div>
          <Link
            href="/partner/dashboard"
            className="text-xs font-medium hover:underline"
            style={{ color: "#0F2744" }}
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            New Staffing Request
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tell us about the consultants you need and we will match you with the right talent.
          </p>
        </div>

        <div
          className="rounded-2xl bg-white p-8"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {error && (
            <div
              className="mb-6 rounded-lg px-4 py-3 text-sm"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name */}
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Project Name <span style={{ color: "#991B1B" }}>*</span>
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                placeholder="e.g. Hospital Turnaround Programme"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
              />
            </div>

            {/* Project Description */}
            <div>
              <label
                htmlFor="projectDescription"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Project Description <span style={{ color: "#991B1B" }}>*</span>
              </label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the project scope, objectives, and what the consultants will be doing"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors resize-y"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
              />
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Number of Consultants */}
              <div>
                <label
                  htmlFor="rolesNeeded"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Number of Consultants
                </label>
                <input
                  id="rolesNeeded"
                  type="number"
                  min={1}
                  value={rolesNeeded}
                  onChange={(e) => setRolesNeeded(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                />
              </div>

              {/* Service Area */}
              <div>
                <label
                  htmlFor="serviceArea"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Service Area
                </label>
                <select
                  id="serviceArea"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                >
                  {SERVICE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label
                htmlFor="skills"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Skills Required
              </label>
              <input
                id="skills"
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. revenue cycle, turnaround, digital health (comma-separated)"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
              />
              <p className="text-[11px] text-gray-400 mt-1">Separate multiple skills with commas</p>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Seniority */}
              <div>
                <label
                  htmlFor="seniority"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Seniority Level
                </label>
                <select
                  id="seniority"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                >
                  {SENIORITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours per Week */}
              <div>
                <label
                  htmlFor="hoursPerWeek"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Hours per Week
                </label>
                <input
                  id="hoursPerWeek"
                  type="number"
                  min={1}
                  max={60}
                  value={hoursPerWeek}
                  onChange={(e) =>
                    setHoursPerWeek(e.target.value ? parseInt(e.target.value) : "")
                  }
                  placeholder="e.g. 40"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                />
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Start Date */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  htmlFor="durationWeeks"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Duration (weeks)
                </label>
                <input
                  id="durationWeeks"
                  type="number"
                  min={1}
                  value={durationWeeks}
                  onChange={(e) =>
                    setDurationWeeks(e.target.value ? parseInt(e.target.value) : "")
                  }
                  placeholder="e.g. 12"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="budgetPerDay"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Budget per Day per Consultant (NGN)
              </label>
              <input
                id="budgetPerDay"
                type="number"
                min={0}
                step={1000}
                value={budgetPerDay}
                onChange={(e) =>
                  setBudgetPerDay(e.target.value ? parseFloat(e.target.value) : "")
                }
                placeholder="Leave blank for C4A to propose"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Optional. Leave blank for C4A to propose a rate.
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity"
                style={{
                  background: "#0F2744",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
              <Link
                href="/partner/dashboard"
                className="text-sm font-medium text-gray-500 hover:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
              Consult For Africa
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
