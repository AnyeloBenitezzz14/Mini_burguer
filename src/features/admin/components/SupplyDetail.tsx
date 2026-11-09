import { isActiveStatus, parseMainSupplies } from "@/features/admin/utils/rows"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import { fmt, splitNames } from "@/shared/utils/format"
import { packOf, toBaseQuantity } from "@/shared/utils/units"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

// Insumo detail (view): header, stock and cost, suppliers and, if sold as a product, its ficha técnica.
// Row: [0 nombre, 1 categoría, 2 unidad, 3 costo, 4 stock, 5 mínimo, 7 producto de insumo,
//       8 ficha, 9 versión, 10 insumos principales, 11 preparación, 12 estado]
export default function SupplyDetail(adminState: AdminPanelState, row: (string | number)[]): ReactNode {
  const {
    canDo,
    openAdd,
    rows,
    setSection,
    t,
  } = adminState
  const unit = String(row[2] || "und")
  const stock = Number(row[4]) || 0
  const pack = packOf(row)
  const minimum = Number(row[5]) || 0
  const low = stock <= minimum
  const isProductSupply = String(row[7]).toLowerCase() === "sí"
  const suppliers = (rows.proveedores || [])
    .filter((p) => splitNames(p[7]).includes(String(row[0])))
    .map((p) => String(p[0]))
  const recipe = parseMainSupplies(row[10]).map((item) => {
    const supply = (rows.insumos || []).find((i) => String(i[0]) === item.name)
    const base = String(supply?.[2] || "")
    const quantity = Number(item.quantity) || 0
    const unit = item.unit || base
    const inBase = toBaseQuantity(quantity, unit, base, packOf(supply))
    return { ...item, quantity, unit, cost: inBase === null ? null : inBase * (Number(supply?.[3]) || 0) }
  })
  const recipeCost = recipe.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const unpriced = recipe.some((item) => item.cost === null)
  const steps = String(row[11] ?? "")
    .split("\n")
    // "1. Lavar" -> "Lavar" (a quantity like "500 g de azúcar" stays)
    .map((step) => step.replace(/^\s*\d+\s*[.)-]\s*/, "").trim())
    .filter(Boolean)
  const box = { background: t.input, border: `1px solid ${t.border}` }
  const sectionTitle = (text: string) => (
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted, fontFamily: "League Spartan, sans-serif" }}>
      {text}
    </div>
  )
  return (
    <div className="flex flex-col gap-4 sm:col-span-2">
      {/* One header (name, status, category, unit), like the purchase detail */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${C.mustard}14`, color: C.mustard }}
        >
          {Ico.shopping}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold break-words" style={{ color: t.text }}>
            {String(row[0])}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[String(row[1] || "Sin categoría"), `Se mide en ${unit}`].map((label) => (
              <span key={label} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: t.input, color: t.muted }}>
                {label}
              </span>
            ))}
            {isProductSupply && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                Lo preparamos nosotros
              </span>
            )}
          </div>
        </div>
        <span
          className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={
            isActiveStatus(row[12])
              ? { background: "rgba(58,109,94,0.14)", color: "#2E7D60" }
              : { background: `${C.red}14`, color: C.red }
          }
        >
          {String(row[12] || "Activo")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          // "3 paq (90 und)" / "2 paq (200 g)": what the packages hold
          ["Stock actual", `${stock.toLocaleString("es-CO")} ${unit}${unit === "paq" && pack ? ` (${(stock * pack.size).toLocaleString("es-CO")} ${pack.unit})` : ""}`, low ? C.red : t.text],
          ["Stock mínimo", `${minimum.toLocaleString("es-CO")} ${unit}`, t.text],
          ["Costo unitario", Number(row[3]) ? `${fmt(Number(row[3]))} / ${unit}` : "Sin compras", C.mustard],
          ["Valor en stock", fmt(stock * (Number(row[3]) || 0)), t.text],
          ...(unit === "paq" ? [["Contenido por paquete", pack ? `${pack.size.toLocaleString("es-CO")} ${pack.unit}` : "Sin definir", t.text]] : []),
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl px-3 py-2.5" style={box}>
            <div className="text-[10px] font-semibold" style={{ color: t.muted }}>{label}</div>
            <div className="mt-0.5 text-sm font-bold break-words" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      {low && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: `${C.red}12`, color: C.red }}>
          <span>El stock está en el mínimo o por debajo: conviene registrar una compra.</span>
          {canDo("compras", "CREAR") && (
            <button
              type="button"
              onClick={() => {
                setSection("compras")
                openAdd("compras")
              }}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-90"
              style={{ background: C.red, color: "#fff" }}
            >
              {Ico.plus} Registrar compra
            </button>
          )}
        </div>
      )}
      <div>
        {sectionTitle("Proveedores que lo venden")}
        {suppliers.length ? (
          <div className="flex flex-wrap gap-1.5">
            {suppliers.map((name) => (
              <span key={name} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}>
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: t.muted }}>Ningún proveedor lo tiene asignado.</p>
        )}
      </div>
      {isProductSupply && (
        <div className="overflow-hidden rounded-xl" style={{ border: `1.5px solid ${C.mustard}55` }}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3" style={{ background: `${C.mustard}12` }}>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.mustard }}>Ficha técnica</div>
              <div className="text-sm font-semibold break-words" style={{ color: t.text }}>
                {String(row[8] || `Ficha técnica - ${String(row[0])}`)}
              </div>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: `${C.mustard}22`, color: C.mustard }}>
              {String(row[9] || "v1.0")}
            </span>
          </div>
          <div className="px-4 py-3">
            {sectionTitle("Insumos que usa")}
            {recipe.length ? (
              <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${t.border}` }}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-3 py-2 text-[10px] font-bold uppercase" style={{ background: t.input, color: t.muted }}>
                  <span>Insumo</span>
                  <span className="text-right">Cantidad</span>
                  <span className="w-20 text-right">Costo</span>
                </div>
                {recipe.map((item) => (
                  <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t px-3 py-2 text-xs" style={{ borderColor: t.border }}>
                    <span className="min-w-0 font-semibold break-words" style={{ color: t.text }}>{item.name}</span>
                    <span className="text-right" style={{ color: item.quantity ? t.text : C.red }}>
                      {item.quantity ? `${item.quantity.toLocaleString("es-CO")} ${item.unit}` : "Sin cantidad"}
                    </span>
                    <span
                      className="w-20 text-right"
                      style={{ color: t.muted }}
                      title={item.cost === null ? "Esta unidad no se puede convertir a la de compra" : undefined}
                    >
                      {item.cost ? fmt(item.cost) : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t px-3 py-2 text-xs font-bold" style={{ borderColor: t.border, background: t.input }}>
                  <span style={{ color: t.text }}>
                    Costo estimado por preparación
                    {unpriced && <span className="block text-[10px] font-normal" style={{ color: t.muted }}>Sin contar los insumos en unidades que no se pueden convertir</span>}
                  </span>
                  <span style={{ color: C.mustard }}>{fmt(recipeCost)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: t.muted }}>No tiene insumos en la ficha.</p>
            )}
            <div className="mt-4">
              {sectionTitle("Cómo se prepara")}
              {steps.length ? (
                <ol className="flex flex-col gap-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed" style={{ color: t.text }}>
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 break-words">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs" style={{ color: t.muted }}>Sin pasos registrados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
