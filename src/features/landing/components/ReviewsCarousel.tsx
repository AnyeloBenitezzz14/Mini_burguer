import { useEffect, useRef, useState } from "react"
import { REVIEWS } from "@/features/landing/data/reviews"
import { C } from "@/shared/styles/theme"

const Star = ({ on, color }: { on: boolean; color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={on ? color : "none"} stroke={color} strokeWidth="1.6">
    <path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9L12 2.8Z" strokeLinejoin="round" />
  </svg>
)

const LOOP_REVIEWS = [...REVIEWS, ...REVIEWS]

export default function ReviewsCarousel({ dark }: { dark: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number } | null>(null)
  const touching = useRef(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const canHover = window.matchMedia("(hover: hover)")
    let frameId: number
    let lastTime: number | undefined
    let remainder = 0

    const advance = (time: number) => {
      frameId = window.requestAnimationFrame(advance)
      const elapsed = Math.min(time - (lastTime ?? time), 50)
      lastTime = time

      const row = track.current
      if (!row || reducedMotion.matches || document.hidden || drag.current || touching.current) return
      if (row.matches(":focus-within") || (canHover.matches && row.matches(":hover"))) return

      remainder += elapsed * 0.036
      const step = Math.floor(remainder)
      if (step === 0) return
      remainder -= step

      const first = row.firstElementChild as HTMLElement | null
      const duplicate = row.children.item(REVIEWS.length) as HTMLElement | null
      if (!first || !duplicate) return

      const loopWidth = duplicate.offsetLeft - first.offsetLeft
      if (loopWidth > 0) row.scrollLeft = (Math.max(0, row.scrollLeft) + step) % loopWidth
    }

    frameId = window.requestAnimationFrame(advance)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  if (!REVIEWS.length) return null

  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const GOLD = "var(--brand-gold)"
  const GOLD_INK = "var(--brand-gold-ink)"
  // Each card takes one of the brand's three surfaces, in turn
  const themes = [
    { bg: GOLD, ink: GOLD_INK, star: GOLD_INK, avatar: GOLD, avatarInk: GOLD_INK },
    { bg: "#1F1A13", ink: "#FAF3E0", star: GOLD, avatar: GOLD, avatarInk: GOLD_INK },
    { bg: C.red, ink: "#fff", star: GOLD, avatar: C.red, avatarInk: "#fff" },
  ]

  const end = () => {
    drag.current = null
    setDragging(false)
  }

  return (
    <div className="mb-14">
      <h3 className="landing-display-title mb-6 text-3xl sm:text-4xl" style={{ color: TEXT }}>
        Lo que dicen <span style={{ color: GOLD }}>en el parche</span>
      </h3>

      <div
        ref={track}
        tabIndex={0}
        role="region"
        aria-label="Reseñas de clientes (desliza o usa las flechas)"
        className={`reviews-track -mx-1 flex items-stretch gap-6 overflow-x-auto px-1 pb-6 pt-2 outline-none ${dragging ? "reviews-track-dragging" : ""}`}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") touching.current = true
          if (e.pointerType !== "mouse" || !track.current) return
          drag.current = { x: e.clientX, left: track.current.scrollLeft }
          setDragging(true)
          track.current.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current || !track.current) return
          track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x)
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onTouchEnd={() => { touching.current = false }}
        onTouchCancel={() => { touching.current = false }}
        onKeyDown={(e) => {
          if (!track.current || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return
          e.preventDefault()
          const [first, second] = Array.from(track.current.children) as HTMLElement[]
          if (!first || !second) return
          track.current.scrollBy({ left: (second.offsetLeft - first.offsetLeft) * (e.key === "ArrowRight" ? 1 : -1) })
        }}
      >
        {LOOP_REVIEWS.map((review, i) => {
          const index = i % REVIEWS.length
          const duplicate = i >= REVIEWS.length
          const theme = themes[index % themes.length]
          return (
            // A chat bubble with its tail, and the person below it: unlike the square info cards around it
            <figure
              key={review.name + i}
              aria-hidden={duplicate || undefined}
              className={`flex w-[78%] flex-shrink-0 flex-col pt-3 sm:w-[310px] ${duplicate ? "motion-reduce:hidden" : ""}`}
            >
              <div
                className="reviews-bubble relative min-h-48 rounded-[28px] rounded-bl-md p-5 sm:p-6"
                style={{ background: theme.bg, ["--bubble" as string]: theme.bg }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-0.5" role="img" aria-label={`${review.stars} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} on={s < review.stars} color={theme.star} />
                    ))}
                  </div>
                </div>
                <blockquote className="mt-4 line-clamp-4 text-base font-semibold leading-snug sm:text-lg" style={{ color: theme.ink }}>
                  “{review.text}”
                </blockquote>
              </div>
              <figcaption className="mt-5 flex items-center gap-3 pl-2">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-black"
                  style={{ background: theme.avatar, color: theme.avatarInk }}
                >
                  {review.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-base font-bold" style={{ color: TEXT }}>{review.name}</span>
                  <span className="block text-sm" style={{ color: GOLD }}>Reseña en {review.source}</span>
                </span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
