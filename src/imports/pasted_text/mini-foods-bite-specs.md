Actúa como un Arquitecto de Software y Desarrollador Full-Stack Senior. Necesito diseñar y estructurar la plataforma web y móvil "Mini-Foods bite" para el establecimiento de comidas rápidas "El Parche de la Mini Burguer" (ubicado en Bello, Antioquia).

Ten en cuenta minuciosamente las siguientes especificaciones técnicas, reglas de negocio y alcance modular extraídos de la Ficha Técnica del Proyecto:

ARQUITECTURA GENERAL Y PERFILES:
Aplicativo Web (Panel de Administración completo) y Aplicativo Móvil (Optimizado para consultas operativas, cambio de estados y toma de registros rápidos).
Módulo de Configuración y Seguridad:
     * Gestión de Roles y Permisos (crear, consultar, actualizar, anular, cambiar estado).
     * Gestión de Usuarios y Accesos (Login, Logout, Recuperar Contraseña, Perfil y Configuración de Temas de UI).
     * Gestión de Clientes (CRUD y cambio de estado).

MÓDULO DE COMPRAS E INVENTARIO:
Categorías de Insumos (CRUD).
Gestión de Insumos: Control de stock actual, stock mínimo y stock máximo. Incremento mediante Registro de Compras y decremento automático según órdenes de producción/ventas. Exportación de datos.
Proveedores: Vinculados a categorías de insumos. Validación: No se permite eliminar si tienen compras asociadas (solo cambio de estado Activo/Inactivo).
Registro de Compras: Crear, consultar y anular compras con detalle de insumos, cantidades y costos.
Pérdida de Insumos: Módulo para registrar, consultar, anular y exportar bajas de insumos (vencimiento/deterioro).

MÓDULO DE PRODUCCIÓN (MANDATORIO):
Categorías de Productos y Productos: Menú/carta ofrecida, características, precios y estado/disponibilidad.
Fichas Técnicas Versionadas: Registro e historial de ingredientes y cantidades por producto. Permite descontar del stock de insumos los ingredientes necesarios al iniciar la producción.
Órdenes de Producción:
     * Tipo 1: Producción Interna (elaboración de insumos intermedios para la carta).
     * Tipo 2: Producción por Pedido/Venta (generadas automáticamente al registrar un pedido).
     * REGLA DE NEGOCIO: Si el pedido supera los $150.000 COP, la orden de producción NO se crea automáticamente; requiere aprobación previa del perfil Administrador.
     * REGLA PEPS: Método "Primero en entrar, primero en salir" estricto para consumo de insumos y cola de trabajo.
     * TIEMPOS: El sistema debe calcular el tiempo aproximado de disponibilidad sumando tiempo de preparación + tiempo de empaque y despacho.
Producto No Conforme: NO debe crearse como un módulo aparte en la barra de navegación (Navbar). Se debe gestionar directamente como un ESTADO dentro de la Orden de Producción.

MÓDULO DE VENTAS Y POSTVENTA:
Pedidos: Registro, consulta, seguimiento en tiempo real del estado (visible para clientes y administración). Pagos en efectivo/transferencia, anticipado o contraentrega.
Ventas: Un pedido se convierte en Venta cuando está 100% pagado. Generación de comprobante de pago y exportación a Excel.
Devoluciones de Productos:
     * Basado en estados de motivos (ej. tiempo superado, producto no esperado, error en dirección).
     * Reembolso de dinero aplica solo si supera 2 horas de demora o el cliente rechaza la reposición.
     * Si requiere Reposición: Generar automáticamente una nueva Orden de Producción asignándole la MÁXIMA PRIORIDAD (primer lugar en la cola PEPS).

MÓDULO DE MEDICIÓN Y DESEMPEÑO (DASHBOARD):
Métricas clave: Pedidos con tiempo crítico, Pedidos en cola vs. Tiempo de entrega, Top de productos más y menos vendidos, Comparativo Ventas vs. Devoluciones (diario, semanal y anual).

