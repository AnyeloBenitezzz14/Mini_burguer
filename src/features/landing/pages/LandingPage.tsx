import { useEffect, useState } from "react"
import landingBackgroundImg from "@/imports/landing-background.jpg"
import storyBelloImg from "@/imports/story-bello.jpg"
import CartAddedNotice, { useCartNotice } from "@/features/checkout/components/CartAddedNotice"
import { addCartItem } from "@/features/checkout/utils/cart"
import { ABOUT_ICONS, aboutIcon } from "@/features/landing/utils/aboutIcons"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import ReviewsCarousel from "@/features/landing/components/ReviewsCarousel"
import SiteFooter from "@/features/landing/components/SiteFooter"
import SiteHeader from "@/shared/components/SiteHeader"
import { Ico } from "@/shared/components/icons"
import { C, WA } from "@/shared/styles/theme"
import type { CartItem, Product } from "@/shared/types"

export default function LandingPage({
  account,
  onLogin,
  onGuestMenu,
  onCheckout,
  onLicenses,
  cart,
  setCart,
}: {
  // Signed in: their photo and menu instead of «Iniciar sesión»
  account?: React.ReactNode
  onLogin: () => void
  onGuestMenu: () => void
  onCheckout: () => void
  onLicenses: () => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}) {
  const [cartNotice, showCartNotice] = useCartNotice()
  const [dark, setDark] = useState(false)
  const [waBubble, setWaBubble] = useState(true)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const BG = dark ? "#13110E" : "#FAF4E8"
  const TEXT = dark ? "#F0E8D6" : "#18140A"
  const MUTED = dark ? "rgba(240,232,214,0.48)" : "rgba(24,20,10,0.5)"
  const BORDER = dark ? "rgba(240,232,214,0.07)" : "rgba(24,20,10,0.08)"
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  // Came from another page's top bar (e.g. «Nosotros»): show that section
  useEffect(() => {
    const target = window.location.hash && document.querySelector(window.location.hash)
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 50)
  }, [])
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]")
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.dataset.visible = "true"
      })
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-visible", "true")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  const addToCart = (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
    note?: string,
  ) => {
    setCart((c) =>
      addCartItem(c, {
        ...(note ? { note } : {}),
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
  const goToMenu = onGuestMenu

  return (
    <div
      className="landing-page"
      style={{ background: BG, fontFamily: "DM Sans, sans-serif", color: TEXT }}
    >
      <SiteHeader
        overlay
        account={account}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        cartCount={cartCount}
        onCart={onCheckout}
        onLogin={onLogin}
        onOrder={goToMenu}
      />

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center overflow-hidden bg-[#080d0f]"
      >
        <img
          src={landingBackgroundImg}
          alt="Burger artesanal"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 65%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,8,5,0.9) 0%, rgba(10,8,5,0.78) 36%, rgba(10,8,5,0.38) 70%, rgba(10,8,5,0.18) 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-20 pb-16">
          <div className="max-w-[28rem]">
            <div
              className="landing-enter landing-enter-1 inline-flex items-center gap-2 mb-5 text-base font-semibold"
              style={{ color: "var(--landing-gold)" }}
            >
              <span className="mr-1 inline-flex align-middle">{Ico.fire}</span>
              <span >Desde 2013 en Bello, Antioquia</span>
            </div>
            <h1
              className="landing-display-title landing-enter landing-enter-2"
              style={{
                fontFamily: '"Alfa Slab One", Rockwell, Georgia, serif',
                fontWeight: 400,
                fontSize: "clamp(2.25rem,5vw,4.5rem)",
                lineHeight: 1.08,
                color: "#FAF3E0",
                letterSpacing: "0.015em",
                wordSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontSize: "1.02em" }}>EL SABOR QUE</span>
              <br />
              <span className="landing-gold-shimmer landing-gold-shimmer-hero">TE REÚNE</span>
            </h1>
            <p
              className="landing-enter landing-enter-3 mt-5 mb-8 text-lg sm:text-xl leading-relaxed"
              style={{
                color: "#fff",
                maxWidth: "400px",
                fontWeight: 300,
              }}
            >
              Mini burgers artesanales preparadas al momento con ingredientes
              frescos. Local y domicilio en Bello.
            </p>
            <div className="landing-enter landing-enter-4 flex items-center gap-8 mt-8">
              {[
                ["4,4", "Calificación"],
                ["77+", "Reseñas"],
                ["13+", "Años"],
              ].map(([val, lbl], i) => (
                <div key={lbl}>
                  <div
                    className="font-black text-2xl"
                    style={{
                      fontFamily: "League Spartan, sans-serif",
                      color: "var(--landing-gold)",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-base"
                    style={{ color: "rgba(250,243,224,0.78)" }}
                  >
                    {lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="py-6 px-5 sm:px-8" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-4">
          <div
            data-reveal
            className="landing-reveal landing-promo-card flex items-center gap-4 rounded-[2rem] border px-5 py-5 sm:gap-5 sm:rounded-full sm:px-8"
            style={{
              background: dark ? "#33231F" : "linear-gradient(120deg, #FFFCF4, #F8EAE4)",
              borderColor: dark ? "#57362E" : "#EBD8D0",
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#F4DDD5", color: C.red }}
            >
              {Ico.delivery}
            </div>
            <div>
              <div
                className="font-extrabold text-lg sm:text-xl"
                style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
              >
                Domicilios por toda la zona
              </div>
              <div className="mt-1 text-sm leading-relaxed sm:text-base" style={{ color: TEXT }}>
                Consulta la cobertura y el costo del envío al realizar tu pedido.
              </div>
            </div>
          </div>
          <div
            data-reveal
            className="landing-reveal landing-promo-card landing-promo-onion flex items-center gap-4 rounded-[2rem] border px-5 py-5 sm:gap-5 sm:rounded-full sm:px-8"
            style={{
              background: dark ? "#32281A" : "linear-gradient(120deg, #FFFCF4, #F8EED5)",
              borderColor: dark ? "#584729" : "#EADBB5",
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#F3E4BD", color: "#805F0B" }}
            >
              {Ico.onion}
            </div>
            <div>
              <div
                className="font-extrabold text-lg sm:text-xl"
                style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
              >
                Cebolla Marinada
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed sm:text-base" style={{ color: TEXT }}>
                Nuestra especialidad
                <strong className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "#F3E4BD", color: "#6C4E09" }}>100% gratis</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="py-12 sm:py-20" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="mb-8">
            <div
              className="mb-2 text-lg font-semibold"
              style={{ color: "var(--brand-gold)" }}
            >
              <span >Nuestro Menú</span>
            </div>
            <h2
              data-reveal
              className="landing-display-title landing-reveal"
              style={{
                fontFamily: "League Spartan, sans-serif",
                fontWeight: 800,
                color: TEXT,
                fontSize: "clamp(2rem,6vw,3.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Todo lo que <span style={{ color: C.red }}>preparamos</span>
            </h2>
          </div>
          <ProductCatalog
            dark={dark}
            onAddClick={(p) => setAddProduct(p)}
          />
          {cartCount > 0 && (
            <div
              className="mt-6 flex w-fit max-w-full items-center justify-between gap-3 rounded-[2rem] px-4 py-4 text-black sm:gap-5 sm:rounded-full sm:px-6"
              style={{ background: "var(--brand-gold)" }}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex">{Ico.shopping}</span>
                <div>
                  <div className="font-bold text-sm">
                    {cartCount} producto{cartCount > 1 ? "s" : ""} en tu carrito
                  </div>
                  <div
                    className="text-xs"
                  >
                    Listo para ordenar
                  </div>
                </div>
              </div>
              <button
                onClick={onCheckout}
                className="shrink-0 cursor-pointer rounded-full px-4 py-2.5 text-sm font-bold sm:px-5"
                style={{ background: "#fff", color: "var(--brand-gold-ink)" }}
              >
                Ver carrito →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        className="py-16 sm:py-24 px-5 sm:px-8"
        style={{ background: dark ? "#0A0805" : C.dark }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            data-reveal
            className="landing-display-title landing-reveal mb-10"
            style={{
              fontFamily: "League Spartan, sans-serif",
              fontWeight: 800,
              color: "#FAF3E0",
              fontSize: "clamp(2rem,6vw,3.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            ¿Cómo <span style={{ color: "var(--landing-gold)" }}>funciona?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                t: "Elige tu pedido",
                d: "Explora el menú y selecciona lo que quieras.",
              },
              {
                n: "02",
                t: "Lo preparamos",
                d: "Todo al momento con ingredientes frescos.",
              },
              {
                n: "03",
                t: "Lo disfrutas",
                d: "En el local o a tu puerta, siempre caliente.",
              },
            ].map((s, i) => (
              <div
                data-reveal
                key={i}
                className="landing-reveal landing-how-card p-6 sm:p-8 rounded-2xl"
                style={{
                  background: [`rgba(182,140,28,0.17)`, `rgba(165,65,49,0.2)`, `rgba(58,109,94,0.23)`][i],
                }}
              >
                <span className={`landing-how-food landing-how-food-${i + 1}`} aria-hidden="true">
                  <svg viewBox="0 0 80 80" fill="none">
                    {i === 0 && (
                      <>
                        <path d="M14 34c1-12 12-21 26-21s25 9 26 21H14Z" fill="currentColor" fillOpacity=".15" />
                        <path d="M16 38h48" strokeWidth="4" />
                        <path d="M16 41c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0" strokeWidth="3" />
                        <path d="m18 45 44-2-5 7H23l-5-5Z" fill="currentColor" fillOpacity=".3" />
                        <path d="M17 53c2 8 10 12 23 12s21-4 23-12H17Z" fill="currentColor" fillOpacity=".15" />
                        <path d="m27 22 1-1m11-4 1 1m11 4 1 1" strokeWidth="2.5" />
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <path d="m25 36-4-22q-.5-4 3-4h3q3 0 3.5 4l3 23" />
                        <path d="m36 36-1-27q0-4 3.5-4h3q3 0 3 4l-.5 27" />
                        <path d="m47 36 3-23q.5-4 3.5-3.5l3 .5q3 .5 2.5 4l-4 24" />
                        <path d="M14 32q26 14 52 0l-6 35q-20 7-40 0l-6-35Z" />
                        <path d="M14 32q26 14 52 0" />
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <path d="m25 24 4 42h22l4-42H25Z" fill="currentColor" fillOpacity=".18" />
                        <path d="M23 24h34M25 31h30l-3 35H29l-4-35Z" />
                        <path d="m37 24 2-13 11 2" />
                        <path d="M28 43h26" strokeWidth="2.5" />
                        <path d="M34 37h.1m8 0h.1m8 0h.1" strokeWidth="3.5" />
                      </>
                    )}
                  </svg>
                </span>
                <div
                  className="font-black text-5xl mb-4"
                  style={{
                    fontFamily: "League Spartan, sans-serif",
                    color: ["var(--brand-gold)", "#E67B66", "#7FBBA8"][i],
                  }}
                >
                  {s.n}
                </div>
                <h3
                    className="landing-display-title font-semibold text-2xl mb-2"
                  style={{ color: "#FAF3E0" }}
                >
                  {s.t}
                </h3>
                <p
                  className="max-w-[calc(100%-3.5rem)] text-base leading-relaxed"
                  style={{ color: "#FAF3E0", fontWeight: 400 }}
                >
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOSOTROS — expanded */}
      <section
        id="nosotros"
        className="py-16 sm:py-24 px-5 sm:px-8"
        style={{ background: BG }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="mb-2 text-lg font-semibold"
            style={{ color: "var(--brand-gold)" }}
          >
            Nuestra Historia
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-12">
            <div>
              <h2
                className="landing-display-title mb-4"
                style={{
                  fontFamily: "League Spartan, sans-serif",
                  fontWeight: 800,
                  color: TEXT,
                  fontSize: "clamp(1.8rem,5vw,3rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Más que un restaurante,
                <br />
                <span style={{ color: "var(--brand-gold)" }}>somos el parche</span>
              </h2>
              <p
                className="text-lg leading-relaxed mb-4"
                style={{ color: TEXT, fontWeight: 400 }}
              >
                Desde 2013, El Parche de las Mini Burguer nació en el corazón de
                Bello como un pequeño sueño familiar. Hoy somos uno de los
                puntos de encuentro más queridos del norte del Valle de Aburrá.
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ color: TEXT, fontWeight: 400 }}
              >
                Cada hamburguesa, perro caliente o salchipapa que sale de
                nuestra cocina lleva el mismo amor y cuidado del primer día.
                Ingredientes frescos, recetas propias y el calor de siempre.
              </p>
            </div>
            <div className="landing-story-media relative">
              <div className="landing-story-frame relative ml-auto aspect-[3/2] w-full max-w-[640px] overflow-hidden rounded-3xl">
                <img
                  data-reveal
                  src={storyBelloImg}
                  alt="Fachada de El Parche de las Mini Burguer en Bello"
                  className="landing-story-image landing-reveal absolute inset-0 h-full w-full rounded-3xl object-cover"
                />
                <div
                  className="landing-story-badge absolute bottom-4 right-4 rounded-2xl p-3 sm:p-4"
                >
                  <div
                    className="font-black text-xl sm:text-2xl"
                    style={{ fontFamily: "League Spartan, sans-serif" }}
                  >
                    2013
                  </div>
                  <div className="text-[11px] sm:text-xs">
                    Fundados en Bello
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Misión, Visión, Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: ABOUT_ICONS.mision,
                title: "Misión",
                text: "Preparar mini burgers artesanales de alta calidad con ingredientes frescos, llevando sabor y alegría a cada cliente de Bello y sus alrededores.",
              },
              {
                icon: ABOUT_ICONS.vision,
                title: "Visión",
                text: "Ser el restaurante de fast food artesanal más querido del norte del Valle de Aburrá para 2026, expandiendo nuestras sedes sin perder la esencia familiar.",
              },
              {
                icon: ABOUT_ICONS.valores,
                title: "Valores",
                text: "Calidad sin compromisos, honestidad con nuestros clientes, pasión en cada preparación, puntualidad en entregas y servicio cálido y cercano.",
              },
            ].map((v) => (
              <div
                data-reveal
                key={v.title}
                className="landing-reveal landing-info-card landing-mission-card p-6 rounded-2xl"
                style={{
                  background: dark ? "#211D17" : "#FFFDF7",
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgb(212 175 55 / 12%)", color: "var(--brand-gold)" }}
                >
                  {aboutIcon(24, v.icon)}
                </div>
                <h3
                  className="landing-display-title font-black text-xl mb-2"
                  style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
                >
                  {v.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: TEXT, fontWeight: 400 }}
                >
                  {v.text}
                </p>
              </div>
            ))}
          </div>
          {/* Reseñas: before the team */}
          <ReviewsCarousel dark={dark} />
          {/* Equipo */}
          <h3
            className="landing-display-title font-black text-xl mb-5"
            style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
          >
            Nuestro equipo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                name: "La Familia Fundadora",
                role: "Dirección General",
                icon: ABOUT_ICONS.familia,
              },
              {
                name: "Equipo de Cocina",
                role: "Preparación & Calidad",
                icon: ABOUT_ICONS.cocina,
              },
              {
                name: "Equipo de Servicio",
                role: "Atención al cliente",
                icon: ABOUT_ICONS.servicio,
              },
              { name: "Repartidores", role: "Domicilios Express", icon: ABOUT_ICONS.domicilios },
            ].map((m) => (
              <div
                data-reveal
                key={m.name}
                className="landing-reveal landing-info-card p-5 rounded-2xl text-center"
                style={{
                  background: dark ? "#211D17" : "#FFFDF7",
                }}
              >
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "rgb(212 175 55 / 12%)", color: "var(--brand-gold)" }}
                >
                  {aboutIcon(26, m.icon)}
                </div>
                <div className="font-bold text-base" style={{ color: TEXT }}>
                  {m.name}
                </div>
                <div className="text-base mt-1" style={{ color: TEXT }}>
                  {m.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="pedidos"
        className="landing-cta py-16 sm:py-24 px-5 sm:px-8"
      >
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="landing-display-title mb-4"
            style={{
              fontFamily: "League Spartan, sans-serif",
              fontWeight: 800,
              color: "#FAF3E0",
              fontSize: "clamp(2rem,7vw,3.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            ¿Listo para <span style={{ color: "var(--landing-gold)" }}>pedir?</span>
          </h2>
          <p
            className="mb-8 text-lg"
            style={{ color: "rgba(250,243,224,0.85)", fontWeight: 400 }}
          >
            Agrega productos al carrito sin necesidad de registro. ¡Pruébalo
            ahora!
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() =>
                document
                  .getElementById("menu")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="landing-order-button landing-order-button-story px-8 py-4 rounded-2xl font-bold text-base cursor-pointer"
            >
              Ver el menú
            </button>
            {cartCount > 0 && (
              <button
                onClick={onCheckout}
                className="px-8 py-4 rounded-2xl font-bold text-base cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                }}
              >
                Mi carrito ({cartCount})
              </button>
            )}
          </div>
        </div>
      </section>

      <SiteFooter onLicenses={onLicenses} />

      {/* WhatsApp bubble */}
      {waBubble && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-br-sm"
            style={{
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            <span
              className="text-sm font-medium flex-1"
              style={{ color: "#1A1714" }}
            >
              ¿Cómo podemos ayudarte?
            </span>
            <button
              onClick={() => setWaBubble(false)}
              className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.07)", color: "#666" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <a
            href={`https://wa.me/${WA}?text=Hola%20El%20Parche%2C%20quiero%20hacer%20mi%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "#25D366",
              boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      )}
      {!waBubble && (
        <a
          href={`https://wa.me/${WA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "#25D366",
            boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
      <button
        type="button"
        onClick={goToMenu}
        className="landing-order-button landing-order-button-floating fixed bottom-28 left-4 right-20 z-40 rounded-full py-3 text-sm font-bold shadow-lg sm:hidden"
      >
        Pide Ahora
      </button>

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
    </div>
  )
}
