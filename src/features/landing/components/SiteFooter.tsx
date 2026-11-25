import { useState } from "react"
import logoImg from "@/imports/logo.png"
import { Ico } from "@/shared/components/icons"
import { C, WA } from "@/shared/styles/theme"
import { STORE_HOURS_LABEL } from "@/shared/utils/storeHours"

// The landing page's footer (brand, contact, hours, legal) with its two legal notes.
// Also at the bottom of «Licencias de software», so both pages share one footer.
export default function SiteFooter({ onLicenses }: { onLicenses: () => void }) {
  const [legalModal, setLegalModal] = useState<"envios" | "legal" | null>(null)
  return (
    <>

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
                <li>
                  <a
                    href="/licencias"
                    onClick={(e) => {
                      // A real link (it opens in a new tab too); a plain click stays in the app
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                      e.preventDefault()
                      onLicenses()
                    }}
                    className="text-base cursor-pointer hover:opacity-70 text-left"
                    // Same face as its neighbours (buttons take Barlow Condensed bold from index.css)
                    style={{ color: "rgba(250,243,224,0.8)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
                  >
                    Licencias de software
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
            style={{ color: "rgba(250,243,224,0.6)" }}
          >
            <span>© 2026 El Parche de las Mini Burguer · Bello, Antioquia</span>
          </div>
        </div>
      </footer>
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
    </>
  )
}
