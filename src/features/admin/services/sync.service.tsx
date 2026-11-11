import { MOD_CFG, RETURNED_LOSS } from "@/features/admin/config/modules"
import { estadoOf, isActiveStatus, optionalEmail, parsePurchaseLines, roleLabel, text, withId } from "@/features/admin/utils/rows"
import { SODA_LOW_STOCK, SODA_PRODUCT, currentCategory, isSodaName, isStockedExtra } from "@/features/menu/data/products"
import { loadOrders } from "@/features/orders/services/orders.service"
import { api } from "@/shared/services/api"
import type { DbRecord, PanelSyncSpec, Row, SyncSpec, TechnicalIngredient } from "@/shared/types"
import { normalizeName } from "@/shared/utils/format"

// Finds a backend record id by its name (same name matching as the admin: no accents/case)
export async function idByName(path: string, nameKey: string, idKey: string, name: string | number, what: string) {
  const record = (await api<DbRecord[]>(path)).find((r) => normalizeName(r[nameKey]) === normalizeName(name))
  if (!record) throw new Error(`${what} «${name}» no existe en la base de datos.`)
  return record[idKey] as number
}

export const categoryIdByName = async (path: string, name: string | number) => {
  const categories = await api<DbRecord[]>(path)
  const requested = normalizeName(name)
  const aliases = requested === "gaseosas" || requested === "bebidas" ? ["gaseosas", "bebidas"] : [requested]
  const category = categories.find((item) => aliases.includes(normalizeName(item.nombre_categoria)))
  if (!category) throw new Error(`La categoría «${name}» no existe en la base de datos.`)
  return category.id_categoria as number
}

// reloads: the module whose rows show the category by name (a rename must reach them)
export const categorySpec = (path: string, reloads: string[]): SyncSpec => ({
  path,
  update: "PUT",
  idIndex: 3,
  idOf: (c) => c.id_categoria,
  toRow: (c) =>
    withId([c.nombre_categoria, c.descripcion || "", c.estado === "ACTIVO" ? "Activa" : "Inactiva"], 3, c.id_categoria),
  toBody: (row) => ({ nombre_categoria: text(row[0]), descripcion: text(row[1]), estado: estadoOf(row[2]) }),
  reloads,
})

const shortDateTime = (v: unknown) =>
  v ? new Date(String(v)).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : ""

