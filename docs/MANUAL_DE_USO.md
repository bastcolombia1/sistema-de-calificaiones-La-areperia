# Manual de Uso - Sistema de Calificaciones de Servicio

## Bienvenido

Este manual explica cómo utilizar el Sistema de Calificaciones de Servicio de La Arepería Original. El sistema permite a los clientes calificar su experiencia de forma rápida y sencilla.

---

## Parte 1: Para el Cliente

### ¿Cómo calificar mi experiencia?

#### Paso 1: Ingresar número de factura

Cuando vea la pantalla de inicio:

1. Observe el nombre de la sede en la pantalla
2. Ingrese el número de su factura (sin el prefijo, este se agrega automáticamente)
3. Presione el botón **"Continuar"**

```
┌────────────────────────────────┐
│         [LOGO]                 │
│    La Arepería Original        │
│         NOVENA                 │
│                                │
│  ¡Queremos conocer tu opinión! │
│                                │
│    Número de factura           │
│    ┌──────┬─────────────┐      │
│    │ FENO │ 12345       │      │
│    └──────┴─────────────┘      │
│                                │
│    [ Continuar ]               │
└────────────────────────────────┘
```

#### Paso 2: Seleccionar calificación

1. Vea el número de factura confirmado
2. Toque el emoji que representa su experiencia:
   - 😠 **Malo** - Si tuvo una mala experiencia
   - 😐 **Regular** - Si la experiencia fue normal
   - 😊 **Bueno** - Si tuvo una buena experiencia

3. (Opcional) Escriba un comentario
4. Presione **"Enviar"**

```
┌────────────────────────────────┐
│    ¿Cómo fue tu experiencia?   │
│       Factura: FENO12345       │
│                                │
│    😠        😐        😊      │
│   Malo    Regular    Bueno     │
│                                │
│  ┌────────────────────────┐    │
│  │ Escribe tu comentario  │    │
│  │ (opcional)...          │    │
│  └────────────────────────┘    │
│                                │
│  [Volver]      [Enviar]        │
└────────────────────────────────┘
```

#### Paso 3: ¡Gracias!

1. Verá un mensaje de agradecimiento
2. Puede escanear el código QR para registrarse en promociones
3. La pantalla se reiniciará automáticamente en 30 segundos

```
┌────────────────────────────────┐
│            ✓                   │
│   ¡Gracias por tu opinión!     │
│                                │
│    ┌──────────────┐            │
│    │   [QR CODE]  │            │
│    │              │            │
│    └──────────────┘            │
│   Escanea para registrarte     │
│                                │
│   Se reiniciará en 25 seg...   │
└────────────────────────────────┘
```

---

## Parte 2: Para el Administrador de Sede

### Configuración Inicial del Dispositivo

Cuando el dispositivo es nuevo o necesita reconfigurarse:

#### Paso 1: Acceder a la configuración

**Opción A - Primera vez:**
La pantalla de configuración aparece automáticamente.

**Opción B - Cambiar sede:**
Presione las teclas **Ctrl + Shift + S** simultáneamente.

#### Paso 2: Ingresar PIN

1. Ingrese el PIN de administrador (4 dígitos)
2. Presione **"Verificar"**

```
┌────────────────────────────────┐
│     Configuración de Sede      │
│                                │
│  Ingrese el PIN de administrador│
│                                │
│         ┌────────┐             │
│         │ ****   │             │
│         └────────┘             │
│                                │
│       [ Verificar ]            │
└────────────────────────────────┘
```

> **Nota:** El PIN por defecto es `1234`. Consulte con su supervisor si fue cambiado.

#### Paso 3: Seleccionar sede

1. Seleccione su sede de la lista desplegable
2. Presione **"Guardar Configuración"**

```
┌────────────────────────────────┐
│     Configuración de Sede      │
│                                │
│   Seleccione el punto de venta │
│                                │
│   ┌────────────────────────┐   │
│   │ NOVENA - La Arepería ▼ │   │
│   └────────────────────────┘   │
│                                │
│   [ Guardar Configuración ]    │
│                                │
│   Esta configuración se        │
│   guardará en este dispositivo │
└────────────────────────────────┘
```

#### Paso 4: Verificar

1. Confirme que aparece el logo correcto
2. Confirme que aparece el nombre de su sede
3. Confirme que los colores son los de la marca
4. Realice una calificación de prueba

### Cambiar de Sede

Si necesita cambiar la sede configurada:

1. Presione **Ctrl + Shift + S**
2. Ingrese el PIN
3. Seleccione la nueva sede
4. Guarde la configuración

### Solución de Problemas Comunes

#### El logo no aparece

**Causa:** El archivo de logo no existe o la ruta es incorrecta.
**Qué hacer:** Contacte al administrador TI.

#### "Error de configuración"

**Causa:** No hay conexión a internet o el servidor no responde.
**Qué hacer:**
1. Verifique la conexión WiFi
2. Espere 1 minuto y recargue la página
3. Si persiste, contacte al administrador TI

#### "PIN incorrecto"

**Causa:** El PIN ingresado no es correcto.
**Qué hacer:**
1. Verifique que está ingresando el PIN correcto
2. Consulte con su supervisor
3. El PIN tiene exactamente 4 dígitos

#### La pantalla se queda en "Cargando..."

**Qué hacer:**
1. Espere 30 segundos
2. Recargue la página (presione F5)
3. Si persiste, cierre y abra el navegador
4. Verifique la conexión a internet

