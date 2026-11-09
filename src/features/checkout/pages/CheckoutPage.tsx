import { useEffect, useState } from "react"
import { BELLO_NEIGHBORHOODS, normalizeNeighborhood } from "@/data/barrios"
import qrImg from "@/imports/image-4.png"
import logoImg from "@/imports/logo.png"
import PinCodeField from "@/features/auth/components/PinCodeField"
import { apiLogin, requestRegistrationCode, saveRegisteredClient, toUser, verifyRegistrationCode } from "@/features/auth/services/auth.service"
import { validateLogin, validateRegister } from "@/features/auth/utils/validation"
import CartAddedNotice, { useCartNotice } from "@/features/checkout/components/CartAddedNotice"
import CartSummary from "@/features/checkout/components/CartSummary"
import NeighborhoodSearch from "@/features/checkout/components/NeighborhoodSearch"
import { DELIVERY_ESTIMATE_ENDPOINT } from "@/features/checkout/services/delivery.service"
import { addCartItem, cartTotal, itemTotal } from "@/features/checkout/utils/cart"
import AddToCartModal from "@/features/menu/components/AddToCartModal"
import ProductCatalog from "@/features/menu/components/ProductCatalog"
import VoucherInput from "@/features/orders/components/VoucherInput"
import { APPROVAL_MIN } from "@/features/orders/utils/orders"
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
import { DOC_TYPES, digitsOnly, normalizeAccountDocumentInput, validatePhoneNumber } from "@/shared/utils/validation"

