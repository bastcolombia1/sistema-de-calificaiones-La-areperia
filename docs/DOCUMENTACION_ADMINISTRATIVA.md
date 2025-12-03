# Documentación Administrativa - Sistema de Calificaciones de Servicio

## 1. Información del Proyecto

### 1.1 Datos Generales

| Campo | Valor |
|-------|-------|
| **Nombre del Sistema** | Sistema de Calificaciones de Servicio |
| **Cliente** | La Arepería Original |
| **Versión Actual** | 1.2.0 |
| **Fecha de Implementación** | Diciembre 2024 |
| **Estado** | Producción |

### 1.2 Contactos Clave

| Rol | Responsabilidad |
|-----|-----------------|
| Propietario del Sistema | Decisiones de negocio y requerimientos |
| Administrador TI | Mantenimiento técnico y despliegue |
| Administrador de Sede | Configuración de dispositivos |

---

## 2. Gestión de Accesos

### 2.1 Niveles de Acceso

| Nivel | Acceso | Credenciales |
|-------|--------|--------------|
| Cliente | Solo encuesta | Ninguna |
| Administrador de Sede | Configuración de dispositivo | PIN (4 dígitos) |
| Administrador TI | Backend y base de datos | Cuenta Google |
| Propietario | Google Sheets completo | Cuenta Google |

### 2.2 Credenciales del Sistema

#### PIN de Administrador (Frontend)
- **Ubicación:** `frontend/config.js`
- **Variable:** `ADMIN_PIN`
- **Valor por defecto:** `1234`
- **Recomendación:** Cambiar antes de producción

