export const visiblePaginationPages = (currentPage: number, totalPages: number, maxVisible = 5) => {
  const pageCount = Math.min(totalPages, maxVisible)
  const startPage = Math.min(
    Math.max(currentPage - Math.floor(pageCount / 2), 0),
    totalPages - pageCount,
  )
  return Array.from({ length: pageCount }, (_, index) => startPage + index)
}
