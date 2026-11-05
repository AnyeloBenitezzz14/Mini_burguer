import { COUNTER_CLIENT_DOC, DOC_SHORT, PERMISSION_MODULES, PERM_ACTION, PERM_MODULE, RETURNED_LOSS, SUPER_ADMIN_EMAIL } from "@/features/admin/config/modules"
import { DB_SYNC, PANEL_SYNC } from "@/features/admin/services/sync.service"
import { APPROVAL_MIN, isTransferPaymentMethod } from "@/features/orders/utils/orders"
import type { AdminOrderLine, Order, RolePerms, Row } from "@/shared/types"
import { splitNames } from "@/shared/utils/format"

export const supplyAsProduct = (row: (string | number)[]): (string | number)[] => [
  String(row[0] ?? "Producto de insumo"),
  "Producto de insumo",
  Number(row[3] || 0),
  "Insumo configurado para comercializarse como producto.",
  String(row[12] ?? "Activo"),
  String(row[8] || `Ficha técnica - ${String(row[0] ?? "Producto de insumo")}`),
  String(row[9] || "v1.0"),
  String(row[10] || row[0] || "Insumo"),
  String(row[11] || "Insumo producto con ficha técnica y control de inventario."),
]

// ── Orders → production ───────────────────────────────────────────────────────
// Pedido payment rules: the method decides the modality and whether it's paid,
// so the admin doesn't pick them by hand. Cash in the shop is paid at the counter; cash for a delivery
// or a pickup is paid on handover (it turns "Pagado" by itself when the order is "Entregado")
export function derivePedidoPayment(method: string, hasProof: boolean, orderType = "") {
  if (method === "Transferencia")
    return { modalidad: "Anticipado", estadoPago: hasProof ? "Pagado" : "Pendiente" }
  if (method === "Efectivo" && orderType === "Local") return { modalidad: "Anticipado", estadoPago: "Pagado" }
  if (method === "Efectivo" || method === "Pago en el local")
    return { modalidad: "Contraentrega", estadoPago: "Pendiente" }
  return { modalidad: "", estadoPago: "" }
}

// "Hamburguesa Tradicional ×2, Perro Mediano + 1 adición": what a production order makes, in one line
export function productionLabel(lines: AdminOrderLine[]) {
  const products = lines.filter((line) => !line.parentId)
  const additions = lines.length - products.length
  // The same product in two lines shows once with the total
  const totals = new Map<string, number>()
  products.forEach((line) => totals.set(line.product, (totals.get(line.product) ?? 0) + line.quantity))
  return (
    [...totals].map(([product, quantity]) => (quantity > 1 ? `${product} ×${quantity}` : product)).join(", ") +
    (additions ? ` + ${additions} ${additions === 1 ? "adición" : "adiciones"}` : "")
  )
}

export function clientOrderToPanelRow(order: Order, products: (string | number)[][]): Row {
  const lines: AdminOrderLine[] = order.items.flatMap((item, index) => {
    const parentId = `${order.id}-line-${index}`
    const mainLine: AdminOrderLine = {
      id: parentId,
      product: item.name,
      category: String(products.find((product) => product[0] === item.name)?.[1] ?? ""),
      quantity: item.qty,
      unitPrice: item.price,
      ...(item.sauces?.length ? { sauces: item.sauces } : {}),
    }
    return [
      mainLine,
      ...(item.additions || []).map((addition, additionIndex) => ({
        id: `${parentId}-addition-${additionIndex}`,
        product: addition.name,
        category: "Adiciones",
        quantity: addition.qty * item.qty,
        unitPrice: addition.price,
        parentId,
      })),
    ]
  })
  const paymentStatus =
    order.paymentStatus ??
    (order.voucher
      ? ["Confirmado", "En cocina", "En camino", "Entregado"].includes(order.status)
        ? "Pagado"
        : "Pendiente de verificación"
      : isTransferPaymentMethod(order.pago)
        ? "Pendiente de verificación"
        : "Pendiente")
  return [
    order.id,
    order.nombre || order.cliente,
    lines.map((line) => `${line.quantity} ${line.product}${line.parentId ? ` (adición de ${lines.find((parent) => parent.id === line.parentId)?.product ?? "producto"})` : ""}`).join(", "),
    "Domicilio",
    order.pago === "Efectivo" ? "Efectivo" : "Transferencia",
    order.pago === "Efectivo" ? "Contraentrega" : "Anticipado",
    order.total,
    order.status,
    paymentStatus,
    order.productionAuthorized
      ? "Autorizada"
      : paymentStatus === "Pendiente de verificación" || paymentStatus === "Rechazado"
        ? "Pendiente de pago"
        : order.status === "Por confirmar"
          ? "Pendiente admin"
          : order.total >= APPROVAL_MIN
            ? "Autorizada"
            : "Enviada a producción",
    JSON.stringify(lines),
    order.paymentRejectionReason ?? "",
    order.notas,
    order.telefono,
  ]
}

