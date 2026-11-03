import { useEffect, useState } from "react"
import AdminPanel from "@/features/admin/pages/AdminPanel"
import ChooseOwnPasswordPage from "@/features/auth/pages/ChooseOwnPasswordPage"
import ForgotPage from "@/features/auth/pages/ForgotPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import RegisterPage from "@/features/auth/pages/RegisterPage"
import ResetPage from "@/features/auth/pages/ResetPage"
import { saveRegisteredClient } from "@/features/auth/services/auth.service"
import CheckoutPage from "@/features/checkout/pages/CheckoutPage"
import ClientApp from "@/features/client/pages/ClientApp"
import LandingPage from "@/features/landing/pages/LandingPage"
import GuestMenuPage from "@/features/menu/pages/GuestMenuPage"
import { addCartItem } from "@/features/checkout/utils/cart"
import { loadMenu, refreshCartProducts } from "@/features/menu/services/menu.service"
import { loadOrders, orderFromDb, refreshOrders, saveOrders } from "@/features/orders/services/orders.service"
import { orderDbId } from "@/features/orders/utils/orders"
import ProfilePage from "@/features/profile/pages/ProfilePage"
import { saveProfile } from "@/features/profile/services/profile.service"
import AccountMenu from "@/shared/components/AccountMenu"
import { api } from "@/shared/services/api"
import { C } from "@/shared/styles/theme"
import type { CartItem, DbRecord, Order, Page, User } from "@/shared/types"
import { loadLS, saveLS } from "@/shared/utils/storage"