export const DB_SYNC: Record<string, SyncSpec> = {
  // [0 nombre, 1 descripción, 2 estado, 3 id, 4 creado, 5 actualizado]. The permissions matrix is still kept in the browser.
  roles: {
    path: "/roles",
    update: "PUT",
    idIndex: 3,
    idOf: (r) => r.id_rol,
    toRow: (r) => [
      ...withId([roleLabel(r.nombre_rol), r.descripcion || "", r.estado === "ACTIVO" ? "Activo" : "Inactivo"], 3, r.id_rol),
      shortDateTime(r.fecha_creacion),
      shortDateTime(r.fecha_actualizacion),
    ],
    toBody: (row) => ({ nombre_rol: text(row[0]), descripcion: text(row[1]), estado: estadoOf(row[2]) }),
  },
  // [0 nombre, 1 tipo doc, 2 documento, 3 rol, 4 correo, 5 estado, 6 contraseña, 7 id, 8 admin principal]
  usuarios: {
    path: "/usuarios",
    update: "PATCH",
    idIndex: 7,
    idOf: (u) => u.id_usuario,
    toRow: (u) => {
      const row = withId(
        [u.nombre || "", u.tipo_documento || "", u.documento || "", roleLabel(u.roles?.[0] || ""), u.correo,
          u.estado === "ACTIVO" ? "Activo" : "Inactivo", ""],
        7,
        u.id_usuario,
      )
      row[8] = u.es_administrador_principal ? "Principal" : ""
      row[9] = u.telefono || ""
      row[10] = u.barrio || ""
      row[11] = u.direccion || ""
      row[12] = u.telefono_emergencia || ""
      row[13] = u.correo_personal || ""
      return row
    },
    toBody: (row) => {
      const rol = text(row[3]).toUpperCase()
      return {
        nombre: text(row[0]),
        tipo_documento: text(row[1]),
        documento: text(row[2]),
        roles: [rol],
        tipo: rol === "CLIENTE" ? "CLIENTE" : "EMPLEADO",
        correo: text(row[4]),
        estado: estadoOf(row[5]),
        contrasena: text(row[6]) || undefined,
        telefono: text(row[9]),
        barrio: text(row[10]),
        direccion: text(row[11]),
        telefono_emergencia: text(row[12]),
        correo_personal: text(row[13]),
      }
    },
    // clientes: a user with the Cliente role is also a client (it shows up there right away)
    reloads: ["clientes"],
  },
  // [0 nombre, 1 categoría, 2 precio, 3 descripción, 4 estado, 5-9 ficha técnica, 10 disponibilidad, 11 id,
  //  12 stock y 13 costo (solo cambian en las gaseosas: los mueven sus compras y ventas)]
  producto: {
    path: "/productos",
    update: "PATCH",
    idIndex: 11,
    idOf: (p) => p.id_insumo_producto,
    toRow: (p) => {
      const row = withId(
        [p.nombre, currentCategory(p.nombre_categoria), p.precio, p.descripcion || "", p.estado === "ACTIVO" ? "Activo" : "Inactivo",
          p.ficha?.nombre || `Ficha ${p.nombre}`, p.ficha?.version || "v1.0", p.ficha?.insumos_principales || "",
          p.ficha?.preparacion || "",
          JSON.stringify((p.ficha?.ingredientes || []).map((i: DbRecord) => ({ name: i.insumo, quantity: i.cantidad, unit: i.medida || "" }))),
          "Disponible"],
        11,
        p.id_insumo_producto,
      )
      row[12] = Number(p.stock) || 0
      row[13] = Number(p.costo) || 0
      row[14] = Number(p.minimo) || 0
      return row
    },
    toBody: async (row) => ({
      nombre: text(row[0]),
      id_categoria: await categoryIdByName("/categorias-productos", row[1]),
      precio: Number(row[2]),
      descripcion: text(row[3]),
      estado: estadoOf(row[4]),
      ...(row[1] === SODA_PRODUCT ? { minimo: text(row[14]) === "" ? SODA_LOW_STOCK : Number(row[14]) } : {}),
    }),
    localOnly: (row) => row[1] === "Producto de insumo",
    afterSave: (id, row) => {
      // A soda has no ficha técnica
      if (row[1] === SODA_PRODUCT) return Promise.resolve()
      let recipe: TechnicalIngredient[] = []
      try {
        recipe = JSON.parse(String(row[9] || "[]"))
      } catch {
        // unreadable recipe: saved without ingredients
      }
      if (!text(row[5]) && !text(row[7]) && !text(row[8]) && recipe.length === 0)
        return Promise.resolve()
      return api(`/productos/${id}/ficha`, "PUT", {
        nombre: text(row[5]),
        version: text(row[6]),
        insumos_principales: text(row[7]),
        preparacion: text(row[8]),
        ingredientes: recipe
          .filter((i) => Number(i.quantity) > 0)
          .map((i) => ({ insumo: i.name, cantidad: Number(i.quantity), medida: i.unit || undefined })),
      })
    },
  },
  "cat-producto": categorySpec("/categorias-productos", ["producto"]),
  // [0 nombre, 1 tipo doc, 2 documento, 3 teléfono, 4 correo, 5 dirección, 6 de local (Sí/No), 7 estado]
  // Customers who registered in the app also show up here (their e-mail is their login).
  clientes: {
    path: "/clientes",
    update: "PATCH",
    idIndex: 8,
    idOf: (c) => c.id_persona,
    toRow: (c) =>
      withId(
        [c.nombre, c.tipo_documento || "", c.documento || "", c.telefono || "", c.correo || "", c.direccion || "",
          c.de_local ? "Sí" : "No", c.estado === "ACTIVO" ? "Activo" : "Inactivo", "",
          JSON.stringify(c.direcciones || []), "", c.id_usuario ? "Sí" : "No", c.id_usuario ?? ""],
        8,
        c.id_persona,
      ),
    toBody: (row) => ({
      nombre: text(row[0]),
      tipo_documento: text(row[1]),
      documento: text(row[2]),
      telefono: text(row[3]),
      correo: optionalEmail(row[4]),
      direccion: text(row[5]),
      de_local: text(row[6]).toLowerCase() === "sí",
      estado: estadoOf(row[7]),
    }),
    reloads: ["usuarios"],
  },
  domicilios: {
    path: "/barrios/admin",
    update: "PATCH",
    idIndex: 5,
    idOf: (d) => d.id_barrio,
    toRow: (d) =>
      withId(
        [d.nombre || "", d.es_cercano ? "Sí" : "No", d.tiempo_desplazamiento_minutos ?? "",
          d.costo_domicilio_cop ?? "", d.activo ? "Activo" : "Inactivo"],
        5,
        d.id_barrio,
      ),
    toBody: (row) => ({
      nombre: text(row[0]),
      es_cercano: text(row[1]).toLowerCase() === "sí",
      tiempo_desplazamiento_minutos: text(row[2]) ? Number(row[2]) : null,
      costo_domicilio_cop: text(row[3]) ? Number(row[3]) : null,
      activo: estadoOf(row[4]) === "ACTIVO",
    }),
    reloads: ["domicilios"],
  },
  "cat-insumos": categorySpec("/categorias-insumos", ["insumos"]),
  // [0 nombre, 1 categoría, 2 unidad, 3 costo, 4 stock, 5 mínimo, 6 (sin uso), 7 producto de insumo,
  //  8-11 ficha técnica, 12 estado]. The ficha técnica texts are not in the backend yet.
  insumos: {
    path: "/insumos",
    update: "PATCH",
    idIndex: 13,
    idOf: (i) => i.id_insumo_producto,
    toRow: (i) =>
      withId(
        [i.nombre, i.nombre_categoria, i.medida || "und", i.costo, i.stock, i.minimo, i.unidades_paquete ?? "",
          i.tiene_ficha_tecnica ? "Sí" : "No",
          i.tiene_ficha_tecnica ? i.ficha?.nombre || `Ficha técnica - ${i.nombre}` : "",
          i.tiene_ficha_tecnica ? i.ficha?.version || "v1.0" : "",
          i.ficha?.insumos_principales || "", i.ficha?.preparacion || "", i.estado === "ACTIVO" ? "Activo" : "Inactivo"],
        13,
        i.id_insumo_producto,
      ).concat(i.contenido_unidad || "und"),
    toBody: async (row) => ({
      nombre: text(row[0]),
      id_categoria: await categoryIdByName("/categorias-insumos", row[1]),
      medida: text(row[2]),
      // Only on create: afterwards purchases, losses and production own cost and stock
      ...(row[13] ? {} : { costo: Number(row[3]) || 0, stock: 0 }),
      minimo: Number(row[5]) || 0,
      unidades_paquete: text(row[2]) === "paq" && Number(row[6]) > 0 ? Number(row[6]) : null,
      contenido_unidad: text(row[2]) === "paq" ? text(row[14]) || "und" : null,
      tiene_ficha_tecnica: text(row[7]).toLowerCase() === "sí",
      estado: estadoOf(row[12]),
    }),
    // Cost and stock come back from the backend (they don't change when editing);
    // producto: a new unit also reaches the fichas técnicas that use it (the backend aligns them)
    reloads: ["insumos", "producto"],
    afterSave: (id, row) =>
      text(row[7]).toLowerCase() === "sí"
        ? api(`/insumos/${id}/ficha`, "PUT", {
            nombre: text(row[8]),
            version: text(row[9]),
            insumos_principales: text(row[10]),
            preparacion: text(row[11]),
            // no recipe lines in the insumo form: the backend keeps the saved ones
          })
        : Promise.resolve(),
  },
  // [0 proveedor, 1 fecha compra, 2 fecha registro, 3 subtotal, 4 total, 5 estado (Activo/Anulado), 6 insumos]
  // The backend adds the insumos to stock (and takes them back when the purchase is anulada).
  compras: {
    path: "/compras",
    update: "PUT",
    idIndex: 7,
    idOf: (c) => c.id_compra,
    toRow: (c) =>
      withId(
        [c.proveedor, c.fecha, c.fecha_registro, c.subtotal, c.total, c.estado === "REGISTRADA" ? "Activo" : "Anulado",
          c.detalles.map((d: DbRecord) => `${d.insumo} | ${d.cantidad} | ${d.costo_unitario}`).join("\n")],
        7,
        c.id_compra,
      ),
    toBody: async (row) => {
      const lines = parsePurchaseLines(row[6])
      // A soda is bought as its product of «Bebidas» (its stock goes there), the rest as insumos
      const [insumos, productos] = await Promise.all([
        api<DbRecord[]>("/insumos"),
        lines.some((l) => isStockedExtra(l.name)) ? api<DbRecord[]>("/productos") : Promise.resolve([] as DbRecord[]),
      ])
      const find = (name: string) =>
        (isStockedExtra(name) ? productos : insumos).find((i) => normalizeName(i.nombre) === normalizeName(name))
      const items = lines.map((line) => {
        const insumo = find(line.name)
        if (!insumo)
          throw new Error(
            isStockedExtra(line.name)
              ? `«${line.name}» no existe en Productos.`
              : `El insumo «${line.name}» no existe en la base de datos.`,
          )
        return { id_insumo_producto: insumo.id_insumo_producto, cantidad: line.quantity, costo_unitario: line.unitPrice }
      })
      return {
        id_proveedor: await idByName("/proveedores", "nombre", "id_proveedor", row[0], "El proveedor"),
        fecha: text(row[1]),
        iva: Math.max(0, Number(row[4]) - Number(row[3]) || 0),
        items,
      }
    },
    setStatus: (id, row) => api(`/compras/${id}/estado`, "PATCH", { estado: isActiveStatus(row[5]) ? "REGISTRADA" : "ANULADA" }),
    // producto: a soda's stock and cost live in its product; proveedores: what it bought joins the supplier's list
    reloads: ["insumos", "producto", "proveedores"],
  },
  // [0 insumo, 1 cantidad con unidad ("0.5 kg"), 2 motivo, 3 responsable, 4 fecha, 5 origen]
  // The backend takes the quantity out of the insumo's stock.
  perdidas: {
    path: "/perdidas-insumos",
    update: "PUT",
    idIndex: 9,
    idOf: (p) => p.id_perdida,
    // [.., 9 id, 10 id_compra (the purchase it was sent from)]
    toRow: (p) => {
      const row = withId(
        [p.insumo, `${p.cantidad} ${p.medida || ""}`.trim(), p.motivo || "", p.responsable || "", p.fecha, p.observacion || "",
          p.estado === "DEVUELTA" ? RETURNED_LOSS : p.cantidad_devuelta > 0 ? "Devuelta en parte" : "Registrada",
          p.motivo_devolucion || "", p.cantidad_devuelta ? `${p.cantidad_devuelta} ${p.medida || ""}`.trim() : ""],
        9,
        p.id_perdida,
      )
      row[10] = p.id_compra ?? ""
      return row
    },
    toBody: async (row) => {
      const cantidad = parseFloat(String(row[1]).replace(",", "."))
      if (!(cantidad > 0)) throw new Error(`La cantidad «${row[1]}» no es válida.`)
      return {
        // a soda sent to loss from its purchase is its product of «Bebidas»
        id_insumo_producto: isStockedExtra(row[0])
          ? await idByName("/productos", "nombre", "id_insumo_producto", row[0], "El producto")
          : await idByName("/insumos", "nombre", "id_insumo_producto", row[0], "El insumo"),
        cantidad,
        motivo: text(row[2]),
        responsable: text(row[3]),
        fecha: text(row[4]) || undefined,
        observacion: text(row[5]),
        // Only set when sent from a purchase; an edit leaves the saved link as it is
        id_compra: Number(row[10]) || undefined,
      }
    },
    // perdidas too: the new row gets its estado from the backend
    reloads: ["insumos", "perdidas"],
  },
  // [0 nombre, 1 NIT, 2 correo, 3 teléfono, 4 contacto, 5 dirección, 6 estado, 7 insumos,
  //  8-14 contacto: tipo doc, nº doc, nombre, apellido, teléfono, correo, cargo]
  proveedores: {
    path: "/proveedores",
    update: "PATCH",
    idIndex: 16,
    idOf: (p) => p.id_proveedor,
    // Nombre/apellido (10, 11) stay empty: the edit form splits them from "contacto"
    toRow: (p) =>
      withId(
        [p.nombre, p.nit || "", p.correo || "", p.telefono || "", p.contacto || "", p.direccion || "",
          p.estado === "ACTIVO" ? "Activo" : "Inactivo", p.insumos || "", p.contacto_tipo_documento || "",
          p.contacto_documento || "", "", "", p.contacto_telefono || "", p.contacto_correo || "", p.contacto_cargo || "",
          p.tipo || "Persona jurídica"],
        16,
        p.id_proveedor,
      ),
    toBody: (row) => ({
      nombre: text(row[0]),
      nit: text(row[1]),
      correo: optionalEmail(row[2]),
      telefono: text(row[3]),
      contacto: text(row[4]),
      direccion: text(row[5]),
      estado: estadoOf(row[6]),
      insumos: text(row[7]),
      contacto_tipo_documento: text(row[8]),
      contacto_documento: text(row[9]),
      contacto_telefono: text(row[12]),
      contacto_correo: optionalEmail(row[13]),
      contacto_cargo: text(row[14]),
      tipo: text(row[15]) || "Persona jurídica",
    }),
  },
}

