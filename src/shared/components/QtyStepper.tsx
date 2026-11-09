import { useState } from "react"

// ── Add to Cart Modal (centered, with sauces/additions) ────────────────────────
// Compact "− amount +" where the amount can also be typed (0-99). While typing it may be empty; on leaving it
// shows the real amount again
export default function QtyStepper({ value, onChange, label, color, text, disabledPlus, max = 99 }: {
  value: number
  onChange: (n: number) => void
  label: string
  color: string
  text: string
  disabledPlus?: boolean
  max?: number
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const on = value > 0
  const btn = "flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-sm leading-none transition-transform active:scale-90 disabled:cursor-default disabled:opacity-30"
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={!on} aria-label={`Quitar ${label}`} className={btn} style={{ border: `1.5px solid ${text}40`, color: text }}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 2)
          setDraft(digits)
          onChange(Math.min(max, Number(digits) || 0))
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => setDraft(null)}
        aria-label={`Cantidad de ${label}`}
        className="w-6 bg-transparent text-center text-sm font-bold tabular-nums outline-none"
        style={{ color: on ? color : text }}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabledPlus || value >= max}
        aria-label={`Agregar ${label}`}
        className={btn}
        style={{ background: on ? color : "transparent", border: `1.5px solid ${on ? color : `${text}40`}`, color: on ? "#fff" : text }}
      >
        +
      </button>
    </div>
  )
}
