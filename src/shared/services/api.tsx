import { getToken } from "@/shared/utils/storage"

// ── Backend (parche-backend) ───────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Uploaded photos come as "/imagenes/<id>" (served by the API); other images are full URLs
export const imageUrl = (u: string | undefined) => (u?.startsWith("/imagenes/") ? API_URL + u : u || "")

// Calls the backend (with the login token) and returns `data`; throws with the server's message so forms can show it
export async function api<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = getToken()
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

// Listens to a server-sent event stream (with the login token, which EventSource can't send);
// reconnects after 5 s if the connection drops, until `signal` aborts
export async function listenEvents(path: string, onData: (data: string) => void, signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const res = await fetch(API_URL + path, {
        signal,
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok || !res.body) throw new Error(String(res.status))
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const messages = (buffer + value).split("\n\n")
        buffer = messages.pop() ?? ""
        for (const message of messages) {
          const data = message.split("\n").find((line) => line.startsWith("data: "))
          if (data) onData(data.slice(6))
        }
      }
    } catch {
      if (signal.aborted) return
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}
