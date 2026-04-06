"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CADRE_OPTIONS, NIGERIAN_STATES, getSubSpecialties } from "@/lib/cadreHealth/cadres";

const MANDATE_TYPES = ["PERMANENT", "LOCUM", "CONTRACT", "CONSULTING", "INTERNATIONAL"];
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function MandateCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cadre, setCadre] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [minYearsExperience, setMinYearsExperience] = useState("");
  const [requiredQuals, setRequiredQuals] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");
  const [preferredQuals, setPreferredQuals] = useState<string[]>([]);
  const [prefInput, setPrefInput] = useState("");
  const [valuesRequirements, setValuesRequirements] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [isRemoteOk, setIsRemoteOk] = useState(false);
  const [isRelocationRequired, setIsRelocationRequired] = useState(false);
  const [type, setType] = useState("PERMANENT");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("NGN");
  const [urgency, setUrgency] = useState("MEDIUM");

  const subSpecialties = cadre ? getSubSpecialties(cadre) : [];

  function addTag(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput("");
  }

  function removeTag(index: number, list: string[], setList: (v: string[]) => void) {
    setList(list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !cadre || !type) {
      setError("Title, cadre, and type are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cadre/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          cadre,
          subSpecialty: subSpecialty || null,
          minYearsExperience: minYearsExperience ? parseInt(minYearsExperience) : null,
          requiredQualifications: requiredQuals,
          preferredQualifications: preferredQuals,
          valuesRequirements: valuesRequirements || null,
          locationState: locationState || null,
          locationCity: locationCity || null,
          isRemoteOk,
          isRelocationRequired,
          type,
          salaryRangeMin: salaryMin ? parseFloat(salaryMin) : null,
          salaryRangeMax: salaryMax ? parseFloat(salaryMax) : null,
          salaryCurrency,
          urgency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create mandate");
      }

      const data = await res.json();
      router.push(`/admin/cadrehealth/mandates/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Basic Information</h2>
        <div className="space-y-4">
          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Medical Director - House of Refuge"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Detailed description of the role and expectations"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cadre" required>
              <select
                value={cadre}
                onChange={(e) => {
                  setCadre(e.target.value);
                  setSubSpecialty("");
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Select cadre</option>
                {CADRE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sub-specialty">
              <select
                value={subSpecialty}
                onChange={(e) => setSubSpecialty(e.target.value)}
                disabled={!cadre}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Any sub-specialty</option>
                {subSpecialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" required>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                {MANDATE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Min Years Experience">
              <input
                type="number"
                min={0}
                max={50}
                value={minYearsExperience}
                onChange={(e) => setMinYearsExperience(e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Qualifications</h2>
        <div className="space-y-4">
          <Field label="Required Qualifications">
            <TagInput
              tags={requiredQuals}
              input={reqInput}
              setInput={setReqInput}
              onAdd={() => addTag(reqInput, requiredQuals, setRequiredQuals, setReqInput)}
              onRemove={(i) => removeTag(i, requiredQuals, setRequiredQuals)}
              placeholder="Type and press Enter (e.g. FWACP, MBBS)"
            />
          </Field>

          <Field label="Preferred Qualifications">
            <TagInput
              tags={preferredQuals}
              input={prefInput}
              setInput={setPrefInput}
              onAdd={() => addTag(prefInput, preferredQuals, setPreferredQuals, setPrefInput)}
              onRemove={(i) => removeTag(i, preferredQuals, setPreferredQuals)}
              placeholder="Type and press Enter"
            />
          </Field>

          <Field label="Values / Cultural Requirements">
            <input
              type="text"
              value={valuesRequirements}
              onChange={(e) => setValuesRequirements(e.target.value)}
              placeholder="e.g. Shared faith values, community-oriented"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </Field>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Location</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State">
              <select
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Any state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="City">
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Lagos, Abuja"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRemoteOk}
                onChange={(e) => setIsRemoteOk(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
              />
              Remote OK
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRelocationRequired}
                onChange={(e) => setIsRelocationRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
              />
              Relocation Required
            </label>
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Compensation</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min Salary">
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </Field>
            <Field label="Max Salary">
              <input
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 1500000"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </Field>
            <Field label="Currency">
              <select
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
          </div>

          <Field label="Urgency">
            <div className="flex flex-wrap gap-2">
              {URGENCY_LEVELS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    urgency === u
                      ? "border-[#0B3C5D] bg-[#0B3C5D] text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#0B3C5D] px-6 py-2 text-sm font-medium text-white hover:bg-[#0A3350] disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Mandate"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TagInput({
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B3C5D]/10 px-2.5 py-0.5 text-xs font-medium text-[#0B3C5D]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-0.5 text-[#0B3C5D]/60 hover:text-[#0B3C5D]"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
