import { useState } from "react"
import { activeCartItemsFirst, cartTotal, itemTotal } from "@/features/checkout/utils/cart"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import { PRODUCTS, allMenuProducts, isSodaName } from "@/features/menu/data/products"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { CartItem } from "@/shared/types"
import { fmt } from "@/shared/utils/format"

// ── Cart Summary (reusable) ────────────────────────────────────────────────────
export default function CartSummary({
  cart,
  setCart,
  dark,
  showTotals = true,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  dark: boolean
  showTotals?: boolean
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const CARD = dark ? "#1E1C18" : "#fff"
  const subtotal = cartTotal(cart)
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  // Recipe ingredients the customer can leave out (none for sodas or products without a recipe)
  const ingredientsOf = (item: CartItem) =>
    isSodaName(item.name)
      ? []
      : (allMenuProducts().find((p) => p.id === item.productId) ?? allMenuProducts().find((p) => p.name === item.name))?.ingredients ?? []
  const toggleWithout = (id: number, ingredient: string) =>
    setCart((c) =>
      c.map((i) => {
        if (i.id !== id) return i
        const without = i.without ?? []
        return { ...i, without: without.includes(ingredient) ? without.filter((x) => x !== ingredient) : [...without, ingredient] }
      }),
    )
  const editingProduct = editingItem
    ? allMenuProducts().find((p) => p.id === editingItem.productId) ??
      allMenuProducts().find((p) => p.name === editingItem.name)
    : undefined
  const descriptionFor = (item: CartItem) =>
    item.description ??
    PRODUCTS.find((product) => product.name === item.name)?.desc ??
    "Hamburguesa preparada al momento con ingredientes frescos."
  const updateQty = (id: number, d: number) =>
    setCart((c) =>
      activeCartItemsFirst(
        c.map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i,
        ),
      ),
    )
  const removeItem = (id: number) =>
    setCart((c) => c.filter((item) => item.id !== id))
  const orderedCart = activeCartItemsFirst(cart)
  if (cart.length === 0)
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-sm" style={{ color: MUTED }}>
          Tu carrito está vacío
        </p>
      </div>
    )
  return (
    <div>
      <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto pr-1">
        {orderedCart.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedItemId((id) => (id === item.id ? null : item.id))
                }
                className="flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer"
                aria-expanded={expandedItemId === item.id}
                aria-label={`${expandedItemId === item.id ? "Ocultar" : "Ver"} detalles de ${item.name}`}
              >
                {item.img && (
                  <img
                    src={item.img}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm" style={{ color: TEXT }}>
                    {item.name}
                  </span>
                  {item.additions && item.additions.length > 0 && (
                    <span className="block text-xs truncate" style={{ color: MUTED }}>
                      +{item.additions.map((a) => a.name).join(", ")}
                    </span>
                  )}
                  {!!item.without?.length && (
                    <span className="block text-xs truncate font-semibold" style={{ color: C.red }}>
                      Sin {item.without.join(", ").toLowerCase()}
                    </span>
                  )}
                  {item.note?.trim() && (
                    <span className="block text-xs truncate font-semibold" style={{ color: C.red }}>
                      Nota: {item.note}
                    </span>
                  )}
                  <span className="block font-bold text-sm mt-1" style={{ color: C.mustard }}>
                    {fmt(itemTotal(item))}
                  </span>
                </span>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: MUTED }}>
                  {expandedItemId === item.id ? "Menos −" : "Detalles +"}
                </span>
              </button>
              <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    type="button"
                    disabled={item.qty === 0}
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-sm font-bold"
                    style={{
                      background: dark
                        ? "rgba(244,238,220,0.1)"
                        : "rgba(30,30,30,0.08)",
                      color: TEXT,
                      opacity: item.qty === 0 ? 0.45 : 1,
                    }}
                  >
                    −
                  </button>
                  <span
                    className="w-5 text-center text-sm font-bold"
                    style={{ color: TEXT }}
                  >
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    type="button"
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-sm font-bold"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    +
                  </button>
                  {allMenuProducts().some((p) => p.id === item.productId || p.name === item.name) && (
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="ml-1 flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold cursor-pointer hover:opacity-80"
                      style={{ background: `${C.mustard}18`, color: C.mustard }}
                      aria-label={`Editar ${item.name}`}
                      title="Editar salsas, adiciones y cantidad"
                    >
                      {Ico.edit}
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    type="button"
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
                    style={{ color: C.red }}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    title="Eliminar del carrito"
                  >
                    {Ico.trash}
                  </button>
              </div>
            </div>
            {expandedItemId === item.id && (
              <div
                className="mt-3 pt-3 grid gap-3 text-xs sm:grid-cols-2"
                style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}
              >
                <p className="sm:col-span-2 line-clamp-2 leading-relaxed" title={descriptionFor(item)}>
                  {descriptionFor(item)}
                </p>
                <div className="min-w-0 space-y-2">
                  {([
                    ["Salsas", (item.sauces ?? []).map((s) => ({ key: s, label: s }))],
                    ["Adiciones", (item.additions ?? []).map((a) => ({ key: a.name, label: `${a.name} ×${a.qty}`, price: a.price * a.qty }))],
                  ] as const).map(([title, chips]) => (
                    <div key={title}>
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: TEXT }}>
                        {title}
                      </span>
                      {chips.length ? (
                        <div className="flex flex-wrap gap-1">
                          {chips.map((chip) => (
                            <span
                              key={chip.key}
                              className="rounded-full px-2 py-0.5"
                              style={{ background: dark ? "rgba(244,238,220,0.06)" : "rgba(30,30,30,0.05)", color: TEXT }}
                            >
                              {chip.label}
                              {"price" in chip && <span style={{ color: MUTED }}> · {fmt(chip.price)}</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>Sin {title.toLowerCase()}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  {ingredientsOf(item).length > 0 && (
                    <fieldset className="mb-2.5">
                      <legend className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: TEXT }}>
                        Quitar ingredientes
                      </legend>
                      <div className="flex flex-wrap gap-1">
                        {ingredientsOf(item).map((ingredient) => {
                          const off = item.without?.includes(ingredient) ?? false
                          return (
                            <button
                              key={ingredient}
                              type="button"
                              aria-pressed={off}
                              onClick={() => toggleWithout(item.id, ingredient)}
                              className="cursor-pointer rounded-full px-2 py-0.5 transition-colors"
                              style={{
                                border: `1px solid ${off ? C.red : BORDER}`,
                                background: off ? `${C.red}12` : "transparent",
                                color: off ? C.red : TEXT,
                                textDecoration: off ? "line-through" : "none",
                              }}
                            >
                              {ingredient}
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>
                  )}
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: TEXT }}>
                      Especificaciones para la cocina
                    </span>
                    <input
                      value={item.note ?? ""}
                      maxLength={200}
                      placeholder="Ej: carne bien asada, salsas aparte"
                      onChange={(e) => setCart((c) => c.map((i) => (i.id === item.id ? { ...i, note: e.target.value } : i)))}
                      className="w-full rounded-lg border px-2.5 py-2 text-xs outline-none"
                      style={{ borderColor: BORDER, color: TEXT, background: "transparent" }}
                    />
                  </label>
                  {item.qty > 1 && (
                    <button
                      type="button"
                      onClick={() => setCart((c) => [
                        ...c.map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i)),
                        { ...item, id: Math.max(...c.map((i) => i.id)) + 1, qty: 1, note: "", without: [] },
                      ])}
                      className="mt-1.5 font-semibold cursor-pointer hover:underline"
                      style={{ color: C.mustard }}
                    >
                      Separar 1 unidad con otras especificaciones
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {showTotals && (
      <div
        className="p-4 rounded-xl"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        <div
          className="flex justify-between text-sm mb-1"
          style={{ color: MUTED }}
        >
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div
          className="flex justify-between font-black text-base pt-2"
          style={{
            borderTop: `1px solid ${BORDER}`,
            fontFamily: "League Spartan, sans-serif",
            color: TEXT,
          }}
        >
          <span>Total</span>
          <span style={{ color: C.mustard }}>{fmt(subtotal)}</span>
        </div>
      </div>
      )}
      {editingItem && editingProduct && (
        <AddToCartModal
          product={editingProduct}
          dark={dark}
          initial={{ qty: editingItem.qty, sauces: editingItem.sauces, additions: editingItem.additions }}
          onClose={() => setEditingItem(null)}
          onAdd={(product, qty, sauces, additions) =>
            setCart((c) =>
              c.map((i) =>
                i.id === editingItem.id ? { ...i, price: product.price, qty, sauces, additions } : i,
              ),
            )
          }
        />
      )}
    </div>
  )
}
