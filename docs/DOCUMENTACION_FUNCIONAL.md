# Documentación Funcional - Sistema de Calificaciones de Servicio

## 1. Descripción General

El Sistema de Calificaciones de Servicio es una aplicación web diseñada para recopilar la opinión de los clientes sobre su experiencia en los puntos de venta de La Arepería. Permite a los clientes calificar el servicio de manera rápida y sencilla utilizando una interfaz intuitiva con emojis.

---

## 2. Objetivos del Sistema

### 2.1 Objetivo Principal
Capturar la satisfacción del cliente en tiempo real para mejorar continuamente la calidad del servicio.

### 2.2 Objetivos Específicos
- Facilitar la recopilación de feedback de clientes
- Centralizar las calificaciones de todas las sedes
- Permitir análisis de tendencias por punto de venta
- Promover la base de datos de clientes mediante código QR

---

## 3. Usuarios del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| Cliente | Persona que realiza la calificación | Pantalla de encuesta |
| Administrador de Sede | Personal que configura el dispositivo | Pantalla de setup (con PIN) |
| Analista | Persona que revisa los datos | Google Sheets (directo) |

---

## 4. Módulos Funcionales

### 4.1 Módulo de Configuración de Sede

**Propósito:** Permitir al administrador seleccionar el punto de venta en el dispositivo.

**Características:**
- Protegido con PIN de 4 dígitos
- Selector con todas las sedes activas
- Configuración persistente (se guarda en el dispositivo)
- Acceso mediante combinación de teclas (Ctrl+Shift+S)

**Flujo:**
1. Ingresar PIN de administrador
2. Seleccionar sede de la lista
3. Guardar configuración

### 4.2 Módulo de Ingreso de Factura

**Propósito:** Vincular la calificación con una transacción específica.

**Características:**
- Campo para número de factura
- Prefijo automático según configuración de sede
- Validación de campo obligatorio
- Conversión automática a mayúsculas

**Datos capturados:**
- Número de factura (con prefijo)

### 4.3 Módulo de Calificación

**Propósito:** Capturar la opinión del cliente sobre el servicio.

**Características:**
- Tres opciones de calificación con emojis:
  - Malo (cara enojada)
  - Regular (cara seria)
  - Bueno (cara feliz)
- Campo opcional para comentarios (máx. 500 caracteres)
- Contador de caracteres en tiempo real

**Datos capturados:**
- Calificación (1, 2 o 3)
- Comentario opcional

### 4.4 Módulo de Agradecimiento

**Propósito:** Confirmar el envío y promover registro en base de datos.

**Características:**
- Mensaje de agradecimiento
- Código QR para registro en base de datos promocional
- Contador regresivo (30 segundos)
- Reinicio automático al finalizar

---

## 5. Flujo de Proceso

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL CLIENTE                            │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │  INICIO  │
     └────┬─────┘
          │
          ▼
┌─────────────────────┐
│ Pantalla de Factura │
│  - Ver logo/marca   │
│  - Ingresar número  │
│  - Clic "Continuar" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pantalla de Rating  │
│  - Ver factura      │
│  - Seleccionar emoji│
│  - Agregar comentario│
│  - Clic "Enviar"    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Enviando...         │
│  (spinner)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pantalla Gracias    │
│  - Mensaje gracias  │
│  - Código QR        │
│  - Cuenta regresiva │
└──────────┬──────────┘
           │
           │ (30 segundos)
           ▼
     ┌──────────┐
     │  INICIO  │ (reinicia automáticamente)
     └──────────┘
