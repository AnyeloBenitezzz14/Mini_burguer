export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!hours) return `${minutes} min`
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`
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
