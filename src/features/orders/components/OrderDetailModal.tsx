import { useState } from "react"
import { itemTotal } from "@/features/checkout/utils/cart"
import { PRODUCTS, isSodaName, sodaPhoto } from "@/features/menu/data/products"
import OrderItemPhoto from "@/features/orders/components/OrderItemPhoto"
import PaymentAccounts from "@/features/checkout/components/PaymentAccounts"
import VoucherInput from "@/features/orders/components/VoucherInput"
import { appConfirm } from "@/shared/components/AppDialog"
import { ORDER_STEPS, clientPaymentLabel, clientStatusLabel } from "@/features/orders/utils/orders"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { Order } from "@/shared/types"
import { fmt, formatDuration } from "@/shared/utils/format"

export default function OrderDetailModal({
  order,
  dark,
  onClose,
  onVoucher,
  onRemoveVoucher,
  onReturn,
}: {
  order: Order
  dark: boolean
  onClose: () => void
  onVoucher: (id: string, voucher: string, valor: number, doubtful?: boolean) => Promise<string>
  onRemoveVoucher: (id: string, index: number) => Promise<string>
  onReturn: (id: string, motivo: string) => Promise<string>
}) {
  // Return: asked within 24 h of ordering, once it was delivered
  const [returnReason, setReturnReason] = useState<string | null>(null)
  const [returnError, setReturnError] = useState("")
  const returnDeadline = order.createdAt ? new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000 : 0
  // A new proof: its image, the bank's reference and the amount; sent with «Enviar comprobante»
  const [draft, setDraft] = useState({ image: "", amount: "", doubtful: false })
  const [proofError, setProofError] = useState("")
  const [busy, setBusy] = useState(false)
  // What's owed now: the 50% deposit until it's approved, then the rest; otherwise the total
  const owed = order.deposit ? (order.paymentStatus === "Abonado" ? order.total - order.deposit : order.deposit) : order.total
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
                {clientStatusLabel(order.status)}
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
                  <span className="font-semibold">{clientPaymentLabel(order.paymentStatus)}</span>
                </div>
              )}
              {!!order.deposit && (
                <div className="mt-2 border-t pt-2 text-sm" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: MUTED }}>{["Abonado", "Pagado"].includes(order.paymentStatus ?? "") ? "Valor registrado" : order.mixed ? `Por ${order.pago}` : "Abono (50%)"}</span>
                    <span className="font-semibold">{fmt(order.deposit)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: MUTED }}>{order.mixed ? "En efectivo al recibir" : "Saldo al recibir"}</span>
                    <span className="font-semibold">{fmt(order.paymentStatus === "Pagado" ? 0 : Math.max(0, order.total - order.deposit))}</span>
                  </div>
                </div>
              )}
            </section>

            {order.notas && (
              <section className="rounded-xl px-3.5 py-3" style={{ background: cardBg }}>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>Notas del pedido</h4>
                <p className="text-sm leading-relaxed">{order.notas}</p>
              </section>
            )}
            {order.paymentStatus === "Rechazado" && (
              <div role="alert" className="rounded-xl px-3 py-2 text-xs" style={{ background: `${C.red}12`, color: C.red }}>
                <strong className="block">Comprobante rechazado, intenta mandar otro comprobante</strong>
                {order.paymentRejectionReason && <span className="mt-1 block">{order.paymentRejectionReason}</span>}
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl px-4 py-3.5" style={{ background: `${C.mustard}14` }}>
              <span className="text-sm font-bold">Total</span>
              <span className="text-xl font-black" style={{ color: C.mustard }}>{fmt(order.total)}</span>
            </div>
            {(order.pago !== "Efectivo" || (order.proofs?.length ?? 0) > 0) && (() => {
              // Every proof sent stays (deposit, rest, a new one after a rejected one...). One sent by mistake can be
              // taken back while nobody has approved it; a new one goes through the validator
              const sent = order.proofs?.length ? order.proofs : order.voucher ? [{ image: order.voucher }] : []
              const open = !["Cancelado", "Entregado"].includes(order.status)
              const canRemove = open && !["Abonado", "Pagado"].includes(String(order.paymentStatus))
              const canAdd = open && order.paymentStatus !== "Pagado" && sent.length < 5
              const send = async () => {
                if (!draft.image) return setProofError("Sube la imagen del comprobante.")
                if (!(Number(draft.amount) >= owed)) return setProofError(`El valor debe cubrir ${fmt(owed)}.`)
                setBusy(true)
                const error = await onVoucher(order.id, draft.image, Number(draft.amount), draft.doubtful)
                setBusy(false)
                setProofError(error)
                if (!error) setDraft({ image: "", amount: "", doubtful: false })
              }
              const remove = async (index: number) => {
                if (!(await appConfirm("El comprobante se quitará de tu pedido. Si te equivocaste de imagen, puedes subir la correcta.", { title: "¿Quitar este comprobante?", confirmText: "Quitar", danger: true }))) return
                setProofError(await onRemoveVoucher(order.id, index))
              }
              return (
                <section className="rounded-xl px-3.5 py-3" style={{ background: cardBg }}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                    Comprobantes enviados ({sent.length})
                  </h4>
                  {sent.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sent.map((proof, index) => (
                        <div key={index} className="relative overflow-hidden rounded-lg" style={{ border: `1px solid ${BORDER}`, background: dark ? "#1E1C18" : "#fff" }}>
                          <a href={proof.image} target="_blank" rel="noreferrer" className="block">
                            <img src={proof.image} alt={`Comprobante ${index + 1}`} className="h-24 w-full object-cover" />
                          </a>
                          <div className="px-2 py-1 text-[10px] leading-tight" style={{ color: MUTED }}>
                            {proof.reference ? <span className="block truncate">Ref. {proof.reference}</span> : null}
                            {proof.amount ? <span className="block">{fmt(proof.amount)}</span> : null}
                          </div>
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              aria-label={`Quitar el comprobante ${index + 1}`}
                              title="Quitar este comprobante"
                              className="absolute right-1 top-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-xs font-bold shadow"
                              style={{ background: "#fff", color: C.red }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {canAdd ? (
                    <div className="flex flex-col gap-2">
                      {/* Where to send it, right where the proof is uploaded */}
                      <details className="rounded-xl px-3 py-2" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${BORDER}` }} open={!sent.length}>
                        <summary className="cursor-pointer text-xs font-bold" style={{ color: C.mustard }}>Datos para pagar ({fmt(owed)})</summary>
                        <div className="mt-2"><PaymentAccounts compact amount={fmt(owed)} /></div>
                      </details>
                      <VoucherInput
                        value={draft.image}
                        label={draft.image ? "Cambiar imagen" : sent.length ? "📎 Enviar otro comprobante" : undefined}
                        onChange={(v, doubtful) => {
                          setDraft((d) => ({ ...d, image: v, amount: d.amount || String(owed), doubtful: !!doubtful }))
                          setProofError("")
                        }}
                        onRemove={() => setDraft((d) => ({ ...d, image: "" }))}
                        reference={draft.image ? {
                          amount: draft.amount,
                          expected: owed,
                          onAmount: (v) => setDraft((d) => ({ ...d, amount: v })),
                        } : undefined}
                      />
                      {draft.image && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={send}
                          className="cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
                          style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
                        >
                          {busy ? "Enviando…" : "Enviar comprobante"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      {sent.length >= 5 ? "Ya enviaste 5 comprobantes: quita uno para enviar otro." : "Este pedido ya no recibe comprobantes."}
                    </p>
                  )}
                  {proofError && (
                    <p role="alert" className="mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ background: `${C.red}12`, color: C.red }}>
                      {proofError}
                    </p>
                  )}
                </section>
              )
            })()}
            {(order.returnRequest || order.status === "Entregado") && (
              <section className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${BORDER}` }}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: C.mustard }}>
                  Devolución
                </h4>
                {order.returnRequest ? (
                  <p className="text-sm">
                    La pediste el {new Date(order.returnRequest.requestedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                    <span className="mt-1 block text-xs" style={{ color: MUTED }}>«{order.returnRequest.reason}» · Te escribiremos para resolverla.</span>
                  </p>
                ) : Date.now() > returnDeadline ? (
                  <p className="text-xs" style={{ color: MUTED }}>
                    El plazo para pedir la devolución (24 horas después de hacer el pedido) ya pasó.
                  </p>
                ) : returnReason === null ? (
                  <>
                    <p className="mb-2 text-xs" style={{ color: MUTED }}>
                      ¿Algo salió mal? Puedes pedirla hasta el {new Date(returnDeadline).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReturnReason("")}
                      className="w-full cursor-pointer rounded-xl py-2.5 text-sm font-bold"
                      style={{ background: `${C.mustard}18`, color: C.mustard, border: `1px solid ${C.mustard}40` }}
                    >
                      Pedir devolución
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: MUTED }}>
                      ¿Qué pasó con tu pedido?
                      <textarea
                        value={returnReason}
                        onChange={(e) => {
                          setReturnReason(e.target.value.slice(0, 300))
                          setReturnError("")
                        }}
                        rows={3}
                        placeholder="Por ejemplo: la hamburguesa llegó fría o faltó un producto."
                        aria-invalid={!!returnError}
                        className="resize-none rounded-xl px-3 py-2 text-sm font-normal outline-none"
                        style={{ background: dark ? "rgba(255,255,255,0.05)" : "#fff", border: `1.5px solid ${returnError ? C.red : BORDER}`, color: TEXT }}
                      />
                    </label>
                    {returnError && (
                      <p role="alert" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ background: `${C.red}12`, color: C.red }}>
                        {returnError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReturnReason(null)
                          setReturnError("")
                        }}
                        className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
                        style={{ border: `1px solid ${BORDER}`, color: TEXT }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (returnReason.trim().length < 10) return setReturnError("Cuéntanos qué pasó (mínimo 10 caracteres).")
                          setBusy(true)
                          const error = await onReturn(order.id, returnReason.trim())
                          setBusy(false)
                          setReturnError(error)
                          if (!error) setReturnReason(null)
                        }}
                        className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        {busy ? "Enviando…" : "Enviar solicitud"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