// ── Checkout Page (split: cart+form | auth) ────────────────────────────────────
export default function CheckoutPage({
  cart,
  setCart,
  user,
  onLogin,
  onBack,
  onPlaceOrder,
  onComplete,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  user: User | null
  onLogin: (u: User) => void
  onBack: () => void
  onPlaceOrder: (info: DeliveryInfo, saveAddress: boolean) => Promise<number | void>
  onComplete: () => void
}) {
  const [cartNotice, showCartNotice] = useCartNotice()
  const [authTab, setAuthTab] = useState<"login" | "register">("login")
  const [loginForm, setLoginForm] = useState({ email: "", pass: "" })
  const [regForm, setRegForm] = useState({
    name: "",
    docType: "",
    docNum: "",
    email: "",
    phone: "",
    pass: "",
    pass2: "",
  })
  const [registrationPending, setRegistrationPending] = useState(false)
  const [registrationCode, setRegistrationCode] = useState("")
  const [delivForm, setDelivForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
    pago: "Efectivo",
  })
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryInfo["tipoEntrega"]>("domicilio")
  const isDelivery = deliveryMethod === "domicilio"
  const deliveryMethodLabel =
    deliveryMethod === "local"
      ? "Comer en el local"
      : deliveryMethod === "recoger"
        ? "Recoger pedido"
        : "Pedir a domicilio"
  // The backend still receives one formatted address string.
  const [addressParts, setAddressParts] = useState<CheckoutAddressParts>(EMPTY_CHECKOUT_ADDRESS_PARTS)
  const [addressRetry, setAddressRetry] = useState(0)
  const fallbackNeighborhoods: DeliveryNeighborhood[] = BELLO_NEIGHBORHOODS.map((nombre) => ({
    id_barrio: null,
    nombre,
  }))
  const [neighborhoods, setNeighborhoods] = useState<DeliveryNeighborhood[]>(fallbackNeighborhoods)
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(true)
  const [neighborhoodsError, setNeighborhoodsError] = useState("")
  const setAddressPart = (key: keyof CheckoutAddressParts, value: string) =>
    setAddressParts((current) => {
      const next = { ...current, [key]: value }
      setDelivForm((form) => ({ ...form, direccion: composeDeliveryAddress(next) }))
      return next
    })
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
    () => !(user?.addresses?.length),
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
          if (point.neighborhood && !addressParts.barrio) setAddressPart("barrio", point.neighborhood)
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
  const [deliverToOtherPerson, setDeliverToOtherPerson] = useState(false)
  const [saveAddress, setSaveAddress] = useState(
    () => !(user?.addresses?.length),
  )
  const [deliveryTried, setDeliveryTried] = useState(false)
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
    if (!user) return
    const hasSavedAddress = !!user.addresses?.length
    setDelivForm((f) => ({
      ...f,
      nombre: f.nombre || user.name,
      telefono: f.telefono || user.phone || "",
      direccion: f.direccion || user.addresses?.[0] || "",
    }))
    const savedAddress = user.addresses?.[0] || ""
    const savedParts = savedAddress ? addressPartsFromAddress(savedAddress) : EMPTY_CHECKOUT_ADDRESS_PARTS
    setAddressParts(savedParts)
    setEditingAddress(!hasSavedAddress)
    setSaveAddress(!hasSavedAddress)
  }, [user])
  const [voucher, setVoucher] = useState("")
  const [ordered, setOrdered] = useState(false)
  const [placedTotal, setPlacedTotal] = useState(0)
  // Everybody (guest, client, admin, employee) starts by reviewing the cart
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1)
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
  const placeOrder = async () => {
    setDeliveryTried(true)
    if (subtotal + (displayedDeliveryCost ?? 0) >= APPROVAL_MIN) return
    if (placing || !user || !delivFilled || !deliveryCostConfigured || !payReady || cart.length === 0) return
    setOrderError("")
    setPlacing(true)
    try {
      const confirmedTotal = await onPlaceOrder(
        {
          ...delivForm,
          tipoEntrega: deliveryMethod,
          direccion: isDelivery
            ? delivForm.direccion
            : deliveryMethod === "local"
              ? "Consumo en el local"
              : "Recoger en el local",
          barrio: isDelivery ? selectedNeighborhood?.nombre : undefined,
          barrioId: isDelivery ? selectedNeighborhood?.id_barrio ?? undefined : undefined,
          distanciaKm: undefined,
          ubicacion: isDelivery && !geo.approximate && geo.lat !== undefined && geo.lon !== undefined
            ? { lat: geo.lat, lon: geo.lon }
            : undefined,
          costoDomicilio: isDelivery ? displayedDeliveryCost : 0,
          voucher: needsVoucher ? voucher : undefined,
        },
        isDelivery && (saveAddress || !(user.addresses?.length)),
      )
      setPlacedTotal(
        typeof confirmedTotal === "number" && Number.isFinite(confirmedTotal)
          ? confirmedTotal
          : orderTotal,
      )
      setOrdered(true)
    } catch (err) {
      setOrderError((err as Error).message)
    } finally {
      setPlacing(false)
    }
  }
  const continueToReview = () => {
    setDeliveryTried(true)
    if (!customerInfoFilled || !payReady) return
    if (isDelivery && neighborhoodsLoading) return
    if (neighborhoodOutOfRange) {
      setShowOutOfRangeDialog(true)
      return
    }
    if (!delivFilled || !deliveryCostConfigured) return
    setCheckoutStep(3)
  }
  // Nequi / Daviplata must attach the payment receipt before continuing
  const needsVoucher = delivForm.pago !== "Efectivo"
  const payReady = !needsVoucher || !!voucher
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

  // Errors show after the first submit of each form and update while typing
  const [loginTried, setLoginTried] = useState(false)
  const [regTried, setRegTried] = useState(false)
  const [serverErr, setServerErr] = useState("")
  const [busy, setBusy] = useState(false)
  // Password, account existence and status are checked by the backend
  const loginErrors = loginTried ? validateLogin(loginForm.email, loginForm.pass) : {}
  const regErrors = regTried ? validateRegister(regForm) : {}
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
      name: regForm.name.trim(),
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
      name: regForm.name.trim(),
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
    { id: "Daviplata", desc: "Transferencia con código QR" },
  ]
  const overLimit = orderTotal >= APPROVAL_MIN
  const cta = !user
    ? showAuth
      ? null
      : {
          label: "Hacer pedido",
          onClick: () => setShowAuth(true),
          disabled: !hasActiveItems || overLimit,
        }
    : checkoutStep === 1
      ? {
          label: "Hacer pedido",
          onClick: () => setCheckoutStep(2),
          disabled: !hasActiveItems || overLimit,
        }
    : checkoutStep === 2
      ? {
          label: "Confirma tus datos",
          onClick: continueToReview,
          disabled: cart.length === 0 || overLimit,
        }
      : {
          label: placing ? "Enviando pedido..." : "Confirmar pedido",
          onClick: placeOrder,
          disabled: placing || !hasActiveItems || !canOrder || !payReady || overLimit,
        }

  if (ordered)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
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
                    ? "Por su valor, tu pedido quedó pendiente de confirmación por El Parche."
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
              style={{ background: C.mustard, color: "#fff" }}
            >
              Ver mis pedidos <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div
      className="min-h-screen"
      style={{ background: "#FAF5E8", fontFamily: "DM Sans, sans-serif" }}
    >
      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{
          background: "rgba(250,245,232,0.95)",
          borderBottom: `1px solid ${LINE}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="text-sm font-medium cursor-pointer hover:opacity-70"
            style={{ color: MUTED }}
          >
            ← Seguir comprando
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="El Parche" className="h-12 w-12 object-contain" />
            <span
              className="font-black hidden sm:inline"
              style={{ fontFamily: "League Spartan, sans-serif", color: C.mustard }}
            >
              El Parche
            </span>
          </div>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: C.forest }}
          >
            {Ico.shield}
            <span className="hidden sm:inline">Compra segura</span>
          </span>
        </div>
      </header>
      <div className="h-16" aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1
          className="font-black text-2xl sm:text-3xl text-center mb-6"
          style={{ fontFamily: "League Spartan, sans-serif", color: C.dark }}
        >
          Finalizar mi pedido
        </h1>

        {/* Stepper */}
        <ol className="flex items-center max-w-xl mx-auto mb-10">
          {["Identificación", "Entrega", "Revisión"].map((label, i) => {
            const step = (i + 1) as 1 | 2 | 3
            const done = checkoutStep > step
            const active = checkoutStep === step && !done
            const reachable =
              (step === 1 && !user) ||
              (step === 2 && !!user) ||
              (step === 3 && !!user && !!delivFilled && deliveryCostConfigured && payReady)
            return (
              <li key={label} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
                <button
                  onClick={() => {
                    if (!reachable) return
                    setCheckoutStep(step)
                    if (step === 1) setShowAuth(true)
                  }}
                  className="flex items-center gap-2"
                  style={{ cursor: reachable ? "pointer" : "default" }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: done || active ? C.mustard : "#fff",
                      color: done || active ? "#fff" : MUTED,
                      border: done || active ? "none" : "1.5px solid rgba(30,30,30,0.15)",
                    }}
                  >
                    {done ? Ico.check : step}
                  </span>
                  <span
                    className="text-sm font-semibold hidden sm:inline"
                    style={{ color: done || active ? C.dark : MUTED }}
                  >
                    {label}
                  </span>
                </button>
                {i < 2 && (
                  <span
                    className="flex-1 h-0.5 mx-3 rounded-full"
                    style={{ background: done ? C.mustard : "rgba(30,30,30,0.12)" }}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="grid min-w-0 grid-cols-1 gap-5 items-start xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
          {/* LEFT: current step */}
          <div className="flex flex-col gap-6 min-w-0">
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
                      error={loginErrors.email}
                    />
                    <InputField
                      label="Contraseña"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.pass}
                      onChange={(v) => setLoginForm((f) => ({ ...f, pass: v }))}
                      required
                      error={loginErrors.pass}
                    />
                    <FieldError msg={serverErr} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                      style={{ background: C.mustard, color: "#fff" }}
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
                          style={{ background: C.mustard, color: "#fff" }}
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
                        }}
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
                      error={regErrors.docNum}
                    />
                    </div>
                    <InputField
                      label="Nombre *"
                      placeholder="Tu nombre"
                      value={regForm.name}
                      onChange={(v) => setRegForm((f) => ({ ...f, name: v }))}
                      required
                      error={regErrors.name}
                    />
                    <InputField
                      label="Teléfono"
                      type="tel"
                      placeholder="3XX XXX XXXX"
                      value={regForm.phone}
                      onChange={(v) => setRegForm((f) => ({ ...f, phone: digitsOnly(v).slice(0, 10) }))}
                      error={regErrors.phone}
                    />
                    <InputField
                      label="Correo *"
                      type="email"
                      placeholder="tu@correo.com"
                      value={regForm.email}
                      onChange={(v) => setRegForm((f) => ({ ...f, email: v }))}
                      required
                      error={regErrors.email}
                    />
                    <InputField
                      label="Contraseña *"
                      type="password"
                      placeholder="••••••••"
                      value={regForm.pass}
                      onChange={(v) => setRegForm((f) => ({ ...f, pass: v }))}
                      required
                      error={regErrors.pass}
                    />
                    {!regErrors.pass && (
                      <p className="text-[11px] -mt-1" style={{ color: "rgba(30,30,30,0.45)" }}>
                        Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.
                      </p>
                    )}
                    <InputField
                      label="Confirmar *"
                      type="password"
                      placeholder="••••••••"
                      value={regForm.pass2}
                      onChange={(v) => setRegForm((f) => ({ ...f, pass2: v }))}
                      required
                      error={regErrors.pass2}
                    />
                    <FieldError msg={serverErr} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-60"
                      style={{ background: C.mustard, color: "#fff" }}
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
                <section className="p-6 rounded-2xl" style={CARD_ST}>
                  <h2 className="font-bold text-lg mb-3" style={{ color: C.dark }}>
                    Datos del pedido
                  </h2>
                  <fieldset className="mb-5">
                    <legend className="mb-2 text-xs font-semibold" style={{ color: MUTED }}>
                      ¿Cómo quieres recibir tu pedido?
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        ["local", "Comer en el local", "Te lo servimos en bandeja, en el local"],
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
                            className="rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
                            style={{
                              borderColor: selected ? C.mustard : LINE,
                              background: selected ? `${C.mustard}12` : "#fff",
                              color: selected ? C.dark : MUTED,
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
                      <strong className="block text-sm" style={{ color: C.dark }}>
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
                          onChange={(v) => setDelivForm((f) => ({ ...f, [k]: v }))}
                          required={k === "nombre" || k === "telefono"}
                          error={
                            deliveryTried &&
                            k === "nombre" &&
                            !delivForm.nombre.trim()
                              ? "El nombre es obligatorio."
                              : deliveryTried && k === "telefono"
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
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!editingAddress) {
                            const parts = addressPartsFromAddress(delivForm.direccion)
                            setAddressParts(parts)
                          }
                          setEditingAddress((editing) => !editing)
                        }}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: C.mustard }}
                      >
                        {editingAddress ? "Usar dirección seleccionada" : "Cambiar dirección"}
                      </button>
                    </div>
                    <div className="mb-3">
                      <NeighborhoodSearch
                        value={addressParts.barrio}
                        query={neighborhoodQuery ?? addressParts.barrio}
                        neighborhoods={neighborhoods}
                        loading={neighborhoodsLoading}
                        loadError={neighborhoodsError}
                        onQueryChange={setNeighborhoodQuery}
                        onSelect={(n) => {
                          setAddressPart("barrio", n === null ? "" : typeof n === "string" ? n : n.nombre)
                          setNeighborhoodQuery(null)
                        }}
                        error={deliveryTried && isDelivery && !selectedNeighborhood && !geocodedInsideBello
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
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: "rgba(30,30,30,0.5)" }}>
                          Tipo de vía *
                          <select
                            required
                            value={addressParts.tipoVia}
                            onChange={(event) => setAddressPart("tipoVia", event.target.value)}
                            aria-invalid={deliveryTried && !addressParts.tipoVia}
                            className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                            style={{
                              background: "rgba(30,30,30,0.05)",
                              border: `1.5px solid ${deliveryTried && !addressParts.tipoVia ? C.red : "rgba(30,30,30,0.12)"}`,
                              color: C.dark,
                            }}
                          >
                            <option value="">Selecciona el tipo de vía</option>
                            {[...STREET_TYPES, ...(addressParts.tipoVia === "Circular" ? ["Circular"] : [])].map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          {deliveryTried && !addressParts.tipoVia && (
                            <span className="text-xs font-normal" role="alert" style={{ color: C.red }}>Selecciona el tipo de vía.</span>
                          )}
                        </label>
                        <InputField
                          label="Número *"
                          placeholder="Ej: 49"
                          value={addressParts.numeroVia}
                          onChange={(value) => setAddressPart("numeroVia", value)}
                          required
                          error={deliveryTried
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
                          error={deliveryTried && !validAddressLetter(addressParts.letraVia)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: "rgba(30,30,30,0.5)" }}>
                          Tipo de vía (opcional)
                          <select
                            value={addressParts.tipoViaSecundaria}
                            onChange={(event) => setAddressPart("tipoViaSecundaria", event.target.value)}
                            aria-invalid={deliveryTried && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria)}
                            className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                            style={{
                              background: "rgba(30,30,30,0.05)",
                              border: `1.5px solid ${deliveryTried && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria) ? C.red : "rgba(30,30,30,0.12)"}`,
                              color: C.dark,
                            }}
                          >
                            <option value="">Selecciona el tipo de vía</option>
                            {[...STREET_TYPES, ...(addressParts.tipoViaSecundaria === "Circular" ? ["Circular"] : [])].map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          {deliveryTried && !!addressParts.tipoViaSecundaria && !validStreetType(addressParts.tipoViaSecundaria) && (
                            <span className="text-xs font-normal" role="alert" style={{ color: C.red }}>Selecciona el tipo de vía.</span>
                          )}
                        </label>
                        <InputField
                          label="Número *"
                          placeholder="Ej: 57"
                          value={addressParts.numeroViaSecundaria}
                          onChange={(value) => setAddressPart("numeroViaSecundaria", value)}
                          required
                          error={deliveryTried
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
                          error={deliveryTried && !validAddressLetter(addressParts.letraViaSecundaria)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <InputField
                          label="Número *"
                          placeholder="Ej: 18"
                          value={addressParts.numeroPlaca}
                          onChange={(value) => setAddressPart("numeroPlaca", value)}
                          required
                          error={deliveryTried
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
                          error={deliveryTried && !validAddressLetter(addressParts.letraPlaca)
                            ? "Ingresa una sola letra."
                            : undefined}
                        />
                        <div className="sm:col-span-2">
                          <InputField
                            label="Complemento (opcional)"
                            placeholder="Ej: apartamento 301, torre 2, interior, piso o local"
                            value={addressParts.complemento}
                            onChange={(value) => setAddressPart("complemento", value)}
                          />
                        </div>
                        <div className="sm:col-span-2 rounded-xl px-3.5 py-3 text-sm" style={{ background: "rgba(30,30,30,0.04)", color: C.dark }}>
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
                            Esta dirección guardada no tiene todos los datos requeridos. Pulsa «Cambiar dirección» para completarlos.
                          </p>
                        )}
                      </>
                    )}
                    {editingAddress && (user.addresses?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {user.addresses!.map((address) => (
                          <button
                            key={address}
                            type="button"
                            onClick={() => {
                              const parts = addressPartsFromAddress(address)
                              setAddressParts(parts)
                              setDelivForm((form) => ({ ...form, direccion: composeDeliveryAddress(parts) }))
                              setEditingAddress(false)
                              setSaveAddress(false)
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                            style={{
                              border: `1px solid ${delivForm.direccion === address ? C.mustard : LINE}`,
                              background: delivForm.direccion === address ? `${C.mustard}12` : "#fff",
                              color: delivForm.direccion === address ? C.mustard : MUTED,
                            }}
                          >
                            {Ico.mapPin} {address}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Map of the address and its distance from the shop */}
                    {geo.status !== "idle" && (
                      <div className="mt-3 overflow-hidden rounded-xl" style={{ border: `1px solid ${LINE}` }}>
                        {geo.lat !== undefined && geo.lon !== undefined && (
                          <iframe
                            title="Ubicación de la dirección de entrega"
                            className="block h-32 w-full"
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${geo.lon - 0.012}%2C${geo.lat - 0.008}%2C${geo.lon + 0.012}%2C${geo.lat + 0.008}&layer=mapnik&marker=${geo.lat}%2C${geo.lon}`}
                          />
                        )}
                        {geo.status !== "ok" && (
                        <p
                          className="px-3 py-2 text-xs font-medium"
                          role="status"
                          style={{
                            background: geo.status === "notfound" ? "rgba(30,30,30,0.04)" : `${C.red}12`,
                            color: geo.status === "notfound" ? MUTED : C.red,
                          }}
                        >
                          {geo.status === "loading" && "Ubicando la dirección en el mapa..."}
                          {geo.status === "notfound" && "No pudimos ubicar automáticamente esta dirección. Si el barrio está habilitado, puedes continuar."}
                          {geo.status === "error" && "No pudimos cargar el mapa en este momento. Reintenta o verifica que el barrio esté habilitado."}
                        </p>
                        )}
                        {geo.status === "ok" && geo.approximate && (
                          <p className="px-3 py-2 text-xs font-medium" role="status" style={{ background: "rgba(30,30,30,0.04)", color: MUTED }}>
                            Mostramos una ubicación aproximada de {addressParts.barrio || geo.neighborhood || "este barrio"}; el punto exacto de la dirección no está disponible.
                          </p>
                        )}
                      </div>
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
                      <span className="text-xs font-semibold" style={{ color: C.dark }}>
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
                <section className="p-6 rounded-2xl" style={CARD_ST}>
                  <h2 className="font-bold text-lg mb-5" style={{ color: C.dark }}>
                    Método de pago
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {PAY_OPTS.map((m) => {
                      const sel = delivForm.pago === m.id
                      return (
                        <button
                          key={m.id}
                          onClick={() => setDelivForm((f) => ({ ...f, pago: m.id }))}
                          className="text-left p-4 rounded-xl cursor-pointer"
                          style={{
                            border: `1.5px solid ${sel ? C.mustard : LINE}`,
                            background: sel ? `${C.mustard}0D` : "#fff",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm" style={{ color: C.dark }}>
                              {m.id}
                            </span>
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{
                                border: `1.5px solid ${sel ? C.mustard : "rgba(30,30,30,0.25)"}`,
                                boxShadow: sel ? `inset 0 0 0 3px #fff, inset 0 0 0 8px ${C.mustard}` : "none",
                              }}
                            />
                          </div>
                          <div className="text-xs" style={{ color: MUTED }}>
                            {m.desc}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {needsVoucher && (
                    <div
                      className="mt-5 p-5 rounded-xl grid sm:grid-cols-[auto_1fr] gap-5 items-center"
                      style={{ background: "rgba(30,30,30,0.03)", border: `1px solid ${LINE}` }}
                    >
                      <div className="flex flex-col items-center">
                        <img
                          src={qrImg}
                          alt={`Código QR de ${delivForm.pago}`}
                          className="rounded-xl object-contain p-2 bg-white"
                          style={{ width: 160, height: 160, border: `1px solid ${LINE}` }}
                        />
                        <div className="text-xs mt-2" style={{ color: MUTED }}>
                          Total a pagar
                        </div>
                        <div
                          className="font-black text-xl"
                          style={{ fontFamily: "League Spartan, sans-serif", color: C.mustard }}
                        >
                          {deliveryCostConfigured ? fmt(orderTotal) : "Por confirmar"}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1" style={{ color: C.dark }}>
                          Paga con {delivForm.pago} y sube el comprobante
                        </h3>
                        <ol className="text-xs mb-4 space-y-1 list-decimal pl-4" style={{ color: MUTED }}>
                          <li>Escanea el código QR desde tu app de {delivForm.pago}.</li>
                          <li>Paga el total exacto.</li>
                          <li>Sube la captura del comprobante aquí.</li>
                        </ol>
                        <VoucherInput value={voucher} onChange={setVoucher} />
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {user && checkoutStep === 3 && (
              <section className="min-w-0 space-y-4">
                <div
                  className="relative isolate overflow-hidden rounded-2xl p-4 text-white shadow-sm sm:p-5"
                  style={{
                    background: `linear-gradient(120deg, ${C.mustard} 0%, #C99C31 58%, #D6AD4A 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px]"
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "rgba(255,255,255,0.18)" }}>
                        {Ico.check} Paso final
                      </span>
                      <h2 className="text-xl font-black leading-tight sm:text-2xl" style={{ fontFamily: "League Spartan, sans-serif" }}>
                        ¡Tu pedido está casi listo!
                      </h2>
                      <p className="mt-1 max-w-lg text-xs leading-relaxed text-white/90 sm:text-sm">
                        Revisa que todo esté correcto. Puedes editar tus datos antes de confirmar.
                      </p>
                    </div>
                    <div
                      className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white sm:flex"
                      style={{ background: "rgba(255,255,255,0.18)" }}
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
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: C.forest, background: `${C.forest}12` }}>
                        {Ico.cash}
                      </span>
                      <div>
                        <span className="block text-xs" style={{ color: MUTED }}>Método de pago</span>
                        <span className="block font-bold" style={{ color: C.dark }}>{delivForm.pago}</span>
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
          <aside className="min-w-0 rounded-2xl p-5 sm:p-6 xl:sticky xl:top-24" style={CARD_ST}>
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
            {overLimit && (
              <div role="alert" className="mt-4 rounded-xl p-3 text-sm" style={{ background: `${C.red}10`, border: `1.5px solid ${C.red}`, color: C.red }}>
                <strong className="block">No se puede realizar la compra</strong>
                Tu pedido ({fmt(orderTotal)}) excede el precio permitido: debe ser menor a {fmt(APPROVAL_MIN)}. Quita productos o adiciones para continuar.
              </div>
            )}
            {cta ? (
              <button
                onClick={cta.onClick}
                disabled={cta.disabled}
                className="w-full mt-5 py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: C.mustard, color: "#fff" }}
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
                style={{ background: C.mustard, color: "#fff" }}
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
          onAdd={(product, qty, sauces, additions) => {
            setCart((items) =>
              addCartItem(items, {
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
