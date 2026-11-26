// Downloads rows as a CSV that Excel opens with its columns: ";" between cells (Excel in Spanish uses "," for
// decimals) and a BOM so accents show right
export function downloadCsv(filename: string, lines: (string | number)[][]) {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const csv = lines.map((line) => line.map(cell).join(";")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
