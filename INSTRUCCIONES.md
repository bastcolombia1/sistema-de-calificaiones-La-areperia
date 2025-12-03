# Sistema de Calificaciones de Servicio

## Instrucciones de Instalación

### Paso 1: Configurar Google Sheets

1. Abre tu archivo de Google Sheets: [CalificacionesServicio](https://docs.google.com/spreadsheets/d/1x-Q5L1ejuCEGRmsJ5jHlywUH_lcpL79Rnkz886CCiZc/edit)

2. Crea dos hojas con estos nombres exactos:
   - `Configuracion`
   - `Calificaciones`

### Paso 2: Configurar la hoja "Configuracion"

Agrega estos encabezados en la primera fila:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| codigo_pv | nombre_pv | nombre_marca | logo_url | color_primario | color_secundario | prefijo_factura | activo |

Luego agrega tus puntos de venta:

| codigo_pv | nombre_pv | nombre_marca | logo_url | color_primario | color_secundario | prefijo_factura | activo |
|-----------|-----------|--------------|----------|----------------|------------------|-----------------|--------|
| PV001 | Sede Centro | La Arepería | | #c8102e | #f7e123 | FENO | TRUE |
| PV002 | Sede Norte | La Arepería | | #c8102e | #f7e123 | FENO | TRUE |
| PV003 | Sede Sur | La Arepería | | #c8102e | #f7e123 | FENO | TRUE |
| PV004 | Sede Este | La Arepería | | #c8102e | #f7e123 | FENO | TRUE |
| PV005 | Sede Oeste | La Arepería | | #c8102e | #f7e123 | FENO | TRUE |

**Notas:**
- `logo_url`: Puedes dejarla vacía o poner URL de imagen pública
- `color_primario`: Color del texto y botones (formato hexadecimal, ej: #c8102e)
- `color_secundario`: Color de fondo de la aplicación (formato hexadecimal, ej: #f7e123)
- `prefijo_factura`: Prefijo que se muestra antes del número de factura (ej: FENO). Dejar vacío si no aplica
- `activo`: TRUE o FALSE

### Paso 3: Configurar la hoja "Calificaciones"

Agrega estos encabezados en la primera fila:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| timestamp | codigo_pv | nombre_pv | numero_factura | calificacion | comentario |

### Paso 4: Crear el Script de Apps Script

1. En Google Sheets, ve a **Extensiones > Apps Script**

2. Borra el contenido por defecto y pega el código del archivo `apps-script/Code.gs`

3. Guarda el proyecto (Ctrl+S) con un nombre como "API Calificaciones"

4. **Ejecutar inicialización (OPCIONAL):**
   - Si quieres que el script cree las hojas automáticamente, ejecuta la función `initializeSheets()`
   - Ve a Ejecutar > Ejecutar función > initializeSheets

### Paso 5: Publicar como Web App

1. En el editor de Apps Script, ve a **Implementar > Nueva implementación**

2. Haz clic en el engranaje ⚙️ y selecciona **Aplicación web**

3. Configura:
   - **Descripción**: API Calificaciones v1
   - **Ejecutar como**: Yo (tu email)
   - **Quién tiene acceso**: Cualquier persona

4. Haz clic en **Implementar**

5. **Autoriza la aplicación** cuando te lo pida

6. **COPIA LA URL** que te genera (la necesitarás para el frontend)
   - Ejemplo: `https://script.google.com/macros/s/AKfycb.../exec`

### Paso 6: Configurar el Frontend

1. Abre el archivo `frontend/config.js`

2. Reemplaza los valores:

```javascript
const CONFIG = {
    // Pega aquí la URL de tu Web App
    API_URL: 'https://script.google.com/macros/s/TU_ID_AQUI/exec',

    // Código del punto de venta para esta instancia
    CODIGO_PV: 'PV001',  // Cambia según la sede

    // Segundos antes de reiniciar
    RESET_TIMEOUT: 5,

    // Activa para ver logs en consola
    DEBUG: false
};
```

### Paso 7: Desplegar el Frontend

#### Opción A: Localmente (para pruebas)
1. Abre `frontend/index.html` en un navegador
2. O usa un servidor local: `npx serve frontend`

#### Opción B: En un servidor web
1. Sube la carpeta `frontend` a tu hosting
2. Configura `config.js` para cada punto de venta

#### Opción C: GitHub Pages (gratis)
1. Sube el proyecto a GitHub
2. Activa GitHub Pages en Settings > Pages
3. Crea una copia de config.js para cada sede

---

## Estructura de Archivos

```
sistema-calificaciones/
├── apps-script/
│   └── Code.gs              # API de Google Apps Script
├── frontend/
│   ├── index.html           # Página principal
│   ├── styles.css           # Estilos
│   ├── config.js            # Configuración (editar por sede)
│   └── app.js               # Lógica de la aplicación
└── INSTRUCCIONES.md         # Este archivo
```

---

## Configuración por Sede

Para cada punto de venta, crea una copia del frontend con su propio `config.js`:

**Sede Centro (PV001):**
```javascript
CODIGO_PV: 'PV001'
```

**Sede Norte (PV002):**
```javascript
CODIGO_PV: 'PV002'
```

Y así sucesivamente...

---

## Personalización

### Cambiar colores
Edita `color_primario` en la hoja Configuracion para cada sede.

### Agregar logo
1. Sube tu logo a Google Drive o un servidor
2. Obtén la URL pública de la imagen
3. Agrégala en la columna `logo_url`

### Agregar nueva marca
Para replicar a otra marca:
1. Agrega filas en Configuracion con el nuevo `nombre_marca`
2. Crea instancias del frontend apuntando a los nuevos códigos

---

## Solución de Problemas

### Error: "Punto de venta no encontrado"
- Verifica que `CODIGO_PV` en config.js coincida con la hoja Configuracion
- Asegúrate que la columna `activo` sea TRUE

### Error CORS
- Asegúrate de publicar la Web App con acceso "Cualquier persona"
- Verifica que la URL en config.js sea correcta

### No se guardan las calificaciones
- Revisa los permisos del script en Apps Script
- Verifica que la hoja "Calificaciones" exista con los headers correctos

---

## Soporte

Para agregar funcionalidades o resolver problemas, contacta al desarrollador.
