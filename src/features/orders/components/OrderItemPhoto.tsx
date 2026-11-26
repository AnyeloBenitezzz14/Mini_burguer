import { useState } from "react"

// A product's photo in an order: tries each link in turn, retrying once after a moment (the backend may be
// restarting); if none loads, a burger icon instead of an empty tile
export default function OrderItemPhoto({ srcs, tile }: { srcs: (string | undefined)[]; tile: string }) {
  const links = [...new Set(srcs.filter(Boolean) as string[])]
  const [attempt, setAttempt] = useState(0)
  const index = Math.floor(attempt / 2)
  const src = links[index]
  if (!src)
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: tile }} aria-hidden="true">
        🍔
      </div>
    )
  return (
    <img
      key={attempt}
      // The retry asks again without the cache (a failed load may have been cached)
      src={attempt % 2 ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}` : src}
      alt=""
      className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
      style={{ background: tile }}
      onError={() => setTimeout(() => setAttempt((a) => a + 1), attempt % 2 ? 0 : 1200)}
    />
  )
}
