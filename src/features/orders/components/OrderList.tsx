import { isTransferPaymentMethod } from "@/features/orders/utils/orders"
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
            className="w-full text-left p-4 rounded-2xl"
            style={{
              background: dark ? "#1E1C18" : "#fff",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-sm" style={{ color: TEXT }}>
                  {formatOrderDescription(o)}
                </div>
                <div className="text-xs truncate" style={{ color: MUTED }}>
                  {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                </div>
                {(o.items.some((i) => i.sauces?.length || i.additions?.length)) && (
                  <div className="text-[11px] mt-1" style={{ color: C.mustard }}>
                    Incluye personalizaciones
                  </div>
                )}
                {o.tipoEntrega === "domicilio" && (
                  <div className="mt-2 space-y-0.5 text-[11px]" style={{ color: MUTED }}>
                    {o.barrio && <div>Barrio: {o.barrio}</div>}
                    {o.estimacion?.distanceKm != null && (
                      <div>Distancia aproximada: {o.estimacion.distanceKm.toFixed(1)} km</div>
                    )}
                    {o.costoDomicilio != null && <div>Domicilio: {fmt(o.costoDomicilio)}</div>}
                    {o.estimacion?.estimatedMinutes != null && (
                      <div>Tiempo estimado: {formatDuration(o.estimacion.estimatedMinutes)}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold" style={{ color: C.mustard }}>
                  {fmt(o.total)}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: badge?.bg, color: badge?.color }}
                >
                  {o.status}
                </span>
                {paymentStatus !== "Pendiente" && (
                  <div
                    className="mt-1 text-[10px] font-semibold"
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
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelect(o)}
              className="mt-3 w-full py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
              style={{ background: `${C.mustard}15`, color: C.mustard }}
            >
              Ver detalle
            </button>
          </div>
        )
      })}
    </div>
  )
}
