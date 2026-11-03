import { C } from "@/shared/styles/theme"

export default function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="text-[11px] leading-snug" style={{ color: C.red }} role="alert">
      {msg}
    </p>
  )
}
