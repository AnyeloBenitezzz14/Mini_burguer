import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// Picture (a product photo, the payment QR): a click or Enter shows it big and complete; another click or Escape puts it back
// zoomClassName: how the big one looks (default: its own size, up to the screen)
export default function ZoomableImage({ src, alt, className, zoomClassName = "max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" }: { src: string; alt: string; className?: string; zoomClassName?: string }) {
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    if (!zoomed) return
    const close = (event: KeyboardEvent) => event.key === "Escape" && setZoomed(false)
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [zoomed])
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setZoomed(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setZoomed(true)
          }
        }}
        role="button"
        tabIndex={0}
        title="Toca para ver más grande"
        className={`${className ?? ""} cursor-zoom-in`}
      />
      {/* On <body>: inside a panel with a transform (the admin's side detail) a fixed layer would stay inside the panel */}
      {zoomed && createPortal(
        <div
          className="fixed inset-0 z-[90] flex cursor-zoom-out flex-col items-center justify-center gap-3 p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label={alt}
        >
          <img src={src} alt={alt} className={zoomClassName} />
          <span className="text-xs text-white/70">Toca para volver</span>
        </div>,
        document.body,
      )}
    </>
  )
}
