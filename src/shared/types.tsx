// ── Types ──────────────────────────────────────────────────────────────────────
export type Page = "landing" | "guest-menu" | "checkout" | "login" | "register" | "verify" | "forgot" | "reset" | "app" | "admin"

export type AdminSection = "dashboard" | "roles" | "usuarios" | "cat-insumos" | "insumos" | "proveedores" | "compras" | "perdidas" | "cat-producto" | "producto" | "produccion" | "producto-no-conforme" | "clientes" | "ventas" | "pedidos" | "domicilios" | "devoluciones"

export type Theme = "light" | "dark"

export type User = {
  name: string
  email: string
  role: "admin" | "user"
  cedula?: string
  docType?: string
  phone?: string
  addresses?: string[]
  photo?: string
  password?: string
  // Backend modules this user may see (VER), from the login. Undefined = everything.
  permissions?: string[]
  // Backend module -> privileges (VER, CREAR, EDITAR, ELIMINAR). Undefined = everything.
  actions?: Record<string, string[]>
  // Logged in with the provisional password e-mailed at sign-up: must choose their own first
  mustChangePassword?: boolean
}

export type RegisteredClient = Pick<User, "name" | "email" | "cedula" | "docType" | "phone" | "addresses">

export type CartItem = {
  id: number
  productId?: number
  name: string
  description?: string
  price: number
  qty: number
  img: string
  sauces?: string[]
  additions?: { name: string; qty: number; price: number }[]
}

export type DeliveryInfo = {
  nombre: string
  telefono: string
  tipoEntrega: "local" | "domicilio" | "recoger"
  barrio?: string
  barrioId?: number | null
  distanciaKm?: number
  costoDomicilio?: number | null
  ubicacion?: { lat: number; lon: number }
  direccion: string
  notas: string
  pago: string
  voucher?: string
}

export type DeliveryNeighborhood = {
  id_barrio: number | null
  nombre: string
  // Set in the admin's Domicilios module
  tiempo_desplazamiento_minutos?: number | null
  costo_domicilio_cop?: number | null
}

export type DeliveryEstimate = {
  minimumMinutes: number | null
  maximumMinutes: number | null
  estimatedMinutes: number | null
  deliveryCost?: number | null
  distanceKm?: number | null
  distanceMethod?: "straight_line_estimate" | null
  zone?: string | null
  isApproximate?: boolean
  message: string | null
  components?: {
    kitchenWaitMinutes: number | null
    preparationMinutes: number | null
    dispatchWaitMinutes: number | null
    travelMinutes: number | null
  }
}

export type Order = DeliveryInfo & {
  id: string
  email: string
  cliente: string
  date: string
  // ISO creation time (from the backend), to know how long an order has been waiting
  createdAt?: string
  items: CartItem[]
  total: number
  status: string
  estimacion?: DeliveryEstimate
  paymentStatus?: "Pendiente" | "Pendiente de verificación" | "Pagado" | "Rechazado"
  paymentRejectionReason?: string
  productionAuthorized?: boolean
  productionRecords?: (string | number)[][]
}

export type ModalMode = "add" | "edit" | "view" | null

export type FieldType = {
  key: string
  label: string
  type: "text" | "email" | "tel" | "number" | "select" | "textarea" | "date" | "time" | "image" | "checkbox" | "password"
  options?: string[]
}

export type Product = {
  id: number
  name: string
  desc: string
  price: number
  priceStr: string
  img: string
  cat: string
  badge: string
  soldOut?: boolean
}

export type TechnicalIngredient = {
  name: string
  quantity: number
  unit: string
}

export type AdminOrderLine = {
  id: string
  product: string
  category: string
  quantity: number
  unitPrice: number
  parentId?: string
  sauces?: string[]
}

export type ProductionItem = {
  id?: string
  name: string
  quantity: number
  unit?: string
  category?: string
  parentId?: string
  sauces?: string[]
  // Order remade after a producto no conforme: reused as is (takes nothing out of stock)…
  reuse?: boolean
  // …or only these damaged insumos are replaced (instead of the whole ficha técnica)
  onlySupplies?: { name: string; quantity: number; unit: string }[]
}

// ── Admin config ───────────────────────────────────────────────────────────────
export type ModConfig = {
  columns: string[]
  fields: FieldType[]
  seed: (string | number | boolean)[][]
  noExport?: boolean
  noDelete?: boolean
  autoId?: boolean
  statusIndex?: number
  inactiveStatus?: string
  hiddenCellIndexes?: number[]
}

// ── Auth validation ────────────────────────────────────────────────────────────
export type FieldErrors = Record<string, string>

export type AuthData = {
  token: string
  usuario: {
    correo: string
    nombre: string | null
    tipo_documento: string | null
    documento: string | null
    telefono: string | null
    direcciones: string[] | null
    roles: string[]
    requiere_cambio_contrasena?: boolean
  }
  permisos: { modulo: string; privilegios: string[] }[]
  requiere_cambio_contrasena?: boolean
}

export type CatalogItem = {
  id: number
  nombre: string
  descripcion: string | null
  etiqueta: string | null
  precio: number
  categoria: string
  imagenes: string[]
  estado?: string | null
}

// ── Admin tables ↔ backend ─────────────────────────────────────────────────────
// Each synced admin module maps a backend record to its table row and back. The row
// keeps the record id at `idIndex` (never shown) so edits update the same record.
export type Row = (string | number)[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRecord = Record<string, any>

export type SyncSpec = {
  path: string
  update: "PATCH" | "PUT"
  idIndex: number
  idOf: (r: DbRecord) => number
  toRow: (r: DbRecord) => Row
  toBody: (row: Row) => Promise<DbRecord> | DbRecord
  // Rows that live only in the browser (not sent to the backend)
  localOnly?: (row: Row) => boolean
  // Backend records this module shows (default: all)
  shows?: (r: DbRecord) => boolean
  // Status changes that use their own route instead of a full update
  setStatus?: (id: string | number, row: Row) => Promise<unknown>
  // Modules to reload after a save (e.g. stock changes in Insumos)
  reloads?: string[]
  // Saves what lives in other tables once the record has its id (e.g. the ficha técnica)
  afterSave?: (id: number, row: Row) => Promise<unknown>
}

// ── Dashboard period ─────────────────────────────────────────────────────────
export type DashPeriod = "hoy" | "semana" | "mes" | "año"

export type AddressParts = Record<string, string>

export type RolePerms = Record<string, string[]>

// ── Panel modules stored as whole rows ─────────────────────────────────────────
// Their logic lives in the panel (status history, order lines, stock already used...), so the
// backend stores each row as-is (plus its main columns). AdminPanel saves any change automatically.
export type PanelSyncSpec = {
  path: string
  // Position of the backend id in the row (right after the panel's own cells; never shown)
  idIndex: number
  // Rows built in the browser before loading that must still be saved (default: none)
  keepLocal?: (row: Row, dbRows: Row[]) => boolean
  // Rows this module saves (default: all); the others are kept as they are and never sent
  owns?: (row: Row) => boolean
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
export type AdminNotification = {
  id: number
  type: "warn" | "danger" | "info"
  title: string
  message: string
  module: string
  time: string
  target: AdminSection
}
