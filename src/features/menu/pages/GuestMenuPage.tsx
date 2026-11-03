import { useState } from "react"
import { addCartItem } from "@/features/checkout/utils/cart"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import SiteHeader from "@/shared/components/SiteHeader"
import { C } from "@/shared/styles/theme"
import type { CartItem, Product } from "@/shared/types"

export default function GuestMenuPage({
  cart,
  setCart,
  onNav,
  onLogin,
  onCheckout,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onNav: (href: string) => void
  onLogin: () => void
  onCheckout: () => void
}) {
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const addToCart = (
    product: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => {
    setCart((items) =>
      addCartItem(items, {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        description: product.desc,
        price: product.price,
        qty,
        img: product.img,
        sauces,
        additions,
      }),
    )
    setAddProduct(null)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FAF5E8",
        fontFamily: "DM Sans, sans-serif",
        color: C.dark,
      }}
    >
      <SiteHeader
        dark={false}
        cartCount={cartCount}
        onCart={onCheckout}
        onLogin={onLogin}
        onOrder={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        // «Menú» is this page; the other links go to their section of the home page
        onNav={(href) => (href === "#menu" ? window.scrollTo({ top: 0, behavior: "smooth" }) : onNav(href))}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1
            className="font-black text-3xl"
            style={{ fontFamily: "League Spartan, sans-serif" }}
          >
            Elige tu pedido
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(30,30,30,0.5)" }}>
            Puedes comprar como invitado. Inicia sesión al confirmar para
            guardar tus datos.
          </p>
        </div>
        <ProductCatalog
          dark={false}
          paginate={false}
          compact
          onAddClick={setAddProduct}
        />
      </main>
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={addToCart}
          onCheckout={onCheckout}
          dark={false}
        />
      )}
    </div>
  )
}
