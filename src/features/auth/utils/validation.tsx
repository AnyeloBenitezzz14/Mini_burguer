import type { FieldErrors } from "@/shared/types"
import { loadLS } from "@/shared/utils/storage"
import { DOC_RULES, NAME_RE, emailError, passwordErrors } from "@/shared/utils/validation"

export function validateLogin(
  email: string,
  pass: string,
  savedPass?: string,
  accountStatus?: string,
  requireRegisteredAccount = false,
  accountExists = !!savedPass,
): FieldErrors {
  const e: FieldErrors = {}
  const em = emailError(email)
  if (em) e.email = em
  else if (
    accountStatus &&
    ["inactivo", "inactiva", "anulado", "anulada"].includes(
      accountStatus.trim().toLowerCase(),
    )
  ) {
    e.email = "Esta cuenta está inactiva. Contacta al administrador."
  } else if (requireRegisteredAccount && !accountExists) {
    e.email = "No encontramos una cuenta con ese correo. Regístrate para continuar."
  }
  if (!pass) e.pass = "Ingresa tu contraseña."
  else if (pass.length < 8) e.pass = "La contraseña tiene mínimo 8 caracteres."
  else if (savedPass && pass !== savedPass) e.pass = "La contraseña es incorrecta."
  return e
}

export function validateRegister(f: {
  name: string
  lastname?: string
  docType: string
  docNum: string
  email: string
  phone: string
  pass: string
  pass2: string
}): FieldErrors {
  const e: FieldErrors = {}
  const name = f.name.trim()
  if (!name) e.name = "Ingresa tu nombre."
  else if (!NAME_RE.test(name)) e.name = "El nombre solo puede tener letras y espacios."
  else if (name.length < 2) e.name = "El nombre debe tener al menos 2 letras."
  if (f.lastname?.trim() && !NAME_RE.test(f.lastname.trim()))
    e.lastname = "El apellido solo puede tener letras y espacios."
  if (!f.docType) e.docType = "Selecciona el tipo de documento."
  const doc = f.docNum.trim()
  if (!doc) e.docNum = "Ingresa tu número de documento."
  else if (f.docType && !DOC_RULES[f.docType]?.re.test(doc))
    e.docNum = DOC_RULES[f.docType].msg
  const phone = f.phone.replace(/\s/g, "")
  if (phone && !/^3\d{9}$/.test(phone))
    e.phone = "El celular debe tener 10 números y empezar por 3."
  const em = emailError(f.email)
  if (em) e.email = em
  else if (loadLS(`profile:${f.email.trim().toLowerCase()}`, null))
    e.email = "Ya existe una cuenta con este correo. Inicia sesión."
  return { ...e, ...passwordErrors(f.pass, f.pass2) }
}
