import { useEffect, useState } from "react"
import logoImg from "@/imports/logo.png"
import { Ico } from "@/shared/components/icons"
import { SITE_NAVLINKS } from "@/shared/constants"
import { C } from "@/shared/styles/theme"

export default function SiteHeader({
  overlay = false,
  dark,
  onToggleDark,
  cartCount,
  onCart,
  onLogin,
  onOrder,
  onNav,
  account,
}: {
  overlay?: boolean
  dark: boolean
  onToggleDark?: () => void
  cartCount: number
  onCart: () => void
  onLogin: () => void
  onOrder?: () => void
  onNav?: (href: string) => void
  account?: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pastTop, setPastTop] = useState(false)
  useEffect(() => {
    if (!overlay) return
    const fn = () => setPastTop(window.scrollY > 30)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [overlay])
  // Over the home page's photo it starts transparent; elsewhere it is always solid
  const scrolled = !overlay || pastTop
  const TEXT = dark ? "#F0E8D6" : "#18140A"
  const MUTED = dark ? "rgba(240,232,214,0.48)" : "rgba(24,20,10,0.5)"
  const BORDER = dark ? "rgba(240,232,214,0.07)" : "rgba(24,20,10,0.08)"
  const HDR_BG = scrolled ? (dark ? "rgba(19,17,14,0.96)" : "rgba(250,244,232,0.96)") : "transparent"
  const NAVLINKS = SITE_NAVLINKS
  const go = (e: React.MouseEvent, href: string) => {
    setMenuOpen(false)
    if (!onNav) return
    e.preventDefault()
    onNav(href)
  }
  return (
    <header
        className={`${overlay ? "fixed" : "sticky"} top-0 left-0 right-0 z-50 transition-all duration-200`}
        style={{
          background: HDR_BG,
          boxShadow: scrolled ? `0 1px 0 ${BORDER}` : "none",
          backdropFilter: scrolled ? "blur(14px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-20 md:h-24">
          <a href="#inicio" onClick={(e) => go(e, "#inicio")} className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="El Parche"
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            />
            <div>
              <div
                className="landing-brand-title landing-gold-shimmer landing-gold-shimmer-brand font-black text-lg sm:text-xl leading-tight"
                style={{ color: C.mustard }}
              >
                EL PARCHE
              </div>
              <div
                className="landing-brand-subtitle"
                style={{
                  color: scrolled ? MUTED : "rgba(255,255,255,0.65)",
                }}
              >
                MINI BURGUER
              </div>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-8">
            {NAVLINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                className="text-base font-medium hover:opacity-60 transition-opacity"
                style={{ color: l.label === "Menú" ? (scrolled ? "#18140A" : "#fff") : scrolled ? TEXT : "#fff" }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: BORDER, color: scrolled ? TEXT : "#fff" }}
            >
              {dark ? Ico.sun : Ico.moon}
            </button>
            )}
            {/* Cart */}
            <button
              onClick={onCart}
              data-cart-target
              aria-label={`Carrito, ${cartCount} productos`}
              className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: BORDER, color: scrolled ? TEXT : "#fff" }}
            >
              {Ico.cart}
              {cartCount > 0 && (
                <span
                  // Re-mounted on every change, so the count bounces when something is added
                  key={cartCount}
                  className="cart-badge-bump absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    background: C.red,
                    color: "#fff",
                    fontSize: "0.6rem",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            {account ?? (
            <button
              onClick={onLogin}
              className="hidden sm:inline-flex min-h-11 px-5 py-2.5 rounded-full text-base font-semibold cursor-pointer hover:opacity-80"
              style={{
                color: scrolled ? TEXT : "#fff",
                border: `1px solid ${
                  scrolled ? BORDER : "rgba(255,255,255,0.35)"
                }`,
              }}
            >
              Iniciar sesión
            </button>
            )}
            {onOrder && (
            <button
              onClick={onOrder}
              className="landing-order-button landing-order-button-header hidden sm:inline-flex min-h-11 px-5 py-2.5 rounded-full text-base font-bold cursor-pointer"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Pide Ahora
            </button>
            )}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                color: scrolled ? TEXT : "#fff",
                background: menuOpen ? BORDER : "transparent",
              }}
            >
              {menuOpen ? Ico.x : Ico.menu}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            className="lg:hidden px-5 py-5 flex flex-col gap-1"
            style={{
              background: dark
                ? "rgba(19,17,14,0.98)"
                : "rgba(250,244,232,0.98)",
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {NAVLINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                className="text-base font-semibold py-3 px-3 rounded-xl"
                style={{ color: l.label === "Menú" ? "#18140A" : TEXT, borderBottom: `1px solid ${BORDER}` }}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {!account && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onLogin()
                }}
                className="w-full py-3.5 rounded-2xl font-semibold text-base cursor-pointer"
                style={{ color: TEXT, border: `1px solid ${BORDER}` }}
              >
                Iniciar sesión
              </button>
              )}
              {onOrder && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onOrder()
                }}
                className="landing-order-button landing-order-button-mobile-menu w-full py-3.5 rounded-2xl font-bold text-base cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Pide Ahora
              </button>
              )}
            </div>
          </div>
        )}
      </header>
  )
}
