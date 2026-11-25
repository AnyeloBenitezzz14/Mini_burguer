import { useEffect, useMemo, useRef, useState } from "react"
import BeverageArt from "@/features/menu/components/BeverageArt"
import { ADDITIONS, BEVERAGES, BEVERAGE_SIZES, MENU_EXTRAS, SAUCES, SODA_INFO, SODA_RE, allMenuProducts, beverageLabel, sizeMl, sodaInfo, sodaPrice } from "@/features/menu/data/products"
import hitTropicalPhoto from "@/imports/bebidas/hit-frutas-tropicales.jpg"
import hitMangoPhoto from "@/imports/bebidas/hit-mango.jpg"
import hitMoraPhoto from "@/imports/bebidas/hit-mora.jpg"
import hitOrangePineapplePhoto from "@/imports/bebidas/hit-naranja-pina.jpg"
import QtyStepper from "@/shared/components/QtyStepper"
import ZoomableImage from "@/shared/components/ZoomableImage"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { Product } from "@/shared/types"
import { fmt } from "@/shared/utils/format"

const HIT_PHOTOS = {
  Mora: hitMoraPhoto,
  Mango: hitMangoPhoto,
  "Frutas Tropicales": hitTropicalPhoto,
  "Naranja Piña": hitOrangePineapplePhoto,
}
const HIT_FLAVORS = Object.keys(HIT_PHOTOS) as (keyof typeof HIT_PHOTOS)[]

