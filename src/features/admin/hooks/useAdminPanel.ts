import { useCallback, useEffect, useRef, useState } from "react"
import { MOD_CFG, PAYMENT_NEXT, PRODUCTION_STATUSES, SECTION_MODULE, SIDEBAR_MENU, STALE_ORDER_DAYS, SUPER_ADMIN_EMAIL } from "@/features/admin/config/modules"
import { DB_SYNC, PANEL_SYNC, saveRowToDb } from "@/features/admin/services/sync.service"
import { getDashPeriod } from "@/features/admin/utils/dashboard"
import { buildProductionRows, clientOrderToPanelRow, derivePedidoPayment, fixShiftedSale, isActiveStatus, isCounterClientRow, isNaturalSupplier, isReturnedLoss, isSuperAdminRow, nextAutoSaleCode, parseMainSupplies, parsePurchaseLines, permsFromDb, permsToDb, productionLabel, roleLabel, saleTypeOf, supplierRequiredKeys, supplyAsProduct, syncIdIndex, text, withId, withPanelId } from "@/features/admin/utils/rows"
import { loadRegisteredClients } from "@/features/auth/services/auth.service"
import { SODA_PRODUCT, SODA_RE, currentCategory, isSodaName, sodaImage } from "@/features/menu/data/products"
import { loadOrders, pushOrder, readVoucher, saveOrders } from "@/features/orders/services/orders.service"
import { isTransferPaymentMethod } from "@/features/orders/utils/orders"
import { Ico } from "@/shared/components/icons"
import { FIRST_DAY } from "@/shared/constants"
import { api, imageUrl } from "@/shared/services/api"
import { tk } from "@/shared/styles/theme"
import type { AdminNotification, AdminOrderLine, AdminSection, DashPeriod, DbRecord, ModalMode, Order, ProductionItem, Row, TechnicalIngredient, Theme, User } from "@/shared/types"
import { parseAddress } from "@/shared/utils/address"
import { fmt, normalizeDocument, normalizeName, splitNames, toDecimal } from "@/shared/utils/format"
import { loadLS, saveLS } from "@/shared/utils/storage"
import { convertQty, toBaseQuantity } from "@/shared/utils/units"
import { DOC_RULES, EMAIL_PATTERN, EMAIL_RE, NAME_RE, digitsOnly, getPasswordError, normalizeAccountDocumentInput, normalizeDocumentInput, validateDocumentNumber, validatePhoneNumber } from "@/shared/utils/validation"

export // Damaged products of one record: the whole product (quantity) or only some of its insumos (parts)
type PncEntry = { product: string; whole: boolean; quantity: number; unit?: string; parts: { name: string; quantity: number; unit: string }[] }

