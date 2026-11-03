export default function AuthPhotoBackground({ src }: { src: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#11100e]" aria-hidden="true">
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ objectPosition: "center 68%" }}
      />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  )
}
