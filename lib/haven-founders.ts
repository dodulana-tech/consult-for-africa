// Metadata mirror of the founders' direction survey.
//   public/haven-leadership-survey.html  ->  survey "haven-leadership-instinct"
// Unlike the staff and patient surveys this one is NOT anonymous: the
// respondent's name rides in the payload, by design, so the board can see
// where instincts diverge. Keep in sync if the form changes.

export const FOUNDER_ROSTER = [
  "Kabir Aregbesola",
  "Abisodun Alli",
  "Shakirah Saliu",
  "Dr Odedina",
  "Ogochukwu Odum",
] as const;

/** Four rungs of the strategic outlook. Each unlocks the next. */
export const RUNGS: { value: string; short: string; full: string }[] = [
  { value: "1", short: "Stabilise", full: "Safe and solvent: revenue capture, cash, stockouts, licensing" },
  { value: "2", short: "Professionalise", full: "Runs without heroics: senior operations leader, standards, welfare" },
  { value: "3", short: "Centre of excellence", full: "The reference paediatric and NICU centre: governance, accreditation" },
  { value: "4", short: "Scalable group", full: "A repeatable Haven built to open again" },
];

/** Five levers, used for both constant-sum splits (own_* and others_*). */
export const CATS: { key: string; label: string; hint: string }[] = [
  { key: "staff", label: "Staff welfare, pay, training", hint: "Health cover, pension, fair pay, resuscitation training" },
  { key: "ops", label: "Senior operations leader and systems", hint: "Someone running the place, standards, reporting" },
  { key: "revenue", label: "Revenue systems and working capital", hint: "Real revenue capture, receivables, stockouts" },
  { key: "quality", label: "Quality, governance, licensing", hint: "Clinical governance, the licence question, accreditation" },
  { key: "growth", label: "Growth: NICU, marketing, new sites", hint: "NICU activation, referrals, corporate, expansion" },
];

/** Eight forced-choice tensions, answered on a four-point A/B scale. */
export const TENSIONS: { key: string; a: string; b: string }[] = [
  { key: "t_money", a: "Reinvest surplus in Haven", b: "Distribute surplus to owners" },
  { key: "t_control", a: "Keep it founder-run", b: "Hand daily management to professionals" },
  { key: "t_build", a: "Build functions in-house", b: "Outsource them for focus and cash" },
  { key: "t_perfect", a: "Perfect one site first", b: "Grow now, improve on the move" },
  { key: "t_staff", a: "Invest in staff as the engine", b: "Hold staff spend down to protect margin" },
  { key: "t_premium", a: "Premium centre, pricing power", b: "Accessible, higher volume" },
  { key: "t_speed", a: "Push change fast", b: "Move at a pace that protects harmony" },
  { key: "t_scale", a: "One exceptional flagship", b: "A repeatable group" },
];

/** Where each founder thinks the GROUP leans. Compared against where it actually leans. */
export const BELIEFS: { key: string; tensionKey: string; a: string; b: string }[] = [
  { key: "b_money", tensionKey: "t_money", a: "Reinvest surplus", b: "Distribute to owners" },
  { key: "b_control", tensionKey: "t_control", a: "Keep it founder-run", b: "Professional management" },
  { key: "b_staff", tensionKey: "t_staff", a: "Invest in staff", b: "Protect margin" },
];

export const FOUNDER_OPEN_TEXT = [
  { key: "open_avoiding", label: "The trade-off this group has been quietly avoiding" },
  { key: "open_priority", label: "The one move Haven should make in the next twelve months" },
];

export const TENSION_VALUES = ["strong_a", "lean_a", "lean_b", "strong_b"] as const;
export type TensionValue = (typeof TENSION_VALUES)[number];

/** -2 strongly A .. +2 strongly B, for computing a group centre of gravity. */
export function tensionScore(v: unknown): number | null {
  switch (v) {
    case "strong_a": return -2;
    case "lean_a": return -1;
    case "lean_b": return 1;
    case "strong_b": return 2;
    default: return null;
  }
}

/** Which side the group actually lands on, for the perception comparison. */
export function groupSide(scores: number[]): "a" | "b" | "split" {
  if (scores.length === 0) return "split";
  const a = scores.filter((s) => s < 0).length;
  const b = scores.filter((s) => s > 0).length;
  if (a === b) return "split";
  return a > b ? "a" : "b";
}