// Everything the admin panel keeps between renders: its state, effects and handlers, in the same order as before.
// The views (Dashboard, tables, form, modals…) receive this object; see pages/AdminPanel.
export function useAdminPanel({ onSwitchToClient, onLogout, user }: {
  onSwitchToClient: () => void
  onLogout: () => void
  user: User | null
}) {
  const [theme, setTheme] = useState<Theme>("light")
  const [section, setSection] = useState<AdminSection>("dashboard")
  // Sales are registered in the name of whoever is logged in (default seller)
  const sellerName = user?.name || "Administrador"
  // Only the modules this user's role may see (the backend enforces it too)
  const canSee = (key: string) => key === "dashboard" || !user?.permissions || user.permissions.includes(SECTION_MODULE[key])
  // Hides the buttons the role can't use (the backend rejects them anyway)
  const canDo = (key: string, privilege: "CREAR" | "EDITAR" | "ELIMINAR") =>
    !user?.actions || !SECTION_MODULE[key] || !!user.actions[SECTION_MODULE[key]]?.includes(privilege)
  const visibleMenu = SIDEBAR_MENU.map((g) => ({ ...g, children: g.children.filter((c) => canSee(c.key)) })).filter(
    (g) => (g.key.endsWith("-g") ? g.children.length > 0 : canSee(g.key)),
  )
  const [open, setOpen] = useState<string[]>(["ventas-g"])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Desktop: menu with icons only (☰ in the header switches it); remembered in this browser
  // Starts as icons only; on desktop it opens while the cursor is over it
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [dashboardIntroDone, setDashboardIntroDone] = useState(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => setDashboardIntroDone(true), 2100)
    return () => window.clearTimeout(timeout)
  }, [])
  // Labels hide only on large screens (on a phone the menu is a full drawer)
  const hideOnMini = sidebarCollapsed ? "lg:hidden" : ""
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<number>>(
    () => new Set(),
  )
  const [showAdminProfile, setShowAdminProfile] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sidebarScrollTop = useRef(0)
  const preserveSidebarScroll = useCallback((node: HTMLElement | null) => {
    if (node) node.scrollTop = sidebarScrollTop.current
  }, [])
  const dark = theme === "dark"
  const t = tk(dark)
  // Orders placed by clients in the web store
  const clientOrders = loadOrders()
  const orderNotifications: AdminNotification[] = [
    ...clientOrders
      .filter(
        (o) =>
          o.paymentStatus === "Pendiente de verificación" ||
          (o.status === "Por confirmar" && o.paymentStatus !== "Rechazado"),
      )
      .map((o, i) => ({
        id: 1000 + i,
        type: "warn" as const,
        title:
          o.paymentStatus === "Pendiente de verificación"
            ? "Transferencia por verificar"
            : "Pedido por confirmar",
        message: `${o.cliente} hizo el pedido ${o.id} por ${fmt(o.total)}${
          o.voucher ? " y subió el comprobante de pago" : ""
        }.`,
        module: "Pedidos",
        time: o.date,
        target: "pedidos" as const,
      })),
    // Orders still open after STALE_ORDER_DAYS days: someone has to deliver, cancel or close them
    ...clientOrders
      .filter(
        (o) =>
          !["Entregado", "Cancelado"].includes(o.status) &&
          !!o.createdAt &&
          Date.now() - new Date(o.createdAt).getTime() > STALE_ORDER_DAYS * 86_400_000,
      )
      .map((o, i) => {
        const days = Math.floor((Date.now() - new Date(o.createdAt!).getTime()) / 86_400_000)
        return {
          id: 3000 + i,
          type: "danger" as const,
          title: "Pedido sin movimiento",
          message: `${o.id} de ${o.cliente} lleva ${days} días en «${o.status}»${
            o.paymentStatus === "Pagado" ? " y ya está pagado" : ""
          }. Entrégalo, cancélalo o actualiza su estado.`,
          module: "Pedidos",
          time: o.date,
          target: "pedidos" as const,
        }
      }),
  ]
  // Modules already read from the backend (until then their table shows placeholder rows)
  const [loadedSections, setLoadedSections] = useState<Set<string>>(() => new Set())
  const markLoaded = (sec: string) =>
    setLoadedSections((current) => (current.has(sec) ? current : new Set(current).add(sec)))
  // The row just saved glows for a moment, so it is easy to spot in the table
  const [savedHighlight, setSavedHighlight] = useState<{ section: string; key: string } | null>(null)
  useEffect(() => {
    if (!savedHighlight) return
    const timer = window.setTimeout(() => setSavedHighlight(null), 2000)
    return () => window.clearTimeout(timer)
  }, [savedHighlight])
  const [rows, setRows] = useState<Record<string, (string | number)[][]>>(() => {
    const initialRows = Object.fromEntries(
      Object.entries(MOD_CFG).map(([key, config]) => [
        key,
        config.seed.map((row) => [...row] as (string | number)[]),
      ]),
    ) as Record<string, (string | number)[][]>
    const savedUserStatuses = loadLS<Record<string, string>>(
      "adminUserStatuses",
      {},
    )
    initialRows.usuarios = (initialRows.usuarios || []).map((row) => {
      const email = String(row[4] ?? "").trim().toLowerCase()
      const savedStatus = savedUserStatuses[email]
      if (!savedStatus) return row
      const updatedRow = [...row]
      updatedRow[5] = savedStatus
      return updatedRow
    })
    initialRows.pedidos = [
      ...clientOrders.map((order) => clientOrderToPanelRow(order, initialRows.producto || [])),
      ...(initialRows.pedidos || []),
    ]
    // Client orders that don't wait for the owner (or were already confirmed) get their
    // production orders; oldest first so the newest ends up on top
    initialRows.pedidos
      .slice(0, clientOrders.length)
      .reverse()
      .filter((order) => ["Enviada a producción", "Autorizada"].includes(String(order[9])))
      .filter((order) => {
        const stored = clientOrders.find((clientOrder) => clientOrder.id === order[0])
        return !stored?.productionRecords?.length
      })
      .forEach((order) => {
        const lines = JSON.parse(String(order[10] ?? "[]")) as AdminOrderLine[]
        const before = initialRows.produccion || []
        initialRows.produccion = buildProductionRows(lines, before, String(order[0]))
        // Saved on the order (and in the backend) so opening the panel again doesn't create them again
        const created = initialRows.produccion.filter((row) => !before.includes(row))
        saveOrders(loadOrders().map((o) => (o.id === order[0] ? { ...o, productionRecords: created } : o)))
        pushOrder(String(order[0]))
      })
    const supplyProducts = (initialRows.insumos || [])
      .filter((row) => String(row[7]).toLowerCase() === "sí")
      .map(supplyAsProduct)
    initialRows.producto = [...supplyProducts, ...(initialRows.producto || [])]
    const existingClientEmails = new Set(
      (initialRows.clientes || []).flatMap((row) =>
        row.slice(4, 6).map((value) => String(value ?? "").trim().toLowerCase())
          .filter((value) => value.includes("@")),
      ),
    )
    const registeredClientRows = loadRegisteredClients()
      .filter((client) => !existingClientEmails.has(client.email.toLowerCase()))
      .map((client) => [
        client.name,
        client.docType ?? "",
        client.cedula ?? "",
        client.phone ?? "",
        client.email,
        "",
        "No",
        "Activo",
      ])
    initialRows.clientes = [...registeredClientRows, ...(initialRows.clientes || [])]
    return initialRows
  })
  const clientOrdersSnapshot = JSON.stringify(clientOrders)
  const productsSnapshot = JSON.stringify(rows.producto || [])
  const productionSnapshot = JSON.stringify(rows.produccion || [])
  useEffect(() => {
    const latestOrders = loadOrders()
    const orderRows = latestOrders.map((order) => clientOrderToPanelRow(order, rows.producto || []))
    const clientOrderIds = new Set(latestOrders.map((order) => order.id))
    let productionRows = rows.produccion || []
    const ordersToPersist: { id: string; records: Row[] }[] = []

    for (const orderRow of orderRows) {
      const orderId = String(orderRow[0])
      const order = latestOrders.find((candidate) => candidate.id === orderId)
      if (
        !order ||
        order.productionRecords?.length ||
        !["Enviada a producción", "Autorizada"].includes(String(orderRow[9])) ||
        productionRows.some((production) => String(production[15] ?? "") === orderId)
      ) continue

      const lines = JSON.parse(String(orderRow[10] ?? "[]")) as AdminOrderLine[]
      const before = productionRows
      productionRows = buildProductionRows(lines, before, orderId, order.notas || "")
      ordersToPersist.push({
        id: orderId,
        records: productionRows.filter((production) => !before.includes(production)),
      })
    }

    setRows((current) => ({
      ...current,
      pedidos: [
        ...orderRows,
        ...(current.pedidos || []).filter((row) => !clientOrderIds.has(String(row[0]))),
      ],
      produccion: productionRows,
    }))
    if (ordersToPersist.length) {
      const updatedOrders = loadOrders().map((order) => {
        const production = ordersToPersist.find((entry) => entry.id === order.id)
        return production ? { ...order, productionRecords: production.records } : order
      })
      saveOrders(updatedOrders)
      ordersToPersist.forEach(({ id }) => pushOrder(id))
    }
  }, [clientOrdersSnapshot, productsSnapshot, productionSnapshot])
  // Real low-stock alerts from the active insumos, before the order ones
  const notifications: AdminNotification[] = [
    ...(rows.insumos || []).flatMap((r, i) =>
      isActiveStatus(r[12]) && Number(r[4]) <= Number(r[5])
        ? [{
            id: 5000 + i,
            type: Number(r[4]) <= 0 ? ("danger" as const) : ("warn" as const),
            title: Number(r[4]) <= 0 ? "Sin stock" : "Stock bajo",
            message: `${String(r[0])} tiene ${Number(r[4]) || 0} ${String(r[2] ?? "")}; el mínimo es ${Number(r[5]) || 0} ${String(r[2] ?? "")}.`,
            module: "Insumos",
            time: "Ahora",
            target: "insumos" as const,
          }]
        : [],
    ),
    // Bought sodas at or below their own stock mínimo (their stock is on the product)
    ...(rows.producto || []).flatMap((p, i) => {
      const stock = Number(p[12]) || 0
      const bought = (rows.compras || []).some((c) => parsePurchaseLines(c[6]).some((l) => normalizeName(l.name) === normalizeName(p[0])))
      return p[1] === SODA_PRODUCT && isSodaName(p[0]) && isActiveStatus(p[4]) && bought && stock <= (Number(p[14]) || 0)
        ? [{
            id: 7000 + i,
            type: stock <= 0 ? ("danger" as const) : ("warn" as const),
            title: stock <= 0 ? "Gaseosa agotada" : "Pocas gaseosas",
            message: stock <= 0
              ? `${String(p[0])} se agotó: no se muestra en la tienda hasta la próxima compra.`
              : `De ${String(p[0])} quedan ${stock} und; el mínimo es ${Number(p[14]) || 0} und.`,
            module: "Productos",
            time: "Ahora",
            target: "producto" as const,
          }]
        : []
    }),
    ...orderNotifications,
    // Each role only gets the alerts of the modules it can see
  ].filter((n) => canSee(n.target))
  const unreadNotifications = notifications.filter((n) => !readNotifications.has(n.id)).length
  // Last annulment, offered as "Deshacer" for a few seconds
  const [undoAnul, setUndoAnul] = useState<{ sec: string; idx: number; statusIndex: number; name: string } | null>(null)
  useEffect(() => {
    if (!undoAnul) return
    const timer = setTimeout(() => setUndoAnul(null), 8000)
    return () => clearTimeout(timer)
  }, [undoAnul])
  const [anulled, setAnulled] = useState<Record<string, Set<number>>>({})
  const [prodImgs, setProdImgs] = useState<Record<number, string>>({})
  // Modules in DB_SYNC are loaded from the backend; their localOnly rows stay in the browser
  const loadModule = (sec: string) => {
    const spec = DB_SYNC[sec]
    return api<DbRecord[]>(spec.path)
      .then((records) => {
        setRows((current) => {
          const next = {
            ...current,
            [sec]: [
              ...records.filter((r) => spec.shows?.(r) ?? true).map(spec.toRow),
              ...(current[sec] || []).filter((row) => spec.localOnly?.(row)),
            ],
          }
          // Insumos marked "Producto de insumo" also show up in Productos
          if (sec === "insumos")
            next.producto = [
              ...(current.producto || []).filter((row) => row[1] !== "Producto de insumo"),
              ...next.insumos.filter((row) => text(row[7]).toLowerCase() === "sí").map(supplyAsProduct),
            ]
          return next
        })
        // Backend products come first in the table, so their row index matches the record order
        if (sec === "producto")
          setProdImgs(
            Object.fromEntries(
              records.flatMap((p, i) => (p.imagenes?.[0] ? [[i, imageUrl(p.imagenes[0])]] : [])),
            ),
          )
      })
      .catch((err) => console.warn(`No se pudo cargar «${sec}» del backend:`, err))
      .finally(() => markLoaded(sec))
  }
  useEffect(() => {
    Object.keys(DB_SYNC).forEach(loadModule)
  }, [])
  // Someone may have changed their own data (Mi cuenta / Mi perfil): Usuarios and Clientes are re-read when opened,
  // when coming back to this tab and right after this browser saves a profile
  useEffect(() => {
    const people = section === "usuarios" || section === "clientes"
    const reloadPeople = () => ["usuarios", "clientes"].forEach(loadModule)
    const onFocus = () => people && reloadPeople()
    if (people) reloadPeople()
    window.addEventListener("focus", onFocus)
    window.addEventListener("profile-updated", reloadPeople)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("profile-updated", reloadPeople)
    }
  }, [section])
  // Saves a row in the backend (statusOnly: just its Activo/Inactivo change); on failure tells the admin
  // and reloads that table from the backend
  const syncRow = (
    sec: string,
    row: Row,
    isNew: boolean,
    statusOnly = false,
    // Extra save once the record has its id (e.g. the product photo)
    alsoSave?: (id: number) => Promise<unknown>,
    // The form shows the error itself (and keeps what was typed) instead of an alert
    silent = false,
  ): Promise<string | null> => {
    const spec = DB_SYNC[sec]
    if (!spec || spec.localOnly?.(row)) return Promise.resolve(null)
    if (!isNew && !row[spec.idIndex]) {
      const message = "Este registro no está vinculado a la base de datos. Recarga la página e inténtalo de nuevo."
      if (!silent) window.alert(message)
      return Promise.resolve(message)
    }
    const saved =
      statusOnly && spec.setStatus
        ? spec.setStatus(row[spec.idIndex], row).then(() => ({
            id: Number(row[spec.idIndex]),
            saved: undefined,
          }))
        : saveRowToDb(spec, row)
    return saved
      .then(({ id, saved: savedRecord }) => {
        setRows((current) => ({
          ...current,
          [sec]: (current[sec] || []).map((r) => {
            if (r !== row) return r
            const updated = withId([...r], spec.idIndex, id)
            if (sec === "usuarios" && savedRecord?.es_administrador_principal) {
              updated[8] = "Principal"
            }
            return updated
          }),
        }))
        spec.reloads?.forEach(loadModule)
        // Re-read people from the backend: e.g. a new client gets its app account there («Tiene cuenta en la app»)
        if (sec === "clientes" || sec === "usuarios") loadModule(sec)
        if (statusOnly) {
          if (sec !== "producto") return null
          return loadModule(sec).then(() => {
            window.dispatchEvent(new Event("products-updated"))
            return null
          })
        }
        return Promise.all([spec.afterSave?.(id, row), alsoSave?.(id)]).then(async () => {
          if (sec === "producto") {
            await loadModule(sec)
            window.dispatchEvent(new Event("products-updated"))
          }
          return null
        })
      })
      .catch((err) => {
        const message = `No se guardó en la base de datos: ${(err as Error).message}`
        if (!silent) window.alert(message)
        return loadModule(sec).then(() => {
          if (sec === "producto") window.dispatchEvent(new Event("products-updated"))
          return message
        })
      })
  }
  const deleteRowInDb = (sec: string, row: Row | undefined) => {
    const spec = DB_SYNC[sec]
    const id = spec && row?.[spec.idIndex]
    if (!id) return
    api(`${spec.path}/${id}`, "DELETE")
      .then(() => {
        // The backend also takes it off the suppliers' lists
        if (sec === "insumos") loadModule("proveedores")
        if (sec === "domicilios") loadModule("domicilios")
      })
      .catch((err) => {
        window.alert(`No se eliminó en la base de datos: ${(err as Error).message}`)
        loadModule(sec)
      })
  }
  // PANEL_SYNC modules: loaded once, then every created/changed/removed row is saved automatically
  const panelLoaded = useRef<Record<string, boolean>>({})
  // Last saved version of each row, by backend id (to only send real changes)
  const panelSaved = useRef<Record<string, Map<string | number, string>>>({})
  const savePncAndReplacement = async (
    pncRow: Row,
    productionRow: Row,
    affectedProduction?: { id: number; row: Row },
  ) => {
    const productionIdIndex = PANEL_SYNC.produccion.idIndex
    const saved = await api<{
      id_producto_no_conforme: number
      id_orden_produccion: number
    }>("/productos-no-conformes/con-reposicion", "POST", {
      producto_no_conforme: pncRow.slice(0, PANEL_SYNC["producto-no-conforme"].idIndex),
      orden_produccion: productionRow.slice(0, productionIdIndex),
      ...(affectedProduction
        ? {
            orden_produccion_afectada: {
              id: affectedProduction.id,
              datos_panel: affectedProduction.row.slice(0, productionIdIndex),
            },
          }
        : {}),
    })
    const persistedPnc = withPanelId(
      pncRow,
      PANEL_SYNC["producto-no-conforme"].idIndex,
      saved.id_producto_no_conforme,
    )
    const persistedProduction = withPanelId(
      productionRow,
      PANEL_SYNC.produccion.idIndex,
      saved.id_orden_produccion,
    )
    for (const [section, row, idIndex] of [
      ["producto-no-conforme", persistedPnc, PANEL_SYNC["producto-no-conforme"].idIndex],
      ["produccion", persistedProduction, PANEL_SYNC.produccion.idIndex],
    ] as const) {
      if (!panelSaved.current[section]) panelSaved.current[section] = new Map()
      panelSaved.current[section].set(row[idIndex], JSON.stringify(row))
    }
    if (affectedProduction && panelSaved.current.produccion) {
      const persistedAffected = withPanelId(
        affectedProduction.row,
        productionIdIndex,
        affectedProduction.id,
      )
      panelSaved.current.produccion.set(
        affectedProduction.id,
        JSON.stringify(persistedAffected),
      )
    }
    return { pncRow: persistedPnc, productionRow: persistedProduction }
  }
  // (Re)loads one PANEL_SYNC module from the backend; also used after the server creates rows itself
  // (e.g. the sale of a shop order that was just paid)
  const loadPanel = (sec: string) => {
    const spec = PANEL_SYNC[sec]
    return api<DbRecord[]>(spec.path)
      .then((records) => {
        const dbRows = records.map((r) => withPanelId(sec === "ventas" ? fixShiftedSale(r.datos_panel) : r.datos_panel, spec.idIndex, r.id))
        setRows((current) => {
          // Marked loaded together with its rows: if the sync ran between the two it would take every row
          // for deleted (it saw them saved but not on screen) and send a DELETE for each
          panelSaved.current[sec] = new Map(dbRows.map((r) => [r[spec.idIndex], JSON.stringify(r)]))
          panelLoaded.current[sec] = true
          return {
            ...current,
            [sec]: [
              ...dbRows,
              ...(current[sec] || []).filter(
                (r) => !r[spec.idIndex] && (spec.keepLocal?.(r, dbRows) || spec.owns?.(r) === false),
              ),
            ],
          }
        })
      })
      .catch((err) => console.warn(`No se pudo cargar «${sec}» del backend:`, err))
      .finally(() => markLoaded(sec))
  }
  useEffect(() => {
    Object.keys(PANEL_SYNC).forEach(loadPanel)
  }, [])
  // Panel rows the server refused to create (skipped until they change)
  const failedCreates = useRef(new WeakSet<Row>())
  useEffect(() => {
    Object.entries(PANEL_SYNC).forEach(([sec, spec]) => {
      if (!panelLoaded.current[sec]) return
      const saved = panelSaved.current[sec]
      const present = new Set<string | number>()
      const created: Row[] = []
      for (const row of rows[sec] || []) {
        const id = row[spec.idIndex]
        // Not saved from here (e.g. a store order), but still on screen: it must never look deleted
        if (spec.owns?.(row) === false) {
          if (id) present.add(id)
          continue
        }
        if (!id) {
          const orderCode = sec === "ventas" ? String(row[9] ?? "") : ""
          const orderHasSale =
            !!orderCode && orderCode !== "Sin pedido" &&
            (rows.ventas || []).some((other) => other !== row && String(other[9] ?? "") === orderCode)
          if (!failedCreates.current.has(row) && !orderHasSale) created.push(row)
        }
        else if (String(id).startsWith("guardando-")) continue
        else {
          present.add(id)
          const json = JSON.stringify(row)
          if (saved.get(id) === json) continue
          saved.set(id, json)
          api(`${spec.path}/${id}`, "PUT", { datos_panel: row.slice(0, spec.idIndex) }).catch((err) => {
            saved.delete(id)
            window.alert(`No se guardó en la base de datos: ${(err as Error).message}`)
          })
        }
      }
      // Rows removed in the panel
      for (const id of [...saved.keys()]) {
        if (present.has(id)) continue
        // Its row was replaced by one this module doesn't save (the store's copy of that order): not a deletion
        if (spec.owns && !spec.owns(JSON.parse(saved.get(id)!))) continue
        saved.delete(id)
        api(`${spec.path}/${id}`, "DELETE").catch((err) =>
          window.alert(`No se eliminó en la base de datos: ${(err as Error).message}`),
        )
      }
      // New rows: mark them while they are created so they're sent only once
      created.forEach((row) => {
        const tempId = `guardando-${Math.random().toString(36).slice(2)}`
        const data = row.slice(0, spec.idIndex)
        setRows((current) => ({
          ...current,
          [sec]: (current[sec] || []).map((r) => (r === row ? withPanelId(r, spec.idIndex, tempId) : r)),
        }))
        api<DbRecord>(spec.path, "POST", { datos_panel: data })
          .then(({ id }) => {
            // If the row changed while it was being created, the next pass sends the change
            saved.set(id, JSON.stringify(withPanelId(data, spec.idIndex, id)))
            setRows((current) => ({
              ...current,
              [sec]: (current[sec] || []).map((r) => (r[spec.idIndex] === tempId ? withPanelId(r, spec.idIndex, id) : r)),
            }))
          })
          .catch((err) => {
            const moduleName =
              SIDEBAR_MENU.flatMap((item) => item.children).find((item) => item.key === sec)?.label ?? sec
            window.alert(`No se pudo crear «${String(row[0] ?? "")}» en ${moduleName}: ${(err as Error).message}`)
            // Back to "new", but not retried until the record changes
            setRows((current) => ({
              ...current,
              [sec]: (current[sec] || []).map((r) => {
                if (r[spec.idIndex] !== tempId) return r
                const back = withPanelId(r, spec.idIndex, "")
                failedCreates.current.add(back)
                return back
              }),
            }))
          })
      })
    })
  }, [rows])
  const [paymentProofs, setPaymentProofs] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        clientOrders.flatMap((o, i) => (o.voucher ? [[i, o.voucher]] : [])),
      ),
  )
  const [paymentProofDraft, setPaymentProofDraft] = useState("")
  const [search, setSearch] = useState<Record<string, string>>({})
  const [tableFilter, setTableFilter] = useState<Record<string, string>>({})
  // Órdenes de producción: filter by day ("YYYY-MM-DD") and by status ("" = all)
  const [prodDay, setProdDay] = useState("")
  const [prodStatus, setProdStatus] = useState("")
  const [pg, setPg] = useState<Record<string, number>>({})
  const [modalState, setModal] = useState<{
    mode: ModalMode
    section: string
    idx: number | null
  }>({ mode: null, section: "", idx: null })
  const modal = modalState
  // The row the modal opened with: if the table reloads (and reorders) meanwhile, it is found again by its id
  const modalRowRef = useRef<Row | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [saveError, setSaveError] = useState("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [formValidationAttempted, setFormValidationAttempted] = useState(false)
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({})
  const [imgPreview, setImgPreview] = useState("")
  const [technicalSheetOpen, setTechnicalSheetOpen] = useState(false)
  const [technicalIngredients, setTechnicalIngredients] = useState<TechnicalIngredient[]>([])
  const [technicalSteps, setTechnicalSteps] = useState<string[]>([])
  const [technicalStepDraft, setTechnicalStepDraft] = useState("")
  const [technicalStepEdit, setTechnicalStepEdit] = useState<{ index: number; text: string } | null>(null)
  const [technicalIngredientUnit, setTechnicalIngredientUnit] = useState("")
  // Search box of the insumo picker in the product's ficha técnica (null = list closed)
  const [technicalIngredientSearch, setTechnicalIngredientSearch] = useState<string | null>(null)
  const [technicalIngredientSelect, setTechnicalIngredientSelect] = useState("")
  const [technicalIngredientQuantity, setTechnicalIngredientQuantity] = useState("1")
  const [technicalSheetError, setTechnicalSheetError] = useState("")
  const [pedidoProductoSelect, setPedidoProductoSelect] = useState("")
  const [pedidoProductCategory, setPedidoProductCategory] = useState("Todas")
  const [pedidoProductSearch, setPedidoProductSearch] = useState("")
  // The product search's suggestion list is open
  const [pedidoSearchOpen, setPedidoSearchOpen] = useState(false)
  const [pedidoProductQuantity, setPedidoProductQuantity] = useState("1")
  const [pedidoAdditionsFor, setPedidoAdditionsFor] = useState("")
  const [pedidoOrderLines, setPedidoOrderLines] = useState<AdminOrderLine[]>([])
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([])
  const [productionProductSelect, setProductionProductSelect] = useState("")
  // Nuevo producto no conforme: production order chosen to register it from
  const [pncOrderPick, setPncOrderPick] = useState("")
  const [pncSaving, setPncSaving] = useState(false)
  // Order detail: products whose additions and drinks are shown ("Más detalles")
  const [orderDetailOpen, setOrderDetailOpen] = useState<string[]>([])
  // ...or "sin orden": only then the manual form shows (keeps the window short)
  const [pncManual, setPncManual] = useState(false)
  // New production order: product search (null = list closed) and the line being edited
  const [productionSearch, setProductionSearch] = useState<string | null>(null)
  const [productionItemEdit, setProductionItemEdit] = useState<{ index: number; qty: string } | null>(null)
  // Which list the search shows: menu products or additions
  const [productionKind, setProductionKind] = useState<"productos" | "adiciones" | "bebidas">("productos")
  // Unit of measure of the line being added (singular word: "unidad", "bolsita", "kg"...)
  const [productionItemUnit, setProductionItemUnit] = useState("")
  const [productionItemQuantity, setProductionItemQuantity] = useState("1")
  const [productionAdditionParentId, setProductionAdditionParentId] = useState("")
  const [productionSelectedSauces, setProductionSelectedSauces] = useState<string[]>([])
  const [productionFormError, setProductionFormError] = useState("")
  // "Nueva compra" item picker (limited to the selected supplier's insumos)
  const [purchaseItemSelect, setPurchaseItemSelect] = useState("")
  // What is typed in the purchase's insumo search (null = not searching: it shows the chosen insumo)
  const [purchaseSupplySearch, setPurchaseSupplySearch] = useState<string | null>(null)
  const [purchaseItemQty, setPurchaseItemQty] = useState("1")
  const [purchaseItemPrice, setPurchaseItemPrice] = useState("")
  const [purchaseFormError, setPurchaseFormError] = useState("")
  // "Enviar a pérdida" from a purchase line (edit mode)
  const [lossDraft, setLossDraft] = useState<{
    insumo: string
    unit: string
    max: number
    qty: string
    motivo: string
    responsable: string
    fecha: string
    origin: string
    // The purchase's number: the loss is linked to it (id_compra)
    purchaseId: string
  } | null>(null)
  const [lossError, setLossError] = useState("")
  const [purchaseNotice, setPurchaseNotice] = useState("")
  // Insumo form: suppliers that sell it (saved in each supplier's "Insumos que suministra")
  const [supplySuppliers, setSupplySuppliers] = useState<string[]>([])
  // Insumo form: the suppliers dropdown (open + search)
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)
  const [supplierPickerQuery, setSupplierPickerQuery] = useState("")
  // Supplier form: search box of "Insumos que suministra"
  const [supplierSupplySearch, setSupplierSupplySearch] = useState("")
  // Where the insumos list opens (the search box's position); null = closed
  const [supplierSupplyOpen, setSupplierSupplyOpen] = useState<DOMRect | null>(null)
  // A form left open to create something in another module (supplier -> insumo, purchase -> supplier);
  // it comes back when that other form closes, with what was created already chosen
  const [formReturn, setFormReturn] = useState<{
    section: string
    child: string
    mode: ModalMode
    idx: number | null
    form: Record<string, string>
  } | null>(null)
  const [purchaseConfirmOpen, setPurchaseConfirmOpen] = useState(false)
  // Reason typed when a loss goes back to its purchase (null = dialog closed)
  const [lossReturnReason, setLossReturnReason] = useState<string | null>(null)
  const [lossReturnError, setLossReturnError] = useState("")
  const [lossReturnQty, setLossReturnQty] = useState("")
  const [lossReturnSaving, setLossReturnSaving] = useState(false)
  const [purchaseItemEdit, setPurchaseItemEdit] = useState<{ index: number; qty: string; price: string } | null>(null)
  const resetPurchasePicker = () => {
    setPurchaseItemEdit(null)
    setPurchaseItemSelect("")
    setPurchaseItemQty("1")
    setPurchaseItemPrice("")
    setPurchaseFormError("")
    setPurchaseNotice("")
    setLossDraft(null)
  }
  const [pncTarget, setPncTarget] = useState<number | null>(null)
  const [pncForm, setPncForm] = useState<Record<string, string>>({})
  const [pncError, setPncError] = useState("")
  const [pncFieldErrors, setPncFieldErrors] = useState<Record<string, string>>({})
  const [quickClientOpen, setQuickClientOpen] = useState(false)
  const [quickClientForm, setQuickClientForm] = useState<Record<string, string>>({})
  const [quickClientErrors, setQuickClientErrors] = useState<Record<string, string>>({})
  const [clientFormError, setClientFormError] = useState("")
  // Validation message for the insumo's technical sheet (producto de insumo)
  const [supplyFormError, setSupplyFormError] = useState("")
  // Live validation (categories, insumos, productos): a field shows its error once it
  // has been changed or after the first "Guardar"
  const [formInitial, setFormInitial] = useState<Record<string, string>>({})
  const [formTried, setFormTried] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const changed = Object.keys(formData).filter(
      (key) => (formData[key] ?? "") !== (formInitial[key] ?? ""),
    )
    if (changed.some((key) => !touchedFields[key]))
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(changed.map((key) => [key, true])),
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])
  const [quickClientError, setQuickClientError] = useState("")
  // row: the record shown in the dialog, so a reload meanwhile can't make it delete another one
  const [delTarget, setDelTarget] = useState<{
    section: string
    idx: number
    row?: Row
  } | null>(null)
  const [paymentRejectionTarget, setPaymentRejectionTarget] = useState<number | null>(null)
  const [paymentRejectionReason, setPaymentRejectionReason] = useState("")
  const [paymentRejectionError, setPaymentRejectionError] = useState("")
  const [anulTarget, setAnulTarget] = useState<{
    section: string
    idx: number
  } | null>(null)
  const [chartFilter, setChartFilter] = useState<DashPeriod>("semana")
  // Any day inside the chosen period
  const [chartAnchor, setChartAnchor] = useState(() => new Date())
  const [rolesPerms, setRolesPerms] =
    useState<Record<string, Record<string, string[]>>>(() =>
      loadLS("adminRolePermissions", {}),
    )
  useEffect(() => {
    saveLS("adminRolePermissions", rolesPerms)
  }, [rolesPerms])
  // Permissions matrix: loaded from the backend, then each role's changes are saved (Administrador always has all)
  const permsLoaded = useRef(false)
  const permsSaved = useRef(new Map<string | number, string>())
  useEffect(() => {
    api<DbRecord[]>("/roles")
      .then((roles) => Promise.all(roles.map((r) => api<DbRecord>(`/roles/${r.id_rol}`))))
      .then((roles) => {
        const next = Object.fromEntries(roles.map((r) => [roleLabel(r.nombre_rol), permsFromDb(r.permisos)]))
        roles.forEach((r) => permsSaved.current.set(r.id_rol, JSON.stringify(permsToDb(next[roleLabel(r.nombre_rol)]))))
        setRolesPerms(next)
        permsLoaded.current = true
      })
      .catch((err) => console.warn("No se pudieron cargar los permisos del backend:", err))
  }, [])
  useEffect(() => {
    if (!permsLoaded.current) return
    for (const role of rows.roles || []) {
      const id = role[DB_SYNC.roles.idIndex]
      const name = String(role[0] ?? "")
      if (!id || name.toLowerCase() === "administrador") continue
      const permisos = permsToDb(rolesPerms[name] || {})
      const json = JSON.stringify(permisos)
      if (permsSaved.current.get(id) === json) continue
      permsSaved.current.set(id, json)
      api(`/roles/${id}/permisos`, "PUT", { permisos }).catch((err) => {
        permsSaved.current.delete(id)
        window.alert(`Los permisos de «${name}» no se guardaron en la base de datos: ${(err as Error).message}`)
      })
    }
  }, [rolesPerms, rows.roles])
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false)
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      )
        setNotificationsOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])
  const toggleGrp = (k: string) =>
    setOpen((groups) => (groups.includes(k) ? [] : [k]))
  const sectionLabel =
    SIDEBAR_MENU.find((item) => item.key === section)?.label ??
    SIDEBAR_MENU.flatMap((item) => item.children).find(
      (child) => child.key === section,
    )?.label ??
    ""
  const markNotificationRead = (id: number) => {
    setReadNotifications((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }
  const markAllNotificationsRead = () =>
    setReadNotifications(
      new Set(notifications.map((notification) => notification.id)),
    )
  const getAutoTechVersion = (existingRows: (string | number)[][] = []) => {
    const versions = existingRows
      .map((r) => String(r[6] ?? "").trim())
      .filter(Boolean)
      .map((value) => {
        const match = /^v?(\d+)(?:\.(\d+))?$/i.exec(value)
        if (!match) return null
        return { major: Number(match[1]), minor: Number(match[2] || "0") }
      })
      .filter((item): item is { major: number; minor: number } => item !== null)

    const maxMajor = versions.length
      ? Math.max(...versions.map((item) => item.major))
      : 0
    const maxMinor = versions.filter((item) => item.major === maxMajor).length
      ? Math.max(
          ...versions
            .filter((item) => item.major === maxMajor)
            .map((item) => item.minor),
        )
      : 0

    return `v${maxMajor + 1}.${maxMinor}`
  }
  const getTechVersions = (productName: string) => {
    const versions = (rows.producto || [])
      .filter((r) => String(r[0] ?? "") === productName)
      .map((r) => ({
        version: String(r[6] ?? ""),
        name: String(r[5] ?? ""),
        insumos: String(r[7] ?? ""),
        preparacion: String(r[8] ?? ""),
      }))
    return versions
  }
  const nextTechVersion = (version: string) => {
    const match = /^v?(\d+)(?:\.(\d+))?$/i.exec(version.trim())
    return match
      ? `v${Number(match[1])}.${Number(match[2] || "0") + 1}`
      : getAutoTechVersion(rows.producto || [])
  }
  // Only real insumos (from the backend) can go in a ficha técnica
  // "Compra a <proveedor> del <fecha larga>": the origin text a loss sent from that purchase shows
  const purchaseLabel = (purchase: Row) => {
    const date = new Date(`${String(purchase[1] ?? "").slice(0, 10)}T00:00:00`)
    const label = Number.isNaN(date.getTime())
      ? String(purchase[1] ?? "")
      : date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    return `Compra a ${String(purchase[0])} del ${label}`
  }
  // Did this loss come from that purchase? By its number (row[10] = id_compra); older losses only have the text
  const isLossOfPurchase = (loss: Row, purchase: Row) =>
    loss[10] ? String(loss[10]) === String(purchase[DB_SYNC.compras.idIndex]) : String(loss[5] ?? "") === purchaseLabel(purchase)
  const isLossPurchaseAnnulled = (loss?: Row) => {
    const matches = loss ? (rows.compras || []).filter((c) => isLossOfPurchase(loss, c)) : []
    return matches.length > 0 && matches.every((c) => !isActiveStatus(c[5]))
  }
  // What carries stock: an insumo, or a resale soda (its product of «Bebidas»: row[12] stock, row[13] cost)
  const sodaProductRow = (name: string | number) =>
    isSodaName(name) ? (rows.producto || []).find((p) => p[1] === SODA_PRODUCT && normalizeName(p[0]) === normalizeName(name)) : undefined
  const stockOf = (name: string | number) => {
    const insumo = rows.insumos?.find((i) => normalizeName(i[0]) === normalizeName(name))
    return insumo ? Number(insumo[4]) : Number(sodaProductRow(name)?.[12])
  }
  // Unit cost: the insumo's, or a soda's (on its product, set by its latest purchase)
  const costOf = (name: string | number) => {
    const insumo = rows.insumos?.find((i) => normalizeName(i[0]) === normalizeName(name))
    return Number(insumo ? insumo[3] : sodaProductRow(name)?.[13]) || 0
  }
  // A soda only has its stock controlled once it has been bought
  const wasBought = (name: string | number) =>
    (rows.compras || []).some((c) => parsePurchaseLines(c[6]).some((l) => normalizeName(l.name) === normalizeName(name)))
  // Every soda for sale, named like the order line (Productos already lists them)
  const sodaOptions = (rows.producto || []).filter((p) => p[1] === SODA_PRODUCT && isSodaName(p[0])).map((p) => String(p[0]))
  const getAvailableInsumos = () =>
    [...new Set((rows.insumos || []).map((row) => String(row[0] ?? "").trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    )
  const getPreparationSteps = (preparation: string | number | undefined): string[] => {
    const value = String(preparation ?? "").trim()
    if (!value) return []
    try {
      const parsed: unknown = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((step) => String(step ?? "").trim()).filter(Boolean)
      }
    } catch {
      // Existing preparation text is displayed as one or more legacy steps.
    }
    return value.split(/\r?\n/).map((step) => step.trim()).filter(Boolean)
  }
  const getProductRecipe = (product: (string | number)[] | undefined) => {
    if (!product) return []
    try {
      const recipe = JSON.parse(String(product[9] ?? "[]"))
      if (Array.isArray(recipe)) {
        return recipe
          .map((item) => ({
            name: String(item.name ?? "").trim(),
            quantity: Number(item.quantity),
            unit: String(item.unit ?? "").trim(),
          }))
          .filter(
            (item) => item.name && Number.isFinite(item.quantity) && item.quantity > 0 && item.unit,
          )
      }

    } catch {
      // Older product rows have only a comma-separated list of ingredient names.
    }
    return String(product[7] ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        quantity: 1,
        unit: String(rows.insumos?.find((supply) => supply[0] === name)?.[2] ?? "und"),
      }))
  }
  const getAdminOrderLines = (order: (string | number)[] | undefined): AdminOrderLine[] => {
    if (!order) return []
    try {
      const storedLines = JSON.parse(String(order[10] ?? "[]"))
      if (Array.isArray(storedLines)) {
        return storedLines
          .map((line, index) => ({
            id: String(line.id ?? `line-${index}`),
            product: String(line.product ?? "").trim(),
            category: String(line.category ?? ""),
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            ...(line.parentId ? { parentId: String(line.parentId) } : {}),
            ...(Array.isArray(line.sauces) ? { sauces: line.sauces.map(String) } : {}),
          }))
          .filter((line) => line.product && line.quantity > 0 && line.unitPrice >= 0)
      }
    } catch {
      // Legacy orders have a human-readable product list in column 2.
    }
    const availableProducts = (rows.producto || [])
      .map((product) => String(product[0] ?? ""))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
    return String(order[2] ?? "")
      .split(",")
      .map((entry, index) => {
        const text = entry.trim()
        const productName = availableProducts.find((name) =>
          text.toLowerCase().includes(name.toLowerCase()),
        )
        if (!productName) return null
        const quantity = Number(text.match(/^\s*(\d+)/)?.[1] ?? 1)
        const product = rows.producto?.find((item) => item[0] === productName)
        return {
          id: `legacy-${index}`,
          product: productName,
          category: String(product?.[1] ?? ""),
          quantity: Math.max(1, quantity),
          unitPrice: Number(product?.[2] ?? 0),
        }
      })
      .filter((line): line is AdminOrderLine => line !== null)
  }
  const getSaleOrderLines = (sale: (string | number)[] | null) => {
    if (!sale) return []
    try {
      const storedLines = JSON.parse(String(sale[11] ?? "[]"))
      if (Array.isArray(storedLines) && storedLines.length) {
        return storedLines
          .map((line, index) => ({
            id: String(line.id ?? `sale-line-${index}`),
            product: String(line.product ?? "").trim(),
            category: String(line.category ?? ""),
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            ...(line.parentId ? { parentId: String(line.parentId) } : {}),
            ...(Array.isArray(line.sauces) && line.sauces.length ? { sauces: line.sauces.map(String) } : {}),
          }))
          .filter((line) => line.product && line.quantity > 0 && line.unitPrice >= 0)
      }
    } catch {
      // Sales created before line snapshots use the associated order as their source.
    }
    const order = rows.pedidos?.find((candidate) => candidate[0] === sale[9])
    return getAdminOrderLines(order)
  }
  const getAvailableProductos = () => {
    const options = (rows.producto || [])
      .filter(
        (row) =>
          !["inactivo", "inactiva"].includes(String(row[4] ?? "").toLowerCase()) &&
          String(row[10] ?? "Disponible").toLowerCase() !== "no disponible",
      )
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    return [...new Set(options)].sort((a, b) => a.localeCompare(b))
  }
  const getProductionOrderItems = (row: (string | number)[] | undefined): ProductionItem[] => {
    if (!row) return []
    try {
      const items = JSON.parse(String(row[13] ?? "[]"))
      if (Array.isArray(items) && items.length) {
        return items
          .map((item, index) => ({
            id: String(item.id ?? `production-line-${index}`),
            name: String(item.name ?? item.product ?? "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            ...(item.unit ? { unit: String(item.unit) } : {}),
            ...(item.reuse ? { reuse: true } : {}),
            ...(Array.isArray(item.onlySupplies) && item.onlySupplies.length ? { onlySupplies: item.onlySupplies } : {}),
            ...(item.category ? { category: String(item.category) } : {}),
            ...(item.parentId ? { parentId: String(item.parentId) } : {}),
            ...(Array.isArray(item.sauces) ? { sauces: item.sauces.map(String) } : {}),
          }))
          .filter((item) => item.name)
      }
    } catch {
      // Use the legacy single-product fields.
    }
    const name = String(row[1] ?? "").trim()
    return name ? [{ name, quantity: Math.max(1, Number(row[2]) || 1) }] : []
  }
  const getNonconformingProductOptions = () => {
    const products = (rows.producto || [])
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    const supplies = (rows.insumos || [])
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    return [...new Set([...products, ...supplies])].sort((a, b) => a.localeCompare(b))
  }
  const getNonconformingItemUnit = (name: string) => {
    const supply = (rows.insumos || []).find((item) => String(item[0] ?? "").trim() === name)
    if (supply) return String(supply[2] ?? "").trim() || "Sin unidad"
    return "und"
  }
  const getNonconformingItems = (row: (string | number)[] | undefined) => {
    if (!row) return []
    try {
      const items = JSON.parse(String(row[2] ?? "[]"))
      if (Array.isArray(items) && items.length) {
        return items
          .map((item) => ({
            name: String(item.name ?? "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            unit: String(item.unit ?? "").trim() || getNonconformingItemUnit(String(item.name ?? "").trim()),
          }))
          .filter((item) => item.name)
      }
    } catch {
      // Use the legacy product field below.
    }
    return String(row[1] ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        quantity: Math.max(1, Number(row[3]) || 1),
        unit: getNonconformingItemUnit(name),
      }))
  }
  const getCurrentDateTimeParts = () => {
    const now = new Date()
    return {
      date: [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-"),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    }
  }
  const getNextProductionPriority = (
    productionRows: (string | number)[][] = rows.produccion || [],
  ) =>
    productionRows.length
      ? Math.max(
          0,
          ...productionRows.map((row) => Number(row[3]) || 0),
        ) + 1
      : 1
  const getNextProductionCode = (
    productionRows: (string | number)[][] = rows.produccion || [],
  ) => {
    const lastNumber = Math.max(
      0,
      ...productionRows.map((row) => {
        const match = /^OP-(\d+)$/i.exec(String(row[0] ?? ""))
        return match ? Number(match[1]) : 0
      }),
    )
    return `OP-${String(lastNumber + 1).padStart(4, "0")}`
  }
  const getNextOrderCode = (
    orderRows: (string | number)[][] = rows.pedidos || [],
  ) => {
    const lastNumber = Math.max(
      0,
      ...orderRows.map((row) => {
        const match = /^PED-(\d+)$/i.exec(String(row[0] ?? ""))
        return match ? Number(match[1]) : 0
      }),
    )
    return `PED-${String(lastNumber + 1).padStart(4, "0")}`
  }
  const getRequiredFormKeys = (
    sec: string,
    draft: Record<string, string>,
    mode: ModalMode,
  ) => {
    const excludedKeys: Record<string, string[]> = {
      insumos: [
        // Cost is an optional estimate; "Stock actual" isn't shown when creating (starts at 0)
        "3",
        ...(mode === "add" ? ["4"] : []),
        ...(String(draft["7"] ?? "").toLowerCase() === "sí"
          ? ["8", "9"]
          : ["8", "9", "10", "11"]),
      ],
      producto: ["5", "6", "7", "8", "10"],
      produccion: ["0", "1", "15"],
      "producto-no-conforme": ["0", "1", "2", "5", "6"],
      compras: ["2", "3", "4"],
      // "Origen" is filled from the purchase; an old loss without a purchase can still be edited
      perdidas: ["5", ...(mode === "edit" && !draft["10"] ? ["10"] : [])],
      "cat-insumos": ["1"],
      // 4 (modalidad) and 7 (estado de pago) are derived from the payment method
      pedidos: ["1", "4", "5", "7", "9", "11"],
      // A new sale is made from an order (it brings the total); an old sale without one can still be edited
      ventas: ["6", ...(mode === "edit" ? ["8"] : [])],
      domicilios: ["2", "3"],
    }
    const managedRequiredKeys: Record<string, string[]> = {
      usuarios: ["0", "1", "2", "3", "4", "9", "10", "11"],
      clientes: ["0", "1", "2", "3", "4", "5"],
      proveedores: supplierRequiredKeys(draft),
      roles: ["0", "1"],
    }

    if (managedRequiredKeys[sec]) return managedRequiredKeys[sec]
    return (MOD_CFG[sec]?.fields || [])
      .filter(
        (field) =>
          field.type !== "image" &&
          !(excludedKeys[sec] || []).includes(field.key),
      )
      .map((field) => field.key)
  }
  // A loss sent from a purchase ("Compra a X del 17 de octubre de 2026") can't exceed what that
  // purchase brought, minus its other losses of the same insumo; null when it isn't from a purchase
  const purchaseLossMax = (origin: string, insumo: string, exceptIdx: number | null, purchaseId?: string | number) => {
    if (!origin.trim() && !purchaseId) return null
    // The purchase chosen in the form, or the one the edited loss knows by number; else found by the origin text
    const linked = purchaseId || (exceptIdx !== null ? rows.perdidas?.[exceptIdx]?.[10] : undefined)
    const purchase = (rows.compras || []).find(
      (p) =>
        (linked ? String(p[DB_SYNC.compras.idIndex]) === String(linked) : purchaseLabel(p) === origin.trim()) &&
        parsePurchaseLines(p[6]).some((i) => i.name === insumo),
    )
    if (!purchase) return null
    const bought = parsePurchaseLines(purchase[6])
      .filter((i) => i.name === insumo)
      .reduce((sum, i) => sum + i.quantity, 0)
    const lostElsewhere = (rows.perdidas || [])
      .filter((l, idx) => idx !== exceptIdx && !isReturnedLoss(l) && isLossOfPurchase(l, purchase) && String(l[0]) === insumo)
      .reduce((sum, l) => sum + (parseFloat(String(l[1])) || 0), 0)
    return Math.max(0, bought - lostElsewhere)
  }
  // Why a sale can't have a return yet ("" = it can): its order must have finished production
  const saleReturnBlock = (sale: Row | undefined) => {
    if (!sale) return "Elige una venta de la lista."
    const orderCode = String(sale[9] ?? "").trim()
    if (!orderCode || orderCode === "Sin pedido") return ""
    const orders = (rows.produccion || []).filter(
      (order) => String(order[15] ?? "") === orderCode && String(order[8]) !== "Producto no conforme",
    )
    if (!orders.length) return `El pedido ${orderCode} no tiene orden de producción terminada.`
    const pending = orders.find((order) => String(order[8]) !== "Terminado")
    return pending
      ? `La orden de producción ${String(pending[0])} del pedido ${orderCode} está en «${String(pending[8] || "Recibida")}»: solo se puede devolver cuando esté «Terminado».`
      : ""
  }
  const getManagedFieldError = (
    sec: string,
    key: string,
    value: string,
    draft: Record<string, string>,
    mode: ModalMode = modal.mode,
  ) => {
    const trimmed = value.trim()
    const required =
      sec === "usuarios"
        ? ["0", "1", "2", "3", "4", "9", "10", "11"].includes(key)
        : sec === "clientes"
          ? ["0", "1", "2", "3", "4", "5"].includes(key)
          : sec === "proveedores"
            ? supplierRequiredKeys(draft).includes(key)
            : sec === "roles"
              ? ["0", "1"].includes(key)
                  : sec === "domicilios"
                    ? key === "0"
                  : false

    if (required && !trimmed) return "Este campo es obligatorio."
    if (!trimmed) return ""

    if (sec === "domicilios") {
      if (key === "0") {
        const duplicate = (rows.domicilios || []).find(
          (existing, index) =>
            !(mode === "edit" && index === modal.idx) &&
            normalizeName(String(existing[0] ?? "")) === normalizeName(trimmed),
        )
        return duplicate ? `Ya existe el barrio «${String(duplicate[0])}».` : ""
      }
      if (key === "2" && (!/^\d+$/.test(trimmed) || Number(trimmed) < 1 || Number(trimmed) > 1440))
        return "Ingresa un tiempo de 1 a 1440 minutos o deja el campo vacío si no está configurado."
      if (key === "3" && (!/^\d+$/.test(trimmed) || Number(trimmed) > 1_000_000))
        return "Ingresa un precio entero entre 0 y 1.000.000 COP o deja el campo vacío si no está configurado."
    }

    if (mode === "edit" && modal.idx !== null && isSuperAdminRow(sec, rows.usuarios?.[modal.idx])) {
      if (key === "4" && trimmed.toLowerCase() !== SUPER_ADMIN_EMAIL)
        return `El correo del superadministrador siempre es ${SUPER_ADMIN_EMAIL}.`
      if (key === "3" && trimmed.toLowerCase() !== "administrador")
        return "El superadministrador siempre tiene el rol Administrador."
    }

    if ((sec === "usuarios" && key === "2") || (sec === "clientes" && key === "2")) {
      return validateDocumentNumber(trimmed, String(draft["1"] ?? ""))
    }
    if (sec === "usuarios" && key === "6" && mode === "add") {
      return getPasswordError(trimmed)
    }
    // Another supplier (not the one being edited) of the same kind matching the given test
    const otherSupplier = (natural: boolean, same: (r: Row) => boolean) =>
      (rows.proveedores || []).find(
        (r, index) => !(mode === "edit" && index === modal.idx) && isNaturalSupplier(r[15]) === natural && same(r),
      )
    if (sec === "proveedores" && key === "1") {
      const digits = digitsOnly(trimmed)
      if (!(/^[\d.-]+$/.test(trimmed) && digits.length >= 8 && digits.length <= 15))
        return "Escribe un NIT válido (de 8 a 15 dígitos)."
      const dup = !isNaturalSupplier(draft["15"]) && otherSupplier(false, (r) => digitsOnly(String(r[1] ?? "")) === digits)
      return dup ? `Ya existe un proveedor con este NIT: «${String(dup[0])}».` : ""
    }
    if (sec === "proveedores" && key === "9") {
      const docError = validateDocumentNumber(trimmed, String(draft["8"] ?? ""))
      if (docError) return docError
      // For a natural person this is the supplier's own document (for a company it's the contact's)
      const dup = isNaturalSupplier(draft["15"]) && otherSupplier(true, (r) => normalizeDocument(r[9]) === normalizeDocument(trimmed))
      return dup ? `Ya existe un proveedor con este documento: «${String(dup[0])}».` : ""
    }
    if ((sec === "usuarios" && ["4", "13"].includes(key)) ||
        (sec === "clientes" && key === "4") ||
        (sec === "proveedores" && ["2", "13"].includes(key))) {
      return EMAIL_PATTERN.test(trimmed) ? "" : "Escribe un correo electrónico válido."
    }
    // Colombian numbers have 10 digits: mobile starts with 3, landline with 60
    if (sec === "proveedores" && ["3", "12"].includes(key)) {
      return /^(3\d{9}|60\d{8})$/.test(digitsOnly(trimmed))
        ? ""
        : "Escribe un teléfono de 10 dígitos: celular que empiece por 3 o fijo que empiece por 60."
    }
    if ((sec === "clientes" && key === "3") ||
        (sec === "usuarios" && ["9", "12"].includes(key))) {
      return validatePhoneNumber(trimmed)
    }
    if (sec === "roles" && key === "0") {
      const name = trimmed.toLowerCase()
      const sameNameExists = (rows.roles || []).some((row, index) => {
        if (mode === "edit" && modal.idx === index) return false
        return String(row[0] ?? "").trim().toLowerCase() === name
      })
      return sameNameExists ? "Ya existe un rol con este nombre." : ""
    }
    if (sec === "devoluciones" && key === "1") {
      const block = saleReturnBlock((rows.ventas || []).find((v) => String(v[0]) === trimmed))
      if (block) return block
      try {
        if (!JSON.parse(draft["6"] || "[]").length) return "Marca los productos que se devuelven."
      } catch {
        return "Marca los productos que se devuelven."
      }
    }
    if (sec === "produccion" && key === "3" && trimmed > getCurrentDateTimeParts().date) {
      return "La fecha de creación no puede ser posterior a hoy."
    }
    if (sec === "perdidas" && key === "4" && trimmed > getCurrentDateTimeParts().date) {
      return "La fecha de la pérdida no puede ser posterior a hoy."
    }
    // Nothing can be lost from a purchase before it arrived
    if (sec === "perdidas" && key === "4" && draft["10"]) {
      const purchase = (rows.compras || []).find((c) => String(c[DB_SYNC.compras.idIndex]) === String(draft["10"]))
      if (purchase && trimmed < String(purchase[1]).slice(0, 10))
        return `La pérdida no puede ser anterior a la compra (${String(purchase[1]).slice(0, 10)}).`
    }
    if (sec === "perdidas" && key === "1") {
      const qty = parseFloat(trimmed.replace(",", "."))
      if (!(qty > 0)) return "Escribe cuánto se perdió."
      const supply = (rows.insumos || []).find((r) => String(r[0]) === String(draft["0"] ?? ""))
      // an insumo, or a soda lost from its purchase (its stock is on its product)
      const stock = supply ? Number(supply[4] ?? 0) : stockOf(String(draft["0"] ?? ""))
      const fromPurchase = purchaseLossMax(String(draft["5"] ?? ""), String(draft["0"] ?? ""), mode === "edit" ? modal.idx : null, draft["10"])
      if (fromPurchase !== null && qty > fromPurchase)
        return `Viene de una compra: no puede ser más de ${fromPurchase.toLocaleString("es-CO")} ${String(supply?.[2] ?? "und")} (lo comprado menos lo ya perdido).`
      // On edit, what this loss already took out of the same insumo is available again
      const before = mode === "edit" && modal.idx !== null ? rows.perdidas?.[modal.idx] : undefined
      const alreadyTaken =
        before && String(before[0]) === String(draft["0"] ?? "") ? parseFloat(String(before[1]).replace(",", ".")) || 0 : 0
      const available = Math.round((stock + alreadyTaken) * 1000) / 1000
      if ((supply || Number.isFinite(stock)) && qty > available)
        return `No hay tanto en stock: ${mode === "edit" ? "puedes registrar hasta" : "quedan"} ${available.toLocaleString("es-CO")} ${String(supply?.[2] ?? "und")}.`
    }
    if (sec === "compras" && key === "1" && trimmed > getCurrentDateTimeParts().date) {
      return "La fecha de compra no puede ser posterior a hoy."
    }
    if ((sec === "compras" && key === "1") || (sec === "perdidas" && key === "4")) {
      if (trimmed < FIRST_DAY) return "La fecha no puede ser anterior a 2013: el negocio abrió ese año."
    }
    return ""
  }
  const validateManagedForm = (
    sec: string,
    draft: Record<string, string>,
    mode: ModalMode,
  ) => {
    const keys = getRequiredFormKeys(sec, draft, mode)

    const duplicateErrors = (() => {
      if (!["usuarios", "clientes"].includes(sec)) return {}

      const email = String(draft["4"] ?? "").trim().toLowerCase()
      const document = String(draft["2"] ?? "").trim().toLowerCase()
      const phone =
        sec === "clientes"
          ? String(draft["3"] ?? "").trim().replace(/\s+/g, "")
          : ""

      const allRows = [
        ...(rows.usuarios || []).map((row, idx) => ({ section: "usuarios", idx, row })),
        ...(rows.clientes || []).map((row, idx) => ({ section: "clientes", idx, row })),
      ]
      const next: Record<string, string> = {}
      // A client with an app account is one person shown in both modules: never a duplicate of itself
      const currentRow = modal.idx === null ? undefined : rows[sec]?.[modal.idx]
      const accountId = mode === "edit" ? String((sec === "usuarios" ? currentRow?.[7] : currentRow?.[12]) ?? "") : ""
      allRows.forEach(({ section, idx, row }) => {
        const isCurrentRecord = sec === section && modal.idx === idx
        if (isCurrentRecord) return
        if (accountId && String((section === "usuarios" ? row[7] : row[12]) ?? "") === accountId) return

        const rowDocument = String(row[2] ?? "").trim().toLowerCase()
        const rowEmail = String(row[4] ?? "").trim().toLowerCase()
        const rowPhone =
          section === "clientes"
            ? String(row[3] ?? "").trim().replace(/\s+/g, "")
            : ""

        if (document && rowDocument && rowDocument === document) {
          next["2"] = "Ya existe una persona registrada con este documento."
        }
        if (sec === "clientes" && phone && rowPhone && rowPhone === phone) {
          next["3"] = "Ya existe una persona registrada con este teléfono."
        }
        if (email && rowEmail && rowEmail === email) {
          next["4"] = "Ya existe una persona registrada con este correo electrónico."
        }
      })
      return next
    })()

    const errors = Object.fromEntries(
      keys.flatMap((key) => {
        const field = MOD_CFG[sec]?.fields.find((item) => item.key === key)
        const value = String(draft[key] ?? "")
        const error = !value.trim()
          ? "Este campo es obligatorio."
          : getManagedFieldError(sec, key, value, draft, mode) ||
          (value.trim() && field?.type === "email" && !EMAIL_PATTERN.test(value.trim())
            ? "Escribe un correo electrónico válido."
            : value.trim() && field?.type === "tel"
              ? validatePhoneNumber(value)
              : value.trim() && field?.type === "number" &&
                  (!Number.isFinite(Number(value)) || Number(value) < 0)
                ? "Ingresa un número válido mayor o igual a cero."
                : "")
        const duplicateError = duplicateErrors[key] || ""
        const finalError = duplicateError || error
        return finalError ? [[key, finalError]] : []
      }),
    )
    if (sec === "producto" && mode === "add" && !imgPreview.trim() && !sodaImage(draft["0"])) {
      return { ...errors, img: "Sube una imagen del producto." }
    }
    return errors
  }
  const updateAdminField = (
    sec: string,
    key: string,
    value: string,
  ) => {
    const currentDraft = { ...formData, [key]: value }
    const documentKey =
      sec === "proveedores" && key === "8"
        ? "9"
        : (sec === "usuarios" || sec === "clientes") && key === "1"
          ? "2"
          : ""
    if (documentKey) {
      currentDraft[documentKey] =
        sec === "usuarios"
          ? normalizeAccountDocumentInput(currentDraft[documentKey] ?? "", value)
          : normalizeDocumentInput(currentDraft[documentKey] ?? "", value)
    }
    if (sec === "usuarios" && key === "2") {
      currentDraft[key] = normalizeAccountDocumentInput(value, currentDraft["1"] ?? "")
    }
    if (sec === "usuarios" && key === "3" && value !== "Cliente" && currentDraft["1"] === "Tarjeta de Identidad") {
      currentDraft["1"] = ""
    }
    setFormData(currentDraft)
    // Recompute while any error is shown: a change in one field (e.g. "Cliente de local")
    // can clear the errors of other fields
    if (formValidationAttempted || Object.keys(formFieldErrors).length) {
      setFormFieldErrors(validateManagedForm(sec, currentDraft, modal.mode))
    }
  }
  const openAdd = (sec: string) => {
    const cfg = MOD_CFG[sec]
    if (!cfg) return
    const initialFields = Object.fromEntries(
      cfg.fields.filter((f) => f.type !== "image").map((f) => [f.key, ""]),
    )
    if (sec === "producto") {
      initialFields["6"] = getAutoTechVersion(rows.producto || [])
      initialFields["10"] = "Disponible"
      setTechnicalIngredients([])
      setTechnicalSteps([])
      setTechnicalStepDraft("")
      setTechnicalSheetError("")
    }
    if (sec === "proveedores") {
      setSupplierSupplySearch("")
      setSupplierSupplyOpen(null)
    }
    if (sec === "ventas") {
      initialFields["0"] = sellerName
      initialFields["2"] = getCurrentDateTimeParts().date
    }
    if (sec === "devoluciones") initialFields["5"] = getCurrentDateTimeParts().date
    if (sec === "insumos") {
      initialFields["7"] = "No"
      setSupplyFormError("")
      setSupplySuppliers([])
      setSupplierPickerOpen(false)
      setSupplierPickerQuery("")
    }
    if (sec === "producto-no-conforme") {
      initialFields["6"] = "und"
      initialFields["3"] = "Producto perdido"
      initialFields["4"] = getCurrentDateTimeParts().date
      setPncManual(false)
      setPncOrderPick("")
      setProductionKind("productos")
      setProductionItemUnit("")
      setProductionItemEdit(null)
      setProductionAdditionParentId("")
      setProductionSelectedSauces([])
    }
    if (sec === "perdidas") {
      initialFields["3"] = sellerName
      initialFields["4"] = getCurrentDateTimeParts().date
    }
    if (sec === "clientes") {
      initialFields["6"] = "No"
      setClientFormError("")
    }
    if (sec === "domicilios") initialFields["1"] = "No"
    setFormValidationAttempted(false)
    setFormFieldErrors({})
    if (sec === "produccion") {
      const currentDateTime = getCurrentDateTimeParts()
      setProductionItems([])
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
      setProductionSearch(null)
      setProductionItemEdit(null)
      setProductionKind("productos")
      setProductionItemUnit("")
      setProductionAdditionParentId("")
      setProductionSelectedSauces([])
      initialFields["3"] = currentDateTime.date
      initialFields["4"] = currentDateTime.time
    }
    if (sec === "compras") {
      initialFields["1"] = getCurrentDateTimeParts().date
      resetPurchasePicker()
    }
    setFormData(initialFields)
    setFormInitial(initialFields)
    setFormTried(false)
    setTouchedFields({})
    setPedidoProductoSelect("")
    setPedidoProductSearch("")
    if (sec === "pedidos") {
      setPedidoOrderLines([])
      setPedidoProductCategory("Todas")
      setPedidoProductQuantity("1")
      setPedidoAdditionsFor("")
    }
    setPaymentProofDraft("")
    setImgPreview("")
    setModal({ mode: "add", section: sec, idx: null })
  }
  const openEdit = (sec: string, idx: number) => {
    const cfg = MOD_CFG[sec]
    if (!cfg) return
    const row = rows[sec][idx]
    if (isCounterClientRow(sec, row)) {
      window.alert("El cliente mostrador no se edita: es fijo para registrar ventas a personas que no dan sus datos.")
      return
    }
    const dataFields = cfg.fields.filter((f) => f.type !== "image")
    const rowOffset = cfg.autoId ? 1 : 0
    const nextForm = Object.fromEntries(
      dataFields.map((field) => {
        const fieldIndex = Number(field.key)
        const rowIndex = Number.isFinite(fieldIndex)
          ? fieldIndex + rowOffset
          : row.length - 1
        return [field.key, String(row[rowIndex] ?? "")]
      }),
    )
    if (sec === "devoluciones") nextForm["6"] = String(row[6] || "[]")
    if (sec === "clientes") {
      // Address builder: fill its parts from the saved text when it has that format
      const parts = parseAddress(String(row[5] ?? ""))
      if (parts) for (const [key, value] of Object.entries(parts)) nextForm[`a_${key}`] = value
    }
    if (sec === "proveedores") {
      const legacyContactName = String(row[4] ?? "").trim().split(/\s+/)
      if (!nextForm["10"]) nextForm["10"] = legacyContactName.shift() ?? ""
      if (!nextForm["11"]) nextForm["11"] = legacyContactName.join(" ")
      if (!nextForm["15"]) nextForm["15"] = "Persona jurídica"
      setSupplierSupplySearch("")
      setSupplierSupplyOpen(null)
    }
    setFormValidationAttempted(false)
    setFormFieldErrors({})
    if (sec === "clientes") setClientFormError("")
    if (sec === "compras") resetPurchasePicker()
    if (sec === "insumos") {
      setSupplyFormError("")
      setSupplierPickerOpen(false)
      setSupplierPickerQuery("")
      setSupplySuppliers(
        (rows.proveedores || []).filter((p) => splitNames(p[7]).includes(String(row[0]))).map((p) => String(p[0])),
      )
    }
    if (sec === "produccion") {
      setProductionItems(getProductionOrderItems(row))
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
      setProductionAdditionParentId("")
      setProductionSelectedSauces([])
    }
    if (sec === "producto-no-conforme") {
      setProductionItems(getNonconformingItems(row))
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
    }
    if (sec === "producto" && !nextForm["6"]) {
      nextForm["6"] = getAutoTechVersion(rows.producto || [])
    }
    if (sec === "producto") {
      setTechnicalIngredients(getProductRecipe(row))
      setTechnicalSteps(getPreparationSteps(row[8]))
      setTechnicalStepDraft("")
      nextForm["9"] = String(row[9] ?? "[]")
      nextForm["10"] = String(row[10] ?? "Disponible")
      setTechnicalSheetError("")
      // A soda is edited as flavour + size ("Gaseosa Coca-Cola (1.5 L)" → "Coca-Cola" and "1.5 L")
      const soda = row[1] === SODA_PRODUCT ? SODA_RE.exec(String(row[0])) : null
      if (soda) {
        nextForm["0"] = soda[1]
        nextForm.sodaSize = soda[2]
      }
    }
    if (sec === "pedidos") {
      const orderLines = getAdminOrderLines(row)
      setPedidoOrderLines(orderLines)
      setPedidoProductCategory("Todas")
      setPedidoProductSearch("")
      setPedidoProductQuantity("1")
      setPedidoAdditionsFor("")
    }
    setFormData(nextForm)
    setFormInitial(nextForm)
    setFormTried(false)
    setTouchedFields({})
    setPedidoProductoSelect("")
    setPedidoProductSearch("")
    setPaymentProofDraft(sec === "pedidos" ? paymentProofs[idx] || "" : "")
    // Only a real photo: the bundled bottle of a soda is just shown, never saved as its photo
    setImgPreview(sec === "producto" ? prodImgs[idx] || "" : "")
    setModal({ mode: "edit", section: sec, idx })
  }
  // Stock history of the insumo open in "Ver detalle" (loaded when it opens)
  const [stockMoves, setStockMoves] = useState<{ id: string; rows: DbRecord[] | null; error?: string } | null>(null)
  const openView = (sec: string, idx: number) => {
    const insumoId = sec === "insumos" ? String(rows.insumos?.[idx]?.[DB_SYNC.insumos.idIndex] ?? "") : ""
    if (insumoId) {
      setStockMoves({ id: insumoId, rows: null })
      api<DbRecord[]>(`/movimientos-stock/${insumoId}`)
        .then((list) => setStockMoves((cur) => (cur?.id === insumoId ? { id: insumoId, rows: list } : cur)))
        .catch((err) => setStockMoves((cur) => (cur?.id === insumoId ? { ...cur, error: `No se pudo cargar el historial: ${(err as Error).message}` } : cur)))
    }
    setImgPreview(sec === "producto" ? prodImgs[idx] || sodaImage(rows.producto?.[idx]?.[0]) || "" : "")
    setPaymentProofDraft(sec === "pedidos" ? paymentProofs[idx] || "" : "")
    if (sec === "producto") {
      setTechnicalIngredients(getProductRecipe(rows.producto?.[idx]))
      setTechnicalSteps(getPreparationSteps(rows.producto?.[idx]?.[8]))
    }
    if (sec === "produccion") {
      setProductionItems(getProductionOrderItems(rows.produccion?.[idx]))
      setProductionFormError("")
    }
    if (sec === "pedidos") setPedidoOrderLines(getAdminOrderLines(rows.pedidos?.[idx]))
    setModal({ mode: "view", section: sec, idx })
  }
  // ── Field validation: Categ. Insumos, Categ. Producto, Insumos, Productos ──
  const VALIDATED_SECTIONS = ["cat-insumos", "cat-producto", "insumos", "producto", "clientes", "pedidos"]
  const REQUIRED_KEYS: Record<string, string[]> = {
    "cat-insumos": ["0"],
    "cat-producto": ["0"],
    insumos: ["0", "1", "2", "5"],
    producto: ["0", "1", "2", "3"],
    // Correo is required: every client gets an account (it also shows up in Usuarios)
    clientes: ["0", "1", "2", "3", "4", "5"],
    pedidos: ["0", "2", "3"],
  }
  const getFieldErrors = (): Record<string, string> => {
    const sec = modal.section
    const e: Record<string, string> = {}
    const v = (key: string) => String(formData[key] ?? "").trim()
    const n = (key: string) => Number(v(key))
    // Another record (not the one being edited) with the same normalized name
    const duplicateOf = (section: string, name: string) =>
      (rows[section] || []).find(
        (record, index) => index !== modal.idx && normalizeName(record[0]) === normalizeName(name),
      )
    const checkText = (key: string, label: string, min: number, max: number, emptyMsg: string) => {
      const value = v(key)
      if (!value) e[key] = emptyMsg
      else if (value.length < min) e[key] = `${label} debe tener al menos ${min} caracteres.`
      else if (value.length > max) e[key] = `${label} puede tener máximo ${max} caracteres.`
    }

    if (sec === "cat-insumos" || sec === "cat-producto") {
      checkText("0", "El nombre", 3, 40, "Escribe el nombre de la categoría.")
      if (!e["0"] && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 &-]+$/.test(v("0")))
        e["0"] = "Usa solo letras, números y espacios."
      const dup = !e["0"] && duplicateOf(sec, v("0"))
      if (dup) e["0"] = `Ya existe la categoría «${String(dup[0])}».`
      // Optional; if written, 5 to 150 characters
      if (sec === "cat-insumos" && v("1")) checkText("1", "La descripción", 5, 150, "")
    }

    if (sec === "insumos") {
      checkText("0", "El nombre", 2, 60, "Escribe el nombre del insumo.")
      const dup = !e["0"] && duplicateOf("insumos", v("0"))
      if (dup) e["0"] = `Ya existe el insumo «${String(dup[0])}».`
      if (!v("1")) e["1"] = "Selecciona la categoría."
      if (!v("2")) e["2"] = "Selecciona la unidad de medida."
      // Changing kg → g would turn 5 kg into "5 g": the unit is fixed once there is stock or purchases
      const before = modal.mode === "edit" && modal.idx !== null ? rows.insumos?.[modal.idx] : undefined
      if (
        before && v("2") && v("2") !== String(before[2]) &&
        (Number(before[4]) > 0 ||
          (rows.compras || []).some((c) => parsePurchaseLines(c[6]).some((l) => normalizeName(l.name) === normalizeName(before[0]))))
      )
        e["2"] = `No puedes cambiar la unidad: «${String(before[0])}» ya tiene stock o compras en ${String(before[2])}. Si lo necesitas en otra unidad, crea un insumo nuevo.`
      if (modal.mode !== "add" && v("4") && !(n("4") >= 0))
        e["4"] = "El stock actual no puede ser negativo."
      if (!v("5")) e["5"] = "Escribe el stock mínimo."
      else if (!(n("5") >= 0)) e["5"] = "El stock mínimo no puede ser negativo."
      if (v("7").toLowerCase() === "sí") {
        if (!v("10")) e["10"] = "Ficha técnica: elige al menos un insumo principal."
        if (!v("11")) e["11"] = "Ficha técnica: escribe cómo se prepara."
      }
    }

    if (sec === "clientes") {
      if (!v("1")) e["1"] = "Selecciona el tipo de documento."
      const doc = v("2")
      if (!doc) e["2"] = "Escribe el número de documento."
      else if (v("1") && DOC_RULES[v("1")] && !DOC_RULES[v("1")].re.test(doc))
        e["2"] = DOC_RULES[v("1")].msg
      else {
        // Same document number already registered (ignores dots, dashes and spaces)
        const docKey = normalizeDocument(doc)
        const dup = (rows.clientes || []).find(
          (client, index) => index !== modal.idx && normalizeDocument(client[2]) === docKey,
        )
        if (dup) e["2"] = `Ya existe un cliente con este número de documento: «${String(dup[0])}».`
      }
      checkText("0", "El nombre", 3, 80, "Escribe los nombres y apellidos del cliente.")
      if (!e["0"] && !NAME_RE.test(v("0"))) e["0"] = "El nombre solo puede tener letras y espacios."
      const phone = v("3").replace(/[\s-]/g, "")
      if (!phone) e["3"] = "Escribe el teléfono."
      else if (!/^3\d{9}$/.test(phone)) e["3"] = "El celular debe tener 10 números y empezar por 3."
      if (!v("4")) e["4"] = "Escribe el correo: con él el cliente entra a la app."
      else if (!EMAIL_RE.test(v("4")))
        e["4"] = "Escribe un correo válido, por ejemplo nombre@correo.com."
      if (!v("5")) e["5"] = "Escribe la dirección."
      else if (v("5").length < 5) e["5"] = "La dirección debe tener al menos 5 caracteres."
    }

    if (sec === "pedidos") {
      if (!v("0")) e["0"] = "Selecciona el cliente."
      if (!v("2")) e["2"] = "Selecciona el tipo de pedido."
      if (!v("3")) e["3"] = "Selecciona el método de pago."
    }

    if (sec === "producto") {
      checkText("0", "El nombre", 2, 60, "Escribe el nombre del producto.")
      const dup = !e["0"] && duplicateOf("producto", v("0"))
      if (dup) e["0"] = `Ya existe el producto «${String(dup[0])}».`
      if (!v("1")) e["1"] = "Selecciona la categoría."
      // Sauces are always free (the form shows «Gratis» and saves 0); drink flavours may cost 0
      const isSauce = normalizeName(v("1")) === "salsas"
      const minPrice = ["Salsas", "Sabores de bebida"].includes(v("1")) ? 0 : 1
      if (isSauce) {
        // nothing to check: the price is always 0
      } else if (!v("2")) e["2"] = "Escribe el precio."
      else if (!(n("2") >= minPrice))
        e["2"] = minPrice ? "El precio debe ser mayor que 0." : "El precio no puede ser negativo."
      else if (!Number.isInteger(n("2"))) e["2"] = "El precio debe ser un valor entero, sin decimales."
      checkText("3", "La descripción", 10, 200, "Escribe una descripción.")
      // Empty = SODA_LOW_STOCK when saved
      if (v("1") === SODA_PRODUCT && v("14") && !(Number.isInteger(n("14")) && n("14") >= 0 && n("14") <= 999))
        e["14"] = "El stock mínimo debe ser un número entero entre 0 y 999."
    }
    return e
  }
  const fieldErrors =
    VALIDATED_SECTIONS.includes(modal.section) && modal.mode !== "view" && modal.mode !== null
      ? getFieldErrors()
      : {}
  const shownFieldError = (key: string) =>
    formTried || touchedFields[key] ? fieldErrors[key] : undefined
  const isRequiredField = (key: string) =>
    modal.mode !== "view" && (REQUIRED_KEYS[modal.section] || []).includes(key)
  // After a failed "Guardar", bring the first field with an error into view (it may be
  // below the visible part of the form) and focus it
  const revealFirstFormError = () =>
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        '.fixed.inset-0 [aria-invalid="true"], .fixed.inset-0 [role="alert"]',
      )
      target?.scrollIntoView({ block: "center", behavior: "smooth" })
      if (target?.matches("input, select, textarea")) target.focus({ preventScroll: true })
    }, 60)
  const openChildForm = (child: string) => {
    setFormReturn({ section: modal.section, child, mode: modal.mode, idx: modal.idx, form: formData })
    setSupplierSupplyOpen(null)
    setSection(child as AdminSection)
    openAdd(child)
  }
  // Back to the form that opened the child one; false if none did
  const returnToParent = (created?: string, createdRow?: Row) => {
    if (!formReturn || modal.section !== formReturn.child) return false
    const { section, mode, idx, form } = formReturn
    // An order that is already paid got its sale by itself: nothing left to fill in the sale form
    if (section === "ventas" && created && String(createdRow?.[8]) === "Pagado") {
      setFormReturn(null)
      setSection("ventas")
      setModal({ mode: null, section: "", idx: null })
      window.alert(`El pedido ${created} quedó pagado, así que su venta se registró automáticamente.`)
      return true
    }
    // A supplier adds the new insumo to its list; a sale takes the new order (client and total);
    // a purchase picks the new supplier
    const next = !created
      ? form
      : section === "proveedores"
        ? { ...form, "7": [...new Set([...String(form["7"] ?? "").split(",").map((item) => item.trim()).filter(Boolean), created])].join(", ") }
        : section === "ventas"
          ? {
              ...form,
              "8": created,
              "1": String(createdRow?.[1] ?? form["1"] ?? ""),
              "6": String(createdRow?.[6] ?? form["6"] ?? ""),
              "3": saleTypeOf(createdRow?.[3]) || String(form["3"] ?? ""),
              "4": String(createdRow?.[4] ?? form["4"] ?? ""),
            }
          : { ...form, "0": created }
    setFormReturn(null)
    setSection(section as AdminSection)
    setFormData(next)
    setFormInitial(form)
    setTouchedFields({})
    setFormFieldErrors({})
    setModal({ mode, section, idx })
    return true
  }
  const returnLossToPurchase = () => {
    const row = modal.idx !== null ? rows.perdidas?.[modal.idx] : undefined
    const id = row?.[DB_SYNC.perdidas.idIndex]
    const reason = String(lossReturnReason ?? "").trim()
    const lost = parseFloat(String(row?.[1] ?? "")) || 0
    const qty = toDecimal(lossReturnQty)
    if (!(qty > 0)) return setLossReturnError("Escribe cuánto se devuelve a la compra.")
    if (qty > lost) return setLossReturnError(`No puedes devolver más de lo perdido: máximo ${lost.toLocaleString("es-CO")}.`)
    if (reason.length < 3) return setLossReturnError("Escribe por qué se devuelve a la compra.")
    if (!id) return setLossReturnError("Esta pérdida aún no está guardada en la base de datos.")
    setLossReturnSaving(true)
    api(`/perdidas-insumos/${id}/devolver`, "PATCH", { cantidad: qty, motivo: reason })
      .then(() => {
        loadModule("perdidas")
        loadModule("insumos")
        setLossReturnReason(null)
        setModal({ mode: null, section: "", idx: null })
      })
      .catch((err) => setLossReturnError((err as Error).message))
      .finally(() => setLossReturnSaving(false))
  }
  // Where a row is now: by its backend id, or by its content when it has none
  const findRowIndex = (sec: string, snapshot: Row | undefined) => {
    if (!snapshot) return -1
    const list = rows[sec] || []
    const idIndex = syncIdIndex(sec)
    const id = idIndex !== undefined ? snapshot[idIndex] : ""
    if (id) return list.findIndex((r) => String(r[idIndex!] ?? "") === String(id))
    const content = JSON.stringify(snapshot)
    return list.findIndex((r) => r === snapshot || JSON.stringify(r) === content)
  }
  // Everything a form can change: compared with how it opened to know if there are unsaved changes
  const formStateKey = JSON.stringify([formData, productionItems, pedidoOrderLines, technicalIngredients, imgPreview, supplySuppliers, paymentProofDraft])
  const formStateRef = useRef(formStateKey)
  formStateRef.current = formStateKey
  const openedFormStateRef = useRef(formStateKey)
  const [discardAsk, setDiscardAsk] = useState(false)
  useEffect(() => {
    modalRowRef.current = modal.idx !== null ? rows[modal.section]?.[modal.idx] : undefined
    setSaveError("")
    setDiscardAsk(false)
    // Taken a moment later: some forms fill their lists right after opening
    const timer = window.setTimeout(() => (openedFormStateRef.current = formStateRef.current), 150)
    return () => window.clearTimeout(timer)
    // Only when another record is opened, not when the table reloads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal.mode, modal.section, modal.idx])
  // X, Volver, Cancelar and Esc: a form with changes asks first
  const requestCloseModal = () => {
    if (modal.mode !== "view" && formStateRef.current !== openedFormStateRef.current) setDiscardAsk(true)
    else closeModal()
  }
  useEffect(() => {
    if (!modal.mode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      // Search boxes and pickers inside the form use Esc for themselves
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role='listbox']")) return
      if (discardAsk) setDiscardAsk(false)
      else requestCloseModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })
  // «Guardado ✓» for a few seconds after a save
  const [saveToast, setSaveToast] = useState("")
  useEffect(() => {
    if (!saveToast) return
    const timer = window.setTimeout(() => setSaveToast(""), 3000)
    return () => window.clearTimeout(timer)
  }, [saveToast])
  const closeModal = () => {
    setDiscardAsk(false)
    setLossReturnReason(null)
    if (returnToParent()) return
    setModal({ mode: null, section: "", idx: null })
  }
  const saveModal = async () => {
    // A second click while saving would create the record twice
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError("")
    try {
      await saveModalNow()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  const saveModalNow = async () => {
    // Editing: the row may have moved since the modal opened (tables reload by themselves)
    let modal = modalState
    if (modalState.mode === "edit" && modalState.idx !== null) {
      const idx = findRowIndex(modalState.section, modalRowRef.current)
      if (idx < 0) {
        setSaveError("Este registro cambió o se eliminó mientras lo editabas. Ciérralo y vuelve a abrirlo.")
        return
      }
      modal = { ...modalState, idx }
    }
    const sec = modal.section
    const config = MOD_CFG[sec]
    if (!config) return

    if (VALIDATED_SECTIONS.includes(sec)) {
      setFormTried(true)
      if (Object.keys(getFieldErrors()).length) return revealFirstFormError()
    }

    setFormValidationAttempted(true)
    const errors = validateManagedForm(sec, formData, modal.mode)
    setFormFieldErrors(errors)
    if (Object.keys(errors).length) return revealFirstFormError()

    if (sec === "roles") {
      const roleName = String(formData["0"] ?? "").trim()
      const roleDescription = String(formData["1"] ?? "").trim()
      if (!roleName || !roleDescription) {
        setFormFieldErrors({
          "0": roleName ? "" : "Este campo es obligatorio.",
          "1": roleDescription ? "" : "Este campo es obligatorio.",
        })
        return
      }
    }

    if ((sec === "produccion" || sec === "producto-no-conforme") && !productionItems.length) {
      setProductionFormError("Agrega al menos un producto o producto de insumo.")
      return
    }
    if (sec === "pedidos" && pedidoOrderLines.length === 0) {
      setFormFieldErrors((current) => ({
        ...current,
        "1": "Agrega al menos un producto al pedido.",
      }))
      return
    }
    if (sec === "producto") {
      const productCategory = normalizeName(currentCategory(String(formData["1"] ?? "")))
      if (productCategory !== "gaseosas" && productCategory !== "bebidas") {
        const invalidIngredient = technicalIngredients.find((ingredient) => {
          const supply = rows.insumos?.find((item) => item[0] === ingredient.name)
          return (
            !supply ||
            !Number.isFinite(ingredient.quantity) ||
            ingredient.quantity <= 0 ||
            !ingredient.unit ||
            toBaseQuantity(1, ingredient.unit, String(supply[2] ?? "")) === null
          )
        })
        if (invalidIngredient) {
          setSaveError(`Verifica la cantidad y unidad de «${invalidIngredient.name}» en la ficha técnica.`)
          return
        }
      }
    }
    if (sec === "insumos" && String(formData["7"] ?? "").toLowerCase() === "sí") {
      // A producto de insumo must be saved together with its technical sheet
      if (!String(formData["0"] ?? "").trim())
        return setSupplyFormError("Escribe el nombre del insumo.")
      if (!String(formData["10"] ?? "").trim())
        return setSupplyFormError("Ficha técnica: elige al menos un insumo principal.")
      if (!String(formData["11"] ?? "").trim())
        return setSupplyFormError("Ficha técnica: escribe cómo se prepara.")
    }
    if (sec === "compras") {
      if (!String(formData["0"] ?? "").trim()) {
        setPurchaseFormError("Selecciona el proveedor.")
        return
      }
      if (!parsePurchaseItems(formData["6"]).length) {
        setPurchaseFormError("Agrega al menos un insumo a la compra.")
        return
      }
    }
    const previousRow =
      modal.idx !== null ? rows[sec]?.[modal.idx] : undefined
    const dataFields = config.fields.filter((field) => field.type !== "image")
    const newRow: (string | number)[] = []

    dataFields.forEach((field) => {
      const index = Number(field.key)
      if (Number.isFinite(index)) newRow[index] = formData[field.key] ?? ""
      else newRow.push(formData[field.key] ?? "")
    })
    // Sauces are always free
    if (sec === "producto" && normalizeName(String(newRow[1] ?? "")) === "salsas") newRow[2] = 0
    if (sec === "proveedores") {
      newRow[4] = `${String(formData["10"] ?? "").trim()} ${String(formData["11"] ?? "").trim()}`.trim()
      if (isNaturalSupplier(formData["15"])) {
        newRow[0] = newRow[4]
        for (const key of [1, 12, 13, 14]) newRow[key] = ""
      }
    }
    if (sec === "cat-producto") newRow[0] = String(newRow[0] ?? "").trim()
    if (sec === "clientes") {
      newRow[0] = String(formData["0"] ?? "").trim()
      newRow[8] = previousRow?.[8] ?? ""
      newRow[9] = previousRow?.[9] ?? "[]"
      newRow[10] = ""
      newRow[11] = previousRow?.[11] ?? "No"
      newRow[12] = previousRow?.[12] ?? ""
    }

    if (sec === "producto") {
      newRow[6] =
        String(formData["6"] || "").trim() ||
        getAutoTechVersion(rows.producto || [])
      newRow[7] = technicalIngredients.map((ingredient) => ingredient.name).join(", ")
      newRow[8] = String(formData["8"] || "").trim()
      // Stock is discounted in the insumo's unit: 500 ml of an insumo in L is saved as 0.5 L
      const serializedRecipe = JSON.stringify(
        technicalIngredients.map((ingredient) => {
          const stockUnit = String(rows.insumos?.find((item) => item[0] === ingredient.name)?.[2] ?? ingredient.unit)
          return {
            ...ingredient,
            quantity: Math.round(convertQty(ingredient.quantity, ingredient.unit, stockUnit) * 1000) / 1000,
            unit: stockUnit,
          }
        }),
      )
      newRow[9] = serializedRecipe
      newRow[10] = String(formData["10"] || "Disponible")
      if (previousRow && String(previousRow[9] ?? "[]") !== serializedRecipe) {
        newRow[6] = nextTechVersion(String(previousRow[6] ?? ""))
      }
      // A drink (category «Bebidas») has no ficha técnica. With a size it's a soda of the store:
      // named "Gaseosa <sabor> (<tamaño>)" (links it to its purchases and the store); without one, as typed
      if (newRow[1] === SODA_PRODUCT) {
        // "(" or ")" would break the "Gaseosa X (Y)" name
        const size = String(formData.sodaSize ?? "").replace(/[()]/g, "").trim()
        if (size) {
          const flavor = String(formData["0"] ?? "").trim().replace(/^gaseosa\s+/i, "")
          newRow[0] = `Gaseosa ${flavor} (${size})`
          const dup = (rows.producto || []).find((p, i) => i !== modal.idx && normalizeName(p[0]) === normalizeName(newRow[0]))
          if (dup) return setFormFieldErrors((current) => ({ ...current, sodaSize: `Ya existe «${String(dup[0])}».` }))
        }
        newRow[9] = "[]"
      }
    }

    if (sec === "insumos") {
      newRow[0] = String(newRow[0] ?? "").trim()
      // New insumos start with no stock (the field isn't shown when creating)
      newRow[4] = modal.mode === "add" ? 0 : Number(newRow[4] || 0)
      newRow[6] = previousRow?.[6] ?? "" // unused slot (old "Stock máximo")
      if (String(newRow[7]).toLowerCase() === "sí") {
        newRow[8] = String(newRow[8] ?? "").trim() || `Ficha técnica - ${String(newRow[0]).trim()}`
        newRow[9] = String(newRow[9] ?? "").trim() || "v1.0"
      } else {
        newRow[8] = newRow[9] = newRow[10] = newRow[11] = ""
      }
    }

    if (sec === "compras") {
      // Subtotal and total always come from the purchased items
      const total = parsePurchaseItems(formData["6"]).reduce((sum, item) => sum + item.total, 0)
      newRow[3] = total
      newRow[4] = total
    }

    if (sec === "devoluciones") {
      const sale = (rows.ventas || []).find((v) => String(v[0]) === String(formData["1"] ?? ""))
      newRow[0] =
        modal.mode === "edit" && previousRow
          ? previousRow[0]
          : `DEV-${String(Math.max(0, ...(rows.devoluciones || []).map((d) => Number(/^DEV-(\d+)$/.exec(String(d[0] ?? ""))?.[1] ?? 0))) + 1).padStart(4, "0")}`
      newRow[2] = String(sale?.[2] ?? previousRow?.[2] ?? "")
      newRow[3] = String(formData["3"] ?? "").trim()
      newRow[6] = String(formData["6"] || "[]")
    }

    if (sec === "ventas") {
      newRow[8] = String(formData["8"] ?? "").trim() || "Sin pedido"
      // One sale per order (a paid order already got its own)
      if (newRow[8] !== "Sin pedido" && (rows.ventas || []).some((sale, i) => i !== modal.idx && String(sale[9]) === newRow[8])) {
        setSaveError(`El pedido ${newRow[8]} ya tiene su venta registrada.`)
        return
      }
      // With an order, the sale takes its total
      const order = (rows.pedidos || []).find((p) => String(p[0]) === newRow[8])
      if (order) newRow[6] = Number(order[6]) || 0
      newRow[5] = Number(newRow[6] ?? formData["6"]) || 0
      // The order's status (row[10] once the code goes first); it then follows the order
      newRow[9] = order ? String(order[7] || "Recibido") : String(previousRow?.[10] ?? "")
    }

    if (sec === "pedidos") {
      const total = pedidoOrderLines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      )
      newRow[1] = pedidoOrderLines
        .map((line) => `${line.quantity} ${line.product}${line.parentId ? ` (adición de ${pedidoOrderLines.find((parent) => parent.id === line.parentId)?.product ?? "producto"})` : ""}`)
        .join(", ")
      newRow[5] = total
      newRow[6] = "Recibido"
      // Modality follows the payment method; payment status too when creating (editing moves it forward)
      const payment = derivePedidoPayment(String(formData["3"] ?? ""), !!paymentProofDraft, String(formData["2"] ?? ""))
      newRow[4] = payment.modalidad
      newRow[7] = modal.mode === "edit" && formData["7"] ? formData["7"] : payment.estadoPago
      // Orders created in the panel go to production on save (it starts at "Recibida");
      // a shop order keeps its approval flow
      const shopOrder = !!previousRow && loadOrders().some((order) => order.id === previousRow[0])
      newRow[8] = shopOrder ? previousRow![9] : "Enviada a producción"
      newRow[9] = JSON.stringify(pedidoOrderLines)
    }

    if (config.autoId) {
      const prefix =
        sec === "produccion"
          ? "OP"
          : sec === "producto-no-conforme"
            ? "PNC"
          : sec === "ventas"
            ? "VTA"
            : sec === "pedidos"
              ? "PED"
              : "ID"
      const generatedId =
        sec === "produccion"
          ? getNextProductionCode(rows.produccion || [])
          : sec === "pedidos"
            ? getNextOrderCode(rows.pedidos || [])
            : `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      newRow.unshift(
        modal.mode === "add" ? generatedId : String(previousRow?.[0] ?? generatedId),
      )
    }

    if (sec === "producto-no-conforme") {
      newRow[1] = productionItems.map((item) => item.name).join(", ")
      newRow[2] = JSON.stringify(productionItems)
      newRow[3] = productionItems.reduce((total, item) => total + item.quantity, 0)
      newRow[4] = formData["3"] ?? ""
      newRow[5] =
        modal.mode === "add"
          ? getCurrentDateTimeParts().date
          : previousRow?.[5] ?? formData["4"] ?? ""
      newRow[6] = formData["5"] ?? ""
      newRow[7] = productionItems[0]?.unit ?? "und"
    }

    if (sec === "produccion") {
      const currentDateTime = getCurrentDateTimeParts()
      // Same summary as orders sent from Pedidos: "Hamburguesa Pollo ×2 + 1 adición"
      newRow[1] = productionLabel(
        productionItems.map((item) => ({ id: item.id ?? "", product: item.name, category: item.category ?? "", quantity: item.quantity, unitPrice: 0, parentId: item.parentId, sauces: item.sauces })),
      )
      newRow[2] = productionItems.reduce(
        (total, item) => total + item.quantity,
        0,
      )
      newRow[13] = JSON.stringify(productionItems)
      newRow[3] = modal.mode === "add" ? getNextProductionPriority(rows.produccion || []) : (previousRow?.[3] ?? getNextProductionPriority(rows.produccion || []))
      newRow[6] = previousRow?.[6] ?? currentDateTime.date
      newRow[7] = previousRow?.[7] ?? currentDateTime.time
      newRow[8] = previousRow?.[8] ?? "Recibida"
      if (newRow[8] === "Terminado") {
        newRow[9] = previousRow?.[9] || `${currentDateTime.date} ${currentDateTime.time}`
        newRow[10] = previousRow?.[10] || 1
      } else {
        newRow[9] = ""
        newRow[10] = 0
      }
      newRow[11] =
        previousRow?.[11] ?? (newRow[8] === "Recibida" ? "No" : "Sí")
      newRow[12] =
        previousRow?.[12] ??
        JSON.stringify([
          {
            status: "Recibida",
            date: currentDateTime.date,
            time: currentDateTime.time,
          },
        ])
    }

    if (config.statusIndex !== undefined) {
      const defaultStatus =
        sec === "cat-insumos" || sec === "cat-producto"
          ? "Activa"
          : "Activo"
      newRow[config.statusIndex] = previousRow?.[config.statusIndex] ?? defaultStatus
    }
    // Keep the backend id so the edit updates the same record
    const idIndex = syncIdIndex(sec)
    if (idIndex !== undefined) newRow[idIndex] = previousRow?.[idIndex] ?? ""
    // A product's stock and cost aren't in its form (purchases and sales move them)
    if (sec === "producto") {
      newRow[12] = previousRow?.[12] ?? 0
      newRow[13] = previousRow?.[13] ?? 0
    }

    if (sec === "producto-no-conforme" && modal.mode === "add") {
      const currentDateTime = getCurrentDateTimeParts()
      const lines: AdminOrderLine[] = productionItems.map((item, index) => ({
        id: item.id ?? `${item.name}-${index}`,
        product: item.name,
        category: item.category ?? "",
        quantity: item.quantity,
        unitPrice: 0,
        ...(item.parentId ? { parentId: item.parentId } : {}),
        ...(item.sauces?.length ? { sauces: item.sauces } : {}),
      }))
      const replacementOrder = buildProductionRows(lines, rows.produccion || [], "")[0]
      if (!replacementOrder) {
        setProductionFormError("No se pudo preparar la orden de reposición.")
        return
      }
      replacementOrder[4] = currentDateTime.date
      replacementOrder[5] = currentDateTime.time
      replacementOrder[6] = currentDateTime.date
      replacementOrder[7] = currentDateTime.time
      replacementOrder[12] = JSON.stringify([
        { status: "Recibida", date: currentDateTime.date, time: currentDateTime.time },
      ])
      newRow[0] = String(replacementOrder[0])
      newRow[5] = currentDateTime.date
      setPncSaving(true)
      try {
        const persisted = await savePncAndReplacement(newRow, replacementOrder)
        setRows((current) => ({
          ...current,
          "producto-no-conforme": [
            persisted.pncRow,
            ...(current["producto-no-conforme"] || []),
          ],
          produccion: [
            persisted.productionRow,
            ...(current.produccion || []),
          ],
        }))
        setProductionFormError("")
        setModal({ mode: null, section: "", idx: null })
      } catch (error) {
        setProductionFormError(`No se pudo guardar el producto no conforme ni su orden de reposición: ${(error as Error).message}`)
      } finally {
        setPncSaving(false)
      }
      return
    }

    // Suppliers picked in the insumo form get it on their "insumos que suministra" list (row[7])
    // and the unpicked ones lose it, so it shows in Proveedores and in that supplier's purchases
    const supplierChanges = new Map<Row, Row>()
    if (sec === "insumos") {
      const name = String(newRow[0])
      const oldName = String(previousRow?.[0] ?? "")
      const isThisSupply = (n: string) =>
        normalizeName(n) === normalizeName(name) || (!!oldName && normalizeName(n) === normalizeName(oldName))
      for (const supplier of rows.proveedores || []) {
        const list = splitNames(supplier[7])
        const others = list.filter((n) => !isThisSupply(n))
        const next = supplySuppliers.includes(String(supplier[0])) ? [...others, name] : others
        if (next.join(", ") === list.join(", ")) continue
        const updated = [...supplier]
        updated[7] = next.join(", ")
        supplierChanges.set(supplier, updated)
      }
    }
    // A soda renamed in Productos keeps its place in its suppliers' lists (so they can still sell it)
    if (sec === "producto" && previousRow && isSodaName(previousRow[0]) && normalizeName(previousRow[0]) !== normalizeName(newRow[0])) {
      for (const supplier of rows.proveedores || []) {
        const list = splitNames(supplier[7])
        if (!list.some((n) => normalizeName(n) === normalizeName(previousRow[0]))) continue
        const updated = [...supplier]
        updated[7] = list.map((n) => (normalizeName(n) === normalizeName(previousRow[0]) ? String(newRow[0]) : n)).join(", ")
        supplierChanges.set(supplier, updated)
      }
    }

    setRows((current) => {
      const updated = [...(current[sec] || [])]
      if (modal.mode === "add") updated.unshift(newRow)
      else if (modal.mode === "edit" && modal.idx !== null)
        updated[modal.idx] = newRow

      if (sec === "pedidos" && modal.mode === "edit") {
        const items = pedidoOrderLines.map((line) => ({
          id: line.id,
          name: line.product,
          quantity: line.quantity,
          category: line.category,
          ...(line.parentId ? { parentId: line.parentId } : {}),
          ...(line.sauces?.length ? { sauces: line.sauces } : {}),
        }))
        // No production order yet (e.g. it was waiting for approval): it gets one now
        if (
          newRow[9] === "Enviada a producción" &&
          !(current.produccion || []).some((order) => String(order[15] ?? "") === String(newRow[0]))
        )
          return {
            ...current,
            pedidos: updated,
            produccion: buildProductionRows(pedidoOrderLines, current.produccion || [], String(newRow[0]), String(newRow[12] ?? "")),
          }
        const produccion = (current.produccion || []).map((order) => {
          if (
            String(order[15] ?? "") !== String(newRow[0]) ||
            ["Terminado", "Producto no conforme"].includes(String(order[8]))
          ) return order
          const updatedOrder = [...order]
          updatedOrder[1] = productionLabel(pedidoOrderLines)
          updatedOrder[2] = pedidoOrderLines.filter((line) => !line.parentId).reduce((sum, line) => sum + line.quantity, 0)
          updatedOrder[13] = JSON.stringify(items)
          updatedOrder[16] = String(newRow[12] ?? "")
          return updatedOrder
        })
        return { ...current, pedidos: updated, produccion }
      }

      if (sec === "pedidos" && modal.mode === "add" && newRow[9] === "Enviada a producción") {
        // New order that needs no owner approval → its production orders are created now
        return {
          ...current,
          pedidos: updated,
          produccion: buildProductionRows(pedidoOrderLines, current.produccion || [], String(newRow[0]), String(newRow[12] ?? "")),
        }
      }

      if (sec === "compras") {
        // Stock: undo what the previous version of this purchase added, then add the new items
        let insumoRows = current.insumos || []
        if (modal.mode === "edit" && previousRow && String(previousRow[5]) !== "Anulado")
          insumoRows = withStockChange(insumoRows, previousRow[6], -1)
        if (String(newRow[5]) !== "Anulado")
          insumoRows = withStockChange(insumoRows, newRow[6], 1)
        return { ...current, compras: updated, insumos: insumoRows }
      }

      if (sec === "insumos") {
        const previousName = String(previousRow?.[0] ?? "")
        const productRows = (current.producto || []).filter(
          (product) =>
            !(
              product[1] === "Producto de insumo" &&
              product[0] === previousName
            ),
        )
        if (String(newRow[7]).toLowerCase() === "sí") {
          const generatedProduct = supplyAsProduct(newRow)
          const existingIndex = productRows.findIndex(
            (product) =>
              product[1] === "Producto de insumo" &&
              product[0] === generatedProduct[0],
          )
          if (existingIndex >= 0) productRows[existingIndex] = generatedProduct
          else productRows.unshift(generatedProduct)
        }
        return { ...current, insumos: updated, producto: productRows }
      }

      return { ...current, [sec]: updated }
    })
    // The photo is sent only when it changed (new upload or new URL)
    const previousImg = modal.idx !== null ? prodImgs[modal.idx] : ""
    const savePhoto = sec === "producto" && imgPreview && imgPreview !== previousImg
    const syncing = syncRow(
      sec,
      newRow,
      modal.mode === "add",
      false,
      savePhoto || supplierChanges.size
        ? // only once the record is saved: its photo, then the suppliers' lists (here and in the database)
          async (id) => {
            if (savePhoto) await api(`/productos/${id}/imagen`, "PUT", { imagen: imgPreview })
            if (!supplierChanges.size) return
            setRows((current) => ({
              ...current,
              proveedores: (current.proveedores || []).map((supplier) => supplierChanges.get(supplier) ?? supplier),
            }))
            supplierChanges.forEach((updated) => {
              if (updated[DB_SYNC.proveedores.idIndex]) syncRow("proveedores", updated, false)
            })
          }
        : undefined,
      true,
    )
    if (sec === "producto" && imgPreview) {
      const imageIndex = modal.mode === "add" ? 0 : modal.idx!
      setProdImgs((current) => ({ ...current, [imageIndex]: imgPreview }))
    }
    if (sec === "pedidos" && (paymentProofDraft || modal.mode === "add")) {
      setPaymentProofs((current) => {
        // New orders are unshifted, so existing proofs move down one row
        const next =
          modal.mode === "add"
            ? Object.fromEntries(
                Object.entries(current).map(([k, v]) => [Number(k) + 1, v]),
              )
            : { ...current }
        if (paymentProofDraft)
          next[modal.mode === "add" ? 0 : modal.idx!] = paymentProofDraft
        return next
      })
    }
    // A Reposición makes the returned products again: a new production order (linked to the return's code)
    if (sec === "devoluciones" && modal.mode === "add" && newRow[4] === "Reposición") {
      const saleLines = getSaleOrderLines((rows.ventas || []).find((v) => String(v[0]) === String(newRow[1])) ?? null)
      let returned: { id: string; product: string; quantity: number }[] = []
      try {
        returned = JSON.parse(String(newRow[6] || "[]"))
      } catch {
        returned = []
      }
      // Each returned product with its sauces and its additions (in proportion to how many come back)
      const lines: AdminOrderLine[] = returned.flatMap((item) => {
        const main = saleLines.find((line) => line.id === item.id)
        const ratio = main?.quantity ? item.quantity / main.quantity : 1
        return [
          { ...(main ?? { id: item.id, product: item.product, category: "", unitPrice: 0 }), quantity: item.quantity },
          ...saleLines
            .filter((line) => line.parentId === item.id)
            .map((line) => ({ ...line, quantity: Math.max(1, Math.round(line.quantity * ratio)) })),
        ]
      })
      if (lines.length)
        setRows((current) => ({
          ...current,
          produccion: buildProductionRows(lines, current.produccion || [], String(newRow[0]), `Reposición por devolución ${newRow[0]}: ${newRow[3]}`),
        }))
    }
    if (sec === "pedidos" && String(newRow[8]) === "Pagado") {
      setRows((current) => {
        const salesRows = [...(current.ventas || [])]
        if (salesRows.some((sale) => sale[9] === newRow[0])) return current
        // Same columns as a sale made in the form (see setOrderPayment)
        salesRows.unshift([
          nextAutoSaleCode(salesRows),
          sellerName,
          newRow[1],
          getCurrentDateTimeParts().date,
          saleTypeOf(newRow[3]),
          newRow[4],
          newRow[6],
          newRow[6],
          "",
          newRow[0],
          newRow[7],
          newRow[10] ?? "[]",
        ])
        return { ...current, ventas: salesRows }
      })
    }
    if (sec === "roles" && modal.mode === "edit" && previousRow) {
      const previousRoleName = String(previousRow[0] ?? "")
      const nextRoleName = String(newRow[0] ?? "")
      if (previousRoleName !== nextRoleName) {
        setRolesPerms((current) => {
          const previousPermissions = current[previousRoleName]
          const next = { ...current }
          delete next[previousRoleName]
          if (previousPermissions) next[nextRoleName] = previousPermissions
          return next
        })
      }
    }
    // The form stays open (with what was typed) until the database confirms the save
    const syncError = await syncing
    if (syncError) {
      setSaveError(syncError)
      return
    }
    setSaveToast(modal.mode === "add" ? "Registro creado ✓" : "Cambios guardados ✓")
    setSavedHighlight({ section: sec, key: String(newRow[0] ?? "") })
    if (sec === "clientes") setClientFormError("")
    if (sec === "produccion") setProductionFormError("")
    if (modal.mode === "add" && returnToParent(String(newRow[0] ?? "").trim(), newRow)) return
    setModal({ mode: null, section: "", idx: null })
  }
  const isStatusActive = (value: string | number) => {
    const status = String(value)
    return !["Inactivo", "Inactiva", "Anulado", "Anulada"].includes(status)
  }
  // Purchases (compras rows) made to a supplier, matched by name
  const getSupplierPurchases = (supplierName: string) => {
    const name = supplierName.trim().toLowerCase()
    return (rows.compras || []).filter(
      (purchase) => String(purchase[0] ?? "").trim().toLowerCase() === name,
    )
  }
  const getCategoryRecords = (section: "cat-insumos" | "cat-producto", categoryName: string) => {
    const name = categoryName.trim().toLowerCase()
    const relatedSection = section === "cat-insumos" ? "insumos" : "producto"
    return (rows[relatedSection] || []).filter(
      (record) => String(record[1] ?? "").trim().toLowerCase() === name,
    )
  }
  const getDeleteAssessment = (
    sec: string,
    row: (string | number)[] | undefined,
  ) => {
    const moduleName =
      SIDEBAR_MENU.flatMap((item) =>
        item.children.length
          ? item.children
          : [{ key: item.key, label: item.label }],
      ).find((item) => item.key === sec)?.label ?? "este módulo"
    const recordName = String(row?.[0] ?? "registro")
    const targetLabel =
      sec === "produccion"
        ? `la orden «${recordName}»`
        : `el registro «${recordName}»`

    if (!row) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El registro ya no existe o fue eliminado por otra acción. Actualiza la lista para verificar el estado actual.",
      }
    }

    // A product is deleted only while nothing references it: sales, orders, purchases (sodas) or a supplier
    // that sells it. The backend checks the same (also shop orders) before deleting.
    if (sec === "producto") {
      const name = normalizeName(recordName)
      const inLines = (value: string | number | undefined) => {
        try {
          return (JSON.parse(String(value || "[]")) as { product?: string }[]).some((l) => normalizeName(String(l.product ?? "")) === name)
        } catch {
          return false
        }
      }
      const count = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : "")
      const suppliers = (rows.proveedores || [])
        .filter((pr) => String(pr[7] ?? "").split(",").some((i) => normalizeName(i) === name))
        .map((pr) => String(pr[0]))
      const uses = [
        count((rows.ventas || []).filter((v) => inLines(v[11])).length, "venta", "ventas"),
        count((rows.pedidos || []).filter((o) => inLines(o[10])).length, "pedido", "pedidos"),
        count((rows.compras || []).filter((c) => parsePurchaseLines(c[6]).some((l) => normalizeName(l.name) === name)).length, "compra", "compras"),
        suppliers.length ? `el proveedor ${suppliers.join(", ")}` : "",
      ].filter(Boolean)
      const productLabel = `el producto «${recordName}»`
      return uses.length
        ? {
            allowed: false,
            targetLabel: productLabel,
            reason: `Está asociado a ${uses.join(", ")}: para no perder ese historial no se puede eliminar. Si ya no lo vendes, desactívalo.`,
          }
        : {
            allowed: true,
            targetLabel: productLabel,
            reason: "No tiene ventas, pedidos, compras ni proveedores: se quita de Productos y de la tienda.",
          }
    }

    if (sec === "clientes") {
      const name = normalizeName(String(row[0] ?? ""))
      const purchases =
        (rows.pedidos || []).filter((order) => normalizeName(String(order[1] ?? "")) === name).length +
        (rows.ventas || []).filter((sale) => normalizeName(String(sale[2] ?? "")) === name).length
      if (isCounterClientRow(sec, row))
        return { allowed: false, targetLabel, reason: "El cliente mostrador se usa en las ventas sin datos del cliente: no se puede eliminar." }
      if (purchases)
        return {
          allowed: false,
          targetLabel,
          reason: `Tiene ${purchases} compra${purchases === 1 ? "" : "s"} registrada${purchases === 1 ? "" : "s"} (pedidos o ventas). Para conservar el historial no se puede eliminar; anúlalo en su lugar.`,
        }
      return {
        allowed: true,
        targetLabel,
        reason: "No tiene compras registradas: se puede eliminar. Si tiene cuenta en la app, también se borra su cuenta.",
      }
    }

    if (sec === "produccion") {
      const status = String(row[8] ?? "Recibida")
      const authorized = String(row[11] ?? "No").toLowerCase() === "sí"
      const blockers: string[] = []

      if (status !== "Recibida") {
        blockers.push(`la orden ya se encuentra en estado «${status}»`)
      }
      if (authorized) {
        blockers.push("la orden ya fue autorizada para producción")
      }

      if (blockers.length) {
        return {
          allowed: false,
          targetLabel,
          reason: `${blockers.join(" y ")}. Para conservar la trazabilidad, solo se puede eliminar una orden nueva que siga en estado «Recibida» y no esté autorizada.`,
        }
      }

      return {
        allowed: true,
        targetLabel,
        reason:
          "La orden sigue en estado «Recibida», todavía no está autorizada para producción y no tiene bloqueos activos.",
      }
    }

    if (sec === "proveedores") {
      const supplierLabel = `el proveedor «${recordName}»`
      const purchases = getSupplierPurchases(recordName)
      if (purchases.length) {
        const n = purchases.length
        return {
          allowed: false,
          targetLabel: supplierLabel,
          reason: `Tiene ${n} ${n === 1 ? "compra" : "compras"} de insumos ${n === 1 ? "registrada" : "registradas"}. Para no perder el historial de compras no se puede eliminar; si ya no trabajas con él, desactívalo con el interruptor de estado.`,
        }
      }
      return {
        allowed: true,
        targetLabel: supplierLabel,
        reason: "No tiene compras de insumos registradas.",
      }
    }

    if (isCounterClientRow(sec, row)) {
      return {
        allowed: false,
        targetLabel: `el cliente «${recordName}»`,
        reason: "Es el cliente mostrador: se usa para registrar ventas a personas que no quieren dar sus datos, así que no se elimina ni se desactiva.",
      }
    }

    if (isSuperAdminRow(sec, row)) {
      return {
        allowed: false,
        targetLabel: `el usuario «${recordName}»`,
        reason: `Es el superadministrador (${SUPER_ADMIN_EMAIL}): no se puede eliminar, desactivar ni quitarle el rol Administrador.`,
      }
    }

    if (sec === "insumos") {
      const supplyLabel = `el insumo «${recordName}»`
      // Deletable only while no other module has records of it
      const recipes = [
        ...(rows.producto || []).filter((p) => getProductRecipe(p).some((i) => i.name === recordName)).map((p) => String(p[0])),
        ...(rows.insumos || []).filter((i) => parseMainSupplies(i[10]).some((m) => m.name === recordName)).map((i) => String(i[0])),
      ]
      const uses = [
        (rows.compras || []).some((p) => parsePurchaseLines(p[6]).some((i) => i.name === recordName)) && "compras",
        (rows.perdidas || []).some((l) => String(l[0]) === recordName) && "pérdidas de insumos",
        recipes.length > 0 && `la ficha técnica de ${[...new Set(recipes)].join(", ")}`,
      ].filter(Boolean)
      if (uses.length) {
        return {
          allowed: false,
          targetLabel: supplyLabel,
          reason: `Está registrado en ${uses.join(", ")}. Solo se puede eliminar un insumo que ningún otro módulo use; si ya no lo usas, desactívalo con el interruptor de estado.`,
        }
      }
      return {
        allowed: true,
        targetLabel: supplyLabel,
        reason: "Ningún otro módulo lo usa: no tiene compras, pérdidas ni fichas técnicas. También se quitará de los proveedores que lo vendían.",
      }
    }

    if (sec === "cat-insumos" || sec === "cat-producto") {
      const categoryLabel = `la categoría «${recordName}»`
      const records = getCategoryRecords(sec, recordName)
      if (records.length) {
        const recordType = sec === "cat-insumos" ? "insumo" : "producto"
        return {
          allowed: false,
          targetLabel: categoryLabel,
          reason: `Tiene ${records.length} ${records.length === 1 ? recordType : `${recordType}s`} asociados. Primero reasigna o elimina esos registros para poder eliminar la categoría.`,
        }
      }
      return {
        allowed: true,
        targetLabel: categoryLabel,
        reason: "No tiene registros asociados.",
      }
    }

    if (MOD_CFG[sec]?.noDelete) {
      return {
        allowed: false,
        targetLabel,
        reason: `La eliminación está desactivada en el módulo «${moduleName}». Conserva el registro y utiliza la acción de anulación disponible para mantener su historial.`,
      }
    }

    return {
      allowed: true,
      targetLabel,
      reason: `No existen bloqueos activos y el módulo «${moduleName}» permite eliminar este registro.`,
    }
  }
  const isStatusLocked = (sec: string, row: (string | number)[]) =>
    (sec === "roles" && String(row[0] ?? "").trim().toLowerCase() === "administrador") ||
    isSuperAdminRow(sec, row) ||
    isCounterClientRow(sec, row)
  const getAnulAssessment = (
    sec: string,
    row: (string | number)[] | undefined,
    rowIndex: number,
  ) => {
    const moduleName =
      SIDEBAR_MENU.flatMap((item) =>
        item.children.length
          ? item.children
          : [{ key: item.key, label: item.label }],
      ).find((item) => item.key === sec)?.label ?? "este módulo"
    const recordName = String(row?.[0] ?? "registro")
    const targetLabel = `el registro «${recordName}»`

    if (!row) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El registro ya no existe o fue eliminado por otra acción. Actualiza la lista para verificar su estado actual.",
      }
    }

    if (isStatusLocked(sec, row)) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El rol «Administrador» está protegido para evitar que el sistema quede sin permisos de gestión. No se puede anular desde este módulo.",
      }
    }

    const statusIndex = MOD_CFG[sec]?.statusIndex
    const currentStatus =
      statusIndex !== undefined
        ? String(row[statusIndex] ?? "Activo")
        : "Activo"
    const alreadyAnulled =
      statusIndex !== undefined
        ? !isStatusActive(currentStatus)
        : (anulled?.[sec] || new Set<number>()).has(rowIndex)

    if (alreadyAnulled) {
      return {
        allowed: false,
        targetLabel,
        reason: `El registro ya se encuentra anulado o inactivo («${currentStatus}»). Para volver a usarlo primero debe reactivarse.`,
      }
    }

    if (sec === "compras") {
      // Annulling takes back what it added: not possible if part of it was already used (production, losses)
      const bought = new Map<string, number>()
      parsePurchaseLines(row[6]).forEach((l) => bought.set(l.name, (bought.get(l.name) || 0) + l.quantity))
      const used = [...bought].flatMap(([name, quantity]) => {
        // an insumo, or a soda (its stock is on its product)
        const stock = stockOf(name)
        const unit = isSodaName(name) ? "und" : String(rows.insumos?.find((i) => normalizeName(i[0]) === normalizeName(name))?.[2] ?? "")
        return Number.isFinite(stock) && stock < quantity ? [`de «${name}» quedan ${stock} ${unit} y la compra sumó ${quantity}`] : []
      })
      if (used.length)
        return {
          allowed: false,
          targetLabel,
          reason: `Parte de lo comprado ya se usó en producción o pérdidas: ${used.join("; ")}. Anularla descuadraría el inventario.`,
        }
      return {
        allowed: true,
        targetLabel,
        reason:
          "La compra está activa y no presenta bloqueos registrados. Puede anularse sin eliminar su información; quedará en estado «Anulado» y se conservará en el historial.",
      }
    }

    return {
      allowed: true,
      targetLabel,
      reason: `El registro está activo y no tiene bloqueos de anulación registrados en el módulo «${moduleName}». Puede anularse sin eliminar la información y quedará conservado en el historial.`,
    }
  }
  const toggleStatus = (
    sec: string,
    rowIndex: number,
    statusIndex: number,
  ) => {
    const currentRows = rows[sec] || []
    const currentRow = currentRows[rowIndex]
    if (
      !currentRow ||
      isStatusLocked(sec, currentRow)
    ) return

    const currentValue = String(
      currentRow[statusIndex] ??
        (sec === "cat-insumos" || sec === "cat-producto"
          ? "Activa"
          : "Activo"),
    )
    const feminine = currentValue.toLowerCase().endsWith("a")
    const inactiveStatus =
      MOD_CFG[sec]?.inactiveStatus ?? (feminine ? "Inactiva" : "Inactivo")
    const activeStatus = feminine ? "Activa" : "Activo"
    const nextValue = isStatusActive(currentValue)
      ? inactiveStatus
      : activeStatus

    if (sec === "usuarios") {
      const email = String(currentRow[4] ?? "").trim().toLowerCase()
      if (email) {
        const statuses = loadLS<Record<string, string>>("adminUserStatuses", {})
        saveLS("adminUserStatuses", { ...statuses, [email]: nextValue })
      }
    }

    if (DB_SYNC[sec]) {
      // e.g. inactive products disappear from the customer menu
      const syncedRow = [...currentRow]
      syncedRow[statusIndex] = nextValue
      syncRow(sec, syncedRow, false, true)
    }

    setRows((current) => {
      const updated = [...(current[sec] || [])]
      const updatedRow = [...updated[rowIndex]]
      updatedRow[statusIndex] = nextValue
      updated[rowIndex] = updatedRow

      if (sec === "compras") {
        // Anular a purchase removes its items from stock; reactivating adds them back
        const sign = isStatusActive(nextValue) ? 1 : -1
        return {
          ...current,
          compras: updated,
          insumos: withStockChange(current.insumos || [], updatedRow[6], sign),
        }
      }

      if (sec === "insumos" && String(updatedRow[7]).toLowerCase() === "sí") {
        const productRows = (current.producto || []).map((product) =>
          product[1] === "Producto de insumo" && product[0] === updatedRow[0]
            ? (() => {
                const updatedProduct = [...product]
                updatedProduct[4] = nextValue
                return updatedProduct
              })()
            : product,
        )
        return { ...current, insumos: updated, producto: productRows }
      }

      return { ...current, [sec]: updated }
    })

    if (sec !== "usuarios") {
      setAnulled((current) => {
        const next = new Set(current[sec] || [])
        if (isStatusActive(nextValue)) next.delete(rowIndex)
        else next.add(rowIndex)
        return { ...current, [sec]: next }
      })
    }
  }
  const approveOrderForProduction = (orderIndex: number) => {
    const order = rows.pedidos?.[orderIndex]
    const proof = paymentProofs[orderIndex]
    const paymentStatus = String(order?.[8] ?? "")
    const transferPayment = isTransferPaymentMethod(String(order?.[4] ?? ""))
    const payOnDelivery = String(order?.[5]) === "Contraentrega"
    if (
      !order ||
      ["Autorizada", "Enviada a producción"].includes(String(order[9])) ||
      (transferPayment &&
        !["Pendiente de verificación", "Pagado"].includes(paymentStatus)) ||
      (transferPayment && paymentStatus === "Pendiente de verificación" && !proof) ||
      (!transferPayment && !payOnDelivery && paymentStatus !== "Pagado")
    ) return

    const requestedItems = getAdminOrderLines(order)
    if (!requestedItems.length) {
      window.alert("Este pedido no tiene productos para enviar a producción.")
      return
    }

    const storedOrders = loadOrders()
    const storedOrder = storedOrders.find((item) => item.id === order[0])
    if (storedOrder?.productionAuthorized) return
    // One production order with every product of the order
    const productionRecords = buildProductionRows(requestedItems, rows.produccion || [], String(order[0])).slice(0, 1)
    saveOrders(
      storedOrders.map((item) =>
        item.id === order[0]
          ? {
              ...item,
              status: "Confirmado",
              ...(transferPayment ? { paymentStatus: "Pagado" as const } : {}),
              productionAuthorized: true,
              productionRecords,
            }
          : item,
      ),
    )
    // Approving isn't selling: the sale is created by the server only when the order is paid (a transfer is,
    // right here). Then the sales list is reloaded so it shows up
    pushOrder(String(order[0])).then(() => { if (transferPayment) loadPanel("ventas") })

    setRows((current) => {
      const currentOrder = current.pedidos?.[orderIndex]
      if (!currentOrder || String(currentOrder[9]) === "Autorizada") {
        return current
      }
      const orderRows = [...(current.pedidos || [])]
      const updatedOrder = [...currentOrder]
      updatedOrder[8] = transferPayment ? "Pagado" : updatedOrder[8]
      updatedOrder[9] = "Autorizada"
      if (
        transferPayment ||
        updatedOrder[7] === "Por confirmar" ||
        updatedOrder[7] === "Pendiente de verificación"
      ) {
        updatedOrder[7] = "Confirmado"
      }
      updatedOrder[11] = ""
      orderRows[orderIndex] = updatedOrder

      const productionRows = [...productionRecords, ...(current.produccion || [])]

      return {
        ...current,
        pedidos: orderRows,
        produccion: productionRows,
      }
    })
  }
  // Order status -> status its production orders move to (forward only)
  const ORDER_TO_PRODUCTION: Record<string, (typeof PRODUCTION_STATUSES)[number]> = {
    Confirmado: "Iniciada",
    "En cocina": "En cocina",
    "En camino": "Terminado",
    Entregado: "Terminado",
  }
  // Choosing the current status again still catches up production that fell behind
  const setOrderPayment = (orderIndex: number, status: string) => {
    const order = rows.pedidos?.[orderIndex]
    if (!order || PAYMENT_NEXT[String(order[8] || "Pendiente")] !== status) return
    const orderId = String(order[0])
    // Shop orders also keep it on the order the client sees. Their sale is created by the server when the
    // payment is saved (one per order); then the sales list is reloaded to show it
    const shopOrder = loadOrders().some((o) => o.id === orderId)
    if (shopOrder) {
      saveOrders(loadOrders().map((o) => (o.id === orderId ? { ...o, paymentStatus: status as Order["paymentStatus"] } : o)))
      pushOrder(orderId).then(() => { if (status === "Pagado") loadPanel("ventas") })
    }
    setRows((current) => {
      const pedidos = [...(current.pedidos || [])]
      const updated = [...pedidos[orderIndex]]
      updated[8] = status
      pedidos[orderIndex] = updated
      if (shopOrder || status !== "Pagado" || (current.ventas || []).some((sale) => sale[9] === updated[0])) return { ...current, pedidos }
      // Same columns as a sale made in the form: [0 código, 1 vendedor, 2 cliente, 3 fecha, 4 tipo,
      //  5 método, 6 total, 7 total, 8 —, 9 pedido, 10 estado del pedido, 11 productos (JSON)]
      const ventas = [
        [
          nextAutoSaleCode(current.ventas || []),
          sellerName,
          updated[1],
          getCurrentDateTimeParts().date,
          saleTypeOf(updated[3]),
          updated[4],
          updated[6],
          updated[6],
          "",
          updated[0],
          updated[7],
          updated[10] ?? "[]",
        ],
        ...(current.ventas || []),
      ]
      return { ...current, pedidos, ventas }
    })
  }
  const setClientOrderStatus = async (orderIndex: number, status: string) => {
    const order = rows.pedidos?.[orderIndex]
    if (!order) return
    const orderId = String(order[0])
    // Move the order's production first; "En cocina" takes the supplies out of the stock
    const target = ORDER_TO_PRODUCTION[status]
    if (target) {
      const codes = new Set([
        ...(loadOrders().find((o) => o.id === orderId)?.productionRecords ?? []).map((r) => String(r[0])),
        ...(rows.produccion || []).filter((r) => String(r[15] ?? "") === orderId).map((r) => String(r[0])),
      ])
      const rank = (s: string) => PRODUCTION_STATUSES.indexOf(s as (typeof PRODUCTION_STATUSES)[number])
      for (const [index, row] of (rows.produccion || []).entries()) {
        if (!codes.has(String(row[0])) || rank(String(row[8])) >= rank(target) || row[8] === "Producto no conforme") continue
        // changeProductionStatus already told the admin why (stock, ficha técnica...)
        if (!(await changeProductionStatus(index, target))) return
      }
    }
    if (String(order[7]) === status) return
    saveOrders(loadOrders().map((item) => (item.id === orderId ? { ...item, status } : item)))
    pushOrder(orderId)
    setRows((current) => ({
      ...current,
      pedidos: (current.pedidos || []).map((row, index) => {
        if (index !== orderIndex) return row
        const updated = [...row]
        updated[7] = status
        return updated
      }),
      // Its sale shows the order's status too (row[9] = pedido, row[10] = estado del pedido)
      ventas: (current.ventas || []).map((sale) => {
        if (String(sale[9]) !== orderId) return sale
        const updated = [...sale]
        updated[10] = status
        return updated
      }),
    }))
    // Cash on delivery / on pickup: handing it over means it was paid (this also records its sale)
    if (status === "Entregado" && String(order[5]) === "Contraentrega" && PAYMENT_NEXT[String(order[8] || "Pendiente")] === "Pagado")
      setOrderPayment(orderIndex, "Pagado")
  }
  const rejectTransferPayment = () => {
    if (paymentRejectionTarget === null) return
    const orderIndex = paymentRejectionTarget
    const order = rows.pedidos?.[orderIndex]
    const reason = paymentRejectionReason.trim()
    if (!order || !reason) {
      setPaymentRejectionError("Escribe el motivo por el que rechazas el comprobante.")
      return
    }
    if (
      !isTransferPaymentMethod(String(order[4] ?? "")) ||
      String(order[8]) !== "Pendiente de verificación"
    ) {
      setPaymentRejectionError("Este comprobante ya no está pendiente de revisión.")
      return
    }

    const orderId = String(order[0])
    saveOrders(
      loadOrders().map((item) =>
        item.id === orderId
          ? {
              ...item,
              paymentStatus: "Rechazado",
              paymentRejectionReason: reason,
              productionAuthorized: false,
            }
          : item,
      ),
    )
    pushOrder(orderId)
    setRows((current) => {
      const currentOrder = current.pedidos?.[orderIndex]
      if (!currentOrder || String(currentOrder[8]) !== "Pendiente de verificación") {
        return current
      }
      const orderRows = [...(current.pedidos || [])]
      const updatedOrder = [...currentOrder]
      updatedOrder[8] = "Rechazado"
      updatedOrder[11] = reason
      orderRows[orderIndex] = updatedOrder
      return { ...current, pedidos: orderRows }
    })
    setPaymentRejectionTarget(null)
    setPaymentRejectionReason("")
    setPaymentRejectionError("")
  }
  const saveQuickClient = () => {
    const requiredFields = ["0", "1", "2", "3", "4", "5"]
    const errors: Record<string, string> = {}
    requiredFields.forEach((key) => {
      const value = String(quickClientForm[key] ?? "").trim()
      if (!value) {
        errors[key] = "Este campo es obligatorio."
      } else if (key === "2") {
        const error = validateDocumentNumber(value, quickClientForm["1"] ?? "")
        if (error) errors[key] = error
      } else if (key === "3") {
        const error = validatePhoneNumber(value)
        if (error) errors[key] = error
      } else if (key === "4" && !EMAIL_PATTERN.test(value)) {
        errors[key] = "Escribe un correo electrónico válido."
      }
    })
    const docNumber = String(quickClientForm["2"] ?? "").trim().toLowerCase()
    const phone = String(quickClientForm["3"] ?? "").trim().replace(/\s+/g, "")
    const email = String(quickClientForm["4"] ?? "").trim().toLowerCase()
    ;(rows.usuarios || []).forEach((userRow) => {
      if (
        docNumber &&
        String(userRow[2] ?? "").trim().toLowerCase() === docNumber
      ) {
        errors["2"] = "Ya existe una persona registrada con este documento."
      }
      if (
        email &&
        String(userRow[4] ?? "").trim().toLowerCase() === email
      ) {
        errors["4"] = "Ya existe una persona registrada con este correo electrónico."
      }
    })
    ;(rows.clientes || []).forEach((clientRow) => {
      if (
        docNumber &&
        String(clientRow[2] ?? "").trim().toLowerCase() === docNumber
      ) {
        errors["2"] = "Ya existe una persona registrada con este documento."
      }
      if (
        phone &&
        String(clientRow[3] ?? "").trim().replace(/\s+/g, "") === phone
      ) {
        errors["3"] = "Ya existe una persona registrada con este teléfono."
      }
      if (
        email &&
        String(clientRow[4] ?? "").trim().toLowerCase() === email
      ) {
        errors["4"] = "Ya existe una persona registrada con este correo electrónico."
      }
    })
    setQuickClientErrors(errors)
    if (Object.keys(errors).length) {
      setQuickClientError(
        "Corrige los campos indicados antes de registrar el cliente.",
      )
      return
    }
    // Same document number as an existing client is not allowed here either
    const docKey = normalizeDocument(quickClientForm["2"])
    const duplicate = (rows.clientes || []).find((client) => normalizeDocument(client[2]) === docKey)
    if (duplicate) {
      setQuickClientError(`Ya existe un cliente con este número de documento: «${String(duplicate[0])}».`)
      return
    }
    const name = String(quickClientForm["0"]).trim()
    const newClient: (string | number)[] = [
      name,
      quickClientForm["1"],
      quickClientForm["2"],
      quickClientForm["3"],
      quickClientForm["4"] || "",
      quickClientForm["5"] || "",
      "No",
      "Activo",
    ]
    setRows((current) => ({
      ...current,
      clientes: [newClient, ...(current.clientes || [])],
    }))
    // It was only kept on screen; now it's saved (and gets its account + provisional password)
    syncRow("clientes", newClient, true)
    setFormData((current) => ({ ...current, "1": name }))
    setQuickClientForm({})
    setQuickClientErrors({})
    setQuickClientError("")
    setQuickClientOpen(false)
  }
  const openProductionPnc = (rowIndex: number) => {
    const order = rows.produccion?.[rowIndex]
    if (!order) return
    const currentDateTime = getCurrentDateTimeParts()
    const orderItems = getProductionOrderItems(order)
    const firstProduct = orderItems.find((item) => !item.parentId) ?? orderItems[0]
    setPncForm({
      "0": String(order[0] ?? ""),
      "1": firstProduct?.name ?? String(order[1] ?? ""),
      "3": "1",
      "4": "Producto perdido",
      "5": currentDateTime.date,
      entries: "[]",
    })
    setPncError("")
    setPncFieldErrors({})
    setPncTarget(rowIndex)
  }
  // Measures for a damaged product (an addition can be "2 tajadas", a salsa "1 bolsita"...)
  const PNC_UNITS = ["und", "porción", "tajada", "bolsita", "botella", "paq", "kg", "g", "L", "ml"]
  const parsePncEntries = (value: string | undefined): PncEntry[] => {
    try {
      const entries = JSON.parse(value || "[]")
      return Array.isArray(entries) ? entries : []
    } catch {
      return []
    }
  }
  const saveProductionPnc = async () => {
    if (pncSaving) return
    if (pncTarget === null) return
    const order = rows.produccion?.[pncTarget]
    if (!order) return
    const availableProducts = getNonconformingProductOptions()
    const entries = parsePncEntries(pncForm.entries)
    const affectedProduct = [...new Set(entries.map((entry) => entry.product))].join(", ")
    const wholeProducts = new Set(entries.filter((entry) => entry.whole).map((entry) => entry.product))
    const quantity =
      entries.filter((entry) => entry.whole).reduce((sum, entry) => sum + entry.quantity, 0) +
      new Set(entries.filter((entry) => !entry.whole && !wholeProducts.has(entry.product)).map((entry) => entry.product)).size
    const validationErrors: Record<string, string> = {}
    if (!entries.length) validationErrors.items = "Agrega al menos un producto dañado."
    if (!String(pncForm["4"] ?? "").trim()) {
      validationErrors["4"] = "Selecciona el motivo."
    }
    setPncFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      setPncError("Completa los campos indicados antes de registrar.")
      return
    }
    if (entries.some((entry) => !availableProducts.includes(entry.product))) {
      setPncFieldErrors({ "1": "Solo puedes registrar productos que estén en producción." })
      setPncError("Solo puedes registrar productos que estén en producción.")
      return
    }

    const currentDateTime = getCurrentDateTimeParts()
    const nextStatus = "Producto no conforme"
    // row[2]: what went bad, as JSON: each whole product, or each insumo (with the product it belongs to)
    const damaged = entries.flatMap((entry) =>
      entry.whole
        ? [{ name: entry.product, quantity: entry.quantity, unit: entry.unit || "und" }]
        : entry.parts.map((part) => ({ ...part, product: entry.product })),
    )
    const pncRecord: (string | number)[] = [
      "",
      affectedProduct,
      JSON.stringify(damaged),
      quantity,
      String(pncForm["4"]).trim(),
      currentDateTime.date,
      "",
      "und",
      "Activo",
    ]
    const updatedOrder = [...order]
    const history = parseProductionHistory(updatedOrder[12])
    history.push({
      status: nextStatus,
      date: currentDateTime.date,
      time: currentDateTime.time,
    })
    updatedOrder[4] = currentDateTime.date
    updatedOrder[5] = currentDateTime.time
    updatedOrder[6] = currentDateTime.date
    updatedOrder[7] = currentDateTime.time
    updatedOrder[8] = nextStatus
    updatedOrder[9] = ""
    updatedOrder[10] = 0
    updatedOrder[11] = "Sí"
    updatedOrder[12] = JSON.stringify(history)

    const productionRows = rows.produccion || []
    const nextPriority = Math.max(0, ...productionRows.map((row) => Number(row[3]) || 0)) + 1
    // Damaged items are made again; unaffected products and additions are reused.
    const wholeLeft = new Map<string, number>()
    const partsLeft = new Map<string, PncEntry[]>()
    for (const entry of entries) {
      if (entry.whole) wholeLeft.set(entry.product, (wholeLeft.get(entry.product) ?? 0) + entry.quantity)
      else partsLeft.set(entry.product, [...(partsLeft.get(entry.product) ?? []), entry])
    }
    const remadeItems: ProductionItem[] = getProductionOrderItems(updatedOrder).flatMap((item) => {
      if (item.parentId) return [{ ...item, reuse: true }]
      const lines: ProductionItem[] = []
      let remaining = item.quantity
      const whole = Math.min(remaining, wholeLeft.get(item.name) ?? 0)
      if (whole) {
        lines.push({ ...item, quantity: whole })
        wholeLeft.set(item.name, (wholeLeft.get(item.name) ?? 0) - whole)
        remaining -= whole
      }
      const partEntries = partsLeft.get(item.name) ?? []
      while (remaining > 0 && partEntries.length) {
        lines.push({ ...item, quantity: 1, onlySupplies: partEntries.shift()!.parts })
        remaining -= 1
      }
      if (remaining > 0) lines.push({ ...item, quantity: remaining, reuse: true })
      return lines
    })
    const restartedOrder: (string | number)[] = [
      getNextProductionCode(productionRows),
      updatedOrder[1],
      updatedOrder[2],
      nextPriority,
      currentDateTime.date,
      currentDateTime.time,
      currentDateTime.date,
      currentDateTime.time,
      "Recibida",
      "",
      0,
      "Sí",
      JSON.stringify([{ status: "Recibida", date: currentDateTime.date, time: currentDateTime.time }]),
      JSON.stringify(remadeItems),
      "No",
      String(updatedOrder[15] ?? ""),
      "",
    ]
    pncRecord[0] = String(restartedOrder[0])

    setPncSaving(true)
    try {
      const affectedProductionId = Number(order[PANEL_SYNC.produccion.idIndex])
      const affectedProduction =
        Number.isSafeInteger(affectedProductionId) && affectedProductionId > 0
          ? { id: affectedProductionId, row: updatedOrder }
          : undefined
      const persisted = await savePncAndReplacement(
        pncRecord,
        restartedOrder,
        affectedProduction,
      )
      setRows((current) => {
        const nextProduction = [...(current.produccion || [])]
        const sourceIndex = nextProduction.findIndex((row) => String(row[0]) === String(order[0]))
        if (sourceIndex >= 0) nextProduction[sourceIndex] = updatedOrder
        nextProduction.unshift(persisted.productionRow)
        return {
          ...current,
          produccion: nextProduction,
          "producto-no-conforme": [
            persisted.pncRow,
            ...(current["producto-no-conforme"] || []),
          ],
        }
      })
      setPncTarget(null)
      setPncForm({})
      setPncError("")
      setPncFieldErrors({})
    } catch (error) {
      setPncError(`No se pudo registrar el producto no conforme ni su orden de reposición: ${(error as Error).message}`)
    } finally {
      setPncSaving(false)
    }
  }
  const changeProductionStatus = async (
    rowIndex: number,
    nextStatus: (typeof PRODUCTION_STATUSES)[number],
  ): Promise<boolean> => {
    const sourceRow = rows.produccion?.[rowIndex]
    if (!sourceRow) return false
    if (String(sourceRow[8]) === nextStatus) return true
    const consumeStock = nextStatus === "En cocina" && String(sourceRow[14]) !== "Sí"
    const requiredSupplies = new Map<string, { quantity: number; unit: string }>()
    if (consumeStock) {
      for (const item of getProductionOrderItems(sourceRow)) {
        if (item.reuse) continue
        if (item.onlySupplies) {
          for (const part of item.onlySupplies) {
            const supply = rows.insumos?.find((candidate) => candidate[0] === part.name)
            const unit = String(supply?.[2] ?? "").trim()
            const quantity = toBaseQuantity(Number(part.quantity), part.unit || unit, unit)
            if (!supply || quantity === null) {
              window.alert(`No se puede iniciar la producción: revisa que «${part.name}» exista en inventario y su unidad.`)
              return false
            }
            const current = requiredSupplies.get(part.name)
            requiredSupplies.set(part.name, { quantity: (current?.quantity ?? 0) + quantity * item.quantity, unit })
          }
          continue
        }
        // A resale soda carries its own stock (its product): one sold = one out, once it has ever been bought
        if (isSodaName(item.name)) {
          if (wasBought(item.name)) {
            const current = requiredSupplies.get(item.name)
            requiredSupplies.set(item.name, { quantity: (current?.quantity ?? 0) + item.quantity, unit: "und" })
          }
          continue
        }
        const product = rows.producto?.find((candidate) => candidate[0] === item.name)
        for (const ingredient of getProductRecipe(product)) {
          const supply = rows.insumos?.find((candidate) => candidate[0] === ingredient.name)
          const unit = String(supply?.[2] ?? "").trim()
          if (!supply || !unit || unit.toLowerCase() !== ingredient.unit.trim().toLowerCase()) {
            window.alert(`No se puede iniciar la producción: revisa que «${ingredient.name}» exista en inventario y use la misma unidad de la ficha técnica.`)
            return false
          }
          const current = requiredSupplies.get(ingredient.name)
          requiredSupplies.set(ingredient.name, {
            quantity: (current?.quantity ?? 0) + ingredient.quantity * item.quantity,
            unit,
          })
        }
      }
      for (const [name, requirement] of requiredSupplies) {
        const stock = stockOf(name)
        if (!Number.isFinite(stock) || stock < requirement.quantity) {
          window.alert(`Stock insuficiente de «${name}»: se necesitan ${requirement.quantity} ${requirement.unit} y hay ${Number.isFinite(stock) ? stock : 0}.`)
          return false
        }
      }
      // The backend takes the supplies out of the stock (all or nothing, once per order) before the status changes
      if (requiredSupplies.size) {
        try {
          await api("/consumos-produccion", "POST", {
            numero_orden: String(sourceRow[0]),
            insumos: [...requiredSupplies].map(([insumo, r]) => ({ insumo, cantidad: r.quantity })),
          })
        } catch (err) {
          window.alert(`No se pudo iniciar la producción: ${(err as Error).message}`)
          loadModule("insumos")
          return false
        }
      }
    }
    setRows((current) => {
      const productionRows = [...(current.produccion || [])]
      const currentRow = productionRows[rowIndex]
      if (!currentRow) return current
      if (consumeStock && String(currentRow[14]) === "Sí") return current

      const currentDateTime = getCurrentDateTimeParts()
      const now = new Date()
      const formatRealTime = (date: Date) => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        const period = hours >= 12 ? "PM" : "AM"
        const hours12 = hours % 12 || 12
        return `${hours12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`
      }
      const realTime = formatRealTime(now)
      const updatedRow = [...currentRow]
      updatedRow[5] = realTime
      updatedRow[7] = realTime
      updatedRow[8] = nextStatus
      let history: { status: string; date: string; time: string }[] = []
      try {
        const storedHistory = JSON.parse(String(currentRow[12] ?? "[]"))
        if (Array.isArray(storedHistory)) history = storedHistory
      } catch {
        history = []
      }
      history.push({
        status: nextStatus,
        date: currentDateTime.date,
        time: realTime,
      })
      updatedRow[12] = JSON.stringify(history)
      updatedRow[11] =
        nextStatus !== "Recibida" || String(currentRow[11]).toLowerCase() === "sí"
          ? "Sí"
          : "No"
      if (consumeStock) updatedRow[14] = "Sí"

      if (nextStatus === "Terminado") {
        if (currentRow[8] !== "Terminado") {
          updatedRow[9] = `${currentDateTime.date} ${realTime}`
          const lastDeparture = Math.max(
            0,
            ...productionRows.map((row) => Number(row[10]) || 0),
          )
          updatedRow[10] = lastDeparture + 1
        }
      } else {
        updatedRow[9] = ""
        updatedRow[10] = 0
      }
      productionRows[rowIndex] = updatedRow
      const supplies = consumeStock
        ? (current.insumos || []).map((supply) => {
            const required = requiredSupplies.get(String(supply[0]))
            if (!required) return supply
            const updatedSupply = [...supply]
            updatedSupply[4] = Number(updatedSupply[4]) - required.quantity
            return updatedSupply
          })
        : current.insumos

      if (nextStatus === "Producto no conforme") {
        const newPriority =
          Math.max(0, ...productionRows.map((row) => Number(row[3]) || 0)) + 1
        const newOrderCode = getNextProductionCode(productionRows)
        const restartedOrder: (string | number)[] = [
          newOrderCode,
          updatedRow[1],
          updatedRow[2],
          newPriority,
          currentDateTime.date,
          realTime,
          currentDateTime.date,
          realTime,
          "Iniciada",
          "",
          0,
          "Sí",
          JSON.stringify([
            { status: "Iniciada", date: currentDateTime.date, time: realTime },
          ]),
          updatedRow[13],
          "No",
          String(updatedRow[15] ?? ""),
          "",
        ]
        productionRows.push(restartedOrder)
      }

      return { ...current, produccion: productionRows, ...(supplies ? { insumos: supplies } : {}) }
    })
    return true
  }
  const doAnul = (sec: string, idx: number) => {
    setAnulled((a) => {
      const s = new Set(a[sec] || [])
      s.add(idx)
      return { ...a, [sec]: s }
    })
    setRows((r) => {
      const u = [...(r[sec] || [])]
      const row = [...u[idx]]
      const lastIdx = row.length - 1
      if (
        typeof row[lastIdx] === "string" &&
        (row[lastIdx] === "Activo" ||
          row[lastIdx] === "Activa" ||
          row[lastIdx] === "Completada")
      )
        row[lastIdx] = "Inactivo"
      u[idx] = row
      return { ...r, [sec]: u }
    })
  }
  const confirmAnul = () => {
    const target = anulTarget
    if (!target) return

    const row = rows[target.section]?.[target.idx]
    if (!getAnulAssessment(target.section, row, target.idx).allowed) return

    const statusIndex = MOD_CFG[target.section]?.statusIndex
    if (statusIndex !== undefined) {
      toggleStatus(target.section, target.idx, statusIndex)
      setUndoAnul({ sec: target.section, idx: target.idx, statusIndex, name: String(row?.[0] ?? "") })
    } else {
      doAnul(target.section, target.idx)
    }
    setAnulTarget(null)
  }
  const reactivate = (sec: string, idx: number) => {
    setAnulled((a) => {
      const s = new Set(a[sec] || [])
      s.delete(idx)
      return { ...a, [sec]: s }
    })
    setRows((r) => {
      const u = [...(r[sec] || [])]
      const row = [...u[idx]]
      const lastIdx = row.length - 1
      if (typeof row[lastIdx] === "string") row[lastIdx] = "Activo"
      u[idx] = row
      return { ...r, [sec]: u }
    })
  }
  const confirmDelete = () => {
    if (!delTarget) return
    const idx = delTarget.row ? findRowIndex(delTarget.section, delTarget.row) : delTarget.idx
    const row = rows[delTarget.section]?.[idx]
    if (idx < 0 || !row) {
      window.alert("Este registro ya no está en la tabla (cambió o lo eliminó otra persona).")
      setDelTarget(null)
      return
    }
    if (!getDeleteAssessment(delTarget.section, row).allowed) return
    deleteRowInDb(delTarget.section, row)

    setRows((current) => ({
      ...current,
      [delTarget.section]: (current[delTarget.section] || []).filter((r) => r !== row),
    }))
    setDelTarget(null)
  }
  const handleFile = (file: File) => {
    readVoucher(file)
      .then((image) => {
        setImgPreview(image)
        setFormFieldErrors((current) => ({ ...current, img: "" }))
      })
      .catch(() => window.alert("No se pudo leer la imagen. Prueba con otra (JPG o PNG)."))
  }
  const parsePurchaseItems = (value: string | number | undefined) =>
    String(value ?? "")
      .split(/\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, unitPrice] = line.split("|").map((part) => part.trim())
        const parsedQuantity = Number(quantity || 0)
        const parsedUnitPrice = Number(unitPrice || 0)
        return {
          name: name || "Producto",
          quantity: quantity || "0",
          unitPrice,
          total: parsedQuantity * parsedUnitPrice,
        }
      })
  // Adds (sign 1) or removes (sign -1) a purchase's quantities to each insumo's
  // "Stock actual" (row[4]). Items are matched by name ignoring case/accents.
  function withStockChange(
    insumoRows: (string | number)[][],
    purchaseItems: string | number | undefined,
    sign: 1 | -1,
  ) {
    const totals = new Map<string, number>()
    for (const item of parsePurchaseItems(purchaseItems)) {
      const key = normalizeName(item.name)
      totals.set(key, (totals.get(key) ?? 0) + (Number(item.quantity) || 0))
    }
    return insumoRows.map((supply) => {
      const qty = totals.get(normalizeName(supply[0]))
      if (!qty) return supply
      const updated = [...supply]
      const next = Number(updated[4] || 0) + sign * qty
      updated[4] = Math.max(0, Math.round(next * 1000) / 1000)
      return updated
    })
  }
  const parseProductionHistory = (
    value: string | number | undefined,
  ): { status: string; date: string; time: string }[] => {
    try {
      const history = JSON.parse(String(value ?? "[]"))
      return Array.isArray(history)
        ? (history as { status: string; date: string; time: string }[])
        : []
    } catch {
      return []
    }
  }
  const PAGE_SIZE = 6
  // Dashboard data, from the backend rows of the chosen period
  const period = getDashPeriod(chartFilter, chartAnchor)
  const dateOf = (v: string | number | undefined) => {
    const d = new Date(`${String(v ?? "").slice(0, 10)}T00:00:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const within = (v: string | number | undefined, start: Date, end: Date) => {
    const d = dateOf(v)
    return !!d && d >= start && d < end
  }
  // Ventas row: [0 código, 2 cliente, 3 fecha, 7 total, 8/9 estado, 11/12 líneas]; voided ones don't count
  const validSales = (rows.ventas || []).filter(
    (r) => ![r[8], r[9]].some((v) => ["anulada", "anulado"].includes(String(v ?? "").toLowerCase())),
  )
  const saleTotal = (r: (string | number)[]) => Number(r[7]) || 0
  const saleLines = (r: (string | number)[]): { product?: string; quantity?: number; parentId?: string }[] => {
    for (const v of [r[12], r[11]]) {
      try {
        const lines = JSON.parse(String(v ?? ""))
        if (Array.isArray(lines)) return lines
      } catch {
        // not the lines column
      }
    }
    return []
  }
  // Pérdidas row: [0 insumo, 1 "0.5 kg", 4 fecha]; valued at the insumo's unit cost (fully returned = no loss)
  const lossValue = (r: (string | number)[]) =>
    isReturnedLoss(r) ? 0 : (parseFloat(String(r[1] ?? "").replace(",", ".")) || 0) * costOf(r[0])
  const sumIn = (start: Date, end: Date) => ({
    sales: validSales.filter((r) => within(r[3], start, end)).reduce((t, r) => t + saleTotal(r), 0),
    losses: (rows.perdidas || []).filter((r) => within(r[4], start, end)).reduce((t, r) => t + lossValue(r), 0),
  })
  const periodSales = validSales.filter((r) => within(r[3], period.start, period.end))
  const periodReturns = (rows.devoluciones || []).filter((r) => within(r[5], period.start, period.end))
  const totals = sumIn(period.start, period.end)
  const prevSales = validSales.filter((r) => within(r[3], period.prevStart, period.start))
  const prevTotals = sumIn(period.prevStart, period.start)
  const prevReturns = (rows.devoluciones || []).filter((r) => within(r[5], period.prevStart, period.start)).length
  const chart = {
    labels: period.buckets.map((b) => b.label),
    values: period.buckets.map((b) => sumIn(b.start, b.end).sales),
    values2: period.buckets.map((b) => sumIn(b.start, b.end).losses),
  }
  const money = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v / 1000)}K` : fmt(v)
  // "+12%" against the previous period of the same kind
  const change = (current: number, previous: number) =>
    !previous ? (current ? "Nuevo" : "—") : `${current >= previous ? "+" : ""}${Math.round(((current - previous) / previous) * 100)}%`
  // Best sellers: main products (not additions) of the period's sales
  const unitsByProduct = new Map<string, number>()
  periodSales.forEach((r) =>
    saleLines(r)
      .filter((l) => l.product && !l.parentId)
      .forEach((l) => unitsByProduct.set(String(l.product), (unitsByProduct.get(String(l.product)) ?? 0) + (Number(l.quantity) || 0))),
  )
  const topUnits = [...unitsByProduct].sort((x, y) => y[1] - x[1]).slice(0, 5)
  const TOP = topUnits.map(([name, units]) => ({ name, units, pct: Math.round((units / topUnits[0][1]) * 100) }))
  const KPI = [
    {
      icon: Ico.cash,
      label: "Ventas",
      val: fmt(totals.sales),
      badge: change(totals.sales, prevTotals.sales),
      good: totals.sales >= prevTotals.sales,
    },
    {
      icon: Ico.orders,
      label: "N.º de ventas",
      val: String(periodSales.length),
      badge: change(periodSales.length, prevSales.length),
      good: periodSales.length >= prevSales.length,
    },
    {
      icon: Ico.undo,
      label: "Devoluciones",
      val: String(periodReturns.length),
      badge: change(periodReturns.length, prevReturns),
      good: periodReturns.length <= prevReturns,
    },
  ]
  const returnReasons = new Map<string, number>()
  periodReturns.forEach((r) => {
    const reason = String(r[4] ?? "").trim() || "Otro"
    returnReasons.set(reason, (returnReasons.get(reason) ?? 0) + 1)
  })
  // What each role sees on the dashboard: only the blocks of the modules it handles
  const seesSales = canSee("ventas")
  const seesReturns = canSee("devoluciones")
  const seesProduction = canSee("produccion")
  const shownKPI = KPI.filter((k) => (k.label === "Devoluciones" ? seesReturns : seesSales))
  // Without Ventas (cocina, domicilios...): a card per module of the role, with what is pending in it
  const MY_MODULES = visibleMenu
    .flatMap((g) => (g.children.length ? g.children : [{ key: g.key, label: g.label }]))
    .filter((m) => m.key !== "dashboard")
    .map((m) => {
      const list = rows[m.key] || []
      const pending =
        m.key === "pedidos"
          ? list.filter((r) => !["Entregado", "Cancelado"].includes(String(r[7] ?? ""))).length
          : m.key === "produccion"
            ? list.filter((r) => !["Terminado", "Producto no conforme"].includes(String(r[8] ?? "Recibida"))).length
            : null
      return { key: m.key as AdminSection, label: m.label, total: list.length, pending }
    })
  const RETURN_REASONS = [...returnReasons]
    .sort((x, y) => y[1] - x[1])
    .map(([label, n]) => ({ label, pct: Math.round((n / periodReturns.length) * 100) }))
  const ALERTS = notifications
  return {
    onSwitchToClient,
    onLogout,
    user,
    theme,
    setTheme,
    section,
    setSection,
    sellerName,
    canSee,
    canDo,
    visibleMenu,
    open,
    setOpen,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    dashboardIntroDone,
    setDashboardIntroDone,
    hideOnMini,
    profileOpen,
    setProfileOpen,
    notificationsOpen,
    setNotificationsOpen,
    readNotifications,
    setReadNotifications,
    showAdminProfile,
    setShowAdminProfile,
    dropRef,
    notificationsRef,
    fileInputRef,
    sidebarScrollTop,
    preserveSidebarScroll,
    dark,
    t,
    clientOrders,
    orderNotifications,
    rows,
    setRows,
    clientOrdersSnapshot,
    productsSnapshot,
    productionSnapshot,
    notifications,
    unreadNotifications,
    undoAnul,
    setUndoAnul,
    anulled,
    setAnulled,
    prodImgs,
    setProdImgs,
    loadModule,
    syncRow,
    deleteRowInDb,
    panelLoaded,
    panelSaved,
    savePncAndReplacement,
    loadPanel,
    failedCreates,
    paymentProofs,
    setPaymentProofs,
    paymentProofDraft,
    setPaymentProofDraft,
    search,
    setSearch,
    tableFilter,
    setTableFilter,
    prodDay,
    setProdDay,
    prodStatus,
    setProdStatus,
    pg,
    setPg,
    modal,
    setModal,
    formData,
    setFormData,
    formValidationAttempted,
    setFormValidationAttempted,
    formFieldErrors,
    setFormFieldErrors,
    imgPreview,
    setImgPreview,
    technicalSheetOpen,
    setTechnicalSheetOpen,
    technicalIngredients,
    setTechnicalIngredients,
    technicalSteps,
    setTechnicalSteps,
    technicalStepDraft,
    setTechnicalStepDraft,
    technicalStepEdit,
    setTechnicalStepEdit,
    technicalIngredientUnit,
    setTechnicalIngredientUnit,
    technicalIngredientSearch,
    setTechnicalIngredientSearch,
    technicalIngredientSelect,
    setTechnicalIngredientSelect,
    technicalIngredientQuantity,
    setTechnicalIngredientQuantity,
    technicalSheetError,
    setTechnicalSheetError,
    pedidoProductoSelect,
    setPedidoProductoSelect,
    pedidoProductCategory,
    setPedidoProductCategory,
    pedidoProductSearch,
    setPedidoProductSearch,
    pedidoSearchOpen,
    setPedidoSearchOpen,
    pedidoProductQuantity,
    setPedidoProductQuantity,
    pedidoAdditionsFor,
    setPedidoAdditionsFor,
    pedidoOrderLines,
    setPedidoOrderLines,
    productionItems,
    setProductionItems,
    productionProductSelect,
    setProductionProductSelect,
    pncOrderPick,
    setPncOrderPick,
    pncSaving,
    setPncSaving,
    orderDetailOpen,
    setOrderDetailOpen,
    pncManual,
    setPncManual,
    productionSearch,
    setProductionSearch,
    productionItemEdit,
    setProductionItemEdit,
    productionKind,
    setProductionKind,
    productionItemUnit,
    setProductionItemUnit,
    productionItemQuantity,
    setProductionItemQuantity,
    productionAdditionParentId,
    setProductionAdditionParentId,
    productionSelectedSauces,
    setProductionSelectedSauces,
    productionFormError,
    setProductionFormError,
    purchaseItemSelect,
    setPurchaseItemSelect,
    purchaseSupplySearch,
    setPurchaseSupplySearch,
    purchaseItemQty,
    setPurchaseItemQty,
    purchaseItemPrice,
    setPurchaseItemPrice,
    purchaseFormError,
    setPurchaseFormError,
    lossDraft,
    setLossDraft,
    lossError,
    setLossError,
    purchaseNotice,
    setPurchaseNotice,
    supplySuppliers,
    setSupplySuppliers,
    supplierPickerOpen,
    setSupplierPickerOpen,
    supplierPickerQuery,
    setSupplierPickerQuery,
    supplierSupplySearch,
    setSupplierSupplySearch,
    supplierSupplyOpen,
    setSupplierSupplyOpen,
    formReturn,
    setFormReturn,
    purchaseConfirmOpen,
    setPurchaseConfirmOpen,
    lossReturnReason,
    setLossReturnReason,
    lossReturnError,
    setLossReturnError,
    lossReturnQty,
    setLossReturnQty,
    lossReturnSaving,
    setLossReturnSaving,
    purchaseItemEdit,
    setPurchaseItemEdit,
    resetPurchasePicker,
    pncTarget,
    setPncTarget,
    pncForm,
    setPncForm,
    pncError,
    setPncError,
    pncFieldErrors,
    setPncFieldErrors,
    quickClientOpen,
    setQuickClientOpen,
    quickClientForm,
    setQuickClientForm,
    quickClientErrors,
    setQuickClientErrors,
    clientFormError,
    setClientFormError,
    supplyFormError,
    setSupplyFormError,
    formInitial,
    setFormInitial,
    formTried,
    setFormTried,
    touchedFields,
    setTouchedFields,
    quickClientError,
    setQuickClientError,
    delTarget,
    setDelTarget,
    paymentRejectionTarget,
    setPaymentRejectionTarget,
    paymentRejectionReason,
    setPaymentRejectionReason,
    paymentRejectionError,
    setPaymentRejectionError,
    anulTarget,
    setAnulTarget,
    chartFilter,
    setChartFilter,
    chartAnchor,
    setChartAnchor,
    rolesPerms,
    setRolesPerms,
    permsLoaded,
    permsSaved,
    toggleGrp,
    sectionLabel,
    markNotificationRead,
    markAllNotificationsRead,
    getAutoTechVersion,
    getTechVersions,
    nextTechVersion,
    purchaseLabel,
    isLossOfPurchase,
    isLossPurchaseAnnulled,
    sodaProductRow,
    stockOf,
    costOf,
    wasBought,
    sodaOptions,
    getAvailableInsumos,
    getPreparationSteps,
    getProductRecipe,
    getAdminOrderLines,
    getSaleOrderLines,
    getAvailableProductos,
    getProductionOrderItems,
    getNonconformingProductOptions,
    getNonconformingItemUnit,
    getNonconformingItems,
    getCurrentDateTimeParts,
    getNextProductionPriority,
    getNextProductionCode,
    getNextOrderCode,
    getRequiredFormKeys,
    purchaseLossMax,
    saleReturnBlock,
    getManagedFieldError,
    validateManagedForm,
    updateAdminField,
    openAdd,
    openEdit,
    stockMoves,
    setStockMoves,
    openView,
    VALIDATED_SECTIONS,
    REQUIRED_KEYS,
    getFieldErrors,
    fieldErrors,
    shownFieldError,
    isRequiredField,
    revealFirstFormError,
    openChildForm,
    returnToParent,
    returnLossToPurchase,
    closeModal,
    requestCloseModal,
    discardAsk,
    setDiscardAsk,
    saveToast,
    saveModal,
    loadedSections,
    savedHighlight,
    saving,
    saveError,
    isStatusActive,
    getSupplierPurchases,
    getCategoryRecords,
    getDeleteAssessment,
    isStatusLocked,
    getAnulAssessment,
    toggleStatus,
    approveOrderForProduction,
    ORDER_TO_PRODUCTION,
    setOrderPayment,
    setClientOrderStatus,
    rejectTransferPayment,
    saveQuickClient,
    openProductionPnc,
    PNC_UNITS,
    parsePncEntries,
    saveProductionPnc,
    changeProductionStatus,
    doAnul,
    confirmAnul,
    reactivate,
    confirmDelete,
    handleFile,
    parsePurchaseItems,
    withStockChange,
    parseProductionHistory,
    PAGE_SIZE,
    period,
    dateOf,
    within,
    validSales,
    saleTotal,
    saleLines,
    lossValue,
    sumIn,
    periodSales,
    periodReturns,
    totals,
    prevSales,
    prevTotals,
    prevReturns,
    chart,
    money,
    change,
    unitsByProduct,
    topUnits,
    TOP,
    KPI,
    returnReasons,
    seesSales,
    seesReturns,
    seesProduction,
    shownKPI,
    MY_MODULES,
    RETURN_REASONS,
    ALERTS,
  }
}
