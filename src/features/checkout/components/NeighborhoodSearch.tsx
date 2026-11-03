import { useEffect, useRef, useState } from "react"
import { normalizeNeighborhood } from "@/data/barrios"
import { C } from "@/shared/styles/theme"
import type { DeliveryNeighborhood } from "@/shared/types"
import { fmt } from "@/shared/utils/format"

export default function NeighborhoodSearch({
  value,
  query,
  neighborhoods,
  loading,
  loadError,
  onQueryChange,
  onSelect,
  error,
}: {
  value: string
  query: string
  neighborhoods: DeliveryNeighborhood[]
  loading: boolean
  loadError: string
  onQueryChange: (query: string) => void
  onSelect: (neighborhood: DeliveryNeighborhood | string | null) => void
  error?: string
}) {
  const MUTED = "rgba(30,30,30,0.55)"
  const LINE = "rgba(30,30,30,0.08)"
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = neighborhoods.filter((neighborhood) =>
    normalizeNeighborhood(neighborhood.nombre).includes(normalizeNeighborhood(query)),
  )
  const hasExactMatch = matches.some(
    (neighborhood) => normalizeNeighborhood(neighborhood.nombre) === normalizeNeighborhood(query),
  )
  const hasCustomOption = !!query.trim() && !hasExactMatch
  const optionCount = matches.length + Number(hasCustomOption)

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", closeOnOutsideClick)
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick)
  }, [])

  const choose = (neighborhood: DeliveryNeighborhood) => {
    onQueryChange(neighborhood.nombre)
    onSelect(neighborhood)
    setOpen(false)
    setActiveIndex(0)
  }
  const chooseCustom = () => {
    const customNeighborhood = query.trim()
    if (!customNeighborhood) return
    onQueryChange(customNeighborhood)
    onSelect(customNeighborhood)
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <label htmlFor="delivery-neighborhood" className="mb-1 block text-xs font-semibold" style={{ color: "rgba(30,30,30,0.5)" }}>
        Barrio de entrega *
      </label>
      <span className="relative block">
        <input
          id="delivery-neighborhood"
          type="text"
          role="combobox"
          aria-label="Barrio de entrega"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="bello-neighborhood-options"
          aria-activedescendant={open && optionCount ? `bello-neighborhood-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Busca tu barrio en Bello"
          value={query}
          onFocus={() => {
            setOpen(true)
            setActiveIndex(0)
          }}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && optionCount) {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((index) => (index + 1) % optionCount)
            } else if (event.key === "ArrowUp" && optionCount) {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((index) => (index - 1 + optionCount) % optionCount)
            } else if (event.key === "Enter" && open && optionCount) {
              event.preventDefault()
              if (activeIndex < matches.length) choose(matches[activeIndex] || matches[0])
              else chooseCustom()
            } else if (event.key === "Escape") {
              setOpen(false)
            }
          }}
          className="w-full rounded-xl px-3.5 py-3 pr-10 text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: `1.5px solid ${error ? C.red : value ? C.mustard : "rgba(30,30,30,0.12)"}`,
            color: "#1A1714",
          }}
        />
        {(query || value) && (
          <button
            type="button"
            aria-label="Limpiar barrio"
            onClick={() => {
              onQueryChange("")
              onSelect(null)
              setActiveIndex(0)
              setOpen(true)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base"
            style={{ color: MUTED }}
          >
            ×
          </button>
        )}
      </span>
      {open && (
        <ul
          id="bello-neighborhood-options"
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-lg"
          style={{ borderColor: LINE }}
        >
          {optionCount ? (
            <>
              {matches.map((neighborhood, index) => (
                <li
                  key={neighborhood.id_barrio ?? neighborhood.nombre}
                  id={`bello-neighborhood-${index}`}
                  role="option"
                  aria-selected={neighborhood.nombre === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(neighborhood)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    background: index === activeIndex ? `${C.mustard}18` : "#fff",
                    color: C.dark,
                  }}
                >
                  <span>
                    {neighborhood.nombre}
                    {neighborhood.costo_domicilio_cop != null && (
                      <span className="ml-2 text-xs" style={{ color: MUTED }}>
                        {neighborhood.tiempo_desplazamiento_minutos != null ? `${neighborhood.tiempo_desplazamiento_minutos} min · ` : ""}
                        {fmt(neighborhood.costo_domicilio_cop)}
                      </span>
                    )}
                  </span>
                  {neighborhood.nombre === value && <span aria-hidden="true" style={{ color: C.forest }}>✓</span>}
                </li>
              ))}
              {hasCustomOption && (
                <li
                  id={`bello-neighborhood-${matches.length}`}
                  role="option"
                  aria-selected={false}
                  onMouseEnter={() => setActiveIndex(matches.length)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={chooseCustom}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    background: activeIndex === matches.length ? `${C.mustard}18` : "#fff",
                    color: C.dark,
                  }}
                >
                  Usar barrio: {query.trim()}
                </li>
              )}
            </>
          ) : loading ? (
            <li className="px-3 py-2.5 text-sm" style={{ color: MUTED }} role="status">
              Cargando barrios...
            </li>
          ) : (
            <li className="px-3 py-2.5 text-sm" style={{ color: MUTED }}>
              No se encontraron barrios
            </li>
          )}
        </ul>
      )}
      {loadError && <span className="mt-1 block text-xs" style={{ color: C.red }} role="alert">{loadError}</span>}
      {error && <span className="mt-1 block text-xs" style={{ color: C.red }} role="alert">{error}</span>}
    </div>
  )
}
