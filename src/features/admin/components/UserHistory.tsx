import { useEffect, useState } from "react"
import { api } from "@/shared/services/api"
import type { tk } from "@/shared/styles/theme"

type Change = { id_auditoria: number; campo: string; valor_anterior: string | null; valor_nuevo: string | null; fecha: string; cambiado_por_nombre: string | null }

const FIELD: Record<string, string> = {
  correo: "Correo", estado: "Estado", nombre: "Nombre", tipo_documento: "Tipo de documento", documento: "Documento",
  telefono: "Teléfono", direccion: "Dirección", barrio: "Barrio", telefono_emergencia: "Tel. de emergencia", roles: "Rol",
}

// Change history of a user, read from the backend (GET /usuarios/:id/historial)
export default function UserHistory({ id, t }: { id: number; t: ReturnType<typeof tk> }) {
  const [items, setItems] = useState<Change[] | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    if (!id) return
    api<Change[]>(`/usuarios/${id}/historial`).then(setItems).catch((e: Error) => setError(e.message))
  }, [id])
  return (
    <section className="order-last col-span-full mt-2 border-t pt-4" style={{ borderColor: t.border }}>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: t.text }}>Historial de cambios</h4>
      {error ? (
        <p className="text-xs" style={{ color: t.muted }}>No se pudo cargar el historial: {error}</p>
      ) : !items ? (
        <p className="text-xs" style={{ color: t.muted }}>Cargando…</p>
      ) : !items.length ? (
        <p className="text-xs" style={{ color: t.muted }}>Este usuario no tiene cambios registrados.</p>
      ) : (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto text-xs">
          {items.map((c) => (
            <li key={c.id_auditoria} className="rounded-lg px-3 py-2" style={{ background: t.input, color: t.text }}>
              <b>{FIELD[c.campo] || c.campo}</b>: {c.valor_anterior || "—"} → {c.valor_nuevo || "—"}
              <span className="block" style={{ color: t.muted }}>
                {new Date(c.fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                {c.cambiado_por_nombre ? ` · por ${c.cambiado_por_nombre}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
