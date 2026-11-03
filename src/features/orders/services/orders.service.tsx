import { neighborhoodNameFromAddress } from "@/data/barrios"
import { allMenuProducts } from "@/features/menu/data/products"
import { orderDbId } from "@/features/orders/utils/orders"
import { api } from "@/shared/services/api"
import type { DbRecord, Order, User } from "@/shared/types"
import { loadLS, saveLS } from "@/shared/utils/storage"

// ponytail: all orders live in this browser's localStorage (client + admin
// share it); move to a backend when the shop needs multiple devices.
export const loadOrders = () => loadLS<Order[]>("orders", [])

export const saveOrders = (orders: Order[]) => saveLS("orders", orders)

export const orderFromDb = (p: DbRecord): Order => ({
  // Same format as the panel's orders (PED-0005): one numbering for every order
  id: `PED-${String(p.id_pedido).padStart(4, "0")}`,
  email: p.correo,
  cliente: p.cliente,
  date: new Date(p.creado_en).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }),
  createdAt: new Date(p.creado_en).toISOString(),
  nombre: p.destinatario?.nombre || p.nombre_contacto || p.cliente,
  telefono: p.destinatario?.telefono || p.telefono_contacto || "",
  tipoEntrega: p.tipo_entrega || "domicilio",
  direccion: p.direccion_entrega || "",
  barrio: p.barrio || neighborhoodNameFromAddress(p.direccion_entrega || "") || undefined,
  barrioId: p.id_barrio || undefined,
  costoDomicilio: p.costo_domicilio_cop ?? null,
  estimacion: p.estimacion_inicial || undefined,
  notas: p.observacion || "",
  pago: p.metodo_pago || "Efectivo",
  voucher: p.comprobante || undefined,
  items: p.items.map((it: DbRecord, i: number) => {
    const product = allMenuProducts().find((x) => x.name === it.producto)
    return {
      id: i + 1,
      name: it.producto,
      description: product?.desc,
      price: it.precio_unitario,
      qty: it.cantidad,
      img: product?.img || "",
      sauces: it.detalle?.salsas || [],
      additions: (it.detalle?.adiciones || []).map((a: DbRecord) => ({ name: a.nombre, qty: a.cantidad, price: a.precio })),
    }
  }),
  total: p.total,
  status: p.estado,
  paymentStatus: p.estado_pago,
  paymentRejectionReason: p.motivo_rechazo_pago || undefined,
  productionAuthorized: p.produccion_autorizada,
  productionRecords: p.registros_produccion,
})

// Staff get every order; clients only their own
export const refreshOrders = async (role: User["role"]) => {
  const orders = (await api<DbRecord[]>(role === "admin" ? "/pedidos" : "/pedidos/mios")).map(orderFromDb)
  saveOrders(orders)
  window.dispatchEvent(new Event("orders-updated"))
  return orders
}

// Saves the panel's changes to a client order (status, payment, production)
// Resolves when saved: when it's marked «Pagado», the backend has created its sale by then
export const pushOrder = (id: string): Promise<unknown> => {
  const o = loadOrders().find((order) => order.id === id)
  if (!o) return Promise.resolve()
  return api(`/pedidos/${orderDbId(o.id)}`, "PATCH", {
    estado: o.status,
    estado_pago: o.paymentStatus,
    motivo_rechazo_pago: o.paymentRejectionReason ?? null,
    produccion_autorizada: !!o.productionAuthorized,
    registros_produccion: o.productionRecords ?? [],
  }).catch((err) => window.alert(`El pedido ${o.id} no se guardó en la base de datos: ${(err as Error).message}`))
}

// Downscale to keep vouchers small enough for localStorage
export function readVoucher(file: File) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, 1000 / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = img.width * s
      c.height = img.height * s
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
