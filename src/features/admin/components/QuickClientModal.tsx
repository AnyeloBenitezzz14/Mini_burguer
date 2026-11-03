import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import { DOC_TYPES, EMAIL_PATTERN, normalizeDocumentInput, normalizePhoneInput, validateDocumentNumber, validatePhoneNumber } from "@/shared/utils/validation"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function QuickClientModal(adminState: AdminPanelState): ReactNode {
  const {
    quickClientError,
    quickClientErrors,
    quickClientForm,
    quickClientOpen,
    saveQuickClient,
    setQuickClientError,
    setQuickClientErrors,
    setQuickClientForm,
    setQuickClientOpen,
    t,
  } = adminState
  if (!quickClientOpen) return null
  const updateQuickClientField = (
    key: string,
    rawValue: string,
    validateImmediately = false,
  ) => {
    const value =
      key === "2"
        ? normalizeDocumentInput(rawValue, quickClientForm["1"] ?? "")
        : key === "3"
          ? normalizePhoneInput(rawValue)
          : rawValue
    const nextForm = { ...quickClientForm, [key]: value }
    if (key === "1") {
      nextForm["2"] = normalizeDocumentInput(
        nextForm["2"] ?? "",
        value,
      )
    }
    setQuickClientForm(nextForm)
    if (validateImmediately || quickClientErrors[key] || quickClientError) {
      const required = ["0", "1", "2", "3", "4", "5"].includes(key)
      let error = required && !value.trim() ? "Este campo es obligatorio." : ""
      if (!error && key === "2" && value.trim()) {
        error = validateDocumentNumber(value, nextForm["1"] ?? "")
      }
      if (!error && key === "3" && value.trim()) error = validatePhoneNumber(value)
      if (!error && key === "4" && value.trim() && !EMAIL_PATTERN.test(value.trim())) {
        error = "Escribe un correo electrónico válido."
      }
      setQuickClientErrors((current) => {
        const updated = { ...current }
        if (error) updated[key] = error
        else delete updated[key]
        return updated
      })
      if (!error) setQuickClientError("")
    }
  }
  const field = (key: string, label: string, type = "text", options?: string[]) => (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
      {label}
      {options ? (
        <select value={quickClientForm[key] || ""} onBlur={() => updateQuickClientField(key, quickClientForm[key] || "", true)} onChange={(event) => updateQuickClientField(key, event.target.value)} aria-invalid={!!quickClientErrors[key]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm" style={{ background: t.input, border: `1px solid ${quickClientErrors[key] ? C.red : t.inputB}`, color: t.text }}>
          <option value="">Selecciona...</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input type={type} inputMode={key === "2" || key === "3" ? "numeric" : undefined} value={quickClientForm[key] || ""} onBlur={() => updateQuickClientField(key, quickClientForm[key] || "", true)} onChange={(event) => updateQuickClientField(key, event.target.value)} aria-invalid={!!quickClientErrors[key]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm" style={{ background: t.input, border: `1px solid ${quickClientErrors[key] ? C.red : t.inputB}`, color: t.text }} />
      )}
      {quickClientErrors[key] && <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>{quickClientErrors[key]}</span>}
    </label>
  )
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.68)" }}>
      <div className="flex max-h-[90vh] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div><h3 className="text-base font-semibold" style={{ color: t.text }}>Registrar cliente</h3><p className="text-xs" style={{ color: t.muted }}>Le llegará al correo una contraseña provisional para entrar a la app. Si no quiere dar sus datos, usa «Cliente mostrador».</p></div>
          <button type="button" onClick={() => setQuickClientOpen(false)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl" style={{ background: t.input, color: t.muted }}>{Ico.x}</button>
        </div>
        <div className="grid min-w-0 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("0", "Nombre completo *")}</div>
          <div className="sm:col-span-2">{field("3", "Teléfono *", "tel")}</div>
          {field("1", "Tipo de documento *", "text", DOC_TYPES)}
          {field("2", "Número de documento *")}
          {field("4", "Correo electrónico *", "email")}
          <div className="sm:col-span-2">{field("5", "Dirección *")}</div>
          {quickClientError && <p className="text-xs font-medium sm:col-span-2" style={{ color: C.red }}>{quickClientError}</p>}
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: `1px solid ${t.border}` }}>
          <button type="button" onClick={() => setQuickClientOpen(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold cursor-pointer" style={{ background: t.input, color: t.muted }}>Cancelar</button>
          <button type="button" onClick={saveQuickClient} className="flex-1 rounded-xl py-2.5 text-sm font-bold cursor-pointer" style={{ background: C.mustard, color: "#fff" }}>Registrar cliente</button>
        </div>
      </div>
    </div>
  )
}
