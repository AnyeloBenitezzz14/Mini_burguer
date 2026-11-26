import traditionalBurgerImg from "@/imports/burguer tradicional.jpg"
import miniBurgerImg from "@/imports/hamburguesa mini.jpg"
import superMiniBurgerImg from "@/imports/burguer-super-mini.png"
import simpleBurgerImg from "@/imports/burguer-sencilla.png"
import doubleBurgerImg from "@/imports/burguer-doble.png"
import chickenBurgerImg from "@/imports/burguer-de-pollo.png"
import mixedBurgerImg from "@/imports/burguer-mixta.png"
import tripleBurgerImg from "@/imports/burguer-triple.png"
import arepaGourmetImg from "@/imports/arepa rellena.jpg"
import arepaSencillaImg from "@/imports/arepa-sencilla.png"
import arepaEspecialImg from "@/imports/arepa-especial.png"
import arepaDesmechadaImg from "@/imports/arepa-desmechada.png"
import pataconMixtoImg from "@/imports/patacon-mixto.png"
import pataconRancheroImg from "@/imports/patacon-ranchero.png"
import chuzoDeCerdoImg from "@/imports/chuzo-de-cerdo.png"
import chuzoDePolloImg from "@/imports/chuzo de pollo.jpg"
import superPerroImg from "@/imports/super-perro.png"
import specialSalchipapaImg from "@/imports/salchipapas especial.png"
import simpleSalchipapaImg from "@/imports/salchipapa-sencilla.png"
import specialGourmetImg from "@/imports/especial gourmet.png"
import personalGourmetImg from "@/imports/gourmet-personal.png"
import superGourmetImg from "@/imports/super gourmet.jpg"
import megaTraditionalImg from "@/imports/megatradicional.jpg"
import granPerroImg from "@/imports/perro.jpg"
import mediumHotDogImg from "@/imports/perro-mediano.png"
import granPerraImg from "@/imports/gran-perra.png"
import perraPequenaImg from "@/imports/perra-pequena.png"
import superPerraImg from "@/imports/perra.jpg"
import { ADDITIONS, BEVERAGES, BEVERAGE_ORDER, BEVERAGE_SIZES, EXTRA_CATS, MENU_CAT_ID, MENU_EXTRAS, PRODUCTS, SAUCES, SODA_INFO, SODA_RE, allMenuProducts, beverageImage, currentCategory, sizeMl } from "@/features/menu/data/products"
import { api, imageUrl } from "@/shared/services/api"
import type { CartItem, CatalogItem } from "@/shared/types"
import { fmt, normalizeName } from "@/shared/utils/format"

const localProductImages = new Map([
  ["tradicional", traditionalBurgerImg],
  ["mini", miniBurgerImg],
  ["super mini", superMiniBurgerImg],
  ["sencilla", simpleBurgerImg],
  ["doble", doubleBurgerImg],
  ["pollo", chickenBurgerImg],
  ["mixta", mixedBurgerImg],
  ["triple", tripleBurgerImg],
  ["super perro", superPerroImg],
  ["salchipapa especial", specialSalchipapaImg],
  ["salchipapa sencilla", simpleSalchipapaImg],
  ["salchipapa gourmet personal", personalGourmetImg],
  ["especial gourmet personal", personalGourmetImg],
  ["salchipapa especial gourmet personal", personalGourmetImg],
  ["especial gourmet", personalGourmetImg],
  ["salchipapa especial gourmet", personalGourmetImg],
  ["salchipapa super gourmet", superGourmetImg],
  ["salchipapa mega gourmet", specialGourmetImg],
  ["mega gourmet", specialGourmetImg],
  ["salchipapa mega", megaTraditionalImg],
  ["salchipapa mega tradicional", megaTraditionalImg],
  ["mega tradicional", megaTraditionalImg],
  ["gran perro", granPerroImg],
  ["perro mediano", mediumHotDogImg],
  ["gran perra", granPerraImg],
  ["perra pequena", perraPequenaImg],
  ["super perra", superPerraImg],
  ["arepa gourmet", arepaGourmetImg],
  ["arepa sencilla", arepaSencillaImg],
  ["arepa especial", arepaEspecialImg],
  ["arepa desmechada", arepaDesmechadaImg],
  ["patacon mixto", pataconMixtoImg],
  ["patacon ranchero", pataconRancheroImg],
  ["chuzo de cerdo", chuzoDeCerdoImg],
  ["chuzo de pollo", chuzoDePolloImg],
])

const retiredArepas = /^(?:arepa )?rellena (?:pollo\s*\/\s*res|q\s*\+\s*tocineta)$/

