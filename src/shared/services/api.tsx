import { loadLS } from "@/shared/utils/storage"

// ── Backend (parche-backend) ───────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Uploaded photos come as "/imagenes/<id>" (served by the API); other images are full URLs
export const imageUrl = (u: string | undefined) => (u?.startsWith("/imagenes/") ? API_URL + u : u || "")

// Calls the backend (with the login token) and returns `data`; throws with the server's message so forms can show it
export async function api<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = loadLS<string>("token", "")
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      method,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.")
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.detalles?.[0]?.mensaje || json.mensaje || "Ocurrió un error. Intenta de nuevo.")
  return json.data
}
