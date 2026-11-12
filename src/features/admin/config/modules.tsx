import { ADDITIONS, PRODUCTS, PRODUCT_CAT_LABEL } from "@/features/menu/data/products"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { ModConfig, Row } from "@/shared/types"
import { DOC_TYPES, USER_DOC_TYPES } from "@/shared/utils/validation"

// How each stock movement origin (movimientos_stock.origen) reads in the insumo's history
export const STOCK_ORIGIN: Record<string, string> = {
  SALDO_INICIAL: "Saldo inicial",
  COMPRA: "Compra",
  EDICION_COMPRA: "Compra editada",
  ANULACION_COMPRA: "Compra anulada",
  REACTIVACION_COMPRA: "Compra reactivada",
  PERDIDA: "Pérdida",
  EDICION_PERDIDA: "Pérdida editada",
  DEVOLUCION_PERDIDA: "Devuelto a la compra",
  PRODUCCION: "Producción",
  AJUSTE: "Ajuste manual",
}

export const PERMISSION_MODULES = [
  { name: "Roles y permisos", finalAction: "Anular" },
  { name: "Usuarios", finalAction: "Anular" },
  { name: "Categoría Insumos", finalAction: "Anular" },
  { name: "Insumos", finalAction: "Anular" },
  { name: "Proveedores", finalAction: "Anular" },
  { name: "Compras", finalAction: "Eliminar" },
  { name: "Pérdida Insumos", finalAction: "Anular" },
  { name: "Categoría Producto", finalAction: "Anular" },
  { name: "Productos", finalAction: "Anular" },
  { name: "Producción", finalAction: "Eliminar" },
  { name: "Producto No Conforme", finalAction: "Eliminar" },
  { name: "Clientes", finalAction: "Eliminar" },
  { name: "Pedidos", finalAction: "Anular" },
  { name: "Domicilios", finalAction: "Eliminar" },
  { name: "Ventas", finalAction: "Anular" },
  { name: "Devoluciones", finalAction: "Eliminar" },
] as const

export const PRODUCTION_STATUSES = [
  "Recibido",
  "Confirmado",
  "En cocina",
  "En camino",
  "Entregado",
  "Producto no conforme",
] as const

