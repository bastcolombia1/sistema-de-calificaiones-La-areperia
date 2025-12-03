# Documentación Técnica - Sistema de Calificaciones de Servicio

## 1. Arquitectura del Sistema

### 1.1 Diagrama de Arquitectura

```
┌─────────────────┐     HTTPS/JSONP     ┌─────────────────────┐
│                 │ ◄─────────────────► │                     │
│    Frontend     │                     │  Google Apps Script │
│   (HTML/JS/CSS) │                     │       (API)         │
│                 │                     │                     │
└─────────────────┘                     └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │   Google Sheets     │
                                        │   (Base de Datos)   │
                                        │                     │
                                        └─────────────────────┘
```

### 1.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | HTML5, CSS3, JavaScript ES6+ | - |
| Backend | Google Apps Script | V8 Runtime |
| Base de Datos | Google Sheets | - |
| Protocolo | HTTPS con soporte JSONP | - |

---

## 2. Estructura de Archivos

```
sistema-calificaciones/
├── apps-script/
│   └── Code.gs                 # API backend (Google Apps Script)
├── frontend/
│   ├── assets/
│   │   ├── logo.png           # Logo de la marca
│   │   ├── feliz.png          # Emoji calificación buena
│   │   ├── serio.png          # Emoji calificación regular
│   │   ├── enojado.png        # Emoji calificación mala
│   │   └── qr_encuesta.png    # Código QR promocional
│   ├── index.html             # Página principal
│   ├── styles.css             # Estilos CSS
│   ├── config.js              # Configuración (API URL, PIN)
│   └── app.js                 # Lógica de aplicación
├── docs/
│   ├── DOCUMENTACION_TECNICA.md
│   ├── DOCUMENTACION_FUNCIONAL.md
│   ├── DOCUMENTACION_ADMINISTRATIVA.md
│   └── MANUAL_DE_USO.md
└── INSTRUCCIONES.md           # Guía de instalación
```

---

## 3. Backend (Google Apps Script)

### 3.1 Archivo: Code.gs

#### Constantes de Configuración

```javascript
const SPREADSHEET_ID = '1x-Q5L1ejuCEGRmsJ5jHlywUH_lcpL79Rnkz886CCiZc';
const SHEET_CONFIG = 'Configuracion';
const SHEET_RATINGS = 'Calificaciones';
```

#### Endpoints Disponibles

| Método | Action | Parámetros | Descripción |
|--------|--------|------------|-------------|
| GET | `getConfig` | `codigo_pv` | Obtiene configuración de un punto de venta |
| GET | `getSedes` | - | Lista todas las sedes activas |
| GET | `getStats` | `codigo_pv` (opcional) | Estadísticas de calificaciones |
| GET | `saveRating` | `codigo_pv`, `numero_factura`, `calificacion`, `comentario` | Guarda una calificación |

#### Funciones Principales

##### `doGet(e)`
Punto de entrada para solicitudes HTTP GET. Soporta respuestas JSON y JSONP.

```javascript
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback; // Para JSONP
  // ... switch por action
}
```

##### `getConfig(codigoPv)`
Retorna la configuración de un punto de venta específico.

**Respuesta exitosa:**
```json
{
  "success": true,
  "config": {
    "codigo_pv": "PV001",
    "nombre_pv": "Sede Centro",
    "nombre_marca": "La Arepería",
    "logo_url": "assets/logo.png",
    "color_primario": "#c8102e",
    "color_secundario": "#f7e123",
    "prefijo_factura": "FENO"
  }
}
```

##### `getSedes()`
Retorna lista de sedes activas para el selector de configuración.

**Respuesta:**
```json
{
  "success": true,
  "sedes": [
    {"codigo_pv": "PV001", "nombre_pv": "Sede Centro", "nombre_marca": "La Arepería"},
    {"codigo_pv": "PV002", "nombre_pv": "Sede Norte", "nombre_marca": "La Arepería"}
  ]
}
```

##### `saveRating(data)`
Guarda una calificación en la hoja de cálculo.

**Parámetros:**
- `codigo_pv`: Código del punto de venta
- `numero_factura`: Número de factura (con prefijo)
- `calificacion`: 1 (malo), 2 (regular), 3 (bueno)
- `comentario`: Texto opcional

##### `getStats(codigoPv)`
Retorna estadísticas agregadas de calificaciones.

---

## 4. Frontend

### 4.1 Archivo: config.js

```javascript
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/.../exec',
    ADMIN_PIN: '1234',
    RESET_TIMEOUT: 30,
    DEBUG: false
};
```

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `API_URL` | String | URL del Web App de Google Apps Script |
| `ADMIN_PIN` | String | PIN de 4 dígitos para acceso administrativo |
| `RESET_TIMEOUT` | Number | Segundos antes de reiniciar tras calificar |
| `DEBUG` | Boolean | Activa logs en consola del navegador |

### 4.2 Archivo: app.js

#### Estado de la Aplicación

