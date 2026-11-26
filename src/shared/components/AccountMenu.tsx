import { useEffect, useRef, useState } from "react"
import { C } from "@/shared/styles/theme"
import type { User } from "@/shared/types"

// ── Client Web App ─────────────────────────────────────────────────────────────
// The signed-in person's photo (or initial) with their menu: profile, orders, admin panel and sign out
export default function AccountMenu({
  user,
  dark,
  onProfile,
  onOrders,
  onAdmin,
  onLogout,
}: {
  user: User
  dark: boolean
  onProfile: () => void
  onOrders: () => void
  onAdmin: () => void
  onLogout: () => void
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])
  const TEXT = dark ? "#F0E8D6" : "#18140A"
  const MUTED = dark ? "rgba(240,232,214,0.48)" : "rgba(24,20,10,0.5)"
  const BORDER = dark ? "rgba(240,232,214,0.07)" : "rgba(24,20,10,0.08)"
  return (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer overflow-hidden"
                style={{ background: "#FAF4E8", color: C.mustard, border: `1.5px solid ${C.mustard}` }}
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-11 w-52 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: dark ? "#1E1C18" : "#fff",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div
                    className="px-4 py-3.5"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="font-semibold text-sm"
                      style={{ color: TEXT }}
                    >
                      {user.name}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onProfile()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                    style={{ color: C.mustard }}
                  >
                    Mi perfil
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onOrders()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                    style={{ color: TEXT }}
                  >
                    Mis pedidos
                  </button>
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onAdmin()
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                      style={{ color: C.amber }}
                    >
                      Panel Admin
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                    style={{ color: C.red }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
  )
}
