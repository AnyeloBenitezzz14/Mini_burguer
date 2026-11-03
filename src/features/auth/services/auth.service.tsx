import { api } from "@/shared/services/api"
import type { AuthData, RegisteredClient, User } from "@/shared/types"
import { loadLS, saveLS } from "@/shared/utils/storage"

export const toUser = ({ token, usuario: u, permisos, requiere_cambio_contrasena }: AuthData): User => {
  saveLS("token", token)
  return {
    permissions: permisos.filter((p) => p.privilegios.includes("VER")).map((p) => p.modulo),
    actions: Object.fromEntries(permisos.map((p) => [p.modulo, p.privilegios])),
    name: u.nombre || u.correo,
    email: u.correo.toLowerCase(),
    role: u.roles.includes("CLIENTE") ? "user" : "admin",
    docType: u.tipo_documento || undefined,
    cedula: u.documento || undefined,
    phone: u.telefono || undefined,
    addresses: u.direcciones?.length ? u.direcciones : undefined,
    mustChangePassword: !!(requiere_cambio_contrasena ?? u.requiere_cambio_contrasena),
  }
}

export const apiLogin = async (email: string, pass: string) =>
  toUser(await api<AuthData>("/auth/login", "POST", { correo: email.trim(), contrasena: pass }))

export const requestRegistrationCode = (u: User, password: string) =>
  api<void>("/auth/registro/solicitar", "POST", {
    correo: u.email,
    contrasena: password,
    nombre: u.name,
    tipo_documento: u.docType || undefined,
    documento: u.cedula || undefined,
    telefono: u.phone || undefined,
  })

export const verifyRegistrationCode = async (email: string, code: string) =>
  api<AuthData>("/auth/registro/verificar", "POST", { correo: email, codigo: code })

export function getAdminAccountStatus(email: string): string | undefined {
  const statuses = loadLS<Record<string, string>>("adminUserStatuses", {})
  return statuses[email.trim().toLowerCase()]
}

export const loadRegisteredClients = () =>
  loadLS<RegisteredClient[]>("registeredClients", [])

export const saveRegisteredClient = (user: User) => {
  if (user.role !== "user" || !user.email.trim()) return
  const registeredClient: RegisteredClient = {
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    cedula: user.cedula?.trim(),
    docType: user.docType?.trim(),
    phone: user.phone?.trim(),
    addresses: user.addresses,
  }
  const clients = loadRegisteredClients().filter(
    (client) => client.email.toLowerCase() !== registeredClient.email,
  )
  saveLS("registeredClients", [registeredClient, ...clients])
}
