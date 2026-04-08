"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CADRE_OPTIONS, NIGERIAN_STATES, getSubSpecialties } from "@/lib/cadreHealth/cadres";

const MANDATE_TYPES = ["PERMANENT", "LOCUM", "CONTRACT", "CONSULTING", "INTERNATIONAL"];
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface MandateData {
  id: string;
  title: string;
  description: string | null;
  cadre: string;
  subSpecialty: string | null;
  minYearsExperience: number | null;
  requiredQualifications: string[];
  preferredQualifications: string[];
  valuesRequirements: string | null;
  locationState: string | null;
  locationCity: string | null;
  isRemoteOk: boolean;
  isRelocationRequired: boolean;
  type: string;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  salaryCurrency: string;
  urgency: string | null;
  facilityName: string | null;
  clientContact: string | null;
}

export function MandateEditForm({ mandate }: { mandate: MandateData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(mandate.title);
  const [description, setDescription] = useState(mandate.description ?? "");
  const [cadre, setCadre] = useState(mandate.cadre);
  const [subSpecialty, setSubSpecialty] = useState(mandate.subSpecialty ?? "");
  const [minYearsExperience, setMinYearsExperience] = useState(
    mandate.minYearsExperience?.toString() ?? ""
  );
  const [requiredQuals, setRequiredQuals] = useState<string[]>(mandate.requiredQualifications);
  const [reqInput, setReqInput] = useState("");
  const [preferredQuals, setPreferredQuals] = useState<string[]>(mandate.preferredQualifications);
  const [prefInput, setPrefInput] = useState("");
  const [valuesRequirements, setValuesRequirements] = useState(mandate.valuesRequirements ?? "");
  const [locationState, setLocationState] = useState(mandate.locationState ?? "");
  const [locationCity, setLocationCity] = useState(mandate.locationCity ?? "");
  const [isRemoteOk, setIsRemoteOk] = useState(mandate.isRemoteOk);
  const [isRelocationRequired, setIsRelocationRequired] = useState(mandate.isRelocationRequired);
  const [type, setType] = useState(mandate.type);
  const [salaryMin, setSalaryMin] = useState(mandate.salaryRangeMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(mandate.salaryRangeMax?.toString() ?? "");
  const [salaryCurrency, setSalaryCurrency] = useState(mandate.salaryCurrency);
  const [urgency, setUrgency] = useState(mandate.urgency ?? "MEDIUM");
  const [facilityName, setFacilityName] = useState(mandate.facilityName ?? "");
  const [clientContact, setClientContact] = useState(mandate.clientContact ?? "");

  const subSpecialties = cadre ? getSubSpecialties(cadre) : [];

  function addTag(value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  }

  function removeTag(index: number, list: string[], setList: (v: string[]) => void) {
    setList(list.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !cadre || !type) {
      setError("Title, cadre, and type are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/cadre/mandates?id=${mandate.id}`, {
        method: "PATCH",
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
          facilityName: facilityName || null,
          clientContact: clientContact || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save changes. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cadre/mandates?id=${mandate.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/cadrehealth/mandates");
      router.refresh();
    } catch {
      setError("Failed to delete mandate.");
      setDeleting(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Changes saved successfully.</div>
      )}

      {/* Basic info */}
      <Section title="Basic Information">
        <Field label="Title" required>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass + " resize-none"} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cadre" required>
            <select value={cadre} onChange={(e) => { setCadre(e.target.value); setSubSpecialty(""); }} className={inputClass}>
              <option value="">Select cadre</option>
              {CADRE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Sub-specialty">
            <select value={subSpecialty} onChange={(e) => setSubSpecialty(e.target.value)} disabled={!cadre} className={inputClass + " disabled:bg-gray-50 disabled:text-gray-400"}>
              <option value="">Any</option>
              {subSpecialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" required>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {MANDATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Min Years Experience">
            <input type="number" min={0} max={50} value={minYearsExperience} onChange={(e) => setMinYearsExperience(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Qualifications */}
      <Section title="Qualifications">
        <Field label="Required Qualifications">
          <TagInput tags={requiredQuals} input={reqInput} setInput={setReqInput} onAdd={() => addTag(reqInput, requiredQuals, setRequiredQuals, setReqInput)} onRemove={(i) => removeTag(i, requiredQuals, setRequiredQuals)} placeholder="Type and press Enter (e.g. FWACP, MBBS)" />
        </Field>
        <Field label="Preferred Qualifications">
          <TagInput tags={preferredQuals} input={prefInput} setInput={setPrefInput} onAdd={() => addTag(prefInput, preferredQuals, setPreferredQuals, setPrefInput)} onRemove={(i) => removeTag(i, preferredQuals, setPreferredQuals)} placeholder="Type and press Enter" />
        </Field>
        <Field label="Values / Cultural Requirements">
          <input type="text" value={valuesRequirements} onChange={(e) => setValuesRequirements(e.target.value)} className={inputClass} />
        </Field>
      </Section>

      {/* Location */}
      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State">
            <select value={locationState} onChange={(e) => setLocationState(e.target.value)} className={inputClass}>
              <option value="">Any state</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="City">
            <input type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isRemoteOk} onChange={(e) => setIsRemoteOk(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]" />
            Remote OK
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isRelocationRequired} onChange={(e) => setIsRelocationRequired(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]" />
            Relocation Required
          </label>
        </div>
      </Section>

      {/* Compensation */}
      <Section title="Compensation">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min Salary">
            <input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Max Salary">
            <input type="number" min={0} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Currency">
            <select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className={inputClass}>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
        <Field label="Urgency">
          <div className="flex flex-wrap gap-2">
            {URGENCY_LEVELS.map((u) => (
              <button key={u} type="button" onClick={() => setUrgency(u)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${urgency === u ? "bg-[#0B3C5D] text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {u}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Client */}
      <Section title="Client Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility Name">
            <input type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Client Contact">
            <input type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="Name, email, or phone" className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
              Delete Mandate
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Are you sure?</span>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100">
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rounded-xl bg-[#0B3C5D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] hover:shadow-md disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TagInput({ tags, input, setInput, onAdd, onRemove, placeholder }: {
  tags: string[]; input: string; setInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void; placeholder: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }} placeholder={placeholder} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20" />
        <button type="button" onClick={onAdd} className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50">Add</button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "#0B3C5D12", color: "#0B3C5D" }}>
              {tag}
              <button type="button" onClick={() => onRemove(i)} className="ml-0.5 opacity-60 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