#### Los colores no son correctos

**Causa:** La configuración de colores en el sistema está incorrecta.
**Qué hacer:** Contacte al administrador TI para ajustar los colores en Google Sheets.

---

## Parte 3: Para el Analista

### Acceder a los Datos

1. Abra el navegador web
2. Vaya a Google Sheets: [CalificacionesServicio](https://docs.google.com/spreadsheets/d/1x-Q5L1ejuCEGRmsJ5jHlywUH_lcpL79Rnkz886CCiZc/edit)
3. Inicie sesión con su cuenta Google

### Estructura de Datos

#### Hoja "Calificaciones"

| Columna | Contenido | Ejemplo |
|---------|-----------|---------|
| A - timestamp | Fecha y hora | 03/12/2024 15:30:00 |
| B - codigo_pv | Código de sede | PV001 |
| C - nombre_pv | Nombre de sede | NOVENA |
| D - numero_factura | Número completo | FENO12345 |
| E - calificacion | Valor (1, 2 o 3) | 3 |
| F - comentario | Texto del cliente | Excelente servicio |

#### Interpretación de Calificaciones

| Valor | Significado | Color sugerido |
|-------|-------------|----------------|
| 1 | Malo | Rojo |
| 2 | Regular | Amarillo |
| 3 | Bueno | Verde |

### Crear Filtros

1. Seleccione la fila de encabezados
2. Menú: Datos → Crear un filtro
3. Use las flechas en cada columna para filtrar

**Filtros útiles:**
- Por sede (columna C)
- Por calificación (columna E)
- Por fecha (columna A)

### Crear Gráficos

#### Gráfico de Satisfacción

1. Seleccione los datos de calificación
2. Menú: Insertar → Gráfico
3. Elija "Gráfico circular"
4. Configure las etiquetas

#### Gráfico de Tendencia

1. Seleccione datos con fechas y calificaciones
2. Menú: Insertar → Gráfico
3. Elija "Gráfico de líneas"
4. Configure el eje X como fecha

### Exportar Datos

1. Menú: Archivo → Descargar
2. Elija formato:
   - **Excel (.xlsx)** - Para análisis en Excel
   - **CSV (.csv)** - Para importar a otros sistemas
   - **PDF (.pdf)** - Para reportes

### Fórmulas Útiles

#### Contar calificaciones por tipo
```
=CONTAR.SI(E:E, "3")  // Buenos
=CONTAR.SI(E:E, "2")  // Regulares
=CONTAR.SI(E:E, "1")  // Malos
```

#### Porcentaje de satisfacción
```
=CONTAR.SI(E:E, "3") / CONTARA(E2:E) * 100
```

#### Filtrar por sede y fecha
```
=FILTRAR(A:F, B:B="PV001", A:A>=HOY()-7)
```

---

## Parte 4: Referencia Rápida

### Atajos de Teclado

| Atajo | Función |
|-------|---------|
| Ctrl + Shift + S | Abrir configuración de sede |
| Enter | Confirmar en campos de texto |
| F5 | Recargar página |

### Información de Contacto

| Tipo de Problema | Contactar a |
|------------------|-------------|
| Problema técnico | Administrador TI |
| Cambio de configuración | Supervisor de sede |
| Acceso a datos | Propietario del sistema |

### Checklist Diario para Administrador de Sede

- [ ] Verificar que el dispositivo está encendido
- [ ] Verificar conexión a internet
- [ ] Confirmar que aparece el logo correcto
- [ ] Confirmar que aparece el nombre de sede correcto
- [ ] Realizar una calificación de prueba
- [ ] Verificar que el QR es legible

---

## Preguntas Frecuentes

### Para Clientes

**¿Es obligatorio dejar un comentario?**
No, el comentario es opcional. Puede simplemente seleccionar el emoji y enviar.

**¿Qué pasa si me equivoqué de número de factura?**
Presione "Volver" en la pantalla de calificación para corregirlo.

**¿Mi opinión es anónima?**
Sí, no se solicita ningún dato personal.

### Para Administradores

**¿Qué hago si olvido el PIN?**
Contacte a su supervisor o al administrador TI.

**¿Puedo usar el sistema en mi celular?**
Sí, el sistema funciona en cualquier dispositivo con navegador web.

**¿Qué pasa si no hay internet?**
El sistema requiere conexión a internet. Sin conexión, mostrará un error.

**¿Cómo sé si la calificación se guardó?**
Si ve la pantalla de agradecimiento con el QR, la calificación se guardó correctamente.

### Para Analistas

**¿Con qué frecuencia se actualizan los datos?**
Los datos se guardan en tiempo real. Actualice la página de Google Sheets para ver los más recientes.

**¿Puedo modificar los datos de calificaciones?**
Técnicamente sí, pero no es recomendable. Los datos deben mantenerse como fueron ingresados.

**¿Hay límite de calificaciones?**
No hay límite práctico. Google Sheets soporta millones de filas.

---

## Glosario

| Término | Definición |
|---------|------------|
| PIN | Número de identificación personal (4 dígitos) |
| Sede | Punto de venta o sucursal |
| QR | Código de barras bidimensional escaneable |
| Timestamp | Marca de tiempo (fecha y hora) |
| Backend | Servidor que procesa los datos |
| Frontend | Interfaz que ve el usuario |
