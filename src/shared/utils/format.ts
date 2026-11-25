export const formatDuration = (minutes: number) => {
  return `${minutes} min`
}

// Quantities typed as "0,5" or "0.5" (a number input drops the comma in some browsers); NaN if not a number
export const toDecimal = (value: string | number | undefined) => {
  const text = String(value ?? "").trim().replace(",", ".")
  return /^\d*\.?\d+$|^\d+\.$/.test(text) ? Number(text) : NaN
}

export function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`
}

// Document numbers compared without dots, dashes, spaces or case ("1.012.345" === "1012345")
export function normalizeDocument(value: string | number | undefined) {
  return String(value ?? "").replace(/[^0-9a-z]/gi, "").toLowerCase()
}

// Compare names ignoring case, accents and extra spaces ("Cárnes " === "carnes")
export function normalizeName(value: string | number | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// "Cebolla, Tomate" -> ["Cebolla", "Tomate"] (insumos a supplier sells)
export const splitNames = (value: string | number | undefined) =>
  String(value ?? "").split(",").map((name) => name.trim()).filter(Boolean)

// One date format in the whole panel: "20 nov 2026" (and the time when it has one: "20 nov 2026 · 3:15 p. m.").
// Takes "2026-11-20", "2026-11-20 15:15" or an ISO date; anything else comes back as it was
export const formatDateLabel = (value: string | number) => {
  const text = String(value ?? "").trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(text)
  if (!m) return text
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0))
  if (Number.isNaN(date.getTime()) || date.getDate() !== Number(m[3])) return text
  const day = `${date.getDate()} ${MONTHS_SHORT[date.getMonth()].toLowerCase()} ${date.getFullYear()}`
  return m[4] !== undefined ? `${day} · ${date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}` : day
}
