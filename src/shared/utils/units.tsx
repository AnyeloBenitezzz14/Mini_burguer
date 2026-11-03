// Suggested units for an insumo bought in `base` (the recipe can type any other, e.g. "cucharada")
export const compatibleUnits = (base: string) =>
  base === "kg" || base === "g" ? ["g", "kg"] : base === "L" || base === "ml" ? ["ml", "L"] : base === "paq" ? ["paq", "und"] : [base || "und"]

export const RECIPE_UNIT_SUGGESTIONS = ["g", "kg", "ml", "L", "und", "paq", "cucharada", "cucharadita", "taza", "pizca", "tajada", "porción"]

export const UNIT_FACTOR: Record<string, { kind: string; factor: number }> = {
  g: { kind: "masa", factor: 1 },
  kg: { kind: "masa", factor: 1000 },
  ml: { kind: "volumen", factor: 1 },
  L: { kind: "volumen", factor: 1000 },
}

// Quantity in the insumo's own unit, to price it (50 g of an insumo bought by kg = 0.05).
// null when it can't be converted (e.g. "cucharada" of something bought by kg)
export const toBaseQuantity = (quantity: number, unit: string, base: string) => {
  if (unit.trim().toLowerCase() === base.trim().toLowerCase()) return quantity
  const from = UNIT_FACTOR[unit.trim()]
  const to = UNIT_FACTOR[base.trim()]
  return from && to && from.kind === to.kind ? (quantity * from.factor) / to.factor : null
}

// Units a product recipe can use for an insumo stocked in `base` (only ones that convert: g ↔ kg, ml ↔ L)
export const convertibleUnits = (base: string) => compatibleUnits(base).filter((unit) => toBaseQuantity(1, unit, base) !== null)

// Same as toBaseQuantity, NaN when it can't be converted
export const convertQty = (quantity: number, from: string, to: string) => toBaseQuantity(quantity, from, to) ?? NaN
