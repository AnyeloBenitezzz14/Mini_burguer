import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { PncEntry } from "@/features/admin/hooks/useAdminPanel"
import type { ReactNode } from "react"

export default function ProductionPncModal(adminState: AdminPanelState): ReactNode {
  const {
    PNC_UNITS,
    getNonconformingProductOptions,
    getProductRecipe,
    getProductionOrderItems,
    parsePncEntries,
    pncError,
    pncFieldErrors,
    pncForm,
    pncSaving,
    pncTarget,
    rows,
    saveProductionPnc,
    setPncError,
    setPncFieldErrors,
    setPncForm,
    setPncTarget,
    t,
  } = adminState
  if (pncTarget === null) return null
  const orderItems = getProductionOrderItems(rows.produccion?.[pncTarget ?? -1] ?? undefined)
  const productOptions = orderItems.length
    ? orderItems.map((item) => item.name)
    : getNonconformingProductOptions()
  const controlStyle = {
    background: t.input,
    border: `1px solid ${t.inputB}`,
    color: t.text,
    fontFamily: "DM Sans, sans-serif",
  }
  const updatePncField = (key: string, value: string) => {
    setPncForm((current) => ({ ...current, [key]: value }))
    setPncFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setPncError("")
  }
  const pncStyle = (key: string) => ({
    ...controlStyle,
    border: `1px solid ${pncFieldErrors[key] ? C.red : t.inputB}`,
  })
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center px-3 pb-3 pt-8 sm:items-center sm:px-4 sm:pb-4"
      style={{ background: "rgba(18,16,14,0.68)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-3xl"
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          fontFamily: "DM Sans, sans-serif",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.red}14`, color: C.red }}>
            {Ico.alert}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>
              Producto no conforme · {pncForm["0"]}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: t.muted }}>
              Registra lo que se dañó; se crea una nueva orden para rehacerlo.
            </p>
          </div>
          <button type="button" onClick={() => setPncTarget(null)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl" style={{ background: t.input, color: t.muted }}>
            {Ico.x}
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6" style={{ scrollbarWidth: "thin" }}>
          {(() => {
            // Order products (same product in two lines = one choice with the total)
            const totals = new Map<string, number>()
            ;(orderItems.some((item) => !item.parentId) ? orderItems.filter((item) => !item.parentId) : productOptions.map((name) => ({ name, quantity: 1 })))
              .forEach((item) => totals.set(item.name, (totals.get(item.name) ?? 0) + (Number(item.quantity) || 1)))
            const productChoices = [...totals].map(([name, quantity]) => ({ name, quantity }))
            const entries = parsePncEntries(pncForm.entries)
            const product = String(pncForm["1"] ?? "")
            const listedWhole = (name: string, except = -1) =>
              entries
                .filter((entry, i) => i !== except && entry.product === name && entry.whole && (entry.unit || "und") === "und")
                .reduce((sum, entry) => sum + entry.quantity, 0)
            const orderQty = (name: string) => productChoices.find((item) => item.name === name)?.quantity ?? 1
            const maxQty = Math.max(0, orderQty(product) - listedWhole(product))
            const recipe = getProductRecipe(rows.producto?.find((row) => row[0] === product))
            // Insumos of this product not yet on the list
            const partOptions = recipe.filter(
              (ingredient) => !entries.some((entry) => entry.product === product && entry.parts.some((part) => part.name === ingredient.name)),
            )
            const editIndex = pncForm.pEdit === undefined || pncForm.pEdit === "" ? -1 : Number(pncForm.pEdit)
            const setEntries = (next: PncEntry[], patch: Record<string, string> = {}) => {
              setPncForm((current) => ({ ...current, entries: JSON.stringify(next), pEdit: "", ...patch }))
              setPncFieldErrors({})
              setPncError("")
            }
            const addWhole = () => {
              const qty = Number(pncForm["3"])
              const unit = pncForm.wUnit || "und"
              if (!product) return setPncError("Elige el producto que se dañó.")
              if (!(qty > 0)) return setPncError("Escribe cuántos se dañaron.")
              // The order counts products in units; other measures (tajadas, g...) aren't capped
              if (unit === "und" && qty > maxQty) return setPncError(`Del pedido solo quedan ${maxQty} «${product}» por registrar.`)
              const existing = entries.findIndex((entry) => entry.product === product && entry.whole && (entry.unit || "und") === unit)
              setEntries(
                existing >= 0
                  ? entries.map((entry, i) => (i === existing ? { ...entry, quantity: entry.quantity + qty } : entry))
                  : [...entries, { product, whole: true, quantity: qty, unit, parts: [] }],
                { "3": "1", wUnit: "und" },
              )
            }
            const addPart = () => {
              const ingredient = recipe.find((item) => item.name === pncForm.pIns)
              const qty = Number(pncForm.pQty)
              if (!ingredient) return setPncError("Elige el insumo que se dañó.")
              if (!(qty > 0)) return setPncError("Escribe cuánto se dañó.")
              setEntries([...entries, { product, whole: false, quantity: 1, parts: [{ name: ingredient.name, quantity: qty, unit: ingredient.unit }] }], { pIns: "", pQty: "" })
            }
            const saveEdit = (index: number) => {
              const qty = Number(pncForm.pEditQty)
              const entry = entries[index]
              if (!(qty > 0)) return setPncError("La cantidad debe ser mayor que 0.")
              if (entry.whole && (entry.unit || "und") === "und" && qty > orderQty(entry.product) - listedWhole(entry.product, index))
                return setPncError(`Del pedido solo hay ${orderQty(entry.product)} «${entry.product}».`)
              setEntries(entries.map((item, i) =>
                i !== index ? item : item.whole ? { ...item, quantity: qty } : { ...item, parts: item.parts.map((part) => ({ ...part, quantity: qty })) },
              ))
            }
            const sectionTitle = (title: string, color: string = C.mustard) => (
              <div className="mb-3 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full" style={{ background: color }} />
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>{title}</h4>
              </div>
            )
            const fieldLabel = "flex min-w-0 flex-col gap-1.5 text-xs font-medium"
            const addButton = (label: string, onClick: () => void, disabled = false) => (
              <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="flex cursor-pointer items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold disabled:cursor-default disabled:opacity-40"
                style={{ background: C.mustard, color: "#fff" }}
              >
                {Ico.plus} {label}
              </button>
            )
            return (
              <>
                <section className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`${fieldLabel} sm:col-span-2`} style={{ color: t.muted }}>
                    Producto dañado
                    <select
                      value={product}
                      onChange={(event) => {
                        setPncForm((current) => ({ ...current, "1": event.target.value, "3": "1", pIns: "", pQty: "" }))
                        setPncError("")
                      }}
                      className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={controlStyle}
                    >
                      <option value="">Selecciona...</option>
                      {productChoices.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}{item.quantity > 1 ? ` (×${item.quantity} en el pedido)` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                    <label className={fieldLabel} style={{ color: t.muted }}>
                      Motivo
                      <select value={pncForm["4"] || "Producto perdido"} onChange={(event) => updatePncField("4", event.target.value)} aria-invalid={!!pncFieldErrors["4"]} className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("4")}>
                        {["Tiempo superado", "Error en preparación", "Ingrediente incorrecto", "Daño físico", "Producto perdido", "Otro"].map((reason) => <option key={reason}>{reason}</option>)}
                      </select>
                      {pncFieldErrors["4"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["4"]}</span>}
                    </label>
                  </div>

                  {product && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium" style={{ color: t.muted }}>Agrega lo que se dañó de «{product}»</span>
                      <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                        <div className="grid items-end gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
                          <span className="self-center text-sm" style={{ color: t.text }}>
                            Todo el producto
                            <span className="block text-[11px]" style={{ color: t.muted }}>Quedan {maxQty} und por registrar</span>
                          </span>
                          <div className="flex min-w-0 flex-col gap-1 text-[11px]" style={{ color: t.muted }}>
                            <span id="pnc-whole-label">Cantidad y medida</span>
                            <div className="flex items-center overflow-hidden rounded-xl" style={controlStyle}>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                aria-labelledby="pnc-whole-label"
                                value={pncForm["3"] || ""}
                                onChange={(event) => updatePncField("3", event.target.value)}
                                className="w-16 min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                                style={{ color: t.text }}
                              />
                              <select
                                aria-label="Medida"
                                value={pncForm.wUnit || "und"}
                                onChange={(event) => setPncForm((current) => ({ ...current, wUnit: event.target.value }))}
                                className="cursor-pointer border-l bg-transparent px-2 py-2.5 text-sm outline-none"
                                style={{ color: t.text, borderColor: t.inputB }}
                              >
                                {PNC_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                              </select>
                            </div>
                          </div>
                          {addButton("Agregar", addWhole, maxQty === 0 && (pncForm.wUnit || "und") === "und")}
                        </div>
                        {/* Only products with a ficha técnica have insumos to pick (an addition like a huevo doesn't) */}
                        {recipe.length > 0 && (
                        <div className="grid items-center gap-2 border-t px-3 py-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto]" style={{ borderColor: t.border }}>
                            <>
                              <select
                                aria-label="Insumo dañado"
                                value={pncForm.pIns || ""}
                                onChange={(event) => {
                                  const ingredient = recipe.find((item) => item.name === event.target.value)
                                  setPncForm((current) => ({ ...current, pIns: event.target.value, pQty: ingredient ? String(ingredient.quantity) : "" }))
                                  setPncError("")
                                }}
                                className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                                style={{ ...controlStyle, color: pncForm.pIns ? t.text : t.muted }}
                              >
                                <option value="">Un insumo (ej. el queso)...</option>
                                {partOptions.map((ingredient) => (
                                  <option key={ingredient.name} value={ingredient.name}>{ingredient.name}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1.5 rounded-xl px-3" style={controlStyle}>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  aria-label="Cantidad del insumo dañado"
                                  value={pncForm.pQty || ""}
                                  onChange={(event) => setPncForm((current) => ({ ...current, pQty: event.target.value }))}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault()
                                      addPart()
                                    }
                                  }}
                                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                                  style={{ color: t.text }}
                                />
                                <span className="text-[11px]" style={{ color: t.muted }}>
                                  {recipe.find((item) => item.name === pncForm.pIns)?.unit ?? ""}
                                </span>
                              </div>
                              {addButton("Agregar", addPart, !pncForm.pIns)}
                            </>
                        </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium" style={{ color: pncFieldErrors.items ? C.red : t.muted }}>
                      Lo que se dañó ({entries.length})
                    </span>
                    {entries.length ? (
                      <div className="max-h-52 overflow-y-auto rounded-xl" style={{ border: `1px solid ${t.border}`, scrollbarWidth: "thin" }}>
                        {entries.map((entry, index) => {
                          const part = entry.parts[0]
                          return (
                            <div
                              key={`${entry.product}-${part?.name ?? "todo"}-${index}`}
                              className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                              style={{ borderColor: t.border }}
                            >
                              <span
                                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={entry.whole ? { background: `${C.red}12`, color: C.red } : { background: `${C.amber}18`, color: C.amber }}
                              >
                                {entry.whole ? "Producto" : "Insumo"}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm" style={{ color: t.text }}>{entry.whole ? entry.product : part?.name}</span>
                                {!entry.whole && (
                                  <span className="block truncate text-[11px]" style={{ color: t.muted }}>de {entry.product}</span>
                                )}
                              </span>
                              {editIndex === index ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    autoFocus
                                    aria-label="Nueva cantidad"
                                    value={pncForm.pEditQty ?? ""}
                                    onChange={(event) => setPncForm((current) => ({ ...current, pEditQty: event.target.value }))}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault()
                                        saveEdit(index)
                                      }
                                    }}
                                    className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none"
                                    style={controlStyle}
                                  />
                                  <span className="text-xs" style={{ color: t.muted }}>{entry.whole ? entry.unit || "und" : part?.unit}</span>
                                  <button
                                    type="button"
                                    title="Guardar"
                                    aria-label="Guardar cantidad"
                                    onClick={() => saveEdit(index)}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                    style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                                  >
                                    {Ico.check}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm" style={{ color: t.muted }}>
                                    {entry.whole
                                      ? `${entry.quantity.toLocaleString("es-CO")} ${entry.unit || "und"}`
                                      : `${(part?.quantity ?? 0).toLocaleString("es-CO")} ${part?.unit ?? ""}`}
                                  </span>
                                  <button
                                    type="button"
                                    title="Editar cantidad"
                                    aria-label="Editar cantidad"
                                    onClick={() => setPncForm((current) => ({
                                      ...current,
                                      pEdit: String(index),
                                      pEditQty: String(entry.whole ? entry.quantity : part?.quantity ?? ""),
                                    }))}
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
                                aria-label="Quitar de la lista"
                                onClick={() => setEntries(entries.filter((_, i) => i !== index))}
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
                      <p
                        className="rounded-xl px-3 py-3 text-center text-xs"
                        style={{ border: `1.5px dashed ${pncFieldErrors.items ? C.red : t.inputB}`, color: pncFieldErrors.items ? C.red : t.muted }}
                      >
                        {pncFieldErrors.items || "Aquí aparece cada producto o insumo dañado que agregues."}
                      </p>
                    )}
                  </div>
                </section>

              </>
            )
          })()}

          {pncError && (
            <div role="alert" className="rounded-xl px-3 py-2.5 text-xs font-medium" style={{ background: `${C.red}10`, color: C.red }}>
              {pncError}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:justify-end sm:px-6" style={{ borderTop: `1px solid ${t.border}` }}>
          <button type="button" disabled={pncSaving} onClick={() => setPncTarget(null)} className="rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:cursor-default disabled:opacity-50" style={{ background: t.input, color: t.muted }}>
            Cancelar
          </button>
          <button type="button" onClick={saveProductionPnc} className="rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer" style={{ background: C.red, color: "#fff", fontFamily: "League Spartan, sans-serif" }}>
            Registrar y reiniciar orden
          </button>
        </div>
      </div>
    </div>
  )
}
