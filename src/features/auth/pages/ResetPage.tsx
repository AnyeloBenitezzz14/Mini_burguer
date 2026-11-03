import { useState } from "react"
import accessBackgroundImg from "@/imports/access-background.jpg"
import AuthLayout from "@/features/auth/components/AuthLayout"
import PinCodeField from "@/features/auth/components/PinCodeField"
import InputField from "@/shared/components/InputField"
import { api } from "@/shared/services/api"
import { C } from "@/shared/styles/theme"

export default function ResetPage({
  email,
  onDone,
  onBack,
  onLogin,
}: {
  email: string
  onDone: () => void
  onBack: () => void
  onLogin: () => void
}) {
  const [code, setCode] = useState("")
  const [verificationToken, setVerificationToken] = useState("")
  const [pass, setPass] = useState("")
  const [pass2, setPass2] = useState("")
  const [err, setErr] = useState("")
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [resendError, setResendError] = useState("")
  const resendCode = async () => {
    if (busy || resending) return
    setResending(true)
    setResendMessage("")
    setResendError("")
    try {
      await api("/auth/recuperar", "POST", { correo: email.trim() })
      setResendMessage(
        "Si ya pasó un minuto desde el último envío, te enviaremos un nuevo código. Revisa también la carpeta de spam.",
      )
    } catch (error) {
      setResendError((error as Error).message)
    } finally {
      setResending(false)
    }
  }
  if (ok)
    return (
      <AuthLayout
        title="¡Listo!"
        sub="Contraseña actualizada"
        backgroundImage={accessBackgroundImg}
        onBack={onBack}
        onLogoClick={onDone}
        compact
        wide
      >
        <div className="text-center py-1">
          <div className="mb-2 flex justify-center" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="h-12 w-12"
              style={{ color: "#2E7D60" }}
            >
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" />
              <path d="m15 24 6 6 12-13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            onClick={onDone}
            className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Iniciar sesión
          </button>
        </div>
      </AuthLayout>
    )
  return (
    <AuthLayout
      title={verificationToken ? "Nueva contraseña" : "Verifica tu correo"}
      backgroundImage={accessBackgroundImg}
      onBack={onBack}
      onLogoClick={onLogin}
      compact
      wide
      sub={
        <>
          Para <strong>{email}</strong>
        </>
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!verificationToken) {
            if (!/^\d{6}$/.test(code)) {
              setErr("El PIN debe tener 6 dígitos.")
              return
            }
            if (busy || resending) return
            setBusy(true)
            setErr("")
            try {
              const result = await api<{ token: string }>("/auth/recuperar/verificar", "POST", {
                correo: email.trim(),
                codigo: code,
              })
              if (!result?.token) throw new Error("No se pudo validar el código. Solicita uno nuevo.")
              setVerificationToken(result.token)
            } catch (error) {
              setErr((error as Error).message)
            } finally {
              setBusy(false)
            }
            return
          }
          if (pass !== pass2) {
            setErr("Las contraseñas no coinciden.")
            return
          }
          if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/\d/.test(pass)) {
            setErr("Usa al menos 8 caracteres, con una mayúscula, una minúscula y un número.")
            return
          }
          if (busy || resending) return
          setBusy(true)
          setErr("")
          api("/auth/restablecer", "POST", { correo: email.trim(), token: verificationToken, nueva: pass })
            .then(() => setOk(true))
            .catch((error) => setErr((error as Error).message))
            .finally(() => setBusy(false))
        }}
        className="flex flex-col gap-2"
      >
        {!verificationToken ? (
          <>
            <p className="text-sm" style={{ color: "rgba(30,30,30,0.55)" }}>
              Ingresa el PIN de 6 dígitos enviado a <strong>{email}</strong>.
            </p>
            <PinCodeField
              label="PIN de verificación"
              value={code}
              onChange={(value) => {
                setCode(value)
                if (err) setErr("")
              }}
              error={!verificationToken ? err : undefined}
            />
            <button
              type="button"
              onClick={resendCode}
              disabled={busy || resending}
              className="self-start text-sm font-semibold cursor-pointer disabled:cursor-wait disabled:opacity-60"
              style={{ color: C.mustard }}
            >
              {resending ? "Enviando código..." : "Reenviar código"}
            </button>
            {resendMessage && (
              <p className="text-xs" role="status" style={{ color: "rgba(30,30,30,0.6)" }}>
                {resendMessage}
              </p>
            )}
            {resendError && (
              <p className="text-sm" role="alert" style={{ color: C.red }}>
                {resendError}
              </p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            <InputField
              label="Nueva contraseña"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={setPass}
              required
            />
            <InputField
              label="Confirmar nueva contraseña"
              type="password"
              placeholder="••••••••"
              value={pass2}
              onChange={setPass2}
              required
            />
          </div>
        )}
        {err && verificationToken && (
          <p className="text-sm" style={{ color: C.red }} role="alert">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || resending}
          className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ background: C.mustard, color: "#fff" }}
        >
          {busy
            ? verificationToken
              ? "Guardando..."
              : "Verificando..."
            : verificationToken
              ? "Cambiar contraseña"
              : "Continuar"}
        </button>
      </form>
    </AuthLayout>
  )
}
