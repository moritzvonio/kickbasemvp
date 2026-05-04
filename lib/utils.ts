import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEUR(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} Mio €`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} Tsd €`;
    return `${value} €`;
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDelta(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatEUR(value, { compact: true })}`;
}
