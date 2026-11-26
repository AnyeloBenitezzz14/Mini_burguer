import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { normalizeName } from "@/shared/utils/format"
import type { tk } from "@/shared/styles/theme"

export type Suggestion = { value: string; hint?: string }

type Props = {
  value?: string
  // Starting text when the box keeps its own text (no `value`)
  initial?: string
  onChange?: (value: string) => void
  // Called when an option is chosen (click or Enter); the ficha search uses it and then clears
  onPick?: (value: string) => void
  clearOnPick?: boolean
  options: (string | Suggestion)[]
  t: ReturnType<typeof tk>
  placeholder?: string
  className?: string
  style?: CSSProperties
  inputProps?: Record<string, unknown>
  empty?: ReactNode
}

// Search box with a themed suggestion list (replaces the browser's <datalist>, which can't be styled)
export default function SuggestInput({ value, initial, onChange, onPick, clearOnPick, options, t, placeholder, className, style, inputProps, empty = "Sin coincidencias" }: Props) {
  const [own, setOwn] = useState(initial ?? "")
  const text = value ?? own
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const listId = useId()
  const all = options.map((o) => (typeof o === "string" ? { value: o } : o))
  const q = normalizeName(text)
  // An exact pick shows the whole list again so it can be changed
  const exact = all.some((o) => normalizeName(o.value) === q)
  const shown = (q && !exact ? all.filter((o) => normalizeName(`${o.value} ${o.hint ?? ""}`).includes(q)) : all).slice(0, 50)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])
  useEffect(() => setActive(0), [q])

  const set = (v: string) => { if (value === undefined) setOwn(v); onChange?.(v) }
  const pick = (v: string) => {
    onPick?.(v)
    set(clearOnPick ? "" : v)
    setOpen(false)
  }
  const mark = (s: string) => {
    const i = q ? normalizeName(s).indexOf(q) : -1
    if (i < 0) return s
    return <>{s.slice(0, i)}<b style={{ color: t.text }}>{s.slice(i, i + q.length)}</b>{s.slice(i + q.length)}</>
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <input
        {...inputProps}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        className={className}
        style={style}
        onFocus={() => setOpen(true)}
        onChange={(e) => { set(e.target.value); setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)) }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          else if (e.key === "Enter" && open && shown[active]) { e.preventDefault(); pick(shown[active].value) }
          else if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false) }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-1.5 max-h-64 overflow-y-auto rounded-xl p-1 text-sm shadow-lg"
          style={{ background: t.card, border: `1px solid ${t.border}`, scrollbarWidth: "thin" }}
        >
          {shown.length ? shown.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value) }}
              onMouseEnter={() => setActive(i)}
              className="flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2"
              style={{ background: i === active ? t.input : "transparent", color: t.muted }}
            >
              <span className="min-w-0 truncate" style={{ color: t.text }}>{mark(o.value)}</span>
              {o.hint && <span className="flex-shrink-0 text-xs tabular-nums">{o.hint}</span>}
            </li>
          )) : <li className="px-3 py-2 text-xs" style={{ color: t.muted }}>{empty}</li>}
        </ul>
      )}
    </div>
  )
}
