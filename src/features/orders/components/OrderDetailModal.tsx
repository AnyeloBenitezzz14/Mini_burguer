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
  // Big orders show "Por confirmar" as their first step until the owner approves
  const steps =
    order.status === "Por confirmar"
      ? ["Por confirmar", ...ORDER_STEPS.slice(1)]
      : ORDER_STEPS
  const step = steps.indexOf(order.status)
  const field = (label: string, value: string | undefined, wide = false) =>
    value ? (
      <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</div>
        <div className="break-words text-[13px] font-semibold leading-snug">{value}</div>
      </div>
    ) : null
  const cardBg = dark ? "rgba(255,255,255,0.03)" : "#FBF6E9"
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      {/* Computer: products on the left; delivery, payment and total on the right (no long scroll) */}
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl md:max-w-3xl"
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
          <div className="mt-3 flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${i === step ? "order-step-current" : i < step ? "order-step-done" : ""}`}
                    style={{ background: i <= step ? C.mustard : BORDER, animationDelay: `${i * 180}ms` }}
                  />
                  <div className="mt-1 whitespace-nowrap text-center" style={{ color: i === step ? C.mustard : MUTED, fontSize: "0.58rem", fontWeight: i === step ? 700 : 400 }}>
                    {s}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  // The line between two reached steps fills from left to right, one after another
                  <div className="mb-4 h-0.5 flex-1 overflow-hidden" style={{ background: BORDER }}>
                    {i < step && <div className="order-line-fill h-full" style={{ background: C.mustard, animationDelay: `${i * 180 + 90}ms` }} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:overflow-hidden">
          {/* Products: photo, name, unit price and subtotal; below, one short line per sauce set, addition and soda */}
          <div className="space-y-2 p-4 md:overflow-y-auto md:p-5">
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

          {/* Delivery, payment, total and the transfer voucher */}
          <div className="space-y-3 border-t p-4 md:overflow-y-auto md:border-l md:border-t-0 md:p-5" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {field("Recibe", order.nombre)}
              {field("Teléfono", order.telefono)}
              {order.tipoEntrega === "domicilio" && field("Barrio", order.barrio)}
              {field("Dirección", order.direccion, true)}
              {order.tipoEntrega === "domicilio" && order.estimacion?.distanceKm != null && (
                <div className="col-span-2 text-xs" style={{ color: MUTED }}>
                  Distancia aproximada en línea recta: {order.estimacion.distanceKm.toFixed(1)} km
                </div>
              )}
              {order.tipoEntrega === "domicilio" && order.costoDomicilio != null && (
                <div className="col-span-2 flex justify-between text-xs" style={{ color: MUTED }}>
                  <span>Costo del domicilio</span>
                  <span className="font-semibold">{fmt(order.costoDomicilio)}</span>
                </div>
              )}
              {order.estimacion?.estimatedMinutes != null && (
                <div className="col-span-2 flex justify-between text-xs" style={{ color: MUTED }}>
                  <span>Tiempo estimado inicial</span>
                  <span className="font-semibold">{formatDuration(order.estimacion.estimatedMinutes)}</span>
                </div>
              )}
              {field("Pago", order.pago)}
              {field("Estado del pago", order.paymentStatus)}
              {field("Notas", order.notas, true)}
            </div>
            {order.paymentStatus === "Rechazado" && order.paymentRejectionReason && (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ background: `${C.red}12`, color: C.red }}>
                <strong>Motivo de rechazo:</strong> {order.paymentRejectionReason}
              </div>
            )}
            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${C.mustard}14` }}>
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
