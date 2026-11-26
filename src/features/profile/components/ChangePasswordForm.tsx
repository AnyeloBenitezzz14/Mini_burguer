import { useState } from "react"
import { api } from "@/shared/services/api"
import type { User } from "@/shared/types"
import { getPasswordError } from "@/shared/utils/validation"

// ── Change Password Form ─────────────────────────────────────────────────────────
export default function ChangePasswordForm({
  user,
  onUpdateUser,
}: {
  user: User
  onUpdateUser: (u: User) => void
}) {
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const MUSTARD = "#8F6C12"
  const RED = "#A54131"
  const TEXT = "#1A1714"
  const MUTED = "rgba(30,30,30,0.5)"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!currentPass) {
      setError("Escribe tu contraseña actual.")
      return
    }

    // Validate new password
    const passwordError = getPasswordError(newPass)
    if (passwordError) {
      setError(passwordError.replace("Crea una contraseña.", "Escribe una nueva contraseña."))
      return
    }
    if (newPass !== confirmPass) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (newPass === currentPass) {
      setError("La nueva contraseña debe ser diferente a la actual.")
      return
    }

    // The backend checks the current password and saves the new one
    try {
      await api("/auth/me/contrasena", "PATCH", { actual: currentPass, nueva: newPass })
    } catch (err) {
      setError((err as Error).message)
      return
    }
    setCurrentPass("")
    setNewPass("")
    setConfirmPass("")
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Contraseña actual
        </label>
        <input
          type="password"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Nueva contraseña
        </label>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Confirmar nueva contraseña
        </label>
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-xs" style={{ color: RED }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs" style={{ color: "#2E7D60" }}>
          ¡Contraseña actualizada exitosamente!
        </p>
      )}
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
        style={{ background: MUSTARD, color: "#fff" }}
      >
        Actualizar contraseña
      </button>
    </form>
  )
}