// Creates (no id yet) or updates the row's record in the backend; returns its id
export async function saveRowToDb(spec: SyncSpec, row: Row) {
  const body = await spec.toBody(row)
  const id = row[spec.idIndex]
  const saved = id
    ? await api<DbRecord>(`${spec.path}/${id}`, spec.update, body)
    : await api<DbRecord>(spec.path, "POST", body)
  return { id: spec.idOf(saved), saved }
}

export const PANEL_SYNC: Record<string, PanelSyncSpec> = {
  // Production orders rebuilt from client orders (not the demo seed) are saved if the backend doesn't have them
  produccion: {
    path: "/ordenes-produccion",
    idIndex: 17,
    keepLocal: (row, dbRows) =>
      !dbRows.some((r) => r[0] === row[0] || (!!row[15] && r[15] === row[15] && String(r[8]) !== "Producto no conforme")) &&
      !MOD_CFG.produccion.seed.some((r) => r[0] === row[0]),
  },
  "producto-no-conforme": { path: "/productos-no-conformes", idIndex: 9 },
  ventas: { path: "/ventas", idIndex: 13 },
  // 6 = returned products (JSON); older records have none
  devoluciones: { path: "/devoluciones", idIndex: 7 },
  // Orders created by hand in the panel; web store orders are saved through /pedidos
  pedidos: {
    path: "/pedidos-panel",
    // 12 is the comment; older records have no comment and get it empty
    idIndex: 13,
    owns: (row) => !loadOrders().some((order) => order.id === row[0]),
  },
}
