import { C } from "@/shared/styles/theme"

export default function AccessLoginLink({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 ${compact ? "py-2" : "py-2.5"} text-sm font-semibold transition-colors hover:bg-[#FBF5E8] focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{ borderColor: "rgba(182,140,28,0.22)", color: C.mustard, outlineColor: C.mustard }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M19 12H5m0 0 6 6m-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Volver al inicio de sesión
    </button>
  )
}
