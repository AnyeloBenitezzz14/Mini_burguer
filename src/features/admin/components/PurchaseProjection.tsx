import { useEffect, useState } from "react"
import { api } from "@/shared/services/api"
import { C, type tk } from "@/shared/styles/theme"

type Item = { id: number; nombre: string; medida: string | null; stock: number; minimo: number; consumo: number; consumo_diario: number; dias_restantes: number | null; sugerido: number }
type Projection = { dias_historia: number; cobertura: number; insumos: Item[] }

const num = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 2 })

// Read-only: suggests how much of each supply to buy to cover N days at the last 30 days' pace
export default function PurchaseProjection({ t }: { t: ReturnType<typeof tk> }) {
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(15)
  const [data, setData] = useState<Projection | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    if (!open) return
    setError("")
    api<Projection>(`/movimientos-stock/proyeccion?dias=${days}`).then(setData).catch((e: Error) => setError(e.message))
  }, [open, days])
  const toBuy = (data?.insumos || []).filter((i) => i.sugerido > 0).sort((a, b) => (a.dias_restantes ?? 1e9) - (b.dias_restantes ?? 1e9))
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs cursor-pointer"
        style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.muted }}
      >
        Proyección de compras
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="projection-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl p-6"
            style={{ background: t.card, border: `1px solid ${t.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 id="projection-title" className="flex-1 text-base font-semibold" style={{ color: t.text }}>Proyección de compras</h3>
              <label className="flex items-center gap-2 text-xs" style={{ color: t.muted }}>
                Cubrir
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg px-2 py-1 text-xs" style={{ background: t.input, color: t.text, border: `1px solid ${t.inputB}` }}>
                  {[7, 15, 30, 60].map((d) => <option key={d} value={d}>{d} días</option>)}
                </select>
              </label>
              <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg px-2 py-1 text-sm" style={{ color: t.muted }}>✕</button>
            </div>
            <p className="mb-3 text-xs" style={{ color: t.muted }}>
              Según lo que se gastó en los últimos 30 días (producción, pérdidas y ventas), lo que hay que comprar para {days} días más el stock mínimo. Es solo una sugerencia: no crea compras.
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {error ? (
                <p className="text-sm" style={{ color: C.red }}>No se pudo calcular: {error}</p>
              ) : !data ? (
                <p className="text-sm" style={{ color: t.muted }}>Calculando…</p>
              ) : !toBuy.length ? (
                <p className="text-sm" style={{ color: t.muted }}>Con el stock actual alcanza para {days} días. No hay que comprar nada.</p>
              ) : (
                <table className="w-full text-left text-xs" style={{ color: t.text }}>
                  <thead style={{ color: t.muted }}>
                    <tr><th className="py-2">Insumo</th><th className="text-right">Stock</th><th className="text-right">Gasto diario</th><th className="text-right">Alcanza para</th><th className="text-right">Comprar</th></tr>
                  </thead>
                  <tbody>
                    {toBuy.map((i) => (
                      <tr key={i.id} className="border-t" style={{ borderColor: t.border }}>
                        <td className="py-2">{i.nombre}</td>
                        <td className="text-right tabular-nums">{num(i.stock)} {i.medida}</td>
                        <td className="text-right tabular-nums">{num(i.consumo_diario)} {i.medida}</td>
                        <td className="text-right tabular-nums">{i.dias_restantes === null ? "—" : `${i.dias_restantes} día${i.dias_restantes === 1 ? "" : "s"}`}</td>
                        <td className="text-right font-bold tabular-nums">{num(i.sugerido)} {i.medida}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
