import traditionalBurgerImg from "@/imports/traditional-burger.png"
import { ADDITIONS, BEVERAGES, BEVERAGE_ORDER, BEVERAGE_SIZES, EXTRA_CATS, MENU_CAT_ID, MENU_EXTRAS, PRODUCTS, SAUCES, SODA_INFO, SODA_RE, allMenuProducts, beverageImage, currentCategory, sizeMl } from "@/features/menu/data/products"
import { api, imageUrl } from "@/shared/services/api"
import type { CartItem, CatalogItem } from "@/shared/types"
import { fmt, normalizeName } from "@/shared/utils/format"

// shortcut: replaces the menu arrays in place so every screen reading them shows the backend data;
// move them into state/context when the admin panel edits them live.
export async function loadMenu() {
  const items = await api<CatalogItem[]>("/catalogo")
  const activeItems = items
    .map((item) => ({ ...item, categoria: currentCategory(item.categoria) }))
    .filter(
      (item) => !["INACTIVO", "INACTIVA", "ANULADO", "ANULADA"].includes(String(item.estado ?? "").trim().toUpperCase()),
    )
  const inCat = (cat: string) => activeItems.filter((p) => p.categoria === cat)
  ADDITIONS.splice(0, ADDITIONS.length, ...inCat("Adiciones").map((p) => ({ name: p.nombre, price: p.precio })))
  SAUCES.splice(0, SAUCES.length, ...inCat("Salsas").map((p) => p.nombre))
  const rank = (f: string) => (BEVERAGE_ORDER.indexOf(f) + 1 || 99)
  // Each soda is a product of «Bebidas» named "Gaseosa <sabor> (<tamaño>)": flavours, sizes, prices and photos come from them
  // (other drinks there, without that name, aren't offered as sodas)
  const sodaProducts = inCat("Bebidas").flatMap((p) => {
    const m = SODA_RE.exec(p.nombre.trim())
    return m ? [{ name: p.nombre, flavor: m[1], size: m[2], price: p.precio, img: p.imagenes[0] ? imageUrl(p.imagenes[0]) : "" }] : []
  })
  // Bought sodas with no stock left (an older backend without this route sells them all)
  const soldOut = new Set(
    (await api<{ nombre: string; agotada: boolean }[]>("/catalogo/gaseosas").catch(() => []))
      .filter((g) => g.agotada)
      .map((g) => normalizeName(g.nombre)),
  )
  SODA_INFO.clear()
  if (sodaProducts.length) {
    sodaProducts.forEach((s) =>
      SODA_INFO.set(normalizeName(`Gaseosa ${s.flavor} (${s.size})`), { precio: s.price, img: s.img, agotada: soldOut.has(normalizeName(s.name)) }),
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
      const isTraditionalBurger = normalizeName(p.nombre) === normalizeName("Tradicional")
      return {
        id: p.id,
        name: p.nombre,
        desc: p.descripcion || "",
        price: p.precio,
        priceStr: fmt(p.precio),
        img: isTraditionalBurger
          ? traditionalBurgerImg
          : imageUrl(p.imagenes[0]) || fallbackProduct?.img || "",
        cat: MENU_CAT_ID[currentCategory(p.categoria)] || p.categoria.toLowerCase(),
        badge: p.etiqueta || "",
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
