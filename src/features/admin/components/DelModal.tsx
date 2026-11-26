import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { AdminPanelState } from "@/features/admin/types"
import type { ReactNode } from "react"

export default function DelModal(adminState: AdminPanelState): ReactNode {
  const {
    confirmDelete,
    delTarget,
    getDeleteAssessment,
    rows,
    setDelTarget,
    t,
  } = adminState
  if (!delTarget) return null

  const targetRow = delTarget.row ?? rows[delTarget.section]?.[delTarget.idx]
  const assessment = getDeleteAssessment(delTarget.section, targetRow)
  const canDelete = assessment.allowed

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={() => setDelTarget(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: canDelete ? "rgba(58,109,94,0.12)" : `${C.red}12`,
            color: canDelete ? "#2E7D60" : C.red,
          }}
        >
          {canDelete ? Ico.trash : Ico.alert}
        </div>
        <h3
          id="delete-dialog-title"
          className="mb-3 text-base font-semibold"
          style={{ color: t.text }}
        >
          {canDelete ? "¿Deseas eliminar?" : "Eliminación bloqueada"}
        </h3>
        <p className="mb-5 text-sm leading-relaxed" style={{ color: t.text }}>
          {canDelete
            ? `¿Seguro que quieres eliminar ${assessment.targetLabel}? ${
                delTarget.section === "proveedores" ? `${assessment.reason} ` : ""
              }Se quitará del sistema y no se podrá recuperar.`
            : `No puedes eliminar ${assessment.targetLabel}. ${assessment.reason}`}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDelTarget(null)}
            className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: t.input, color: t.muted }}
          >
            {canDelete ? "Cancelar" : "Entendido"}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
              style={{ background: C.red, color: "#fff" }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
