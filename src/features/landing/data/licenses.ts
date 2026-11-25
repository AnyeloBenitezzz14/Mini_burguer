// Licencias de software y tecnologías que usa el aplicativo (frontend Mini_burguer y backend parche-backend).
// Versiones y licencias tomadas de cada package.json instalado; enlaces a la licencia o los términos oficiales.
// Al agregar o actualizar una dependencia, actualiza aquí su entrada.

export type LicenseClass =
  | "Código abierto permisivo"
  | "Código abierto con copyleft"
  | "Software propietario"
  | "Estándar abierto"
  | "Servicio en la nube"

export type Technology = {
  name: string
  // Version in use (empty for standards and services)
  version?: string
  license: string
  description: string
  classification: LicenseClass
  url: string
}

export type LicenseGroup = { title: string; intro: string; items: Technology[] }

const MIT = "Permite usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y vender el software, también con fines comerciales, siempre que se conserve el aviso de copyright y de la licencia. Se entrega sin garantía."

export const LICENSE_GROUPS: LicenseGroup[] = [
  {
    title: "Tecnologías principales",
    intro: "Lenguajes, estándares y plataformas sobre los que está construido el aplicativo.",
    items: [
      {
        name: "HTML",
        license: "HTML Living Standard (WHATWG)",
        description: "Estándar abierto para estructurar páginas web. Cualquiera puede implementarlo y usarlo sin pagar regalías; el texto de la especificación se publica bajo Creative Commons Attribution 4.0.",
        classification: "Estándar abierto",
        url: "https://html.spec.whatwg.org/multipage/",
      },
      {
        name: "CSS",
        license: "Recomendaciones W3C · Licencia de documentos W3C",
        description: "Estándar abierto para el diseño visual de la web. Su uso e implementación son libres y sin regalías; los documentos de la especificación pueden copiarse y distribuirse citando al W3C.",
        classification: "Estándar abierto",
        url: "https://www.w3.org/copyright/document-license-2023/",
      },
      {
        name: "JavaScript (ECMAScript)",
        license: "Estándar ECMA-262",
        description: "Lenguaje del frontend y del backend, definido por Ecma International. El estándar es público y gratuito; cualquiera puede implementarlo y escribir programas con él sin restricciones de licencia.",
        classification: "Estándar abierto",
        url: "https://ecma-international.org/publications-and-standards/standards/ecma-262/",
      },
      {
        name: "TypeScript",
        version: "5.9.3",
        license: "Apache License 2.0",
        description: "Permite usar, modificar, distribuir y comercializar el software, incluso en productos cerrados, conservando los avisos de copyright y de cambios. Además concede una licencia de patentes a los usuarios.",
        classification: "Código abierto permisivo",
        url: "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt",
      },
      {
        name: "React y React DOM",
        version: "19.3.0",
        license: "MIT",
        description: `Biblioteca de la interfaz del cliente y del panel. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/facebook/react/blob/main/LICENSE",
      },
      {
        name: "Node.js",
        version: "24",
        license: "MIT",
        description: `Entorno que ejecuta el backend. ${MIT} Incluye componentes de terceros con sus propias licencias permisivas.`,
        classification: "Código abierto permisivo",
        url: "https://github.com/nodejs/node/blob/main/LICENSE",
      },
      {
        name: "PostgreSQL",
        license: "PostgreSQL License",
        description: "Motor de la base de datos. Licencia permisiva similar a BSD/MIT: permite usar, copiar, modificar y distribuir el software para cualquier fin, también comercial, sin pagar, conservando el aviso de copyright.",
        classification: "Código abierto permisivo",
        url: "https://www.postgresql.org/about/licence/",
      },
    ],
  },
  {
    title: "Frameworks y herramientas de desarrollo",
    intro: "Con qué se construye, se prueba y se publica el aplicativo. La mayoría solo se usa al desarrollar.",
    items: [
      {
        name: "Express",
        version: "4.22.3",
        license: "MIT",
        description: `Framework del API del backend. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/expressjs/express/blob/master/LICENSE",
      },
      {
        name: "Vite",
        version: "8.3.0",
        license: "MIT",
        description: `Servidor de desarrollo y empaquetador del frontend. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/vitejs/vite/blob/main/LICENSE",
      },
      {
        name: "@vitejs/plugin-react",
        version: "6.1.1",
        license: "MIT",
        description: `Integra React con Vite. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/vitejs/vite-plugin-react/blob/main/LICENSE",
      },
      {
        name: "Tailwind CSS y @tailwindcss/vite",
        version: "4.3.3",
        license: "MIT",
        description: `Estilos de toda la interfaz. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE",
      },
      {
        name: "Definiciones de tipos (@types/react, @types/react-dom, @types/node)",
        version: "19.3.0 · 22.20.4",
        license: "MIT",
        description: `Tipos de TypeScript del proyecto DefinitelyTyped. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE",
      },
      {
        name: "oxfmt",
        version: "0.2.0",
        license: "MIT",
        description: `Formateador del código del frontend (proyecto Oxc). ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/oxc-project/oxc/blob/main/LICENSE",
      },
      {
        name: "Nodemon",
        version: "3.1.14",
        license: "MIT",
        description: `Reinicia el backend al guardar cambios durante el desarrollo. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/remy/nodemon/blob/main/LICENSE",
      },
      {
        name: "Jest",
        version: "29.7.0",
        license: "MIT",
        description: `Pruebas automáticas del backend. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/jestjs/jest/blob/main/LICENSE",
      },
      {
        name: "Supertest",
        version: "7.3.1",
        license: "MIT",
        description: `Prueba las rutas del API en las pruebas automáticas. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/ladjs/supertest/blob/master/LICENSE",
      },
      {
        name: "npm CLI",
        version: "11.9.0",
        license: "Artistic License 2.0",
        description: "Instala las dependencias del backend. Permite usar, copiar y distribuir el programa, también con fines comerciales; quien distribuya una versión modificada debe publicar sus cambios o cambiarle el nombre para no confundirla con la original (copyleft débil).",
        classification: "Código abierto con copyleft",
        url: "https://github.com/npm/cli/blob/latest/LICENSE",
      },
      {
        name: "pnpm",
        license: "MIT",
        description: `Instala las dependencias del frontend al publicarlo en Vercel. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/pnpm/pnpm/blob/main/LICENSE",
      },
      {
        name: "Git",
        version: "2.53",
        license: "GNU GPL v2",
        description: "Control de versiones del código. Permite usarlo, estudiarlo, modificarlo y distribuirlo; quien distribuya Git o una versión modificada debe hacerlo con su código fuente y bajo la misma licencia. Usarlo no impone la GPL al código del aplicativo.",
        classification: "Código abierto con copyleft",
        url: "https://git-scm.com/about/free-and-open-source",
      },
      {
        name: "Visual Studio Code",
        license: "Licencia de software de Microsoft",
        description: "Editor de código. Es gratuito, incluso para uso comercial, pero la descarga oficial de Microsoft es propietaria: no se puede redistribuir ni modificar. Su código base (Code - OSS) se publica aparte bajo MIT.",
        classification: "Software propietario",
        url: "https://code.visualstudio.com/license",
      },
    ],
  },
  {
    title: "Librerías y dependencias",
    intro: "Paquetes que forman parte del aplicativo en funcionamiento.",
    items: [
      {
        name: "node-postgres (pg)",
        version: "8.23.1",
        license: "MIT",
        description: `Conecta el backend con PostgreSQL. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/brianc/node-postgres/blob/master/LICENSE",
      },
      {
        name: "jsonwebtoken",
        version: "9.0.3",
        license: "MIT",
        description: `Crea y verifica los tokens de inicio de sesión. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/auth0/node-jsonwebtoken/blob/master/LICENSE",
      },
      {
        name: "bcryptjs",
        version: "2.4.3",
        license: "BSD-3-Clause (incluye isaac.js bajo MIT)",
        description: "Cifra las contraseñas. Permite usar, modificar y distribuir el código, también comercialmente, conservando el aviso de copyright y sin usar el nombre de los autores para promocionar productos derivados. Su package.json declara MIT; el archivo de licencia de esta versión es BSD-3-Clause.",
        classification: "Código abierto permisivo",
        url: "https://github.com/dcodeIO/bcrypt.js/blob/2.4.3/LICENSE",
      },
      {
        name: "Zod",
        version: "4.6.7",
        license: "MIT",
        description: `Valida los datos que llegan al API. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/colinhacks/zod/blob/main/LICENSE",
      },
      {
        name: "CORS",
        version: "2.8.6",
        license: "MIT",
        description: `Controla qué sitios pueden llamar al API. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/expressjs/cors/blob/master/LICENSE",
      },
      {
        name: "Helmet",
        version: "7.2.0",
        license: "MIT",
        description: `Agrega cabeceras de seguridad HTTP. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/helmetjs/helmet/blob/main/LICENSE",
      },
      {
        name: "Morgan",
        version: "1.12.1",
        license: "MIT",
        description: `Registra las peticiones que recibe el API. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/expressjs/morgan/blob/master/LICENSE",
      },
      {
        name: "dotenv",
        version: "16.6.1",
        license: "BSD-2-Clause",
        description: "Carga la configuración del backend desde variables de entorno. Permite usar, modificar y distribuir el código, también comercialmente, conservando el aviso de copyright y la exención de garantía.",
        classification: "Código abierto permisivo",
        url: "https://github.com/motdotla/dotenv/blob/master/LICENSE",
      },
      {
        name: "Multer",
        version: "2.5.0",
        license: "MIT",
        description: `Recibe las imágenes que se suben al backend. ${MIT}`,
        classification: "Código abierto permisivo",
        url: "https://github.com/expressjs/multer/blob/main/LICENSE",
      },
      {
        name: "Nodemailer",
        version: "10.3.0",
        license: "MIT No Attribution (MIT-0)",
        description: "Envía los correos al cliente (códigos, contraseñas y estado del pedido). Igual que MIT pero sin exigir que se conserve el aviso de copyright: se puede usar, modificar, distribuir y vender libremente.",
        classification: "Código abierto permisivo",
        url: "https://github.com/nodemailer/nodemailer/blob/master/LICENSE",
      },
      {
        name: "Cloudinary SDK para Node.js",
        version: "2.11.0",
        license: "MIT",
        description: `Biblioteca con la que el backend sube las imágenes a Cloudinary. ${MIT} La licencia cubre el SDK; el uso del servicio se rige por los términos de Cloudinary.`,
        classification: "Código abierto permisivo",
        url: "https://github.com/cloudinary/cloudinary_npm/blob/master/LICENSE",
      },
      {
        name: "Tesseract.js",
        version: "5.1.1",
        license: "Apache License 2.0",
        description: "Lee el texto de la imagen del comprobante de pago para revisar que sea una transferencia. Permite usar, modificar, distribuir y comercializar el software conservando los avisos, e incluye una licencia de patentes.",
        classification: "Código abierto permisivo",
        url: "https://github.com/naptha/tesseract.js/blob/master/LICENSE.md",
      },
      {
        name: "Motor Tesseract OCR y su modelo en español",
        license: "Apache License 2.0",
        description: "Motor de reconocimiento de texto que usa Tesseract.js (compilado a WebAssembly) y sus datos de idioma. Mismos permisos de Apache 2.0: uso, modificación, distribución y comercialización con atribución.",
        classification: "Código abierto permisivo",
        url: "https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE",
      },
      {
        name: "Fuentes tipográficas (Outfit, Barlow Condensed, League Spartan, Montserrat, Poppins, Anton, Alfa Slab One, Maname y Roboto Condensed)",
        license: "SIL Open Font License 1.1",
        description: "Permite usar las fuentes gratis en sitios web, documentos y productos comerciales, y modificarlas. Las fuentes no pueden venderse solas, y una versión modificada debe distribuirse con la misma licencia (copyleft débil).",
        classification: "Código abierto con copyleft",
        url: "https://openfontlicense.org/",
      },
    ],
  },
  {
    title: "Servicios en la nube",
    intro: "Servicios de terceros que usa el aplicativo. No son software con licencia propia: su uso se rige por los términos de cada proveedor.",
    items: [
      {
        name: "Neon",
        license: "Términos de servicio",
        description: "Aloja la base de datos PostgreSQL (plataforma como servicio, PaaS). Modelo freemium: plan gratuito con límites y planes de pago. El motor sigue siendo PostgreSQL de código abierto; el servicio de Neon es comercial.",
        classification: "Servicio en la nube",
        url: "https://neon.com/terms-of-service",
      },
      {
        name: "Cloudinary",
        license: "Términos de servicio",
        description: "Guarda y entrega las imágenes de productos (software como servicio, SaaS). Modelo freemium con plan gratuito limitado. Sus condiciones de uso son distintas de la licencia MIT de su SDK.",
        classification: "Servicio en la nube",
        url: "https://cloudinary.com/tos",
      },
      {
        name: "Vercel",
        license: "Términos de servicio",
        description: "Publica el frontend en internet (plataforma como servicio, PaaS). Modelo freemium; el plan gratuito (Hobby) es para uso personal y no comercial, y el uso comercial requiere un plan de pago.",
        classification: "Servicio en la nube",
        url: "https://vercel.com/legal/terms",
      },
      {
        name: "GitHub",
        license: "Términos de servicio",
        description: "Aloja los repositorios del código y las solicitudes de cambios (SaaS de Microsoft). Modelo freemium. El código de los repositorios conserva su propia licencia.",
        classification: "Servicio en la nube",
        url: "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
      },
      {
        name: "Gmail (envío de correos)",
        license: "Términos de servicio de Google",
        description: "Cuenta desde la que el backend envía los correos por SMTP. Servicio gratuito sujeto a los términos y límites de envío de Google.",
        classification: "Servicio en la nube",
        url: "https://policies.google.com/terms",
      },
      {
        name: "Google Fonts",
        license: "Términos de las API de Google",
        description: "Entrega las fuentes tipográficas al navegador. El servicio es gratuito y se rige por los términos de Google; las fuentes en sí tienen la licencia SIL Open Font License.",
        classification: "Servicio en la nube",
        url: "https://developers.google.com/fonts/terms",
      },
      {
        name: "OpenStreetMap · Nominatim",
        license: "Política de uso de Nominatim · Datos ODbL",
        description: "Ubica la dirección de entrega en el mapa. Servicio gratuito con límites de uso (máximo una petición por segundo); los datos de OpenStreetMap tienen licencia ODbL y deben citarse.",
        classification: "Servicio en la nube",
        url: "https://operations.osmfoundation.org/policies/nominatim/",
      },
      {
        name: "jsDelivr",
        license: "Términos de servicio",
        description: "Red de distribución (CDN) gratuita desde la que el navegador descarga el lector de Tesseract y su modelo en español.",
        classification: "Servicio en la nube",
        url: "https://www.jsdelivr.com/terms",
      },
    ],
  },
]
