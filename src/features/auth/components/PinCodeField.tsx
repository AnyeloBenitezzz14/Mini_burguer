import { useState } from "react"
import FieldError from "@/shared/components/FieldError"
import { C } from "@/shared/styles/theme"

export default function PinCodeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold" style={{ color: C.dark }}>
        {label}
      </label>
      <div
        className="relative"
        onClick={(event) => event.currentTarget.querySelector("input")?.focus()}
      >
        <div className="mx-auto grid w-fit grid-cols-6 gap-1.5 sm:gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => {
            const activeIndex = Math.min(value.length, 5)
            const active = focused && index === activeIndex
            return (
              <div
                key={index}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold transition-all sm:h-12 sm:w-12 sm:rounded-xl"
                style={{
                  background: "#FBF8F0",
                  border: `1.5px solid ${error ? C.red : active ? C.mustard : "rgba(182,140,28,0.2)"}`,
                  color: C.dark,
                  boxShadow: active && !error ? "0 0 0 3px rgba(182,140,28,0.12)" : "0 2px 7px rgba(54,57,63,0.04)",
                }}
              >
                {value[index] || ""}
              </div>
            )
          })}
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          aria-invalid={!!error}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>
      <FieldError msg={error} />
    </div>
  )
}