Por favor, genera la propuesta técnica comenzando con:
Esquema de Entidades y Modelo de Base de Datos Relacional (Tablas, llaves primarias, llaves foráneas y enumerados de estados).
Arquitectura del backend/frontend detallando los flujos de la regla de $150.000 COP y la cola PEPS con prioridad en devoluciones.1. Información General del ProyectoNombre del Aplicativo: Mini-Foods bite.  Cliente / Empresa: Zuleima Ochoa - El Parche de la Mini Burguer (Bello, Antioquia).  Programa: Tecnología en Análisis y Desarrollo de Software (ADSO) - Ficha 3256502.  Integrantes: Mariel Susej Hernández, Luz Karime Loaiza, Sofía González, Daniela Bonilla y Angelo Seagen Martínez.  Vigencia: 28/06/2025 al 20/04/2027.  2. Problemática y Justificación
El establecimiento opera desde 2013 con 5 empleados fijos y 7 de refuerzo. Aunque lleva un registro en computador de compras, producción y ventas, estos procesos están desintegrados.  Problemas Principales: Registro manual de inventario, demoras en toma de pedidos por WhatsApp/llamadas, falta de integración de datos en tiempo real y revisiones de stock "a ojo" cada varios días.  Consecuencias Actuales: Fuga de dinero, desabastecimiento en días pico, tiempos de entrega superiores a 15 min, errores en el 70% de pedidos por WhatsApp, costos ocultos y pérdidas por insumos vencidos al no aplicar PEPS digitalmente.  3. Módulos y Alcance Operativo (Web y Móvil)Módulo de Configuración y SeguridadRoles y Permisos: Crear, consultar, actualizar, anular y cambiar estado de roles y privilegios.  Usuarios y Acceso: Registro de usuarios, asignación de roles, inicio/cierre de sesión, recuperación de contraseña y personalización de temas de interfaz (UI) en el perfil.  Gestión de Clientes: Registro y actualización de datos de clientes para seguimiento de pedidos.  Módulo de Compras e InventarioCategorías e Insumos: Control de stock actual, stock mínimo y stock máximo. El stock se incrementa con compras y disminuye con ventas/producción.  Proveedores: Asociación de proveedores con categorías de insumos. No se permite eliminar proveedores con compras vinculadas (solo inactivar).  Compras: Registro, consulta y anulación de órdenes de compra.  Pérdidas de Insumos: Registro, consulta y exportación de insumos dados de baja por vencimiento o daño.  Módulo de ProducciónProductos y Categorías: Administración de los productos ofrecidos en la carta, precios y disponibilidad.  Ficha Técnica Versionada: Historial de recetas con insumos y cantidades exactas para descontar del inventario automáticamente.  Órdenes de Producción:Internas: Para preparar productos intermedios que sirven de insumo.  Por Venta/Pedido: Generadas automáticamente. Regla clave: Si el pedido supera $150.000 COP, requiere aprobación de administración antes de crear la orden.  Rotación: Aplicación estricta del método PEPS.  Cálculo de Tiempos: Suma tiempo de preparación + tiempo de empaque y despacho.  Producto No Conforme: Se maneja como un estado interno dentro de la orden de producción (sin agregar un módulo extra al menú principal).  Módulo de Ventas y PostventaPedidos: Registro por canal presencial u online, visualización del estado por el cliente y medios de pago (efectivo/transferencia, anticipado/contraentrega).  Ventas: Conversión automática a venta al confirmarse el pago total, con comprobante y exportación a Excel.  Devoluciones: Gestión por causas (demoras, producto erróneo, dirección incorrecta). Devolución de dinero solo si supera 2 horas de retraso o si el cliente lo exige. Si hay reposición, genera una nueva orden de producción con prioridad 1 en la cola PEPS.  Módulo de Medición y Desempeño (Dashboard)Visualización de pedidos críticos, cola de espera vs. tiempos, Top de productos más/menos vendidos y comparativo de Ventas vs. Devoluciones (diario, semanal, anual).  4. Diferencias entre Aplicativo Web y Aplicativo MóvilWeb (Administración completa): Permite CRUD total, anulación de compras/ventas, exportaciones a Excel, configuración general de temas/roles y reportes gerenciales completos.  Móvil (Uso operativo y rápido): Enfocado en consultas de stock/fichas técnicas, cambio rápido de estados (de pedidos, órdenes y productos), registro rápido de compras y toma directa de pedidos/devoluciones en cocina o mostrador. 