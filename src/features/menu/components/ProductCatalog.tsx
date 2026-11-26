import { useEffect, useRef, useState } from "react"
import { aboutIcon } from "@/features/landing/utils/aboutIcons"
import { MENU_CATS, SODA_RE, allMenuProducts, beverageImage, isMegaGourmetWithToppings, sizeMl } from "@/features/menu/data/products"
import arepaGourmetImg from "@/imports/arepa rellena.jpg"
import megaTraditionalImg from "@/imports/megatradicional.jpg"
import personalGourmetImg from "@/imports/gourmet-personal.png"
import simpleSalchipapaImg from "@/imports/salchipapa-sencilla.png"
import specialSalchipapaImg from "@/imports/salchipapas especial.png"
import superGourmetImg from "@/imports/super gourmet.jpg"
import megaGourmetImg from "@/imports/especial gourmet.png"
import pataconMixtoImg from "@/imports/patacon-mixto.png"
import { visiblePaginationPages } from "@/features/menu/utils/pagination"
import { Ico } from "@/shared/components/icons"
import { ITEMS_PER_PAGE } from "@/shared/constants"
import { C } from "@/shared/styles/theme"
import type { Product } from "@/shared/types"
import { fmt, normalizeName } from "@/shared/utils/format"
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
  const categoriesRef = useRef<HTMLDivElement>(null)
  const [categoriesVisible, setCategoriesVisible] = useState(false)
  useEffect(() => {
    const row = categoriesRef.current
    if (!row || !("IntersectionObserver" in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      setCategoriesVisible(true)
      observer.disconnect()
    }, { threshold: 0.12 })
    observer.observe(row)
    return () => observer.disconnect()
  }, [])
  // Changing page brings the menu back into view
  const goPage = (i: number) => {
    setPg(i)
    if (!compact) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const gold = `var(--landing-gold, ${C.mustard})`
  const goldInk = "var(--landing-gold-ink, #fff)"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  // Additions and sauces are chosen inside a product, not sold alone. A soda without stock isn't shown, and the
  // sodas show one card per flavour («Gaseosa Coca-Cola, desde $3.000»): tapping it opens its smallest size in
  // stock, and the window lets you pick the others
  const sodaCardOpens = new Map<Product, Product>()
  const catalogProducts = allMenuProducts()
    .filter((product) =>
      !["adiciones", "salsas"].includes(product.cat) && !product.soldOut && !isMegaGourmetWithToppings(product),
    )
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
  const sortedProducts = [...filtered]
  const orderProducts = (category: Product["cat"], names: string[]) => {
    const slots: number[] = []
    const ranked: { product: Product; rank: number }[] = []
    sortedProducts.forEach((product, index) => {
      if (product.cat !== category) return
      const rank = names.indexOf(normalizeName(product.name))
      slots.push(index)
      ranked.push({ product, rank: rank === -1 ? names.length : rank })
    })
    ranked.sort((a, b) => a.rank - b.rank).forEach(({ product }, index) => {
      sortedProducts[slots[index]] = product
    })
  }
  orderProducts("arepa-rellena", ["arepa sencilla", "arepa gourmet", "arepa especial", "arepa desmechada"])
  orderProducts("perras", ["perra pequena", "super perra", "gran perra"])
  const showCategoryPreview = activeCat === "todos" && !search
  const representatives = new Map<Product["cat"], Product>()
  if (showCategoryPreview) {
    for (const product of sortedProducts) {
      const current = representatives.get(product.cat)
      if (!current || (!current.img && product.img)) representatives.set(product.cat, product)
    }
  }
  const featuredProducts = [...representatives.values()]
  const orderedProducts = showCategoryPreview
    ? [...featuredProducts, ...sortedProducts.filter((product) => representatives.get(product.cat) !== product)]
    : sortedProducts
  const pageSize = Math.max(ITEMS_PER_PAGE, featuredProducts.length)
  const shouldPaginate = paginate && showCategoryPreview && orderedProducts.length > pageSize
  const totalPages = Math.ceil(orderedProducts.length / pageSize)
  const pageItems = shouldPaginate
    ? orderedProducts.slice(pg * pageSize, (pg + 1) * pageSize)
    : orderedProducts
  const visiblePages = visiblePaginationPages(pg, totalPages)
  const switchCat = (id: string) => {
    setActiveCat(id)
    setPg(0)
  }
  return (
    <div ref={topRef}>
      {/* Category tabs: a photo of one of its products over the name; the chosen one gets a mustard ring and underline */}
      <div
        ref={categoriesRef}
        data-menu-categories-visible={categoriesVisible}
        className={`-mx-1 flex snap-x gap-1 overflow-x-auto border-b px-1 pt-1 sm:gap-2 ${compact ? "mb-3" : "mb-6"}`}
        style={{ scrollbarWidth: "none", borderColor: BORDER }}
        role="tablist"
        aria-label="Categorías del menú"
      >
        {MENU_CATS.filter((cat) => cat.id !== "salsas" && (cat.id === "todos" || catalogProducts.some((p) => p.cat === cat.id))).map((cat, _i, cats) => {
          const active = activeCat === cat.id
          // «Todos» shows its grid icon; each category takes a photo no earlier tab already used
          const used = new Set<string>()
          let photo: string | undefined
          for (const c of cats) {
            if (c.id === "todos") continue
            // Drinks are pictured by a Coca-Cola (the bundled personal bottle if its product has no photo)
            const categoryPhoto = c.id === "arepa-rellena" ? arepaGourmetImg : c.id === "salchipapas" ? megaTraditionalImg : undefined
            const pick = categoryPhoto ?? (
              c.id === "bebidas"
                ? catalogProducts.find((p) => p.cat === "bebidas" && /coca-cola/i.test(p.name) && p.img)?.img ?? beverageImage("Coca-Cola", "Personal")
                : catalogProducts.find((p) => p.cat === c.id && p.img && !used.has(p.img))?.img
            )
            if (pick) used.add(pick)
            if (c.id === cat.id) { photo = pick; break }
          }
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
                className={`menu-category-ring relative flex items-center justify-center rounded-full p-[3px] transition-all duration-300 group-hover:-translate-y-1 ${compact ? "h-14 w-14 md:h-16 md:w-16" : "h-16 w-16 md:h-[72px] md:w-[72px]"}`}
                style={{
                  background: active ? `var(--landing-gold, linear-gradient(135deg, ${C.amber}, ${C.mustard}))` : dark ? "rgba(244,238,220,0.08)" : C.cream,
                  boxShadow: active ? `0 8px 18px -8px ${gold}` : dark ? "none" : "0 6px 14px -10px rgba(25,21,18,0.55)",
                }}
              >
                <span
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
                  style={{ background: dark ? "#1E1C18" : "#fff", color: gold, border: `2px solid ${dark ? "#1E1C18" : "#fff"}` }}
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
                style={{ fontFamily: "League Spartan, sans-serif", color: active ? gold : TEXT, opacity: active ? 1 : 0.78 }}
              >
                {cat.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-px left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-300"
                style={{ background: gold, width: active ? "70%" : "0%" }}
              />
            </button>
          )
        })}
      </div>
      {!open && (
        <div
          role="status"
          className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border ${compact ? "mb-3 px-4 py-3" : "mb-6 px-5 py-4"}`}
          style={{ background: "linear-gradient(110deg, #FFFCF4, #F6EACB)", borderColor: "#E9D8AD", color: "#3D2D16" }}
        >
          <span
            className={`flex flex-shrink-0 items-center justify-center rounded-full ${compact ? "size-9" : "size-11"}`}
            style={{ background: "#F3E4BD", color: "#805F0B" }}
          >
            {Ico.clock}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`font-bold ${compact ? "text-sm" : "text-lg"}`} style={{ fontFamily: "League Spartan, sans-serif" }}>
                Tienda cerrada
              </span>
            </span>
            <span className={`mt-0.5 block ${compact ? "text-xs" : "text-sm"}`} style={{ color: "#65513A" }}>
              El Parche atenderá <b style={{ color: "#805F0B" }}>{nextOpeningLabel(now)}</b> · Puedes ir viendo el menú
            </span>
          </span>
          {(
            <span
              className="hidden flex-shrink-0 rounded-full border px-4 py-2 text-xs sm:block"
              style={{ background: "#FFFCF4", borderColor: "#E9D8AD" }}
            >
              <span className="block" style={{ color: "#65513A" }}>Lun – Dom</span>
              <span className="block font-semibold" style={{ color: "#805F0B" }}>{STORE_HOURS_LABEL}</span>
            </span>
          )}
        </div>
      )}
      {/* Search in catalog */}
      <div
        className={`search-control flex w-full items-center gap-2 rounded-full px-3 ${compact ? "mb-3 py-2" : "mb-5 py-2.5"} sm:max-w-md`}
        style={{
          background: dark ? "#1E1C18" : "#fff",
          border: `1.5px solid ${gold}`,
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
            {p.img && ([personalGourmetImg, simpleSalchipapaImg, specialSalchipapaImg, pataconMixtoImg].includes(p.img) ||
              normalizeName(p.name) === "gran perra" ? (
              <div className={`absolute inset-0 overflow-hidden ${p.img === specialSalchipapaImg ? "bg-[#E2BE99]" : "bg-[#2A2420]"}`}>
                {p.img !== specialSalchipapaImg && (
                  <img
                    src={p.img}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
                  />
                )}
                <img
                  src={p.img}
                  alt={p.name}
                  className={`relative block h-full w-full object-contain ${p.img === specialSalchipapaImg ? "" : "drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"} ${compact ? "pb-7" : "pb-10"}`}
                />
              </div>
            ) : (
              <img
                src={p.img}
                alt={p.name}
                className={`absolute inset-0 h-full w-full object-cover ${[superGourmetImg, megaGourmetImg].includes(p.img)
                  ? "object-[center_88%]"
                  : "transition-transform duration-500 group-hover:scale-105"}`}
              />
            ))}
            <div
              className={`absolute bottom-0 left-0 right-0 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}
              style={{ background: C.mustard, color: "#fff" }}
            >
              <div className={`truncate font-bold leading-tight ${compact ? "text-xs" : "text-sm"}`}>
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
                  style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
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
                className={`cursor-pointer rounded-full font-bold hover:opacity-90 disabled:cursor-not-allowed ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}
                style={{ background: C.mustard, color: "#fff", opacity: p.soldOut ? 0.55 : 1 }}
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
            className="pagination-control px-3 py-1.5 rounded-full text-sm cursor-pointer disabled:opacity-30"
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
              className="pagination-control w-8 h-8 rounded-full text-sm font-bold cursor-pointer"
              aria-current={i === pg ? "page" : undefined}
              style={{
                background:
                  i === pg
                    ? gold
                    : dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(30,30,30,0.08)",
                color: i === pg ? goldInk : MUTED,
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={pg >= totalPages - 1}
            onClick={() => goPage(pg + 1)}
            className="pagination-control px-3 py-1.5 rounded-full text-sm cursor-pointer disabled:opacity-30"
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
