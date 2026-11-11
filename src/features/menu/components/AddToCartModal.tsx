import { useEffect, useRef, useState } from "react"
import BeverageArt from "@/features/menu/components/BeverageArt"
import { ADDITIONS, BEVERAGES, BEVERAGE_SIZES, MENU_EXTRAS, SAUCES, SODA_INFO, SODA_RE, allMenuProducts, beverageLabel, sizeMl, sodaInfo, sodaPrice } from "@/features/menu/data/products"
import QtyStepper from "@/shared/components/QtyStepper"
import ZoomableImage from "@/shared/components/ZoomableImage"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { Product } from "@/shared/types"
import { fmt } from "@/shared/utils/format"

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
  ) => void
  onCheckout?: () => void
  dark: boolean
  // Editing a cart line: starts with its choices and the button says «Guardar cambios»
  initial?: { qty: number; sauces?: string[]; additions?: { name: string; qty: number }[] }
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
  const [descOpen, setDescOpen] = useState(false)
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
  const [customizationTab, setCustomizationTab] = useState<"sauces" | "additions" | "beverages">("sauces")
  const isMenuExtra = ["salsas", "adiciones", "bebidas"].includes(product.cat)
  // [, sabor, tamaño] when the product is a soda («Gaseosa Coca-Cola (1.5 L)»)
  const sodaParts = SODA_RE.exec(product.name)
  // Photo width ÷ height: a vertical or square photo goes beside the details on a computer (complete, no side
  // strips); a wide one stays on top. Read from the image itself, so it fits any photo the admin uploads
  const [photoRatio, setPhotoRatio] = useState<number | null>(null)
  useEffect(() => {
    setPhotoRatio(null)
    if (!product.img) return
    const probe = new Image()
    probe.onload = () => setPhotoRatio(probe.naturalWidth / probe.naturalHeight || null)
    probe.src = product.img
  }, [product.img])
  // Computer: the photo's column, sized from the photo's proportion so it shows complete at most ~300px tall
  // (~300px tall; a wide photo gets up to 420px wide, a tall one at least 300px). Fixed per photo: nothing resizes as you use it
  const photoColW = Math.round(Math.min(420, Math.max(300, 300 * (photoRatio ?? 1.25))))
  // Cream card under the photo (the photo's curve blends into it)
  const CARD = dark ? "#1E1C18" : "#FBF6E9"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  // The tabs filter: only the chosen section shows. On a computer the three share one grid cell (the others
  // just invisible), so the column keeps the tallest one's height and nothing jumps when changing tabs
  const panelClass = (tab: typeof customizationTab) =>
    isMenuExtra
      ? "hidden"
      : `min-w-0 md:[grid-area:1/1] ${customizationTab === tab ? "block" : "hidden md:invisible md:block"}`
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
    flyToCart(photoRef.current?.querySelector("img"), cartButton)
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
    onAdd(product, qty, selSauces, [...adds, ...beverages])
    onClose()
  }
  const handleCheckout = () => {
    if (product.soldOut) return
    handleAdd()
    onCheckout?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md md:max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
        style={{
          background: CARD,
          maxHeight: "92dvh",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close: the window's top-right corner (z-30 keeps it above the photo so the tap closes, not zooms) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:opacity-90"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          {Ico.x}
        </button>
        {/* Left on a computer (top on a phone): the whole photo at its own proportion (no strips, no crop),
            then name, price and description */}
        <div
          className="flex min-w-0 flex-shrink-0 flex-col md:w-[var(--photo-w)]"
          style={{ "--photo-w": `${photoColW}px` } as React.CSSProperties}
        >
        <div ref={photoRef} className="relative flex-shrink-0 p-3 pb-0 md:p-4 md:pr-0" style={{ background: CARD }}>
          {product.img && (
            <ZoomableImage
              src={product.img}
              alt={product.name}
              className="mx-auto block h-auto max-h-[28vh] w-auto max-w-full rounded-2xl min-[380px]:max-h-[30vh] md:max-h-none md:w-full"
            />
          )}
        </div>
        {/* Product info, like the reference: price, name, then the whole description (a phone shows 2 lines + «Ver más») */}
        <div className="flex-shrink-0 px-5 pb-1 pt-2 min-[380px]:pb-2 min-[380px]:pt-3 md:px-5 md:pb-5 md:pt-4" style={{ background: CARD }}>
          <div className="font-price text-lg font-bold leading-none md:text-xl" style={{ color: C.mustard }}>
            {product.priceStr}
          </div>
          <h3 className="mt-1 font-black text-lg leading-tight min-[380px]:text-xl md:mt-1.5" style={{ color: TEXT }}>
            {product.name}
          </h3>
          <p
            className={`mt-1 text-sm leading-relaxed md:mt-2 ${descOpen ? "" : "line-clamp-1 min-[380px]:line-clamp-2 md:line-clamp-none"}`}
            style={{ color: dark ? "rgba(244,238,220,0.62)" : "rgba(30,30,30,0.55)" }}
          >
            {product.desc}
          </p>
          {product.desc.length > 90 && (
            <button
              type="button"
              onClick={() => setDescOpen((open) => !open)}
              className="mt-0.5 cursor-pointer text-xs font-bold hover:underline md:hidden"
              style={{ color: C.mustard }}
            >
              {descOpen ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
        </div>
        {/* Right on a computer (below on a phone): the tabs, their options and the buttons */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="@container min-h-0 flex-1 overflow-y-auto px-4 py-1.5 sm:px-5 md:px-6 md:pt-5"
          style={{ background: CARD }}
        >
          {!isMenuExtra && <div className={`mb-1.5 grid grid-cols-3 gap-1 rounded-full p-1 md:mb-3 md:mr-10 ${dark ? "bg-white/5" : "bg-black/5"}`}>
            {([
              ["sauces", `Salsas ${selSauces.length}/4`],
              ["additions", `Adiciones ${ADDITIONS.reduce((total, item) => total + (addQtys[item.name] || 0), 0)}`],
              ["beverages", `Bebidas ${selectedBeverageCount}`],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCustomizationTab(tab)}
                className="cursor-pointer rounded-full px-2 py-1.5 text-sm font-bold transition-colors"
                style={{
                  background: customizationTab === tab ? C.mustard : "transparent",
                  color: customizationTab === tab ? "#fff" : MUTED,
                }}
              >
                {label}
              </button>
            ))}
          </div>}
          {sodaParts && (() => {
            // A soda opened from the menu is already a flavour («Coca-Cola»): only its size is chosen here, among the
            // sizes in stock. Choosing one switches the window to that soda
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
              <div className="md:mr-10">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                  Elige el tamaño de tu {flavor}
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {sizes.map((p) => {
                    const size = parts(p)[2]
                    const on = p.id === product.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pick(p)}
                        aria-pressed={on}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors md:p-3"
                        style={{
                          background: on ? `${C.mustard}14` : dark ? "rgba(244,238,220,0.04)" : "#fff",
                          border: `1.5px solid ${on ? C.mustard : BORDER}`,
                        }}
                      >
                        <span className="flex h-12 w-8 flex-shrink-0 items-center justify-center overflow-hidden md:h-16 md:w-10">
                          <BeverageArt flavor={flavor} size={size} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold md:text-base" style={{ color: on ? C.mustard : TEXT }}>{size}</span>
                          <span className="block text-xs font-semibold" style={{ color: MUTED }}>{p.priceStr}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 hidden rounded-2xl px-3 py-2.5 text-xs leading-relaxed md:block" style={{ background: dark ? "rgba(244,238,220,0.05)" : "rgba(30,30,30,0.04)", color: MUTED }}>
                  Bebida fría, servida en su envase original. Solo ves los tamaños que tenemos disponibles ahora.
                </p>
              </div>
            )
          })()}
          <div className="md:grid">
          <div className={panelClass("sauces")}>
            <div className="mb-1.5 text-[11px] font-semibold max-[379px]:hidden md:mb-2" style={{ color: selSauces.length === 4 ? C.amber : MUTED }}>
              Elige hasta 4 salsas (gratis)
            </div>
            <div role="group" aria-label="Salsas" className="grid grid-cols-2 gap-1 md:gap-1.5">
              {SAUCES.map((s) => {
                const on = selSauces.includes(s)
                return (
                  <div
                    key={s}
                    className="flex min-w-0 items-center justify-between gap-1 rounded-full py-0.5 pl-3 pr-1 md:py-2.5"
                    style={{ border: `1px solid ${on ? C.mustard : BORDER}`, background: on ? `${C.mustard}12` : dark ? "rgba(244,238,220,0.03)" : "rgba(30,30,30,0.02)" }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs leading-tight md:text-[13px]" style={{ color: TEXT }}>{s}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSauce(s)}
                      disabled={!on && selSauces.length >= 4}
                      aria-pressed={on}
                      aria-label={on ? `Quitar salsa ${s}` : `Agregar salsa ${s}`}
                      className="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: C.mustard, color: "#fff" }}
                    >
                      {on ? "✓" : "+"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className={panelClass("additions")}>
            <div className="mb-1.5 text-[11px] font-semibold max-[379px]:hidden md:mb-2" style={{ color: MUTED }}>
              Agrégale lo que quieras a tu {product.name.toLowerCase()}
            </div>
            {/* Two compact columns: name and «+$ price», and a − amount + you can also type in */}
            <div className="grid grid-cols-2 gap-1.5">
              {ADDITIONS.map((a) => {
                const q = addQtys[a.name] || 0
                const soldOut = a.stock != null && a.stock <= 0
                return (
                  <div
                    key={a.name}
                    className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl py-1.5 pl-2.5 pr-1.5 transition-colors"
                    style={{
                      border: `1px solid ${q ? C.mustard : BORDER}`,
                      background: q ? `${C.mustard}12` : dark ? "rgba(244,238,220,0.04)" : "#fff",
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-semibold leading-tight" style={{ color: TEXT }} title={a.name}>
                        {a.name}
                      </span>
                      <span className="text-[11px] font-bold leading-tight" style={{ color: C.mustard }}>
                        +{fmt(a.price)}
                        {soldOut ? (
                          <span className="font-semibold" style={{ color: MUTED }}> · agotada</span>
                        ) : a.stock != null && a.stock <= 10 && (
                          <span className="font-semibold" style={{ color: MUTED }}> · quedan {a.stock}</span>
                        )}
                      </span>
                    </div>
                    <QtyStepper
                      value={q}
                      onChange={(n) => setAdd(a.name, n)}
                      max={addMax(a)}
                      disabledPlus={soldOut}
                      label={a.name}
                      color={C.mustard}
                      text={TEXT}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className={panelClass("beverages")}>
          {!BEVERAGES.length && (
            <p className="rounded-xl px-3 py-4 text-center text-sm" style={{ background: dark ? "rgba(244,238,220,0.05)" : "rgba(30,30,30,0.04)", color: MUTED }}>
              Por ahora no hay gaseosas disponibles.
            </p>
          )}
          {BEVERAGES.length > 0 && (
          <div>
            {/* Size as visible buttons: the bottle photos below change with it */}
            <div
              role="radiogroup"
              aria-label="Tamaño de gaseosa"
              className="mb-1.5 grid gap-1.5 md:mb-2"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, sizesInStock.length)}, minmax(0, 1fr))` }}
            >
              {sizesInStock.map((size) => {
                const on = size.id === selectedBeverageSize.id
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setBeverageSize(size.id)}
                    className="flex cursor-pointer flex-col items-center rounded-full px-1 py-1.5 leading-tight transition-colors"
                    style={{
                      background: on ? C.mustard : dark ? "rgba(244,238,220,0.05)" : "#fff",
                      border: `1px solid ${on ? C.mustard : BORDER}`,
                      color: on ? "#fff" : TEXT,
                    }}
                  >
                    <span className="text-xs font-bold">{size.label}</span>
                    <span className="text-[10px] font-semibold" style={{ opacity: on ? 0.9 : 0.6 }}>
                      {fmt(size.price)}
                    </span>
                  </button>
                )
              })}
            </div>
            {!BEVERAGE_SIZES.length ? (
              <p className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: dark ? "rgba(244,238,220,0.03)" : "#fff", color: MUTED }}>
                No hay tamaños de bebida disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
              {BEVERAGES.map((flavor) => {
                const size = selectedBeverageSize
                const key = `Gaseosa ${flavor} ${size.id}`
                const quantity = addQtys[key] || 0
                const info = sodaInfo(flavor, size.label)
                // Only the sodas that exist as products (that flavour may not come in this size)
                if (SODA_INFO.size && (!info || info.agotada)) return null // sin stock: no se muestra
                const unavailable = info?.agotada ? "Agotada" : ""
                const soldOut = !!unavailable
                const price = sodaPrice(flavor, size)
                return (
                  // Compact: small bottle, flavour and price, and a − amount + you can also type in
                  <div
                    key={flavor}
                    className="flex min-w-0 items-center gap-1.5 rounded-xl py-1 pl-1 pr-1.5 transition-colors"
                    style={{
                      border: `1px solid ${quantity > 0 ? C.mustard : BORDER}`,
                      background: quantity > 0 ? `${C.mustard}12` : dark ? "rgba(244,238,220,0.04)" : "#fff",
                      opacity: soldOut ? 0.55 : 1,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setZoomBeverage(flavor)}
                      aria-label={`Ver ${beverageLabel(flavor)} ${size.label} más grande`}
                      className="flex h-10 w-7 flex-shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg max-[379px]:hidden"
                      style={{ background: "#fff" }}
                    >
                      <BeverageArt flavor={flavor} size={size.label} />
                    </button>
                    {/* Flavour only (the brand is on the bottle); nowrap keeps "Coca-Cola" in one piece */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate whitespace-nowrap text-[13px] font-semibold leading-tight" style={{ color: TEXT }} title={beverageLabel(flavor)}>
                        {flavor}
                      </span>
                      <span className="text-[11px] font-bold leading-tight" style={{ color: soldOut ? C.red : C.mustard }}>
                        {soldOut ? unavailable : fmt(price)}
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
                      // Each burger in the line carries these sodas: never more in total than the admin's stock
                      max={info?.stock != null ? Math.floor(info.stock / Math.max(1, qty)) : 99}
                    />
                  </div>
                )
              })}
              </div>
            )}
            {zoomBeverage && (
              <div
                className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center p-6"
                style={{ background: "rgba(0,0,0,0.75)" }}
                onClick={() => setZoomBeverage(null)}
                role="dialog"
                aria-label={beverageLabel(zoomBeverage)}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="flex h-[min(60vh,420px)] w-[min(70vw,300px)] items-center justify-center overflow-hidden rounded-2xl p-4"
                    style={{ background: "#fff" }}
                  >
                    <BeverageArt flavor={zoomBeverage} size={selectedBeverageSize.label} />
                  </div>
                  <span className="text-base font-bold text-white">
                    {beverageLabel(zoomBeverage)} · {selectedBeverageSize.label}
                  </span>
                  <span className="max-w-xs text-center text-[10px] text-white/60">Imagen de referencia del producto</span>
                  <span className="text-xs text-white/70">Toca para volver</span>
                </div>
              </div>
            )}
          </div>
          )}
          </div>
          </div>
        </div>
        {/* Purchase: total on the left; quantity and the two short buttons on the right (on a phone the
            buttons go below, side by side) */}
        <div
          className="flex w-full flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-4 pb-4 pt-3 md:px-6 md:pb-5"
          style={{ borderTop: `1px solid ${BORDER}`, background: CARD }}
        >
          <div
            className="flex flex-shrink-0 items-center rounded-full p-0.5"
            style={{ background: dark ? "rgba(244,238,220,0.07)" : "rgba(30,30,30,0.06)" }}
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Una menos"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full font-bold disabled:cursor-default disabled:opacity-35"
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
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full font-bold disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: C.mustard, color: "#fff" }}
            >
              +
            </button>
          </div>
          {/* The total lives only in the button: it goes up with the quantity, additions and drinks */}
          <button
            type="button"
            onClick={addWithFeedback}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-full py-2.5 pl-5 pr-5 text-sm font-bold transition-[opacity,background-color] duration-200 hover:opacity-90 [&_svg]:h-4 [&_svg]:w-4"
            style={{ background: added ? C.forest : C.mustard, color: "#fff", boxShadow: `0 4px 12px ${C.mustard}40` }}
          >
            <span key={added ? "added" : "add"} className={`flex items-center gap-1.5 ${added ? "cart-added-pop" : ""}`}>
              {Ico.check}
              {initial ? "Guardar cambios" : added ? "Agregado" : "Agregar"}
            </span>
            <span className="font-price font-black tabular-nums">{fmt(total)}</span>
          </button>
          {onCheckout && (
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors md:w-auto"
              style={{ border: `1.5px solid ${C.mustard}`, color: C.mustard, background: "transparent" }}
            >
              Finalizar compra
            </button>
          )}
        </div>
        </div>
      </div>
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
