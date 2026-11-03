import { useState } from "react"
import accessBackgroundImg from "@/imports/access-background.jpg"
import AuthLayout from "@/features/auth/components/AuthLayout"
import InputField from "@/shared/components/InputField"
import { api } from "@/shared/services/api"
import { C } from "@/shared/styles/theme"
import { emailError } from "@/shared/utils/validation"

export default function ForgotPage({
  onReset,
  onBack,
  onLogin,
}: {
  onReset: (email: string) => void
  onBack: () => void
  onLogin: () => void
}) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [emailErr, setEmailErr] = useState("")
  const [busy, setBusy] = useState(false)
  if (sent)
    return (
      <AuthLayout
        title="Revisa tu correo"
        sub="Si está registrado, te llegará un código"
        backgroundImage={accessBackgroundImg}
        onBack={onBack}
        onLogoClick={onLogin}
        compact
        wide
      >
        <div className="text-center py-1">
          <div className="mb-2 flex justify-center" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="h-12 w-12"
              style={{ color: C.mustard }}
            >
              <rect x="5" y="9" width="38" height="30" rx="6" stroke="currentColor" strokeWidth="2.5" />
              <path d="m7 13 17 13 17-13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm mb-3" style={{ color: "rgba(30,30,30,0.55)" }}>
            Si <strong>{email}</strong> está registrado, se le enviará un código a su correo. Vence en 15 minutos;
            si no lo ves, revisa también la carpeta de spam.
          </p>
          <button
            onClick={() => onReset(email)}
            className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-1 w-full rounded-xl py-1.5 text-sm font-medium cursor-pointer"
            style={{ color: "rgba(30,30,30,0.55)" }}
          >
            Usar otro correo
          </button>
        </div>
      </AuthLayout>
    )
  return (
    <AuthLayout
      title="Recuperar contraseña"
      sub="Se enviará un código si el correo existe."
      backgroundImage={accessBackgroundImg}
      onBack={onBack}
      onLogoClick={onLogin}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const error = emailError(email)
          setEmailErr(error)
          if (error || busy) return
          setBusy(true)
          api("/auth/recuperar", "POST", { correo: email.trim() })
            .then(() => setSent(true))
            .catch((err) => {
              const message = (err as Error).message
              setEmailErr(
                /no está registrado|no registrado|no existe/i.test(message)
                  ? "Se enviará un código si el correo existe."
                  : message,
              )
            })
            .finally(() => setBusy(false))
        }}
        className="flex flex-col gap-2.5"
      >
        <InputField
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(value) => {
            setEmail(value)
            if (emailErr) setEmailErr(emailError(value))
          }}
          required
          error={emailErr}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ background: C.mustard, color: "#fff" }}
        >
          {busy ? "Enviando..." : "Enviar código"}
        </button>
      </form>
    </AuthLayout>
  )
}
