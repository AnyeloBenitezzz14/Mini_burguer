import { useEffect, useRef, useState } from "react"
import { BELLO_NEIGHBORHOODS, normalizeNeighborhood } from "@/data/barrios"
import PaymentAccounts from "@/features/checkout/components/PaymentAccounts"
import logoImg from "@/imports/logo.png"
import PinCodeField from "@/features/auth/components/PinCodeField"
import { apiLogin, requestRegistrationCode, saveRegisteredClient, toUser, verifyRegistrationCode } from "@/features/auth/services/auth.service"
import PasswordChecklist from "@/features/auth/components/PasswordChecklist"
import useLiveErrors from "@/features/auth/utils/useLiveErrors"
import { validateLogin, validateRegister } from "@/features/auth/utils/validation"
import CartAddedNotice, { useCartNotice } from "@/features/checkout/components/CartAddedNotice"
import CartSummary from "@/features/checkout/components/CartSummary"
import NeighborhoodSearch from "@/features/checkout/components/NeighborhoodSearch"
import { DELIVERY_ESTIMATE_ENDPOINT } from "@/features/checkout/services/delivery.service"
import { addCartItem, cartTotal, itemTotal } from "@/features/checkout/utils/cart"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import VoucherInput from "@/features/orders/components/VoucherInput"
import { APPROVAL_MIN, depositOf } from "@/features/orders/utils/orders"
import AddressLines from "@/shared/components/AddressLines"
import DeliveryAddressSummary from "@/shared/components/DeliveryAddressSummary"
import FieldError from "@/shared/components/FieldError"
import InputField from "@/shared/components/InputField"
import { Ico } from "@/shared/components/icons"
import { api } from "@/shared/services/api"
import { geocodeAddress } from "@/shared/services/geocoding"
import { C } from "@/shared/styles/theme"
import type { CartItem, DeliveryEstimate, DeliveryInfo, DeliveryNeighborhood, Product, User } from "@/shared/types"
import { EMPTY_CHECKOUT_ADDRESS_PARTS, SHOP_LOCATION, STREET_TYPES, addressPartsFromAddress, composeDeliveryAddress, composeStreetAddress, distanceKm, isKnownBelloNeighborhood } from "@/shared/utils/address"
import type { CheckoutAddressParts } from "@/shared/utils/address"
import { fmt, formatDuration } from "@/shared/utils/format"
import { appAlert } from "@/shared/components/AppDialog"
import { loadLS, saveLS } from "@/shared/utils/storage"
import { DOC_TYPES, digitsOnly, normalizeAccountDocumentInput, validatePhoneNumber } from "@/shared/utils/validation"

// ── Checkout Page (split: cart+form | auth) ────────────────────────────────────
// What was typed in the checkout, kept in this tab so a reload doesn't lose it (cleared once the order is placed)
const DRAFT_KEY = "checkout-draft"
type CheckoutDraft = {
  step?: 1 | 2 | 3
  delivForm?: { nombre: string; telefono: string; direccion: string; notas: string; pago: string }
  deliveryMethod?: DeliveryInfo["tipoEntrega"]
  addressParts?: CheckoutAddressParts
  deliverToOtherPerson?: boolean
  voucher?: string
  voucherAmount?: string
  voucherDoubtful?: boolean
  mixed?: boolean
  mixedTransfer?: string
  // A new address being typed, whether to save it and what it's called
  editingAddress?: boolean
  saveAddress?: boolean
  addressLabel?: string
  customAddressLabel?: string
}
const readDraft = (): CheckoutDraft => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}")
  } catch {
    return {}
  }
}

// What each delivery address is called (Casa, Trabajo or a name of the client's own under «Otra»)
const ADDRESS_LABELS = ["Casa", "Trabajo", "Otra"]
// The same address written with other spaces or capitals is the same address
const addressLabelKey = (address: string) => address.trim().replace(/\s+/g, " ").toLowerCase()
// The address the client was typing last time (offered again as «Recuperar dirección anterior»)
type AddressDraft = { parts: CheckoutAddressParts; neighborhoodQuery: string | null; label: string; customLabel?: string }

// The payment method's mark: cash, or the bank app the transfer is made from
function PaymentMethodIcon({ method }: { method: string }) {
  const look: Record<string, { color: string; background: string; icon: React.ReactNode }> = {
    Efectivo: { color: C.forest, background: `${C.forest}14`, icon: Ico.cash },
    Nequi: { color: "#B5006B", background: "#DA008114", icon: Ico.phone },
    Bancolombia: { color: "#2C2A29", background: "#FDDA2440", icon: Ico.phone },
  }
  const { color, background, icon } = look[method] ?? { color: C.mustard, background: `${C.mustard}14`, icon: Ico.cash }
  return (
    <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ color, background }}>
      {icon}
    </span>
  )
}

