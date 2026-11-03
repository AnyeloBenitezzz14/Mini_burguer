import { useState } from "react"

// Product picture: a click shows it big and complete; another click puts it back
export default function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [zoomed, setZoomed] = useState(false)
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setZoomed(true)}
        title="Toca para ver más grande"
        className={`${className ?? ""} cursor-zoom-in`}
      />
      {zoomed && (
        <div
          className="fixed inset-0 z-[90] flex cursor-zoom-out flex-col items-center justify-center gap-3 p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label={alt}
        >
          <img src={src} alt={alt} className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
          <span className="text-xs text-white/70">Toca para volver</span>
        </div>
      )}
    </>
  )
}
