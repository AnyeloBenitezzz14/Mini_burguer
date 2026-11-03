import { useEffect, useRef, useState } from "react"

// «<producto> se agregó al carrito» for a few seconds
export function useCartNotice() {
  const [message, setMessage] = useState("")
  const timeoutRef = useRef<number | null>(null)
  const showCartNotice = (productName: string) => {
    setMessage(`${productName} se agregó al carrito`)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setMessage(""), 2600)
  }
  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )
  return [message, showCartNotice] as const
}

export default function CartAddedNotice({ message, dark = false }: { message: string; dark?: boolean }) {
  if (!message) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
      style={{ background: dark ? "#2a2116" : "#2E7D60", color: "#fff" }}
    >
      <span aria-hidden="true">✓</span>
      {message}
    </div>
  )
}
