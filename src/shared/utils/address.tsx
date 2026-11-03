import { neighborhoodNameFromAddress } from "@/data/barrios"
import type { AddressParts } from "@/shared/types"

// ── Delivery zone ──────────────────────────────────────────────────────────────
// The shop is in Santa Ana (Bello, Antioquia).
export const SHOP_LOCATION = { lat: 6.3295, lon: -75.5627 }

export const BUILDING_TYPES = ["Departamento", "Edificio residencial", "Urbanización", "Hotel", "Oficinas", "Otro"]

// Straight-line distance in km between two points (haversine)
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// One text for the order (the backend keeps a single delivery address)
export const composeDeliveryAddress = (d: { calle: string; barrio: string; tipoEdificio: string; nombreEdificio: string; unidad: string }) =>
  [
    d.calle.trim(),
    d.barrio.trim() && `Barrio ${d.barrio.trim()}`,
    d.tipoEdificio && [d.tipoEdificio, d.nombreEdificio.trim()].filter(Boolean).join(" "),
    d.unidad.trim(),
  ]
    .filter(Boolean)
    .join(", ")

export function addressPartsFromAddress(address: string) {
  const segments = address.split(",").map((part) => part.trim()).filter(Boolean)
  const barrio = neighborhoodNameFromAddress(address)
  const otherDetails = segments
    .slice(1)
    .filter((part) => !/^Barrio\s+/i.test(part))
    .join(", ")
  return {
    barrio,
    calle: segments[0] || "",
    tipoEdificio: "",
    nombreEdificio: "",
    unidad: otherDetails,
  }
}

// OpenStreetMap search (free). "#" breaks it ("Calle 50 #45-20" -> "Calle 50 45-20")
export const neighborhoodFromGeocodedAddress = (address?: Record<string, string>) =>
  address
    ? [
        address.neighbourhood,
        address.suburb,
        address.city_district,
        address.quarter,
      ].find(Boolean)
    : undefined

export const municipalityFromGeocodedAddress = (address?: Record<string, string>) =>
  address
    ? [address.city, address.town, address.village, address.municipality, address.county].find(Boolean)
    : undefined

// Colombian address: "Carrera 45A # 12 Sur - 08, Interior 2, Apartamento (Torre 3, Apto 402)".
// Housing details are optional; "named" types put the first one after the type ("Edificio Torres del Sol")
export const ADDRESS_VIAS = ["Calle", "Carrera", "Avenida", "Diagonal", "Transversal", "Circular"]

export const HOUSING: Record<string, { named: boolean; prefixes: string[]; labels: string[] }> = {
  Casa: { named: false, prefixes: ["Casa", "Conjunto"], labels: ["Número de casa", "Conjunto o urbanización"] },
  Apartamento: { named: false, prefixes: ["Torre", "Apto", "Conjunto"], labels: ["Torre o bloque", "Apartamento", "Conjunto"] },
  Edificio: { named: true, prefixes: ["", "Piso", "Oficina"], labels: ["Nombre del edificio", "Piso", "Oficina o local"] },
  Empresa: { named: true, prefixes: ["", "Piso/Oficina"], labels: ["Nombre de la empresa", "Piso u oficina"] },
}

export const composeAddress = (p: AddressParts) => {
  if (!p.via || !p.num || !p.cruce || !p.placa) return ""
  let text = `${p.via} ${p.num} # ${p.cruce} - ${p.placa}`
  if (p.interior) text += `, Interior ${p.interior}`
  const housing = HOUSING[p.tipo]
  if (housing) {
    const details = housing.prefixes
      .map((prefix, i) => ((i === 0 && housing.named) || !p[`d${i}`] ? "" : `${prefix} ${p[`d${i}`]}`))
      .filter(Boolean)
    text += `, ${p.tipo}${housing.named && p.d0 ? ` ${p.d0}` : ""}${details.length ? ` (${details.join(", ")})` : ""}`
  }
  return text
}

// Back to its parts; null when the text has another format (e.g. typed by hand)
export const parseAddress = (text: string): AddressParts | null => {
  const m = /^(\S+)\s+(.+?)\s*#\s*(.+?)\s*-\s*([^,]+?)(?:,\s*Interior\s+([^,]+?))?(?:,\s*(Casa|Apartamento|Edificio|Empresa)(?:\s+([^(]+?))?(?:\s*\((.*)\))?)?$/.exec(text.trim())
  if (!m || !ADDRESS_VIAS.includes(m[1])) return null
  const parts: AddressParts = { via: m[1], num: m[2], cruce: m[3], placa: m[4], interior: m[5] ?? "", tipo: m[6] ?? "" }
  const housing = HOUSING[parts.tipo]
  const details = (m[8] ?? "").split(/,\s*/)
  housing?.prefixes.forEach((prefix, i) => {
    if (i === 0 && housing.named) parts.d0 = m[7] ?? ""
    else parts[`d${i}`] = details.find((d) => d.startsWith(`${prefix} `))?.slice(prefix.length + 1) ?? ""
  })
  return parts
}
