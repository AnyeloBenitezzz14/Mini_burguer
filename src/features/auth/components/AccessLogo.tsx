import logoImg from "@/imports/logo.png"
import { C } from "@/shared/styles/theme"

export default function AccessLogo({
  onClick,
  className,
  style,
}: {
  onClick: () => void
  className: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir al inicio de sesión"
      title="Ir al inicio de sesión"
      className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ outlineColor: C.mustard }}
    >
      <img src={logoImg} alt="El Parche" className={className} style={style} />
    </button>
  )
}
