import { PRODUCTION_STATUSES } from "@/features/admin/config/modules"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function ProductionStatusSelect(adminState: AdminPanelState, { rowIndex }: { rowIndex: number }): ReactNode {
  const {
    changeProductionStatus,
    openProductionPnc,
    rows,
    t,
  } = adminState
  const value = String(
    rows.produccion?.[rowIndex]?.[8] ?? "Recibida",
  ) as (typeof PRODUCTION_STATUSES)[number]
  const statusColor =
    value === "Producto no conforme"
      ? C.red
      : value === "Terminado"
        ? "#2E7D60"
        : value === "En cocina"
          ? C.mustard
          : t.text
  return (
    <div className="relative w-full min-w-0 max-w-[180px]">
      <span
        className="pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
        style={{ background: statusColor, boxShadow: `0 0 0 3px ${statusColor}18` }}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center" style={{ color: t.muted }}>
        {Ico.chevDown}
      </span>
      <select
        value={value}
        title="Cambiar estado de producción"
        aria-label="Estado de la orden de producción"
        onChange={(event) => {
          const nextStatus = event.target.value as (typeof PRODUCTION_STATUSES)[number]
          if (nextStatus === "Producto no conforme") {
            openProductionPnc(rowIndex)
            return
          }
          changeProductionStatus(rowIndex, nextStatus)
        }}
        className="h-9 w-full min-w-0 appearance-none rounded-xl py-2 pl-7 pr-7 text-xs font-semibold outline-none cursor-pointer"
        style={{
          background: value === "Producto no conforme" ? `${C.red}10` : value === "Terminado" ? "rgba(58,109,94,0.10)" : t.input,
          border: `1px solid ${value === "Producto no conforme" ? `${C.red}30` : t.inputB}`,
          color: statusColor,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {/* Recibida → Iniciada → En cocina → Terminado: the current one and the next (the earlier ones are gone) */}
        {(value === "Producto no conforme"
          ? [value]
          : [
              value,
              ...(PRODUCTION_STATUSES[PRODUCTION_STATUSES.indexOf(value) + 1] && value !== "Terminado"
                ? [PRODUCTION_STATUSES[PRODUCTION_STATUSES.indexOf(value) + 1]]
                : []),
              ...(value !== "Recibida" ? ["Producto no conforme" as const] : []),
            ]
        ).map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </div>
  )
}
