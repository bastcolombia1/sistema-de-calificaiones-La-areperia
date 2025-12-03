/**
 * Sistema de Calificaciones de Servicio
 * API Google Apps Script
 *
 * Este script maneja las operaciones CRUD para el sistema de calificaciones
 */

// ID del Spreadsheet (extraído de la URL)
const SPREADSHEET_ID = '1x-Q5L1ejuCEGRmsJ5jHlywUH_lcpL79Rnkz886CCiZc';

// Nombres de las hojas
const SHEET_CONFIG = 'Configuracion';
const SHEET_RATINGS = 'Calificaciones';

/**
 * Maneja las solicitudes GET
 * @param {Object} e - Evento de solicitud
 * @returns {TextOutput} Respuesta JSON o JSONP
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback; // Para JSONP
    let result;

    switch(action) {
      case 'getConfig':
        result = getConfig(e.parameter.codigo_pv);
        break;
      case 'getSedes':
        result = getSedes();
        break;
      case 'getStats':
        result = getStats(e.parameter.codigo_pv);
        break;
      case 'saveRating':
        // Permitir guardar via GET para evitar problemas CORS
        result = saveRating({
          codigo_pv: e.parameter.codigo_pv,
          numero_factura: e.parameter.numero_factura,
          calificacion: e.parameter.calificacion,
          comentario: e.parameter.comentario || ''
        });
        break;
      default:
        result = { error: 'Acción no válida' };
    }

    // Si hay callback, devolver JSONP
    if (callback) {
      return jsonpResponse(result, callback);
    }

    return jsonResponse(result);
  } catch (error) {
    const errorResult = { success: false, error: error.message };
    if (e.parameter.callback) {
      return jsonpResponse(errorResult, e.parameter.callback);
    }
    return jsonResponse(errorResult);
  }
}

/**
 * Maneja las solicitudes POST
 * @param {Object} e - Evento de solicitud
 * @returns {TextOutput} Respuesta JSON
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch(action) {
      case 'saveRating':
        return jsonResponse(saveRating(data));
      default:
        return jsonResponse({ error: 'Acción no válida' }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * Obtiene la configuración de un punto de venta
 * @param {string} codigoPv - Código del punto de venta
 * @returns {Object} Configuración del punto de venta
 */
function getConfig(codigoPv) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Buscar índices de columnas
  const idxCodigo = headers.indexOf('codigo_pv');
  const idxNombrePv = headers.indexOf('nombre_pv');
  const idxNombreMarca = headers.indexOf('nombre_marca');
  const idxLogoUrl = headers.indexOf('logo_url');
  const idxColorPrimario = headers.indexOf('color_primario');
  const idxColorSecundario = headers.indexOf('color_secundario');
  const idxPrefijoFactura = headers.indexOf('prefijo_factura');
  const idxActivo = headers.indexOf('activo');

  // Buscar el punto de venta
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxCodigo] === codigoPv) {
      if (data[i][idxActivo] === true || data[i][idxActivo] === 'TRUE') {
        // Convertir URL de Google Drive si es necesario
        let logoUrl = data[i][idxLogoUrl] || '';
        if (logoUrl.includes('drive.google.com/file/d/')) {
          const fileId = logoUrl.match(/\/d\/([^\/]+)/);
          if (fileId) {
            logoUrl = 'https://drive.google.com/uc?export=view&id=' + fileId[1];
          }
        }

        return {
          success: true,
          config: {
            codigo_pv: data[i][idxCodigo],
            nombre_pv: data[i][idxNombrePv],
            nombre_marca: data[i][idxNombreMarca],
            logo_url: logoUrl,
            color_primario: data[i][idxColorPrimario] || '#FF6B35',
            color_secundario: idxColorSecundario >= 0 ? (data[i][idxColorSecundario] || '#f7e123') : '#f7e123',
            prefijo_factura: idxPrefijoFactura >= 0 ? (data[i][idxPrefijoFactura] || '') : ''
          }
        };
      } else {
        return { success: false, error: 'Punto de venta inactivo' };
      }
    }
  }

  return { success: false, error: 'Punto de venta no encontrado' };
}

/**
 * Obtiene la lista de sedes activas
 * @returns {Object} Lista de sedes
 */
function getSedes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Buscar índices de columnas
  const idxCodigo = headers.indexOf('codigo_pv');
  const idxNombrePv = headers.indexOf('nombre_pv');
  const idxNombreMarca = headers.indexOf('nombre_marca');
  const idxActivo = headers.indexOf('activo');

  const sedes = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxActivo] === true || data[i][idxActivo] === 'TRUE') {
      sedes.push({
        codigo_pv: data[i][idxCodigo],
        nombre_pv: data[i][idxNombrePv],
        nombre_marca: data[i][idxNombreMarca]
      });
    }
  }

  return { success: true, sedes: sedes };
}

