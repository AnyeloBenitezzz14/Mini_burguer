import { useState } from "react"
import FieldError from "@/shared/components/FieldError"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"

// ── Shared UI ──────────────────────────────────────────────────────────────────
export default function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  error,
  disabled,
}: {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: string
  disabled?: boolean
}) {
  const baseBorder = error ? C.red : "rgba(30,30,30,0.12)"
  // Password fields get an eye button to show/hide what was typed
  const isPassword = type === "password"
  const [showPass, setShowPass] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold"
        style={{ color: "rgba(30,30,30,0.5)" }}
      >
        {label}
        {required && !label.trim().endsWith("*") && " *"}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPass ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${isPassword ? "pr-10" : ""} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          style={{
            background: "rgba(30,30,30,0.05)",
            border: `1.5px solid ${baseBorder}`,
            color: "#1A1714",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = error ? C.red : C.mustard)}
          onBlur={(e) => (e.currentTarget.style.borderColor = baseBorder)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPass}
            className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer hover:opacity-70 [&_svg]:w-4 [&_svg]:h-4"
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            {showPass ? Ico.eyeOff : Ico.eye}
          </button>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  )
}
