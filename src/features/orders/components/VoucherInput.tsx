import { useState } from "react"
import { readVoucher } from "@/features/orders/services/orders.service"
import { checkReceipt } from "@/features/orders/utils/receipt"
import { appConfirm } from "@/shared/components/AppDialog"
import { C } from "@/shared/styles/theme"

// Payment proof picker. With `onRemove`, a chosen image can be taken back (a wrong screenshot, say).
// With `reference`, also asks for the amount sent (what the validator checks).
export default function VoucherInput({
  value,
  onChange,
  onRemove,
  label,
  reference,
}: {
  value?: string
  onChange: (v: string) => void
  onRemove?: () => void
  label?: string
  reference?: {
    amount: string
    expected?: number
    onAmount: (v: string) => void
  }
}) {
  const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`
  // Reading the image's text to see if it's a transfer receipt (a few seconds the first time)
  const [checking, setChecking] = useState(false)
  const pick = async (file: File) => {
    const image = await readVoucher(file)
    setChecking(true)
    const { ok } = await checkReceipt(image)
    setChecking(false)
    if (
      !ok &&
      !(await appConfirm(
        "No encontramos datos de una transferencia en esta imagen (banco, valor, referencia o «transferencia exitosa»). Sube la captura que te muestra Nequi o Bancolombia al terminar el pago.",
        { title: "Esta imagen no parece un comprobante", confirmText: "Es mi comprobante, usarla", cancelText: "Elegir otra imagen" },
      ))
    )
      return
    onChange(image)
  }
  const short = !!reference?.expected && Number(reference.amount) > 0 && Number(reference.amount) < reference.expected
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label
          className="block cursor-pointer rounded-2xl p-3 text-center text-xs font-semibold"
          style={{ border: `1.5px dashed ${C.mustard}`, color: C.mustard }}
        >
          {value && <img src={value} alt="Comprobante de pago" className="mx-auto mb-2 max-h-48 rounded-xl object-contain" />}
          {checking ? "Revisando el comprobante…" : label ?? (value ? "Cambiar comprobante" : "📎 Subir comprobante de pago")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={checking}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (f) pick(f)
            }}
          />
        </label>
        {value && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar este comprobante"
            title="Quitar este comprobante"
            className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm font-bold shadow"
            style={{ background: "#fff", color: C.red, border: `1px solid ${C.red}55` }}
          >
            ✕
          </button>
        )}
      </div>
      {reference && (
        <div className="grid gap-2">
          <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: "rgba(30,30,30,0.6)" }}>
            Valor que transferiste *
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={reference.amount}
              onChange={(e) => reference.onAmount(e.target.value)}
              placeholder={reference.expected ? String(reference.expected) : "$"}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "#fff", border: `1.5px solid ${short ? C.red : "rgba(30,30,30,0.15)"}` }}
            />
          </label>
          {reference.expected ? (
            <span className="text-[11px]" style={{ color: short ? C.red : "rgba(30,30,30,0.55)" }}>
              {short
                ? `No alcanza: debes transferir ${fmtCOP(reference.expected)}.`
                : `Debes transferir ${fmtCOP(reference.expected)}. Revisamos que la imagen no se haya usado en otro pedido.`}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
