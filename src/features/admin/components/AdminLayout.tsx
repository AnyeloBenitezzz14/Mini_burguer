import AdminProfilePage from "@/features/admin/pages/AdminProfilePage"
import { saveProfile } from "@/features/profile/services/profile.service"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { User } from "@/shared/types"
import { loadLS, saveLS } from "@/shared/utils/storage"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function AdminLayout(adminState: AdminPanelState): ReactNode {
  const {
    AnulModal,
    CRUDModal,
    Dashboard,
    DelModal,
    GenericTable,
    PaymentRejectionModal,
    ProductionPncModal,
    QuickClientModal,
    SidebarContent,
    dark,
    dropRef,
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    notificationsOpen,
    notificationsRef,
    onSwitchToClient,
    profileOpen,
    readNotifications,
    errorToast,
    setErrorToast,
    notifyError,
    saveToast,
    section,
    sectionLabel,
    setNotificationsOpen,
    setProfileOpen,
    setSection,
    setShowAdminProfile,
    setSidebarCollapsed,
    setSidebarOpen,
    setTheme,
    setUndoAnul,
    showAdminProfile,
    sidebarCollapsed,
    sidebarOpen,
    t,
    toggleStatus,
    undoAnul,
    unreadNotifications,
    user,
  } = adminState
  return (
    <div
      className="admin-panel flex h-screen overflow-hidden"
      data-theme={dark ? "dark" : "light"}
      style={{ background: t.bg, fontFamily: "DM Sans, sans-serif" }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* On desktop it keeps the icons' width; the open menu floats over the content */}
      <div className="hidden lg:block w-[72px] flex-shrink-0" />
      <aside
        onMouseEnter={() => window.innerWidth >= 1024 && setSidebarCollapsed(false)}
        onMouseLeave={() => window.innerWidth >= 1024 && setSidebarCollapsed(true)}
        className={`fixed inset-y-0 left-0 z-50 flex w-[208px] flex-col overflow-hidden transition-[transform,width,box-shadow] duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-[72px]" : "lg:shadow-2xl"}`}
        style={{
          background: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBd}`,
          flexShrink: 0,
        }}
      >
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="admin-header flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: t.hdrBg, borderBottom: `1px solid ${t.hdrBd}` }}
        >
          {/* Only on phones/tablets, where there is no cursor to open the menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir el menú"
            className="lg:hidden p-2 rounded-xl cursor-pointer"
            style={{ color: t.muted, background: t.input }}
          >
            {Ico.menu}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {/* Admin notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                title="Notificaciones"
                aria-label={`Notificaciones, ${unreadNotifications} sin leer`}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setProfileOpen(false)
                }}
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl"
                style={{
                  background: notificationsOpen ? t.inputB : t.input,
                  color: notificationsOpen ? C.mustard : t.muted,
                }}
              >
                <span className={`flex ${unreadNotifications > 0 ? "admin-bell-ring" : ""}`}>{Ico.bell}</span>
                {unreadNotifications > 0 && (
                  <span
                    key={unreadNotifications}
                    className="admin-badge-pop absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 font-bold"
                    style={{
                      background: C.red,
                      color: "#fff",
                      fontSize: "0.5rem",
                    }}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Notificaciones del administrador"
                  className="admin-pop fixed left-4 right-4 top-16 z-[60] min-w-0 overflow-hidden rounded-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[360px]"
                  style={{
                    background: t.card,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    className="flex min-w-0 items-center gap-2 px-4 py-3"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    <span style={{ color: C.mustard }}>{Ico.bell}</span>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-sm font-semibold"
                        style={{ color: t.text }}
                      >
                        Notificaciones
                      </h2>
                      <p className="text-[11px]" style={{ color: t.muted }}>
                        {unreadNotifications > 0
                          ? `${unreadNotifications} sin leer`
                          : "Estás al día"}
                      </p>
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold cursor-pointer"
                        style={{
                          color: C.mustard,
                          background: `${C.mustard}12`,
                        }}
                      >
                        {Ico.check} Marcar leídas
                      </button>
                    )}
                  </div>

                  <div
                    className="min-w-0 overflow-y-auto"
                    style={{ maxHeight: "min(420px, 58vh)" }}
                  >
                    {notifications.map((notification) => {
                      const isRead = readNotifications.has(notification.id)
                      const color =
                        notification.type === "danger"
                          ? C.red
                          : notification.type === "warn"
                            ? C.mustard
                            : "#4FC3F7"
                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(notification.id)
                            setSection(notification.target)
                            setNotificationsOpen(false)
                          }}
                          className="flex w-full min-w-0 cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors"
                          style={{
                            background: isRead ? t.card : t.input,
                            borderBottom: `1px solid ${t.border}`,
                          }}
                        >
                          <span
                            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ color, background: `${color}16` }}
                          >
                            {Ico.alert}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-start gap-2">
                              <span
                                className="min-w-0 flex-1 text-xs font-semibold break-words [overflow-wrap:anywhere]"
                                style={{ color: t.text }}
                              >
                                {notification.title}
                              </span>
                              {!isRead && (
                                <span
                                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                                  style={{ background: C.red }}
                                />
                              )}
                            </span>
                            <span
                              className="mt-0.5 block text-xs leading-snug break-words [overflow-wrap:anywhere]"
                              style={{ color: t.muted }}
                            >
                              {notification.message}
                            </span>
                            <span
                              className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]"
                              style={{ color: t.subtle }}
                            >
                              <span>{notification.module}</span>
                              <span>·</span>
                              <span>{notification.time}</span>
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="px-4 py-3" style={{ background: t.cardAlt }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSection("dashboard")
                        setNotificationsOpen(false)
                        setTimeout(() => {
                          document.getElementById("admin-alerts-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }, 100)
                      }}
                      className="w-full cursor-pointer text-center text-xs font-semibold"
                      style={{ color: C.mustard }}
                    >
                      Ver todas en el Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() =>
                setTheme((th) => (th === "light" ? "dark" : "light"))
              }
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
              style={{
                background: t.input,
                border: `1px solid ${t.inputB}`,
                color: t.muted,
              }}
            >
              <span key={dark ? "sun" : "moon"} className="admin-theme-spin flex">
                {dark ? Ico.sun : Ico.moon}
              </span>
            </button>
            <button
              onClick={onSwitchToClient}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {Ico.globe} {user ? "App" : "Sitio"}
            </button>
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => {
                  setProfileOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                {user?.name?.charAt(0) ?? "A"}
              </button>
              {profileOpen && (
                <div
                  className="admin-pop absolute right-0 top-10 w-48 rounded-xl overflow-hidden z-50"
                  style={{
                    background: t.card,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    <div
                      className="font-semibold text-xs"
                      style={{ color: t.text }}
                    >
                      {user?.name ?? "Administrador"}
                    </div>
                    <div className="text-xs" style={{ color: t.muted }}>
                      {user?.email ?? "admin@parche.co"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      setShowAdminProfile(true)
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs cursor-pointer"
                    style={{ color: C.mustard }}
                  >
                    {Ico.user}
                    <span>Mi perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onSwitchToClient()
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs cursor-pointer"
                    style={{ color: C.red }}
                  >
                    {Ico.logout}
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="mb-5">
            <h1 key={section} className="admin-title-enter font-semibold text-lg" style={{ color: t.text }}>
              {sectionLabel}
            </h1>
          </div>
          {/* Keyed by section so each module fades in when it is opened */}
          <div key={section} className={section === "dashboard" ? "admin-section-enter" : undefined}>
            {section === "dashboard" && Dashboard()}
            {section !== "dashboard" && <GenericTable />}
          </div>
        </main>
      </div>
      {undoAnul && (
        <div
          role="status"
          className="admin-toast-enter fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-4 rounded-xl px-4 py-3 text-sm shadow-lg"
          style={{ background: "#2a2116", color: "#FAF3E0" }}
        >
          <span>Se anuló «{undoAnul.name}».</span>
          <button
            type="button"
            onClick={() => {
              toggleStatus(undoAnul.sec, undoAnul.idx, undoAnul.statusIndex)
              setUndoAnul(null)
            }}
            className="cursor-pointer font-bold underline"
            style={{ color: C.mustard }}
          >
            Deshacer
          </button>
        </div>
      )}
      {errorToast && (
        <div
          key={errorToast.id}
          role="alert"
          className="admin-toast-enter fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg"
          style={{ background: "#3a1712", color: "#FBE9E5", border: `1px solid ${C.red}` }}
        >
          <span className="mt-0.5 flex-shrink-0" style={{ color: "#F28B7A" }}>{Ico.alert}</span>
          <span className="min-w-0 flex-1 break-words">{errorToast.message}</span>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            aria-label="Cerrar aviso"
            className="flex-shrink-0 cursor-pointer opacity-70 hover:opacity-100"
          >
            {Ico.x}
          </button>
        </div>
      )}
      {saveToast && !undoAnul && (
        <div
          role="status"
          className="admin-toast-enter fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          style={{ background: "#2a2116", color: "#FAF3E0" }}
        >
          <span style={{ color: C.mustard }}>{Ico.check}</span>
          {saveToast}
        </div>
      )}
      {CRUDModal()}
      {ProductionPncModal()}
      <QuickClientModal />
      <AnulModal />
      <PaymentRejectionModal />
      <DelModal />
      {showAdminProfile && user && (
        <AdminProfilePage
          user={user}
          onClose={() => setShowAdminProfile(false)}
          onUpdateUser={(u) => {
            // What was just typed wins over the copy in this browser (it keeps the photo)
            const saved = loadLS<User | null>(`profile:${u.email.toLowerCase()}`, null)
            const updatedUser = saved ? { ...saved, ...u, role: u.role } : u
            saveLS(`profile:${u.email.toLowerCase()}`, updatedUser)
            window.dispatchEvent(new CustomEvent("admin-user-updated", { detail: updatedUser }))
            // And in the backend, so Usuarios / Clientes show it
            saveProfile(updatedUser).catch((err) => notifyError(`No se pudieron guardar tus datos: ${(err as Error).message}`))
          }}
        />
      )}
    </div>
  )
}
