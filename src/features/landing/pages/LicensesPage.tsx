import { useEffect, useState } from "react"
import SiteFooter from "@/features/landing/components/SiteFooter"
import { LICENSE_LOGOS } from "@/features/landing/data/licenseLogos"
import { LICENSE_GROUPS, type LicenseClass } from "@/features/landing/data/licenses"
import SiteHeader from "@/shared/components/SiteHeader"
import { C } from "@/shared/styles/theme"

// Public page /licencias: the technologies and licenses the app uses, with the landing page's header and footer
export default function LicensesPage({
  account,
  cartCount,
  onCheckout,
  onLogin,
  onOrder,
  onNav,
  onHome,
}: {
  account?: React.ReactNode
  cartCount: number
  onCheckout: () => void
  onLogin: () => void
  onOrder: () => void
  // A header link (#menu, #nosotros…): its section of the home page
  onNav: (href: string) => void
  onHome: () => void
}) {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])
  const BG = dark ? "#13110E" : "#FAF4E8"
  const TEXT = dark ? "#F0E8D6" : "#18140A"
  const MUTED = dark ? "rgba(240,232,214,0.62)" : "rgba(24,20,10,0.62)"
  const CARD = dark ? "#211D17" : "#FFFDF7"
  const BORDER = dark ? "rgba(240,232,214,0.08)" : "rgba(24,20,10,0.08)"
  const ACCENT = dark ? C.mustard : "#8D6910"
  const CLASS_COLOR: Record<LicenseClass, string> = {
    "Código abierto permisivo": "#2E7D60",
    "Código abierto con copyleft": "#8D6910",
    "Software propietario": "#9B3D2E",
    "Estándar abierto": "#2F6690",
    "Servicio en la nube": "#6B4E9B",
  }
  const label = "text-[11px] font-bold uppercase tracking-wider"
  return (
    <div className="landing-page min-h-screen" style={{ background: BG, fontFamily: "DM Sans, sans-serif", color: TEXT }}>
      <SiteHeader
        account={account}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        cartCount={cartCount}
        onCart={onCheckout}
        onLogin={onLogin}
        onOrder={onOrder}
        onNav={onNav}
      />
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <button
          type="button"
          onClick={onHome}
          className="mb-8 inline-flex cursor-pointer items-center gap-2 text-base font-semibold hover:opacity-70"
          style={{ color: ACCENT, background: "none", border: "none" }}
        >
          ← Volver al inicio
        </button>
        <div className="mb-2 text-lg font-semibold" style={{ color: ACCENT }}>
          Legal
        </div>
        <h1
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
          Licencias de software y <span style={{ color: ACCENT }}>tecnologías utilizadas</span>
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed" style={{ color: TEXT }}>
          El Parche de las Mini Burguer está construido con software de código abierto, estándares web abiertos y
          servicios en la nube. Aquí está cada tecnología con su licencia o sus términos de uso, lo que permite hacer y
          el enlace a su texto oficial.
        </p>
        {/* Jump to a category */}
        <nav aria-label="Categorías" className="mt-6 flex flex-wrap gap-2">
          {LICENSE_GROUPS.map((group, i) => (
            <a
              key={group.title}
              href={`#licencias-${i}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(`licencias-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="rounded-full px-4 py-2 text-sm font-semibold hover:opacity-80"
              style={{ background: `${C.mustard}1F`, color: ACCENT }}
            >
              {group.title} · {group.items.length}
            </a>
          ))}
        </nav>

        {LICENSE_GROUPS.map((group, i) => (
          <section key={group.title} id={`licencias-${i}`} className="mt-14 scroll-mt-28">
            <h2
              className="landing-display-title font-black text-2xl"
              style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
            >
              {group.title}
            </h2>
            <p className="mt-1 mb-6 text-base" style={{ color: MUTED }}>
              {group.intro}
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((tech) => (
                <article
                  key={tech.name}
                  className="landing-info-card flex min-w-0 flex-col rounded-2xl p-6"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  {/* 1 Tecnología: its logo in the landing's gold tile (its initials when there is no logo) */}
                  <div className="flex min-w-0 items-start gap-4">
                    <span
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `${C.mustard}1F`, color: ACCENT }}
                    >
                      {tech.logo && LICENSE_LOGOS[tech.logo] ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label={`Logo de ${tech.name}`}>
                          <path d={LICENSE_LOGOS[tech.logo]} />
                        </svg>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="text-base font-black"
                          style={{ fontFamily: "League Spartan, sans-serif" }}
                        >
                          {tech.mono ?? tech.name.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3
                        className="landing-display-title break-words text-xl font-black leading-tight"
                        style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
                      >
                        {tech.name}
                      </h3>
                      {tech.version && (
                        <div className="mt-1 text-sm tabular-nums" style={{ color: MUTED }}>
                          Versión {tech.version}
                        </div>
                      )}
                    </div>
                  </div>
                  <dl className="mt-4 flex flex-1 flex-col gap-3">
                    {/* 2 Tipo de licencia */}
                    <div>
                      <dt className={label} style={{ color: MUTED }}>Tipo de licencia</dt>
                      <dd className="mt-0.5 text-base font-semibold" style={{ color: ACCENT }}>{tech.license}</dd>
                    </div>
                    {/* 3 Descripción y permisos */}
                    <div className="flex-1">
                      <dt className={label} style={{ color: MUTED }}>Descripción y permisos</dt>
                      <dd className="mt-0.5 text-base leading-relaxed" style={{ color: TEXT }}>{tech.description}</dd>
                    </div>
                    {/* 4 Clasificación */}
                    <div>
                      <dt className={label} style={{ color: MUTED }}>Clasificación</dt>
                      <dd className="mt-1">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                          style={{ background: `${CLASS_COLOR[tech.classification]}1A`, color: dark ? "#F0E8D6" : CLASS_COLOR[tech.classification] }}
                        >
                          {tech.classification}
                        </span>
                      </dd>
                    </div>
                    {/* 5 Enlace oficial */}
                    <div>
                      <dt className={label} style={{ color: MUTED }}>Enlace oficial</dt>
                      <dd className="mt-0.5">
                        <a
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words text-base font-semibold underline underline-offset-4 hover:opacity-70"
                          style={{ color: ACCENT }}
                        >
                          {tech.classification === "Servicio en la nube" ? "Ver términos oficiales" : tech.classification === "Estándar abierto" ? "Ver licencia del estándar" : "Ver licencia oficial"} ↗
                        </a>
                        {/* Where it leads: projects that only publish their license in their own repository */}
                        <span className="mt-0.5 block text-xs" style={{ color: MUTED }}>
                          {/github\.com/.test(tech.url) ? "En el repositorio oficial del proyecto" : "En el sitio oficial"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}

        <p className="mt-14 text-sm" style={{ color: MUTED }}>
          Las versiones corresponden a las dependencias instaladas en el frontend y el backend del aplicativo. Las
          licencias de cada paquete aplican al software; los servicios en la nube se rigen por sus propios términos.
          Los logos son de Simple Icons (CC0) y las marcas pertenecen a sus respectivos dueños.
        </p>
      </main>
      <SiteFooter onLicenses={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
    </div>
  )
}
