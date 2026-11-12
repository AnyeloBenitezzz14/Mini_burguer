import { useEffect, useRef, useState } from "react"
import { aboutIcon } from "@/features/landing/utils/aboutIcons"
import { MENU_CATS, SODA_RE, allMenuProducts, sizeMl } from "@/features/menu/data/products"
import { visiblePaginationPages } from "@/features/menu/utils/pagination"
import { Ico } from "@/shared/components/icons"
import { ITEMS_PER_PAGE } from "@/shared/constants"
import { C } from "@/shared/styles/theme"
import type { Product } from "@/shared/types"
import { fmt } from "@/shared/utils/format"
import { STORE_HOURS_LABEL, isStoreOpen, nextOpeningLabel } from "@/shared/utils/storeHours"

// ── Product Catalog Grid (shared, landing + client) ────────────────────────────
export default function ProductCatalog({
  onAddClick,
  dark,
  paginate = true,
  compact = false,
}: {
  onAddClick: (p: Product) => void
  dark: boolean
  paginate?: boolean
  compact?: boolean
}) {
  const [activeCat, setActiveCat] = useState("todos")
  const [search, setSearch] = useState("")
  const [pg, setPg] = useState(0)
  // Rechecked every minute so the "Tienda cerrada" notice appears and goes away by itself
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const open = isStoreOpen(now)
  const topRef = useRef<HTMLDivElement>(null)
  // Changing page brings the menu back into view
  const goPage = (i: number) => {
    setPg(i)
    if (!compact) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  // Additions and sauces are chosen inside a product, not sold alone. A soda without stock isn't shown, and the
  // sodas show one card per flavour («Gaseosa Coca-Cola, desde $3.000»): tapping it opens its smallest size in
  // stock, and the window lets you pick the others
  const sodaCardOpens = new Map<Product, Product>()
  const catalogProducts = allMenuProducts()
    .filter((product) => !["adiciones", "salsas"].includes(product.cat) && !product.soldOut)
    .flatMap((product) => {
      const soda = SODA_RE.exec(product.name)
      if (!soda) return [product]
      const sizes = allMenuProducts()
        .filter((p) => !p.soldOut && SODA_RE.exec(p.name)?.[1] === soda[1])
        .sort((a, b) => sizeMl(SODA_RE.exec(a.name)![2]) - sizeMl(SODA_RE.exec(b.name)![2]))
      if (sizes[0] !== product) return []
      const card: Product = {
        ...product,
        name: `Gaseosa ${soda[1]}`,
        priceStr: sizes.length > 1 ? `Desde ${fmt(Math.min(...sizes.map((p) => p.price)))}` : product.priceStr,
        desc: `${sizes.map((p) => SODA_RE.exec(p.name)![2]).join(" · ")}`,
      }
      sodaCardOpens.set(card, product)
      return [card]
    })
  const openProduct = (p: Product) => onAddClick(sodaCardOpens.get(p) ?? p)
  const filtered = catalogProducts.filter(
    (p) =>
      (activeCat === "todos" || p.cat === activeCat) &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase())),
  )
  const shouldPaginate =
    paginate && activeCat === "todos" && filtered.length > ITEMS_PER_PAGE && !search
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageItems = shouldPaginate
    ? filtered.slice(pg * ITEMS_PER_PAGE, (pg + 1) * ITEMS_PER_PAGE)
    : filtered
  const visiblePages = visiblePaginationPages(pg, totalPages)
  const switchCat = (id: string) => {
    setActiveCat(id)
    setPg(0)
  }
  return (
    <div ref={topRef}>
      {/* Category tabs: a photo of one of its products over the name; the chosen one gets a mustard ring and underline */}
      <div
        className={`-mx-1 flex snap-x gap-1 overflow-x-auto border-b px-1 pt-1 sm:gap-2 ${compact ? "mb-3" : "mb-6"}`}
        style={{ scrollbarWidth: "none", borderColor: BORDER }}
        role="tablist"
        aria-label="Categorías del menú"
      >
        {MENU_CATS.filter((cat) => cat.id !== "salsas" && (cat.id === "todos" || catalogProducts.some((p) => p.cat === cat.id))).map((cat) => {
          const active = activeCat === cat.id
          const photo = (cat.id === "todos" ? catalogProducts : catalogProducts.filter((p) => p.cat === cat.id)).find((p) => p.img)?.img
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchCat(cat.id)}
              className={`group relative flex flex-shrink-0 snap-start cursor-pointer flex-col items-center gap-2 px-2.5 sm:px-3 ${compact ? "pb-2.5" : "pb-3.5"}`}
            >
              <span
                className={`relative flex items-center justify-center rounded-full p-[3px] transition-all duration-300 group-hover:-translate-y-1 ${compact ? "h-14 w-14 md:h-16 md:w-16" : "h-16 w-16 md:h-[72px] md:w-[72px]"}`}
                style={{
                  background: active ? `linear-gradient(135deg, ${C.amber}, ${C.mustard})` : dark ? "rgba(244,238,220,0.08)" : C.cream,
                  boxShadow: active ? `0 8px 18px -8px ${C.mustard}` : dark ? "none" : "0 6px 14px -10px rgba(25,21,18,0.55)",
                }}
              >
                <span
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
                  style={{ background: dark ? "#1E1C18" : "#fff", color: C.mustard, border: `2px solid ${dark ? "#1E1C18" : "#fff"}` }}
                >
                  {photo ? (
                    <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    aboutIcon(24, cat.icon)
                  )}
                </span>
              </span>
              <span
                className={`whitespace-nowrap font-bold tracking-wide transition-colors ${compact ? "text-xs" : "text-[13px]"}`}
                style={{ fontFamily: "League Spartan, sans-serif", color: active ? C.mustard : TEXT, opacity: active ? 1 : 0.78 }}
              >
                {cat.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-px left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-300"
                style={{ background: C.mustard, width: active ? "70%" : "0%" }}
              />
            </button>
          )
        })}
      </div>
      {/* Outside the store hours: a dark card like the landing's «Horario» (the menu stays visible) */}
      {!open && (
        <div
          role="status"
          className={`relative flex flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden rounded-2xl ${compact ? "mb-3 px-4 py-3" : "mb-6 px-5 py-4"}`}
          style={{ background: C.dark, color: "#FAF3E0", boxShadow: "0 14px 30px -18px rgba(25,21,18,0.8)" }}
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: `linear-gradient(${C.amber}, ${C.red})` }} />
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-xl ${compact ? "h-9 w-9" : "h-11 w-11"}`}
            style={{ background: `${C.amber}22`, color: C.amber }}
          >
            {Ico.clock}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`font-bold ${compact ? "text-sm" : "text-lg"}`} style={{ fontFamily: "League Spartan, sans-serif" }}>
                Tienda cerrada
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${C.red}33`, color: "#F2A493" }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full motion-reduce:hidden" style={{ background: "#F2A493", opacity: 0.7 }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#F2A493" }} />
                </span>
                Cerrado ahora
              </span>
            </span>
            <span className={`mt-0.5 block ${compact ? "text-xs" : "text-sm"}`} style={{ color: "rgba(250,243,224,0.78)" }}>
              El Parche atenderá <b style={{ color: C.amber }}>{nextOpeningLabel(now)}</b> · Puedes ir viendo el menú
            </span>
          </span>
          {(
            <span
              className="hidden flex-shrink-0 rounded-xl px-3 py-2 text-xs sm:block"
              style={{ background: "rgba(250,243,224,0.06)", border: "1px solid rgba(250,243,224,0.1)" }}
            >
              <span className="block" style={{ color: "rgba(250,243,224,0.6)" }}>Lun – Dom</span>
              <span className="block font-semibold" style={{ color: C.amber }}>{STORE_HOURS_LABEL}</span>
            </span>
          )}
        </div>
      )}
      {/* Search in catalog */}
      <div
        className={`search-control flex w-full items-center gap-2 rounded-full px-3 ${compact ? "mb-3 py-2" : "mb-5 py-2.5"} sm:max-w-md`}
        style={{
          background: dark ? "#1E1C18" : "#fff",
          border: `1.5px solid ${C.mustard}`,
        }}
      >
        <span>{Ico.search}</span>
        <input
          placeholder="Buscar en el menú..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPg(0)
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: dark ? TEXT : C.dark }}
        />
        {search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setSearch("")
              setPg(0)
            }}
            className="search-clear text-sm cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
      {/* Count */}
      <p className={`${compact ? "mb-2 text-xs" : "mb-4 text-sm"}`} style={{ color: MUTED }}>
        {filtered.length} productos
        {shouldPaginate && <> · Página {pg + 1} de {Math.max(1, totalPages)}</>}
      </p>
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${compact ? "mb-3 gap-2" : "mb-5 gap-3"}`}>
        {pageItems.length === 0 && (
          <div
            className="col-span-3 text-center py-10 text-sm"
            style={{ color: MUTED }}
          >
            Sin resultados.
          </div>
        )}
        {pageItems.map((p) => (
          <div
            key={`${p.cat}-${p.id}`}
            className="group relative cursor-pointer overflow-hidden rounded-2xl"
            style={{
              aspectRatio: compact ? "3/2" : "4/3",
              background: dark ? "#1E1C18" : "#fff",
            }}
              onClick={() => openProduct(p)}
          >
            {p.img && (
              <img
                src={p.img}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div
              className={`absolute bottom-0 left-0 right-0 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}
              style={{ background: C.mustard }}
            >
              <div className={`truncate font-bold leading-tight text-white ${compact ? "text-xs" : "text-sm"}`}>
                {p.name}
              </div>
            </div>
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${compact ? "p-2" : "p-3"}`}
              style={{ background: "rgba(10,8,5,0.85)" }}
            >
              {p.badge && (
                <span
                  className={`font-label rounded-full px-2 py-0.5 font-bold ${compact ? "mb-1 text-[10px]" : "mb-2 text-xs"}`}
                  style={{ background: C.mustard, color: "#fff" }}
                >
                  {p.badge}
                </span>
              )}
              <div className={`font-price text-white ${compact ? "mb-0.5 text-base" : "mb-1 text-lg"}`}>
                {p.priceStr}
              </div>
              {p.desc && (
                <p
                  className={`leading-tight ${compact ? "mb-1 line-clamp-2 text-[10px]" : "mb-3 text-sm leading-relaxed"}`}
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {p.desc}
                </p>
              )}
              <button
                type="button"
                disabled={p.soldOut}
                onClick={(event) => {
                  event.stopPropagation()
                  openProduct(p)
                }}
                className={`cursor-pointer rounded-full font-bold text-white hover:opacity-90 disabled:cursor-not-allowed ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}
                style={{ background: C.mustard, opacity: p.soldOut ? 0.55 : 1 }}
              >
                {p.soldOut ? "Agotado" : "+ Agregar"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Paginator */}
      {shouldPaginate && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pg === 0}
            onClick={() => goPage(pg - 1)}
            className="pagination-control px-3 py-1.5 rounded-lg text-sm cursor-pointer disabled:opacity-30"
            style={{
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(30,30,30,0.08)",
              color: MUTED,
            }}
          >
            ←
          </button>
          {visiblePages.map((i) => (
            <button
              key={i}
              onClick={() => goPage(i)}
              className="pagination-control w-8 h-8 rounded-lg text-sm font-bold cursor-pointer"
              aria-current={i === pg ? "page" : undefined}
              style={{
                background:
                  i === pg
                    ? C.mustard
                    : dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(30,30,30,0.08)",
                color: i === pg ? "#fff" : MUTED,
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={pg >= totalPages - 1}
            onClick={() => goPage(pg + 1)}
            className="pagination-control px-3 py-1.5 rounded-lg text-sm cursor-pointer disabled:opacity-30"
            style={{
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(30,30,30,0.08)",
              color: MUTED,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
