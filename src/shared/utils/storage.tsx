export function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded / storage blocked: state stays in memory for this session
  }
}

// The login token and the page live per tab (sessionStorage): a client tab and an admin tab keep their own
// account, and a reload stays signed in
export const getToken = () => sessionStorage.getItem("token") ?? ""
export const setToken = (token: string) => sessionStorage.setItem("token", token)
export const clearSession = () => ["token", "orders", "page", "user"].forEach((key) => sessionStorage.removeItem(key))

export function loadSession<T>(key: string, fallback: T): T {
  try {
    const v = sessionStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
export const saveSession = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked: the next reload waits for the backend instead
  }
}
