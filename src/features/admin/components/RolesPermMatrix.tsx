import { PERMISSION_MODULES } from "@/features/admin/config/modules"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

const halfway = Math.ceil(PERMISSION_MODULES.length / 2)
const moduleGroups = [PERMISSION_MODULES.slice(0, halfway), PERMISSION_MODULES.slice(halfway)]
const matrixColumns = "grid-cols-[minmax(0,1fr)_repeat(4,minmax(2rem,0.36fr))]"

// Roles permissions matrix for create/edit
export default function RolesPermMatrix(adminState: AdminPanelState, {
    roleName,
    permissionKey = roleName,
    readOnly = false,
  }: {
    roleName: string
    permissionKey?: string
    readOnly?: boolean
  }): ReactNode {
  const {
    dark,
    rolesPerms,
    setRolesPerms,
    t,
  } = adminState
  const isAdmin = roleName.toLowerCase() === "administrador"
  const perms = isAdmin
    ? Object.fromEntries(
        PERMISSION_MODULES.map(({ name }) => [
          name,
          ["Ver", "Crear", "Editar", "Anular", "Eliminar"],
        ]),
      )
    : (rolesPerms[permissionKey] || {})
  const commonActions = ["Ver", "Crear", "Editar"]
  const actionsOf = (mod: string) => [
    ...commonActions,
    PERMISSION_MODULES.find((m) => m.name === mod)?.finalAction ?? "Anular",
  ]
  const allNames = PERMISSION_MODULES.map((m) => m.name)
  const totalPermissions = PERMISSION_MODULES.length * 4
  // Only the module's own 4 actions count (Administrador has Anular and Eliminar everywhere)
  const grantedIn = (mod: string) => actionsOf(mod).filter((a) => (perms[mod] || []).includes(a))
  const granted = allNames.reduce((n, name) => n + grantedIn(name).length, 0)
  const canEdit = !readOnly && !isAdmin
  // Replaces the given modules' actions (the others stay as they are)
  const setModules = (next: Record<string, string[]>) =>
    setRolesPerms((rp) => ({ ...rp, [permissionKey]: { ...(rp[permissionKey] || {}), ...next } }))
  // Each permission is independent: checking or unchecking one never touches the others
  const withAction = (mod: string, action: string, on: boolean) => {
    const cur = perms[mod] || []
    return on ? [...new Set([...cur, action])] : cur.filter((a) => a !== action)
  }
  const toggle = (mod: string, action: string) =>
    canEdit && setModules({ [mod]: withAction(mod, action, !(perms[mod] || []).includes(action)) })
  // A column: "final" = each module's Anular/Eliminar
  const columnAction = (mod: string, column: string) => (column === "final" ? actionsOf(mod)[3] : column)
  const columnAllOn = (column: string) => allNames.every((m) => (perms[m] || []).includes(columnAction(m, column)))
  const toggleColumn = (column: string) => {
    if (!canEdit) return
    const on = !columnAllOn(column)
    setModules(Object.fromEntries(allNames.map((m) => [m, withAction(m, columnAction(m, column), on)])))
  }
  const setAll = (on: boolean) =>
    canEdit && setModules(Object.fromEntries(allNames.map((m) => [m, on ? actionsOf(m) : []])))
  const columns = [
    { key: "Ver", label: "Ver" },
    { key: "Crear", label: "Crear" },
    { key: "Editar", label: "Editar" },
    { key: "final", label: "Anular / Eliminar" },
  ]
  const box = (on: boolean, size = 17) => (
    <span
      key={on ? "on" : "off"}
      className={`${on ? "admin-check-pop " : ""}flex flex-shrink-0 items-center justify-center rounded-md`}
      style={{
        width: size,
        height: size,
        background: on ? C.mustard : t.card,
        // An empty box needs a clear outline, or it fades into the row
        border: `2px solid ${on ? C.mustard : t.muted}`,
        color: "#fff",
      }}
    >
      {on && Ico.check}
    </span>
  )
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold">
            Permisos por módulo
          </h4>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
            {granted} de {totalPermissions}
          </span>
        </div>
        {canEdit && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold"
              style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: t.input, color: t.text, border: `1px solid ${t.border}` }}
            >
              Quitar todos
            </button>
          </div>
        )}
      </div>
      {isAdmin && (
        <p className="rounded-lg px-3 py-2 text-[11px] font-medium" style={{ background: `${C.mustard}12`, color: C.mustard }}>
          El rol Administrador siempre tiene todos los permisos.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {moduleGroups.map((modules) => (
          <div key={modules[0]?.name} className="min-w-0 overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
            {/* Header: each column can be selected for every module at once */}
            <div
              className={`grid min-h-14 items-center gap-1 px-2 py-1 sm:px-3 ${matrixColumns}`}
              style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted }}>
                Módulo
              </span>
              {columns.map((column) => {
                const on = columnAllOn(column.key)
                return (
                  <button
                    key={column.key}
                    type="button"
                    disabled={!canEdit}
                    aria-pressed={on}
                    onClick={() => toggleColumn(column.key)}
                    title={canEdit ? `${on ? "Quitar" : "Seleccionar"} «${column.label}» en todos los módulos` : undefined}
                    aria-label={`${column.label} en todos los módulos`}
                    className="flex min-h-9 items-center justify-center rounded-md border px-0.5 py-1 text-center text-[10px] font-bold leading-tight enabled:cursor-pointer enabled:hover:brightness-95 focus-visible:outline-2 disabled:cursor-default"
                    style={{
                      background: canEdit ? (on ? C.mustard : t.card) : "transparent",
                      borderColor: canEdit ? (on ? C.mustard : t.border) : "transparent",
                      color: canEdit && on ? "#fff" : "var(--admin-heading-gold)",
                    }}
                  >
                    {column.label}
                  </button>
                )
              })}
            </div>
            {modules.map(({ name }, index) => {
              const modPerms = grantedIn(name)
              return (
                <div
                  key={name}
                  className={`grid min-h-9 items-center gap-1 px-2 py-0.5 sm:px-3 ${matrixColumns}`}
                  style={{
                    background: index % 2 ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)") : "transparent",
                    borderBottom: index < modules.length - 1 ? `1px solid ${t.border}` : "none",
                  }}
                >
                  <div className="min-w-0 text-xs font-semibold leading-tight" style={{ color: modPerms.length ? t.text : t.muted }}>
                    {name}
                  </div>
                  {columns.map((column) => {
                    const action = columnAction(name, column.key)
                    const on = (perms[name] || []).includes(action)
                    return (
                      <button
                        key={column.key}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-label={`${action} en ${name}`}
                        title={column.key === "final" ? action : undefined}
                        disabled={!canEdit}
                        onClick={() => toggle(name, action)}
                        className="flex min-h-8 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] disabled:cursor-default"
                        style={{ cursor: canEdit ? "pointer" : "default" }}
                      >
                        {box(on)}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {canEdit && (
        <p className="text-[11px]" style={{ color: t.muted }}>
          Los botones del encabezado aplican esa acción a todos los módulos.
        </p>
      )}
    </div>
  )
}
