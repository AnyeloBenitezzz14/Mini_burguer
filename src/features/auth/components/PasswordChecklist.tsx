import { C } from "@/shared/styles/theme"
import { PASSWORD_RULES } from "@/shared/utils/validation"

const OK = "#2E7D60"

// Each requirement turns green while typing; the missing ones turn red once the field shows its errors
export default function PasswordChecklist({ pass, pass2, strict }: { pass: string; pass2: string; strict: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" aria-live="polite">
      {PASSWORD_RULES.map(([rule, ok]) => {
        const met = ok(pass)
        return (
          <li key={rule} style={{ color: met ? OK : strict ? C.red : "rgba(30,30,30,0.45)" }}>
            {met ? "✓" : "○"} {rule.charAt(0).toUpperCase() + rule.slice(1)}
          </li>
        )
      })}
      {!!pass2 && pass2 === pass && <li style={{ color: OK }}>✓ Las contraseñas coinciden</li>}
    </ul>
  )
}
