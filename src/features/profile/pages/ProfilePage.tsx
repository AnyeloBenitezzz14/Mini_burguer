import { useRef, useState } from "react"
import OrderDetailModal from "@/features/orders/components/OrderDetailModal"
import OrderList from "@/features/orders/components/OrderList"
import ChangePasswordForm from "@/features/profile/components/ChangePasswordForm"
import InputField from "@/shared/components/InputField"
import { Ico } from "@/shared/components/icons"
import { C } from "@/shared/styles/theme"
import type { Order, User } from "@/shared/types"
import { fmt } from "@/shared/utils/format"
import { normalizeDocumentInput, normalizePhoneInput, validateDocumentNumber, validatePhoneNumber } from "@/shared/utils/validation"

export default function ProfilePage({
  user,
  onBack,
  onLogout,
  onUpdateUser,
  onOrders,
}: {
  user: User
  onBack: () => void
  onLogout: () => void
  onUpdateUser: (u: User) => void
  onOrders: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    cedula: user.cedula || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [addresses, setAddresses] = useState<string[]>(
    user.addresses || [],
  )
  const [newAddr, setNewAddr] = useState("")
  const [addingAddr, setAddingAddr] = useState(false)
  const [editingAddrIdx, setEditingAddrIdx] = useState<number | null>(null)
  const [editingAddrValue, setEditingAddrValue] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const BG = "#FAF5E8"
  const CARD = "#fff"
  const TEXT = "#1A1714"
  const MUTED = "rgba(30,30,30,0.5)"
  const BORDER = "rgba(30,30,30,0.08)"
  const ORDERS = [
    {
      id: "PED-0197",
      items: "Mini x2, Salchipapa",
      total: "$39.000",
      date: "Ene 21",
    },
    {
      id: "PED-0190",
      items: "Mega Gourmet x1",
      total: "$23.000",
      date: "Ene 15",
    },
    {
      id: "PED-0183",
      items: "Doble x1, Chuzo Pollo",
      total: "$37.500",
      date: "Ene 8",
    },
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) {
      newErrors.name = "El nombre completo es obligatorio para identificar tu cuenta."
    }
    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio para iniciar sesión y recibir notificaciones."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Ingresa un correo electrónico válido (ejemplo: nombre@correo.com)."
    }
    if (form.phone.trim()) {
      const phoneError = validatePhoneNumber(form.phone)
      if (phoneError) newErrors.phone = phoneError
    }
    if (form.cedula.trim()) {
      const documentError = validateDocumentNumber(
        form.cedula,
        user.docType || "Cédula de Ciudadanía",
      )
      if (documentError) newErrors.cedula = documentError
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const save = () => {
    if (!validateForm()) return
    onUpdateUser({ ...user, ...form, addresses, photo: profilePhoto })
    setEditing(false)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startEditAddress = (idx: number) => {
    setEditingAddrIdx(idx)
    setEditingAddrValue(addresses[idx])
  }

  const saveEditAddress = () => {
    if (editingAddrIdx !== null && editingAddrValue.trim()) {
      const updatedAddresses = addresses.map((address, index) =>
        index === editingAddrIdx ? editingAddrValue.trim() : address,
      )
      setAddresses(updatedAddresses)
      onUpdateUser({ ...user, addresses: updatedAddresses })
    }
    setEditingAddrIdx(null)
    setEditingAddrValue("")
  }

  const deleteAddress = (idx: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== idx)
    setAddresses(updatedAddresses)
    onUpdateUser({ ...user, addresses: updatedAddresses })
  }

  const addAddress = () => {
    const address = newAddr.trim()
    if (!address) return
    const updatedAddresses = [...addresses, address]
    setAddresses(updatedAddresses)
    onUpdateUser({ ...user, addresses: updatedAddresses })
    setNewAddr("")
    setAddingAddr(false)
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: BG, fontFamily: "DM Sans, sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-sm cursor-pointer"
            style={{ color: C.mustard }}
          >
            ← Volver
          </button>
          <h1
            className="font-black text-2xl"
            style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
          >
            Mi perfil
          </h1>
        </div>
        {/* Avatar */}
        <div
          className="flex flex-col items-center mb-6 p-6 rounded-3xl"
          style={{ background: CARD, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-1 cursor-pointer hover:opacity-80 overflow-hidden [&_svg]:h-8 [&_svg]:w-8"
            style={{
              background: `${C.mustard}18`,
              border: `2px solid ${C.mustard}`,
              color: C.mustard,
            }}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              Ico.user
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div
            className="text-xs mb-3 cursor-pointer"
            style={{ color: C.mustard }}
            onClick={() => fileInputRef.current?.click()}
          >
            Cambiar foto
          </div>
          <div
            className="font-black text-xl"
            style={{ fontFamily: "League Spartan, sans-serif", color: TEXT }}
          >
            {user.name}
          </div>
          <div className="text-sm mt-0.5" style={{ color: MUTED }}>
            {user.email}
          </div>
        </div>
        {/* Profile data */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: CARD, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: TEXT }}>
              Datos personales
            </h2>
            <button
              onClick={() => (editing ? save() : setEditing(true))}
              className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              style={{
                background: editing ? C.mustard : "rgba(30,30,30,0.07)",
                color: editing ? "#fff" : MUTED,
              }}
            >
              {editing ? "Guardar" : "Editar"}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {editing ? (
              <>
                <div>
                  <InputField
                    label="Nombre completo *"
                    value={form.name}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, name: v }))
                      if (errors.name) setErrors((e) => ({ ...e, name: "" }))
                    }}
                  />
                  {errors.name && (
                    <p className="text-xs mt-1" style={{ color: C.red }}>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <InputField
                    label="Correo (es tu usuario para entrar)"
                    type="email"
                    value={form.email}
                    disabled
                    onChange={(v) => {
                      setForm((f) => ({ ...f, email: v }))
                      if (errors.email) setErrors((e) => ({ ...e, email: "" }))
                    }}
                  />
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: C.red }}>
                      {errors.email}
                    </p>
                  )}
                </div>
                <InputField
                  label="Teléfono"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => {
                    const phone = normalizePhoneInput(v)
                    setForm((f) => ({ ...f, phone }))
                    setErrors((current) => ({
                      ...current,
                      phone: phone.trim() ? validatePhoneNumber(phone) : "",
                    }))
                  }}
                />
                {errors.phone && (
                  <p className="text-xs mt-1" style={{ color: C.red }}>
                    {errors.phone}
                  </p>
                )}
                <InputField
                  label="Cédula"
                  value={form.cedula}
                  onChange={(v) => {
                    const cedula = normalizeDocumentInput(
                      v,
                      user.docType || "Cédula de Ciudadanía",
                    )
                    setForm((f) => ({ ...f, cedula }))
                    setErrors((current) => ({
                      ...current,
                      cedula: cedula.trim()
                        ? validateDocumentNumber(
                            cedula,
                            user.docType || "Cédula de Ciudadanía",
                          )
                        : "",
                    }))
                  }}
                />
                {errors.cedula && (
                  <p className="text-xs mt-1" style={{ color: C.red }}>
                    {errors.cedula}
                  </p>
                )}
              </>
            ) : (
              [
                ["Nombre", user.name],
                ["Correo", user.email],
                ["Teléfono", user.phone || "—"],
                ["Cédula", user.cedula || "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: MUTED }}
                  >
                    {l}
                  </div>
                  <div className="text-sm font-medium" style={{ color: TEXT }}>
                    {v}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Addresses */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: CARD, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: TEXT }}>
              Mis direcciones
            </h2>
            <button
              onClick={() => setAddingAddr(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              style={{ background: `${C.mustard}15`, color: C.mustard }}
            >
              {Ico.plus} Agregar
            </button>
          </div>
          {addresses.length === 0 && !addingAddr && (
            <p className="text-sm" style={{ color: MUTED }}>
              Aún no tienes direcciones guardadas. Se guardará la primera al confirmar tu pedido.
            </p>
          )}
          {addresses.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-2.5"
              style={{
                borderBottom:
                  i < addresses.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <span style={{ color: C.mustard }}>{Ico.mapPin}</span>
              {editingAddrIdx === i ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={editingAddrValue}
                    onChange={(e) => setEditingAddrValue(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                    style={{
                      background: "rgba(30,30,30,0.05)",
                      border: `1.5px solid ${C.mustard}`,
                      color: TEXT,
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditAddress()
                      if (e.key === "Escape") {
                        setEditingAddrIdx(null)
                        setEditingAddrValue("")
                      }
                    }}
                  />
                  <button
                    onClick={saveEditAddress}
                    className="text-xs font-bold cursor-pointer"
                    style={{ color: C.mustard }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingAddrIdx(null)
                      setEditingAddrValue("")
                    }}
                    className="text-xs cursor-pointer"
                    style={{ color: MUTED }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm" style={{ color: TEXT }}>
                    {a}
                  </span>
                  <button
                    onClick={() => startEditAddress(i)}
                    className="text-xs cursor-pointer mr-1"
                    style={{ color: C.mustard }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteAddress(i)}
                    className="text-xs cursor-pointer"
                    style={{ color: C.red }}
                    title="Eliminar dirección"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          ))}
          {addingAddr && (
            <div className="flex gap-2 mt-3">
              <input
                placeholder="Nueva dirección..."
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(30,30,30,0.05)",
                  border: "1.5px solid rgba(30,30,30,0.12)",
                  color: TEXT,
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addAddress()
                }}
              />
              <button
                onClick={addAddress}
                className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                +
              </button>
            </div>
          )}
        </div>
        {/* Change password */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: CARD, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <h2 className="font-bold text-base mb-4" style={{ color: TEXT }}>
            Seguridad
          </h2>
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
            style={{ background: `${C.mustard}15`, color: C.mustard }}
          >
            Cambiar contraseña
          </button>
        </div>
        {/* Orders live in their own section instead of taking space on the profile page */}
        <div
          className="mb-4 flex items-center justify-between gap-4 rounded-2xl border p-4"
          style={{ background: CARD, borderColor: "rgba(30,30,30,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div>
            <h2 className="font-bold text-base" style={{ color: TEXT }}>Mis pedidos</h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>Consulta el estado y los detalles de tus compras.</p>
          </div>
          <button
            type="button"
            onClick={onOrders}
            className="flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-85"
            style={{ background: `${C.mustard}15`, color: C.mustard }}
          >
            Ver pedidos →
          </button>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer hover:opacity-90"
            style={{ background: `${C.mustard}15`, color: C.mustard }}
          >
            Cerrar sesión
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer hover:opacity-90"
            style={{
              background: C.red,
              color: "#fff",
            }}
          >
            Eliminar cuenta
          </button>
        </div>
      </div>
      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-xs p-6 rounded-2xl text-center"
            style={{
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full [&_svg]:h-6 [&_svg]:w-6"
              style={{ background: `${C.mustard}18`, color: C.mustard }}
            >
              {Ico.logout}
            </div>
            <h3
              className="font-black text-lg mb-2"
              style={{ fontFamily: "League Spartan, sans-serif", color: "#1A1714" }}
            >
              ¿Cerrar sesión?
            </h3>
            <p className="text-sm mb-5" style={{ color: "rgba(30,30,30,0.5)" }}>
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  background: "rgba(30,30,30,0.06)",
                  color: "rgba(30,30,30,0.5)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false)
                  onLogout()
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: C.red, color: "#fff" }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete account modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-xs p-6 rounded-2xl text-center"
            style={{
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full [&_svg]:h-6 [&_svg]:w-6"
              style={{ background: `${C.red}12`, color: C.red }}
            >
              {Ico.alert}
            </div>
            <h3
              className="font-black text-lg mb-2"
              style={{ fontFamily: "League Spartan, sans-serif", color: "#1A1714" }}
            >
              ¿Eliminar cuenta?
            </h3>
            <p className="text-sm mb-5" style={{ color: "rgba(30,30,30,0.5)" }}>
              Esta acción es permanente y no se puede deshacer. Perderás todos tus datos, pedidos y acceso a la cuenta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  background: "rgba(30,30,30,0.06)",
                  color: "rgba(30,30,30,0.5)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  onLogout()
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: C.red, color: "#fff" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Change password modal */}
      {showChangePassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowChangePassword(false)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-black text-lg"
                style={{ fontFamily: "League Spartan, sans-serif", color: "#1A1714" }}
              >
                Cambiar contraseña
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-lg cursor-pointer"
                style={{ color: "rgba(30,30,30,0.4)" }}
              >
                ✕
              </button>
            </div>
            <ChangePasswordForm
              user={user}
              onUpdateUser={onUpdateUser}
            />
          </div>
        </div>
      )}
    </div>
  )
}
