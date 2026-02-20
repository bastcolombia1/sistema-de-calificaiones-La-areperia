# Skills - Sistema de Calificaciones La Areperia

## Kiosco de Calificaciones (frontend/)

Aplicacion tactil tipo kiosco para que los clientes califiquen el servicio.

- Seleccion de sede por codigo de punto de venta (QR o parametro URL)
- Ingreso de numero de factura con prefijo configurable
- Validacion de facturas duplicadas (bloquear o advertir, configurable por sede)
- Calificacion con 3 niveles: Bueno (3), Regular (2), Malo (1) con caritas animadas
- Comentario opcional del cliente
- Pantalla de agradecimiento con auto-reset
- Modo pantalla completa persistente para kioscos
- Acceso a configuracion tocando el logo 5 veces
- PIN de administrador para cambiar de sede
- Responsive mobile-first (optimizado para tablets y celulares)

## Dashboard de Metricas (dashboard/)

Panel de control para visualizar el rendimiento del servicio por sede.

- Tarjetas resumen: total calificaciones, promedio general, mejor sede, peor sede
- Seccion "Resumen de Ayer": calificaciones del dia anterior con distribucion y desglose por sede
- Grafico de distribucion (doughnut): proporcion Bueno/Regular/Malo
- Ranking por sede (barras horizontales apiladas)
- Tendencia temporal (linea): promedio y volumen diario/semanal/mensual
- Tabla detallada por sede con barras de distribucion inline
- Tabla de comentarios recientes con paginacion y filtro por sede
- Filtro por rango de fechas
- Exportacion a CSV con codificacion UTF-8
- Fondo decorativo con las imagenes de las arepitas
- Acceso libre (sin autenticacion)

## Alertas y Reportes (apps-script/Code.gs)

Sistema automatizado de notificaciones por email.

- Alerta inmediata por calificacion baja (Malo o Regular) con email HTML estilizado
- Reporte semanal automatico los Lunes a las 8am con:
  - Resumen general (total, promedio, distribucion porcentual)
  - Mejor y peor sede de la semana
  - Tabla detallada por sede con barras de distribucion
  - Comentarios negativos con contexto (sede, fecha, calificacion)
  - Enlace directo al dashboard
- Configuracion desde Google Sheets (hoja ConfigAlertas):
  - Destinatarios, umbrales, activar/desactivar alertas y reportes
- Funciones de prueba para validar sin esperar triggers

## API Backend (apps-script/Code.gs)

Endpoints disponibles via parametro `action` en GET:

| Action | Descripcion | Parametros |
|---|---|---|
| `getConfig` | Configuracion de un punto de venta | `codigo_pv` |
| `getSedes` | Lista de sedes activas | - |
| `checkInvoice` | Verificar factura duplicada | `numero_factura` |
| `saveRating` | Guardar calificacion | `codigo_pv`, `numero_factura`, `calificacion`, `comentario` |
| `getStats` | Estadisticas basicas | `codigo_pv` (opcional) |
| `getDashboardData` | Datos completos para dashboard | - |
| `getAlertConfig` | Configuracion de alertas | - |

## Tecnologias

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- Google Apps Script (backend serverless)
- Google Sheets (base de datos)
- Chart.js 4.x (graficos del dashboard)
- MailApp de Google (envio de emails)
- GitHub Pages (hosting del frontend y dashboard)