export const MOD_CFG: Record<string, ModConfig> = {
  roles: {
    columns: ["Nombre", "Descripción", "Estado", "Creado", "Actualizado"],
    fields: [
      { key: "0", label: "Nombre del rol", type: "text" },
      { key: "1", label: "Descripción", type: "textarea" },
    ],
    seed: [],
    noExport: true,
    noDelete: true,
    statusIndex: 2,
  },
  usuarios: {
    columns: ["Nombre", "Tipo Doc.", "Documento", "Rol", "Correo", "Estado"],
    fields: [
      {
        key: "1",
        label: "Tipo de documento",
        type: "select",
        options: USER_DOC_TYPES,
      },
      { key: "2", label: "Número de documento", type: "text" },
      { key: "0", label: "Nombre completo", type: "text" },
      {
        key: "3",
        label: "Rol",
        type: "select",
        options: ["Empleado", "Domiciliario", "Cliente", "Administrador"],
      },
      { key: "4", label: "Correo electrónico", type: "email" },
      // Only for staff (not Cliente)
      { key: "9", label: "Teléfono", type: "tel" },
      { key: "12", label: "Teléfono de emergencia (opcional)", type: "tel" },
      { key: "13", label: "Correo personal (opcional)", type: "email" },
      { key: "10", label: "Barrio", type: "text" },
      { key: "11", label: "Dirección", type: "text" },
      { key: "6", label: "Contraseña", type: "password" },
    ],
    seed: [],
    noExport: true,
    statusIndex: 5,
    // 7 id, 8 superadmin mark, 9-13 staff contact
    hiddenCellIndexes: [6, 8, 9, 10, 11, 12, 13],
  },
  "cat-insumos": {
    columns: ["Nombre Categoría", "Descripción", "Estado"],
    fields: [
      { key: "0", label: "Nombre categoría", type: "text" },
      { key: "1", label: "Descripción (opcional)", type: "textarea" },
    ],
    seed: [],
    noExport: true,
    statusIndex: 2,
  },
  insumos: {
    columns: [
      "Nombre",
      "Categoría",
      "Unidad",
      "Costo Unit.",
      "Stock Act.",
      "Estado",
    ],
    fields: [
      { key: "0", label: "Nombre del insumo", type: "text" },
      {
        key: "1",
        label: "Categoría",
        type: "select",
        options: ["Carnes", "Lácteos", "Verduras", "Panes", "Salsas"],
      },
      {
        key: "2",
        label: "Unidad de medida",
        type: "select",
        options: ["kg", "g", "L", "ml", "und", "paq"],
      },
      // Unit "paq": row[6] (old "Stock máximo") is how much one package holds and row[14] its unit
      // (30 und of egg, 100 g of a sobre), so recipes can use what's inside
      { key: "6", label: "Contenido de cada paquete", type: "number" },
      { key: "14", label: "Medida del contenido", type: "select", options: ["und", "g", "ml"] },
      { key: "3", label: "Costo unitario", type: "number" },
      { key: "4", label: "Stock actual", type: "number" },
      { key: "5", label: "Stock mínimo", type: "number" },
      { key: "7", label: "Producto de insumo", type: "checkbox" },
      { key: "8", label: "Nombre de la ficha técnica", type: "text" },
      { key: "9", label: "Versión de la ficha", type: "text" },
      { key: "10", label: "Insumos principales", type: "textarea" },
      { key: "11", label: "Cómo se prepara", type: "textarea" },
    ],
    seed: [],
    // Deletable only while no other module has records of it (see getDeleteAssessment)
    statusIndex: 12,
    hiddenCellIndexes: [5, 6, 7, 8, 9, 10, 11, 14],
  },
  proveedores: {
    columns: [
      "Nombre",
      "NIT / Documento",
      "Correo",
      "Teléfono",
      "Contacto",
      "Estado",
    ],
    fields: [
      { key: "15", label: "Tipo de persona", type: "select", options: ["Persona jurídica", "Persona natural"] },
      { key: "1", label: "NIT", type: "text" },
      { key: "0", label: "Nombre empresa", type: "text" },
      { key: "2", label: "Correo", type: "email" },
      { key: "3", label: "Teléfono", type: "tel" },
      { key: "5", label: "Dirección", type: "text" },
      { key: "8", label: "Tipo de documento", type: "select", options: DOC_TYPES },
      { key: "9", label: "Número de documento", type: "text" },
      { key: "10", label: "Nombre", type: "text" },
      { key: "11", label: "Apellido", type: "text" },
      { key: "12", label: "Teléfono", type: "tel" },
      { key: "13", label: "Correo electrónico", type: "email" },
      { key: "14", label: "Cargo", type: "text" },
      // Comma-separated insumo names; limits what can be bought from this supplier
      { key: "7", label: "Insumos que suministra", type: "text" },
    ],
    seed: [],
    // Deletable only while the supplier has no purchases (see getDeleteAssessment)
    statusIndex: 6,
    hiddenCellIndexes: [5, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  compras: {
    columns: ["Proveedor", "Fecha", "Insumos comprados", "Total", "Estado"],
    fields: [
      {
        key: "0",
        label: "Proveedor",
        type: "select",
        options: [],
      },
      { key: "1", label: "Fecha de compra", type: "date" },
      { key: "2", label: "Fecha de registro", type: "date" },
      { key: "3", label: "Subtotal", type: "number" },
      { key: "4", label: "Total", type: "number" },
      {
        key: "6",
        label: "Insumos comprados (nombre | cantidad | precio unitario)",
        type: "textarea",
      },
    ],
    seed: [],
    noDelete: true,
    statusIndex: 5,
    inactiveStatus: "Anulado",
    hiddenCellIndexes: [2, 6],
  },
  perdidas: {
    columns: ["Insumo", "Cantidad", "Motivo", "Responsable", "Fecha", "Estado"],
    fields: [
      // The purchase it was lost from (row[10] = id_compra): chosen first, it fills the rest
      { key: "10", label: "Compra", type: "select", options: [] },
      {
        key: "0",
        label: "Insumo",
        type: "select",
        options: [],
      },
      { key: "1", label: "Cantidad", type: "text" },
      {
        key: "2",
        label: "Motivo",
        type: "select",
        options: ["Deterioro", "Vencimiento", "Accidente", "Horno", "Otro"],
      },
      { key: "3", label: "Persona responsable", type: "select", options: [] },
      { key: "4", label: "Fecha", type: "date" },
      // Filled when the loss is sent from a purchase ("Compra a X del <fecha>")
      { key: "5", label: "Origen", type: "text" },
    ],
    seed: [],
    noExport: true,
    noDelete: true,
    hiddenCellIndexes: [5, 7, 8, 10],
  },
  "cat-producto": {
    // No description: its cell (row[1]) shows how many products use the category
    columns: ["Nombre Categoría", "Productos asociados", "Estado"],
    fields: [{ key: "0", label: "Nombre categoría", type: "text" }],
    seed: [
      ["Hamburguesas", "Burgers artesanales de la casa", "Activa"],
      ["Adiciones", "Extras para agregar a los productos", "Activa"],
      ["Bebidas", "Bebidas y presentaciones disponibles para la venta", "Activa"],
      ["Salchipapas", "Papas fritas con salchicha", "Activa"],
      ["Perros Calientes", "Hot dogs", "Activa"],
      ["Perras", "Versiones especiales", "Activa"],
      ["Chuzos", "Carne en palito con papas", "Activa"],
      ["Patacones", "Patacón relleno", "Activa"],
      ["Arepa Rellena", "Arepa rellena", "Activa"],
    ],
    noExport: true,
    statusIndex: 2,
  },
  producto: {
    columns: ["Imagen", "Nombre", "Categoría", "Precio", "Estado"],
    fields: [
      { key: "img", label: "Foto del producto", type: "image" },
      { key: "0", label: "Nombre", type: "text" },
      {
        key: "1",
        label: "Categoría",
        type: "select",
        options: [
          "Hamburguesas",
          "Adiciones",
          "Salchipapas",
          "Perros Calientes",
          "Perras",
          "Chuzos",
          "Patacones",
          "Arepa Rellena",
          "Salsas",
          "Bebidas",
          "Producto de insumo",
        ],
      },
      { key: "2", label: "Precio (COP)", type: "number" },
      { key: "3", label: "Descripción", type: "textarea" },
      { key: "5", label: "Nombre de la ficha técnica", type: "text" },
      { key: "6", label: "Versión de la ficha", type: "text" },
      { key: "7", label: "Insumos principales", type: "textarea" },
      { key: "8", label: "Cómo se prepara", type: "textarea" },
      // Only for a soda (its stock is on the product): below this a «Pocas gaseosas» alert shows
      { key: "14", label: "Stock mínimo (und)", type: "number" },
    ],
    // Every menu product (so each category has its products in the order picker) + additions
    seed: [
      ...PRODUCTS.map((p) => [
        p.name,
        PRODUCT_CAT_LABEL[p.cat] ?? p.cat,
        p.price,
        p.desc,
        "Activo",
        `Ficha ${p.name}`,
        "v1.0",
        "",
        "",
      ]),
      ...ADDITIONS.map((a) => [
        a.name,
        "Adiciones",
        a.price,
        "Adición para agregar a los productos.",
        "Activo",
        "",
        "",
        "",
        "",
      ]),
    ],
    noExport: true,
    noDelete: true,
    statusIndex: 4,
  },
  produccion: {
    columns: [
      "Cód. Orden",
      "Producto",
      "Cantidad",
      "Prioridad",
      "Fecha Creación",
      "Hora",
      "Estado",
    ],
    fields: [
      {
        key: "0",
        label: "Producto o producto de insumo",
        type: "select",
        options: [],
      },
      { key: "1", label: "Cantidad", type: "number" },
      { key: "3", label: "Fecha de creación", type: "date" },
      { key: "4", label: "Hora de creación", type: "time" },
      { key: "15", label: "Comentario (opcional)", type: "textarea" },
    ],
    seed: [],
    autoId: true,
    statusIndex: 8,
    // 14 = stock already consumed, 15 = source order code, 16 = comment
    hiddenCellIndexes: [6, 7, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  "producto-no-conforme": {
    columns: ["Orden", "Productos o insumos dañados", "Cantidad", "Motivo", "Fecha", "Estado"],
    fields: [
      { key: "0", label: "Productos o insumos dañados", type: "textarea" },
      { key: "1", label: "Productos o insumos que se dañaron", type: "textarea" },
      { key: "2", label: "Cantidad no conforme", type: "number" },
      {
        key: "3",
        label: "Motivo",
        type: "select",
        options: [
          "Tiempo superado",
          "Error en preparación",
          "Ingrediente incorrecto",
          "Daño físico",
          "Producto perdido",
          "Otro",
        ],
      },
      { key: "4", label: "Fecha", type: "date" },
      { key: "5", label: "Observación", type: "textarea" },
      {
        key: "6",
        label: "Unidad de medida (para adiciones o insumos)",
        type: "select",
        options: ["und", "kg", "g", "L", "ml", "paq"],
      },
    ],
    seed: [],
    autoId: true,
    noDelete: true,
    statusIndex: 8,
    hiddenCellIndexes: [2, 6, 7],
  },
  clientes: {
    columns: ["Nombre", "Número de documento", "Teléfono", "Correo", "Estado"],
    // Form order: document type + number on one line, then the name (keys keep row positions)
    fields: [
      {
        key: "1",
        label: "Tipo de documento",
        type: "select",
        options: DOC_TYPES,
      },
      { key: "2", label: "Número de documento", type: "text" },
      { key: "0", label: "Nombres y apellidos", type: "text" },
      { key: "3", label: "Teléfono", type: "tel" },
      { key: "4", label: "Correo electrónico", type: "email" },
      { key: "5", label: "Dirección principal", type: "text" },
    ],
    seed: [],
    statusIndex: 7,
    // 12: id of its app account (the same person in Usuarios)
    hiddenCellIndexes: [1, 5, 6, 9, 10, 11, 12],
  },
  // [0 barrio, 1 zona cercana, 2 tiempo estimado (min), 3 costo del domicilio, 4 estado, 5 id]
  domicilios: {
    columns: ["Barrio", "Zona cercana", "Tiempo estimado (min)", "Costo del domicilio", "Estado"],
    fields: [
      { key: "0", label: "Nombre del barrio", type: "text" },
      { key: "1", label: "Zona cercana validada", type: "select", options: ["Sí", "No"] },
      { key: "2", label: "Tiempo estimado (minutos)", type: "number" },
      { key: "3", label: "Costo del domicilio (COP)", type: "number" },
    ],
    seed: [],
    // The backend has no delete for barrios (orders point to them): they are deactivated
    noDelete: true,
    statusIndex: 4,
    hiddenCellIndexes: [5],
  },
  ventas: {
    columns: [
      "Venta",
      "Cliente",
      "Fecha",
      "Total",
      "Estado del pedido",
    ],
    fields: [
      { key: "8", label: "Pedido asociado", type: "text" },
      {
        key: "1",
        label: "Cliente",
        type: "select",
        options: [],
      },
      { key: "2", label: "Fecha", type: "date" },
      {
        key: "0",
        label: "Usuario (vendedor)",
        type: "select",
        options: [],
      },
      {
        key: "3",
        label: "Tipo de venta",
        type: "select",
        options: ["Local", "Domicilio", "Para recoger"],
      },
      {
        key: "4",
        label: "Método de pago",
        type: "select",
        options: ["Transferencia", "Efectivo"],
      },
      // Comes from the order (shown read-only); the order's status (row[10]) follows the order by itself
      { key: "6", label: "Total", type: "number" },
    ],
    seed: [],
    noDelete: true,
    autoId: true,
    // [8] estado: «Anulada» when it's voided (saved with the sale, so it stays after reloading)
    statusIndex: 8,
    inactiveStatus: "Anulada",
    hiddenCellIndexes: [1, 4, 5, 6, 8, 9, 11, 12],
  },
  pedidos: {
    columns: [
      "Cód. Pedido",
      "Recibe",
      "Total",
      "Estado",
      "Estado de pago",
      "Autorización producción",
    ],
    fields: [
      {
        key: "0",
        label: "Recibe",
        type: "select",
        options: [],
      },
      {
        key: "2",
        label: "Tipo de pedido",
        type: "select",
        options: ["Local", "Domicilio", "Para recoger"],
      },
      {
        key: "3",
        label: "Método de pago",
        type: "select",
        options: ["Efectivo", "Transferencia"],
      },
      {
        key: "4",
        label: "Modalidad de pago",
        type: "select",
        options: ["Anticipado", "Contraentrega"],
      },
      { key: "5", label: "Total (COP)", type: "number" },
      {
        key: "7",
        label: "Estado de pago",
        type: "select",
        options: [
          "Pendiente",
          "Pendiente de verificación",
          "Pagado",
          "Rechazado",
        ],
      },
      { key: "9", label: "Comprobante de pago", type: "image" },
      { key: "1", label: "Productos solicitados", type: "textarea" },
      { key: "11", label: "Comentario (especificaciones)", type: "textarea" },
      { key: "12", label: "Teléfono de quien recibe", type: "tel" },
    ],
    seed: [],
    noDelete: true,
    autoId: true,
    // 10 = order lines JSON saved by admin-created orders (was showing as "Dato 7")
    // 11 = payment rejection reason, 12 = comment (also goes to its production order)
    hiddenCellIndexes: [2, 3, 4, 5, 10, 11, 12],
  },
  devoluciones: {
    columns: ["Código", "Cliente", "Motivo", "Fecha"],
    // [0 código (automático), 1 venta asociada, 2 cliente (de la venta), 3 comentario, 4 motivo, 5 fecha]
    fields: [
      { key: "1", label: "Venta asociada", type: "text" },
      {
        key: "4",
        label: "Motivo de devolución",
        type: "select",
        options: ["Reembolso", "Reposición"],
      },
      { key: "5", label: "Fecha", type: "date" },
      // 3: why it's returned (a Reposición takes it to its production order)
      { key: "3", label: "Comentario (por qué se devuelve)", type: "textarea" },
    ],
    seed: [],
    noDelete: true,
    noExport: true,
    // 6 = returned products (JSON), shown in the detail
    hiddenCellIndexes: [1, 3, 6],
  },
}

// Quick filters per module. Pedidos: [7] estado, [8] estado de pago; Ventas: [8] estado; Insumos: [4] stock, [5] mínimo
export const QUICK_FILTERS: Record<string, { label: string; test: (row: Row) => boolean }[]> = {
  pedidos: [
    { label: "Por confirmar", test: (row) => String(row[7]) === "Por confirmar" },
    { label: "Pago por verificar", test: (row) => String(row[8]) === "Pendiente de verificación" },
    { label: "En cocina", test: (row) => String(row[7]) === "En cocina" },
    { label: "Sin pagar", test: (row) => String(row[8]) !== "Pagado" && String(row[7]) !== "Cancelado" },
    { label: "Entregados", test: (row) => String(row[7]) === "Entregado" },
    { label: "Cancelados", test: (row) => String(row[7]) === "Cancelado" },
  ],
  ventas: [
    { label: "Vigentes", test: (row) => String(row[8]) !== "Anulada" },
    { label: "Anuladas", test: (row) => String(row[8]) === "Anulada" },
  ],
  insumos: [
    { label: "Bajo mínimo", test: (row) => Number(row[4]) <= Number(row[5]) },
    { label: "Agotados", test: (row) => Number(row[4]) <= 0 },
  ],
}

// A shop order still open (not delivered nor cancelled) after this many days shows a "Pedido sin movimiento" alert
export const STALE_ORDER_DAYS = 2

// Order payment moves forward only (as production statuses); "Pagado" creates the order's sale
export const PAYMENT_NEXT: Record<string, string> = {
  Pendiente: "Pagado",
  "Pendiente de verificación": "Pagado",
  Rechazado: "Pendiente de verificación",
}

export const SIDEBAR_MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Ico.dashboard,
    children: [],
    color: C.amber,
  },
  {
    key: "roles",
    label: "Roles y permisos",
    icon: Ico.shield,
    children: [],
    color: "#A78BFA",
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Ico.users,
    children: [],
    color: "#8B8CF8",
  },
  {
    key: "compras-g",
    label: "Compras",
    icon: Ico.shopping,
    children: [
      { key: "cat-insumos", label: "Categ. Insumos" },
      { key: "insumos", label: "Insumos" },
      { key: "proveedores", label: "Proveedores" },
      { key: "compras", label: "Compras" },
      { key: "perdidas", label: "Pérdida Insumos" },
    ],
    color: C.forest,
  },
  {
    key: "prod-g",
    label: "Producción",
    icon: Ico.chef,
    children: [
      { key: "cat-producto", label: "Categ. Producto" },
      { key: "producto", label: "Productos" },
      { key: "produccion", label: "Órdenes de Prod." },
      { key: "producto-no-conforme", label: "Prod. No Conforme" },
    ],
    color: C.red,
  },
  {
    key: "ventas-g",
    label: "Ventas",
    icon: Ico.cash,
    children: [
      { key: "clientes", label: "Clientes" },
      { key: "pedidos", label: "Pedidos" },
      { key: "ventas", label: "Ventas" },
      { key: "devoluciones", label: "Devoluciones" },
    ],
    color: C.mustard,
  },
  {
    key: "domicilios",
    label: "Domicilios",
    icon: Ico.mapPin,
    children: [],
    color: C.mustard,
  },
]

// "Cliente mostrador": anonymous client for sales to people who don't give their details.
// Created by the backend (init.sql); it can't be edited, deactivated or deleted.
export const COUNTER_CLIENT_DOC = "000000000"

// Superadministrador: always this account; nobody can deactivate, delete it, change its role or e-mail
export const SUPER_ADMIN_EMAIL = "admin@minifood.com"

// "CC 1020304050" from the supplier row's document type (8) and number (9)
export const DOC_SHORT: Record<string, string> = { "Cédula de Ciudadanía": "CC", "Cédula Extranjería": "CE", NIT: "NIT", Pasaporte: "PA" }

// Natural person form, in display order (the view shows the saved full name, key 0)
export const NATURAL_SUPPLIER_KEYS = ["15", "8", "9", "10", "11", "3", "2", "5", "7"]

export const NATURAL_SUPPLIER_VIEW_KEYS = ["15", "0", "8", "9", "3", "2", "5", "7"]

// A loss sent back to its purchase (its quantity went back to stock)
export const RETURNED_LOSS = "Devuelta a compra"

// ── Permissions ↔ backend ──────────────────────────────────────────────────────
// Panel section -> backend module (also the names of the permissions matrix)
export const SECTION_MODULE: Record<string, string> = {
  roles: "ROLES_PERMISOS",
  usuarios: "USUARIOS",
  "cat-insumos": "CATEGORIAS_INSUMOS",
  insumos: "INSUMOS",
  proveedores: "PROVEEDORES",
  compras: "COMPRAS",
  perdidas: "PERDIDA_INSUMOS",
  "cat-producto": "CATEGORIAS_PRODUCTO",
  producto: "PRODUCTOS",
  produccion: "ORDENES_PRODUCCION",
  "producto-no-conforme": "PRODUCTO_NO_CONFORME",
  clientes: "CLIENTES",
  pedidos: "PEDIDOS",
  domicilios: "BARRIOS",
  ventas: "VENTAS",
  devoluciones: "DEVOLUCIONES",
}

// What each panel section's records are called (titles, dialogs)
export const PURCHASE_ENTITIES: Record<string, { name: string; fem: boolean }> = {
  "cat-insumos": { name: "categoría de insumo", fem: true },
  insumos: { name: "insumo", fem: false },
  proveedores: { name: "proveedor", fem: false },
  compras: { name: "compra", fem: true },
  perdidas: { name: "pérdida de insumo", fem: true },
  "cat-producto": { name: "categoría de producto", fem: true },
  produccion: { name: "orden de producción", fem: true },
  "producto-no-conforme": { name: "producto no conforme", fem: false },
  clientes: { name: "cliente", fem: false },
  pedidos: { name: "pedido", fem: false },
  domicilios: { name: "domicilio", fem: false },
  ventas: { name: "venta", fem: true },
  devoluciones: { name: "devolución", fem: true },
}

export const PERM_MODULE: Record<string, string> = {
  "Roles y permisos": "ROLES_PERMISOS",
  Usuarios: "USUARIOS",
  "Categoría Insumos": "CATEGORIAS_INSUMOS",
  Insumos: "INSUMOS",
  Proveedores: "PROVEEDORES",
  Compras: "COMPRAS",
  "Pérdida Insumos": "PERDIDA_INSUMOS",
  "Categoría Producto": "CATEGORIAS_PRODUCTO",
  Productos: "PRODUCTOS",
  Producción: "ORDENES_PRODUCCION",
  "Producto No Conforme": "PRODUCTO_NO_CONFORME",
  Clientes: "CLIENTES",
  Pedidos: "PEDIDOS",
  Domicilios: "BARRIOS",
  Ventas: "VENTAS",
  Devoluciones: "DEVOLUCIONES",
}

// The backend has one privilege for both "Anular" and "Eliminar" (each module shows one of them)
export const PERM_ACTION: Record<string, string> = { Ver: "VER", Crear: "CREAR", Editar: "EDITAR", Anular: "ELIMINAR", Eliminar: "ELIMINAR" }

// Short filter next to "Buscar": the specific columns (row index) each module can be filtered by
export const TABLE_FILTERS: Record<string, { label: string; index: number }[]> = {
  roles: [{ label: "Estado", index: 2 }],
  usuarios: [{ label: "Rol", index: 3 }, { label: "Estado", index: 5 }],
  "cat-insumos": [{ label: "Estado", index: 2 }],
  insumos: [{ label: "Categoría", index: 1 }, { label: "Estado", index: 12 }],
  proveedores: [{ label: "Tipo de persona", index: 15 }, { label: "Estado", index: 6 }],
  compras: [{ label: "Proveedor", index: 0 }, { label: "Estado", index: 5 }],
  perdidas: [{ label: "Motivo", index: 2 }],
  "cat-producto": [{ label: "Estado", index: 2 }],
  producto: [{ label: "Categoría", index: 1 }, { label: "Estado", index: 4 }],
  // produccion: day and status have their own controls (see GenericTable)
  "producto-no-conforme": [{ label: "Estado", index: 8 }],
  clientes: [{ label: "Estado", index: 7 }],
  domicilios: [{ label: "Zona cercana", index: 1 }, { label: "Estado", index: 4 }],
  ventas: [{ label: "Método de pago", index: 5 }, { label: "Estado del pedido", index: 10 }],
  pedidos: [
    { label: "Estado", index: 7 },
    { label: "Estado de pago", index: 8 },
    { label: "Tipo de pedido", index: 3 },
  ],
  devoluciones: [{ label: "Motivo", index: 4 }],
}