#### Acceso a Google Sheets
- **URL:** [CalificacionesServicio](https://docs.google.com/spreadsheets/d/1x-Q5L1ejuCEGRmsJ5jHlywUH_lcpL79Rnkz886CCiZc/edit)
- **Permisos necesarios:** Editor (para modificar configuración)

#### Acceso a Google Apps Script
- **Acceso:** Desde Google Sheets → Extensiones → Apps Script
- **Permisos necesarios:** Editor del proyecto

### 2.3 Política de Cambio de Credenciales

| Evento | Acción Requerida |
|--------|------------------|
| Nuevo administrador de sede | Compartir PIN actual |
| Rotación de personal | Considerar cambio de PIN |
| Sospecha de compromiso | Cambiar PIN inmediatamente |
| Actualización de sistema | Verificar credenciales |

---

## 3. Gestión de Configuración

### 3.1 Agregar Nueva Sede

1. Abrir Google Sheets (hoja "Configuracion")
2. Agregar nueva fila con datos:
   - `codigo_pv`: Código único (ej: PV006)
   - `nombre_pv`: Nombre descriptivo
   - `nombre_marca`: La Arepería Original
   - `logo_url`: assets/logo.png
   - `color_primario`: #c8102e
   - `color_secundario`: #f7e123
   - `prefijo_factura`: FENO (o el que corresponda)
   - `activo`: TRUE
3. La sede aparecerá automáticamente en el selector

### 3.2 Desactivar Sede

1. Abrir Google Sheets (hoja "Configuracion")
2. Buscar la fila de la sede
3. Cambiar columna `activo` de TRUE a FALSE
4. La sede dejará de aparecer en el selector

### 3.3 Modificar Colores de Marca

| Color | Variable | Uso |
|-------|----------|-----|
| Primario | `color_primario` | Botones, títulos, elementos destacados |
| Secundario | `color_secundario` | Fondo de la aplicación |

**Formato:** Hexadecimal con # (ej: #c8102e)

### 3.4 Cambiar Logo

**Opción A - Logo Local:**
1. Guardar imagen en `frontend/assets/logo.png`
2. En Google Sheets, poner: `assets/logo.png`

**Opción B - Logo Externo:**
1. Subir imagen a servidor público
2. Copiar URL directa de la imagen
3. Pegar en columna `logo_url`

---

## 4. Procedimientos de Respaldo

### 4.1 Respaldo de Datos (Google Sheets)

**Frecuencia recomendada:** Semanal

**Procedimiento:**
1. Abrir Google Sheets
2. Archivo → Descargar → Microsoft Excel (.xlsx)
3. Guardar con nombre: `Calificaciones_YYYY-MM-DD.xlsx`
4. Almacenar en ubicación segura

### 4.2 Respaldo de Código

**Frecuencia recomendada:** Antes de cada cambio

**Procedimiento Frontend:**
1. Comprimir carpeta `frontend/`
2. Nombrar: `frontend_YYYY-MM-DD.zip`

**Procedimiento Backend:**
1. En Apps Script: Archivo → Historial de versiones
2. Las versiones se guardan automáticamente

### 4.3 Respaldo de Configuración

Guardar copia de:
- `frontend/config.js`
- Hoja "Configuracion" de Google Sheets

---

## 5. Mantenimiento Programado

### 5.1 Tareas Diarias

| Tarea | Responsable | Acción |
|-------|-------------|--------|
| Verificar funcionamiento | Admin Sede | Realizar calificación de prueba |

### 5.2 Tareas Semanales

| Tarea | Responsable | Acción |
|-------|-------------|--------|
| Revisar calificaciones negativas | Propietario | Analizar comentarios con calificación 1 |
| Respaldar datos | Admin TI | Descargar Excel de calificaciones |

### 5.3 Tareas Mensuales

| Tarea | Responsable | Acción |
|-------|-------------|--------|
| Generar reporte de satisfacción | Propietario | Crear resumen ejecutivo |
| Verificar cuotas de Google | Admin TI | Revisar uso de Apps Script |
| Limpiar datos antiguos | Admin TI | Archivar calificaciones > 12 meses |

---

## 6. Gestión de Incidentes

### 6.1 Clasificación de Incidentes

| Severidad | Descripción | Tiempo de Respuesta |
|-----------|-------------|---------------------|
| Crítica | Sistema completamente caído | 1 hora |
| Alta | Funcionalidad principal afectada | 4 horas |
| Media | Funcionalidad secundaria afectada | 24 horas |
| Baja | Mejora o ajuste menor | 1 semana |

### 6.2 Problemas Comunes y Soluciones

#### Error: "No se pudo conectar con el servidor"

**Causa probable:** URL de API incorrecta o Apps Script no publicado
**Solución:**
1. Verificar `API_URL` en `config.js`
2. Verificar que el script esté publicado como Web App
3. Crear nueva implementación si es necesario

#### Error: "Punto de venta no encontrado"

**Causa probable:** Código de sede incorrecto o inactivo
**Solución:**
1. Verificar código en Google Sheets
2. Confirmar que `activo` = TRUE
3. Reconfigurar sede en el dispositivo

#### Logo no se muestra

**Causa probable:** Ruta incorrecta o archivo no existe
**Solución:**
1. Verificar que el archivo exista en `frontend/assets/`
2. Verificar nombre exacto en `logo_url`
3. Para URLs externas, verificar acceso público

#### Pantalla se queda en "Cargando..."

**Causa probable:** Error de JavaScript
**Solución:**
1. Abrir consola del navegador (F12)
2. Revisar errores en rojo
3. Recargar página (Ctrl+F5)

### 6.3 Escalamiento

```
Nivel 1: Administrador de Sede
    │
    │ (No resuelto en 30 min)
    ▼
Nivel 2: Administrador TI
    │
    │ (Requiere cambio de código)
    ▼
Nivel 3: Desarrollador
```

---

## 7. Indicadores de Gestión (KPIs)

### 7.1 KPIs Operativos

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| Disponibilidad | (Tiempo activo / Tiempo total) × 100 | > 99% |
| Calificaciones diarias | Conteo por día | > 20 por sede |
| Tasa de comentarios | (Con comentario / Total) × 100 | > 10% |

### 7.2 KPIs de Satisfacción

| Indicador | Fórmula | Meta |
|-----------|---------|------|
| Satisfacción general | (Calif. 3 / Total) × 100 | > 80% |
| Tasa de insatisfacción | (Calif. 1 / Total) × 100 | < 5% |
| NPS aproximado | % Buenos - % Malos | > 70 |

### 7.3 Reportes Sugeridos

**Reporte Diario:**
- Total calificaciones por sede
- Calificaciones negativas del día

**Reporte Semanal:**
- Tendencia de satisfacción
- Top comentarios negativos
- Comparativa entre sedes

**Reporte Mensual:**
- Resumen ejecutivo
- Análisis de tendencias
- Recomendaciones de mejora

---

## 8. Costos y Recursos

### 8.1 Costos de Infraestructura

| Recurso | Costo | Notas |
|---------|-------|-------|
| Google Sheets | $0 | Incluido en Google Workspace |
| Google Apps Script | $0 | Dentro de cuotas gratuitas |
| Hosting Frontend | Variable | GitHub Pages = $0 |

### 8.2 Recursos Humanos

| Rol | Dedicación Estimada |
|-----|---------------------|
| Admin Sede | 10 min/día (verificación) |
| Admin TI | 2 hrs/mes (mantenimiento) |
| Analista | 4 hrs/mes (reportes) |

### 8.3 Cuotas de Google Apps Script

| Tipo de Cuota | Límite Diario |
|---------------|---------------|
| Ejecuciones | 20,000 |
| Tiempo total | 6 horas |
| Llamadas URL Fetch | 20,000 |

---

## 9. Cumplimiento y Privacidad

### 9.1 Datos Recopilados

| Dato | Clasificación | Retención |
|------|---------------|-----------|
| Número de factura | Operacional | 12 meses |
| Calificación | Operacional | 12 meses |
| Comentario | Feedback | 12 meses |
| Timestamp | Metadato | 12 meses |

### 9.2 Datos NO Recopilados

- Nombre del cliente
- Información de contacto
- Datos de pago
- Dirección IP
- Cookies de identificación

### 9.3 Política de Retención

- **Datos activos:** 12 meses en Google Sheets
- **Archivo:** Mover a hoja separada después de 12 meses
- **Eliminación:** Según política interna de la empresa

---

## 10. Control de Cambios

### 10.1 Proceso de Cambios

```
┌─────────────────┐
│ Solicitud de    │
│ Cambio          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Evaluación de   │
│ Impacto         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Aprobación      │
│ (Propietario)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Implementación  │
│ (Admin TI)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pruebas         │
│ (Admin Sede)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Documentación   │
│ Actualizada     │
└─────────────────┘
```

### 10.2 Registro de Cambios

| Fecha | Versión | Cambio | Aprobado por |
|-------|---------|--------|--------------|
| 2024-12 | 1.0.0 | Versión inicial | - |
| 2024-12 | 1.1.0 | Selector de sede con PIN | - |
| 2024-12 | 1.2.0 | Colores y prefijo dinámicos | - |

---

## 11. Plan de Contingencia

### 11.1 Escenario: Sistema Caído

**Acción inmediata:**
1. Notificar a sedes afectadas
2. Habilitar formulario alternativo (Google Forms)
3. Diagnósticar causa raíz

**Formulario de respaldo:**
- Crear Google Form con campos básicos
- Compartir enlace con administradores de sede
- Datos se pueden migrar posteriormente

### 11.2 Escenario: Datos Corruptos

**Acción inmediata:**
1. Detener uso del sistema
2. Restaurar último respaldo
3. Verificar integridad de datos

### 11.3 Escenario: Cuota Excedida

**Acción inmediata:**
1. El sistema dejará de funcionar temporalmente
2. Se restablece automáticamente al día siguiente
3. Considerar reducir frecuencia de uso o upgrade de plan

---

## 12. Documentos Relacionados

| Documento | Ubicación |
|-----------|-----------|
| Documentación Técnica | `docs/DOCUMENTACION_TECNICA.md` |
| Documentación Funcional | `docs/DOCUMENTACION_FUNCIONAL.md` |
| Manual de Usuario | `docs/MANUAL_DE_USO.md` |
| Guía de Instalación | `INSTRUCCIONES.md` |
