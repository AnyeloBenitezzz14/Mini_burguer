// ── Brand ──────────────────────────────────────────────────────────────────────
export const C = {
  mustard: "#8F6C12",
  amber: "#D29A42",
  red: "#A54131",
  cream: "#F2E5C0",
  dark: "#191512",
  forest: "#3A6D5E",
}

export const WA = "573206332670"

// ── Theme tokens ───────────────────────────────────────────────────────────────
export function tk(dark: boolean) {
  return {
    bg: dark ? "#0D0F14" : "#F0EDE6",
    sidebarBg: dark ? "#111318" : "#FFFFFF",
    sidebarBd: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    sidebarTx: dark ? "rgba(255,255,255,0.92)" : "rgba(30,25,18,0.85)",
    sidebarMu: dark ? "rgba(255,255,255,0.7)" : "rgba(30,25,18,0.66)",
    hdrBg: dark ? "#111318" : "#FFFFFF",
    hdrBd: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    card: dark ? "#181B22" : "#FFFFFF",
    cardAlt: dark ? "#1E2128" : "#F8F5EF",
    border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: dark ? "#EAE4D8" : "#18160F",
    muted: dark ? "rgba(234,228,216,0.68)" : "rgba(24,22,15,0.64)",
    subtle: dark ? "rgba(234,228,216,0.22)" : "rgba(24,22,15,0.22)",
    input: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    inputB: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
    hover: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
  }
}

export function badgeSt(val: string | number) {
  const s = String(val)
  if (
    [
      "Activo",
      "Activa",
      "OK",
      "Recibida",
      "Completada",
      "Terminado",
      "Vigente",
      "Lista",
      "Entregado",
      "Entregada",
      "Resuelta",
      "Resuelto",
      "Devuelta a compra",
    ].includes(s)
  )
    return { bg: "rgba(58,109,94,0.14)", color: "#2E7D60" }
  if (
    [
      "Pendiente",
      "Por confirmar",
      "Recibido",
      "En producción",
      "Iniciada",
      "En gestión",
      "En camino",
      "Borrador",
      "Confirmado",
      "Normal",
      "Listo",
      "Devuelta en parte",
    ].includes(s)
  )
    return { bg: "rgba(182,140,28,0.14)", color: "#9A7010" }
  if (
    [
      "Bajo",
      "Alta",
      "Pend. Aprobación",
      "Producto no conforme",
      "Pendiente admin",
      "Cancelada",
      "Cancelado",
      "Agotado",
      "Obsoleta",
      "Inactivo",
      "Inactiva",
      "Anulada",
      "Anulado",
      "Registrada",
    ].includes(s)
  )
    return { bg: "rgba(165,65,49,0.14)", color: C.red }
  return null
}
