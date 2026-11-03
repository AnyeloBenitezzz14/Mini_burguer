import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function PaymentRejectionModal(adminState: AdminPanelState): ReactNode {
  const {
    paymentRejectionError,
    paymentRejectionReason,
    paymentRejectionTarget,
    rejectTransferPayment,
    rows,
    setPaymentRejectionError,
    setPaymentRejectionReason,
    setPaymentRejectionTarget,
    t,
  } = adminState
  if (paymentRejectionTarget === null) return null
  const order = rows.pedidos?.[paymentRejectionTarget]
  if (!order) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={() => setPaymentRejectionTarget(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-rejection-title"
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="payment-rejection-title" className="text-base font-bold" style={{ color: t.text }}>
          Rechazar transferencia
        </h3>
        <p className="mt-2 text-sm" style={{ color: t.muted }}>
          El pedido {String(order[0])} no se enviará a producción. Escribe el motivo para que quede guardado en el pedido.
        </p>
        <textarea
          autoFocus
          rows={3}
          value={paymentRejectionReason}
          onChange={(event) => {
            setPaymentRejectionReason(event.target.value)
            setPaymentRejectionError("")
          }}
          placeholder="Ej.: comprobante no válido o pago no recibido"
          aria-label="Motivo del rechazo"
          className="mt-4 w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: t.input,
            border: `1px solid ${paymentRejectionError ? C.red : t.inputB}`,
            color: t.text,
          }}
        />
        {paymentRejectionError && (
          <p className="mt-2 text-xs" role="alert" style={{ color: C.red }}>
            {paymentRejectionError}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setPaymentRejectionTarget(null)}
            className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: t.input, color: t.muted }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={rejectTransferPayment}
            className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
            style={{ background: C.red, color: "#fff" }}
          >
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  )
}
