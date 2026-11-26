import { BEVERAGE_INFO, beverageImage, beverageLabel, sodaInfo } from "@/features/menu/data/products"
import { C } from "@/shared/styles/theme"

// The bottle photo for that flavour and size, or a bottle drawn in its colour while there is none
const BeverageArt = ({ flavor, size }: { flavor: string; size?: string }) => {
  // The photo uploaded to that soda's product, else the bundled bottle photo
  const img = (size && sodaInfo(flavor, size)?.img) || beverageImage(flavor, size)
  if (img)
    return <img src={img} alt={`${beverageLabel(flavor)}${size ? ` ${size}` : ""}`} className="h-full w-full object-contain" />
  const color = BEVERAGE_INFO[flavor]?.color ?? C.mustard
  return (
    <svg viewBox="0 0 40 64" className="h-full w-auto" aria-hidden="true">
      <rect x="15" y="2" width="10" height="7" rx="2" fill={color} />
      <path d="M14 9h12l3 10c2 3 4 6 4 11v28a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V30c0-5 2-8 4-11z" fill={color} />
      <rect x="7" y="32" width="26" height="12" fill="#fff" opacity="0.92" />
      <path d="M10 38c5-3 15 3 20 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M12 14h3l-2 8" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  )
}

export default BeverageArt
