import { useEffect, useState } from "react"
import authFoodBackgroundImg from "@/imports/auth-food-new.png"
import AccessBackButton from "@/features/auth/components/AccessBackButton"
import AccessLoginLink from "@/features/auth/components/AccessLoginLink"
import AccessLogo from "@/features/auth/components/AccessLogo"
import AuthLayout from "@/features/auth/components/AuthLayout"
import AuthPhotoBackground from "@/features/auth/components/AuthPhotoBackground"
import PinCodeField from "@/features/auth/components/PinCodeField"
import { requestRegistrationCode, verifyRegistrationCode } from "@/features/auth/services/auth.service"
import { validateRegister } from "@/features/auth/utils/validation"
import FieldError from "@/shared/components/FieldError"
import InputField from "@/shared/components/InputField"
import { C } from "@/shared/styles/theme"
import type { User } from "@/shared/types"
import { DOC_TYPES, digitsOnly, normalizeAccountDocumentInput } from "@/shared/utils/validation"

export default function RegisterPage({
  onVerify,
  onLoginLink,
  onBack,
}: {
  onVerify: (u: User) => void
  onLoginLink: () => void
  onBack: () => void
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [tried, setTried] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    docType: "",
    docNum: "",
    email: "",
    phone: "",
    pass: "",
    pass2: "",
  })
  const errors = tried ? validateRegister(form) : {}
  const upd = (k: keyof typeof form) => (v: string) =>
    setForm((current) => ({
      ...current,
      [k]:
        k === "docNum"
          ? normalizeAccountDocumentInput(v, current.docType)
          : k === "phone"
            ? digitsOnly(v).slice(0, 10)
            : v,
    }))

  const newUser = (): User => ({
    name: `${form.name.trim()} ${form.lastname.trim()}`.trim(),
    email: form.email.trim().toLowerCase(),
    role: "user",
    docType: form.docType,
    phone: form.phone.replace(/\s/g, ""),
    cedula: form.docNum.trim(),
  })
  const [serverErr, setServerErr] = useState("")
  const [busy, setBusy] = useState(false)
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    setServerErr("")
    if (busy || Object.keys(validateRegister(form)).length) return
    setBusy(true)
    try {
      await requestRegistrationCode(newUser(), form.pass)
      setVerificationPending(true)
      setServerErr("")
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const verifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerErr("")
    if (!/^\d{6}$/.test(verificationCode)) {
      setServerErr("Escribe el código de 6 dígitos que te enviamos al correo.")
      return
    }
    if (busy) return
    setBusy(true)
    try {
      await verifyRegistrationCode(newUser().email, verificationCode)
      onVerify(newUser())
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  if (verificationPending) {
    return (
      <AuthLayout
        title="Verifica tu correo"
        backgroundImage={authFoodBackgroundImg}
        onBack={onBack}
        onLogoClick={onLoginLink}
        compact
        sub={
          <>
            Enviamos un código de 6 dígitos a <strong>{form.email}</strong>.
          </>
        }
      >
        <form onSubmit={verifyRegistration} noValidate className="flex flex-col gap-2.5">
          <PinCodeField
            label="PIN de verificación"
            value={verificationCode}
            onChange={setVerificationCode}
            error={tried && !/^\d{6}$/.test(verificationCode) ? "El PIN debe tener 6 dígitos." : undefined}
          />
          <p className="text-xs" style={{ color: "rgba(30,30,30,0.55)" }}>
            Revisa también la carpeta de correo no deseado. El código vence en 15 minutos.
          </p>
          <FieldError msg={serverErr} />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
            style={{ background: C.mustard, color: "#fff" }}
          >
            {busy ? "Verificando..." : "Verificar y crear cuenta"}
          </button>
          <button
            type="button"
            onClick={() => {
              setVerificationPending(false)
              setVerificationCode("")
              setServerErr("")
            }}
            className="w-full py-2 rounded-xl font-medium text-sm cursor-pointer"
            style={{ background: "rgba(30,30,30,0.05)", color: "rgba(30,30,30,0.5)" }}
          >
            ← Corregir mis datos
          </button>
          <AccessLoginLink onClick={onLoginLink} />
        </form>
      </AuthLayout>
    )
  }
  return (
    <div
      className="auth-access-page auth-register-page relative isolate min-h-screen flex items-center justify-center overflow-hidden px-4 py-8"
      style={{
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <AuthPhotoBackground src={authFoodBackgroundImg} />
      <AccessBackButton onClick={onBack} />
      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <div className="hidden px-5 text-white lg:block">
          <AccessLogo
            onClick={onLoginLink}
            className="mb-8 h-24 w-40 object-contain"
          />
          <h1
            className="mb-4 max-w-[400px] text-4xl font-black leading-tight"
            style={{ fontFamily: "League Spartan, sans-serif", color: "#fff" }}
          >
            Crea tu cuenta y pide más fácil.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-white/85">
            Guarda tus datos de entrega y disfruta tus hamburguesas favoritas
            sin repetir el proceso.
          </p>
        </div>
        <div
          className="mx-auto w-full max-w-[600px] rounded-3xl p-5 sm:p-6 lg:justify-self-center"
          style={{
            background: "#fff",
            boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
          }}
        >
          <div className="mb-4 flex justify-center lg:hidden">
            <AccessLogo
              onClick={onLoginLink}
              className="h-20 w-32 object-contain"
            />
          </div>
          <h2
            className="font-black text-xl mb-1"
            style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
          >
            Crear cuenta
          </h2>
          <div className="mb-6 text-sm" style={{ color: "rgba(30,30,30,0.45)" }}>
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={onLoginLink}
              className="font-semibold cursor-pointer"
              style={{ color: C.mustard }}
            >
              Inicia sesión
            </button>
          </div>
          <form onSubmit={submitForm} noValidate className="flex flex-col gap-2.5 [&_input]:px-4 [&_input]:py-2.5 [&_select]:px-4 [&_select]:py-2.5">
            {/* Document type first, its number right next to it */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-1 min-w-0">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "rgba(30,30,30,0.5)" }}
                >
                  Tipo de documento *
                </label>
                <select
                  value={form.docType}
                  onChange={(e) => {
                    const docType = e.target.value
                    setForm((current) => ({
                      ...current,
                      docType,
                      docNum: normalizeAccountDocumentInput(current.docNum, docType),
                    }))
                  }}
                  aria-invalid={!!errors.docType}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(30,30,30,0.05)",
                    border: `1.5px solid ${errors.docType ? C.red : "rgba(30,30,30,0.12)"}`,
                    color: form.docType ? "#1A1714" : "rgba(30,30,30,0.35)",
                  }}
                >
                  <option value="">Selecciona tipo...</option>
                  {DOC_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.docType} />
              </div>
              <InputField
                label="Nº Documento *"
                placeholder="123456789"
                value={form.docNum}
                onChange={upd("docNum")}
                required
                error={errors.docNum}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <InputField
                label="Nombre *"
                placeholder="Tu nombre"
                value={form.name}
                onChange={upd("name")}
                required
                error={errors.name}
              />
              <InputField
                label="Apellido"
                placeholder="Tu apellido"
                value={form.lastname}
                onChange={upd("lastname")}
                error={errors.lastname}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <InputField
                label="Teléfono"
                type="tel"
                placeholder="3XX XXX XXXX"
                value={form.phone}
                onChange={upd("phone")}
                error={errors.phone}
              />
              <InputField
                label="Correo *"
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={upd("email")}
                required
                error={errors.email}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <InputField
                label="Contraseña *"
                type="password"
                placeholder="••••••••"
                value={form.pass}
                onChange={upd("pass")}
                required
                error={errors.pass}
              />
              <InputField
                label="Confirmar *"
                type="password"
                placeholder="••••••••"
                value={form.pass2}
                onChange={upd("pass2")}
                required
                error={errors.pass2}
              />
            </div>
            {!errors.pass && (
              <p className="text-[11px]" style={{ color: "rgba(30,30,30,0.45)" }}>
                Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.
              </p>
            )}
            <FieldError msg={serverErr} />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {busy ? "Creando cuenta..." : "Crear cuenta →"}
            </button>
            <AccessLoginLink onClick={onLoginLink} />
          </form>
        </div>
      </div>
    </div>
  )
}
