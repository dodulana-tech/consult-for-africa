"use client";

import { useState } from "react";
import {
  CARE_NEED_LABELS,
  ILE_BRAND,
  ILE_CONSENT_TEXT,
  INTEREST_LABELS,
  RELATIONSHIP_LABELS,
  URGENCY_LABELS,
} from "@/lib/ile";

const NAVY = ILE_BRAND.navy;
const GOLD = ILE_BRAND.gold;
const TEAL = ILE_BRAND.teal;
const BORDER = "#E2DCCB";

type Relationship = keyof typeof RELATIONSHIP_LABELS;
type Interest = keyof typeof INTEREST_LABELS;
type CareNeed = keyof typeof CARE_NEED_LABELS;
type Urgency = keyof typeof URGENCY_LABELS;

interface Result {
  alreadyOnList: boolean;
  foundingFamily: boolean;
  shareUrl: string;
}

export default function WaitlistForm({ referredByCode }: { referredByCode: string | null }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [basedOutsideNigeria, setBasedOutsideNigeria] = useState<boolean | null>(null);
  const [basedCountry, setBasedCountry] = useState("");
  const [careCity, setCareCity] = useState("");
  const [interest, setInterest] = useState<Interest | "">("");
  const [careNeeds, setCareNeeds] = useState<CareNeed[]>([]);
  const [urgency, setUrgency] = useState<Urgency | "">("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleNeed = (need: CareNeed) => {
    setCareNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError("Please give us your name and email so we can reach you.");
      return;
    }
    if (!relationship) {
      setError("Please tell us who the care is for.");
      return;
    }
    if (basedOutsideNigeria === null) {
      setError("Please tell us where you are based.");
      return;
    }
    if (!interest) {
      setError("Please tell us what you are looking for.");
      return;
    }
    if (!urgency) {
      setError("Please tell us how soon this is needed.");
      return;
    }
    if (!consent) {
      setError("We need your agreement before we can hold your details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ile/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          relationship,
          basedOutsideNigeria,
          basedCountry: basedOutsideNigeria ? basedCountry.trim() || null : null,
          careCity: careCity.trim() || null,
          interest,
          careNeeds,
          urgency,
          notes: notes.trim() || null,
          referredByCode,
          consent: true,
          company,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult({
        alreadyOnList: Boolean(data.alreadyOnList),
        foundingFamily: Boolean(data.foundingFamily),
        shareUrl: String(data.shareUrl ?? ""),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const copyShare = async () => {
    if (!result?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  // ─── Success ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className="rounded-2xl p-8 sm:p-10"
        style={{ background: ILE_BRAND.cream, border: `1px solid #E8DFBF` }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "rgba(212,175,55,0.22)" }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mt-6 text-xl font-bold" style={{ color: NAVY }}>
          {result.alreadyOnList ? "You are already on the list" : "You are on the list"}
        </h3>

        <p className="mt-3 leading-relaxed">
          {result.alreadyOnList
            ? "We already have your details, so there is nothing more for you to do. If your situation has changed, reply to the email we sent you and tell us what is different."
            : "We have sent you a note confirming it. If the care you need is urgent, somebody from ilé will call you within two working days."}
        </p>

        {result.foundingFamily && !result.alreadyOnList && (
          <p className="mt-4 font-semibold leading-relaxed" style={{ color: NAVY }}>
            You joined early enough to be a founding family, so you keep first call when
            places open, a free first assessment and the founding rate.
          </p>
        )}

        {result.shareUrl && (
          <div className="mt-8 border-t pt-7" style={{ borderColor: "#E8DFBF" }}>
            <h4 className="text-sm font-bold" style={{ color: NAVY }}>
              If you know another family carrying this
            </h4>
            <p className="mt-2.5 text-sm leading-relaxed">
              Most people in this position find it lonely, and find it late. Sending this
              to one person who needs it is the kindest thing you can do with it.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={result.shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 rounded-xl border bg-white p-3 text-sm"
                style={{ borderColor: BORDER, color: TEAL }}
              />
              <button
                type="button"
                onClick={copyShare}
                className="rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                style={{ background: NAVY, color: "#FFFFFF" }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 sm:p-9"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {/* Honeypot. Hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="ile-company">Company</label>
        <input
          id="ile-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: BORDER }}
            required
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: BORDER }}
            required
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Phone or WhatsApp" hint="So we can call if it is urgent">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: BORDER }}
          />
        </Field>
        <Field label="Who is the care for?" required>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as Relationship)}
            className="w-full rounded-xl border bg-white p-3 text-sm"
            style={{ borderColor: BORDER }}
            required
          >
            <option value="">Please choose</option>
            {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Group label="Where are you based?" required className="mt-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice
            checked={basedOutsideNigeria === false}
            onSelect={() => setBasedOutsideNigeria(false)}
            label="In Nigeria"
          />
          <Choice
            checked={basedOutsideNigeria === true}
            onSelect={() => setBasedOutsideNigeria(true)}
            label="Outside Nigeria"
          />
        </div>
      </Group>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {basedOutsideNigeria === true && (
          <Field label="Which country?">
            <input
              type="text"
              placeholder="United Kingdom, United States, Canada"
              value={basedCountry}
              onChange={(e) => setBasedCountry(e.target.value)}
              className="w-full rounded-xl border p-3 text-sm"
              style={{ borderColor: BORDER }}
            />
          </Field>
        )}
        <div className={basedOutsideNigeria === true ? "" : "sm:col-span-2"}>
        <Field
          label="Where do they live?"
          hint="The town or area in Nigeria where the care is needed"
        >
          <input
            type="text"
            placeholder="Lekki, Ikeja, Surulere, Abuja"
            value={careCity}
            onChange={(e) => setCareCity(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: BORDER }}
          />
        </Field>
        </div>
      </div>

      <Group label="What are you looking for?" required className="mt-7">
        <div className="grid gap-3">
          {Object.entries(INTEREST_LABELS).map(([value, label]) => (
            <Choice
              key={value}
              checked={interest === value}
              onSelect={() => setInterest(value as Interest)}
              label={label}
            />
          ))}
        </div>
      </Group>

      <Group
        label="What kind of help is needed?"
        hint="Choose as many as apply, or leave it blank if you are not sure"
        className="mt-7"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(CARE_NEED_LABELS).map(([value, label]) => (
            <Choice
              key={value}
              multi
              checked={careNeeds.includes(value as CareNeed)}
              onSelect={() => toggleNeed(value as CareNeed)}
              label={label}
            />
          ))}
        </div>
      </Group>

      <Group label="How soon?" required className="mt-7">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(URGENCY_LABELS).map(([value, label]) => (
            <Choice
              key={value}
              checked={urgency === value}
              onSelect={() => setUrgency(value as Urgency)}
              label={label}
            />
          ))}
        </div>
      </Group>

      <div className="mt-7">
        <Field
          label="Anything you would like us to know"
          hint="Optional. Whatever you want to say about your family's situation"
        >
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: BORDER }}
          />
        </Field>
      </div>

      <label className="mt-7 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded"
          style={{ accentColor: GOLD }}
        />
        <span className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>
          {ILE_CONSENT_TEXT}
        </span>
      </label>

      {error && (
        <div
          className="mt-6 rounded-xl p-3.5 text-sm"
          style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 w-full rounded-xl py-4 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
        style={{ background: GOLD, color: NAVY }}
      >
        {submitting ? "Adding you to the list..." : "Join the waiting list"}
      </button>

      <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
        Nothing to pay, and nothing to commit to. We will never sell or share your details.
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
        {label} {required && <span style={{ color: GOLD }}>*</span>}
      </span>
      {hint && (
        <span className="mb-2 block text-xs" style={{ color: "#9CA3AF" }}>
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

function Group({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: "#4B5563" }}>
        {label} {required && <span style={{ color: GOLD }}>*</span>}
      </legend>
      {hint && (
        <p className="mb-3 text-xs" style={{ color: "#9CA3AF" }}>
          {hint}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Choice({
  checked,
  onSelect,
  label,
  multi,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className="flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition"
      style={{
        borderColor: checked ? GOLD : BORDER,
        background: checked ? "rgba(212,175,55,0.10)" : "#FFFFFF",
      }}
    >
      <span
        className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center border"
        style={{
          borderRadius: multi ? 4 : 999,
          borderColor: checked ? GOLD : "#CBD5E1",
          background: checked ? GOLD : "#FFFFFF",
        }}
      >
        {checked && (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke={NAVY} strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span style={{ color: checked ? NAVY : "#4B5563" }}>{label}</span>
    </button>
  );
}
