// Suggested units for an insumo bought in `base` (the recipe can type any other, e.g. "cucharada")
export const compatibleUnits = (base: string) =>
  base === "kg" || base === "g" ? ["g", "kg"] : base === "L" || base === "ml" ? ["ml", "L"] : base === "paq" ? ["paq", "und", "g", "kg", "ml", "L"] : [base || "und"]

export const RECIPE_UNIT_SUGGESTIONS = ["g", "kg", "ml", "L", "und", "paq", "cucharada", "cucharadita", "taza", "pizca", "tajada", "porción"]

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

export type Pack = { size: number; unit: string }
// An insumo row's package: [6] how much one package holds, [14] its unit (und, g or ml)
export const packOf = (row?: (string | number)[]): Pack | undefined =>
  row && Number(row[6]) > 0 ? { size: Number(row[6]), unit: String(row[14] || "und") } : undefined

// Units a product recipe can use for an insumo stocked in `base` (only ones that convert: g ↔ kg, ml ↔ L)
export const convertibleUnits = (base: string, pack?: Pack) =>
  compatibleUnits(base).filter((unit) => toBaseQuantity(1, unit, base, pack) !== null)

// Same as toBaseQuantity, NaN when it can't be converted
export const convertQty = (quantity: number, from: string, to: string, pack?: Pack) => toBaseQuantity(quantity, from, to, pack) ?? NaN
