import { useRef, useState } from "react"
import { REVIEWS, REVIEWS_ARE_SAMPLE } from "@/features/landing/data/reviews"
import { C } from "@/shared/styles/theme"

const Star = ({ on, color }: { on: boolean; color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={on ? color : "none"} stroke={color} strokeWidth="1.6">
    <path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9L12 2.8Z" strokeLinejoin="round" />
  </svg>
)

// A row of review cards the visitor drags sideways with the mouse (a phone swipes it natively);
// it settles on the nearest card. The arrow keys move it too once it has focus.
export default function ReviewsCarousel({ dark }: { dark: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Invented reviews never reach the published site
  if (!REVIEWS.length || (REVIEWS_ARE_SAMPLE && import.meta.env.PROD)) return null

  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const GOLD = dark ? C.mustard : "#8D6910"
  // Each card takes one of the brand's three surfaces, in turn
  const themes = [
    { bg: C.mustard, ink: "#fff", star: "#fff", avatar: C.mustard, avatarInk: "#fff", mark: "rgba(255,255,255,0.22)" },
    { bg: "#1F1A13", ink: "#FAF3E0", star: C.mustard, avatar: C.mustard, avatarInk: "#fff", mark: `${C.mustard}33` },
    { bg: C.red, ink: "#fff", star: "#FFD37A", avatar: C.red, avatarInk: "#fff", mark: "rgba(255,255,255,0.18)" },
  ]

  const end = () => {
    drag.current = null
    setDragging(false)
  }

  return (
    <div className="mb-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="landing-display-title text-3xl sm:text-4xl" style={{ color: TEXT }}>
            Lo que dicen <span style={{ color: GOLD }}>en el parche</span>
          </h3>
          {REVIEWS_ARE_SAMPLE && (
            <p className="mt-2 text-sm font-semibold" style={{ color: C.red }}>
              Reseñas de ejemplo: reemplázalas por reales en src/features/landing/data/reviews.ts
            </p>
          )}
        </div>
        <span className="flex items-center gap-2 text-base font-semibold" style={{ color: GOLD }} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h3l-3-3m3 3-3 3M6 8H3l3-3M3 8l3 3" />
            <path d="M9 14V9.5a1.5 1.5 0 0 1 3 0V13l3.6.7a2 2 0 0 1 1.6 2.3l-.6 3.4A2 2 0 0 1 14.6 21h-3.2a2 2 0 0 1-1.6-.8L7.3 17a1.5 1.5 0 0 1 2.3-1.9L9 14Z" />
          </svg>
          Arrastra para ver más
        </span>
      </div>

      <div
        ref={track}
        tabIndex={0}
        role="region"
        aria-label="Reseñas de clientes (desliza o usa las flechas)"
        className={`reviews-track -mx-1 flex items-start gap-6 overflow-x-auto px-1 pb-6 pt-2 outline-none ${dragging ? "reviews-track-dragging" : ""}`}
        onPointerDown={(e) => {
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
        onKeyDown={(e) => {
          if (!track.current || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return
          e.preventDefault()
          const card = track.current.firstElementChild as HTMLElement | null
          track.current.scrollBy({ left: (card?.offsetWidth ?? 320) * (e.key === "ArrowRight" ? 1 : -1), behavior: "smooth" })
        }}
      >
        {REVIEWS.map((review, i) => {
          const theme = themes[i % themes.length]
          return (
            // A chat bubble with its tail, and the person below it: unlike the square info cards around it
            <figure
              key={review.name + i}
              data-reveal
              className={`landing-reveal reviews-card flex w-[78%] flex-shrink-0 flex-col pt-3 sm:w-[310px] ${i % 2 ? "reviews-tilt-right" : "reviews-tilt-left"}`}
            >
              <div
                className="reviews-bubble relative rounded-[28px] rounded-bl-md p-6"
                style={{ background: theme.bg, ["--bubble" as string]: theme.bg }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-0.5" role="img" aria-label={`${review.stars} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} on={s < review.stars} color={theme.star} />
                    ))}
                  </div>
                  <span
                    className="truncate rounded-full px-2.5 py-1 text-[13px] font-bold"
                    style={{ background: theme.mark, color: theme.ink }}
                  >
                    {review.dish}
                  </span>
                </div>
                <blockquote className="mt-4 text-lg font-semibold leading-snug" style={{ color: theme.ink }}>
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