// Next automatic sale code: VTA-AUTO-NN after the highest one there is
export const nextAutoSaleCode = (sales: Row[]) =>
  `VTA-AUTO-${String(Math.max(0, ...sales.map((sale) => Number(/^VTA-AUTO-(\d+)$/.exec(String(sale[0] ?? ""))?.[1] ?? 0))) + 1).padStart(2, "0")}`

// Sale type of an order's sale: shop orders ("Online") are deliveries
export const saleTypeOf = (orderType: string | number | undefined) => (String(orderType ?? "") === "Online" ? "Domicilio" : String(orderType ?? ""))

// One production order per customer order, with all its products (and their additions) inside.
// Returns the production rows with the new one on top.
export function buildProductionRows(
  lines: AdminOrderLine[],
  productionRows: (string | number)[][],
  orderCode: string,
  comment = "",
) {
  if (!lines.length) return productionRows
  const now = new Date()
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const priority = Math.max(0, ...productionRows.map((row) => Number(row[3]) || 0)) + 1
  const lastCode = Math.max(0, ...productionRows.map((row) => Number(/^OP-(\d+)$/i.exec(String(row[0] ?? ""))?.[1] ?? 0)))
  return [
    [
      `OP-${String(lastCode + 1).padStart(4, "0")}`,
      productionLabel(lines),
      lines.filter((line) => !line.parentId).reduce((sum, line) => sum + line.quantity, 0),
      priority,
      date,
      time,
      date,
      time,
      "Recibido",
      "",
      0,
      "Sí",
      JSON.stringify([{ status: "Recibido", date, time }]),
      JSON.stringify(lines.map((line) => ({
        id: line.id,
        name: line.product,
        quantity: line.quantity,
        category: line.category,
        ...(line.parentId ? { parentId: line.parentId } : {}),
        ...(line.sauces?.length ? { sauces: line.sauces } : {}),
      }))),
      "No",
      orderCode,
      comment,
    ],
    ...productionRows,
  ]
}

export const isActiveStatus = (v: string | number | undefined) =>
  !["Inactivo", "Inactiva", "Anulado", "Anulada"].includes(String(v ?? ""))

export const estadoOf = (v: string | number | undefined) => (isActiveStatus(v) ? "ACTIVO" : "INACTIVO")

export const text = (v: string | number | undefined) => String(v ?? "").trim()

// Optional e-mails must be omitted (not "") or the backend rejects them
export const optionalEmail = (v: string | number | undefined) => text(v) || undefined

export const withId = (row: Row, idIndex: number, id: number) => {
  row[idIndex] = id
  return row
}

// Clientes row: [0 nombre, 1 tipo doc, 2 documento, 3 teléfono, 4 correo, 5 dirección, 6 de local, 7 estado]
export const isCounterClientRow = (sec: string, row: (string | number)[] | undefined) =>
  sec === "clientes" && String(row?.[2] ?? "").replace(/\D/g, "") === COUNTER_CLIENT_DOC

// Staff: any role except Cliente
export const isStaffRole = (rol: string | number | undefined) => !!String(rol ?? "").trim() && String(rol).trim().toLowerCase() !== "cliente"

