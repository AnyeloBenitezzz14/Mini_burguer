import { C } from "@/shared/styles/theme"

// The delivery address as a card: street on top, complement and neighbourhood below
const DeliveryAddressSummary = ({ address }: { address: string }) => {
  const parts = address.split(/,\s*/).filter(Boolean)
  const street = parts[0] || address
  const neighborhood = parts.find((part) => /^Barrio\s+/i.test(part))
  const complement = parts.filter((part, index) => index > 0 && !/^Barrio\s+/i.test(part)).join(", ")

  return (
    <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: `${C.mustard}30`, background: "#fff" }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: "#FBF7EC" }}>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ color: C.mustard, background: `${C.mustard}18` }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <span className="text-xs font-bold" style={{ color: C.dark }}>Dirección de entrega</span>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-bold leading-relaxed" style={{ color: C.dark }}>{street}</p>
        {(complement || neighborhood) && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {complement && (
              <div className="min-w-0 rounded-lg px-2.5 py-2" style={{ background: "rgba(30,30,30,0.035)" }}>
                <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(30,30,30,0.5)" }}>Complemento</span>
                <span className="mt-0.5 block break-words text-xs font-medium leading-relaxed" style={{ color: C.dark }}>{complement}</span>
              </div>
            )}
            {neighborhood && (
              <div className="min-w-0 rounded-lg px-2.5 py-2" style={{ background: "rgba(30,30,30,0.035)" }}>
                <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(30,30,30,0.5)" }}>Barrio</span>
                <span className="mt-0.5 block break-words text-xs font-medium leading-relaxed" style={{ color: C.dark }}>{neighborhood.replace(/^Barrio\s+/i, "")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryAddressSummary
