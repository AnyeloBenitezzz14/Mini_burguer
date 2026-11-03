import type { FieldErrors } from "@/shared/types"

export const DOC_TYPES = ["Cédula de Ciudadanía", "Cédula Extranjería", "NIT", "Pasaporte"]

// One rule per document type for every form (registro, usuarios, clientes, ventas, proveedores).
// The backend accepts 6 to 10 characters.
export const DOC_RULES: Record<string, { re: RegExp; msg: string }> = {
  "Cédula de Ciudadanía": { re: /^\d{6,10}$/, msg: "La cédula debe tener entre 6 y 10 números, sin puntos ni espacios." },
  "Cédula Extranjería": { re: /^\d{6,10}$/, msg: "La cédula de extranjería debe tener entre 6 y 10 números." },
  NIT: { re: /^\d{9,10}$/, msg: "El NIT debe tener 9 números, o 10 con el dígito de verificación (sin guion)." },
  Pasaporte: { re: /^[A-Za-z0-9]{6,10}$/, msg: "El pasaporte debe tener entre 6 y 10 letras o números, sin espacios." },
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const digitsOnly = (value: string) => value.replace(/\D/g, "")

// While typing: only the characters the type allows, at most 10
export const normalizeDocumentInput = (value: string, docType: string) =>
  (docType === "Pasaporte" ? value.replace(/[^a-zA-Z0-9]/g, "") : digitsOnly(value)).slice(0, 10)

export const normalizeAccountDocumentInput = normalizeDocumentInput

export const normalizePhoneInput = (value: string) =>
  value.replace(/[^0-9+()\s-]/g, "").slice(0, 20)

export const validateDocumentNumber = (value: string, docType: string) => {
  const document = value.trim()
  if (!document) return "Este campo es obligatorio."
  if (!docType) return "Primero elige el tipo de documento."
  const rule = DOC_RULES[docType]
  return !rule || rule.re.test(document) ? "" : rule.msg
}

export const validatePhoneNumber = (value: string) => {
  const digits = digitsOnly(value)
  return digits.length >= 7 && digits.length <= 15
    ? ""
    : "Escribe un teléfono válido (de 7 a 15 dígitos)."
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/

// Same rules under the names the production/registro code uses
export const getPasswordError = (password: string) => passwordErrors(password, password).pass ?? ""

export const validateAccountDocumentNumber = (value: string, docType: string) => validateDocumentNumber(value, docType)

export function emailError(email: string) {
  if (!email.trim()) return "Ingresa tu correo electrónico."
  if (!EMAIL_RE.test(email.trim()))
    return "Escribe un correo válido, por ejemplo nombre@correo.com."
  return ""
}

export function passwordErrors(pass: string, pass2: string): FieldErrors {
  const e: FieldErrors = {}
  if (!pass) e.pass = "Crea una contraseña."
  else {
    const missing = [
      pass.length < 8 && "mínimo 8 caracteres",
      !/[A-Z]/.test(pass) && "una mayúscula",
      !/[a-z]/.test(pass) && "una minúscula",
      !/\d/.test(pass) && "un número",
    ].filter(Boolean)
    if (missing.length) e.pass = `La contraseña necesita ${missing.join(", ")}.`
  }
  if (!pass2) e.pass2 = "Confirma tu contraseña."
  else if (pass2 !== pass) e.pass2 = "Las contraseñas no coinciden."
  return e
}
