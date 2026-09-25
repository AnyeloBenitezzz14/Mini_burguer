2. Estructura general de navegación
Crear un Sidebar con los siguientes módulos principales:

Dashboard

Configuración

Usuarios

Compras

Producción

Ventas

Medición y desempeño

El Sidebar debe permitir expandir y contraer los submódulos.

No mostrar todos los subprocesos directamente en una pantalla saturada. Agruparlos jerárquicamente.

MÓDULO 1. DASHBOARD
Crear un dashboard administrativo con:

Ventas del día.

Ventas de la semana.

Ventas del mes.

Pedidos pendientes.

Pedidos en producción.

Pedidos con tiempo crítico.

Productos más vendidos.

Productos menos vendidos.

Insumos con stock bajo.

Últimas ventas.

Últimos pedidos.

Alertas importantes.

Crear gráficas para:

Ventas por día.

Ventas vs devoluciones.

Pedidos por estado.

Productos más vendidos.

Agregar accesos rápidos:

Nuevo pedido.

Nueva compra.

Nuevo producto.

Nuevo insumo.

Nueva orden de producción.

MÓDULO 2. CONFIGURACIÓN
Submódulo: Gestión de Roles
Crear:

Listado de roles.

Crear rol.

Editar rol.

Consultar rol.

Activar/desactivar rol.

Asignar permisos.

Asignar privilegios.

La pantalla de permisos debe utilizar una matriz organizada:

Módulo | Submódulo | Consultar | Crear | Editar | Eliminar | Exportar

Mostrar permisos agrupados por módulo.

MÓDULO 3. USUARIOS
Submódulo: Gestión de Usuarios
Crear:

Listado de usuarios.

Crear usuario.

Editar usuario.

Consultar usuario.

Cambiar estado.

Asignar rol.

Buscar usuario.

Filtrar usuarios.

Campos:

Nombre.

Apellido.

Documento.

Correo.

Teléfono.

Rol.

Estado.

Estados:

Activo.

Inactivo.

Submódulo: Gestión de Acceso
Diseñar:

Login.

Recuperar contraseña.

Restablecer contraseña.

Cerrar sesión.

Submódulo: Mi Perfil
Diseñar:

Información personal.

Editar perfil.

Cambiar contraseña.

Configuración de temas.

Submódulo: Configuración de temas
Permitir:

Tema claro.

Tema oscuro.

Preferencias visuales.

MÓDULO 4. COMPRAS
Este debe ser uno de los módulos principales del aplicativo.

Submódulo: Gestión de categorías de insumos
Crear:

Listar categorías.

Crear categoría.

Editar categoría.

Eliminar categoría.

Buscar categoría.

Cambiar estado.

Campos:

Nombre.

Descripción.

Estado.

Submódulo: Gestión de insumos
Crear una pantalla completa de administración de insumos.

Tabla:

Código.

Nombre.

Categoría.

Unidad de medida.

Stock actual.

Stock mínimo.

Stock máximo.

Precio.

Estado.

Acciones.

Acciones:

Ver.

Editar.

Eliminar.

Cambiar estado.

Agregar:

Buscar.

Filtrar.

Exportar.

Crear insumo.

Formulario de insumo:

Código.

Nombre.

Descripción.

Categoría.

Unidad de medida.

Precio.

Stock mínimo.

Stock máximo.

Estado.

Mostrar alertas:

Stock bajo.

Stock agotado.

Stock superior al máximo.

Submódulo: Gestión de proveedores
Crear:

Listado de proveedores.

Crear proveedor.

Editar proveedor.

Consultar proveedor.

Eliminar proveedor.

Cambiar estado.

Exportar.

Campos:

Nombre.

NIT/Documento.

Teléfono.

Correo.

Dirección.

Categorías de insumos.

Estado.

Submódulo: Gestión de compras
Crear:

Listado de compras.

Crear compra.

Consultar compra.

Anular compra.

Exportar compras.

Formulario:

Proveedor
Fecha
Número de factura
Insumos
Cantidad
Costo unitario
Costo total
Observaciones

Mostrar resumen:

Subtotal.

Total.

Cantidad de productos.

Al confirmar una compra, representar visualmente que el stock de los insumos aumenta.

Submódulo: Gestión de pérdidas de insumos
Crear:

Listado de pérdidas.

Registrar pérdida.

Consultar pérdida.

Anular pérdida.

Exportar.

Campos:

Insumo.

Cantidad.

Motivo.

Fecha.

Responsable.

Observaciones.

MÓDULO 5. PRODUCCIÓN
Submódulo: Gestión de categorías de productos
Crear:

Listar categorías.

Crear.

Editar.

Eliminar.

Cambiar estado.

Submódulo: Gestión de productos
Crear tabla:

Imagen.

Nombre.

Categoría.

Precio.

Disponibilidad.

Estado.

Acciones.

Funciones:

Crear.

Consultar.

Editar.

Eliminar.

Cambiar estado.

Submódulo: Fichas técnicas
Crear:

Listado de fichas técnicas.

Crear ficha.

Editar ficha.

Consultar ficha.

Descargar ficha.

Ver versiones anteriores.

Cada ficha debe mostrar:

Producto
Versión
Fecha
Ingredientes
Cantidad utilizada
Unidad de medida
Estado

Crear una sección de historial de versiones.

Submódulo: Gestión de producción
Crear una vista tipo tablero Kanban para las órdenes:

Pendiente → Aprobada → En producción → Empaque → Lista → Entregada

