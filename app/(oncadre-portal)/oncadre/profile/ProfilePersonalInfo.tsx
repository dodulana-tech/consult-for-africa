"use client";

import { useState } from "react";
import {
  CADRE_OPTIONS,
  NIGERIAN_STATES,
  getSubSpecialties,
  getCadreLabel,
} from "@/lib/cadreHealth/cadres";

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  cadre: string;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
  state: string | null;
  city: string | null;
  isDiaspora: boolean;
  diasporaCountry: string | null;
  country: string;
}

export default function ProfilePersonalInfo({
  professional,
}: {
  professional: Professional;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(professional);
  const [form, setForm] = useState({
    firstName: professional.firstName,
    lastName: professional.lastName,
    phone: professional.phone || "",
    cadre: professional.cadre,
    subSpecialty: professional.subSpecialty || "",
    yearsOfExperience: professional.yearsOfExperience?.toString() || "",
    state: professional.state || "",
    city: professional.city || "",
    isDiaspora: professional.isDiaspora,
    diasporaCountry: professional.diasporaCountry || "",
  });

  const subSpecialties = getSubSpecialties(form.cadre);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cadre/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save");
        return;
      }
      setData({
        ...data,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        cadre: form.cadre,
        subSpecialty: form.subSpecialty || null,
        yearsOfExperience: form.yearsOfExperience
          ? parseInt(form.yearsOfExperience)
          : null,
        state: form.state || null,
        city: form.city || null,
        isDiaspora: form.isDiaspora,
        diasporaCountry: form.diasporaCountry || null,
      });
      setEditing(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || "",
      cadre: data.cadre,
      subSpecialty: data.subSpecialty || "",
      yearsOfExperience: data.yearsOfExperience?.toString() || "",
      state: data.state || "",
      city: data.city || "",
      isDiaspora: data.isDiaspora,
      diasporaCountry: data.diasporaCountry || "",
    });
    setEditing(false);
    setError("");
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-[#0B3C5D] transition hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Name" value={`${data.firstName} ${data.lastName}`} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Phone" value={data.phone || "Not provided"} muted={!data.phone} />
          <InfoRow label="Cadre" value={getCadreLabel(data.cadre)} />
          <InfoRow
            label="Sub-specialty"
            value={data.subSpecialty || "Not specified"}
            muted={!data.subSpecialty}
          />
          <InfoRow
            label="Experience"
            value={
              data.yearsOfExperience
                ? `${data.yearsOfExperience} years`
                : "Not specified"
            }
            muted={!data.yearsOfExperience}
          />
          <InfoRow
            label="Location"
            value={
              data.isDiaspora
                ? `Diaspora${data.diasporaCountry ? ` (${data.diasporaCountry})` : ""}`
                : [data.city, data.state].filter(Boolean).join(", ") ||
                  "Not specified"
            }
            muted={!data.state && !data.isDiaspora}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#0B3C5D]/20 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Edit Personal Information
      </h2>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+234..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cadre
          </label>
          <select
            value={form.cadre}
            onChange={(e) =>
              setForm({ ...form, cadre: e.target.value, subSpecialty: "" })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          >
            {CADRE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sub-specialty
          </label>
          <select
            value={form.subSpecialty}
            onChange={(e) => setForm({ ...form, subSpecialty: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          >
            <option value="">Select sub-specialty</option>
            {subSpecialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Years of experience
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={form.yearsOfExperience}
            onChange={(e) =>
              setForm({ ...form, yearsOfExperience: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.isDiaspora}
              onChange={(e) =>
                setForm({ ...form, isDiaspora: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
            />
            I am based outside Nigeria (diaspora)
          </label>
        </div>

        {form.isDiaspora ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country of residence
            </label>
            <input
              type="text"
              value={form.diasporaCountry}
              onChange={(e) =>
                setForm({ ...form, diasporaCountry: e.target.value })
              }
              placeholder="e.g. United Kingdom"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Ikeja"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#0B3C5D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A3350] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd
        className={`mt-0.5 text-sm ${muted ? "text-gray-400 italic" : "text-gray-900"}`}
      >
        {value}
      </dd>
    </div>
  );
}
