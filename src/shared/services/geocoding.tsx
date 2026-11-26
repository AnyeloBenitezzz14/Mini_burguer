import { municipalityFromGeocodedAddress, neighborhoodFromGeocodedAddress } from "@/shared/utils/address"

export async function geocodeAddress(queries: string[], signal: AbortSignal, fallbackQuery?: string) {
  const searchQueries = [
    ...queries.filter(Boolean).map((query) => ({ query, approximate: false })),
    ...(fallbackQuery ? [{ query: fallbackQuery, approximate: true }] : []),
  ]
  for (const { query, approximate } of searchQueries) {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=co&bounded=1&viewbox=-75.75,6.55,-75.35,6.10&q=" +
      encodeURIComponent(`${query.replace(/#|No\.|N°/gi, " ").replace(/\s+/g, " ").trim()}, Bello, Antioquia, Colombia`)
    const res = await fetch(url, { signal, headers: { "Accept-Language": "es" } })
    if (!res.ok) throw new Error(`Mapa no disponible (${res.status})`)
    const [hit] = (await res.json()) as {
      lat: string
      lon: string
      address?: Record<string, string>
    }[]
    if (hit) {
      const reverseUrl =
        "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=" +
        encodeURIComponent(hit.lat) +
        "&lon=" +
        encodeURIComponent(hit.lon)
      const reverseResponse = await fetch(reverseUrl, {
        signal,
        headers: { "Accept-Language": "es" },
      })
      if (!reverseResponse.ok) throw new Error(`Mapa no disponible (${reverseResponse.status})`)
      const reverse = (await reverseResponse.json()) as {
        address?: Record<string, string>
      }
      const neighborhood = neighborhoodFromGeocodedAddress(reverse.address)
        || neighborhoodFromGeocodedAddress(hit.address)
      const municipality = municipalityFromGeocodedAddress(reverse.address)
        || municipalityFromGeocodedAddress(hit.address)
      return { lat: Number(hit.lat), lon: Number(hit.lon), neighborhood, municipality, approximate }
    }
  }
  return null
}
