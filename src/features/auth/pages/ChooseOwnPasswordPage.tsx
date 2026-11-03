import { useState } from "react"
import accessBackgroundImg from "@/imports/access-background.jpg"
import AuthLayout from "@/features/auth/components/AuthLayout"
import FieldError from "@/shared/components/FieldError"
import InputField from "@/shared/components/InputField"
import { api } from "@/shared/services/api"
import { C } from "@/shared/styles/theme"
import type { User } from "@/shared/types"
import { saveLS } from "@/shared/utils/storage"
import { passwordErrors } from "@/shared/utils/validation"

// After logging in with the provisional password from the sign-up e-mail
export default function ChooseOwnPasswordPage({
  user,
  onDone,
  onLogout,
}: {
  user: User
  onDone: () => void
  onLogout: () => void
}) {
  const [pass, setPass] = useState("")
  const [pass2, setPass2] = useState("")
  const [tried, setTried] = useState(false)
  const [serverErr, setServerErr] = useState("")
  const [busy, setBusy] = useState(false)
  const errors = tried ? passwordErrors(pass, pass2) : {}
  return (
    <AuthLayout
      title="Crea tu contraseña"
      backgroundImage={accessBackgroundImg}
      onBack={onLogout}
      onLogoClick={onLogout}
      sub={
        <>
          Hola <strong>{user.name}</strong>, cambia la contraseña provisional por una propia
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          setServerErr("")
          if (busy || Object.keys(passwordErrors(pass, pass2)).length) return
          setBusy(true)
          api<{ token: string }>("/auth/me/contrasena-inicial", "PATCH", { nueva: pass })
            .then(({ token }) => {
              saveLS("token", token) // the new token no longer carries the "must change" mark
              onDone()
            })
            .catch((err) => setServerErr((err as Error).message))
            .finally(() => setBusy(false))
        }}
        className="flex flex-col gap-3"
      >
        <InputField
          label="Nueva contraseña"
          type="password"
          placeholder="••••••••"
          value={pass}
          onChange={setPass}
          required
          error={errors.pass}
        />
        <InputField
          label="Confirmar"
          type="password"
          placeholder="••••••••"
          value={pass2}
          onChange={setPass2}
          required
          error={errors.pass2}
        />
        {!errors.pass && (
          <p className="text-[11px]" style={{ color: "rgba(30,30,30,0.45)" }}>
            Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.
          </p>
        )}
        <FieldError msg={serverErr} />
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ background: C.mustard, color: "#fff" }}
        >
          {busy ? "Guardando..." : "Guardar y continuar"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: "rgba(30,30,30,0.05)", color: "rgba(30,30,30,0.5)" }}
        >
          Cerrar sesión
        </button>
      </form>
    </AuthLayout>
  )
}
