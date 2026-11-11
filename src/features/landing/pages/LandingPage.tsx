import { useEffect, useState } from "react"
import { STORE_HOURS_LABEL } from "@/shared/utils/storeHours"
import landingBackgroundImg from "@/imports/landing-background.jpg"
import logoImg from "@/imports/logo.png"
import storyBelloImg from "@/imports/story-bello.jpg"
import CartAddedNotice, { useCartNotice } from "@/features/checkout/components/CartAddedNotice"
import { addCartItem } from "@/features/checkout/utils/cart"
import { ABOUT_ICONS, aboutIcon } from "@/features/landing/utils/aboutIcons"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import ReviewsCarousel from "@/features/landing/components/ReviewsCarousel"
import SiteHeader from "@/shared/components/SiteHeader"
import { Ico } from "@/shared/components/icons"
import { C, WA } from "@/shared/styles/theme"
import type { CartItem, Product } from "@/shared/types"

export default function LandingPage({
  account,
  onLogin,
  onGuestMenu,
  onCheckout,
  cart,
  setCart,
}: {
  // Signed in: their photo and menu instead of «Iniciar sesión»
  account?: React.ReactNode
  onLogin: () => void
  onGuestMenu: () => void
  onCheckout: () => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}) {
  const [cartNotice, showCartNotice] = useCartNotice()
  const [dark, setDark] = useState(false)
  const [waBubble, setWaBubble] = useState(true)
  const [legalModal, setLegalModal] = useState<"envios" | "legal" | null>(null)
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
              style={{ color: C.amber }}
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
              <span style={{ color: C.mustard }}>TE REÚNE</span>
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
                ["4.9", "Calificación"],
                ["200+", "Reseñas"],
                ["10+", "Años"],
              ].map(([val, lbl], i) => (
                <div key={lbl}>
                  <div
                    className="font-black text-2xl"
                    style={{
                      fontFamily: "League Spartan, sans-serif",
                      color: C.amber,
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
            className="landing-reveal landing-promo-card landing-promo-delivery rounded-2xl px-5 sm:px-6 py-5 flex items-center gap-4 sm:gap-5"
            style={{
              background: dark ? "#211D17" : "#FFFDF7",
            }}
          >
            <div
              className="landing-icon-bounce flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(58,109,94,0.11)", color: C.mustard }}
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
              <div className="text-base mt-1 leading-relaxed" style={{ color: TEXT }}>
                Consulta la cobertura y el costo del envío al realizar tu pedido.
              </div>
            </div>
          </div>
          <div
            data-reveal
            className="landing-reveal landing-promo-card landing-promo-onion rounded-2xl px-5 sm:px-6 py-5 flex items-center gap-4 sm:gap-5"
            style={{
              background: dark ? "#211D17" : "#FFFDF7",
            }}
          >
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(165,65,49,0.1)", color: C.mustard }}
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
              <div className="text-base mt-1 leading-relaxed" style={{ color: TEXT }}>
                Nuestra especialidad —{" "}
                <strong style={{ color: C.red }}>100% Gratis</strong>.
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
              style={{ color: dark ? C.mustard : "#8D6910" }}
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
              className="mt-6 flex items-center justify-between p-4 rounded-2xl"
              style={{ background: C.mustard }}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex text-white">{Ico.shopping}</span>
                <div>
                  <div className="font-bold text-sm text-white">
                    {cartCount} producto{cartCount > 1 ? "s" : ""} en tu carrito
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Listo para ordenar
                  </div>
                </div>
              </div>
              <button
                onClick={onCheckout}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                style={{ background: "#fff", color: C.mustard }}
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
            ¿Cómo <span style={{ color: C.mustard }}>funciona?</span>
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
                    color: [C.amber, "#E67B66", "#7FBBA8"][i],
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
            style={{ color: dark ? C.mustard : "#8D6910" }}
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
                <span style={{ color: dark ? C.mustard : "#8D6910" }}>somos el parche</span>
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
                    className="font-black text-xl sm:text-2xl text-white"
                    style={{ fontFamily: "League Spartan, sans-serif" }}
                  >
                    2013
                  </div>
                  <div className="text-[11px] sm:text-xs text-white">
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
                  style={{ background: `${C.mustard}1F`, color: C.mustard }}
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
                  style={{ background: `${C.mustard}1F`, color: C.mustard }}
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
            ¿Listo para <span style={{ color: C.mustard }}>pedir?</span>
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
              style={{ background: C.mustard, color: "#fff" }}
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

      {/* FOOTER */}
      <footer
        id="contacto"
        className="landing-footer pt-14 pb-6 px-5 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10"
          >
            <div className="flex flex-col items-start gap-4">
              <img
                src={logoImg}
                alt="El Parche"
                className="object-contain"
                style={{ width: "100px", height: "100px" }}
              />
              <div>
                <div
                  className="font-black text-xl leading-tight"
                  style={{
                    fontFamily: "League Spartan, sans-serif",
                    color: C.mustard,
                  }}
                >
                  El Parche
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "rgba(250,243,224,0.4)" }}
                >
                  de las Mini Burguer
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[
                  {
                    href: `https://www.instagram.com/elparchedelasminiburguers`,
                    bg: "#D62976",
                    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                  },
                  {
                    href: `https://wa.me/${WA}`,
                    bg: "#25D366",
                    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
                  },
                  {
                    href: "https://www.facebook.com/elparchedelasminiburguers",
                    bg: "#1877F2",
                    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                  },
                ].map(({ href, bg, path }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-social-link w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4
                className="font-bold text-base mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "League Spartan, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Contacto
              </h4>
              <ul className="flex flex-col gap-3 text-base">
                <li className="flex gap-2.5 items-start">
                  <span className="mt-0.5" style={{ color: C.amber }}>{Ico.mapPin}</span>
                  <span style={{ color: "rgba(250,243,224,0.8)" }}>
                    051053, Cra. 58A #42c-28, Bello, Antioquia
                  </span>
                </li>
                <li className="flex gap-2.5 items-center">
                  <span style={{ color: C.amber }}>{Ico.phone}</span>
                  <a href="tel:+573206332670" style={{ color: C.amber }}>
                    320 633 2670
                  </a>
                </li>
                <li className="flex gap-2.5 items-center">
                  <span style={{ color: C.amber }}>{Ico.mail}</span>
                  <a
                    href="mailto:Elparchedelasminiburguers@gmail.com"
                    style={{ color: C.amber }}
                  >
                    Elparchedelasminiburguers@gmail.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-base mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "League Spartan, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Horario
              </h4>
              <div
                className="p-4 rounded-xl"
                style={{ background: "rgba(250,243,224,0.06)" }}
              >
                <div className="flex justify-between py-1">
                  <span
                    className="text-base"
                    style={{ color: "rgba(250,243,224,0.8)" }}
                  >
                    Lun – Dom
                  </span>
                  <span
                    className="text-base font-semibold"
                    style={{ color: C.amber }}
                  >
                    {STORE_HOURS_LABEL}
                  </span>
                </div>
                <div
                  className="mt-3 text-sm"
                  style={{ color: "rgba(250,243,224,0.78)" }}
                >
                  <span className="mr-1 inline-flex align-middle">{Ico.mapPin}</span>
                  Domicilios disponibles en toda la zona
                </div>
              </div>
            </div>
            <div>
              <h4
                className="font-bold text-base mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "League Spartan, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Legal
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <button
                    onClick={() => setLegalModal("envios")}
                    className="text-base cursor-pointer hover:opacity-70 text-left"
                    style={{
                      color: "rgba(250,243,224,0.8)",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Política de Envíos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModal("legal")}
                    className="text-base cursor-pointer hover:opacity-70 text-left"
                    style={{
                      color: "rgba(250,243,224,0.8)",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Aviso Legal
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
            style={{ color: "rgba(250,243,224,0.6)" }}
          >
            <span>© 2024 El Parche de las Mini Burguer · Bello, Antioquia</span>
          </div>
        </div>
      </footer>

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
        className="landing-order-button landing-order-button-floating fixed bottom-28 left-4 right-20 z-40 rounded-full py-3 text-sm font-bold text-white shadow-lg sm:hidden"
        style={{ background: C.mustard }}
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
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setLegalModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#fff", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-bold text-base" style={{ color: "#18140A" }}>
                {legalModal === "envios" ? "Política de Envíos" : "Aviso Legal"}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="cursor-pointer"
                style={{ color: "rgba(30,30,30,0.4)" }}
              >
                {Ico.x}
              </button>
            </div>
            <div
              className="px-6 py-5 overflow-y-auto text-sm leading-relaxed"
              style={{
                color: "rgba(24,20,10,0.65)",
                maxHeight: "60vh",
                scrollbarWidth: "none",
              }}
            >
              {legalModal === "envios" ? (
                <div className="flex flex-col gap-3">
                  <p>
                    Realizamos domicilios en toda la zona. El costo y el tiempo
                    estimado de entrega se confirman según la dirección antes de
                    completar el pedido.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p>
                    El consumo de nuestros productos es responsabilidad del
                    cliente. Garantizamos calidad e higiene. Prohibida la
                    reproducción de marca sin autorización.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
