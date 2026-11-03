import { Fragment } from "react"
import { MOD_CFG, NATURAL_SUPPLIER_KEYS, NATURAL_SUPPLIER_VIEW_KEYS, PAYMENT_NEXT, PURCHASE_ENTITIES, RETURNED_LOSS, STOCK_ORIGIN } from "@/features/admin/config/modules"
import { DB_SYNC } from "@/features/admin/services/sync.service"
import { derivePedidoPayment, isActiveStatus, isCounterClientRow, isNaturalSupplier, isReturnedLoss, isStaffRole, parseMainSupplies, parsePurchaseLines, saleTypeOf, supplierDocument } from "@/features/admin/utils/rows"
import { SAUCES, SODA_PRODUCT, SODA_RE, currentCategory, isSodaName, sodaImage } from "@/features/menu/data/products"
import { loadOrders } from "@/features/orders/services/orders.service"
import { ORDER_STEPS, isTransferPaymentMethod } from "@/features/orders/utils/orders"
import FieldError from "@/shared/components/FieldError"
import { Ico } from "@/shared/components/icons"
import { FIRST_DAY, MAX_PRICE } from "@/shared/constants"
import { C, badgeSt } from "@/shared/styles/theme"
import type { AddressParts, AdminOrderLine, FieldType, ProductionItem, Row, TechnicalIngredient } from "@/shared/types"
import { ADDRESS_VIAS, HOUSING, composeAddress } from "@/shared/utils/address"
import { fmt, normalizeName, splitNames, toDecimal } from "@/shared/utils/format"
import { RECIPE_UNIT_SUGGESTIONS, compatibleUnits, convertQty, convertibleUnits } from "@/shared/utils/units"
import { normalizeDocumentInput, normalizePhoneInput } from "@/shared/utils/validation"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