// ── App Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("landing")
  const [user, setUser] = useState<User | null>(null)
  // The cart is kept in the browser: one per account ("cart:<email>") and one for guests ("cart")
  const [cart, setCart] = useState<CartItem[]>(() => loadLS("cart", []))
  const [forgotEmail, setForgotEmail] = useState("")
  const [, setOrdersVersion] = useState(0)
  const [clientView, setClientView] = useState<"menu" | "orders">("menu")

  const cartKey = user ? `cart:${user.email.toLowerCase()}` : "cart"
  useEffect(() => saveLS(cartKey, cart), [cart, cartKey])

  // Menu comes from the backend; if it can't be reached, the built-in PRODUCTS stay
  const [, setMenuVersion] = useState(0)
  useEffect(() => {
    loadMenu()
      .then(() => {
        setMenuVersion((v) => v + 1)
        setCart(refreshCartProducts)
        window.dispatchEvent(new Event("products-refreshed"))
      })
      .catch((err) => console.warn("No se pudo cargar el menú del backend:", err))
    const refreshProducts = () => {
      loadMenu()
        .then(() => {
          setMenuVersion((v) => v + 1)
          setCart(refreshCartProducts)
          window.dispatchEvent(new Event("products-refreshed"))
        })
        .catch((err) => console.warn("No se pudo actualizar el menú del backend:", err))
    }
    window.addEventListener("products-updated", refreshProducts)
    return () => window.removeEventListener("products-updated", refreshProducts)
  }, [])

  // Listen for admin user updates from the AdminProfilePage
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      const updatedUser = customEvent.detail as User
      setUser(updatedUser)
    }
    window.addEventListener("admin-user-updated", handler)
    return () => window.removeEventListener("admin-user-updated", handler)
  }, [])

  // Orders come from the backend; the panel opens once they're loaded
  const [ordersLoadedFor, setOrdersLoadedFor] = useState("")
  useEffect(() => {
    if (!user || user.mustChangePassword) return
    let active = true
    let loading = false
    const refresh = () => {
      if (loading || document.visibilityState === "hidden") return
      loading = true
      refreshOrders(user.role)
        .catch((err) => console.warn("No se pudieron cargar los pedidos del backend:", err))
        .finally(() => {
          loading = false
          if (!active) return
          setOrdersLoadedFor(user.email)
          setOrdersVersion((version) => version + 1)
        })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh()
    }
    refresh()
    const interval = window.setInterval(refresh, 15000)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [user?.email, user?.role, user?.mustChangePassword])

  // Re-read on every render so status changes made in the admin panel show up
  const orders = user
    ? loadOrders().filter((o) => o.email === user.email)
    : []

  // Profile (phone, cédula, addresses) is saved per email, so it survives logout
  const saveUserLocally = (u: User) => {
    saveLS(`profile:${u.email.toLowerCase()}`, u)
    saveRegisteredClient(u)
    setUser(u)
  }
  // Leaves out empty optional fields and tells the admin panel to re-read Usuarios / Clientes
  const persistUserProfile = saveProfile
  const updateUser = (u: User) => {
    saveUserLocally(u)
    // Name, document, phone and addresses live in the backend (the photo stays in this browser)
    if (loadLS("token", ""))
      persistUserProfile(u).catch((err) => window.alert(`No se pudieron guardar tus datos: ${(err as Error).message}`))
  }
  const login = (u: User, next: Page = "app") => {
    const saved = loadLS<User | null>(`profile:${u.email.toLowerCase()}`, null)
    // What the backend has wins; the browser copy only fills the gaps (e.g. the photo)
    const fromBackend = Object.fromEntries(Object.entries(u).filter(([, v]) => v !== undefined)) as User
    const authenticatedUser = saved ? { ...saved, ...fromBackend, password: undefined } : u
    // What was added as a guest joins the account's saved cart; the guest cart is emptied
    const accountCart = loadLS<CartItem[]>(`cart:${u.email.toLowerCase()}`, [])
    setCart(user ? accountCart : cart.reduce(addCartItem, accountCart))
    if (!user) localStorage.removeItem("cart")
    if (authenticatedUser.mustChangePassword) setUser(authenticatedUser)
    // Only kept in this browser: logging in must not write the profile back (the backend copy is the newest)
    else saveUserLocally(authenticatedUser)
    setClientView("menu")
    setPage(next)
  }
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("orders") // may hold every customer's orders (admin)
    setOrdersLoadedFor("")
    // The account's cart stays saved under its own key; the next person starts empty
    setCart([])
    setUser(null)
    setPage("landing")
  }
  const updateOrders = (fn: (o: Order[]) => Order[]) => {
    saveOrders(fn(loadOrders()))
    setOrdersVersion((v) => v + 1)
  }
  // The backend puts a rejected payment back to "Pendiente de verificación"
  const setVoucher = (id: string, voucher: string) =>
    api<DbRecord>(`/pedidos/${orderDbId(id)}/comprobante`, "PATCH", { comprobante: voucher })
      .then((p) => updateOrders((os) => os.map((o) => (o.id === id ? orderFromDb(p) : o))))
      .catch((err) => window.alert(`No se pudo subir el comprobante: ${(err as Error).message}`))
  const goCheckout = () => {
    setPage("checkout")
  }
  const goGuestMenu = () => {
    setPage("guest-menu")
  }
  // From another page's top bar to a section of the home page (it scrolls there when it opens)
  const goHomeSection = (href: string) => {
    window.history.replaceState(null, "", href)
    setPage("landing")
  }

  // Nothing else is shown until the provisional password from the sign-up e-mail is replaced
  if (user?.mustChangePassword)
    return (
      <ChooseOwnPasswordPage
        user={user}
        onDone={() => {
          const updated = { ...user, mustChangePassword: false }
          setUser(updated)
          saveLS(`profile:${updated.email.toLowerCase()}`, updated)
        }}
        onLogout={logout}
      />
    )
  if (page === "login")
    return (
      <LoginPage
        onLogin={(u) => login(u, u.role === "admin" ? "admin" : "app")}
        onRegister={() => setPage("register")}
        onForgot={() => setPage("forgot")}
        onBack={() => setPage("landing")}
      />
    )
  if (page === "register")
    return (
      <RegisterPage
        onVerify={(u) => {
          saveLS(`profile:${u.email}`, u)
          saveRegisteredClient(u)
          setPage("login")
        }}
        onLoginLink={() => setPage("login")}
        onBack={() => setPage("landing")}
      />
    )
  if (page === "forgot")
    return (
      <ForgotPage
        onReset={(e) => {
          setForgotEmail(e)
          setPage("reset")
        }}
        onBack={() => setPage("landing")}
        onLogin={() => setPage("login")}
      />
    )
  if (page === "reset")
    return (
      <ResetPage
        email={forgotEmail}
        onDone={() => setPage("login")}
        onBack={() => setPage("landing")}
        onLogin={() => setPage("login")}
      />
    )
  if (page === "guest-menu")
    return (
      <GuestMenuPage
        cart={cart}
        setCart={setCart}
        onNav={goHomeSection}
        onLogin={() => setPage("login")}
        onCheckout={goCheckout}
      />
    )
  if (page === "checkout")
    return (
      <CheckoutPage
        cart={cart}
        setCart={setCart}
        user={user}
        onLogin={(u) => login(u, "checkout")}
        onBack={() => setPage(user ? "app" : "landing")}
        onPlaceOrder={async (info, shouldSaveAddress) => {
          if (!user) return
          if (shouldSaveAddress) {
            const normalizedAddress = info.direccion.trim()
            const updatedUser = {
              ...user,
              addresses: [
                normalizedAddress,
                ...(user.addresses || []).filter(
                  (address) => address.trim().toLowerCase() !== normalizedAddress.toLowerCase(),
                ),
              ],
            }
            if (loadLS("token", "")) await persistUserProfile(updatedUser)
            saveUserLocally(updatedUser)
          }
          // The backend prices the order with the menu in the database and sets its status
          const created = await api<DbRecord>("/pedidos", "POST", {
            nombre: info.nombre,
            telefono: info.telefono,
            tipo_entrega: info.tipoEntrega,
            direccion: info.direccion,
            id_barrio: info.barrioId,
            ubicacion: info.ubicacion,
            nombre_barrio: info.barrio,
            notas: info.notas,
            pago: info.pago,
            comprobante: info.voucher,
            items: cart
              .filter((item) => item.qty > 0)
              .map((item) => ({
                producto: item.name,
                cantidad: item.qty,
                salsas: item.sauces || [],
                adiciones: (item.additions || []).map((a) => ({ nombre: a.name, cantidad: a.qty })),
              })),
          })
          updateOrders((os) => [orderFromDb(created), ...os])
          setCart([])
          return Number(created.total)
        }}
        onComplete={() => {
          setClientView("orders")
          setPage("app")
        }}
      />
    )
  if (page === "app" && user)
    return (
      <ClientApp
        user={user}
        onLogout={logout}
        onAdmin={() => setPage("admin")}
        onCheckout={goCheckout}
        onProfile={() => setPage("profile" as Page)}
        onNav={goHomeSection}
        cart={cart}
        setCart={setCart}
        orders={orders}
        onVoucher={setVoucher}
        initialView={clientView}
      />
    )
  if (page === "profile" as Page && user)
    return (
      <ProfilePage
        user={user}
        onBack={() => setPage("app")}
        onLogout={logout}
        onUpdateUser={updateUser}
        orders={orders}
        onVoucher={setVoucher}
      />
    )
  if (page === "admin" && user?.role === "admin" && ordersLoadedFor !== user.email)
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: C.mustard }}>
        Cargando pedidos…
      </div>
    )
  if (page === "admin" && user?.role === "admin")
    return (
      <AdminPanel
        onSwitchToClient={() => setPage(user ? "app" : "landing")}
        onLogout={logout}
        user={user}
      />
    )
  return (
    <LandingPage
      account={
        user && !user.mustChangePassword ? (
          <AccountMenu
            user={user}
            dark={false}
            onProfile={() => setPage("profile" as Page)}
            onOrders={() => {
              setClientView("orders")
              setPage("app")
            }}
            onAdmin={() => setPage("admin")}
            onLogout={logout}
          />
        ) : undefined
      }
      // A client with an open session goes straight back to their menu
      onLogin={() => setPage(user ? "app" : "login")}
      onGuestMenu={
        user
          ? () => {
              setClientView("menu")
              setPage("app")
            }
          : goGuestMenu
      }
      onCheckout={goCheckout}
      cart={cart}
      setCart={setCart}
    />
  )
}