Permitir:

Crear orden.

Consultar orden.

Editar orden.

Cambiar estado.

Exportar.

Mostrar:

Número de orden.

Pedido relacionado.

Productos.

Cantidad.

Hora de creación.

Tiempo estimado.

Estado.

Prioridad.

Implementar indicador visual de tiempo crítico.

Producto no conforme
No crear un módulo independiente.

Integrar Producto no conforme como estado dentro de la orden de producción.

Estados posibles:

Conforme.

Producto no conforme.

Reposición requerida.

MÓDULO 6. VENTAS
Submódulo: Gestión de clientes
Crear:

Listado.

Crear cliente.

Editar cliente.

Consultar cliente.

Cambiar estado.

Campos:

Nombre.

Documento.

Teléfono.

Correo.

Dirección.

Estado.

Submódulo: Gestión de pedidos
Crear una pantalla para registrar y administrar pedidos.

Canales:

Local.

WhatsApp.

Telefónico.

Online.

Mostrar:

Número de pedido.

Cliente.

Productos.

Total.

Método de pago.

Estado.

Hora.

Tiempo estimado.

Estados:

Recibido → Confirmado → En producción → En empaque → Listo → Enviado → Entregado

Crear vista Kanban y vista tabla.

Los pedidos superiores a $150.000 COP deben mostrar un estado de:

“Pendiente de aprobación administrativa”

hasta que sean aprobados.

Submódulo: Gestión de ventas
Crear:

Listado de ventas.

Consultar venta.

Cambiar estado.

Generar comprobante.

Exportar Excel.

Mostrar:

Número de venta.

Pedido.

Cliente.

Fecha.

Método de pago.

Total.

Estado.

Submódulo: Gestión de devolución de producto
Crear:

Registrar devolución.

Consultar devolución.

Gestionar estado.

Determinar acción.

Motivos:

Producto fuera del tiempo establecido.

Producto no esperado por el cliente.

Pedido enviado a dirección incorrecta.

Acciones:

Reposición.

Devolución de dinero.

Si requiere reposición, mostrar que se genera una nueva orden de producción con prioridad.

MÓDULO 7. MEDICIÓN Y DESEMPEÑO
Crear un dashboard analítico.

Mostrar:

Pedidos críticos
Listado de pedidos próximos a superar el tiempo establecido.

Pedidos en cola
Comparación entre:

Cantidad de pedidos.

Tiempo de entrega.

Tiempo promedio.

Productos más vendidos
Ranking visual.

Productos menos vendidos
Ranking visual.

Ventas vs devoluciones
Permitir seleccionar:

Diario.

Semanal.

Mensual.

Anual.

Crear gráficas claras y profesionales.

COMPONENTES GLOBALES
Diseñar un sistema de componentes reutilizables:

Sidebar.

Navbar.

Buttons.

Inputs.

Selects.

Date picker.

Search bar.

Filters.

Tables.

Cards.

Modals.

Toast notifications.

Alerts.

Badges.

Pagination.

Dropdown.

Tabs.

Breadcrumbs.

Empty states.

Loading states.

Error states.

Confirmation dialogs.

Crear estados:

Default
Hover
Active
Disabled
Loading
Error
Success

RESPONSIVE DESIGN
Crear versiones:

Desktop.

Tablet.

Mobile.

En móvil convertir el Sidebar en menú lateral desplegable.

Las tablas deben poder desplazarse horizontalmente.

Los formularios deben adaptarse a una columna.

PROTOTIPO INTERACTIVO
Crear conexiones entre las pantallas principales.

Ejemplos:

Dashboard → Compras → Insumos → Crear insumo.

Dashboard → Producción → Órdenes → Detalle de orden.

Dashboard → Ventas → Pedidos → Detalle del pedido.

Usuarios → Crear usuario.

Roles → Permisos.

Insumos → Editar → Guardar.

Insumos → Eliminar → Confirmación.

Pedidos → Aprobar → Orden de producción.

Devolución → Reposición → Nueva orden de producción.

REGLAS IMPORTANTES DEL NEGOCIO
Implementar visualmente las siguientes reglas:

El stock aumenta mediante las compras.

El stock disminuye mediante las ventas/producción.

Aplicar método PEPS para la rotación de insumos.

Mostrar alertas cuando el stock esté bajo.

Los pedidos superiores a $150.000 COP requieren aprobación administrativa.

Una vez pagado completamente un pedido, se convierte en venta.

Una devolución que requiera reposición debe generar una nueva orden de producción.

Producto no conforme debe manejarse como estado dentro de la orden de producción.

Las fichas técnicas deben manejar versionamiento.

Las órdenes de producción deben mostrar tiempo estimado.

EXPERIENCIA DE USUARIO
Priorizar:

Navegación sencilla.

Jerarquía visual clara.

Pocos pasos para completar acciones.

Confirmación antes de eliminar.

Mensajes claros de éxito y error.

Estados visuales fáciles de identificar.

Búsqueda rápida.

Filtros fáciles de utilizar.

Tablas limpias.

Formularios divididos por secciones.

No diseñar todas las funcionalidades en una sola pantalla.

Cada módulo debe tener:

Listado → Crear → Ver detalle → Editar → Acciones

Crear un prototipo de alta fidelidad con suficientes pantallas para representar el funcionamiento real del aplicativo.

El resultado debe parecer un sistema empresarial real listo para convertirse posteriormente en una aplicación web.