export default function AddToCartModal({
  product: selectedProduct,
  onClose,
  onAdd,
  onCheckout,
  dark,
  initial,
}: {
  product: Product
  onClose: () => void
  onAdd: (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
    // e.g. the chosen flavour of a Hit («Sabor: Mango»): it reaches the kitchen with the order
    note?: string,
  ) => void
  onCheckout?: () => void
  dark: boolean
  // Editing a cart line: starts with its choices and the button says «Guardar cambios»
  initial?: { qty: number; sauces?: string[]; additions?: { name: string; qty: number }[]; note?: string }
}) {
  const [product, setProduct] = useState(selectedProduct)
  useEffect(() => {
    const refreshProduct = () => {
      const current = allMenuProducts().find((item) => item.id === selectedProduct.id) ??
        allMenuProducts().find((item) => item.name === selectedProduct.name)
      if (current) setProduct(current)
      else onClose()
    }
    window.addEventListener("products-refreshed", refreshProduct)
    return () => window.removeEventListener("products-refreshed", refreshProduct)
  }, [selectedProduct.id, selectedProduct.name, onClose])
  useEffect(() => setProduct(selectedProduct), [selectedProduct])
  const [qty, setQty] = useState(initial?.qty ?? 1)
  // What is typed in the quantity box (null = not typing, it shows qty)
  const [qtyDraft, setQtyDraft] = useState<string | null>(null)
  const MAX_QTY = 999
  const [selSauces, setSelSauces] = useState<string[]>(initial?.sauces ?? [])
  // Additions are keyed by name; sodas by «Gaseosa <sabor> <size id>» (saved as «Gaseosa <sabor> (<label>)»)
  const [addQtys, setAddQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (initial?.additions ?? []).map((a) => {
        const soda = BEVERAGES.flatMap((f) => BEVERAGE_SIZES.map((s) => [`Gaseosa ${f} (${s.label})`, `Gaseosa ${f} ${s.id}`]))
          .find(([saved]) => saved === a.name)
        return [soda ? soda[1] : a.name, a.qty]
      }),
    ),
  )
  const [beverageSize, setBeverageSize] = useState(BEVERAGE_SIZES[0]?.id ?? "")
  // Drink whose picture is shown big (click again to close)
  const [zoomBeverage, setZoomBeverage] = useState<string | null>(null)
  const isMenuExtra = ["salsas", "adiciones", "bebidas"].includes(product.cat)
  // [, sabor, tamaño] when the product is a soda («Gaseosa Coca-Cola (1.5 L)»)
  const sodaParts = SODA_RE.exec(product.name)
  // A litre of Hit comes in several flavours: the client picks one (it goes in the line's note)
  const isHit = /^hit\b/i.test(product.name.trim())
  const [hitFlavor, setHitFlavor] = useState(() => {
    const savedFlavor = /Sabor: (.+)/.exec(initial?.note ?? "")?.[1]?.trim()
    return HIT_FLAVORS.find((flavor) => flavor === savedFlavor) ?? HIT_FLAVORS[0]
  })
  const productPhoto = isHit ? HIT_PHOTOS[hitFlavor] : product.img
  // Cream card under the photo (the photo's curve blends into it)
  const CARD = dark ? "#1E1C18" : "#FBF6E9"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const toggleSauce = (s: string) =>
    setSelSauces((p) => {
      if (p.includes(s)) return p.filter((x) => x !== s)
      return p.length < 4 ? [...p, s] : p
    })
  const changeAdd = (name: string, d: number) =>
    setAddQtys((p) => ({ ...p, [name]: Math.min(99, Math.max(0, (p[name] || 0) + d)) }))
  const setAdd = (name: string, n: number) => setAddQtys((p) => ({ ...p, [name]: n }))
  // Each unit of the line carries these additions: never more in total than what was bought
  const addMax = (a: (typeof ADDITIONS)[number]) => (a.stock != null ? Math.floor(a.stock / Math.max(1, qty)) : 99)
  const addTotal = ADDITIONS.reduce(
    (s, a) => s + (addQtys[a.name] || 0) * a.price,
    0,
  )
  const beverageTotal = BEVERAGES.reduce(
    (total, flavor) =>
      total +
      BEVERAGE_SIZES.reduce(
        (sizeTotal, size) =>
          sizeTotal +
          (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0) * sodaPrice(flavor, size),
        0,
      ),
    0,
  )
  // Sizes with at least one flavour in stock (a size where everything sold out isn't offered)
  const sizesInStock = BEVERAGE_SIZES.filter(
    (size) => !SODA_INFO.size || BEVERAGES.some((f) => { const info = sodaInfo(f, size.label); return !!info && !info.agotada }),
  )
  const selectedBeverageSize =
    sizesInStock.find((size) => size.id === beverageSize) ?? sizesInStock[0] ?? { id: "", label: "", price: 0 }
  const selectedBeverageCount = BEVERAGES.reduce(
    (total, flavor) =>
      total +
      BEVERAGE_SIZES.reduce(
        (sizeTotal, size) =>
          sizeTotal + (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0),
        0,
      ),
    0,
  )
  const unitPrice = product.price + addTotal + beverageTotal
  const total = unitPrice * qty
  // «Agregar» turns into «✓ Agregado» while the photo flies to the cart, then the window closes
  const [added, setAdded] = useState(false)
  const photoRef = useRef<HTMLDivElement>(null)
  const addWithFeedback = () => {
    if (product.soldOut || added) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cartButton = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]")).find(
      (el) => el.getBoundingClientRect().width > 0,
    )
    if (reduced || !cartButton) return handleAdd()
    setAdded(true)
    flyToCart(photoRef.current?.querySelector<HTMLImageElement>("img:not([aria-hidden])"), cartButton)
    window.setTimeout(handleAdd, 550)
  }
  const handleAdd = () => {
    if (product.soldOut) return
    const adds = ADDITIONS.filter((a) => (addQtys[a.name] || 0) > 0).map(
      // never more than its stock across every unit of the line
      (a) => ({ name: a.name, qty: Math.min(addQtys[a.name], addMax(a)), price: a.price }),
    ).filter((a) => a.qty > 0)
    const beverages = BEVERAGES.flatMap((flavor) =>
      BEVERAGE_SIZES.filter(
        (size) => (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0) > 0,
      ).map((size) => ({
        name: `Gaseosa ${flavor} (${size.label})`,
        qty: Math.min(
          addQtys[`Gaseosa ${flavor} ${size.id}`],
          Math.floor((sodaInfo(flavor, size.label)?.stock ?? Infinity) / Math.max(1, qty)),
        ),
        price: sodaPrice(flavor, size),
      })).filter((b) => b.qty > 0),
    )
    onAdd(product, qty, selSauces, [...adds, ...beverages], isHit ? `Sabor: ${hitFlavor}` : undefined)
    close()
  }
  // Closing takes back this page's history step; the «popstate» then calls onClose
  const close = () => {
    if (window.history.state?.productPage) window.history.back()
    else onClose()
  }
  const handleCheckout = () => {
    if (product.soldOut) return
    handleAdd()
    onCheckout?.()
  }

  // A page of its own (not a floating window): the browser's / phone's «Atrás» closes it, Escape too, and the
  // page behind doesn't scroll while it's open
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    // One history step for this page (StrictMode runs effects twice: don't add a second one)
    if (!window.history.state?.productPage) window.history.pushState({ productPage: true }, "")
    const onPop = () => { if (!window.history.state?.productPage) closeRef.current() }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !zoomOpenRef.current) close() }
    window.addEventListener("popstate", onPop)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("keydown", onKey)
    }
  }, [])
  const zoomOpenRef = useRef(false)
  zoomOpenRef.current = !!zoomBeverage
  const additionsCount = ADDITIONS.reduce((total, item) => total + (addQtys[item.name] || 0), 0)
  const PAGE = dark ? "#151310" : "#F6EFDF"
  const SOFT = dark ? "rgba(244,238,220,0.04)" : "#fff"
  // Collapsible sections (like the delivery apps). Closed, each one says what was chosen
  // One open at a time: opening a section closes the others (it starts on the first one)
  const [openSecs, setOpenSecs] = useState<Set<string>>(() => new Set([sodaParts ? "sec-size" : isHit ? "sec-hit" : "sec-sauces"]))
  const toggleSec = (id: string) => setOpenSecs((cur) => (cur.has(id) ? new Set() : new Set([id])))
  const Section = useMemo(() => ({ id, title, hint, summary, count, icon, children }: { id: string; title: string; hint: string; summary?: string; count?: string; wide?: boolean; icon?: React.ReactNode; children: React.ReactNode }) => {
    const open = openSecs.has(id)
    return (
      <section className="transition-colors" style={{ borderTop: `1px solid ${BORDER}`, background: open ? (dark ? "rgba(210,154,66,0.05)" : `${C.mustard}06`) : "transparent" }}>
        <button
          type="button"
          onClick={() => toggleSec(id)}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-black/[0.015] sm:px-6"
        >
          {icon && (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ background: open || summary ? C.mustard : `${C.mustard}14`, color: open || summary ? "#fff" : C.mustard }}
            >
              {icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span id={id} className="text-base font-black leading-tight sm:text-lg" style={{ color: TEXT, fontFamily: "League Spartan, sans-serif" }}>
                {title}
              </span>
              {count && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                  {count}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs" style={{ color: !open && summary ? C.mustard : MUTED, fontWeight: !open && summary ? 600 : 400 }}>
              {!open && summary ? summary : hint}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300"
            style={{ background: open ? C.mustard : `${C.mustard}14`, color: open ? "#fff" : C.mustard, transform: open ? "rotate(180deg)" : "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </button>
        {/* Height animates by grid rows (0fr ↔ 1fr), no measuring */}
        <div
          id={`${id}-body`}
          role="region"
          aria-labelledby={id}
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-5 pb-5 sm:px-6 sm:pl-[4.6rem]" inert={!open}>{children}</div>
          </div>
        </div>
      </section>
    )
  }, [BORDER, TEXT, MUTED, openSecs, dark])
  const additionsMoney = ADDITIONS.reduce((t, a) => t + (addQtys[a.name] || 0) * a.price, 0)

  // Quantity next to «Agregar», then «Finalizar compra»
  const actions = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-shrink-0 items-center rounded-full p-0.5" aria-label="Cantidad del producto" role="group" style={{ background: dark ? "rgba(244,238,220,0.07)" : "rgba(30,30,30,0.06)" }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Una menos"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full font-bold disabled:cursor-default disabled:opacity-35"
            style={{ color: TEXT }}
          >
            −
          </button>
          {/* The quantity can be typed (1-999); while typing it may be empty, on leaving it goes back to a valid one */}
          <input
            type="text"
            inputMode="numeric"
            value={qtyDraft ?? String(qty)}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 3)
              setQtyDraft(digits)
              if (Number(digits) >= 1) setQty(Number(digits))
            }}
            onFocus={(event) => event.target.select()}
            onBlur={() => setQtyDraft(null)}
            aria-label="Cantidad"
            className="w-10 bg-transparent text-center text-sm font-black outline-none"
            style={{ color: TEXT }}
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty >= MAX_QTY}
            aria-label="Una más"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full font-bold disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--brand-gold-gradient)", color: "#fff" }}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={addWithFeedback}
          disabled={product.soldOut}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-full py-2.5 pl-5 pr-5 text-sm font-bold transition-[opacity,background-color] duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55 sm:text-base [&_svg]:h-4 [&_svg]:w-4"
          style={{ background: added ? "#F3E2B6" : C.mustard, color: added ? "#3D2D16" : "#fff", boxShadow: `0 6px 16px ${C.mustard}40` }}
        >
          <span key={added ? "added" : "add"} className={`flex items-center gap-1.5 ${added ? "cart-added-pop" : ""}`}>
            {Ico.check}
            {product.soldOut ? "Agotado" : initial ? "Guardar cambios" : added ? "Agregado" : "Agregar"}
          </span>
          <span className="font-price font-black tabular-nums">{fmt(total)}</span>
        </button>
      </div>
      {onCheckout && (
        <button
          type="button"
          onClick={handleCheckout}
          disabled={product.soldOut}
          className="w-full cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          style={{ border: `1.5px solid ${C.mustard}`, color: C.mustard, background: "transparent" }}
        >
          Finalizar compra
        </button>
      )}
    </div>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className="add-product-dialog fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: PAGE }}
    >
      {/* Top bar: back to the menu */}
      <header
        className="flex flex-shrink-0 items-center gap-3 px-4 py-2 sm:px-6"
        style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}
      >
        <button
          type="button"
          onClick={close}
          className="flex cursor-pointer items-center gap-2 rounded-full py-2 pl-2.5 pr-4 text-sm font-bold transition-colors hover:opacity-90"
          style={{ background: dark ? "rgba(244,238,220,0.07)" : "rgba(30,30,30,0.06)", color: TEXT }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver al menú
        </button>
        <span className="min-w-0 truncate text-sm font-semibold" style={{ color: MUTED }}>{product.name}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1360px] gap-5 px-4 pb-6 pt-4 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:pb-10 md:pt-7 lg:px-14">
          {/* Left: the photo, price, name and description (stays in view while the options scroll) */}
          <div className="min-w-0 md:sticky md:top-0 md:self-start">
            {/* Photo: the card is the picture itself (fills it, never cropped); «Favorita» on top */}
            <div
              ref={photoRef}
              className="relative flex h-[34vh] w-full items-center justify-center overflow-hidden rounded-3xl shadow-[0_22px_44px_-28px_rgba(25,21,18,0.7)] md:h-[36vh] md:[@media(max-height:800px)]:h-[30vh]"
              style={{ background: isHit ? "#fff" : dark ? "#1E1C18" : "#2A2420" }}
            >
              {productPhoto && (
                <>
                  {/* The same photo, blurred, fills the card behind the complete one: no empty bands, nothing cropped */}
                  {!isHit && (
                    <img src={productPhoto} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" />
                  )}
                  <ZoomableImage
                    src={productPhoto}
                    alt={isHit ? `${product.name} · ${hitFlavor}` : product.name}
                    className={`relative block h-full w-auto max-w-full object-contain ${isHit ? "" : "drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"}`}
                  />
                </>
              )}
              {product.badge && (
                <span className="pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm" style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}>
                  ★ {product.badge}
                </span>
              )}
            </div>
            {/* Info card: name and price, description, what it includes, and buying */}
            <div className="mt-4 rounded-3xl p-5 sm:p-6" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 18px 40px -32px rgba(25,21,18,0.5)" }}>
              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-[1.8rem]" style={{ color: TEXT, fontFamily: "League Spartan, sans-serif" }}>
                {product.name}
              </h1>
              <div className="font-price mt-1 text-2xl font-black tabular-nums" style={{ color: C.mustard }}>{product.priceStr}</div>
              {product.desc && (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: dark ? "rgba(244,238,220,0.7)" : "rgba(30,30,30,0.65)" }}>
                  {product.desc}
                </p>
              )}
              {!!product.ingredients?.length && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-4" style={{ borderColor: BORDER }}>
                  <span className="mb-0.5 w-full text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Incluye</span>
                  {product.ingredients.map((i) => (
                    <span key={i} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: `${C.mustard}12`, color: dark ? "#E9DCC0" : "#5C4A1A" }}>
                      {i}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 hidden border-t pt-4 md:block" style={{ borderColor: BORDER }}>{actions}</div>
            </div>
          </div>

          {/* Right: every option at once, one section under the other */}
          <div className="w-full min-w-0 self-start overflow-hidden rounded-3xl" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 22px 50px -38px rgba(25,21,18,0.55)" }}>
            <div className="px-5 pb-4 pt-5 sm:px-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.mustard }}>Hazlo a tu gusto</div>
              <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl" style={{ color: TEXT, fontFamily: "League Spartan, sans-serif" }}>Personaliza tu pedido</h2>
            </div>
            {sodaParts && (() => {
              // A soda opened from the menu is already a flavour («Coca-Cola»): only its size is chosen here
              const [, flavor] = sodaParts
              const parts = (p: Product) => SODA_RE.exec(p.name) as RegExpExecArray
              const sizes = MENU_EXTRAS
                .filter((p) => p.cat === "bebidas" && !p.soldOut && SODA_RE.test(p.name) && parts(p)[1] === flavor)
                .sort((a, b) => sizeMl(parts(a)[2]) - sizeMl(parts(b)[2]))
              const pick = (p: Product) => {
                if (p.id === product.id) return
                setProduct(p)
                setQty(1)
                setQtyDraft(null)
              }
              return (
                <Section id="sec-size" wide icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4v4l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3V2Z" /><path d="M8 13h8" /></svg>} title="Tamaño" hint={`Elige el tamaño de tu ${flavor}. Solo ves los que tenemos disponibles.`}>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {sizes.map((p) => {
                      const size = parts(p)[2]
                      const on = p.id === product.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => pick(p)}
                          aria-pressed={on}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition-colors"
                          style={{ background: on ? `${C.mustard}14` : SOFT, border: `1.5px solid ${on ? C.mustard : BORDER}` }}
                        >
                          <span className="flex h-16 w-10 flex-shrink-0 items-center justify-center overflow-hidden">
                            <BeverageArt flavor={flavor} size={size} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-base font-bold" style={{ color: on ? C.mustard : TEXT }}>{size}</span>
                            <span className="block text-xs font-semibold" style={{ color: MUTED }}>{p.priceStr}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </Section>
              )
            })()}

            {isHit && (
              <Section id="sec-hit" wide title="Sabor" hint="Elige el sabor de tu Hit de litro." summary={hitFlavor}>
                <div role="radiogroup" aria-label="Sabor del Hit" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {HIT_FLAVORS.map((flavor) => {
                    const on = flavor === hitFlavor
                    return (
                      <button
                        key={flavor}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setHitFlavor(flavor)}
                        className="cursor-pointer rounded-2xl px-3 py-3 text-sm font-bold transition-colors"
                        style={{ background: on ? C.mustard : SOFT, color: on ? "#fff" : TEXT, border: `1.5px solid ${on ? C.mustard : BORDER}` }}
                      >
                        {flavor}
                      </button>
                    )
                  })}
                </div>
              </Section>
            )}

            {!isMenuExtra && (
              <Section id="sec-sauces" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.7c3.2 3.6 5.5 6.9 5.5 10a5.5 5.5 0 0 1-11 0c0-3.1 2.3-6.4 5.5-10Z" /></svg>} title="Salsas" hint={`${SAUCES.length} opciones · elige hasta 4, son gratis`} summary={selSauces.length ? selSauces.join(", ") : undefined} count={`${selSauces.length}/4`}>
                <div role="group" aria-label="Salsas" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {SAUCES.map((s) => {
                    const on = selSauces.includes(s)
                    const full = !on && selSauces.length >= 4
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSauce(s)}
                        disabled={full}
                        aria-pressed={on}
                        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl py-2 pl-2.5 pr-3 text-left text-sm font-semibold transition-all duration-150 hover:-translate-y-px active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                        style={{
                          border: `1.5px solid ${on ? C.mustard : BORDER}`,
                          background: on ? C.mustard : SOFT,
                          color: on ? "#fff" : TEXT,
                          boxShadow: on ? `0 4px 10px -4px ${C.mustard}` : "none",
                        }}
                      >
                        <span
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{ background: on ? "rgba(255,255,255,0.25)" : `${C.mustard}1A`, color: on ? "#fff" : C.mustard }}
                        >
                          {on ? "✓" : "+"}
                        </span>
                        <span className="min-w-0 truncate first-letter:uppercase" title={s}>{s}</span>
                      </button>
                    )
                  })}
                </div>
              </Section>
            )}

            {!isMenuExtra && (
              <Section id="sec-additions" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>} title="Adiciones" hint={ADDITIONS.length ? `${ADDITIONS.length} opciones · desde +${fmt(Math.min(...ADDITIONS.map((a) => a.price)))}` : "Agrégale lo que quieras"} summary={additionsCount ? `${additionsCount} ${additionsCount === 1 ? "adición" : "adiciones"} · +${fmt(additionsMoney)}` : undefined} count={additionsCount ? `${additionsCount}` : undefined}>
                <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 xl:grid-cols-3">
                  {ADDITIONS.map((a) => {
                    const q = addQtys[a.name] || 0
                    const soldOut = a.stock != null && a.stock <= 0
                    return (
                      <div
                        key={a.name}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-xl py-1.5 pl-3 pr-1.5 transition-colors"
                        style={{ border: `1.5px solid ${q ? C.mustard : BORDER}`, background: q ? `${C.mustard}12` : SOFT, opacity: soldOut ? 0.6 : 1 }}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold leading-tight" style={{ color: TEXT }} title={a.name}>{a.name}</span>
                          <span className="text-xs font-bold leading-tight" style={{ color: C.mustard }}>
                            +{fmt(a.price)}
                            {soldOut ? (
                              <span className="font-semibold" style={{ color: MUTED }}> · agotada</span>
                            ) : a.stock != null && a.stock <= 10 && (
                              <span className="font-semibold" style={{ color: MUTED }}> · quedan {a.stock}</span>
                            )}
                          </span>
                        </div>
                        <QtyStepper value={q} onChange={(n) => setAdd(a.name, n)} max={addMax(a)} disabledPlus={soldOut} label={a.name} color={C.mustard} text={TEXT} />
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {!isMenuExtra && (
              <Section id="sec-drinks" wide title="Bebidas" hint={BEVERAGES.length && sizesInStock.length ? `${BEVERAGES.length} sabores · desde ${fmt(Math.min(...sizesInStock.map((z) => z.price)))}` : "Acompaña tu pedido con una gaseosa fría"} summary={selectedBeverageCount ? `${selectedBeverageCount} ${selectedBeverageCount === 1 ? "bebida" : "bebidas"} · +${fmt(beverageTotal)}` : undefined} count={selectedBeverageCount ? `${selectedBeverageCount}` : undefined}>
                {!BEVERAGES.length || !BEVERAGE_SIZES.length ? (
                  <p className="rounded-2xl px-3 py-4 text-center text-sm" style={{ background: SOFT, color: MUTED }}>
                    Por ahora no hay gaseosas disponibles.
                  </p>
                ) : (
                  <>
                    <div role="radiogroup" aria-label="Tamaño de gaseosa" className="mb-2.5 flex flex-wrap gap-1.5">
                      {sizesInStock.map((size) => {
                        const on = size.id === selectedBeverageSize.id
                        return (
                          <button
                            key={size.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setBeverageSize(size.id)}
                            className="flex cursor-pointer items-baseline gap-1.5 rounded-full px-3.5 py-1.5 transition-colors"
                            style={{ background: on ? C.mustard : SOFT, border: `1.5px solid ${on ? C.mustard : BORDER}`, color: on ? "#fff" : TEXT }}
                          >
                            <span className="text-sm font-bold">{size.label}</span>
                            <span className="text-xs font-semibold" style={{ opacity: on ? 0.9 : 0.6 }}>{fmt(size.price)}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 xl:grid-cols-3">
                      {BEVERAGES.map((flavor) => {
                        const size = selectedBeverageSize
                        const key = `Gaseosa ${flavor} ${size.id}`
                        const quantity = addQtys[key] || 0
                        const info = sodaInfo(flavor, size.label)
                        if (SODA_INFO.size && (!info || info.agotada)) return null // sin stock: no se muestra
                        const soldOut = !!info?.agotada
                        const price = sodaPrice(flavor, size)
                        return (
                          <div
                            key={flavor}
                            className="flex min-w-0 items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-1.5 transition-colors"
                            style={{ border: `1.5px solid ${quantity > 0 ? C.mustard : BORDER}`, background: quantity > 0 ? `${C.mustard}12` : SOFT, opacity: soldOut ? 0.55 : 1 }}
                          >
                            <button
                              type="button"
                              onClick={() => setZoomBeverage(flavor)}
                              aria-label={`Ver ${beverageLabel(flavor)} ${size.label} más grande`}
                              className="flex h-11 w-8 flex-shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg"
                              style={{ background: "#fff" }}
                            >
                              <BeverageArt flavor={flavor} size={size.label} />
                            </button>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate whitespace-nowrap text-sm font-semibold leading-tight" style={{ color: TEXT }} title={beverageLabel(flavor)}>{flavor}</span>
                              <span className="text-xs font-bold leading-tight" style={{ color: soldOut ? C.red : C.mustard }}>
                                {soldOut ? "Agotada" : fmt(price)}
                                {!soldOut && info?.stock != null && info.stock <= 10 && (
                                  <span className="font-semibold" style={{ color: MUTED }}> · quedan {info.stock}</span>
                                )}
                              </span>
                            </div>
                            <QtyStepper
                              value={quantity}
                              onChange={(n) => setAdd(key, soldOut ? Math.min(n, quantity) : n)}
                              label={`gaseosa ${flavor} ${size.label}`}
                              color={C.mustard}
                              text={TEXT}
                              disabledPlus={soldOut}
                              // Each unit of the line carries these sodas: never more in total than the stock
                              max={info?.stock != null ? Math.floor(info.stock / Math.max(1, qty)) : 99}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </Section>
            )}
            {/* What the line carries so far, before adding it */}
            <div className="px-5 py-5 sm:px-6" style={{ borderTop: `1px solid ${BORDER}`, background: dark ? "rgba(255,255,255,0.02)" : `${C.mustard}0A` }}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.mustard }}>Tu pedido</div>
              <div className="space-y-1.5 text-sm" style={{ color: TEXT }}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold">{qty} × {product.name}</span>
                  <span className="font-price tabular-nums">{fmt(product.price * qty)}</span>
                </div>
                {selSauces.length > 0 && (
                  <div className="flex items-baseline justify-between gap-3" style={{ color: MUTED }}>
                    <span className="min-w-0 truncate">Salsas: {selSauces.join(", ")}</span>
                    <span>Gratis</span>
                  </div>
                )}
                {additionsCount > 0 && (
                  <div className="flex items-baseline justify-between gap-3" style={{ color: MUTED }}>
                    <span>{additionsCount} {additionsCount === 1 ? "adición" : "adiciones"}</span>
                    <span className="tabular-nums">+{fmt(additionsMoney * qty)}</span>
                  </div>
                )}
                {selectedBeverageCount > 0 && (
                  <div className="flex items-baseline justify-between gap-3" style={{ color: MUTED }}>
                    <span>{selectedBeverageCount} {selectedBeverageCount === 1 ? "bebida" : "bebidas"}</span>
                    <span className="tabular-nums">+{fmt(beverageTotal * qty)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-baseline justify-between gap-3 border-t pt-2.5" style={{ borderColor: `${C.mustard}33` }}>
                  <span className="font-bold">Total</span>
                  <span className="font-price text-lg font-black tabular-nums" style={{ color: C.mustard }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone: quantity, «Agregar» and «Finalizar compra» in a bar always in view (on a computer they sit under the product) */}
      <div className="flex-shrink-0 md:hidden" style={{ background: CARD, borderTop: `1px solid ${BORDER}`, boxShadow: "0 -10px 30px -20px rgba(25,21,18,0.5)" }}>
        <div className="px-4 py-2.5">{actions}</div>
      </div>

      {zoomBeverage && (
        <div
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setZoomBeverage(null)}
          role="dialog"
          aria-label={beverageLabel(zoomBeverage)}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-[min(60vh,420px)] w-[min(70vw,300px)] items-center justify-center overflow-hidden rounded-2xl p-4" style={{ background: "#fff" }}>
              <BeverageArt flavor={zoomBeverage} size={selectedBeverageSize.label} />
            </div>
            <span className="text-base font-bold text-white">{beverageLabel(zoomBeverage)} · {selectedBeverageSize.label}</span>
            <span className="max-w-xs text-center text-[10px] text-white/60">Imagen de referencia del producto</span>
            <span className="text-xs text-white/70">Toca para volver</span>
          </div>
        </div>
      )}
    </div>
  )
}

// A copy of the product photo flies (shrinking) from the window to the cart button in the header
function flyToCart(img: HTMLImageElement | null | undefined, target: HTMLElement) {
  if (!img) return
  const from = img.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = Math.min(from.width, from.height, 140)
  const ghost = img.cloneNode() as HTMLImageElement
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "50%",
    zIndex: "1000",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  })
  document.body.appendChild(ghost)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  ghost
    .animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.55)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
      ],
      { duration: 600, easing: "cubic-bezier(0.5, 0, 0.6, 1)" },
    )
    .finished.finally(() => ghost.remove())
}
