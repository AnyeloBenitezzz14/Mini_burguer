import { ORDER_STEPS, isTransferPaymentMethod } from "@/features/orders/utils/orders"
import { C, badgeSt } from "@/shared/styles/theme"
import type { Order } from "@/shared/types"
import { fmt, formatDuration } from "@/shared/utils/format"

export default function OrderList({
  orders,
  dark,
  onSelect,
}: {
  orders: Order[]
  dark: boolean
  onSelect: (o: Order) => void
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"
  if (orders.length === 0)
    return (
      <div className="text-center py-10 text-sm" style={{ color: MUTED }}>
        Aún no has hecho pedidos.
      </div>
    )
  const formatOrderDescription = (order: Order) => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    // Generate a consistent imaginary date based on the order ID
    const idMatch = order.id.match(/\d+/)
    const seed = idMatch ? parseInt(idMatch[0], 10) : Math.floor(Math.random() * 1000)
    const dayIndex = seed % 7
    const day = (seed % 28) + 1
    const month = seed % 12
    return `Pedido del ${days[dayIndex]} ${day} de ${months[month]}`
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const badge = badgeSt(o.status)
        const paymentStatus =
          o.paymentStatus ??
          (o.voucher
            ? "Pendiente de verificación"
            : isTransferPaymentMethod(o.pago)
              ? "Pendiente de verificación"
              : "Pendiente")
        return (
          <div
            key={o.id}
            className="w-full rounded-2xl p-5 text-left transition-shadow hover:shadow-md sm:p-5"
            style={{
              background: dark ? "#1E1C18" : "#fff",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div className="mb-4 border-b pb-3" style={{ borderColor: BORDER }}>
              <OrderProgress status={o.status} dark={dark} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-bold leading-snug" style={{ color: TEXT }}>
                  {formatOrderDescription(o)}
                </div>
                <div className="mt-1.5 break-words text-base leading-snug" style={{ color: MUTED }}>
                  {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                </div>
                {(o.items.some((i) => i.sauces?.length || i.additions?.length)) && (
                  <div className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ color: C.mustard, background: `${C.mustard}12` }}>
                    Incluye personalizaciones
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <div className="text-xl font-black" style={{ color: C.mustard }}>
                  {fmt(o.total)}
                </div>
                <span
                  className="rounded-full px-3 py-1.5 text-sm font-semibold"
                  style={{ background: badge?.bg, color: badge?.color }}
                >
                  {o.status}
                </span>
                {paymentStatus !== "Pendiente" && (
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color:
                        paymentStatus === "Pagado"
                          ? C.forest
                          : paymentStatus === "Rechazado"
                            ? C.red
                            : C.mustard,
                    }}
                  >
                    Pago: {paymentStatus}
                  </span>
                )}
              </div>
            </div>

            {o.tipoEntrega === "domicilio" && (
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-3.5" style={{ borderColor: BORDER }}>
                {o.barrio && (
                  <span className="rounded-lg px-3 py-2 text-sm" style={{ background: dark ? "rgba(244,238,220,0.06)" : "#F8F5EC", color: TEXT }}>
                    Barrio <strong>{o.barrio}</strong>
                  </span>
                )}
                {o.costoDomicilio != null && (
                  <span className="rounded-lg px-3 py-2 text-sm" style={{ background: dark ? "rgba(244,238,220,0.06)" : "#F8F5EC", color: TEXT }}>
                    Domicilio <strong>{fmt(o.costoDomicilio)}</strong>
                  </span>
                )}
                {o.estimacion?.estimatedMinutes != null && (
                  <span className="rounded-lg px-3 py-2 text-sm" style={{ background: dark ? "rgba(244,238,220,0.06)" : "#F8F5EC", color: TEXT }}>
                    Tiempo estimado <strong>{formatDuration(o.estimacion.estimatedMinutes)}</strong>
                  </span>
                )}
                {o.estimacion?.distanceKm != null && (
                  <span className="rounded-lg px-3 py-2 text-sm" style={{ background: dark ? "rgba(244,238,220,0.06)" : "#F8F5EC", color: TEXT }}>
                    Distancia <strong>{o.estimacion.distanceKm.toFixed(1)} km</strong>
                  </span>
                )}
              </div>
            )}

            <div
              className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-sm"
              style={{ borderColor: BORDER }}
            >
              {o.nombre && (
                <div className="min-w-0">
                  <span className="block text-xs" style={{ color: MUTED }}>Recibe</span>
                  <span className="block break-words font-semibold" style={{ color: TEXT }}>{o.nombre}</span>
                </div>
              )}
              {o.telefono && (
                <div className="min-w-0">
                  <span className="block text-xs" style={{ color: MUTED }}>Teléfono</span>
                  <span className="block break-words font-semibold" style={{ color: TEXT }}>{o.telefono}</span>
                </div>
              )}
              {o.tipoEntrega === "domicilio" && o.direccion && (
                <div className="col-span-2 min-w-0">
                  <span className="block text-xs" style={{ color: MUTED }}>Dirección</span>
                  <span className="block break-words font-semibold leading-relaxed" style={{ color: TEXT }}>{o.direccion}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onSelect(o)}
              className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-bold transition hover:opacity-85 cursor-pointer"
              style={{
                background: dark ? "rgba(244,238,220,0.07)" : "#FBF7EC",
                color: C.mustard,
              }}
            >
              <span>Ver detalle del pedido</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// The order's steps: reached dots pop in one after another, the lines fill and the current step pulses
function OrderProgress({ status, dark }: { status: string; dark: boolean }) {
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.12)" : "rgba(30,30,30,0.12)"
  const steps =
    status === "Por confirmar"
      ? ["Por confirmar", ...ORDER_STEPS.slice(1)]
      : ORDER_STEPS
  const currentStep = steps.indexOf(status)

  if (status === "Cancelado" || currentStep < 0) {
    const badge = badgeSt(status)
    return (
      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: badge?.color || MUTED }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: badge?.color || MUTED }} />
        Estado del pedido: {status}
      </div>
    )
  }

  return (
    <ol aria-label={`Seguimiento del pedido: ${status}`} className="flex w-full items-start">
      {steps.map((step, index) => {
        const complete = index <= currentStep
        const active = index === currentStep
        return (
          <li key={step} className={`flex min-w-0 flex-1 items-start ${index === steps.length - 1 ? "flex-none" : ""}`}>
            <div className="flex min-w-0 flex-col items-center">
              <span
                className={`flex h-3 w-3 items-center justify-center rounded-full ${active ? "order-step-current" : complete ? "order-step-done" : ""}`}
                style={{ background: complete ? C.mustard : BORDER, animationDelay: `${index * 180}ms` }}
              />
              <span
                className="mt-1.5 max-w-full text-center text-[10px] leading-tight"
                style={{ color: active ? C.mustard : MUTED, fontWeight: active ? 700 : 500 }}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className="mt-[5px] h-0.5 min-w-2 flex-1 overflow-hidden" style={{ background: BORDER }} aria-hidden="true">
                {index < currentStep && (
                  <span className="order-line-fill block h-full" style={{ background: C.mustard, animationDelay: `${index * 180 + 90}ms` }} />
                )}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