// shortcut: replaces the menu arrays in place so every screen reading them shows the backend data;
// move them into state/context when the admin panel edits them live.
export async function loadMenu() {
  const items = await api<CatalogItem[]>("/catalogo")
  const activeItems = items
    .map((item) => ({ ...item, categoria: currentCategory(item.categoria) }))
    .filter(
      (item) => !["INACTIVO", "INACTIVA", "ANULADO", "ANULADA"].includes(String(item.estado ?? "").trim().toUpperCase()),
    )
    .filter((item) => !retiredArepas.test(normalizeName(item.nombre)))
  const inCat = (cat: string) => activeItems.filter((p) => p.categoria === cat)
  SAUCES.splice(0, SAUCES.length, ...inCat("Salsas").map((p) => p.nombre))
  const rank = (f: string) => (BEVERAGE_ORDER.indexOf(f) + 1 || 99)
  // Each soda is a product of «Bebidas» named "Gaseosa <sabor> (<tamaño>)": flavours, sizes, prices and photos come from them
  // (other drinks there, without that name, aren't offered as sodas)
  const sodaProducts = inCat("Bebidas").flatMap((p) => {
    const m = SODA_RE.exec(p.nombre.trim())
    return m ? [{ name: p.nombre, flavor: m[1], size: m[2], price: p.precio, img: p.imagenes[0] ? imageUrl(p.imagenes[0]) : "" }] : []
  })
  // Bought sodas with no stock left (an older backend without this route sells them all)
  const sodaStock = await api<{ nombre: string; agotada: boolean; stock?: number }[]>("/catalogo/gaseosas").catch(() => [])
  const soldOut = new Set(sodaStock.filter((g) => g.agotada).map((g) => normalizeName(g.nombre)))
  const stockOf = new Map(sodaStock.map((g) => [normalizeName(g.nombre), g.stock]))
  // The route also brings the additions' stock (they are bought in Compras like the sodas)
  ADDITIONS.splice(0, ADDITIONS.length, ...inCat("Adiciones").map((p) => ({ name: p.nombre, price: p.precio, stock: stockOf.get(normalizeName(p.nombre)) })))
  SODA_INFO.clear()
  if (sodaProducts.length) {
    sodaProducts.forEach((s) =>
      SODA_INFO.set(normalizeName(`Gaseosa ${s.flavor} (${s.size})`), { precio: s.price, img: s.img, agotada: soldOut.has(normalizeName(s.name)), stock: stockOf.get(normalizeName(s.name)) }),
    )
    BEVERAGES.splice(0, BEVERAGES.length, ...[...new Set(sodaProducts.map((s) => s.flavor))].sort((a, b) => rank(a) - rank(b)))
    // Size buttons from small to big, each showing its cheapest soda
    const sizes = [...new Set(sodaProducts.map((s) => s.size))].sort((a, b) => sizeMl(a) - sizeMl(b))
    BEVERAGE_SIZES.splice(
      0,
      BEVERAGE_SIZES.length,
      ...sizes.map((size) => ({ id: size, label: size, price: Math.min(...sodaProducts.filter((s) => s.size === size).map((s) => s.price)) })),
    )
  } else {
    // No sodas for sale: the Bebidas tab says so
    BEVERAGES.splice(0, BEVERAGES.length)
  }
  MENU_EXTRAS.splice(
    0,
    MENU_EXTRAS.length,
    ...activeItems
      .filter((item) => ["Adiciones", "Salsas", "Bebidas"].includes(item.categoria))
      .map((item) => {
        const soda = item.categoria === "Bebidas" ? SODA_RE.exec(item.nombre.trim()) : null
        return {
          id: item.id,
          name: item.nombre,
          desc: item.descripcion || "",
          price: item.precio,
          priceStr: fmt(item.precio),
          img: imageUrl(item.imagenes[0]) || (soda ? beverageImage(soda[1], soda[2]) || "" : ""),
          cat: normalizeName(item.categoria).replace(/\s+/g, "-"),
          badge: item.etiqueta || "",
          soldOut: !!soda && soldOut.has(normalizeName(item.nombre)),
        }
      }),
  )
  PRODUCTS.splice(
    0,
    PRODUCTS.length,
    ...activeItems.filter((p) => !EXTRA_CATS.includes(p.categoria)).map((p) => {
      const fallbackProduct =
        PRODUCTS.find((product) => product.id === p.id) ??
        PRODUCTS.find((product) => normalizeName(product.name) === normalizeName(p.nombre))
      const name = normalizeName(p.nombre) === "arepa rellena" ? "Arepa Gourmet" : p.nombre
      const productName = normalizeName(name)
      const localImage = localProductImages.get(productName)
      return {
        id: p.id,
        name,
        desc: p.descripcion || "",
        price: p.precio,
        priceStr: fmt(p.precio),
        img: localImage || imageUrl(p.imagenes[0]) || fallbackProduct?.img || "",
        cat: MENU_CAT_ID[currentCategory(p.categoria)] || p.categoria.toLowerCase(),
        badge: p.etiqueta || "",
        ingredients: p.ingredientes ?? [],
      }
    }),
  )
}

export const refreshCartProducts = (items: CartItem[]) => {
  const products = allMenuProducts()
  return items.flatMap((item) => {
    const product =
      products.find((candidate) => candidate.id === item.productId) ??
      products.find((candidate) => candidate.name === item.name) ??
      products.find((candidate) => candidate.name === `Hamburguesa ${item.name}`)
    if (!product) return []
    return [{
      ...item,
      productId: product.id,
      name: product.name,
      description: product.desc,
      price: product.price,
      img: product.img,
      additions: item.additions?.map((addition) => {
        const currentAddition = ADDITIONS.find((candidate) => candidate.name === addition.name)
        return currentAddition ? { ...addition, price: currentAddition.price } : addition
      }),
    }]
  })
}
