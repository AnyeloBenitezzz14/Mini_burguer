import type { Worker } from "tesseract.js"

// Words a transfer receipt has (Nequi, Bancolombia, Daviplata, Bre-B...), without accents so OCR slips don't matter
const RECEIPT_WORDS = [
  "nequi", "bancolombia", "daviplata", "davivienda", "bre-b", "transferencia", "transaccion", "comprobante", "referencia",
  "aprobacion", "exitos", "envio", "enviaste", "pagaste", "pasaste", "recibiste", "valor", "monto", "cuenta", "destino",
  "llave", "ahorros", "fecha", "pago",
]
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

// One reader for the whole visit: the first check downloads the Spanish model (a few MB), the next ones are quick
let worker: Promise<Worker> | null = null
// tesseract.js is CommonJS: in development its functions come under `default`
const getWorker = () =>
  (worker ??= import("tesseract.js").then((m) => (m.createWorker ?? (m as unknown as { default: typeof m }).default.createWorker)("spa")))

// Reads the image's text and says whether it looks like a transfer receipt: two receipt words, or one and an amount.
// If it can't read it (no connection, an old browser) it lets it through: the staff still checks every proof.
export async function checkReceipt(dataUrl: string): Promise<{ ok: boolean; words: string[] }> {
  try {
    // Decoded here: tesseract can't read some data URLs on its own
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    const { data } = await (await getWorker()).recognize(image)
    const text = plain(data.text)
    const words = RECEIPT_WORDS.filter((w) => text.includes(w))
    const hasAmount = /\$\s?\d{1,3}([.,]\d{3})+|\$\s?\d{4,}/.test(text)
    return { ok: words.length >= 2 || (words.length === 1 && hasAmount), words }
  } catch {
    worker = null
    return { ok: true, words: [] }
  }
}
