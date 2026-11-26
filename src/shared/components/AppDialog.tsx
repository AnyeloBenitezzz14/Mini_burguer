import { useEffect, useRef, useState } from "react"
import { C } from "@/shared/styles/theme"

// The app's own dialogs instead of the browser's alert/confirm (those break the look and block the phone):
//   await appAlert("No se pudo guardar.")            → closes with «Entendido»
//   if (await appConfirm("¿Quitar este comprobante?", { confirmText: "Quitar", danger: true })) …
// <AppDialogHost /> is mounted once (main.tsx) and shows them one at a time.
type Request = {
  message: string
  title?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  kind: "alert" | "confirm"
  resolve: (ok: boolean) => void
}
const queue: Request[] = []
let notify: (() => void) | null = null

const open = (r: Omit<Request, "resolve">) =>
  new Promise<boolean>((resolve) => {
    queue.push({ ...r, resolve })
    notify?.()
  })

export const appAlert = (message: string, title?: string) => open({ kind: "alert", message, title }).then(() => undefined)
export const appConfirm = (
  message: string,
  options: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean } = {},
) => open({ kind: "confirm", message, ...options })

export default function AppDialogHost() {
  const [, force] = useState(0)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    notify = () => force((n) => n + 1)
    return () => {
      notify = null
    }
  }, [])
  const current = queue[0]
  useEffect(() => {
    confirmRef.current?.focus()
  }, [current])
  if (!current) return null
  const close = (ok: boolean) => {
    queue.shift()
    current.resolve(ok)
    force((n) => n + 1)
  }
  const isConfirm = current.kind === "confirm"
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close(false)
      }}
    >
      <div
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="w-full max-w-sm rounded-2xl p-5 shadow-2xl"
        style={{ background: "var(--app-dialog-bg, #fff)", color: "var(--app-dialog-text, #1A1714)" }}
      >
        <h3 id="app-dialog-title" className="text-base font-bold">
          {current.title ?? (isConfirm ? "¿Estás seguro?" : "Aviso")}
        </h3>
        <p id="app-dialog-message" className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ opacity: 0.8 }}>
          {current.message}
        </p>
        <div className="mt-5 flex gap-2.5">
          {isConfirm && (
            <button
              type="button"
              onClick={() => close(false)}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: "rgba(127,127,127,0.14)" }}
            >
              {current.cancelText ?? "Cancelar"}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={() => close(true)}
            className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
            style={{ background: current.danger ? C.red : C.mustard, color: "#fff" }}
          >
            {current.confirmText ?? (isConfirm ? "Sí, continuar" : "Entendido")}
          </button>
        </div>
      </div>
    </div>
  )
}
