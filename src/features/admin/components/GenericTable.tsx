import { useEffect, useRef } from "react"
import { MOD_CFG, PRODUCTION_STATUSES, QUICK_FILTERS, TABLE_FILTERS } from "@/features/admin/config/modules"
import { isNaturalSupplier, isReturnedLoss, parsePurchaseLines, isSuperAdminRow, supplierDocument, syncIdIndex } from "@/features/admin/utils/rows"
import { isSodaName, sodaImage } from "@/features/menu/data/products"
import { visiblePaginationPages } from "@/features/menu/utils/pagination"
import { loadOrders } from "@/features/orders/services/orders.service"
import { isTransferPaymentMethod } from "@/features/orders/utils/orders"
import { Ico } from "@/shared/components/icons"
import { C, badgeSt } from "@/shared/styles/theme"
import type { Row } from "@/shared/types"
import { fmt, normalizeName } from "@/shared/utils/format"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function GenericTable(adminState: AdminPanelState): ReactNode {
  const {
    PAGE_SIZE,
    ProductionStatusSelect,
    anulled,
    canDo,
    getCategoryRecords,
    getCurrentDateTimeParts,
    getDeleteAssessment,
    isLossPurchaseAnnulled,
    isStatusActive,
    isStatusLocked,
    lossValue,
    modal,
    openAdd,
    openEdit,
    openView,
    pg,
    prodDay,
    prodImgs,
    prodStatus,
    quickFilter,
    tableOrder,
    reactivate,
    rows,
    loadedSections,
    savedHighlight,
    search,
    section,
    setAnulTarget,
    setDelTarget,
    setLossReturnError,
    setLossReturnQty,
    setLossReturnReason,
    setPg,
    setProdDay,
    setProdStatus,
    setQuickFilter,
    setSearch,
    setTableFilter,
    t,
    tableFilter,
    toggleStatus,
  } = adminState
  const cfg = MOD_CFG[section]
  if (!cfg) return null

  const searchInputRef = useRef<HTMLInputElement>(null)
  const isProducto = section === "producto"

  // Do not steal focus from an open form when its controlled fields update.
  useEffect(() => {
    if (modal.mode === null && searchInputRef.current) {
      const currentValue = searchInputRef.current.value
      searchInputRef.current.focus()
      searchInputRef.current.value = currentValue
      // Restore cursor position to end
      searchInputRef.current.setSelectionRange(currentValue.length, currentValue.length)
    }
  }, [search[section], pg[section]])
  const noDelete = !!cfg.noDelete
  const noExp = !!cfg.noExport
  const indexedRows = (rows[section] || []).map((row, index) => ({ row, index }))
  const sRows =
    section === "usuarios"
      ? [...indexedRows].sort(
          (a, b) => Number(b.row[7] || 0) - Number(a.row[7] || 0),
        )
      : indexedRows
  const q = (search[section] || "").toLowerCase()
  const filterGroups = (TABLE_FILTERS[section] || [])
    .map(({ label, index }) => ({
      label,
      index,
      values: [
        ...new Set(indexedRows.map(({ row }) => String(row[index] ?? "").trim()).filter(Boolean)),
      ].sort((x, y) => x.localeCompare(y)),
    }))
    .filter(({ values }) => values.length > 0)
  // Stored as "<cell index>::<value>"
  const filterValue = tableFilter[section] || ""
  const [filterCell, filterText] = filterValue ? filterValue.split("::") : []
  const isProductionList = section === "produccion"
  // Production orders: [4] creation date "YYYY-MM-DD…", [8] status (empty = Recibido)
  const orderStatus = (row: Row) => String(row[8] || "Recibido")
  const matchesSearch = (row: Row) =>
    // Ignores accents and case: «lacteos» finds «Lácteos»
    (!q || row.some((cell) => normalizeName(cell).includes(normalizeName(q)))) &&
    (!filterValue ||
      (filterCell === "low"
        ? Number(row[4]) <= Number(row[5])
        : String(row[Number(filterCell)] ?? "").trim() === filterText)) &&
    (!isProductionList || !prodDay || String(row[4] ?? "").slice(0, 10) === prodDay)
  // Status counts follow the search and the day, so each button says how many it would show
  const beforeStatus = sRows.filter(({ row }) => matchesSearch(row))
  // Tabs with counts above the table: what needs attention, one click away
  const quickTabs = QUICK_FILTERS[section] ?? []
  const quickTab = quickTabs.find((tab) => tab.label === quickFilter[section])
  const statusFiltered = beforeStatus.filter(
    ({ row }) => (!isProductionList || !prodStatus || orderStatus(row) === prodStatus) && (!quickTab || quickTab.test(row)),
  )
  // Orders newest first, in order of arrival: shop and panel orders share the backend's id (shop code PED-<id>,
  // panel row[13]); one not saved yet is the newest
  const shopOrderIds = section === "pedidos" ? new Set(loadOrders().map((o) => o.id)) : null
  // A shop order's [13] is its phone, not an id: its number comes from its code
  const arrival = (row: Row) =>
    shopOrderIds?.has(String(row[0])) ? Number(/(\d+)$/.exec(String(row[0]))?.[1]) || 0 : Number(row[13]) || Infinity
  const filtered = shopOrderIds ? [...statusFiltered].sort((a, b) => arrival(b.row) - arrival(a.row)) : statusFiltered
  tableOrder.current[section] = filtered.map(({ index }) => index)
  const cur = pg[section] || 0
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visiblePages = visiblePaginationPages(cur, totalPages)
  const pageRows = filtered.slice(cur * PAGE_SIZE, (cur + 1) * PAGE_SIZE)
  const setP = (page: number) =>
    setPg((current) => ({ ...current, [section]: page }))
  const anulSet = anulled[section] || new Set<number>()
  const visibleColumns = cfg.columns.filter(
    (_, index) => !(isProducto && index === 0),
  )
  const getDisplayCellIndexes = (row: (string | number)[]) =>
    isProducto
      ? [0, 1, 2, 4]
      : row
          .map((_, index) => index)
          .filter(
            (index) =>
              !cfg.hiddenCellIndexes?.includes(index) && index !== syncIdIndex(section),
          )
  const getDisplayCells = (row: (string | number)[]) =>
    getDisplayCellIndexes(row).map((index) => row[index])
  const columnCount = Math.max(
    visibleColumns.length,
    ...pageRows.map(({ row }) => getDisplayCells(row).length),
    1,
  )

  const emptyState = (
    <div className="flex flex-col items-center gap-3">
      <span>Sin registros{q ? ` para "${q}"` : ""}</span>
      {!q && !filterValue && !indexedRows.length && canDo(section, "CREAR") && (
        <button
          type="button"
          onClick={() => openAdd(section)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
          style={{ background: C.mustard, color: "#fff" }}
        >
          {Ico.plus} Crear el primer registro
        </button>
      )}
    </div>
  )

  const exportRows = () => {
    const csvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`
    const exportData = filtered.map(({ row }) => getDisplayCells(row))
    const csv = [visibleColumns, ...exportData]
      // ";" because Excel in Spanish (Colombia) uses "," for decimals and ";" between columns
      .map((line) => line.map(csvCell).join(";"))
      .join("\r\n")
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${section}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderCellValue = (
    cell: string | number,
    primary = false,
    isLow = false,
    isPrincipalAdmin = false,
  ) => {
    const badge = badgeSt(cell)
    const color = isLow ? C.red : primary ? t.text : t.muted
    if (badge) {
      return (
        <span
          className="inline-block max-w-full rounded-full px-2 py-1 text-[10px] font-semibold leading-tight break-words [overflow-wrap:anywhere]"
          style={{ background: badge.bg, color: badge.color }}
        >
          {cell}
        </span>
      )
    }
    return (
      <span style={{ color }}>
        {String(cell)}
        {isPrincipalAdmin && (
          <span
            className="ml-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: `${C.mustard}18`, color: C.mustard }}
          >
            Administrador principal
          </span>
        )}
      </span>
    )
  }

  const formatSalesDate = (value: string | number) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
    if (!match) return "—"
    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) return "—"
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDisplayCell = (
    cell: string | number,
    rowCellIndex: number,
    row?: Row,
  ): string | number => {
    if (section === "proveedores" && rowCellIndex === 1 && row && isNaturalSupplier(row[15])) {
      return supplierDocument(row)
    }
    if (section === "producto" && rowCellIndex === 2 && !(Number(cell) > 0)) {
      return "Sin precio"
    }
    // A purchase shows what was bought (in the old "Subtotal" place): "Leche", "Leche + Queso", "Leche + Queso cre…"
    if (section === "compras" && row && rowCellIndex === 3) {
      const names = [...new Set(parsePurchaseLines(row[6]).map((line) => line.name))]
      if (names.length <= 1) return names[0] ?? "—"
      const second = names.length > 2 && names[1].length > 10 ? `${names[1].slice(0, 10).trimEnd()}…` : names[1]
      return `${names[0]} + ${second}${names.length > 2 && !second.endsWith("…") ? "…" : ""}`
    }
    // Big orders: the first 2 products with how many extras each carries, then «y N más» (full list in the detail)
    if (section === "produccion" && row && rowCellIndex === 1) {
      try {
        const items = JSON.parse(String(row[13] || "[]")) as { id?: string; name: string; quantity: number; parentId?: string }[]
        const mains = items.filter((i) => !i.parentId)
        if (mains.length) {
          const shown = mains.slice(0, 2).map((m) => {
            const extras = items.filter((i) => i.parentId && i.parentId === m.id).length
            return `${m.quantity} × ${m.name}${extras ? ` (+${extras})` : ""}`
          })
          return shown.join(", ") + (mains.length > 2 ? ` y ${mains.length - 2} más` : "")
        }
      } catch { /* old rows without items: shows the saved text */ }
    }
    // A package shows what it holds: "paq · 100 g"
    if (section === "insumos" && row && rowCellIndex === 2 && cell === "paq" && Number(row[6]) > 0) return `paq · ${Number(row[6]).toLocaleString("es-CO")} ${String(row[14] || "und")}`
    if (section === "insumos" && row && rowCellIndex === 3) return Number(cell) > 0 ? fmt(Number(cell)) : "Sin compras"
    if (section === "insumos" && row && rowCellIndex === 4) return `${Number(cell) || 0} ${String(row[2] ?? "")}`.trim()
    if (section === "pedidos" && rowCellIndex === 6) return Number.isFinite(Number(cell)) && cell !== "" ? fmt(Number(cell)) : "—"
    if (section !== "ventas") return cell
    if (rowCellIndex === 3) return formatSalesDate(cell)
    if (rowCellIndex === 7) {
      const total = Number(cell)
      return Number.isFinite(total) ? fmt(total) : "—"
    }
    return cell
  }

  // Product categories: how many products belong to each one (in place of the old description)
  // A soda's price cell: sale price, plus what it cost to buy and its stock (purchases move those, not the price)
  const renderSodaPrice = (row: Row) => {
    const price = Number(row[2]) || 0
    const cost = Number(row[13]) || 0
    return (
      <div className="flex flex-col gap-0.5">
        <span style={{ color: t.text }}>{price > 0 ? fmt(price) : "Sin precio"}</span>
        <span className="text-[10px]" style={{ color: t.muted }}>
          {cost ? `Costo ${fmt(cost)}` : "Sin compras"} · {Number(row[12]) || 0} und
        </span>
        {cost > 0 && cost >= price && (
          <span className="text-[10px] font-semibold" style={{ color: C.red }}>
            ⚠ Se vende {price === cost ? "a lo mismo que" : "por debajo de lo que"} cuesta
          </span>
        )}
      </div>
    )
  }

  const renderCategoryProductCount = (row: Row) => {
    const count = getCategoryRecords("cat-producto", String(row[0] ?? "")).length
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold"
          style={count ? { background: `${C.mustard}18`, color: C.mustard } : { background: t.input, color: t.muted }}
        >
          {count}
        </span>
        <span style={{ color: t.muted }}>
          {count === 0 ? "Ningún producto en esta categoría" : count === 1 ? "producto en esta categoría" : "productos en esta categoría"}
        </span>
      </span>
    )
  }

  // Small labels under the record's name (not by color alone)
  const chip = "mt-1 mr-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
  const renderNameChips = (row: Row, isLow: boolean, isSupplyProduct: boolean, isLocalClient: boolean, isSuperAdmin: boolean) => {
    const usedBy = section === "cat-insumos" ? getCategoryRecords("cat-insumos", String(row[0] ?? "")).length : 0
    return (
      <div>
        {(isSupplyProduct || isLocalClient || isSuperAdmin) && (
          <span className={chip} style={{ background: `${C.mustard}18`, color: C.mustard }}>
            {isSuperAdmin ? "Superadministrador" : isLocalClient ? "Cliente de local" : "Lo preparamos nosotros"}
          </span>
        )}
        {isLow && (
          <span className={chip} style={{ background: `${C.red}18`, color: C.red }}>
            ⚠ Stock bajo
          </span>
        )}
        {section === "cat-insumos" && (
          <span className={chip} style={usedBy ? { background: `${C.mustard}18`, color: C.mustard } : { background: t.input, color: t.muted }}>
            {usedBy === 1 ? "1 insumo" : `${usedBy} insumos`}
          </span>
        )}
      </div>
    )
  }

  const renderStatusControl = (rowIndex: number, rowCellIndex: number) => {
    if (cfg.statusIndex === undefined || rowCellIndex !== cfg.statusIndex) {
      return null
    }
    if (section === "produccion") {
      return <ProductionStatusSelect rowIndex={rowIndex} />
    }
    // Only the word; anular / reactivar is with the row's actions
    const row = rows[section]?.[rowIndex]
    // A record saved without state counts as active
    const value = String(row?.[cfg.statusIndex] || "Activo")
    const active = isStatusActive(value)
    return (
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={active ? { background: "rgba(46,125,96,0.12)", color: "#2E7D60" } : { background: `${C.red}12`, color: C.red }}
      >
        {value}
      </span>
    )
  }

  const renderActions = (rowIndex: number, isAnulled: boolean) => {
    const orderRow = section === "pedidos" ? rows.pedidos?.[rowIndex] : undefined
    const needsPaymentReview =
      !!orderRow &&
      isTransferPaymentMethod(String(orderRow[4] ?? "")) &&
      String(orderRow[8]) === "Pendiente de verificación"
    const detailActionLabel = needsPaymentReview
      ? "Revisar transferencia"
      : section === "compras"
        ? "Ver compra"
        : "Ver detalle"
    const deleteAssessment = getDeleteAssessment(
      section,
      rows[section]?.[rowIndex],
    )
    const canShowProductionDelete =
      section !== "produccion" ||
      String(rows.produccion?.[rowIndex]?.[8] ?? "Recibido") === "Recibido"
    const isPrincipalAdmin = isSuperAdminRow(
      section,
      rows[section]?.[rowIndex],
    )
    const deleteBlocked = !deleteAssessment.allowed
    const disabledAction = (label: string, icon: ReactNode) => (
      <button
        type="button"
        title={`${label} · Anulado o no disponible`}
        aria-label={`${label} no disponible`}
        disabled
        className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg opacity-40"
        style={{ color: t.muted, background: t.input }}
      >
        {icon}
      </button>
    )
    const deleteButton = (
      <button
        type="button"
        title={`${deleteBlocked ? "No se puede eliminar" : "Se puede eliminar"}: ${deleteAssessment.reason}`}
        aria-label={
          deleteBlocked
            ? "Ver motivo por el que no se puede eliminar"
            : "Eliminar registro"
        }
        aria-haspopup="dialog"
        onClick={() => setDelTarget({ section, idx: rowIndex, row: rows[section]?.[rowIndex] })}
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          deleteBlocked
            ? "cursor-help opacity-60 hover:opacity-100"
            : "cursor-pointer hover:opacity-80"
        }`}
        style={{ color: C.red, background: `${C.red}12` }}
      >
        {deleteBlocked ? Ico.alert : Ico.trash}
      </button>
    )

    return (
      <div className="flex flex-shrink-0 flex-nowrap items-center justify-end gap-1.5">
        {canDo(section, "VER") ? (
          <button
            type="button"
            title={detailActionLabel}
            aria-label={detailActionLabel}
            onClick={() => openView(section, rowIndex)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
            style={{ color: C.amber, background: `${C.amber}15` }}
          >
            {Ico.eye}
          </button>
        ) : disabledAction("Ver detalle", Ico.eye)}
        {!isAnulled &&
        canDo(section, "EDITAR") &&
        !(section === "perdidas" && isReturnedLoss(rows.perdidas?.[rowIndex])) &&
        // An annulled purchase is history: not editable (its stock was already taken back)
        !(section === "compras" && !isStatusActive(rows.compras?.[rowIndex]?.[5])) &&
        // Once the kitchen has it, the order's products can't change
        !(section === "pedidos" && !["Por confirmar", "Pendiente", "Recibido"].includes(String(orderRow?.[7] ?? ""))) &&
        // A production order is only editable while «Recibido»: from «Confirmado» on, the kitchen has it
        !(section === "produccion" && !["", "Recibido"].includes(String(rows.produccion?.[rowIndex]?.[8] ?? ""))) ? (
          <button
            type="button"
            title="Editar"
            aria-label="Editar"
            onClick={() => openEdit(section, rowIndex)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
            style={{ color: C.mustard, background: `${C.mustard}15` }}
          >
            {Ico.edit}
          </button>
        ) : (
          disabledAction("Editar", Ico.edit)
        )}
        {section === "perdidas" && (() => {
          const lossRow = rows.perdidas?.[rowIndex]
          const canReturn =
            canDo(section, "EDITAR") &&
            String(lossRow?.[5] ?? "").startsWith("Compra a ") &&
            !isReturnedLoss(lossRow) &&
            !isLossPurchaseAnnulled(lossRow)
          if (!canReturn) return disabledAction("Devolver a compra", Ico.undo)
          return (
            <button
              type="button"
              title="Devolver a compra"
              aria-label={`Devolver a compra ${String(lossRow?.[0] ?? "")}`}
              aria-haspopup="dialog"
              onClick={() => {
                openView(section, rowIndex)
                setLossReturnError("")
                setLossReturnQty(String(parseFloat(String(lossRow?.[1] ?? "")) || ""))
                setLossReturnReason("")
              }}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
              style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
            >
              {Ico.undo}
            </button>
          )
        })()}
        {cfg.statusIndex !== undefined && section !== "produccion" && (() => {
          const statusRow = rows[section]?.[rowIndex]
          const entity = String(statusRow?.[0] ?? "registro")
          const active = isStatusActive(statusRow?.[cfg.statusIndex!] ?? "Activo")
          if (!canDo(section, "ELIMINAR")) {
            return disabledAction(active ? "Anular" : "Reactivar", active ? Ico.ban : Ico.undo)
          }
          // Protected (administrador role, superadmin): the window explains why
          const locked = !!statusRow && (isStatusLocked(section, statusRow) || isPrincipalAdmin)
          return active || locked ? (
            <button
              type="button"
              title={locked ? "No se puede anular: ver motivo" : "Anular"}
              aria-label={locked ? `Ver por qué no se puede anular ${entity}` : `Anular ${entity}`}
              aria-haspopup="dialog"
              onClick={() => setAnulTarget({ section, idx: rowIndex })}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                locked ? "cursor-help opacity-50 hover:opacity-90" : "cursor-pointer hover:opacity-80"
              }`}
              style={{ color: C.red, background: `${C.red}12` }}
            >
              {Ico.ban}
            </button>
          ) : (
            <button
              type="button"
              title="Reactivar"
              aria-label={`Reactivar ${entity}`}
              onClick={() =>
                section === "usuarios"
                  ? setAnulTarget({ section, idx: rowIndex, reactivate: true })
                  : toggleStatus(section, rowIndex, cfg.statusIndex!)
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
              style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
            >
              {Ico.undo}
            </button>
          )
        })()}
        {cfg.statusIndex !== undefined ? (
          section === "producto" ? (
            canDo(section, "ELIMINAR") ? deleteButton : disabledAction("Eliminar", Ico.trash)
          ) : section === "ventas" ? null : (
            canDo(section, "ELIMINAR") &&
            !isPrincipalAdmin &&
            !noDelete &&
            canShowProductionDelete
              ? deleteButton
              : disabledAction("Eliminar", Ico.trash)
          )
        ) : section === "perdidas" ? null : noDelete ? (
          canDo(section, "ELIMINAR") ? (
            isAnulled ? (
              <button
                type="button"
                title="Reactivar"
                aria-label="Reactivar"
                onClick={() => reactivate(section, rowIndex)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
              >
                {Ico.undo}
              </button>
            ) : (
              <button
                type="button"
                title="Anular"
                aria-label="Anular"
                aria-haspopup="dialog"
                onClick={() => setAnulTarget({ section, idx: rowIndex })}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                style={{ color: C.red, background: `${C.red}12` }}
              >
                {Ico.ban}
              </button>
            )
          ) : disabledAction(isAnulled ? "Reactivar" : "Anular", isAnulled ? Ico.undo : Ico.ban)
        ) : canDo(section, "ELIMINAR") && !isPrincipalAdmin ? (
          deleteButton
        ) : (
          disabledAction("Eliminar", Ico.trash)
        )}
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <div
          className="search-control flex w-full min-w-0 items-center gap-2 rounded-full px-3 py-2 sm:w-72"
          style={{ background: t.input, border: `1px solid ${t.inputB}` }}
        >
          <span className="flex-shrink-0">
            {Ico.search}
          </span>
          <input
            ref={searchInputRef}
            key={`search-${section}`}
            placeholder="Buscar..."
            value={search[section] || ""}
            onChange={(event) => {
              setSearch((current) => ({
                ...current,
                [section]: event.target.value,
              }))
              setP(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{ color: t.text }}
          />
          {search[section] && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setSearch((current) => ({ ...current, [section]: "" }))
                setP(0)
              }}
              className="search-clear flex-shrink-0 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
        {filterGroups.length > 0 && (
          <select
            value={filterValue}
            onChange={(event) => {
              setTableFilter((current) => ({ ...current, [section]: event.target.value }))
              setP(0)
            }}
            aria-label="Filtrar la lista"
            className="cursor-pointer rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              background: filterValue ? `${C.mustard}18` : t.input,
              border: `1px solid ${filterValue ? C.mustard : t.inputB}`,
              color: filterValue ? C.mustard : t.muted,
            }}
          >
            <option value="">Filtrar: todos</option>
            {section === "insumos" && <option value="low::1">⚠ Solo stock bajo</option>}
            {filterGroups.map((group) => (
              <optgroup key={group.index} label={group.label}>
                {group.values.map((value) => (
                  <option key={value} value={`${group.index}::${value}`}>
                    {value}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
        {isProductionList && (
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{ background: prodDay ? `${C.mustard}18` : t.input, border: `1px solid ${prodDay ? C.mustard : t.inputB}` }}
          >
            <label htmlFor="production-day" className="text-xs font-semibold" style={{ color: prodDay ? C.mustard : t.muted }}>
              Día
            </label>
            <input
              id="production-day"
              type="date"
              value={prodDay}
              max={getCurrentDateTimeParts().date}
              onChange={(event) => {
                const today = getCurrentDateTimeParts().date
                setProdDay(event.target.value > today ? today : event.target.value)
                setP(0)
              }}
              className="cursor-pointer bg-transparent text-xs outline-none"
              style={{ color: t.text }}
            />
            {prodDay !== getCurrentDateTimeParts().date && (
              <button
                type="button"
                onClick={() => {
                  setProdDay(getCurrentDateTimeParts().date)
                  setP(0)
                }}
                className="cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.mustard}18`, color: C.mustard }}
              >
                Hoy
              </button>
            )}
            {prodDay && (
              <button
                type="button"
                aria-label="Ver todos los días"
                title="Ver todos los días"
                onClick={() => {
                  setProdDay("")
                  setP(0)
                }}
                className="cursor-pointer px-1 text-sm"
                style={{ color: t.muted }}
              >
                ×
              </button>
            )}
          </div>
        )}
        {/* Short search on the left, action buttons pushed to the right */}
        <div className="hidden sm:block sm:flex-1" />
        {section === "perdidas" && (
          <span
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: `${C.red}10`, color: C.red }}
            title="Cantidad perdida × costo unitario actual de cada insumo (sin lo devuelto a compra)"
          >
            Valor perdido: {fmt(Math.round(filtered.reduce((sum, { row }) => sum + lossValue(row), 0)))}
          </span>
        )}
        {!noExp && (
          <button
            type="button"
            onClick={exportRows}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs cursor-pointer"
            style={{
              background: t.input,
              border: `1px solid ${t.inputB}`,
              color: t.muted,
            }}
          >
            {Ico.download} Exportar
          </button>
        )}
        {canDo(section, "CREAR") && (
          <button
            type="button"
            onClick={() => openAdd(section)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer hover:opacity-90"
            style={{ background: C.mustard, color: "#fff" }}
          >
            {Ico.plus} Nuevo
          </button>
        )}
      </div>
      {quickTabs.length > 0 && (
        <div role="radiogroup" aria-label="Filtro rápido" className="-mt-1 mb-4 flex flex-wrap gap-1.5">
          {[{ label: "Todos", test: () => true }, ...quickTabs].map((tab) => {
            const on = (quickTab?.label ?? "Todos") === tab.label
            const count = beforeStatus.filter(({ row }) => tab.test(row)).length
            return (
              <button
                key={tab.label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setQuickFilter((current) => ({ ...current, [section]: tab.label === "Todos" ? "" : tab.label }))
                  setP(0)
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={
                  on
                    ? { background: C.mustard, color: "#fff", border: `1px solid ${C.mustard}` }
                    : { background: t.input, color: t.muted, border: `1px solid ${t.inputB}` }
                }
              >
                {tab.label}
                <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: on ? "rgba(255,255,255,0.25)" : t.card }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {isProductionList && (
        // One button per status with how many orders it has (for the search and day chosen)
        <div role="radiogroup" aria-label="Filtrar por estado" className="-mt-1 mb-4 flex flex-wrap gap-1.5">
          {[["", "Todos"] as const, ...PRODUCTION_STATUSES.map((status) => [status, status] as const)].map(([value, label]) => {
            const on = prodStatus === value
            const count = value ? beforeStatus.filter(({ row }) => orderStatus(row) === value).length : beforeStatus.length
            const badge = value ? badgeSt(value) : null
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setProdStatus(value)
                  setP(0)
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={
                  on
                    ? { background: C.mustard, color: "#fff", border: `1px solid ${C.mustard}` }
                    : { background: t.input, color: t.muted, border: `1px solid ${t.inputB}` }
                }
              >
                {badge && !on && <span className="h-2 w-2 rounded-full" style={{ background: badge.color }} />}
                {label}
                <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: on ? "rgba(255,255,255,0.25)" : t.card }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div
        className="min-w-0 overflow-hidden rounded-2xl"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="hidden min-[1180px]:block">
          <table className="w-full table-fixed text-xs">
            <colgroup>
              {isProducto && <col style={{ width: "60px" }} />}
              {Array.from({ length: columnCount }, (_, index) => (
                <col key={index} />
              ))}
              {/* Ver, Editar, (Anular), Eliminar: 32 px per button so they fit in one row */}
              <col style={{ width: cfg.statusIndex !== undefined && section !== "produccion" ? "152px" : "116px" }} />
            </colgroup>
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${t.border}`,
                  background: t.cardAlt,
                }}
              >
                {isProducto && (
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: t.muted }}
                  >
                    Img
                  </th>
                )}
                {Array.from({ length: columnCount }, (_, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-2 py-3 text-left align-top text-[10px] font-bold uppercase leading-tight tracking-wide break-words [overflow-wrap:anywhere]"
                    style={{ color: t.muted }}
                  >
                    {visibleColumns[index] || `Dato ${index + 1}`}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: t.muted }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Still reading this module from the backend: grey shimmering rows instead of "Sin registros" */}
              {pageRows.length === 0 && !loadedSections.has(section) && syncIdIndex(section) !== undefined &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`skeleton-${i}`} aria-hidden="true" style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td colSpan={columnCount + (isProducto ? 2 : 1)} className="px-4 py-3.5">
                      <div className="flex items-center gap-4">
                        {[38, 22, 16, 12].map((w, j) => (
                          <div key={j} className="admin-skeleton h-3 rounded-full" style={{ width: `${w - i * 2}%` }} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              {pageRows.length === 0 && (loadedSections.has(section) || syncIdIndex(section) === undefined) && (
                <tr>
                  <td
                    colSpan={columnCount + (isProducto ? 2 : 1)}
                    className="px-4 py-12 text-center text-sm"
                    style={{ color: t.subtle }}
                  >
                    {emptyState}
                  </td>
                </tr>
              )}
              {pageRows.map(({ row, index: originalIndex }, rowIndex) => {
                // Voided: marked in this session, or saved as «Anulado/Anulada» in its status (stays after reloading)
                const isAnulled = anulSet.has(originalIndex) || (cfg.statusIndex !== undefined && ["Anulado", "Anulada"].includes(String(row[cfg.statusIndex] ?? "")))
                const isPrincipalAdmin =
                  section === "usuarios" && String(row[8] ?? "") === "Principal"
                const isLow =
                  section === "insumos" &&
                  Number(row[4]) <= Number(row[5])
                const isSupplyProduct =
                  section === "insumos" &&
                  String(row[7]).toLowerCase() === "sí"
                const isLocalClient =
                  section === "clientes" &&
                  String(row[6]).toLowerCase() === "sí"
                const isSuperAdmin = isSuperAdminRow(section, row)
                const displayCellIndexes = getDisplayCellIndexes(row)
                const displayCells = getDisplayCells(row)
                return (
                  <tr
                    key={originalIndex}
                    className={
                      savedHighlight?.section === section && savedHighlight.key && String(row[0] ?? "") === savedHighlight.key
                        ? "admin-row-saved"
                        : undefined
                    }
                    style={{
                      borderBottom:
                        rowIndex < pageRows.length - 1
                          ? `1px solid ${t.border}`
                          : "none",
                      opacity: isAnulled ? 0.45 : 1,
                      background: isLow ? "rgba(165,65,49,0.18)" : "transparent",
                    }}
                    onMouseEnter={(event) =>
                      (event.currentTarget.style.background = isLow
                        ? "rgba(165,65,49,0.28)"
                        : t.hover)
                    }
                    onMouseLeave={(event) =>
                      (event.currentTarget.style.background = isLow
                        ? "rgba(165,65,49,0.18)"
                        : "transparent")
                    }
                  >
                    {isProducto && (
                      <td className="px-2 py-3 align-top">
                        <div
                          className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
                          style={{ background: t.input }}
                        >
                          {prodImgs[originalIndex] || sodaImage(row[0]) ? (
                            <img
                              src={prodImgs[originalIndex] || sodaImage(row[0])}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      </td>
                    )}
                    {displayCells.map((cell, cellIndex) => {
                      const rowCellIndex = displayCellIndexes[cellIndex]
                      const displayCell = formatDisplayCell(cell, rowCellIndex, row)
                      return (
                        <td
                          key={rowCellIndex}
                          className="min-w-0 px-2 py-3 align-top text-xs leading-snug break-words [overflow-wrap:anywhere]"
                        >
                          {rowCellIndex === cfg.statusIndex && !isPrincipalAdmin ? (
                            renderStatusControl(originalIndex, rowCellIndex)
                          ) : isProducto && rowCellIndex === 2 && isSodaName(row[0]) ? (
                            renderSodaPrice(row)
                          ) : section === "cat-producto" && rowCellIndex === 1 ? (
                            renderCategoryProductCount(row)
                          ) : cellIndex === 0 && (isSupplyProduct || isLocalClient || isSuperAdmin || isLow || section === "cat-insumos") ? (
                            <div className="min-w-0">
                              {renderCellValue(cell, true, isLow)}
                              {renderNameChips(row, isLow, isSupplyProduct, isLocalClient, isSuperAdmin)}
                            </div>
                          ) : (
                            renderCellValue(
                              displayCell,
                              cellIndex === 0,
                              isLow,
                              section === "usuarios" && rowCellIndex === 0 && isPrincipalAdmin,
                            )
                          )}
                        </td>
                      )
                    })}
                    <td className="px-2 py-3 align-top">
                      {renderActions(originalIndex, isAnulled)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="min-[1180px]:hidden">
          {pageRows.length === 0 ? (
            <div
              className="px-4 py-12 text-center text-sm"
              style={{ color: t.subtle }}
            >
              {emptyState}
            </div>
          ) : (
            pageRows.map(({ row, index: originalIndex }, rowIndex) => {
              // Voided: marked in this session, or saved as «Anulado/Anulada» in its status (stays after reloading)
              const isAnulled = anulSet.has(originalIndex) || (cfg.statusIndex !== undefined && ["Anulado", "Anulada"].includes(String(row[cfg.statusIndex] ?? "")))
              const isPrincipalAdmin =
                section === "usuarios" && String(row[8] ?? "") === "Principal"
              const isLow =
                section === "insumos" &&
                Number(row[4]) <= Number(row[5])
              const isSupplyProduct =
                section === "insumos" &&
                String(row[7]).toLowerCase() === "sí"
              const isLocalClient =
                section === "clientes" &&
                String(row[6]).toLowerCase() === "sí"
              const isSuperAdmin = isSuperAdminRow(section, row)
              const displayCellIndexes = getDisplayCellIndexes(row)
              const displayCells = getDisplayCells(row)
              return (
                <article
                  key={originalIndex}
                  className="min-w-0 p-3 sm:p-4"
                  style={{
                    borderBottom:
                      rowIndex < pageRows.length - 1
                        ? `1px solid ${t.border}`
                        : "none",
                    opacity: isAnulled ? 0.45 : 1,
                    background: isLow ? "rgba(165,65,49,0.18)" : "transparent",
                  }}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    {isProducto && (
                      <div
                        className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl"
                        style={{ background: t.input }}
                      >
                        {prodImgs[originalIndex] || sodaImage(row[0]) ? (
                          <img
                            src={prodImgs[originalIndex] || sodaImage(row[0])}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-sm font-semibold leading-snug break-words [overflow-wrap:anywhere]">
                      {renderCellValue(displayCells[0] ?? "—", true, isLow)}
                      {renderNameChips(row, isLow, isSupplyProduct, isLocalClient, isSuperAdmin)}
                    </div>
                    {renderActions(originalIndex, isAnulled)}
                  </div>
                  <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-2">
                    {displayCells.slice(1).map((cell, cellIndex) => {
                      const visibleIndex = cellIndex + 1
                      const rowCellIndex = displayCellIndexes[visibleIndex]
                      return (
                        <div key={rowCellIndex} className="contents">
                          <dt
                            className="min-w-0 text-[11px] font-semibold leading-snug break-words [overflow-wrap:anywhere]"
                            style={{ color: t.subtle }}
                          >
                            {visibleColumns[visibleIndex] ||
                              `Dato ${visibleIndex + 1}`}
                          </dt>
                          <dd
                            className="min-w-0 text-xs leading-snug break-words [overflow-wrap:anywhere]"
                            style={{ fontWeight: 500 }}
                          >
                            {rowCellIndex === cfg.statusIndex && !isPrincipalAdmin ? (
                              renderStatusControl(originalIndex, rowCellIndex)
                            ) : isProducto && rowCellIndex === 2 && isSodaName(row[0]) ? (
                              renderSodaPrice(row)
                            ) : section === "cat-producto" && rowCellIndex === 1 ? (
                              renderCategoryProductCount(row)
                            ) : (
                              renderCellValue(
                                formatDisplayCell(cell, rowCellIndex, row),
                              )
                            )}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </article>
              )
            })
          )}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <span className="text-xs" style={{ color: t.subtle }}>
            {filtered.length} registros · Pág {cur + 1}/{totalPages}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            <button
              type="button"
              disabled={cur === 0}
              onClick={() => setP(cur - 1)}
              className="pagination-control h-7 w-7 rounded text-xs cursor-pointer disabled:opacity-30"
              style={{ background: t.input, color: t.muted }}
            >
              ←
            </button>
            {visiblePages.map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => setP(index)}
                className="pagination-control h-7 w-7 rounded text-xs font-semibold cursor-pointer"
                aria-current={index === cur ? "page" : undefined}
                style={{
                  background: index === cur ? C.mustard : "transparent",
                  color: index === cur ? "#fff" : t.muted,
                }}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={cur >= totalPages - 1}
              onClick={() => setP(cur + 1)}
              className="pagination-control h-7 w-7 rounded text-xs cursor-pointer disabled:opacity-30"
              style={{ background: t.input, color: t.muted }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
