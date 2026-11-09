import traditionalBurgerImg from "@/imports/traditional-burger.jpg"
import type { Product } from "@/shared/types"
import { normalizeName } from "@/shared/utils/format"

export const SAUCES = [
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

export const ADDITIONS = [
  { name: "Queso", price: 8000 },
  { name: "Tocineta", price: 8000 },
  { name: "Ensalada", price: 8000 },
  { name: "Carne", price: 8000 },
  { name: "Salchicha x3", price: 8000 },
  { name: "Cebolla", price: 8000 },
  { name: "1 Huevo", price: 900 },
]

export const BEVERAGES = ["Coca-Cola", "Colombiana", "Pepsi", "Manzana", "Uva", "Naranja"]

export const BEVERAGE_SIZES = [
  { id: "personal", label: "Personal", price: 3000 },
  { id: "1.5L", label: "1.5 L", price: 7000 },
  { id: "2.25L", label: "2.25 L", price: 9000 },
  { id: "3L", label: "3 L", price: 12000 },
]

// How each flavour is shown in the menu (the order line keeps the plain flavour, e.g. "Gaseosa Manzana (1.5 L)")
export const BEVERAGE_INFO: Record<string, { label: string; color: string }> = {
  "Coca-Cola": { label: "Coca-Cola", color: "#D7202C" },
  Colombiana: { label: "Colombiana Postobón", color: "#E39A27" },
  Pepsi: { label: "Pepsi", color: "#1E4FA0" },
  Manzana: { label: "Manzana Postobón", color: "#C8263A" },
  Uva: { label: "Uva Postobón", color: "#6B2C91" },
  Naranja: { label: "Naranja Postobón", color: "#F07C12" },
}

export const BEVERAGE_ORDER = ["Coca-Cola", "Colombiana", "Pepsi", "Manzana", "Uva", "Naranja"]

// The sodas for sale (normalized "Gaseosa <sabor> (<tamaño>)" → its product's price and photo, and whether it's
// sold out). Filled by loadMenu; empty = old data, every flavour × size sells at the size price
export const SODA_INFO = new Map<string, { precio: number; img: string; agotada: boolean; stock?: number }>()

export const sodaInfo = (flavor: string, sizeLabel: string) => SODA_INFO.get(normalizeName(`Gaseosa ${flavor} (${sizeLabel})`))

// What one soda costs in the store: its product's price (old data: its size's)
export const sodaPrice = (flavor: string, size: { label: string; price: number }) => sodaInfo(flavor, size.label)?.precio || size.price

// "Personal" / "1.5 L" / "400 ml" → millilitres, to order the size buttons
export const sizeMl = (label: string) => {
  const m = label.match(/(\d+(?:[.,]\d+)?)\s*(ml|l)\b/i)
  if (!m) return /personal/i.test(label) ? 400 : 99999
  return parseFloat(m[1].replace(",", ".")) * (m[2].toLowerCase() === "l" ? 1000 : 1)
}

export const beverageLabel = (flavor: string) => BEVERAGE_INFO[flavor]?.label ?? flavor

// Product photos per flavour and bottle size: src/imports/bebidas/<sabor>-<personal|1500|2500|3000>.jpg
// (a plain <sabor>.jpg still works as a single photo for every size)
export const BEVERAGE_IMAGES = import.meta.glob("/src/imports/bebidas/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>

export const BEVERAGE_PHOTO_SIZES = [
  { key: "personal", ml: 400 },
  { key: "1500", ml: 1500 },
  { key: "2500", ml: 2500 },
  { key: "3000", ml: 3000 },
]

// Size name from the admin ("Personal", "1.5 L", "2.5 L", "3 L", "400 ml"…) → closest bottle photo
export const beveragePhotoKey = (sizeLabel = "") => {
  const m = sizeLabel.match(/(\d+(?:[.,]\d+)?)\s*(ml|l)\b/i)
  if (/personal/i.test(sizeLabel) || !m) return "personal"
  const ml = parseFloat(m[1].replace(",", ".")) * (m[2].toLowerCase() === "l" ? 1000 : 1)
  return BEVERAGE_PHOTO_SIZES.reduce((a, b) => (Math.abs(b.ml - ml) < Math.abs(a.ml - ml) ? b : a)).key
}

export const beverageImage = (flavor: string, sizeLabel?: string) => {
  const slug = normalizeName(flavor).replace(/\s+/g, "-")
  const find = (name: string) =>
    Object.entries(BEVERAGE_IMAGES).find(([path]) => path.toLowerCase().includes(`/${name}.`))?.[1]
  return find(`${slug}-${beveragePhotoKey(sizeLabel)}`) ?? find(slug)
}

// ── Products ───────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
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
    img: traditionalBurgerImg,
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
    cat: "arepa-rellena",
    badge: "",
  },
  {
    id: 28,
    name: "Arepa Especial",
    desc: "Arepa con carne, queso y adiciones seleccionadas.",
    price: 15000,
    priceStr: "$15.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Bacon_%26_Fried_Onion_Arepa.jpg/500px-Bacon_%26_Fried_Onion_Arepa.jpg",
    cat: "arepa-rellena",
    badge: "",
  },
  {
    id: 29,
    name: "Arepa Gourmet",
    desc: "Arepa con carne gourmet, queso especial y tocineta.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Colombian_Food%2C_Arepas.jpg",
    cat: "arepa-rellena",
    badge: "Gourmet",
  },
  {
    id: 30,
    name: "Arepa Desmechada",
    desc: "Arepa con carne desmechada especial de la casa.",
    price: 18000,
    priceStr: "$18.000",
    img: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Arepa_de_carne_mechada.jpg/500px-Arepa_de_carne_mechada.jpg",
    cat: "arepa-rellena",
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

export const MENU_EXTRAS: Product[] = []

export const allMenuProducts = () => [...PRODUCTS, ...MENU_EXTRAS]

// icon: the paths of a line icon (drawn with aboutIcon), no emojis
// Category icons: line drawings on a 24×24 grid (stroke from aboutIcon), one per dish
export const MENU_CATS = [
  {
    id: "todos",
    label: "Todos",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    id: "hamburguesas",
    label: "Hamburguesas",
    icon: (
      <>
        <path d="M4 10.5C4 6.9 7.6 4 12 4s8 2.9 8 6.5z" />
        <path d="M9.5 7h.01M12 6h.01M14.5 7h.01" />
        <path d="M3.6 13c1.2 0 1.2.9 2.4.9s1.2-.9 2.4-.9 1.2.9 2.4.9 1.2-.9 2.4-.9 1.2.9 2.4.9 1.2-.9 2.4-.9 1.2.9 2.4.9" />
        <rect x="4" y="15.2" width="16" height="2.4" rx="1.2" />
        <path d="M4.5 19.4h15v.1a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" />
      </>
    ),
  },
  {
    id: "perros",
    label: "Perros Cal.",
    icon: (
      <>
        <rect x="2.5" y="8" width="19" height="4.6" rx="2.3" />
        <path d="M6 10.3l1.4-.9 1.4.9 1.4-.9 1.4.9 1.4-.9 1.4.9 1.4-.9 1.4.9" />
        <path d="M3.5 13.5c.4 2.7 2.4 4.5 5.2 4.5h6.6c2.8 0 4.8-1.8 5.2-4.5" />
      </>
    ),
  },
  {
    id: "perras",
    label: "Perras",
    icon: (
      <>
        <path d="M3.5 11.5c.4 3.6 2.6 6.5 5.7 6.5h5.6c3.1 0 5.3-2.9 5.7-6.5z" />
        <path d="M4.5 9.2c1.3-1.4 2.6-1.4 3.9 0s2.6 1.4 3.9 0 2.6-1.4 3.9 0 2.3 1.2 3.3.4" />
        <path d="M9 11.5v2.2M12.5 11.5v3.2M16 11.5v1.8" />
      </>
    ),
  },
  {
    id: "salchipapas",
    label: "Salchipapas",
    icon: (
      <>
        <path d="M5.5 11h13l-1.5 8.7a1.6 1.6 0 0 1-1.6 1.3H8.6A1.6 1.6 0 0 1 7 19.7z" />
        <path d="M8.2 11l-.9-6.2M11.1 11l-.4-7M14 11l.5-6.6M16.8 11l1-5" />
        <circle cx="10.2" cy="15.6" r="1.4" />
        <circle cx="13.9" cy="16.4" r="1.4" />
      </>
    ),
  },
  {
    id: "chuzos",
    label: "Chuzos",
    icon: (
      <>
        <path d="M3.5 20.5L20.5 3.5" />
        <rect x="6" y="14" width="4" height="4" rx="1" transform="rotate(45 8 16)" />
        <rect x="10" y="10" width="4" height="4" rx="1" transform="rotate(45 12 12)" />
        <rect x="14" y="6" width="4" height="4" rx="1" transform="rotate(45 16 8)" />
      </>
    ),
  },
  {
    id: "patacones",
    label: "Patacones",
    icon: (
      <>
        <path d="M12 4.5c3.6-.3 6.9 1.9 7.4 5.2.6 3.5-1.5 7.3-5.3 8.5-3.8 1.3-8.2-.6-9.4-4.2C3.5 10.3 6.6 4.9 12 4.5z" />
        <path d="M8.8 10.4l2 1.4M13.6 8.8l.9 2M10.4 14.6l2.4.5M15.2 13.4l.4 1.6" />
      </>
    ),
  },
  {
    id: "arepa-rellena",
    label: "Arepa Rellena",
    icon: (
      <>
        <path d="M4 13.5a8 7 0 0 0 16 0z" />
        <path d="M5.3 9.6A8 7 0 0 1 18.4 7.5" />
        <path d="M4.6 11.8c1.4-.9 2.4.8 3.8 0s2.4-.9 3.8 0 2.4.8 3.8 0 2.2-.7 3.4 0" />
      </>
    ),
  },
  {
    id: "bebidas",
    label: "Bebidas",
    icon: (
      <>
        <path d="M6 4h12l-1 16H7z" />
        <path d="M8 8h8M14 4l2-2" />
      </>
    ),
  },
]

// Menu category ids (PRODUCTS[].cat) → product category names used in the admin
export const PRODUCT_CAT_LABEL: Record<string, string> = {
  hamburguesas: "Hamburguesas",
  perros: "Perros Calientes",
  perras: "Perras",
  salchipapas: "Salchipapas",
  chuzos: "Chuzos",
  patacones: "Patacones",
  "arepa-rellena": "Arepa Rellena",
}

// "Arepa Burger" was merged into "Arepa Rellena": products the database still lists under the
// old category are shown as Arepa Rellena (and saved that way on their next edit)
export const RENAMED_CATEGORIES: Record<string, string> = { "Arepa Burger": "Arepa Rellena" }

export const currentCategory = (name: string) => RENAMED_CATEGORIES[name] ?? name

// Resale sodas: each is a product of the category «Bebidas» named "Gaseosa <sabor> (<tamaño>)" (price, photo,
// no ficha técnica) and is bought as the insumo with that same name (its stock). The name matches the order line
// the store sends ("Gaseosa Manzana (1.5 L)").
export const SODA_RE = /^Gaseosa (.+) \((.+)\)$/

export const SODA_PRODUCT = "Bebidas"

// Stock mínimo a new soda starts with (each soda can change its own in its form)
export const SODA_LOW_STOCK = 3

export const isSodaName = (name: string | number | undefined) => SODA_RE.test(String(name ?? ""))

export const sodaImage = (name: string | number | undefined) => {
  const m = SODA_RE.exec(String(name ?? ""))
  return m ? beverageImage(m[1], m[2]) : undefined
}

// Backend category name → menu category id (inverse of PRODUCT_CAT_LABEL)
export const MENU_CAT_ID = Object.fromEntries(
  Object.entries(PRODUCT_CAT_LABEL).map(([id, label]) => [label, id]),
)

// Backend categories that feed the customization options instead of the menu
export const EXTRA_CATS = ["Adiciones", "Salsas", "Bebidas", "Sabores de bebida"]

// Photo of a soda by its name "Gaseosa <sabor> (<tamaño>)": the one uploaded for its product, else the bundled bottle
export const sodaPhoto = (name: string) => SODA_INFO.get(normalizeName(name))?.img || sodaImage(name) || ""
