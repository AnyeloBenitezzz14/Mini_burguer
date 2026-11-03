export const isTransferPaymentMethod = (method: string) =>
  ["transferencia", "nequi", "daviplata"].includes(method.trim().toLowerCase())

// ── Orders (shared by client app, profile and checkout) ───────────────────────
export const ORDER_STEPS = ["Recibido", "Confirmado", "En cocina", "En camino", "Entregado"]

// Orders from this total up need the owner's confirmation
export const APPROVAL_MIN = 150000

// ── Pedidos ↔ backend: the "orders" cache above is refreshed from the backend on login,
// so client and admin see the same orders from any device.
export const orderDbId = (id: string) => Number(id.replace("PED-", ""))
