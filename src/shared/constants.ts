export const ITEMS_PER_PAGE = 6

export const STATUS_OPT = ["Activo", "Inactivo"]

// Purchases and losses can't be dated before the shop opened ("Desde 2013 en Bello")
export const FIRST_DAY = "2013-01-01"

// Highest unit cost / price accepted (the database keeps 10 digits before the decimals)
export const MAX_PRICE = 999_999_999

// ── Landing Page ───────────────────────────────────────────────────────────────
// The home page's top bar, also on the guest menu and the client's app. On the home page its links scroll to
// each section; on the other pages `onNav` takes the visitor to that section of the home page.
// `account` (a signed-in client) replaces «Iniciar sesión» / «Pide Ahora».
export const SITE_NAVLINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Menú", href: "#menu" },
  { label: "Pedidos", href: "#pedidos" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
]
