import { api } from "@/shared/services/api"
import type { User } from "@/shared/types"

// ── Profile Page ───────────────────────────────────────────────────────────────
// Saves the personal data of whoever is logged in (client or staff) in their persona, the same record the
// admin sees in Clientes / Usuarios. Empty optional fields are left out: the backend rejects an empty document.
export const saveProfile = (u: User) =>
  api("/auth/me", "PATCH", {
    nombre: u.name,
    tipo_documento: u.docType || undefined,
    documento: u.cedula?.trim() || undefined,
    telefono: u.phone ?? "",
    direcciones: (u.addresses || []).map((a) => a.trim()).filter(Boolean),
  }).then(() => window.dispatchEvent(new Event("profile-updated")))
