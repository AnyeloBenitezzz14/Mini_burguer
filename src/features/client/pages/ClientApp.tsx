import { useState } from "react"
import CartAddedNotice, { useCartNotice } from "@/features/checkout/components/CartAddedNotice"
import { addCartItem } from "@/features/checkout/utils/cart"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import { PRODUCTS } from "@/features/menu/data/products"
import OrderDetailModal from "@/features/orders/components/OrderDetailModal"
import OrderList from "@/features/orders/components/OrderList"
import AccountMenu from "@/shared/components/AccountMenu"
import SiteHeader from "@/shared/components/SiteHeader"
import type { CartItem, Order, Product, Theme, User } from "@/shared/types"

export default function ClientApp({
  user,
  onLogout,
  onAdmin,
  onCheckout,
  onProfile,
  cart,
  setCart,
  orders,
  onVoucher,
  initialView = "menu",
  onNav,
}: {
  user: User
  onNav: (href: string) => void
  onLogout: () => void
  onAdmin: () => void
  onCheckout: () => void
  onProfile: () => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  orders: Order[]
  onVoucher: (id: string, voucher: string) => void
  initialView?: "menu" | "cart" | "orders"
}) {
  const [cartNotice, showCartNotice] = useCartNotice()
  const [view, setView] = useState<"menu" | "cart" | "orders">(initialView)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = orders.find((o) => o.id === selectedId)
  const [theme, setTheme] = useState<Theme>("light")
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const dark = theme === "dark"
  const BG = dark ? "#131210" : "#FAF5E8"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const addToCart = (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => {
    setCart((c) =>
      addCartItem(c, {
        id: Date.now(),
        productId: p.id,
        name: p.name,
        description: p.desc,
        price: p.price,
        qty,
        img: p.img,
        sauces,
        additions,
      }),
    )
    setAddProduct(null)
    showCartNotice(p.name)
  }
  const quickAdd = (p: Product) =>
    setCart((c) => {
      const ex = c.find(
        (x) => x.name === p.name && (x.additions?.length ?? 0) === 0,
      )
      if (ex)
        return c.map((x) => (x.id === ex.id ? { ...x, qty: x.qty + 1 } : x))
      return [
        ...c,
        { id: Date.now(), productId: p.id, name: p.name, description: p.desc, price: p.price, qty: 1, img: p.img },
      ]
    })

  if (view === "profile" as string) return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BG, fontFamily: "DM Sans, sans-serif", color: TEXT }}
    >
      {/* Header */}
      <SiteHeader
        dark={dark}
        onToggleDark={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        cartCount={cartCount}
        onCart={onCheckout}
        onLogin={() => setView("menu")}
        // «Menú» and «Pedidos» are this client's menu and orders; the rest are sections of the home page
        onNav={(href) => {
          if (href === "#menu" || href === "#pedidos") {
            setView(href === "#menu" ? "menu" : "orders")
            window.scrollTo({ top: 0, behavior: "smooth" })
          } else onNav(href)
        }}
        account={
          <AccountMenu
            user={user}
            dark={dark}
            onProfile={onProfile}
            onOrders={() => setView("orders")}
            onAdmin={onAdmin}
            onLogout={onLogout}
          />
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {view === "menu" && (
          // The same page as the guest menu (Pide ahora)
          <div className="max-w-5xl mx-auto py-2">
            <div className="mb-6">
              <h1
                className="font-black text-3xl"
                style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
              >
                Elige tu pedido
              </h1>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                Toca un producto para personalizarlo y agregarlo a tu carrito.
              </p>
            </div>
            <ProductCatalog
              dark={dark}
              paginate={false}
              compact
              onAddClick={(p) => setAddProduct(p)}
            />
          </div>
        )}
        {view === "orders" && (
          <div className="max-w-2xl mx-auto">
            <h2
              className="font-black text-2xl mb-5"
              style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
            >
              Mis pedidos
            </h2>
            <OrderList
              orders={orders}
              dark={dark}
              onSelect={(o) => setSelectedId(o.id)}
            />
          </div>
        )}
      </main>

      {selected && (
        <OrderDetailModal
          order={selected}
          dark={dark}
          onClose={() => setSelectedId(null)}
          onVoucher={onVoucher}
        />
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={addToCart}
          onCheckout={onCheckout}
          dark={dark}
        />
      )}
      <CartAddedNotice message={cartNotice} dark={dark} />
      {/* Quick-add feedback suppressed — quickAdd used from ProductCatalog + button */}
      <div style={{ display: "none" }} onClick={() => quickAdd(PRODUCTS[0])} />
    </div>
  )
}