// Usuarios row: [0 nombre, 1 tipo doc, 2 documento, 3 rol, 4 correo, 5 estado, ...]
export const isSuperAdminRow = (sec: string, row: (string | number)[] | undefined) =>
  sec === "usuarios" && String(row?.[4] ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL

// Supplier that is a person, not a company: no NIT nor contact person (row/form key 15)
export const isNaturalSupplier = (tipo: string | number | undefined) => String(tipo ?? "") === "Persona natural"

export const supplierDocument = (row: Row) =>
  [DOC_SHORT[String(row[8] ?? "")] ?? row[8], row[9]].map((v) => String(v ?? "").trim()).filter(Boolean).join(" ") || "—"

// "7" (insumos que vende) is optional: Compras already warns when a supplier has none
export const supplierRequiredKeys = (draft: Record<string, string>) =>
  isNaturalSupplier(draft["15"])
    ? ["15", "8", "9", "10", "11", "3", "2", "5"]
    : ["15", "0", "1", "2", "3", "5", "8", "9", "10", "11", "12", "13", "14"]

// Ficha técnica of an insumo: "Azúcar (50 g), Limón (2 und)" -> [{ name: "Azúcar", quantity: "50" }, ...]
export const parseMainSupplies = (value: string | number | undefined) =>
  splitNames(value).map((part) => {
    const match = /^(.*?)\s*\(\s*([\d.]+)\s*([^)]*)\)$/.exec(part)
    return match
      ? { name: match[1], quantity: match[2], unit: match[3].trim() }
      : { name: part, quantity: "", unit: "" }
  })

export const isReturnedLoss = (row?: Row) => String(row?.[6] ?? "") === RETURNED_LOSS

// Purchase items text: one "insumo | cantidad | costo unitario" per line
export const parsePurchaseLines = (value: string | number | undefined) =>
  String(value ?? "")
    .split(/\n|;/)
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([name]) => name)
    .map(([name, quantity, unitPrice]) => ({ name, quantity: Number(quantity) || 0, unitPrice: Number(unitPrice) || 0 }))

// Backend role names are uppercase (ADMINISTRADOR); the admin shows them as "Administrador"
export const roleLabel = (name: string) => name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())

export const permsToDb = (perms: RolePerms) =>
  PERMISSION_MODULES.map(({ name }) => ({
    modulo: PERM_MODULE[name],
    privilegios: [...new Set((perms[name] || []).map((a) => PERM_ACTION[a]).filter(Boolean))].sort(),
  })).filter((p) => p.privilegios.length)

export const permsFromDb = (permisos: { modulo: string; privilegios: string[] }[]): RolePerms =>
  Object.fromEntries(
    PERMISSION_MODULES.map(({ name, finalAction }) => [
      name,
      (permisos.find((p) => p.modulo === PERM_MODULE[name])?.privilegios || []).map((p) =>
        p === "ELIMINAR" ? finalAction : p[0] + p.slice(1).toLowerCase(),
      ),
    ]),
  )

export const syncIdIndex = (sec: string) => (DB_SYNC[sec] ?? PANEL_SYNC[sec])?.idIndex

// Sales made when an order was paid used to be saved one column off: [4 productos, 5 tipo, 6 método, 7-8 total,
// 9 "Pendiente", 10 pedido, 11 estado, 12 productos JSON]. Read them in the usual columns (only on screen;
// the backend keeps them as they are, so loading them doesn't save anything)
export const fixShiftedSale = (row: Row): Row => {
  if (String(row[9]) !== "Pendiente" || !/^PED-/i.test(String(row[10] ?? ""))) return row
  const fixed = [...row]
  for (let i = 4; i <= 11; i++) fixed[i] = row[i + 1]
  fixed[8] = ""
  fixed[12] = ""
  return fixed
}

// Pads the row so the id never leaves empty gaps before it
export const withPanelId = (row: Row, idIndex: number, id: string | number) => {
  const padded = Array.from({ length: Math.max(row.length, idIndex) }, (_, i) => row[i] ?? "")
  padded[idIndex] = id
  return padded
}
