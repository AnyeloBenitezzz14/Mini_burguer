// Store hours, in one place: the landing's "Horario" and the menu's "Tienda cerrada" notice read them.
// Every day (0 = Sunday … 6 = Saturday) from 18:00 to 23:30, Colombia time (the browser's clock).
export const STORE_HOURS = { days: [0, 1, 2, 3, 4, 5, 6], open: 18 * 60, close: 23 * 60 + 30 }

const clock = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`
}
export const STORE_OPEN_LABEL = clock(STORE_HOURS.open)
export const STORE_HOURS_LABEL = `${clock(STORE_HOURS.open)} a ${clock(STORE_HOURS.close)}`

export const isStoreOpen = (now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return STORE_HOURS.days.includes(now.getDay()) && minutes >= STORE_HOURS.open && minutes < STORE_HOURS.close
}

// "hoy a partir de las 6:00 p. m." / "mañana a partir de las 6:00 p. m."
export const nextOpeningLabel = (now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes()
  const today = STORE_HOURS.days.includes(now.getDay()) && minutes < STORE_HOURS.open
  if (today) return `hoy a partir de las ${STORE_OPEN_LABEL}`
  for (let i = 1; i <= 7; i++) {
    const day = (now.getDay() + i) % 7
    if (STORE_HOURS.days.includes(day)) {
      const name = i === 1 ? "mañana" : `el ${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][day]}`
      return `${name} a partir de las ${STORE_OPEN_LABEL}`
    }
  }
  return `a partir de las ${STORE_OPEN_LABEL}`
}
