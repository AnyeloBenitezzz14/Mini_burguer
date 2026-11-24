// Suggested units for an insumo bought in `base` (the recipe can type any other, e.g. "cucharada")
// Insumos in g, ml or und are used in that same unit, in whole numbers; kg, L and paq are older records
export const compatibleUnits = (base: string) =>
  base === "kg" ? ["g", "kg"] : base === "L" ? ["ml", "L"] : base === "paq" ? ["paq", "und", "g", "kg", "ml", "L"] : [base || "und"]

export const UNIT_FACTOR: Record<string, { kind: string; factor: number }> = {
  g: { kind: "masa", factor: 1 },
  kg: { kind: "masa", factor: 1000 },
  ml: { kind: "volumen", factor: 1 },
  L: { kind: "volumen", factor: 1000 },
}

// Quantity in the insumo's own unit, to price it (50 g of an insumo bought by kg = 0.05).
// null when it can't be converted (e.g. "cucharada" of something bought by kg).
// pack: what one package holds, so a recipe can use what's inside an insumo stocked in "paq"
// (2 und of a 15-egg paq = 2/15 paq; 5 g of a 100 g sobre = 0.05 paq)
export const toBaseQuantity = (quantity: number, unit: string, base: string, pack?: Pack): number | null => {
  if (unit.trim().toLowerCase() === base.trim().toLowerCase()) return quantity
  if (pack) {
    if (base.trim() === "paq") {
      const inside = toBaseQuantity(quantity, unit, pack.unit)
      return inside === null ? null : inside / pack.size
    }
    if (unit.trim() === "paq") return toBaseQuantity(quantity * pack.size, pack.unit, base)
  }
  const from = UNIT_FACTOR[unit.trim()]
  const to = UNIT_FACTOR[base.trim()]
  return from && to && from.kind === to.kind ? (quantity * from.factor) / to.factor : null
}

export type Pack = { size: number; unit: string; kind: string }
// An insumo row's package: [6] how much one holds, [14] its unit (und, g or ml), [17] what it is (Paquete, Caja, Bulto)
export const packOf = (row?: (string | number)[]): Pack | undefined =>
  row && Number(row[6]) > 0 ? { size: Number(row[6]), unit: String(row[14] || "und"), kind: String(row[17] || "Paquete") } : undefined

const PACK_WORD: Record<string, [string, string]> = { Paquete: ["paq.", "paq."], Caja: ["caja", "cajas"], Bulto: ["bulto", "bultos"] }
// "65" und of a 20-pack → "3 paq. + 5 und"; "" without a package or with less than one
export const packBreakdown = (qty: number, unit: string, pack?: Pack) => {
  if (!pack || pack.unit !== unit || !(qty >= pack.size)) return ""
  const closed = Math.floor(qty / pack.size + 1e-9)
  const rest = Math.round((qty - closed * pack.size) * 1000) / 1000
  const [one, many] = PACK_WORD[pack.kind] ?? PACK_WORD.Paquete
  return `${closed.toLocaleString("es-CO")} ${closed === 1 ? one : many}${rest > 0 ? ` + ${rest.toLocaleString("es-CO")} ${unit}` : ""}`
}
// A quantity never goes bare: "65 und", or packed "3 paq. + 5 und (65 und)"
export const qtyLabel = (qty: number, unit: string, pack?: Pack) => {
  const base = `${(Math.round(qty * 1000) / 1000).toLocaleString("es-CO")} ${unit || "und"}`
  const packs = packBreakdown(qty, unit, pack)
  return packs ? `${packs} (${base})` : base
}

// Units a product recipe can use for an insumo stocked in `base` (only ones that convert: g ↔ kg, ml ↔ L)
// A package is used by what it holds (1 und of a 12-pack of bread, 1 tajada of a 20-pack of cheese): that unit first
export const convertibleUnits = (base: string, pack?: Pack) => {
  const units = compatibleUnits(base).filter((unit) => toBaseQuantity(1, unit, base, pack) !== null)
  return base === "paq" ? [...units.filter((u) => u !== "paq"), "paq"] : units
}

// Same as toBaseQuantity, NaN when it can't be converted
export const convertQty = (quantity: number, from: string, to: string, pack?: Pack) => toBaseQuantity(quantity, from, to, pack) ?? NaN