/**
 * Guarda una calificación
 * @param {Object} data - Datos de la calificación
 * @returns {Object} Resultado de la operación
 */
function saveRating(data) {
  // Validar datos requeridos
  if (!data.codigo_pv || !data.numero_factura || !data.calificacion) {
    return { success: false, error: 'Faltan datos requeridos' };
  }

  // Validar calificación (1 = malo, 2 = regular, 3 = bueno)
  const calificacion = parseInt(data.calificacion);
  if (calificacion < 1 || calificacion > 3) {
    return { success: false, error: 'Calificación no válida' };
  }

  // Obtener nombre del punto de venta
  const configResult = getConfig(data.codigo_pv);
  if (!configResult.success) {
    return configResult;
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_RATINGS);

  // Mapear calificación numérica a texto
  const calificacionTexto = {
    1: '1',
    2: '2',
    3: '3'
  };

  // Agregar fila
  sheet.appendRow([
    new Date(), // timestamp
    data.codigo_pv,
    configResult.config.nombre_pv,
    data.numero_factura.toUpperCase().trim(),
    calificacionTexto[calificacion],
    data.comentario || ''
  ]);

  return {
    success: true,
    message: '¡Gracias por tu calificación!'
  };
}

/**
 * Obtiene estadísticas de un punto de venta
 * @param {string} codigoPv - Código del punto de venta (opcional)
 * @returns {Object} Estadísticas
 */
function getStats(codigoPv) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_RATINGS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: true, stats: { total: 0, bueno: 0, regular: 0, malo: 0 } };
  }

  let stats = { total: 0, bueno: 0, regular: 0, malo: 0 };

  for (let i = 1; i < data.length; i++) {
    // Si se especifica punto de venta, filtrar
    if (codigoPv && data[i][1] !== codigoPv) continue;

    stats.total++;
    const cal = String(data[i][4]).toLowerCase();
    if (cal === 'bueno' || cal === '3') stats.bueno++;
    else if (cal === 'regular' || cal === '2') stats.regular++;
    else if (cal === 'malo' || cal === '1') stats.malo++;
  }

  return { success: true, stats };
}

/**
 * Genera respuesta JSON
 * @param {Object} data - Datos a enviar
 * @returns {TextOutput} Respuesta formateada
 */
function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Genera respuesta JSONP para evitar CORS
 * @param {Object} data - Datos a enviar
 * @param {string} callback - Nombre de la función callback
 * @returns {TextOutput} Respuesta JSONP formateada
 */
function jsonpResponse(data, callback) {
  const jsonData = JSON.stringify(data);
  const output = ContentService.createTextOutput(callback + '(' + jsonData + ')');
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return output;
}

/**
 * Función para probar la configuración (ejecutar manualmente)
 */
function testGetConfig() {
  const result = getConfig('PV001');
  Logger.log(result);
}

/**
 * Función para inicializar las hojas con la estructura correcta
 * Ejecutar UNA VEZ para configurar el spreadsheet
 */
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Configurar hoja de Configuracion
  let configSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_CONFIG);
  }

  // Limpiar y agregar headers
  configSheet.clear();
  configSheet.appendRow([
    'codigo_pv',
    'nombre_pv',
    'nombre_marca',
    'logo_url',
    'color_primario',
    'color_secundario',
    'prefijo_factura',
    'activo'
  ]);

  // Agregar datos de ejemplo
  configSheet.appendRow(['PV001', 'Sede Centro', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', true]);
  configSheet.appendRow(['PV002', 'Sede Norte', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', true]);
  configSheet.appendRow(['PV003', 'Sede Sur', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', true]);
  configSheet.appendRow(['PV004', 'Sede Este', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', true]);
  configSheet.appendRow(['PV005', 'Sede Oeste', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', true]);

  // Configurar hoja de Calificaciones
  let ratingsSheet = ss.getSheetByName(SHEET_RATINGS);
  if (!ratingsSheet) {
    ratingsSheet = ss.insertSheet(SHEET_RATINGS);
  }

  ratingsSheet.clear();
  ratingsSheet.appendRow([
    'timestamp',
    'codigo_pv',
    'nombre_pv',
    'numero_factura',
    'calificacion',
    'comentario'
  ]);

  Logger.log('Hojas inicializadas correctamente');
}
