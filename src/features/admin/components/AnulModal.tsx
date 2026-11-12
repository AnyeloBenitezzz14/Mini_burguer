import { PURCHASE_ENTITIES } from "@/features/admin/config/modules"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function AnulModal(adminState: AdminPanelState): ReactNode {
  const {
    anulTarget,
    confirmAnul,
    getAnulAssessment,
    rows,
    setAnulTarget,
    t,
  } = adminState
  if (!anulTarget) return null

  const targetRow = rows[anulTarget.section]?.[anulTarget.idx]
  const assessment = getAnulAssessment(
    anulTarget.section,
    targetRow,
    anulTarget.idx,
  )
  const reactivate = !!anulTarget.reactivate
  const canAnul = reactivate || assessment.allowed
  const entity = {
    ...PURCHASE_ENTITIES,
    roles: { name: "rol", fem: false },
    usuarios: { name: "usuario", fem: false },
    producto: { name: "producto", fem: false },
  }[anulTarget.section] || { name: "registro", fem: false }
  const thisOne = `${entity.fem ? "esta" : "este"} ${entity.name}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={() => setAnulTarget(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="annul-dialog-title"
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: canAnul ? `${C.mustard}18` : `${C.red}12`,
            color: canAnul ? C.mustard : C.red,
          }}
        >
          {canAnul ? Ico.ban : Ico.alert}
        </div>
        <h3
          id="annul-dialog-title"
          className="mb-3 text-base font-semibold"
          style={{ color: t.text }}
        >
          {reactivate ? "¿Deseas reactivar?" : canAnul ? "¿Deseas anular?" : "Anulación bloqueada"}
        </h3>
        <p className="mb-5 text-sm leading-relaxed" style={{ color: t.text }}>
          {reactivate
            ? `Vas a reactivar ${thisOne} «${String(targetRow?.[0] ?? "")}». Podrá volver a iniciar sesión con sus permisos.`
            : canAnul
            ? `Vas a anular ${thisOne} «${String(targetRow?.[0] ?? "")}». El cambio se verá en los módulos que ${entity.fem ? "la" : "lo"} usan, y puedes deshacerlo justo después.`
            : `No puedes anular ${thisOne}. ${assessment.reason}`}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAnulTarget(null)}
            className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: t.input, color: t.muted }}
          >
            {canAnul ? "Cancelar" : "Entendido"}
          </button>
          {canAnul && (
            <button
              type="button"
              onClick={confirmAnul}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
              style={{ background: reactivate ? "#2E7D60" : C.red, color: "#fff" }}
            >
              {reactivate ? "Reactivar" : "Anular"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
