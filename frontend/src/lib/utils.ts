import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "0"
  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1) + "M"
  }
  if (val >= 1_000) {
    return (val / 1_000).toFixed(1) + "K"
  }
  return val.toLocaleString()
}

export function formatPercent(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "0.0%"
  return (val * 100).toFixed(2) + "%"
}

export function formatSeconds(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return "0s"
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hrs}h ${mins}m`
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }
  return `${seconds.toFixed(1)}s`
}
