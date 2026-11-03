import { itemTotal } from "@/features/checkout/utils/cart"
import { PRODUCTS, isSodaName, sodaPhoto } from "@/features/menu/data/products"
import OrderItemPhoto from "@/features/orders/components/OrderItemPhoto"
import VoucherInput from "@/features/orders/components/VoucherInput"
import { ORDER_STEPS } from "@/features/orders/utils/orders"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { Order } from "@/shared/types"
import { fmt, formatDuration } from "@/shared/utils/format"

export default function OrderDetailModal({
  order,
  dark,
  onClose,
  onVoucher,
}: {
  order: Order
  dark: boolean
  onClose: () => void
  onVoucher: (id: string, voucher: string) => void
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"
  const cardBg = dark ? "rgba(255,255,255,0.03)" : "#FBF6E9"
  const hasFewItems = order.items.length <= 2
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      {/* Computer: products on the left; delivery, payment and total on the right (no long scroll) */}
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl ${hasFewItems ? "max-w-xl" : "max-w-md md:max-w-3xl"}`}
        style={{ background: dark ? "#1E1C18" : "#fff", color: TEXT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-5 pb-3 pt-5 md:px-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black leading-tight" style={{ fontFamily: "League Spartan, sans-serif" }}>
                Pedido {order.id}
              </h3>
              <div className="text-xs" style={{ color: MUTED }}>{order.date}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                {order.status}
              </span>
              <button onClick={onClose} className="cursor-pointer" style={{ color: MUTED }} aria-label="Cerrar">
                {Ico.x}
              </button>
            </div>
          </div>
        </div>

        <div className={`min-h-0 overflow-y-auto ${hasFewItems ? "max-h-[calc(92vh-5rem)] flex-none" : "flex-1 md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:overflow-hidden"}`}>
          {/* Products: photo, name, unit price and subtotal; below, one short line per sauce set, addition and soda */}
          <div className={`space-y-2 p-4 md:overflow-y-auto md:p-5 ${hasFewItems ? "md:pb-2" : ""}`}>
            {order.items.map((i) => {
              // The product's current photo first: the one saved with the order may no longer exist (photo replaced)
              const productImg =
                PRODUCTS.find((p) => p.name === i.name || p.name === `Hamburguesa ${i.name}`)?.img || sodaPhoto(i.name) || i.img
              const extras = i.additions || []
              return (
                <div key={i.id} className="rounded-2xl p-2.5" style={{ background: cardBg, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2.5">
                    <OrderItemPhoto srcs={[productImg, i.img]} tile={BORDER} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{i.name}</div>
                      <div className="text-xs" style={{ color: MUTED }}>{i.qty} × {fmt(i.price)}</div>
                    </div>
                    <span className="flex-shrink-0 text-sm font-black" style={{ color: C.mustard }}>{fmt(itemTotal(i))}</span>
                  </div>
                  {(i.sauces?.length || extras.length) ? (
                    <div className="mt-2 space-y-1 border-t pt-2 text-xs" style={{ borderColor: BORDER }}>
                      {i.sauces?.length ? (
                        <div className="flex gap-2">
                          <span className="w-5 flex-shrink-0 text-center" style={{ color: MUTED }}>●</span>
                          <span className="min-w-0 flex-1" style={{ color: MUTED }}>
                            Salsas: <span style={{ color: TEXT }}>{i.sauces.join(", ")}</span>
                          </span>
                        </div>
                      ) : null}
                      {extras.map((a) => {
                        const soda = isSodaName(a.name)
                        const photo = soda ? sodaPhoto(a.name) : ""
                        return (
                          <div key={a.name} className="flex items-center gap-2">
                            <span className="flex h-6 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded" style={{ background: soda ? "#fff" : "transparent", color: C.mustard }}>
                              {photo ? <img src={photo} alt="" className="h-full w-full object-contain" /> : "+"}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {soda ? a.name.replace(/^Gaseosa /, "") : a.name} <span style={{ color: MUTED }}>×{a.qty * i.qty}</span>
                            </span>
                            <span style={{ color: MUTED }}>+{fmt(a.price * a.qty * i.qty)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Order-only summary: customer and address details are shown in Mis pedidos */}
          <div className={`space-y-4 border-t p-4 md:overflow-y-auto md:p-5 ${hasFewItems ? "" : "md:border-l md:border-t-0"}`} style={{ borderColor: BORDER }}>
            {order.tipoEntrega === "domicilio" && (
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                  Domicilio
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {order.costoDomicilio != null && (
                    <div className="rounded-xl px-3 py-2.5" style={{ background: cardBg, border: `1px solid ${BORDER}` }}>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Costo</span>
                      <span className="mt-0.5 block text-sm font-bold">{fmt(order.costoDomicilio)}</span>
                    </div>
                  )}
                  {order.estimacion?.estimatedMinutes != null && (
                    <div className="rounded-xl px-3 py-2.5" style={{ background: cardBg, border: `1px solid ${BORDER}` }}>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Tiempo estimado</span>
                      <span className="mt-0.5 block text-sm font-bold">{formatDuration(order.estimacion.estimatedMinutes)}</span>
                    </div>
                  )}
                </div>
                {order.estimacion?.distanceKm != null && (
                  <p className="mt-2 text-xs" style={{ color: MUTED }}>
                    Distancia aproximada: {order.estimacion.distanceKm.toFixed(1)} km
                  </p>
                )}
              </section>
            )}

            <section className="rounded-xl border p-3.5" style={{ borderColor: BORDER }}>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                Pago
              </h4>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span style={{ color: MUTED }}>Método</span>
                <span className="font-semibold">{order.pago}</span>
              </div>
              {order.paymentStatus && (
                <div className="mt-2 flex items-center justify-between gap-3 border-t pt-2 text-sm" style={{ borderColor: BORDER }}>
                  <span style={{ color: MUTED }}>Estado</span>
                  <span className="font-semibold">{order.paymentStatus}</span>
                </div>
              )}
            </section>

            {order.notas && (
              <section className="rounded-xl px-3.5 py-3" style={{ background: cardBg }}>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>Notas del pedido</h4>
                <p className="text-sm leading-relaxed">{order.notas}</p>
              </section>
            )}
            {order.paymentStatus === "Rechazado" && order.paymentRejectionReason && (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ background: `${C.red}12`, color: C.red }}>
                <strong>Motivo de rechazo:</strong> {order.paymentRejectionReason}
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl px-4 py-3.5" style={{ background: `${C.mustard}14` }}>
              <span className="text-sm font-bold">Total</span>
              <span className="text-xl font-black" style={{ color: C.mustard }}>{fmt(order.total)}</span>
            </div>
            {order.pago !== "Efectivo" && (
              <VoucherInput value={order.voucher} onChange={(v) => onVoucher(order.id, v)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
