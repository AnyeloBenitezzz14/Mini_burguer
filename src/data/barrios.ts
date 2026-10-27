export const BELLO_NEIGHBORHOODS = [
  "Santa Ana",
  "Los Búcaros",
  "Serramonte",
  "Salento",
  "Molinares",
  "San Simón",
  "Villas de Occidente",
  "La Madera",
  "La Cabañita",
  "La Cabaña",
  "Centro",
  "Pérez",
  "Espíritu Santo",
  "La Florida",
  "Barrio Nuevo",
  "La Cumbre",
  "Bellavista",
  "Niquía",
] as const

export const normalizeNeighborhood = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es")

export function neighborhoodNameFromAddress(address: string) {
  return /(?:^|,)\s*Barrio\s+([^,]+)/i.exec(address)?.[1]?.trim() || ""
}
