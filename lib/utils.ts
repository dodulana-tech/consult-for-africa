import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: "NGN" | "USD"): string {
  if (currency === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: "NGN" | "USD"): string {
  const symbol = currency === "NGN" ? "₦" : "$";
  if (amount >= 1_000_000_000) return `${symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount}`;
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function daysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date): boolean {
  return new Date() > date;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

// ─── Project Health ───────────────────────────────────────────────────────────

export function budgetUtilization(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((spent / total) * 100);
}

export function timelineProgress(start: Date, end: Date): number {
  const now = new Date();
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function healthColor(score: number): string {
  if (score >= 4) return "text-emerald-500";
  if (score >= 3) return "text-amber-500";
  return "text-red-500";
}

export function healthBg(score: number): string {
  if (score >= 4) return "bg-emerald-500";
  if (score >= 3) return "bg-amber-500";
  return "bg-red-500";
}
