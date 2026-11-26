import { useState } from "react"
import type { FieldErrors } from "@/shared/types"

// Live validation: a field shows its error once the user leaves it (or tries to submit),
// and from then on it updates with every keystroke
export default function useLiveErrors(all: FieldErrors) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tried, setTried] = useState(false)
  const errors: FieldErrors = Object.fromEntries(Object.entries(all).filter(([key]) => tried || touched[key]))
  const touch = (key: string) => () => setTouched((current) => (current[key] ? current : { ...current, [key]: true }))
  return { errors, touch, tried, setTried }
}
