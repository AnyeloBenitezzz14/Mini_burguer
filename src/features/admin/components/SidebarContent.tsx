import logoImg from "@/imports/logo.png"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminSection } from "@/shared/types"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function SidebarContent(adminState: AdminPanelState): ReactNode {
  const {
    dark,
    hideOnMini,
    onLogout,
    onSwitchToClient,
    open,
    preserveSidebarScroll,
    section,
    setSection,
    setSidebarCollapsed,
    setSidebarOpen,
    sidebarCollapsed,
    sidebarScrollTop,
    t,
    toggleGrp,
    newOrders,
    animatedGroup,
    setAnimatedGroup,
    user,
    visibleMenu,
  } = adminState
return (
  <>
    <div
      className="flex items-center justify-between px-3 py-4"
      style={{ borderBottom: `1px solid ${t.sidebarBd}` }}
    >
      <button
        type="button"
        onClick={onSwitchToClient}
        aria-label="Volver al menú principal"
        className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left"
      >
        <img
          src={logoImg}
          alt="Logo"
          className="h-12 w-12 flex-shrink-0 object-contain"
        />
        <div className={`min-w-0 ${hideOnMini}`}>
          <div
            className="font-semibold text-sm truncate"
            style={{ fontFamily: "League Spartan, sans-serif", color: C.mustard }}
          >
            El Parche
          </div>
          <div className="text-xs" style={{ color: t.sidebarMu }}>
            Mini Burguer · Admin
          </div>
        </div>
      </button>
      <button
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
        style={{ color: t.sidebarMu, background: t.inputB }}
      >
        {Ico.x}
      </button>
    </div>
    <nav
      ref={preserveSidebarScroll}
      onScroll={(event) => {
        sidebarScrollTop.current = event.currentTarget.scrollTop
      }}
      className="flex-1 overflow-y-auto py-3 px-2"
      style={{ scrollbarWidth: "none" }}
    >
      {visibleMenu.map((g) => {
        const leaf = g.children.length === 0
        const active = leaf && section === g.key
        const anyChild = g.children.some((c) => c.key === section)
        return (
          <div key={g.key} className="mb-0.5">
            <button
              onClick={() => {
                if (leaf) {
                  setSection(g.key as AdminSection)
                  setSidebarOpen(false)
                } else if (sidebarCollapsed && window.innerWidth >= 1024) {
                  // Its modules need their names: open the menu with this group expanded
                  setSidebarCollapsed(false)
                  if (!open.includes(g.key)) toggleGrp(g.key)
                } else toggleGrp(g.key)
              }}
              title={sidebarCollapsed ? g.label : undefined}
              aria-label={g.label}
              className="admin-nav-item w-full flex items-center gap-2.5 px-[19px] py-2.5 rounded-xl cursor-pointer"
              style={{
                background: active
                  ? `${g.color}18`
                  : anyChild
                    ? dark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)"
                    : "transparent",
              }}
            >
              <span
                className="relative flex w-[18px] flex-shrink-0 justify-center"
                style={{ color: active || anyChild ? g.color : t.sidebarMu }}
              >
                {g.icon}
                {/* Closed menu: a dot on Ventas when there are new orders */}
                {g.children.some((c) => c.key === "pedidos") && newOrders.length > 0 && (
                  <span aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full" style={{ background: C.red, boxShadow: `0 0 0 2px ${t.sidebarBg}` }} />
                )}
              </span>
              <span
                className={`flex-1 truncate text-left text-xs font-medium ${hideOnMini}`}
                style={{ color: active ? g.color : t.sidebarTx }}
              >
                {g.label}
              </span>
              {!leaf && (
                <span
                  className={hideOnMini}
                  style={{
                    color: t.sidebarMu,
                    transform: open.includes(g.key)
                      ? "rotate(180deg)"
                      : "none",
                    transition: "transform 0.2s, opacity 220ms ease 90ms",
                    display: "inline-flex",
                  }}
                >
                  {Ico.chevDown}
                </span>
              )}
            </button>
            {!leaf && open.includes(g.key) && (
              <div className={`admin-subnav ${hideOnMini}`}>
              <div
                className={`${animatedGroup === g.key ? "admin-subnav-open" : ""} ml-5 mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden`}
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget.lastElementChild) setAnimatedGroup(null)
                }}
                style={{ borderLeft: `1.5px solid ${t.sidebarBd}` }}
              >
                {g.children.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSection(item.key as AdminSection)
                      setSidebarOpen(false)
                    }}
                    className="admin-subnav-item w-full text-left pr-3 py-2 rounded-lg cursor-pointer"
                    style={{
                      paddingLeft: "18.5px",
                      background:
                        section === item.key ? `${g.color}14` : "transparent",
                    }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: section === item.key ? g.color : t.sidebarTx,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.key === "pedidos" && newOrders.length > 0 && (
                      <span
                        className="admin-badge-pop ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                        style={{ background: C.red, color: "#fff" }}
                        aria-label={`${newOrders.length} pedidos nuevos`}
                      >
                        {newOrders.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
    <div
      className="px-3 py-3"
      style={{ borderTop: `1px solid ${t.sidebarBd}` }}
    >
      <button
        onClick={onSwitchToClient}
        title={sidebarCollapsed ? (user ? "Vista de cliente" : "Ver sitio") : undefined}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-80`}
        style={{ color: t.sidebarMu }}
      >
        {Ico.globe}
        <span className={hideOnMini}>{user ? "Vista de cliente" : "Ver sitio"}</span>
      </button>
      <button
        onClick={onLogout}
        title={sidebarCollapsed ? "Cerrar sesión" : undefined}
        className={`mt-1 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-80`}
        style={{ color: C.red }}
      >
        {Ico.logout}
        <span className={hideOnMini}>Cerrar sesión</span>
      </button>
    </div>
  </>
)
}
