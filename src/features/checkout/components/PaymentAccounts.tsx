import { useState } from "react"
import qrBancolombia from "@/imports/qr-bancolombia.png"
import { C } from "@/shared/styles/theme"

// Where the client sends the money: El Parche's Bancolombia QR, its savings account and its two keys (llaves)
export const PAYMENT_ACCOUNTS = [
  { label: "Bancolombia · cuenta de ahorros", number: "02177586911", owner: "Zuleima Ochoa Ochoa" },
  { label: "Llave 1", number: "1044501637", owner: "Ron Bedoya P" },
  { label: "Llave 2", number: "1035222927", owner: "Zuleima Ochoa" },
]

export default function PaymentAccounts({ amount, compact = false }: { amount?: string; compact?: boolean }) {
  const [copied, setCopied] = useState("")
  const copy = (number: string) => {
    navigator.clipboard?.writeText(number).then(() => {
      setCopied(number)
      window.setTimeout(() => setCopied(""), 1500)
    })
  }
  return (
    <div className={`grid items-start gap-4 ${compact ? "" : "sm:grid-cols-[auto_1fr]"}`}>
      <div className="flex flex-col items-center">
        <img
          src={qrBancolombia}
          alt="Código QR de Bancolombia de Parche De Las Mini B (Zuleima Aide Ochoa)"
          className="rounded-xl bg-white object-contain p-1.5"
          style={{ width: compact ? 140 : 170, height: compact ? 140 : 170, border: "1px solid rgba(30,30,30,0.12)" }}
        />
        <span className="mt-1 text-[11px]" style={{ color: "rgba(30,30,30,0.55)" }}>Escanéalo desde tu app</span>
        {amount && (
          <span className="mt-1 text-center text-xs" style={{ color: "rgba(30,30,30,0.55)" }}>
            A pagar <strong className="block text-lg font-black" style={{ color: C.mustard }}>{amount}</strong>
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {PAYMENT_ACCOUNTS.map((a) => (
          <li key={a.number} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: "#fff", border: "1px solid rgba(30,30,30,0.1)" }}>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold" style={{ color: "rgba(30,30,30,0.55)" }}>{a.label}</span>
              <span className="block font-mono text-base font-bold tracking-wide" style={{ color: C.dark }}>{a.number}</span>
              <span className="block text-xs" style={{ color: "rgba(30,30,30,0.7)" }}>{a.owner}</span>
            </span>
            <button
              type="button"
              onClick={() => copy(a.number)}
              aria-label={`Copiar ${a.label}: ${a.number}`}
              className="flex-shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold"
              style={{ background: copied === a.number ? "#2E7D60" : `${C.mustard}18`, color: copied === a.number ? "#fff" : C.mustard }}
            >
              {copied === a.number ? "Copiado ✓" : "Copiar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
