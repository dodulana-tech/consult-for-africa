/**
 * Building a usable salutation out of imported register names.
 *
 * The NMA import split each row on the first space, so "Dr Patric Temi Adegun"
 * became firstName "Dr Patric" and lastName "Temi Adegun". Across the
 * re-engagement cohort that leaves 2,601 records with a middle name sitting in
 * the surname field, 104 lowercased, 32 blank and 11 holding nothing but an
 * initial: 28% of headings would have addressed the wrong name, or none.
 *
 * Rather than repair 10,000 rows on a guess, this derives a salutation at send
 * time and declines to guess when the data cannot support one. A senior
 * consultant would rather read "Your record is still held" than "Dr Temi
 * Adegun" when he is Dr Adegun.
 */

/** Cadres whose members are addressed as Dr. */
const DOCTOR_CADRES = new Set(["MEDICINE", "DENTISTRY"]);

/**
 * Case a name token without flattening deliberate capitals: "umar" becomes
 * "Umar" and "ADEGUN" becomes "Adegun", but "McPherson" and "Oyefia-Emakpo"
 * are already mixed case and are left exactly as their owner wrote them.
 */
function caseToken(token: string): string {
  const mixed = /[a-z]/.test(token) && /[A-Z]/.test(token);
  if (mixed) return token;
  return token.replace(
    /[A-Za-z]+/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

/**
 * The surname to address someone by, or null when the field holds nothing
 * usable. Takes the final token, since that is the surname in every ordering
 * the import produced, and rejects initials.
 */
export function surnameFor(lastName: string | null | undefined): string | null {
  const token = (lastName ?? "").trim().split(/\s+/).filter(Boolean).pop();
  if (!token) return null;
  // "C", "A.", "M.A" and similar are initials, not a name to greet someone by.
  if (token.replace(/[^A-Za-z]/g, "").length < 3) return null;
  return caseToken(token);
}

/**
 * Personalised heading where the data supports it, impersonal where it does
 * not. Never invents a title: the cohort includes nurses, pharmacists,
 * optometrists and hospital managers who are not "Dr".
 */
export function headingFor(
  person: { lastName?: string | null; cadre?: string | null },
  rest: string,
): string {
  const surname = surnameFor(person.lastName);
  const isDoctor = DOCTOR_CADRES.has(person.cadre ?? "");
  if (surname && isDoctor) return `Dr ${surname}, ${rest}`;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
