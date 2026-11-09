import { isFutureDashAnchor, shiftDashAnchor } from "@/features/admin/utils/dashboard"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import { MONTHS_SHORT, toIsoDate } from "@/shared/utils/format"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function Dashboard(adminState: AdminPanelState): ReactNode {
  const {
    ALERTS,
    MY_MODULES,
    PENDING,
    openPending,
    prevPeriodLabel,
    RETURN_REASONS,
    TOP,
    chart,
    chartAnchor,
    chartFilter,
    dashboardIntroDone,
    markNotificationRead,
    money,
    period,
    periodSales,
    seesProduction,
    seesReturns,
    seesSales,
    setChartAnchor,
    setChartFilter,
    setSection,
    shownKPI,
    t,
    totals,
    user,
  } = adminState
return (
  <div className="admin-dashboard min-w-0 space-y-5">
    <div className={`admin-dashboard-hero flex flex-wrap items-center justify-between gap-4 ${dashboardIntroDone ? "" : "admin-dashboard-hero-enter"}`}>
      <div className="relative z-10">
        <span className="admin-dashboard-eyebrow">Panel de control</span>
        <h2 className="mt-2 font-bold text-2xl sm:text-3xl" style={{ color: t.text }}>
          ¡Hola, {user?.name?.split(" ")[0] ?? "Admin"}!
        </h2>
        <p className="mt-1 text-sm" style={{ color: t.muted }}>
          {seesSales ? "Aquí tienes el resumen de tu negocio." : "Aquí tienes el resumen de tus módulos."}
        </p>
      </div>
      <div className="admin-dashboard-date relative z-10">
        <span className="admin-dashboard-date-dot" />
        <p className="text-sm font-semibold capitalize" style={{ color: t.text }}>
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>

    {/* What needs attention now, before any total */}
    <section aria-label="Necesita tu atención" className="admin-dashboard-card min-w-0 rounded-2xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
      <div className="mb-3 text-sm font-semibold" style={{ color: t.text }}>
        {PENDING.length ? "Necesita tu atención" : "Todo al día"}
      </div>
      {PENDING.length ? (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {PENDING.map((p) => (
            <button
              key={p.one}
              type="button"
              onClick={() => openPending(p)}
              className="group flex min-w-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
              style={{ background: `${C.mustard}12`, border: `1px solid ${C.mustard}33` }}
            >
              <span className="font-black text-2xl tabular-nums" style={{ fontFamily: "League Spartan, sans-serif", color: C.mustard }}>
                {p.count}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-snug" style={{ color: t.text }}>
                {p.count === 1 ? p.one : p.many}
              </span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" style={{ color: C.mustard }}>→</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: t.muted }}>
          No hay pedidos por confirmar, pagos por verificar, órdenes esperando ni insumos bajo el mínimo.
        </p>
      )}
    </section>

    {/* Roles without Ventas: their own modules */}
    {!seesSales && (
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MY_MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSection(m.key)}
            className="admin-dashboard-card min-w-0 cursor-pointer rounded-2xl p-5 text-left"
            style={{ background: t.card, border: `1px solid ${t.border}` }}
          >
            <div className="text-sm font-semibold" style={{ color: t.muted }}>{m.label}</div>
            <div className="mt-1 font-black text-2xl sm:text-3xl" style={{ fontFamily: "League Spartan, sans-serif", color: t.text }}>
              {m.pending ?? m.total}
            </div>
            <div className="text-xs mt-1" style={{ color: m.pending ? C.mustard : t.muted }}>
              {m.pending === null ? (m.total === 1 ? "registro" : "registros") : `en curso · ${m.total} en total`}
            </div>
          </button>
        ))}
      </div>
    )}

    {/* KPI */}
    {shownKPI.length > 0 && (
    <div className={`grid min-w-0 grid-cols-1 gap-4 ${shownKPI.length > 1 ? "sm:grid-cols-3" : ""}`}>
      {shownKPI.map(({ icon, label, val, badge, good }) => (
        <div
          key={label}
          className="admin-dashboard-card min-w-0 rounded-2xl p-5"
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
                className="admin-dashboard-icon w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${label === "Devoluciones" ? C.red : label === "N.º de ventas" ? C.forest : C.mustard}18`,
                  color: label === "Devoluciones" ? C.red : label === "N.º de ventas" ? C.forest : C.mustard,
                }}
            >
              {icon}
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: good
                  ? "rgba(58,109,94,0.15)"
                  : "rgba(165,65,49,0.12)",
                color: good ? "#2E7D60" : C.red,
              }}
            >
              {badge}
            </span>
          </div>
          <div
            className="break-words font-black text-2xl sm:text-3xl"
            style={{ fontFamily: "League Spartan, sans-serif", color: t.text }}
          >
            {val}
          </div>
          <div className="text-sm mt-1" style={{ color: t.muted }}>
            {label}
          </div>
          {badge !== "—" && badge !== "Nuevo" && (
            <div className="mt-0.5 text-xs" style={{ color: t.subtle }}>
              {badge} vs {prevPeriodLabel}
            </div>
          )}
        </div>
      ))}
    </div>
    )}

    {/* Charts row */}
    {seesSales && (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      {/* Sales vs Losses */}
      <div
        className="admin-dashboard-card min-w-0 rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-sm" style={{ color: t.text }}>
              Ventas vs Pérdidas
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: "#F2C230" }}
                />
                <span className="text-xs" style={{ color: t.muted }}>
                  Ventas
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: C.red }}
                />
                <span className="text-xs" style={{ color: t.muted }}>
                  Pérdidas
                </span>
              </div>
            </div>
          </div>
          <div className="flex max-w-full flex-col items-end gap-2">
            <div
              className="flex max-w-full flex-wrap gap-1 rounded-xl p-1 shadow-sm"
              style={{ background: t.input, border: `1px solid ${t.border}` }}
            >
              {([["hoy", "Día"], ["semana", "Semana"], ["mes", "Mes"], ["año", "Año"]] as const).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  style={{
                    background: chartFilter === f ? "#F2C230" : "transparent",
                    color: chartFilter === f ? "#36393F" : t.muted,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Which day / week / month / year */}
            <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setChartAnchor(shiftDashAnchor(chartFilter, chartAnchor, -1))}
                aria-label="Periodo anterior"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base font-bold transition-colors"
                style={{ background: t.input, color: t.muted, border: `1px solid ${t.border}` }}
              >
                ‹
              </button>
              {(chartFilter === "hoy" || chartFilter === "semana") && (
                <input
                  type="date"
                  value={toIsoDate(chartAnchor)}
                  max={toIsoDate(new Date())}
                  onClick={(e) => {
                    const input = e.currentTarget
                    if (typeof input.showPicker === "function") input.showPicker()
                  }}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const selected = new Date(`${e.target.value}T00:00:00`)
                    setChartAnchor(isFutureDashAnchor("hoy", selected) ? new Date() : selected)
                  }}
                  aria-label={chartFilter === "hoy" ? "Elegir día" : "Elegir un día de la semana"}
                  className="h-9 w-40 cursor-pointer rounded-lg px-2.5 text-sm font-medium outline-none transition-colors"
                  style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
                />
              )}
              {chartFilter === "mes" && (
                <select
                  value={chartAnchor.getMonth()}
                  onChange={(e) => setChartAnchor(new Date(chartAnchor.getFullYear(), Number(e.target.value), 1))}
                  aria-label="Elegir mes"
                  className="h-9 cursor-pointer rounded-lg px-3 text-sm outline-none"
                  style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
                >
                  {MONTHS_SHORT.map((m, i) => (
                    <option
                      key={m}
                      value={i}
                      disabled={
                        chartAnchor.getFullYear() === new Date().getFullYear() &&
                        i > new Date().getMonth()
                      }
                    >
                      {new Date(2000, i, 1).toLocaleDateString("es-CO", { month: "long" })}
                    </option>
                  ))}
                </select>
              )}
              {(chartFilter === "mes" || chartFilter === "año") && (
                <select
                  value={chartAnchor.getFullYear()}
                  onChange={(e) => setChartAnchor(new Date(Number(e.target.value), chartFilter === "mes" ? chartAnchor.getMonth() : 0, 1))}
                  aria-label="Elegir año"
                  className="h-9 cursor-pointer rounded-lg px-3 text-sm outline-none"
                  style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
                >
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setChartAnchor(shiftDashAnchor(chartFilter, chartAnchor, 1))}
                disabled={isFutureDashAnchor(chartFilter, shiftDashAnchor(chartFilter, chartAnchor, 1))}
                aria-label="Periodo siguiente"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: t.input, color: t.muted, border: `1px solid ${t.border}` }}
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setChartAnchor(new Date())}
                className="h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors"
                style={{ background: "#FFF4CE", color: "#8D6910" }}
              >
                Hoy
              </button>
            </div>
            <span className="text-[11px] font-semibold capitalize" style={{ color: t.muted }}>
              {period.title}
            </span>
          </div>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            ["Ventas totales", money(totals.sales), "#2E7D60"],
            ["Pérdidas", money(totals.losses), "#A54131"],
            [
              "Margen neto",
              totals.sales ? `${Math.round(((totals.sales - totals.losses) / totals.sales) * 100)}%` : "—",
              totals.sales >= totals.losses ? "#2E7D60" : "#A54131",
            ],
            ["Promedio por venta", periodSales.length ? money(totals.sales / periodSales.length) : "—", "#D99E00"],
          ].map(([lbl, val, col]) => (
            <div
              key={String(lbl)}
              className="admin-chart-stat px-2 py-2 rounded-xl text-center"
              style={{ background: t.input }}
            >
              <div
                className="font-black text-sm"
                style={{
                  fontFamily: "League Spartan,sans-serif",
                  color: String(col),
                }}
              >
                {val}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: t.muted, fontSize: "0.58rem" }}
              >
                {lbl}
              </div>
            </div>
          ))}
        </div>
        <div className="admin-chart-area relative" style={{ height: "150px" }}>
          <div className="absolute inset-0 flex items-end gap-1">
            {chart.values.map((v, i) => {
              const max = Math.max(1, ...chart.values, ...chart.values2) * 1.1
              const hV = Math.round((v / max) * 120)
              const hL = Math.round((chart.values2[i] / max) * 120)
              const valLabel = v ? money(v) : ""
              const lossLabel = chart.values2[i] ? money(chart.values2[i]) : ""
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div
                    className="flex items-end gap-0.5 w-full"
                    style={{ height: "120px" }}
                  >
                    <div className="flex-1 flex flex-col items-center justify-end">
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "#D99E00",
                          fontWeight: 700,
                        }}
                      >
                        {valLabel}
                      </span>
                      <div
                        className="admin-chart-bar"
                        style={{
                          width: "100%",
                          height: `${hV}px`,
                          background: "#F2C230",
                          borderRadius: "6px 6px 2px 2px",
                          minHeight: "4px",
                          animationDelay: `${i * 45}ms`,
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end">
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "#A54131",
                          fontWeight: 700,
                        }}
                      >
                        {lossLabel}
                      </span>
                      <div
                        className="admin-chart-bar"
                        style={{
                          width: "100%",
                          height: `${hL}px`,
                          background: C.red,
                          borderRadius: "6px 6px 2px 2px",
                          minHeight: "4px",
                          animationDelay: `${i * 45 + 20}ms`,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      color: t.text,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "40px",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chart.labels[i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Top products */}
      <div
        className="admin-dashboard-card min-w-0 rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: C.amber }}>{Ico.fire}</span>
          <div className="font-semibold text-sm" style={{ color: t.text }}>
            Más vendidos
          </div>
        </div>
        <div className="space-y-3">
          {!TOP.length && (
            <p className="text-xs" style={{ color: t.muted }}>No hay ventas en este periodo.</p>
          )}
          {TOP.map((p, i) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold"
                  style={{ color: i === 0 ? C.mustard : t.subtle }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-xs flex-1 mx-2 truncate"
                  style={{ color: t.text }}
                >
                  {p.name}
                </span>
                <span className="text-xs" style={{ color: t.muted }}>
                  {p.units}
                </span>
              </div>
              <div
                className="w-full rounded-full h-1.5"
                style={{ background: t.input }}
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${p.pct}%`,
                    background: i === 0 ? C.mustard : "rgba(182,140,28,0.35)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    )}

    {/* Bottom row */}
    {(seesSales || seesReturns || seesProduction) && (
    <div className="grid min-w-0 gap-5 lg:grid-cols-3">
      {/* Production times */}
      {seesProduction && (
      <div
        className="admin-dashboard-card min-w-0 rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "#4FC3F7" }}>{Ico.clock}</span>
          <div className="font-semibold text-sm" style={{ color: t.text }}>
            Tiempos en producción
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["Tiempo promedio", "14 min", true],
            ["Órdenes a tiempo", "87%", true],
            ["Órdenes retrasadas", "3", false],
            ["Tiempo por orden", "11 min", true],
          ].map(([lbl, val, good]) => (
            <div
              key={String(lbl)}
              className="flex items-center justify-between"
            >
              <span className="text-xs" style={{ color: t.muted }}>
                {lbl}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: good ? "#2E7D60" : C.red }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
      )}
      {/* Return reasons */}
      {seesReturns && (
      <div
        className="admin-dashboard-card min-w-0 rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: C.red }}>{Ico.undo}</span>
          <div className="font-semibold text-sm" style={{ color: t.text }}>
            Motivos de devolución
          </div>
        </div>
        <div className="space-y-2.5">
          {!RETURN_REASONS.length && (
            <p className="text-xs" style={{ color: t.muted }}>No hay devoluciones en este periodo.</p>
          )}
          {RETURN_REASONS.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: t.muted }}>
                  {r.label}
                </span>
                <span className="text-xs font-bold" style={{ color: t.text }}>
                  {r.pct}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full w-full"
                style={{ background: t.input }}
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${r.pct}%`, background: C.red }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      {/* Annual performance */}
      {seesSales && (
      <div
        className="admin-dashboard-card min-w-0 rounded-2xl p-5"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: C.mustard }}>{Ico.trending}</span>
          <div className="font-semibold text-sm" style={{ color: t.text }}>
            Desempeño anual
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["Ventas este año", "$12.4M", "+23% vs año anterior"],
            ["Mejor mes", "Diciembre", "$1.8M"],
            ["Mejor categoría", "Hamburguesas", "41% de ventas"],
            ["Promedio en dinero", "$18.200", "+$800 vs mes ant."],
          ].map(([lbl, val, sub]) => (
            <div key={String(lbl)}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: t.muted }}>
                  {lbl}
                </span>
                <span className="text-sm font-bold" style={{ color: t.text }}>
                  {val}
                </span>
              </div>
              <div className="text-xs" style={{ color: t.subtle }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
    )}

    <div
      id="admin-alerts-section"
      className="admin-dashboard-card mt-5 rounded-2xl overflow-hidden"
      style={{ background: t.card, border: `1px solid ${t.border}` }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <span style={{ color: C.red }}>{Ico.bell}</span>
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: t.text }}
        >
          Alertas
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${C.red}20`, color: C.red }}
        >
          {ALERTS.length}
        </span>
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
        {ALERTS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              markNotificationRead(a.id)
              setSection(a.target)
            }}
            className="flex items-start gap-3 rounded-xl p-3 text-left cursor-pointer"
            style={{ background: t.input, border: `1px solid ${t.border}` }}
          >
            <span
              className="mt-0.5 flex-shrink-0"
              style={{
                color:
                  a.type === "danger"
                    ? C.red
                    : a.type === "warn"
                      ? C.mustard
                      : "#4FC3F7",
              }}
            >
              {Ico.alert}
            </span>
            <span className="min-w-0">
              <span
                className="block text-xs font-semibold"
                style={{ color: t.text }}
              >
                {a.title}
              </span>
              <span
                className="block text-xs leading-snug break-words"
                style={{ color: t.muted }}
              >
                {a.message}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
)
}
