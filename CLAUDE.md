# Sistema de Calificaciones - La Areperia

## Descripcion del proyecto
Sistema tipo kiosco para recolectar calificaciones de servicio en restaurantes.
Los clientes califican su experiencia (1-3) despues de comprar, ingresando su numero de factura.

## Stack tecnologico
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (sin frameworks, sin build system)
- **Backend**: Google Apps Script (serverless)
- **Base de datos**: Google Sheets (hojas: `Configuracion`, `Calificaciones`, `ConfigAlertas`)
- **Charts**: Chart.js 4.x via CDN (solo en dashboard)

## Estructura del proyecto
```
├── index.html                 ← Redirect a frontend/ (para GitHub Pages)
├── apps-script/Code.gs        ← API backend (Google Apps Script)
├── frontend/                  ← App de kiosco para clientes
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── config.js              ← Configuracion compartida (API_URL, PIN)
│   └── assets/                ← Imagenes (caritas, logo, QR)
├── dashboard/                 ← Dashboard de metricas (admin)
│   ├── index.html
│   ├── dashboard.js
│   └── dashboard.css
├── docs/                      ← Documentacion
└── INSTRUCCIONES.md           ← Guia de instalacion
```

## Despliegue (GitHub Pages)

- **Repositorio**: `https://github.com/bastcolombia1/sistema-de-calificaiones-La-areperia`
- **URL raiz**: `bastcolombia1.github.io/sistema-de-calificaiones-La-areperia/` → redirige a `frontend/`
- **Kiosco**: `bastcolombia1.github.io/sistema-de-calificaiones-La-areperia/frontend/`
- **Dashboard**: `bastcolombia1.github.io/sistema-de-calificaiones-La-areperia/dashboard/`
- El `index.html` en raiz usa `<meta http-equiv="refresh">` para redirigir al frontend

## Convenciones de codigo

### JavaScript
- Patron IIFE `(function() { 'use strict'; ... })()` para encapsular modulos
- Objeto `state` para manejar estado de la aplicacion
- Objeto `el` o `elements` para referencias DOM al inicio del modulo
- Funciones API con `fetch` + fallback JSONP para CORS con Google Apps Script
- No usar frameworks ni librerias adicionales (excepto Chart.js en dashboard)

### CSS
- Variables CSS en `:root` para theming
- Frontend kiosco: max-width 480px, mobile-first
- Dashboard: max-width 1400px, desktop-first
- Clases BEM-like para evitar conflictos entre frontend y dashboard
- Frontend usa prefijo `--color-*`, dashboard usa prefijo `--dash-*`

### Google Apps Script
- Funcion `doGet(e)` con switch por `action` parameter
- Soporte JSONP via parametro `callback`
- Respuestas siempre con `{ success: true/false, ... }`
- Spreadsheet ID hardcodeado en constante `SPREADSHEET_ID`

## API Endpoints (via GET parameter `action`)
- `getConfig` - Config de punto de venta (param: `codigo_pv`)
- `getSedes` - Lista sedes activas
- `checkInvoice` - Verificar factura duplicada (param: `numero_factura`)
- `saveRating` - Guardar calificacion (params: `codigo_pv`, `numero_factura`, `calificacion`, `comentario`)
- `getStats` - Estadisticas basicas (param: `codigo_pv`)
- `getDashboardData` - Todos los datos para el dashboard (sedes + calificaciones)
- `getAlertConfig` - Configuracion actual de alertas

## Alertas y Reportes
- **Alerta inmediata**: Al guardar calificacion <= umbral (default 2), se envia email HTML
- **Reporte semanal**: Trigger automatico los Lunes 8am, resume ultimos 7 dias
- **Configuracion**: Hoja `ConfigAlertas` con claves: `emails_alerta`, `alertas_activas`, `umbral_alerta`, `reporte_semanal`, `url_dashboard`
- **Funciones de setup**: `setupTriggers()` (ejecutar 1 vez), `removeTriggers()`, `testSendAlert()`, `testWeeklyReport()`
- Los emails usan HTML con inline CSS (compatibilidad Gmail/Outlook)
- `MailApp.sendEmail()` tiene limite de 100 emails/dia en cuentas gratuitas

## Configuracion importante
- `frontend/config.js` es compartido entre frontend y dashboard (via ruta relativa `../frontend/config.js`)
- PIN admin por defecto: `1234`
- Al modificar Code.gs hay que re-desplegar la Web App en Apps Script

## Notas
- Los datos se filtran/agregan en el cliente para minimizar llamadas a Google Sheets
- El dashboard no requiere autenticacion (acceso libre)
- La app de kiosco guarda la sede seleccionada en localStorage
- Calificaciones: 1 = Malo, 2 = Regular, 3 = Bueno
