agranda un poco mas el logo en el iniciar sesion pero que eso no cause que tenga q hacer scroll y quita esos dibujos de las esquinas y deja el fondo solo beige .Añade también el siguiente requerimiento para la sección del Menú/Carta en la Landing Page:

SECCIÓN DE PRODUCTOS Y MENÚ EN LA LANDING PAGE:
Organiza la exhibición de los productos en un catálogo con cuadrícula (grid) de tarjetas estilo e-commerce, similar a la imagen de referencia compartida (tarjetas limpias con la imagen del producto arriba y una etiqueta/banner de color de la paleta del negocio en la base con el nombre).
Usa los nombres reales de los productos del menú del negocio (ej. Mini Burger, Salchipapas, Perro Caliente, Combos, Bebidas, etc.).
Estado Inicial de la Tarjeta (Limpio): La tarjeta solo debe mostrar la foto del producto y su nombre en el banner inferior. NO debe tener a la vista precio, descripción ni botón de "Agregar".
Estado Interactico (Hover / Clic): Al pasar el cursor o hacer clic sobre la tarjeta, debe activarse un efecto visual (superposición/hover fluido) que despliegue la información completa:
  * Precio actualizado.
  * Descripción corta de los ingredientes/producto.
  * Botón directo de "Agregar" al pedido o carrito.Integra también la base de datos real del menú del negocio (extraída de la carta oficial de "El Parche de las Mini Burgers") tanto para la Landing Page interactiva como para los paneles de Administración y Cliente:

ESTRUCTURA DE PRODUCTOS POR CATEGORÍAS (MENÚ OFICIAL):

HAMBURGUESAS:
Mini: $13.000 | Hamburguesa pequeña de la casa.
Sencilla: $14.500 | Carne de la casa, vegetales y salsas.
Tradicional: $16.000 | Carne, queso y tocineta.
Super Mini: $15.500 | Porción mediana especial.
Doble: $18.500 | Doble carne de la casa, queso y salsas.
Triple: $20.500 | Triple carne de la casa, queso y salsas.
Pollo: $17.500 | Pechuga de pollo, queso y salsas.
Mixta: $20.500 | Combinación de carne y pollo con queso.
Atún: $17.500 | Atún con queso y tocineta.

PERROS CALIENTES:
Mediano: $14.500 | Salchicha mediana, papitas fosforito y salsas.
Gran Perro: $15.500 | Salchicha grande, papitas y salsas.
Super Perro: $17.500 | Salchicha especial, tocineta, queso y salsas.

PERRAS:
Pequeña: $14.500 | Tocino/Tocineta, queso y salsas.
Gran Perra: $15.500 | Porción grande de tocineta, queso y salsas.
Super Perra: $17.600 | Tocineta extra, queso gratinado y salsas.

SALCHIPAPAS:
Sencilla: $13.000 | Papas a la francesa y salchicha.
Especial: $16.000 | Papas, salchicha, queso y tocineta.
Mega: $20.000 | Papas, salchicha, 3 huevos, 1 nugget, queso, carne de hamburguesa y tocineta.
Mega Gourmet: $23.000 | Papas, salchicha, 3 huevos, pollo, cerdo, jamón, maicitos y queso.
Mega Gourmet (Queso y Tocineta): $27.000 | Versión con extra de queso y tocineta gratinada.
Especial Gourmet Personal: $20.500 | Porción personal gourmet con carnes mixtas y maicitos.
Super Gourmet: $33.000 | Papas, salchicha, pollo, jamón, maicitos, queso, tocineta y carne desmechada.

CHUZOS (Incluyen Carne, Arepa, Ensalada y Papas):
Pollo: $19.000
Cerdo: $19.000

PATACONES (Incluyen Res, Pollo, Cerdo, Queso, Tocineta o Salchicha):
Mixto: $18.000
Ranchero: $18.000

AREPA BURGER:
Sencilla: $14.000
Especial: $15.000
Gourmet: $18.000
Desmechada: $18.000

AREPA RELLENA:
Pollo, Cerdo o Res: $18.000
Queso y Tocineta: $18.000

OPCIONES Y COMBOS GENERALES:
Combo con Papas (Aplica a Perros, Perras, Hamburguesas, Patacones y Arepas): +$8.000 COP adicionados al precio base del producto.
Adiciones generales: Queso, Ensalada, Tocineta, Carne, Salchicha, Cebolla ($8.000 c/u), 1 Huevo ($900), 5 Huevos ($4.000).
Nota de la casa: "Nuestra especialidad con cebollas marinadas".

REGLAS DE MUESTRA EN PANTALLAS:
Landing Page (Vista Cliente): Muestra estas tarjetas por categorías limpias (sin precio visible inicialmente). Al pasar el cursor o dar clic (hover/tap), despliega el precio, la descripción corta y el botón "Agregar al pedido".
Panel Admin: Los módulos de gestión de "Productos" y "Menú" deben precargarse con estas categorías y nombres reales para permitir su edición, cambio de estado (Disponible/Agotado) y eliminación.pon validaciones básicas que debe de tener las cosas.agregue un submodulo que se llame producto no conforme,id_producto_no_conforme	
id_orden
id_producto
cantidad
motivo	
accion
fecha
estado que tenga eso en el listado.en la vista de admin modo light el header y el side bar siguen en modo dark cambialo a light predeterminado y si lo cambian a dark si que cambie todo a dark y en el modo dark haz la letra del side bar blanca para q se note y cambia esa tipografia gruesa a una mas delgada y que en el header no diga otra vez el titulo del modulo ya que se ve muy redundante.Agrega el siguiente requerimiento técnico para el Módulo de Productos en la Vista Admin (tanto en el formulario de registro/edición como en el modal de "Ver detalle"):