export default function CheckoutPage({
  cart,
  setCart,
  user,
  onLogin,
  onBack,
  onPlaceOrder,
  onComplete,
  onForgot,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  user: User | null
  onLogin: (u: User) => void
  onBack: () => void
  onPlaceOrder: (info: DeliveryInfo, saveAddress: boolean) => Promise<number | void>
  onComplete: () => void
  onForgot: () => void
}) {
  const [cartNotice, showCartNotice] = useCartNotice()
  const [authTab, setAuthTab] = useState<"login" | "register">("login")
  const [loginForm, setLoginForm] = useState({ email: "", pass: "" })
  const [regForm, setRegForm] = useState({
    name: "",
    lastname: "",
    docType: "",
    docNum: "",
    email: "",
    phone: "",
    pass: "",
    pass2: "",
  })
  const [registrationPending, setRegistrationPending] = useState(false)
  const [registrationCode, setRegistrationCode] = useState("")
  const [draft] = useState(readDraft)
  const accountKey = user?.email.toLowerCase() ?? ""
  const addressLabelsKey = accountKey ? `address-labels:${accountKey}` : ""
  const addressDraftKey = accountKey ? `address-draft:${accountKey}` : ""
  const addressLabels = ADDRESS_LABELS
  const [addressLabel, setAddressLabel] = useState(draft.addressLabel ?? "Casa")
  const [customAddressLabel, setCustomAddressLabel] = useState(draft.customAddressLabel ?? "")
  const savedAddressLabels = addressLabelsKey ? loadLS<Record<string, string>>(addressLabelsKey, {}) : {}
  // The account whose address is being typed (only then its draft is saved) and the one already prefilled
  const editedAddressKey = useRef("")
  const initializedAddressKey = useRef("")
  // Read once per account: the draft of a previous visit, not the address being typed now
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null)
  useEffect(() => {
    setAddressDraft(addressDraftKey ? loadLS<AddressDraft | null>(addressDraftKey, null) : null)
  }, [addressDraftKey])
  const [delivForm, setDelivForm] = useState(() => draft.delivForm ?? {
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
    pago: "Efectivo",
  })
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryInfo["tipoEntrega"]>(draft.deliveryMethod ?? "domicilio")
  const isDelivery = deliveryMethod === "domicilio"
  const deliveryMethodLabel =
    deliveryMethod === "recoger"
        ? "Recoger pedido"
        : "Pedir a domicilio"
  // The backend still receives one formatted address string.
  const [addressParts, setAddressParts] = useState<CheckoutAddressParts>(draft.addressParts ?? EMPTY_CHECKOUT_ADDRESS_PARTS)
  const [addressRetry, setAddressRetry] = useState(0)
  const fallbackNeighborhoods: DeliveryNeighborhood[] = BELLO_NEIGHBORHOODS.map((nombre) => ({
    id_barrio: null,
    nombre,
  }))
  const [neighborhoods, setNeighborhoods] = useState<DeliveryNeighborhood[]>(fallbackNeighborhoods)
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(true)
  const [neighborhoodsError, setNeighborhoodsError] = useState("")
  const setAddressPart = (key: keyof CheckoutAddressParts, value: string, edited = true) => {
    if (edited) {
      editedAddressKey.current = addressDraftKey
      markTouched(key)
    }
    setAddressParts((current) => ({ ...current, [key]: value }))
  }
  // Where the address is on the map and whether it's inside the delivery zone
  const [geo, setGeo] = useState<{
    status: "idle" | "loading" | "ok" | "notfound" | "error"
    lat?: number
    lon?: number
    km?: number
    neighborhood?: string
    municipality?: string
    approximate?: boolean
  }>({ status: "idle" })
  // null: not typing (shows the chosen barrio)
  const [neighborhoodQuery, setNeighborhoodQuery] = useState<string | null>(null)
  // The barrio the client chose (or, until they do, the one found on the map)
  const barrioName = addressParts.barrio || geo.neighborhood || ""
  const selectedNeighborhood = neighborhoods.find(
    (item) => !!barrioName
      && normalizeNeighborhood(item.nombre) === normalizeNeighborhood(barrioName),
  )
  const geocodedInsideBello =
    geo.status === "ok" &&
    normalizeNeighborhood(geo.municipality || "") === normalizeNeighborhood("Bello")
  const geocodedOutsideBello =
    geo.status === "ok" &&
    !!geo.municipality &&
    !geocodedInsideBello
  const [deliveryEstimate, setDeliveryEstimate] = useState({
    status: "idle" as "idle" | "loading" | "ready" | "error",
    label: "Por confirmar",
    deliveryCost: null as number | null,
    distanceKm: null as number | null,
    distanceMethod: null as DeliveryEstimate["distanceMethod"],
    components: null as DeliveryEstimate["components"] | null,
  })
  const [deliveryEstimateError, setDeliveryEstimateError] = useState("")
  const [estimateRefresh, setEstimateRefresh] = useState(0)
  // Public list: guests also see each barrio's delivery time and cost
  useEffect(() => {
    const controller = new AbortController()
    setNeighborhoodsLoading(true)
    setNeighborhoodsError("")
    api<DeliveryNeighborhood[]>("/barrios", "GET", undefined, controller.signal)
      .then((items) => {
        setNeighborhoods(items)
        if (!items.length) setNeighborhoodsError("No hay barrios activos configurados en el servidor.")
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setNeighborhoods(fallbackNeighborhoods)
          setNeighborhoodsError((error as Error).message || "No se pudieron cargar los barrios.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setNeighborhoodsLoading(false)
      })
    return () => controller.abort()
  }, [user?.email])
  const [editingAddress, setEditingAddress] = useState(
    () => draft.editingAddress ?? !(user?.addresses?.length),
  )
  // Locate the address (1 s after the last change: OpenStreetMap allows ~1 search per second)
  const streetAddress = composeStreetAddress(addressParts)
  const geoQueries = [...new Set([
    streetAddress,
    [streetAddress, addressParts.barrio].filter(Boolean).join(", "),
  ].filter(Boolean))]
  const geoFallbackQuery = addressParts.barrio.trim()
  const geoKey = [...geoQueries, geoFallbackQuery].join("|")
  useEffect(() => {
    if (!isDelivery) {
      setGeo({ status: "idle" })
      return
    }
    if (!geoQueries.some(Boolean)) {
      setGeo({ status: "idle" })
      return
    }
    const controller = new AbortController()
    setGeo({ status: "loading" })
    setDeliveryEstimate((current) => ({
      ...current,
      status: "loading",
      label: "Calculando...",
      deliveryCost: null,
      distanceKm: null,
      distanceMethod: null,
      components: null,
    }))
    const timer = setTimeout(() => {
      geocodeAddress(geoQueries, controller.signal, geoFallbackQuery)
        .then((point) => {
          if (!point) return setGeo({ status: "notfound" })
          const km = distanceKm(SHOP_LOCATION, point)
          setGeo({ status: "ok", ...point, km })
          if (point.neighborhood && !addressParts.barrio) setAddressPart("barrio", point.neighborhood, false)
        })
        .catch((err) => {
          if ((err as Error).name !== "AbortError") setGeo({ status: "error" })
        })
    }, 1000)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [geoKey, addressRetry, isDelivery])
  useEffect(() => {
    if (
      isDelivery &&
      (geocodedOutsideBello ||
        ((!selectedNeighborhood || !isKnownBelloNeighborhood(selectedNeighborhood.nombre)) &&
          !geocodedInsideBello))
    ) {
      setDeliveryEstimate({
        status: "idle",
        label: "Fuera de cobertura",
        deliveryCost: null,
        distanceKm: null,
        distanceMethod: null,
        components: null,
      })
      setDeliveryEstimateError("")
      return
    }
    if (!user) {
      setDeliveryEstimate({
        status: "idle",
        label: "Inicia sesión para calcular",
        deliveryCost: null,
        distanceKm: null,
        distanceMethod: null,
        components: null,
      })
      setDeliveryEstimateError("")
      return
    }
    const controller = new AbortController()
    setDeliveryEstimateError("")
    setDeliveryEstimate((current) => ({
      ...current,
      status: "loading",
      label: "Consultando...",
      deliveryCost: null,
      distanceKm: null,
      distanceMethod: null,
      components: null,
    }))
    api<DeliveryEstimate>(
      DELIVERY_ESTIMATE_ENDPOINT,
      "POST",
      {
        tipo_entrega: deliveryMethod,
        ...(isDelivery && selectedNeighborhood && selectedNeighborhood.id_barrio !== null
          ? { id_barrio: selectedNeighborhood.id_barrio }
          : isDelivery && (selectedNeighborhood?.nombre || addressParts.barrio.trim())
            ? { nombre_barrio: selectedNeighborhood?.nombre || addressParts.barrio.trim() }
            : {}),
        ...(isDelivery ? { direccion: delivForm.direccion } : {}),
        ...(isDelivery && geo.status === "ok" && !geo.approximate && geo.lat !== undefined && geo.lon !== undefined
          ? { ubicacion: { lat: geo.lat, lon: geo.lon } }
          : {}),
        items: cart.filter((item) => item.qty > 0).map((item) => ({
          producto: item.name,
          cantidad: item.qty,
        })),
      },
      controller.signal,
    )
      .then((estimate) => {
        const range = estimate.minimumMinutes !== null && estimate.maximumMinutes !== null
          ? `${formatDuration(estimate.minimumMinutes)}–${formatDuration(estimate.maximumMinutes)}`
          : ""
        const totalLabel = estimate.estimatedMinutes !== null
          ? `${formatDuration(estimate.estimatedMinutes)}${range ? ` (rango ${range})` : ""}`
          : estimate.message || "Por confirmar"
        setDeliveryEstimate({
          status: "ready",
          label: totalLabel,
          deliveryCost: isDelivery ? estimate.deliveryCost ?? null : null,
          distanceKm: isDelivery ? estimate.distanceKm ?? null : null,
          distanceMethod: isDelivery ? estimate.distanceMethod ?? null : null,
          components: estimate.components ?? null,
        })
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setDeliveryEstimateError((error as Error).message || "No se pudo consultar el tiempo estimado.")
          setDeliveryEstimate({
            status: "error",
            label: "Por confirmar",
            deliveryCost: null,
            distanceKm: null,
            distanceMethod: null,
            components: null,
          })
        }
      })
    return () => controller.abort()
  }, [selectedNeighborhood?.id_barrio, selectedNeighborhood?.nombre, addressParts.barrio, delivForm.direccion, geo.status, geo.municipality, geo.lat, geo.lon, geocodedInsideBello, geocodedOutsideBello, user?.email, estimateRefresh, isDelivery, deliveryMethod, cart])
  useEffect(() => {
    if (!user) return
    const interval = window.setInterval(() => setEstimateRefresh((value) => value + 1), 30_000)
    return () => window.clearInterval(interval)
  }, [user?.email])
  const [deliverToOtherPerson, setDeliverToOtherPerson] = useState(!!draft.deliverToOtherPerson)
  const [saveAddress, setSaveAddress] = useState(
    () => draft.saveAddress ?? !(user?.addresses?.length),
  )
  // A saved address (shown, not edited, not saved again) or a new / recovered one (edited and offered to save)
  const chooseAddress = (parts: CheckoutAddressParts, edit: boolean, query: string | null = null, label?: string) => {
    const known = !!label && ADDRESS_LABELS.includes(label)
    setAddressParts(parts)
    setNeighborhoodQuery(query)
    setEditingAddress(edit)
    setSaveAddress(edit)
    setAddressLabel(!label ? "Casa" : known ? label : "Otra")
    setCustomAddressLabel(label && !known ? label : "")
  }
  // Offered only when it isn't empty and isn't one of the saved addresses already
  const previousAddress = (() => {
    const text = addressDraft ? composeDeliveryAddress(addressDraft.parts) : ""
    return addressDraft && text && !(user?.addresses ?? []).some((a) => addressLabelKey(a) === addressLabelKey(text)) ? addressDraft : null
  })()
  // While the client types an address, it's kept for next time
  useEffect(() => {
    if (!addressDraftKey || editedAddressKey.current !== addressDraftKey || !editingAddress) return
    saveLS(addressDraftKey, { parts: addressParts, neighborhoodQuery, label: addressLabel, customLabel: customAddressLabel })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressParts, neighborhoodQuery, addressLabel, customAddressLabel])
  // The address sent with the order is always the one its parts spell
  useEffect(() => {
    const direccion = composeDeliveryAddress(addressParts)
    setDelivForm((form) => (form.direccion === direccion ? form : { ...form, direccion }))
  }, [addressParts])
  const [deliveryTried, setDeliveryTried] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const markTouched = (key: string) => setTouched((current) => (current[key] ? current : { ...current, [key]: true }))
  const showErr = (key: string) => deliveryTried || !!touched[key]
  const toggleDeliveryRecipient = () => {
    const nextIsOtherPerson = !deliverToOtherPerson
    setDeliverToOtherPerson(nextIsOtherPerson)
    setDeliveryTried(false)
    setDelivForm((current) => ({
      ...current,
      nombre: nextIsOtherPerson ? "" : user?.name ?? "",
      telefono: nextIsOtherPerson ? "" : user?.phone ?? "",
    }))
  }
  // Prefill delivery data from the account as soon as there is one
  useEffect(() => {
    if (!user) {
      initializedAddressKey.current = ""
      editedAddressKey.current = ""
      return
    }
    const hasSavedAddress = !!user.addresses?.length
    setDelivForm((f) => ({
      ...f,
      nombre: f.nombre || user.name,
      telefono: f.telefono || user.phone || "",
    }))
    if (initializedAddressKey.current === addressDraftKey) return
    initializedAddressKey.current = addressDraftKey
    // After a reload the address the client was typing stays (not the saved one)
    if (draft.addressParts) return
    const savedAddress = user.addresses?.[0] || ""
    const savedParts = savedAddress ? addressPartsFromAddress(savedAddress) : EMPTY_CHECKOUT_ADDRESS_PARTS
    setAddressParts(savedParts)
    setEditingAddress(!hasSavedAddress)
    setSaveAddress(!hasSavedAddress)
  }, [user])
  const [voucher, setVoucher] = useState(draft.voucher ?? "")
  // What the validator checks: the amount sent
  const [voucherAmount, setVoucherAmount] = useState(draft.voucherAmount ?? "")
  // The receipt check found no transfer data and the client kept the image: the panel is told
  const [voucherDoubtful, setVoucherDoubtful] = useState(!!draft.voucherDoubtful)
  // Mixed payment: a part by transfer now and the rest in cash on delivery
  const [mixed, setMixed] = useState(!!draft.mixed)
  const [mixedTransfer, setMixedTransfer] = useState(draft.mixedTransfer ?? "")
  const [ordered, setOrdered] = useState(false)
  const [placedTotal, setPlacedTotal] = useState(0)
  // Everybody (guest, client, admin, employee) starts by reviewing the cart
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(user && draft.step ? draft.step : 1)
  useEffect(() => {
    try {
      if (ordered) sessionStorage.removeItem(DRAFT_KEY)
      else
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
          step: checkoutStep, delivForm, deliveryMethod, addressParts, deliverToOtherPerson, voucher, voucherAmount, voucherDoubtful, mixed, mixedTransfer,
          editingAddress, saveAddress, addressLabel, customAddressLabel,
        } satisfies CheckoutDraft))
    } catch {
      // Storage full or blocked: the checkout still works, it just won't survive a reload
    }
  }, [ordered, checkoutStep, delivForm, deliveryMethod, addressParts, deliverToOtherPerson, voucher, voucherAmount, voucherDoubtful, mixed, mixedTransfer, editingAddress, saveAddress, addressLabel, customAddressLabel])
  // Guests see only their cart until they press "Hacer pedido"
  const [showAuth, setShowAuth] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const subtotal = cartTotal(cart)
  const hasActiveItems = cart.some((item) => item.qty > 0)
  const activeCart = cart.filter((item) => item.qty > 0)
  const [orderError, setOrderError] = useState("")
  const [placing, setPlacing] = useState(false)
  const [showOutOfRangeDialog, setShowOutOfRangeDialog] = useState(false)
  // Everything still missing to place the order, each with why (shown together in one alert)
  const missingForOrder = () => {
    const r: string[] = []
    if (!delivForm.nombre.trim()) r.push("Escribe el nombre de quien recibe el pedido.")
    const phoneError = validatePhoneNumber(delivForm.telefono)
    if (phoneError) r.push(`Teléfono: ${phoneError}`)
    if (isDelivery) {
      if (!delivForm.direccion.trim() || !addressPartsValid) r.push("Completa la dirección de entrega (tipo de vía, número y placa) para saber a dónde llevarlo.")
      if (!selectedNeighborhood && !geocodedInsideBello) r.push("Elige tu barrio: con él calculamos el costo y el tiempo del domicilio.")
      else if (deliveryEstimate.status === "error") r.push("No pudimos calcular el costo del domicilio: toca «Reintentar» en el resumen del pedido.")
      else if (neighborhoodsLoading || !deliveryCostConfigured) r.push("Aún estamos calculando el costo del domicilio. Espera unos segundos y vuelve a intentarlo.")
    }
    if (deposit && !needsVoucher)
      r.push(`Tu pedido es de ${fmt(orderTotal)}: desde ${fmt(APPROVAL_MIN)} se paga el 50% por adelantado con transferencia. Elige Nequi o Bancolombia.`)
    if (isMixed) {
      if (!(mixedTransferAmount > 0)) r.push("Escribe cuánto vas a pagar por transferencia; el resto lo pagas en efectivo al recibir.")
      else if (deliveryCostConfigured && mixedTransferAmount >= orderTotal) r.push(`Para pagar una parte en efectivo, la transferencia debe ser menor que el total (${fmt(orderTotal)}).`)
      else if (deliveryCostConfigured && deposit && mixedTransferAmount < depositAmount) r.push(`Tu pedido es de ${fmt(APPROVAL_MIN)} o más: transfiere al menos la mitad (${fmt(depositAmount)}).`)
    }
    if (needsVoucher) {
      if (!voucher) r.push(`Sube la captura del comprobante de tu pago por ${delivForm.pago}: sin él no podemos confirmar el pago.`)
      if (!(Number(voucherAmount) > 0)) r.push("Escribe el valor que transferiste.")
      else if (deliveryCostConfigured && Number(voucherAmount) < toPay) r.push(`El valor transferido no alcanza: debes transferir ${fmt(toPay)}.`)
    }
    return r
  }
  const alertMissing = (r: string[]) =>
    appAlert(r.map((line) => `• ${line}`).join("\n"), r.length === 1 ? "Te falta algo para hacer el pedido" : `Te faltan ${r.length} cosas para hacer el pedido`)
  const placeOrder = async () => {
    setDeliveryTried(true)
    if (placing || !user || cart.length === 0) return
    const missing = missingForOrder()
    if (missing.length) return alertMissing(missing)
    if (!delivFilled || !deliveryCostConfigured || !payReady) return
    setOrderError("")
    setPlacing(true)
    try {
      const confirmedTotal = await onPlaceOrder(
        {
          ...delivForm,
          tipoEntrega: deliveryMethod,
          direccion: isDelivery
            ? delivForm.direccion
            : "Recoger en el local",
          barrio: isDelivery ? selectedNeighborhood?.nombre : undefined,
          barrioId: isDelivery ? selectedNeighborhood?.id_barrio ?? undefined : undefined,
          distanciaKm: undefined,
          ubicacion: isDelivery && !geo.approximate && geo.lat !== undefined && geo.lon !== undefined
            ? { lat: geo.lat, lon: geo.lon }
            : undefined,
          costoDomicilio: isDelivery ? displayedDeliveryCost : 0,
          voucher: needsVoucher ? voucher : undefined,
          voucherAmount: needsVoucher ? Number(voucherAmount) || undefined : undefined,
          voucherDoubtful: needsVoucher ? voucherDoubtful : undefined,
          mixedTransfer: isMixed ? mixedTransferAmount : undefined,
        },
        isDelivery && (saveAddress || !(user.addresses?.length)),
      )
      setPlacedTotal(
        typeof confirmedTotal === "number" && Number.isFinite(confirmedTotal)
          ? confirmedTotal
          : orderTotal,
      )
      // The order exists from here on: nothing below may make it look failed (and get it sent twice)
      setOrdered(true)
      if (isDelivery && editingAddress && addressLabelsKey && (saveAddress || !user.addresses?.length)) {
        saveLS(addressLabelsKey, {
          ...loadLS<Record<string, string>>(addressLabelsKey, {}),
          [addressLabelKey(delivForm.direccion)]: addressLabel === "Otra" ? customAddressLabel.trim() || "Otra" : addressLabel,
        })
      }
      // The address in the draft was used: it isn't «anterior» any more
      const storedDraft = addressDraftKey ? loadLS<AddressDraft | null>(addressDraftKey, null) : null
      if (isDelivery && storedDraft && composeDeliveryAddress(storedDraft.parts) === delivForm.direccion) {
        editedAddressKey.current = ""
        saveLS(addressDraftKey, null)
        setAddressDraft(null)
      }
    } catch (err) {
      setOrderError((err as Error).message)
      appAlert((err as Error).message, "No pudimos hacer tu pedido")
    } finally {
      setPlacing(false)
    }
  }
  const continueToReview = () => {
    setDeliveryTried(true)
    if (neighborhoodOutOfRange) {
      setShowOutOfRangeDialog(true)
      return
    }
    const missing = missingForOrder()
    if (missing.length) return alertMissing(missing)
    if (!delivFilled || !deliveryCostConfigured || !payReady) return
    setCheckoutStep(3)
  }
  // Nequi / Bancolombia must attach the payment receipt before continuing
  const needsVoucher = delivForm.pago !== "Efectivo"
  const displayedDeliveryCost =
    !isDelivery
      ? null
      : deliveryEstimate.deliveryCost
  const deliveryCostConfigured = !isDelivery || (
    displayedDeliveryCost !== null &&
    Number.isSafeInteger(displayedDeliveryCost) &&
    deliveryEstimate.status === "ready"
  )
  const orderTotal = subtotal + (displayedDeliveryCost ?? 0)
  // $150.000 or more: 50% in advance by transfer (cash isn't accepted), the rest when it arrives
  const deposit = orderTotal >= APPROVAL_MIN
  const depositAmount = depositOf(orderTotal)
  // Mixed (only with a transfer method): what goes by transfer now; the rest is cash on delivery
  const isMixed = mixed && needsVoucher
  const mixedTransferAmount = Number(mixedTransfer) || 0
  const mixedCash = Math.max(0, orderTotal - mixedTransferAmount)
  const toPay = isMixed && mixedTransferAmount > 0 ? mixedTransferAmount : deposit ? depositAmount : orderTotal
  const voucherComplete = !!voucher && Number(voucherAmount) >= toPay
  const payReady = (!needsVoucher || voucherComplete) && !(deposit && !needsVoucher)
  const neighborhoodOutOfRange =
    isDelivery &&
    !neighborhoodsLoading &&
    (geocodedOutsideBello ||
      (geo.status === "ok" && !geocodedInsideBello) ||
      ((!selectedNeighborhood || !isKnownBelloNeighborhood(selectedNeighborhood.nombre)) &&
        !geocodedInsideBello &&
        (geo.status === "notfound" || geo.status === "error")))
  const canShowDeliveryEstimate =
    !isDelivery ||
    (!neighborhoodOutOfRange &&
      (geocodedInsideBello ||
        (!!selectedNeighborhood && isKnownBelloNeighborhood(selectedNeighborhood.nombre))))
  const deliveryTimeParts = [
    deliveryEstimate.components?.dispatchWaitMinutes,
    deliveryEstimate.components?.travelMinutes,
  ].filter((minutes): minutes is number => minutes !== null && minutes !== undefined)
  const estimatedDeliveryMinutes = deliveryTimeParts.length
    ? deliveryTimeParts.reduce((total, minutes) => total + minutes, 0)
    : null
  const customerInfoFilled =
    !!delivForm.nombre.trim() &&
    !validatePhoneNumber(delivForm.telefono)
  const validAddressNumber = (value: string) => /^[0-9]+$/.test(value.trim())
  const validAddressLetter = (value: string) => /^[A-Za-z]?$/.test(value.trim())
  const validStreetType = (value: string) =>
    STREET_TYPES.some((type) => type === value) || value === "Circular"
  const addressPartsValid =
    validStreetType(addressParts.tipoVia) &&
    validAddressNumber(addressParts.numeroVia) &&
    validAddressLetter(addressParts.letraVia) &&
    (!addressParts.tipoViaSecundaria || validStreetType(addressParts.tipoViaSecundaria)) &&
    validAddressNumber(addressParts.numeroViaSecundaria) &&
    validAddressLetter(addressParts.letraViaSecundaria) &&
    validAddressNumber(addressParts.numeroPlaca) &&
    validAddressLetter(addressParts.letraPlaca)
  const delivFilled = customerInfoFilled && (
    !isDelivery ||
    (
      !!delivForm.direccion.trim() &&
      (!!selectedNeighborhood || geocodedInsideBello) &&
      addressPartsValid
    )
  )
  const canOrder = user && delivFilled && deliveryCostConfigured

  const [serverErr, setServerErr] = useState("")
  const [busy, setBusy] = useState(false)
  // Password, account existence and status are checked by the backend
  const { errors: loginErrors, touch: touchLogin, setTried: setLoginTried } = useLiveErrors(validateLogin(loginForm.email, loginForm.pass))
  const { errors: regErrors, touch: touchReg, setTried: setRegTried } = useLiveErrors(validateRegister(regForm))
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginTried(true)
    setServerErr("")
    if (busy || Object.keys(validateLogin(loginForm.email, loginForm.pass)).length) return
    setBusy(true)
    try {
      onLogin(await apiLogin(loginForm.email, loginForm.pass))
      setCheckoutStep(2)
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const handleRegisterForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegTried(true)
    setServerErr("")
    if (busy || Object.keys(validateRegister(regForm)).length) return
    const u: User = {
      name: `${regForm.name.trim()} ${regForm.lastname.trim()}`.trim(),
      email: regForm.email.trim().toLowerCase(),
      role: "user",
      docType: regForm.docType,
      phone: regForm.phone.replace(/\s/g, ""),
      cedula: regForm.docNum.trim(),
    }
    setBusy(true)
    try {
      await requestRegistrationCode(u, regForm.pass)
      setRegistrationPending(true)
      setServerErr("")
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerErr("")
    if (!/^\d{6}$/.test(registrationCode)) {
      setServerErr("El PIN debe tener 6 dígitos.")
      return
    }
    if (busy) return
    const u: User = {
      name: `${regForm.name.trim()} ${regForm.lastname.trim()}`.trim(),
      email: regForm.email.trim().toLowerCase(),
      role: "user",
      docType: regForm.docType,
      phone: regForm.phone.replace(/\s/g, ""),
      cedula: regForm.docNum.trim(),
    }
    setBusy(true)
    try {
      onLogin(toUser(await verifyRegistrationCode(u.email, registrationCode)))
      saveRegisteredClient(u)
      setCheckoutStep(2)
    } catch (err) {
      setServerErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const MUTED = "rgba(30,30,30,0.55)"
  const LINE = "rgba(30,30,30,0.08)"
  const CARD_ST = {
    background: "#fff",
    border: `1px solid ${LINE}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  }
  const PAY_OPTS = [
    { id: "Efectivo", desc: "Pagas al recibir tu pedido" },
    { id: "Nequi", desc: "Transferencia con código QR" },
    { id: "Bancolombia", desc: "Transferencia con código QR" },
  ]
  const cta = !user
    ? showAuth
      ? null
      : {
          label: "Hacer pedido",
          onClick: () => setShowAuth(true),
          disabled: !hasActiveItems,
        }
    : checkoutStep === 1
      ? {
          label: "Hacer pedido",
          onClick: () => setCheckoutStep(2),
          disabled: !hasActiveItems,
        }
    : checkoutStep === 2
      ? {
          label: "Confirma tus datos",
          onClick: continueToReview,
          disabled: cart.length === 0,
        }
      : {
          label: placing ? "Enviando pedido..." : "Confirmar pedido",
          onClick: placeOrder,
          // Not disabled when something is missing: pressing it says what and why
          disabled: placing || !hasActiveItems,
        }

  if (ordered)
    return (
      <div
        className="checkout-page min-h-screen flex items-center justify-center px-4"
        style={{ background: "#FAF5E8", fontFamily: "DM Sans, sans-serif" }}
      >
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl" style={CARD_ST}>
          {/* A little confetti falls once over the card */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className="order-confetti"
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: [C.mustard, C.red, C.forest, "#F2C230"][i % 4],
                  animationDelay: `${(i % 6) * 90}ms`,
                  animationDuration: `${1300 + (i % 5) * 180}ms`,
                  transform: `rotate(${i * 40}deg)`,
                }}
              />
            ))}
          </div>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${C.forest}, ${C.mustard})` }} />
          <div className="relative p-5 sm:p-7">
            <div className="text-center">
              <div
                className="order-success-pop mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${C.forest}12`, color: C.forest }}
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline className="order-success-check" points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.forest }}>
                Pedido recibido
              </span>
              <h2
                className="mt-1 text-2xl font-black"
                style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
              >
                ¡Pedido confirmado!
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed" style={{ color: MUTED }}>
                {delivForm.pago !== "Efectivo"
                  ? "Recibimos tu comprobante. El pedido queda pendiente de verificación; cuando se apruebe, se enviará a producción."
                  : placedTotal >= APPROVAL_MIN
                    ? "Por su valor, tu pedido quedó pendiente de confirmación por El Parche (abono del 50%)."
                    : "Recibimos tu pedido y pronto empezaremos a prepararlo."}{" "}
                Puedes seguir su estado en &quot;Mis pedidos&quot;.
              </p>
            </div>

            <div
              className="mt-5 rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: LINE, background: "#FCFBF8" }}
            >
              <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: LINE }}>
                <h3 className="text-sm font-bold" style={{ color: C.dark }}>Resumen del pedido</h3>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: C.forest, background: `${C.forest}10` }}>
                  {deliveryMethodLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-xl bg-white px-3 py-2.5">
                  <span className="block text-xs" style={{ color: MUTED }}>Recibe</span>
                  <span className="mt-0.5 block break-words text-sm font-semibold" style={{ color: C.dark }}>{delivForm.nombre}</span>
                </div>
                <div className="min-w-0 rounded-xl bg-white px-3 py-2.5">
                  <span className="block text-xs" style={{ color: MUTED }}>Método de pago</span>
                  <span className="mt-0.5 block break-words text-sm font-semibold" style={{ color: C.dark }}>{delivForm.pago}</span>
                </div>
              </div>
              {isDelivery && (
                <DeliveryAddressSummary address={delivForm.direccion} />
              )}
            </div>

            <button
              onClick={onComplete}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
            >
              Ver mis pedidos <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div
      className="checkout-page min-h-screen"
      style={{ background: "#FAF5E8", fontFamily: "DM Sans, sans-serif" }}
    >
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(250,245,232,0.95)",
          borderBottom: `1px solid ${LINE}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto grid min-h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:min-h-16 sm:gap-3 sm:px-6">
          <button
            onClick={onBack}
            className="justify-self-start text-left text-xs font-medium cursor-pointer hover:opacity-70 sm:text-sm"
            style={{ color: MUTED }}
          >
            ← Seguir comprando
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logoImg} alt="" className="h-12 w-14 object-contain sm:h-14 sm:w-[4.5rem]" />
            <span
              className="landing-brand-title whitespace-nowrap text-lg leading-tight sm:text-xl"
              style={{ color: "var(--brand-gold)" }}
            >
              EL PARCHE
            </span>
          </div>
          <span
            className="flex items-center gap-1.5 justify-self-end text-xs font-semibold"
            style={{ color: C.forest }}
          >
            {Ico.shield}
            <span className="hidden sm:inline">Compra segura</span>
          </span>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h1
            className="font-black text-2xl sm:text-3xl"
            style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
          >
            Finalizar mi pedido
          </h1>

          {/* Stepper */}
          <ol className="flex w-full max-w-lg items-center justify-between gap-2 sm:w-auto sm:flex-1">
            {["Identificación", "Entrega", "Revisión"].map((label, i) => {
              const step = (i + 1) as 1 | 2 | 3
              const done = checkoutStep > step
              const active = checkoutStep === step && !done
              const reachable =
                (step === 1 && !user) ||
                (step === 2 && !!user) ||
                (step === 3 && !!user && !!delivFilled && deliveryCostConfigured && payReady)
              return (
                <li key={label} className={`flex items-center ${i < 2 ? "sm:flex-1" : ""}`}>
                  <button
                    onClick={() => {
                      if (!reachable) return
                      setCheckoutStep(step)
                      if (step === 1) setShowAuth(true)
                    }}
                    className="flex items-center gap-1 sm:gap-2"
                    style={{ cursor: reachable ? "pointer" : "default" }}
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-8"
                      style={{
                        background: done || active ? "var(--brand-gold)" : "#fff",
                        color: done || active ? "#fff" : MUTED,
                        border: done || active ? "none" : "1.5px solid rgba(30,30,30,0.15)",
                      }}
                    >
                      {done ? Ico.check : step}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: done || active ? C.dark : MUTED }}
                    >
                      {label}
                    </span>
                  </button>
                  {i < 2 && (
                    <span
                      className="mx-2 hidden h-0.5 flex-1 rounded-full sm:block"
                      style={{ background: done ? "var(--brand-gold)" : "rgba(30,30,30,0.12)" }}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(17rem,30%)] xl:gap-5">
          {/* LEFT: current step */}
          <div className="flex flex-col gap-4 min-w-0">
            {checkoutStep === 1 && !showAuth && (
              <section className="p-6 rounded-2xl" style={CARD_ST}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h2 className="font-bold text-lg" style={{ color: C.dark }}>
                    Tu carrito
                  </h2>
                  <button
                    onClick={() => setPickerOpen((open) => !open)}
                    aria-expanded={pickerOpen}
                    className="flex-shrink-0 mt-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer hover:opacity-80"
                    style={{
                      border: `1.5px dashed ${C.mustard}`,
                      color: C.mustard,
                      background: "#fff",
                    }}
                  >
                    {pickerOpen ? "× Cerrar menú" : "+ Agregar más productos"}
                  </button>
                </div>
                {pickerOpen && (
                  <div className="mb-5 mt-3 rounded-2xl p-3 sm:p-4" style={{ background: "#FAF5E8", border: `1px solid ${LINE}` }}>
                    <ProductCatalog
                      dark={false}
                      onAddClick={(product) => {
                        setAddProduct(product)
                        setPickerOpen(false)
                      }}
                      compact
                    />
                  </div>
                )}
                <p className="text-sm mb-5" style={{ color: MUTED }}>
                  Revisa tus productos antes de hacer el pedido.
                </p>
                <CartSummary cart={cart} setCart={setCart} dark={false} showTotals={false} />
              </section>
            )}

            {!user && showAuth && (
              <section className="p-4 sm:p-5 rounded-2xl" style={CARD_ST}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="flex items-center gap-2 font-bold text-lg" style={{ color: C.dark }}>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${C.mustard}16`, color: C.mustard }}
                    >
                      {Ico.user}
                    </span>
                    Identifícate
                  </h2>
                  <button
                    onClick={() => setShowAuth(false)}
                    className="text-xs font-semibold cursor-pointer hover:opacity-70"
                    style={{ color: C.mustard }}
                  >
                    ← Volver al carrito
                  </button>
                </div>
                <p className="text-sm mb-4" style={{ color: MUTED }}>
                  Inicia sesión o crea tu cuenta para guardar tu pedido y
                  seguir su estado.
                </p>
                <div
                  className="flex rounded-xl overflow-hidden mb-4 p-1"
                  style={{ background: "rgba(30,30,30,0.06)" }}
                >
                  {(["login", "register"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setAuthTab(tab)
                        setServerErr("")
                      }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                      style={{
                        background: authTab === tab ? "#fff" : "transparent",
                        color: authTab === tab ? C.dark : "rgba(30,30,30,0.5)",
                        boxShadow:
                          authTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      {tab === "login" ? "Iniciar sesión" : "Registrarse"}
                    </button>
                  ))}
                </div>
                {authTab === "login" && (
                  <form onSubmit={handleLogin} noValidate className="flex flex-col gap-3">
                    <InputField
                      label="Correo"
                      type="email"
                      placeholder="tu@correo.com"
                      value={loginForm.email}
                      onChange={(v) =>
                        setLoginForm((f) => ({ ...f, email: v }))
                      }
                      required
                      onBlur={touchLogin("email")}
                      error={loginErrors.email}
                    />
                    <InputField
                      label="Contraseña"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.pass}
                      onChange={(v) => setLoginForm((f) => ({ ...f, pass: v }))}
                      required
                      onBlur={touchLogin("pass")}
                      error={loginErrors.pass}
                    />
                    <button
                      type="button"
                      onClick={onForgot}
                      className="cursor-pointer self-end text-xs"
                      style={{ color: C.mustard }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                    <FieldError msg={serverErr} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                      style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
                    >
                      {busy ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                  </form>
                )}
                {authTab === "register" && (
                  <form
                    onSubmit={registrationPending ? handleVerifyRegister : handleRegisterForm}
                    noValidate
                    className={`flex flex-col gap-2.5 ${registrationPending ? "mx-auto w-full max-w-[23rem]" : ""}`}
                  >
                    {registrationPending ? (
                      <>
                        <p className="text-sm" style={{ color: MUTED }}>
                          Ingresa el PIN de 6 dígitos que enviamos a <strong>{regForm.email}</strong>.
                        </p>
                        <PinCodeField
                          label="PIN de verificación"
                          value={registrationCode}
                          onChange={(value) => setRegistrationCode(value)}
                        />
                        <FieldError msg={serverErr} />
                        <button
                          type="submit"
                          disabled={busy}
                          className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
                          style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
                        >
                          {busy ? "Verificando..." : "Verificar y continuar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationPending(false)
                            setRegistrationCode("")
                            setServerErr("")
                          }}
                          className="w-full py-2 rounded-xl text-sm cursor-pointer"
                          style={{ background: "rgba(30,30,30,0.05)", color: MUTED }}
                        >
                          Corregir mis datos
                        </button>
                      </>
                    ) : (
                    <>
                    <div className="grid sm:grid-cols-2 gap-2.5 items-start">
                    <div className="flex flex-col gap-1 min-w-0">
                      <label
                        className="text-xs font-semibold"
                        style={{ color: "rgba(30,30,30,0.5)" }}
                      >
                        Tipo de documento *
                      </label>
                      <select
                        value={regForm.docType}
                        onChange={(e) => {
                          const docType = e.target.value
                          setRegForm((current) => ({
                            ...current,
                            docType,
                            docNum: normalizeAccountDocumentInput(current.docNum, docType),
                          }))
                          touchReg("docType")()
                        }}
                        onBlur={touchReg("docType")}
                        aria-invalid={!!regErrors.docType}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                        style={{
                          background: "rgba(30,30,30,0.05)",
                          border: `1.5px solid ${regErrors.docType ? C.red : "rgba(30,30,30,0.12)"}`,
                          color: regForm.docType
                            ? "#1A1714"
                            : "rgba(30,30,30,0.35)",
                        }}
                      >
                        <option value="">Tipo de documento...</option>
                        {DOC_TYPES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <FieldError msg={regErrors.docType} />
                    </div>
                    <InputField
                      label="Nº Documento *"
                      placeholder="123456789"
                      value={regForm.docNum}
                      onChange={(v) => setRegForm((current) => ({
                        ...current,
                        docNum: normalizeAccountDocumentInput(v, current.docType),
                      }))}
                      required
                      onBlur={touchReg("docNum")}
                      error={regErrors.docNum}
                    />
                    </div>
                    <InputField
                      label="Nombre *"
                      placeholder="Tu nombre"
                      value={regForm.name}
                      onChange={(v) => setRegForm((f) => ({ ...f, name: v }))}
                      required
                      onBlur={touchReg("name")}
                      error={regErrors.name}
                    />
                    <InputField
                      label="Apellido *"
                      placeholder="Tu apellido"
                      value={regForm.lastname}
                      onChange={(v) => setRegForm((f) => ({ ...f, lastname: v }))}
                      required
                      onBlur={touchReg("lastname")}
                      error={regErrors.lastname}
                    />
                    <InputField
                      label="Teléfono"
                      type="tel"
                      placeholder="3XX XXX XXXX"
                      value={regForm.phone}
                      onChange={(v) => setRegForm((f) => ({ ...f, phone: digitsOnly(v).slice(0, 10) }))}
                      onBlur={touchReg("phone")}
                      error={regErrors.phone}
                    />
                    <InputField
                      label="Correo *"
                      type="email"
                      placeholder="tu@correo.com"
                      value={regForm.email}
                      onChange={(v) => setRegForm((f) => ({ ...f, email: v }))}
                      required
                      onBlur={touchReg("email")}
                      error={regErrors.email}
                    />
                    <InputField
                      label="Contraseña *"
                      type="password"
                      placeholder="••••••••"
                      value={regForm.pass}
                      onChange={(v) => setRegForm((f) => ({ ...f, pass: v }))}
                      required
                      onBlur={touchReg("pass")}
                      error={regForm.pass ? undefined : regErrors.pass}
                    />
                    <div className="-mt-1">
                      <PasswordChecklist pass={regForm.pass} pass2={regForm.pass2} strict={!!regErrors.pass} />
                    </div>
                    <InputField
                      label="Confirmar *"
                      type="password"
                      placeholder="••••••••"
                      value={regForm.pass2}
                      onChange={(v) => setRegForm((f) => ({ ...f, pass2: v }))}
                      required
                      onBlur={touchReg("pass2")}
                      error={regErrors.pass2}
                    />
                    <FieldError msg={serverErr} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
                      style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
                    >
                      {busy ? "Enviando PIN..." : "Enviar PIN y continuar"}
                    </button>
                    </>
                    )}
                  </form>
                )}
              </section>
            )}

            {user && checkoutStep === 2 && (
              <>
                <section className="rounded-2xl p-4 sm:p-5" style={CARD_ST}>
                  <h2 className="font-bold text-lg mb-3" style={{ color: C.dark }}>
                    Datos del pedido
                  </h2>
                  <fieldset className="mb-3">
                    <legend className="checkout-delivery-question mb-2 text-xs font-semibold text-black">
                      ¿Cómo quieres recibir tu pedido?
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([
                        ["domicilio", "Pedir a domicilio", "Lo llevamos empacado a tu dirección"],
                        ["recoger", "Recoger pedido", "Lo empacamos para llevar; pasas por él"],
                      ] as const).map(([method, label, hint]) => {
                        const selected = deliveryMethod === method
                        return (
                          <button
                            key={method}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setDeliveryMethod(method)}
                            className="rounded-xl border px-2 py-2 text-sm font-semibold transition-colors"
                            style={{
                              borderColor: selected ? C.mustard : LINE,
                              background: selected ? `${C.mustard}12` : "#fff",
                              color: selected ? "var(--checkout-heading-gold)" : MUTED,
                            }}
                          >
                            {label}
                            <span className="mt-0.5 block text-xs font-normal" style={{ color: MUTED }}>{hint}</span>
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={deliverToOtherPerson}
                    onClick={toggleDeliveryRecipient}
                    className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-left transition-colors"
                    style={{
                      background: deliverToOtherPerson ? `${C.mustard}12` : "rgba(30,30,30,0.03)",
                      border: `1px solid ${deliverToOtherPerson ? `${C.mustard}70` : LINE}`,
                    }}
                  >
                    <span className="min-w-0">
                      <strong className="block text-sm text-black">
                        El pedido lo recibe otra persona
                      </strong>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors"
                      style={{ background: deliverToOtherPerson ? C.mustard : "rgba(30,30,30,0.18)" }}
                    >
                      <span
                        className="h-4 w-4 rounded-full bg-white transition-transform"
                        style={{ transform: deliverToOtherPerson ? "translateX(16px)" : "translateX(0)" }}
                      />
                    </span>
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      ["nombre", deliverToOtherPerson ? "Nombre de quien recibe *" : "Nombre completo *", "text", "Quién recibe"],
                      ["telefono", deliverToOtherPerson ? "Teléfono de quien recibe *" : "Teléfono *", "tel", "3XX XXX XXXX"],
                    ].map(([k, lbl, t, ph]) => (
                      <div key={k}>
                        <InputField
                          label={lbl}
                          type={t}
                          placeholder={ph}
                          value={delivForm[k as keyof typeof delivForm]}
                          onChange={(v) => {
                            setDelivForm((f) => ({ ...f, [k]: v }))
                            markTouched(k)
                          }}
                          onBlur={() => markTouched(k)}
                          required={k === "nombre" || k === "telefono"}
                          error={
                            showErr(k) &&
                            k === "nombre" &&
                            !delivForm.nombre.trim()
                              ? "El nombre es obligatorio."
                              : showErr(k) && k === "telefono"
                                ? delivForm.telefono.trim()
                                  ? validatePhoneNumber(delivForm.telefono)
                                  : "El teléfono es obligatorio."
                                : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {isDelivery && (
                    <div className="mt-3">
                    <section className="mb-3 rounded-2xl border px-3 py-2.5" style={{ background: "#FFFCF5", borderColor: LINE }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold">Direcciones guardadas</h3>
                        {(!!user.addresses?.length || previousAddress) && (
                          <button
                            type="button"
                            onClick={() => chooseAddress(EMPTY_CHECKOUT_ADDRESS_PARTS, true)}
                            className="cursor-pointer px-2 py-1 text-xs font-bold hover:underline"
                            style={{ color: C.mustard }}
                          >
                            Escribir otra dirección
                          </button>
                        )}
                      </div>
                      {!user.addresses?.length && !previousAddress && (
                        <p className="mt-1 text-xs" style={{ color: MUTED }}>Aún no tienes direcciones guardadas.</p>
                      )}
                      {(!!user.addresses?.length || previousAddress) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[...new Set(user.addresses ?? [])].map((address) => {
                            const parts = addressPartsFromAddress(address)
                            const label = savedAddressLabels[addressLabelKey(address)]
                            const selected = !editingAddress && delivForm.direccion === composeDeliveryAddress(parts)
                            return (
                              <button
                                key={address}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => chooseAddress(parts, false, null, label)}
                                className="flex max-w-full cursor-pointer items-center gap-1.5 border bg-white px-3 py-1.5 text-left text-xs font-semibold"
                                style={{ borderColor: selected ? C.mustard : LINE, color: selected ? C.mustard : C.dark }}
                              >
                                <span className="shrink-0" aria-hidden="true">{Ico.mapPin}</span>
                                <span className="min-w-0 break-words">
                                  {label && <strong className="mr-1.5" style={{ color: C.mustard }}>{label} ·</strong>}
                                  {address}
                                </span>
                              </button>
                            )
                          })}
                          {previousAddress && (
                            <button
                              type="button"
                              onClick={() => {
                                chooseAddress(previousAddress.parts, true, previousAddress.neighborhoodQuery, previousAddress.label)
                                setCustomAddressLabel(previousAddress.customLabel ?? "")
                              }}
                              className="cursor-pointer border px-3 py-1.5 text-left text-xs font-bold"
                              style={{ background: "#F7EDD5", borderColor: "#E9D8AD", color: C.mustard }}
                            >
                              Recuperar dirección anterior
                            </button>
                          )}
                        </div>
                      )}
                    </section>
                    {editingAddress && (
                      <fieldset className="mb-3">
                        <legend className="mb-1.5 text-xs font-semibold">Tipo de dirección</legend>
                        <div className="flex flex-wrap gap-2">
                          {addressLabels.map((label) => (
                            <label
                              key={label}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                              style={{ borderColor: addressLabel === label ? C.mustard : LINE, background: addressLabel === label ? "#F7EDD5" : "#fff" }}
                            >
                              <input
                                type="radio"
                                name="checkout-address-label"
                                value={label}
                                checked={addressLabel === label}
                                className="accent-black"
                                onChange={() => {
                                  editedAddressKey.current = addressDraftKey
                                  setAddressLabel(label)
                                  setSaveAddress(true)
                                }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                        {addressLabel === "Otra" && (
                          <label className="mt-2 flex max-w-sm flex-col gap-1 text-xs font-semibold">
                            Nombre de la dirección (opcional)
                            <input
                              type="text"
                              value={customAddressLabel}
                              maxLength={40}
                              placeholder="Ej: Casa de mi mamá"
                              className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-normal text-black"
                              style={{ borderColor: LINE }}
                              onChange={(event) => {
                                editedAddressKey.current = addressDraftKey
                                setCustomAddressLabel(event.target.value)
                                setSaveAddress(true)
                              }}
                            />
                          </label>
                        )}
                      </fieldset>
                    )}
                    {!editingAddress && (
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingAddress(true)}
                          className="cursor-pointer text-xs font-bold"
                          style={{ color: C.mustard }}
                        >
                          Editar dirección seleccionada
                        </button>
                      </div>
                    )}
                    <div className="mb-3">
                      <NeighborhoodSearch
                        value={addressParts.barrio}
                        query={neighborhoodQuery ?? addressParts.barrio}
                        neighborhoods={neighborhoods}
                        loading={neighborhoodsLoading}
                        loadError={neighborhoodsError}
                        onQueryChange={(query) => {
                          editedAddressKey.current = addressDraftKey
                          setNeighborhoodQuery(query)
                          markTouched("barrio")
                        }}
                        onSelect={(n) => {
                          setAddressPart("barrio", n === null ? "" : typeof n === "string" ? n : n.nombre)
                          setNeighborhoodQuery(null)
                        }}
                        error={showErr("barrio") && isDelivery && !selectedNeighborhood && !geocodedInsideBello
                          ? "Elige un barrio habilitado o verifica que la dirección esté en Bello."
                          : undefined}
                      />
                      {!neighborhoodOutOfRange &&
                        selectedNeighborhood &&
                        (isKnownBelloNeighborhood(selectedNeighborhood.nombre) || geocodedInsideBello) && (
                        <p
                          className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold"
                          style={{ background: `${C.mustard}12`, color: C.mustard }}
                        >
                          {selectedNeighborhood.costo_domicilio_cop != null
                            ? `Domicilio a ${selectedNeighborhood.nombre}: ${fmt(selectedNeighborhood.costo_domicilio_cop)}${selectedNeighborhood.tiempo_desplazamiento_minutos != null ? ` · ${selectedNeighborhood.tiempo_desplazamiento_minutos} min de recorrido` : ""}.`
                            : `Calcularemos el costo y el tiempo para ${selectedNeighborhood.nombre}.`}
                        </p>
                      )}
                      {(geo.status === "notfound" || geo.status === "error") && (
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-xs" role="status" style={{ color: MUTED }}>
                            {geo.status === "notfound"
                              ? "No pudimos ubicar automáticamente la dirección. Si el barrio está habilitado, puedes continuar."
                              : "No se pudo consultar el mapa; puedes continuar si el barrio está habilitado."}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddressRetry((value) => value + 1)}
                            className="flex-shrink-0 text-xs font-bold underline"
                            style={{ color: C.mustard }}
                          >
                            Reintentar
                          </button>
                        </div>
                      )}
                      {neighborhoodOutOfRange && (
                        <div
                          className="mt-3 flex items-start gap-3 rounded-xl border p-3.5"
                          role="alert"
                          style={{ background: "#FFF7E6", borderColor: "#E8C66A", color: "#76520A" }}
                        >
                          <span
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
                            aria-hidden="true"
                            style={{ background: "#F5E3B0", color: "#8A5E00" }}
                          >
                            !
                          </span>
                          <div>
                            <p className="text-sm font-bold">
                              {geocodedOutsideBello
                                ? `Por ahora solo tenemos domicilios en Bello${geo.municipality ? `, no en ${geo.municipality}` : ""}.`
                                : "No pudimos confirmar que este barrio esté dentro de la cobertura en Bello."}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed">
                              {geocodedOutsideBello
                                ? "Puedes corregir la dirección o continuar para recoger el pedido en el local. No se cobrará domicilio."
                                : "Verifica la dirección y selecciona un barrio habilitado de Bello, o continúa para recoger el pedido en el local."}
                            </p>
                          </div>
                        </div>
                      )}
                      {neighborhoodsError && (
                        <p className="mt-2 text-xs" role="alert" style={{ color: C.red }}>
                          No se pudo comprobar la cobertura: {neighborhoodsError}
                        </p>
                      )}
                    </div>
                    {editingAddress ? (
                      <div className="grid gap-x-3 gap-y-2 grid-cols-2 sm:grid-cols-3">
                        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: "rgba(30,30,30,0.5)" }}>
                          Tipo de vía *
                          <select
                            required
                            value={addressParts.tipoVia}
                            onChange={(event) => setAddressPart("tipoVia", event.target.value)}
                            aria-invalid={showErr("tipoVia") && !addressParts.tipoVia}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                            style={{
                              background: "rgba(30,30,30,0.05)",
                              border: `1.5px solid ${showErr("tipoVia") && !addressParts.tipoVia ? C.red : "rgba(30,30,30,0.12)"}`,
                              color: C.dark,
                            }}
                          >
                            <option value="">Selecciona el tipo de vía</option>
                            {[...STREET_TYPES, ...(addressParts.tipoVia === "Circular" ? ["Circular"] : [])].map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          {showErr("tipoVia") && !addressParts.tipoVia && (
                            <span className="text-xs font-normal" role="alert" style={{ color: C.red }}>Selecciona el tipo de vía.</span>
                          )}
                        </label>
                        <InputField
                          label="Número *"
                          placeholder="Ej: 49"
                          value={addressParts.numeroVia}
                          onChange={(value) => setAddressPart("numeroVia", value)}
                          onBlur={() => markTouched("numeroVia")}
                          required
                          error={showErr("numeroVia")
                            ? !addressParts.numeroVia.trim()
                              ? "Ingresa el número."
                              : !validAddressNumber(addressParts.numeroVia)
                                ? "Usa solo números."
                                : undefined
                            : undefined}
                        />
                        <InputField
                          label="Letra (opcional)"
                          placeholder="Ej: A"
                          value={addressParts.letraVia}
                          onChange={(value) => setAddressPart("letraVia", value.toUpperCase())}
                          error={showErr("letraVia") && !validAddressLetter(addressParts.letraVia)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: "rgba(30,30,30,0.5)" }}>
                          Tipo de vía (opcional)
                          <select
                            value={addressParts.tipoViaSecundaria}
                            onChange={(event) => setAddressPart("tipoViaSecundaria", event.target.value)}
                            aria-invalid={showErr("tipoViaSecundaria") && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria)}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                            style={{
                              background: "rgba(30,30,30,0.05)",
                              border: `1.5px solid ${showErr("tipoViaSecundaria") && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria) ? C.red : "rgba(30,30,30,0.12)"}`,
                              color: C.dark,
                            }}
                          >
                            <option value="">Selecciona el tipo de vía</option>
                            {[...STREET_TYPES, ...(addressParts.tipoViaSecundaria === "Circular" ? ["Circular"] : [])].map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          {showErr("tipoViaSecundaria") && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria) && (
                            <span className="text-xs font-normal" role="alert" style={{ color: C.red }}>Selecciona el tipo de vía.</span>
                          )}
                        </label>
                        <InputField
                          label="Número *"
                          placeholder="Ej: 57"
                          value={addressParts.numeroViaSecundaria}
                          onChange={(value) => setAddressPart("numeroViaSecundaria", value)}
                          onBlur={() => markTouched("numeroViaSecundaria")}
                          required
                          error={showErr("numeroViaSecundaria")
                            ? !addressParts.numeroViaSecundaria.trim()
                              ? "Ingresa el segundo número."
                              : !validAddressNumber(addressParts.numeroViaSecundaria)
                                ? "Usa solo números."
                                : undefined
                            : undefined}
                        />
                        <InputField
                          label="Letra (opcional)"
                          placeholder="Ej: A"
                          value={addressParts.letraViaSecundaria}
                          onChange={(value) => setAddressPart("letraViaSecundaria", value.toUpperCase())}
                          error={showErr("letraViaSecundaria") && !validAddressLetter(addressParts.letraViaSecundaria)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <InputField
                          label="Número *"
                          placeholder="Ej: 18"
                          value={addressParts.numeroPlaca}
                          onChange={(value) => setAddressPart("numeroPlaca", value)}
                          onBlur={() => markTouched("numeroPlaca")}
                          required
                          error={showErr("numeroPlaca")
                            ? !addressParts.numeroPlaca.trim()
                              ? "Ingresa el tercer número."
                              : !validAddressNumber(addressParts.numeroPlaca)
                                ? "Usa solo números."
                                : undefined
                            : undefined}
                        />
                        <InputField
                          label="Letra (opcional)"
                          placeholder="Ej: C"
                          value={addressParts.letraPlaca}
                          onChange={(value) => setAddressPart("letraPlaca", value.toUpperCase())}
                          error={showErr("letraPlaca") && !validAddressLetter(addressParts.letraPlaca)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <div className="col-span-full">
                          <InputField
                            label="Complemento (opcional)"
                            placeholder="Ej: apartamento 301, torre 2, interior, piso o local"
                            value={addressParts.complemento}
                            onChange={(value) => setAddressPart("complemento", value)}
                          />
                        </div>
                        <div className="col-span-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(30,30,30,0.04)", color: C.dark }}>
                          <span className="block text-xs font-semibold" style={{ color: MUTED }}>Dirección completa</span>
                          {composeDeliveryAddress(addressParts) || "Completa los campos para generar la dirección."}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="px-4 py-3 rounded-xl text-sm"
                          style={{ background: "rgba(30,30,30,0.04)", color: C.dark }}
                        >
                          {delivForm.direccion}
                        </div>
                        {deliveryTried && !addressPartsValid && (
                          <p className="mt-1 text-xs" role="alert" style={{ color: C.red }}>
                            Esta dirección guardada no tiene todos los datos requeridos. Pulsa «Editar dirección seleccionada» para completarlos.
                          </p>
                        )}
                      </>
                    )}
                    <label className="flex items-start gap-2 mt-2 text-xs cursor-pointer" style={{ color: MUTED }}>
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(event) => setSaveAddress(event.target.checked)}
                        disabled={!user.addresses?.length}
                        className="mt-0.5 accent-amber-700"
                      />
                      <span>
                        {user.addresses?.length
                          ? "Guardar esta dirección en mi perfil para futuras compras"
                          : "Esta primera dirección se guardará en tu perfil para futuras compras"}
                      </span>
                    </label>
                    </div>
                  )}
                  <label className="mt-5 block">
                    <span className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--checkout-heading-gold)" }}>
                        {isDelivery ? "Indicaciones adicionales" : "Notas para el pedido"} <span className="font-normal" style={{ color: MUTED }}>(opcional)</span>
                      </span>
                      <span className="text-[10px]" style={{ color: MUTED }}>{delivForm.notas.length}/200</span>
                    </span>
                    <textarea
                      value={delivForm.notas}
                      onChange={(e) => setDelivForm((f) => ({ ...f, notas: e.target.value.slice(0, 200) }))}
                      rows={2}
                      placeholder={isDelivery
                        ? "Ej: portería, color de la casa o llamar al llegar"
                        : "Ej: sin cebolla, el timbre no sirve, llamar al llegar"}
                      className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(30,30,30,0.04)", border: `1px solid ${LINE}`, color: C.dark }}
                    />
                  </label>
                </section>
                <section className="rounded-2xl p-4 sm:p-5" style={CARD_ST}>
                  <h2 className="font-bold text-lg mb-3" style={{ color: C.dark }}>
                    Método de pago
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {PAY_OPTS.map((m) => {
                      const sel = delivForm.pago === m.id
                      const off = deposit && m.id === "Efectivo"
                      return (
                        <button
                          key={m.id}
                          disabled={off}
                          onClick={() => setDelivForm((f) => ({ ...f, pago: m.id }))}
                          className="flex min-w-0 items-center gap-2.5 px-4 py-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                          style={{
                            border: `1.5px solid ${sel && !off ? C.mustard : LINE}`,
                            background: sel && !off ? `${C.mustard}0D` : "#fff",
                          }}
                        >
                          <PaymentMethodIcon method={m.id} />
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold text-sm" style={{ color: C.dark }}>
                              {m.id}
                            </span>
                            <span className="mt-0.5 block text-xs" style={{ color: MUTED }}>
                              {off ? "No disponible: este pedido se abona por transferencia" : m.desc}
                            </span>
                          </div>
                          <span
                            aria-hidden="true"
                            className="size-4 shrink-0 rounded-full"
                            style={{
                              border: `1.5px solid ${sel ? C.mustard : "rgba(30,30,30,0.25)"}`,
                              boxShadow: sel ? `inset 0 0 0 3px #fff, inset 0 0 0 8px ${C.mustard}` : "none",
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                  {needsVoucher && (
                    <div className="mt-4 rounded-xl p-3.5 text-sm" style={{ background: isMixed ? `${C.mustard}0D` : "rgba(30,30,30,0.03)", border: `1.5px solid ${isMixed ? `${C.mustard}55` : LINE}` }}>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={mixed}
                          onChange={(e) => {
                            setMixed(e.target.checked)
                            // A first split: half (or the deposit), the rest in cash
                            if (e.target.checked && !mixedTransfer && deliveryCostConfigured) setMixedTransfer(String(deposit ? depositAmount : Math.ceil(orderTotal / 2)))
                            setVoucherAmount("")
                          }}
                          className="mt-0.5 size-4 cursor-pointer accent-[#8F6C12]"
                        />
                        <span>
                          <span className="block font-semibold" style={{ color: C.dark }}>Pagar una parte en efectivo al recibir</span>
                          <span className="block text-xs" style={{ color: MUTED }}>Transfieres una parte ahora por {delivForm.pago} y el resto lo pagas en efectivo cuando te llegue.</span>
                        </span>
                      </label>
                      {isMixed && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: MUTED }}>
                            Por {delivForm.pago} (ahora)
                            <span className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5" style={{ border: `1.5px solid ${LINE}` }}>
                              <span>$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={mixedTransferAmount ? mixedTransferAmount.toLocaleString("es-CO") : ""}
                                onChange={(e) => {
                                  setMixedTransfer(e.target.value.replace(/\D/g, ""))
                                  setVoucherAmount("")
                                }}
                                placeholder={String(Math.ceil(orderTotal / 2))}
                                aria-label="Valor por transferencia"
                                className="w-full bg-transparent text-sm font-semibold outline-none"
                                style={{ color: C.dark }}
                              />
                            </span>
                          </label>
                          <div className="flex flex-col gap-1 text-xs font-semibold" style={{ color: MUTED }}>
                            En efectivo (al recibir)
                            <span className="rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "rgba(30,30,30,0.04)", color: mixedTransferAmount > 0 && mixedTransferAmount < orderTotal ? C.dark : MUTED }}>
                              {mixedTransferAmount > 0 && mixedTransferAmount < orderTotal ? fmt(mixedCash) : "—"}
                            </span>
                          </div>
                          {deposit && <span className="text-[11px] sm:col-span-2" style={{ color: MUTED }}>Por ser de {fmt(APPROVAL_MIN)} o más, transfiere al menos la mitad ({fmt(depositAmount)}).</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {deposit && deliveryCostConfigured && !isMixed && (
                    <div role="note" className="mt-4 rounded-xl p-3 text-sm" style={{ background: `${C.mustard}12`, border: `1.5px solid ${C.mustard}55`, color: C.dark }}>
                      <strong className="block">Pedido de {fmt(APPROVAL_MIN)} o más: abona el 50%</strong>
                      Paga ahora {fmt(depositAmount)} por Nequi o Bancolombia y sube el comprobante. El saldo de {fmt(orderTotal - depositAmount)} lo pagas al recibir tu pedido.
                      {delivForm.pago === "Efectivo" && <span className="mt-1 block font-semibold" style={{ color: C.red }}>Elige Nequi o Bancolombia para continuar.</span>}
                    </div>
                  )}
                  {needsVoucher && (
                    <div className="mt-5 flex flex-col gap-4 rounded-xl p-5" style={{ background: "rgba(30,30,30,0.03)", border: `1px solid ${LINE}` }}>
                      <div>
                        <h3 className="mb-1 text-sm font-semibold" style={{ color: C.dark }}>
                          Paga con {delivForm.pago} y sube el comprobante
                        </h3>
                        <ol className="list-decimal space-y-1 pl-4 text-xs" style={{ color: MUTED }}>
                          <li>Escanea el QR o transfiere a la cuenta o a una de las llaves.</li>
                          <li>{isMixed ? `Transfiere ${mixedTransferAmount ? fmt(mixedTransferAmount) : "la parte que elegiste"}; los ${fmt(mixedCash)} restantes los pagas en efectivo al recibir.` : deposit ? `Paga el abono exacto (${fmt(depositAmount)}); el saldo (${fmt(orderTotal - depositAmount)}) al recibir.` : "Paga el total exacto."}</li>
                          <li>Sube la captura del comprobante y escribe el valor que transferiste.</li>
                        </ol>
                      </div>
                      <PaymentAccounts amount={deliveryCostConfigured ? `${fmt(toPay)}${isMixed ? " (por transferencia)" : deposit ? " (abono 50%)" : ""}` : "Por confirmar"} />
                      <VoucherInput
                        value={voucher}
                        onChange={(v, doubtful) => {
                          setVoucher(v)
                          setVoucherDoubtful(!!doubtful)
                          if (!voucherAmount && deliveryCostConfigured) setVoucherAmount(String(toPay))
                        }}
                        onRemove={() => {
                          setVoucher("")
                          setVoucherDoubtful(false)
                        }}
                        reference={{ amount: voucherAmount, expected: deliveryCostConfigured ? toPay : undefined, onAmount: setVoucherAmount }}
                      />
                    </div>
                  )}
                </section>
              </>
            )}

            {user && checkoutStep === 3 && (
              <section className="min-w-0 space-y-4">
                <div
                  className="relative isolate overflow-hidden rounded-3xl border p-4 shadow-sm sm:p-5"
                  style={{
                    background: "var(--brand-cream-gradient)",
                    borderColor: "#E9D8AD",
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full border-[18px]"
                    style={{ borderColor: "rgb(182 140 28 / 9%)" }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-4 text-black">
                    <div>
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "rgb(212 175 55 / 18%)" }}>
                        {Ico.check} Paso final
                      </span>
                      <h2 className="checkout-review-title text-xl font-black leading-tight sm:text-2xl" style={{ fontFamily: "League Spartan, sans-serif" }}>
                        ¡Tu pedido está casi listo!
                      </h2>
                      <p className="mt-1 max-w-lg text-xs leading-relaxed sm:text-sm">
                        Revisa que todo esté correcto. Puedes editar tus datos antes de confirmar.
                      </p>
                    </div>
                    <div
                      className="hidden size-10 shrink-0 items-center justify-center rounded-full sm:flex"
                      style={{ background: "rgb(212 175 55 / 18%)" }}
                      aria-hidden="true"
                    >
                      {Ico.check}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border p-4 sm:p-6" style={{ ...CARD_ST, borderColor: LINE }}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: C.mustard, background: `${C.mustard}14` }}>
                        {Ico.mapPin}
                      </span>
                      <div>
                        <h3 className="font-bold" style={{ color: C.dark }}>Datos de entrega</h3>
                        <p className="text-xs" style={{ color: MUTED }}>{deliveryMethodLabel}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="rounded-full px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm"
                      style={{ color: C.mustard, background: `${C.mustard}12` }}
                    >
                      Editar
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Recibe", value: delivForm.nombre, icon: Ico.user },
                      { label: "Teléfono", value: delivForm.telefono, icon: Ico.phone },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
                        style={{ borderColor: LINE, background: "#fff" }}
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ color: C.forest, background: `${C.forest}12` }}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-xs" style={{ color: MUTED }}>{item.label}</span>
                          <span className="block break-words text-sm font-bold" style={{ color: C.dark }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isDelivery && (
                    <div
                      className="mt-3 rounded-2xl border px-3.5 py-3 sm:px-4"
                      style={{
                        borderColor: `${C.mustard}35`,
                        background: "linear-gradient(135deg, #FBF7EC 0%, #FFFDF8 100%)",
                      }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ color: C.mustard, background: `${C.mustard}18` }}
                        >
                          {Ico.mapPin}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.mustard }}>
                          Dirección de entrega
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-0.5 sm:pl-9">
                        {delivForm.direccion.split(/,\s*/).filter(Boolean).map((part, index) => (
                          index === 0 ? (
                            <span key={index} className="w-full text-sm font-bold leading-relaxed" style={{ color: C.dark }}>
                              {part}
                            </span>
                          ) : (
                            <span
                              key={index}
                              className="rounded-full border px-2.5 py-1 text-xs font-medium"
                              style={{
                                borderColor: `${C.mustard}25`,
                                background: "#fff",
                                color: C.dark,
                              }}
                            >
                              {part}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  {delivForm.notas && (
                    <div className="mt-3 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(30,30,30,0.035)" }}>
                      <span className="mb-1 block text-xs font-semibold" style={{ color: MUTED }}>
                        {isDelivery ? "Indicaciones para la entrega" : "Notas del pedido"}
                      </span>
                      <span style={{ color: C.dark }}>{delivForm.notas}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border p-4 sm:p-6" style={{ ...CARD_ST, borderColor: LINE }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <PaymentMethodIcon method={delivForm.pago} />
                      <div>
                        <span className="block text-xs" style={{ color: MUTED }}>Método de pago</span>
                        <span className="block font-bold" style={{ color: C.dark }}>
                          {isMixed ? `${delivForm.pago} ${fmt(mixedTransferAmount)} + efectivo ${fmt(mixedCash)}` : delivForm.pago}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="rounded-full px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm"
                      style={{ color: C.mustard, background: `${C.mustard}12` }}
                    >
                      Editar
                    </button>
                  </div>
                  {needsVoucher && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: voucher ? `${C.forest}10` : `${C.red}10`, color: voucher ? C.forest : C.red }}>
                      <span>{voucher ? Ico.check : "!"}</span>
                      {voucher ? "Comprobante adjunto" : "Falta adjuntar el comprobante"}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: order summary */}
          <aside className="min-w-0 rounded-2xl p-4 sm:p-5 lg:sticky lg:top-20" style={CARD_ST}>
            <h2 className="font-bold text-lg mb-4" style={{ color: C.dark }}>
              Resumen del pedido
            </h2>
            {activeCart.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: MUTED }}>
                Tu carrito está vacío.
              </p>
            ) : (
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                {activeCart.map((i) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {i.img && (
                        <>
                          <img src={i.img} alt={i.name} className="w-12 h-12 rounded-lg object-cover" />
                          <span
                            className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: C.dark,
                              color: "#fff",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                            }}
                          >
                            {i.qty}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.dark }}>
                        {i.name}
                      </div>
                      {!!i.additions?.length && (
                        <div className="text-xs truncate" style={{ color: MUTED }}>
                          + {i.additions.map((a) => a.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: C.dark }}>
                      {fmt(itemTotal(i))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {user && (
              <button
                onClick={() => !voucher && setPickerOpen(true)}
                className={`text-xs font-semibold mb-4 ${voucher ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-70"}`}
                style={{ color: C.mustard }}
                title={voucher ? "No puedes agregar productos después de subir el comprobante" : "Agregar productos"}
              >
                + Agregar productos
              </button>
            )}
            <div className="space-y-2 text-sm pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
              <div className="flex justify-between" style={{ color: MUTED }}>
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {canShowDeliveryEstimate && (
                <div className="flex justify-between" style={{ color: MUTED }}>
                  <span>Domicilio</span>
                  <span style={{ color: isDelivery && deliveryEstimate.status === "ready" ? C.mustard : MUTED }}>
                    {!isDelivery
                      ? "No aplica"
                      : geo.status === "ok" && displayedDeliveryCost !== null
                        ? fmt(displayedDeliveryCost)
                        : geo.status === "loading" || deliveryEstimate.status === "loading"
                          ? "Calculando..."
                          : displayedDeliveryCost !== null
                            ? fmt(displayedDeliveryCost)
                            : "Por confirmar"}
                  </span>
                </div>
              )}
              {isDelivery && canShowDeliveryEstimate && (
                <div className="flex justify-between gap-4 text-xs" style={{ color: MUTED }}>
                  <span>Distancia aproximada en línea recta</span>
                  <span className="text-right">
                    {deliveryEstimate.distanceKm !== null
                      ? `${deliveryEstimate.distanceKm.toFixed(1)} km`
                      : deliveryEstimate.status === "loading"
                        ? "Calculando..."
                        : "No disponible"}
                  </span>
                </div>
              )}
              {isDelivery && canShowDeliveryEstimate && deliveryEstimate.status === "ready" && displayedDeliveryCost === null && (
                <p className="text-xs" style={{ color: C.red }} role="status">
                  No se pudo calcular el costo sin una distancia válida. Revisa la dirección para continuar.
                </p>
              )}
              {isDelivery && canShowDeliveryEstimate && deliveryEstimateError && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs" style={{ color: C.red }} role="alert">
                    No se pudo calcular la entrega: {deliveryEstimateError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEstimateRefresh((value) => value + 1)}
                    className="flex-shrink-0 text-xs font-bold underline"
                    style={{ color: C.mustard }}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {canShowDeliveryEstimate && (
                <>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-bold" style={{ color: C.dark }}>Tiempo total estimado</span>
                    <span
                      className="max-w-[70%] break-words text-right text-base font-bold"
                      style={{ color: deliveryEstimate.status === "loading" ? MUTED : C.mustard }}
                      role="status"
                      aria-live="polite"
                    >
                      {deliveryEstimate.label}
                    </span>
                  </div>
                  <div className="space-y-1 pl-2 text-xs" style={{ color: MUTED, opacity: 0.72 }}>
                    <div className="flex justify-between gap-4">
                      <span>Tiempo de domicilio</span>
                      <span className="text-right" style={{ color: estimatedDeliveryMinutes !== null ? C.mustard : MUTED }}>
                        {!isDelivery
                          ? "No aplica"
                          : estimatedDeliveryMinutes !== null
                            ? formatDuration(estimatedDeliveryMinutes)
                            : deliveryEstimate.status === "loading"
                              ? "Calculando..."
                              : "Por confirmar"}
                      </span>
                    </div>
                  </div>
                </>
              )}
              {user && canShowDeliveryEstimate && deliveryEstimate.status === "ready" && (
                <p className="text-right text-[11px]" style={{ color: MUTED, opacity: 0.7 }}>
                  Se actualiza automáticamente cada 30 segundos
                </p>
              )}
            </div>
            <div
              className="flex justify-between items-baseline font-black text-lg pt-4 mt-4"
              style={{
                borderTop: `1px solid ${LINE}`,
                fontFamily: "League Spartan, sans-serif",
                color: C.dark,
              }}
            >
              <span>Total</span>
              <span style={{ color: C.mustard }}>
                {neighborhoodOutOfRange
                  ? fmt(subtotal)
                  : deliveryCostConfigured
                    ? fmt(orderTotal)
                    : "Por confirmar"}
              </span>
            </div>
            <FieldError msg={orderError} />
            {deposit && deliveryCostConfigured && (
              <div role="note" className="mt-4 rounded-xl p-3 text-sm" style={{ background: `${C.mustard}12`, border: `1.5px solid ${C.mustard}55`, color: C.dark }}>
                <strong className="block">Abono del 50%: {fmt(depositAmount)}</strong>
                Por ser de {fmt(APPROVAL_MIN)} o más, se paga la mitad por transferencia al pedir y el saldo ({fmt(orderTotal - depositAmount)}) al recibir.
              </div>
            )}
            {cta ? (
              <button
                onClick={cta.onClick}
                disabled={cta.disabled}
                className="w-full mt-5 py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--brand-gold-gradient)", color: "#fff" }}
              >
                {cta.label} →
              </button>
            ) : (
              <p
                className="mt-5 p-3 rounded-xl text-xs text-center"
                style={{ background: `${C.mustard}12`, color: C.mustard }}
              >
                Inicia sesión o regístrate para continuar.
              </p>
            )}
            {((user && checkoutStep > 1) || (!user && showAuth)) && (
              <button
                type="button"
                onClick={() => {
                  if (!user) setShowAuth(false)
                  else setCheckoutStep(checkoutStep === 3 ? 2 : 1)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className="mt-2 w-full cursor-pointer rounded-xl py-3 text-sm font-bold transition hover:bg-black/[0.03]"
                style={{ border: "1.5px solid rgba(30,30,30,0.14)", color: C.dark, background: "#fff" }}
              >
                ← {checkoutStep === 3 ? "Volver a los datos de entrega" : "Volver al carrito"}
              </button>
            )}
            {user && checkoutStep >= 2 && (!delivFilled || !deliveryCostConfigured || !payReady) && (
              <p className="mt-3 text-xs text-center" style={{ color: MUTED }}>
                {!delivFilled
                  ? !customerInfoFilled
                    ? "Completa el nombre y el teléfono para continuar."
                    : neighborhoodsLoading && isDelivery
                      ? "Cargando los barrios habilitados..."
                      : neighborhoodOutOfRange
                        ? "Al continuar, te preguntaremos si deseas recoger el pedido en el local."
                        : geo.status === "loading"
                          ? "Ubicando tu dirección..."
                          : "Completa nombre, teléfono, barrio y dirección para continuar."
                  : !deliveryCostConfigured
                    ? geo.status === "loading"
                      ? "Calculando la tarifa del domicilio..."
                      : "No se pudo calcular la tarifa. Verifica la dirección de entrega."
                    : `Sube el comprobante de ${delivForm.pago} para continuar.`}
              </p>
            )}
          </aside>
        </div>
      </div>
      {showOutOfRangeDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={() => setShowOutOfRangeDialog(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="out-of-range-title"
            aria-describedby="out-of-range-description"
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{ background: "#fff", border: `1px solid ${LINE}` }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: `${C.red}12`, color: C.red }}
              aria-hidden="true"
            >
              !
            </div>
            <h2
              id="out-of-range-title"
              className="mb-2 font-black text-xl"
              style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
            >
              No hay domicilios para esta dirección
            </h2>
            <p id="out-of-range-description" className="mb-6 text-sm leading-relaxed" style={{ color: MUTED }}>
              No tenemos servicio de domicilio para esta zona. ¿Deseas continuar con tu pedido?
              Si continúas, quedará seleccionado para recogerlo en el local y no se cobrará el domicilio.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowOutOfRangeDialog(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ border: `1px solid ${LINE}`, color: C.dark, background: "#fff" }}
              >
                No, revisar dirección
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOutOfRangeDialog(false)
                  setDeliveryMethod("recoger")
                  setCheckoutStep(3)
                }}
                className="rounded-xl px-4 py-3 text-sm font-bold"
                style={{ background: "var(--brand-gold-gradient)", color: "var(--brand-gold-ink)" }}
              >
                Continuar para recoger
              </button>
            </div>
          </section>
        </div>
      )}
      {pickerOpen && checkoutStep !== 1 && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pb-4 pt-20"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="max-h-[calc(100dvh-6rem)] w-full max-w-3xl overflow-hidden rounded-3xl p-4 sm:p-5"
            style={{ background: "#FAF5E8" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-black text-xl"
                style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
              >
                Agrega algo más
              </h2>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: "rgba(30,30,30,0.08)", color: C.dark }}
                aria-label="Cerrar selección de productos"
              >
                {Ico.x}
              </button>
            </div>
            <ProductCatalog
              dark={false}
              onAddClick={setAddProduct}
              compact
            />
          </div>
        </div>
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={(product, qty, sauces, additions, note) => {
            setCart((items) =>
              addCartItem(items, {
                ...(note ? { note } : {}),
                id: Date.now(),
                productId: product.id,
                name: product.name,
                description: product.desc,
                price: product.price,
                qty,
                img: product.img,
                sauces,
                additions,
              }),
            )
            setAddProduct(null)
            setPickerOpen(false)
            showCartNotice(product.name)
          }}
          dark={false}
        />
      )}
      <CartAddedNotice message={cartNotice} />
    </div>
  )
}