```

---

## 6. Reglas de Negocio

### 6.1 Calificaciones

| Código | Etiqueta | Emoji | Significado |
|--------|----------|-------|-------------|
| 1 | Malo | Cara enojada | Experiencia negativa |
| 2 | Regular | Cara seria | Experiencia neutral |
| 3 | Bueno | Cara feliz | Experiencia positiva |

### 6.2 Validaciones

| Campo | Regla | Mensaje de Error |
|-------|-------|------------------|
| Número de factura | Obligatorio | "Por favor ingresa el número de factura" |
| Calificación | Obligatoria | Botón "Enviar" deshabilitado |
| Comentario | Opcional, máx 500 caracteres | - |

### 6.3 Puntos de Venta

- Solo se muestran sedes con estado `activo = TRUE`
- Cada sede tiene configuración independiente de:
  - Colores de marca
  - Prefijo de factura
  - Logo

### 6.4 Temporización

| Evento | Tiempo |
|--------|--------|
| Pantalla de agradecimiento | 30 segundos |
| Reinicio automático | Al terminar cuenta regresiva |

---

## 7. Datos del Sistema

### 7.1 Datos de Entrada (Configuración)

| Dato | Descripción | Ejemplo |
|------|-------------|---------|
| codigo_pv | Identificador de sede | PV001 |
| nombre_pv | Nombre de la sede | Sede Centro |
| nombre_marca | Nombre de la marca | La Arepería |
| logo_url | Ruta del logo | assets/logo.png |
| color_primario | Color de botones | #c8102e |
| color_secundario | Color de fondo | #f7e123 |
| prefijo_factura | Prefijo de facturas | FENO |
| activo | Estado de la sede | TRUE/FALSE |

### 7.2 Datos de Salida (Calificaciones)

| Dato | Descripción | Ejemplo |
|------|-------------|---------|
| timestamp | Fecha y hora | 2024-12-03 15:30:00 |
| codigo_pv | Código de sede | PV001 |
| nombre_pv | Nombre de sede | Sede Centro |
| numero_factura | Número completo | FENO12345 |
| calificacion | Valor numérico | 3 |
| comentario | Texto opcional | Excelente atención |

---

## 8. Integraciones

### 8.1 Google Sheets
- **Tipo:** Base de datos
- **Uso:** Almacenamiento de configuración y calificaciones
- **Acceso:** Lectura/escritura vía API

### 8.2 Código QR Promocional
- **Propósito:** Registro de clientes en base de datos de marketing
- **Ubicación:** Pantalla de agradecimiento
- **Destino:** URL externa (configurable)

---

## 9. Reportes Disponibles

Los datos almacenados en Google Sheets permiten generar:

### 9.1 Métricas por Sede
- Total de calificaciones
- Distribución por tipo (bueno/regular/malo)
- Promedio de satisfacción

### 9.2 Métricas Temporales
- Calificaciones por día/semana/mes
- Tendencias de satisfacción
- Horas pico de feedback

### 9.3 Análisis de Comentarios
- Comentarios negativos para atención inmediata
- Patrones en feedback escrito
- Sugerencias recurrentes

---

## 10. Casos de Uso

### CU-01: Calificar Servicio

**Actor:** Cliente
**Precondiciones:** Dispositivo configurado con sede
**Flujo Principal:**
1. Cliente ingresa número de factura
2. Sistema muestra pantalla de calificación
3. Cliente selecciona emoji de calificación
4. Cliente opcionalmente escribe comentario
5. Cliente presiona "Enviar"
6. Sistema guarda calificación
7. Sistema muestra agradecimiento con QR
8. Sistema reinicia después de 30 segundos

### CU-02: Configurar Sede

**Actor:** Administrador de Sede
**Precondiciones:** Conocer PIN de administrador
**Flujo Principal:**
1. Administrador presiona Ctrl+Shift+S
2. Sistema muestra pantalla de PIN
3. Administrador ingresa PIN correcto
4. Sistema muestra selector de sedes
5. Administrador selecciona sede
6. Administrador presiona "Guardar"
7. Sistema carga configuración de sede
8. Sistema muestra pantalla de factura

### CU-03: Consultar Estadísticas

**Actor:** Analista
**Precondiciones:** Acceso a Google Sheets
**Flujo Principal:**
1. Analista abre Google Sheets
2. Analista navega a hoja "Calificaciones"
3. Analista aplica filtros deseados
4. Analista genera gráficos/tablas dinámicas

---

## 11. Consideraciones de UX

### 11.1 Diseño Visual
- Colores personalizables por marca
- Emojis grandes y reconocibles
- Botones con tamaño táctil adecuado
- Diseño responsive (móvil-first)

### 11.2 Accesibilidad
- Etiquetas aria para lectores de pantalla
- Contraste de colores adecuado
- Tamaño de fuente legible

### 11.3 Experiencia del Cliente
- Proceso simple (3 pasos)
- Tiempo de interacción < 1 minuto
- Feedback visual inmediato
- Sin necesidad de registro/login

---

## 12. Preguntas Frecuentes (FAQ)

**¿Qué pasa si el cliente no tiene número de factura?**
El número es obligatorio. El personal puede proporcionar un número de referencia alternativo.

**¿Se puede calificar múltiples veces la misma factura?**
Sí, el sistema no valida duplicados. Esto permite flexibilidad pero requiere análisis posterior.

**¿Qué pasa si no hay conexión a internet?**
La aplicación requiere conexión. Mostrará error si no puede comunicarse con el servidor.

**¿Los comentarios son anónimos?**
Sí, no se captura información personal del cliente.

**¿Cómo se cambia el PIN de administrador?**
Editando el archivo `config.js` en el servidor/hosting.
