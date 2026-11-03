import type { DashPeriod } from "@/shared/types"
import { MONTHS_SHORT, addDays } from "@/shared/utils/format"

// Range [start, end) of the chosen day / week (Mon-Sun) / month / year that contains `anchor`,
// its chart buckets, the previous range of the same kind (for the % change) and a title
export function getDashPeriod(kind: DashPeriod, anchor: Date) {
  const day = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  const short = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toLowerCase()}`
  if (kind === "hoy") {
    return {
      start: day,
      end: addDays(day, 1),
      prevStart: addDays(day, -1),
      buckets: [{ label: short(day), start: day, end: addDays(day, 1) }],
      title: day.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    }
  }
  if (kind === "semana") {
    const start = addDays(day, -((day.getDay() + 6) % 7)) // Monday
    return {
      start,
      end: addDays(start, 7),
      prevStart: addDays(start, -7),
      buckets: Array.from({ length: 7 }, (_, i) => {
        const d = addDays(start, i)
        return { label: `${d.toLocaleDateString("es-CO", { weekday: "short" })} ${d.getDate()}`, start: d, end: addDays(d, 1) }
      }),
      title: `Semana del ${short(start)} al ${short(addDays(start, 6))} de ${addDays(start, 6).getFullYear()}`,
    }
  }
  if (kind === "mes") {
    const start = new Date(day.getFullYear(), day.getMonth(), 1)
    const end = new Date(day.getFullYear(), day.getMonth() + 1, 1)
    const buckets = []
    for (let d = start, n = 1; d < end; d = addDays(d, 7), n++) {
      const e = addDays(d, 7) < end ? addDays(d, 7) : end
      buckets.push({ label: `Sem ${n} (${d.getDate()}-${addDays(e, -1).getDate()})`, start: d, end: e })
    }
    return {
      start,
      end,
      prevStart: new Date(day.getFullYear(), day.getMonth() - 1, 1),
      buckets,
      title: start.toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
    }
  }
  const start = new Date(day.getFullYear(), 0, 1)
  return {
    start,
    end: new Date(day.getFullYear() + 1, 0, 1),
    prevStart: new Date(day.getFullYear() - 1, 0, 1),
    buckets: MONTHS_SHORT.map((label, m) => ({
      label,
      start: new Date(day.getFullYear(), m, 1),
      end: new Date(day.getFullYear(), m + 1, 1),
    })),
    title: String(day.getFullYear()),
  }
}

// Moves the anchor one period back (-1) or forward (+1)
export const shiftDashAnchor = (kind: DashPeriod, anchor: Date, step: number) =>
  kind === "hoy"
    ? addDays(anchor, step)
    : kind === "semana"
      ? addDays(anchor, 7 * step)
      : kind === "mes"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + step, 1)
        : new Date(anchor.getFullYear() + step, 0, 1)

export const isFutureDashAnchor = (kind: DashPeriod, anchor: Date, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const candidateStart =
    kind === "hoy"
      ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
      : kind === "semana"
        ? getDashPeriod("semana", anchor).start
        : kind === "mes"
          ? new Date(anchor.getFullYear(), anchor.getMonth(), 1)
          : new Date(anchor.getFullYear(), 0, 1)
  const currentStart =
    kind === "hoy"
      ? today
      : kind === "semana"
        ? getDashPeriod("semana", today).start
        : kind === "mes"
          ? new Date(today.getFullYear(), today.getMonth(), 1)
          : new Date(today.getFullYear(), 0, 1)
  return candidateStart > currentStart
}
