import { isActiveStatus, parseMainSupplies } from "@/features/admin/utils/rows"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import { fmt, splitNames } from "@/shared/utils/format"
import { packOf, qtyLabel, toBaseQuantity } from "@/shared/utils/units"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

// Insumo detail (view), in two columns:
//   left: who it is, its stock against the minimum, what it costs, who sells it (or, made here, how it's sold)
//   right: its ficha técnica when it's made here, then `history` (stock moves and purchases, from CRUDModal)
// Row: [0 nombre, 1 categoría, 2 unidad, 3 costo, 4 stock, 5 mínimo, 6 trae, 7 producto de insumo,
//       8 ficha, 9 versión, 10 insumos principales, 11 preparación, 12 estado, 15 precio, 16 porción, 17 empaque]
export default function SupplyDetail(adminState: AdminPanelState, row: (string | number)[], history?: ReactNode): ReactNode {
  const { canDo, openAdd, rows, setSection, t } = adminState
  const unit = String(row[2] || "und")
  const stock = Number(row[4]) || 0
  const pack = packOf(row)
  const minimum = Number(row[5]) || 0
  const cost = Number(row[3]) || 0
  const active = isActiveStatus(row[12])
  const low = active && stock <= minimum
  const isProductSupply = String(row[7]).toLowerCase() === "sí"
  const status = !active
    ? { text: "Inactivo", color: t.muted }
    : stock <= 0
      ? { text: "Agotado", color: C.red }
      : low
        ? { text: "Bajo el mínimo", color: C.red }
        : { text: "Bien", color: "#2E7D60" }
  // Full bar = twice the minimum; the mark in the middle is the minimum
  const fill = minimum > 0 ? Math.min(100, Math.round((stock / (minimum * 2)) * 100)) : 100
  const suppliers = (rows.proveedores || [])
    .filter((p) => splitNames(p[7]).includes(String(row[0])))
    .map((p) => String(p[0]))
  const recipe = parseMainSupplies(row[10]).map((item) => {
    const supply = (rows.insumos || []).find((i) => String(i[0]) === item.name)
    const base = String(supply?.[2] || "")
    const quantity = Number(item.quantity) || 0
    const itemUnit = item.unit || base
    const inBase = toBaseQuantity(quantity, itemUnit, base, packOf(supply))
    return { ...item, quantity, unit: itemUnit, cost: inBase === null ? null : inBase * (Number(supply?.[3]) || 0) }
  })
  const recipeCost = recipe.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const unpriced = recipe.some((item) => item.cost === null)
  const rawSteps = String(row[11] ?? "")
  // Stored either as text (one step per line) or as a JSON list of steps
  const steps = (() => {
    try {
      const list = JSON.parse(rawSteps)
      if (Array.isArray(list)) return list.map(String)
    } catch { /* plain text */ }
    return rawSteps.split("\n")
  })()
    // "1. Lavar" -> "Lavar" (a quantity like "500 g de azúcar" stays)
    .map((step) => step.replace(/^\s*\d+\s*[.)-]\s*/, "").trim())
    .filter(Boolean)
  // Sold in orders: a free sauce or a charged addition, and what each serving costs and leaves
  const price = Number(row[15]) || 0
  const portion = Number(row[16]) || 0
  const portionCost = portion * cost
  const profit = price - portionCost

  const box = { background: t.input, border: `1px solid ${t.border}` }
  const title = (text: string, extra?: ReactNode) => (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text, fontFamily: "League Spartan, sans-serif" }}>{text}</h4>
      {extra}
    </div>
  )
  const tile = (label: string, value: ReactNode, color: string = t.text, note?: string) => (
    <div key={label} className="min-w-0 rounded-xl px-3.5 py-2.5" style={box}>
      <div className="text-[11px] font-semibold" style={{ color: t.muted }}>{label}</div>
      <div className="mt-0.5 text-sm font-bold break-words tabular-nums" style={{ color }}>{value}</div>
      {note && <div className="text-[11px]" style={{ color: t.muted }}>{note}</div>}
    </div>
  )

  return (
    <div className="grid gap-5 sm:col-span-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ── Left: the insumo and its stock ── */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: `${C.mustard}14`, color: "var(--admin-heading-gold)" }}>
            {isProductSupply ? Ico.chef : Ico.shopping}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold leading-tight break-words" style={{ color: t.text }}>{String(row[0])}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[String(row[1] || "Sin categoría"), `Se mide en ${unit}`].map((label) => (
                <span key={label} className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: t.input, color: t.muted }}>{label}</span>
              ))}
              {isProductSupply && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.mustard}18`, color: "var(--admin-heading-gold)" }}>Lo preparamos nosotros</span>
              )}
            </div>
          </div>
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={active ? { background: "rgba(58,109,94,0.14)", color: "#2E7D60" } : { background: `${C.red}14`, color: C.red }}
          >
            {String(row[12] || "Activo")}
          </span>
        </div>

        {/* Stock against the minimum */}
        <div className="rounded-2xl px-4 py-3.5" style={{ background: low ? `${C.red}08` : t.cardAlt, border: `1px solid ${low ? `${C.red}30` : t.border}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.muted }}>Stock actual</div>
              <div className="mt-0.5 text-3xl font-bold leading-tight tabular-nums" style={{ color: low ? C.red : t.text }}>
                {stock.toLocaleString("es-CO")} <span className="text-base font-semibold" style={{ color: t.muted }}>{unit}</span>
              </div>
              {pack && stock >= pack.size && <div className="text-xs" style={{ color: t.muted }}>{qtyLabel(stock, unit, pack).replace(/\s*\(.*\)$/, "")}</div>}
            </div>
            <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${status.color}18`, color: status.color }}>{status.text}</span>
          </div>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full" style={{ background: t.input }}>
            <div className="h-full rounded-full" style={{ width: `${fill}%`, background: status.color }} />
            {minimum > 0 && <div className="absolute inset-y-0 left-1/2 w-0.5" style={{ background: t.muted }} />}
          </div>
          <div className="mt-1.5 flex justify-between gap-2 text-[11px]" style={{ color: t.muted }}>
            <span>{isProductSupply ? "Sube al preparar · baja al servir y con pérdidas" : "Sube con compras · baja con producción y pérdidas"}</span>
            <span className="flex-shrink-0">mín. {qtyLabel(minimum, unit, pack).replace(/\s*\(.*\)$/, "")}</span>
          </div>
          {low && canDo("compras", "CREAR") && !isProductSupply && (
            <button
              type="button"
              onClick={() => {
                setSection("compras")
                openAdd("compras")
              }}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold hover:opacity-90"
              style={{ background: C.red, color: "#fff" }}
            >
              {Ico.plus} Registrar compra
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {tile(isProductSupply ? "Costo de preparar" : "Costo unitario", cost ? `${fmt(cost)} / ${unit}` : isProductSupply ? "Sin calcular" : "Sin compras", "var(--admin-heading-gold)", isProductSupply ? "por cada " + unit + " preparado" : "de la última compra")}
          {tile("Valor en stock", fmt(Math.round(stock * cost)), t.text, "stock × costo")}
          {!isProductSupply && <div className="col-span-2">{tile("Se compra", pack ? `${pack.kind} de ${pack.size.toLocaleString("es-CO")} ${pack.unit}` : "Suelto")}</div>}
        </div>

        {isProductSupply ? (
          // How it's sold in orders and what each serving leaves
          <div className="rounded-2xl px-4 py-3.5" style={{ background: `${C.mustard}0D`, border: `1px solid ${C.mustard}30` }}>
            {title("Venta en pedidos", <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.mustard}1F`, color: "var(--admin-heading-gold)" }}>{price > 0 ? "Adición con precio" : "Salsa de cortesía"}</span>)}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {[
                ["Precio por porción", price > 0 ? fmt(price) : "Gratis ($0)"],
                ["Porción", portion > 0 ? `${portion.toLocaleString("es-CO")} ${unit}` : "Sin definir"],
                ["Costo por porción", portion > 0 && cost ? fmt(Math.round(portionCost)) : "—"],
                [price > 0 ? "Ganancia por porción" : "Le cuesta al negocio", portion > 0 && cost ? fmt(Math.round(price > 0 ? profit : portionCost)) : "—"],
              ].map(([label, value], i) => (
                <div key={label} className="flex min-w-0 items-baseline justify-between gap-2">
                  <span className="text-xs" style={{ color: t.muted }}>{label}</span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: i === 3 && portion > 0 && cost ? (price > 0 && profit >= 0 ? "#2E7D60" : C.red) : i === 1 && !(portion > 0) ? C.red : t.text }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {title("Proveedores que lo venden")}
            {suppliers.length ? (
              <div className="flex flex-wrap gap-1.5">
                {suppliers.map((name) => (
                  <span key={name} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}>{name}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: t.muted }}>Ningún proveedor lo tiene asignado: se asigna solo al registrar su primera compra.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Right: its recipe (made here) and its history ── */}
      <div className="flex min-w-0 flex-col gap-3">
        {isProductSupply && (
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.mustard}40` }}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ background: `${C.mustard}12` }}>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--admin-heading-gold)" }}>Ficha técnica</div>
                <div className="text-sm font-semibold break-words" style={{ color: t.text }}>{String(row[8] || `Ficha técnica - ${String(row[0])}`)}</div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${C.mustard}22`, color: "var(--admin-heading-gold)" }}>{String(row[9] || "v1.0")}</span>
            </div>
            <div className="grid gap-4 px-4 py-3 xl:grid-cols-2">
              <div className="min-w-0">
                {title("Insumos que usa")}
                {recipe.length ? (
                  <div className="overflow-hidden rounded-lg text-xs" style={{ border: `1px solid ${t.border}` }}>
                    {recipe.map((item, i) => (
                      <div key={item.name} className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-1.5 ${i ? "border-t" : ""}`} style={{ borderColor: t.border }}>
                        <span className="min-w-0 truncate font-semibold" style={{ color: t.text }} title={item.name}>{item.name}</span>
                        <span className="text-right tabular-nums" style={{ color: item.quantity ? t.text : C.red }}>
                          {item.quantity ? `${item.quantity.toLocaleString("es-CO")} ${item.unit}` : "Sin cantidad"}
                        </span>
                        <span className="w-16 text-right tabular-nums" style={{ color: t.muted }} title={item.cost === null ? "Esta unidad no se puede convertir a la de compra" : undefined}>
                          {item.cost ? fmt(item.cost) : "—"}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-2 border-t px-3 py-2 font-bold" style={{ borderColor: t.border, background: t.input }}>
                      <span style={{ color: t.text }}>
                        Costo por preparación
                        {unpriced && <span className="block text-[10px] font-normal" style={{ color: t.muted }}>Sin los insumos en unidades que no se convierten</span>}
                      </span>
                      <span style={{ color: "var(--admin-heading-gold)" }}>{fmt(recipeCost)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: t.muted }}>No tiene insumos en la ficha.</p>
                )}
              </div>
              <div className="min-w-0">
                {title("Cómo se prepara")}
                {steps.length ? (
                  <ol className="flex flex-col gap-1.5">
                    {steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: t.text }}>
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}>
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
        {history}
      </div>
    </div>
  )
}
