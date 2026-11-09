import type { CartItem } from "@/shared/types"

// Adds an item to the cart; if the same product with the same sauces and additions is
// already there, only its quantity goes up
export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const key = (i: CartItem) =>
    JSON.stringify([
      i.name,
      [...(i.sauces ?? [])].sort(),
      [...(i.additions ?? [])].map((a) => `${a.name}x${a.qty}`).sort(),
      i.note?.trim() ?? "",
    ])
  const same = items.find((i) => key(i) === key(item))
  return same ? items.map((i) => (i === same ? { ...i, qty: i.qty + item.qty } : i)) : [...items, item]
}

export const itemTotal = (i: CartItem) =>
  (i.price + (i.additions?.reduce((a, b) => a + b.qty * b.price, 0) ?? 0)) *
  i.qty

export const cartTotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + itemTotal(i), 0)

export const activeCartItemsFirst = (items: CartItem[]) => [
  ...items.filter((item) => item.qty > 0),
  ...items.filter((item) => item.qty === 0),
]