```javascript
const state = {
    config: null,      // Configuración de la sede actual
    codigoPv: null,    // Código de punto de venta
    invoiceNumber: '', // Número de factura ingresado
    selectedRating: null, // Calificación seleccionada (1-3)
    comment: ''        // Comentario opcional
};
```

#### Flujo de Pantallas

```
┌──────────────┐
│   Loading    │
└──────┬───────┘
       │
       ▼
┌──────────────┐    No hay sede     ┌──────────────┐
│  Verificar   │ ─────guardada────► │    Setup     │
│  localStorage│                    │  (PIN+Sede)  │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ Sede encontrada                   │
       ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│   Invoice    │ ◄──────────────────│   Invoice    │
│   Screen     │                    │   Screen     │
└──────┬───────┘                    └──────────────┘
       │
       ▼
┌──────────────┐
│   Rating     │
│   Screen     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Thanks     │ ──► (30s) ──► Invoice Screen
│   Screen     │
└──────────────┘
```

#### Funciones de API

##### `fetchWithCallback(url)`
Implementa JSONP como fallback para evitar problemas de CORS.

##### `fetchConfig(codigoPv)`
Obtiene configuración de la sede desde el backend.

##### `fetchSedes()`
Obtiene lista de sedes para el selector.

##### `submitRating(ratingData)`
Envía calificación al backend.

#### Storage Local

```javascript
function getSavedSede() {
    return localStorage.getItem('codigo_pv');
}

function saveSede(codigoPv) {
    localStorage.setItem('codigo_pv', codigoPv);
}

function clearSede() {
    localStorage.removeItem('codigo_pv');
}
```

#### Atajos de Teclado

| Combinación | Acción |
|-------------|--------|
| `Ctrl + Shift + S` | Abre pantalla de configuración de sede |

---

## 5. Base de Datos (Google Sheets)

### 5.1 Hoja: Configuracion

| Columna | Nombre | Tipo | Descripción |
|---------|--------|------|-------------|
| A | codigo_pv | String | Identificador único del punto de venta |
| B | nombre_pv | String | Nombre descriptivo de la sede |
| C | nombre_marca | String | Nombre de la marca/empresa |
| D | logo_url | String | URL o ruta del logo |
| E | color_primario | String | Color hex para botones/títulos |
| F | color_secundario | String | Color hex para fondo |
| G | prefijo_factura | String | Prefijo de factura (ej: FENO) |
| H | activo | Boolean | TRUE si está activo |

### 5.2 Hoja: Calificaciones

| Columna | Nombre | Tipo | Descripción |
|---------|--------|------|-------------|
| A | timestamp | DateTime | Fecha y hora de la calificación |
| B | codigo_pv | String | Código del punto de venta |
| C | nombre_pv | String | Nombre de la sede |
| D | numero_factura | String | Número de factura completo |
| E | calificacion | String | 1, 2 o 3 |
| F | comentario | String | Comentario del cliente |

---

## 6. Seguridad

### 6.1 Autenticación

- **PIN de Administrador**: Protege el acceso a la configuración de sedes
- Se configura en `config.js` (variable `ADMIN_PIN`)
- Validación del lado del cliente

### 6.2 Comunicación

- HTTPS obligatorio (Google Apps Script)
- Soporte JSONP para evitar restricciones CORS
- No se transmiten datos sensibles

### 6.3 Almacenamiento

- `localStorage` para persistir la sede seleccionada
- No se almacenan datos de clientes en el navegador

---

## 7. Despliegue

### 7.1 Backend (Google Apps Script)

1. Abrir Google Sheets con los datos
2. Extensiones → Apps Script
3. Pegar código de `Code.gs`
4. Implementar → Nueva implementación
5. Tipo: Aplicación web
6. Ejecutar como: Yo
7. Acceso: Cualquier persona
8. Copiar URL generada

### 7.2 Frontend

#### Opción A: Servidor Local
```bash
cd frontend
npx serve . -l 3000
```

#### Opción B: Hosting Estático
- Subir carpeta `frontend/` a cualquier hosting web
- Configurar `config.js` con la URL del backend

#### Opción C: GitHub Pages
1. Subir a repositorio GitHub
2. Settings → Pages → Activar

---

## 8. Mantenimiento

### 8.1 Actualizar API

Cada vez que se modifica `Code.gs`:
1. Implementar → Administrar implementaciones
2. Crear nueva versión
3. Actualizar `API_URL` en `config.js`

### 8.2 Logs y Depuración

- Activar `DEBUG: true` en `config.js`
- Ver consola del navegador (F12)
- En Apps Script: Ver → Registros de ejecución

---

## 9. Limitaciones Conocidas

| Limitación | Descripción |
|------------|-------------|
| Cuota diaria | Google Apps Script tiene límite de ejecuciones diarias |
| Concurrencia | No soporta alta concurrencia simultánea |
| Offline | Requiere conexión a internet |
| CORS | Depende de JSONP como fallback |

---

## 10. Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2024-12 | Versión inicial |
| 1.1.0 | 2024-12 | Agregado selector de sede con PIN |
| 1.2.0 | 2024-12 | Soporte para colores y prefijo de factura dinámicos |
