export default function AccessBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Volver a la página de inicio"
      title="Volver a la página de inicio"
      className="group fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold shadow-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 sm:left-6 sm:top-6"
      style={{
        background: "#FAF3E6",
        color: "#1A1714",
        outlineColor: "#B68C1C",
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#B68C1C] transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true">
        <path d="M19 12H5m0 0 6 6m-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="pr-1">Inicio</span>
    </button>
  )
}
