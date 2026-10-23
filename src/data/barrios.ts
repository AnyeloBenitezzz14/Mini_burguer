export const normalizeNeighborhood = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es")

export function neighborhoodNameFromAddress(address: string) {
  return /(?:^|,)\s*Barrio\s+([^,]+)/i.exec(address)?.[1]?.trim() || ""
}