// Called as a plain function ({CRUDModal()}), not <CRUDModal />: a component
// declared inside AdminPanel is a new type on every render, which remounted the
// form on each keystroke and dropped input focus. Keep hooks out of here.
export default function CRUDModal(adminState: AdminPanelState): ReactNode {
  const {
    ORDER_TO_PRODUCTION,
    PNC_UNITS,
    RolesPermMatrix,
    anulled,
    approveOrderForProduction,
    canDo,
    clientFormError,
    closeModal,
    requestCloseModal,
    discardAsk,
    setDiscardAsk,
    costOf,
    fileInputRef,
    formData,
    formFieldErrors,
    formReturn,
    formValidationAttempted,
    getAdminOrderLines,
    getAutoTechVersion,
    getAvailableInsumos,
    getAvailableProductos,
    getCurrentDateTimeParts,
    getNonconformingItemUnit,
    getNonconformingItems,
    getNonconformingProductOptions,
    getPreparationSteps,
    getProductRecipe,
    getProductionOrderItems,
    getRequiredFormKeys,
    getSaleOrderLines,
    getSupplierPurchases,
    handleFile,
    imgPreview,
    isLossOfPurchase,
    isLossPurchaseAnnulled,
    isRequiredField,
    isStatusActive,
    lossDraft,
    lossError,
    lossReturnError,
    lossReturnQty,
    lossReturnReason,
    lossReturnSaving,
    lossValue,
    modal,
    openAdd,
    openChildForm,
    openEdit,
    openProductionPnc,
    orderDetailOpen,
    parseProductionHistory,
    parsePurchaseItems,
    paymentProofDraft,
    paymentProofs,
    pedidoAdditionsFor,
    pedidoOrderLines,
    pedidoProductCategory,
    pedidoProductQuantity,
    pedidoProductSearch,
    pedidoProductoSelect,
    pedidoSearchOpen,
    pncManual,
    pncOrderPick,
    productionAdditionParentId,
    productionFormError,
    productionItemEdit,
    productionItemQuantity,
    productionItemUnit,
    productionItems,
    productionKind,
    productionProductSelect,
    productionSearch,
    productionSelectedSauces,
    purchaseConfirmOpen,
    purchaseFormError,
    purchaseItemEdit,
    purchaseItemPrice,
    purchaseItemQty,
    purchaseItemSelect,
    purchaseLabel,
    purchaseLossMax,
    purchaseNotice,
    purchaseSupplySearch,
    returnLossToPurchase,
    rows,
    saleReturnBlock,
    saveModal,
    saveError,
    saving,
    sellerName,
    setClientOrderStatus,
    setFormData,
    setFormFieldErrors,
    setImgPreview,
    setLossDraft,
    setLossError,
    setLossReturnError,
    setLossReturnQty,
    setLossReturnReason,
    setModal,
    setOrderDetailOpen,
    setOrderPayment,
    setPaymentProofDraft,
    setPaymentRejectionError,
    setPaymentRejectionReason,
    setPaymentRejectionTarget,
    setPedidoAdditionsFor,
    setPedidoOrderLines,
    setPedidoProductCategory,
    setPedidoProductQuantity,
    setPedidoProductSearch,
    setPedidoProductoSelect,
    setPedidoSearchOpen,
    setPncManual,
    setPncOrderPick,
    setProductionAdditionParentId,
    setProductionFormError,
    setProductionItemEdit,
    setProductionItemQuantity,
    setProductionItemUnit,
    setProductionItems,
    setProductionKind,
    setProductionProductSelect,
    setProductionSearch,
    setProductionSelectedSauces,
    setPurchaseConfirmOpen,
    setPurchaseFormError,
    setPurchaseItemEdit,
    setPurchaseItemPrice,
    setPurchaseItemQty,
    setPurchaseItemSelect,
    setPurchaseNotice,
    setPurchaseSupplySearch,
    setQuickClientError,
    setQuickClientErrors,
    setQuickClientForm,
    setQuickClientOpen,
    setRows,
    setSection,
    setSupplierPickerOpen,
    setSupplierPickerQuery,
    setSupplierSupplyOpen,
    setSupplierSupplySearch,
    setSupplyFormError,
    setSupplySuppliers,
    setTechnicalIngredientQuantity,
    setTechnicalIngredientSearch,
    setTechnicalIngredientSelect,
    setTechnicalIngredientUnit,
    setTechnicalIngredients,
    setTechnicalSheetError,
    setTechnicalSheetOpen,
    setTechnicalStepDraft,
    setTechnicalStepEdit,
    setTechnicalSteps,
    shownFieldError,
    sodaOptions,
    sodaProductRow,
    stockMoves,
    stockOf,
    supplierPickerOpen,
    supplierPickerQuery,
    supplierSupplyOpen,
    supplierSupplySearch,
    supplyDetail,
    supplySuppliers,
    syncRow,
    t,
    technicalIngredientQuantity,
    technicalIngredientSearch,
    technicalIngredientSelect,
    technicalIngredientUnit,
    technicalIngredients,
    technicalSheetError,
    technicalSheetOpen,
    technicalStepDraft,
    technicalStepEdit,
    technicalSteps,
    updateAdminField,
    user,
    validateManagedForm,
  } = adminState
  if (!modal.mode) return null
  const cfg = MOD_CFG[modal.section]
  if (!cfg) return null
  const isView = modal.mode === "view"
  const isRoles = modal.section === "roles"
  const isProduct = modal.section === "producto"
  const isProductCategory = modal.section === "cat-producto"
  const isPedido = modal.section === "pedidos"
  const isPurchase = modal.section === "compras"
  const isSupply = modal.section === "insumos"
  // "Lo preparamos nosotros" checked: on wide screens the ficha técnica goes beside the insumo's fields (no long scroll)
  const sheetBeside = isSupply && modal.mode !== "view" && String(formData["7"] ?? "").toLowerCase() === "sí"
  const isProduction = modal.section === "produccion"
  const isPnc = modal.section === "producto-no-conforme"
  const isSales = modal.section === "ventas"
  const isReturns = modal.section === "devoluciones"
  const isClient = modal.section === "clientes"
  const isSupplier = modal.section === "proveedores"
  const isUser = modal.section === "usuarios"
  const row = modal.idx !== null ? rows[modal.section]?.[modal.idx] : null
  const isPrincipalAdminUser =
    isUser && String(row?.[8] ?? "") === "Principal"
  const orderDetails = isPedido ? getAdminOrderLines(row || undefined) : []
  const saleOrderLines = getSaleOrderLines(isSales ? row : null)
  const saleOrderIndex = isSales
    ? rows.pedidos?.findIndex((order) => order[0] === row?.[9]) ?? -1
    : -1
  // Purchase module (Compras) gets a compact 2-column form and a formatted detail view
  // Modules with the compact form: narrow 2-column modal, titled by entity,
  // formatted detail view ("isPurchaseModule" started with Compras, now shared)
  const purchaseEntity = PURCHASE_ENTITIES[modal.section]
  const isPurchaseModule = !!purchaseEntity
  // Sellers: active staff users (from the backend) plus whoever is logged in
  const sellerOptions = [
    ...new Set([
      sellerName,
      ...(rows.usuarios || []).filter((r) => isActiveStatus(r[5]) && isStaffRole(r[3])).map((r) => String(r[0])),
    ]),
  ].filter(Boolean)
  // Loss responsible: active staff (not clients), plus whoever is logged in and the saved value
  const staffOptions = [
    ...new Set([
      sellerName,
      ...(rows.usuarios || []).filter((r) => isStaffRole(r[3]) && isActiveStatus(r[5])).map((r) => String(r[0])),
      String(formData["3"] ?? ""),
    ]),
  ].filter(Boolean)
  const namesOf = (sec: string) =>
    (rows[sec] || []).map((r) => String(r[0] ?? "")).filter(Boolean)
  // Sections whose first field is a name/main choice that reads better full width
  const WIDE_FIRST_FIELD = ["cat-insumos", "proveedores", "compras", "perdidas", "cat-producto", "clientes", "pedidos"]
  const isWideField = (f: FieldType) =>
    (f.key === "0" && (WIDE_FIRST_FIELD.includes(modal.section) || !isSupplier)) ||
    f.type === "textarea" ||
    (isSales && f.key === "8") ||
    f.type === "checkbox" ||
    (modal.section === "proveedores" && (f.key === "5" || f.key === "7")) ||
    (modal.section === "perdidas" && f.key === "10") ||
    (modal.section === "clientes" && f.key === "5")
  const splitList = (value: string) =>
    value.split(",").map((item) => item.trim()).filter(Boolean)
  const supplyInfo = (name: string) =>
    (rows.insumos || []).find((supply) => String(supply[0]) === name)
  // Insumos the supplier sells (supplier row[7]), limited to insumos that still exist
  const supplierSupplies = (supplierName: string) => {
    const supplier = (rows.proveedores || []).find((p) => String(p[0]) === supplierName)
    // A soda can be bought before it exists as an insumo (the purchase creates it)
    return splitList(String(supplier?.[7] ?? "")).filter(
      (name) => supplyInfo(name) || isSodaName(name),
    )
  }
  const renderSupplyGroups = (names: string[], className: string, onRemove?: (name: string) => void) => {
    const groups = new Map<string, string[]>()
    names.forEach((name) => {
      const category = currentCategory(String(supplyInfo(name)?.[1] ?? "").trim()) || (isSodaName(name) ? "Bebidas" : "Sin categoría")
      groups.set(category, [...(groups.get(category) || []), name])
    })
    return (
      <div className={`grid gap-2 ${className}`}>
        {[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([category, list]) => (
          <div key={category} className="min-w-0 rounded-xl px-3 py-2" style={{ background: t.input, border: `1px solid ${t.border}` }}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>
              <span className="min-w-0 truncate">{category}</span>
              <span>{list.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.sort((a, b) => a.localeCompare(b)).map((name) =>
                onRemove ? (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onRemove(name)}
                    aria-label={`Quitar ${name}`}
                    className="flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: `${C.mustard}18`, color: C.mustard }}
                  >
                    {name} <span aria-hidden="true">×</span>
                  </button>
                ) : (
                  <span key={name} className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                    {name}
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  const supplierDetail = (r: Row) => {
    const v = (i: number) => String(r[i] ?? "").trim() || "—"
    const natural = isNaturalSupplier(r[15])
    const supplies = splitList(String(r[7] ?? ""))
    const status = String(r[6] ?? "")
    const doc = supplierDocument(r)
    // Any purchase (even annulled) keeps the supplier from being deleted
    const purchases = getSupplierPurchases(String(r[0] ?? ""))
    const purchasesTotal = purchases.reduce((sum, p) => sum + (Number(p[4]) || 0), 0)
    const sectionTitle = (title: string) => (
      <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>
        {title}
      </h4>
    )
    const purchasesNote = purchases.length
      ? "Como tiene compras registradas, este proveedor no se puede eliminar."
      : "No tiene compras registradas: se puede eliminar si ya no lo necesitas."
    const statusBadge = status && (
      <span
        className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
        style={{ background: badgeSt(status)?.bg ?? t.input, color: badgeSt(status)?.color ?? t.muted }}
      >
        {status}
      </span>
    )
    if (!natural) {
      const iconTile = (icon: React.ReactNode, size = "h-8 w-8") => (
        <span
          className={`flex ${size} flex-shrink-0 items-center justify-center rounded-lg`}
          style={{ background: `${C.mustard}14`, color: C.mustard }}
        >
          {icon}
        </span>
      )
      const line = (icon: React.ReactNode, label: string, value: string) => (
        <div className="flex min-w-0 items-center gap-3">
          {iconTile(icon)}
          <div className="min-w-0">
            <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
            <div className="truncate text-sm" title={value} style={{ color: value === "—" ? t.muted : t.text }}>{value}</div>
          </div>
        </div>
      )
      const card = (title: string, children: React.ReactNode) => (
        <div className="flex min-w-0 flex-col gap-2.5 rounded-xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
          {sectionTitle(title)}
          {children}
        </div>
      )
      const contactInitials =
        v(4) === "—" ? "?" : v(4).split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
      return (
        <div className="flex min-w-0 flex-col gap-3 sm:col-span-2 lg:col-span-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3" style={{ background: t.cardAlt }}>
            {iconTile(Ico.shopping, "h-11 w-11")}
            <div className="min-w-0 flex-1">
              <div className="break-words text-base font-semibold" style={{ color: t.text }}>{v(0)}</div>
              <div className="text-xs" style={{ color: t.muted }}>
                Persona jurídica · NIT <span style={{ color: t.text }}>{v(1)}</span>
              </div>
            </div>
            {statusBadge}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {card("Datos de la empresa", (
              <>
                {line(Ico.phone, "Teléfono", v(3))}
                {line(Ico.mail, "Correo", v(2))}
                {line(Ico.mapPin, "Dirección", v(5))}
              </>
            ))}
            {card("Persona de contacto", (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    {contactInitials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm" style={{ color: t.text }}>{v(4)}</div>
                    <div className="truncate text-[11px]" style={{ color: t.muted }}>
                      {v(14) === "—" ? "Sin cargo" : v(14)} · {doc}
                    </div>
                  </div>
                </div>
                {line(Ico.phone, "Teléfono", v(12))}
                {line(Ico.mail, "Correo", v(13))}
              </>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="min-w-0 rounded-xl px-4 py-3 sm:col-span-2" style={{ border: `1px solid ${t.border}` }}>
              {sectionTitle(`Insumos que suministra (${supplies.length})`)}
              {supplies.length ? (
                renderSupplyGroups(supplies, "sm:grid-cols-2")
              ) : (
                <span className="text-sm" style={{ color: t.muted }}>Sin insumos asignados.</span>
              )}
            </div>
            {card("Compras", (
              <>
                {line(Ico.cart, "Compras registradas", String(purchases.length))}
                <div className="flex min-w-0 items-center gap-3">
                  {iconTile(Ico.cash)}
                  <div className="min-w-0">
                    <div className="text-[11px]" style={{ color: t.muted }}>Total comprado</div>
                    <div className="truncate text-base font-semibold" style={{ color: C.mustard }}>{fmt(purchasesTotal)}</div>
                  </div>
                </div>
                <p className="mt-auto border-t pt-2 text-[11px] leading-snug" style={{ color: t.muted, borderColor: t.border }}>
                  {purchasesNote}
                </p>
              </>
            ))}
          </div>
        </div>
      )
    }
    // Label above value, two per row: light and easy to scan
    const block = (title: string, items: [string, string][]) => (
      <div className="min-w-0 rounded-xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
        {sectionTitle(title)}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {items.map(([label, value]) => (
            <div key={label} className={`min-w-0 ${label === "Dirección" || label === "Correo" ? "col-span-2" : ""}`}>
              <dt className="text-[11px]" style={{ color: t.muted }}>{label}</dt>
              <dd className="break-words text-sm" style={{ color: value === "—" ? t.muted : t.text }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )
    return (
      <div className="flex min-w-0 flex-col gap-3 sm:col-span-2 lg:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: t.cardAlt }}>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>
              Persona natural
            </div>
            <div className="break-words text-base font-semibold" style={{ color: t.text }}>{v(0)}</div>
          </div>
          {statusBadge}
        </div>
        {block("Datos de la persona", [
          ["Documento", doc],
          ["Teléfono", v(3)],
          ["Correo", v(2)],
          ["Dirección", v(5)],
        ])}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="min-w-0 rounded-xl px-4 py-3 sm:col-span-2" style={{ border: `1px solid ${t.border}` }}>
            {sectionTitle(`Insumos que suministra (${supplies.length})`)}
            {supplies.length ? (
              renderSupplyGroups(supplies, "")
            ) : (
              <span className="text-sm" style={{ color: t.muted }}>Sin insumos asignados.</span>
            )}
          </div>
          <div className="grid content-start grid-cols-2 gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: t.input }}>
            <div>
              <div className="text-xs font-semibold" style={{ color: t.muted }}>Compras registradas</div>
              <div className="text-lg font-bold" style={{ color: t.text }}>{purchases.length}</div>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: t.muted }}>Total comprado</div>
              <div className="text-lg font-bold" style={{ color: C.mustard }}>{fmt(purchasesTotal)}</div>
            </div>
            <div className="col-span-2 text-xs" style={{ color: t.muted }}>
              {purchasesNote}
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Profit of one unit of a product: its price minus what its insumos cost
  const renderProfit = (price: number, cost: number) => {
    const profit = price - cost
    const margin = price > 0 ? Math.round((profit / price) * 100) : 0
    const good = profit > 0
    return (
      <div className="rounded-xl px-3 py-3" style={{ background: good ? "rgba(46,125,96,0.08)" : `${C.red}0d`, border: `1px solid ${good ? "rgba(46,125,96,0.25)" : `${C.red}30`}` }}>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: good ? "#2E7D60" : C.red, fontFamily: "League Spartan, sans-serif" }}>
          Ganancias por unidad
        </div>
        {price > 0 ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {([
              ["Precio de venta", fmt(price), t.text],
              ["Costo de insumos", fmt(Math.round(cost)), t.text],
              ["Ganancia", `${fmt(Math.round(profit))} (${margin}%)`, good ? "#2E7D60" : C.red],
            ] as const).map(([label, value, color]) => (
              <div key={label} className="min-w-0">
                <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                <div className="break-words text-sm font-semibold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: t.muted }}>Ponle precio al producto para ver la ganancia.</p>
        )}
        {price > 0 && !good && (
          <p className="mt-2 text-[11px]" style={{ color: C.red }}>El precio no cubre el costo de los insumos.</p>
        )}
      </div>
    )
  }
  const formatViewValue = (f: FieldType, raw: string) => {
    if (!raw || raw === "—") return "—"
    if (f.type === "date") {
      const d = new Date(`${raw}T00:00:00`)
      return Number.isNaN(d.getTime())
        ? raw
        : d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    }
    if (f.type === "number" && /costo|subtotal|total/i.test(f.label)) return fmt(Number(raw))
    if (isSupply && ["4", "5", "6"].includes(f.key))
      return `${Number(raw).toLocaleString("es-CO")} ${String(row?.[2] ?? "")}`.trim()
    return raw
  }
  const statusValue =
    cfg.statusIndex !== undefined && row ? String(row[cfg.statusIndex] ?? "") : ""
  const dataFields = cfg.fields.filter((f) => f.type !== "image")
  const productCategory = normalizeName(currentCategory(String(isView ? row?.[1] ?? "" : formData["1"] ?? "")))
  const hideProductTechnicalSheet = isProduct && productCategory === normalizeName(SODA_PRODUCT)
  const showSupplyTechnicalSheet =
    isSupply &&
    String(isView ? row?.[7] : formData["7"]).toLowerCase() === "sí"
  const supplierFieldKeys = !isSupplier || !isNaturalSupplier(isView ? row?.[15] : formData["15"])
    ? null
    : isView
      ? NATURAL_SUPPLIER_VIEW_KEYS
      : NATURAL_SUPPLIER_KEYS
  const naturalSupplierForm = !!supplierFieldKeys
  const formDataFields = supplierFieldKeys
    ? supplierFieldKeys.map((key) => dataFields.find((field) => field.key === key)!)
    : isProduction
    ? dataFields.filter((field) => !["0", "1", "3", "4"].includes(field.key))
    : isPnc
      ? dataFields.filter((field) => !["0", "1", "2", "6"].includes(field.key))
    : isSupply
      ? dataFields.filter(
          (field) =>
            // "Stock actual" isn't entered when creating: it starts at 0
            !(modal.mode === "add" && field.key === "4") &&
            // The unit cost is set by each purchase (its unit price): only the detail shows it
            !(modal.mode !== "view" && field.key === "3") &&
            (!["8", "9", "10", "11"].includes(field.key) || showSupplyTechnicalSheet),
        )
    : isUser
      ? dataFields.filter(
          (field) =>
            // The new user receives a provisional password by e-mail (blank on edit = keep it)
            !(modal.mode === "add" && field.key === "6"),
        )
      : modal.section === "domicilios" && modal.mode === "edit"
        ? dataFields.filter((field) => field.key !== "0")
      : dataFields
  const productMainFields = isProduct
    ? dataFields.filter(
        (field) => ["0", "1", "2", "3", "10", ...(formData["1"] === SODA_PRODUCT ? ["14"] : [])].includes(field.key),
      )
    : dataFields
  // A drink (category «Bebidas») is a finished product: no ficha técnica, its own compact layout
  const isDrinkForm = isProduct && !isView && formData["1"] === SODA_PRODUCT
  const isDrinkView = isProduct && isView && row?.[1] === SODA_PRODUCT
  // The product form fields (name, category, price, description): left column, or right for a drink
  const renderProductFields = () => (
    <div className={isView ? "hidden" : "grid gap-3 sm:grid-cols-2"}>
    {productMainFields.map((f) => {
      if (isView) return null
      const val = isView
        ? String(row ? (row[Number(f.key)] ?? "—") : "—")
        : formData[f.key] || ""
      // Categories come only from "Categ. Producto" (active), deduplicated
      // ignoring case/accents so the same category never appears twice
      const productFieldOptions =
        f.key === "1"
          ? [
              ...(rows["cat-producto"] || [])
                .filter((category) => String(category[2] ?? "Activa").toLowerCase() !== "inactiva")
                .map((category) => String(category[0] ?? "").trim())
                .filter(Boolean),
              "Producto de insumo",
            ]
              .filter(
                (name, index, all) =>
                  all.findIndex((other) => normalizeName(other) === normalizeName(name)) === index,
              )
              .sort((a, b) => a.localeCompare(b))
          : f.options
      return (
        <div key={f.key} className={`flex min-w-0 flex-col gap-1.5 ${f.key === "0" || f.key === "3" ? "sm:col-span-2" : ""}`}>
          <label
            className="text-xs font-semibold"
            style={{ color: shownFieldError(f.key) ? C.red : t.muted }}
          >
            {f.key === "0" && formData["1"] === SODA_PRODUCT && !isView ? "Nombre (sabor o marca si es gaseosa)" : f.label}
            {(isRequiredField(f.key) ||
              getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key)) && " *"}
          </label>
          {isView ? (
            <div
              className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm"
              style={{ background: t.input, color: t.text }}
            >
              {val}
            </div>
          ) : f.type === "select" ? (
            <select
              value={val}
              disabled={isPedido && f.key === "7"}
              onChange={(e) =>
                updateAdminField(modal.section, f.key, e.target.value)
              }
              onBlur={() =>
                getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
              }
              aria-invalid={!!formFieldErrors[f.key]}
              className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              title={
                isPedido && f.key === "7"
                  ? "El pago solo cambia al aprobar o rechazar el comprobante en el detalle del pedido."
                  : undefined
              }
              style={{
                background: t.input,
                border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                color: val ? t.text : t.muted,
                opacity: isPedido && f.key === "7" ? 0.7 : 1,
              }}
            >
              <option value="">Selecciona...</option>
              {productFieldOptions?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              value={val}
              onChange={(e) =>
                updateAdminField(modal.section, f.key, e.target.value)
              }
              onBlur={() =>
                getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
              }
              aria-invalid={!!formFieldErrors[f.key]}
              rows={isPurchaseModule || isProduct ? 2 : 3}
              className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{
                background: t.input,
                border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                color: t.text,
              }}
            />
          ) : f.key === "2" && normalizeName(String(formData["1"] ?? "")) === "salsas" ? (
            // Sauces are always free: no price to type (saved as 0)
            <div
              className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: t.cardAlt, border: `1.5px dashed ${t.inputB}`, color: "#2E7D60" }}
              title="Las salsas no tienen costo para el cliente"
            >
              Gratis ($0)
            </div>
          ) : (
            <input
              type={f.type}
              value={val}
              onChange={(e) =>
                updateAdminField(modal.section, f.key, e.target.value)
              }
              onBlur={() =>
                getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
              }
              aria-invalid={!!formFieldErrors[f.key]}
              className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: t.input,
                border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                color: t.text,
              }}
            />
          )}
          <FieldError msg={shownFieldError(f.key) || formFieldErrors[f.key]} />
          {/* A soda is "Gaseosa <sabor> (<tamaño>)": its size goes right under the flavour */}
          {f.key === "0" && !isView && formData["1"] === SODA_PRODUCT && (
            <label className="mt-1 flex flex-col gap-1.5 text-xs font-semibold" style={{ color: formFieldErrors.sodaSize ? C.red : t.muted }}>
              Tamaño (solo gaseosas)
              <input
                list="soda-size-options"
                value={formData.sodaSize ?? ""}
                onChange={(e) => {
                  setFormData((current) => ({ ...current, sodaSize: e.target.value }))
                  setFormFieldErrors((current) => ({ ...current, sodaSize: "" }))
                }}
                placeholder="Ej: Personal, 1.5 L, 3 L"
                className="w-full min-w-0 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none"
                style={{ background: t.input, border: `1.5px solid ${formFieldErrors.sodaSize ? C.red : t.inputB}`, color: t.text }}
              />
              <datalist id="soda-size-options">
                {[...new Set((rows.producto || []).flatMap((p) => (p[1] === SODA_PRODUCT ? [SODA_RE.exec(String(p[0]))?.[2] ?? ""] : [])))]
                  .filter(Boolean)
                  .map((size) => (
                    <option key={size} value={size} />
                  ))}
              </datalist>
              <FieldError msg={formFieldErrors.sodaSize} />
              <span className="text-[11px] font-normal">
                {String(formData.sodaSize ?? "").trim()
                  ? `Se guarda como «Gaseosa ${String(formData["0"] || "sabor").trim()} (${String(formData.sodaSize).trim()})» y aparece en las gaseosas de la tienda.`
                  : "Sin tamaño se guarda tal cual (otra bebida) y no aparece en las gaseosas de la tienda."}
              </span>
            </label>
          )}
        </div>
      )
    })}
    </div>
  )
  const productTechFields = isProduct
    ? dataFields.filter((field) => ["5", "6", "7", "8"].includes(field.key))
    : []
  const rowOffset = cfg.autoId ? 1 : 0
  const availableProductos = isPedido ? getAvailableProductos() : []
  const availableProductionProducts = isProduction
    ? getAvailableProductos()
    : []
  const availablePncDamagedItems = isPnc ? getNonconformingProductOptions() : []
  const availableItemOptions = isProduction
    ? availableProductionProducts
    : availablePncDamagedItems
  const clientOptions = [...(rows.clientes || [])]
    .filter((client) => isActiveStatus(client[7]))
    .sort((a, b) => Number(isCounterClientRow("clientes", b)) - Number(isCounterClientRow("clientes", a)))
    .map((client) => String(client[0] ?? ""))
    .filter(Boolean)

  const handleSupplyCheckboxToggle = () => {
    setFormData((current) => {
      const enabled =
        String(current["7"] ?? "No").toLowerCase() === "sí"
      if (enabled) {
        return {
          ...current,
          "7": "No",
          "8": "",
          "9": "",
          "10": "",
          "11": "",
        }
      }
      // Sheet name is filled from the insumo name on save if left empty
      return {
        ...current,
        "7": "Sí",
        "8": "",
        "9": "v1.0",
        "10": "",
        "11": "",
      }
    })
    setSupplyFormError("")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      // Forms and details only close with their own buttons (X, Volver, Cancelar), never with a stray click outside
    >
      {discardAsk && (
        <div
          role="alertdialog"
          aria-label="Descartar cambios"
          className="fixed inset-0 z-[95] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <h4 className="text-base font-semibold" style={{ color: t.text }}>¿Descartar cambios?</h4>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              Tienes cambios sin guardar en este formulario. Si sales, se pierden.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setDiscardAsk(false)}
                className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: t.input, color: t.text }}
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
                style={{ background: C.red, color: "#fff" }}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={`flex min-w-0 w-full ${isRoles ? "max-w-6xl" : isPnc ? (modal.mode === "add" && !pncManual ? "max-w-xl" : "max-w-3xl") : isDrinkForm || isDrinkView ? "max-w-4xl" : isProduct ? (isView ? "max-w-6xl" : "max-w-5xl") : isUser ? "max-w-2xl" : isSupplier ? (isView ? isNaturalSupplier(row?.[15]) : !formData["15"] || isNaturalSupplier(formData["15"])) ? "max-w-2xl" : "max-w-5xl" : isProductCategory || modal.section === "cat-insumos" ? "max-w-md" : isPedido ? (isView ? "max-w-5xl" : "max-w-4xl") : isSales ? "max-w-4xl" : isProduction ? (isView ? "max-w-6xl" : productionItems.length > 8 ? "max-w-6xl" : productionItems.length > 4 ? "max-w-4xl" : "max-w-3xl") : sheetBeside ? "max-w-5xl" : isPurchaseModule ? "max-w-2xl" : "max-w-5xl"} flex-col overflow-hidden rounded-2xl`}
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          maxHeight: isPurchaseModule || isProduct || isRoles ? "94vh" : "88vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-5 ${isUser || isRoles ? "py-3" : "py-4"}`}
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <div className="flex min-w-0 items-center gap-2">
          {/* Back arrow on every form: same as «Cancelar» (also returns to the form that opened this one) */}
          {!isView && (
            <button
              type="button"
              onClick={requestCloseModal}
              aria-label="Volver"
              title="Volver"
              className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl"
              style={{ background: t.input, color: t.muted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h3 className="font-semibold text-base" style={{ color: t.text }}>
            {purchaseEntity
              ? modal.mode === "add"
                ? `${purchaseEntity.fem ? "Nueva" : "Nuevo"} ${purchaseEntity.name}`
                : modal.mode === "edit"
                  ? `Editar ${purchaseEntity.name}`
                  : `Detalle ${purchaseEntity.fem ? "de la" : "del"} ${purchaseEntity.name}`
              : modal.mode === "add"
                ? "Nuevo registro"
                : modal.mode === "edit"
                  ? "Editar registro"
                  : "Ver detalle"}
          </h3>
          </div>
          <button
            onClick={requestCloseModal}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
            style={{ background: t.input, color: t.muted }}
          >
            {Ico.x}
          </button>
        </div>
        <div
          className={`min-w-0 overflow-x-hidden ${isRoles ? "min-h-0 flex-1 overflow-y-auto" : "overflow-y-auto"} px-4 ${isUser ? "py-3 sm:px-5" : "py-4 sm:px-5"} ${
            isUser
              ? "grid content-start grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4"
              : isRoles && !isView
              ? "grid content-start gap-x-4 gap-y-2.5 sm:grid-cols-2"
              : isPurchaseModule
                ? `grid min-h-0 flex-1 content-start gap-x-4 gap-y-3 ${
                    // Supplier: 4 columns on large screens — supplier data spans the left two,
                    // contact person goes two fields per row on the right (keeps "Cargo" in view)
                    isSupplier
                      ? "grid-cols-1 lg:grid-flow-row-dense lg:grid-cols-4"
                      : sheetBeside
                        ? // left rows fit their fields; the ficha's extra height goes to the last (1fr) row
                          "sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(7,min-content)_1fr]"
                        : (isProduction || isPedido || isSales) && !isView ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  }`
                : isProduct
                  ? "flex min-h-0 flex-1 flex-col gap-3"
                  : "flex flex-col gap-3"
          }`}
          style={{
            maxHeight: isPurchaseModule || isProduct ? undefined : isRoles ? undefined : isUser ? "58vh" : "65vh",
            // A visible (thin) scrollbar tells the user there are more fields below
            scrollbarWidth: "thin",
          }}
        >
          {/* Purchase module detail header: record name + status */}
          {isView && isPurchaseModule && !isPurchase && !isSupply && !isSupplier && !isClient && !isPedido && !isSales &&
            modal.section !== "cat-insumos" && modal.section !== "perdidas" && row && (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 sm:col-span-2"
              style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}
            >
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
                  {purchaseEntity.name}
                </div>
                <div className="text-base font-bold break-words" style={{ color: t.text }}>
                  {String(row[0] ?? "—")}
                </div>
              </div>
              {statusValue && (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: badgeSt(statusValue)?.bg ?? t.input, color: badgeSt(statusValue)?.color ?? t.muted }}
                >
                  {statusValue}
                </span>
              )}
            </div>
          )}
          {/* Proof only matters for transfers (cash / pay at the store = contraentrega) */}
          {isPedido && !isView && formData["3"] === "Transferencia" && (
            // Last in the form (order-last): client and products come first
            <div className={`order-last flex min-w-0 flex-col gap-2 ${isPedido && !isView ? "sm:col-span-3" : "sm:col-span-2"}`}>
              <label className="text-xs font-semibold" style={{ color: t.muted }}>Comprobante de pago</label>
              {isView ? (
                paymentProofDraft ? (
                  <img src={paymentProofDraft} alt="Comprobante de pago" className="max-h-64 w-full rounded-xl object-contain" style={{ background: t.input }} />
                ) : (
                  <div className="rounded-xl px-4 py-6 text-center text-xs" style={{ background: t.input, color: t.muted }}>El cliente todavía no ha subido un comprobante.</div>
                )
              ) : (
                <div className="min-w-0 rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: t.inputB }}>
                  {paymentProofDraft && <img src={paymentProofDraft} alt="Vista previa" className="mb-3 max-h-40 w-full rounded-lg object-contain" />}
                  <button type="button" onClick={() => document.getElementById("payment-proof-input")?.click()} className="cursor-pointer text-xs font-semibold" style={{ color: C.mustard }}>Seleccionar imagen o PDF del comprobante</button>
                  <input id="payment-proof-input" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    if (file.type === "application/pdf") {
                      setPaymentProofDraft(URL.createObjectURL(file))
                    } else {
                      const reader = new FileReader()
                      reader.onload = (loadEvent) => {
                        if (loadEvent.target?.result) setPaymentProofDraft(String(loadEvent.target.result))
                      }
                      reader.readAsDataURL(file)
                    }
                  }} />
                  <input type="url" placeholder="O pega una URL del comprobante" value={paymentProofDraft.startsWith("data:") ? "" : paymentProofDraft} onChange={(event) => setPaymentProofDraft(event.target.value)} className="mt-3 w-full min-w-0 rounded-lg px-3 py-2 text-xs" style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }} />
                </div>
              )}
            </div>
          )}
          {isProduct ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="flex flex-col gap-3">
                {isView && row && (
                  <div className="flex flex-col gap-4">
                    {imgPreview ? (
                      <img
                        src={imgPreview}
                        alt={String(row[0] ?? "")}
                        className="h-48 w-full rounded-2xl object-cover"
                      />
                    ) : null}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                          {String(row[1] || "Sin categoría")}
                        </span>
                        {statusValue && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ background: badgeSt(statusValue)?.bg ?? t.input, color: badgeSt(statusValue)?.color ?? t.muted }}
                          >
                            {statusValue}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 break-words text-lg font-semibold" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                        {String(row[0] ?? "—")}
                      </h4>
                      <div className="text-xl font-semibold" style={{ color: C.mustard }}>
                        {Number(row[2]) > 0 ? fmt(Number(row[2])) : "Sin precio"}
                      </div>
                    </div>
                    <div className="rounded-xl px-4 py-3" style={{ background: t.cardAlt }}>
                      <div className="mb-1 text-[11px]" style={{ color: t.muted }}>Descripción</div>
                      <p className="text-sm leading-relaxed" style={{ color: String(row[3] ?? "").trim() ? t.text : t.muted }}>
                        {String(row[3] ?? "").trim() || "Sin descripción."}
                      </p>
                    </div>
                    {(() => {
                      if (hideProductTechnicalSheet) return null
                      const recipe = getProductRecipe(row)
                      if (!recipe.length) return null
                      const cost = recipe.reduce((sum, ingredient) => {
                        const supply = rows.insumos?.find((item) => item[0] === ingredient.name)
                        const value = convertQty(ingredient.quantity, ingredient.unit, String(supply?.[2] ?? ingredient.unit)) * Number(supply?.[3] || 0)
                        return sum + (Number.isFinite(value) ? value : 0)
                      }, 0)
                      return renderProfit(Number(row[2]) || 0, cost)
                    })()}
                  </div>
                )}
                {!isView && (
                  // Photo in the same place as in the detail; click (or drop) to change it
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold" style={{ color: formFieldErrors.img ? C.red : t.muted }}>
                      Foto del producto{modal.mode === "add" && !sodaImage(formData["0"]) && " *"}
                    </label>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={imgPreview ? "Cambiar foto del producto" : "Subir foto del producto"}
                      aria-invalid={!!formFieldErrors.img}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file) handleFile(file)
                      }}
                    >
                      {(() => {
                        // A soda without its own photo shows its bundled bottle (only shown, not saved)
                        const bottle = isDrinkForm && !imgPreview
                          ? sodaImage(`Gaseosa ${String(formData["0"] ?? "").trim().replace(/^gaseosa\s+/i, "")} (${String(formData.sodaSize ?? "").trim()})`)
                          : undefined
                        const shown = imgPreview || bottle
                        return shown ? (
                          <>
                            <img
                              src={shown}
                              alt=""
                              className={`w-full rounded-2xl ${isDrinkForm ? "h-60 object-contain" : "h-44 object-cover"}`}
                              style={isDrinkForm ? { background: "#fff" } : undefined}
                            />
                            <span
                              className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                            >
                              {Ico.upload} {imgPreview ? "Cambiar foto" : "Subir foto propia"}
                            </span>
                          </>
                        ) : null
                      })()}
                      {!imgPreview && !(isDrinkForm && sodaImage(`Gaseosa ${String(formData["0"] ?? "").trim().replace(/^gaseosa\s+/i, "")} (${String(formData.sodaSize ?? "").trim()})`)) && (
                        <div
                          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-xs"
                          style={{ borderColor: formFieldErrors.img ? C.red : t.inputB, color: t.muted }}
                        >
                          <span className="flex items-center gap-1.5">{Ico.upload} Arrastra o selecciona una imagen</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFile(file)
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="o pega una URL de imagen..."
                      aria-label="URL de la imagen"
                      value={imgPreview.startsWith("data:") ? "" : imgPreview}
                      onChange={(e) => {
                        const value = e.target.value
                        setImgPreview(value)
                        if (value.trim()) setFormFieldErrors((current) => ({ ...current, img: "" }))
                      }}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                      style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                    />
                    <FieldError msg={formFieldErrors.img} />
                  </div>
                )}
                {/* Two fields per row (name and description full width) so the form barely scrolls; a drink has them on the right */}
                {!isDrinkForm && renderProductFields()}
                {isDrinkForm && (
                  <div className="rounded-xl px-3 py-2.5" style={{ background: `${C.mustard}10`, border: `1px solid ${C.mustard}35` }}>
                    <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.mustard }}>Producto terminado</div>
                    <p className="mt-0.5 text-xs leading-snug" style={{ color: t.muted }}>
                      Sin ficha técnica: se compra en Compras y se vende tal cual. Con tamaño es una gaseosa de la tienda y cada venta descuenta 1 und.
                    </p>
                  </div>
                )}
                {/* Editing: the profit stays in this column too (updates with the price and the ficha técnica) */}
                {!isView && !hideProductTechnicalSheet && technicalIngredients.length > 0 &&
                  renderProfit(
                    Number(formData["2"] || 0),
                    technicalIngredients.reduce((sum, ingredient) => {
                      const supply = rows.insumos?.find((item) => item[0] === ingredient.name)
                      const value = convertQty(ingredient.quantity, ingredient.unit, String(supply?.[2] ?? ingredient.unit)) * Number(supply?.[3] || 0)
                      return sum + (Number.isFinite(value) ? value : 0)
                    }, 0),
                  )}
              </div>
              {(() => {
                // Creating or editing a drink: no ficha técnica at all, its fields take this column
                if (isDrinkForm) return <div className="flex flex-col gap-3">{renderProductFields()}</div>
                // A resale soda has no ficha técnica: show its stock and margin instead
                if (isView && row?.[1] === SODA_PRODUCT) {
                  // Its purchases set its stock and cost on the product itself
                  const cost = Number(row[13]) || 0
                  const price = Number(row[2]) || 0
                  return (
                    <section className="flex flex-col gap-3 rounded-2xl px-4 py-4" style={{ border: `1px solid ${t.border}` }}>
                      <div className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text }}>Producto terminado</div>
                      <p className="text-xs" style={{ color: t.muted }}>
                        Se compra en Compras y se vende tal cual: no lleva ficha técnica. Cada venta descuenta 1 und del stock.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["En stock", isSodaName(row[0]) ? `${Number(row[12]) || 0} und · mín. ${Number(row[14]) || 0}` : "No lleva stock"],
                          ["Costo de compra", cost ? fmt(cost) : "Sin compras"],
                          ["Ganancia por unidad", !cost ? "—" : price >= cost ? fmt(price - cost) : `−${fmt(cost - price)}`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: t.cardAlt }}>
                            <div className="text-[10px] font-semibold" style={{ color: t.muted }}>{label}</div>
                            <div
                              className="mt-0.5 text-sm font-bold"
                              style={{ color: label === "Ganancia por unidad" && cost && price - cost <= 0 ? C.red : t.text }}
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                      {cost > 0 && price - cost <= 0 && (
                        <p className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: `${C.red}10`, color: C.red }} role="alert">
                          Se vende a {fmt(price)} y cuesta {fmt(cost)}: pierdes {fmt(cost - price)} por unidad. Sube el precio con «Editar».
                        </p>
                      )}
                      {(() => {
                        // Its latest purchases: where its stock and cost come from
                        const bought = (rows.compras || [])
                          .flatMap((c) =>
                            parsePurchaseLines(c[6])
                              .filter((l) => normalizeName(l.name) === normalizeName(row[0]))
                              .map((l) => ({ supplier: String(c[0]), date: String(c[1]), qty: l.quantity, price: l.unitPrice, annulled: !isActiveStatus(c[5]) })),
                          )
                          .sort((a, b) => b.date.localeCompare(a.date))
                        return (
                          <div>
                            <div className="mb-1.5 text-[11px] font-semibold" style={{ color: t.muted }}>Últimas compras</div>
                            {bought.length ? (
                              <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                                {bought.slice(0, 4).map((b, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                                    style={{ borderTop: i ? `1px solid ${t.border}` : undefined, opacity: b.annulled ? 0.5 : 1 }}
                                  >
                                    <span className="min-w-0 truncate" style={{ color: t.text }}>
                                      {b.date} · {b.supplier}
                                      {b.annulled && <span style={{ color: C.red }}> · Anulada</span>}
                                    </span>
                                    <span className="flex-shrink-0" style={{ color: t.muted }}>
                                      {b.qty} und × {fmt(b.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-xl px-3 py-3 text-center text-xs" style={{ background: t.cardAlt, color: t.muted }}>
                                Aún no se ha comprado: regístrala en Compras para tener stock.
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </section>
                  )
                }
                if (hideProductTechnicalSheet) return null
                const recipe: TechnicalIngredient[] = isView ? getProductRecipe(row ?? undefined) : technicalIngredients
                const steps = isView ? getPreparationSteps(row?.[8]) : technicalSteps
                const version = String((isView ? row?.[6] : formData["6"]) || getAutoTechVersion(rows.producto || []))
                const lines = recipe.map((ingredient) => {
                  const supply = rows.insumos?.find((item) => item[0] === ingredient.name)
                  const cost = convertQty(ingredient.quantity, ingredient.unit, String(supply?.[2] ?? ingredient.unit)) * Number(supply?.[3] || 0)
                  return { ...ingredient, cost: Number.isFinite(cost) ? cost : 0 }
                })
                const totalCost = lines.reduce((sum, line) => sum + line.cost, 0)
                return (
                  <section className="flex flex-col gap-3 rounded-2xl px-4 py-4" style={{ border: `1px solid ${t.border}` }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                          Ficha técnica
                        </h4>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                          Versión {version}
                        </span>
                      </div>
                      {!isView && (
                        <button
                          type="button"
                          onClick={() => {
                            setTechnicalSheetError("")
                            setTechnicalStepEdit(null)
                            setTechnicalSheetOpen(true)
                          }}
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                          style={{ background: C.mustard, color: "#fff" }}
                        >
                          {recipe.length || steps.length ? <>{Ico.edit} Editar ficha técnica</> : <>{Ico.plus} Agregar ficha técnica</>}
                        </button>
                      )}
                    </div>
                    {!recipe.length && !steps.length ? (
                      <p className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.cardAlt, color: t.muted }}>
                        {isView ? "Este producto no tiene ficha técnica." : "Opcional: agrega los insumos que lleva, sus cantidades y cómo se prepara."}
                      </p>
                    ) : (
                      <>
                        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                          <div
                            className="grid grid-cols-[minmax(0,1fr)_auto_5.5rem] gap-x-3 px-3 py-2 text-[11px]"
                            style={{ background: t.cardAlt, color: t.muted }}
                          >
                            <span>Insumo</span>
                            <span className="text-right">Cantidad</span>
                            <span className="text-right">Costo</span>
                          </div>
                          {lines.length ? (
                            lines.map((line, index) => (
                              <div
                                key={`${line.name}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto_5.5rem] items-center gap-x-3 border-t px-3 py-1.5 text-sm"
                                style={{ borderColor: t.border, color: t.text }}
                              >
                                <span className="min-w-0 break-words">{line.name}</span>
                                <span className="text-right" style={{ color: t.muted }}>
                                  {line.quantity.toLocaleString("es-CO")} {line.unit}
                                </span>
                                <span className="text-right">{fmt(Math.round(line.cost))}</span>
                              </div>
                            ))
                          ) : (
                            <div className="border-t px-3 py-3 text-center text-xs" style={{ borderColor: t.border, color: t.muted }}>
                              Sin insumos.
                            </div>
                          )}
                          {lines.length > 0 && (
                            <div className="flex items-center justify-between border-t px-3 py-2.5 text-sm" style={{ borderColor: t.border, background: `${C.mustard}0d` }}>
                              <span style={{ color: t.muted }}>Costo de los insumos por unidad</span>
                              <span className="font-semibold" style={{ color: C.mustard }}>{fmt(Math.round(totalCost))}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="mb-2 text-[11px]" style={{ color: t.muted }}>Cómo se prepara</div>
                          {steps.length ? (
                            <ol className={steps.length > 5 ? "grid gap-x-5 gap-y-1.5 sm:grid-cols-2" : "flex flex-col gap-1.5"}>
                              {steps.map((step, index) => (
                                <li key={`${index}-${step}`} className="flex items-start gap-2.5 text-sm" style={{ color: t.text }}>
                                  <span
                                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                    style={{ background: `${C.mustard}18`, color: C.mustard }}
                                  >
                                    {index + 1}
                                  </span>
                                  <span className="min-w-0 break-words">{step}</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-xs" style={{ color: t.muted }}>No hay pasos de preparación registrados.</p>
                          )}
                        </div>
                      </>
                    )}
                  </section>
                )
              })()}
            </div>
          ) : (
            <>
              {/* In the production detail the products are listed in its summary below */}
              {isProduction && !isView && (() => {
                // What one unit of the quantity means for each kind of product
                const unitsOf = (name: string): [string, string] => {
                  if (name.startsWith("Gaseosa ")) return ["botella", "botellas"]
                  const product = rows.producto?.find((item) => item[0] === name)
                  const category = normalizeName(String(product?.[1] ?? ""))
                  if (category === "salsas") return ["bolsita", "bolsitas"]
                  if (category === "adiciones") return ["porción", "porciones"]
                  if (category === "bebidas" || category === "gaseosas") return ["botella", "botellas"]
                  if (category === "producto de insumo") {
                    const unit = String(supplyInfo(name)?.[2] ?? "und")
                    return [unit, unit]
                  }
                  return ["unidad", "unidades"]
                }
                const PLURAL: Record<string, string> = {
                  unidad: "unidades", "porción": "porciones", bolsita: "bolsitas", botella: "botellas", paquete: "paquetes", vaso: "vasos",
                }
                const UNIT_CHOICES = ["unidad", "porción", "bolsita", "botella", "paquete", "vaso", "kg", "g", "L", "ml"]
                const unitWord = (unit: string, qty: number) => (qty === 1 ? unit : PLURAL[unit] ?? unit)
                const qtyLabel = (name: string, qty: number, unit?: string) =>
                  `${qty.toLocaleString("es-CO")} ${unitWord(unit || unitsOf(name)[0], qty)}`
                const query = normalizeName(productionSearch ?? "")
                const categoryOf = (name: string) => normalizeName(currentCategory(String(rows.producto?.find((item) => item[0] === name)?.[1] ?? "")))
                const activeIn = (category: string) =>
                  (rows.producto || [])
                    .filter((item) => normalizeName(currentCategory(String(item[1] ?? ""))) === category && isActiveStatus(item[4]))
                    .map((item) => String(item[0]))
                const sodas = activeIn("bebidas").filter(isSodaName) // each soda is a product of «Bebidas»
                const tabOptions =
                  productionKind === "bebidas"
                    ? sodas
                    : availableItemOptions.filter((name) =>
                        productionKind === "adiciones"
                          ? categoryOf(name) === "adiciones"
                          : !["adiciones", "bebidas", "gaseosas"].includes(categoryOf(name)),
                      )
                const options = tabOptions
                  .filter((name) => productionKind === "adiciones" || !productionItems.some((item) => item.name === name))
                  .filter((name) => {
                    const category = String(rows.producto?.find((item) => item[0] === name)?.[1] ?? "")
                    return !query || normalizeName(name).includes(query) || normalizeName(category).includes(query)
                  })
                const open = productionSearch !== null
                const pick = (name: string) => {
                  setProductionProductSelect(name)
                  setProductionItemUnit(unitsOf(name)[0])
                  setProductionSelectedSauces([])
                  setProductionSearch(null)
                  setProductionFormError("")
                }

                const draftQty = Number(productionItemQuantity)
                const add = () => {
                  if (!productionProductSelect) return setProductionFormError("Busca y elige un producto.")
                  if (!(draftQty > 0)) return setProductionFormError("La cantidad debe ser mayor que 0.")
                  if (productionKind === "adiciones" && !productionAdditionParentId)
                    return setProductionFormError("Elige el producto al que pertenece esta adición.")
                  const selectedRow = rows.producto?.find((item) => item[0] === productionProductSelect)
                  // Added at the end: the list grows downwards and the search box stays on top
                  setProductionItems((current) => [
                    ...current,
                    {
                      id: `production-line-${Date.now()}-${current.length}`,
                      name: productionProductSelect,
                      quantity: draftQty,
                      unit: productionItemUnit || unitsOf(productionProductSelect)[0],
                      category: String(selectedRow?.[1] ?? (productionKind === "bebidas" ? "Bebidas" : "")),
                      ...(productionKind === "adiciones" ? { parentId: productionAdditionParentId } : {}),
                      ...(productionKind !== "adiciones" && productionSelectedSauces.length
                        ? { sauces: productionSelectedSauces }
                        : {}),
                    },
                  ])
                  setProductionItemUnit("")
                  setProductionProductSelect("")
                  setProductionItemQuantity("1")
                  setProductionSelectedSauces([])
                  setProductionFormError("")
                }
                const saveEdit = () => {
                  if (!productionItemEdit) return
                  const qty = Number(productionItemEdit.qty)
                  if (!(qty > 0)) return setProductionFormError("La cantidad debe ser mayor que 0.")
                  setProductionItems((current) => current.map((item, i) => (i === productionItemEdit.index ? { ...item, quantity: qty } : item)))
                  setProductionItemEdit(null)
                  setProductionFormError("")
                }
                const controlSt = { background: t.input, border: `1px solid ${t.inputB}`, color: t.text }
                return (
                  <section className="flex flex-col gap-3 sm:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>Productos de la orden</h4>
                      </div>
                      {productionItems.length > 0 && (
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                          {productionItems.length} {productionItems.length === 1 ? "producto" : "productos"}
                        </span>
                      )}
                    </div>
                    <p className="-mt-1 text-[11px]" style={{ color: t.muted }}>
                      Agrega el producto, sus salsas y las adiciones asociadas, igual que en una compra del cliente.
                    </p>
                    <div className="grid items-end gap-2 rounded-xl p-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_8rem_auto]" style={{ background: t.cardAlt }}>
                      <div role="tablist" aria-label="Qué agregar" className="flex gap-1.5 sm:col-span-4">
                        {(["productos", "adiciones", "bebidas"] as const).map((kind) => {
                          const on = productionKind === kind
                          return (
                            <button
                              key={kind}
                              type="button"
                              role="tab"
                              aria-selected={on}
                              onClick={() => {
                                setProductionKind(kind)
                                setProductionProductSelect("")
                                setProductionAdditionParentId("")
                                setProductionSelectedSauces([])
                                setProductionFormError("")
                              }}
                              className="cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold"
                              style={on ? { background: C.mustard, color: "#fff" } : { background: t.input, color: t.muted, border: `1px solid ${t.inputB}` }}
                            >
                              {kind === "productos" ? "Productos" : kind === "adiciones" ? "Adiciones" : "Bebidas"}
                            </button>
                          )
                        })}
                      </div>
                      {productionKind === "adiciones" && (
                        <label className="flex min-w-0 flex-col gap-1 text-[11px] sm:col-span-4" style={{ color: t.muted }}>
                          Adición para
                          <select
                            value={productionAdditionParentId}
                            onChange={(event) => setProductionAdditionParentId(event.target.value)}
                            className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                            style={controlSt}
                          >
                            <option value="">Selecciona un producto de la orden...</option>
                            {productionItems
                              .filter((item) => !item.parentId && normalizeName(item.category ?? "") !== "adiciones" && !isSodaName(item.name))
                              .map((item, index) => (
                                <option key={item.id || `${item.name}-${index}`} value={item.id || ""}>
                                  {item.name} ×{item.quantity}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                      <div className="relative flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        <label htmlFor="production-search">{productionKind === "adiciones" ? "Adición" : productionKind === "bebidas" ? "Gaseosa (sabor y tamaño)" : "Producto"}</label>
                        <div className="search-control flex items-center gap-2 rounded-full px-3" style={controlSt}>
                          <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                          <input
                            id="production-search"
                            role="combobox"
                            aria-expanded={open}
                            aria-controls="production-search-list"
                            autoComplete="off"
                            value={open ? productionSearch : productionProductSelect}
                            placeholder={productionKind === "adiciones" ? "Busca una adición..." : productionKind === "bebidas" ? "Busca un sabor o tamaño..." : "Busca un producto..."}
                            onFocus={() => setProductionSearch("")}
                            onChange={(event) => setProductionSearch(event.target.value)}
                            onBlur={() => setTimeout(() => setProductionSearch(null), 150)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && open && options.length) {
                                event.preventDefault()
                                pick(options[0])
                              }
                              if (event.key === "Escape") setProductionSearch(null)
                            }}
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                            style={{ color: t.text }}
                          />
                          {(open ? productionSearch : productionProductSelect) && (
                            <button
                              type="button"
                              className="search-clear"
                              aria-label="Limpiar búsqueda de productos"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setProductionSearch(null)
                                setProductionProductSelect("")
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {open && (
                          <div
                            id="production-search-list"
                            role="listbox"
                            className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl p-1 shadow-xl"
                            style={{ background: t.card, border: `1px solid ${t.border}`, scrollbarWidth: "thin" }}
                          >
                            {options.length ? (
                              options.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  role="option"
                                  aria-selected={productionProductSelect === name}
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    pick(name)
                                  }}
                                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:opacity-80"
                                >
                                  <span className="min-w-0 truncate text-sm" style={{ color: t.text }}>{name}</span>
                                  <span className="flex-shrink-0 text-[10px]" style={{ color: t.muted }}>
                                    {String(rows.producto?.find((item) => item[0] === name)?.[1] ?? "")}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="px-2.5 py-3 text-center text-xs" style={{ color: t.muted }}>
                                {productionKind === "adiciones" ? "No hay adiciones que coincidan." : productionKind === "bebidas" ? "No hay gaseosas que coincidan." : "No hay productos que coincidan."}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        Cantidad
                        <div className="flex items-center gap-1.5 rounded-xl px-3" style={controlSt}>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={productionItemQuantity}
                            onChange={(event) => setProductionItemQuantity(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault()
                                add()
                              }
                            }}
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                            style={{ color: t.text }}
                          />
                        </div>
                      </label>
                      <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        Unidad de medida
                        <select
                          value={productionItemUnit}
                          disabled={!productionProductSelect}
                          onChange={(event) => setProductionItemUnit(event.target.value)}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-2.5 py-2.5 text-sm outline-none disabled:cursor-default disabled:opacity-50"
                          style={controlSt}
                        >
                          {!productionProductSelect && <option value="">—</option>}
                          {[...new Set([...(productionItemUnit ? [productionItemUnit] : []), ...UNIT_CHOICES])].map((unit) => (
                            <option key={unit} value={unit}>{unitWord(unit, draftQty)}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={add}
                        className="flex cursor-pointer items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        {Ico.plus} Agregar
                      </button>
                      {productionKind === "productos" &&
                        productionProductSelect &&
                        !["adiciones", "bebidas", "sabores de bebida"].includes(normalizeName(String(rows.producto?.find((item) => item[0] === productionProductSelect)?.[1] ?? ""))) && (
                          <div className="flex flex-wrap gap-2 sm:col-span-4">
                            {SAUCES.map((sauce) => {
                              const selected = productionSelectedSauces.includes(sauce)
                              return (
                                <label key={sauce} className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs" style={{ background: selected ? `${C.mustard}18` : t.input, color: selected ? C.mustard : t.text }}>
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    disabled={!selected && productionSelectedSauces.length >= 4}
                                    onChange={() => setProductionSelectedSauces((current) =>
                                      selected ? current.filter((item) => item !== sauce) : [...current, sauce],
                                    )}
                                    style={{ accentColor: C.mustard }}
                                  />
                                  {sauce}
                                </label>
                              )
                            })}
                            <span className="self-center text-[10px]" style={{ color: t.muted }}>Hasta 4 salsas, igual que en la compra del cliente.</span>
                          </div>
                        )}
                      {productionProductSelect && draftQty > 0 && (
                        <span className="text-[11px] sm:col-span-4" style={{ color: t.muted }}>
                          Se van a preparar <span style={{ color: t.text }}>{qtyLabel(productionProductSelect, draftQty, productionItemUnit)}</span> de «{productionProductSelect}»
                          .
                        </span>
                      )}
                    </div>
                    {productionItems.length ? (
                      <div
                        // Up to 4 items: one column; more: split in halves (2 columns), and from 9 on in 3
                        className={`gap-2 ${productionItems.length > 8 ? "sm:columns-3" : productionItems.length > 4 ? "sm:columns-2" : ""}`}
                      >
                        {productionItems.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="mb-2 flex break-inside-avoid items-center gap-2 rounded-xl px-2.5 py-2"
                            style={{ border: `1px solid ${t.border}` }}
                          >
                            <span
                              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                              style={{ background: `${C.mustard}18`, color: C.mustard }}
                            >
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm" style={{ color: t.text }} title={`${item.name}${item.sauces?.length ? ` · Salsas: ${item.sauces.join(", ")}` : ""}`}>
                              {item.parentId ? <span className="mr-1" style={{ color: t.muted }}>↳</span> : null}
                              {item.name}
                              {item.sauces?.length ? <span className="ml-1 text-[10px]" style={{ color: t.muted }}>· {item.sauces.join(", ")}</span> : null}
                            </span>
                            {productionItemEdit?.index === index ? (
                              <>
                                <input
                                  type="number"
                                  min="1"
                                  autoFocus
                                  aria-label={`Cantidad de ${item.name}`}
                                  value={productionItemEdit.qty}
                                  onChange={(event) => setProductionItemEdit({ index, qty: event.target.value })}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault()
                                      saveEdit()
                                    }
                                    if (event.key === "Escape") setProductionItemEdit(null)
                                  }}
                                  className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none"
                                  style={controlSt}
                                />
                                <span className="text-xs" style={{ color: t.muted }}>{unitWord(item.unit || unitsOf(item.name)[0], 2)}</span>
                                <button
                                  type="button"
                                  title="Guardar"
                                  aria-label={`Guardar cantidad de ${item.name}`}
                                  onClick={saveEdit}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                  style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                                >
                                  {Ico.check}
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm" style={{ color: t.muted }}>{qtyLabel(item.name, item.quantity, item.unit)}</span>
                                <button
                                  type="button"
                                  title="Editar cantidad"
                                  aria-label={`Editar ${item.name}`}
                                  onClick={() => setProductionItemEdit({ index, qty: String(item.quantity) })}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                  style={{ color: C.mustard, background: `${C.mustard}14` }}
                                >
                                  {Ico.edit}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              title="Quitar"
                              aria-label={`Quitar ${item.name}`}
                              onClick={() => {
                                setProductionItems((current) =>
                                  current.filter((candidate, i) => i !== index && candidate.parentId !== item.id),
                                )
                                setProductionItemEdit(null)
                              }}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                              style={{ color: C.red, background: `${C.red}10` }}
                            >
                              {Ico.x}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl px-3 py-3 text-center text-xs" style={{ border: `1.5px dashed ${t.inputB}`, color: t.muted }}>
                        Aquí aparecen los productos que agregues.
                      </p>
                    )}
                    {productionFormError && <p role="alert" className="text-xs font-medium" style={{ color: C.red }}>{productionFormError}</p>}
                  </section>
                )
              })()}
              {isPnc && modal.mode === "add" && !pncManual && (() => {
                // Orders that can have a producto no conforme (already started, not marked yet)
                const orders = (rows.produccion || [])
                  .map((order, index) => ({ order, index }))
                  .filter(({ order }) => ["Iniciada", "En cocina", "Terminado"].includes(String(order[8])))
                return (
                  <section className="flex flex-col gap-2 rounded-2xl p-4 sm:col-span-2" style={{ background: `${C.mustard}0d`, border: `1px solid ${C.mustard}35` }}>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                        ¿Viene de una orden de producción?
                      </h4>
                      <p className="text-[11px]" style={{ color: t.muted }}>
                        Elígela y registra lo dañado directamente de sus productos; la orden se reinicia para rehacerlo.
                      </p>
                    </div>
                    {orders.length ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label="Orden de producción"
                          value={pncOrderPick}
                          onChange={(event) => setPncOrderPick(event.target.value)}
                          className="min-w-0 flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: t.card, border: `1px solid ${t.inputB}`, color: pncOrderPick ? t.text : t.muted }}
                        >
                          <option value="">Selecciona la orden...</option>
                          {orders.map(({ order, index }) => (
                            <option key={String(order[0])} value={String(index)}>
                              {String(order[0])} · {String(order[1])} · {String(order[8])}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!pncOrderPick}
                          onClick={() => {
                            const index = Number(pncOrderPick)
                            setPncOrderPick("")
                            setModal({ mode: null, section: "", idx: null })
                            openProductionPnc(index)
                          }}
                          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold disabled:cursor-default disabled:opacity-50"
                          style={{ background: C.mustard, color: "#fff" }}
                        >
                          Registrar desde esta orden
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: t.muted }}>
                        No hay órdenes iniciadas, en cocina o terminadas.
                      </p>
                    )}
                    <div className="my-1 flex items-center gap-3 text-[11px]" style={{ color: t.muted }}>
                      <span className="h-px flex-1" style={{ background: `${C.mustard}35` }} />o<span className="h-px flex-1" style={{ background: `${C.mustard}35` }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPncManual(true)}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:shadow-md"
                      style={{ background: t.card, border: `1.5px dashed ${C.mustard}` }}
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: C.mustard, color: "#fff" }}>
                        {Ico.plus}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold" style={{ color: t.text }}>
                          Si no hay orden de producción, crea el producto no conforme
                        </span>
                        <span className="block text-[11px]" style={{ color: t.muted }}>
                          Registra a mano los productos, adiciones o bebidas que se dañaron.
                        </span>
                      </span>
                      <span className="flex-shrink-0 -rotate-90" style={{ color: C.mustard }}>{Ico.chevDown}</span>
                    </button>
                  </section>
                )
              })()}
              {isView && isClient && row && (() => {
                let saved: string[] = []
                try {
                  saved = JSON.parse(String(row[9] || "[]"))
                } catch {
                  // no saved addresses
                }
                const main = String(row[5] ?? "").trim()
                // The main address once, then the other saved ones
                const addresses = [...new Set([main, ...saved].map((address) => String(address).trim()).filter(Boolean))]
                const value = (v: string | number | undefined) => String(v ?? "").trim() || "—"
                const info = (label: string, text: string, icon: React.ReactNode) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                      <div className="truncate text-sm" title={text} style={{ color: text === "—" ? t.muted : t.text }}>{text}</div>
                    </div>
                  </div>
                )
                const initials = value(row[0]) === "—" ? "?" : value(row[0]).split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
                const status = String(row[7] || "Activo")
                return (
                  <div className="flex min-w-0 flex-col gap-3 sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3" style={{ background: t.cardAlt }}>
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: C.mustard, color: "#fff" }}>
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-base font-semibold" style={{ color: t.text }}>{value(row[0])}</div>
                        <div className="text-xs" style={{ color: t.muted }}>
                          {row[11] === "Sí" ? "Tiene cuenta en la app" : "Sin cuenta en la app"}
                          {row[6] === "Sí" ? " · Cliente de local" : ""}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                        style={{ background: badgeSt(status)?.bg ?? t.input, color: badgeSt(status)?.color ?? t.muted }}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>
                        Información personal
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {info("Documento", [value(row[1]), value(row[2])].filter((v) => v !== "—").join(" ") || "—", Ico.user)}
                        {info("Teléfono", value(row[3]), Ico.phone)}
                        <div className="sm:col-span-2">{info("Correo", value(row[4]), Ico.mail)}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>
                        Direcciones ({addresses.length})
                      </h4>
                      {addresses.length ? (
                        <ul className="flex flex-col gap-2">
                          {addresses.map((address, index) => (
                            <li
                              key={address}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                              style={{ background: index === 0 && main ? `${C.mustard}0d` : t.cardAlt, color: t.text }}
                            >
                              <span className="flex-shrink-0" style={{ color: C.mustard }}>{Ico.mapPin}</span>
                              <span className="min-w-0 flex-1 break-words">{address}</span>
                              {index === 0 && main && (
                                <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                                  Principal
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm" style={{ color: t.muted }}>No tiene direcciones guardadas.</p>
                      )}
                    </div>
                  </div>
                )
              })()}
              {isPnc && isView && row && (
                <div className="rounded-2xl px-4 py-3 sm:col-span-2" style={{ border: `1px solid ${t.border}` }}>
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>
                    Productos o insumos que se dañaron
                  </h4>
                  {getNonconformingItems(row).map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between gap-3 border-b py-1.5 text-sm last:border-b-0" style={{ borderColor: t.border }}>
                      <span className="min-w-0 break-words" style={{ color: t.text }}>{item.name}</span>
                      <span className="flex-shrink-0" style={{ color: t.muted }}>{item.quantity.toLocaleString("es-CO")} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
              {isPnc && modal.mode === "add" && pncManual && (
                <button
                  type="button"
                  onClick={() => setPncManual(false)}
                  className="flex cursor-pointer items-center gap-1.5 self-start text-xs font-semibold sm:col-span-2"
                  style={{ color: t.muted }}
                >
                  <span className="rotate-90">{Ico.chevDown}</span> Volver a elegir una orden de producción
                </button>
              )}
              {isPnc && (modal.mode !== "add" || pncManual) && !isView && (() => {
                const categoryOf = (name: string) => normalizeName(currentCategory(String(rows.producto?.find((item) => item[0] === name)?.[1] ?? "")))
                const isDrink = (name: string) =>
                  name.startsWith("Gaseosa ") || ["bebidas", "gaseosas"].includes(categoryOf(name))
                const activeIn = (category: string) =>
                  (rows.producto || [])
                    .filter((item) => normalizeName(currentCategory(String(item[1] ?? ""))) === category && isActiveStatus(item[4]))
                    .map((item) => String(item[0]))
                const sodas = activeIn("bebidas").filter(isSodaName) // each soda is a product of «Bebidas»
                const options = (
                  productionKind === "bebidas"
                    ? sodas
                    : availableItemOptions.filter((name) =>
                        productionKind === "adiciones" ? categoryOf(name) === "adiciones" : categoryOf(name) !== "adiciones" && !isDrink(name),
                      )
                ).filter((name) => !productionItems.some((item) => item.name === name))
                // Default measure: the insumo's own unit, or what one of that product is
                const defaultUnit = (name: string) => {
                  const supply = rows.insumos?.find((item) => item[0] === name)
                  if (supply) return String(supply[2] ?? "und")
                  if (isDrink(name)) return "botella"
                  const category = categoryOf(name)
                  return category === "salsas" ? "bolsita" : category === "adiciones" ? "porción" : "und"
                }
                const unitOptions = (unit: string) => [...new Set([unit, ...PNC_UNITS])]
                const qty = Number(productionItemQuantity)
                const add = () => {
                  if (!productionProductSelect) return setProductionFormError("Elige qué se dañó.")
                  if (!(qty > 0)) return setProductionFormError("La cantidad debe ser mayor que 0.")
                  setProductionItems((current) => [
                    ...current,
                    { name: productionProductSelect, quantity: qty, unit: productionItemUnit || defaultUnit(productionProductSelect) },
                  ])
                  setProductionProductSelect("")
                  setProductionItemQuantity("1")
                  setProductionItemUnit("")
                  setProductionFormError("")
                }
                const controlSt = { background: t.input, border: `1px solid ${t.inputB}`, color: t.text }
                return (
                  <section className="flex flex-col gap-3 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>Productos o insumos que se dañaron</h4>
                    </div>
                    <div className="grid items-end gap-2 rounded-xl p-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_auto]" style={{ background: t.cardAlt }}>
                      <div role="tablist" aria-label="Qué se dañó" className="flex gap-1.5 sm:col-span-4">
                        {(["productos", "adiciones", "bebidas"] as const).map((kind) => {
                          const on = productionKind === kind
                          return (
                            <button
                              key={kind}
                              type="button"
                              role="tab"
                              aria-selected={on}
                              onClick={() => {
                                setProductionKind(kind)
                                setProductionProductSelect("")
                                setProductionItemUnit("")
                                setProductionFormError("")
                              }}
                              className="cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold"
                              style={on ? { background: C.mustard, color: "#fff" } : { background: t.input, color: t.muted, border: `1px solid ${t.inputB}` }}
                            >
                              {kind === "productos" ? "Productos" : kind === "adiciones" ? "Adiciones" : "Bebidas"}
                            </button>
                          )
                        })}
                      </div>
                      <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        {productionKind === "adiciones" ? "Adición" : productionKind === "bebidas" ? "Gaseosa" : "Producto o insumo"}
                        <select
                          value={productionProductSelect}
                          onChange={(event) => {
                            setProductionProductSelect(event.target.value)
                            setProductionItemUnit(event.target.value ? defaultUnit(event.target.value) : "")
                            setProductionFormError("")
                          }}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ ...controlSt, color: productionProductSelect ? t.text : t.muted }}
                        >
                          <option value="">Selecciona...</option>
                          {options.map((name) => (
                            <option key={name} value={name}>
                              {name}{rows.insumos?.some((item) => item[0] === name) ? " · Insumo" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        Cantidad
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={productionItemQuantity}
                          onChange={(event) => setProductionItemQuantity(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              add()
                            }
                          }}
                          className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={controlSt}
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                        Unidad
                        <select
                          value={productionItemUnit}
                          disabled={!productionProductSelect}
                          onChange={(event) => setProductionItemUnit(event.target.value)}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-2.5 py-2.5 text-sm outline-none disabled:cursor-default disabled:opacity-50"
                          style={controlSt}
                        >
                          {!productionProductSelect && <option value="">—</option>}
                          {productionProductSelect && unitOptions(productionItemUnit || defaultUnit(productionProductSelect)).map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={add}
                        className="flex cursor-pointer items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        {Ico.plus} Agregar
                      </button>
                    </div>
                    {productionItems.length ? (
                      <div className={`gap-2 ${productionItems.length > 4 ? "sm:columns-2" : ""}`}>
                        {productionItems.map((item, index) => {
                          const unit = item.unit || getNonconformingItemUnit(item.name)
                          const editing = productionItemEdit?.index === index
                          return (
                            <div
                              key={`${item.name}-${index}`}
                              className="mb-2 flex break-inside-avoid items-center gap-2 rounded-xl px-2.5 py-2"
                              style={{ border: `1px solid ${t.border}` }}
                            >
                              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: t.text }} title={item.name}>{item.name}</span>
                              {editing ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    autoFocus
                                    aria-label={`Cantidad de ${item.name}`}
                                    value={productionItemEdit.qty}
                                    onChange={(event) => setProductionItemEdit({ ...productionItemEdit, qty: event.target.value })}
                                    className="w-16 rounded-lg px-2 py-1.5 text-sm outline-none"
                                    style={controlSt}
                                  />
                                  <select
                                    aria-label={`Unidad de ${item.name}`}
                                    value={productionItemUnit || unit}
                                    onChange={(event) => setProductionItemUnit(event.target.value)}
                                    className="cursor-pointer rounded-lg px-1.5 py-1.5 text-sm outline-none"
                                    style={controlSt}
                                  >
                                    {unitOptions(unit).map((option) => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                  <button
                                    type="button"
                                    title="Guardar"
                                    aria-label={`Guardar ${item.name}`}
                                    onClick={() => {
                                      const value = Number(productionItemEdit.qty)
                                      if (!(value > 0)) return setProductionFormError("La cantidad debe ser mayor que 0.")
                                      setProductionItems((current) =>
                                        current.map((line, i) => (i === index ? { ...line, quantity: value, unit: productionItemUnit || unit } : line)),
                                      )
                                      setProductionItemEdit(null)
                                      setProductionItemUnit("")
                                      setProductionFormError("")
                                    }}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                    style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                                  >
                                    {Ico.check}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm" style={{ color: t.muted }}>{item.quantity.toLocaleString("es-CO")} {unit}</span>
                                  <button
                                    type="button"
                                    title="Editar"
                                    aria-label={`Editar ${item.name}`}
                                    onClick={() => {
                                      setProductionItemEdit({ index, qty: String(item.quantity) })
                                      setProductionItemUnit(unit)
                                    }}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                    style={{ color: C.mustard, background: `${C.mustard}14` }}
                                  >
                                    {Ico.edit}
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                title="Quitar"
                                aria-label={`Quitar ${item.name}`}
                                onClick={() => {
                                  setProductionItems((current) =>
                                    current.filter((candidate, i) => i !== index && candidate.parentId !== item.id),
                                  )
                                  setProductionItemEdit(null)
                                }}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                style={{ color: C.red, background: `${C.red}10` }}
                              >
                                {Ico.x}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="rounded-xl px-3 py-3 text-center text-xs" style={{ border: `1.5px dashed ${t.inputB}`, color: t.muted }}>
                        Aquí aparece lo que agregues como dañado.
                      </p>
                    )}
                    {productionFormError && <p role="alert" className="text-xs font-medium" style={{ color: C.red }}>{productionFormError}</p>}
                  </section>
                )
              })()}
              {isView && isSupply && row && supplyDetail(row)}
              {isView && isSupplier && row && supplierDetail(row)}
              {isUser && !isView && modal.mode === "add" && (
                <div
                  className="rounded-xl px-3.5 py-3 text-xs leading-relaxed sm:col-span-2"
                  style={{ background: `${C.mustard}12`, color: t.text, border: `1px solid ${C.mustard}35` }}
                >
                  Le llegará al correo una contraseña provisional y deberá cambiarla la primera vez que entre.
                </div>
              )}
              {formReturn && formReturn.child === modal.section && modal.mode === "add" && (
                <div
                  className="rounded-xl px-3.5 py-3 text-xs leading-relaxed sm:col-span-2 lg:col-span-4"
                  style={{ background: `${C.mustard}12`, color: t.text, border: `1px solid ${C.mustard}35` }}
                >
                  {formReturn.section === "proveedores" ? (
                    <>
                      Al guardar volverás al proveedor
                      {(formReturn.form["0"] || formReturn.form["10"]) && ` «${formReturn.form["0"] || formReturn.form["10"]}»`} con
                      este insumo ya seleccionado. Si cancelas, vuelves sin agregarlo.
                    </>
                  ) : formReturn.section === "ventas" ? (
                    <>Al guardar volverás a la venta con este pedido asociado y su total. Si cancelas, vuelves a la venta sin cambios.</>
                  ) : (
                    <>Al guardar volverás a la compra con este proveedor ya seleccionado. Si cancelas, vuelves a la compra sin cambios.</>
                  )}
                </div>
              )}
              {formDataFields.map((f) => {
              if (isPnc && modal.mode === "add" && !pncManual) return null
              if (isPnc && !isView && f.key === "4") return null
              // Insumo and supplier details have their own layout (supplyDetail, supplierDetail)
              // These details have their own layout below
              if (isView && (isSupply || isSupplier || modal.section === "cat-insumos" || modal.section === "perdidas")) return null
              if (isView && isPurchase) return null // the purchase ticket shows everything
              if (isPurchase && !isView && f.key === "2") return null
              // Shown in the detail header (with autoId, row[0] is the code, so field "0" stays)
              if (isView && isPurchaseModule && f.key === "0" && !cfg.autoId) return null
              if (modal.section === "perdidas" && !isView && f.key === "5") return null
              // Order total is computed from its products ("Total del pedido"), not typed
              if (isPedido && !isView && f.key === "5") return null
              // Modality and payment status come from the payment method (read-only)
              if (isPedido && !isView && f.key === "7" && modal.mode === "edit") {
                // Pendiente / Pendiente de verificación → Pagado: the current one and the next, never back
                const current = String(formData["7"] || "Pendiente")
                const next = PAYMENT_NEXT[current]
                const paid = current === "Pagado"
                return (
                  <div key={f.key} className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: t.muted }}>{f.label}</span>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                        style={{ background: paid ? "#2E7D60" : C.mustard }}
                      />
                      <select
                        value={current}
                        disabled={!next}
                        onChange={(event) => updateAdminField(modal.section, f.key, event.target.value)}
                        className="w-full min-w-0 cursor-pointer rounded-xl py-2.5 pl-7 pr-3 text-sm outline-none disabled:cursor-default"
                        style={{
                          background: paid ? "rgba(46,125,96,0.10)" : t.input,
                          border: `1.5px solid ${t.inputB}`,
                          color: paid ? "#2E7D60" : t.text,
                        }}
                      >
                        {[current, ...(next ? [next] : [])].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[11px]" style={{ color: t.muted }}>
                      {paid
                        ? "Pagado: su venta ya quedó registrada."
                        : "Al pasarlo a «Pagado» y guardar, se crea la venta del pedido."}
                    </span>
                  </div>
                )
              }
              // New order: modality and payment status aren't shown; they're set from the type and method on save
              if (isPedido && !isView && (f.key === "4" || (modal.mode === "add" && f.key === "7"))) return null
              if (isPedido && !isView && (f.key === "4" || f.key === "7")) {
                const payment = derivePedidoPayment(String(formData["3"] ?? ""), !!paymentProofDraft, String(formData["2"] ?? ""))
                const value = f.key === "4" ? payment.modalidad : payment.estadoPago
                return (
                  <div key={f.key} className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: t.muted }}>
                      {f.label}
                    </span>
                    <div
                      className="rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                      style={{
                        background: t.cardAlt,
                        border: `1px dashed ${t.inputB}`,
                        color: value ? (value === "Pagado" ? "#2E7D60" : t.text) : t.muted,
                      }}
                      title="Se asigna automáticamente según el método de pago"
                    >
                      {value || "Según el método de pago"}
                    </div>
                    {f.key === "7" && (
                      <span className="text-[11px]" style={{ color: t.muted }}>
                        Automático: efectivo en el local = pagado; transferencia con comprobante = pagado; efectivo a domicilio o para recoger = contraentrega, y queda pagado al marcarlo «Entregado».
                      </span>
                    )}
                  </div>
                )
              }
              // Production detail already shows "Creada" date/time in its summary
              if (isView && isProduction && (f.key === "3" || f.key === "4")) return null
              // Insumo technical sheet (fields 8-11) rendered as one card at field "8"
              if (isSupply && ["9", "10", "11"].includes(f.key)) return null
              if (isSupply && f.key === "8") {
                if (!showSupplyTechnicalSheet) return null
                const src = (key: string) => String((isView ? row?.[Number(key)] : formData[key]) ?? "")
                const supplyName = src("0").trim() || "este insumo"
                const mainSupplies = parseMainSupplies(src("10"))
                const setSheet = (key: string, value: string) => {
                  setSupplyFormError("")
                  updateAdminField(modal.section, key, value)
                }
                const unitOf = (name: string) => String(supplyInfo(name)?.[2] ?? "und")
                // Stored as text the backend already keeps: "Azúcar (50 g), Limón (2 und)"
                const setMainSupplies = (next: { name: string; quantity: string; unit: string }[]) =>
                  setSheet(
                    "10",
                    next.map((i) => (i.quantity ? `${i.name} (${i.quantity} ${i.unit.trim() || unitOf(i.name)})` : i.name)).join(", "),
                  )
                // Only plain insumos can be ingredients: not this one, nor others sold as products (e.g. a gaseosa)
                const ingredientOptions = getAvailableInsumos().filter(
                  (name) =>
                    name !== src("0").trim() &&
                    String(supplyInfo(name)?.[7] ?? "").toLowerCase() !== "sí" &&
                    !mainSupplies.some((i) => i.name === name),
                )
                const sheetControl = { background: t.card, border: `1.5px solid ${t.inputB}`, color: t.text }
                return (
                  <section
                    key="ficha-tecnica"
                    className={`rounded-xl p-4 sm:col-span-2 ${sheetBeside ? "lg:col-start-3 lg:row-span-8 lg:row-start-1" : ""}`}
                    style={{ background: `${C.mustard}0D`, border: `1.5px solid ${C.mustard}55` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.mustard }}>
                          Ficha técnica · Producto de insumo
                        </div>
                        <div className="text-sm font-semibold break-words" style={{ color: t.text }}>
                          {src("8").trim() || `Ficha técnica - ${supplyName}`}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: `${C.mustard}20`, color: C.mustard }}
                      >
                        {src("9") || "v1.0"}
                      </span>
                    </div>
                    {!isView && !sheetBeside && (
                      <p className="mt-1 text-xs" style={{ color: t.muted }}>
                        Esta ficha se crea junto con el insumo y también aparecerá en el módulo Productos.
                      </p>
                    )}
                    <div className="mt-4 grid gap-3">
                      {!isView && (
                        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                          Nombre de la ficha
                          <input
                            value={formData["8"] ?? ""}
                            onChange={(e) => setSheet("8", e.target.value)}
                            placeholder={`Ficha técnica - ${supplyName}`}
                            className="rounded-xl px-3 py-2.5 text-sm outline-none"
                            style={sheetControl}
                          />
                        </label>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: t.muted }}>
                          Insumos principales{!isView && " *"}
                        </span>
                        {mainSupplies.length === 0 ? (
                          <span className="self-start rounded-full px-2.5 py-1 text-xs" style={{ background: t.input, color: t.muted }}>
                            Sin insumos seleccionados
                          </span>
                        ) : isView ? (
                          <div className="flex flex-wrap gap-2">
                            {splitNames(src("10")).map((part) => (
                              <span
                                key={part}
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ background: `${C.mustard}15`, color: C.mustard }}
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>
                              <span className="flex-1">Insumo</span>
                              <span className="w-[16rem] text-center">Cuánto usas y en qué unidad</span>
                              <span className="w-7" />
                            </div>
                            <datalist id="recipe-unit-options">
                              {RECIPE_UNIT_SUGGESTIONS.map((u) => (
                                <option key={u} value={u} />
                              ))}
                            </datalist>
                            {mainSupplies.map((item, index) => (
                              <div key={item.name} className="flex items-center gap-2">
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: t.text }}>
                                  {item.name}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Menos ${item.name}`}
                                  onClick={() =>
                                    setMainSupplies(
                                      mainSupplies.map((m, i) =>
                                        i === index ? { ...m, quantity: String(Math.max(0, (Number(m.quantity) || 0) - 1)) } : m,
                                      ),
                                    )
                                  }
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg font-bold"
                                  style={sheetControl}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    setMainSupplies(
                                      mainSupplies.map((m, i) => (i === index ? { ...m, quantity: e.target.value } : m)),
                                    )
                                  }
                                  placeholder="0"
                                  aria-label={`Cantidad de ${item.name}`}
                                  className="w-16 rounded-xl px-2 py-2 text-center text-sm outline-none"
                                  style={{
                                    ...sheetControl,
                                    border: `1.5px solid ${Number(item.quantity) > 0 ? t.inputB : C.red}`,
                                  }}
                                />
                                <button
                                  type="button"
                                  aria-label={`Más ${item.name}`}
                                  onClick={() =>
                                    setMainSupplies(
                                      mainSupplies.map((m, i) => (i === index ? { ...m, quantity: String((Number(m.quantity) || 0) + 1) } : m)),
                                    )
                                  }
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg font-bold"
                                  style={sheetControl}
                                >
                                  +
                                </button>
                                <input
                                  list="recipe-unit-options"
                                  value={item.unit}
                                  onChange={(e) =>
                                    setMainSupplies(
                                      mainSupplies.map((m, i) =>
                                        // "," and "()" would break the stored text "Azúcar (50 g), ..."
                                        i === index ? { ...m, unit: e.target.value.replace(/[(),]/g, "").slice(0, 20) } : m,
                                      ),
                                    )
                                  }
                                  placeholder={unitOf(item.name)}
                                  aria-label={`Unidad de ${item.name}`}
                                  title={`Escribe la unidad que usas (se compra en ${unitOf(item.name)})`}
                                  className="w-24 rounded-xl px-2 py-2 text-xs outline-none"
                                  style={sheetControl}
                                />
                                <button
                                  type="button"
                                  aria-label={`Quitar ${item.name} de la ficha`}
                                  onClick={() => setMainSupplies(mainSupplies.filter((_, i) => i !== index))}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                  style={{ color: C.red, background: `${C.red}10` }}
                                >
                                  {Ico.x}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {!isView && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value)
                                setMainSupplies([...mainSupplies, { name: e.target.value, quantity: "", unit: compatibleUnits(unitOf(e.target.value))[0] }])
                            }}
                            aria-invalid={!!formFieldErrors["10"]}
                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                            style={{
                              ...sheetControl,
                              border: `1.5px solid ${formFieldErrors["10"] ? C.red : t.inputB}`,
                              color: t.muted,
                            }}
                          >
                            <option value="">+ Agregar insumo a la ficha...</option>
                            {ingredientOptions.map((name) => (
                              <option key={name} value={name}>
                                {name} ({unitOf(name)})
                              </option>
                            ))}
                          </select>
                        )}
                        {formFieldErrors["10"] && (
                          <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                            {formFieldErrors["10"]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: t.muted }}>
                          Cómo se prepara{!isView && " *"}
                        </span>
                        {isView ? (
                          <div className="text-sm whitespace-pre-line break-words" style={{ color: t.text }}>
                            {src("11") || "—"}
                          </div>
                        ) : (
                          <textarea
                            value={formData["11"] ?? ""}
                            onChange={(e) => setSheet("11", e.target.value)}
                            rows={3}
                            placeholder={"1. Recibir y revisar el insumo.\n2. Porcionar.\n3. Almacenar y servir."}
                            className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                            style={sheetControl}
                          />
                        )}
                      </div>
                    </div>
                    {!isView && (shownFieldError("10") || shownFieldError("11")) && (
                      <p className="mt-3 text-xs font-medium" style={{ color: C.red }} role="alert">
                        {shownFieldError("10") || shownFieldError("11")}
                      </p>
                    )}
                  </section>
                )
              }
              // Purchase form: subtotal/total are computed from the items below
              if (isPurchase && (f.key === "3" || f.key === "4")) return null
              if (isPurchase && f.key === "6") {
                const supplier = String(formData["0"] ?? "")
                const allowed = supplierSupplies(supplier)
                const items = parsePurchaseItems(formData["6"])
                const total = items.reduce((sum, item) => sum + item.total, 0)
                const setItems = (next: { name: string; quantity: string; unitPrice?: string }[]) =>
                  setFormData((current) => ({
                    ...current,
                    "6": next.map((i) => `${i.name} | ${i.quantity} | ${i.unitPrice ?? 0}`).join("\n"),
                  }))
                const pickSupply = (name: string) => {
                  setPurchaseItemSelect(name)
                  setPurchaseItemPrice(name ? String(supplyInfo(name)?.[3] ?? "") : "")
                  setPurchaseFormError("")
                }
                const addItem = () => {
                  const qty = toDecimal(purchaseItemQty)
                  const price = Number(purchaseItemPrice)
                  if (!purchaseItemSelect) return setPurchaseFormError("Elige el insumo que vas a agregar.")
                  if (!(qty > 0)) return setPurchaseFormError("La cantidad debe ser mayor que 0.")
                  if (!(price > 0)) return setPurchaseFormError("Escribe el precio unitario.")
                  if (price > MAX_PRICE) return setPurchaseFormError(`El precio unitario puede ser máximo ${fmt(MAX_PRICE)}.`)
                  const existing = items.find(
                    (i) => i.name === purchaseItemSelect && Number(i.unitPrice) === price,
                  )
                  setItems(
                    existing
                      ? items.map((i) => (i === existing ? { ...i, quantity: String(Number(i.quantity) + qty) } : i))
                      : [...items, { name: purchaseItemSelect, quantity: String(qty), unitPrice: String(price) }],
                  )
                  setPurchaseItemSelect("")
                  setPurchaseItemQty("1")
                  setPurchaseItemPrice("")
                  // A soda bought at or above its sale price would sell at a loss: say so (it still gets added)
                  const salePrice = Number(sodaProductRow(purchaseItemSelect)?.[2]) || 0
                  setPurchaseFormError(
                    isSodaName(purchaseItemSelect) && salePrice > 0 && price >= salePrice
                      ? `Ojo: «${purchaseItemSelect}» se vende a ${fmt(salePrice)} y la estás comprando a ${fmt(price)} por unidad: se vendería a pérdida. Revisa si el precio es por unidad o sube su precio de venta en Productos.`
                      : "",
                  )
                }
                const controlSt = { background: t.input, border: `1.5px solid ${t.inputB}`, color: t.text }
                // "Enviar a pérdida": only for items already saved in this purchase (edit mode)
                const savedItems = modal.mode === "edit" ? parsePurchaseItems(row?.[6]) : []
                const lossOrigin = row ? purchaseLabel(row) : ""
                const lostSoFar = (name: string) =>
                  (rows.perdidas || [])
                    .filter((l) => !isReturnedLoss(l) && !!row && isLossOfPurchase(l, row) && String(l[0]) === name)
                    .reduce((sum, l) => sum + (parseFloat(String(l[1])) || 0), 0)
                const openLoss = (name: string) => {
                  const bought = savedItems
                    .filter((i) => i.name === name)
                    .reduce((sum, i) => sum + Number(i.quantity || 0), 0)
                  const max = bought - lostSoFar(name)
                  setLossError("")
                  if (!(max > 0)) {
                    setPurchaseNotice(`Ya registraste como pérdida todo el insumo «${name}» de esta compra.`)
                    return
                  }
                  setPurchaseNotice("")
                  const now = new Date()
                  setLossDraft({
                    insumo: name,
                    unit: String(supplyInfo(name)?.[2] ?? "und"),
                    max,
                    qty: "",
                    motivo: "",
                    responsable: user?.name ?? "",
                    fecha: [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-"),
                    origin: lossOrigin,
                    purchaseId: String(row?.[DB_SYNC.compras.idIndex] ?? ""),
                  })
                }
                return (
                  <section
                    key="purchase-items"
                    className="rounded-xl p-4 sm:col-span-2"
                    style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}
                  >
                    <div className="text-sm font-semibold" style={{ color: t.text }}>
                      Insumos comprados
                    </div>
                    {!supplier ? (
                      <p className="mt-1 text-xs" style={{ color: t.muted }}>
                        Primero selecciona el proveedor para ver los insumos que te vende.
                      </p>
                    ) : !allowed.length ? (
                      <p className="mt-1 text-xs" style={{ color: C.red }}>
                        «{supplier}» no tiene insumos asignados. Asígnalos en Proveedores → Editar → «Insumos que suministra».
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-xs" style={{ color: t.muted }}>
                          Insumos que vende «{supplier}». Agrega todos los que necesites.
                        </p>
                        <div className="mt-3 grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_96px_120px_auto]">
                          <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                            Insumo
                            {/* Search: type to filter the supplier's insumos, click one to pick it */}
                            <div className="relative">
                              <div className="flex items-center gap-2 rounded-xl px-3" style={controlSt}>
                                <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                                <input
                                  type="text"
                                  value={purchaseSupplySearch ?? purchaseItemSelect}
                                  onChange={(e) => {
                                    setPurchaseSupplySearch(e.target.value)
                                    if (purchaseItemSelect) pickSupply("")
                                  }}
                                  onFocus={(e) => {
                                    setPurchaseSupplySearch("")
                                    e.target.select()
                                  }}
                                  onBlur={() => setTimeout(() => setPurchaseSupplySearch(null), 150)}
                                  onKeyDown={(e) => {
                                    if (e.key !== "Enter") return
                                    e.preventDefault()
                                    const q = normalizeName(purchaseSupplySearch ?? "")
                                    const first = allowed.find((name) => normalizeName(name).includes(q))
                                    if (first) {
                                      pickSupply(first)
                                      setPurchaseSupplySearch(null)
                                    }
                                  }}
                                  placeholder="Busca un insumo..."
                                  aria-label="Buscar insumo"
                                  className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none"
                                  style={{ color: t.text }}
                                />
                              </div>
                              {purchaseSupplySearch !== null && (
                                <div
                                  role="listbox"
                                  className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl py-1 shadow-lg"
                                  style={{ background: t.card, border: `1px solid ${t.border}` }}
                                >
                                  {(() => {
                                    const q = normalizeName(purchaseSupplySearch)
                                    const found = allowed.filter((name) => normalizeName(name).includes(q))
                                    return found.length ? (
                                      found.map((name) => (
                                        <button
                                          key={name}
                                          type="button"
                                          role="option"
                                          aria-selected={name === purchaseItemSelect}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            pickSupply(name)
                                            setPurchaseSupplySearch(null)
                                          }}
                                          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:opacity-80"
                                          style={{ color: t.text }}
                                        >
                                          <span className="min-w-0 truncate">{name}</span>
                                          <span className="flex-shrink-0 text-[11px]" style={{ color: t.muted }}>
                                            {String(supplyInfo(name)?.[2] ?? "")}
                                          </span>
                                        </button>
                                      ))
                                    ) : (
                                      <p className="px-3 py-2 text-center text-xs" style={{ color: t.muted }}>
                                        Ningún insumo de «{supplier}» coincide.
                                      </p>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                            Cantidad
                            <input
                              type="text"
                              inputMode="decimal"
                              value={purchaseItemQty}
                              onChange={(e) => setPurchaseItemQty(e.target.value)}
                              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                              style={controlSt}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                            Precio unitario
                            <input
                              type="number"
                              min="0"
                              value={purchaseItemPrice}
                              onChange={(e) => setPurchaseItemPrice(e.target.value)}
                              placeholder="$"
                              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                              style={controlSt}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={addItem}
                            className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold hover:opacity-90"
                            style={{ background: C.mustard, color: "#fff" }}
                          >
                            Agregar
                          </button>
                        </div>
                      </>
                    )}
                    <div className="mt-3 flex flex-col">
                      {items.length === 0 ? (
                        <div className="rounded-lg px-3 py-3 text-center text-xs" style={{ background: t.input, color: t.muted }}>
                          Aún no has agregado insumos.
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-center gap-3 border-b py-2 text-sm last:border-b-0"
                            style={{ borderColor: t.border }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold" style={{ color: t.text }}>{item.name}</div>
                              <div className="text-[11px]" style={{ color: t.muted }}>
                                {Number(item.quantity).toLocaleString("es-CO")} {String(supplyInfo(item.name)?.[2] ?? "und")} × {fmt(Number(item.unitPrice || 0))}
                              </div>
                              {savedItems.length > 0 && lostSoFar(item.name) > 0 && (
                                <div className="text-[11px] font-semibold" style={{ color: C.red }}>
                                  Perdido: {lostSoFar(item.name).toLocaleString("es-CO")} {String(supplyInfo(item.name)?.[2] ?? "und")}
                                </div>
                              )}
                            </div>
                            {purchaseItemEdit?.index === index ? (
                              <>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`Cantidad de ${item.name}`}
                                  value={purchaseItemEdit.qty}
                                  onChange={(e) => setPurchaseItemEdit({ ...purchaseItemEdit, qty: e.target.value })}
                                  className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none"
                                  style={controlSt}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  aria-label={`Precio unitario de ${item.name}`}
                                  value={purchaseItemEdit.price}
                                  onChange={(e) => setPurchaseItemEdit({ ...purchaseItemEdit, price: e.target.value })}
                                  className="w-24 rounded-lg px-2 py-1.5 text-sm outline-none"
                                  style={controlSt}
                                />
                                <button
                                  type="button"
                                  title="Guardar cambios"
                                  aria-label={`Guardar cambios de ${item.name}`}
                                  onClick={() => {
                                    const qty = toDecimal(purchaseItemEdit.qty)
                                    const price = Number(purchaseItemEdit.price)
                                    if (!(qty > 0)) return setPurchaseFormError("La cantidad debe ser mayor que 0.")
                                    if (!(price > 0)) return setPurchaseFormError("Escribe el precio unitario.")
                                    if (price > MAX_PRICE) return setPurchaseFormError(`El precio unitario puede ser máximo ${fmt(MAX_PRICE)}.`)
                                    setItems(items.map((i, n) => (n === index ? { ...i, quantity: String(qty), unitPrice: String(price) } : i)))
                                    setPurchaseItemEdit(null)
                                    setPurchaseFormError("")
                                  }}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                  style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                                >
                                  {Ico.check}
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold" style={{ color: C.mustard }}>{fmt(item.total)}</span>
                                {modal.mode === "add" && <button
                                  type="button"
                                  title="Editar cantidad y precio"
                                  aria-label={`Editar ${item.name}`}
                                  onClick={() => {
                                    setPurchaseItemEdit({ index, qty: String(item.quantity), price: String(item.unitPrice ?? "") })
                                    setPurchaseFormError("")
                                  }}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                                  style={{ color: C.mustard, background: `${C.mustard}14` }}
                                >
                                  {Ico.edit}
                                </button>}
                              </>
                            )}
                            {/* Not on an annulled purchase: its insumos already left the stock */}
                            {savedItems.some((i) => i.name === item.name) && isStatusActive(row?.[5] ?? "Activo") && (
                              <button
                                type="button"
                                title="Enviar este insumo a Pérdida de insumos"
                                aria-label={`Enviar ${item.name} a pérdida de insumos`}
                                onClick={() => openLoss(item.name)}
                                className="flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold hover:opacity-80"
                                style={{ color: C.amber, background: `${C.amber}18` }}
                              >
                                {Ico.alert} Pérdida
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`Quitar ${item.name}`}
                              onClick={() => {
                                // Losses sent from this purchase need what was bought to stay in it
                                const lost = savedItems.length ? lostSoFar(item.name) : 0
                                const left = items
                                  .filter((other, i) => i !== index && other.name === item.name)
                                  .reduce((sum, other) => sum + Number(other.quantity || 0), 0)
                                if (lost > left)
                                  return setPurchaseFormError(
                                    `No puedes quitar «${item.name}»: ya hay ${lost.toLocaleString("es-CO")} ${String(supplyInfo(item.name)?.[2] ?? "und")} registrados como pérdida de esta compra.`,
                                  )
                                setItems(items.filter((_, i) => i !== index))
                                setPurchaseItemEdit(null)
                              }}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                              style={{ color: C.red, background: `${C.red}10` }}
                            >
                              {Ico.x}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3 flex justify-end border-t pt-3 text-sm" style={{ borderColor: t.border, color: t.text }}>
                      <span>
                        Total: <strong style={{ color: C.mustard }}>{fmt(total)}</strong>
                      </span>
                    </div>
                    {purchaseFormError && (
                      <p className="mt-2 text-xs font-medium" style={{ color: C.red }} role="alert">
                        {purchaseFormError}
                      </p>
                    )}
                    {purchaseNotice && (
                      <p
                        className="mt-2 rounded-lg px-3 py-2 text-xs font-medium"
                        style={{ background: "rgba(58,109,94,0.12)", color: "#2E7D60" }}
                        role="status"
                      >
                        {purchaseNotice}
                      </p>
                    )}
                  </section>
                )
              }
              const isLocalClient =
                isClient && String(formData["6"] ?? "").toLowerCase() === "sí"
              const requiredFormField =
                !isView &&
                getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key)
              const fieldValidationError = isView ? undefined : formFieldErrors[f.key]
              if (isClient && !isView && f.key === "5") {
                const part = (key: string) => String(formData[`a_${key}`] ?? "")
                const parts: AddressParts = Object.fromEntries(
                  ["via", "num", "cruce", "placa", "interior", "tipo", "d0", "d1", "d2"].map((key) => [key, part(key).trim()]),
                )
                const setPart = (key: string, value: string) => {
                  const next = { ...parts, [key]: value.trim() }
                  // Changing the housing type clears the details of the previous one
                  if (key === "tipo") ["d0", "d1", "d2"].forEach((k) => (next[k] = ""))
                  setFormData((current) => ({
                    ...current,
                    [`a_${key}`]: value,
                    ...(key === "tipo" ? { a_d0: "", a_d1: "", a_d2: "" } : {}),
                    "5": composeAddress(next),
                  }))
                  setFormFieldErrors((current) => ({ ...current, "5": "" }))
                }
                const controlSt = { background: t.input, border: `1.5px solid ${t.inputB}`, color: t.text }
                const small = "flex min-w-0 flex-col gap-1 text-[11px]"
                const input = (key: string, label: string, placeholder = "") => (
                  <label key={key} className={small} style={{ color: t.muted }}>
                    {label}
                    <input
                      value={part(key)}
                      onChange={(event) => setPart(key, event.target.value)}
                      placeholder={placeholder}
                      className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={controlSt}
                    />
                  </label>
                )
                const housing = HOUSING[parts.tipo]
                const preview = String(formData["5"] ?? "")
                return (
                  <div key="5" className="flex flex-col gap-3 rounded-2xl p-4 sm:col-span-2" style={{ border: `1px solid ${fieldValidationError ? C.red : t.border}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: C.mustard }}>{Ico.mapPin}</span>
                      <span className="text-xs font-semibold" style={{ color: fieldValidationError ? C.red : t.muted }}>
                        Dirección principal *
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
                      <label className={small} style={{ color: t.muted }}>
                        Vía
                        <select
                          value={part("via")}
                          onChange={(event) => setPart("via", event.target.value)}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ ...controlSt, color: part("via") ? t.text : t.muted }}
                        >
                          <option value="">Calle, carrera...</option>
                          {ADDRESS_VIAS.map((via) => <option key={via} value={via}>{via}</option>)}
                        </select>
                      </label>
                      {input("num", "Número", "45A")}
                      {input("cruce", "#", "12 Sur")}
                      {input("placa", "-", "08")}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                      {input("interior", "Interior (opcional)", "2")}
                      <label className={small} style={{ color: t.muted }}>
                        Tipo de vivienda (opcional)
                        <select
                          value={part("tipo")}
                          onChange={(event) => setPart("tipo", event.target.value)}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ ...controlSt, color: part("tipo") ? t.text : t.muted }}
                        >
                          <option value="">Selecciona...</option>
                          {Object.keys(HOUSING).map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </label>
                    </div>
                    {housing && (
                      <div
                        className={`grid gap-2 rounded-xl p-3 ${housing.labels.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
                        style={{ background: t.cardAlt }}
                      >
                        {housing.labels.map((label, i) => input(`d${i}`, `${label} (opcional)`))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span style={{ color: t.muted }}>Así queda:</span>
                      <span style={{ color: preview ? t.text : t.muted }}>
                        {preview || "Elige la vía y escribe los tres números."}
                      </span>
                    </div>
                    {fieldValidationError && (
                      <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                        Completa la vía y los tres números de la dirección.
                      </span>
                    )}
                  </div>
                )
              }
              if (isReturns && f.key === "1") {
                const saleCode = String((isView ? row?.[1] : formData["1"]) ?? "")
                const sale = (rows.ventas || []).find((v) => String(v[0]) === saleCode)
                const lines = getSaleOrderLines(sale ?? null).filter((line) => !line.parentId)
                const date = new Date(`${String(sale?.[3] ?? "").slice(0, 10)}T00:00:00`)
                return (
                  <div key="1" className="flex min-w-0 flex-col gap-2 rounded-2xl px-4 py-3 sm:col-span-2" style={{ border: `1px solid ${fieldValidationError ? C.red : t.border}` }}>
                    {!isView && (
                      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: fieldValidationError ? C.red : t.muted }}>
                        Busca la venta *
                        <div className="search-control flex items-center gap-2 rounded-full px-3">
                          <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                          <input
                            list="return-sales"
                            value={saleCode}
                            onChange={(event) => {
                              const code = event.target.value.trim()
                              setFormData((current) => ({ ...current, "1": code, "6": "[]" }))
                              setFormFieldErrors((current) => ({ ...current, "1": "" }))
                            }}
                            placeholder="Código de la venta o cliente..."
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-normal outline-none"
                            style={{ color: t.text }}
                          />
                          {saleCode && (
                            <button
                              type="button"
                              className="search-clear"
                              aria-label="Limpiar venta seleccionada"
                              onClick={() => setFormData((current) => ({ ...current, "1": "", "6": "[]" }))}
                            >
                              ×
                            </button>
                          )}
                          <datalist id="return-sales">
                            {(rows.ventas || [])
                              .filter((v) => !saleReturnBlock(v))
                              .map((v) => (
                                <option key={String(v[0])} value={String(v[0])}>{`${String(v[2] ?? "")} · ${fmt(Number(v[7]) || 0)}`}</option>
                              ))}
                          </datalist>
                        </div>
                        {fieldValidationError && <span className="text-[10px] font-medium">{fieldValidationError}</span>}
                        <span className="text-[10px] font-normal" style={{ color: t.muted }}>
                          Solo salen las ventas que se pueden devolver: directas, o con su orden de producción en «Terminado».
                        </span>
                      </label>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px]" style={{ color: t.muted }}>Venta asociada</div>
                        <div className="text-sm font-semibold" style={{ color: t.text }}>{saleCode || "—"}</div>
                      </div>
                      {sale && <span className="text-lg font-semibold" style={{ color: C.mustard }}>{fmt(Number(sale[7]) || 0)}</span>}
                    </div>
                    {sale ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          {([
                            ["Cliente", String(sale[2] || "—")],
                            ["Fecha", Number.isNaN(date.getTime()) ? String(sale[3] || "—") : date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })],
                            ["Método de pago", String(sale[5] || "—")],
                            ["Pedido", String(sale[9] || "Sin pedido")],
                          ] as const).map(([label, value]) => (
                            <div key={label} className="min-w-0 rounded-xl px-3 py-2" style={{ background: t.cardAlt }}>
                              <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                              <div className="break-words" style={{ color: t.text }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const allLines = getSaleOrderLines(sale ?? null)
                          let chosen: { id: string; product: string; quantity: number; unitPrice: number }[] = []
                          try {
                            chosen = JSON.parse(String((isView ? row?.[6] : formData["6"]) || "[]"))
                          } catch {
                            chosen = []
                          }
                          const setChosen = (next: typeof chosen) => {
                            setFormData((current) => ({ ...current, "6": JSON.stringify(next) }))
                            setFormFieldErrors((current) => ({ ...current, "1": "" }))
                          }
                          const refund = chosen.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                          if (isView)
                            return (
                              <div className="rounded-xl px-3 py-2.5" style={{ background: `${C.red}08`, border: `1px solid ${C.red}25` }}>
                                <div className="mb-1 text-[11px] font-semibold" style={{ color: C.red }}>Productos devueltos</div>
                                {chosen.length ? (
                                  <>
                                    {chosen.map((item) => (
                                      <div key={item.id} className="flex justify-between gap-3 text-sm" style={{ color: t.text }}>
                                        <span className="min-w-0 break-words">{item.product} ×{item.quantity}</span>
                                        <span className="flex-shrink-0">{fmt(item.quantity * item.unitPrice)}</span>
                                      </div>
                                    ))}
                                    <div className="mt-1 flex justify-between border-t pt-1 text-sm font-semibold" style={{ borderColor: `${C.red}25`, color: C.red }}>
                                      <span>Valor devuelto</span>
                                      <span>{fmt(refund)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-xs" style={{ color: t.muted }}>No se registraron productos (devolución anterior a este cambio).</span>
                                )}
                              </div>
                            )
                          if (!allLines.length) return <p className="text-xs" style={{ color: t.muted }}>Esta venta no tiene el detalle de sus productos.</p>
                          return (
                            <div className="rounded-xl px-3 py-2.5" style={{ background: t.cardAlt }}>
                              <div className="mb-1.5 text-[11px] font-semibold" style={{ color: t.muted }}>¿Qué productos se devuelven?</div>
                              <div className={`gap-x-5 ${allLines.length > 5 ? "sm:columns-2" : ""}`}>
                                {allLines.map((line) => {
                                  const picked = chosen.find((item) => item.id === line.id)
                                  return (
                                    <div key={line.id} className={`mb-1 flex break-inside-avoid items-center gap-2 text-sm ${line.parentId ? "pl-5" : ""}`}>
                                      <input
                                        type="checkbox"
                                        aria-label={`Devolver ${line.product}`}
                                        checked={!!picked}
                                        onChange={() =>
                                          setChosen(
                                            picked
                                              ? chosen.filter((item) => item.id !== line.id)
                                              : [...chosen, { id: line.id, product: line.product, quantity: line.quantity, unitPrice: line.unitPrice }],
                                          )
                                        }
                                        style={{ accentColor: C.red }}
                                      />
                                      <span className="min-w-0 flex-1 break-words" style={{ color: line.parentId ? t.muted : t.text }}>
                                        {line.parentId ? "+ " : ""}{line.product}
                                      </span>
                                      {picked ? (
                                        <input
                                          type="number"
                                          min="1"
                                          max={line.quantity}
                                          aria-label={`Cantidad de ${line.product} que se devuelve`}
                                          value={picked.quantity}
                                          onChange={(event) =>
                                            setChosen(
                                              chosen.map((item) =>
                                                item.id === line.id
                                                  ? { ...item, quantity: Math.min(line.quantity, Math.max(1, Math.floor(Number(event.target.value)) || 1)) }
                                                  : item,
                                              ),
                                            )
                                          }
                                          className="w-14 rounded-lg px-2 py-1 text-sm outline-none"
                                          style={{ background: t.card, border: `1px solid ${t.inputB}`, color: t.text }}
                                        />
                                      ) : null}
                                      <span className="w-14 flex-shrink-0 text-right text-xs" style={{ color: t.muted }}>de {line.quantity}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="mt-1.5 flex justify-between border-t pt-1.5 text-sm" style={{ borderColor: t.border }}>
                                <span style={{ color: t.muted }}>Valor a devolver o reembolsar</span>
                                <span className="font-semibold" style={{ color: chosen.length ? C.red : t.muted }}>{fmt(refund)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: t.muted }}>
                        {saleCode ? "No se encontró una venta con ese código." : "Aún no has elegido la venta."}
                      </p>
                    )}
                  </div>
                )
              }
              if (isSupplier && !isView && f.key === "15") {
                const types = [
                  { value: "Persona jurídica", icon: Ico.shopping, hint: "Empresa con NIT y una persona de contacto" },
                  { value: "Persona natural", icon: Ico.user, hint: "Una persona que vende con su documento de identidad" },
                ]
                // Type chosen: only its form shows, with a way back to the two options
                const chosen = types.find((type) => type.value === formData["15"])
                if (chosen) {
                  return (
                    <div
                      key="15"
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 sm:col-span-2 lg:col-span-4"
                      style={{ background: `${C.mustard}10`, border: `1px solid ${C.mustard}35` }}
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: C.mustard, color: "#fff" }}>
                        {chosen.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold" style={{ color: t.text }}>{chosen.value}</span>
                        <span className="block text-[11px]" style={{ color: t.muted }}>{chosen.hint}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => updateAdminField("proveedores", "15", "")}
                        className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: t.card, color: t.text, border: `1px solid ${t.inputB}` }}
                      >
                        <span className="rotate-90">{Ico.chevDown}</span> Cambiar tipo
                      </button>
                    </div>
                  )
                }
                return (
                  <div key="15" className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                    {!formData["15"] && (
                      <p className="text-xs font-semibold" style={{ color: t.muted }}>
                        ¿Qué tipo de proveedor vas a registrar?
                      </p>
                    )}
                    <div role="radiogroup" aria-label="Tipo de persona" className="grid gap-3 sm:grid-cols-2">
                      {types.map((type) => {
                        const on = formData["15"] === type.value
                        return (
                          <button
                            key={type.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => updateAdminField("proveedores", "15", type.value)}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 text-left transition ${formData["15"] ? "py-2.5" : "py-5"}`}
                            style={{
                              background: on ? `${C.mustard}14` : t.input,
                              border: `1.5px solid ${on ? C.mustard : fieldValidationError ? C.red : t.inputB}`,
                              color: t.text,
                            }}
                          >
                            <span
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ background: on ? C.mustard : `${C.mustard}18`, color: on ? "#fff" : C.mustard }}
                            >
                              {type.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{type.value}</span>
                              <span className="block text-[11px]" style={{ color: t.muted }}>{type.hint}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {fieldValidationError && (
                      <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                        Elige el tipo de persona.
                      </span>
                    )}
                  </div>
                )
              }
              if (isSupplier && !isView && !formData["15"]) return null
              // Supplier detail: insumos grouped by category
              if (isSupplier && isView && f.key === "7") {
                const names = splitList(String(row?.[7] ?? ""))
                return (
                  <div key="7" className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                    <span className="text-xs font-semibold" style={{ color: t.muted }}>
                      Insumos que suministra ({names.length})
                    </span>
                    {names.length ? (
                      renderSupplyGroups(names, "sm:grid-cols-2 lg:grid-cols-3")
                    ) : (
                      <span className="text-sm" style={{ color: t.muted }}>Sin insumos asignados.</span>
                    )}
                  </div>
                )
              }
              // Supplier form: pick which insumos this supplier sells (search box that opens a list)
              if (isSupplier && !isView && f.key === "7") {
                const selected = splitList(String(formData["7"] ?? ""))
                const setSelected = (next: string[]) =>
                  updateAdminField("proveedores", "7", [...new Set(next)].join(", "))
                const toggleSupply = (name: string) =>
                  setSelected(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name])
                // Active insumos, plus any already chosen (even if deactivated later), grouped by category
                const query = normalizeName(supplierSupplySearch)
                const groups = new Map<string, string[]>()
                ;(rows.insumos || [])
                  .filter((r) => isActiveStatus(r[12]) || selected.includes(String(r[0])))
                  .forEach((r) => {
                    const name = String(r[0] ?? "").trim()
                    if (!name || (query && !normalizeName(name).includes(query))) return
                    const category = String(r[1] ?? "").trim() || "Sin categoría"
                    groups.set(category, [...(groups.get(category) || []), name])
                  })
                // Sodas not bought yet (no insumo): offered too, the first purchase creates them
                sodaOptions
                  .filter((name) => !supplyInfo(name) && (!query || normalizeName(name).includes(query)))
                  .forEach((name) => groups.set("Bebidas", [...(groups.get("Bebidas") || []), name]))
                const categories = [...groups.keys()].sort((x, y) => x.localeCompare(y))
                const menu = supplierSupplyOpen
                const openMenu = (box: HTMLElement) => setSupplierSupplyOpen(box.getBoundingClientRect())
                const closeMenu = () => {
                  setSupplierSupplyOpen(null)
                  setSupplierSupplySearch("")
                }
                // Opens upwards when there's no room below
                const opensDown = !menu || window.innerHeight - menu.bottom >= 280 || menu.top < 280
                return (
                  <div
                    key="7"
                    className={`flex min-w-0 flex-col gap-1 sm:col-span-2 ${naturalSupplierForm ? "lg:col-span-4" : "lg:col-span-2 lg:col-start-1"}`}
                  >
                    <label htmlFor="supplier-supplies" className="text-xs font-semibold" style={{ color: fieldValidationError ? C.red : t.muted }}>
                      Insumos que vende{requiredFormField && " *"}
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="search-control flex min-w-0 flex-1 cursor-text items-center gap-2 rounded-full px-3 py-2"
                        style={{ background: t.input, border: `1.5px solid ${fieldValidationError ? C.red : menu ? C.mustard : t.inputB}` }}
                        onClick={(e) => openMenu(e.currentTarget)}
                      >
                        <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                        <input
                          id="supplier-supplies"
                          role="combobox"
                          aria-expanded={!!menu}
                          aria-controls="supplier-supplies-list"
                          autoComplete="off"
                          value={supplierSupplySearch}
                          onFocus={(e) => openMenu(e.currentTarget.parentElement!)}
                          onChange={(e) => {
                            setSupplierSupplySearch(e.target.value)
                            if (!menu) openMenu(e.currentTarget.parentElement!)
                          }}
                          onKeyDown={(e) => e.key === "Escape" && closeMenu()}
                          placeholder={
                            selected.length
                              ? `${selected.length} seleccionado${selected.length === 1 ? "" : "s"} · buscar para agregar...`
                              : "Selecciona los insumos..."
                          }
                          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                          style={{ color: t.text }}
                        />
                        {supplierSupplySearch && (
                          <button
                            type="button"
                            className="search-clear"
                            aria-label="Limpiar búsqueda de insumos"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => setSupplierSupplySearch("")}
                          >
                            ×
                          </button>
                        )}
                        <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.chevDown}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openChildForm("insumos")}
                        title="Crear un insumo nuevo y volver a este proveedor"
                        className="flex flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold"
                        style={{ background: `${C.mustard}18`, color: C.mustard, border: `1.5px solid ${C.mustard}40` }}
                      >
                        {Ico.plus} Crear insumo
                      </button>
                    </div>
                    {menu && (
                      <>
                        {/* Click outside closes the list */}
                        <div className="fixed inset-0 z-[60]" onClick={closeMenu} />
                        <div
                          id="supplier-supplies-list"
                          role="listbox"
                          aria-multiselectable="true"
                          className="fixed z-[61] overflow-y-auto rounded-xl p-1.5 shadow-xl"
                          style={{
                            left: menu.left,
                            width: menu.width,
                            maxHeight: 260,
                            ...(opensDown ? { top: menu.bottom + 4 } : { bottom: window.innerHeight - menu.top + 4 }),
                            background: t.card,
                            border: `1px solid ${t.border}`,
                            scrollbarWidth: "thin",
                          }}
                        >
                          {!categories.length ? (
                            <p className="px-2 py-3 text-center text-xs" style={{ color: t.muted }}>
                              {supplierSupplySearch
                                ? `No hay insumos que coincidan con «${supplierSupplySearch}». Si es nuevo, usa «Crear insumo».`
                                : "No hay insumos registrados."}
                            </p>
                          ) : (
                            categories.map((category) => {
                              const names = groups.get(category)!.sort((x, y) => x.localeCompare(y))
                              const allOn = names.every((name) => selected.includes(name))
                              return (
                                <div key={category} className="mb-1 last:mb-0">
                                  <div className="flex items-center justify-between gap-2 px-2 py-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>
                                      {category}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelected(allOn ? selected.filter((n) => !names.includes(n)) : [...selected, ...names])
                                      }
                                      className="cursor-pointer text-[10px] font-semibold"
                                      style={{ color: C.mustard }}
                                    >
                                      {allOn ? "Quitar todos" : "Todos"}
                                    </button>
                                  </div>
                                  {names.map((name) => (
                                    <label
                                      key={name}
                                      role="option"
                                      aria-selected={selected.includes(name)}
                                      className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                                      style={{ color: t.text, background: selected.includes(name) ? `${C.mustard}12` : "transparent" }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected.includes(name)}
                                        onChange={() => toggleSupply(name)}
                                        style={{ accentColor: C.mustard }}
                                      />
                                      <span className="min-w-0 break-words">{name}</span>
                                    </label>
                                  ))}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </>
                    )}
                    {selected.length > 0 && renderSupplyGroups(selected, "pt-1 sm:grid-cols-2", toggleSupply)}
                    <span className="text-[11px]" style={{ color: t.muted }}>
                      Solo estos insumos se podrán elegir al registrar una compra a este proveedor.
                    </span>
                    {fieldValidationError && (
                      <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                        {fieldValidationError}
                      </span>
                    )}
                  </div>
                )
              }
              const naturalSupplier =
                isSupplier && isNaturalSupplier(isView ? row?.[15] : formData["15"])
              // Client and order details: their own layout
              if (isView && (isClient || isPedido || isSales)) return null
              // A sale's total is never typed: it shows once the order is chosen
              if (isSales && f.key === "6" && !(rows.pedidos || []).some((p) => String(p[0]) === String(formData["8"] ?? "").trim()))
                return null
              const fieldLabel =
                naturalSupplier && f.key === "0"
                  ? "Nombre completo"
                  : isSupply && f.key === "7"
                      ? "¿Lo preparan ustedes?"
                      : f.label
              const fieldRowIndex = Number(f.key) + rowOffset
              const val = isView
                ? String(row ? (row[fieldRowIndex] ?? "—") : "—")
                : formData[f.key] || ""
              const fieldOptions =
                isProduction && f.key === "0"
                  ? availableProductionProducts
                  : isSales && f.key === "0"
                    ? sellerOptions
                  : (isSales && f.key === "1") ||
                        (isPedido && f.key === "0") ||
                        (isReturns && f.key === "2")
                      ? clientOptions
                      : isPurchase && f.key === "0" && namesOf("proveedores").length
                        ? // Only active suppliers, plus the one an existing purchase already has
                          [...new Set([
                            ...(rows.proveedores || []).filter((r) => isActiveStatus(r[6])).map((r) => String(r[0])),
                            ...(formData["0"] ? [String(formData["0"])] : []),
                          ])]
                        : modal.section === "perdidas" && f.key === "0" && formData["10"]
                          ? // Only what came in the chosen purchase
                            [...new Set([
                              ...parsePurchaseLines(
                                (rows.compras || []).find((c) => String(c[DB_SYNC.compras.idIndex]) === String(formData["10"]))?.[6],
                              ).map((l) => l.name),
                              ...(formData["0"] ? [String(formData["0"])] : []),
                            ])]
                        : modal.section === "perdidas" && f.key === "0" && namesOf("insumos").length
                          ? [...new Set([
                              ...(rows.insumos || []).filter((r) => isActiveStatus(r[12])).map((r) => String(r[0])),
                              // a soda (a broken bottle) is lost from its product's stock
                              ...(rows.producto || []).filter((p) => p[1] === SODA_PRODUCT && isSodaName(p[0]) && isActiveStatus(p[4])).map((p) => String(p[0])),
                              ...(formData["0"] ? [String(formData["0"])] : []),
                            ])]
                          : modal.section === "perdidas" && f.key === "3"
                            ? staffOptions
                          : isSupply && f.key === "1" && namesOf("cat-insumos").length
                            ? // Active categories only, plus the one the insumo already has
                              [...new Set([
                                ...(rows["cat-insumos"] || []).filter((r) => isActiveStatus(r[2] || "Activa")).map((r) => String(r[0])),
                                ...(formData["1"] ? [String(formData["1"])] : []),
                              ])]
                            : isUser && f.key === "3" && namesOf("roles").length
                              ? (rows.roles || []).filter((r) => isActiveStatus(r[2])).map((r) => String(r[0]))
                              : f.options
              const visibleFieldOptions =
                isUser &&
                f.key === "1" &&
                String(formData["3"] ?? "").toLowerCase() !== "cliente"
                            ? fieldOptions?.filter((option) => option !== "Tarjeta de Identidad")
                            : fieldOptions
              // What the customer can pick in the store: menu products and drinks. Additions and sauces aren't
              // sold alone: they're chosen for each meal of the order ("+ Adiciones y salsas")
              const notAlone = ["adiciones", "salsas", "sabores de bebida", "producto de insumo"]
              const pedidoCategories = [
                "Todas",
                ...new Set(
                  (rows["cat-producto"] || [])
                    .filter((category) => String(category[2] ?? "Activa").toLowerCase() !== "inactiva")
                    .map((category) => String(category[0] ?? "").trim())
                    .filter((name) => name && !notAlone.includes(normalizeName(name))),
                ),
              ]
              const filteredOrderProducts = availableProductos.filter((productName) => {
                const product = rows.producto?.find((item) => item[0] === productName)
                const category = normalizeName(String(product?.[1] ?? ""))
                return (
                  !!product &&
                  !notAlone.includes(category) &&
                  Number(product[2]) > 0 &&
                  (pedidoProductCategory === "Todas" || String(product[1] ?? "") === pedidoProductCategory) &&
                  normalizeName(productName).includes(normalizeName(pedidoProductSearch.trim()))
                )
              })
              // Only a meal takes additions (not a sauce, a drink or an addition), like in the store
              const isMeal = (category: string, name: string) =>
                !["adiciones", "salsas", "bebidas", "sabores de bebida"].includes(normalizeName(category)) && !isSodaName(name)
              const selectedOrderProduct = rows.producto?.find((item) => item[0] === pedidoProductoSelect)
              const isSelectedAddition = String(selectedOrderProduct?.[1] ?? "").toLowerCase() === "adiciones"
              const updateFieldValue = (value: string) => {
                // A typed future date becomes today (the calendar already stops at today)
                if (((isPurchase && f.key === "1") || (modal.section === "perdidas" && f.key === "4") || (isProduction && f.key === "3") || (isReturns && f.key === "5")) && value > getCurrentDateTimeParts().date)
                  value = getCurrentDateTimeParts().date
                if (isSales && f.key === "1" && value === "__new_client__") {
                  setQuickClientForm({})
                  setQuickClientErrors({})
                  setQuickClientError("")
                  setQuickClientOpen(true)
                  return
                }
                if (isPurchase && f.key === "0") {
                  // Changing supplier keeps only the items the new supplier sells
                  const allowed = supplierSupplies(value)
                  const nextForm = {
                    ...formData,
                    "0": value,
                    "6": String(formData["6"] ?? "")
                      .split("\n")
                      .filter((line) => allowed.includes(line.split("|")[0].trim()))
                      .join("\n"),
                  }
                  setFormData(nextForm)
                  if (formValidationAttempted) {
                    setFormFieldErrors(
                      validateManagedForm(modal.section, nextForm, modal.mode),
                    )
                  }
                  setPurchaseItemSelect("")
                  setPurchaseItemPrice("")
                  setPurchaseFormError("")
                  return
                }
                if (["usuarios", "clientes", "proveedores"].includes(modal.section)) {
                  const normalized =
                    (modal.section === "usuarios" && f.key === "2") ||
                    (modal.section === "clientes" && f.key === "2") ||
                    (isSupplier && f.key === "9")
                      ? normalizeDocumentInput(
                          value,
                          String(formData[isSupplier ? "8" : "1"] ?? ""),
                        )
                      : ((modal.section === "clientes" && f.key === "3") ||
                          (isUser && ["9", "12"].includes(f.key)) ||
                          (isSupplier && ["3", "12"].includes(f.key)))
                        ? normalizePhoneInput(value)
                        : isSupplier && f.key === "1"
                          ? value.replace(/[^0-9.-]/g, "").slice(0, 20)
                          : value
                  updateAdminField(modal.section, f.key, normalized)
                  return
                }
                updateAdminField(modal.section, f.key, value)
              }
              return (
                <Fragment key={f.key}>
                {isSupply && !isView && f.key === "7" && (() => {
                  const toggle = (name: string) =>
                    setSupplySuppliers(
                      supplySuppliers.includes(name) ? supplySuppliers.filter((n) => n !== name) : [...supplySuppliers, name],
                    )
                  const query = normalizeName(supplierPickerQuery)
                  const options = (rows.proveedores || [])
                    .filter((p) => isActiveStatus(p[6]) || supplySuppliers.includes(String(p[0])))
                    .filter((p) => !query || normalizeName(p[0]).includes(query))
                  return (
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-xs font-semibold" style={{ color: t.muted }}>
                        Proveedores que lo venden <span className="font-normal">(opcional si lo preparan ustedes)</span>
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSupplierPickerOpen(!supplierPickerOpen)}
                          aria-expanded={supplierPickerOpen}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm"
                          style={{ background: t.input, border: `1.5px solid ${supplierPickerOpen ? C.mustard : t.inputB}` }}
                        >
                          <span className="min-w-0 truncate" style={{ color: supplySuppliers.length ? t.text : t.muted }}>
                            {supplySuppliers.length ? supplySuppliers.join(", ") : "Selecciona proveedores..."}
                          </span>
                          <span className="flex flex-shrink-0 items-center gap-1.5" style={{ color: t.muted }}>
                            {supplySuppliers.length > 0 && (
                              <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: C.mustard, color: "#fff" }}>
                                {supplySuppliers.length}
                              </span>
                            )}
                            {Ico.chevDown}
                          </span>
                        </button>
                        {supplierPickerOpen && (
                          <div
                            className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl p-2 shadow-xl"
                            style={{ background: t.card, border: `1px solid ${t.border}` }}
                          >
                            <div
                              className="search-control mb-1.5 flex items-center gap-2 rounded-full px-2.5 py-1.5"
                              style={{ background: t.input, border: `1px solid ${t.inputB}` }}
                            >
                              <span style={{ color: t.muted }}>{Ico.search}</span>
                              <input
                                type="search"
                                value={supplierPickerQuery}
                                onChange={(e) => setSupplierPickerQuery(e.target.value)}
                                placeholder="Buscar proveedor..."
                                aria-label="Buscar proveedor"
                                autoFocus
                                className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                                style={{ color: t.text }}
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto">
                              {options.length ? (
                                options.map((p) => {
                                  const name = String(p[0])
                                  return (
                                    <label
                                      key={name}
                                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                                      style={{ color: t.text, background: supplySuppliers.includes(name) ? `${C.mustard}12` : "transparent" }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={supplySuppliers.includes(name)}
                                        onChange={() => toggle(name)}
                                        style={{ accentColor: C.mustard }}
                                      />
                                      <span className="min-w-0 flex-1 break-words">{name}</span>
                                      {p[1] && <span className="text-[10px]" style={{ color: t.muted }}>{String(p[1])}</span>}
                                    </label>
                                  )
                                })
                              ) : (
                                <p className="px-2 py-2 text-center text-xs" style={{ color: t.muted }}>
                                  {(rows.proveedores || []).length ? "Ningún proveedor coincide." : "No hay proveedores registrados."}
                                </p>
                              )}
                            </div>
                            <div className="mt-1.5 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setSupplierPickerOpen(false)}
                                className="cursor-pointer rounded-lg px-3 py-1 text-xs font-bold"
                                style={{ background: C.mustard, color: "#fff" }}
                              >
                                Listo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {supplySuppliers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {supplySuppliers.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggle(name)}
                              aria-label={`Quitar ${name}`}
                              className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${C.mustard}18`, color: C.mustard }}
                            >
                              {name} <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
                {isSales && !isView && (f.key === "1" || f.key === "0") && (
                  <div
                    className={`flex items-center gap-2 sm:col-span-3 ${f.key === "1" ? "" : "mt-1 border-t pt-4"}`}
                    style={{ borderColor: t.border }}
                  >
                    <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                      {f.key === "1" ? "Cliente y fecha" : "Datos de la venta"}
                    </h4>
                  </div>
                )}
                {isPedido && !isView && ["0", "1", "11"].includes(f.key) && (
                  <div
                    className={`flex items-center gap-2 sm:col-span-3 ${f.key === "0" ? "" : "mt-1 border-t pt-4"}`}
                    style={{ borderColor: t.border }}
                  >
                    <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                      {f.key === "0" ? "Cliente y pago" : f.key === "1" ? "Productos del pedido" : "Especificaciones"}
                    </h4>
                  </div>
                )}
                {isPnc && !isView && f.key === "3" && (
                  <div className="mt-1 flex items-center gap-2 border-t pt-4 sm:col-span-2" style={{ borderColor: t.border }}>
                    <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                      Detalles del registro
                    </h4>
                  </div>
                )}
                {isProduction && !isView && f.key === "3" && (
                  <div className="mt-1 flex items-center gap-2 border-t pt-4 sm:col-span-3" style={{ borderColor: t.border }}>
                    <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                      Detalles de la orden
                    </h4>
                  </div>
                )}
                {isSupplier && (f.key === "15" || (f.key === "1" && !isView) || f.key === "8") && (
                  <div
                    className={`pt-1 sm:col-span-2 ${
                      f.key === "8"
                        ? naturalSupplier ? "lg:col-span-4" : "lg:col-span-2 lg:col-start-3"
                        : "lg:col-span-2 lg:col-start-1"
                    }`}
                  >
                    <div className="mb-1 h-px" style={{ background: t.border }} />
                    <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                      {f.key === "15"
                        ? "Datos del proveedor"
                        : f.key === "1"
                          ? "Datos de la empresa"
                          : naturalSupplier
                            ? "Datos de la persona"
                            : "Persona de contacto"}
                    </h4>
                  </div>
                )}
                <div
                  className={`flex min-w-0 flex-col gap-1 ${
                    isSupplier
                    ? naturalSupplier
                      ? "lg:col-span-2" // one form, two fields per row
                      : Number(f.key) < 8 || f.key === "15"
                      ? "lg:col-span-2 lg:col-start-1"
                      : f.key === "14"
                        ? "lg:col-span-2 lg:col-start-3" // Cargo
                        : Number(f.key) % 2 === 0
                          ? "lg:col-start-3" // tipo doc, nombre, teléfono
                          : "lg:col-start-4" // nº doc, apellido, correo
                      : isPedido && !isView
                        ? f.key === "0" ? "sm:col-span-2" : f.key === "1" || f.key === "11" ? "sm:col-span-3" : ""
                      : isSales && (f.key === "1" || f.key === "8")
                        ? "sm:col-span-2"
                      : isPurchaseModule && isWideField(f) && !(isProduction && !isView)
                        ? "sm:col-span-2"
                        : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className="text-xs font-semibold"
                      style={{ color: !isView && shownFieldError(f.key) ? C.red : t.muted }}
                    >
                      {fieldLabel}
                      {!isView && (isRequiredField(f.key) || requiredFormField) && " *"}
                    </label>
                    {isPurchase && !isView && f.key === "0" && (
                      <button
                        type="button"
                        onClick={() => openChildForm("proveedores")}
                        title="Crear un proveedor nuevo y volver a esta compra"
                        className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: `${C.mustard}14`, color: C.mustard }}
                      >
                        {Ico.plus} Crear proveedor
                      </button>
                    )}
                  </div>
                  {isProduction && modal.mode === "edit" && (f.key === "3" || f.key === "4") ? (
                    <div
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                      style={{ background: t.cardAlt, border: `1.5px dashed ${t.inputB}`, color: t.text }}
                      title="La fecha y la hora de creación no se cambian"
                    >
                      <span>{f.key === "3" ? formatViewValue(f, val) : val || "—"}</span>
                      <span className="text-[10px]" style={{ color: t.muted }}>No editable</span>
                    </div>
                  ) : isSupply && !isView && modal.mode === "edit" && (f.key === "3" || f.key === "4") ? (
                    <div
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                      style={{ background: t.cardAlt, border: `1.5px dashed ${t.inputB}`, color: t.text }}
                      title="Se actualiza solo con compras, pérdidas y producción"
                    >
                      <span className="font-semibold">
                        {f.key === "3"
                          ? Number(val) ? fmt(Number(val)) : "Sin compras"
                          : `${Number(val || 0).toLocaleString("es-CO")} ${String(formData["2"] || "und")}`}
                      </span>
                      <span className="text-[10px]" style={{ color: t.muted }}>
                        {f.key === "3" ? "Se toma de la última compra" : "Suma con compras"}
                      </span>
                    </div>
                  ) : modal.section === "perdidas" && f.key === "10" && !isView ? (() => {
                    // Active purchases, newest first; the one an existing loss already has stays even if annulled
                    const options = (rows.compras || [])
                      .filter((c) => isActiveStatus(c[5]) || String(c[DB_SYNC.compras.idIndex]) === String(formData["10"] ?? ""))
                      .filter((c) => c[DB_SYNC.compras.idIndex])
                      .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
                    const chosen = options.find((c) => String(c[DB_SYNC.compras.idIndex]) === String(formData["10"] ?? ""))
                    const items = chosen ? parsePurchaseLines(chosen[6]) : []
                    return (
                      <>
                        <select
                          value={String(formData["10"] ?? "")}
                          // A loss already registered keeps its purchase (its stock was taken from it)
                          disabled={modal.mode === "edit" && !!formData["10"]}
                          onChange={(e) => {
                            const purchase = options.find((c) => String(c[DB_SYNC.compras.idIndex]) === e.target.value)
                            const names = [...new Set(parsePurchaseLines(purchase?.[6]).map((l) => l.name))]
                            setFormData((current) => ({
                              ...current,
                              "10": e.target.value,
                              "5": purchase ? purchaseLabel(purchase) : "",
                              // a purchase with a single insumo picks it; otherwise the user chooses
                              "0": names.length === 1 ? names[0] : names.includes(String(current["0"] ?? "")) ? String(current["0"]) : "",
                            }))
                            setFormFieldErrors((current) => ({ ...current, "10": "", "0": "" }))
                          }}
                          aria-invalid={!!formFieldErrors["10"]}
                          className="w-full min-w-0 cursor-pointer rounded-xl px-3.5 py-2.5 text-sm outline-none disabled:cursor-default disabled:opacity-80"
                          style={{ background: t.input, border: `1.5px solid ${formFieldErrors["10"] ? C.red : t.inputB}`, color: formData["10"] ? t.text : t.muted }}
                        >
                          <option value="">Elige la compra de la que se perdió...</option>
                          {options.map((c) => {
                            const id = String(c[DB_SYNC.compras.idIndex])
                            const what = [...new Set(parsePurchaseLines(c[6]).map((l) => l.name))]
                            return (
                              <option key={id} value={id}>
                                Compra #{id} · {String(c[0])} · {String(c[1]).slice(0, 10)} · {what.slice(0, 2).join(", ")}
                                {what.length > 2 ? ` y ${what.length - 2} más` : ""}
                              </option>
                            )
                          })}
                        </select>
                        {chosen && (
                          <span className="text-[11px]" style={{ color: t.muted }}>
                            {String(chosen[0])} · {formatViewValue(MOD_CFG.compras.fields.find((field) => field.key === "1")!, String(chosen[1]))} ·{" "}
                            {items.map((l) => `${l.name} (${l.quantity.toLocaleString("es-CO")})`).join(", ")}
                          </span>
                        )}
                      </>
                    )
                  })() : modal.section === "perdidas" && f.key === "1" && !isView ? (() => {
                    const supply = supplyInfo(String(formData["0"] ?? ""))
                    const unit = String(supply?.[2] ?? "und")
                    const qty = String(formData["1"] ?? "").split(" ")[0]
                    return (
                      <>
                        <div
                          className="flex items-center gap-2 rounded-xl px-3.5"
                          style={{ background: t.input, border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}` }}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            value={qty}
                            onChange={(e) => updateAdminField("perdidas", "1", e.target.value ? `${e.target.value} ${unit}` : "")}
                            placeholder="0"
                            aria-invalid={!!fieldValidationError}
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                            style={{ color: t.text }}
                          />
                          <span className="text-xs" style={{ color: t.muted }}>{unit}</span>
                        </div>
                        {(() => {
                          const max = purchaseLossMax(String(formData["5"] ?? ""), String(formData["0"] ?? ""), modal.mode === "edit" ? modal.idx : null, formData["10"])
                          return max !== null ? (
                            <span className="text-[11px]" style={{ color: t.muted }}>
                              Máximo {max.toLocaleString("es-CO")} {unit}: lo comprado en esa compra menos lo ya perdido
                            </span>
                          ) : Number.isFinite(stockOf(String(formData["0"] ?? ""))) ? (
                            // an insumo, or a soda (its stock is on its product)
                            <span className="text-[11px]" style={{ color: t.muted }}>
                              En stock: {stockOf(String(formData["0"] ?? "")).toLocaleString("es-CO")} {unit}
                            </span>
                          ) : null
                        })()}
                        {Number(qty) > 0 && costOf(String(formData["0"] ?? "")) > 0 && (
                          <span className="text-[11px] font-semibold" style={{ color: C.red }}>
                            Valor de la pérdida: {fmt(Math.round(Number(qty) * costOf(String(formData["0"] ?? ""))))}
                          </span>
                        )}
                      </>
                    )
                  })() : isSales && f.key === "8" && !isView ? (
                    // An existing order isn't picked here (it gets its sale by itself once paid, so it would be
                    // sold twice): the sale creates its order with «Crear pedido» and gets its data back
                    <div className="flex min-w-0 gap-2">
                      <div
                        className="flex min-w-0 flex-1 items-center rounded-xl px-3.5 py-2.5 text-sm"
                        style={{
                          background: t.cardAlt,
                          border: `1.5px dashed ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                          color: val && val !== "Sin pedido" ? t.text : t.muted,
                        }}
                      >
                        <span className="truncate">
                          {val && val !== "Sin pedido" ? (
                            <>
                              <strong>{val}</strong>
                              {(() => {
                                const order = (rows.pedidos || []).find((p) => String(p[0]) === val)
                                return order ? ` · ${String(order[1] ?? "")} · ${fmt(Number(order[6]) || 0)}` : ""
                              })()}
                            </>
                          ) : (
                            "Crea el pedido de esta venta"
                          )}
                        </span>
                      </div>
                      {modal.mode === "add" && !(val && val !== "Sin pedido") && (
                        <button
                          type="button"
                          onClick={() => openChildForm("pedidos")}
                          title="Crear el pedido y volver a esta venta con sus datos"
                          className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-xl px-3 text-xs font-semibold"
                          style={{ background: `${C.mustard}14`, color: C.mustard }}
                        >
                          {Ico.plus} Crear pedido
                        </button>
                      )}
                    </div>
                  ) : isSales && (f.key === "0" || f.key === "2") && !isView ? (
                    // Seller = who is logged in, date = today: both fixed
                    <div
                      className="flex w-full min-w-0 items-center rounded-xl px-3.5 py-2.5 text-sm"
                      style={{ background: t.cardAlt, border: `1.5px dashed ${t.inputB}`, color: t.text }}
                      title={f.key === "0" ? "Es el usuario con el que iniciaste sesión" : "La venta se registra con la fecha de hoy"}
                    >
                      {f.key === "2" ? formatViewValue(f, val) : val || sellerName}
                    </div>
                  ) : isSales && f.key === "6" && !isView && (rows.pedidos || []).some((p) => String(p[0]) === String(formData["8"] ?? "").trim()) ? (
                    <div
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                      style={{ background: t.cardAlt, border: `1.5px dashed ${t.inputB}`, color: t.text }}
                      title="Es el total del pedido asociado"
                    >
                      <span className="font-semibold">{fmt(Number(formData["6"]) || 0)}</span>
                      <span className="text-[10px]" style={{ color: t.muted }}>Del pedido</span>
                    </div>
                  ) : isSales && f.key === "1" && !isView ? (
                    <div className="flex min-w-0 gap-2">
                      <div className="search-control flex min-w-0 flex-1 items-center gap-2 rounded-full px-3">
                        <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                        <input
                          list="sale-clients"
                          value={val}
                          onChange={(event) => updateAdminField(modal.section, f.key, event.target.value)}
                          placeholder="Busca por nombre..."
                          aria-label="Cliente"
                          aria-invalid={!!fieldValidationError}
                          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                          style={{ color: t.text }}
                        />
                        {val && (
                          <button
                            type="button"
                            className="search-clear"
                            aria-label="Limpiar cliente"
                            onClick={() => updateAdminField(modal.section, f.key, "")}
                          >
                            ×
                          </button>
                        )}
                        <datalist id="sale-clients">
                          {clientOptions.map((name) => <option key={name} value={name} />)}
                        </datalist>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickClientForm({})
                          setQuickClientErrors({})
                          setQuickClientError("")
                          setQuickClientOpen(true)
                        }}
                        className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-xl px-3 text-xs font-semibold"
                        style={{ background: `${C.mustard}14`, color: C.mustard }}
                      >
                        {Ico.plus} Crear cliente
                      </button>
                    </div>
                  ) : isPedido && f.key === "1" && !isView ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl p-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                        {/* Category, a search that suggests as you type, quantity and Agregar: one compact row */}
                        <div className="grid max-w-2xl gap-2 sm:grid-cols-[130px_minmax(0,1fr)_64px_auto]">
                          <select
                            value={pedidoProductCategory}
                            onChange={(event) => {
                              setPedidoProductCategory(event.target.value)
                              setPedidoProductoSelect("")
                              setPedidoProductSearch("")
                            }}
                            className="min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                            style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                            aria-label="Filtrar productos por categoría"
                          >
                            {pedidoCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                          </select>
                          <div className="relative min-w-0">
                            <div className="search-control flex min-w-0 items-center gap-2 rounded-full px-3">
                              <span className="flex-shrink-0">{Ico.search}</span>
                              <input
                                type="text"
                                value={pedidoProductSearch}
                                onChange={(event) => {
                                  const typed = event.target.value
                                  setPedidoProductSearch(typed)
                                  setPedidoSearchOpen(true)
                                  // Typing a full name picks it; anything else waits for a click on the list
                                  setPedidoProductoSelect(
                                    availableProductos.find((name) => normalizeName(name) === normalizeName(typed.trim())) ?? "",
                                  )
                                }}
                                onFocus={() => setPedidoSearchOpen(true)}
                                onBlur={() => setTimeout(() => setPedidoSearchOpen(false), 150)}
                                placeholder="Busca un producto..."
                                aria-label="Buscar producto"
                                aria-expanded={pedidoSearchOpen}
                                className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none"
                                style={{ color: t.text }}
                              />
                              {pedidoProductSearch && (
                                <button
                                  type="button"
                                  className="search-clear"
                                  aria-label="Limpiar búsqueda"
                                  onClick={() => {
                                    setPedidoProductSearch("")
                                    setPedidoProductoSelect("")
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            {pedidoSearchOpen && !pedidoProductoSelect && (
                              <div
                                role="listbox"
                                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl py-1 shadow-lg"
                                style={{ background: t.card, border: `1px solid ${t.border}` }}
                              >
                                {filteredOrderProducts.length ? (
                                  filteredOrderProducts.map((product) => {
                                    const productRow = rows.producto?.find((item) => item[0] === product)
                                    return (
                                      <button
                                        key={product}
                                        type="button"
                                        role="option"
                                        aria-selected={false}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                          setPedidoProductoSelect(product)
                                          setPedidoProductSearch(product)
                                          setPedidoSearchOpen(false)
                                        }}
                                        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:opacity-80"
                                        style={{ color: t.text }}
                                      >
                                        <span className="min-w-0 truncate">{product}</span>
                                        <span className="flex-shrink-0 text-[10px]" style={{ color: t.muted }}>
                                          {String(productRow?.[1] ?? "")} · {fmt(Number(productRow?.[2]) || 0)}
                                        </span>
                                      </button>
                                    )
                                  })
                                ) : (
                                  <p className="px-3 py-2 text-center text-xs" style={{ color: t.muted }}>No hay productos que coincidan.</p>
                                )}
                              </div>
                            )}
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={pedidoProductQuantity}
                            onChange={(event) => setPedidoProductQuantity(event.target.value)}
                            className="min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                            style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                            aria-label="Cantidad"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const productRow = rows.producto?.find((item) => item[0] === pedidoProductoSelect)
                              const quantity = Number(pedidoProductQuantity)
                              if (!productRow || !Number.isInteger(quantity) || quantity <= 0) return
                              const id = `order-line-${Date.now()}-${pedidoOrderLines.length}`
                              const line: AdminOrderLine = {
                                id,
                                product: pedidoProductoSelect,
                                category: String(productRow[1] ?? ""),
                                quantity,
                                unitPrice: Number(productRow[2]) || 0,
                              }
                              setPedidoOrderLines((current) => [...current, line])
                              setPedidoProductoSelect("")
                              setPedidoProductSearch("")
                              setPedidoProductQuantity("1")
                              // A meal is ready to take its additions right away
                              setPedidoAdditionsFor(isMeal(line.category, line.product) ? id : "")
                            }}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                            style={{ background: C.mustard, color: "#fff" }}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                      {!pedidoOrderLines.length ? (
                        <div className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.input, color: t.muted }}>
                          Agrega al menos un producto al pedido.
                        </div>
                      ) : (
                        <div className="rounded-xl px-3" style={{ background: t.input }}>
                          {(() => {
                            const additionProducts = (rows.producto || []).filter(
                              (product) =>
                                String(product[1] ?? "").toLowerCase() === "adiciones" &&
                                isActiveStatus(product[4]) &&
                                Number(product[2]) > 0,
                            )
                            // Sauces go with each meal, free and up to 4, like in the store
                            const sauceNames = (rows.producto || [])
                              .filter((product) => normalizeName(String(product[1] ?? "")) === "salsas" && isActiveStatus(product[4]))
                              .map((product) => String(product[0]))
                            const MAX_SAUCES = 4
                            const toggleSauce = (id: string, sauce: string) =>
                              setPedidoOrderLines((current) =>
                                current.map((item) => {
                                  if (item.id !== id) return item
                                  const sauces = item.sauces || []
                                  if (sauces.includes(sauce)) return { ...item, sauces: sauces.filter((s) => s !== sauce) }
                                  return sauces.length >= MAX_SAUCES ? item : { ...item, sauces: [...sauces, sauce] }
                                }),
                              )
                            const setQuantity = (id: string, quantity: number) =>
                              setPedidoOrderLines((current) =>
                                current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
                              )
                            // Adds the addition to that product, or one more if it already has it
                            const addAddition = (parent: AdminOrderLine, product: (string | number)[]) =>
                              setPedidoOrderLines((current) => {
                                const existing = current.find((item) => item.parentId === parent.id && item.product === product[0])
                                if (existing)
                                  return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item))
                                return [
                                  ...current,
                                  {
                                    id: `order-line-${Date.now()}-${current.length}`,
                                    product: String(product[0]),
                                    category: String(product[1] ?? ""),
                                    quantity: 1,
                                    unitPrice: Number(product[2]) || 0,
                                    parentId: parent.id,
                                  },
                                ]
                              })
                            // Each product followed by its additions; an addition never stays without its product
                            const ordered = [
                              ...pedidoOrderLines
                                .filter((line) => !line.parentId)
                                .flatMap((line) => [line, ...pedidoOrderLines.filter((child) => child.parentId === line.id)]),
                              ...pedidoOrderLines.filter((line) => line.parentId && !pedidoOrderLines.some((p) => p.id === line.parentId)),
                            ]
                            const stepper = (line: AdminOrderLine) => (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  aria-label={`Una ${line.product} menos`}
                                  disabled={line.quantity <= 1}
                                  onClick={() => setQuantity(line.id, line.quantity - 1)}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
                                  style={{ background: t.card, color: t.text, border: `1px solid ${t.inputB}` }}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={line.quantity}
                                  onChange={(event) => setQuantity(line.id, Math.floor(Number(event.target.value)) || 1)}
                                  aria-label={`Cantidad de ${line.product}`}
                                  className="h-6 w-10 rounded-lg text-center text-xs outline-none"
                                  style={{ background: t.card, color: t.text, border: `1px solid ${t.inputB}` }}
                                />
                                <button
                                  type="button"
                                  aria-label={`Una ${line.product} más`}
                                  onClick={() => setQuantity(line.id, line.quantity + 1)}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg font-bold"
                                  style={{ background: t.card, color: t.text, border: `1px solid ${t.inputB}` }}
                                >
                                  +
                                </button>
                              </div>
                            )
                            const renderLine = (line: AdminOrderLine) => {
                              const isAddition = !!line.parentId || line.category.toLowerCase() === "adiciones"
                              const open = pedidoAdditionsFor === line.id
                              return (
                                <div key={line.id} className={`py-2.5 text-xs ${line.parentId ? "pl-5" : ""}`} style={{ borderColor: t.border }}>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                    <div className="min-w-0 flex-1 font-semibold" style={{ color: t.text }}>
                                      {line.parentId && <span style={{ color: t.muted }}>↳ </span>}
                                      {line.product}
                                      {isAddition && <span className="ml-1 rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: `${C.amber}18`, color: C.amber }}>Adición</span>}
                                      <div className="text-[10px] font-normal" style={{ color: t.muted }}>
                                        {fmt(line.unitPrice)} c/u{line.sauces?.length ? ` · Salsas: ${line.sauces.join(", ")}` : ""}
                                      </div>
                                    </div>
                                    {stepper(line)}
                                    <strong className="w-16 text-right" style={{ color: C.mustard }}>{fmt(line.unitPrice * line.quantity)}</strong>
                                    {!isAddition && isMeal(line.category, line.product) && (additionProducts.length > 0 || sauceNames.length > 0) && (
                                      <button
                                        type="button"
                                        onClick={() => setPedidoAdditionsFor(open ? "" : line.id)}
                                        aria-expanded={open}
                                        className="cursor-pointer rounded-lg px-2 py-1 text-[11px] font-semibold"
                                        style={{
                                          background: open ? C.mustard : `${C.mustard}18`,
                                          color: open ? "#fff" : C.mustard,
                                        }}
                                      >
                                        + Adiciones y salsas
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      aria-label={`Quitar ${line.product}`}
                                      onClick={() => setPedidoOrderLines((current) => current.filter((item) => item.id !== line.id && item.parentId !== line.id))}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg cursor-pointer"
                                      style={{ color: C.red, background: `${C.red}10` }}
                                    >
                                      {Ico.x}
                                    </button>
                                  </div>
                                  {open && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg p-2" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                                      <span className="w-full text-[10px] font-semibold" style={{ color: t.muted }}>
                                        Toca una adición para agregarla a {line.product}:
                                      </span>
                                      {additionProducts.map((product) => {
                                        const count = pedidoOrderLines.find((item) => item.parentId === line.id && item.product === product[0])?.quantity ?? 0
                                        return (
                                          <button
                                            key={String(product[0])}
                                            type="button"
                                            onClick={() => addAddition(line, product)}
                                            className="cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                            style={{
                                              background: count ? `${C.mustard}18` : t.input,
                                              color: count ? C.mustard : t.text,
                                              border: `1px solid ${count ? C.mustard : t.inputB}`,
                                            }}
                                          >
                                            + {String(product[0])} · {fmt(Number(product[2]))}
                                            {count > 0 && ` (${count})`}
                                          </button>
                                        )
                                      })}
                                      {sauceNames.length > 0 && (
                                        <>
                                          <span className="mt-1 w-full text-[10px] font-semibold" style={{ color: t.muted }}>
                                            Salsas para {line.product} (hasta {MAX_SAUCES}, sin costo):
                                          </span>
                                          {sauceNames.map((sauce) => {
                                            const on = !!line.sauces?.includes(sauce)
                                            const full = !on && (line.sauces?.length ?? 0) >= MAX_SAUCES
                                            return (
                                              <button
                                                key={sauce}
                                                type="button"
                                                aria-pressed={on}
                                                disabled={full}
                                                onClick={() => toggleSauce(line.id, sauce)}
                                                className="cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                                                style={{
                                                  background: on ? `${C.mustard}18` : t.input,
                                                  color: on ? C.mustard : t.text,
                                                  border: `1px solid ${on ? C.mustard : t.inputB}`,
                                                }}
                                              >
                                                {on ? "✓ " : ""}{sauce}
                                              </button>
                                            )
                                          })}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            // A product and its additions stay together; more than 4 products split in 2 and then 3 columns
                            const groups: AdminOrderLine[][] = []
                            ordered.forEach((line) => {
                              if (line.parentId && groups.length && groups[groups.length - 1][0].id === line.parentId) groups[groups.length - 1].push(line)
                              else groups.push([line])
                            })
                            return (
                              <div className={`gap-x-5 ${groups.length > 8 ? "sm:columns-2 lg:columns-3" : groups.length > 4 ? "sm:columns-2" : ""}`}>
                                {groups.map((group) => (
                                  <div key={group[0].id} className="break-inside-avoid divide-y border-b" style={{ borderColor: t.border }}>
                                    {group.map(renderLine)}
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                          <div className="flex justify-between py-2 text-xs font-bold" style={{ color: t.text }}>
                            <span>Total del pedido</span>
                            <span style={{ color: C.mustard }}>{fmt(pedidoOrderLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isView && isPurchaseModule ? (
                    <div
                      className="w-full min-w-0 border-b pb-2 text-sm font-medium break-words whitespace-pre-line"
                      style={{ borderColor: t.border, color: t.text }}
                    >
                      {formatViewValue(f, val)}
                    </div>
                  ) : isView ? (
                    <div
                      className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: t.input, color: t.text }}
                    >
                      {val}
                    </div>
                  ) : f.type === "checkbox" ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={String(val).toLowerCase() === "sí"}
                      onClick={() => {
                        if (isClient) {
                          const enabled =
                            String(formData[f.key] ?? "No").toLowerCase() === "sí"
                          updateAdminField(
                            modal.section,
                            f.key,
                            enabled ? "No" : "Sí",
                          )
                        } else {
                          handleSupplyCheckboxToggle()
                        }
                      }}
                      className="flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-xl px-3.5 py-3 text-left"
                      style={{ background: t.input, border: `1px solid ${t.inputB}` }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: String(val).toLowerCase() === "sí" ? C.mustard : "transparent",
                          border: `1.5px solid ${String(val).toLowerCase() === "sí" ? C.mustard : t.inputB}`,
                          color: "#fff",
                        }}
                      >
                        {String(val).toLowerCase() === "sí" ? Ico.check : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold" style={{ color: t.text }}>
                          {isClient ? "Cliente de local" : "Sí, lo preparamos nosotros (tiene receta)"}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug" style={{ color: t.muted }}>
                          {isClient
                            ? "Permite registrar el cliente sin correo ni dirección."
                            : "Por ejemplo, una salsa de la casa. Se abrirá la ficha técnica y aparecerá en Productos como producto de insumo."}
                        </span>
                      </span>
                    </button>
                  ) : f.type === "select" ? (
                    <select
                      value={val}
                      disabled={
                        isPrincipalAdminUser &&
                        modal.mode === "edit" &&
                        f.key === "3"
                      }
                      onChange={(e) => updateFieldValue(e.target.value)}
                      onBlur={() => {
                        if (requiredFormField) {
                          setFormFieldErrors(
                            validateManagedForm(modal.section, formData, modal.mode),
                          )
                        }
                      }}
                      aria-invalid={!!fieldValidationError}
                      className={`w-full min-w-0 rounded-xl text-sm outline-none cursor-pointer ${isUser || isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                      style={{
                        background: t.input,
                        border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                        color: val ? t.text : t.muted,
                        cursor:
                          isPrincipalAdminUser && modal.mode === "edit" && f.key === "3"
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {visibleFieldOptions?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                      {isSales && f.key === "1" && (
                        <option value="__new_client__">+ Registrar nuevo cliente</option>
                      )}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={val}
                      onChange={(e) =>
                        updateAdminField(modal.section, f.key, e.target.value)
                      }
                      onBlur={() =>
                        requiredFormField &&
                        setFormFieldErrors(
                          validateManagedForm(modal.section, formData, modal.mode),
                        )
                      }
                      aria-invalid={!isView && !!fieldValidationError}
                      rows={isPurchaseModule ? 2 : isRoles ? 2 : 3}
                      className={`w-full min-w-0 rounded-xl text-sm outline-none resize-none ${isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                      style={{
                        background: t.input,
                        border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                        color: t.text,
                      }}
                    />
                  ) : (
                    <input
                      type={f.type}
                      max={(isPurchase && f.key === "1") || (modal.section === "perdidas" && f.key === "4") || (isProduction && f.key === "3") || (isReturns && f.key === "5") ? getCurrentDateTimeParts().date : undefined}
                      min={(isPurchase && f.key === "1") || (modal.section === "perdidas" && f.key === "4") ? FIRST_DAY : undefined}
                      value={val}
                      inputMode={
                        (modal.section === "usuarios" && f.key === "2") ||
                        (isClient && ["2", "3"].includes(f.key)) ||
                        (isSupplier &&
                          ["1", "12"].includes(f.key)) ||
                        (isSupplier &&
                          f.key === "9" &&
                          formData["8"] !== "Pasaporte")
                          ? "numeric"
                          : undefined
                      }
                      onChange={(e) => updateFieldValue(e.target.value)}
                      onBlur={() => {
                        if (requiredFormField) {
                          setFormFieldErrors(
                            validateManagedForm(modal.section, formData, modal.mode),
                          )
                        }
                      }}
                      aria-invalid={!isView && !!fieldValidationError}
                      className={`w-full min-w-0 rounded-xl text-sm outline-none ${isUser || isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                      style={{
                        background: t.input,
                        border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                        color: t.text,
                      }}
                    />
                  )}
                  {!isView && (
                    <FieldError msg={shownFieldError(f.key) || fieldValidationError} />
                  )}
                </div>
                </Fragment>
              )
              })}
            </>
          )}
          {isClient && !isView && clientFormError && (
            <div className="rounded-xl px-3 py-2.5 text-xs font-medium sm:col-span-2" style={{ background: `${C.red}10`, color: C.red }}>
              {clientFormError}
            </div>
          )}
          {/* Section-specific view detail extras */}
          {/* Purchase module: real related data */}
          {isView && modal.section === "cat-insumos" && row && (() => {
            // The category at a glance: what it is, how its insumos are doing and which they are
            const supplies = (rows.insumos || []).filter((s) => normalizeName(s[1]) === normalizeName(row[0]))
            const low = supplies.filter((s) => isActiveStatus(s[12]) && Number(s[4]) <= Number(s[5]))
            const value = supplies.reduce((sum, s) => sum + (Number(s[4]) || 0) * (Number(s[3]) || 0), 0)
            const active = isActiveStatus(row[2] || "Activa")
            const description = String(row[1] ?? "").trim()
            return (
              <div className="flex flex-col gap-3 sm:col-span-2">
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                    {Ico.shopping}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold break-words" style={{ color: t.text }}>{String(row[0])}</div>
                    <p className="mt-0.5 text-xs leading-snug" style={{ color: description ? t.muted : t.subtle }}>
                      {description || "Sin descripción."}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={active ? { background: "rgba(58,109,94,0.14)", color: "#2E7D60" } : { background: `${C.red}14`, color: C.red }}
                  >
                    {String(row[2] || "Activa")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Insumos", String(supplies.length), t.text],
                    ["Con stock bajo", String(low.length), low.length ? C.red : t.text],
                    ["Valor en stock", fmt(Math.round(value)), C.mustard],
                  ].map(([label, text, color]) => (
                    <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                      <div className="text-[10px] font-semibold" style={{ color: t.muted }}>{label}</div>
                      <div className="mt-0.5 text-sm font-bold" style={{ color }}>{text}</div>
                    </div>
                  ))}
                </div>
                <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                  <div className="px-3 py-2 text-[11px] font-semibold" style={{ background: t.cardAlt, color: t.muted }}>
                    Insumos en esta categoría
                  </div>
                  {supplies.length === 0 ? (
                    <p className="px-3 py-3 text-center text-xs" style={{ color: t.muted }}>Ningún insumo usa esta categoría todavía.</p>
                  ) : (
                    // Its own scroll, so a big category doesn't stretch the window
                    <div className="max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                      {supplies.map((s) => {
                        const isLow = isActiveStatus(s[12]) && Number(s[4]) <= Number(s[5])
                        return (
                          <div
                            key={String(s[0])}
                            className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs"
                            style={{ borderColor: t.border, opacity: isActiveStatus(s[12]) ? 1 : 0.5 }}
                          >
                            <span className="min-w-0 truncate font-medium" style={{ color: t.text }}>
                              {String(s[0])}
                              {!isActiveStatus(s[12]) && <span style={{ color: t.muted }}> · Inactivo</span>}
                            </span>
                            <span className="flex flex-shrink-0 items-center gap-2" style={{ color: t.muted }}>
                              {isLow && (
                                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${C.red}18`, color: C.red }}>
                                  ⚠ Stock bajo
                                </span>
                              )}
                              <strong style={{ color: isLow ? C.red : t.text }}>
                                {(Number(s[4]) || 0).toLocaleString("es-CO")} {String(s[2] ?? "")}
                              </strong>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
          {isView && modal.section === "insumos" && row && (() => {
            // Every purchase line of this insumo: what was bought, how much and for how much
            const name = normalizeName(row[0])
            const unit = String(row[2] ?? "und")
            const lines = (rows.compras || []).flatMap((purchase) =>
              parsePurchaseItems(purchase[6])
                .filter((item) => normalizeName(item.name) === name)
                .map((item) => ({
                  supplier: String(purchase[0] ?? ""),
                  date: String(purchase[1] ?? ""),
                  annulled: String(purchase[5]) === "Anulado",
                  quantity: Number(item.quantity) || 0,
                  unitPrice: Number(item.unitPrice) || 0,
                  total: item.total,
                })),
            )
            const active = lines.filter((l) => !l.annulled)
            const boughtQty = active.reduce((s, l) => s + l.quantity, 0)
            const boughtValue = active.reduce((s, l) => s + l.total, 0)
            const dateField = MOD_CFG.compras.fields.find((field) => field.key === "1")!
            return (
              <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: t.muted }}>
                    Compras de este insumo
                  </span>
                  {active.length > 0 && (
                    <span className="text-xs" style={{ color: t.muted }}>
                      Total comprado:{" "}
                      <strong style={{ color: t.text }}>
                        {boughtQty.toLocaleString("es-CO")} {unit}
                      </strong>{" "}
                      · <strong style={{ color: C.mustard }}>{fmt(boughtValue)}</strong>
                    </span>
                  )}
                </div>
                {lines.length === 0 ? (
                  <div style={{ color: t.text }}>Aún no hay compras registradas de este insumo.</div>
                ) : (
                  lines.map((l, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t py-2 text-xs"
                      style={{ borderColor: t.border, opacity: l.annulled ? 0.55 : 1 }}
                    >
                      <span className="min-w-0" style={{ color: t.text }}>
                        <strong>{formatViewValue(dateField, l.date)}</strong> · {l.supplier}
                        {l.annulled && <span style={{ color: C.red }}> · Anulada</span>}
                      </span>
                      <span style={{ color: t.muted }}>
                        {l.quantity.toLocaleString("es-CO")} {unit} × {fmt(l.unitPrice)} ={" "}
                        <strong style={{ color: C.mustard }}>{fmt(l.total)}</strong>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )
          })()}
          {isView && modal.section === "insumos" && row && (() => {
            // Stock history from the backend: every entry and exit with where it came from
            const unit = String(row[2] ?? "und")
            const moves = stockMoves?.id === String(row[DB_SYNC.insumos.idIndex]) ? stockMoves.rows : null
            const stock = Number(row[4]) || 0
            return (
              <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: t.muted }}>Movimientos de stock</span>
                  {moves && moves.length > 0 && (
                    // The newest movement leaves the stock it should have: a different value means something changed it outside the history
                    Math.abs(Number(moves[0].stock_resultante) - stock) < 0.001 ? (
                      <span className="text-xs font-semibold" style={{ color: "#2E7D60" }}>✓ El stock cuadra con sus movimientos</span>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: C.red }}>
                        ⚠ Descuadre: el historial dice {Number(moves[0].stock_resultante).toLocaleString("es-CO")} {unit}
                      </span>
                    )
                  )}
                </div>
                {moves === null ? (
                  <div style={{ color: t.muted }}>{stockMoves?.error || "Cargando…"}</div>
                ) : moves.length === 0 ? (
                  <div style={{ color: t.text }}>Todavía no tiene movimientos.</div>
                ) : (
                  moves.slice(0, 15).map((m) => {
                    const qty = Number(m.cantidad)
                    return (
                      <div
                        key={String(m.id_movimiento)}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t py-2 text-xs"
                        style={{ borderColor: t.border }}
                      >
                        <span className="min-w-0" style={{ color: t.text }}>
                          <strong>{STOCK_ORIGIN[String(m.origen)] ?? String(m.origen)}</strong>
                          {m.referencia ? ` · ${String(m.referencia)}` : ""}
                          <span style={{ color: t.muted }}> · {String(m.fecha)}</span>
                        </span>
                        <span style={{ color: t.muted }}>
                          <strong style={{ color: qty >= 0 ? "#2E7D60" : C.red }}>
                            {qty >= 0 ? "+" : "−"}{Math.abs(qty).toLocaleString("es-CO")} {unit}
                          </strong>{" "}
                          → {Number(m.stock_resultante).toLocaleString("es-CO")} {unit}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })()}
          {isView && modal.section === "perdidas" && row && (() => {
            // [0 insumo, 1 cantidad ("2 kg"), 2 motivo, 3 responsable, 4 fecha, 5 origen, 6 estado,
            //  7 devoluciones ("N kg: motivo" por línea), 8 total devuelto, 10 id_compra]
            const unit = String(row[1]).split(" ").slice(1).join(" ") || "und"
            const qtyNow = parseFloat(String(row[1]).replace(",", ".")) || 0
            const returned = parseFloat(String(row[8] ?? "").replace(",", ".")) || 0
            const fullyReturned = isReturnedLoss(row)
            // A full return keeps the original quantity; a partial one lowers it by what went back
            const lostAtFirst = fullyReturned ? qtyNow : qtyNow + returned
            const stillLost = fullyReturned ? 0 : qtyNow
            const purchase = (rows.compras || []).find((c) => isLossOfPurchase(row, c))
            const bought = purchase
              ? parsePurchaseLines(purchase[6]).filter((l) => normalizeName(l.name) === normalizeName(row[0]))
              : []
            const returns = String(row[7] ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
            const status = String(row[6] || "Registrada")
            const n = (v: number) => `${v.toLocaleString("es-CO")} ${unit}`
            const box = { background: t.input, border: `1px solid ${t.border}` }
            const title = (text: string) => (
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>{text}</div>
            )
            return (
              <div className="flex flex-col gap-3 sm:col-span-2">
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.red}12`, color: C.red }}>
                    {Ico.alert}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold break-words" style={{ color: t.text }}>{String(row[0])}</div>
                    <div className="mt-0.5 text-xs" style={{ color: t.muted }}>
                      {String(row[2] || "Sin motivo")} · {String(row[4] || "—")} · {String(row[3] || "Sin responsable")}
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: badgeSt(status)?.bg ?? t.input, color: badgeSt(status)?.color ?? t.muted }}
                  >
                    {status}
                  </span>
                </div>
                <div>
                  {title("Qué se perdió")}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Se perdió", n(lostAtFirst), t.text],
                      ["Sigue perdido", n(stillLost), stillLost ? C.red : "#2E7D60"],
                      ["Valor perdido", lossValue(row) > 0 ? fmt(Math.round(lossValue(row))) : "—", stillLost ? C.red : t.text],
                    ].map(([label, text, color]) => (
                      <div key={label} className="rounded-xl px-3 py-2.5" style={box}>
                        <div className="text-[10px] font-semibold" style={{ color: t.muted }}>{label}</div>
                        <div className="mt-0.5 text-sm font-bold" style={{ color }}>{text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  {title("Compra de origen")}
                  {purchase ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs" style={box}>
                      <span style={{ color: t.text }}>
                        <strong>Compra #{String(purchase[DB_SYNC.compras.idIndex] ?? "—")}</strong> · {String(purchase[0])} · {String(purchase[1])}
                        {!isActiveStatus(purchase[5]) && <span style={{ color: C.red }}> · Anulada</span>}
                      </span>
                      <span style={{ color: t.muted }}>
                        {bought.length
                          ? `Se compraron ${bought.reduce((s, l) => s + l.quantity, 0).toLocaleString("es-CO")} ${unit} × ${fmt(bought[0].unitPrice)}`
                          : "Ese insumo ya no está en la compra"}
                      </span>
                    </div>
                  ) : (
                    <p className="rounded-xl px-3 py-2.5 text-xs" style={{ ...box, color: t.muted }}>
                      {String(row[5] ?? "").trim() || "Pérdida registrada sin una compra asociada."}
                    </p>
                  )}
                </div>
                <div>
                  {title(`Devuelto a la compra${returned ? ` · ${n(returned)}` : ""}`)}
                  {returns.length ? (
                    <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.mustard}40` }}>
                      {returns.map((line, i) => {
                        // "3 kg: el proveedor lo cambió"
                        const [amount, ...why] = line.split(":")
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 px-3 py-2 text-xs"
                            style={{ background: `${C.mustard}0D`, borderTop: i ? `1px solid ${C.mustard}30` : undefined }}
                          >
                            <strong className="flex-shrink-0" style={{ color: C.mustard }}>{why.length ? amount.trim() : "—"}</strong>
                            <span className="min-w-0 break-words" style={{ color: t.text }}>{(why.length ? why.join(":") : line).trim()}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl px-3 py-2.5 text-xs" style={{ ...box, color: t.muted }}>No se ha devuelto nada a la compra.</p>
                  )}
                </div>
              </div>
            )
          })()}
          {isView && isPurchase && (() => {
            const items = parsePurchaseItems(row?.[6])
            const annulled = String(row?.[5]) === "Anulado"
            const info = (label: string, value: string) => (
              <div className="min-w-0">
                <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                <div className="truncate text-sm" style={{ color: t.text }}>{value}</div>
              </div>
            )
            return (
              <div className="flex min-w-0 flex-col gap-3 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3" style={{ background: t.cardAlt }}>
                  <span
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${C.mustard}14`, color: C.mustard }}
                  >
                    {Ico.cart}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px]" style={{ color: t.muted }}>Compra a</div>
                    <div className="break-words text-base font-semibold" style={{ color: t.text }}>{String(row?.[0] ?? "—")}</div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{ background: annulled ? `${C.red}18` : "rgba(58,109,94,0.14)", color: annulled ? C.red : "#2E7D60" }}
                  >
                    {String(row?.[5] ?? "Activo")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl px-4 py-3 sm:grid-cols-3" style={{ border: `1px solid ${t.border}` }}>
                  {info("Fecha de compra", formatViewValue(cfg.fields[1], String(row?.[1] ?? "")))}
                  {info("Registrada el", formatViewValue(cfg.fields[2], String(row?.[2] ?? "")))}
                  {info("Insumos", `${items.length} ${items.length === 1 ? "insumo" : "insumos"}`)}
                </div>
                <div className="min-w-0 overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 px-4 py-2 text-[11px] sm:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem]"
                    style={{ background: t.cardAlt, color: t.muted }}
                  >
                    <span>Insumo</span>
                    <span className="hidden text-right sm:block">Cantidad</span>
                    <span className="text-right">Precio unit.</span>
                    <span className="text-right">Total</span>
                  </div>
                  {items.length ? (
                    items.map((item, index) => {
                      const unit = String(supplyInfo(item.name)?.[2] ?? "und")
                      return (
                        <div
                          key={`${item.name}-${index}`}
                          className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 border-t px-4 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem]"
                          style={{ borderColor: t.border, color: t.text }}
                        >
                          <span className="min-w-0">
                            <span className="block break-words">{item.name}</span>
                            <span className="block text-[11px] sm:hidden" style={{ color: t.muted }}>
                              {Number(item.quantity).toLocaleString("es-CO")} {unit}
                            </span>
                          </span>
                          <span className="hidden text-right sm:block" style={{ color: t.muted }}>
                            {Number(item.quantity).toLocaleString("es-CO")} {unit}
                          </span>
                          <span className="text-right" style={{ color: t.muted }}>{fmt(Number(item.unitPrice || 0))}</span>
                          <span className="text-right">{fmt(item.total)}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: t.border, color: t.muted }}>
                      No se registraron insumos comprados.
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 border-t px-4 py-3" style={{ borderColor: t.border }}>
                    <span className="text-sm" style={{ color: t.muted }}>Total</span>
                    <span className="text-lg font-semibold" style={{ color: C.mustard }}>{fmt(Number(row?.[4] || 0))}</span>
                  </div>
                </div>
                {(() => {
                  // Losses sent from this purchase: what was lost, why, and what went back to the purchase
                  const losses = row ? (rows.perdidas || []).filter((l) => isLossOfPurchase(l, row)) : []
                  return (
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>
                        Pérdidas de esta compra{losses.length ? ` (${losses.length})` : ""}
                      </div>
                      {losses.length ? (
                        <div className="flex flex-col gap-2">
                          {losses.map((loss, i) => {
                            // Same reading as the loss detail: [1 cantidad ("2 kg"), 2 motivo, 3 responsable, 4 fecha,
                            //  6 estado, 7 devoluciones ("N kg: motivo" por línea), 8 total devuelto]
                            const unit = String(loss[1]).split(" ").slice(1).join(" ") || "und"
                            const qtyNow = parseFloat(String(loss[1]).replace(",", ".")) || 0
                            const returned = parseFloat(String(loss[8] ?? "").replace(",", ".")) || 0
                            const fully = isReturnedLoss(loss)
                            const lostAtFirst = fully ? qtyNow : qtyNow + returned
                            const stillLost = fully ? 0 : qtyNow
                            const n = (v: number) => `${v.toLocaleString("es-CO")} ${unit}`
                            const status = String(loss[6] || "Registrada")
                            const returns = String(loss[7] ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
                            return (
                              <div key={i} className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                                <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5" style={{ background: t.cardAlt }}>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold break-words" style={{ color: t.text }}>
                                      {String(loss[0])} · <span style={{ color: C.red }}>se perdieron {n(lostAtFirst)}</span>
                                    </div>
                                    <div className="mt-0.5 text-[11px]" style={{ color: t.muted }}>
                                      Por qué: <strong style={{ color: t.text }}>{String(loss[2] || "Sin motivo")}</strong> · {String(loss[4] || "—")} ·{" "}
                                      {String(loss[3] || "Sin responsable")}
                                    </div>
                                  </div>
                                  <span
                                    className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                                    style={{ background: badgeSt(status)?.bg ?? t.input, color: badgeSt(status)?.color ?? t.muted }}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <div className="px-3 py-2 text-xs" style={{ color: t.text }}>
                                  {returns.length ? (
                                    <>
                                      <div className="mb-1" style={{ color: t.muted }}>
                                        Devuelto a la compra: <strong style={{ color: C.mustard }}>{n(returned)}</strong>
                                        {" · "}sigue perdido: <strong style={{ color: stillLost ? C.red : "#2E7D60" }}>{n(stillLost)}</strong>
                                      </div>
                                      {returns.map((line, j) => {
                                        // "3 kg: el proveedor lo cambió"
                                        const [amount, ...why] = line.split(":")
                                        return (
                                          <div key={j} className="flex items-start gap-2 py-0.5">
                                            <strong className="flex-shrink-0" style={{ color: C.mustard }}>{why.length ? amount.trim() : "—"}</strong>
                                            <span className="min-w-0 break-words">{(why.length ? why.join(":") : line).trim()}</span>
                                          </div>
                                        )
                                      })}
                                    </>
                                  ) : (
                                    <span style={{ color: t.muted }}>No se ha devuelto nada a la compra: siguen perdidos {n(stillLost)}.</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl px-3 py-2.5 text-xs" style={{ background: t.input, border: `1px solid ${t.border}`, color: t.muted }}>
                          No se ha registrado ninguna pérdida de esta compra.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })()}
          {isView && modal.section === "cat-producto" && row && (() => {
            const products = (rows.producto || []).filter(
              (product) => normalizeName(product[1]) === normalizeName(row[0]),
            )
            return (
              <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ border: `1px solid ${t.border}` }}>
                <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>
                  Productos en esta categoría ({products.length})
                </div>
                {products.length ? (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {products
                      .map((product) => String(product[0]))
                      .sort((a, b) => a.localeCompare(b))
                      .map((name) => (
                        <div
                          key={name}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-3 py-2"
                          style={{ background: t.cardAlt, color: t.text }}
                        >
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: C.mustard }} />
                          <span className="min-w-0 truncate" title={name}>{name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ color: t.muted }}>Ningún producto usa esta categoría todavía.</div>
                )}
              </div>
            )
          })()}
          {isView && isProduction && row && (() => {
            const items = getProductionOrderItems(row)
            // Products first, then additions, then drinks
            const groupOf = (item: ProductionItem) => {
              const category = normalizeName(String(item.category || rows.producto?.find((p) => p[0] === item.name)?.[1] || ""))
              if (item.name.startsWith("Gaseosa ") || category === "bebidas" || category === "gaseosas") return 2
              if (item.parentId || category === "adiciones") return 1
              return 0
            }
            const groups = ["Productos", "Adiciones", "Bebidas"]
              .map((title, g) => ({ title, list: items.filter((item) => groupOf(item) === g) }))
              .filter((group) => group.list.length)
            const history = parseProductionHistory(row[12])
            const status = String(row[8] || "Recibida")
            // "17 oct 2026" and "18:34" (some old records saved "6:37:44 PM")
            const shortDate = (value: string | number | undefined) => {
              const d = new Date(`${String(value ?? "").slice(0, 10)}T00:00:00`)
              return Number.isNaN(d.getTime()) ? String(value ?? "—") : d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
            }
            const shortTime = (value: string | number | undefined) => {
              const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i.exec(String(value ?? "").trim())
              if (!m) return String(value ?? "—")
              let h = Number(m[1]) % 12 + (m[3]?.toLowerCase() === "p" ? 12 : 0)
              if (!m[3]) h = Number(m[1])
              return `${String(h).padStart(2, "0")}:${m[2]}`
            }
            const info = (label: string, value: string, color: string = t.text) => (
              <div className="min-w-0 rounded-xl px-3 py-2.5" style={{ background: t.cardAlt }}>
                <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                <div className="truncate text-sm" style={{ color }}>{value}</div>
              </div>
            )
            const title = (text: string) => (
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>{text}</h4>
            )
            return (
              <div className="grid gap-4 sm:col-span-2 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="min-w-0 rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                  {title(`Productos de la orden (${items.length})`)}
                  <div className={`gap-x-4 ${items.length > 8 ? "sm:columns-2" : ""}`}>
                    {groups.map((group) => (
                      <div key={group.title} className="mb-3 break-inside-avoid last:mb-0">
                        <div className="mb-1 text-[11px]" style={{ color: t.muted }}>{group.title}</div>
                        {group.list.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0"
                            style={{ borderColor: t.border }}
                          >
                            <span className="min-w-0">
                              <span className="block break-words text-sm" style={{ color: t.text }}>{item.name}</span>
                              {item.sauces?.length ? (
                                <span className="block text-[11px]" style={{ color: t.muted }}>
                                  Salsas: {item.sauces.join(", ")}
                                </span>
                              ) : null}
                              {item.parentId ? (
                                <span className="block text-[11px]" style={{ color: t.muted }}>
                                  Adición de {items.find((parent) => parent.id === item.parentId)?.name ?? "producto"}
                                </span>
                              ) : null}
                              {(item.reuse || item.onlySupplies) && (
                                <span className="block text-[11px]" style={{ color: t.muted }}>
                                  {item.reuse
                                    ? "Se reutiliza (no descuenta)"
                                    : `Solo ${item.onlySupplies!.map((part: { name: string }) => part.name).join(", ")}`}
                                </span>
                              )}
                            </span>
                            <span className="flex-shrink-0 text-sm" style={{ color: t.muted }}>
                              ×{item.quantity.toLocaleString("es-CO")} {item.unit && item.unit !== "unidad" ? item.unit : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {info("Estado", status, status === "Producto no conforme" ? C.red : status === "Terminado" ? "#2E7D60" : t.text)}
                    {info(row[15] ? "Pedido" : "Prioridad", row[15] ? String(row[15]) : `#${String(row[3] ?? "—")}`)}
                    {info("Creada", `${shortDate(row[4])} · ${shortTime(row[5])}`)}
                    {info("Actualizada", `${shortDate(row[6])} · ${shortTime(row[7])}`)}
                  </div>
                  {row[9] ? info("Salida de producción", String(row[9]), C.mustard) : null}
                  <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                    {title("Actualizaciones")}
                    <ol className="relative flex flex-col gap-2.5">
                      {history.map((update, index) => (
                        <li key={`${update.status}-${update.date}-${index}`} className="flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ background: update.status === "Producto no conforme" ? C.red : index === history.length - 1 ? C.mustard : t.inputB }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm" style={{ color: update.status === "Producto no conforme" ? C.red : t.text }}>
                            {update.status}
                          </span>
                          <span className="flex-shrink-0 text-[11px]" style={{ color: t.muted }}>{shortDate(update.date)} · {shortTime(update.time)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )
          })()}
          {isView && isPedido && row && (
            <div className="grid min-w-0 gap-3 sm:col-span-2 md:grid-flow-row-dense md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              {(() => {
                const badge = (text: string, ok: boolean, warn = false) => (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={
                      ok
                        ? { background: "rgba(46,125,96,0.12)", color: "#2E7D60" }
                        : warn
                          ? { background: `${C.red}12`, color: C.red }
                          : { background: `${C.mustard}16`, color: C.mustard }
                    }
                  >
                    {text}
                  </span>
                )
                const info = (label: string, value: string) => (
                  <div className="min-w-0 rounded-xl px-3 py-2.5" style={{ background: t.cardAlt }}>
                    <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                    <div className="break-words text-sm" style={{ color: t.text }}>{value || "—"}</div>
                  </div>
                )
                const title = (text: string) => (
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>{text}</h4>
                )
                const productionOrders = (rows.produccion || []).filter((order) => String(order[15] ?? "") === String(row[0]))
                const groups = orderDetails
                  .filter((line) => !line.parentId)
                  .map((line) => [line, ...orderDetails.filter((child) => child.parentId === line.id)])
                const total = orderDetails.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) || Number(row[6]) || 0
                const comment = String(row[12] ?? "").trim()
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 md:col-span-2" style={{ background: t.cardAlt }}>
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                        {Ico.orders}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold" style={{ color: t.text }}>{String(row[0])}</div>
                        <div className="break-words text-xs" style={{ color: t.muted }}>{String(row[1] || "Sin cliente")}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {badge(String(row[7] || "Recibido"), ["Entregado"].includes(String(row[7])), String(row[7]) === "Cancelado")}
                        {badge(`Pago: ${String(row[8] || "Pendiente")}`, String(row[8]) === "Pagado", String(row[8]) === "Rechazado")}
                      </div>
                    </div>
                    {/* Modality isn't shown: it follows the type and payment method by itself */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:col-span-2">
                      {info("Tipo de pedido", String(row[3] ?? ""))}
                      {info("Método de pago", String(row[4] ?? ""))}
                      {info("Producción", String(row[9] ?? ""))}
                    </div>
                    <div className="rounded-2xl px-4 py-3 md:col-start-1 md:row-start-3 md:row-span-6 self-start" style={{ border: `1px solid ${t.border}` }}>
                      {title(`Productos (${groups.length})`)}
                      {groups.length ? (
                        <div className={`gap-x-6 ${groups.length > 4 ? "sm:columns-2" : ""}`}>
                          {groups.map((group) => (
                            <div key={group[0].id} className="mb-2 break-inside-avoid border-b pb-2 last:border-b-0" style={{ borderColor: t.border }}>
                              {(() => {
                                // The product's additions and drinks show only when its "Más detalles" is open
                                const [main, ...extras] = group
                                const open = orderDetailOpen.includes(main.id)
                                return (
                                  <>
                                    <div className="flex items-center justify-between gap-3 py-0.5 text-sm">
                                      <span className="min-w-0 break-words" style={{ color: t.text }}>
                                        {main.product}
                                        <span style={{ color: t.muted }}> ×{main.quantity}</span>
                                        {main.sauces?.length ? (
                                          <span className="block text-[11px]" style={{ color: t.muted }}>Salsas: {main.sauces.join(", ")}</span>
                                        ) : null}
                                      </span>
                                      <span className="flex flex-shrink-0 items-center gap-2">
                                        {extras.length > 0 && (
                                          <button
                                            type="button"
                                            aria-expanded={open}
                                            onClick={() =>
                                              setOrderDetailOpen((current) =>
                                                open ? current.filter((id) => id !== main.id) : [...current, main.id],
                                              )
                                            }
                                            className="cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                            style={{ background: `${C.mustard}14`, color: C.mustard }}
                                          >
                                            {open ? "− Menos" : `+ Más detalles (${extras.length})`}
                                          </button>
                                        )}
                                        <span style={{ color: t.text }}>{fmt(main.quantity * main.unitPrice)}</span>
                                      </span>
                                    </div>
                                    {open &&
                                      extras.map((line) => (
                                        <div key={line.id} className="flex items-baseline justify-between gap-3 py-0.5 pl-4 text-sm">
                                          <span className="min-w-0 break-words" style={{ color: t.muted }}>
                                            + {line.product}
                                            <span> ×{line.quantity}</span>
                                          </span>
                                          <span className="flex-shrink-0" style={{ color: t.muted }}>{fmt(line.quantity * line.unitPrice)}</span>
                                        </div>
                                      ))}
                                  </>
                                )
                              })()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: t.muted }}>No hay detalle de productos disponible.</p>
                      )}
                      <div className="mt-2 flex items-center justify-between border-t pt-2.5" style={{ borderColor: t.border }}>
                        <span className="text-sm" style={{ color: t.muted }}>Total</span>
                        <span className="text-lg font-semibold" style={{ color: C.mustard }}>{fmt(total)}</span>
                      </div>
                    </div>
                    {(comment || productionOrders.length > 0) && (
                      <div className="grid content-start gap-3 md:col-start-2 self-start">
                        {comment && (
                          <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                            {title("Especificaciones")}
                            <p className="whitespace-pre-line text-sm" style={{ color: t.text }}>{comment}</p>
                          </div>
                        )}
                        {productionOrders.length > 0 && (
                          <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                            {title("Orden de producción")}
                            {productionOrders.map((order) => (
                              <div key={String(order[0])} className="flex items-center justify-between gap-2 text-sm">
                                <span style={{ color: t.text }}>{String(order[0])}</span>
                                {badge(String(order[8] || "Recibida"), String(order[8]) === "Terminado", String(order[8]) === "Producto no conforme")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
              {(paymentProofs[modal.idx!] || paymentProofDraft) && (
                <div className="rounded-2xl px-4 py-3 md:col-start-2 self-start" style={{ border: `1px solid ${t.border}` }}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: t.text }}>
                    Comprobante de transferencia
                  </h4>
                  <img
                    src={paymentProofs[modal.idx!] || paymentProofDraft}
                    alt={`Comprobante de pago de ${String(row?.[0] ?? "pedido")}`}
                    className="max-h-48 w-full rounded-xl object-contain"
                    style={{ background: t.card, border: `1px solid ${t.border}` }}
                  />
                </div>
              )}
              {(() => {
                const current = String(row?.[8] || "Pendiente")
                const next = PAYMENT_NEXT[current]
                return (
                  <label className="md:col-start-2 flex flex-col gap-1.5 text-xs font-semibold" style={{ color: t.text }}>
                    Estado de pago
                    <select
                      value={current}
                      disabled={!next}
                      onChange={(event) => setOrderPayment(modal.idx!, event.target.value)}
                      className="w-full cursor-pointer rounded-lg px-3 py-2 text-sm disabled:cursor-default"
                      style={{
                        background: current === "Pagado" ? "rgba(46,125,96,0.10)" : t.card,
                        color: current === "Pagado" ? "#2E7D60" : t.text,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      {[current, ...(next ? [next] : [])].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <span className="text-[11px] font-normal" style={{ color: t.muted }}>
                      {next ? "Solo avanza; al pasarlo a «Pagado» se crea la venta del pedido." : "Pagado: la venta ya quedó registrada."}
                    </span>
                  </label>
                )
              })()}
              {loadOrders().some((order) => order.id === row?.[0]) && (
                <label className="md:col-start-2 flex flex-col gap-1.5 text-xs font-semibold" style={{ color: t.text }}>
                  Estado del pedido (lo ve el cliente)
                  <select
                    value={String(row?.[7] ?? "")}
                    onChange={(e) => setClientOrderStatus(modal.idx!, e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: t.card, color: t.text, border: `1px solid ${t.border}` }}
                  >
                    {[...new Set([String(row?.[7] ?? ""), "Por confirmar", ...ORDER_STEPS, "Cancelado"])]
                      .filter(Boolean)
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {loadOrders().some((order) => order.id === row?.[0]) && ORDER_TO_PRODUCTION[String(row?.[7])] && (
                <button
                  type="button"
                  onClick={() => setClientOrderStatus(modal.idx!, String(row?.[7]))}
                  className="md:col-start-2 self-start w-full cursor-pointer rounded-xl py-2 text-xs font-bold"
                  style={{ background: `${C.mustard}14`, color: C.mustard }}
                >
                  Sincronizar producción con «{String(row?.[7])}»
                </button>
              )}
              {String(row?.[8]) === "Rechazado" && (
                <p className="md:col-start-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: `${C.red}10`, color: C.red }}>
                  Transferencia rechazada: {String(row?.[11] || "Sin motivo registrado.")}
                </p>
              )}
              {isTransferPaymentMethod(String(row?.[4] ?? "")) &&
              String(row?.[8]) === "Pendiente de verificación" ? (
                <div className="md:col-start-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRejectionTarget(modal.idx!)
                      setPaymentRejectionReason("")
                      setPaymentRejectionError("")
                    }}
                    className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: `${C.red}12`, color: C.red }}
                  >
                    Rechazar transferencia
                  </button>
                  <button
                    type="button"
                    disabled={!paymentProofs[modal.idx!]}
                    onClick={() => approveOrderForProduction(modal.idx!)}
                    className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    Aprobar transferencia y enviar a producción
                  </button>
                </div>
              ) : String(row?.[9]) === "Autorizada" ? (
                <p className="md:col-start-2 text-center text-sm font-semibold" style={{ color: "#2E7D60" }}>
                  Pago aprobado y producción autorizada.
                </p>
              ) : String(row?.[9]) === "Enviada a producción" ? (
                <p className="md:col-start-2 text-center text-sm font-semibold" style={{ color: "#2E7D60" }}>
                  Ya se envió a producción.
                </p>
              ) : String(row?.[8]) !== "Rechazado" && (
                <button
                  type="button"
                  disabled={
                    (String(row?.[5]) !== "Contraentrega" &&
                      (String(row?.[8]) !== "Pagado" || !paymentProofs[modal.idx!])) ||
                    ["Autorizada", "Enviada a producción"].includes(String(row?.[9]))
                  }
                  onClick={() => approveOrderForProduction(modal.idx!)}
                  className="md:col-start-2 self-start w-full cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: C.mustard, color: "#fff" }}
                >
                  Confirmar pedido y enviar a producción
                </button>
              )}
            </div>
          )}
          {isView && isSales && row && (() => {
            const info = (label: string, value: string) => (
              <div className="min-w-0 rounded-xl px-3 py-2.5" style={{ background: t.cardAlt }}>
                <div className="text-[11px]" style={{ color: t.muted }}>{label}</div>
                <div className="break-words text-sm" style={{ color: t.text }}>{value || "—"}</div>
              </div>
            )
            const title = (text: string) => (
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.mustard, fontFamily: "League Spartan, sans-serif" }}>{text}</h4>
            )
            const groups = saleOrderLines
              .filter((line) => !line.parentId)
              .map((line) => [line, ...saleOrderLines.filter((child) => child.parentId === line.id)])
            const date = new Date(`${String(row[3] ?? "").slice(0, 10)}T00:00:00`)
            const dateText = Number.isNaN(date.getTime())
              ? String(row[3] ?? "—")
              : date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
            const proof = saleOrderIndex >= 0 ? paymentProofs[saleOrderIndex] : ""
            return (
              <div className="grid min-w-0 gap-3 sm:col-span-2 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 md:col-span-2" style={{ background: t.cardAlt }}>
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.mustard}14`, color: C.mustard }}>
                    {Ico.cash}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: t.muted }}>{String(row[0])}</div>
                    <div className="break-words text-base font-semibold" style={{ color: t.text }}>{String(row[2] || "Sin cliente")}</div>
                    <div className="text-xs" style={{ color: t.muted }}>{dateText}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px]" style={{ color: t.muted }}>Total</div>
                    <div className="text-xl font-semibold" style={{ color: C.mustard }}>{fmt(Number(row[7]) || 0)}</div>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 md:row-span-2" style={{ border: `1px solid ${t.border}` }}>
                  {title(`Productos (${groups.length})`)}
                  {groups.length ? (
                    groups.map((group) => {
                      const [main, ...extras] = group
                      const open = orderDetailOpen.includes(main.id)
                      return (
                        <div key={main.id} className="border-b py-1.5 last:border-b-0" style={{ borderColor: t.border }}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0">
                              <span className="block break-words" style={{ color: t.text }}>
                                {main.product}<span style={{ color: t.muted }}> ×{main.quantity}</span>
                              </span>
                              <span className="block text-[11px]" style={{ color: t.muted }}>{fmt(main.unitPrice)} c/u</span>
                            </span>
                            <span className="flex flex-shrink-0 items-center gap-2">
                              {extras.length > 0 && (
                                <button
                                  type="button"
                                  aria-expanded={open}
                                  onClick={() =>
                                    setOrderDetailOpen((current) => (open ? current.filter((id) => id !== main.id) : [...current, main.id]))
                                  }
                                  className="cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{ background: `${C.mustard}14`, color: C.mustard }}
                                >
                                  {open ? "− Menos detalles" : `+ Más detalles (${extras.length})`}
                                </button>
                              )}
                              <span style={{ color: t.text }}>{fmt(main.quantity * main.unitPrice)}</span>
                            </span>
                          </div>
                          {open &&
                            extras.map((line) => (
                              <div key={line.id} className="flex items-baseline justify-between gap-3 py-0.5 pl-4 text-sm">
                                <span className="min-w-0 break-words" style={{ color: t.muted }}>+ {line.product} ×{line.quantity}</span>
                                <span className="flex-shrink-0" style={{ color: t.muted }}>{fmt(line.quantity * line.unitPrice)}</span>
                              </div>
                            ))}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm" style={{ color: t.muted }}>No hay detalle de productos disponible.</p>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t pt-2.5" style={{ borderColor: t.border }}>
                    <span className="text-sm" style={{ color: t.muted }}>Total</span>
                    <span className="text-lg font-semibold" style={{ color: C.mustard }}>{fmt(Number(row[7]) || 0)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 self-start">
                  <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                    {title("Datos de la venta")}
                    <dl className="flex flex-col gap-2 text-sm">
                      {([
                        ["Vendedor", String(row[1] || "—")],
                        ["Tipo de venta", saleTypeOf(row[4]) || "—"],
                        ["Método de pago", String(row[5] || "—")],
                      ] as const).map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-3">
                          <dt style={{ color: t.muted }}>{label}</dt>
                          <dd className="min-w-0 break-words text-right" style={{ color: t.text }}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {String(row[9] ?? "").trim() && String(row[9]) !== "Sin pedido" ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                      <div className="min-w-0">
                        <div className="text-[11px]" style={{ color: t.muted }}>Pedido asociado</div>
                        <div className="text-sm font-semibold" style={{ color: t.text }}>{String(row[9])}</div>
                      </div>
                      {(() => {
                        // Live: the order's current status (the saved one if the order is gone)
                        const status = String((rows.pedidos || []).find((p) => String(p[0]) === String(row[9]))?.[7] ?? row[10] ?? "").trim()
                        return status ? (
                          <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                            style={status === "Entregado" ? { background: "rgba(46,125,96,0.12)", color: "#2E7D60" } : { background: `${C.mustard}16`, color: C.mustard }}
                          >
                            {status}
                          </span>
                        ) : null
                      })()}
                    </div>
                  ) : (
                    <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: t.cardAlt, color: t.muted }}>Venta directa, sin pedido asociado.</div>
                  )}
                </div>
                {proof && (
                  <div className="rounded-2xl px-4 py-3" style={{ border: `1px solid ${t.border}` }}>
                    {title("Comprobante de pago")}
                    <img src={proof} alt="Comprobante de pago" className="max-h-44 w-full rounded-lg object-contain" style={{ background: t.card }} />
                  </div>
                )}
              </div>
            )
          })()}
          {/* Roles permissions matrix */}
          {isRoles && !isView && (
            <div className="sm:col-span-2">
              <RolesPermMatrix
                roleName={formData["0"] || ""}
                permissionKey={
                  modal.mode === "edit" && row
                    ? String(row[0] ?? "")
                    : formData["0"] || ""
                }
              />
            </div>
          )}
          {isRoles && isView && row && (
            <RolesPermMatrix roleName={String(row[0])} readOnly={true} />
          )}
        </div>
        {saveError && (
          <p
            role="alert"
            className="mx-5 mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: `${C.red}14`, color: C.red, border: `1px solid ${C.red}40` }}
          >
            {saveError} Lo que escribiste sigue aquí: corrige y vuelve a guardar.
          </p>
        )}
        <div
          className={`px-5 flex gap-3 ${isUser || isRoles ? "py-3" : "py-4"}`}
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <button
            onClick={requestCloseModal}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            style={{ background: t.input, color: t.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(182,140,28,0.12)"
              e.currentTarget.style.color = C.mustard
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = t.input
              e.currentTarget.style.color = t.muted
            }}
          >
            {isView ? "Cerrar" : "Cancelar"}
          </button>
          {isSales && modal.mode !== "add" && row && (
            <button
              type="button"
              disabled={!!saleReturnBlock(row)}
              title={saleReturnBlock(row) || "Registrar una devolución de esta venta"}
              onClick={() => {
                const saleCode = String(row[0])
                setSection("devoluciones")
                openAdd("devoluciones")
                setFormData((current) => ({ ...current, "1": saleCode }))
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: `${C.red}12`, color: C.red }}
            >
              {Ico.undo} Registrar devolución
            </button>
          )}
          {isView && (isPurchaseModule || isProduct) && modal.idx !== null && !anulled[modal.section]?.has(modal.idx) && statusValue !== "Anulado" && modal.section !== "roles" && canDo(modal.section, "EDITAR") && !(modal.section === "perdidas" && isReturnedLoss(row ?? undefined)) && (
            <button
              onClick={() => openEdit(modal.section, modal.idx!)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Editar
            </button>
          )}
          {modal.section === "perdidas" && modal.mode !== "add" && canDo("perdidas", "EDITAR") && String(row?.[5] ?? "").startsWith("Compra a ") && !isReturnedLoss(row ?? undefined) && !isLossPurchaseAnnulled(row ?? undefined) && (
            <button
              type="button"
              onClick={() => {
                setLossReturnError("")
                setLossReturnQty(String(parseFloat(String(row?.[1] ?? "")) || ""))
                setLossReturnReason("")
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold hover:opacity-90"
              style={{ background: `${C.mustard}14`, color: C.mustard, border: `1.5px solid ${C.mustard}40` }}
            >
              {Ico.undo} Devolver a compra
            </button>
          )}
          {!isView && !(isPnc && modal.mode === "add" && !pncManual) && (
            <button
              onClick={() =>
                // New purchase: summary + confirmation first (if it's incomplete, saveModal shows what's missing)
                isPurchase && modal.mode === "add" && formData["0"] && parsePurchaseItems(formData["6"]).length
                  ? setPurchaseConfirmOpen(true)
                  : saveModal()
              }
              disabled={saving}
              className="admin-save-shine flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}
        </div>
      </div>
      {lossReturnReason !== null && modal.section === "perdidas" && row && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loss-return-title"
            className="w-full max-w-md overflow-hidden rounded-2xl"
            style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${C.mustard}14`, color: C.mustard }}
              >
                {Ico.undo}
              </span>
              <div className="min-w-0">
                <h3 id="loss-return-title" className="text-base font-semibold" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                  Devolver a compra
                </h3>
                <p className="text-xs" style={{ color: t.muted }}>
                  Lo que devuelvas vuelve al stock de «{String(row[0])}».
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 px-6 py-5">
              <div className="rounded-xl px-4 py-3 text-xs" style={{ background: t.cardAlt, color: t.muted }}>
                {String(row[5])} · pérdida por {String(row[2] || "—").toLowerCase()}
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: t.muted }}>
                Cantidad a devolver
                <div
                  className="flex items-center gap-2 rounded-xl px-3"
                  style={{ background: t.input, border: `1.5px solid ${t.inputB}` }}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={lossReturnQty}
                    onChange={(e) => {
                      setLossReturnQty(e.target.value)
                      setLossReturnError("")
                    }}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                    style={{ color: t.text }}
                  />
                  <span className="text-xs" style={{ color: t.muted }}>
                    {String(row[1]).split(" ").slice(1).join(" ") || "und"}
                  </span>
                </div>
                <span className="text-[11px] font-normal">
                  Perdido: {String(row[1])}. Si devuelves una parte, la pérdida queda con el resto y se puede seguir editando.
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: t.muted }}>
                ¿Por qué se devuelve a la compra?
                <textarea
                    rows={3}
                  value={lossReturnReason}
                  onChange={(e) => {
                    setLossReturnReason(e.target.value)
                    setLossReturnError("")
                  }}
                  placeholder="Ej: el proveedor lo cambió por uno en buen estado"
                  className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: t.input, border: `1.5px solid ${lossReturnError ? C.red : t.inputB}`, color: t.text }}
                />
              </label>
              {lossReturnError && (
                <p className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: `${C.red}10`, color: C.red }} role="alert">
                  {lossReturnError}
                </p>
              )}
              <p className="text-[11px]" style={{ color: t.muted }}>
                Si devuelves todo, la pérdida queda como «{RETURNED_LOSS}» y ya no se podrá editar.
              </p>
            </div>
            <div className="flex gap-3 px-6 pt-4 pb-6" style={{ borderTop: `1px solid ${t.border}` }}>
              <button
                type="button"
                disabled={lossReturnSaving}
                onClick={() => setLossReturnReason(null)}
                className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-semibold"
                style={{ background: t.input, color: t.muted }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={lossReturnSaving}
                onClick={returnLossToPurchase}
                className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60"
                style={{ background: C.mustard, color: "#fff" }}
              >
                {lossReturnSaving ? "Devolviendo..." : "Devolver a compra"}
              </button>
            </div>
          </div>
        </div>
      )}
      {purchaseConfirmOpen && isPurchase && (() => {
        const items = parsePurchaseItems(formData["6"])
        const total = items.reduce((sum, item) => sum + item.total, 0)
        const date = String(formData["1"] ?? "")
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={(e) => {
              e.stopPropagation()
              setPurchaseConfirmOpen(false)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="purchase-confirm-title"
              className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <span
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${C.mustard}14`, color: C.mustard }}
                >
                  {Ico.cart}
                </span>
                <div className="min-w-0">
                  <h3 id="purchase-confirm-title" className="text-lg font-semibold" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                    Resumen de la compra
                  </h3>
                  <p className="truncate text-sm" style={{ color: t.muted }}>
                    {String(formData["0"] || "—")}
                    {date && ` · ${formatViewValue(cfg.fields[1], date)}`}
                  </p>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "thin" }}>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider" style={{ color: t.muted }}>
                  <span>{items.length} {items.length === 1 ? "insumo" : "insumos"}</span>
                  <span>Total</span>
                </div>
                <div className="-mt-2 flex flex-col gap-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: t.cardAlt }}
                    >
                      <span
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ background: `${C.mustard}18`, color: C.mustard }}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm" style={{ color: t.text }}>{item.name}</span>
                        <span className="block text-xs" style={{ color: t.muted }}>
                          {Number(item.quantity).toLocaleString("es-CO")} {String(supplyInfo(item.name)?.[2] ?? "und")} ×{" "}
                          {fmt(Number(item.unitPrice || 0))}
                        </span>
                      </span>
                      <span className="flex-shrink-0 text-sm" style={{ color: t.text }}>{fmt(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3.5"
                  style={{ background: `${C.mustard}12`, border: `1px solid ${C.mustard}35` }}
                >
                  <span className="text-sm" style={{ color: t.text }}>Total de la compra</span>
                  <span className="text-xl font-semibold" style={{ color: C.mustard }}>{fmt(total)}</span>
                </div>
              </div>
              <div className="px-6 pt-4 pb-6" style={{ borderTop: `1px solid ${t.border}` }}>
                <p className="text-center text-sm" style={{ color: t.text }}>
                  ¿Estás seguro de que no vas a agregar más insumos?
                </p>
                <p className="mt-1 mb-4 text-center text-xs" style={{ color: t.muted }}>
                  Se sumará al stock y después no podrás cambiar la cantidad ni el precio.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setPurchaseConfirmOpen(false)}
                    className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-semibold"
                    style={{ background: t.input, color: t.muted }}
                  >
                    Agregar más
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setPurchaseConfirmOpen(false)
                      saveModal()
                    }}
                    className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-bold hover:opacity-90"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    Sí, registrar compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      {technicalSheetOpen && isProduct && !isView && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-tech-sheet-title"
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
            style={{ background: t.card, border: `1px solid ${t.border}`, maxHeight: "90vh" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div>
                <h3 id="product-tech-sheet-title" className="font-semibold" style={{ color: t.text }}>Ficha técnica del producto</h3>
                <p className="mt-1 text-xs" style={{ color: t.muted }}>{formData["0"] || "Producto"} · versión {formData["6"] || getAutoTechVersion(rows.producto || [])}</p>
              </div>
              <button type="button" onClick={() => setTechnicalSheetOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl cursor-pointer" style={{ background: t.input, color: t.muted }} aria-label="Cerrar ficha técnica">{Ico.x}</button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "thin" }}>
              {(() => {
                const controlSt = { background: t.input, border: `1px solid ${t.inputB}`, color: t.text }
                const supplyOf = (name: string) => rows.insumos?.find((item) => item[0] === name)
                const costOf = (ingredient: TechnicalIngredient) => {
                  const supply = supplyOf(ingredient.name)
                  const cost = convertQty(ingredient.quantity, ingredient.unit, String(supply?.[2] ?? ingredient.unit)) * Number(supply?.[3] || 0)
                  return Number.isFinite(cost) ? cost : 0
                }
                const pickedSupply = supplyOf(technicalIngredientSelect)
                const pickedUnit = technicalIngredientUnit || String(pickedSupply?.[2] ?? "")
                const draftQty = Number(technicalIngredientQuantity)
                const draftCost = pickedSupply && draftQty > 0
                  ? costOf({ name: technicalIngredientSelect, quantity: draftQty, unit: pickedUnit })
                  : 0
                const updateIngredient = (index: number, patch: Partial<TechnicalIngredient>) =>
                  setTechnicalIngredients((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
                const addStep = () => {
                  const step = technicalStepDraft.trim()
                  if (!step) return
                  setTechnicalSteps((current) => [...current, step])
                  setTechnicalStepDraft("")
                }
                const saveStepEdit = () => {
                  if (!technicalStepEdit) return
                  const text = technicalStepEdit.text.trim()
                  if (!text) return
                  setTechnicalSteps((current) => current.map((step, i) => (i === technicalStepEdit.index ? text : step)))
                  setTechnicalStepEdit(null)
                }
                const totalCost = technicalIngredients.reduce((sum, ingredient) => sum + costOf(ingredient), 0)
                return (
                  <>
                    <section className="flex flex-col gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                          Insumos
                        </h4>
                        <p className="text-[11px]" style={{ color: t.muted }}>
                          Lo que lleva una unidad del producto. Puedes usar otra unidad del mismo tipo (por ejemplo ml para un insumo en litros).
                        </p>
                      </div>
                      <div className="grid items-end gap-2 rounded-xl p-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_5rem_auto]" style={{ background: t.cardAlt }}>
                        {(() => {
                          const query = normalizeName(technicalIngredientSearch ?? "")
                          const options = getAvailableInsumos()
                            .filter((name) => !technicalIngredients.some((item) => item.name === name))
                            .filter((name) => {
                              const supply = supplyOf(name)
                              return !query || normalizeName(name).includes(query) || normalizeName(String(supply?.[1] ?? "")).includes(query)
                            })
                            .sort((x, y) => x.localeCompare(y))
                          const pick = (name: string) => {
                            setTechnicalIngredientSelect(name)
                            setTechnicalIngredientUnit("")
                            setTechnicalIngredientSearch(null)
                            setTechnicalSheetError("")
                          }
                          const open = technicalIngredientSearch !== null
                          return (
                            <div className="relative flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                              <label htmlFor="tech-supply-search">Insumo</label>
                              <div className="search-control flex items-center gap-2 rounded-full px-2.5" style={controlSt}>
                                <span className="flex-shrink-0" style={{ color: t.muted }}>{Ico.search}</span>
                                <input
                                  id="tech-supply-search"
                                  role="combobox"
                                  aria-expanded={open}
                                  aria-controls="tech-supply-list"
                                  autoComplete="off"
                                  value={open ? technicalIngredientSearch : technicalIngredientSelect}
                                  placeholder="Busca un insumo..."
                                  onFocus={() => setTechnicalIngredientSearch("")}
                                  onChange={(event) => setTechnicalIngredientSearch(event.target.value)}
                                  onBlur={() => setTimeout(() => setTechnicalIngredientSearch(null), 150)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" && options.length) {
                                      event.preventDefault()
                                      pick(options[0])
                                    }
                                    if (event.key === "Escape") setTechnicalIngredientSearch(null)
                                  }}
                                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                                  style={{ color: t.text }}
                                />
                                {(open ? technicalIngredientSearch : technicalIngredientSelect) && (
                                  <button
                                    type="button"
                                    className="search-clear"
                                    aria-label="Limpiar búsqueda de insumos"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setTechnicalIngredientSearch(null)
                                      setTechnicalIngredientSelect("")
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              {open && (
                                <div
                                  id="tech-supply-list"
                                  role="listbox"
                                  className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl p-1 shadow-xl"
                                  style={{ background: t.card, border: `1px solid ${t.border}`, scrollbarWidth: "thin" }}
                                >
                                  {options.length ? (
                                    options.map((name) => {
                                      const supply = supplyOf(name)
                                      return (
                                        <button
                                          key={name}
                                          type="button"
                                          role="option"
                                          aria-selected={technicalIngredientSelect === name}
                                          // mousedown runs before the input blur closes the list
                                          onMouseDown={(event) => {
                                            event.preventDefault()
                                            pick(name)
                                          }}
                                          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:opacity-80"
                                          style={{ background: technicalIngredientSelect === name ? `${C.mustard}14` : "transparent" }}
                                        >
                                          <span className="min-w-0">
                                            <span className="block truncate text-sm" style={{ color: t.text }}>{name}</span>
                                            <span className="block text-[10px]" style={{ color: t.muted }}>{String(supply?.[1] || "Sin categoría")}</span>
                                          </span>
                                          <span className="flex-shrink-0 text-[11px]" style={{ color: t.muted }}>
                                            {fmt(Number(supply?.[3] || 0))} / {String(supply?.[2] ?? "und")}
                                          </span>
                                        </button>
                                      )
                                    })
                                  ) : (
                                    <p className="px-2.5 py-3 text-center text-xs" style={{ color: t.muted }}>
                                      No hay insumos que coincidan.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                          Cantidad
                          <input
                            aria-label="Cantidad del insumo"
                            type="number"
                            min="0.001"
                            step="any"
                            value={technicalIngredientQuantity}
                            onChange={(event) => setTechnicalIngredientQuantity(event.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                            style={controlSt}
                          />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                          Unidad
                          <select
                            value={pickedUnit}
                            disabled={!pickedSupply}
                            onChange={(event) => setTechnicalIngredientUnit(event.target.value)}
                            className="w-full cursor-pointer rounded-lg px-2 py-2 text-sm outline-none disabled:cursor-default disabled:opacity-60"
                            style={controlSt}
                          >
                            {pickedSupply ? convertibleUnits(String(pickedSupply[2] ?? "")).map((unit) => (
                              <option key={unit} value={unit}>{unit}</option>
                            )) : <option value="">—</option>}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (!pickedSupply || !(draftQty > 0)) {
                              setTechnicalSheetError("Selecciona un insumo y escribe una cantidad mayor que cero.")
                              return
                            }
                            setTechnicalIngredients((current) => [...current, { name: technicalIngredientSelect, quantity: draftQty, unit: pickedUnit }])
                            setTechnicalIngredientSelect("")
                            setTechnicalIngredientUnit("")
                            setTechnicalIngredientSearch(null)
                            setTechnicalIngredientQuantity("1")
                            setTechnicalSheetError("")
                          }}
                          className="flex cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold"
                          style={{ background: C.mustard, color: "#fff" }}
                        >
                          {Ico.plus} Agregar
                        </button>
                        {pickedSupply && (
                          <span className="text-[11px] sm:col-span-4" style={{ color: t.muted }}>
                            Precio: {fmt(Number(pickedSupply[3] || 0))} por {String(pickedSupply[2] ?? "und")}
                            {draftQty > 0 && <> · {draftQty.toLocaleString("es-CO")} {pickedUnit} = <span style={{ color: C.mustard }}>{fmt(Math.round(draftCost))}</span></>}
                          </span>
                        )}
                      </div>
                      {technicalIngredients.length ? (
                        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                          {technicalIngredients.map((ingredient, index) => {
                            const supply = supplyOf(ingredient.name)
                            return (
                              <div
                                key={`${ingredient.name}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5rem_auto] items-center gap-2 border-b px-3 py-2 last:border-b-0"
                                style={{ borderColor: t.border }}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm" style={{ color: t.text }}>{ingredient.name}</span>
                                  <span className="block text-[10px]" style={{ color: t.muted }}>
                                    {fmt(Number(supply?.[3] || 0))} / {String(supply?.[2] ?? ingredient.unit)}
                                  </span>
                                </span>
                                <input
                                  aria-label={`Cantidad de ${ingredient.name}`}
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  value={ingredient.quantity}
                                  onChange={(event) => updateIngredient(index, { quantity: Number(event.target.value) })}
                                  className="w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                                  style={controlSt}
                                />
                                <select
                                  aria-label={`Unidad de ${ingredient.name}`}
                                  value={ingredient.unit}
                                  onChange={(event) => updateIngredient(index, { unit: event.target.value })}
                                  className="w-full cursor-pointer rounded-lg px-1.5 py-1.5 text-sm outline-none"
                                  style={controlSt}
                                >
                                  {convertibleUnits(String(supply?.[2] ?? ingredient.unit)).map((unit) => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                                <span className="text-right text-sm" style={{ color: t.text }}>{fmt(Math.round(costOf(ingredient)))}</span>
                                <button
                                  type="button"
                                  onClick={() => setTechnicalIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                  style={{ background: `${C.red}10`, color: C.red }}
                                  aria-label={`Quitar ${ingredient.name}`}
                                >
                                  {Ico.x}
                                </button>
                              </div>
                            )
                          })}
                          <div className="flex items-center justify-between px-3 py-2.5 text-sm" style={{ background: `${C.mustard}0d` }}>
                            <span style={{ color: t.muted }}>Costo de los insumos por unidad</span>
                            <span className="font-semibold" style={{ color: C.mustard }}>{fmt(Math.round(totalCost))}</span>
                          </div>
                        </div>
                      ) : null}
                      {technicalIngredients.length > 0 ? (
                        renderProfit(Number(formData["2"] || 0), totalCost)
                      ) : (
                        <div className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.input, color: t.muted }}>
                          Todavía no hay insumos en esta ficha.
                        </div>
                      )}
                    </section>
                    <section className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: t.border }}>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                          Cómo se prepara
                        </h4>
                        <p className="text-[11px]" style={{ color: t.muted }}>Pasos en orden, del primero al último.</p>
                      </div>
                      {technicalSteps.length > 0 && (
                        <ol className="flex flex-col gap-1.5">
                          {technicalSteps.map((step, index) => {
                            const editing = technicalStepEdit?.index === index
                            return (
                              <li key={`${index}-${step}`} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: t.cardAlt }}>
                                <span
                                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                                  style={{ background: `${C.mustard}18`, color: C.mustard }}
                                >
                                  {index + 1}
                                </span>
                                {editing ? (
                                  <>
                                    <input
                                      autoFocus
                                      aria-label={`Editar paso ${index + 1}`}
                                      value={technicalStepEdit.text}
                                      onChange={(event) => setTechnicalStepEdit({ index, text: event.target.value })}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault()
                                          saveStepEdit()
                                        }
                                        if (event.key === "Escape") setTechnicalStepEdit(null)
                                      }}
                                      className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-sm outline-none"
                                      style={controlSt}
                                    />
                                    <button
                                      type="button"
                                      title="Guardar paso"
                                      aria-label={`Guardar paso ${index + 1}`}
                                      disabled={!technicalStepEdit.text.trim()}
                                      onClick={saveStepEdit}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md disabled:opacity-40"
                                      style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                                    >
                                      {Ico.check}
                                    </button>
                                    <button
                                      type="button"
                                      title="Cancelar"
                                      aria-label="Cancelar edición"
                                      onClick={() => setTechnicalStepEdit(null)}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
                                      style={{ background: t.input, color: t.muted }}
                                    >
                                      {Ico.x}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="min-w-0 flex-1 break-words text-sm" style={{ color: t.text }}>{step}</span>
                                    <button
                                      type="button"
                                      title="Editar paso"
                                      aria-label={`Editar paso ${index + 1}`}
                                      onClick={() => setTechnicalStepEdit({ index, text: step })}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
                                      style={{ color: C.mustard, background: `${C.mustard}14` }}
                                    >
                                      {Ico.edit}
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Mover paso ${index + 1} arriba`}
                                      title="Mover arriba"
                                      disabled={index === 0}
                                      onClick={() => setTechnicalSteps((current) => {
                                        const next = [...current]
                                        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                                        return next
                                      })}
                                      className="h-7 w-7 cursor-pointer rounded-md text-sm disabled:cursor-default disabled:opacity-30"
                                      style={{ background: t.input, color: t.text }}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Mover paso ${index + 1} abajo`}
                                      title="Mover abajo"
                                      disabled={index === technicalSteps.length - 1}
                                      onClick={() => setTechnicalSteps((current) => {
                                        const next = [...current]
                                        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                                        return next
                                      })}
                                      className="h-7 w-7 cursor-pointer rounded-md text-sm disabled:cursor-default disabled:opacity-30"
                                      style={{ background: t.input, color: t.text }}
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Quitar paso ${index + 1}`}
                                      title="Quitar paso"
                                      onClick={() => {
                                        setTechnicalSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))
                                        setTechnicalStepEdit(null)
                                      }}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
                                      style={{ background: `${C.red}10`, color: C.red }}
                                    >
                                      {Ico.trash}
                                    </button>
                                  </>
                                )}
                              </li>
                            )
                          })}
                        </ol>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          aria-label="Nuevo paso de preparación"
                          placeholder={`Paso ${technicalSteps.length + 1}: escribe una acción...`}
                          value={technicalStepDraft}
                          onChange={(event) => setTechnicalStepDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              addStep()
                            }
                          }}
                          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                          style={controlSt}
                        />
                        <button
                          type="button"
                          onClick={addStep}
                          disabled={!technicalStepDraft.trim()}
                          className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-default disabled:opacity-50"
                          style={{ background: C.mustard, color: "#fff" }}
                        >
                          {Ico.plus} Agregar paso
                        </button>
                      </div>
                    </section>
                  </>
                )
              })()}
              {technicalSheetError && <p className="text-xs font-medium" style={{ color: C.red }} role="alert">{technicalSheetError}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${t.border}` }}>
              <button type="button" onClick={() => setTechnicalSheetOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer" style={{ background: t.input, color: t.muted }}>Cancelar</button>
              <button
                type="button"
                onClick={() => {
                  // A step still being edited or typed is kept too
                  const steps = [
                    ...technicalSteps.map((step, index) =>
                      technicalStepEdit?.index === index && technicalStepEdit.text.trim() ? technicalStepEdit.text.trim() : step,
                    ),
                    ...(technicalStepDraft.trim() ? [technicalStepDraft.trim()] : []),
                  ]
                  setTechnicalStepEdit(null)
                  setTechnicalSteps(steps)
                  const recipe = JSON.stringify(technicalIngredients)
                  setFormData((current) => ({
                    ...current,
                    "5": `Ficha técnica - ${current["0"] || "Producto"}`,
                    "7": technicalIngredients.map((ingredient) => ingredient.name).join(", "),
                    "8": JSON.stringify(steps),
                    "9": recipe,
                  }))
                  setTechnicalStepDraft("")
                  setTechnicalSheetOpen(false)
                  setTechnicalSheetError("")
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Guardar ficha
              </button>
            </div>
          </div>
        </div>
      )}
      {isPurchase && lossDraft && (() => {
        const motivos =
          MOD_CFG.perdidas.fields.find((field) => field.key === "2")?.options ?? []
        const updateLoss = (patch: Partial<typeof lossDraft>) => {
          setLossError("")
          setLossDraft((current) => (current ? { ...current, ...patch } : current))
        }
        const confirmLoss = () => {
          const qty = toDecimal(lossDraft.qty)
          if (!(qty > 0)) return setLossError("Escribe cuánto se perdió.")
          if (qty > lossDraft.max)
            return setLossError(
              `No puede ser más de lo comprado: máximo ${lossDraft.max.toLocaleString("es-CO")} ${lossDraft.unit}.`,
            )
          if (!lossDraft.motivo) return setLossError("Selecciona el motivo de la pérdida.")
          if (!lossDraft.responsable.trim()) return setLossError("Selecciona quién es el responsable.")
          if (!lossDraft.fecha) return setLossError("Selecciona la fecha.")
          if (lossDraft.fecha > getCurrentDateTimeParts().date)
            return setLossError("La fecha de la pérdida no puede ser posterior a hoy.")
          const lossRow: Row = [
            lossDraft.insumo,
            `${qty} ${lossDraft.unit}`,
            lossDraft.motivo,
            lossDraft.responsable.trim(),
            lossDraft.fecha,
            lossDraft.origin,
            "", "", "", "", // estado, devolución, cantidad devuelta, id (the backend fills them)
            lossDraft.purchaseId,
          ]
          setRows((current) => ({ ...current, perdidas: [lossRow, ...(current.perdidas || [])] }))
          syncRow("perdidas", lossRow, true)
          setPurchaseNotice(
            `Se envió a Pérdida de insumos: ${qty.toLocaleString("es-CO")} ${lossDraft.unit} de «${lossDraft.insumo}» (${lossDraft.motivo}).`,
          )
          setLossDraft(null)
          setLossError("")
        }
        const controlSt = { background: t.input, border: `1.5px solid ${t.inputB}`, color: t.text }
        // Active staff (any role but Cliente); the current value stays even if it isn't one of them
        const staff = (rows.usuarios || [])
          .filter((u) => isStaffRole(u[3]) && isActiveStatus(u[5]) && String(u[0] ?? "").trim())
          .map((u) => ({ name: String(u[0]).trim(), rol: String(u[3]) }))
        if (lossDraft.responsable && !staff.some((p) => p.name === lossDraft.responsable))
          staff.unshift({ name: lossDraft.responsable, rol: "" })
        const fieldLabel = "flex min-w-0 flex-col gap-1.5 text-xs font-medium"
        return (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="loss-dialog-title"
              className="w-full max-w-md overflow-hidden rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${C.red}14`, color: C.red }}
                >
                  {Ico.alert}
                </span>
                <div className="min-w-0">
                  <h3 id="loss-dialog-title" className="text-base font-semibold" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
                    Enviar a pérdida de insumos
                  </h3>
                  <p className="text-xs" style={{ color: t.muted }}>Lo que se pierda se descuenta del stock.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 px-6 py-5">
                <div className="rounded-xl px-4 py-3" style={{ background: t.cardAlt }}>
                  <div className="text-sm" style={{ color: t.text }}>{lossDraft.insumo}</div>
                  <div className="text-xs" style={{ color: t.muted }}>{lossDraft.origin}</div>
                </div>
                <label className={fieldLabel} style={{ color: t.muted }}>
                  Cantidad perdida
                  <div
                    className="flex items-center gap-2 rounded-xl px-3"
                    style={controlSt}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={lossDraft.qty}
                      onChange={(e) => updateLoss({ qty: e.target.value })}
                      placeholder="0"
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                      style={{ color: t.text }}
                    />
                    <span className="text-xs" style={{ color: t.muted }}>{lossDraft.unit}</span>
                  </div>
                  <span className="text-[11px] font-normal">
                    Máximo {lossDraft.max.toLocaleString("es-CO")} {lossDraft.unit} (lo comprado que aún no se ha perdido)
                  </span>
                </label>
                <label className={fieldLabel} style={{ color: t.muted }}>
                  Motivo
                  <select
                    value={lossDraft.motivo}
                    onChange={(e) => updateLoss({ motivo: e.target.value })}
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ ...controlSt, color: lossDraft.motivo ? t.text : t.muted }}
                  >
                    <option value="">Selecciona el motivo...</option>
                    {motivos.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <label className={fieldLabel} style={{ color: t.muted }}>
                    Persona responsable
                    <select
                      value={lossDraft.responsable}
                      onChange={(e) => updateLoss({ responsable: e.target.value })}
                      className="min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ ...controlSt, color: lossDraft.responsable ? t.text : t.muted }}
                    >
                      <option value="">Selecciona quién...</option>
                      {staff.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}{p.rol && ` · ${p.rol}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={fieldLabel} style={{ color: t.muted }}>
                    Fecha
                    <input
                      type="date"
                      value={lossDraft.fecha}
                      max={getCurrentDateTimeParts().date}
                      onChange={(e) => {
                        const today = getCurrentDateTimeParts().date
                        updateLoss({ fecha: e.target.value > today ? today : e.target.value })
                      }}
                      className="min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={controlSt}
                    />
                  </label>
                </div>
                {lossError && (
                  <p className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: `${C.red}10`, color: C.red }} role="alert">
                    {lossError}
                  </p>
                )}
              </div>
              <div className="flex gap-3 px-6 pt-4 pb-6" style={{ borderTop: `1px solid ${t.border}` }}>
                <button
                  type="button"
                  onClick={() => setLossDraft(null)}
                  className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-semibold"
                  style={{ background: t.input, color: t.muted }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmLoss}
                  className="flex-1 cursor-pointer rounded-xl py-3 text-sm font-bold hover:opacity-90"
                  style={{ background: C.red, color: "#fff" }}
                >
                  Enviar a pérdida
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
