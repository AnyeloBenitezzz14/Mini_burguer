export const isTransferPaymentMethod = (method: string) =>
  ["transferencia", "nequi", "daviplata", "bancolombia"].includes(method.trim().toLowerCase())

// ── Orders (shared by client app, profile and checkout) ───────────────────────
export const ORDER_STEPS = ["Recibido", "Confirmado", "En cocina", "En camino", "Entregado"]

// Orders from this total up need the owner's confirmation and a 50% deposit (abono) paid in advance by transfer;
// the rest is paid on delivery. Orders paid in full at the counter («Local») don't need it.
export const APPROVAL_MIN = 150000
export const DEPOSIT_MODALITY = "Abono 50%"
export const needsDeposit = (total: number, orderType = "") => total >= APPROVAL_MIN && orderType !== "Local"
export const depositOf = (total: number) => Math.ceil(total / 2)

// ── Pedidos ↔ backend: the "orders" cache above is refreshed from the backend on login,
// so client and admin see the same orders from any device.
export const orderDbId = (id: string) => Number(id.replace("PED-", ""))
