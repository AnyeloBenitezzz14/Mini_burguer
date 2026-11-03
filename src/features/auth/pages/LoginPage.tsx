import { useEffect, useState } from "react"
import loginBackgroundImg from "@/imports/auth-login-new.jpg"
import logoImg from "@/imports/logo.png"
import AccessBackButton from "@/features/auth/components/AccessBackButton"
import AuthPhotoBackground from "@/features/auth/components/AuthPhotoBackground"
import { apiLogin } from "@/features/auth/services/auth.service"
import { validateLogin } from "@/features/auth/utils/validation"
import FieldError from "@/shared/components/FieldError"
import InputField from "@/shared/components/InputField"
import { C } from "@/shared/styles/theme"
import type { User } from "@/shared/types"

export default function LoginPage({
  onLogin,
  onRegister,
  onForgot,
  onBack,
}: {
  onLogin: (u: User) => void
  onRegister: () => void
  onForgot: () => void
  onBack: () => void
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  // Errors show after the first submit and update live while typing
  const [tried, setTried] = useState(false)
  const [serverErr, setServerErr] = useState("")
  const [busy, setBusy] = useState(false)
  // Password and account status are checked by the backend
  const errors = tried ? validateLogin(email, pass) : {}
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    setServerErr("")
    if (busy || Object.keys(validateLogin(email, pass)).length) return
    setBusy(true)
    try {
      onLogin(await apiLogin(email, pass))
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      className="auth-access-page auth-login-page relative isolate min-h-screen flex items-center justify-center overflow-hidden px-4 py-8 sm:px-8"
      style={{
        background: "#080d0f",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <AuthPhotoBackground src={loginBackgroundImg} />
      <AccessBackButton onClick={onBack} />
      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="hidden px-4 lg:block">
          <img
            src={logoImg}
            alt="El Parche"
            className="mb-5 h-36 w-36 object-contain"
          />
          <div
            className="mb-3 text-sm font-bold uppercase tracking-widest"
            style={{ color: "#D6B44B" }}
          >
            Bienvenido a El Parche
          </div>
          <h1
            className="mb-4 text-4xl font-black leading-tight"
            style={{ fontFamily: "League Spartan, sans-serif", color: "#fff" }}
          >
            Tu próximo antojo empieza aquí.
          </h1>
          <p
            className="max-w-md text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.88)" }}
          >
            Inicia sesión para guardar tus datos, repetir tus pedidos y seguir
            cada entrega.
          </p>
        </div>
        <div
          className="mx-auto w-full max-w-lg rounded-3xl p-5 sm:p-6"
          style={{
            background: "#fff",
            boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
          }}
        >
          <div className="mb-4 flex items-center justify-center gap-3 lg:hidden">
            <img
              src={logoImg}
              alt="El Parche"
              className="h-28 w-28 object-contain"
            />
          </div>
          <h2
            className="font-black text-2xl mb-1"
            style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
          >
            Iniciar sesión
          </h2>
          <div
            className="text-sm mb-4"
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            Accede a tu cuenta para continuar
          </div>
          <form onSubmit={submit} noValidate className="flex flex-col gap-2.5">
            <InputField
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
              error={errors.email}
            />
            <InputField
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={setPass}
              required
              error={errors.pass}
            />
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-right cursor-pointer"
              style={{ color: C.mustard }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <FieldError msg={serverErr} />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {busy ? "Ingresando..." : "Iniciar sesión"}
            </button>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "rgba(30,30,30,0.3)" }}
            >
              <span
                className="h-px flex-1"
                style={{ background: "rgba(30,30,30,0.1)" }}
              />
              <span>o</span>
              <span
                className="h-px flex-1"
                style={{ background: "rgba(30,30,30,0.1)" }}
              />
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              style={{ background: "rgba(182,140,28,0.10)", color: C.mustard }}
            >
              Crear una cuenta
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
