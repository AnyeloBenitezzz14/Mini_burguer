import { Fragment, useState, useRef, useEffect, useCallback } from "react"
import logoImg from "@/imports/Gemini_Generated_Image_ei2okyei2okyei2o-Photoroom.png"
import qrImg from "@/imports/image-4.png"

// ── Types ──────────────────────────────────────────────────────────────────────
type Page = "landing" | "guest-menu" | "checkout" | "login" | "register" | "verify" | "forgot" | "reset" | "app" | "admin"
type AdminSection = "dashboard" | "roles" | "usuarios" | "cat-insumos" | "insumos" | "proveedores" | "compras" | "perdidas" | "cat-producto" | "producto" | "produccion" | "producto-no-conforme" | "clientes" | "ventas" | "pedidos" | "devoluciones"
type Theme = "light" | "dark"
type User = {
  name: string
  email: string
  role: "admin" | "user"
  cedula?: string
  docType?: string
  phone?: string
  addresses?: string[]
  photo?: string
  password?: string
}
type RegisteredClient = Pick<User, "name" | "email" | "cedula" | "docType" | "phone">
type CartItem = {
  id: number
  name: string
  description?: string
  price: number
  qty: number
  img: string
  sauces?: string[]
  additions?: { name: string; qty: number; price: number }[]
}
type DeliveryInfo = {
  nombre: string
  telefono: string
  direccion: string
  notas: string
  pago: string
  voucher?: string
}
type Order = DeliveryInfo & {
  id: string
  email: string
  cliente: string
  date: string
  items: CartItem[]
  total: number
  status: string
  paymentStatus?: "Pendiente" | "Pendiente de verificación" | "Pagado" | "Rechazado"
  paymentRejectionReason?: string
  productionAuthorized?: boolean
  productionRecords?: (string | number)[][]
}
const isTransferPaymentMethod = (method: string) =>
  ["transferencia", "nequi", "daviplata"].includes(method.trim().toLowerCase())
type ModalMode = "add" | "edit" | "view" | null
type FieldType = {
  key: string
  label: string
  type: "text" | "email" | "tel" | "number" | "select" | "textarea" | "date" | "time" | "image" | "checkbox"
  options?: string[]
}
type Product = {
  id: number
  name: string
  desc: string
  price: number
  priceStr: string
  img: string
  cat: string
  badge: string
}
type TechnicalIngredient = {
  name: string
  quantity: number
  unit: string
}
type AdminOrderLine = {
  id: string
  product: string
  category: string
  quantity: number
  unitPrice: number
  parentId?: string
}
type ProductionItem = {
  name: string
  quantity: number
  category?: string
  parentId?: string
}

// ── Brand ──────────────────────────────────────────────────────────────────────
const C = {
  mustard: "#B68C1C",
  amber: "#D29A42",
  red: "#A54131",
  cream: "#F2E5C0",
  dark: "#191512",
  forest: "#3A6D5E",
}
const WA = "573206332670"
const ITEMS_PER_PAGE = 6
const STATUS_OPT = ["Activo", "Inactivo"]
const DOC_TYPES = [
  "Cédula de Ciudadanía",
  "Cédula Extranjería",
  "NIT",
  "Pasaporte",
  "Tarjeta de Identidad",
]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const digitsOnly = (value: string) => value.replace(/\D/g, "")
const normalizeDocumentInput = (value: string, docType: string) => {
  if (docType === "Pasaporte") return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
  if (docType === "NIT") return value.replace(/[^0-9.-]/g, "").slice(0, 20)
  return digitsOnly(value).slice(0, 15)
}
const normalizeAccountDocumentInput = (value: string, docType: string) =>
  docType === "NIT"
    ? value.replace(/[^0-9-]/g, "").slice(0, 10)
    : docType
      ? normalizeDocumentInput(value, docType)
      : value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 20)
const normalizePhoneInput = (value: string) =>
  value.replace(/[^0-9+()\s-]/g, "").slice(0, 20)
const validateDocumentNumber = (value: string, docType: string) => {
  const document = value.trim()
  if (!document) return "Este campo es obligatorio."
  if (docType === "Pasaporte") {
    return /^[A-Za-z0-9]{5,20}$/.test(document)
      ? ""
      : "Escribe un número de pasaporte válido."
  }
  if (docType === "NIT") {
    const digits = digitsOnly(document)
    return /^[\d.-]+$/.test(document) && digits.length >= 8 && digits.length <= 15
      ? ""
      : "Escribe un NIT válido."
  }
  return /^\d{5,15}$/.test(document)
    ? ""
    : "Usa solo números (de 5 a 15 dígitos)."
}
const validatePhoneNumber = (value: string) => {
  const digits = digitsOnly(value)
  return digits.length >= 7 && digits.length <= 15
    ? ""
    : "Escribe un teléfono válido (de 7 a 15 dígitos)."
}
const SAUCES = [
  "Salsa de la casa",
  "Tártara",
  "Chowy",
  "Ajo",
  "Rosada",
  "Roja",
  "Piña",
  "Tomate",
  "Mostaza",
  "Mayonesa",
  "BBQ",
]
const ADDITIONS = [
  { name: "Queso", price: 8000 },
  { name: "Tocineta", price: 8000 },
  { name: "Ensalada", price: 8000 },
  { name: "Carne", price: 8000 },
  { name: "Salchicha x3", price: 8000 },
  { name: "Cebolla", price: 8000 },
  { name: "1 Huevo", price: 900 },
  { name: "5 Huevos", price: 4000 },
]
const BEVERAGES = [
  "Coca-Cola",
  "Manzana",
  "Colombiana",
  "Uva",
  "Pepsi",
  "Naranja",
]
const BEVERAGE_SIZES = [
  { id: "personal", label: "Personal", price: 3000 },
  { id: "1.5L", label: "1.5 L", price: 7000 },
  { id: "2.25L", label: "2.25 L", price: 9000 },
  { id: "3L", label: "3 L", price: 12000 },
]

// ── Products ───────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Mini",
    desc: "Hamburguesa pequeña de la casa con salsa secreta.",
    price: 13000,
    priceStr: "$13.000",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "Favorita",
  },
  {
    id: 2,
    name: "Sencilla",
    desc: "Carne de la casa, vegetales frescos y salsas.",
    price: 14500,
    priceStr: "$14.500",
    img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "",
  },
  {
    id: 3,
    name: "Tradicional",
    desc: "Carne, queso cheddar y tocineta crujiente.",
    price: 16000,
    priceStr: "$16.000",
    img: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "",
  },
  {
    id: 4,
    name: "Super Mini",
    desc: "Porción mediana especial con carne y vegetales.",
    price: 15500,
    priceStr: "$15.500",
    img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "",
  },
  {
    id: 5,
    name: "Doble",
    desc: "Doble carne de la casa, queso y salsas especiales.",
    price: 18500,
    priceStr: "$18.500",
    img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "Más Pedida",
  },
  {
    id: 6,
    name: "Triple",
    desc: "Triple carne de la casa, queso y salsas a elección.",
    price: 20500,
    priceStr: "$20.500",
    img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "",
  },
  {
    id: 7,
    name: "Pollo",
    desc: "Pechuga de pollo jugosa, queso y salsas.",
    price: 17500,
    priceStr: "$17.500",
    img: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "",
  },
  {
    id: 8,
    name: "Mixta",
    desc: "Combinación de carne y pollo con queso.",
    price: 20500,
    priceStr: "$20.500",
    img: "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=500&h=400&fit=crop",
    cat: "hamburguesas",
    badge: "Nueva",
  },
  {
    id: 10,
    name: "Perro Mediano",
    desc: "Salchicha mediana, papitas fosforito y salsas.",
    price: 14500,
    priceStr: "$14.500",
    img: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&h=400&fit=crop",
    cat: "perros",
    badge: "",
  },
  {
    id: 11,
    name: "Gran Perro",
    desc: "Salchicha grande, papitas y salsas variadas.",
    price: 15500,
    priceStr: "$15.500",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Hot_dog_XXL.jpg/500px-Hot_dog_XXL.jpg",
    cat: "perros",
    badge: "",
  },
  {
    id: 12,
    name: "Super Perro",
    desc: "Salchicha especial, tocineta, queso y salsas.",
    price: 17500,
    priceStr: "$17.500",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Hot_dog_gourmet.jpg/500px-Hot_dog_gourmet.jpg",
    cat: "perros",
    badge: "Favorito",
  },
  {
    id: 13,
    name: "Perra Pequeña",
    desc: "Tocino/tocineta, queso y salsas.",
    price: 14500,
    priceStr: "$14.500",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Hot_dog_with_bacon_and_cheese_and_dressed_with_ketchup_and_mustard_from_Five_Guys_1.jpg/500px-Hot_dog_with_bacon_and_cheese_and_dressed_with_ketchup_and_mustard_from_Five_Guys_1.jpg",
    cat: "perras",
    badge: "",
  },
  {
    id: 14,
    name: "Gran Perra",
    desc: "Porción grande de tocineta, queso y salsas.",
    price: 15500,
    priceStr: "$15.500",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Texas_Tommy_from_Ishkabibble%27s%2C_Philadelphia.jpg/500px-Texas_Tommy_from_Ishkabibble%27s%2C_Philadelphia.jpg",
    cat: "perras",
    badge: "",
  },
  {
    id: 15,
    name: "Super Perra",
    desc: "Tocineta extra, queso gratinado y salsas de la casa.",
    price: 17600,
    priceStr: "$17.600",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Chili_dog_topped_with_bacon.jpg/500px-Chili_dog_topped_with_bacon.jpg",
    cat: "perras",
    badge: "Especial",
  },
  {
    id: 16,
    name: "Salchipapa Sencilla",
    desc: "Papas a la francesa doradas y salchicha premium.",
    price: 13000,
    priceStr: "$13.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Salchipapas_20220704_121159.jpg/500px-Salchipapas_20220704_121159.jpg",
    cat: "salchipapas",
    badge: "",
  },
  {
    id: 17,
    name: "Salchipapa Especial",
    desc: "Papas, salchicha, queso fundido y tocineta crujiente.",
    price: 16000,
    priceStr: "$16.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Salchipapa_Jaime.jpg/500px-Salchipapa_Jaime.jpg",
    cat: "salchipapas",
    badge: "",
  },
  {
    id: 18,
    name: "Salchipapa Mega",
    desc: "Papas, salchicha, 3 huevos, 1 nugget, queso, carne y tocineta.",
    price: 20000,
    priceStr: "$20.000",
    img: "https://upload.wikimedia.org/wikipedia/commons/8/81/Salchipapa_especial.jpg",
    cat: "salchipapas",
    badge: "Mega",
  },
  {
    id: 19,
    name: "Salchipapa Mega Gourmet",
    desc: "Papas, salchicha, 3 huevos, pollo, cerdo, jamón, maicitos y queso.",
    price: 23000,
    priceStr: "$23.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Salchipapa_Coste%C3%B1o.jpg/500px-Salchipapa_Coste%C3%B1o.jpg",
    cat: "salchipapas",
    badge: "Gourmet",
  },
  {
    id: 20,
    name: "Salchipapa Mega Gourmet Q+T",
    desc: "Mega Gourmet con extra de queso y tocineta gratinada.",
    price: 27000,
    priceStr: "$27.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Salchipapa_Coste%C3%B1a.jpg/500px-Salchipapa_Coste%C3%B1a.jpg",
    cat: "salchipapas",
    badge: "",
  },
  {
    id: 21,
    name: "Salchipapa Gourmet Personal",
    desc: "Porción personal gourmet con carnes mixtas y maicitos.",
    price: 20500,
    priceStr: "$20.500",
    img: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Salchipapas_Plaza_de_Armas.jpg",
    cat: "salchipapas",
    badge: "",
  },
  {
    id: 22,
    name: "Salchipapa Super Gourmet",
    desc: "Papas, salchicha, pollo, jamón, maicitos, queso, tocineta y carne.",
    price: 33000,
    priceStr: "$33.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Salchipapa_Coste%C3%B1o_4.jpg/500px-Salchipapa_Coste%C3%B1o_4.jpg",
    cat: "salchipapas",
    badge: "Super",
  },
  {
    id: 23,
    name: "Chuzo de Pollo",
    desc: "Pollo, arepa artesanal, ensalada fresca y papas.",
    price: 19000,
    priceStr: "$19.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Skewered_Chicken_Thighs.jpg/500px-Skewered_Chicken_Thighs.jpg",
    cat: "chuzos",
    badge: "",
  },
  {
    id: 24,
    name: "Chuzo de Cerdo",
    desc: "Cerdo a la parrilla, arepa, ensalada y papas.",
    price: 19000,
    priceStr: "$19.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/DFC_4715_Sizzling_skewers_of_grilled_pork_served_with_crispy_fries_and_a_cool_tzatziki_dip_-_comfort_food_done_right.jpg/500px-DFC_4715_Sizzling_skewers_of_grilled_pork_served_with_crispy_fries_and_a_cool_tzatziki_dip_-_comfort_food_done_right.jpg",
    cat: "chuzos",
    badge: "",
  },
  {
    id: 25,
    name: "Patacón Mixto",
    desc: "Res, pollo, cerdo, queso, tocineta o salchicha.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Tostones_con_salami.jpg/500px-Tostones_con_salami.jpg",
    cat: "patacones",
    badge: "",
  },
  {
    id: 26,
    name: "Patacón Ranchero",
    desc: "Estilo ranchero con todos los toppings de la casa.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Tostones_rellenos_con_camarones.jpg/500px-Tostones_rellenos_con_camarones.jpg",
    cat: "patacones",
    badge: "",
  },
  {
    id: 27,
    name: "Arepa Sencilla",
    desc: "Arepa artesanal con carne y salsas de la casa.",
    price: 14000,
    priceStr: "$14.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Chorizo_Arepa.jpg/500px-Chorizo_Arepa.jpg",
    cat: "arepa-burger",
    badge: "",
  },
  {
    id: 28,
    name: "Arepa Especial",
    desc: "Arepa con carne, queso y adiciones seleccionadas.",
    price: 15000,
    priceStr: "$15.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Bacon_%26_Fried_Onion_Arepa.jpg/500px-Bacon_%26_Fried_Onion_Arepa.jpg",
    cat: "arepa-burger",
    badge: "",
  },
  {
    id: 29,
    name: "Arepa Gourmet",
    desc: "Arepa con carne gourmet, queso especial y tocineta.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Colombian_Food%2C_Arepas.jpg",
    cat: "arepa-burger",
    badge: "Gourmet",
  },
  {
    id: 30,
    name: "Arepa Desmechada",
    desc: "Arepa con carne desmechada especial de la casa.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Arepa_de_carne_mechada.jpg/500px-Arepa_de_carne_mechada.jpg",
    cat: "arepa-burger",
    badge: "",
  },
  {
    id: 31,
    name: "Rellena Pollo/Res",
    desc: "Rellena de pollo, cerdo o res a elección.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/El_Humero_-_arepa_rellena.jpg/500px-El_Humero_-_arepa_rellena.jpg",
    cat: "arepa-rellena",
    badge: "",
  },
  {
    id: 32,
    name: "Rellena Q+Tocineta",
    desc: "Rellena de queso fundido y tocineta crujiente.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Tri-rellena.jpg",
    cat: "arepa-rellena",
    badge: "",
  },
]

const MENU_CATS = [
  { id: "todos", label: "Todos", emoji: "🍽️" },
  { id: "hamburguesas", label: "Hamburguesas", emoji: "🍔" },
  { id: "perros", label: "Perros Cal.", emoji: "🌭" },
  { id: "perras", label: "Perras", emoji: "🌭" },
  { id: "salchipapas", label: "Salchipapas", emoji: "🍟" },
  { id: "chuzos", label: "Chuzos", emoji: "🍢" },
  { id: "patacones", label: "Patacones", emoji: "🫓" },
  { id: "arepa-burger", label: "Arepa Burger", emoji: "🫔" },
  { id: "arepa-rellena", label: "Arepa Rellena", emoji: "🫔" },
]

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ico = {
  menu: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  ),
  x: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  sun: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  search: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  eye: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  edit: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  ban: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  chevDown: (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  globe: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  alert: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  logout: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  dashboard: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  settings: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  shopping: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  chef: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 2a5 5 0 015 5 5 5 0 01-.5 2.2A5 5 0 0119 14v7H5v-7a5 5 0 012.5-4.8A5 5 0 017 9a5 5 0 0110-4.9" />
      <line x1="9" y1="14" x2="9" y2="21" />
      <line x1="12" y1="14" x2="12" y2="21" />
      <line x1="15" y1="14" x2="15" y2="21" />
    </svg>
  ),
  cash: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  chart: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  star: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  fire: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7A7 7 0 013 15c0-2.5.5-4.5 1.5-6" />
    </svg>
  ),
  users: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  undo: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </svg>
  ),
  cart: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  orders: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  upload: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  ),
  clock: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  trending: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  bell: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  shield: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  user: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mapPin: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  download: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  check: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
}

// ── Theme tokens ───────────────────────────────────────────────────────────────
function tk(dark: boolean) {
  return {
    bg: dark ? "#0D0F14" : "#F0EDE6",
    sidebarBg: dark ? "#111318" : "#FFFFFF",
    sidebarBd: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    sidebarTx: dark ? "rgba(255,255,255,0.92)" : "rgba(30,25,18,0.85)",
    sidebarMu: dark ? "rgba(255,255,255,0.55)" : "rgba(30,25,18,0.45)",
    hdrBg: dark ? "#111318" : "#FFFFFF",
    hdrBd: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    card: dark ? "#181B22" : "#FFFFFF",
    cardAlt: dark ? "#1E2128" : "#F8F5EF",
    border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: dark ? "#EAE4D8" : "#18160F",
    muted: dark ? "rgba(234,228,216,0.50)" : "rgba(24,22,15,0.48)",
    subtle: dark ? "rgba(234,228,216,0.22)" : "rgba(24,22,15,0.22)",
    input: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    inputB: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
    hover: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
  }
}

function badgeSt(val: string | number) {
  const s = String(val)
  if (
    [
      "Activo",
      "Activa",
      "OK",
      "Recibida",
      "Completada",
      "Terminado",
      "Vigente",
      "Lista",
      "Entregado",
      "Entregada",
      "Resuelta",
      "Resuelto",
    ].includes(s)
  )
    return { bg: "rgba(58,109,94,0.14)", color: "#2E7D60" }
  if (
    [
      "Pendiente",
      "Por confirmar",
      "Recibido",
      "En producción",
      "Iniciada",
      "En gestión",
      "En camino",
      "Borrador",
      "Confirmado",
      "Normal",
      "Listo",
    ].includes(s)
  )
    return { bg: "rgba(182,140,28,0.14)", color: "#9A7010" }
  if (
    [
      "Bajo",
      "Alta",
      "Pend. Aprobación",
      "Producto no conforme",
      "Pendiente admin",
      "Cancelada",
      "Cancelado",
      "Agotado",
      "Obsoleta",
      "Inactivo",
      "Inactiva",
      "Anulada",
      "Anulado",
    ].includes(s)
  )
    return { bg: "rgba(165,65,49,0.14)", color: C.red }
  return null
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`
}

// Document numbers compared without dots, dashes, spaces or case ("1.012.345" === "1012345")
function normalizeDocument(value: string | number | undefined) {
  return String(value ?? "").replace(/[^0-9a-z]/gi, "").toLowerCase()
}

// Compare names ignoring case, accents and extra spaces ("Cárnes " === "carnes")
function normalizeName(value: string | number | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

// Menu category ids (PRODUCTS[].cat) → product category names used in the admin
const PRODUCT_CAT_LABEL: Record<string, string> = {
  hamburguesas: "Hamburguesas",
  perros: "Perros Calientes",
  perras: "Perras",
  salchipapas: "Salchipapas",
  chuzos: "Chuzos",
  patacones: "Patacones",
  "arepa-burger": "Arepa Burger",
  "arepa-rellena": "Arepa Rellena",
}

// ── Admin config ───────────────────────────────────────────────────────────────
type ModConfig = {
  columns: string[]
  fields: FieldType[]
  seed: (string | number | boolean)[][]
  noExport?: boolean
  noDelete?: boolean
  autoId?: boolean
  statusIndex?: number
  inactiveStatus?: string
  hiddenCellIndexes?: number[]
}

const PERMISSION_MODULES = [
  { name: "Roles y permisos", finalAction: "Anular" },
  { name: "Usuarios", finalAction: "Anular" },
  { name: "Categoría Insumos", finalAction: "Anular" },
  { name: "Insumos", finalAction: "Anular" },
  { name: "Proveedores", finalAction: "Anular" },
  { name: "Compras", finalAction: "Eliminar" },
  { name: "Pérdida Insumos", finalAction: "Anular" },
  { name: "Categoría Producto", finalAction: "Anular" },
  { name: "Productos", finalAction: "Anular" },
  { name: "Producción", finalAction: "Eliminar" },
  { name: "Producto No Conforme", finalAction: "Eliminar" },
  { name: "Clientes", finalAction: "Eliminar" },
  { name: "Pedidos", finalAction: "Anular" },
  { name: "Ventas", finalAction: "Anular" },
  { name: "Devoluciones", finalAction: "Eliminar" },
] as const

const PRODUCTION_STATUSES = [
  "Recibida",
  "Iniciada",
  "En cocina",
  "Terminado",
  "Producto no conforme",
] as const

const MOD_CFG: Record<string, ModConfig> = {
  roles: {
    columns: ["Nombre", "Descripción", "Estado"],
    fields: [
      { key: "0", label: "Nombre del rol", type: "text" },
      { key: "1", label: "Descripción", type: "textarea" },
    ],
    seed: [
      ["Administrador", "Acceso total al sistema", "Activo"],
      ["Empleado", "Gestión interna del restaurante", "Activo"],
      ["Domiciliario", "Gestión de entregas a domicilio", "Activo"],
      ["Cliente", "Acceso a pedidos y seguimiento de compras", "Activo"],
    ],
    noExport: true,
    noDelete: true,
    statusIndex: 2,
  },
  usuarios: {
    columns: ["Nombre", "Tipo Doc.", "Documento", "Rol", "Correo", "Estado"],
    fields: [
      {
        key: "1",
        label: "Tipo de documento",
        type: "select",
        options: [
          "Cédula de Ciudadanía",
          "Cédula Extranjería",
          "NIT",
          "Pasaporte",
          "Tarjeta de Identidad",
        ],
      },
      { key: "2", label: "Número de documento", type: "text" },
      { key: "0", label: "Nombre completo", type: "text" },
      {
        key: "3",
        label: "Rol",
        type: "select",
        options: ["Empleado", "Domiciliario", "Cliente", "Administrador"],
      },
      { key: "4", label: "Correo electrónico", type: "email" },
      { key: "6", label: "Contraseña", type: "text" },
    ],
    seed: [
      [
        "Admin Parche",
        "Cédula de Ciudadanía",
        "12345678",
        "Administrador",
        "admin@parche.co",
        "Activo",
        "Demo123*",
      ],
      [
        "Juan Rúa",
        "Cédula de Ciudadanía",
        "98765432",
        "Empleado",
        "juan@parche.co",
        "Activo",
        "Demo123*",
      ],
      [
        "María Gómez",
        "Cédula de Ciudadanía",
        "45678901",
        "Domiciliario",
        "maria@parche.co",
        "Activo",
        "Demo123*",
      ],
    ],
    noExport: true,
    noDelete: true,
    statusIndex: 5,
    hiddenCellIndexes: [6],
  },
  "cat-insumos": {
    columns: ["Nombre Categoría", "Descripción", "Estado"],
    fields: [
      { key: "0", label: "Nombre categoría", type: "text" },
      { key: "1", label: "Descripción", type: "textarea" },
    ],
    seed: [
      ["Carnes", "Carnes y proteínas cárnicas", "Activa"],
      ["Lácteos", "Quesos y derivados lácteos", "Activa"],
      ["Verduras", "Vegetales y hortalizas", "Activa"],
      ["Panes", "Panes y masas artesanales", "Activa"],
      ["Salsas", "Salsas y aderezos", "Activa"],
    ],
    noExport: true,
    statusIndex: 2,
  },
  insumos: {
    columns: [
      "Nombre",
      "Categoría",
      "Unidad",
      "Costo Unit.",
      "Stock Act.",
      "Estado",
    ],
    fields: [
      { key: "0", label: "Nombre del insumo", type: "text" },
      {
        key: "1",
        label: "Categoría",
        type: "select",
        options: ["Carnes", "Lácteos", "Verduras", "Panes", "Salsas"],
      },
      {
        key: "2",
        label: "Unidad de medida",
        type: "select",
        options: ["kg", "g", "L", "ml", "und", "paq"],
      },
      { key: "3", label: "Costo unitario", type: "number" },
      { key: "4", label: "Stock actual", type: "number" },
      { key: "5", label: "Stock mínimo", type: "number" },
      // row[6] (old "Stock máximo") is no longer used; kept so later indexes don't shift
      { key: "7", label: "Producto de insumo", type: "checkbox" },
      { key: "8", label: "Nombre de la ficha técnica", type: "text" },
      { key: "9", label: "Versión de la ficha", type: "text" },
      { key: "10", label: "Insumos principales", type: "textarea" },
      { key: "11", label: "Cómo se prepara", type: "textarea" },
    ],
    seed: [
      ["Carne de res 100g", "Carnes", "g", 1800, 450, 200, 1000, "No", "", "", "", "", "Activo"],
      ["Queso cheddar", "Lácteos", "kg", 28000, 12, 15, 50, "No", "", "", "", "", "Activo"],
      ["Pan brioche", "Panes", "und", 900, 80, 30, 200, "Sí", "Ficha técnica - Pan brioche", "v1.0", "Pan brioche", "1. Seleccionar el pan. 2. Preparar según laFicha. 3. Armar y servir.", "Activo"],
      ["Lechuga", "Verduras", "kg", 4000, 5, 10, 30, "No", "", "", "", "", "Activo"],
      ["Salchicha", "Carnes", "und", 2500, 60, 25, 150, "No", "", "", "", "", "Activo"],
    ],
    noDelete: true,
    statusIndex: 12,
    hiddenCellIndexes: [5, 6, 7, 8, 9, 10, 11],
  },
  proveedores: {
    columns: [
      "Nombre",
      "NIT",
      "Correo",
      "Teléfono",
      "Contacto",
      "Estado",
    ],
    fields: [
      { key: "1", label: "NIT", type: "text" },
      { key: "0", label: "Nombre empresa", type: "text" },
      { key: "2", label: "Correo", type: "email" },
      { key: "3", label: "Teléfono", type: "tel" },
      { key: "5", label: "Dirección", type: "text" },
      // Comma-separated insumo names; limits what can be bought from this supplier
      { key: "7", label: "Insumos que suministra", type: "text" },
      { key: "8", label: "Tipo de documento", type: "select", options: DOC_TYPES },
      { key: "9", label: "Número de documento", type: "text" },
      { key: "10", label: "Nombre", type: "text" },
      { key: "11", label: "Apellido", type: "text" },
      { key: "12", label: "Teléfono", type: "tel" },
      { key: "13", label: "Correo electrónico", type: "email" },
      { key: "14", label: "Cargo", type: "text" },
    ],
    seed: [
      [
        "Carnes Premium SAS",
        "900.123.456-1",
        "ventas@carnes.co",
        "310-456-7890",
        "Pedro Álvarez",
        "Cll 50 #32-10, Medellín",
        "Activo",
        "Carne de res 100g, Salchicha, Pan brioche",
      ],
      [
        "Lácteos del Valle",
        "800.234.567-2",
        "info@lacteos.co",
        "320-987-6543",
        "Sandra Ríos",
        "Cra 45 #20-05, Bello",
        "Activo",
        "Queso cheddar",
      ],
    ],
    // Deletable only while the supplier has no purchases (see getDeleteAssessment)
    statusIndex: 6,
    hiddenCellIndexes: [5, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  compras: {
    columns: ["Proveedor", "Fecha", "Subtotal", "Total", "Estado"],
    fields: [
      {
        key: "0",
        label: "Proveedor",
        type: "select",
        options: [
          "Carnes Premium SAS",
          "Lácteos del Valle",
          "AgroVerde",
          "Panes Artesanales",
        ],
      },
      { key: "1", label: "Fecha de compra", type: "date" },
      { key: "2", label: "Fecha de registro", type: "date" },
      { key: "3", label: "Subtotal", type: "number" },
      { key: "4", label: "Total", type: "number" },
      {
        key: "6",
        label: "Insumos comprados (nombre | cantidad | precio unitario)",
        type: "textarea",
      },
    ],
    seed: [
      [
        "Carnes Premium SAS",
        "2024-01-20",
        "2024-01-20",
        42500,
        42500,
        "Activo",
        "Carne de res 100g | 20 | 1800\nPan brioche | 5 | 900\nSalsa de la casa | 1 | 2000",
      ],
      [
        "Lácteos del Valle",
        "2024-01-18",
        "2024-01-18",
        28000,
        28000,
        "Activo",
        "Queso cheddar | 1 | 28000",
      ],
      [
        "Panes Artesanales",
        "2024-01-17",
        "2024-01-18",
        22500,
        22500,
        "Activo",
        "Pan brioche | 25 | 900",
      ],
    ],
    noDelete: true,
    statusIndex: 5,
    inactiveStatus: "Anulado",
    hiddenCellIndexes: [2, 6],
  },
  perdidas: {
    columns: ["Insumo", "Cantidad", "Motivo", "Responsable", "Fecha"],
    fields: [
      {
        key: "0",
        label: "Insumo",
        type: "select",
        options: [
          "Carne de res 100g",
          "Queso cheddar",
          "Pan brioche",
          "Lechuga",
          "Salchicha",
        ],
      },
      { key: "1", label: "Cantidad", type: "text" },
      {
        key: "2",
        label: "Motivo",
        type: "select",
        options: ["Deterioro", "Vencimiento", "Accidente", "Horno", "Otro"],
      },
      { key: "3", label: "Responsable", type: "text" },
      { key: "4", label: "Fecha", type: "date" },
      // Filled when the loss is sent from a purchase ("Compra a X del <fecha>")
      { key: "5", label: "Origen", type: "text" },
    ],
    seed: [
      ["Lechuga", "0.5 kg", "Deterioro", "María G.", "2024-01-20"],
      ["Pan brioche", "4 und", "Horno", "María G.", "2024-01-19"],
      ["Queso cheddar", "0.3 kg", "Vencimiento", "Juan R.", "2024-01-15"],
    ],
    noExport: true,
    noDelete: true,
    hiddenCellIndexes: [5],
  },
  "cat-producto": {
    columns: ["Nombre Categoría", "Descripción", "Estado"],
    fields: [
      { key: "0", label: "Nombre categoría", type: "text" },
      { key: "1", label: "Descripción", type: "textarea" },
    ],
    seed: [
      ["Hamburguesas", "Burgers artesanales de la casa", "Activa"],
      ["Adiciones", "Extras para agregar a los productos", "Activa"],
      ["Salchipapas", "Papas fritas con salchicha", "Activa"],
      ["Perros Calientes", "Hot dogs", "Activa"],
      ["Perras", "Versiones especiales", "Activa"],
      ["Chuzos", "Carne en palito con papas", "Activa"],
      ["Patacones", "Patacón relleno", "Activa"],
      ["Arepa Burger", "Burger en arepa", "Activa"],
      ["Arepa Rellena", "Arepa rellena", "Activa"],
    ],
    noExport: true,
    statusIndex: 2,
  },
  producto: {
    columns: ["Imagen", "Nombre", "Categoría", "Precio", "Estado"],
    fields: [
      { key: "img", label: "Foto del producto", type: "image" },
      { key: "0", label: "Nombre", type: "text" },
      {
        key: "1",
        label: "Categoría",
        type: "select",
        options: [
          "Hamburguesas",
          "Adiciones",
          "Salchipapas",
          "Perros Calientes",
          "Perras",
          "Chuzos",
          "Patacones",
          "Arepa Burger",
          "Arepa Rellena",
          "Producto de insumo",
        ],
      },
      { key: "2", label: "Precio (COP)", type: "number" },
      { key: "3", label: "Descripción", type: "textarea" },
      { key: "5", label: "Nombre de la ficha técnica", type: "text" },
      { key: "6", label: "Versión de la ficha", type: "text" },
      { key: "7", label: "Insumos principales", type: "textarea" },
      { key: "8", label: "Cómo se prepara", type: "textarea" },
      {
        key: "10",
        label: "Disponibilidad",
        type: "select",
        options: ["Disponible", "No disponible"],
      },
    ],
    // Every menu product (so each category has its products in the order picker) + additions
    seed: [
      ...PRODUCTS.map((p) => [
        p.name,
        PRODUCT_CAT_LABEL[p.cat] ?? p.cat,
        p.price,
        p.desc,
        "Activo",
        `Ficha ${p.name}`,
        "v1.0",
        "",
        "",
      ]),
      ...ADDITIONS.map((a) => [
        a.name,
        "Adiciones",
        a.price,
        "Adición para agregar a los productos.",
        "Activo",
        "",
        "",
        "",
        "",
      ]),
    ],
    noExport: true,
    noDelete: true,
    statusIndex: 4,
  },
  produccion: {
    columns: [
      "Cód. Orden",
      "Producto",
      "Cantidad",
      "Prioridad",
      "Fecha Creación",
      "Hora",
      "Estado",
    ],
    fields: [
      {
        key: "0",
        label: "Producto o producto de insumo",
        type: "select",
        options: [],
      },
      { key: "1", label: "Cantidad", type: "number" },
      { key: "3", label: "Fecha de creación", type: "date" },
      { key: "4", label: "Hora de creación", type: "time" },
    ],
    seed: [
      ["OP-0089", "Doble", 2, 1, "2024-01-21", "08:00", "2024-01-21", "10:15", "En cocina", "", 0, "Sí", JSON.stringify([{ status: "Recibida", date: "2024-01-21", time: "08:00" }, { status: "Iniciada", date: "2024-01-21", time: "09:10" }, { status: "En cocina", date: "2024-01-21", time: "10:15" }]), JSON.stringify([{ name: "Doble", quantity: 2 }])],
      ["OP-0088", "Mini", 4, 2, "2024-01-21", "07:30", "2024-01-21", "11:30", "Terminado", "2024-01-21 11:30", 1, "Sí", JSON.stringify([{ status: "Recibida", date: "2024-01-21", time: "07:30" }, { status: "Iniciada", date: "2024-01-21", time: "08:00" }, { status: "En cocina", date: "2024-01-21", time: "09:00" }, { status: "Terminado", date: "2024-01-21", time: "11:30" }]), JSON.stringify([{ name: "Mini", quantity: 4 }])],
      ["OP-0087", "Salchipapa Mega", 2, 3, "2024-01-20", "16:45", "2024-01-20", "16:45", "Recibida", "", 0, "No", JSON.stringify([{ status: "Recibida", date: "2024-01-20", time: "16:45" }]), JSON.stringify([{ name: "Salchipapa Mega", quantity: 2 }])],
    ],
    autoId: true,
    statusIndex: 8,
    // 14 = stock already consumed (Sí/No), 15 = order code it came from (internal data)
    hiddenCellIndexes: [6, 7, 9, 10, 11, 12, 13, 14, 15],
  },
  "producto-no-conforme": {
    columns: ["Orden", "Productos o insumos dañados", "Cantidad", "Motivo", "Fecha", "Estado"],
    fields: [
      { key: "0", label: "Productos o insumos dañados", type: "textarea" },
      { key: "1", label: "Productos o insumos que se dañaron", type: "textarea" },
      { key: "2", label: "Cantidad no conforme", type: "number" },
      {
        key: "3",
        label: "Motivo",
        type: "select",
        options: [
          "Tiempo superado",
          "Error en preparación",
          "Ingrediente incorrecto",
          "Daño físico",
          "Producto perdido",
          "Otro",
        ],
      },
      { key: "4", label: "Fecha", type: "date" },
      { key: "5", label: "Observación", type: "textarea" },
      {
        key: "6",
        label: "Unidad de medida (para adiciones o insumos)",
        type: "select",
        options: ["und", "kg", "g", "L", "ml", "paq"],
      },
    ],
    seed: [
      ["OP-0085", "Mini", "Mini", 1, "Tiempo superado", "2024-01-20", "", "und", "Activo"],
      ["OP-0088", "Doble", "Doble", 2, "Error en preparación", "2024-01-21", "", "und", "Activo"],
    ],
    autoId: true,
    noDelete: true,
    statusIndex: 8,
    hiddenCellIndexes: [2, 6, 7],
  },
  clientes: {
    columns: ["Nombre", "Número de documento", "Teléfono", "Correo", "Estado"],
    // Form order: document type + number on one line, then the name (keys keep row positions)
    fields: [
      {
        key: "1",
        label: "Tipo de documento",
        type: "select",
        options: [
          "Cédula de Ciudadanía",
          "Cédula Extranjería",
          "NIT",
          "Pasaporte",
          "Tarjeta de Identidad",
        ],
      },
      { key: "2", label: "Número de documento", type: "text" },
      { key: "0", label: "Nombre completo", type: "text" },
      { key: "3", label: "Teléfono", type: "tel" },
      { key: "4", label: "Correo electrónico", type: "email" },
      { key: "5", label: "Dirección", type: "text" },
      { key: "6", label: "Cliente de local", type: "checkbox" },
    ],
    seed: [
      // Same order as the fields: nombre, tipo doc, nº doc, teléfono, correo, dirección, ¿de local?, estado
      ["Valentina Ríos", "Cédula de Ciudadanía", "1012345678", "310-456-7890", "vale@mail.co", "Cra 58 #42-10, Bello", "No", "Activo"],
      ["Carlos Mejía", "Cédula de Ciudadanía", "1023456789", "320-987-6543", "carlos@mail.co", "Cll 50 #30-05, Bello", "No", "Activo"],
      ["Luisa Fernández", "Cédula de Ciudadanía", "1034567890", "315-678-9012", "", "Cra 60 #44-20, Bello", "Sí", "Activo"],
    ],
    statusIndex: 7,
    hiddenCellIndexes: [1, 5, 6],
  },
  ventas: {
    columns: [
      "Venta",
      "Cliente",
      "Fecha",
      "Total",
      "Estado de venta",
      "Estado del pedido",
    ],
    fields: [
      {
        key: "0",
        label: "Usuario (vendedor)",
        type: "select",
        options: ["Admin Parche", "Juan Rúa", "María Gómez"],
      },
      {
        key: "1",
        label: "Cliente",
        type: "select",
        options: [
          "Valentina Ríos",
          "Carlos Mejía",
          "Luisa Fernández",
          "Diego Pérez",
        ],
      },
      { key: "2", label: "Fecha", type: "date" },
      {
        key: "3",
        label: "Tipo de venta",
        type: "select",
        options: ["Local", "Domicilio", "WhatsApp", "Online"],
      },
      {
        key: "4",
        label: "Método de pago",
        type: "select",
        options: ["Efectivo", "Nequi", "Daviplata", "Tarjeta"],
      },
      { key: "5", label: "Subtotal", type: "number" },
      { key: "6", label: "Total", type: "number" },
      {
        key: "7",
        label: "Estado de venta",
        type: "select",
        options: ["Completada", "Pendiente", "Cancelada"],
      },
      { key: "8", label: "Pedido asociado", type: "text" },
      {
        key: "9",
        label: "Estado del pedido",
        type: "select",
        options: ["Recibido", "En preparación", "En camino", "Entregado", "Cancelado"],
      },
    ],
    seed: [
      [
        "VTA-0306",
        "Juan Rúa",
        "Diego Pérez",
        "2024-01-21",
        "Local",
        "Efectivo",
        13000,
        13000,
        "Completada",
        "Sin pedido",
        "Completada",
      ],
      [
        "VTA-0305",
        "Juan Rúa",
        "Luisa Fernández",
        "2024-01-21",
        "Domicilio",
        "Nequi",
        22000,
        22000,
        "Completada",
        "Sin pedido",
        "Completada",
      ],
    ],
    noDelete: true,
    autoId: true,
    hiddenCellIndexes: [1, 4, 5, 6, 9, 11, 12],
  },
  pedidos: {
    columns: [
      "Cód. Pedido",
      "Cliente",
      "Total",
      "Estado",
      "Estado de pago",
      "Autorización producción",
    ],
    fields: [
      {
        key: "0",
        label: "Cliente",
        type: "select",
        options: [
          "Valentina Ríos",
          "Carlos Mejía",
          "Luisa Fernández",
          "Diego Pérez",
        ],
      },
      { key: "1", label: "Productos solicitados", type: "textarea" },
      {
        key: "2",
        label: "Tipo de pedido",
        type: "select",
        options: ["Online", "Local"],
      },
      {
        key: "3",
        label: "Método de pago",
        type: "select",
        options: ["Transferencia", "Efectivo", "Pago en el local"],
      },
      {
        key: "4",
        label: "Modalidad de pago",
        type: "select",
        options: ["Anticipado", "Contraentrega"],
      },
      { key: "5", label: "Total (COP)", type: "number" },
      {
        key: "7",
        label: "Estado de pago",
        type: "select",
        options: [
          "Pendiente",
          "Pendiente de verificación",
          "Pagado",
          "Rechazado",
        ],
      },
      { key: "9", label: "Comprobante de pago", type: "image" },
    ],
    seed: [
      [
        "PED-0195",
        "Valentina Ríos",
        "2 Mini, 1 Salchipapa Sencilla",
        "Online",
        "Transferencia",
        "Anticipado",
        85000,
        "En preparación",
        "Pagado",
        "No requerida",
      ],
      [
        "PED-0194",
        "Carlos Mejía",
        "4 Mini, 2 Sencilla",
        "Local",
        "Efectivo",
        "Contraentrega",
        168000,
        "Recibido",
        "Pendiente",
        "Pendiente admin",
      ],
      [
        "PED-0193",
        "Luisa Fernández",
        "1 Mega Gourmet",
        "Online",
        "Pago en el local",
        "Contraentrega",
        23000,
        "Entregado",
        "Pagado",
        "No requerida",
      ],
      [
        "PED-0192",
        "Diego Pérez",
        "1 Doble, 1 Chuzo de Pollo, 2 gaseosas",
        "Local",
        "Efectivo",
        "Contraentrega",
        57000,
        "En camino",
        "Pendiente",
        "No requerida",
      ],
      [
        "PED-0191",
        "Valentina Ríos",
        "3 Super Gourmet, 1 Mega Gourmet Q+T",
        "Online",
        "Transferencia",
        "Anticipado",
        122000,
        "Entregado",
        "Pagado",
        "No requerida",
      ],
      [
        "PED-0190",
        "Carlos Mejía",
        "5 Mini, 3 Tradicional, 2 porciones de papas",
        "Online",
        "Transferencia",
        "Anticipado",
        192000,
        "En preparación",
        "Pagado",
        "Autorizada",
      ],
    ],
    noDelete: true,
    autoId: true,
    // 10 = order lines JSON saved by admin-created orders (was showing as "Dato 7")
    // 11 = payment rejection reason
    hiddenCellIndexes: [2, 3, 4, 5, 10, 11],
  },
  devoluciones: {
    columns: ["Código", "Cliente", "Motivo", "Fecha"],
    fields: [
      { key: "0", label: "Código devolución", type: "text" },
      { key: "1", label: "ID Venta asociada", type: "text" },
      {
        key: "2",
        label: "Cliente",
        type: "select",
        options: [
          "Valentina Ríos",
          "Carlos Mejía",
          "Luisa Fernández",
          "Diego Pérez",
        ],
      },
      { key: "3", label: "Nombre cliente (texto libre)", type: "text" },
      {
        key: "4",
        label: "Motivo de devolución",
        type: "select",
        options: ["Reembolso", "Reposición"],
      },
      { key: "5", label: "Fecha", type: "date" },
    ],
    seed: [
      ["DEV-001", "VTA-0305", "Ana López", "Ana López", "Reposición", "2024-01-19"],
    ],
    noDelete: true,
    noExport: true,
    hiddenCellIndexes: [1, 3],
  },
}

const supplyAsProduct = (row: (string | number)[]): (string | number)[] => [
  String(row[0] ?? "Producto de insumo"),
  "Producto de insumo",
  Number(row[3] || 0),
  "Insumo configurado para comercializarse como producto.",
  String(row[12] ?? "Activo"),
  String(row[8] || `Ficha técnica - ${String(row[0] ?? "Producto de insumo")}`),
  String(row[9] || "v1.0"),
  String(row[10] || row[0] || "Insumo"),
  String(row[11] || "Insumo producto con ficha técnica y control de inventario."),
]

// ── Orders → production ───────────────────────────────────────────────────────
// Pedido payment rules: the method decides the modality and whether it's paid,
// so the admin doesn't pick them by hand (e.g. Online + Efectivo = contraentrega, pendiente)
function derivePedidoPayment(method: string, hasProof: boolean) {
  if (method === "Transferencia")
    return { modalidad: "Anticipado", estadoPago: hasProof ? "Pagado" : "Pendiente" }
  if (method === "Efectivo" || method === "Pago en el local")
    return { modalidad: "Contraentrega", estadoPago: "Pendiente" }
  return { modalidad: "", estadoPago: "" }
}

// One production order per order line (same format "Confirmar pedido y enviar a
// producción" always used). Returns the production rows with the new ones on top.
function buildProductionRows(
  lines: AdminOrderLine[],
  productionRows: (string | number)[][],
  orderCode: string,
) {
  const now = new Date()
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const result = [...productionRows]
  let priority = Math.max(0, ...result.map((row) => Number(row[3]) || 0))
  let lastCode = Math.max(0, ...result.map((row) => Number(/^OP-(\d+)$/i.exec(String(row[0] ?? ""))?.[1] ?? 0)))
  lines.slice().reverse().forEach((item) => {
    priority += 1
    lastCode += 1
    const parent = lines.find((candidate) => candidate.id === item.parentId)
    result.unshift([
      `OP-${String(lastCode).padStart(4, "0")}`,
      parent ? `↳ ${item.product} (adición de ${parent.product})` : item.product,
      item.quantity,
      priority,
      date,
      time,
      date,
      time,
      "Iniciada",
      "",
      0,
      "Sí",
      JSON.stringify([{ status: "Iniciada", date, time }]),
      JSON.stringify([{
        name: item.product,
        quantity: item.quantity,
        category: item.category,
        ...(item.parentId ? { parentId: item.parentId } : {}),
      }]),
      "No",
      orderCode,
    ])
  })
  return result
}

const SIDEBAR_MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Ico.dashboard,
    children: [],
    color: C.amber,
  },
  {
    key: "roles",
    label: "Roles y permisos",
    icon: Ico.shield,
    children: [],
    color: "#A78BFA",
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Ico.users,
    children: [],
    color: "#8B8CF8",
  },
  {
    key: "compras-g",
    label: "Compras",
    icon: Ico.shopping,
    children: [
      { key: "cat-insumos", label: "Categ. Insumos" },
      { key: "insumos", label: "Insumos" },
      { key: "proveedores", label: "Proveedores" },
      { key: "compras", label: "Compras" },
      { key: "perdidas", label: "Pérdida Insumos" },
    ],
    color: C.forest,
  },
  {
    key: "prod-g",
    label: "Producción",
    icon: Ico.chef,
    children: [
      { key: "cat-producto", label: "Categ. Producto" },
      { key: "producto", label: "Productos" },
      { key: "produccion", label: "Órdenes de Prod." },
      { key: "producto-no-conforme", label: "Prod. No Conforme" },
    ],
    color: C.red,
  },
  {
    key: "ventas-g",
    label: "Ventas",
    icon: Ico.cash,
    children: [
      { key: "clientes", label: "Clientes" },
      { key: "pedidos", label: "Pedidos" },
      { key: "ventas", label: "Ventas" },
      { key: "devoluciones", label: "Devoluciones" },
    ],
    color: C.mustard,
  },
]

// ── Auth validation ────────────────────────────────────────────────────────────
type FieldErrors = Record<string, string>
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/
const DEMO_CODE = "841736"
const DOC_RULES: Record<string, { re: RegExp; msg: string }> = {
  "Cédula de Ciudadanía": {
    re: /^\d{6,10}$/,
    msg: "La cédula debe tener entre 6 y 10 números, sin puntos ni espacios.",
  },
  "Cédula Extranjería": {
    re: /^\d{6,12}$/,
    msg: "La cédula de extranjería debe tener entre 6 y 12 números.",
  },
  NIT: {
    re: /^\d{9}(-\d)?$/,
    msg: "El NIT debe tener 9 números y puede llevar el dígito de verificación (ej: 900123456-7).",
  },
  Pasaporte: {
    re: /^[A-Za-z0-9]{5,12}$/,
    msg: "El pasaporte debe tener entre 5 y 12 letras o números, sin espacios.",
  },
  "Tarjeta de Identidad": {
    re: /^\d{10,11}$/,
    msg: "La tarjeta de identidad debe tener 10 u 11 números.",
  },
}

function emailError(email: string) {
  if (!email.trim()) return "Ingresa tu correo electrónico."
  if (!EMAIL_RE.test(email.trim()))
    return "Escribe un correo válido, por ejemplo nombre@correo.com."
  return ""
}

function validateLogin(
  email: string,
  pass: string,
  savedPass?: string,
  accountStatus?: string,
  requireRegisteredAccount = false,
  accountExists = !!savedPass,
): FieldErrors {
  const e: FieldErrors = {}
  const em = emailError(email)
  if (em) e.email = em
  else if (
    accountStatus &&
    ["inactivo", "inactiva", "anulado", "anulada"].includes(
      accountStatus.trim().toLowerCase(),
    )
  ) {
    e.email = "Esta cuenta está inactiva. Contacta al administrador."
  } else if (requireRegisteredAccount && !accountExists) {
    e.email = "No encontramos una cuenta con ese correo. Regístrate para continuar."
  }
  if (!pass) e.pass = "Ingresa tu contraseña."
  else if (pass.length < 8) e.pass = "La contraseña tiene mínimo 8 caracteres."
  else if (savedPass && pass !== savedPass) e.pass = "La contraseña es incorrecta."
  return e
}

function validateRegister(f: {
  name: string
  lastname?: string
  docType: string
  docNum: string
  email: string
  phone: string
  pass: string
  pass2: string
}): FieldErrors {
  const e: FieldErrors = {}
  const name = f.name.trim()
  if (!name) e.name = "Ingresa tu nombre."
  else if (!NAME_RE.test(name)) e.name = "El nombre solo puede tener letras y espacios."
  else if (name.length < 2) e.name = "El nombre debe tener al menos 2 letras."
  if (f.lastname?.trim() && !NAME_RE.test(f.lastname.trim()))
    e.lastname = "El apellido solo puede tener letras y espacios."
  if (!f.docType) e.docType = "Selecciona el tipo de documento."
  const doc = f.docNum.trim()
  if (!doc) e.docNum = "Ingresa tu número de documento."
  else if (f.docType && !DOC_RULES[f.docType]?.re.test(doc))
    e.docNum = DOC_RULES[f.docType].msg
  const phone = f.phone.replace(/\s/g, "")
  if (phone && !/^3\d{9}$/.test(phone))
    e.phone = "El celular debe tener 10 números y empezar por 3."
  const em = emailError(f.email)
  if (em) e.email = em
  else if (loadLS(`profile:${f.email.trim().toLowerCase()}`, null))
    e.email = "Ya existe una cuenta con este correo. Inicia sesión."
  if (!f.pass) e.pass = "Crea una contraseña."
  else {
    const missing = [
      f.pass.length < 8 && "mínimo 8 caracteres",
      !/[A-Z]/.test(f.pass) && "una mayúscula",
      !/[a-z]/.test(f.pass) && "una minúscula",
      !/\d/.test(f.pass) && "un número",
    ].filter(Boolean)
    if (missing.length) e.pass = `La contraseña necesita ${missing.join(", ")}.`
  }
  if (!f.pass2) e.pass2 = "Confirma tu contraseña."
  else if (f.pass2 !== f.pass) e.pass2 = "Las contraseñas no coinciden."
  return e
}

function codeError(code: string) {
  if (code.length < 6) return "El código tiene 6 números."
  if (code !== DEMO_CODE) return "El código no es correcto. Revisa el que te enviamos."
  return ""
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="text-[11px] leading-snug" style={{ color: C.red }} role="alert">
      {msg}
    </p>
  )
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  error,
}: {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: string
}) {
  const baseBorder = error ? C.red : "rgba(30,30,30,0.12)"
  // Password fields get an eye button to show/hide what was typed
  const isPassword = type === "password"
  const [showPass, setShowPass] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold"
        style={{ color: "rgba(30,30,30,0.5)" }}
      >
        {label}
        {required && !label.trim().endsWith("*") && " *"}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPass ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-invalid={!!error}
          className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${isPassword ? "pr-10" : ""}`}
          style={{
            background: "rgba(30,30,30,0.05)",
            border: `1.5px solid ${baseBorder}`,
            color: "#1A1714",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = error ? C.red : C.mustard)}
          onBlur={(e) => (e.currentTarget.style.borderColor = baseBorder)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPass}
            className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer hover:opacity-70 [&_svg]:w-4 [&_svg]:h-4"
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            {showPass ? Ico.eyeOff : Ico.eye}
          </button>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  )
}

function AuthLayout({
  children,
  title,
  sub,
}: {
  children: React.ReactNode
  title: string
  sub: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "#FAF3E6", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-5">
          <img
            src={logoImg}
            alt="El Parche"
            className="object-contain mb-2"
            style={{ width: "100px", height: "100px" }}
          />
          <div
            className="font-black text-xl"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.mustard }}
          >
            El Parche
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "rgba(30,30,30,0.4)" }}
          >
            Mini Burguer
          </div>
        </div>
        <div
          className="p-6 rounded-3xl"
          style={{
            background: "#fff",
            boxShadow: "0 8px 40px rgba(30,30,30,0.1)",
          }}
        >
          <h2
            className="font-black text-xl mb-0.5"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
          >
            {title}
          </h2>
          <div
            className="text-sm mb-4"
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

function LoginPage({
  onLogin,
  onRegister,
  onForgot,
  onBack,
}: {
  onLogin: (u: User) => void
  onRegister: () => void
  onForgot: () => void
  onBack: () => void
}) {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  // Errors show after the first submit and update live while typing
  const [tried, setTried] = useState(false)
  const savedProfile = loadLS<User | null>(`profile:${email.trim().toLowerCase()}`, null)
  const accountStatus = getAdminAccountStatus(email)
  const errors = tried
    ? validateLogin(email, pass, savedProfile?.password, accountStatus)
    : {}
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    const savedProfile = loadLS<User | null>(`profile:${email.trim().toLowerCase()}`, null)
    const accountStatus = getAdminAccountStatus(email)
    if (
      Object.keys(
        validateLogin(email, pass, savedProfile?.password, accountStatus),
      ).length
    )
      return
    const role = email.toLowerCase().includes("admin") ? "admin" : "user"
    const name = email
      .split("@")[0]
      .replace(/\./g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
    onLogin({ name, email: email.trim().toLowerCase(), role })
  }
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "#F7F2E8", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block px-8">
          <img
            src={logoImg}
            alt="El Parche"
            className="w-28 h-28 object-contain mb-5"
          />
          <div
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: C.mustard }}
          >
            Bienvenido a El Parche
          </div>
          <h1
            className="font-black text-4xl leading-tight mb-4"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
          >
            Tu próximo antojo empieza aquí.
          </h1>
          <p
            className="text-base leading-relaxed max-w-md"
            style={{ color: "rgba(25,21,18,0.55)" }}
          >
            Inicia sesión para guardar tus datos, repetir tus pedidos y seguir
            cada entrega.
          </p>
        </div>
        <div
          className="w-full max-w-md mx-auto p-7 sm:p-9 rounded-3xl"
          style={{
            background: "#fff",
            boxShadow: "0 12px 45px rgba(30,30,30,0.10)",
          }}
        >
          <div className="flex items-center gap-3 mb-7 lg:hidden">
            <img
              src={logoImg}
              alt="El Parche"
              className="w-12 h-12 object-contain"
            />
            <div>
              <div
                className="font-black"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: C.mustard,
                }}
              >
                El Parche
              </div>
              <div className="text-xs" style={{ color: "rgba(30,30,30,0.4)" }}>
                Mini Burguer
              </div>
            </div>
          </div>
          <h2
            className="font-black text-2xl mb-1"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
          >
            Iniciar sesión
          </h2>
          <div
            className="text-sm mb-6"
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            Accede a tu cuenta para continuar
          </div>
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <InputField
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
              error={errors.email}
            />
            <InputField
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={setPass}
              required
              error={errors.pass}
            />
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-right cursor-pointer"
              style={{ color: C.mustard }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Iniciar sesión
            </button>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "rgba(30,30,30,0.3)" }}
            >
              <span
                className="h-px flex-1"
                style={{ background: "rgba(30,30,30,0.1)" }}
              />
              <span>o</span>
              <span
                className="h-px flex-1"
                style={{ background: "rgba(30,30,30,0.1)" }}
              />
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer"
              style={{ background: "rgba(182,140,28,0.10)", color: C.mustard }}
            >
              Crear una cuenta
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 rounded-xl font-medium text-sm cursor-pointer"
              style={{
                background: "rgba(30,30,30,0.05)",
                color: "rgba(30,30,30,0.5)",
              }}
            >
              ← Volver al inicio
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function RegisterPage({
  onVerify,
  onLoginLink,
  onBack,
}: {
  onVerify: (u: User) => void
  onLoginLink: () => void
  onBack: () => void
}) {
  const [step, setStep] = useState<"form" | "verifying">("form")
  const [tried, setTried] = useState(false)
  const [codeTried, setCodeTried] = useState(false)
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    docType: "",
    docNum: "",
    email: "",
    phone: "",
    pass: "",
    pass2: "",
  })
  const [code, setCode] = useState("")
  const errors = tried ? validateRegister(form) : {}
  const err = codeTried ? codeError(code) : ""
  const upd = (k: keyof typeof form) => (v: string) =>
    setForm((current) => ({
      ...current,
      [k]:
        k === "docNum"
          ? normalizeAccountDocumentInput(v, current.docType)
          : k === "phone"
            ? digitsOnly(v).slice(0, 10)
            : v,
    }))
  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (Object.keys(validateRegister(form)).length) return
    setStep("verifying")
  }
  const submitCode = (e: React.FormEvent) => {
    e.preventDefault()
    setCodeTried(true)
    if (codeError(code)) return
    onVerify({
      name: `${form.name.trim()} ${form.lastname.trim()}`.trim(),
      email: form.email.trim().toLowerCase(),
      role: "user",
      docType: form.docType,
      phone: form.phone.replace(/\s/g, ""),
      cedula: form.docNum.trim(),
      password: form.pass,
    })
  }
  if (step === "verifying")
    return (
      <AuthLayout
        title="Verifica tu correo"
        sub={
          <>
            Código enviado a <strong>{form.email}</strong>
          </>
        }
      >
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <div className="text-center text-5xl py-2">📧</div>
          <p
            className="text-xs text-center"
            style={{ color: "rgba(30,30,30,0.5)" }}
          >
            Ingresa el código de 6 dígitos que enviamos a tu correo. (Demo:{" "}
            <strong>{DEMO_CODE}</strong>)
          </p>
          <input
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            aria-invalid={!!err}
            className="w-full px-4 py-4 rounded-xl text-center text-2xl font-bold tracking-widest outline-none"
            style={{
              background: "rgba(30,30,30,0.05)",
              border: `1.5px solid ${err ? C.red : "rgba(30,30,30,0.12)"}`,
              color: "#1A1714",
              letterSpacing: "0.3em",
            }}
          />
          <FieldError msg={err} />
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Verificar y continuar
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="text-xs text-center cursor-pointer"
            style={{ color: "rgba(30,30,30,0.4)" }}
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 rounded-xl font-medium text-sm cursor-pointer"
            style={{
              background: "rgba(30,30,30,0.05)",
              color: "rgba(30,30,30,0.5)",
            }}
          >
            ← Volver al inicio
          </button>
        </form>
      </AuthLayout>
    )
  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 py-4"
      style={{ background: "#F7F2E8", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-5 items-center">
        <div className="hidden lg:block px-6">
          <img
            src={logoImg}
            alt="El Parche"
            className="w-24 h-24 object-contain mb-4"
          />
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
            style={{ color: C.mustard }}
          >
            Únete a El Parche
          </div>
          <h1
            className="font-black text-3xl leading-tight mb-3"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
          >
            Crea tu cuenta y pide más fácil.
          </h1>
          <p
            className="text-sm leading-relaxed max-w-md"
            style={{ color: "rgba(25,21,18,0.55)" }}
          >
            Guarda tus datos de entrega y disfruta tus hamburguesas favoritas
            sin repetir el proceso.
          </p>
        </div>
        <div
          className="w-full max-w-md mx-auto p-5 rounded-3xl"
          style={{
            background: "#fff",
            boxShadow: "0 12px 35px rgba(30,30,30,0.10)",
          }}
        >
          <div className="flex items-center gap-3 mb-5 lg:hidden">
            <img
              src={logoImg}
              alt="El Parche"
              className="w-11 h-11 object-contain"
            />
            <div>
              <div
                className="font-black text-sm"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: C.mustard,
                }}
              >
                El Parche
              </div>
              <div
                className="text-[10px]"
                style={{ color: "rgba(30,30,30,0.4)" }}
              >
                Mini Burguer
              </div>
            </div>
          </div>
          <h2
            className="font-black text-xl mb-1"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
          >
            Crear cuenta
          </h2>
          <div
            className="text-xs mb-4"
            style={{ color: "rgba(30,30,30,0.45)" }}
          >
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={onLoginLink}
              className="font-semibold cursor-pointer"
              style={{ color: C.mustard }}
            >
              Inicia sesión
            </button>
          </div>
          <form onSubmit={submitForm} noValidate className="flex flex-col gap-2">
            {/* Document type first, its number right next to it */}
            <div className="grid grid-cols-2 gap-2 items-start">
              <div className="flex flex-col gap-1 min-w-0">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "rgba(30,30,30,0.5)" }}
                >
                  Tipo de documento *
                </label>
                <select
                  value={form.docType}
                  onChange={(e) => {
                    const docType = e.target.value
                    setForm((current) => ({
                      ...current,
                      docType,
                      docNum: normalizeAccountDocumentInput(current.docNum, docType),
                    }))
                  }}
                  aria-invalid={!!errors.docType}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(30,30,30,0.05)",
                    border: `1.5px solid ${errors.docType ? C.red : "rgba(30,30,30,0.12)"}`,
                    color: form.docType ? "#1A1714" : "rgba(30,30,30,0.35)",
                  }}
                >
                  <option value="">Selecciona tipo...</option>
                  {DOC_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.docType} />
              </div>
              <InputField
                label="Nº Documento *"
                placeholder="123456789"
                value={form.docNum}
                onChange={upd("docNum")}
                required
                error={errors.docNum}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-start">
              <InputField
                label="Nombre *"
                placeholder="Tu nombre"
                value={form.name}
                onChange={upd("name")}
                required
                error={errors.name}
              />
              <InputField
                label="Apellido"
                placeholder="Tu apellido"
                value={form.lastname}
                onChange={upd("lastname")}
                error={errors.lastname}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-start">
              <InputField
                label="Teléfono"
                type="tel"
                placeholder="3XX XXX XXXX"
                value={form.phone}
                onChange={upd("phone")}
                error={errors.phone}
              />
              <InputField
                label="Correo *"
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={upd("email")}
                required
                error={errors.email}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-start">
              <InputField
                label="Contraseña *"
                type="password"
                placeholder="••••••••"
                value={form.pass}
                onChange={upd("pass")}
                required
                error={errors.pass}
              />
              <InputField
                label="Confirmar *"
                type="password"
                placeholder="••••••••"
                value={form.pass2}
                onChange={upd("pass2")}
                required
                error={errors.pass2}
              />
            </div>
            {!errors.pass && (
              <p className="text-[11px]" style={{ color: "rgba(30,30,30,0.45)" }}>
                Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Continuar →
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 rounded-xl font-medium text-sm cursor-pointer"
              style={{
                background: "rgba(30,30,30,0.05)",
                color: "rgba(30,30,30,0.5)",
              }}
            >
              ← Volver al inicio
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function ForgotPage({
  onReset,
  onBack,
}: {
  onReset: (email: string) => void
  onBack: () => void
}) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [emailErr, setEmailErr] = useState("")
  if (sent)
    return (
      <AuthLayout title="Correo enviado" sub="Revisa tu bandeja de entrada">
        <div className="text-center py-2">
          <div className="text-5xl mb-3">📧</div>
          <p className="text-sm mb-5" style={{ color: "rgba(30,30,30,0.55)" }}>
            Enlace enviado a <strong>{email}</strong>
          </p>
          <button
            onClick={() => onReset(email)}
            className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Continuar
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 rounded-xl text-sm cursor-pointer mt-2"
            style={{
              background: "rgba(30,30,30,0.05)",
              color: "rgba(30,30,30,0.5)",
            }}
          >
            ← Volver
          </button>
        </div>
      </AuthLayout>
    )
  return (
    <AuthLayout
      title="Recuperar contraseña"
      sub="Ingresa tu correo y te enviamos el enlace"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const error = emailError(email)
          setEmailErr(error)
          if (!error) setSent(true)
        }}
        className="flex flex-col gap-3"
      >
        <InputField
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(value) => {
            setEmail(value)
            if (emailErr) setEmailErr(emailError(value))
          }}
          required
          error={emailErr}
        />
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
          style={{ background: C.mustard, color: "#fff" }}
        >
          Enviar enlace
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 rounded-xl text-sm cursor-pointer"
          style={{
            background: "rgba(30,30,30,0.05)",
            color: "rgba(30,30,30,0.5)",
          }}
        >
          ← Volver
        </button>
      </form>
    </AuthLayout>
  )
}

function ResetPage({ email, onDone }: { email: string; onDone: () => void }) {
  const [pass, setPass] = useState("")
  const [pass2, setPass2] = useState("")
  const [err, setErr] = useState("")
  const [ok, setOk] = useState(false)
  if (ok)
    return (
      <AuthLayout title="¡Listo!" sub="Contraseña actualizada">
        <div className="text-center py-2">
          <div className="text-5xl mb-3">✅</div>
          <button
            onClick={onDone}
            className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Iniciar sesión
          </button>
        </div>
      </AuthLayout>
    )
  return (
    <AuthLayout
      title="Nueva contraseña"
      sub={
        <>
          Para <strong>{email}</strong>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (pass !== pass2) {
            setErr("No coinciden.")
            return
          }
          if (pass.length < 6) {
            setErr("Mínimo 6 caracteres.")
            return
          }
          setOk(true)
        }}
        className="flex flex-col gap-3"
      >
        <InputField
          label="Nueva contraseña"
          type="password"
          placeholder="••••••••"
          value={pass}
          onChange={setPass}
          required
        />
        <InputField
          label="Confirmar"
          type="password"
          placeholder="••••••••"
          value={pass2}
          onChange={setPass2}
          required
        />
        {err && (
          <p className="text-xs" style={{ color: C.red }}>
            {err}
          </p>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
          style={{ background: C.mustard, color: "#fff" }}
        >
          Guardar
        </button>
      </form>
    </AuthLayout>
  )
}

// ── Product Info Modal (info only, centered) ───────────────────────────────────
function ProductInfoModal({
  product,
  onClose,
  onAddToCart,
  dark,
}: {
  product: Product
  onClose: () => void
  onAddToCart: (p: Product) => void
  dark: boolean
}) {
  const CARD = dark ? "#1E1C18" : "#fff"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const cat = MENU_CATS.find((c) => c.id === product.cat)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: CARD, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative" style={{ height: "200px" }}>
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
          >
            {Ico.x}
          </button>
          {product.badge && (
            <span
              className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {product.badge}
            </span>
          )}
          {cat && (
            <span
              className="absolute bottom-3 left-3 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
            >
              {cat.emoji} {cat.label}
            </span>
          )}
        </div>
        <div className="p-5">
          <h2
            className="font-black text-xl mb-1"
            style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
          >
            {product.name}
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>
            {product.desc}
          </p>
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <span
              className="font-extrabold text-2xl"
              style={{ fontFamily: "Montserrat, sans-serif", color: C.mustard }}
            >
              {product.priceStr}
            </span>
            <button
              onClick={() => {
                onClose()
                onAddToCart(product)
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add to Cart Modal (centered, with sauces/additions) ────────────────────────
function AddToCartModal({
  product,
  onClose,
  onAdd,
  onCheckout,
  dark,
}: {
  product: Product
  onClose: () => void
  onAdd: (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => void
  onCheckout?: () => void
  dark: boolean
}) {
  const [qty, setQty] = useState(1)
  const [selSauces, setSelSauces] = useState<string[]>([])
  const [addQtys, setAddQtys] = useState<Record<string, number>>({})
  const [beverageSize, setBeverageSize] = useState(BEVERAGE_SIZES[0].id)
  const [customizationTab, setCustomizationTab] = useState<"sauces" | "additions" | "beverages">("sauces")
  const CARD = dark ? "#1E1C18" : "#fff"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const toggleSauce = (s: string) =>
    setSelSauces((p) => {
      if (p.includes(s)) return p.filter((x) => x !== s)
      return p.length < 4 ? [...p, s] : p
    })
  const changeAdd = (name: string, d: number) =>
    setAddQtys((p) => ({ ...p, [name]: Math.max(0, (p[name] || 0) + d) }))
  const addTotal = ADDITIONS.reduce(
    (s, a) => s + (addQtys[a.name] || 0) * a.price,
    0,
  )
  const beverageTotal = BEVERAGES.reduce(
    (total, flavor) =>
      total +
      BEVERAGE_SIZES.reduce(
        (sizeTotal, size) =>
          sizeTotal +
          (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0) * size.price,
        0,
      ),
    0,
  )
  const selectedBeverageSize =
    BEVERAGE_SIZES.find((size) => size.id === beverageSize) ?? BEVERAGE_SIZES[0]
  const selectedBeverageCount = BEVERAGES.reduce(
    (total, flavor) =>
      total +
      BEVERAGE_SIZES.reduce(
        (sizeTotal, size) =>
          sizeTotal + (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0),
        0,
      ),
    0,
  )
  const unitPrice = product.price + addTotal + beverageTotal
  const total = unitPrice * qty
  const handleAdd = () => {
    const adds = ADDITIONS.filter((a) => (addQtys[a.name] || 0) > 0).map(
      (a) => ({ name: a.name, qty: addQtys[a.name], price: a.price }),
    )
    const beverages = BEVERAGES.flatMap((flavor) =>
      BEVERAGE_SIZES.filter(
        (size) => (addQtys[`Gaseosa ${flavor} ${size.id}`] || 0) > 0,
      ).map((size) => ({
        name: `Gaseosa ${flavor} (${size.label})`,
        qty: addQtys[`Gaseosa ${flavor} ${size.id}`],
        price: size.price,
      })),
    )
    onAdd(product, qty, selSauces, [...adds, ...beverages])
    onClose()
  }
  const handleCheckout = () => {
    handleAdd()
    onCheckout?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: CARD,
          maxHeight: "98dvh",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{ height: "clamp(120px, 26vh, 230px)", background: dark ? "#111" : "#1E1C18" }}
        >
          <img
            src={product.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
          />
          <img
            src={product.img}
            alt={product.name}
            className="relative z-10 h-full w-full object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
          >
            {Ico.x}
          </button>
        </div>
        <div
          className="flex items-center justify-between gap-3 px-5 py-2 flex-shrink-0"
          style={{ background: dark ? "#1E1C18" : "#fff" }}
        >
          <div>
            <div
              className="font-black text-lg leading-tight"
              style={{ color: TEXT }}
            >
              {product.name}
            </div>
            <div className="font-extrabold text-sm" style={{ color: C.amber }}>
              {product.priceStr}
            </div>
          </div>
          {product.badge && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${C.mustard}18`, color: C.mustard }}
            >
              {product.badge}
            </span>
          )}
        </div>
        <div
          className="min-h-0 flex-1 overflow-hidden px-4 py-1.5 sm:px-5"
        >
          <p className="mb-1 line-clamp-1 text-xs leading-snug sm:text-sm" style={{ color: MUTED }}>
            {product.desc}
          </p>
          <div className="mb-1.5 grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: dark ? "rgba(244,238,220,0.06)" : "rgba(30,30,30,0.05)" }}>
            {([
              ["sauces", `Salsas ${selSauces.length}/4`],
              ["additions", `Adiciones ${ADDITIONS.reduce((total, item) => total + (addQtys[item.name] || 0), 0)}`],
              ["beverages", `Bebidas ${selectedBeverageCount}`],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCustomizationTab(tab)}
                className="rounded-lg px-2 py-1.5 text-sm font-bold transition-colors"
                style={{
                  background: customizationTab === tab ? C.mustard : "transparent",
                  color: customizationTab === tab ? "#fff" : MUTED,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {customizationTab === "sauces" && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="font-bold text-sm" style={{ color: TEXT }}>Elige hasta 4 salsas gratis</div>
              <span className="text-[11px] font-semibold" style={{ color: selSauces.length === 4 ? C.amber : MUTED }}>
                {selSauces.length}/4
              </span>
            </div>
            <div
              role="group"
              aria-label="Salsas"
              className="flex flex-wrap gap-1.5"
            >
              {SAUCES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSauce(s)}
                  disabled={!selSauces.includes(s) && selSauces.length >= 4}
                  aria-pressed={selSauces.includes(s)}
                  className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-xs"
                  style={{
                    background: selSauces.includes(s)
                      ? C.mustard
                      : dark
                        ? "rgba(244,238,220,0.08)"
                        : "rgba(30,30,30,0.07)",
                    color: selSauces.includes(s) ? "#fff" : MUTED,
                    border: `1.5px solid ${
                      selSauces.includes(s) ? C.mustard : "transparent"
                    }`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}
          {customizationTab === "additions" && (
          <div>
            <div className="grid grid-cols-2 gap-1">
              {ADDITIONS.map((a) => {
                const q = addQtys[a.name] || 0
                return (
                  <div
                    key={a.name}
                    className="flex min-w-0 items-center justify-between gap-1 rounded-xl px-2 py-1"
                    style={{ border: `1px solid ${BORDER}`, background: dark ? "rgba(244,238,220,0.03)" : "rgba(30,30,30,0.02)" }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs leading-tight" style={{ color: TEXT }}>
                        {a.name}
                      </span>
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: q > 0 ? C.mustard : MUTED }}>
                        {q > 0 ? `+${fmt(a.price * q)}` : fmt(a.price)}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => changeAdd(a.name, -1)}
                        disabled={q === 0}
                        aria-label={`Quitar ${a.name}`}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm font-bold disabled:cursor-default disabled:opacity-30"
                        style={{
                          background: dark
                            ? "rgba(244,238,220,0.1)"
                            : "rgba(30,30,30,0.08)",
                          color: TEXT,
                        }}
                      >
                        −
                      </button>
                      <span
                        className="w-5 text-center text-sm font-bold"
                        style={{ color: TEXT }}
                      >
                        {q}
                      </span>
                      <button
                        onClick={() => changeAdd(a.name, 1)}
                        aria-label={`Agregar ${a.name}`}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}
          {customizationTab === "beverages" && (
          <div>
            <div className="mb-1 flex items-center justify-end gap-3">
              <select
                aria-label="Tamaño de gaseosa"
                value={beverageSize}
                onChange={(event) => setBeverageSize(event.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none"
                style={{
                  background: dark ? "#292720" : "#fff",
                  border: `1px solid ${BORDER}`,
                  color: TEXT,
                }}
              >
                {BEVERAGE_SIZES.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.label} · {fmt(size.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {BEVERAGES.map((flavor) => {
                const size = selectedBeverageSize
                const key = `Gaseosa ${flavor} ${size.id}`
                const quantity = addQtys[key] || 0
                return (
                  <div
                    key={flavor}
                    className="flex min-w-0 items-center justify-between gap-1 rounded-xl px-2 py-1"
                    style={{ border: `1px solid ${BORDER}`, background: dark ? "rgba(244,238,220,0.03)" : "rgba(30,30,30,0.02)" }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs leading-tight" style={{ color: TEXT }}>
                        {flavor}
                      </span>
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: quantity > 0 ? C.mustard : MUTED }}>
                        {quantity > 0 ? `+${fmt(size.price * quantity)}` : fmt(size.price)}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => changeAdd(key, -1)}
                        disabled={quantity === 0}
                        aria-label={`Quitar gaseosa ${flavor} ${size.label}`}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm font-bold disabled:cursor-default disabled:opacity-30"
                        style={{
                          background: dark
                            ? "rgba(244,238,220,0.1)"
                            : "rgba(30,30,30,0.08)",
                          color: TEXT,
                        }}
                      >
                        −
                      </button>
                      <span
                        className="w-5 text-center text-sm font-bold"
                        style={{ color: TEXT }}
                      >
                        {quantity}
                      </span>
                      <button
                        onClick={() => changeAdd(key, 1)}
                        aria-label={`Agregar gaseosa ${flavor} ${size.label}`}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}
        </div>
        <div
          className="flex w-full flex-shrink-0 flex-col gap-1.5 px-4 py-2"
          style={{ borderTop: `1px solid ${BORDER}`, background: CARD }}
        >
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex flex-shrink-0 items-center gap-0.5 rounded-xl px-1 py-1"
              style={{
                background: dark
                  ? "rgba(244,238,220,0.07)"
                  : "rgba(30,30,30,0.06)",
              }}
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-9 w-8 rounded-lg flex items-center justify-center font-bold cursor-pointer"
                style={{ color: TEXT }}
              >
                −
              </button>
              <span
                className="w-5 text-center font-black"
                style={{ color: TEXT }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="h-9 w-8 rounded-lg flex items-center justify-center font-bold cursor-pointer"
                style={{ color: TEXT }}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex flex-1 cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              <span>Agregar al carrito</span>
              <span className="font-extrabold">{fmt(total)}</span>
            </button>
          </div>
          {onCheckout && (
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Finalizar compra
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Product Catalog Grid (shared, landing + client) ────────────────────────────
function ProductCatalog({
  onInfoClick,
  onAddClick,
  dark,
}: {
  onInfoClick: (p: Product) => void
  onAddClick: (p: Product) => void
  dark: boolean
}) {
  const [activeCat, setActiveCat] = useState("todos")
  const [search, setSearch] = useState("")
  const [pg, setPg] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  // Changing page brings the menu back into view
  const goPage = (i: number) => {
    setPg(i)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const CARD = dark ? "#1E1C18" : "#fff"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const BG = dark ? "#131210" : "#FAF5E8"
  const filtered = PRODUCTS.filter(
    (p) =>
      (activeCat === "todos" || p.cat === activeCat) &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase())),
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageItems = filtered.slice(
    pg * ITEMS_PER_PAGE,
    (pg + 1) * ITEMS_PER_PAGE,
  )
  const switchCat = (id: string) => {
    setActiveCat(id)
    setPg(0)
  }
  return (
    <div ref={topRef}>
      {/* Category tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {MENU_CATS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => switchCat(cat.id)}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              background:
                activeCat === cat.id
                  ? C.mustard
                  : dark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(30,30,30,0.06)",
              minWidth: "72px",
            }}
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            <span
              className="text-xs font-semibold whitespace-nowrap"
              style={{ color: activeCat === cat.id ? "#fff" : MUTED }}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>
      {/* Search in catalog */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5"
        style={{
          background: dark ? "rgba(255,255,255,0.07)" : "rgba(30,30,30,0.06)",
          border: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ color: MUTED }}>{Ico.search}</span>
        <input
          placeholder="Buscar en el menú..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPg(0)
          }}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: TEXT }}
        />
        {search && (
          <button
            onClick={() => {
              setSearch("")
              setPg(0)
            }}
            className="text-sm cursor-pointer"
            style={{ color: MUTED }}
          >
            ×
          </button>
        )}
      </div>
      {/* Count */}
      <p className="text-xs mb-4" style={{ color: MUTED }}>
        {filtered.length} productos · Página {pg + 1} de{" "}
        {Math.max(1, totalPages)}
      </p>
      {/* Grid — 3 cols, max 2 rows = 6 items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {pageItems.length === 0 && (
          <div
            className="col-span-3 text-center py-10 text-sm"
            style={{ color: MUTED }}
          >
            Sin resultados.
          </div>
        )}
        {pageItems.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-2xl overflow-hidden cursor-pointer"
            style={{
              aspectRatio: "4/3",
              background: CARD,
              boxShadow: dark
                ? "0 2px 12px rgba(0,0,0,0.3)"
                : "0 2px 12px rgba(0,0,0,0.07)",
            }}
            onClick={() => onInfoClick(p)}
          >
            <img
              src={p.img}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Bottom banner — always visible */}
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
              style={{ background: C.mustard }}
            >
              <div className="font-bold text-sm text-white truncate leading-tight">
                {p.name}
              </div>
            </div>
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex flex-col justify-center items-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "rgba(10,8,5,0.85)" }}
            >
              {p.badge && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                  style={{ background: C.mustard, color: "#fff" }}
                >
                  {p.badge}
                </span>
              )}
              <div
                className="font-black text-lg text-white mb-1 text-center"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {p.priceStr}
              </div>
              <p
                className="text-xs text-center mb-3 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {p.desc}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddClick(p)
                }}
                className="px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:opacity-90"
                style={{ background: C.mustard, color: "#fff" }}
              >
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Paginator */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pg === 0}
            onClick={() => goPage(pg - 1)}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer disabled:opacity-30"
            style={{
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(30,30,30,0.08)",
              color: MUTED,
            }}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goPage(i)}
              className="w-8 h-8 rounded-lg text-sm font-bold cursor-pointer"
              style={{
                background:
                  i === pg
                    ? C.mustard
                    : dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(30,30,30,0.08)",
                color: i === pg ? "#fff" : MUTED,
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={pg >= totalPages - 1}
            onClick={() => goPage(pg + 1)}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer disabled:opacity-30"
            style={{
              background: dark
                ? "rgba(255,255,255,0.08)"
                : "rgba(30,30,30,0.08)",
              color: MUTED,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

function GuestMenuPage({
  cart,
  setCart,
  onBack,
  onCheckout,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onBack: () => void
  onCheckout: () => void
}) {
  const [infoProduct, setInfoProduct] = useState<Product | null>(null)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const addToCart = (
    product: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => {
    setCart((items) => [
      ...items,
      {
        id: Date.now(),
        name: product.name,
        description: product.desc,
        price: product.price,
        qty,
        img: product.img,
        sauces,
        additions,
      },
    ])
    setAddProduct(null)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FAF5E8",
        fontFamily: "Poppins, sans-serif",
        color: C.dark,
      }}
    >
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(250,245,232,0.96)",
          borderBottom: "1px solid rgba(30,30,30,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm font-semibold cursor-pointer"
            style={{ color: C.mustard }}
          >
            ← Volver
          </button>
          <div className="flex items-center gap-2 ml-2">
            <img
              src={logoImg}
              alt="El Parche"
              className="w-10 h-10 object-contain"
            />
            <div>
              <div
                className="font-black text-sm"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: C.mustard,
                }}
              >
                El Parche
              </div>
              <div className="text-xs" style={{ color: "rgba(30,30,30,0.45)" }}>
                Menú
              </div>
            </div>
          </div>
          <button
            onClick={onCheckout}
            className="relative ml-auto w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: `${C.mustard}18`, color: C.mustard }}
          >
            {Ico.cart}
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: C.red, color: "#fff" }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1
            className="font-black text-3xl"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Elige tu pedido
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(30,30,30,0.5)" }}>
            Puedes comprar como invitado. Inicia sesión al confirmar para
            guardar tus datos.
          </p>
        </div>
        <ProductCatalog
          dark={false}
          onInfoClick={setInfoProduct}
          onAddClick={setAddProduct}
        />
      </main>
      {infoProduct && (
        <ProductInfoModal
          product={infoProduct}
          onClose={() => setInfoProduct(null)}
          onAddToCart={(product) => {
            setInfoProduct(null)
            setAddProduct(product)
          }}
          dark={false}
        />
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={addToCart}
          onCheckout={onCheckout}
          dark={false}
        />
      )}
    </div>
  )
}

// ── Orders (shared by client app, profile and checkout) ───────────────────────
const ORDER_STEPS = ["Recibido", "Confirmado", "En cocina", "En camino", "Entregado"]
// Orders from this total up need the owner's confirmation
const APPROVAL_MIN = 150000

const itemTotal = (i: CartItem) =>
  (i.price + (i.additions?.reduce((a, b) => a + b.qty * b.price, 0) ?? 0)) *
  i.qty
const cartTotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + itemTotal(i), 0)
const activeCartItemsFirst = (items: CartItem[]) => [
  ...items.filter((item) => item.qty > 0),
  ...items.filter((item) => item.qty === 0),
]

function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function saveLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded / storage blocked: state stays in memory for this session
  }
}

function getAdminAccountStatus(email: string): string | undefined {
  const statuses = loadLS<Record<string, string>>("adminUserStatuses", {})
  return statuses[email.trim().toLowerCase()]
}

// ponytail: all orders live in this browser's localStorage (client + admin
// share it); move to a backend when the shop needs multiple devices.
const loadOrders = () => loadLS<Order[]>("orders", [])
const saveOrders = (orders: Order[]) => saveLS("orders", orders)
const loadRegisteredClients = () =>
  loadLS<RegisteredClient[]>("registeredClients", [])
const saveRegisteredClient = (user: User) => {
  if (user.role !== "user" || !user.email.trim()) return
  const registeredClient: RegisteredClient = {
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    cedula: user.cedula?.trim(),
    docType: user.docType?.trim(),
    phone: user.phone?.trim(),
  }
  const clients = loadRegisteredClients().filter(
    (client) => client.email.toLowerCase() !== registeredClient.email,
  )
  saveLS("registeredClients", [registeredClient, ...clients])
}

// Downscale to keep vouchers small enough for localStorage
function readVoucher(file: File) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, 1000 / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = img.width * s
      c.height = img.height * s
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function VoucherInput({
  value,
  onChange,
}: {
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <label
      className="block cursor-pointer rounded-2xl p-3 text-center text-xs font-semibold"
      style={{ border: `1.5px dashed ${C.mustard}`, color: C.mustard }}
    >
      {value && (
        <img
          src={value}
          alt="Comprobante de pago"
          className="mx-auto max-h-48 rounded-xl mb-2 object-contain"
        />
      )}
      {value ? "Cambiar comprobante" : "📎 Subir comprobante de pago"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) onChange(await readVoucher(f))
        }}
      />
    </label>
  )
}

function OrderList({
  orders,
  dark,
  onSelect,
}: {
  orders: Order[]
  dark: boolean
  onSelect: (o: Order) => void
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"
  if (orders.length === 0)
    return (
      <div className="text-center py-10 text-sm" style={{ color: MUTED }}>
        Aún no has hecho pedidos.
      </div>
    )
  const formatOrderDescription = (order: Order) => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    // Generate a consistent imaginary date based on the order ID
    const idMatch = order.id.match(/\d+/)
    const seed = idMatch ? parseInt(idMatch[0], 10) : Math.floor(Math.random() * 1000)
    const dayIndex = seed % 7
    const day = (seed % 28) + 1
    const month = seed % 12
    return `Pedido del ${days[dayIndex]} ${day} de ${months[month]}`
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const badge = badgeSt(o.status)
        const paymentStatus =
          o.paymentStatus ??
          (o.voucher
            ? "Pendiente de verificación"
            : isTransferPaymentMethod(o.pago)
              ? "Pendiente de verificación"
              : "Pendiente")
        return (
          <div
            key={o.id}
            className="w-full text-left p-4 rounded-2xl"
            style={{
              background: dark ? "#1E1C18" : "#fff",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-sm" style={{ color: TEXT }}>
                  {formatOrderDescription(o)}
                </div>
                <div className="text-xs truncate" style={{ color: MUTED }}>
                  {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                </div>
                {(o.items.some((i) => i.sauces?.length || i.additions?.length)) && (
                  <div className="text-[11px] mt-1" style={{ color: C.mustard }}>
                    Incluye personalizaciones
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold" style={{ color: C.mustard }}>
                  {fmt(o.total)}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: badge?.bg, color: badge?.color }}
                >
                  {o.status}
                </span>
                {paymentStatus !== "Pendiente" && (
                  <div
                    className="mt-1 text-[10px] font-semibold"
                    style={{
                      color:
                        paymentStatus === "Pagado"
                          ? C.forest
                          : paymentStatus === "Rechazado"
                            ? C.red
                            : C.mustard,
                    }}
                  >
                    Pago: {paymentStatus}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelect(o)}
              className="mt-3 w-full py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
              style={{ background: `${C.mustard}15`, color: C.mustard }}
            >
              Ver detalle
            </button>
          </div>
        )
      })}
    </div>
  )
}

function OrderDetailModal({
  order,
  dark,
  onClose,
  onVoucher,
}: {
  order: Order
  dark: boolean
  onClose: () => void
  onVoucher: (id: string, voucher: string) => void
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"
  // Big orders show "Por confirmar" as their first step until the owner approves
  const steps =
    order.status === "Por confirmar"
      ? ["Por confirmar", ...ORDER_STEPS.slice(1)]
      : ORDER_STEPS
  const step = steps.indexOf(order.status)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{ background: dark ? "#1E1C18" : "#fff", color: TEXT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3
            className="font-black text-lg"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Pedido {order.id}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer"
            style={{ color: MUTED }}
            aria-label="Cerrar"
          >
            {Ico.x}
          </button>
        </div>
        <div className="text-xs mb-5" style={{ color: MUTED }}>
          {order.date}
        </div>

        <div className="flex items-center mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: i <= step ? C.mustard : BORDER }}
                />
                <div
                  className="text-center mt-1"
                  style={{
                    color: i === step ? C.mustard : MUTED,
                    fontSize: "0.56rem",
                  }}
                >
                  {s}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 mb-4"
                  style={{ background: i < step ? C.mustard : BORDER }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-4">
          {order.items.map((i) => (
            <div
              key={i.id}
              className="p-3 rounded-xl"
              style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
            >
              <div className="flex justify-between gap-3 text-sm">
                <div className="font-semibold">
                  {i.name} <span style={{ color: MUTED }}>x{i.qty}</span>
                </div>
                <span className="font-semibold">{fmt(itemTotal(i))}</span>
              </div>
              <div className="mt-2 space-y-1 text-xs" style={{ color: MUTED }}>
                <div className="flex justify-between gap-3">
                  <span>Precio ({i.qty} x {fmt(i.price)})</span>
                  <span>{fmt(i.price * i.qty)}</span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: TEXT }}>Salsas:</span>{" "}
                  {i.sauces?.length ? i.sauces.join(", ") : "Sin salsas adicionales"}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: TEXT }}>Adiciones:</span>{" "}
                  {i.additions?.length
                    ? i.additions.map((a) => `${a.name} x${a.qty} (+${fmt(a.price * a.qty * i.qty)})`).join(", ")
                    : "Sin adiciones"}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between font-black pt-2" style={{ borderTop: `2px solid ${BORDER}` }}>
            <span>Total</span>
            <span style={{ color: C.mustard }}>{fmt(order.total)}</span>
          </div>
        </div>

        <div className="space-y-1 text-sm mb-4" style={{ color: MUTED }}>
          <div>
            <strong style={{ color: TEXT }}>Recibe:</strong> {order.nombre}
          </div>
          <div>
            <strong style={{ color: TEXT }}>Dirección:</strong> {order.direccion}
          </div>
          <div>
            <strong style={{ color: TEXT }}>Teléfono:</strong> {order.telefono}
          </div>
          {order.notas && (
            <div>
              <strong style={{ color: TEXT }}>Notas:</strong> {order.notas}
            </div>
          )}
          <div>
            <strong style={{ color: TEXT }}>Pago:</strong> {order.pago}
          </div>
          {order.paymentStatus && (
            <div>
              <strong style={{ color: TEXT }}>Estado del pago:</strong>{" "}
              {order.paymentStatus}
            </div>
          )}
          {order.paymentStatus === "Rechazado" && order.paymentRejectionReason && (
            <div style={{ color: C.red }}>
              <strong>Motivo de rechazo:</strong> {order.paymentRejectionReason}
            </div>
          )}
        </div>

        {order.pago !== "Efectivo" && (
          <VoucherInput
            value={order.voucher}
            onChange={(v) => onVoucher(order.id, v)}
          />
        )}
      </div>
    </div>
  )
}

// ── Cart Summary (reusable) ────────────────────────────────────────────────────
function CartSummary({
  cart,
  setCart,
  dark,
  showTotals = true,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  dark: boolean
  showTotals?: boolean
}) {
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.5)" : "rgba(30,30,30,0.5)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.08)"
  const CARD = dark ? "#1E1C18" : "#fff"
  const subtotal = cartTotal(cart)
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null)
  const descriptionFor = (item: CartItem) =>
    item.description ??
    PRODUCTS.find((product) => product.name === item.name)?.desc ??
    "Hamburguesa preparada al momento con ingredientes frescos."
  const updateQty = (id: number, d: number) =>
    setCart((c) =>
      activeCartItemsFirst(
        c.map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i,
        ),
      ),
    )
  const removeItem = (id: number) =>
    setCart((c) => c.filter((item) => item.id !== id))
  const orderedCart = activeCartItemsFirst(cart)
  if (cart.length === 0)
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-sm" style={{ color: MUTED }}>
          Tu carrito está vacío
        </p>
      </div>
    )
  return (
    <div>
      <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto pr-1">
        {orderedCart.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedItemId((id) => (id === item.id ? null : item.id))
                }
                className="flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer"
                aria-expanded={expandedItemId === item.id}
                aria-label={`${expandedItemId === item.id ? "Ocultar" : "Ver"} detalles de ${item.name}`}
              >
                <img
                  src={item.img}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm" style={{ color: TEXT }}>
                    {item.name}
                  </span>
                  {item.additions && item.additions.length > 0 && (
                    <span className="block text-xs truncate" style={{ color: MUTED }}>
                      +{item.additions.map((a) => a.name).join(", ")}
                    </span>
                  )}
                  <span className="block font-bold text-sm mt-1" style={{ color: C.mustard }}>
                    {fmt(itemTotal(item))}
                  </span>
                </span>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: MUTED }}>
                  {expandedItemId === item.id ? "Menos −" : "Detalles +"}
                </span>
              </button>
              <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    type="button"
                    disabled={item.qty === 0}
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-sm font-bold"
                    style={{
                      background: dark
                        ? "rgba(244,238,220,0.1)"
                        : "rgba(30,30,30,0.08)",
                      color: TEXT,
                      opacity: item.qty === 0 ? 0.45 : 1,
                    }}
                  >
                    −
                  </button>
                  <span
                    className="w-5 text-center text-sm font-bold"
                    style={{ color: TEXT }}
                  >
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    type="button"
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-sm font-bold"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    type="button"
                    className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
                    style={{ color: C.red }}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    title="Eliminar del carrito"
                  >
                    {Ico.trash}
                  </button>
              </div>
            </div>
            {expandedItemId === item.id && (
              <div
                className="mt-3 pt-3 text-xs space-y-2"
                style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}
              >
                <p className="leading-relaxed">{descriptionFor(item)}</p>
                {item.sauces?.length ? (
                  <p><strong style={{ color: TEXT }}>Salsas:</strong> {item.sauces.join(", ")}</p>
                ) : (
                  <p><strong style={{ color: TEXT }}>Salsas:</strong> Sin salsas seleccionadas</p>
                )}
                {item.additions?.length ? (
                  <div>
                    <strong style={{ color: TEXT }}>Adiciones:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {item.additions.map((addition) => (
                        <li key={addition.name}>
                          {addition.name} × {addition.qty} · {fmt(addition.price * addition.qty)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p><strong style={{ color: TEXT }}>Adiciones:</strong> Sin adiciones</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {showTotals && (
      <div
        className="p-4 rounded-xl"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        <div
          className="flex justify-between text-sm mb-1"
          style={{ color: MUTED }}
        >
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div
          className="flex justify-between text-sm mb-2"
          style={{ color: MUTED }}
        >
          <span>Domicilio</span>
          <span style={{ color: MUTED }}>Costo según zona</span>
        </div>
        <div
          className="flex justify-between font-black text-base pt-2"
          style={{
            borderTop: `1px solid ${BORDER}`,
            fontFamily: "Montserrat, sans-serif",
            color: TEXT,
          }}
        >
          <span>Total</span>
          <span style={{ color: C.mustard }}>{fmt(subtotal)}</span>
        </div>
      </div>
      )}
    </div>
  )
}

// ── Checkout Page (split: cart+form | auth) ────────────────────────────────────
function CheckoutPage({
  cart,
  setCart,
  user,
  onLogin,
  onRegisterVerified,
  onBack,
  onPlaceOrder,
  onComplete,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  user: User | null
  onLogin: (u: User) => void
  onRegisterVerified: (u: User) => void
  onBack: () => void
  onPlaceOrder: (info: DeliveryInfo, saveAddress: boolean) => void
  onComplete: () => void
}) {
  const [authTab, setAuthTab] = useState<"login" | "register">("login")
  const [regStep, setRegStep] = useState<"form" | "verifying">("form")
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
  const [delivForm, setDelivForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
    pago: "Efectivo",
  })
  const [editingAddress, setEditingAddress] = useState(
    () => !(user?.addresses?.length),
  )
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
    setEditingAddress(!hasSavedAddress)
    setSaveAddress(!hasSavedAddress)
  }, [user])
  const [code, setCode] = useState("")
  const [voucher, setVoucher] = useState("")
  const [ordered, setOrdered] = useState(false)
  const [placedTotal, setPlacedTotal] = useState(0)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(user ? 2 : 1)
  // Guests see only their cart until they press "Hacer pedido"
  const [showAuth, setShowAuth] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const subtotal = cartTotal(cart)
  const hasActiveItems = cart.some((item) => item.qty > 0)
  const activeCart = cart.filter((item) => item.qty > 0)
  const placeOrder = () => {
    setDeliveryTried(true)
    if (!user || !delivFilled || !payReady || cart.length === 0) return
    onPlaceOrder(
      { ...delivForm, voucher: needsVoucher ? voucher : undefined },
      saveAddress || !(user.addresses?.length),
    )
    setPlacedTotal(subtotal)
    setOrdered(true)
  }
  const continueToReview = () => {
    setDeliveryTried(true)
    if (!delivFilled || !payReady) return
    setCheckoutStep(3)
  }
  // Nequi / Daviplata must attach the payment receipt before continuing
  const needsVoucher = delivForm.pago !== "Efectivo"
  const payReady = !needsVoucher || !!voucher
  const delivFilled =
    !!delivForm.nombre.trim() &&
    !validatePhoneNumber(delivForm.telefono) &&
    !!delivForm.direccion.trim()
  const canOrder = user && delivFilled

  // Errors show after the first submit of each form and update while typing
  const [loginTried, setLoginTried] = useState(false)
  const [regTried, setRegTried] = useState(false)
  const [codeTried, setCodeTried] = useState(false)
  const loginErrors = loginTried
    ? validateLogin(
        loginForm.email,
        loginForm.pass,
        loadLS<User | null>(
          `profile:${loginForm.email.trim().toLowerCase()}`,
          null,
        )?.password,
        getAdminAccountStatus(loginForm.email),
        true,
        !!loadLS<User | null>(
          `profile:${loginForm.email.trim().toLowerCase()}`,
          null,
        )?.password,
      )
    : {}
  const regErrors = regTried ? validateRegister(regForm) : {}
  const codeErr = codeTried ? codeError(code) : ""
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginTried(true)
    const email = loginForm.email.trim().toLowerCase()
    const savedProfile = loadLS<User | null>(`profile:${email}`, null)
    if (
      Object.keys(
        validateLogin(
          loginForm.email,
          loginForm.pass,
          savedProfile?.password,
          getAdminAccountStatus(email),
          true,
          !!savedProfile?.password,
        ),
      ).length
    )
      return
    const role = email.includes("admin") ? "admin" : "user"
    const name = email
      .split("@")[0]
      .replace(/\./g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
    onLogin({ name, email, role })
    setCheckoutStep(2)
  }
  const handleRegisterForm = (e: React.FormEvent) => {
    e.preventDefault()
    setRegTried(true)
    if (Object.keys(validateRegister(regForm)).length) return
    setRegStep("verifying")
  }
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setCodeTried(true)
    if (codeError(code)) return
    onRegisterVerified({
      name: regForm.name.trim(),
      email: regForm.email.trim().toLowerCase(),
      role: "user",
      docType: regForm.docType,
      phone: regForm.phone.replace(/\s/g, ""),
      cedula: regForm.docNum.trim(),
      password: regForm.pass,
    })
    setCheckoutStep(2)
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
  const cta = !user
    ? showAuth
      ? null
      : {
          label: "Hacer pedido",
          onClick: () => setShowAuth(true),
          disabled: !hasActiveItems,
        }
    : checkoutStep === 2
      ? {
          label: "Confirma tus datos",
          onClick: continueToReview,
          disabled: cart.length === 0,
        }
      : {
          label: "Confirmar pedido",
          onClick: placeOrder,
          disabled: !hasActiveItems || !canOrder || !payReady,
        }

  if (ordered)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#FAF5E8", fontFamily: "Poppins, sans-serif" }}
      >
        <div className="w-full max-w-md p-8 rounded-3xl text-center" style={CARD_ST}>
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: `${C.forest}18`, color: C.forest }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            className="font-black text-2xl mb-2"
            style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
          >
            ¡Pedido confirmado!
          </h2>
          <p className="text-sm mb-6" style={{ color: MUTED }}>
            {delivForm.pago !== "Efectivo"
              ? "Recibimos tu comprobante. El pedido queda pendiente de verificación; cuando se apruebe, se enviará a producción."
              : placedTotal >= APPROVAL_MIN
                ? "Por su valor, tu pedido quedó pendiente de confirmación por El Parche."
                : "Recibimos tu pedido y pronto empezaremos a prepararlo."}{" "}
            Puedes seguir su estado en &quot;Mis pedidos&quot;.
          </p>
          <div
            className="text-left text-sm rounded-2xl p-4 mb-6 space-y-2"
            style={{ background: "rgba(30,30,30,0.03)" }}
          >
            {[
              ["Entrega en", delivForm.direccion],
              ["Recibe", delivForm.nombre],
              ["Método de pago", delivForm.pago],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span style={{ color: MUTED }}>{k}</span>
                <span className="font-semibold text-right" style={{ color: C.dark }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
            style={{ background: C.mustard, color: "#fff" }}
          >
            Ver mis pedidos
          </button>
        </div>
      </div>
    )

  return (
    <div
      className="min-h-screen"
      style={{ background: "#FAF5E8", fontFamily: "Poppins, sans-serif" }}
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
            <img src={logoImg} alt="El Parche" className="h-9 w-9 object-contain" />
            <span
              className="font-black hidden sm:inline"
              style={{ fontFamily: "Montserrat, sans-serif", color: C.mustard }}
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
          style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
        >
          Finalizar mi pedido
        </h1>

        {/* Stepper */}
        <ol className="flex items-center max-w-xl mx-auto mb-10">
          {["Identificación", "Entrega", "Revisión"].map((label, i) => {
            const step = (i + 1) as 1 | 2 | 3
            const done = checkoutStep > step || (step === 1 && !!user)
            const active = checkoutStep === step && !done
            const reachable =
              (step === 1 && !user) ||
              (step === 2 && !!user) ||
              (step === 3 && !!user && !!delivFilled && payReady)
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

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* LEFT: current step */}
          <div className="flex flex-col gap-6 min-w-0">
            {!user && !showAuth && (
              <section className="p-6 rounded-2xl" style={CARD_ST}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h2 className="font-bold text-lg" style={{ color: C.dark }}>
                    Tu carrito
                  </h2>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="flex-shrink-0 mt-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer hover:opacity-80"
                    style={{
                      border: `1.5px dashed ${C.mustard}`,
                      color: C.mustard,
                      background: "#fff",
                    }}
                  >
                    + Agregar más productos
                  </button>
                </div>
                <p className="text-sm mb-5" style={{ color: MUTED }}>
                  Revisa tus productos antes de hacer el pedido.
                </p>
                <CartSummary cart={cart} setCart={setCart} dark={false} showTotals={false} />
              </section>
            )}

            {!user && showAuth && (
              <section className="p-6 rounded-2xl" style={CARD_ST}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="font-bold text-lg" style={{ color: C.dark }}>
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
                <p className="text-sm mb-5" style={{ color: MUTED }}>
                  Inicia sesión o crea tu cuenta para guardar tu pedido y
                  seguir su estado.
                </p>
                <div
                  className="flex rounded-xl overflow-hidden mb-5 p-1"
                  style={{ background: "rgba(30,30,30,0.06)" }}
                >
                  {(["login", "register"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setAuthTab(tab)
                        setRegStep("form")
                      }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
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
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                      style={{ background: C.mustard, color: "#fff" }}
                    >
                      Iniciar sesión
                    </button>
                  </form>
                )}
                {authTab === "register" && regStep === "form" && (
                  <form
                    onSubmit={handleRegisterForm}
                    noValidate
                    className="flex flex-col gap-2.5"
                  >
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
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                      style={{ background: C.mustard, color: "#fff" }}
                    >
                      Crear cuenta →
                    </button>
                  </form>
                )}
                {authTab === "register" && regStep === "verifying" && (
                  <form onSubmit={handleVerify} noValidate className="flex flex-col gap-4">
                    <p
                      className="text-xs text-center"
                      style={{ color: "rgba(30,30,30,0.5)" }}
                    >
                      Código enviado a <strong>{regForm.email}</strong>. (Demo:{" "}
                      {DEMO_CODE})
                    </p>
                    <input
                      maxLength={6}
                      placeholder="000000"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      aria-invalid={!!codeErr}
                      className="w-full px-4 py-4 rounded-xl text-center text-2xl font-bold tracking-widest outline-none"
                      style={{
                        background: "rgba(30,30,30,0.05)",
                        border: `1.5px solid ${codeErr ? C.red : "rgba(30,30,30,0.12)"}`,
                        color: "#1A1714",
                      }}
                    />
                    <FieldError msg={codeErr} />
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                      style={{ background: C.mustard, color: "#fff" }}
                    >
                      Verificar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep("form")}
                      className="text-xs text-center cursor-pointer"
                      style={{ color: "rgba(30,30,30,0.45)" }}
                    >
                      ← Corregir mis datos
                    </button>
                  </form>
                )}
              </section>
            )}

            {user && checkoutStep === 2 && (
              <>
                <section className="p-6 rounded-2xl" style={CARD_ST}>
                  <h2 className="font-bold text-lg mb-1" style={{ color: C.dark }}>
                    Datos de entrega
                  </h2>
                  <p className="text-sm mb-5" style={{ color: MUTED }}>
                    ¿A dónde llevamos tu pedido?
                  </p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={deliverToOtherPerson}
                    onClick={toggleDeliveryRecipient}
                    className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                    style={{
                      background: deliverToOtherPerson ? `${C.mustard}12` : "rgba(30,30,30,0.03)",
                      border: `1px solid ${deliverToOtherPerson ? `${C.mustard}70` : LINE}`,
                    }}
                  >
                    <span className="min-w-0">
                      <strong className="block text-sm" style={{ color: C.dark }}>
                        El pedido lo recibe otra persona
                      </strong>
                      <span className="mt-0.5 block text-xs" style={{ color: MUTED }}>
                        {deliverToOtherPerson
                          ? "Ingresa los datos de quien recibirá el pedido."
                          : "Activa esta opción para indicar otro destinatario."}
                      </span>
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
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ["nombre", deliverToOtherPerson ? "Nombre de quien recibe *" : "Nombre completo *", "text", "Quién recibe"],
                      ["telefono", deliverToOtherPerson ? "Teléfono de quien recibe *" : "Teléfono *", "tel", "3XX XXX XXXX"],
                      ["notas", "Notas para el pedido", "text", "Ej: sin cebolla, timbre dañado"],
                    ].map(([k, lbl, t, ph]) => (
                      <div
                        key={k}
                        className={k === "notas" ? "sm:col-span-2" : ""}
                      >
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
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setEditingAddress((editing) => !editing)}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: C.mustard }}
                      >
                        {editingAddress ? "Usar dirección seleccionada" : "Cambiar dirección"}
                      </button>
                    </div>
                    {editingAddress ? (
                      <InputField
                        label="Dirección de entrega *"
                        placeholder="Calle, número, barrio y ciudad"
                        value={delivForm.direccion}
                        onChange={(direccion) =>
                          setDelivForm((form) => ({ ...form, direccion }))
                        }
                        required
                        error={
                          deliveryTried && !delivForm.direccion.trim()
                            ? "La dirección de entrega es obligatoria."
                            : undefined
                        }
                      />
                    ) : (
                      <div
                        className="px-4 py-3 rounded-xl text-sm"
                        style={{ background: "rgba(30,30,30,0.04)", color: C.dark }}
                      >
                        {delivForm.direccion}
                      </div>
                    )}
                    {editingAddress && (user.addresses?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {user.addresses!.map((address) => (
                          <button
                            key={address}
                            type="button"
                            onClick={() => {
                              setDelivForm((form) => ({ ...form, direccion: address }))
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
                    <label className="flex items-start gap-2 mt-3 text-xs cursor-pointer" style={{ color: MUTED }}>
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
                          style={{ fontFamily: "Montserrat, sans-serif", color: C.mustard }}
                        >
                          {fmt(subtotal)}
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
              <section className="p-6 rounded-2xl" style={CARD_ST}>
                <h2 className="font-bold text-lg mb-5" style={{ color: C.dark }}>
                  Revisa y confirma
                </h2>
                {[
                  {
                    title: "Entrega",
                    rows: [
                      ["Recibe", delivForm.nombre],
                      ["Teléfono", delivForm.telefono],
                      ["Dirección", delivForm.direccion],
                      ...(delivForm.notas ? [["Notas", delivForm.notas]] : []),
                    ],
                  },
                  {
                    title: "Pago",
                    rows: [
                      ["Método", delivForm.pago],
                      ...(needsVoucher
                        ? [["Comprobante", voucher ? "Adjunto ✓" : "Falta"]]
                        : []),
                    ],
                  },
                ].map((g) => (
                  <div
                    key={g.title}
                    className="pb-4 mb-4"
                    style={{ borderBottom: `1px solid ${LINE}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: MUTED }}
                      >
                        {g.title}
                      </h3>
                      <button
                        onClick={() => setCheckoutStep(2)}
                        className="text-xs font-semibold cursor-pointer hover:opacity-70"
                        style={{ color: C.mustard }}
                      >
                        Editar
                      </button>
                    </div>
                    {g.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm py-0.5">
                        <span style={{ color: MUTED }}>{k}</span>
                        <span className="font-medium text-right" style={{ color: C.dark }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

              </section>
            )}
          </div>

          {/* RIGHT: order summary */}
          <aside className="p-6 rounded-2xl lg:sticky lg:top-24" style={CARD_ST}>
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
              <div className="flex justify-between" style={{ color: MUTED }}>
                <span>Domicilio</span>
                <span style={{ color: MUTED }}>Costo según zona</span>
              </div>
            </div>
            <div
              className="flex justify-between items-baseline font-black text-lg pt-4 mt-4"
              style={{
                borderTop: `1px solid ${LINE}`,
                fontFamily: "Montserrat, sans-serif",
                color: C.dark,
              }}
            >
              <span>Total</span>
              <span style={{ color: C.mustard }}>{fmt(subtotal)}</span>
            </div>
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
            {user && checkoutStep >= 2 && (!delivFilled || !payReady) && (
              <p className="mt-3 text-xs text-center" style={{ color: MUTED }}>
                {!delivFilled
                  ? "Completa nombre, teléfono y dirección para continuar."
                  : `Sube el comprobante de ${delivForm.pago} para continuar.`}
              </p>
            )}
          </aside>
        </div>
      </div>
      {pickerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-5"
            style={{ background: "#FAF5E8" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-black text-xl"
                style={{ fontFamily: "Montserrat, sans-serif", color: C.dark }}
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
              onInfoClick={setAddProduct}
              onAddClick={setAddProduct}
            />
          </div>
        </div>
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={(product, qty, sauces, additions) => {
            setCart((items) => [
              ...items,
              {
                id: Date.now(),
                name: product.name,
                description: product.desc,
                price: product.price,
                qty,
                img: product.img,
                sauces,
                additions,
              },
            ])
            setAddProduct(null)
            setPickerOpen(false)
          }}
          dark={false}
        />
      )}
    </div>
  )
}

// ── Change Password Form ─────────────────────────────────────────────────────────
function ChangePasswordForm({
  user,
  onUpdateUser,
}: {
  user: User
  onUpdateUser: (u: User) => void
}) {
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const MUSTARD = "#B68C1C"
  const RED = "#A54131"
  const TEXT = "#1A1714"
  const MUTED = "rgba(30,30,30,0.5)"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validate current password
    if (!user.password) {
      setError("No tienes una contraseña establecida. Usa la opción de recuperar contraseña.")
      return
    }
    if (currentPass !== user.password) {
      setError("La contraseña actual es incorrecta.")
      return
    }

    // Validate new password
    if (newPass.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (newPass !== confirmPass) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (newPass === currentPass) {
      setError("La nueva contraseña debe ser diferente a la actual.")
      return
    }

    // Update password
    onUpdateUser({ ...user, password: newPass })
    setCurrentPass("")
    setNewPass("")
    setConfirmPass("")
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Contraseña actual
        </label>
        <input
          type="password"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Nueva contraseña
        </label>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: MUTED }}>
          Confirmar nueva contraseña
        </label>
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(30,30,30,0.05)",
            border: "1.5px solid rgba(30,30,30,0.12)",
            color: TEXT,
          }}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-xs" style={{ color: RED }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs" style={{ color: "#2E7D60" }}>
          ¡Contraseña actualizada exitosamente!
        </p>
      )}
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
        style={{ background: MUSTARD, color: "#fff" }}
      >
        Actualizar contraseña
      </button>
    </form>
  )
}

// ── Profile Page ───────────────────────────────────────────────────────────────
function ProfilePage({
  user,
  onBack,
  onLogout,
  onUpdateUser,
  orders,
  onVoucher,
}: {
  user: User
  onBack: () => void
  onLogout: () => void
  onUpdateUser: (u: User) => void
  orders: Order[]
  onVoucher: (id: string, voucher: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = orders.find((o) => o.id === selectedId)
  const AVATARS = ["👨‍💼", "👩‍💼", "🧑‍🍳", "👨‍🦱", "👩‍🦰", "🙋", "🧑‍💻"]
  const [avatarIdx, setAvatarIdx] = useState(0)
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
      style={{ background: BG, fontFamily: "Poppins, sans-serif" }}
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
            style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
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
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-1 cursor-pointer hover:opacity-80 overflow-hidden"
            style={{
              background: `${C.mustard}18`,
              border: `2px solid ${C.mustard}`,
            }}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              AVATARS[avatarIdx]
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
            style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
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
                    label="Correo *"
                    type="email"
                    value={form.email}
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
        {/* Purchase history */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: CARD, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <h2 className="font-bold text-base mb-4" style={{ color: TEXT }}>
            Historial de compras
          </h2>
          <OrderList
            orders={orders}
            dark={false}
            onSelect={(o) => setSelectedId(o.id)}
          />
          <div className="mt-3 text-xs text-center" style={{ color: MUTED }}>
            Total gastado:{" "}
            <strong style={{ color: TEXT }}>
              {fmt(orders.reduce((s, o) => s + o.total, 0))}
            </strong>
          </div>
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
      {selected && (
        <OrderDetailModal
          order={selected}
          dark={false}
          onClose={() => setSelectedId(null)}
          onVoucher={onVoucher}
        />
      )}
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
            <div className="text-4xl mb-3">🚪</div>
            <h3
              className="font-black text-lg mb-2"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
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
            <div className="text-4xl mb-3">⚠️</div>
            <h3
              className="font-black text-lg mb-2"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
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
                style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
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

// ── Client Web App ─────────────────────────────────────────────────────────────
function ClientApp({
  user,
  onLogout,
  onAdmin,
  onCheckout,
  onProfile,
  cart,
  setCart,
  orders,
  onVoucher,
  initialView = "menu",
}: {
  user: User
  onLogout: () => void
  onAdmin: () => void
  onCheckout: () => void
  onProfile: () => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  orders: Order[]
  onVoucher: (id: string, voucher: string) => void
  initialView?: "menu" | "cart" | "orders"
}) {
  const [view, setView] = useState<"menu" | "cart" | "orders">(initialView)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = orders.find((o) => o.id === selectedId)
  const [theme, setTheme] = useState<Theme>("light")
  const [profileOpen, setProfileOpen] = useState(false)
  const [infoProduct, setInfoProduct] = useState<Product | null>(null)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const dark = theme === "dark"
  const BG = dark ? "#131210" : "#FAF5E8"
  const TEXT = dark ? "#F4EEDC" : "#1A1714"
  const MUTED = dark ? "rgba(244,238,220,0.45)" : "rgba(30,30,30,0.45)"
  const BORDER = dark ? "rgba(244,238,220,0.08)" : "rgba(30,30,30,0.09)"

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const addToCart = (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => {
    setCart((c) => [
      ...c,
      {
        id: Date.now(),
        name: p.name,
        description: p.desc,
        price: p.price,
        qty,
        img: p.img,
        sauces,
        additions,
      },
    ])
    setAddProduct(null)
  }
  const quickAdd = (p: Product) =>
    setCart((c) => {
      const ex = c.find(
        (x) => x.name === p.name && (x.additions?.length ?? 0) === 0,
      )
      if (ex)
        return c.map((x) => (x.id === ex.id ? { ...x, qty: x.qty + 1 } : x))
      return [
        ...c,
        { id: Date.now(), name: p.name, description: p.desc, price: p.price, qty: 1, img: p.img },
      ]
    })

  if (view === "profile" as string) return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BG, fontFamily: "Poppins, sans-serif", color: TEXT }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: dark ? "rgba(19,18,16,0.97)" : "rgba(250,245,232,0.97)",
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src={logoImg}
              alt="El Parche"
              className="h-11 w-11 object-contain"
            />
            <div>
              <div
                className="font-black text-sm leading-none"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: C.mustard,
                }}
              >
                El Parche
              </div>
              <div style={{ color: MUTED, fontSize: "0.6rem" }}>
                Mini Burguer
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-2">
            {(["menu", "orders"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
                style={{
                  background: view === v ? `${C.mustard}15` : "transparent",
                  color: view === v ? C.mustard : MUTED,
                }}
              >
                {v === "menu" ? "Menú" : "Mis Pedidos"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: BORDER, color: TEXT }}
            >
              {dark ? Ico.sun : Ico.moon}
            </button>
            <button
              onClick={() => setView("cart")}
              className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{
                background: view === "cart" ? `${C.mustard}20` : BORDER,
                color: view === "cart" ? C.mustard : TEXT,
              }}
            >
              {Ico.cart}
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    background: C.red,
                    color: "#fff",
                    fontSize: "0.6rem",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setView("orders")}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{
                background: view === "orders" ? `${C.mustard}20` : BORDER,
                color: view === "orders" ? C.mustard : TEXT,
              }}
            >
              {Ico.orders}
            </button>
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer overflow-hidden"
                style={{ background: C.mustard, color: "#fff" }}
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-11 w-52 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: dark ? "#1E1C18" : "#fff",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div
                    className="px-4 py-3.5"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="font-semibold text-sm"
                      style={{ color: TEXT }}
                    >
                      {user.name}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onProfile()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                    style={{ color: C.mustard }}
                  >
                    Mi perfil
                  </button>
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onAdmin()
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                      style={{ color: C.amber }}
                    >
                      Panel Admin
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer"
                    style={{ color: C.red }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {view === "menu" && (
          <div>
            <div className="mb-5">
              <h2
                className="font-black text-2xl"
                style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
              >
                Nuestro Menú
              </h2>
              <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                Haz clic en cualquier producto para ver los detalles
              </p>
            </div>
            <ProductCatalog
              dark={dark}
              onInfoClick={(p) => setInfoProduct(p)}
              onAddClick={(p) => setAddProduct(p)}
            />
            <div
              className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: `${C.forest}12`,
                border: `1px solid ${C.forest}22`,
              }}
            >
              <span className="text-2xl">🧅</span>
              <span className="text-sm font-medium" style={{ color: C.forest }}>
                Especialidad: <strong>cebolla marinada</strong> — 100% gratis
                con tu pedido.
              </span>
            </div>
          </div>
        )}
        {view === "cart" && (
          <div className="max-w-lg mx-auto">
            <h2
              className="font-black text-2xl mb-5"
              style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
            >
              Carrito
            </h2>
            <CartSummary cart={cart} setCart={setCart} dark={dark} />
            {cart.length > 0 && (
              <button
                onClick={onCheckout}
                className="w-full mt-4 py-4 rounded-2xl font-bold text-sm cursor-pointer hover:opacity-90"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Confirmar pedido →
              </button>
            )}
            {cart.length === 0 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setView("menu")}
                  className="px-8 py-3 rounded-full font-bold text-sm cursor-pointer"
                  style={{ background: C.mustard, color: "#fff" }}
                >
                  Ver menú
                </button>
              </div>
            )}
          </div>
        )}
        {view === "orders" && (
          <div className="max-w-2xl mx-auto">
            <h2
              className="font-black text-2xl mb-5"
              style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
            >
              Mis pedidos
            </h2>
            <OrderList
              orders={orders}
              dark={dark}
              onSelect={(o) => setSelectedId(o.id)}
            />
          </div>
        )}
      </main>

      {selected && (
        <OrderDetailModal
          order={selected}
          dark={dark}
          onClose={() => setSelectedId(null)}
          onVoucher={onVoucher}
        />
      )}
      {infoProduct && (
        <ProductInfoModal
          product={infoProduct}
          onClose={() => setInfoProduct(null)}
          onAddToCart={(p) => setAddProduct(p)}
          dark={dark}
        />
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={addToCart}
          onCheckout={onCheckout}
          dark={dark}
        />
      )}
      {/* Quick-add feedback suppressed — quickAdd used from ProductCatalog + button */}
      <div style={{ display: "none" }} onClick={() => quickAdd(PRODUCTS[0])} />
    </div>
  )
}

// ── Landing Page ───────────────────────────────────────────────────────────────
function LandingPage({
  onLogin,
  onAdmin,
  onGuestMenu,
  onCheckout,
  cart,
  setCart,
}: {
  onLogin: () => void
  onAdmin: () => void
  onGuestMenu: () => void
  onCheckout: () => void
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}) {
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [waBubble, setWaBubble] = useState(true)
  const [legalModal, setLegalModal] = useState<"envios" | "legal" | null>(null)
  const [infoProduct, setInfoProduct] = useState<Product | null>(null)
  const [addProduct, setAddProduct] = useState<Product | null>(null)
  const BG = dark ? "#13110E" : "#FAF4E8"
  const TEXT = dark ? "#F0E8D6" : "#18140A"
  const MUTED = dark ? "rgba(240,232,214,0.48)" : "rgba(24,20,10,0.5)"
  const BORDER = dark ? "rgba(240,232,214,0.07)" : "rgba(24,20,10,0.08)"
  const HDR_BG = scrolled
    ? dark
      ? "rgba(19,17,14,0.96)"
      : "rgba(250,244,232,0.96)"
    : "transparent"
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])
  const addToCart = (
    p: Product,
    qty: number,
    sauces: string[],
    additions: { name: string; qty: number; price: number }[],
  ) => {
    setCart((c) => [
      ...c,
      {
        id: Date.now(),
        name: p.name,
        description: p.desc,
        price: p.price,
        qty,
        img: p.img,
        sauces,
        additions,
      },
    ])
    setAddProduct(null)
  }
  const NAVLINKS = [
    { label: "Inicio", href: "#inicio" },
    { label: "Menú", href: "#menu" },
    { label: "Pedidos", href: "#pedidos" },
    { label: "Nosotros", href: "#nosotros" },
    { label: "Contacto", href: "#contacto" },
  ]
  const goToMenu = onGuestMenu

  return (
    <div
      style={{ background: BG, fontFamily: "Poppins, sans-serif", color: TEXT }}
    >
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: HDR_BG,
          boxShadow: scrolled ? `0 1px 0 ${BORDER}` : "none",
          backdropFilter: scrolled ? "blur(14px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16 md:h-20">
          <a href="#inicio" className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="El Parche"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
            />
            <div>
              <div
                className="font-black text-base sm:text-lg leading-tight"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: C.mustard,
                }}
              >
                El Parche
              </div>
              <div
                style={{
                  color: scrolled ? MUTED : "rgba(255,255,255,0.65)",
                  fontSize: "0.62rem",
                }}
              >
                Mini Burguer
              </div>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-8">
            {NAVLINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium hover:opacity-60 transition-opacity"
                style={{ color: scrolled ? TEXT : "#fff" }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: BORDER, color: scrolled ? TEXT : "#fff" }}
            >
              {dark ? Ico.sun : Ico.moon}
            </button>
            {/* Cart */}
            <button
              onClick={onCheckout}
              className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: BORDER, color: scrolled ? TEXT : "#fff" }}
            >
              {Ico.cart}
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    background: C.red,
                    color: "#fff",
                    fontSize: "0.6rem",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={onAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full font-semibold border cursor-pointer hover:opacity-70"
              style={{
                color: scrolled ? TEXT : "#fff",
                borderColor: scrolled ? BORDER : "rgba(255,255,255,0.3)",
              }}
            >
              {Ico.settings} Admin
            </button>
            <button
              onClick={onLogin}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{
                color: scrolled ? TEXT : "#fff",
                border: `1px solid ${
                  scrolled ? BORDER : "rgba(255,255,255,0.35)"
                }`,
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={goToMenu}
              className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-bold cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Pide Ahora
            </button>
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                color: scrolled ? TEXT : "#fff",
                background: menuOpen ? BORDER : "transparent",
              }}
            >
              {menuOpen ? Ico.x : Ico.menu}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            className="lg:hidden px-5 py-5 flex flex-col gap-1"
            style={{
              background: dark
                ? "rgba(19,17,14,0.98)"
                : "rgba(250,244,232,0.98)",
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {NAVLINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold py-3 px-3 rounded-xl"
                style={{ color: TEXT, borderBottom: `1px solid ${BORDER}` }}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onLogin()
                }}
                className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer"
                style={{ color: TEXT, border: `1px solid ${BORDER}` }}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  goToMenu()
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Pide Ahora
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600&h=900&fit=crop&auto=format"
          alt="Burger artesanal"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,8,5,0.82) 0%, rgba(15,10,5,0.55) 60%, rgba(20,14,8,0.35) 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-20 pb-16">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
              style={{
                background: "rgba(182,140,28,0.2)",
                border: "1px solid rgba(182,140,28,0.35)",
                color: C.amber,
              }}
            >
              🔥 Desde 2013 en Bello, Antioquia
            </div>
            <h1
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.6rem,8vw,5.5rem)",
                lineHeight: 1.04,
                color: "#FAF3E0",
                letterSpacing: "-0.025em",
              }}
            >
              El sabor que
              <br />
              <span style={{ color: C.mustard }}>te reúne</span>
            </h1>
            <p
              className="mt-4 mb-8 text-base sm:text-lg leading-relaxed"
              style={{
                color: "rgba(250,243,224,0.62)",
                maxWidth: "480px",
                fontWeight: 300,
              }}
            >
              Mini burgers artesanales preparadas al momento con ingredientes
              frescos. Local y domicilio en Bello.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={goToMenu}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-base cursor-pointer hover:opacity-90"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Pedir ahora
              </button>
              <a
                href={`https://wa.me/${WA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
              >
                WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-8 mt-8">
              {[
                ["4.9", "Calificación"],
                ["200+", "Reseñas"],
                ["10+", "Años"],
              ].map(([val, lbl]) => (
                <div key={lbl}>
                  <div
                    className="font-black text-xl"
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      color: C.amber,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(250,243,224,0.4)" }}
                  >
                    {lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="py-6 px-5 sm:px-8" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-4">
          <div
            className="rounded-2xl px-6 py-5 flex items-center gap-5"
            style={{ background: C.forest }}
          >
            <div className="text-4xl flex-shrink-0">🛵</div>
            <div>
              <div
                className="font-black text-lg text-white"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Domicilios por toda la zona
              </div>
              <div
                className="text-sm mt-0.5"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Consulta la cobertura y el costo del envío al realizar tu pedido.
              </div>
            </div>
          </div>
          <div
            className="rounded-2xl px-6 py-5 flex items-center gap-5"
            style={{ background: C.red }}
          >
            <div className="text-4xl flex-shrink-0">🧅</div>
            <div>
              <div
                className="font-black text-lg text-white"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Cebolla Marinada
              </div>
              <div
                className="text-sm mt-0.5"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Nuestra especialidad —{" "}
                <strong style={{ color: "#fff" }}>100% Gratis</strong>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="py-12 sm:py-20" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="mb-8">
            <div
              className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3"
              style={{ background: `${C.mustard}15`, color: C.mustard }}
            >
              Nuestro Menú
            </div>
            <h2
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 800,
                color: TEXT,
                fontSize: "clamp(2rem,6vw,3.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Todo lo que <span style={{ color: C.red }}>preparamos</span>
            </h2>
          </div>
          <ProductCatalog
            dark={dark}
            onInfoClick={(p) => setInfoProduct(p)}
            onAddClick={(p) => setAddProduct(p)}
          />
          {cartCount > 0 && (
            <div
              className="mt-6 flex items-center justify-between p-4 rounded-2xl"
              style={{ background: C.mustard }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <div className="font-bold text-sm text-white">
                    {cartCount} producto{cartCount > 1 ? "s" : ""} en tu carrito
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Listo para ordenar
                  </div>
                </div>
              </div>
              <button
                onClick={onCheckout}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                style={{ background: "#fff", color: C.mustard }}
              >
                Ver carrito →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        className="py-16 sm:py-24 px-5 sm:px-8"
        style={{ background: dark ? "#0A0805" : C.dark }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="mb-10"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              color: "#FAF3E0",
              fontSize: "clamp(2rem,6vw,3.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            ¿Cómo <span style={{ color: C.mustard }}>funciona?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                t: "Elige tu pedido",
                d: "Explora el menú y selecciona lo que quieras.",
              },
              {
                n: "02",
                t: "Lo preparamos",
                d: "Todo al momento con ingredientes frescos.",
              },
              {
                n: "03",
                t: "Lo disfrutas",
                d: "En el local o a tu puerta, siempre caliente.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 rounded-2xl"
                style={{
                  background: "rgba(250,243,224,0.04)",
                  border: "1px solid rgba(250,243,224,0.07)",
                }}
              >
                <div
                  className="font-black text-5xl mb-4"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    color: `${C.mustard}22`,
                  }}
                >
                  {s.n}
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: "#FAF3E0" }}
                >
                  {s.t}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(250,243,224,0.45)", fontWeight: 300 }}
                >
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOSOTROS — expanded */}
      <section
        id="nosotros"
        className="py-16 sm:py-24 px-5 sm:px-8"
        style={{ background: BG }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
            style={{ background: `${C.mustard}12`, color: C.mustard }}
          >
            Nuestra Historia
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-12">
            <div>
              <h2
                className="mb-4"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 800,
                  color: TEXT,
                  fontSize: "clamp(1.8rem,5vw,3rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Más que un restaurante,
                <br />
                <span style={{ color: C.red }}>somos el parche</span>
              </h2>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: MUTED, fontWeight: 300 }}
              >
                Desde 2013, El Parche de las Mini Burguer nació en el corazón de
                Bello como un pequeño sueño familiar. Hoy somos uno de los
                puntos de encuentro más queridos del norte del Valle de Aburrá.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: MUTED, fontWeight: 300 }}
              >
                Cada hamburguesa, perro caliente o salchipapa que sale de
                nuestra cocina lleva el mismo amor y cuidado del primer día.
                Ingredientes frescos, recetas propias y el calor de siempre.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1554919428-20d72fa44a99?w=700&h=520&fit=crop&auto=format"
                alt="Interior El Parche"
                className="rounded-3xl object-cover w-full"
                style={{ height: "280px" }}
              />
              <div
                className="absolute bottom-4 right-4 p-4 rounded-2xl"
                style={{ background: C.mustard }}
              >
                <div
                  className="font-black text-2xl text-white"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  2013
                </div>
                <div className="text-xs text-white opacity-80">
                  Fundados en Bello
                </div>
              </div>
            </div>
          </div>
          {/* Misión, Visión, Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: "🎯",
                title: "Misión",
                text: "Preparar mini burgers artesanales de alta calidad con ingredientes frescos, llevando sabor y alegría a cada cliente de Bello y sus alrededores.",
              },
              {
                icon: "🚀",
                title: "Visión",
                text: "Ser el restaurante de fast food artesanal más querido del norte del Valle de Aburrá para 2026, expandiendo nuestras sedes sin perder la esencia familiar.",
              },
              {
                icon: "💛",
                title: "Valores",
                text: "Calidad sin compromisos, honestidad con nuestros clientes, pasión en cada preparación, puntualidad en entregas y servicio cálido y cercano.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="p-6 rounded-2xl"
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(30,30,30,0.04)",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3
                  className="font-black text-lg mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
                >
                  {v.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: MUTED, fontWeight: 300 }}
                >
                  {v.text}
                </p>
              </div>
            ))}
          </div>
          {/* Equipo */}
          <h3
            className="font-black text-xl mb-5"
            style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
          >
            Nuestro equipo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                name: "La Familia Fundadora",
                role: "Dirección General",
                emoji: "👨‍👩‍👧",
              },
              {
                name: "Equipo de Cocina",
                role: "Preparación & Calidad",
                emoji: "👨‍🍳",
              },
              {
                name: "Equipo de Servicio",
                role: "Atención al cliente",
                emoji: "🤝",
              },
              { name: "Repartidores", role: "Domicilios Express", emoji: "🛵" },
            ].map((m) => (
              <div
                key={m.name}
                className="p-5 rounded-2xl text-center"
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(30,30,30,0.04)",
                }}
              >
                <div className="text-4xl mb-2">{m.emoji}</div>
                <div className="font-bold text-sm" style={{ color: TEXT }}>
                  {m.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {m.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="pedidos"
        className="py-16 sm:py-24 px-5 sm:px-8"
        style={{ background: dark ? "#0A0805" : C.dark }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="mb-4"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              color: "#FAF3E0",
              fontSize: "clamp(2rem,7vw,3.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            ¿Listo para <span style={{ color: C.mustard }}>pedir?</span>
          </h2>
          <p
            className="mb-8 text-base"
            style={{ color: "rgba(250,243,224,0.48)", fontWeight: 300 }}
          >
            Agrega productos al carrito sin necesidad de registro. ¡Pruébalo
            ahora!
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() =>
                document
                  .getElementById("menu")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 rounded-2xl font-bold text-base cursor-pointer hover:opacity-90"
              style={{ background: C.mustard, color: "#fff" }}
            >
              Ver el menú
            </button>
            {cartCount > 0 && (
              <button
                onClick={onCheckout}
                className="px-8 py-4 rounded-2xl font-bold text-base cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                }}
              >
                Mi carrito ({cartCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contacto"
        className="pt-14 pb-6 px-5 sm:px-8"
        style={{ background: "#0E0C09" }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10"
            style={{ borderBottom: "1px solid rgba(250,243,224,0.07)" }}
          >
            <div className="flex flex-col items-start gap-4">
              <img
                src={logoImg}
                alt="El Parche"
                className="object-contain"
                style={{ width: "100px", height: "100px" }}
              />
              <div>
                <div
                  className="font-black text-xl leading-tight"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    color: C.mustard,
                  }}
                >
                  El Parche
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "rgba(250,243,224,0.4)" }}
                >
                  de las Mini Burguer
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[
                  {
                    href: `https://www.instagram.com/elparchedelasminiburguers`,
                    bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743)",
                    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                  },
                  {
                    href: `https://wa.me/${WA}`,
                    bg: "#25D366",
                    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
                  },
                  {
                    href: "https://www.facebook.com/elparchedelasminiburguers",
                    bg: "#1877F2",
                    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                  },
                ].map(({ href, bg, path }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
                    style={{ background: bg }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4
                className="font-bold text-sm mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Contacto
              </h4>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-2.5 items-start">
                  <span style={{ color: C.amber, marginTop: "2px" }}>📍</span>
                  <span style={{ color: "rgba(250,243,224,0.45)" }}>
                    051053, Cra. 58A #42c-28, Bello, Antioquia
                  </span>
                </li>
                <li className="flex gap-2.5 items-center">
                  <span style={{ color: C.amber }}>📞</span>
                  <a href="tel:+573206332670" style={{ color: C.amber }}>
                    320 633 2670
                  </a>
                </li>
                <li className="flex gap-2.5 items-center">
                  <span style={{ color: C.amber }}>✉️</span>
                  <a
                    href="mailto:Elparchedelasminiburguers@gmail.com"
                    style={{ color: C.amber, fontSize: "0.72rem" }}
                  >
                    Elparchedelasminiburguers@gmail.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="font-bold text-sm mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Horario
              </h4>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(250,243,224,0.04)",
                  border: "1px solid rgba(250,243,224,0.06)",
                }}
              >
                <div className="flex justify-between py-1">
                  <span
                    className="text-sm"
                    style={{ color: "rgba(250,243,224,0.5)" }}
                  >
                    Lun – Dom
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: C.amber }}
                  >
                    6:00pm a 11:30pm
                  </span>
                </div>
                <div
                  className="mt-3 pt-3 text-xs"
                  style={{
                    color: "rgba(250,243,224,0.3)",
                    borderTop: "1px solid rgba(250,243,224,0.06)",
                  }}
                >
                  🚀 Domicilios disponibles en toda la zona
                </div>
              </div>
            </div>
            <div>
              <h4
                className="font-bold text-sm mb-5 uppercase tracking-wider"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: "#FAF3E0",
                  letterSpacing: "0.08em",
                }}
              >
                Legal
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <button
                    onClick={() => setLegalModal("envios")}
                    className="text-sm cursor-pointer hover:opacity-70 text-left"
                    style={{
                      color: "rgba(250,243,224,0.4)",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Política de Envíos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModal("legal")}
                    className="text-sm cursor-pointer hover:opacity-70 text-left"
                    style={{
                      color: "rgba(250,243,224,0.4)",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Aviso Legal
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ color: "rgba(250,243,224,0.2)" }}
          >
            <span>© 2024 El Parche de las Mini Burguer · Bello, Antioquia</span>
            <button
              onClick={onAdmin}
              style={{
                color: "rgba(250,243,224,0.18)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Admin
            </button>
          </div>
        </div>
      </footer>

      {/* WhatsApp bubble */}
      {waBubble && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-br-sm"
            style={{
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            <span
              className="text-sm font-medium flex-1"
              style={{ color: "#1A1714" }}
            >
              ¿Cómo podemos ayudarte? 👋
            </span>
            <button
              onClick={() => setWaBubble(false)}
              className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.07)", color: "#666" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <a
            href={`https://wa.me/${WA}?text=Hola%20El%20Parche%2C%20quiero%20hacer%20mi%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "#25D366",
              boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      )}
      {!waBubble && (
        <a
          href={`https://wa.me/${WA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "#25D366",
            boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
      <button
        type="button"
        onClick={goToMenu}
        className="fixed bottom-28 left-4 right-20 z-40 rounded-full py-3 text-sm font-bold text-white shadow-lg sm:hidden"
        style={{ background: C.mustard }}
      >
        Pide Ahora
      </button>

      {infoProduct && (
        <ProductInfoModal
          product={infoProduct}
          onClose={() => setInfoProduct(null)}
          onAddToCart={(p) => {
            setInfoProduct(null)
            setAddProduct(p)
          }}
          dark={dark}
        />
      )}
      {addProduct && (
        <AddToCartModal
          product={addProduct}
          onClose={() => setAddProduct(null)}
          onAdd={addToCart}
          onCheckout={onCheckout}
          dark={dark}
        />
      )}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setLegalModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#fff", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-bold text-base" style={{ color: "#18140A" }}>
                {legalModal === "envios" ? "Política de Envíos" : "Aviso Legal"}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="cursor-pointer"
                style={{ color: "rgba(30,30,30,0.4)" }}
              >
                {Ico.x}
              </button>
            </div>
            <div
              className="px-6 py-5 overflow-y-auto text-sm leading-relaxed"
              style={{
                color: "rgba(24,20,10,0.65)",
                maxHeight: "60vh",
                scrollbarWidth: "none",
              }}
            >
              {legalModal === "envios" ? (
                <div className="flex flex-col gap-3">
                  <p>
                    Realizamos domicilios en toda la zona. El costo y el tiempo
                    estimado de entrega se confirman según la dirección antes de
                    completar el pedido.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p>
                    El consumo de nuestros productos es responsabilidad del
                    cliente. Garantizamos calidad e higiene. Prohibida la
                    reproducción de marca sin autorización.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
type AdminNotification = {
  id: number
  type: "warn" | "danger" | "info"
  title: string
  message: string
  module: string
  time: string
  target: AdminSection
}

const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 1,
    type: "warn",
    title: "Stock bajo",
    message: "El queso cheddar tiene 12 kg; el mínimo es 15 kg.",
    module: "Insumos",
    time: "Hace 5 min",
    target: "insumos",
  },
  {
    id: 2,
    type: "danger",
    title: "Pedido por aprobar",
    message: "El pedido PED-0195 supera $150.000 y requiere autorización.",
    module: "Pedidos",
    time: "Hace 18 min",
    target: "pedidos",
  },
  {
    id: 3,
    type: "warn",
    title: "Reabastecimiento pendiente",
    message: "La lechuga está en niveles críticos y debe reabastecerse hoy.",
    module: "Insumos",
    time: "Hace 42 min",
    target: "insumos",
  },
  {
    id: 4,
    type: "info",
    title: "Fichas técnicas",
    message: "Hay 3 fichas técnicas pendientes de revisión esta semana.",
    module: "Productos",
    time: "Hace 1 h",
    target: "producto",
  },
]

function AdminProfilePage({
  user,
  onClose,
  onUpdateUser,
}: {
  user: User
  onClose: () => void
  onUpdateUser: (u: User) => void
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
    user.addresses || ["Cra 58 #42-10, Bello, Antioquia"],
  )
  const [newAddr, setNewAddr] = useState("")
  const [addingAddr, setAddingAddr] = useState(false)
  const [editingAddrIdx, setEditingAddrIdx] = useState<number | null>(null)
  const [editingAddrValue, setEditingAddrValue] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const BG = "#FAF5E8"
  const CARD = "#fff"
  const TEXT = "#1A1714"
  const MUTED = "rgba(30,30,30,0.5)"
  const BORDER = "rgba(30,30,30,0.08)"

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
      setAddresses((arr) =>
        arr.map((a, i) => (i === editingAddrIdx ? editingAddrValue.trim() : a)),
      )
    }
    setEditingAddrIdx(null)
    setEditingAddrValue("")
  }

  const deleteAddress = (idx: number) => {
    if (addresses.length <= 1) return
    setAddresses((arr) => arr.filter((_, i) => i !== idx))
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: BG, fontFamily: "Poppins, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1
              className="font-black text-2xl"
              style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
            >
              Mi perfil
            </h1>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: "rgba(30,30,30,0.06)", color: MUTED }}
            >
              {Ico.x}
            </button>
          </div>
          {/* Avatar */}
          <div
            className="flex flex-col items-center mb-6 p-6 rounded-3xl"
            style={{ background: CARD, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-1 cursor-pointer hover:opacity-80 overflow-hidden"
              style={{
                background: `${C.mustard}18`,
                border: `2px solid ${C.mustard}`,
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
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
              style={{ fontFamily: "Montserrat, sans-serif", color: TEXT }}
            >
              {user.name}
            </div>
            <div className="text-sm mt-0.5" style={{ color: MUTED }}>
              {user.email}
            </div>
            <div
              className="text-xs mt-1 px-3 py-1 rounded-full font-semibold"
              style={{ background: `${C.mustard}15`, color: C.mustard }}
            >
              Administrador
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
                      label="Correo *"
                      type="email"
                      value={form.email}
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
                      style={{
                        color: addresses.length <= 1 ? "rgba(30,30,30,0.2)" : C.red,
                        cursor: addresses.length <= 1 ? "not-allowed" : "pointer",
                      }}
                      title={
                        addresses.length <= 1
                          ? "Debes tener al menos una dirección registrada"
                          : "Eliminar dirección"
                      }
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
                    if (e.key === "Enter" && newAddr.trim()) {
                      setAddresses((a) => [...a, newAddr.trim()])
                      setNewAddr("")
                      setAddingAddr(false)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newAddr.trim()) {
                      setAddresses((a) => [...a, newAddr.trim()])
                      setNewAddr("")
                      setAddingAddr(false)
                    }
                  }}
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
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer"
              style={{
                background: "rgba(30,30,30,0.05)",
                color: "rgba(30,30,30,0.4)",
              }}
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
        {/* Delete account modal - Different alert for admin */}
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
              <div className="text-4xl mb-3">⚠️</div>
              <h3
                className="font-black text-lg mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
              >
                ¿Eliminar cuenta de administrador?
              </h3>
              <p className="text-sm mb-5" style={{ color: "rgba(30,30,30,0.5)" }}>
                Esta acción es permanente y no se puede deshacer. Perderás acceso al panel de administración y todos los datos asociados a tu cuenta.
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
                    onClose()
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
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#1A1714" }}
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
    </div>
  )
}

function AdminPanel({
  onSwitchToClient,
  onLogout,
  user,
}: {
  onSwitchToClient: () => void
  onLogout: () => void
  user: User | null
}) {
  const [theme, setTheme] = useState<Theme>("light")
  const [section, setSection] = useState<AdminSection>("dashboard")
  const [open, setOpen] = useState<string[]>(["ventas-g"])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<number>>(
    () => new Set(),
  )
  const [showAdminProfile, setShowAdminProfile] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sidebarScrollTop = useRef(0)
  const preserveSidebarScroll = useCallback((node: HTMLElement | null) => {
    if (node) node.scrollTop = sidebarScrollTop.current
  }, [])
  const dark = theme === "dark"
  const t = tk(dark)
  // Orders placed by clients in the web store
  const clientOrders = loadOrders()
  const notifications: AdminNotification[] = [
    ...clientOrders
      .filter(
        (o) =>
          o.paymentStatus === "Pendiente de verificación" ||
          (o.status === "Por confirmar" && o.paymentStatus !== "Rechazado"),
      )
      .map((o, i) => ({
        id: 1000 + i,
        type: "warn" as const,
        title:
          o.paymentStatus === "Pendiente de verificación"
            ? "Transferencia por verificar"
            : "Pedido por confirmar",
        message: `${o.cliente} hizo el pedido ${o.id} por ${fmt(o.total)}${
          o.voucher ? " y subió el comprobante de pago" : ""
        }.`,
        module: "Pedidos",
        time: o.date,
        target: "pedidos" as const,
      })),
    ...ADMIN_NOTIFICATIONS,
  ]
  const unreadNotifications = notifications.length - readNotifications.size

  const [rows, setRows] = useState<Record<string, (string | number)[][]>>(() => {
    const initialRows = Object.fromEntries(
      Object.entries(MOD_CFG).map(([key, config]) => [
        key,
        config.seed.map((row) => [...row] as (string | number)[]),
      ]),
    ) as Record<string, (string | number)[][]>
    const savedUserStatuses = loadLS<Record<string, string>>(
      "adminUserStatuses",
      {},
    )
    initialRows.usuarios = (initialRows.usuarios || []).map((row) => {
      const email = String(row[4] ?? "").trim().toLowerCase()
      const savedStatus = savedUserStatuses[email]
      if (!savedStatus) return row
      const updatedRow = [...row]
      updatedRow[5] = savedStatus
      return updatedRow
    })
    initialRows.pedidos = [
      ...clientOrders.map((o) => {
        const orderLines: AdminOrderLine[] = o.items.flatMap((item, index) => {
          const parentId = `${o.id}-line-${index}`
          const mainLine: AdminOrderLine = {
            id: parentId,
            product: item.name,
            category: String(initialRows.producto?.find((product) => product[0] === item.name)?.[1] ?? ""),
            quantity: item.qty,
            unitPrice: item.price,
          }
          const additions: AdminOrderLine[] = (item.additions || []).map((addition, additionIndex) => ({
            id: `${parentId}-addition-${additionIndex}`,
            product: addition.name,
            category: "Adiciones",
            quantity: addition.qty * item.qty,
            unitPrice: addition.price,
            parentId,
          }))
          return [mainLine, ...additions]
        })
        const paymentStatus =
          o.paymentStatus ??
          (o.voucher
            ? ["Confirmado", "En cocina", "En camino", "Entregado"].includes(o.status)
              ? "Pagado"
              : "Pendiente de verificación"
            : isTransferPaymentMethod(o.pago)
              ? "Pendiente de verificación"
              : "Pendiente")
        return [
          o.id,
          o.cliente,
          orderLines.map((line) => `${line.quantity} ${line.product}${line.parentId ? ` (adición de ${orderLines.find((parent) => parent.id === line.parentId)?.product ?? "producto"})` : ""}`).join(", "),
          "Online",
          o.pago === "Efectivo" ? "Efectivo" : "Transferencia",
          o.pago === "Efectivo" ? "Contraentrega" : "Anticipado",
          o.total,
          o.status,
          paymentStatus,
          o.productionAuthorized
            ? "Autorizada"
            : paymentStatus === "Pendiente de verificación" || paymentStatus === "Rechazado"
              ? "Pendiente de pago"
              : o.status === "Por confirmar"
                ? "Pendiente admin"
                : o.total >= APPROVAL_MIN
              ? "Autorizada"
              : "Enviada a producción",
          JSON.stringify(orderLines),
          o.paymentRejectionReason ?? "",
        ]
      }),
      ...(initialRows.pedidos || []),
    ]
    // Client orders that don't wait for the owner (or were already confirmed) get their
    // production orders; oldest first so the newest ends up on top
    initialRows.pedidos
      .slice(0, clientOrders.length)
      .reverse()
      .filter((order) => ["Enviada a producción", "Autorizada"].includes(String(order[9])))
      .filter((order) => {
        const stored = clientOrders.find((clientOrder) => clientOrder.id === order[0])
        return !stored?.productionRecords?.length
      })
      .forEach((order) => {
        const lines = JSON.parse(String(order[10] ?? "[]")) as AdminOrderLine[]
        initialRows.produccion = buildProductionRows(lines, initialRows.produccion || [], String(order[0]))
      })
    initialRows.produccion = [
      ...clientOrders.flatMap((order) => order.productionRecords ?? []),
      ...(initialRows.produccion || []),
    ]
    initialRows.pedidos
      .slice(0, clientOrders.length)
      .reverse()
      .filter((order) => ["Enviada a producción", "Autorizada"].includes(String(order[9])))
      .filter((order) => {
        const stored = clientOrders.find((clientOrder) => clientOrder.id === order[0])
        return !stored?.productionRecords?.length
      })
      .forEach((order) => {
        const lines = JSON.parse(String(order[10] ?? "[]")) as AdminOrderLine[]
        initialRows.produccion = buildProductionRows(
          lines,
          initialRows.produccion || [],
          String(order[0]),
        )
      })
    const supplyProducts = (initialRows.insumos || [])
      .filter((row) => String(row[7]).toLowerCase() === "sí")
      .map(supplyAsProduct)
    initialRows.producto = [...supplyProducts, ...(initialRows.producto || [])]
    const existingClientEmails = new Set(
      (initialRows.clientes || []).flatMap((row) =>
        row.slice(4, 6).map((value) => String(value ?? "").trim().toLowerCase())
          .filter((value) => value.includes("@")),
      ),
    )
    const registeredClientRows = loadRegisteredClients()
      .filter((client) => !existingClientEmails.has(client.email.toLowerCase()))
      .map((client) => [
        client.name,
        client.docType ?? "",
        client.cedula ?? "",
        client.phone ?? "",
        client.email,
        "",
        "No",
        "Activo",
      ])
    initialRows.clientes = [...registeredClientRows, ...(initialRows.clientes || [])]
    const duplicatedSales = (initialRows.pedidos || [])
      .filter(
        (order) =>
          String(order[8]).toLowerCase() === "pagado" &&
          !["En camino", "Entregado"].includes(String(order[7])),
      )
      .map((order, index) => [
        `VTA-AUTO-${String(index + 1).padStart(2, "0")}`,
        "Admin Parche",
        order[1],
        clientOrders.find((clientOrder) => clientOrder.id === order[0])?.date ?? "",
        order[3],
        order[4],
        order[6],
        order[6],
        "Pendiente",
        order[0],
        order[7],
        order[10] ?? "[]",
      ])
    initialRows.ventas = [...duplicatedSales, ...(initialRows.ventas || [])]
    return initialRows
  })
  const [anulled, setAnulled] = useState<Record<string, Set<number>>>({})
  const [prodImgs, setProdImgs] = useState<Record<number, string>>({})
  const [paymentProofs, setPaymentProofs] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        clientOrders.flatMap((o, i) => (o.voucher ? [[i, o.voucher]] : [])),
      ),
  )
  const [paymentProofDraft, setPaymentProofDraft] = useState("")
  const [search, setSearch] = useState<Record<string, string>>({})
  const [pg, setPg] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<{
    mode: ModalMode
    section: string
    idx: number | null
  }>({ mode: null, section: "", idx: null })
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [formValidationAttempted, setFormValidationAttempted] = useState(false)
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({})
  const [imgPreview, setImgPreview] = useState("")
  const [technicalSheetOpen, setTechnicalSheetOpen] = useState(false)
  const [technicalIngredients, setTechnicalIngredients] = useState<TechnicalIngredient[]>([])
  const [technicalIngredientSelect, setTechnicalIngredientSelect] = useState("")
  const [technicalIngredientQuantity, setTechnicalIngredientQuantity] = useState("1")
  const [technicalSheetError, setTechnicalSheetError] = useState("")
  const [pedidoProductoSelect, setPedidoProductoSelect] = useState("")
  const [pedidoProductCategory, setPedidoProductCategory] = useState("Todas")
  const [pedidoProductQuantity, setPedidoProductQuantity] = useState("1")
  const [pedidoParentSelect, setPedidoParentSelect] = useState("")
  const [pedidoOrderLines, setPedidoOrderLines] = useState<AdminOrderLine[]>([])
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([])
  const [productionProductSelect, setProductionProductSelect] = useState("")
  const [productionItemQuantity, setProductionItemQuantity] = useState("1")
  const [productionFormError, setProductionFormError] = useState("")
  // "Nueva compra" item picker (limited to the selected supplier's insumos)
  const [purchaseItemSelect, setPurchaseItemSelect] = useState("")
  const [purchaseItemQty, setPurchaseItemQty] = useState("1")
  const [purchaseItemPrice, setPurchaseItemPrice] = useState("")
  const [purchaseFormError, setPurchaseFormError] = useState("")
  // "Enviar a pérdida" from a purchase line (edit mode)
  const [lossDraft, setLossDraft] = useState<{
    insumo: string
    unit: string
    max: number
    qty: string
    motivo: string
    responsable: string
    fecha: string
    origin: string
  } | null>(null)
  const [lossError, setLossError] = useState("")
  const [purchaseNotice, setPurchaseNotice] = useState("")
  const resetPurchasePicker = () => {
    setPurchaseItemSelect("")
    setPurchaseItemQty("1")
    setPurchaseItemPrice("")
    setPurchaseFormError("")
    setPurchaseNotice("")
    setLossDraft(null)
  }
  const [pncTarget, setPncTarget] = useState<number | null>(null)
  const [pncForm, setPncForm] = useState<Record<string, string>>({})
  const [pncError, setPncError] = useState("")
  const [pncFieldErrors, setPncFieldErrors] = useState<Record<string, string>>({})
  const [quickClientOpen, setQuickClientOpen] = useState(false)
  const [quickClientForm, setQuickClientForm] = useState<Record<string, string>>({})
  const [quickClientErrors, setQuickClientErrors] = useState<Record<string, string>>({})
  const [clientFormError, setClientFormError] = useState("")
  // Validation message for the insumo's technical sheet (producto de insumo)
  const [supplyFormError, setSupplyFormError] = useState("")
  // Live validation (categories, insumos, productos): a field shows its error once it
  // has been changed or after the first "Guardar"
  const [formInitial, setFormInitial] = useState<Record<string, string>>({})
  const [formTried, setFormTried] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const changed = Object.keys(formData).filter(
      (key) => (formData[key] ?? "") !== (formInitial[key] ?? ""),
    )
    if (changed.some((key) => !touchedFields[key]))
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(changed.map((key) => [key, true])),
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])
  const [quickClientError, setQuickClientError] = useState("")
  const [delTarget, setDelTarget] = useState<{
    section: string
    idx: number
  } | null>(null)
  const [paymentRejectionTarget, setPaymentRejectionTarget] = useState<number | null>(null)
  const [paymentRejectionReason, setPaymentRejectionReason] = useState("")
  const [paymentRejectionError, setPaymentRejectionError] = useState("")
  const [anulTarget, setAnulTarget] = useState<{
    section: string
    idx: number
  } | null>(null)
  const [chartFilter, setChartFilter] =
    useState<"hoy" | "semana" | "mes" | "año">("semana")
  const [rolesPerms, setRolesPerms] =
    useState<Record<string, Record<string, string[]>>>(() =>
      loadLS("adminRolePermissions", {}),
    )

  useEffect(() => {
    saveLS("adminRolePermissions", rolesPerms)
  }, [rolesPerms])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false)
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      )
        setNotificationsOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const toggleGrp = (k: string) =>
    setOpen((g) => (g.includes(k) ? g.filter((x) => x !== k) : [...g, k]))
  const sectionLabel =
    SIDEBAR_MENU.find((item) => item.key === section)?.label ??
    SIDEBAR_MENU.flatMap((item) => item.children).find(
      (child) => child.key === section,
    )?.label ??
    ""
  const markNotificationRead = (id: number) => {
    setReadNotifications((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }
  const markAllNotificationsRead = () =>
    setReadNotifications(
      new Set(notifications.map((notification) => notification.id)),
    )

  const getAutoTechVersion = (existingRows: (string | number)[][] = []) => {
    const versions = existingRows
      .map((r) => String(r[6] ?? "").trim())
      .filter(Boolean)
      .map((value) => {
        const match = /^v?(\d+)(?:\.(\d+))?$/i.exec(value)
        if (!match) return null
        return { major: Number(match[1]), minor: Number(match[2] || "0") }
      })
      .filter((item): item is { major: number; minor: number } => item !== null)

    const maxMajor = versions.length
      ? Math.max(...versions.map((item) => item.major))
      : 0
    const maxMinor = versions.filter((item) => item.major === maxMajor).length
      ? Math.max(
          ...versions
            .filter((item) => item.major === maxMajor)
            .map((item) => item.minor),
        )
      : 0

    return `v${maxMajor + 1}.${maxMinor}`
  }

  const getTechVersions = (productName: string) => {
    const versions = (rows.producto || [])
      .filter((r) => String(r[0] ?? "") === productName)
      .map((r) => ({
        version: String(r[6] ?? ""),
        name: String(r[5] ?? ""),
        insumos: String(r[7] ?? ""),
        preparacion: String(r[8] ?? ""),
      }))
    return versions
  }

  const nextTechVersion = (version: string) => {
    const match = /^v?(\d+)(?:\.(\d+))?$/i.exec(version.trim())
    return match
      ? `v${Number(match[1])}.${Number(match[2] || "0") + 1}`
      : getAutoTechVersion(rows.producto || [])
  }

  const getAvailableInsumos = () => {
    const sourceRows = rows.insumos || []
    const options = sourceRows
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)

    return [
      ...new Set(
        options.length
          ? options
          : [
              "Carne de res 100g",
              "Queso cheddar",
              "Pan brioche",
              "Lechuga",
              "Salchicha",
              "Tomate",
              "Cebolla",
              "Papas",
              "Salsa de la casa",
            ],
      ),
    ].sort((a, b) => a.localeCompare(b))
  }

  const getProductRecipe = (product: (string | number)[] | undefined) => {
    if (!product) return []
    try {
      const recipe = JSON.parse(String(product[9] ?? "[]"))
      if (Array.isArray(recipe)) {
        return recipe
          .map((item) => ({
            name: String(item.name ?? "").trim(),
            quantity: Number(item.quantity),
            unit: String(item.unit ?? "").trim(),
          }))
          .filter(
            (item) => item.name && Number.isFinite(item.quantity) && item.quantity > 0 && item.unit,
          )
      }
    } catch {
      // Older product rows have only a comma-separated list of ingredient names.
    }
    return String(product[7] ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        quantity: 1,
        unit: String(rows.insumos?.find((supply) => supply[0] === name)?.[2] ?? "und"),
      }))
  }

  const getAdminOrderLines = (order: (string | number)[] | undefined): AdminOrderLine[] => {
    if (!order) return []
    try {
      const storedLines = JSON.parse(String(order[10] ?? "[]"))
      if (Array.isArray(storedLines)) {
        return storedLines
          .map((line, index) => ({
            id: String(line.id ?? `line-${index}`),
            product: String(line.product ?? "").trim(),
            category: String(line.category ?? ""),
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            ...(line.parentId ? { parentId: String(line.parentId) } : {}),
          }))
          .filter((line) => line.product && line.quantity > 0 && line.unitPrice >= 0)
      }
    } catch {
      // Legacy orders have a human-readable product list in column 2.
    }
    const availableProducts = (rows.producto || [])
      .map((product) => String(product[0] ?? ""))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
    return String(order[2] ?? "")
      .split(",")
      .map((entry, index) => {
        const text = entry.trim()
        const productName = availableProducts.find((name) =>
          text.toLowerCase().includes(name.toLowerCase()),
        )
        if (!productName) return null
        const quantity = Number(text.match(/^\s*(\d+)/)?.[1] ?? 1)
        const product = rows.producto?.find((item) => item[0] === productName)
        return {
          id: `legacy-${index}`,
          product: productName,
          category: String(product?.[1] ?? ""),
          quantity: Math.max(1, quantity),
          unitPrice: Number(product?.[2] ?? 0),
        }
      })
      .filter((line): line is AdminOrderLine => line !== null)
  }

  const getSaleOrderLines = (sale: (string | number)[] | null) => {
    if (!sale) return []
    try {
      const storedLines = JSON.parse(String(sale[11] ?? "[]"))
      if (Array.isArray(storedLines) && storedLines.length) {
        return storedLines
          .map((line, index) => ({
            id: String(line.id ?? `sale-line-${index}`),
            product: String(line.product ?? "").trim(),
            category: String(line.category ?? ""),
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            ...(line.parentId ? { parentId: String(line.parentId) } : {}),
          }))
          .filter((line) => line.product && line.quantity > 0 && line.unitPrice >= 0)
      }
    } catch {
      // Sales created before line snapshots use the associated order as their source.
    }
    const order = rows.pedidos?.find((candidate) => candidate[0] === sale[9])
    return getAdminOrderLines(order)
  }

  const getAvailableProductos = () => {
    const options = (rows.producto || [])
      .filter(
        (row) =>
          !["inactivo", "inactiva"].includes(String(row[4] ?? "").toLowerCase()) &&
          String(row[10] ?? "Disponible").toLowerCase() !== "no disponible",
      )
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    return [
      ...new Set(
        options.length ? options : PRODUCTS.map((product) => product.name),
      ),
    ].sort((a, b) => a.localeCompare(b))
  }

  const getProductionOrderItems = (row: (string | number)[] | undefined) => {
    if (!row) return []
    try {
      const items = JSON.parse(String(row[13] ?? "[]"))
      if (Array.isArray(items) && items.length) {
        return items
          .map((item) => ({
            name: String(item.name ?? item.product ?? "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            ...(item.category ? { category: String(item.category) } : {}),
            ...(item.parentId ? { parentId: String(item.parentId) } : {}),
          }))
          .filter((item) => item.name)
      }
    } catch {
      // Use the legacy single-product fields.
    }
    const name = String(row[1] ?? "").trim()
    return name ? [{ name, quantity: Math.max(1, Number(row[2]) || 1) }] : []
  }

  const getNonconformingProductOptions = () => {
    const products = (rows.producto || [])
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    const supplies = (rows.insumos || [])
      .map((row) => String(row[0] ?? "").trim())
      .filter(Boolean)
    return [...new Set([...products, ...supplies])].sort((a, b) => a.localeCompare(b))
  }

  const getNonconformingItems = (row: (string | number)[] | undefined) => {
    if (!row) return []
    try {
      const items = JSON.parse(String(row[2] ?? "[]"))
      if (Array.isArray(items) && items.length) {
        return items
          .map((item) => ({
            name: String(item.name ?? "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
          }))
          .filter((item) => item.name)
      }
    } catch {
      // Use the legacy product field below.
    }
    return String(row[1] ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, quantity: Math.max(1, Number(row[3]) || 1) }))
  }

  const getProductSupplyOptions = () =>
    [...new Set(
      (rows.producto || [])
        .filter((product) => product[1] === "Producto de insumo")
        .map((product) => String(product[0] ?? ""))
        .filter(Boolean),
    )].sort((a, b) => a.localeCompare(b))

  const getCurrentDateTimeParts = () => {
    const now = new Date()
    return {
      date: [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-"),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    }
  }

  const getNextProductionPriority = (
    productionRows: (string | number)[][] = rows.produccion || [],
  ) =>
    productionRows.length
      ? Math.max(
          0,
          ...productionRows.map((row) => Number(row[3]) || 0),
        ) + 1
      : 1

  const getNextProductionCode = (
    productionRows: (string | number)[][] = rows.produccion || [],
  ) => {
    const lastNumber = Math.max(
      0,
      ...productionRows.map((row) => {
        const match = /^OP-(\d+)$/i.exec(String(row[0] ?? ""))
        return match ? Number(match[1]) : 0
      }),
    )
    return `OP-${String(lastNumber + 1).padStart(4, "0")}`
  }

  const getNextOrderCode = (
    orderRows: (string | number)[][] = rows.pedidos || [],
  ) => {
    const lastNumber = Math.max(
      0,
      ...orderRows.map((row) => {
        const match = /^PED-(\d+)$/i.exec(String(row[0] ?? ""))
        return match ? Number(match[1]) : 0
      }),
    )
    return `PED-${String(lastNumber + 1).padStart(4, "0")}`
  }

  const getRequiredFormKeys = (
    sec: string,
    draft: Record<string, string>,
    mode: ModalMode,
  ) => {
    const clientIsLocal = String(draft["6"] ?? "").toLowerCase() === "sí"
    const excludedKeys: Record<string, string[]> = {
      insumos:
        String(draft["7"] ?? "").toLowerCase() === "sí"
          ? ["8", "9"]
          : ["8", "9", "10", "11"],
      producto: ["5", "6", "7", "8", "10"],
      produccion: ["0", "1"],
      "producto-no-conforme": ["0", "1", "2", "5", "6"],
      compras: ["3", "4"],
      pedidos: ["1", "5", "9"],
    }
    const managedRequiredKeys: Record<string, string[]> = {
      usuarios: ["0", "1", "2", "3", "4", ...(mode === "add" ? ["6"] : [])],
      clientes: [
        "0",
        "1",
        "2",
        "3",
        ...(clientIsLocal ? [] : ["4", "5"]),
      ],
      proveedores: [
        "0", "1", "2", "3", "5", "7", "8", "9", "10", "11", "12", "13", "14",
      ],
      roles: ["0", "1"],
    }

    if (managedRequiredKeys[sec]) return managedRequiredKeys[sec]
    return (MOD_CFG[sec]?.fields || [])
      .filter(
        (field) =>
          field.type !== "image" &&
          !(excludedKeys[sec] || []).includes(field.key),
      )
      .map((field) => field.key)
  }

  const getManagedFieldError = (
    sec: string,
    key: string,
    value: string,
    draft: Record<string, string>,
    mode: ModalMode = modal.mode,
  ) => {
    const trimmed = value.trim()
    const clientIsLocal = String(draft["6"] ?? "").toLowerCase() === "sí"
    const required =
      sec === "usuarios"
        ? ["0", "1", "2", "3", "4", ...(mode === "add" ? ["6"] : [])].includes(key)
        : sec === "clientes"
          ? ["0", "1", "2", "3", ...(clientIsLocal ? [] : ["4", "5"])].includes(key)
          : sec === "proveedores"
            ? ["0", "1", "2", "3", "5", "7", "8", "9", "10", "11", "12", "13", "14"].includes(key)
            : sec === "roles"
              ? ["0", "1"].includes(key)
              : false

    if (required && !trimmed) return "Este campo es obligatorio."
    if (!trimmed) return ""

    if ((sec === "usuarios" && key === "2") || (sec === "clientes" && key === "2")) {
      return validateDocumentNumber(trimmed, String(draft["1"] ?? ""))
    }
    if (sec === "proveedores" && key === "1") {
      const digits = digitsOnly(trimmed)
      return /^[\d.-]+$/.test(trimmed) && digits.length >= 8 && digits.length <= 15
        ? ""
        : "Escribe un NIT válido (de 8 a 15 dígitos)."
    }
    if (sec === "proveedores" && key === "9") {
      return validateDocumentNumber(trimmed, String(draft["8"] ?? ""))
    }
    if ((sec === "usuarios" && key === "4") ||
        (sec === "clientes" && key === "4") ||
        (sec === "proveedores" && ["2", "13"].includes(key))) {
      return EMAIL_PATTERN.test(trimmed) ? "" : "Escribe un correo electrónico válido."
    }
    if ((sec === "clientes" && key === "3") ||
        (sec === "proveedores" && ["3", "12"].includes(key))) {
      return validatePhoneNumber(trimmed)
    }
    if (sec === "roles" && key === "0") {
      const name = trimmed.toLowerCase()
      const sameNameExists = (rows.roles || []).some((row, index) => {
        if (mode === "edit" && modal.idx === index) return false
        return String(row[0] ?? "").trim().toLowerCase() === name
      })
      return sameNameExists ? "Ya existe un rol con este nombre." : ""
    }
    return ""
  }

  const validateManagedForm = (
    sec: string,
    draft: Record<string, string>,
    mode: ModalMode,
  ) => {
    const keys = getRequiredFormKeys(sec, draft, mode)

    const duplicateErrors = (() => {
      if (!["usuarios", "clientes"].includes(sec)) return {}

      const email = String(draft["4"] ?? "").trim().toLowerCase()
      const document = String(draft["2"] ?? "").trim().toLowerCase()
      const phone =
        sec === "clientes"
          ? String(draft["3"] ?? "").trim().replace(/\s+/g, "")
          : ""

      const allRows = [
        ...(rows.usuarios || []).map((row, idx) => ({ section: "usuarios", idx, row })),
        ...(rows.clientes || []).map((row, idx) => ({ section: "clientes", idx, row })),
      ]
      const next: Record<string, string> = {}
      allRows.forEach(({ section, idx, row }) => {
        const isCurrentRecord = sec === section && modal.idx === idx
        if (isCurrentRecord) return

        const rowDocument = String(row[2] ?? "").trim().toLowerCase()
        const rowEmail = String(row[4] ?? "").trim().toLowerCase()
        const rowPhone =
          section === "clientes"
            ? String(row[3] ?? "").trim().replace(/\s+/g, "")
            : ""

        if (document && rowDocument && rowDocument === document) {
          next["2"] = "Ya existe una persona registrada con este documento."
        }
        if (sec === "clientes" && phone && rowPhone && rowPhone === phone) {
          next["3"] = "Ya existe una persona registrada con este teléfono."
        }
        if (email && rowEmail && rowEmail === email) {
          next["4"] = "Ya existe una persona registrada con este correo electrónico."
        }
      })
      return next
    })()

    return Object.fromEntries(
      keys.flatMap((key) => {
        const field = MOD_CFG[sec]?.fields.find((item) => item.key === key)
        const value = String(draft[key] ?? "")
        const error = !value.trim()
          ? "Este campo es obligatorio."
          : getManagedFieldError(sec, key, value, draft, mode) ||
          (value.trim() && field?.type === "email" && !EMAIL_PATTERN.test(value.trim())
            ? "Escribe un correo electrónico válido."
            : value.trim() && field?.type === "tel"
              ? validatePhoneNumber(value)
              : value.trim() && field?.type === "number" &&
                  (!Number.isFinite(Number(value)) || Number(value) < 0)
                ? "Ingresa un número válido mayor o igual a cero."
                : "")
        const duplicateError = duplicateErrors[key] || ""
        const finalError = duplicateError || error
        return finalError ? [[key, finalError]] : []
      }),
    )
  }

  const updateAdminField = (
    sec: string,
    key: string,
    value: string,
  ) => {
    const currentDraft = { ...formData, [key]: value }
    const documentKey =
      sec === "proveedores" && key === "8"
        ? "9"
        : (sec === "usuarios" || sec === "clientes") && key === "1"
          ? "2"
          : ""
    if (documentKey) {
      currentDraft[documentKey] = normalizeDocumentInput(
        currentDraft[documentKey] ?? "",
        value,
      )
    }
    setFormData(currentDraft)
    if (formValidationAttempted || formFieldErrors[key]) {
      setFormFieldErrors(validateManagedForm(sec, currentDraft, modal.mode))
    }
  }

  const openAdd = (sec: string) => {
    const cfg = MOD_CFG[sec]
    if (!cfg) return
    const initialFields = Object.fromEntries(
      cfg.fields.filter((f) => f.type !== "image").map((f) => [f.key, ""]),
    )
    if (sec === "producto") {
      initialFields["6"] = getAutoTechVersion(rows.producto || [])
      initialFields["10"] = "Disponible"
      setTechnicalIngredients([])
      setTechnicalSheetError("")
    }
    if (sec === "ventas") initialFields["8"] = "Sin pedido"
    if (sec === "insumos") {
      initialFields["7"] = "No"
      setSupplyFormError("")
    }
    if (sec === "producto-no-conforme") {
      initialFields["6"] = "und"
    }
    if (sec === "clientes") {
      initialFields["6"] = "No"
      setClientFormError("")
    }
    setFormValidationAttempted(false)
    setFormFieldErrors({})
    if (sec === "produccion" || sec === "producto-no-conforme") {
      const currentDateTime = getCurrentDateTimeParts()
      setProductionItems([])
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
      initialFields["3"] = currentDateTime.date
      initialFields["4"] = currentDateTime.time
    }
    if (sec === "compras") {
      const today = new Date()
      const registrationDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-")
      initialFields["1"] = registrationDate
      initialFields["2"] = registrationDate
      resetPurchasePicker()
    }
    setFormData(initialFields)
    setFormInitial(initialFields)
    setFormTried(false)
    setTouchedFields({})
    setPedidoProductoSelect("")
    if (sec === "pedidos") {
      setPedidoOrderLines([])
      setPedidoProductCategory("Todas")
      setPedidoProductQuantity("1")
      setPedidoParentSelect("")
    }
    setPaymentProofDraft("")
    setImgPreview("")
    setModal({ mode: "add", section: sec, idx: null })
  }
  const openEdit = (sec: string, idx: number) => {
    const cfg = MOD_CFG[sec]
    if (!cfg) return
    const row = rows[sec][idx]
    const dataFields = cfg.fields.filter((f) => f.type !== "image")
    const rowOffset = cfg.autoId ? 1 : 0
    const nextForm = Object.fromEntries(
      dataFields.map((field) => {
        const fieldIndex = Number(field.key)
        const rowIndex = Number.isFinite(fieldIndex)
          ? fieldIndex + rowOffset
          : row.length - 1
        return [field.key, String(row[rowIndex] ?? "")]
      }),
    )
    if (sec === "proveedores") {
      const legacyContactName = String(row[4] ?? "").trim().split(/\s+/)
      if (!nextForm["10"]) nextForm["10"] = legacyContactName.shift() ?? ""
      if (!nextForm["11"]) nextForm["11"] = legacyContactName.join(" ")
    }
    setFormValidationAttempted(false)
    setFormFieldErrors({})
    if (sec === "clientes") setClientFormError("")
    if (sec === "compras") resetPurchasePicker()
    if (sec === "insumos") setSupplyFormError("")
    if (sec === "produccion") {
      setProductionItems(getProductionOrderItems(row))
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
    }
    if (sec === "producto-no-conforme") {
      setProductionItems(getNonconformingItems(row))
      setProductionProductSelect("")
      setProductionItemQuantity("1")
      setProductionFormError("")
    }
    if (sec === "producto" && !nextForm["6"]) {
      nextForm["6"] = getAutoTechVersion(rows.producto || [])
    }
    if (sec === "producto") {
      setTechnicalIngredients(getProductRecipe(row))
      nextForm["9"] = String(row[9] ?? "[]")
      nextForm["10"] = String(row[10] ?? "Disponible")
      setTechnicalSheetError("")
    }
    if (sec === "pedidos") {
      const orderLines = getAdminOrderLines(row)
      setPedidoOrderLines(orderLines)
      setPedidoProductCategory("Todas")
      setPedidoProductQuantity("1")
      setPedidoParentSelect("")
    }
    setFormData(nextForm)
    setFormInitial(nextForm)
    setFormTried(false)
    setTouchedFields({})
    setPedidoProductoSelect("")
    setPaymentProofDraft(sec === "pedidos" ? paymentProofs[idx] || "" : "")
    setImgPreview(sec === "producto" ? prodImgs[idx] || "" : "")
    setModal({ mode: "edit", section: sec, idx })
  }
  const openView = (sec: string, idx: number) => {
    setImgPreview(sec === "producto" ? prodImgs[idx] || "" : "")
    setPaymentProofDraft(sec === "pedidos" ? paymentProofs[idx] || "" : "")
    if (sec === "producto") setTechnicalIngredients(getProductRecipe(rows.producto?.[idx]))
    if (sec === "produccion") {
      setProductionItems(getProductionOrderItems(rows.produccion?.[idx]))
      setProductionFormError("")
    }
    if (sec === "pedidos") setPedidoOrderLines(getAdminOrderLines(rows.pedidos?.[idx]))
    setModal({ mode: "view", section: sec, idx })
  }

  // ── Field validation: Categ. Insumos, Categ. Producto, Insumos, Productos ──
  const VALIDATED_SECTIONS = ["cat-insumos", "cat-producto", "insumos", "producto", "clientes", "pedidos"]
  const REQUIRED_KEYS: Record<string, string[]> = {
    "cat-insumos": ["0", "1"],
    "cat-producto": ["0", "1"],
    insumos: ["0", "1", "2", "3", "5"],
    producto: ["0", "1", "2", "3"],
    clientes: ["0", "1", "2", "3"], // correo/dirección too unless "Cliente de local"
    pedidos: ["0", "2", "3"],
  }
  const getFieldErrors = (): Record<string, string> => {
    const sec = modal.section
    const e: Record<string, string> = {}
    const v = (key: string) => String(formData[key] ?? "").trim()
    const n = (key: string) => Number(v(key))
    // Another record (not the one being edited) with the same normalized name
    const duplicateOf = (section: string, name: string) =>
      (rows[section] || []).find(
        (record, index) => index !== modal.idx && normalizeName(record[0]) === normalizeName(name),
      )
    const checkText = (key: string, label: string, min: number, max: number, emptyMsg: string) => {
      const value = v(key)
      if (!value) e[key] = emptyMsg
      else if (value.length < min) e[key] = `${label} debe tener al menos ${min} caracteres.`
      else if (value.length > max) e[key] = `${label} puede tener máximo ${max} caracteres.`
    }

    if (sec === "cat-insumos" || sec === "cat-producto") {
      checkText("0", "El nombre", 3, 40, "Escribe el nombre de la categoría.")
      if (!e["0"] && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 &-]+$/.test(v("0")))
        e["0"] = "Usa solo letras, números y espacios."
      const dup = !e["0"] && duplicateOf(sec, v("0"))
      if (dup) e["0"] = `Ya existe la categoría «${String(dup[0])}».`
      checkText("1", "La descripción", 5, 150, "Escribe una descripción.")
    }

    if (sec === "insumos") {
      checkText("0", "El nombre", 2, 60, "Escribe el nombre del insumo.")
      const dup = !e["0"] && duplicateOf("insumos", v("0"))
      if (dup) e["0"] = `Ya existe el insumo «${String(dup[0])}».`
      if (!v("1")) e["1"] = "Selecciona la categoría."
      if (!v("2")) e["2"] = "Selecciona la unidad de medida."
      if (!v("3")) e["3"] = "Escribe el costo unitario."
      else if (!(n("3") > 0)) e["3"] = "El costo debe ser mayor que 0."
      if (modal.mode !== "add" && v("4") && !(n("4") >= 0))
        e["4"] = "El stock actual no puede ser negativo."
      if (!v("5")) e["5"] = "Escribe el stock mínimo."
      else if (!(n("5") >= 0)) e["5"] = "El stock mínimo no puede ser negativo."
      if (v("7").toLowerCase() === "sí") {
        if (!v("10")) e["10"] = "Ficha técnica: elige al menos un insumo principal."
        if (!v("11")) e["11"] = "Ficha técnica: escribe cómo se prepara."
      }
    }

    if (sec === "clientes") {
      const isLocal = v("6").toLowerCase() === "sí"
      if (!v("1")) e["1"] = "Selecciona el tipo de documento."
      const doc = v("2")
      if (!doc) e["2"] = "Escribe el número de documento."
      else if (v("1") && DOC_RULES[v("1")] && !DOC_RULES[v("1")].re.test(doc))
        e["2"] = DOC_RULES[v("1")].msg
      else {
        // Same document number already registered (ignores dots, dashes and spaces)
        const docKey = normalizeDocument(doc)
        const dup = (rows.clientes || []).find(
          (client, index) => index !== modal.idx && normalizeDocument(client[2]) === docKey,
        )
        if (dup) e["2"] = `Ya existe un cliente con este número de documento: «${String(dup[0])}».`
      }
      checkText("0", "El nombre", 3, 80, "Escribe el nombre del cliente.")
      if (!e["0"] && !NAME_RE.test(v("0"))) e["0"] = "El nombre solo puede tener letras y espacios."
      const phone = v("3").replace(/[\s-]/g, "")
      if (!phone) e["3"] = "Escribe el teléfono."
      else if (!/^3\d{9}$/.test(phone)) e["3"] = "El celular debe tener 10 números y empezar por 3."
      if (!v("4")) {
        if (!isLocal) e["4"] = "Escribe el correo (o marca «Cliente de local»)."
      } else if (!EMAIL_RE.test(v("4")))
        e["4"] = "Escribe un correo válido, por ejemplo nombre@correo.com."
      if (!v("5")) {
        if (!isLocal) e["5"] = "Escribe la dirección (o marca «Cliente de local»)."
      } else if (v("5").length < 5) e["5"] = "La dirección debe tener al menos 5 caracteres."
    }

    if (sec === "pedidos") {
      if (!v("0")) e["0"] = "Selecciona el cliente."
      if (!v("2")) e["2"] = "Selecciona el tipo de pedido."
      if (!v("3")) e["3"] = "Selecciona el método de pago."
    }

    if (sec === "producto") {
      checkText("0", "El nombre", 2, 60, "Escribe el nombre del producto.")
      const dup = !e["0"] && duplicateOf("producto", v("0"))
      if (dup) e["0"] = `Ya existe el producto «${String(dup[0])}».`
      if (!v("1")) e["1"] = "Selecciona la categoría."
      if (!v("2")) e["2"] = "Escribe el precio."
      else if (!(n("2") > 0)) e["2"] = "El precio debe ser mayor que 0."
      else if (!Number.isInteger(n("2"))) e["2"] = "El precio debe ser un valor entero, sin decimales."
      checkText("3", "La descripción", 10, 200, "Escribe una descripción.")
    }
    return e
  }
  const fieldErrors =
    VALIDATED_SECTIONS.includes(modal.section) && modal.mode !== "view" && modal.mode !== null
      ? getFieldErrors()
      : {}
  const shownFieldError = (key: string) =>
    formTried || touchedFields[key] ? fieldErrors[key] : undefined
  const isRequiredField = (key: string) =>
    modal.mode !== "view" && (REQUIRED_KEYS[modal.section] || []).includes(key)

  const saveModal = () => {
    const sec = modal.section
    const config = MOD_CFG[sec]
    if (!config) return

    if (VALIDATED_SECTIONS.includes(sec)) {
      setFormTried(true)
      if (Object.keys(getFieldErrors()).length) return
    }

    setFormValidationAttempted(true)
    const errors = validateManagedForm(sec, formData, modal.mode)
    setFormFieldErrors(errors)
    if (Object.keys(errors).length) return

    if (sec === "roles") {
      const roleName = String(formData["0"] ?? "").trim()
      const roleDescription = String(formData["1"] ?? "").trim()
      if (!roleName || !roleDescription) {
        setFormFieldErrors({
          "0": roleName ? "" : "Este campo es obligatorio.",
          "1": roleDescription ? "" : "Este campo es obligatorio.",
        })
        return
      }
    }

    if ((sec === "produccion" || sec === "producto-no-conforme") && !productionItems.length) {
      setProductionFormError("Agrega al menos un producto o producto de insumo.")
      return
    }
    if (sec === "pedidos" && pedidoOrderLines.length === 0) {
      setFormFieldErrors((current) => ({
        ...current,
        "1": "Agrega al menos un producto al pedido.",
      }))
      return
    }
    if (sec === "producto") {
      const invalidIngredient = technicalIngredients.find((ingredient) => {
        const supply = rows.insumos?.find((item) => item[0] === ingredient.name)
        return (
          !supply ||
          !Number.isFinite(ingredient.quantity) ||
          ingredient.quantity <= 0 ||
          !ingredient.unit ||
          String(supply[2] ?? "").trim().toLowerCase() !== ingredient.unit.trim().toLowerCase()
        )
      })
      if (invalidIngredient) {
        window.alert(`Verifica la cantidad y unidad de «${invalidIngredient.name}» en la ficha técnica.`)
        return
      }
    }
    if (
      sec === "producto-no-conforme" &&
      !getProductSupplyOptions().includes(String(formData["1"] ?? ""))
    ) return
    if (sec === "insumos" && String(formData["7"] ?? "").toLowerCase() === "sí") {
      // A producto de insumo must be saved together with its technical sheet
      if (!String(formData["0"] ?? "").trim())
        return setSupplyFormError("Escribe el nombre del insumo.")
      if (!String(formData["10"] ?? "").trim())
        return setSupplyFormError("Ficha técnica: elige al menos un insumo principal.")
      if (!String(formData["11"] ?? "").trim())
        return setSupplyFormError("Ficha técnica: escribe cómo se prepara.")
    }
    if (sec === "compras") {
      if (!String(formData["0"] ?? "").trim()) {
        setPurchaseFormError("Selecciona el proveedor.")
        return
      }
      if (!parsePurchaseItems(formData["6"]).length) {
        setPurchaseFormError("Agrega al menos un insumo a la compra.")
        return
      }
    }
    const previousRow =
      modal.idx !== null ? rows[sec]?.[modal.idx] : undefined
    const dataFields = config.fields.filter((field) => field.type !== "image")
    const newRow: (string | number)[] = []

    dataFields.forEach((field) => {
      const index = Number(field.key)
      if (Number.isFinite(index)) newRow[index] = formData[field.key] ?? ""
      else newRow.push(formData[field.key] ?? "")
    })
    if (sec === "proveedores") {
      newRow[4] = `${String(formData["10"] ?? "").trim()} ${String(formData["11"] ?? "").trim()}`.trim()
    }
    if (sec === "cat-producto") newRow[0] = String(newRow[0] ?? "").trim()

    if (sec === "producto") {
      newRow[6] =
        String(formData["6"] || "").trim() ||
        getAutoTechVersion(rows.producto || [])
      newRow[7] = technicalIngredients.map((ingredient) => ingredient.name).join(", ")
      newRow[8] = String(formData["8"] || "").trim()
      const serializedRecipe = JSON.stringify(technicalIngredients)
      newRow[9] = serializedRecipe
      newRow[10] = String(formData["10"] || "Disponible")
      if (previousRow && String(previousRow[9] ?? "[]") !== serializedRecipe) {
        newRow[6] = nextTechVersion(String(previousRow[6] ?? ""))
      }
    }

    if (sec === "insumos") {
      newRow[0] = String(newRow[0] ?? "").trim()
      // New insumos start with no stock (the field isn't shown when creating)
      newRow[4] = modal.mode === "add" ? 0 : Number(newRow[4] || 0)
      newRow[6] = previousRow?.[6] ?? "" // unused slot (old "Stock máximo")
      if (String(newRow[7]).toLowerCase() === "sí") {
        newRow[8] = String(newRow[8] ?? "").trim() || `Ficha técnica - ${String(newRow[0]).trim()}`
        newRow[9] = String(newRow[9] ?? "").trim() || "v1.0"
      } else {
        newRow[8] = newRow[9] = newRow[10] = newRow[11] = ""
      }
    }

    if (sec === "compras") {
      // Subtotal and total always come from the purchased items
      const total = parsePurchaseItems(formData["6"]).reduce((sum, item) => sum + item.total, 0)
      newRow[3] = total
      newRow[4] = total
    }

    if (sec === "pedidos") {
      const total = pedidoOrderLines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      )
      newRow[1] = pedidoOrderLines
        .map((line) => `${line.quantity} ${line.product}${line.parentId ? ` (adición de ${pedidoOrderLines.find((parent) => parent.id === line.parentId)?.product ?? "producto"})` : ""}`)
        .join(", ")
      newRow[5] = total
      newRow[6] = "Recibido"
      // Modality and payment status follow the payment method (not chosen by hand)
      const payment = derivePedidoPayment(String(formData["3"] ?? ""), !!paymentProofDraft)
      newRow[4] = payment.modalidad
      newRow[7] = payment.estadoPago
      // Big orders wait for the owner; the rest go straight to production on save
      newRow[8] =
        modal.mode === "edit" && previousRow
          ? previousRow[9] // editing never re-sends an order
          : total >= APPROVAL_MIN
            ? "Pendiente admin"
            : "Enviada a producción"
      newRow[9] = JSON.stringify(pedidoOrderLines)
    }

    if (config.autoId) {
      const prefix =
        sec === "produccion"
          ? "OP"
          : sec === "producto-no-conforme"
            ? "PNC"
          : sec === "ventas"
            ? "VTA"
            : sec === "pedidos"
              ? "PED"
              : "ID"
      const generatedId =
        sec === "produccion"
          ? getNextProductionCode(rows.produccion || [])
          : sec === "pedidos"
            ? getNextOrderCode(rows.pedidos || [])
            : `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      newRow.unshift(
        modal.mode === "add" ? generatedId : String(previousRow?.[0] ?? generatedId),
      )
    }

    if (sec === "producto-no-conforme") {
      newRow[1] = productionItems.map((item) => item.name).join(", ")
      newRow[2] = JSON.stringify(productionItems)
      newRow[3] = productionItems.reduce((total, item) => total + item.quantity, 0)
      newRow[4] = formData["3"] ?? ""
      newRow[5] = formData["4"] ?? ""
      newRow[6] = formData["5"] ?? ""
      newRow[7] = formData["6"] ?? "und"
    }

    if (sec === "produccion") {
      const currentDateTime = getCurrentDateTimeParts()
      newRow[1] = productionItems.map((item) => item.name).join(", ")
      newRow[2] = productionItems.reduce(
        (total, item) => total + item.quantity,
        0,
      )
      newRow[13] = JSON.stringify(productionItems)
      newRow[3] = modal.mode === "add" ? getNextProductionPriority(rows.produccion || []) : (previousRow?.[3] ?? getNextProductionPriority(rows.produccion || []))
      newRow[6] = previousRow?.[6] ?? currentDateTime.date
      newRow[7] = previousRow?.[7] ?? currentDateTime.time
      newRow[8] = previousRow?.[8] ?? "Recibida"
      if (newRow[8] === "Terminado") {
        newRow[9] = previousRow?.[9] || `${currentDateTime.date} ${currentDateTime.time}`
        newRow[10] = previousRow?.[10] || 1
      } else {
        newRow[9] = ""
        newRow[10] = 0
      }
      newRow[11] =
        previousRow?.[11] ?? (newRow[8] === "Recibida" ? "No" : "Sí")
      newRow[12] =
        previousRow?.[12] ??
        JSON.stringify([
          {
            status: "Recibida",
            date: currentDateTime.date,
            time: currentDateTime.time,
          },
        ])
    }

    if (config.statusIndex !== undefined) {
      const defaultStatus =
        sec === "cat-insumos" || sec === "cat-producto"
          ? "Activa"
          : "Activo"
      newRow[config.statusIndex] = previousRow?.[config.statusIndex] ?? defaultStatus
    }

    setRows((current) => {
      const updated = [...(current[sec] || [])]
      if (modal.mode === "add") updated.unshift(newRow)
      else if (modal.mode === "edit" && modal.idx !== null)
        updated[modal.idx] = newRow

      if (sec === "pedidos" && modal.mode === "add" && newRow[9] === "Enviada a producción") {
        // New order that needs no owner approval → its production orders are created now
        return {
          ...current,
          pedidos: updated,
          produccion: buildProductionRows(pedidoOrderLines, current.produccion || [], String(newRow[0])),
        }
      }

      if (sec === "compras") {
        // Stock: undo what the previous version of this purchase added, then add the new items
        let insumoRows = current.insumos || []
        if (modal.mode === "edit" && previousRow && String(previousRow[5]) !== "Anulado")
          insumoRows = withStockChange(insumoRows, previousRow[6], -1)
        if (String(newRow[5]) !== "Anulado")
          insumoRows = withStockChange(insumoRows, newRow[6], 1)
        return { ...current, compras: updated, insumos: insumoRows }
      }

      if (sec === "insumos") {
        const previousName = String(previousRow?.[0] ?? "")
        const productRows = (current.producto || []).filter(
          (product) =>
            !(
              product[1] === "Producto de insumo" &&
              product[0] === previousName
            ),
        )
        if (String(newRow[7]).toLowerCase() === "sí") {
          const generatedProduct = supplyAsProduct(newRow)
          const existingIndex = productRows.findIndex(
            (product) =>
              product[1] === "Producto de insumo" &&
              product[0] === generatedProduct[0],
          )
          if (existingIndex >= 0) productRows[existingIndex] = generatedProduct
          else productRows.unshift(generatedProduct)
        }
        return { ...current, insumos: updated, producto: productRows }
      }

      return { ...current, [sec]: updated }
    })
    if (sec === "producto" && imgPreview) {
      const imageIndex = modal.mode === "add" ? 0 : modal.idx!
      setProdImgs((current) => ({ ...current, [imageIndex]: imgPreview }))
    }
    if (sec === "pedidos" && (paymentProofDraft || modal.mode === "add")) {
      setPaymentProofs((current) => {
        // New orders are unshifted, so existing proofs move down one row
        const next =
          modal.mode === "add"
            ? Object.fromEntries(
                Object.entries(current).map(([k, v]) => [Number(k) + 1, v]),
              )
            : { ...current }
        if (paymentProofDraft)
          next[modal.mode === "add" ? 0 : modal.idx!] = paymentProofDraft
        return next
      })
    }
    if (sec === "pedidos" && String(newRow[8]) === "Pagado") {
      setRows((current) => {
        const salesRows = [...(current.ventas || [])]
        if (salesRows.some((sale) => sale[9] === newRow[0])) return current
        salesRows.unshift([
          `VTA-AUTO-${String(salesRows.length + 1).padStart(2, "0")}`,
          "Admin Parche",
          newRow[1],
          getCurrentDateTimeParts().date,
          newRow[2],
          newRow[3],
          newRow[4],
          newRow[6],
          newRow[6],
          "Pendiente",
          newRow[0],
          newRow[7],
          newRow[10] ?? "[]",
        ])
        return { ...current, ventas: salesRows }
      })
    }
    if (sec === "roles" && modal.mode === "edit" && previousRow) {
      const previousRoleName = String(previousRow[0] ?? "")
      const nextRoleName = String(newRow[0] ?? "")
      if (previousRoleName !== nextRoleName) {
        setRolesPerms((current) => {
          const previousPermissions = current[previousRoleName]
          const next = { ...current }
          delete next[previousRoleName]
          if (previousPermissions) next[nextRoleName] = previousPermissions
          return next
        })
      }
    }
    if (sec === "clientes") setClientFormError("")
    if (sec === "produccion") setProductionFormError("")
    setModal({ mode: null, section: "", idx: null })
  }

  const isStatusActive = (value: string | number) => {
    const status = String(value)
    return !["Inactivo", "Inactiva", "Anulado", "Anulada"].includes(status)
  }

  // Purchases (compras rows) made to a supplier, matched by name
  const getSupplierPurchases = (supplierName: string) => {
    const name = supplierName.trim().toLowerCase()
    return (rows.compras || []).filter(
      (purchase) => String(purchase[0] ?? "").trim().toLowerCase() === name,
    )
  }

  const getCategoryRecords = (section: "cat-insumos" | "cat-producto", categoryName: string) => {
    const name = categoryName.trim().toLowerCase()
    const relatedSection = section === "cat-insumos" ? "insumos" : "producto"
    return (rows[relatedSection] || []).filter(
      (record) => String(record[1] ?? "").trim().toLowerCase() === name,
    )
  }

  const getDeleteAssessment = (
    sec: string,
    row: (string | number)[] | undefined,
  ) => {
    const moduleName =
      SIDEBAR_MENU.flatMap((item) =>
        item.children.length
          ? item.children
          : [{ key: item.key, label: item.label }],
      ).find((item) => item.key === sec)?.label ?? "este módulo"
    const recordName = String(row?.[0] ?? "registro")
    const targetLabel =
      sec === "produccion"
        ? `la orden «${recordName}»`
        : `el registro «${recordName}»`

    if (!row) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El registro ya no existe o fue eliminado por otra acción. Actualiza la lista para verificar el estado actual.",
      }
    }

    if (sec === "produccion") {
      const status = String(row[8] ?? "Recibida")
      const authorized = String(row[11] ?? "No").toLowerCase() === "sí"
      const blockers: string[] = []

      if (status !== "Recibida") {
        blockers.push(`la orden ya se encuentra en estado «${status}»`)
      }
      if (authorized) {
        blockers.push("la orden ya fue autorizada para producción")
      }

      if (blockers.length) {
        return {
          allowed: false,
          targetLabel,
          reason: `${blockers.join(" y ")}. Para conservar la trazabilidad, solo se puede eliminar una orden nueva que siga en estado «Recibida» y no esté autorizada.`,
        }
      }

      return {
        allowed: true,
        targetLabel,
        reason:
          "La orden sigue en estado «Recibida», todavía no está autorizada para producción y no tiene bloqueos activos.",
      }
    }

    if (sec === "proveedores") {
      const supplierLabel = `el proveedor «${recordName}»`
      const purchases = getSupplierPurchases(recordName)
      if (purchases.length) {
        const n = purchases.length
        return {
          allowed: false,
          targetLabel: supplierLabel,
          reason: `Tiene ${n} ${n === 1 ? "compra" : "compras"} de insumos ${n === 1 ? "registrada" : "registradas"}. Para no perder el historial de compras no se puede eliminar; si ya no trabajas con él, desactívalo con el interruptor de estado.`,
        }
      }
      return {
        allowed: true,
        targetLabel: supplierLabel,
        reason: "No tiene compras de insumos registradas.",
      }
    }

    if (sec === "cat-insumos" || sec === "cat-producto") {
      const categoryLabel = `la categoría «${recordName}»`
      const normalizedCategoryName = recordName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
      if (sec === "cat-producto" && normalizedCategoryName === "adiciones") {
        return {
          allowed: false,
          targetLabel: categoryLabel,
          reason: "La categoría «Adiciones» es necesaria para los productos y no se puede eliminar.",
        }
      }
      const records = getCategoryRecords(sec, recordName)
      if (records.length) {
        const recordType = sec === "cat-insumos" ? "insumo" : "producto"
        return {
          allowed: false,
          targetLabel: categoryLabel,
          reason: `Tiene ${records.length} ${records.length === 1 ? recordType : `${recordType}s`} asociados. Primero reasigna o elimina esos registros para poder eliminar la categoría.`,
        }
      }
      return {
        allowed: true,
        targetLabel: categoryLabel,
        reason: "No tiene registros asociados.",
      }
    }

    if (MOD_CFG[sec]?.noDelete) {
      return {
        allowed: false,
        targetLabel,
        reason: `La eliminación está desactivada en el módulo «${moduleName}». Conserva el registro y utiliza la acción de anulación disponible para mantener su historial.`,
      }
    }

    return {
      allowed: true,
      targetLabel,
      reason: `No existen bloqueos activos y el módulo «${moduleName}» permite eliminar este registro.`,
    }
  }

  const isStatusLocked = (sec: string, row: (string | number)[]) =>
    sec === "roles" && String(row[0] ?? "").trim().toLowerCase() === "administrador"

  const getAnulAssessment = (
    sec: string,
    row: (string | number)[] | undefined,
    rowIndex: number,
  ) => {
    const moduleName =
      SIDEBAR_MENU.flatMap((item) =>
        item.children.length
          ? item.children
          : [{ key: item.key, label: item.label }],
      ).find((item) => item.key === sec)?.label ?? "este módulo"
    const recordName = String(row?.[0] ?? "registro")
    const targetLabel = `el registro «${recordName}»`

    if (!row) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El registro ya no existe o fue eliminado por otra acción. Actualiza la lista para verificar su estado actual.",
      }
    }

    if (isStatusLocked(sec, row)) {
      return {
        allowed: false,
        targetLabel,
        reason:
          "El rol «Administrador» está protegido para evitar que el sistema quede sin permisos de gestión. No se puede anular desde este módulo.",
      }
    }

    const statusIndex = MOD_CFG[sec]?.statusIndex
    const currentStatus =
      statusIndex !== undefined
        ? String(row[statusIndex] ?? "Activo")
        : "Activo"
    const alreadyAnulled =
      statusIndex !== undefined
        ? !isStatusActive(currentStatus)
        : (anulled?.[sec] || new Set<number>()).has(rowIndex)

    if (alreadyAnulled) {
      return {
        allowed: false,
        targetLabel,
        reason: `El registro ya se encuentra anulado o inactivo («${currentStatus}»). Para volver a usarlo primero debe reactivarse.`,
      }
    }

    if (sec === "compras") {
      return {
        allowed: true,
        targetLabel,
        reason:
          "La compra está activa y no presenta bloqueos registrados. Puede anularse sin eliminar su información; quedará en estado «Anulado» y se conservará en el historial.",
      }
    }

    return {
      allowed: true,
      targetLabel,
      reason: `El registro está activo y no tiene bloqueos de anulación registrados en el módulo «${moduleName}». Puede anularse sin eliminar la información y quedará conservado en el historial.`,
    }
  }

  const toggleStatus = (
    sec: string,
    rowIndex: number,
    statusIndex: number,
  ) => {
    const currentRows = rows[sec] || []
    const currentRow = currentRows[rowIndex]
    if (!currentRow || isStatusLocked(sec, currentRow)) return

    const currentValue = String(
      currentRow[statusIndex] ??
        (sec === "cat-insumos" || sec === "cat-producto"
          ? "Activa"
          : "Activo"),
    )
    const feminine = currentValue.toLowerCase().endsWith("a")
    const inactiveStatus =
      MOD_CFG[sec]?.inactiveStatus ?? (feminine ? "Inactiva" : "Inactivo")
    const activeStatus = feminine ? "Activa" : "Activo"
    const nextValue = isStatusActive(currentValue)
      ? inactiveStatus
      : activeStatus

    if (sec === "usuarios") {
      const email = String(currentRow[4] ?? "").trim().toLowerCase()
      if (email) {
        const statuses = loadLS<Record<string, string>>("adminUserStatuses", {})
        saveLS("adminUserStatuses", { ...statuses, [email]: nextValue })
      }
    }

    setRows((current) => {
      const updated = [...(current[sec] || [])]
      const updatedRow = [...updated[rowIndex]]
      updatedRow[statusIndex] = nextValue
      updated[rowIndex] = updatedRow

      if (sec === "compras") {
        // Anular a purchase removes its items from stock; reactivating adds them back
        const sign = isStatusActive(nextValue) ? 1 : -1
        return {
          ...current,
          compras: updated,
          insumos: withStockChange(current.insumos || [], updatedRow[6], sign),
        }
      }

      if (sec === "insumos" && String(updatedRow[7]).toLowerCase() === "sí") {
        const productRows = (current.producto || []).map((product) =>
          product[1] === "Producto de insumo" && product[0] === updatedRow[0]
            ? (() => {
                const updatedProduct = [...product]
                updatedProduct[4] = nextValue
                return updatedProduct
              })()
            : product,
        )
        return { ...current, insumos: updated, producto: productRows }
      }

      return { ...current, [sec]: updated }
    })

    if (sec !== "usuarios") {
      setAnulled((current) => {
        const next = new Set(current[sec] || [])
        if (isStatusActive(nextValue)) next.delete(rowIndex)
        else next.add(rowIndex)
        return { ...current, [sec]: next }
      })
    }
  }

  const StatusSwitch = ({
    sec,
    rowIndex,
    statusIndex,
    entityName,
  }: {
    sec: string
    rowIndex: number
    statusIndex: number
    entityName: string
  }) => {
    const row = rows[sec]?.[rowIndex]
    if (!row) return null
    const value = row[statusIndex] ?? "Activo"
    const active = isStatusActive(value)
    const label = String(value)
    const locked = isStatusLocked(sec, row)
    const handleStatusAction = () => {
      if (locked || active) setAnulTarget({ section: sec, idx: rowIndex })
      else toggleStatus(sec, rowIndex, statusIndex)
    }

    return (
      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={
            locked
              ? "Ver motivo por el que no se puede anular"
              : active
                ? `Anular ${entityName}`
                : `Reactivar ${entityName}`
          }
          aria-haspopup={locked || active ? "dialog" : undefined}
          title={
            locked
              ? "El estado del administrador está protegido"
              : active
                ? `Anular ${entityName}`
                : `Reactivar ${entityName}`
          }
          onClick={handleStatusAction}
          className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
            locked ? "cursor-help opacity-75" : "cursor-pointer"
          }`}
          style={{ background: active ? "#3A6D5E" : dark ? "#4A4E57" : "#C7C4BD" }}
        >
          <span
            className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: active ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
        <span
          className="cursor-pointer text-[10px] font-semibold"
          style={{ color: active ? "#2E7D60" : C.red }}
          onClick={handleStatusAction}
        >
          {label}
        </span>
      </div>
    )
  }

  const approveOrderForProduction = (orderIndex: number) => {
    const order = rows.pedidos?.[orderIndex]
    const proof = paymentProofs[orderIndex]
    const paymentStatus = String(order?.[8] ?? "")
    const transferPayment = isTransferPaymentMethod(String(order?.[4] ?? ""))
    const payOnDelivery = String(order?.[5]) === "Contraentrega"
    if (
      !order ||
      ["Autorizada", "Enviada a producción"].includes(String(order[9])) ||
      (transferPayment &&
        !["Pendiente de verificación", "Pagado"].includes(paymentStatus)) ||
      (transferPayment && paymentStatus === "Pendiente de verificación" && !proof) ||
      (!transferPayment && !payOnDelivery && paymentStatus !== "Pagado")
    ) return

    const requestedItems = getAdminOrderLines(order)
    if (!requestedItems.length) {
      window.alert("Este pedido no tiene productos para enviar a producción.")
      return
    }

    const storedOrders = loadOrders()
    const storedOrder = storedOrders.find((item) => item.id === order[0])
    if (storedOrder?.productionAuthorized) return
    const currentDateTime = getCurrentDateTimeParts()
    const productionRecords: (string | number)[][] = []
    const existingProductionRows = [...(rows.produccion || [])]
    let priority = Math.max(
      0,
      ...existingProductionRows.map((row) => Number(row[3]) || 0),
    )
    requestedItems.slice().reverse().forEach((item) => {
      priority += 1
      const parent = requestedItems.find((candidate) => candidate.id === item.parentId)
      const productionRecord: (string | number)[] = [
        getNextProductionCode(existingProductionRows),
        parent ? `↳ ${item.product} (adición de ${parent.product})` : item.product,
        item.quantity,
        priority,
        currentDateTime.date,
        currentDateTime.time,
        currentDateTime.date,
        currentDateTime.time,
        "Iniciada",
        "",
        0,
        "Sí",
        JSON.stringify([
          {
            status: "Iniciada",
            date: currentDateTime.date,
            time: currentDateTime.time,
          },
        ]),
        JSON.stringify([{
          name: item.product,
          quantity: item.quantity,
          category: item.category,
          ...(item.parentId ? { parentId: item.parentId } : {}),
        }]),
        "No",
      ]
      existingProductionRows.unshift(productionRecord)
      productionRecords.unshift(productionRecord)
    })
    saveOrders(
      storedOrders.map((item) =>
        item.id === order[0]
          ? {
              ...item,
              status: "Confirmado",
              ...(transferPayment ? { paymentStatus: "Pagado" as const } : {}),
              productionAuthorized: true,
              productionRecords,
            }
          : item,
      ),
    )

    setRows((current) => {
      const currentOrder = current.pedidos?.[orderIndex]
      if (!currentOrder || String(currentOrder[9]) === "Autorizada") {
        return current
      }
      const orderRows = [...(current.pedidos || [])]
      const updatedOrder = [...currentOrder]
      updatedOrder[8] = transferPayment ? "Pagado" : updatedOrder[8]
      updatedOrder[9] = "Autorizada"
      if (
        transferPayment ||
        updatedOrder[7] === "Por confirmar" ||
        updatedOrder[7] === "Pendiente de verificación"
      ) {
        updatedOrder[7] = "Confirmado"
      }
      updatedOrder[11] = ""
      orderRows[orderIndex] = updatedOrder

      const productionRows = [...productionRecords, ...(current.produccion || [])]

      let salesRows = [...(current.ventas || [])]
      const notShipped = !["En camino", "Entregado"].includes(
        String(updatedOrder[7]),
      )
      const alreadyDuplicated = salesRows.some(
        (sale) => sale[9] === updatedOrder[0],
      )
      if (notShipped && !alreadyDuplicated) {
        salesRows.unshift([
          `VTA-AUTO-${String(salesRows.length + 1).padStart(2, "0")}`,
          "Admin Parche",
          updatedOrder[1],
          currentDateTime.date,
          updatedOrder[3],
          updatedOrder[4],
          updatedOrder[6],
          updatedOrder[6],
          "Pendiente",
          updatedOrder[0],
          updatedOrder[7],
          updatedOrder[10] ?? "[]",
        ])
      }

      return {
        ...current,
        pedidos: orderRows,
        produccion: productionRows,
        ventas: salesRows,
      }
    })
  }

  const rejectTransferPayment = () => {
    if (paymentRejectionTarget === null) return
    const orderIndex = paymentRejectionTarget
    const order = rows.pedidos?.[orderIndex]
    const reason = paymentRejectionReason.trim()
    if (!order || !reason) {
      setPaymentRejectionError("Escribe el motivo por el que rechazas el comprobante.")
      return
    }
    if (
      !isTransferPaymentMethod(String(order[4] ?? "")) ||
      String(order[8]) !== "Pendiente de verificación"
    ) {
      setPaymentRejectionError("Este comprobante ya no está pendiente de revisión.")
      return
    }

    const orderId = String(order[0])
    saveOrders(
      loadOrders().map((item) =>
        item.id === orderId
          ? {
              ...item,
              paymentStatus: "Rechazado",
              paymentRejectionReason: reason,
              productionAuthorized: false,
            }
          : item,
      ),
    )
    setRows((current) => {
      const currentOrder = current.pedidos?.[orderIndex]
      if (!currentOrder || String(currentOrder[8]) !== "Pendiente de verificación") {
        return current
      }
      const orderRows = [...(current.pedidos || [])]
      const updatedOrder = [...currentOrder]
      updatedOrder[8] = "Rechazado"
      updatedOrder[11] = reason
      orderRows[orderIndex] = updatedOrder
      return { ...current, pedidos: orderRows }
    })
    setPaymentRejectionTarget(null)
    setPaymentRejectionReason("")
    setPaymentRejectionError("")
  }

  const saveQuickClient = () => {
    const isLocalClient = String(quickClientForm["6"] ?? "").toLowerCase() === "sí"
    const requiredFields = ["0", "1", "2", "3", ...(isLocalClient ? [] : ["4", "5"])]
    const errors: Record<string, string> = {}
    requiredFields.forEach((key) => {
      const value = String(quickClientForm[key] ?? "").trim()
      if (!value) {
        errors[key] = "Este campo es obligatorio."
      } else if (key === "2") {
        const error = validateDocumentNumber(value, quickClientForm["1"] ?? "")
        if (error) errors[key] = error
      } else if (key === "3") {
        const error = validatePhoneNumber(value)
        if (error) errors[key] = error
      } else if (key === "4" && !EMAIL_PATTERN.test(value)) {
        errors[key] = "Escribe un correo electrónico válido."
      }
    })
    const docNumber = String(quickClientForm["2"] ?? "").trim().toLowerCase()
    const phone = String(quickClientForm["3"] ?? "").trim().replace(/\s+/g, "")
    const email = String(quickClientForm["4"] ?? "").trim().toLowerCase()
    ;(rows.usuarios || []).forEach((userRow) => {
      if (
        docNumber &&
        String(userRow[2] ?? "").trim().toLowerCase() === docNumber
      ) {
        errors["2"] = "Ya existe una persona registrada con este documento."
      }
      if (
        email &&
        String(userRow[4] ?? "").trim().toLowerCase() === email
      ) {
        errors["4"] = "Ya existe una persona registrada con este correo electrónico."
      }
    })
    ;(rows.clientes || []).forEach((clientRow) => {
      if (
        docNumber &&
        String(clientRow[2] ?? "").trim().toLowerCase() === docNumber
      ) {
        errors["2"] = "Ya existe una persona registrada con este documento."
      }
      if (
        phone &&
        String(clientRow[3] ?? "").trim().replace(/\s+/g, "") === phone
      ) {
        errors["3"] = "Ya existe una persona registrada con este teléfono."
      }
      if (
        email &&
        String(clientRow[4] ?? "").trim().toLowerCase() === email
      ) {
        errors["4"] = "Ya existe una persona registrada con este correo electrónico."
      }
    })
    setQuickClientErrors(errors)
    if (Object.keys(errors).length) {
      setQuickClientError(
        "Corrige los campos indicados antes de registrar el cliente.",
      )
      return
    }
    // Same document number as an existing client is not allowed here either
    const docKey = normalizeDocument(quickClientForm["2"])
    const duplicate = (rows.clientes || []).find((client) => normalizeDocument(client[2]) === docKey)
    if (duplicate) {
      setQuickClientError(`Ya existe un cliente con este número de documento: «${String(duplicate[0])}».`)
      return
    }
    const name = String(quickClientForm["0"]).trim()
    const newClient: (string | number)[] = [
      name,
      quickClientForm["1"],
      quickClientForm["2"],
      quickClientForm["3"],
      quickClientForm["4"] || "",
      quickClientForm["5"] || "",
      isLocalClient ? "Sí" : "No",
      "Activo",
    ]
    setRows((current) => ({
      ...current,
      clientes: [newClient, ...(current.clientes || [])],
    }))
    setFormData((current) => ({ ...current, "1": name }))
    setQuickClientForm({})
    setQuickClientErrors({})
    setQuickClientError("")
    setQuickClientOpen(false)
  }

  const openProductionPnc = (rowIndex: number) => {
    const order = rows.produccion?.[rowIndex]
    if (!order) return
    const currentDateTime = getCurrentDateTimeParts()
    const orderItems = getProductionOrderItems(order)
    setPncForm({
      "0": String(order[0] ?? ""),
      "1": orderItems[0]?.name ?? String(order[1] ?? ""),
      "2": orderItems[0]?.name ?? String(order[1] ?? ""),
      "3": String(orderItems[0]?.quantity ?? order[2] ?? 1),
      "4": "Producto perdido",
      "5": currentDateTime.date,
    })
    setPncError("")
    setPncFieldErrors({})
    setPncTarget(rowIndex)
  }

  const saveProductionPnc = () => {
    if (pncTarget === null) return
    const order = rows.produccion?.[pncTarget]
    if (!order) return
    const availableProducts = getNonconformingProductOptions()
    const affectedProduct = String(pncForm["1"] ?? "").trim()
    const damagedDescription = String(pncForm["2"] ?? "").trim()
    const quantity = Number(pncForm["3"])
    const validationErrors: Record<string, string> = {}
    if (!affectedProduct) validationErrors["1"] = "Selecciona un producto."
    if (!Number.isFinite(quantity) || quantity <= 0) {
      validationErrors["3"] = "Ingresa una cantidad mayor que cero."
    }
    if (!damagedDescription) {
      validationErrors["2"] = "Describe el producto o los productos que se dañaron."
    }
    if (!String(pncForm["4"] ?? "").trim()) {
      validationErrors["4"] = "Selecciona el motivo."
    }
    if (!String(pncForm["5"] ?? "").trim()) {
      validationErrors["5"] = "Selecciona la fecha del registro."
    }
    setPncFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      setPncError("Completa los campos indicados antes de registrar.")
      return
    }
    if (!availableProducts.includes(affectedProduct)) {
      setPncFieldErrors({ "1": "Solo puedes registrar productos que estén en producción." })
      setPncError("Solo puedes registrar productos que estén en producción.")
      return
    }

    const currentDateTime = getCurrentDateTimeParts()
    const nextStatus = "Producto no conforme"
    const pncRecord: (string | number)[] = [
      pncForm["0"] || order[0],
      affectedProduct,
      damagedDescription,
      quantity,
      String(pncForm["4"]).trim(),
      String(pncForm["5"]).trim(),
    ]

    setRows((current) => {
      const productionRows = [...(current.produccion || [])]
      const updatedOrder = [...productionRows[pncTarget]]
      const history = parseProductionHistory(updatedOrder[12])
      history.push({
        status: nextStatus,
        date: currentDateTime.date,
        time: currentDateTime.time,
      })
      updatedOrder[4] = currentDateTime.date
      updatedOrder[5] = currentDateTime.time
      updatedOrder[6] = currentDateTime.date
      updatedOrder[7] = currentDateTime.time
      updatedOrder[8] = nextStatus
      updatedOrder[9] = ""
      updatedOrder[10] = 0
      updatedOrder[11] = "Sí"
      updatedOrder[12] = JSON.stringify(history)
      productionRows[pncTarget] = updatedOrder

      const nextPriority =
        Math.max(0, ...productionRows.map((row) => Number(row[3]) || 0)) + 1
      const restartedOrder: (string | number)[] = [
        getNextProductionCode(productionRows),
        updatedOrder[1],
        updatedOrder[2],
        nextPriority,
        currentDateTime.date,
        currentDateTime.time,
        currentDateTime.date,
        currentDateTime.time,
        "Iniciada",
        "",
        0,
        "Sí",
        JSON.stringify([
          {
            status: "Iniciada",
            date: currentDateTime.date,
            time: currentDateTime.time,
          },
        ]),
        updatedOrder[13],
      ]
      productionRows.unshift(restartedOrder)

      return {
        ...current,
        produccion: productionRows,
        "producto-no-conforme": [
          pncRecord,
          ...(current["producto-no-conforme"] || []),
        ],
      }
    })
    setPncTarget(null)
    setPncForm({})
    setPncError("")
    setPncFieldErrors({})
  }

  const changeProductionStatus = (
    rowIndex: number,
    nextStatus: (typeof PRODUCTION_STATUSES)[number],
  ) => {
    const sourceRow = rows.produccion?.[rowIndex]
    if (!sourceRow || String(sourceRow[8]) === nextStatus) return
    const consumeStock = nextStatus === "En cocina" && String(sourceRow[14]) !== "Sí"
    const requiredSupplies = new Map<string, { quantity: number; unit: string }>()
    if (consumeStock) {
      for (const item of getProductionOrderItems(sourceRow)) {
        const product = rows.producto?.find((candidate) => candidate[0] === item.name)
        for (const ingredient of getProductRecipe(product)) {
          const supply = rows.insumos?.find((candidate) => candidate[0] === ingredient.name)
          const unit = String(supply?.[2] ?? "").trim()
          if (!supply || !unit || unit.toLowerCase() !== ingredient.unit.trim().toLowerCase()) {
            window.alert(`No se puede iniciar la producción: revisa que «${ingredient.name}» exista en inventario y use la misma unidad de la ficha técnica.`)
            return
          }
          const current = requiredSupplies.get(ingredient.name)
          requiredSupplies.set(ingredient.name, {
            quantity: (current?.quantity ?? 0) + ingredient.quantity * item.quantity,
            unit,
          })
        }
      }
      for (const [name, requirement] of requiredSupplies) {
        const supply = rows.insumos?.find((candidate) => candidate[0] === name)
        const stock = Number(supply?.[4])
        if (!Number.isFinite(stock) || stock < requirement.quantity) {
          window.alert(`Stock insuficiente de «${name}»: se necesitan ${requirement.quantity} ${requirement.unit} y hay ${Number.isFinite(stock) ? stock : 0}.`)
          return
        }
      }
    }
    setRows((current) => {
      const productionRows = [...(current.produccion || [])]
      const currentRow = productionRows[rowIndex]
      if (!currentRow) return current
      if (consumeStock && String(currentRow[14]) === "Sí") return current

      const currentDateTime = getCurrentDateTimeParts()
      const now = new Date()
      const formatRealTime = (date: Date) => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        const period = hours >= 12 ? "PM" : "AM"
        const hours12 = hours % 12 || 12
        return `${hours12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`
      }
      const realTime = formatRealTime(now)
      const updatedRow = [...currentRow]
      updatedRow[5] = realTime
      updatedRow[7] = realTime
      updatedRow[8] = nextStatus
      let history: { status: string; date: string; time: string }[] = []
      try {
        const storedHistory = JSON.parse(String(currentRow[12] ?? "[]"))
        if (Array.isArray(storedHistory)) history = storedHistory
      } catch {
        history = []
      }
      history.push({
        status: nextStatus,
        date: currentDateTime.date,
        time: realTime,
      })
      updatedRow[12] = JSON.stringify(history)
      updatedRow[11] =
        nextStatus !== "Recibida" || String(currentRow[11]).toLowerCase() === "sí"
          ? "Sí"
          : "No"
      if (consumeStock) updatedRow[14] = "Sí"

      if (nextStatus === "Terminado") {
        if (currentRow[8] !== "Terminado") {
          updatedRow[9] = `${currentDateTime.date} ${realTime}`
          const lastDeparture = Math.max(
            0,
            ...productionRows.map((row) => Number(row[10]) || 0),
          )
          updatedRow[10] = lastDeparture + 1
        }
      } else {
        updatedRow[9] = ""
        updatedRow[10] = 0
      }
      productionRows[rowIndex] = updatedRow
      const supplies = consumeStock
        ? (current.insumos || []).map((supply) => {
            const required = requiredSupplies.get(String(supply[0]))
            if (!required) return supply
            const updatedSupply = [...supply]
            updatedSupply[4] = Number(updatedSupply[4]) - required.quantity
            return updatedSupply
          })
        : current.insumos

      if (nextStatus === "Producto no conforme") {
        const newPriority =
          Math.max(0, ...productionRows.map((row) => Number(row[3]) || 0)) + 1
        const newOrderCode = getNextProductionCode(productionRows)
        const restartedOrder: (string | number)[] = [
          newOrderCode,
          updatedRow[1],
          updatedRow[2],
          newPriority,
          currentDateTime.date,
          realTime,
          currentDateTime.date,
          realTime,
          "Iniciada",
          "",
          0,
          "Sí",
          JSON.stringify([
            { status: "Iniciada", date: currentDateTime.date, time: realTime },
          ]),
          updatedRow[13],
        ]
        productionRows.unshift(restartedOrder)
      }

      return { ...current, produccion: productionRows, ...(supplies ? { insumos: supplies } : {}) }
    })
  }

  const ProductionStatusSelect = ({ rowIndex }: { rowIndex: number }) => {
    const value = String(
      rows.produccion?.[rowIndex]?.[8] ?? "Recibida",
    ) as (typeof PRODUCTION_STATUSES)[number]
    const statusColor =
      value === "Producto no conforme"
        ? C.red
        : value === "Terminado"
          ? "#2E7D60"
          : value === "En cocina"
            ? C.mustard
            : t.text
    return (
      <div className="relative w-full min-w-0 max-w-[180px]">
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ background: statusColor, boxShadow: `0 0 0 3px ${statusColor}18` }}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center" style={{ color: t.muted }}>
          {Ico.chevDown}
        </span>
        <select
          value={value}
          title="Cambiar estado de producción"
          aria-label="Estado de la orden de producción"
          onChange={(event) => {
            const nextStatus = event.target.value as (typeof PRODUCTION_STATUSES)[number]
            if (nextStatus === "Producto no conforme") {
              openProductionPnc(rowIndex)
              return
            }
            changeProductionStatus(rowIndex, nextStatus)
          }}
          className="h-9 w-full min-w-0 appearance-none rounded-xl py-2 pl-7 pr-7 text-xs font-semibold outline-none cursor-pointer"
          style={{
            background: value === "Producto no conforme" ? `${C.red}10` : value === "Terminado" ? "rgba(58,109,94,0.10)" : t.input,
            border: `1px solid ${value === "Producto no conforme" ? `${C.red}30` : t.inputB}`,
            color: statusColor,
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {PRODUCTION_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    )
  }

  const doAnul = (sec: string, idx: number) => {
    setAnulled((a) => {
      const s = new Set(a[sec] || [])
      s.add(idx)
      return { ...a, [sec]: s }
    })
    setRows((r) => {
      const u = [...(r[sec] || [])]
      const row = [...u[idx]]
      const lastIdx = row.length - 1
      if (
        typeof row[lastIdx] === "string" &&
        (row[lastIdx] === "Activo" ||
          row[lastIdx] === "Activa" ||
          row[lastIdx] === "Completada")
      )
        row[lastIdx] = "Inactivo"
      u[idx] = row
      return { ...r, [sec]: u }
    })
  }
  const confirmAnul = () => {
    const target = anulTarget
    if (!target) return

    const row = rows[target.section]?.[target.idx]
    if (!getAnulAssessment(target.section, row, target.idx).allowed) return

    const statusIndex = MOD_CFG[target.section]?.statusIndex
    if (statusIndex !== undefined) {
      toggleStatus(target.section, target.idx, statusIndex)
    } else {
      doAnul(target.section, target.idx)
    }
    setAnulTarget(null)
  }

  const reactivate = (sec: string, idx: number) => {
    setAnulled((a) => {
      const s = new Set(a[sec] || [])
      s.delete(idx)
      return { ...a, [sec]: s }
    })
    setRows((r) => {
      const u = [...(r[sec] || [])]
      const row = [...u[idx]]
      const lastIdx = row.length - 1
      if (typeof row[lastIdx] === "string") row[lastIdx] = "Activo"
      u[idx] = row
      return { ...r, [sec]: u }
    })
  }
  const confirmDelete = () => {
    const target = delTarget
    if (!target) return
    if (!getDeleteAssessment(target.section, rows[target.section]?.[target.idx]).allowed)
      return

    setRows((current) => {
      const currentRow = current[target.section]?.[target.idx]
      if (!getDeleteAssessment(target.section, currentRow).allowed) return current

      const updated = [...(current[target.section] || [])]
      updated.splice(target.idx, 1)
      return { ...current, [target.section]: updated }
    })
    setDelTarget(null)
  }
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) setImgPreview(e.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  const parsePurchaseItems = (value: string | number | undefined) =>
    String(value ?? "")
      .split(/\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, unitPrice] = line.split("|").map((part) => part.trim())
        const parsedQuantity = Number(quantity || 0)
        const parsedUnitPrice = Number(unitPrice || 0)
        return {
          name: name || "Producto",
          quantity: quantity || "0",
          unitPrice,
          total: parsedQuantity * parsedUnitPrice,
        }
      })

  // Adds (sign 1) or removes (sign -1) a purchase's quantities to each insumo's
  // "Stock actual" (row[4]). Items are matched by name ignoring case/accents.
  function withStockChange(
    insumoRows: (string | number)[][],
    purchaseItems: string | number | undefined,
    sign: 1 | -1,
  ) {
    const totals = new Map<string, number>()
    for (const item of parsePurchaseItems(purchaseItems)) {
      const key = normalizeName(item.name)
      totals.set(key, (totals.get(key) ?? 0) + (Number(item.quantity) || 0))
    }
    return insumoRows.map((supply) => {
      const qty = totals.get(normalizeName(supply[0]))
      if (!qty) return supply
      const updated = [...supply]
      const next = Number(updated[4] || 0) + sign * qty
      updated[4] = Math.max(0, Math.round(next * 1000) / 1000)
      return updated
    })
  }

  const parseProductionHistory = (
    value: string | number | undefined,
  ): { status: string; date: string; time: string }[] => {
    try {
      const history = JSON.parse(String(value ?? "[]"))
      return Array.isArray(history)
        ? (history as { status: string; date: string; time: string }[])
        : []
    } catch {
      return []
    }
  }

  const PAGE_SIZE = 6

  // Dashboard data
  const now = new Date()
  const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString("es-CO", { weekday: "short" })
  })
  const getWeekRanges = () => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weeks: string[] = []
    let d = new Date(monthStart)
    let wn = 1
    while (d.getMonth() === now.getMonth()) {
      const start = d.getDate()
      const end = Math.min(
        start + 6,
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      )
      const mes = now.toLocaleDateString("es-CO", { month: "short" })
      weeks.push(`Sem ${wn} (${start}-${end} ${mes})`)
      d.setDate(d.getDate() + 7)
      wn++
    }
    return weeks
  }
  const CHART_DATA: Record<string, {
    labels: string[]
    values: number[]
    values2: number[]
  }> = {
    hoy: {
      labels: ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"],
      values: [12, 28, 65, 87, 54, 92, 74, 38],
      values2: [5, 8, 12, 15, 9, 18, 11, 6],
    },
    semana: {
      labels: weekLabels,
      values: [55, 73, 61, 88, 72, 95, 64],
      values2: [8, 12, 5, 15, 10, 6, 9],
    },
    mes: {
      labels: getWeekRanges(),
      values: [68, 82, 75, 91],
      values2: [12, 8, 15, 10],
    },
    año: {
      labels: [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ],
      values: [55, 70, 65, 80, 75, 90, 85, 70, 65, 80, 88, 95],
      values2: [10, 12, 8, 15, 11, 9, 13, 10, 8, 12, 9, 11],
    },
  }
  const chart = CHART_DATA[chartFilter]

  const TOP = [
    { name: "Mini", units: 284, pct: 100 },
    { name: "Salchipapa Sencilla", units: 241, pct: 85 },
    { name: "Perro Mediano", units: 198, pct: 70 },
    { name: "Salchipapa Super Gourmet", units: 167, pct: 59 },
    { name: "Salchipapa Mega Gourmet", units: 143, pct: 50 },
  ]
  const KPI = [
    {
      icon: Ico.cash,
      label: "Ventas hoy",
      val: "$420.000",
      badge: "+12%",
      good: true,
    },
    { icon: Ico.orders, label: "Pedidos", val: "18", badge: "+8%", good: true },
    {
      icon: Ico.users,
      label: "Clientes nuevos",
      val: "7",
      badge: "+15%",
      good: true,
    },
    {
      icon: Ico.undo,
      label: "Devoluciones",
      val: "2",
      badge: "-2",
      good: false,
    },
  ]
  const ALERTS = notifications
  const RETURN_REASONS = [
    { label: "Tiempo superado", pct: 45 },
    { label: "Pedido incompleto", pct: 30 },
    { label: "Ingrediente incorrecto", pct: 15 },
    { label: "Otro", pct: 10 },
  ]

  const Dashboard = () => (
    <div className="min-w-0 space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="font-semibold text-lg" style={{ color: t.text }}>
            Bienvenido, {user?.name?.split(" ")[0] ?? "Admin"}
          </h2>
          <p className="text-xs mt-0.5 capitalize" style={{ color: t.muted }}>
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-4">
        {KPI.map(({ icon, label, val, badge, good }) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl p-5"
            style={{ background: t.card, border: `1px solid ${t.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: t.input, color: C.mustard }}
              >
                {icon}
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: good
                    ? "rgba(58,109,94,0.15)"
                    : "rgba(165,65,49,0.12)",
                  color: good ? "#2E7D60" : C.red,
                }}
              >
                {badge}
              </span>
            </div>
            <div
              className="break-words font-black text-xl sm:text-2xl"
              style={{ fontFamily: "Montserrat, sans-serif", color: t.text }}
            >
              {val}
            </div>
            <div className="text-xs mt-0.5" style={{ color: t.muted }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Sales vs Losses */}
        <div
          className="min-w-0 rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-sm" style={{ color: t.text }}>
                Ventas vs Pérdidas
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: "#D2A84E" }}
                  />
                  <span className="text-xs" style={{ color: t.muted }}>
                    Ventas
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: "#A54131" }}
                  />
                  <span className="text-xs" style={{ color: t.muted }}>
                    Pérdidas
                  </span>
                </div>
              </div>
            </div>
            <div
              className="flex max-w-full flex-wrap gap-1 rounded-lg p-0.5"
              style={{ background: t.input, border: `1px solid ${t.border}` }}
            >
              {(["hoy", "semana", "mes", "año"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer capitalize"
                  style={{
                    background: chartFilter === f ? C.mustard : "transparent",
                    color: chartFilter === f ? "#fff" : t.muted,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              ["Ventas totales", "$1.2M", "#2E7D60"],
              ["Pérdidas", "$48K", "#A54131"],
              ["Margen neto", "96%", "#2E7D60"],
              ["Promedio en dinero", "$18.2K", C.mustard],
            ].map(([lbl, val, col]) => (
              <div
                key={String(lbl)}
                className="px-2 py-2 rounded-xl text-center"
                style={{ background: t.input }}
              >
                <div
                  className="font-black text-sm"
                  style={{
                    fontFamily: "Montserrat,sans-serif",
                    color: String(col),
                  }}
                >
                  {val}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: t.muted, fontSize: "0.58rem" }}
                >
                  {lbl}
                </div>
              </div>
            ))}
          </div>
          <div className="relative" style={{ height: "140px" }}>
            <div className="absolute inset-0 flex items-end gap-1">
              {chart.values.map((v, i) => {
                const max = Math.max(...chart.values, ...chart.values2) * 1.1
                const hV = Math.round((v / max) * 120)
                const hL = Math.round((chart.values2[i] / max) * 120)
                const valLabel =
                  v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
                const lossLabel =
                  chart.values2[i] >= 1000
                    ? `$${Math.round(chart.values2[i] / 1000)}k`
                    : `$${chart.values2[i]}`
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-0.5"
                  >
                    <div
                      className="flex items-end gap-0.5 w-full"
                      style={{ height: "120px" }}
                    >
                      <div className="flex-1 flex flex-col items-center justify-end">
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "#D2A84E",
                            fontWeight: 700,
                          }}
                        >
                          {valLabel}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            height: `${hV}px`,
                            background: "#D2A84E",
                            borderRadius: "3px 3px 0 0",
                            minHeight: "4px",
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-end">
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "#A54131",
                            fontWeight: 700,
                          }}
                        >
                          {lossLabel}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            height: `${hL}px`,
                            background: "#A54131",
                            borderRadius: "3px 3px 0 0",
                            minHeight: "4px",
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        color: t.text,
                        fontSize: "0.55rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        maxWidth: "40px",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {chart.labels[i]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {/* Top products */}
        <div
          className="min-w-0 rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: C.amber }}>{Ico.fire}</span>
            <div className="font-semibold text-sm" style={{ color: t.text }}>
              Más vendidos
            </div>
          </div>
          <div className="space-y-3">
            {TOP.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: i === 0 ? C.mustard : t.subtle }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-xs flex-1 mx-2 truncate"
                    style={{ color: t.text }}
                  >
                    {p.name}
                  </span>
                  <span className="text-xs" style={{ color: t.muted }}>
                    {p.units}
                  </span>
                </div>
                <div
                  className="w-full rounded-full h-1.5"
                  style={{ background: t.input }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${p.pct}%`,
                      background: i === 0 ? C.mustard : "rgba(182,140,28,0.35)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        {/* Production times */}
        <div
          className="min-w-0 rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#4FC3F7" }}>{Ico.clock}</span>
            <div className="font-semibold text-sm" style={{ color: t.text }}>
              Tiempos en producción
            </div>
          </div>
          <div className="space-y-3">
            {[
              ["Tiempo promedio", "14 min", true],
              ["Órdenes a tiempo", "87%", true],
              ["Órdenes retrasadas", "3", false],
              ["Tiempo por orden", "11 min", true],
            ].map(([lbl, val, good]) => (
              <div
                key={String(lbl)}
                className="flex items-center justify-between"
              >
                <span className="text-xs" style={{ color: t.muted }}>
                  {lbl}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: good ? "#2E7D60" : C.red }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Return reasons */}
        <div
          className="min-w-0 rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: C.red }}>{Ico.undo}</span>
            <div className="font-semibold text-sm" style={{ color: t.text }}>
              Motivos de devolución
            </div>
          </div>
          <div className="space-y-2.5">
            {RETURN_REASONS.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: t.muted }}>
                    {r.label}
                  </span>
                  <span className="text-xs font-bold" style={{ color: t.text }}>
                    {r.pct}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full w-full"
                  style={{ background: t.input }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${r.pct}%`, background: C.red }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Annual performance */}
        <div
          className="min-w-0 rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: C.mustard }}>{Ico.trending}</span>
            <div className="font-semibold text-sm" style={{ color: t.text }}>
              Desempeño anual
            </div>
          </div>
          <div className="space-y-3">
            {[
              ["Ventas este año", "$12.4M", "+23% vs año anterior"],
              ["Mejor mes", "Diciembre", "$1.8M"],
              ["Mejor categoría", "Hamburguesas", "41% de ventas"],
              ["Promedio en dinero", "$18.200", "+$800 vs mes ant."],
            ].map(([lbl, val, sub]) => (
              <div key={String(lbl)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: t.muted }}>
                    {lbl}
                  </span>
                  <span className="text-sm font-bold" style={{ color: t.text }}>
                    {val}
                  </span>
                </div>
                <div className="text-xs" style={{ color: t.subtle }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="admin-alerts-section"
        className="mt-5 rounded-2xl overflow-hidden"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <span style={{ color: C.red }}>{Ico.bell}</span>
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: t.text }}
          >
            Alertas del admin
          </span>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${C.red}20`, color: C.red }}
          >
            {ALERTS.length}
          </span>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {ALERTS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                markNotificationRead(a.id)
                setSection(a.target)
              }}
              className="flex items-start gap-3 rounded-xl p-3 text-left cursor-pointer"
              style={{ background: t.input, border: `1px solid ${t.border}` }}
            >
              <span
                className="mt-0.5 flex-shrink-0"
                style={{
                  color:
                    a.type === "danger"
                      ? C.red
                      : a.type === "warn"
                        ? C.mustard
                        : "#4FC3F7",
                }}
              >
                {Ico.alert}
              </span>
              <span className="min-w-0">
                <span
                  className="block text-xs font-semibold"
                  style={{ color: t.text }}
                >
                  {a.title}
                </span>
                <span
                  className="block text-xs leading-snug break-words"
                  style={{ color: t.muted }}
                >
                  {a.message}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const GenericTable = () => {
    const cfg = MOD_CFG[section]
    if (!cfg) return null

    const searchInputRef = useRef<HTMLInputElement>(null)
    const isProducto = section === "producto"

    // Do not steal focus from an open form when its controlled fields update.
    useEffect(() => {
      if (modal.mode === null && searchInputRef.current) {
        const currentValue = searchInputRef.current.value
        searchInputRef.current.focus()
        searchInputRef.current.value = currentValue
        // Restore cursor position to end
        searchInputRef.current.setSelectionRange(currentValue.length, currentValue.length)
      }
    }, [search[section], pg[section]])
    const noDelete = !!cfg.noDelete
    const noExp = !!cfg.noExport
    const indexedRows = (rows[section] || []).map((row, index) => ({ row, index }))
    const sRows = section === "produccion"
      ? indexedRows.sort((first, second) => {
          const statusOrder: Record<string, number> = {
            Recibida: 0,
            Iniciada: 1,
            "En cocina": 2,
            Terminado: 3,
            "Producto no conforme": 4,
          }
          const statusDifference =
            (statusOrder[String(first.row[8])] ?? 9) -
            (statusOrder[String(second.row[8])] ?? 9)
          if (statusDifference !== 0) return statusDifference
          if (String(first.row[8]) === "Terminado") {
            return (Number(first.row[10]) || 0) - (Number(second.row[10]) || 0)
          }
          return (Number(first.row[3]) || 0) - (Number(second.row[3]) || 0)
        })
      : indexedRows
    const q = (search[section] || "").toLowerCase()
    const filtered = sRows.filter(
        ({ row }) =>
          !q || row.some((cell) => String(cell).toLowerCase().includes(q)),
      )
    const cur = pg[section] || 0
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pageRows = filtered.slice(cur * PAGE_SIZE, (cur + 1) * PAGE_SIZE)
    const setP = (page: number) =>
      setPg((current) => ({ ...current, [section]: page }))
    const anulSet = anulled[section] || new Set<number>()
    const visibleColumns = cfg.columns.filter(
      (_, index) => !(isProducto && index === 0),
    )
    const getDisplayCellIndexes = (row: (string | number)[]) =>
      isProducto
        ? [0, 1, 2, 4]
        : row
            .map((_, index) => index)
            .filter((index) => !cfg.hiddenCellIndexes?.includes(index))
    const getDisplayCells = (row: (string | number)[]) =>
      getDisplayCellIndexes(row).map((index) => row[index])
    const columnCount = Math.max(
      visibleColumns.length,
      ...pageRows.map(({ row }) => getDisplayCells(row).length),
      1,
    )

    const exportRows = () => {
      const csvCell = (value: string | number) =>
        `"${String(value).replace(/"/g, '""')}"`
      const exportData = filtered.map(({ row }) => getDisplayCells(row))
      const csv = [visibleColumns, ...exportData]
        .map((line) => line.map(csvCell).join(","))
        .join("\n")
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${section}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }

    const renderCellValue = (
      cell: string | number,
      primary = false,
      isLow = false,
    ) => {
      const badge = badgeSt(cell)
      const color = isLow ? C.red : primary ? t.text : t.muted
      if (badge) {
        return (
          <span
            className="inline-block max-w-full rounded-full px-2 py-1 text-[10px] font-semibold leading-tight break-words [overflow-wrap:anywhere]"
            style={{ background: badge.bg, color: badge.color }}
          >
            {cell}
          </span>
        )
      }
      return <span style={{ color }}>{String(cell)}</span>
    }

    const formatSalesDate = (value: string | number) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
      if (!match) return "—"
      const [, year, month, day] = match
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day)
      ) return "—"
      return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    const formatDisplayCell = (
      cell: string | number,
      rowCellIndex: number,
    ): string | number => {
      if (section !== "ventas") return cell
      if (rowCellIndex === 3) return formatSalesDate(cell)
      if (rowCellIndex === 7) {
        const total = Number(cell)
        return Number.isFinite(total) ? fmt(total) : "—"
      }
      return cell
    }

    const renderStatusControl = (rowIndex: number, rowCellIndex: number) => {
      if (cfg.statusIndex === undefined || rowCellIndex !== cfg.statusIndex) {
        return null
      }
      if (section === "produccion") {
        return <ProductionStatusSelect rowIndex={rowIndex} />
      }
      return (
        <StatusSwitch
          sec={section}
          rowIndex={rowIndex}
          statusIndex={cfg.statusIndex}
          entityName={String(rows[section]?.[rowIndex]?.[0] ?? "registro")}
        />
      )
    }

    const renderActions = (rowIndex: number, isAnulled: boolean) => {
      const orderRow = section === "pedidos" ? rows.pedidos?.[rowIndex] : undefined
      const needsPaymentReview =
        !!orderRow &&
        isTransferPaymentMethod(String(orderRow[4] ?? "")) &&
        String(orderRow[8]) === "Pendiente de verificación"
      const detailActionLabel = needsPaymentReview
        ? "Revisar transferencia"
        : section === "compras"
          ? "Ver compra"
          : "Ver detalle"
      const deleteAssessment = getDeleteAssessment(
        section,
        rows[section]?.[rowIndex],
      )
      const deleteBlocked = !deleteAssessment.allowed
      const deleteButton = (
        <button
          type="button"
          title={`${deleteBlocked ? "No se puede eliminar" : "Se puede eliminar"}: ${deleteAssessment.reason}`}
          aria-label={
            deleteBlocked
              ? "Ver motivo por el que no se puede eliminar"
              : "Eliminar registro"
          }
          aria-haspopup="dialog"
          onClick={() => setDelTarget({ section, idx: rowIndex })}
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            deleteBlocked
              ? "cursor-help opacity-60 hover:opacity-100"
              : "cursor-pointer hover:opacity-80"
          }`}
          style={{ color: C.red, background: `${C.red}12` }}
        >
          {deleteBlocked ? Ico.alert : Ico.trash}
        </button>
      )

      return (
        <div className="flex flex-shrink-0 items-center justify-end gap-1">
          <button
            type="button"
            title={detailActionLabel}
            aria-label={detailActionLabel}
            onClick={() => openView(section, rowIndex)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
            style={{ color: C.amber, background: `${C.amber}15` }}
          >
            {Ico.eye}
          </button>
          {!isAnulled && (
            <button
              type="button"
              title="Editar"
              aria-label="Editar"
              onClick={() => openEdit(section, rowIndex)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
              style={{ color: C.mustard, background: `${C.mustard}15` }}
            >
              {Ico.edit}
            </button>
          )}
          {cfg.statusIndex !== undefined ? (
            section === "producto" ? (
              isAnulled ? (
                <button
                  type="button"
                  title="Reactivar producto"
                  aria-label="Reactivar producto"
                  onClick={() =>
                    toggleStatus(section, rowIndex, cfg.statusIndex!)
                  }
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                  style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
                >
                  {Ico.undo}
                </button>
              ) : (
                <button
                  type="button"
                  title="Anular producto"
                  aria-label="Anular producto"
                  aria-haspopup="dialog"
                  onClick={() => setAnulTarget({ section, idx: rowIndex })}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                  style={{ color: C.red, background: `${C.red}12` }}
                >
                  {Ico.ban}
                </button>
              )
            ) : (
              !noDelete && deleteButton
            )
          ) : noDelete ? (
            isAnulled ? (
              <button
                type="button"
                title="Reactivar"
                aria-label="Reactivar"
                onClick={() => reactivate(section, rowIndex)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                style={{ color: "#2E7D60", background: "rgba(46,125,96,0.12)" }}
              >
                {Ico.undo}
              </button>
            ) : (
              <button
                type="button"
                title="Anular"
                aria-label="Anular"
                aria-haspopup="dialog"
                onClick={() => setAnulTarget({ section, idx: rowIndex })}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:opacity-80"
                style={{ color: C.red, background: `${C.red}12` }}
              >
                {Ico.ban}
              </button>
            )
          ) : (
            deleteButton
          )}
        </div>
      )
    }

    return (
      <div className="min-w-0">
        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
          <div
            className="flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2 sm:w-72"
            style={{ background: t.input, border: `1px solid ${t.inputB}` }}
          >
            <span className="flex-shrink-0" style={{ color: t.muted }}>
              {Ico.search}
            </span>
            <input
              ref={searchInputRef}
              key={`search-${section}`}
              placeholder="Buscar..."
              value={search[section] || ""}
              onChange={(event) => {
                setSearch((current) => ({
                  ...current,
                  [section]: event.target.value,
                }))
                setP(0)
              }}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              style={{ color: t.text }}
            />
            {search[section] && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setSearch((current) => ({ ...current, [section]: "" }))
                  setP(0)
                }}
                className="flex-shrink-0 cursor-pointer"
                style={{ color: t.muted }}
              >
                ×
              </button>
            )}
          </div>
          {/* Short search on the left, action buttons pushed to the right */}
          <div className="hidden sm:block sm:flex-1" />
          {!noExp && (
            <button
              type="button"
              onClick={exportRows}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs cursor-pointer"
              style={{
                background: t.input,
                border: `1px solid ${t.inputB}`,
                color: t.muted,
              }}
            >
              {Ico.download} Exportar
            </button>
          )}
          {section === "ventas" && (
            <button
              type="button"
              onClick={() => {
                setSection("devoluciones")
                setSidebarOpen(false)
                openAdd("devoluciones")
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
              style={{ background: `${C.red}12`, color: C.red }}
            >
              {Ico.undo} Nueva devolución
            </button>
          )}
          <button
            type="button"
            onClick={() => openAdd(section)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer hover:opacity-90"
            style={{ background: C.mustard, color: "#fff" }}
          >
            {Ico.plus} Nuevo
          </button>
        </div>

        <div
          className="min-w-0 overflow-hidden rounded-2xl"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="hidden min-[1180px]:block">
            <table className="w-full table-fixed text-xs">
              <colgroup>
                {isProducto && <col style={{ width: "60px" }} />}
                {Array.from({ length: columnCount }, (_, index) => (
                  <col key={index} />
                ))}
                <col style={{ width: "108px" }} />
              </colgroup>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${t.border}`,
                    background: t.cardAlt,
                  }}
                >
                  {isProducto && (
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: t.muted }}
                    >
                      Img
                    </th>
                  )}
                  {Array.from({ length: columnCount }, (_, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-2 py-3 text-left align-top text-[10px] font-bold uppercase leading-tight tracking-wide break-words [overflow-wrap:anywhere]"
                      style={{ color: t.muted }}
                    >
                      {visibleColumns[index] || `Dato ${index + 1}`}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: t.muted }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columnCount + (isProducto ? 2 : 1)}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: t.subtle }}
                    >
                      Sin registros{q ? ` para "${q}"` : ""}
                    </td>
                  </tr>
                )}
                {pageRows.map(({ row, index: originalIndex }, rowIndex) => {
                  const isAnulled = anulSet.has(originalIndex)
                  const isLow =
                    section === "insumos" &&
                    Number(row[4]) <= Number(row[5])
                  const isSupplyProduct =
                    section === "insumos" &&
                    String(row[7]).toLowerCase() === "sí"
                  const isLocalClient =
                    section === "clientes" &&
                    String(row[6]).toLowerCase() === "sí"
                  const displayCellIndexes = getDisplayCellIndexes(row)
                  const displayCells = getDisplayCells(row)
                  return (
                    <tr
                      key={originalIndex}
                      style={{
                        borderBottom:
                          rowIndex < pageRows.length - 1
                            ? `1px solid ${t.border}`
                            : "none",
                        opacity: isAnulled ? 0.45 : 1,
                        background: isLow ? "rgba(165,65,49,0.18)" : "transparent",
                      }}
                      onMouseEnter={(event) =>
                        (event.currentTarget.style.background = isLow
                          ? "rgba(165,65,49,0.28)"
                          : t.hover)
                      }
                      onMouseLeave={(event) =>
                        (event.currentTarget.style.background = isLow
                          ? "rgba(165,65,49,0.18)"
                          : "transparent")
                      }
                    >
                      {isProducto && (
                        <td className="px-2 py-3 align-top">
                          <div
                            className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
                            style={{ background: t.input }}
                          >
                            {prodImgs[originalIndex] ? (
                              <img
                                src={prodImgs[originalIndex]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg">
                                🍔
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {displayCells.map((cell, cellIndex) => {
                        const rowCellIndex = displayCellIndexes[cellIndex]
                        const displayCell = formatDisplayCell(cell, rowCellIndex)
                        return (
                          <td
                            key={rowCellIndex}
                            className="min-w-0 px-2 py-3 align-top text-xs leading-snug break-words [overflow-wrap:anywhere]"
                          >
                            {rowCellIndex === cfg.statusIndex ? (
                              renderStatusControl(originalIndex, rowCellIndex)
                            ) : cellIndex === 0 && (isSupplyProduct || isLocalClient) ? (
                              <div className="min-w-0">
                                {renderCellValue(cell, true, isLow)}
                                <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                                  {isLocalClient ? "Cliente de local" : "Producto de insumo"}
                                </span>
                              </div>
                            ) : (
                              renderCellValue(displayCell, cellIndex === 0, isLow)
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-3 align-top">
                        {renderActions(originalIndex, isAnulled)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="min-[1180px]:hidden">
            {pageRows.length === 0 ? (
              <div
                className="px-4 py-12 text-center text-sm"
                style={{ color: t.subtle }}
              >
                Sin registros{q ? ` para "${q}"` : ""}
              </div>
            ) : (
              pageRows.map(({ row, index: originalIndex }, rowIndex) => {
                const isAnulled = anulSet.has(originalIndex)
                const isLow =
                  section === "insumos" &&
                  Number(row[4]) <= Number(row[5])
                const isSupplyProduct =
                  section === "insumos" &&
                  String(row[7]).toLowerCase() === "sí"
                const isLocalClient =
                  section === "clientes" &&
                  String(row[6]).toLowerCase() === "sí"
                const displayCellIndexes = getDisplayCellIndexes(row)
                const displayCells = getDisplayCells(row)
                return (
                  <article
                    key={originalIndex}
                    className="min-w-0 p-3 sm:p-4"
                    style={{
                      borderBottom:
                        rowIndex < pageRows.length - 1
                          ? `1px solid ${t.border}`
                          : "none",
                      opacity: isAnulled ? 0.45 : 1,
                      background: isLow ? "rgba(165,65,49,0.18)" : "transparent",
                    }}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      {isProducto && (
                        <div
                          className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl"
                          style={{ background: t.input }}
                        >
                          {prodImgs[originalIndex] ? (
                            <img
                              src={prodImgs[originalIndex]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              🍔
                            </div>
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-sm font-semibold leading-snug break-words [overflow-wrap:anywhere]">
                        {renderCellValue(displayCells[0] ?? "—", true, isLow)}
                        {(isSupplyProduct || isLocalClient) && (
                          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.mustard}18`, color: C.mustard }}>
                            {isLocalClient ? "Cliente de local" : "Producto de insumo"}
                          </span>
                        )}
                      </div>
                      {renderActions(originalIndex, isAnulled)}
                    </div>
                    <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-2">
                      {displayCells.slice(1).map((cell, cellIndex) => {
                        const visibleIndex = cellIndex + 1
                        const rowCellIndex = displayCellIndexes[visibleIndex]
                        return (
                          <div key={rowCellIndex} className="contents">
                            <dt
                              className="min-w-0 text-[11px] font-semibold leading-snug break-words [overflow-wrap:anywhere]"
                              style={{ color: t.subtle }}
                            >
                              {visibleColumns[visibleIndex] ||
                                `Dato ${visibleIndex + 1}`}
                            </dt>
                            <dd
                              className="min-w-0 text-xs leading-snug break-words [overflow-wrap:anywhere]"
                              style={{ fontWeight: 500 }}
                            >
                              {rowCellIndex === cfg.statusIndex ? (
                                renderStatusControl(originalIndex, rowCellIndex)
                              ) : (
                                renderCellValue(
                                  formatDisplayCell(cell, rowCellIndex),
                                )
                              )}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </article>
                )
              })
            )}
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{ borderTop: `1px solid ${t.border}` }}
          >
            <span className="text-xs" style={{ color: t.subtle }}>
              {filtered.length} registros · Pág {cur + 1}/{totalPages}
            </span>
            <div className="flex flex-wrap justify-end gap-1">
              <button
                type="button"
                disabled={cur === 0}
                onClick={() => setP(cur - 1)}
                className="h-7 w-7 rounded text-xs cursor-pointer disabled:opacity-30"
                style={{ background: t.input, color: t.muted }}
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setP(index)}
                  className="h-7 w-7 rounded text-xs font-semibold cursor-pointer"
                  style={{
                    background: index === cur ? C.mustard : "transparent",
                    color: index === cur ? "#fff" : t.muted,
                  }}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={cur >= totalPages - 1}
                onClick={() => setP(cur + 1)}
                className="h-7 w-7 rounded text-xs cursor-pointer disabled:opacity-30"
                style={{ background: t.input, color: t.muted }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Roles permissions matrix for create/edit
  const RolesPermMatrix = ({
    roleName,
    permissionKey = roleName,
    readOnly = false,
  }: {
    roleName: string
    permissionKey?: string
    readOnly?: boolean
  }) => {
    const isAdmin = roleName.toLowerCase() === "administrador"
    const perms = isAdmin
      ? Object.fromEntries(
          PERMISSION_MODULES.map(({ name }) => [
            name,
            ["Ver", "Crear", "Editar", "Anular", "Eliminar"],
          ]),
        )
      : (rolesPerms[permissionKey] || {})
    const commonActions = ["Ver", "Crear", "Editar"]
    const toggle = (mod: string, action: string) => {
      if (readOnly || isAdmin) return
      setRolesPerms((rp) => {
        const cur = rp[permissionKey]?.[mod] || []
        const next = cur.includes(action)
          ? cur.filter((a) => a !== action)
          : [...cur, action]
        return { ...rp, [permissionKey]: { ...(rp[permissionKey] || {}), [mod]: next } }
      })
    }
    const setAllPermissions = (select: boolean) => {
      if (readOnly || isAdmin) return
      setRolesPerms((rp) => {
        const nextPerms = Object.fromEntries(
          PERMISSION_MODULES.map(({ name, finalAction }) => {
            const actions = [...commonActions, finalAction]
            return [name, select ? actions : []]
          }),
        )
        return { ...rp, [permissionKey]: nextPerms }
      })
    }
    const setActionForAll = (action: string, select: boolean) => {
      if (readOnly || isAdmin) return
      setRolesPerms((rp) => {
        const current = rp[permissionKey] || {}
        const nextPerms = Object.fromEntries(
          PERMISSION_MODULES.map(({ name, finalAction }) => {
            const targetAction = action === "final" ? finalAction : action
            const currentActions = current[name] || []
            const nextActions = select
              ? currentActions.includes(targetAction)
                ? currentActions
                : [...currentActions, targetAction]
              : currentActions.filter((currentAction) => currentAction !== targetAction)
            return [name, nextActions]
          }),
        )
        return { ...rp, [permissionKey]: { ...current, ...nextPerms } }
      })
    }
    const columnHeader = (label: string, action: string) => {
      return (
        <div className="flex min-w-0 flex-col items-center justify-center gap-0.5">
          <span className="text-center text-[10px] font-bold leading-tight break-words" style={{ color: t.muted }}>
            {label}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActionForAll(action, true)}
                disabled={isAdmin}
                aria-label={`Seleccionar todo: ${label} en todos los módulos`}
                title={`Seleccionar todo: ${label} en todos los módulos`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: t.input, color: C.mustard }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setActionForAll(action, false)}
                disabled={isAdmin}
                aria-label={`Quitar todo: ${label} en todos los módulos`}
                title={`Quitar todo: ${label} en todos los módulos`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: t.input, color: t.muted }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="text-xs font-bold" style={{ color: t.muted }}>
            Permisos por módulo
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAllPermissions(true)}
                disabled={isAdmin}
                title={isAdmin ? "El rol Administrador siempre conserva todos los privilegios." : undefined}
                className="rounded-lg px-2.5 py-1 text-[10px] font-semibold cursor-pointer"
                style={{
                  background: t.input,
                  color: t.text,
                  opacity: isAdmin ? 0.5 : 1,
                  cursor: isAdmin ? "not-allowed" : "pointer",
                }}
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                onClick={() => setAllPermissions(false)}
                disabled={isAdmin}
                title={isAdmin ? "El rol Administrador siempre conserva todos los privilegios." : undefined}
                className="rounded-lg px-2.5 py-1 text-[10px] font-semibold cursor-pointer"
                style={{
                  background: t.input,
                  color: t.text,
                  opacity: isAdmin ? 0.5 : 1,
                  cursor: isAdmin ? "not-allowed" : "pointer",
                }}
              >
                Quitar todos
              </button>
            </div>
          )}
        </div>
        <div
          className="max-h-[46vh] min-w-0 overflow-auto rounded-xl"
          style={{ border: `1px solid ${t.border}` }}
        >
          <div
            className="sticky top-0 z-10 grid min-w-0 items-center px-2.5 py-1.5"
            style={{
              gridTemplateColumns:
                "minmax(0, 1fr) repeat(4, minmax(2rem, 2.5rem))",
              background: t.cardAlt,
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <div
              className="min-w-0 text-[10px] font-bold break-words"
              style={{ color: t.muted }}
            >
              Módulo
            </div>
            {commonActions.map((action) => (
              <div key={action}>{columnHeader(action, action)}</div>
            ))}
            <div>{columnHeader("Anular / Eliminar", "final")}</div>
          </div>
          {PERMISSION_MODULES.map(({ name, finalAction }, index) => {
            const moduleActions = [...commonActions, finalAction]
            return (
              <div
                key={name}
                className="grid min-w-0 items-center px-2.5 py-1"
                style={{
                  gridTemplateColumns:
                    "minmax(0, 1fr) repeat(4, minmax(2rem, 2.5rem))",
                  borderBottom:
                    index < PERMISSION_MODULES.length - 1
                      ? `1px solid ${t.border}`
                      : "none",
                }}
              >
                <div
                  className="min-w-0 text-xs leading-snug break-words"
                  style={{ color: t.text }}
                >
                  {name}
                </div>
                {moduleActions.map((action) => (
                  <div key={action} className="flex min-w-0 justify-center">
                    <input
                      type="checkbox"
                      title={action}
                      aria-label={`${action} ${name}`}
                      checked={(perms[name] || []).includes(action)}
                      onChange={() => toggle(name, action)}
                      disabled={readOnly}
                      className={readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                      style={{
                        accentColor: C.mustard,
                        width: "14px",
                        height: "14px",
                      }}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Called as a plain function ({CRUDModal()}), not <CRUDModal />: a component
  // declared inside AdminPanel is a new type on every render, which remounted the
  // form on each keystroke and dropped input focus. Keep hooks out of here.
  const CRUDModal = () => {
    if (!modal.mode) return null
    const cfg = MOD_CFG[modal.section]
    if (!cfg) return null
    const isView = modal.mode === "view"
    const isRoles = modal.section === "roles"
    const isProduct = modal.section === "producto"
    const isPedido = modal.section === "pedidos"
    const isPurchase = modal.section === "compras"
    const isSupply = modal.section === "insumos"
    const isProduction = modal.section === "produccion"
    const isPnc = modal.section === "producto-no-conforme"
    const isSales = modal.section === "ventas"
    const isReturns = modal.section === "devoluciones"
    const isClient = modal.section === "clientes"
    const isSupplier = modal.section === "proveedores"
    const isUser = modal.section === "usuarios"
    const row = modal.idx !== null ? rows[modal.section]?.[modal.idx] : null
    const orderDetails = isPedido ? getAdminOrderLines(row || undefined) : []
    const saleOrderLines = getSaleOrderLines(isSales ? row : null)
    const saleOrderIndex = isSales
      ? rows.pedidos?.findIndex((order) => order[0] === row?.[9]) ?? -1
      : -1
    // Purchase module (Compras) gets a compact 2-column form and a formatted detail view
    // Modules with the compact form: narrow 2-column modal, titled by entity,
    // formatted detail view ("isPurchaseModule" started with Compras, now shared)
    const PURCHASE_ENTITIES: Record<string, { name: string; fem: boolean }> = {
      "cat-insumos": { name: "categoría de insumo", fem: true },
      insumos: { name: "insumo", fem: false },
      proveedores: { name: "proveedor", fem: false },
      compras: { name: "compra", fem: true },
      perdidas: { name: "pérdida de insumo", fem: true },
      "cat-producto": { name: "categoría de producto", fem: true },
      produccion: { name: "orden de producción", fem: true },
      "producto-no-conforme": { name: "producto no conforme", fem: false },
      clientes: { name: "cliente", fem: false },
      pedidos: { name: "pedido", fem: false },
      ventas: { name: "venta", fem: true },
      devoluciones: { name: "devolución", fem: true },
    }
    const purchaseEntity = PURCHASE_ENTITIES[modal.section]
    const isPurchaseModule = !!purchaseEntity
    const namesOf = (sec: string) =>
      (rows[sec] || []).map((r) => String(r[0] ?? "")).filter(Boolean)
    // Sections whose first field is a name/main choice that reads better full width
    const WIDE_FIRST_FIELD = ["cat-insumos", "insumos", "proveedores", "compras", "perdidas", "cat-producto", "clientes", "pedidos"]
    const isWideField = (f: FieldType) =>
      (f.key === "0" && (WIDE_FIRST_FIELD.includes(modal.section) || !isSupplier)) ||
      f.type === "textarea" ||
      f.type === "checkbox" ||
      (modal.section === "proveedores" && (f.key === "5" || f.key === "7")) ||
      (modal.section === "clientes" && f.key === "5")
    const splitList = (value: string) =>
      value.split(",").map((item) => item.trim()).filter(Boolean)
    const supplyInfo = (name: string) =>
      (rows.insumos || []).find((supply) => String(supply[0]) === name)
    // Insumos the supplier sells (supplier row[7]), limited to insumos that still exist
    const supplierSupplies = (supplierName: string) => {
      const supplier = (rows.proveedores || []).find((p) => String(p[0]) === supplierName)
      return splitList(String(supplier?.[7] ?? "")).filter((name) => supplyInfo(name))
    }
    const formatViewValue = (f: FieldType, raw: string) => {
      if (!raw || raw === "—") return "—"
      if (f.type === "date") {
        const d = new Date(`${raw}T00:00:00`)
        return Number.isNaN(d.getTime())
          ? raw
          : d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
      }
      if (f.type === "number" && /costo|subtotal|total/i.test(f.label)) return fmt(Number(raw))
      if (isSupply && ["4", "5", "6"].includes(f.key))
        return `${Number(raw).toLocaleString("es-CO")} ${String(row?.[2] ?? "")}`.trim()
      return raw
    }
    const statusValue =
      cfg.statusIndex !== undefined && row ? String(row[cfg.statusIndex] ?? "") : ""
    const dataFields = cfg.fields.filter((f) => f.type !== "image")
    const showSupplyTechnicalSheet =
      isSupply &&
      String(isView ? row?.[7] : formData["7"]).toLowerCase() === "sí"
    const formDataFields = isProduction
      ? dataFields.filter((field) => !["0", "1"].includes(field.key))
      : isPnc
        ? dataFields.filter((field) => !["0", "1", "2"].includes(field.key))
      : isSupply
        ? dataFields.filter(
            (field) =>
              // "Stock actual" isn't entered when creating: it starts at 0
              !(modal.mode === "add" && field.key === "4") &&
              (!["8", "9", "10", "11"].includes(field.key) || showSupplyTechnicalSheet),
          )
        : dataFields
    const productMainFields = isProduct
      ? dataFields.filter((field) => ["0", "1", "2", "3", "10"].includes(field.key))
      : dataFields
    const productTechFields = isProduct
      ? dataFields.filter((field) => ["5", "6", "7", "8"].includes(field.key))
      : []
    const rowOffset = cfg.autoId ? 1 : 0
    const availableProductos = isPedido ? getAvailableProductos() : []
    const availableProductionProducts = isProduction
      ? getAvailableProductos()
      : []
    const availablePncDamagedItems = isPnc ? getNonconformingProductOptions() : []
    const availableItemOptions = isProduction
      ? availableProductionProducts
      : availablePncDamagedItems
    const clientOptions = (rows.clientes || [])
      .map((client) => String(client[0] ?? ""))
      .filter(Boolean)

    const handleSupplyCheckboxToggle = () => {
      setFormData((current) => {
        const enabled =
          String(current["7"] ?? "No").toLowerCase() === "sí"
        if (enabled) {
          return {
            ...current,
            "7": "No",
            "8": "",
            "9": "",
            "10": "",
            "11": "",
          }
        }
        // Sheet name is filled from the insumo name on save if left empty
        return {
          ...current,
          "7": "Sí",
          "8": "",
          "9": "v1.0",
          "10": "",
          "11": "",
        }
      })
      setSupplyFormError("")
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={() => setModal({ mode: null, section: "", idx: null })}
      >
        <div
          className={`flex min-w-0 w-full ${isRoles ? "max-w-3xl" : isUser ? "max-w-2xl" : isSupplier ? "max-w-4xl" : isPurchaseModule ? "max-w-2xl" : "max-w-5xl"} flex-col overflow-hidden rounded-2xl`}
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            maxHeight: isPurchaseModule || isProduct ? "94vh" : isRoles ? "82vh" : "88vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex items-center justify-between px-5 ${isUser || isRoles ? "py-3" : "py-4"}`}
            style={{ borderBottom: `1px solid ${t.border}` }}
          >
            <h3 className="font-semibold text-base" style={{ color: t.text }}>
              {purchaseEntity
                ? modal.mode === "add"
                  ? `${purchaseEntity.fem ? "Nueva" : "Nuevo"} ${purchaseEntity.name}`
                  : modal.mode === "edit"
                    ? `Editar ${purchaseEntity.name}`
                    : `Detalle ${purchaseEntity.fem ? "de la" : "del"} ${purchaseEntity.name}`
                : modal.mode === "add"
                  ? "Nuevo registro"
                  : modal.mode === "edit"
                    ? "Editar registro"
                    : "Ver detalle"}
            </h3>
            <button
              onClick={() => setModal({ mode: null, section: "", idx: null })}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
              style={{ background: t.input, color: t.muted }}
            >
              {Ico.x}
            </button>
          </div>
          <div
            className={`min-w-0 overflow-x-hidden overflow-y-auto px-4 ${isUser ? "py-3 sm:px-5" : "py-4 sm:px-5"} ${
              isUser
                ? "grid content-start grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4"
                : isRoles && !isView
                ? "grid content-start gap-x-4 gap-y-2.5 sm:grid-cols-2"
                : isPurchaseModule
                  ? `grid min-h-0 flex-1 content-start gap-x-4 gap-y-3 ${isSupplier ? "grid-cols-1 lg:grid-flow-row-dense lg:grid-cols-2" : "sm:grid-cols-2"}`
                  : isProduct
                    ? "flex min-h-0 flex-1 flex-col gap-3"
                    : "flex flex-col gap-3"
            }`}
            style={{
              maxHeight: isPurchaseModule || isProduct ? undefined : isUser ? "58vh" : "65vh",
              scrollbarWidth: "none",
            }}
          >
            {/* Purchase module detail header: record name + status */}
            {isView && isPurchaseModule && !isPurchase && row && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 sm:col-span-2"
                style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
                    {purchaseEntity.name}
                  </div>
                  <div className="text-base font-bold break-words" style={{ color: t.text }}>
                    {String(row[0] ?? "—")}
                  </div>
                </div>
                {statusValue && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: badgeSt(statusValue)?.bg ?? t.input, color: badgeSt(statusValue)?.color ?? t.muted }}
                  >
                    {statusValue}
                  </span>
                )}
              </div>
            )}
            {/* Image field */}
            {isProduct && cfg.fields.some((f) => f.type === "image") && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-semibold"
                  style={{ color: t.muted }}
                >
                  Foto del producto
                </label>
                {isView ? (
                  imgPreview ? (
                    <img
                      src={imgPreview}
                      alt=""
                      className="w-full h-36 object-cover rounded-xl"
                    />
                  ) : (
                    <div
                      className="w-full h-24 rounded-xl flex items-center justify-center text-4xl"
                      style={{ background: t.input }}
                    >
                      🍔
                    </div>
                  )
                ) : (
                  <div>
                    {imgPreview && (
                      <img
                        src={imgPreview}
                        alt=""
                        className="w-full h-32 object-cover rounded-xl mb-2"
                      />
                    )}
                    <div
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:opacity-80 mb-2"
                      style={{ borderColor: t.inputB }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const f = e.dataTransfer.files[0]
                        if (f) handleFile(f)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div
                        className="flex items-center justify-center gap-2 text-xs"
                        style={{ color: t.muted }}
                      >
                        {Ico.upload} Arrastra o selecciona una imagen
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleFile(f)
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="o pega una URL de imagen..."
                      value={imgPreview.startsWith("data:") ? "" : imgPreview}
                      onChange={(e) => setImgPreview(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                      style={{
                        background: t.input,
                        border: `1px solid ${t.inputB}`,
                        color: t.text,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {/* Proof only matters for transfers (cash / pay at the store = contraentrega) */}
            {isPedido && (isView || formData["3"] === "Transferencia") && (
              // Last in the form (order-last): client and products come first
              <div className="order-last flex min-w-0 flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-semibold" style={{ color: t.muted }}>Comprobante de pago</label>
                {isView ? (
                  paymentProofDraft ? (
                    <img src={paymentProofDraft} alt="Comprobante de pago" className="max-h-64 w-full rounded-xl object-contain" style={{ background: t.input }} />
                  ) : (
                    <div className="rounded-xl px-4 py-6 text-center text-xs" style={{ background: t.input, color: t.muted }}>El cliente todavía no ha subido un comprobante.</div>
                  )
                ) : (
                  <div className="min-w-0 rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: t.inputB }}>
                    {paymentProofDraft && <img src={paymentProofDraft} alt="Vista previa" className="mb-3 max-h-40 w-full rounded-lg object-contain" />}
                    <button type="button" onClick={() => document.getElementById("payment-proof-input")?.click()} className="cursor-pointer text-xs font-semibold" style={{ color: C.mustard }}>Seleccionar imagen o PDF del comprobante</button>
                    <input id="payment-proof-input" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      if (file.type === "application/pdf") {
                        setPaymentProofDraft(URL.createObjectURL(file))
                      } else {
                        const reader = new FileReader()
                        reader.onload = (loadEvent) => {
                          if (loadEvent.target?.result) setPaymentProofDraft(String(loadEvent.target.result))
                        }
                        reader.readAsDataURL(file)
                      }
                    }} />
                    <input type="url" placeholder="O pega una URL del comprobante" value={paymentProofDraft.startsWith("data:") ? "" : paymentProofDraft} onChange={(event) => setPaymentProofDraft(event.target.value)} className="mt-3 w-full min-w-0 rounded-lg px-3 py-2 text-xs" style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }} />
                  </div>
                )}
              </div>
            )}
            {isProduct ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <div
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: t.muted }}
                  >
                    Producto
                  </div>
                  {productMainFields.map((f) => {
                    const val = isView
                      ? String(row ? (row[Number(f.key)] ?? "—") : "—")
                      : formData[f.key] || ""
                    // Categories come only from "Categ. Producto" (active), deduplicated
                    // ignoring case/accents so the same category never appears twice
                    const productFieldOptions =
                      f.key === "1"
                        ? [
                            ...(rows["cat-producto"] || [])
                              .filter((category) => String(category[2] ?? "Activa").toLowerCase() !== "inactiva")
                              .map((category) => String(category[0] ?? "").trim())
                              .filter(Boolean),
                            "Producto de insumo",
                          ]
                            .filter(
                              (name, index, all) =>
                                all.findIndex((other) => normalizeName(other) === normalizeName(name)) === index,
                            )
                            .sort((a, b) => a.localeCompare(b))
                        : f.options
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold"
                          style={{ color: shownFieldError(f.key) ? C.red : t.muted }}
                        >
                          {f.label}
                          {(isRequiredField(f.key) ||
                            getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key)) && " *"}
                        </label>
                        {isView ? (
                          <div
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm"
                            style={{ background: t.input, color: t.text }}
                          >
                            {val}
                          </div>
                        ) : f.type === "select" ? (
                          <select
                            value={val}
                            disabled={isPedido && f.key === "7"}
                            onChange={(e) =>
                              updateAdminField(modal.section, f.key, e.target.value)
                            }
                            onBlur={() =>
                              getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                              setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
                            }
                            aria-invalid={!!formFieldErrors[f.key]}
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                            title={
                              isPedido && f.key === "7"
                                ? "El pago solo cambia al aprobar o rechazar el comprobante en el detalle del pedido."
                                : undefined
                            }
                            style={{
                              background: t.input,
                              border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                              color: val ? t.text : t.muted,
                              opacity: isPedido && f.key === "7" ? 0.7 : 1,
                            }}
                          >
                            <option value="">Selecciona...</option>
                            {productFieldOptions?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            value={val}
                            onChange={(e) =>
                              updateAdminField(modal.section, f.key, e.target.value)
                            }
                            onBlur={() =>
                              getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                              setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
                            }
                            aria-invalid={!!formFieldErrors[f.key]}
                            rows={isPurchaseModule || isProduct ? 2 : 3}
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                            style={{
                              background: t.input,
                              border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                              color: t.text,
                            }}
                          />
                        ) : (
                          <input
                            type={f.type}
                            value={val}
                            onChange={(e) =>
                              updateAdminField(modal.section, f.key, e.target.value)
                            }
                            onBlur={() =>
                              getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key) &&
                              setFormFieldErrors(validateManagedForm(modal.section, formData, modal.mode))
                            }
                            aria-invalid={!!formFieldErrors[f.key]}
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                              background: t.input,
                              border: `1.5px solid ${formFieldErrors[f.key] ? C.red : t.inputB}`,
                              color: t.text,
                            }}
                          />
                        )}
                        <FieldError msg={shownFieldError(f.key) || formFieldErrors[f.key]} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: t.muted }}
                    >
                      Ficha técnica
                    </div>
                    {!isView && (
                      <button
                        type="button"
                        onClick={() => {
                          setTechnicalSheetError("")
                          setTechnicalSheetOpen(true)
                        }}
                        className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                        style={{ background: C.mustard, color: "#fff" }}
                      >
                        {technicalIngredients.length
                          ? "Editar ficha técnica"
                          : "Agregar ficha técnica"}
                      </button>
                    )}
                  </div>
                  {!isView && (
                    <div className="rounded-xl p-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                      {technicalIngredients.length
                        ? (
                          <>
                            <div className="mb-2 text-xs font-bold" style={{ color: t.text }}>
                              Insumos y cantidades
                            </div>
                            {technicalIngredients.map((ingredient, index) => (
                              <div
                                key={`${ingredient.name}-${index}`}
                                className="flex justify-between gap-3 border-t py-2 text-xs"
                                style={{ borderColor: t.border, color: t.muted }}
                              >
                                <span className="min-w-0 truncate">{ingredient.name}</span>
                                <strong className="shrink-0" style={{ color: t.text }}>
                                  {ingredient.quantity} {ingredient.unit}
                                </strong>
                              </div>
                            ))}
                          </>
                        )
                        : <span className="text-xs" style={{ color: t.muted }}>
                            Ficha técnica opcional. Puedes agregar insumos, cantidades y unidades.
                          </span>}
                    </div>
                  )}
                  {isView && getProductRecipe(row ?? undefined).length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                      <div className="mb-2 text-xs font-bold" style={{ color: t.text }}>Insumos y cantidades</div>
                      {getProductRecipe(row ?? undefined).map((ingredient, index) => (
                        <div key={`${ingredient.name}-${index}`} className="flex justify-between gap-3 border-t py-2 text-xs" style={{ borderColor: t.border, color: t.muted }}>
                          <span>{ingredient.name}</span>
                          <strong style={{ color: t.text }}>{ingredient.quantity} {ingredient.unit}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {productTechFields.map((f) => {
                    if (!isView) return null
                    const fieldRowIndex = Number(f.key)
                    const val = isView
                      ? String(row ? (row[fieldRowIndex] ?? "—") : "—")
                      : formData[f.key] || ""
                    const existingInsumos =
                      isProduct && f.key === "7"
                        ? (val || "")
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean)
                        : []
                    const availableInsumos = getAvailableInsumos()
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold"
                          style={{ color: t.muted }}
                        >
                          {f.label}
                        </label>
                        {isProduct && f.key === "6" && !isView ? (
                          <input
                            type="text"
                            value={
                              val || getAutoTechVersion(rows.producto || [])
                            }
                            readOnly
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                              background: "rgba(30,30,30,0.05)",
                              border: `1.5px solid ${t.inputB}`,
                              color: t.muted,
                            }}
                          />
                        ) : isProduct && f.key === "7" && !isView ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              {existingInsumos.length === 0 ? (
                                <div
                                  className="text-xs px-2.5 py-1.5 rounded-full"
                                  style={{
                                    background: t.input,
                                    color: t.muted,
                                  }}
                                >
                                  Sin insumos seleccionados
                                </div>
                              ) : (
                                existingInsumos.map((insumo) => (
                                  <button
                                    key={insumo}
                                    type="button"
                                    onClick={() => {
                                      const next = existingInsumos.filter(
                                        (item) => item !== insumo,
                                      )
                                      setFormData((d) => ({
                                        ...d,
                                        [f.key]: next.join(", "),
                                      }))
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer"
                                    style={{
                                      background: `${C.mustard}15`,
                                      color: C.mustard,
                                      border: `1px solid ${C.mustard}35`,
                                    }}
                                  >
                                    <span>{insumo}</span>
                                    <span>×</span>
                                  </button>
                                ))
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <select
                                value=""
                                onChange={(event) => {
                                  const selectedInsumo = event.target.value
                                  if (!selectedInsumo) return
                                  setFormData((current) => {
                                    const currentItems = String(
                                      current[f.key] ?? "",
                                    )
                                      .split(",")
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                    if (currentItems.includes(selectedInsumo)) {
                                      return current
                                    }
                                    return {
                                      ...current,
                                      [f.key]: [
                                        ...currentItems,
                                        selectedInsumo,
                                      ].join(", "),
                                    }
                                  })
                                }}
                                className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                                style={{
                                  background: t.input,
                                  border: `1.5px solid ${t.inputB}`,
                                  color: t.text,
                                }}
                              >
                                <option value="">
                                  Selecciona un insumo para agregarlo...
                                </option>
                                {availableInsumos
                                  .filter(
                                    (insumo) =>
                                      !existingInsumos.includes(insumo),
                                  )
                                  .map((insumo) => (
                                    <option key={insumo} value={insumo}>
                                      {insumo}
                                    </option>
                                  ))}
                              </select>
                              <span className="text-[10px]" style={{ color: t.subtle }}>
                                El insumo se selecciona automáticamente al elegirlo.
                              </span>
                            </div>
                          </div>
                        ) : isView ? (
                          <div
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm"
                            style={{ background: t.input, color: t.text }}
                          >
                            {val}
                          </div>
                        ) : f.type === "select" ? (
                          <select
                            value={val}
                            onChange={(e) =>
                              setFormData((d) => ({
                                ...d,
                                [f.key]: e.target.value,
                              }))
                            }
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                            style={{
                              background: t.input,
                              border: `1.5px solid ${t.inputB}`,
                              color: val ? t.text : t.muted,
                            }}
                          >
                            <option value="">Selecciona...</option>
                            {f.options?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            value={val}
                            onChange={(e) =>
                              setFormData((d) => ({
                                ...d,
                                [f.key]: e.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                            style={{
                              background: t.input,
                              border: `1.5px solid ${t.inputB}`,
                              color: t.text,
                            }}
                          />
                        ) : (
                          <input
                            type={f.type}
                            value={val}
                            onChange={(e) =>
                              setFormData((d) => ({
                                ...d,
                                [f.key]: e.target.value,
                              }))
                            }
                            className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                              background: t.input,
                              border: `1.5px solid ${t.inputB}`,
                              color: t.text,
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* In the production detail the products are listed in its summary below */}
                {(isPnc || (isProduction && !isView)) && (
                  <section className="rounded-2xl p-4 sm:col-span-2" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                      <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>{isPnc ? "Productos o insumos que se dañaron" : "Productos de la orden"}</h4>
                    </div>
                    {productionItems.length ? (
                      <div className="mb-3 flex flex-col gap-2">
                        {productionItems.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                            <span className="min-w-0 font-semibold break-words" style={{ color: t.text }}>{item.name}</span>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <span style={{ color: t.muted }}>× {item.quantity}</span>
                              {!isView && <button type="button" aria-label={`Quitar ${item.name}`} onClick={() => setProductionItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg" style={{ color: C.red, background: `${C.red}10` }}>{Ico.x}</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3 rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.input, color: t.muted }}>{isPnc ? "Agrega al menos un producto o insumo perdido." : "Agrega al menos un producto o producto de insumo."}</div>
                    )}
                    {!isView && (
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_auto]">
                        <select value={productionProductSelect} onChange={(event) => setProductionProductSelect(event.target.value)} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: t.input, border: `1px solid ${t.inputB}`, color: productionProductSelect ? t.text : t.muted }}>
                          <option value="">Selecciona un producto o insumo...</option>
                          {(isPnc
                            ? availableItemOptions
                            : availableItemOptions.filter((product) => !productionItems.some((item) => item.name === product)))
                            .map((product, index) => {
                            const isSupply = isPnc
                              ? rows.insumos?.some((item) => item[0] === product)
                              : rows.producto?.some((item) => item[0] === product && item[1] === "Producto de insumo")
                            return <option key={`${product}-${index}`} value={product}>{product}{isSupply ? " · Insumo" : ""}</option>
                          })}
                        </select>
                        <input type="number" min="1" value={productionItemQuantity} onChange={(event) => setProductionItemQuantity(event.target.value)} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }} />
                        <button type="button" onClick={() => {
                          if (!productionProductSelect) return
                          const quantity = Math.max(1, Number(productionItemQuantity) || 1)
                          setProductionItems((current) => [...current, { name: productionProductSelect, quantity }])
                          setProductionProductSelect("")
                          setProductionItemQuantity("1")
                          setProductionFormError("")
                        }} className="rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer" style={{ background: C.mustard, color: "#fff" }}>Agregar</button>
                      </div>
                    )}
                    <p className="mt-2 text-[10px]" style={{ color: t.muted }}>{isPnc ? "Selecciona todos los productos o insumos que se perdieron y agrega la cantidad de cada uno." : "El selector incluye productos normales y productos de insumo."}</p>
                    {productionFormError && <p className="mt-2 text-xs font-medium" style={{ color: C.red }}>{productionFormError}</p>}
                  </section>
                )}
                {formDataFields.map((f) => {
                if (isView && isPurchase) return null // the purchase ticket shows everything
                // Shown in the detail header (with autoId, row[0] is the code, so field "0" stays)
                if (isView && isPurchaseModule && f.key === "0" && !cfg.autoId) return null
                // Order total is computed from its products ("Total del pedido"), not typed
                if (isPedido && !isView && f.key === "5") return null
                // Modality and payment status come from the payment method (read-only)
                if (isPedido && !isView && (f.key === "4" || f.key === "7")) {
                  const payment = derivePedidoPayment(String(formData["3"] ?? ""), !!paymentProofDraft)
                  const value = f.key === "4" ? payment.modalidad : payment.estadoPago
                  return (
                    <div key={f.key} className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: t.muted }}>
                        {f.label}
                      </span>
                      <div
                        className="rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                        style={{
                          background: t.cardAlt,
                          border: `1px dashed ${t.inputB}`,
                          color: value ? (value === "Pagado" ? "#2E7D60" : t.text) : t.muted,
                        }}
                        title="Se asigna automáticamente según el método de pago"
                      >
                        {value || "Según el método de pago"}
                      </div>
                      {f.key === "7" && (
                        <span className="text-[11px]" style={{ color: t.muted }}>
                          Automático: transferencia con comprobante = pagado; efectivo o pago en el local = contraentrega y pendiente.
                        </span>
                      )}
                    </div>
                  )
                }
                // Production detail already shows "Creada" date/time in its summary
                if (isView && isProduction && (f.key === "3" || f.key === "4")) return null
                // Insumo technical sheet (fields 8-11) rendered as one card at field "8"
                if (isSupply && ["9", "10", "11"].includes(f.key)) return null
                if (isSupply && f.key === "8") {
                  if (!showSupplyTechnicalSheet) return null
                  const src = (key: string) => String((isView ? row?.[Number(key)] : formData[key]) ?? "")
                  const supplyName = src("0").trim() || "este insumo"
                  const mainSupplies = splitList(src("10"))
                  const setSheet = (key: string, value: string) => {
                    setSupplyFormError("")
                    updateAdminField(modal.section, key, value)
                  }
                  const sheetControl = { background: t.card, border: `1.5px solid ${t.inputB}`, color: t.text }
                  return (
                    <section
                      key="ficha-tecnica"
                      className="rounded-xl p-4 sm:col-span-2"
                      style={{ background: `${C.mustard}0D`, border: `1.5px solid ${C.mustard}55` }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.mustard }}>
                            Ficha técnica · Producto de insumo
                          </div>
                          <div className="text-sm font-semibold break-words" style={{ color: t.text }}>
                            {src("8").trim() || `Ficha técnica - ${supplyName}`}
                          </div>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{ background: `${C.mustard}20`, color: C.mustard }}
                        >
                          {src("9") || "v1.0"}
                        </span>
                      </div>
                      {!isView && (
                        <p className="mt-1 text-xs" style={{ color: t.muted }}>
                          Esta ficha se crea junto con el insumo y también aparecerá en el módulo Productos.
                        </p>
                      )}
                      <div className="mt-4 grid gap-3">
                        {!isView && (
                          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                            Nombre de la ficha
                            <input
                              value={formData["8"] ?? ""}
                              onChange={(e) => setSheet("8", e.target.value)}
                              placeholder={`Ficha técnica - ${supplyName}`}
                              className="rounded-xl px-3 py-2.5 text-sm outline-none"
                              style={sheetControl}
                            />
                          </label>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: t.muted }}>
                            Insumos principales{!isView && " *"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {mainSupplies.length === 0 ? (
                              <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: t.input, color: t.muted }}>
                                Sin insumos seleccionados
                              </span>
                            ) : (
                              mainSupplies.map((name) =>
                                isView ? (
                                  <span
                                    key={name}
                                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{ background: `${C.mustard}15`, color: C.mustard }}
                                  >
                                    {name}
                                  </span>
                                ) : (
                                  <button
                                    key={name}
                                    type="button"
                                    aria-label={`Quitar ${name} de la ficha`}
                                    onClick={() => setSheet("10", mainSupplies.filter((n) => n !== name).join(", "))}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{ background: `${C.mustard}15`, color: C.mustard, border: `1px solid ${C.mustard}35` }}
                                  >
                                    {name} <span aria-hidden="true">×</span>
                                  </button>
                                ),
                              )
                            )}
                          </div>
                          {!isView && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) setSheet("10", [...mainSupplies, e.target.value].join(", "))
                              }}
                              aria-invalid={!!formFieldErrors["10"]}
                              className="cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                              style={{
                                ...sheetControl,
                                border: `1.5px solid ${formFieldErrors["10"] ? C.red : t.inputB}`,
                                color: t.muted,
                              }}
                            >
                              <option value="">+ Agregar insumo a la ficha...</option>
                              {getAvailableInsumos()
                                .filter((name) => !mainSupplies.includes(name))
                                .map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                            </select>
                          )}
                          {formFieldErrors["10"] && (
                            <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                              {formFieldErrors["10"]}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: t.muted }}>
                            Cómo se prepara{!isView && " *"}
                          </span>
                          {isView ? (
                            <div className="text-sm whitespace-pre-line break-words" style={{ color: t.text }}>
                              {src("11") || "—"}
                            </div>
                          ) : (
                            <textarea
                              value={formData["11"] ?? ""}
                              onChange={(e) => setSheet("11", e.target.value)}
                              rows={3}
                              placeholder={"1. Recibir y revisar el insumo.\n2. Porcionar.\n3. Almacenar y servir."}
                              className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                              style={sheetControl}
                            />
                          )}
                        </div>
                      </div>
                      {!isView && (shownFieldError("10") || shownFieldError("11")) && (
                        <p className="mt-3 text-xs font-medium" style={{ color: C.red }} role="alert">
                          {shownFieldError("10") || shownFieldError("11")}
                        </p>
                      )}
                    </section>
                  )
                }
                // Purchase form: subtotal/total are computed from the items below
                if (isPurchase && (f.key === "3" || f.key === "4")) return null
                if (isPurchase && f.key === "6") {
                  const supplier = String(formData["0"] ?? "")
                  const allowed = supplierSupplies(supplier)
                  const items = parsePurchaseItems(formData["6"])
                  const total = items.reduce((sum, item) => sum + item.total, 0)
                  const setItems = (next: { name: string; quantity: string; unitPrice?: string }[]) =>
                    setFormData((current) => ({
                      ...current,
                      "6": next.map((i) => `${i.name} | ${i.quantity} | ${i.unitPrice ?? 0}`).join("\n"),
                    }))
                  const pickSupply = (name: string) => {
                    setPurchaseItemSelect(name)
                    setPurchaseItemPrice(name ? String(supplyInfo(name)?.[3] ?? "") : "")
                    setPurchaseFormError("")
                  }
                  const addItem = () => {
                    const qty = Number(purchaseItemQty)
                    const price = Number(purchaseItemPrice)
                    if (!purchaseItemSelect) return setPurchaseFormError("Elige el insumo que vas a agregar.")
                    if (!(qty > 0)) return setPurchaseFormError("La cantidad debe ser mayor que 0.")
                    if (!(price > 0)) return setPurchaseFormError("Escribe el precio unitario.")
                    const existing = items.find(
                      (i) => i.name === purchaseItemSelect && Number(i.unitPrice) === price,
                    )
                    setItems(
                      existing
                        ? items.map((i) => (i === existing ? { ...i, quantity: String(Number(i.quantity) + qty) } : i))
                        : [...items, { name: purchaseItemSelect, quantity: String(qty), unitPrice: String(price) }],
                    )
                    setPurchaseItemSelect("")
                    setPurchaseItemQty("1")
                    setPurchaseItemPrice("")
                    setPurchaseFormError("")
                  }
                  const controlSt = { background: t.input, border: `1.5px solid ${t.inputB}`, color: t.text }
                  // "Enviar a pérdida": only for items already saved in this purchase (edit mode)
                  const savedItems = modal.mode === "edit" ? parsePurchaseItems(row?.[6]) : []
                  const lossOrigin = row
                    ? `Compra a ${String(row[0])} del ${formatViewValue(cfg.fields[1], String(row[1] ?? ""))}`
                    : ""
                  const lostSoFar = (name: string) =>
                    (rows.perdidas || [])
                      .filter((l) => String(l[5] ?? "") === lossOrigin && String(l[0]) === name)
                      .reduce((sum, l) => sum + (parseFloat(String(l[1])) || 0), 0)
                  const openLoss = (name: string) => {
                    const bought = savedItems
                      .filter((i) => i.name === name)
                      .reduce((sum, i) => sum + Number(i.quantity || 0), 0)
                    const max = bought - lostSoFar(name)
                    setLossError("")
                    if (!(max > 0)) {
                      setPurchaseNotice(`Ya registraste como pérdida todo el insumo «${name}» de esta compra.`)
                      return
                    }
                    setPurchaseNotice("")
                    const now = new Date()
                    setLossDraft({
                      insumo: name,
                      unit: String(supplyInfo(name)?.[2] ?? "und"),
                      max,
                      qty: "",
                      motivo: "",
                      responsable: user?.name ?? "",
                      fecha: [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-"),
                      origin: lossOrigin,
                    })
                  }
                  return (
                    <section
                      key="purchase-items"
                      className="rounded-xl p-4 sm:col-span-2"
                      style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}
                    >
                      <div className="text-sm font-semibold" style={{ color: t.text }}>
                        Insumos comprados
                      </div>
                      {!supplier ? (
                        <p className="mt-1 text-xs" style={{ color: t.muted }}>
                          Primero selecciona el proveedor para ver los insumos que te vende.
                        </p>
                      ) : !allowed.length ? (
                        <p className="mt-1 text-xs" style={{ color: C.red }}>
                          «{supplier}» no tiene insumos asignados. Asígnalos en Proveedores → Editar → «Insumos que suministra».
                        </p>
                      ) : (
                        <>
                          <p className="mt-1 text-xs" style={{ color: t.muted }}>
                            Insumos que vende «{supplier}». Agrega todos los que necesites.
                          </p>
                          <div className="mt-3 grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_96px_120px_auto]">
                            <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                              Insumo
                              <select
                                value={purchaseItemSelect}
                                onChange={(e) => pickSupply(e.target.value)}
                                className="w-full min-w-0 cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                                style={{ ...controlSt, color: purchaseItemSelect ? t.text : t.muted }}
                              >
                                <option value="">Selecciona un insumo...</option>
                                {allowed.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                    {supplyInfo(name)?.[2] ? ` (${String(supplyInfo(name)?.[2])})` : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                              Cantidad
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={purchaseItemQty}
                                onChange={(e) => setPurchaseItemQty(e.target.value)}
                                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                                style={controlSt}
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                              Precio unitario
                              <input
                                type="number"
                                min="0"
                                value={purchaseItemPrice}
                                onChange={(e) => setPurchaseItemPrice(e.target.value)}
                                placeholder="$"
                                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                                style={controlSt}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={addItem}
                              className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold hover:opacity-90"
                              style={{ background: C.mustard, color: "#fff" }}
                            >
                              Agregar
                            </button>
                          </div>
                        </>
                      )}
                      <div className="mt-3 flex flex-col">
                        {items.length === 0 ? (
                          <div className="rounded-lg px-3 py-3 text-center text-xs" style={{ background: t.input, color: t.muted }}>
                            Aún no has agregado insumos.
                          </div>
                        ) : (
                          items.map((item, index) => (
                            <div
                              key={`${item.name}-${index}`}
                              className="flex items-center gap-3 border-b py-2 text-sm last:border-b-0"
                              style={{ borderColor: t.border }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold" style={{ color: t.text }}>{item.name}</div>
                                <div className="text-[11px]" style={{ color: t.muted }}>
                                  {Number(item.quantity).toLocaleString("es-CO")} {String(supplyInfo(item.name)?.[2] ?? "und")} × {fmt(Number(item.unitPrice || 0))}
                                </div>
                                {savedItems.length > 0 && lostSoFar(item.name) > 0 && (
                                  <div className="text-[11px] font-semibold" style={{ color: C.red }}>
                                    Perdido: {lostSoFar(item.name).toLocaleString("es-CO")} {String(supplyInfo(item.name)?.[2] ?? "und")}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold" style={{ color: C.mustard }}>{fmt(item.total)}</span>
                              {savedItems.some((i) => i.name === item.name) && (
                                <button
                                  type="button"
                                  title="Enviar este insumo a Pérdida de insumos"
                                  aria-label={`Enviar ${item.name} a pérdida de insumos`}
                                  onClick={() => openLoss(item.name)}
                                  className="flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold hover:opacity-80"
                                  style={{ color: C.amber, background: `${C.amber}18` }}
                                >
                                  {Ico.alert} Pérdida
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label={`Quitar ${item.name}`}
                                onClick={() => setItems(items.filter((_, i) => i !== index))}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                                style={{ color: C.red, background: `${C.red}10` }}
                              >
                                {Ico.x}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div
                        className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs"
                        style={{ borderColor: t.border }}
                      >
                        <span style={{ color: t.muted }}>
                          Subtotal: <strong style={{ color: t.text }}>{fmt(total)}</strong>
                        </span>
                        <span className="text-sm" style={{ color: t.text }}>
                          Total: <strong style={{ color: C.mustard }}>{fmt(total)}</strong>
                        </span>
                      </div>
                      {purchaseFormError && (
                        <p className="mt-2 text-xs font-medium" style={{ color: C.red }} role="alert">
                          {purchaseFormError}
                        </p>
                      )}
                      {purchaseNotice && (
                        <p
                          className="mt-2 rounded-lg px-3 py-2 text-xs font-medium"
                          style={{ background: "rgba(58,109,94,0.12)", color: "#2E7D60" }}
                          role="status"
                        >
                          {purchaseNotice}
                        </p>
                      )}
                    </section>
                  )
                }
                const isLocalClient =
                  isClient && String(formData["6"] ?? "").toLowerCase() === "sí"
                const requiredFormField =
                  !isView &&
                  getRequiredFormKeys(modal.section, formData, modal.mode).includes(f.key)
                const fieldValidationError = formFieldErrors[f.key]
                // Supplier form: pick which insumos this supplier sells
                if (modal.section === "proveedores" && !isView && f.key === "7") {
                  const selected = splitList(String(formData["7"] ?? ""))
                  const toggleSupply = (name: string) =>
                    updateAdminField(
                      "proveedores",
                      "7",
                      (selected.includes(name)
                        ? selected.filter((item) => item !== name)
                        : [...selected, name]
                      ).join(", "),
                    )
                  return (
                    <div key="7" className="flex flex-col gap-1.5 lg:col-start-1 lg:col-span-1">
                      <span className="text-xs font-semibold" style={{ color: t.muted }}>
                        {f.label}{requiredFormField && " *"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {namesOf("insumos").map((name) => {
                          const on = selected.includes(name)
                          return (
                            <button
                              key={name}
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => toggleSupply(name)}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                              style={{
                                background: on ? `${C.mustard}18` : t.input,
                                border: `1.5px solid ${on ? C.mustard : t.inputB}`,
                                color: on ? C.mustard : t.muted,
                              }}
                            >
                              {on && Ico.check}
                              {name}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[11px]" style={{ color: t.muted }}>
                        Solo estos insumos se podrán elegir al registrar una compra a este proveedor.
                      </p>
                      {fieldValidationError && (
                        <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>
                          {fieldValidationError}
                        </span>
                      )}
                    </div>
                  )
                }
                const fieldRowIndex = Number(f.key) + rowOffset
                const val = isView
                  ? String(row ? (row[fieldRowIndex] ?? "—") : "—")
                  : formData[f.key] || ""
                const fieldOptions =
                  isProduction && f.key === "0"
                    ? availableProductionProducts
                    : (isSales && f.key === "1") ||
                          (isPedido && f.key === "0") ||
                          (isReturns && f.key === "2")
                        ? clientOptions
                        : isPurchase && f.key === "0" && namesOf("proveedores").length
                          ? namesOf("proveedores")
                          : modal.section === "perdidas" && f.key === "0" && namesOf("insumos").length
                            ? namesOf("insumos")
                            : isSupply && f.key === "1" && namesOf("cat-insumos").length
                              ? namesOf("cat-insumos")
                              : f.options
                const pedidoCategories = [
                  "Todas",
                  ...new Set(
                    (rows["cat-producto"] || [])
                      .filter((category) => String(category[2] ?? "Activa").toLowerCase() !== "inactiva")
                      .map((category) => String(category[0] ?? "").trim())
                      .filter(Boolean),
                  ),
                ]
                const filteredOrderProducts = availableProductos.filter((productName) => {
                  const product = rows.producto?.find((item) => item[0] === productName)
                  return pedidoProductCategory === "Todas" || String(product?.[1] ?? "") === pedidoProductCategory
                })
                const selectedOrderProduct = rows.producto?.find((item) => item[0] === pedidoProductoSelect)
                const isSelectedAddition = String(selectedOrderProduct?.[1] ?? "").toLowerCase() === "adiciones"
                const updateFieldValue = (value: string) => {
                  if (isSales && f.key === "1" && value === "__new_client__") {
                    setQuickClientForm({})
                    setQuickClientErrors({})
                    setQuickClientError("")
                    setQuickClientOpen(true)
                    return
                  }
                  if (isPurchase && f.key === "0") {
                    // Changing supplier keeps only the items the new supplier sells
                    const allowed = supplierSupplies(value)
                    const nextForm = {
                      ...formData,
                      "0": value,
                      "6": String(formData["6"] ?? "")
                        .split("\n")
                        .filter((line) => allowed.includes(line.split("|")[0].trim()))
                        .join("\n"),
                    }
                    setFormData(nextForm)
                    if (formValidationAttempted) {
                      setFormFieldErrors(
                        validateManagedForm(modal.section, nextForm, modal.mode),
                      )
                    }
                    setPurchaseItemSelect("")
                    setPurchaseItemPrice("")
                    setPurchaseFormError("")
                    return
                  }
                  if (["usuarios", "clientes", "proveedores"].includes(modal.section)) {
                    const normalized =
                      (modal.section === "usuarios" && f.key === "2") ||
                      (modal.section === "clientes" && f.key === "2") ||
                      (isSupplier && f.key === "9")
                        ? normalizeDocumentInput(
                            value,
                            String(formData[isSupplier ? "8" : "1"] ?? ""),
                          )
                        : ((modal.section === "clientes" && f.key === "3") ||
                            (isSupplier && ["3", "12"].includes(f.key)))
                          ? normalizePhoneInput(value)
                          : isSupplier && f.key === "1"
                            ? value.replace(/[^0-9.-]/g, "").slice(0, 20)
                            : value
                    updateAdminField(modal.section, f.key, normalized)
                    return
                  }
                  updateAdminField(modal.section, f.key, value)
                }
                return (
                  <Fragment key={f.key}>
                  {isSupplier && (f.key === "1" || f.key === "8") && (
                    <div
                      className={`pt-1 sm:col-span-2 ${
                        f.key === "1" ? "lg:col-span-1 lg:col-start-1" : "lg:col-span-1 lg:col-start-2"
                      }`}
                    >
                      <div className="mb-1 h-px" style={{ background: t.border }} />
                      <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>
                        {f.key === "1" ? "Datos del proveedor" : "Persona de contacto"}
                      </h4>
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 flex-col gap-1 ${
                      isSupplier
                      ? `${Number(f.key) < 8 ? "lg:col-start-1" : "lg:col-start-2"} ${isWideField(f) ? "lg:col-span-1" : ""}`
                        : isPurchaseModule && isWideField(f)
                          ? "sm:col-span-2"
                          : ""
                    }`}
                  >
                    <label
                      className="text-xs font-semibold"
                      style={{ color: shownFieldError(f.key) ? C.red : t.muted }}
                    >
                      {f.label}
                      {(isRequiredField(f.key) || requiredFormField) && " *"}
                    </label>
                    {isPedido && f.key === "1" && !isView ? (
                      <div className="flex flex-col gap-3">
                        <div className="rounded-xl p-3" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                          {/* Wide enough so category and product names show complete */}
                          <div className="grid gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(0,1.7fr)_64px_auto]">
                            <select
                              value={pedidoProductCategory}
                              onChange={(event) => {
                                setPedidoProductCategory(event.target.value)
                                setPedidoProductoSelect("")
                              }}
                              className="min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                              style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                              aria-label="Filtrar productos por categoría"
                            >
                              {pedidoCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <select
                              value={pedidoProductoSelect}
                              onChange={(event) => setPedidoProductoSelect(event.target.value)}
                              className="min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none cursor-pointer"
                              style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                            >
                              <option value="">Selecciona producto o adición...</option>
                              {filteredOrderProducts.map((product) => {
                                const productRow = rows.producto?.find((item) => item[0] === product)
                                return <option key={product} value={product}>{product}{productRow?.[1] === "Adiciones" ? " · Adición" : ""}</option>
                              })}
                            </select>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={pedidoProductQuantity}
                              onChange={(event) => setPedidoProductQuantity(event.target.value)}
                              className="min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                              style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                              aria-label="Cantidad"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const productRow = rows.producto?.find((item) => item[0] === pedidoProductoSelect)
                                const quantity = Number(pedidoProductQuantity)
                                if (!productRow || !Number.isInteger(quantity) || quantity <= 0) return
                                const parentLine = pedidoOrderLines.find((line) => line.id === pedidoParentSelect)
                                const id = `order-line-${Date.now()}-${pedidoOrderLines.length}`
                                const line: AdminOrderLine = {
                                  id,
                                  product: pedidoProductoSelect,
                                  category: String(productRow[1] ?? ""),
                                  quantity,
                                  unitPrice: Number(productRow[2]) || 0,
                                  ...(isSelectedAddition && parentLine ? { parentId: parentLine.id } : {}),
                                }
                                setPedidoOrderLines((current) => [...current, line])
                                setPedidoProductoSelect("")
                                setPedidoProductQuantity("1")
                                setPedidoParentSelect("")
                              }}
                              className="rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                              style={{ background: C.mustard, color: "#fff" }}
                            >
                              Agregar
                            </button>
                          </div>
                          {isSelectedAddition && (
                            <label className="mt-2 flex flex-col gap-1 text-[11px] font-semibold" style={{ color: t.muted }}>
                              Adición de (opcional)
                              <select
                                value={pedidoParentSelect}
                                onChange={(event) => setPedidoParentSelect(event.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                                style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                              >
                                <option value="">Sin producto asociado</option>
                                {pedidoOrderLines.filter((line) => line.category.toLowerCase() !== "adiciones").map((line) => (
                                  <option key={line.id} value={line.id}>{line.product} × {line.quantity}</option>
                                ))}
                              </select>
                            </label>
                          )}
                        </div>
                        {!pedidoOrderLines.length ? (
                          <div className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.input, color: t.muted }}>
                            Agrega al menos un producto al pedido.
                          </div>
                        ) : (
                          <div className="flex flex-col divide-y rounded-xl px-3" style={{ background: t.input, borderColor: t.border }}>
                            {pedidoOrderLines.map((line) => (
                              <div key={line.id} className="flex items-center gap-3 py-2.5 text-xs" style={{ borderColor: t.border }}>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold" style={{ color: t.text }}>
                                    {line.product} × {line.quantity}
                                    {line.category.toLowerCase() === "adiciones" && <span className="ml-1 rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: `${C.amber}18`, color: C.amber }}>Adición</span>}
                                  </div>
                                  {line.parentId && <div className="mt-0.5" style={{ color: t.muted }}>Adición de: {pedidoOrderLines.find((parent) => parent.id === line.parentId)?.product ?? "Producto"}</div>}
                                </div>
                                <span style={{ color: t.muted }}>{fmt(line.unitPrice)} c/u</span>
                                <strong style={{ color: C.mustard }}>{fmt(line.unitPrice * line.quantity)}</strong>
                                <button
                                  type="button"
                                  aria-label={`Quitar ${line.product}`}
                                  onClick={() => setPedidoOrderLines((current) => current.filter((item) => item.id !== line.id).map((item) => item.parentId === line.id ? { ...item, parentId: undefined } : item))}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg cursor-pointer"
                                  style={{ color: C.red, background: `${C.red}10` }}
                                >
                                  {Ico.x}
                                </button>
                              </div>
                            ))}
                            <div className="flex justify-between py-2 text-xs font-bold" style={{ color: t.text }}>
                              <span>Total del pedido</span>
                              <span style={{ color: C.mustard }}>{fmt(pedidoOrderLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isView && isPurchaseModule ? (
                      <div
                        className="w-full min-w-0 border-b pb-2 text-sm font-medium break-words whitespace-pre-line"
                        style={{ borderColor: t.border, color: t.text }}
                      >
                        {formatViewValue(f, val)}
                      </div>
                    ) : isView ? (
                      <div
                        className="w-full min-w-0 px-3.5 py-2.5 rounded-xl text-sm"
                        style={{ background: t.input, color: t.text }}
                      >
                        {val}
                      </div>
                    ) : f.type === "checkbox" ? (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={String(val).toLowerCase() === "sí"}
                        onClick={() => {
                          if (isClient) {
                            const enabled =
                              String(formData[f.key] ?? "No").toLowerCase() === "sí"
                            updateAdminField(
                              modal.section,
                              f.key,
                              enabled ? "No" : "Sí",
                            )
                          } else {
                            handleSupplyCheckboxToggle()
                          }
                        }}
                        className="flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-xl px-3.5 py-3 text-left"
                        style={{ background: t.input, border: `1px solid ${t.inputB}` }}
                      >
                        <span
                          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: String(val).toLowerCase() === "sí" ? C.mustard : "transparent",
                            border: `1.5px solid ${String(val).toLowerCase() === "sí" ? C.mustard : t.inputB}`,
                            color: "#fff",
                          }}
                        >
                          {String(val).toLowerCase() === "sí" ? Ico.check : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold" style={{ color: t.text }}>
                            {isClient ? "Cliente de local" : "Sí, es producto de insumo"}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug" style={{ color: t.muted }}>
                            {isClient
                              ? "Permite registrar el cliente sin correo ni dirección."
                              : "Al activarlo se abrirá la ficha técnica y el insumo aparecerá en el módulo Productos."}
                          </span>
                        </span>
                      </button>
                    ) : f.type === "select" ? (
                      <select
                        value={val}
                        onChange={(e) => updateFieldValue(e.target.value)}
                        onBlur={() => {
                          if (requiredFormField) {
                            setFormFieldErrors(
                              validateManagedForm(modal.section, formData, modal.mode),
                            )
                          }
                        }}
                        aria-invalid={!!fieldValidationError}
                        className={`w-full min-w-0 rounded-xl text-sm outline-none cursor-pointer ${isUser || isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                        style={{
                          background: t.input,
                          border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                          color: val ? t.text : t.muted,
                        }}
                      >
                        <option value="">Selecciona...</option>
                        {fieldOptions?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                        {isSales && f.key === "1" && (
                          <option value="__new_client__">+ Registrar nuevo cliente</option>
                        )}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea
                        value={val}
                        onChange={(e) =>
                          updateAdminField(modal.section, f.key, e.target.value)
                        }
                        onBlur={() =>
                          requiredFormField &&
                          setFormFieldErrors(
                            validateManagedForm(modal.section, formData, modal.mode),
                          )
                        }
                        aria-invalid={!!fieldValidationError}
                        rows={isPurchaseModule ? 2 : isRoles ? 2 : 3}
                        className={`w-full min-w-0 rounded-xl text-sm outline-none resize-none ${isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                        style={{
                          background: t.input,
                          border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                          color: t.text,
                        }}
                      />
                    ) : (
                      <input
                        type={f.type}
                        value={val}
                        inputMode={
                          (modal.section === "usuarios" && f.key === "2") ||
                          (isClient && ["2", "3"].includes(f.key)) ||
                          (isSupplier &&
                            ["1", "12"].includes(f.key)) ||
                          (isSupplier &&
                            f.key === "9" &&
                            formData["8"] !== "Pasaporte")
                            ? "numeric"
                            : undefined
                        }
                        onChange={(e) => updateFieldValue(e.target.value)}
                        onBlur={() => {
                          if (requiredFormField) {
                            setFormFieldErrors(
                              validateManagedForm(modal.section, formData, modal.mode),
                            )
                          }
                        }}
                        aria-invalid={!!fieldValidationError}
                        className={`w-full min-w-0 rounded-xl text-sm outline-none ${isUser || isRoles ? "px-3 py-2" : "px-3.5 py-2.5"}`}
                        style={{
                          background: t.input,
                          border: `1.5px solid ${fieldValidationError ? C.red : t.inputB}`,
                          color: t.text,
                        }}
                      />
                    )}
                    <FieldError msg={shownFieldError(f.key) || fieldValidationError} />
                  </div>
                  </Fragment>
                )
                })}
              </>
            )}
            {isClient && !isView && clientFormError && (
              <div className="rounded-xl px-3 py-2.5 text-xs font-medium sm:col-span-2" style={{ background: `${C.red}10`, color: C.red }}>
                {clientFormError}
              </div>
            )}
            {/* Section-specific view detail extras */}
            {/* Purchase module: real related data */}
            {isView && modal.section === "cat-insumos" && row && (() => {
              const supplies = (rows.insumos || []).filter((s) => String(s[1]) === String(row[0]))
              return (
                <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                    Insumos en esta categoría ({supplies.length})
                  </div>
                  <div style={{ color: t.text }}>
                    {supplies.length ? supplies.map((s) => String(s[0])).join(", ") : "Ningún insumo usa esta categoría todavía."}
                  </div>
                </div>
              )
            })()}
            {isView && modal.section === "insumos" && row && (() => {
              // Every purchase line of this insumo: what was bought, how much and for how much
              const name = normalizeName(row[0])
              const unit = String(row[2] ?? "und")
              const lines = (rows.compras || []).flatMap((purchase) =>
                parsePurchaseItems(purchase[6])
                  .filter((item) => normalizeName(item.name) === name)
                  .map((item) => ({
                    supplier: String(purchase[0] ?? ""),
                    date: String(purchase[1] ?? ""),
                    annulled: String(purchase[5]) === "Anulado",
                    quantity: Number(item.quantity) || 0,
                    unitPrice: Number(item.unitPrice) || 0,
                    total: item.total,
                  })),
              )
              const active = lines.filter((l) => !l.annulled)
              const boughtQty = active.reduce((s, l) => s + l.quantity, 0)
              const boughtValue = active.reduce((s, l) => s + l.total, 0)
              const dateField = MOD_CFG.compras.fields.find((field) => field.key === "1")!
              return (
                <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold" style={{ color: t.muted }}>
                      Compras de este insumo
                    </span>
                    {active.length > 0 && (
                      <span className="text-xs" style={{ color: t.muted }}>
                        Total comprado:{" "}
                        <strong style={{ color: t.text }}>
                          {boughtQty.toLocaleString("es-CO")} {unit}
                        </strong>{" "}
                        · <strong style={{ color: C.mustard }}>{fmt(boughtValue)}</strong>
                      </span>
                    )}
                  </div>
                  {lines.length === 0 ? (
                    <div style={{ color: t.text }}>Aún no hay compras registradas de este insumo.</div>
                  ) : (
                    lines.map((l, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t py-2 text-xs"
                        style={{ borderColor: t.border, opacity: l.annulled ? 0.55 : 1 }}
                      >
                        <span className="min-w-0" style={{ color: t.text }}>
                          <strong>{formatViewValue(dateField, l.date)}</strong> · {l.supplier}
                          {l.annulled && <span style={{ color: C.red }}> · Anulada</span>}
                        </span>
                        <span style={{ color: t.muted }}>
                          {l.quantity.toLocaleString("es-CO")} {unit} × {fmt(l.unitPrice)} ={" "}
                          <strong style={{ color: C.mustard }}>{fmt(l.total)}</strong>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )
            })()}
            {isView && modal.section === "proveedores" && row && (() => {
              const purchases = getSupplierPurchases(String(row[0]))
              const total = purchases.reduce((s, p) => s + Number(p[4] || 0), 0)
              return (
                <div className="grid grid-cols-2 gap-3 rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: t.muted }}>Compras registradas</div>
                    <div className="text-lg font-bold" style={{ color: t.text }}>{purchases.length}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: t.muted }}>Total comprado</div>
                    <div className="text-lg font-bold" style={{ color: C.mustard }}>{fmt(total)}</div>
                  </div>
                  <div className="col-span-2 text-xs" style={{ color: t.muted }}>
                    {purchases.length
                      ? "Como tiene compras registradas, este proveedor no se puede eliminar."
                      : "No tiene compras registradas: se puede eliminar si ya no lo necesitas."}
                  </div>
                </div>
              )
            })()}
            {isView && isPurchase && (
              <div
                className="min-w-0 overflow-hidden rounded-xl sm:col-span-2"
                style={{ border: `1px dashed ${t.inputB}`, background: t.card }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}
                >
                  <div>
                    <div className="text-sm font-bold" style={{ color: t.text }}>Ticket de compra</div>
                    <div className="mt-0.5 text-[10px]" style={{ color: t.muted }}>Detalle de insumos y valores</div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: String(row?.[5]) === "Anulado" ? `${C.red}18` : "rgba(58,109,94,0.14)", color: String(row?.[5]) === "Anulado" ? C.red : "#2E7D60" }}>
                    {String(row?.[5] ?? "Activo")}
                  </span>
                </div>
                <div className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-3" style={{ color: t.muted }}>
                  <span><strong style={{ color: t.text }}>Proveedor:</strong> {String(row?.[0] ?? "—")}</span>
                  <span><strong style={{ color: t.text }}>Compra:</strong> {formatViewValue(cfg.fields[1], String(row?.[1] ?? ""))}</span>
                  <span><strong style={{ color: t.text }}>Registro:</strong> {formatViewValue(cfg.fields[2], String(row?.[2] ?? ""))}</span>
                </div>
                <div className="min-w-0 border-t border-dashed px-4 py-3" style={{ borderColor: t.inputB }}>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.muted, fontFamily: "Montserrat, sans-serif" }}>Insumos comprados</div>
                  {parsePurchaseItems(row?.[6]).length ? (
                    parsePurchaseItems(row?.[6]).map((item, index) => (
                      <div key={`${item.name}-${index}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b py-2.5 text-xs last:border-b-0" style={{ borderColor: t.border }}>
                        <span className="min-w-0 font-semibold break-words" style={{ color: t.text }}>{item.name}</span>
                        <span className="text-right font-bold" style={{ color: C.mustard }}>{fmt(item.total)}</span>
                        <span className="col-span-2 text-[10px]" style={{ color: t.muted }}>{item.quantity} {String(supplyInfo(item.name)?.[2] ?? "und")} × {fmt(Number(item.unitPrice || 0))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl px-3 py-4 text-center text-xs" style={{ background: t.input, color: t.muted }}>No se registraron insumos comprados.</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed px-4 py-3 text-xs" style={{ borderColor: t.inputB }}>
                  <span style={{ color: t.muted }}>Subtotal: <strong style={{ color: t.text }}>{fmt(Number(row?.[3] || 0))}</strong></span>
                  <span className="text-sm" style={{ color: t.text }}>Total: <strong style={{ color: C.mustard }}>{fmt(Number(row?.[4] || 0))}</strong></span>
                </div>
              </div>
            )}
            {isView && modal.section === "cat-producto" && row && (() => {
              const products = (rows.producto || []).filter(
                (product) => normalizeName(product[1]) === normalizeName(row[0]),
              )
              return (
                <div className="rounded-xl px-4 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                    Productos en esta categoría ({products.length})
                  </div>
                  <div style={{ color: t.text }}>
                    {products.length
                      ? products.map((product) => String(product[0])).join(", ")
                      : "Ningún producto usa esta categoría todavía."}
                  </div>
                </div>
              )
            })()}
            {isView && isProduction && (
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                <div className="rounded-xl px-3.5 py-3 sm:col-span-2" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Productos de la orden</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getProductionOrderItems(row ?? undefined).map((item, index) => (
                      <span key={`${item.name}-${index}`} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: `${C.mustard}12`, color: C.mustard }}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl px-3.5 py-3 text-sm" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Estado actual</span>
                  <strong className="mt-1 block" style={{ color: String(row?.[8]) === "Producto no conforme" ? C.red : t.text }}>{String(row?.[8] ?? "Recibida")}</strong>
                </div>
                <div className="rounded-xl px-3.5 py-3 text-sm" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Prioridad de llegada</span>
                  <strong className="mt-1 block" style={{ color: t.text }}>#{String(row?.[3] ?? "—")}</strong>
                </div>
                <div className="rounded-xl px-3.5 py-3 text-sm" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Creada</span>
                  <strong className="mt-1 block" style={{ color: t.text }}>{String(row?.[4] ?? "—")} · {String(row?.[5] ?? "—")}</strong>
                </div>
                <div className="rounded-xl px-3.5 py-3 text-sm" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Última actualización</span>
                  <strong className="mt-1 block" style={{ color: t.text }}>{String(row?.[6] ?? "—")} · {String(row?.[7] ?? "—")}</strong>
                </div>
                <div className="rounded-xl px-3.5 py-3 text-sm sm:col-span-2" style={{ background: t.input }}>
                  <span className="block text-[10px] font-semibold" style={{ color: t.muted }}>Salida de producción</span>
                  <strong className="mt-1 block" style={{ color: C.mustard }}>{String(row?.[9] || "Pendiente")}</strong>
                </div>
                <div className="rounded-xl px-3.5 py-3 sm:col-span-2" style={{ background: t.input }}>
                  <span className="block text-xs font-semibold" style={{ color: t.text }}>Actualizaciones consecutivas</span>
                  <div className="mt-3 flex flex-col gap-2">
                    {parseProductionHistory(row?.[12]).map((update, index) => (
                      <div key={`${String(update.status)}-${String(update.date)}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                        <span className="flex items-center gap-2 font-semibold" style={{ color: update.status === "Producto no conforme" ? C.red : t.text }}>
                          <span style={{ color: C.mustard }}>{index + 1}.</span>
                          {String(update.status)}
                        </span>
                        <span style={{ color: t.muted }}>{String(update.date)} · {String(update.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {isView && isPedido && (
              <div className="rounded-xl p-4 sm:col-span-2" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <span className="text-xs" style={{ color: t.muted }}>Estado: <strong style={{ color: t.text }}>{String(row?.[7] ?? "Recibido")}</strong></span>
                  <span className="text-xs" style={{ color: t.muted }}>Pago: <strong style={{ color: String(row?.[8]) === "Pagado" ? "#2E7D60" : C.red }}>{String(row?.[8] ?? "Pendiente")}</strong></span>
                  <span className="text-xs" style={{ color: t.muted }}>Autorización: <strong style={{ color: String(row?.[9]) === "Autorizada" ? "#2E7D60" : C.mustard }}>{String(row?.[9] ?? "Pendiente admin")}</strong></span>
                </div>
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: t.text }}>Detalle del pedido</h4>
                  <div className="flex flex-col gap-2">
                    {orderDetails.map((line) => {
                      const parent = line.parentId
                        ? orderDetails.find((candidate) => candidate.id === line.parentId)
                        : undefined
                      return (
                        <div key={line.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                          <span style={{ color: t.text }}>{parent ? `↳ ${line.product} · adición de ${parent.product}` : line.product} <span style={{ color: t.muted }}>× {line.quantity}</span></span>
                          <strong className="shrink-0" style={{ color: t.text }}>{fmt(line.quantity * line.unitPrice)}</strong>
                        </div>
                      )
                    })}
                    {!orderDetails.length && <span className="text-xs" style={{ color: t.muted }}>No hay detalle de productos disponible.</span>}
                  </div>
                </div>
                {paymentProofs[modal.idx!] && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: t.text }}>
                      Comprobante de transferencia
                    </h4>
                    <img
                      src={paymentProofs[modal.idx!]}
                      alt={`Comprobante de pago de ${String(row?.[0] ?? "pedido")}`}
                      className="max-h-64 w-full rounded-xl object-contain"
                      style={{ background: t.card, border: `1px solid ${t.border}` }}
                    />
                  </div>
                )}
                {String(row?.[8]) === "Rechazado" && (
                  <p className="mt-4 rounded-xl px-3 py-2.5 text-xs" style={{ background: `${C.red}10`, color: C.red }}>
                    Transferencia rechazada: {String(row?.[11] || "Sin motivo registrado.")}
                  </p>
                )}
                {isTransferPaymentMethod(String(row?.[4] ?? "")) &&
                String(row?.[8]) === "Pendiente de verificación" ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentRejectionTarget(modal.idx!)
                        setPaymentRejectionReason("")
                        setPaymentRejectionError("")
                      }}
                      className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
                      style={{ background: `${C.red}12`, color: C.red }}
                    >
                      Rechazar transferencia
                    </button>
                    <button
                      type="button"
                      disabled={!paymentProofs[modal.idx!]}
                      onClick={() => approveOrderForProduction(modal.idx!)}
                      className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: C.mustard, color: "#fff" }}
                    >
                      Aprobar transferencia y enviar a producción
                    </button>
                  </div>
                ) : String(row?.[9]) === "Autorizada" ? (
                  <p className="mt-4 text-center text-sm font-semibold" style={{ color: "#2E7D60" }}>
                    Pago aprobado y producción autorizada.
                  </p>
                ) : String(row?.[9]) === "Enviada a producción" ? (
                  <p className="mt-4 text-center text-sm font-semibold" style={{ color: "#2E7D60" }}>
                    Ya se envió a producción.
                  </p>
                ) : String(row?.[8]) !== "Rechazado" && (
                  <button
                    type="button"
                    disabled={
                      (String(row?.[5]) !== "Contraentrega" &&
                        (String(row?.[8]) !== "Pagado" || !paymentProofs[modal.idx!])) ||
                      ["Autorizada", "Enviada a producción"].includes(String(row?.[9]))
                    }
                    onClick={() => approveOrderForProduction(modal.idx!)}
                    className="mt-4 w-full cursor-pointer rounded-xl py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    Confirmar pedido y enviar a producción
                  </button>
                )}
              </div>
            )}
            {isView && isSales && (
              <div className="rounded-xl p-4 sm:col-span-2" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: t.text }}>Detalle de la venta</h4>
                <div className="flex flex-col gap-2">
                  {saleOrderLines.map((line) => {
                    const parent = line.parentId
                      ? saleOrderLines.find((candidate) => candidate.id === line.parentId)
                      : undefined
                    return (
                      <div key={line.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                        <span style={{ color: t.text }}>{parent ? `↳ ${line.product} · adición de ${parent.product}` : line.product} <span style={{ color: t.muted }}>× {line.quantity}</span></span>
                        <strong className="shrink-0" style={{ color: t.text }}>{fmt(line.quantity * line.unitPrice)}</strong>
                      </div>
                    )
                  })}
                  {!saleOrderLines.length && <span className="text-xs" style={{ color: t.muted }}>No hay detalle de productos disponible.</span>}
                </div>
                {saleOrderIndex >= 0 && paymentProofs[saleOrderIndex] && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-bold" style={{ color: t.text }}>Comprobante de pago</h4>
                    <img src={paymentProofs[saleOrderIndex]} alt="Comprobante de pago" className="max-h-56 w-full rounded-lg object-contain" style={{ background: t.card }} />
                  </div>
                )}
              </div>
            )}
            {/* Roles permissions matrix */}
            {isRoles && !isView && (
              <div className="sm:col-span-2">
                <RolesPermMatrix
                  roleName={formData["0"] || ""}
                  permissionKey={
                    modal.mode === "edit" && row
                      ? String(row[0] ?? "")
                      : formData["0"] || ""
                  }
                />
              </div>
            )}
            {isRoles && isView && row && (
              <RolesPermMatrix roleName={String(row[0])} readOnly={true} />
            )}
          </div>
          <div
            className={`px-5 flex gap-3 ${isUser || isRoles ? "py-3" : "py-4"}`}
            style={{ borderTop: `1px solid ${t.border}` }}
          >
            <button
              onClick={() => setModal({ mode: null, section: "", idx: null })}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              style={{ background: t.input, color: t.muted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(182,140,28,0.12)"
                e.currentTarget.style.color = C.mustard
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = t.input
                e.currentTarget.style.color = t.muted
              }}
            >
              {isView ? "Cerrar" : "Cancelar"}
            </button>
            {isView && isPurchaseModule && modal.idx !== null && !anulled[modal.section]?.has(modal.idx) && statusValue !== "Anulado" && modal.section !== "roles" && (
              <button
                onClick={() => openEdit(modal.section, modal.idx!)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Editar
              </button>
            )}
            {!isView && (
              <button
                onClick={saveModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90"
                style={{ background: C.mustard, color: "#fff" }}
              >
                Guardar
              </button>
            )}
          </div>
        </div>
        {technicalSheetOpen && isProduct && !isView && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setTechnicalSheetOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-tech-sheet-title"
              className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}`, maxHeight: "85vh" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div>
                  <h3 id="product-tech-sheet-title" className="font-semibold" style={{ color: t.text }}>Ficha técnica del producto</h3>
                  <p className="mt-1 text-xs" style={{ color: t.muted }}>{formData["0"] || "Producto"} · versión {formData["6"] || getAutoTechVersion(rows.producto || [])}</p>
                </div>
                <button type="button" onClick={() => setTechnicalSheetOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl cursor-pointer" style={{ background: t.input, color: t.muted }} aria-label="Cerrar ficha técnica">{Ico.x}</button>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
                <p className="text-xs" style={{ color: t.muted }}>Agrega los insumos que utiliza una unidad del producto. La unidad se toma del inventario y debe coincidir.</p>
                {technicalIngredients.length ? (
                  technicalIngredients.map((ingredient, index) => (
                    <div key={`${ingredient.name}-${index}`} className="grid items-center gap-2 rounded-xl p-3 sm:grid-cols-[minmax(0,1fr)_110px_90px_auto]" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
                      <span className="min-w-0 truncate text-sm font-semibold" style={{ color: t.text }}>{ingredient.name}</span>
                      <input
                        aria-label={`Cantidad de ${ingredient.name}`}
                        type="number"
                        min="0.001"
                        step="any"
                        value={ingredient.quantity}
                        onChange={(event) => setTechnicalIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                      />
                      <span className="text-xs" style={{ color: t.muted }}>{ingredient.unit}</span>
                      <button type="button" onClick={() => setTechnicalIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer" style={{ background: `${C.red}10`, color: C.red }} aria-label={`Quitar ${ingredient.name}`}>{Ico.trash}</button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl px-3 py-5 text-center text-xs" style={{ background: t.input, color: t.muted }}>Todavía no hay insumos en esta ficha.</div>
                )}
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
                  <select
                    value={technicalIngredientSelect}
                    onChange={(event) => setTechnicalIngredientSelect(event.target.value)}
                    className="min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                  >
                    <option value="">Selecciona un insumo...</option>
                    {getAvailableInsumos().filter((name) => !technicalIngredients.some((item) => item.name === name)).map((name) => {
                      const supply = rows.insumos?.find((item) => item[0] === name)
                      return <option key={name} value={name}>{name} · {String(supply?.[2] ?? "und")}</option>
                    })}
                  </select>
                  <input
                    aria-label="Cantidad del insumo"
                    type="number"
                    min="0.001"
                    step="any"
                    value={technicalIngredientQuantity}
                    onChange={(event) => setTechnicalIngredientQuantity(event.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: t.input, border: `1px solid ${t.inputB}`, color: t.text }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const supply = rows.insumos?.find((item) => item[0] === technicalIngredientSelect)
                      const quantity = Number(technicalIngredientQuantity)
                      if (!supply || !Number.isFinite(quantity) || quantity <= 0) {
                        setTechnicalSheetError("Selecciona un insumo e ingresa una cantidad mayor que cero.")
                        return
                      }
                      setTechnicalIngredients((current) => [...current, {
                        name: technicalIngredientSelect,
                        quantity,
                        unit: String(supply[2] ?? ""),
                      }])
                      setTechnicalIngredientSelect("")
                      setTechnicalIngredientQuantity("1")
                      setTechnicalSheetError("")
                    }}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
                    style={{ background: C.mustard, color: "#fff" }}
                  >
                    Agregar insumo
                  </button>
                </div>
                {technicalSheetError && <p className="text-xs font-medium" style={{ color: C.red }} role="alert">{technicalSheetError}</p>}
              </div>
              <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${t.border}` }}>
                <button type="button" onClick={() => setTechnicalSheetOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer" style={{ background: t.input, color: t.muted }}>Cancelar</button>
                <button
                  type="button"
                  onClick={() => {
                    const recipe = JSON.stringify(technicalIngredients)
                    setFormData((current) => ({
                      ...current,
                      "5": `Ficha técnica - ${current["0"] || "Producto"}`,
                      "7": technicalIngredients.map((ingredient) => ingredient.name).join(", "),
                      "9": recipe,
                    }))
                    setTechnicalSheetOpen(false)
                    setTechnicalSheetError("")
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer"
                  style={{ background: C.mustard, color: "#fff" }}
                >
                  Guardar ficha
                </button>
              </div>
            </div>
          </div>
        )}
        {isPurchase && lossDraft && (() => {
          const motivos =
            MOD_CFG.perdidas.fields.find((field) => field.key === "2")?.options ?? []
          const updateLoss = (patch: Partial<typeof lossDraft>) => {
            setLossError("")
            setLossDraft((current) => (current ? { ...current, ...patch } : current))
          }
          const confirmLoss = () => {
            const qty = Number(lossDraft.qty)
            if (!(qty > 0)) return setLossError("Escribe cuánto se perdió.")
            if (qty > lossDraft.max)
              return setLossError(
                `No puede ser más de lo comprado: máximo ${lossDraft.max.toLocaleString("es-CO")} ${lossDraft.unit}.`,
              )
            if (!lossDraft.motivo) return setLossError("Selecciona el motivo de la pérdida.")
            if (!lossDraft.responsable.trim()) return setLossError("Escribe quién es el responsable.")
            if (!lossDraft.fecha) return setLossError("Selecciona la fecha.")
            setRows((current) => ({
              ...current,
              perdidas: [
                [
                  lossDraft.insumo,
                  `${qty} ${lossDraft.unit}`,
                  lossDraft.motivo,
                  lossDraft.responsable.trim(),
                  lossDraft.fecha,
                  lossDraft.origin,
                ],
                ...(current.perdidas || []),
              ],
            }))
            setPurchaseNotice(
              `Se envió a Pérdida de insumos: ${qty.toLocaleString("es-CO")} ${lossDraft.unit} de «${lossDraft.insumo}» (${lossDraft.motivo}).`,
            )
            setLossDraft(null)
            setLossError("")
          }
          const controlSt = { background: t.input, border: `1.5px solid ${t.inputB}`, color: t.text }
          return (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.45)" }}
              onClick={(e) => {
                e.stopPropagation()
                setLossDraft(null)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="loss-dialog-title"
                className="w-full max-w-sm rounded-2xl p-5"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="loss-dialog-title" className="text-base font-semibold" style={{ color: t.text }}>
                  Enviar a pérdida de insumos
                </h3>
                <p className="mt-1 mb-4 text-xs" style={{ color: t.muted }}>
                  <strong style={{ color: t.text }}>{lossDraft.insumo}</strong> · {lossDraft.origin}
                </p>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                    Cantidad perdida ({lossDraft.unit}) · máximo {lossDraft.max.toLocaleString("es-CO")}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={lossDraft.qty}
                      onChange={(e) => updateLoss({ qty: e.target.value })}
                      className="rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={controlSt}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                    Motivo
                    <select
                      value={lossDraft.motivo}
                      onChange={(e) => updateLoss({ motivo: e.target.value })}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ ...controlSt, color: lossDraft.motivo ? t.text : t.muted }}
                    >
                      <option value="">Selecciona...</option>
                      {motivos.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                      Responsable
                      <input
                        value={lossDraft.responsable}
                        onChange={(e) => updateLoss({ responsable: e.target.value })}
                        placeholder="Ej: cocinero"
                        className="min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={controlSt}
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold" style={{ color: t.muted }}>
                      Fecha
                      <input
                        type="date"
                        value={lossDraft.fecha}
                        onChange={(e) => updateLoss({ fecha: e.target.value })}
                        className="min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={controlSt}
                      />
                    </label>
                  </div>
                  {lossError && (
                    <p className="text-xs font-medium" style={{ color: C.red }} role="alert">
                      {lossError}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLossDraft(null)}
                    className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: t.input, color: t.muted }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmLoss}
                    className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
                    style={{ background: C.red, color: "#fff" }}
                  >
                    Enviar a pérdida
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  const ProductionPncModal = () => {
    if (pncTarget === null) return null
    const orderItems = getProductionOrderItems(rows.produccion?.[pncTarget ?? -1] ?? undefined)
    const productOptions = orderItems.length
      ? orderItems.map((item) => item.name)
      : getNonconformingProductOptions()
    const controlStyle = {
      background: t.input,
      border: `1px solid ${t.inputB}`,
      color: t.text,
      fontFamily: "Poppins, sans-serif",
    }
    const updatePncField = (key: string, value: string) => {
      setPncForm((current) => ({ ...current, [key]: value }))
      setPncFieldErrors((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
      setPncError("")
    }
    const pncStyle = (key: string) => ({
      ...controlStyle,
      border: `1px solid ${pncFieldErrors[key] ? C.red : t.inputB}`,
    })
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center px-3 pb-3 pt-8 sm:items-center sm:px-4 sm:pb-4"
        style={{ background: "rgba(18,16,14,0.68)", backdropFilter: "blur(3px)" }}
        onClick={() => setPncTarget(null)}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-3xl"
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
            fontFamily: "Poppins, sans-serif",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex items-center gap-3 px-5 py-4 sm:px-6"
            style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${C.red}14`, color: C.red }}>
              {Ico.alert}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>
                Producto no conforme
              </h3>
              <p className="mt-0.5 text-xs" style={{ color: t.muted }}>
                Registra la pérdida y reinicia la orden de producción.
              </p>
            </div>
            <button type="button" onClick={() => setPncTarget(null)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl" style={{ background: t.input, color: t.muted }}>
              {Ico.x}
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: t.input, border: `1px solid ${t.border}` }}>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.muted }}>Orden afectada</span>
                <strong className="mt-1 block text-sm" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>{pncForm["0"]}</strong>
              </div>
              <span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: `${C.red}12`, color: C.red }}>Se generates una nueva orden</span>
            </div>

            <section className="rounded-2xl p-4" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full" style={{ background: C.mustard }} />
                <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>Producto y daño</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
                  Producto o producto de insumo *
                  <select value={pncForm["1"] || ""} onChange={(event) => {
                    const selectedProduct = event.target.value
                    const selectedItem = orderItems.find((item) => item.name === selectedProduct)
                    setPncForm((current) => ({
                      ...current,
                      "1": selectedProduct,
                      "2": selectedProduct,
                      "3": String(selectedItem?.quantity ?? current["3"] ?? 1),
                    }))
                    setPncFieldErrors((current) => {
                      const next = { ...current }
                      delete next["1"]
                      delete next["2"]
                      delete next["3"]
                      return next
                    })
                    setPncError("")
                  }} aria-invalid={!!pncFieldErrors["1"]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("1")}>
                    <option value="">Selecciona...</option>
                    {productOptions.map((product) => <option key={product} value={product}>{product}</option>)}
                  </select>
                  {pncFieldErrors["1"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["1"]}</span>}
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
                  Cantidad *
                  <input type="number" min="1" value={pncForm["3"] || "1"} onChange={(event) => updatePncField("3", event.target.value)} aria-invalid={!!pncFieldErrors["3"]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("3")} />
                  {pncFieldErrors["3"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["3"]}</span>}
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold sm:col-span-2" style={{ color: t.muted }}>
                  Productos que se dañaron *
                  <textarea rows={2} value={pncForm["2"] || ""} onChange={(event) => updatePncField("2", event.target.value)} aria-invalid={!!pncFieldErrors["2"]} className="w-full min-w-0 resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("2")} />
                  {pncFieldErrors["2"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["2"]}</span>}
                </label>
              </div>
            </section>

            <section className="rounded-2xl p-4" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full" style={{ background: C.red }} />
                <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: t.text, fontFamily: "Montserrat, sans-serif" }}>Clasificación del registro</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
                  Motivo *
                  <select value={pncForm["4"] || "Producto perdido"} onChange={(event) => updatePncField("4", event.target.value)} aria-invalid={!!pncFieldErrors["4"]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("4")}>
                    {["Tiempo superado", "Error en preparación", "Ingrediente incorrecto", "Daño físico", "Producto perdido", "Otro"].map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                  {pncFieldErrors["4"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["4"]}</span>}
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
                  Fecha del registro *
                  <input type="date" value={pncForm["5"] || ""} onChange={(event) => updatePncField("5", event.target.value)} aria-invalid={!!pncFieldErrors["5"]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none" style={pncStyle("5")} />
                  {pncFieldErrors["5"] && <span role="alert" className="text-[10px]" style={{ color: C.red }}>{pncFieldErrors["5"]}</span>}
                </label>
              </div>
            </section>

            {pncError && (
              <div className="rounded-xl px-3 py-2.5 text-xs font-medium" style={{ background: `${C.red}10`, color: C.red }}>
                {pncError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:justify-end sm:px-6" style={{ background: t.cardAlt, borderTop: `1px solid ${t.border}` }}>
            <button type="button" onClick={() => setPncTarget(null)} className="rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer" style={{ background: t.input, color: t.muted }}>
              Cancelar
            </button>
            <button type="button" onClick={saveProductionPnc} className="rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer" style={{ background: C.red, color: "#fff", fontFamily: "Montserrat, sans-serif" }}>
              Registrar y reiniciar orden
            </button>
          </div>
        </div>
      </div>
    )
  }

  const QuickClientModal = () => {
    if (!quickClientOpen) return null
    const quickIsLocal = String(quickClientForm["6"] ?? "").toLowerCase() === "sí"
    const updateQuickClientField = (
      key: string,
      rawValue: string,
      validateImmediately = false,
    ) => {
      const value =
        key === "2"
          ? normalizeDocumentInput(rawValue, quickClientForm["1"] ?? "")
          : key === "3"
            ? normalizePhoneInput(rawValue)
            : rawValue
      const nextForm = { ...quickClientForm, [key]: value }
      if (key === "1") {
        nextForm["2"] = normalizeDocumentInput(
          nextForm["2"] ?? "",
          value,
        )
      }
      setQuickClientForm(nextForm)
      if (validateImmediately || quickClientErrors[key] || quickClientError) {
        const isLocal = String(nextForm["6"] ?? "").toLowerCase() === "sí"
        const required =
          key === "0" || key === "1" || key === "2" || key === "3" ||
          (!isLocal && (key === "4" || key === "5"))
        let error = required && !value.trim() ? "Este campo es obligatorio." : ""
        if (!error && key === "2" && value.trim()) {
          error = validateDocumentNumber(value, nextForm["1"] ?? "")
        }
        if (!error && key === "3" && value.trim()) error = validatePhoneNumber(value)
        if (!error && key === "4" && value.trim() && !EMAIL_PATTERN.test(value.trim())) {
          error = "Escribe un correo electrónico válido."
        }
        setQuickClientErrors((current) => {
          const updated = { ...current }
          if (error) updated[key] = error
          else delete updated[key]
          return updated
        })
        if (!error) setQuickClientError("")
      }
    }
    const field = (key: string, label: string, type = "text", options?: string[]) => (
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold" style={{ color: t.muted }}>
        {label}{(key === "0" || key === "1" || key === "2" || key === "3" ||
          (!quickIsLocal && (key === "4" || key === "5"))) && " *"}
        {options ? (
          <select value={quickClientForm[key] || ""} onBlur={() => updateQuickClientField(key, quickClientForm[key] || "", true)} onChange={(event) => updateQuickClientField(key, event.target.value)} aria-invalid={!!quickClientErrors[key]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm" style={{ background: t.input, border: `1px solid ${quickClientErrors[key] ? C.red : t.inputB}`, color: t.text }}>
            <option value="">Selecciona...</option>
            {options.map((option) => <option key={option}>{option}</option>)}
          </select>
        ) : (
          <input type={type} inputMode={key === "2" || key === "3" ? "numeric" : undefined} value={quickClientForm[key] || ""} onBlur={() => updateQuickClientField(key, quickClientForm[key] || "", true)} onChange={(event) => updateQuickClientField(key, event.target.value)} aria-invalid={!!quickClientErrors[key]} className="w-full min-w-0 rounded-xl px-3 py-2.5 text-sm" style={{ background: t.input, border: `1px solid ${quickClientErrors[key] ? C.red : t.inputB}`, color: t.text }} />
        )}
        {quickClientErrors[key] && <span role="alert" className="text-[10px] font-medium" style={{ color: C.red }}>{quickClientErrors[key]}</span>}
      </label>
    )
    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.68)" }} onClick={() => setQuickClientOpen(false)}>
        <div className="flex max-h-[90vh] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div><h3 className="text-base font-semibold" style={{ color: t.text }}>Registrar cliente</h3><p className="text-xs" style={{ color: t.muted }}>Correo y dirección obligatorios, excepto para clientes de local.</p></div>
            <button type="button" onClick={() => setQuickClientOpen(false)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl" style={{ background: t.input, color: t.muted }}>{Ico.x}</button>
          </div>
          <div className="grid min-w-0 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("0", "Nombre completo *")}</div>
            <div className="sm:col-span-2">{field("3", "Teléfono *", "tel")}</div>
            {field("1", "Tipo de documento *", "text", ["Cédula de Ciudadanía", "Cédula Extranjería", "NIT", "Pasaporte", "Tarjeta de Identidad"])}
            {field("2", "Número de documento *")}
            {field("4", quickIsLocal ? "Correo electrónico (opcional)" : "Correo electrónico *", "email")}
            <div className="sm:col-span-2">{field("5", quickIsLocal ? "Dirección (opcional)" : "Dirección *")}</div>
            <button
              type="button"
              role="checkbox"
              aria-checked={quickIsLocal}
              onClick={() => {
                setQuickClientForm((current) => ({ ...current, "6": quickIsLocal ? "No" : "Sí" }))
                setQuickClientErrors((current) => {
                  const next = { ...current }
                  if (quickIsLocal) return next
                  delete next["4"]
                  delete next["5"]
                  return next
                })
              }}
              className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left sm:col-span-2"
              style={{ background: t.input, border: `1px solid ${t.inputB}` }}
            >
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md" style={{ background: quickIsLocal ? C.mustard : "transparent", border: `1.5px solid ${quickIsLocal ? C.mustard : t.inputB}`, color: "#fff" }}>{quickIsLocal ? Ico.check : null}</span>
              <span><strong className="block text-sm" style={{ color: t.text }}>Cliente de local</strong><span className="block text-xs" style={{ color: t.muted }}>No requiere correo electrónico ni dirección.</span></span>
            </button>
            {quickClientError && <p className="text-xs font-medium sm:col-span-2" style={{ color: C.red }}>{quickClientError}</p>}
          </div>
          <div className="flex gap-3 px-5 py-4" style={{ borderTop: `1px solid ${t.border}` }}>
            <button type="button" onClick={() => setQuickClientOpen(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold cursor-pointer" style={{ background: t.input, color: t.muted }}>Cancelar</button>
            <button type="button" onClick={saveQuickClient} className="flex-1 rounded-xl py-2.5 text-sm font-bold cursor-pointer" style={{ background: C.mustard, color: "#fff" }}>Registrar cliente</button>
          </div>
        </div>
      </div>
    )
  }

  const AnulModal = () => {
    if (!anulTarget) return null

    const targetRow = rows[anulTarget.section]?.[anulTarget.idx]
    const assessment = getAnulAssessment(
      anulTarget.section,
      targetRow,
      anulTarget.idx,
    )
    const canAnul = assessment.allowed
    const moduleName =
      PERMISSION_MODULES.find((m) =>
        m.name.toLowerCase().includes(anulTarget.section.replace(/-/g, " ")),
      )?.name || "registro"
    const targetName = assessment.targetLabel

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={() => setAnulTarget(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="annul-dialog-title"
          className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: canAnul ? `${C.mustard}18` : `${C.red}12`,
              color: canAnul ? C.mustard : C.red,
            }}
          >
            {canAnul ? Ico.ban : Ico.alert}
          </div>
          <h3
            id="annul-dialog-title"
            className="mb-3 text-base font-semibold"
            style={{ color: t.text }}
          >
            {canAnul ? "¿Deseas anular?" : "Anulación bloqueada"}
          </h3>
          <p className="mb-5 text-sm leading-relaxed" style={{ color: t.text }}>
            {canAnul
              ? `Este ${moduleName} está asociado a ${targetName} y si lo anulas se verá reflejado en dicho módulo.`
              : `No puedes anular este ${moduleName}. ${assessment.reason}`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAnulTarget(null)}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: t.input, color: t.muted }}
            >
              {canAnul ? "Cancelar" : "Entendido"}
            </button>
            {canAnul && (
              <button
                type="button"
                onClick={confirmAnul}
                className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
                style={{ background: C.red, color: "#fff" }}
              >
                Anular
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const PaymentRejectionModal = () => {
    if (paymentRejectionTarget === null) return null
    const order = rows.pedidos?.[paymentRejectionTarget]
    if (!order) return null

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={() => setPaymentRejectionTarget(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-rejection-title"
          className="w-full max-w-md rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
          onClick={(event) => event.stopPropagation()}
        >
          <h3 id="payment-rejection-title" className="text-base font-bold" style={{ color: t.text }}>
            Rechazar transferencia
          </h3>
          <p className="mt-2 text-sm" style={{ color: t.muted }}>
            El pedido {String(order[0])} no se enviará a producción. Escribe el motivo para que quede guardado en el pedido.
          </p>
          <textarea
            autoFocus
            rows={3}
            value={paymentRejectionReason}
            onChange={(event) => {
              setPaymentRejectionReason(event.target.value)
              setPaymentRejectionError("")
            }}
            placeholder="Ej.: comprobante no válido o pago no recibido"
            aria-label="Motivo del rechazo"
            className="mt-4 w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: t.input,
              border: `1px solid ${paymentRejectionError ? C.red : t.inputB}`,
              color: t.text,
            }}
          />
          {paymentRejectionError && (
            <p className="mt-2 text-xs" role="alert" style={{ color: C.red }}>
              {paymentRejectionError}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentRejectionTarget(null)}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: t.input, color: t.muted }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={rejectTransferPayment}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold"
              style={{ background: C.red, color: "#fff" }}
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    )
  }

  const DelModal = () => {
    if (!delTarget) return null

    const targetRow = rows[delTarget.section]?.[delTarget.idx]
    const assessment = getDeleteAssessment(delTarget.section, targetRow)
    const canDelete = assessment.allowed

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={() => setDelTarget(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: canDelete ? "rgba(58,109,94,0.12)" : `${C.red}12`,
              color: canDelete ? "#2E7D60" : C.red,
            }}
          >
            {canDelete ? Ico.trash : Ico.alert}
          </div>
          <h3
            id="delete-dialog-title"
            className="mb-3 text-base font-semibold"
            style={{ color: t.text }}
          >
            {canDelete ? "¿Deseas eliminar?" : "Eliminación bloqueada"}
          </h3>
          <p className="mb-5 text-sm leading-relaxed" style={{ color: t.text }}>
            {canDelete
              ? `¿Seguro que quieres eliminar ${assessment.targetLabel}? ${
                  delTarget.section === "proveedores" ? `${assessment.reason} ` : ""
                }Se quitará del sistema y no se podrá recuperar.`
              : `No puedes eliminar ${assessment.targetLabel}. ${assessment.reason}`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDelTarget(null)}
              className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: t.input, color: t.muted }}
            >
              {canDelete ? "Cancelar" : "Entendido"}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold hover:opacity-90"
                style={{ background: C.red, color: "#fff" }}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <>
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: `1px solid ${t.sidebarBd}` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logoImg}
            alt="Logo"
            className="w-11 h-11 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <div
              className="font-semibold text-sm truncate"
              style={{ fontFamily: "Montserrat, sans-serif", color: C.mustard }}
            >
              El Parche
            </div>
            <div className="text-xs" style={{ color: t.sidebarMu }}>
              Mini Burguer · Admin
            </div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ color: t.sidebarMu, background: t.inputB }}
        >
          {Ico.x}
        </button>
      </div>
      <nav
        ref={preserveSidebarScroll}
        onScroll={(event) => {
          sidebarScrollTop.current = event.currentTarget.scrollTop
        }}
        className="flex-1 overflow-y-auto py-3 px-2"
        style={{ scrollbarWidth: "none" }}
      >
        {SIDEBAR_MENU.map((g) => {
          const leaf = g.children.length === 0
          const active = leaf && section === g.key
          const anyChild = g.children.some((c) => c.key === section)
          return (
            <div key={g.key} className="mb-0.5">
              <button
                onClick={() => {
                  if (leaf) {
                    setSection(g.key as AdminSection)
                  } else toggleGrp(g.key)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer"
                style={{
                  background: active
                    ? `${g.color}18`
                    : anyChild
                      ? dark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)"
                      : "transparent",
                }}
              >
                <span
                  className="flex-shrink-0"
                  style={{ color: active || anyChild ? g.color : t.sidebarMu }}
                >
                  {g.icon}
                </span>
                <span
                  className="flex-1 text-xs font-medium truncate"
                  style={{ color: active ? g.color : t.sidebarTx }}
                >
                  {g.label}
                </span>
                {!leaf && (
                  <span
                    style={{
                      color: t.sidebarMu,
                      transform: open.includes(g.key)
                        ? "rotate(180deg)"
                        : "none",
                      transition: "transform 0.2s",
                      display: "inline-flex",
                    }}
                  >
                    {Ico.chevDown}
                  </span>
                )}
              </button>
              {!leaf && open.includes(g.key) && (
                <div
                  className="ml-5 mt-0.5 flex flex-col gap-0.5 pl-2"
                  style={{ borderLeft: `1.5px solid ${t.sidebarBd}` }}
                >
                  {g.children.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setSection(item.key as AdminSection)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg cursor-pointer"
                      style={{
                        background:
                          section === item.key ? `${g.color}14` : "transparent",
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: section === item.key ? g.color : t.sidebarTx,
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div
        className="px-3 py-3"
        style={{ borderTop: `1px solid ${t.sidebarBd}` }}
      >
        <button
          onClick={onSwitchToClient}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-80"
          style={{ color: t.sidebarMu }}
        >
          {Ico.globe}
          <span>{user ? "Vista de cliente" : "Ver sitio"}</span>
        </button>
        <button
          onClick={onLogout}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-80"
          style={{ color: C.red }}
        >
          {Ico.logout}
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: t.bg, fontFamily: "Poppins, sans-serif" }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "240px",
          background: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBd}`,
          flexShrink: 0,
        }}
      >
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: t.hdrBg, borderBottom: `1px solid ${t.hdrBd}` }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl cursor-pointer"
            style={{ color: t.muted, background: t.input }}
          >
            {Ico.menu}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {/* Admin notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                title="Notificaciones"
                aria-label={`Notificaciones, ${unreadNotifications} sin leer`}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setProfileOpen(false)
                }}
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl"
                style={{
                  background: notificationsOpen ? t.inputB : t.input,
                  color: notificationsOpen ? C.mustard : t.muted,
                }}
              >
                {Ico.bell}
                {unreadNotifications > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 font-bold"
                    style={{
                      background: C.red,
                      color: "#fff",
                      fontSize: "0.5rem",
                    }}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Notificaciones del administrador"
                  className="fixed left-4 right-4 top-16 z-[60] min-w-0 overflow-hidden rounded-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[360px]"
                  style={{
                    background: t.card,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    className="flex min-w-0 items-center gap-2 px-4 py-3"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    <span style={{ color: C.mustard }}>{Ico.bell}</span>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-sm font-semibold"
                        style={{ color: t.text }}
                      >
                        Notificaciones
                      </h2>
                      <p className="text-[11px]" style={{ color: t.muted }}>
                        {unreadNotifications > 0
                          ? `${unreadNotifications} sin leer`
                          : "Estás al día"}
                      </p>
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold cursor-pointer"
                        style={{
                          color: C.mustard,
                          background: `${C.mustard}12`,
                        }}
                      >
                        {Ico.check} Marcar leídas
                      </button>
                    )}
                  </div>

                  <div
                    className="min-w-0 overflow-y-auto"
                    style={{ maxHeight: "min(420px, 58vh)" }}
                  >
                    {notifications.map((notification) => {
                      const isRead = readNotifications.has(notification.id)
                      const color =
                        notification.type === "danger"
                          ? C.red
                          : notification.type === "warn"
                            ? C.mustard
                            : "#4FC3F7"
                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(notification.id)
                            setSection(notification.target)
                            setNotificationsOpen(false)
                          }}
                          className="flex w-full min-w-0 cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors"
                          style={{
                            background: isRead ? t.card : t.input,
                            borderBottom: `1px solid ${t.border}`,
                          }}
                        >
                          <span
                            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ color, background: `${color}16` }}
                          >
                            {Ico.alert}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-start gap-2">
                              <span
                                className="min-w-0 flex-1 text-xs font-semibold break-words [overflow-wrap:anywhere]"
                                style={{ color: t.text }}
                              >
                                {notification.title}
                              </span>
                              {!isRead && (
                                <span
                                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                                  style={{ background: C.red }}
                                />
                              )}
                            </span>
                            <span
                              className="mt-0.5 block text-xs leading-snug break-words [overflow-wrap:anywhere]"
                              style={{ color: t.muted }}
                            >
                              {notification.message}
                            </span>
                            <span
                              className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]"
                              style={{ color: t.subtle }}
                            >
                              <span>{notification.module}</span>
                              <span>·</span>
                              <span>{notification.time}</span>
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="px-4 py-3" style={{ background: t.cardAlt }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSection("dashboard")
                        setNotificationsOpen(false)
                        setTimeout(() => {
                          document.getElementById("admin-alerts-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }, 100)
                      }}
                      className="w-full cursor-pointer text-center text-xs font-semibold"
                      style={{ color: C.mustard }}
                    >
                      Ver todas en el Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() =>
                setTheme((th) => (th === "light" ? "dark" : "light"))
              }
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
              style={{
                background: t.input,
                border: `1px solid ${t.inputB}`,
                color: t.muted,
              }}
            >
              {dark ? Ico.sun : Ico.moon}
            </button>
            <button
              onClick={onSwitchToClient}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: C.mustard, color: "#fff" }}
            >
              {Ico.globe} {user ? "App" : "Sitio"}
            </button>
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => {
                  setProfileOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer"
                style={{ background: C.mustard, color: "#fff" }}
              >
                {user?.name?.charAt(0) ?? "A"}
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-10 w-48 rounded-xl overflow-hidden z-50"
                  style={{
                    background: t.card,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    <div
                      className="font-semibold text-xs"
                      style={{ color: t.text }}
                    >
                      {user?.name ?? "Administrador"}
                    </div>
                    <div className="text-xs" style={{ color: t.muted }}>
                      {user?.email ?? "admin@parche.co"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      setShowAdminProfile(true)
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs cursor-pointer"
                    style={{ color: C.mustard }}
                  >
                    {Ico.user}
                    <span>Mi perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onSwitchToClient()
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs cursor-pointer"
                    style={{ color: C.red }}
                  >
                    {Ico.logout}
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="mb-5">
            <h1 className="font-semibold text-lg" style={{ color: t.text }}>
              {sectionLabel}
            </h1>
          </div>
          {section === "dashboard" && <Dashboard />}
          {section !== "dashboard" && <GenericTable />}
        </main>
      </div>
      {CRUDModal()}
      <ProductionPncModal />
      <QuickClientModal />
      <AnulModal />
      <PaymentRejectionModal />
      <DelModal />
      {showAdminProfile && user && (
        <AdminProfilePage
          user={user}
          onClose={() => setShowAdminProfile(false)}
          onUpdateUser={(u) => {
            // Update user in localStorage and state
            const saved = loadLS<User | null>(`profile:${u.email.toLowerCase()}`, null)
            const updatedUser = saved ? { ...u, ...saved, role: u.role } : u
            saveLS(`profile:${u.email.toLowerCase()}`, updatedUser)
            // Dispatch a custom event to notify the App component
            window.dispatchEvent(new CustomEvent("admin-user-updated", { detail: updatedUser }))
          }}
        />
      )}
    </div>
  )
}

// ── App Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("landing")
  const [user, setUser] = useState<User | null>(null)
  // The cart is kept in the browser, so it survives logout and reloads
  const [cart, setCart] = useState<CartItem[]>(() => loadLS("cart", []))
  const [forgotEmail, setForgotEmail] = useState("")
  const [, setOrdersVersion] = useState(0)
  const [clientView, setClientView] = useState<"menu" | "orders">("menu")

  useEffect(() => saveLS("cart", cart), [cart])

  // Listen for admin user updates from the AdminProfilePage
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      const updatedUser = customEvent.detail as User
      setUser(updatedUser)
    }
    window.addEventListener("admin-user-updated", handler)
    return () => window.removeEventListener("admin-user-updated", handler)
  }, [])

  // Re-read on every render so status changes made in the admin panel show up
  const orders = user
    ? loadOrders().filter((o) => o.email === user.email)
    : []

  // Profile (phone, cédula, addresses) is saved per email, so it survives logout
  const updateUser = (u: User) => {
    setUser(u)
    saveLS(`profile:${u.email.toLowerCase()}`, u)
    saveRegisteredClient(u)
  }
  const login = (u: User, next: Page = "app") => {
    const saved = loadLS<User | null>(`profile:${u.email.toLowerCase()}`, null)
    const authenticatedUser = saved ? { ...u, ...saved, role: u.role } : u
    updateUser(authenticatedUser)
    setClientView("menu")
    setPage(next)
  }
  const logout = () => {
    setUser(null)
    setPage("landing")
  }
  const updateOrders = (fn: (o: Order[]) => Order[]) => {
    saveOrders(fn(loadOrders()))
    setOrdersVersion((v) => v + 1)
  }
  const setVoucher = (id: string, voucher: string) =>
    updateOrders((os) =>
      os.map((o) =>
        o.id === id
          ? {
              ...o,
              voucher,
              ...(o.paymentStatus === "Rechazado"
                ? {
                    paymentStatus: "Pendiente de verificación" as const,
                    paymentRejectionReason: undefined,
                  }
                : {}),
            }
          : o,
      ),
    )
  const goCheckout = () => {
    setPage("checkout")
  }
  const goGuestMenu = () => {
    setPage("guest-menu")
  }

  if (page === "login")
    return (
      <LoginPage
        onLogin={login}
        onRegister={() => setPage("register")}
        onForgot={() => setPage("forgot")}
        onBack={() => setPage("landing")}
      />
    )
  if (page === "register")
    return (
      <RegisterPage
        onVerify={(u) => {
          saveLS(`profile:${u.email}`, u)
          saveRegisteredClient(u)
          setPage("login")
        }}
        onLoginLink={() => setPage("login")}
        onBack={() => setPage("landing")}
      />
    )
  if (page === "forgot")
    return (
      <ForgotPage
        onReset={(e) => {
          setForgotEmail(e)
          setPage("reset")
        }}
        onBack={() => setPage("login")}
      />
    )
  if (page === "reset")
    return <ResetPage email={forgotEmail} onDone={() => setPage("login")} />
  if (page === "guest-menu")
    return (
      <GuestMenuPage
        cart={cart}
        setCart={setCart}
        onBack={() => setPage("landing")}
        onCheckout={goCheckout}
      />
    )
  if (page === "checkout")
    return (
      <CheckoutPage
        cart={cart}
        setCart={setCart}
        user={user}
        onLogin={(u) => login(u, "checkout")}
        onRegisterVerified={(u) => {
          saveRegisteredClient(u)
          login(u, "checkout")
        }}
        onBack={() => setPage(user ? "app" : "landing")}
        onPlaceOrder={(info, shouldSaveAddress) => {
          if (!user) return
          if (shouldSaveAddress) {
            const normalizedAddress = info.direccion.trim()
            updateUser({
              ...user,
              addresses: [
                normalizedAddress,
                ...(user.addresses || []).filter(
                  (address) => address.trim().toLowerCase() !== normalizedAddress.toLowerCase(),
                ),
              ],
            })
          }
          updateOrders((os) => [
            {
              ...info,
              email: user.email,
              cliente: user.name,
              id: `PED-${Date.now().toString().slice(-6)}`,
              date: new Date().toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
              items: cart.filter((item) => item.qty > 0),
              total: cartTotal(cart),
              status:
                cartTotal(cart) >= APPROVAL_MIN ? "Por confirmar" : "Recibido",
              paymentStatus:
                info.pago === "Efectivo"
                  ? "Pendiente"
                  : "Pendiente de verificación",
            },
            ...os,
          ])
          setCart([])
        }}
        onComplete={() => {
          setClientView("orders")
          setPage("app")
        }}
      />
    )
  if (page === "app" && user)
    return (
      <ClientApp
        user={user}
        onLogout={logout}
        onAdmin={() => setPage("admin")}
        onCheckout={goCheckout}
        onProfile={() => setPage("profile" as Page)}
        cart={cart}
        setCart={setCart}
        orders={orders}
        onVoucher={setVoucher}
        initialView={clientView}
      />
    )
  if (page === "profile" as Page && user)
    return (
      <ProfilePage
        user={user}
        onBack={() => setPage("app")}
        onLogout={logout}
        onUpdateUser={updateUser}
        orders={orders}
        onVoucher={setVoucher}
      />
    )
  if (page === "admin")
    return (
      <AdminPanel
        onSwitchToClient={() => setPage(user ? "app" : "landing")}
        onLogout={logout}
        user={user}
      />
    )
  return (
    <LandingPage
      onLogin={() => setPage("login")}
      onAdmin={() => {
        // Create a default admin user if none exists
        if (!user) {
          const adminUser: User = {
            name: "Admin Parche",
            email: "admin@parche.co",
            role: "admin",
          }
          updateUser(adminUser)
        }
        setPage("admin")
      }}
      onGuestMenu={goGuestMenu}
      onCheckout={goCheckout}
      cart={cart}
      setCart={setCart}
    />
  )
}