GESTIÓN DE IMAGEN DEL PRODUCTO (MODAL Y FORMULARIOS):
En la tabla de Productos del Admin: Agrega una columna visual con la miniatura (thumbnail) de la imagen del producto junto al nombre.
En el Modal "Ver detalle": Incluye la previsualización centrada de la foto actual del producto en la parte superior del formulario antes del campo "Nombre".
En los Modales "Crear Producto" y "Editar Producto":
  * Incluye un campo obligatorio de "Imagen del producto".
  * Debe permitir subir archivos locales mediante un contenedor de tipo drag-and-drop / selector de archivos (con soporte para formatos PNG, JPG y WEBP) o mediante la inserción de una URL de imagen.
  * Muestra una vista previa en tiempo real de la imagen cargada antes de guardar los cambios.en la vista del cliente elimina es de oferta del dia en el banner tambien ese banner se ve la imagen cortada.Implementa un catálogo de menú interactivo para "El Parche de las Mini Burgers" con navegación por categorías y scroll suave, adaptado a la imagen de referencia y con la identidad visual del negocio:

BARRA DE NAVEGACIÓN SUPERIOR POR CATEGORÍAS (TABS/ANCHORS):
Estructura Fija / Sticky Bar: Coloca una barra horizontal en la parte superior que permanezca visible al hacer scroll.
Ítems de Categoría: Cada categoría debe tener una imagen circular pequeña encima del texto.
Categorías Reales del Negocio:
     * Hamburguesas
     * Perros Calientes
     * Perras
     * Salchipapas
     * Chuzos
     * Patacones
     * Arepa Burger
     * Arepa Rellena
Comportamiento Interactivo (Smooth Scroll):
     * Al hacer clic en cualquiera de las categorías superiores, la página debe hacer un desplazamiento suave (scroll-behavior: smooth) hacia la sección correspondiente más abajo en la pantalla.
     * La categoría activa debe resaltarse con un indicador de color dorado/mostaza (línea inferior de activo) y texto en negrita.

PALETA DE COLORES E IDENTIDAD VISUAL CORPORATIVA:
Fondo: Tono crema suave / beige claro (#F9F5EC).
Acentos y Botones Interactivos: Dorado / Mostaza corporativo (#B8860B o similar).
Textos: Encabezados en tono café oscuro/negro suave para asegurar contraste legibilidad limpia.

TARJETAS DE PRODUCTOS EN LA LISTA:
Distribución: Cuadrícula responsive de 3 columnas en escritorio y 1 columna en móvil.
Estructura de cada Tarjeta:
     * Lado Izquierdo: Fotografía de alta calidad del producto en un contenedor limpio, con un botón flotante "+" de color dorado/mostaza en la esquina inferior de la imagen para agregar directamente al pedido.
     * Lado Derecho: 
Nombre del producto en negrita (ej. "Mini", "Super Gourmet", "Ranchero").
Descripción detallada de los ingredientes (ej. "Papas, salchicha, 3 huevos, pollo, cerdo, jamón, maicitos, queso...").
Precio formateado en moneda local COP en color dorado o resaltado (ej. $13.000, $33.000).

BASE DE DATOS DE PRODUCTOS Y PRECIOS REALES PARA CARGAR EN EL MENÚ:
Hamburguesas: Mini ($13.000), Sencilla ($14.500), Super Mini ($15.500), Tradicional ($16.000), Pollo ($17.500), Atún ($17.500), Doble ($18.500), Triple ($20.500), Mixta ($20.500).
Perros Calientes: Mediano ($14.500), Gran Perro ($15.500), Super Perro ($17.500).
Perras: Pequeña ($14.500), Gran Perra ($15.500), Super Perra ($17.600).
Salchipapas: Sencilla ($13.000), Especial ($16.000), Mega ($20.000), Especial Gourmet Personal ($20.500), Mega Gourmet ($23.000), Mega Gourmet Queso y Tocineta ($27.000), Super Gourmet ($33.000).
Chuzos (incluyen carne, arepa, ensalada y papas): Pollo ($19.000), Cerdo ($19.000).
Patacones (incluyen res, pollo, cerdo, queso, tocineta o salchicha): Mixto ($18.000), Ranchero ($18.000).
Arepa Burger: Sencilla ($14.000), Especial ($15.000), Gourmet ($18.000), Desmechada ($18.000).
Arepa Rellena: Pollo, Cerdo o Res ($18.000), Queso y Tocineta ($18.000).
Opción Adicional Globat: Incluir un switch o selector de "Agregar Combo con Papas (+$8.000)".cuida que las imagenes no se corten sino q aparezcan completas y coincidan con los productos y tambien que el logo de la vista de admin se vea mas grande ya que esta demasiado chiquito y que el buscador funcione y que este en el header y que sea mas corto no tan largo y esos iconos al fondo de la aplicacion no son de pagina web pon el carrito de compras en el header el perfil quitalo de ahi de abajo ya que ya esta en la parte superior y quita ese inicio de ahi y lo pedidos que tambien se vean en la parte superior no quiero nada abajo ya que  no es version movil sino web