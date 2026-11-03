import { useEffect } from "react"
import AccessBackButton from "@/features/auth/components/AccessBackButton"
import AccessLogo from "@/features/auth/components/AccessLogo"
import AuthPhotoBackground from "@/features/auth/components/AuthPhotoBackground"

export default function AuthLayout({
  children,
  title,
  sub,
  backgroundImage,
  onBack,
  onLogoClick,
  compact = false,
  wide = false,
}: {
  children: React.ReactNode
  title: string
  sub: React.ReactNode
  backgroundImage?: string
  onBack?: () => void
  onLogoClick: () => void
  compact?: boolean
  wide?: boolean
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div
      className={`auth-access-page relative isolate min-h-screen flex items-center justify-center overflow-hidden px-4 ${wide ? "py-5" : "py-8"}`}
      style={{
        background: backgroundImage ? "#11100e" : "#FAF3E6",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {backgroundImage && <AuthPhotoBackground src={backgroundImage} />}
      {onBack && <AccessBackButton onClick={onBack} />}
      <div className={`relative z-10 w-full ${wide ? "max-w-[36rem]" : compact ? "max-w-[23rem]" : "max-w-lg"}`}>
        <div className={`auth-brand flex flex-col items-center ${wide ? "mb-2" : compact ? "mb-1" : "mb-5"}`}>
          <AccessLogo
            onClick={onLogoClick}
            className="object-contain"
            style={{ width: wide ? "124px" : "144px", height: wide ? "124px" : "144px" }}
          />
        </div>
        <div
          className={`${wide || compact ? "p-5" : "p-6"} rounded-3xl`}
          style={{
            background: "#fff",
            boxShadow: "0 8px 40px rgba(30,30,30,0.1)",
          }}
        >
          <h2
            className="font-black text-xl mb-0.5"
            style={{ fontFamily: "League Spartan, sans-serif", color: "#1A1714" }}
          >
            {title}
          </h2>
          <div
            className={`text-sm ${wide ? "mb-3" : "mb-4"}`}
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            {sub}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
