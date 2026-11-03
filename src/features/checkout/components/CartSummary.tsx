import { useState } from "react"
import { activeCartItemsFirst, cartTotal, itemTotal } from "@/features/checkout/utils/cart"
import { PRODUCTS } from "@/features/menu/data/products"
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
                className="mt-3 pt-3 text-xs space-y-2"
                style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}
              >
                <p className="leading-relaxed">{descriptionFor(item)}</p>
                {item.sauces?.length ? (
                  <p><strong style={{ color: TEXT }}>Salsas:</strong> {item.sauces.join(", ")}</p>
                ) : (
                  <p><strong style={{ color: TEXT }}>Salsas:</strong> Sin salsas seleccionadas</p>
                )}
                {item.additions?.length ? (
                  <div>
                    <strong style={{ color: TEXT }}>Adiciones:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {item.additions.map((addition) => (
                        <li key={addition.name}>
                          {addition.name} × {addition.qty} · {fmt(addition.price * addition.qty)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p><strong style={{ color: TEXT }}>Adiciones:</strong> Sin adiciones</p>
                )}
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
    </div>
  )
}
