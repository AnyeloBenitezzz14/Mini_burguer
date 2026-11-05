export type Review = {
  name: string
  // 1-5
  stars: number
  text: string
  // Where it was left, e.g. "Google" or "Instagram"
  source: string
  // What they ordered (shown as a small tag)
  dish: string
}

// SAMPLE REVIEWS: replace them with real ones (copied from Google Maps, Instagram...) and set this to false.
// While it is true the carousel only shows in development, so invented reviews never reach the published site.
export const REVIEWS_ARE_SAMPLE = true

export const REVIEWS: Review[] = [
  {
    name: "Laura M.",
    stars: 5,
    text: "La mini burger tradicional es otra cosa. Llegó caliente a la casa y la cebolla marinada es lo mejor.",
    source: "Google",
    dish: "Mini tradicional",
  },
  {
    name: "Andrés P.",
    stars: 5,
    text: "Vamos cada viernes con los amigos. Atienden rápido y el patacón ranchero es enorme.",
    source: "Google",
    dish: "Patacón ranchero",
  },
  {
    name: "Camila R.",
    stars: 4,
    text: "Muy rico todo y buen precio. El domicilio tardó un poco un sábado, pero valió la pena.",
    source: "Instagram",
    dish: "Domicilio",
  },
  {
    name: "Julián G.",
    stars: 5,
    text: "El parche de siempre en Bello. La salchipapa especial alcanza para compartir.",
    source: "Google",
    dish: "Salchipapa especial",
  },
  {
    name: "Valentina S.",
    stars: 5,
    text: "Pedí la triple pensando que no me la iba a comer toda… me la comí toda. Volveré.",
    source: "Instagram",
    dish: "Burger triple",
  },
  {
    name: "Don Hernán",
    stars: 5,
    text: "Los conozco desde que abrieron. Siguen con el mismo sabor y la misma buena atención.",
    source: "Google",
    dish: "Perro caliente",
  },
  {
    name: "Mateo L.",
    stars: 4,
    text: "Los chuzos de pollo bien jugosos. Me hubiera gustado más salsa de la casa, pero excelente.",
    source: "Google",
    dish: "Chuzo de pollo",
  },
  {
    name: "Sofía T.",
    stars: 5,
    text: "Hice el pedido por la página sin registrarme y fue facilísimo. La arepa rellena, una delicia.",
    source: "WhatsApp",
    dish: "Arepa rellena",
  },
]
