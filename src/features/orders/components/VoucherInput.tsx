import { readVoucher } from "@/features/orders/services/orders.service"
import { C } from "@/shared/styles/theme"

export default function VoucherInput({
  value,
  onChange,
}: {
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <label
      className="block cursor-pointer rounded-2xl p-3 text-center text-xs font-semibold"
      style={{ border: `1.5px dashed ${C.mustard}`, color: C.mustard }}
    >
      {value && (
        <img
          src={value}
          alt="Comprobante de pago"
          className="mx-auto max-h-48 rounded-xl mb-2 object-contain"
        />
      )}
      {value ? "Cambiar comprobante" : "📎 Subir comprobante de pago"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) onChange(await readVoucher(f))
        }}
      />
    </label>
  )
}
