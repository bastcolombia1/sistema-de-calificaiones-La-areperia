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
const SHEET_ALERTS = 'ConfigAlertas';

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
      case 'checkInvoice':
        result = checkDuplicateInvoice(e.parameter.numero_factura);
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
      case 'getDashboardData':
        result = getDashboardData();
        break;
      case 'getAlertConfig':
        result = { success: true, config: getAlertConfig() };
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
  const idxValidarDuplicados = headers.indexOf('validar_duplicados');
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
            prefijo_factura: idxPrefijoFactura >= 0 ? (data[i][idxPrefijoFactura] || '') : '',
            validar_duplicados: idxValidarDuplicados >= 0 ? (data[i][idxValidarDuplicados] === true || data[i][idxValidarDuplicados] === 'TRUE' || data[i][idxValidarDuplicados] === 'BLOQUEAR' ? 'BLOQUEAR' : (data[i][idxValidarDuplicados] === 'ADVERTIR' ? 'ADVERTIR' : 'NO')) : 'NO'
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
 * Verifica si una factura ya fue calificada
 * @param {string} numeroFactura - Número de factura completo (con prefijo)
 * @returns {Object} Resultado indicando si existe duplicado
 */
function checkDuplicateInvoice(numeroFactura) {
  if (!numeroFactura) {
    return { success: false, error: 'Número de factura requerido' };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_RATINGS);
  const data = sheet.getDataRange().getValues();

  // La columna de número de factura es la 4 (índice 3)
  const facturaUpperCase = numeroFactura.toUpperCase().trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]).toUpperCase().trim() === facturaUpperCase) {
      return {
        success: true,
        exists: true,
        message: 'Esta factura ya fue calificada anteriormente'
      };
    }
  }

  return {
    success: true,
    exists: false
  };
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

  // Enviar alerta si la calificación es baja
  try {
    const alertConfig = getAlertConfig();
    if (alertConfig.alertas_activas && calificacion <= alertConfig.umbral_alerta) {
      sendAlertEmail({
        codigo_pv: data.codigo_pv,
        nombre_pv: configResult.config.nombre_pv,
        numero_factura: data.numero_factura.toUpperCase().trim(),
        calificacion: calificacion,
        comentario: data.comentario || ''
      }, alertConfig);
    }
  } catch (alertError) {
    // No fallar la respuesta si el email falla
    Logger.log('Error enviando alerta: ' + alertError.message);
  }

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
 * Obtiene todos los datos para el dashboard de métricas
 * Retorna todas las calificaciones y sedes en una sola llamada
 * @returns {Object} Datos completos para el dashboard
 */
function getDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // --- Obtener sedes activas ---
  const configSheet = ss.getSheetByName(SHEET_CONFIG);
  const configData = configSheet.getDataRange().getValues();
  const configHeaders = configData[0];

  const idxCodigo = configHeaders.indexOf('codigo_pv');
  const idxNombrePv = configHeaders.indexOf('nombre_pv');
  const idxNombreMarca = configHeaders.indexOf('nombre_marca');
  const idxActivo = configHeaders.indexOf('activo');

  const sedes = [];
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][idxActivo] === true || configData[i][idxActivo] === 'TRUE') {
      sedes.push({
        codigo_pv: configData[i][idxCodigo],
        nombre_pv: configData[i][idxNombrePv],
        nombre_marca: configData[i][idxNombreMarca]
      });
    }
  }

  // --- Obtener todas las calificaciones ---
  const ratingsSheet = ss.getSheetByName(SHEET_RATINGS);
  const ratingsData = ratingsSheet.getDataRange().getValues();

  const ratings = [];
  for (let i = 1; i < ratingsData.length; i++) {
    const timestamp = ratingsData[i][0];
    const isoDate = timestamp instanceof Date
      ? timestamp.toISOString()
      : String(timestamp);

    ratings.push({
      timestamp: isoDate,
      codigo_pv: ratingsData[i][1],
      nombre_pv: ratingsData[i][2],
      numero_factura: ratingsData[i][3],
      calificacion: parseInt(ratingsData[i][4]) || 0,
      comentario: String(ratingsData[i][5] || '')
    });
  }

  return {
    success: true,
    sedes: sedes,
    ratings: ratings,
    generated_at: new Date().toISOString()
  };
}

// ========================================
// Alertas y Reportes
// ========================================

/**
 * Lee la configuración de alertas desde la hoja ConfigAlertas
 * @returns {Object} Configuración de alertas
 */
function getAlertConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ALERTS);

  if (!sheet) {
    return {
      emails_alerta: '',
      alertas_activas: false,
      umbral_alerta: 2,
      reporte_semanal: false,
      url_dashboard: ''
    };
  }

  const data = sheet.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < data.length; i++) {
    const clave = String(data[i][0]).trim();
    let valor = data[i][1];

    if (valor === true || valor === 'TRUE') valor = true;
    else if (valor === false || valor === 'FALSE') valor = false;
    else if (!isNaN(valor) && valor !== '') valor = Number(valor);

    if (clave) config[clave] = valor;
  }

  return {
    emails_alerta: String(config.emails_alerta || ''),
    alertas_activas: config.alertas_activas === true,
    umbral_alerta: parseInt(config.umbral_alerta) || 2,
    reporte_semanal: config.reporte_semanal === true,
    url_dashboard: String(config.url_dashboard || '')
  };
}

/**
 * Envía alerta por email cuando hay una calificación baja
 * @param {Object} ratingData - Datos de la calificación
 * @param {Object} alertConfig - Configuración de alertas
 */
function sendAlertEmail(ratingData, alertConfig) {
  const emails = alertConfig.emails_alerta.split(',').map(function(e) { return e.trim(); }).filter(Boolean);
  if (emails.length === 0) return;

  const calLabels = { 1: 'Malo', 2: 'Regular', 3: 'Bueno' };
  const calColors = { 1: '#dc3545', 2: '#ffc107', 3: '#28a745' };
  const cal = ratingData.calificacion;
  const label = calLabels[cal] || cal;
  const color = calColors[cal] || '#333';

  const subject = '⚠️ Alerta: Calificación ' + label + ' en ' + ratingData.nombre_pv;

  const dashLink = alertConfig.url_dashboard
    ? '<a href="' + alertConfig.url_dashboard + '" style="display:inline-block;padding:10px 24px;background:#c8102e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">Ver Dashboard</a>'
    : '';

  const comentarioRow = ratingData.comentario
    ? '<tr><td style="padding:8px 12px;color:#666;font-weight:600;">Comentario</td><td style="padding:8px 12px;">' + ratingData.comentario + '</td></tr>'
    : '';

  const html = '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f0f2f5;">' +
    '<div style="max-width:520px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">' +
      '<div style="background:' + color + ';padding:20px 24px;color:#fff;">' +
        '<h2 style="margin:0;font-size:18px;">⚠️ Calificación ' + label + '</h2>' +
        '<p style="margin:4px 0 0;font-size:14px;opacity:0.9;">' + ratingData.nombre_pv + '</p>' +
      '</div>' +
      '<div style="padding:24px;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
          '<tr><td style="padding:8px 12px;color:#666;font-weight:600;">Sede</td><td style="padding:8px 12px;">' + ratingData.nombre_pv + '</td></tr>' +
          '<tr style="background:#f9f9f9;"><td style="padding:8px 12px;color:#666;font-weight:600;">Calificación</td><td style="padding:8px 12px;"><span style="display:inline-block;padding:2px 12px;border-radius:12px;background:' + color + ';color:#fff;font-weight:700;">' + label + ' (' + cal + ')</span></td></tr>' +
          '<tr><td style="padding:8px 12px;color:#666;font-weight:600;">Factura</td><td style="padding:8px 12px;">' + ratingData.numero_factura + '</td></tr>' +
          comentarioRow +
          '<tr style="background:#f9f9f9;"><td style="padding:8px 12px;color:#666;font-weight:600;">Fecha</td><td style="padding:8px 12px;">' + new Date().toLocaleString('es-CO') + '</td></tr>' +
        '</table>' +
        '<div style="text-align:center;margin-top:20px;">' + dashLink + '</div>' +
      '</div>' +
      '<div style="padding:12px 24px;background:#f9f9f9;text-align:center;font-size:12px;color:#999;">' +
        'Sistema de Calificaciones - La Arepería' +
      '</div>' +
    '</div>' +
  '</body></html>';

  MailApp.sendEmail({
    to: emails.join(','),
    subject: subject,
    htmlBody: html
  });
}

/**
 * Envía reporte semanal con métricas de los últimos 7 días
 * Diseñado para ejecutarse con trigger los Lunes a las 8am
 */
function sendWeeklyReport() {
  const alertConfig = getAlertConfig();
  if (!alertConfig.reporte_semanal) return;

  const emails = alertConfig.emails_alerta.split(',').map(function(e) { return e.trim(); }).filter(Boolean);
  if (emails.length === 0) return;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Obtener sedes
  const configSheet = ss.getSheetByName(SHEET_CONFIG);
  const configData = configSheet.getDataRange().getValues();
  const configHeaders = configData[0];
  const idxCodigo = configHeaders.indexOf('codigo_pv');
  const idxNombrePv = configHeaders.indexOf('nombre_pv');
  const idxActivo = configHeaders.indexOf('activo');

  const sedes = {};
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][idxActivo] === true || configData[i][idxActivo] === 'TRUE') {
      sedes[configData[i][idxCodigo]] = configData[i][idxNombrePv];
    }
  }

  // Obtener calificaciones de los últimos 7 días
  const ratingsSheet = ss.getSheetByName(SHEET_RATINGS);
  const ratingsData = ratingsSheet.getDataRange().getValues();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekRatings = [];
  const negativosConComentario = [];

  for (let i = 1; i < ratingsData.length; i++) {
    const timestamp = ratingsData[i][0];
    if (!(timestamp instanceof Date) || timestamp < weekAgo) continue;

    const cal = parseInt(ratingsData[i][4]) || 0;
    const comentario = String(ratingsData[i][5] || '').trim();

    weekRatings.push({
      codigo_pv: ratingsData[i][1],
      nombre_pv: ratingsData[i][2],
      calificacion: cal,
      comentario: comentario,
      timestamp: timestamp
    });

    if (cal <= 2 && comentario) {
      negativosConComentario.push({
        nombre_pv: ratingsData[i][2],
        calificacion: cal,
        comentario: comentario,
        fecha: timestamp.toLocaleDateString('es-CO')
      });
    }
  }

  // Calcular stats generales
  const total = weekRatings.length;
  let bueno = 0, regular = 0, malo = 0, sum = 0;
  for (const r of weekRatings) {
    sum += r.calificacion;
    if (r.calificacion === 3) bueno++;
    else if (r.calificacion === 2) regular++;
    else if (r.calificacion === 1) malo++;
  }
  const promedio = total > 0 ? (sum / total).toFixed(2) : '-';
  const pctBueno = total > 0 ? (bueno / total * 100).toFixed(1) : '0';
  const pctRegular = total > 0 ? (regular / total * 100).toFixed(1) : '0';
  const pctMalo = total > 0 ? (malo / total * 100).toFixed(1) : '0';

  // Stats por sede
  const sedeMap = {};
  for (const code in sedes) {
    sedeMap[code] = { nombre: sedes[code], total: 0, sum: 0, bueno: 0, regular: 0, malo: 0 };
  }
  for (const r of weekRatings) {
    if (!sedeMap[r.codigo_pv]) {
      sedeMap[r.codigo_pv] = { nombre: r.nombre_pv, total: 0, sum: 0, bueno: 0, regular: 0, malo: 0 };
    }
    const s = sedeMap[r.codigo_pv];
    s.total++;
    s.sum += r.calificacion;
    if (r.calificacion === 3) s.bueno++;
    else if (r.calificacion === 2) s.regular++;
    else if (r.calificacion === 1) s.malo++;
  }

  const sedeStats = Object.values(sedeMap)
    .filter(function(s) { return s.total > 0; })
    .sort(function(a, b) { return (b.sum / b.total) - (a.sum / a.total) || b.total - a.total; });

  const mejorSede = sedeStats.length > 0 ? sedeStats[0] : null;
  const peorSede = sedeStats.length > 1 ? sedeStats[sedeStats.length - 1] : null;

  // Periodo
  const fechaDesde = weekAgo.toLocaleDateString('es-CO');
  const fechaHasta = now.toLocaleDateString('es-CO');

  // Construir HTML del reporte
  const dashLink = alertConfig.url_dashboard
    ? '<a href="' + alertConfig.url_dashboard + '" style="display:inline-block;padding:12px 28px;background:#c8102e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Ver Dashboard Completo</a>'
    : '';

  // Filas de tabla de sedes
  let sedeRows = '';
  for (let i = 0; i < sedeStats.length; i++) {
    const s = sedeStats[i];
    const avg = (s.sum / s.total).toFixed(2);
    const bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
    const bPct = (s.bueno / s.total * 100).toFixed(0);
    const rPct = (s.regular / s.total * 100).toFixed(0);
    const mPct = (s.malo / s.total * 100).toFixed(0);

    sedeRows +=
      '<tr style="background:' + bg + ';">' +
        '<td style="padding:8px 12px;font-weight:600;">' + s.nombre + '</td>' +
        '<td style="padding:8px 12px;text-align:center;">' + s.total + '</td>' +
        '<td style="padding:8px 12px;text-align:center;">' + avg + '</td>' +
        '<td style="padding:8px 12px;">' +
          '<div style="display:flex;height:16px;border-radius:4px;overflow:hidden;min-width:100px;">' +
            '<div style="width:' + bPct + '%;background:#28a745;height:100%;"></div>' +
            '<div style="width:' + rPct + '%;background:#ffc107;height:100%;"></div>' +
            '<div style="width:' + mPct + '%;background:#dc3545;height:100%;"></div>' +
          '</div>' +
          '<span style="font-size:11px;color:#999;">' + s.bueno + '/' + s.regular + '/' + s.malo + '</span>' +
        '</td>' +
      '</tr>';
  }

  // Filas de comentarios negativos (max 10)
  let comentariosHtml = '';
  if (negativosConComentario.length > 0) {
    const calLabels = { 1: 'Malo', 2: 'Regular' };
    const calColors = { 1: '#dc3545', 2: '#ffc107' };
    const maxComentarios = negativosConComentario.slice(0, 10);

    let comentarioRows = '';
    for (let i = 0; i < maxComentarios.length; i++) {
      const c = maxComentarios[i];
      const bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
      const calColor = calColors[c.calificacion] || '#999';
      comentarioRows +=
        '<tr style="background:' + bg + ';">' +
          '<td style="padding:6px 10px;font-size:13px;">' + c.fecha + '</td>' +
          '<td style="padding:6px 10px;font-size:13px;">' + c.nombre_pv + '</td>' +
          '<td style="padding:6px 10px;text-align:center;"><span style="display:inline-block;padding:1px 8px;border-radius:10px;background:' + calColor + ';color:#fff;font-size:11px;font-weight:700;">' + calLabels[c.calificacion] + '</span></td>' +
          '<td style="padding:6px 10px;font-size:13px;">' + c.comentario + '</td>' +
        '</tr>';
    }

    comentariosHtml =
      '<div style="margin-top:24px;">' +
        '<h3 style="font-size:16px;color:#333;margin-bottom:12px;">💬 Comentarios Negativos (' + negativosConComentario.length + ')</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
          '<tr style="background:#f0f2f5;"><th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;">Fecha</th><th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;">Sede</th><th style="padding:8px 10px;text-align:center;font-size:12px;color:#666;">Cal.</th><th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;">Comentario</th></tr>' +
          comentarioRows +
        '</table>' +
        (negativosConComentario.length > 10 ? '<p style="font-size:12px;color:#999;margin-top:8px;">...y ' + (negativosConComentario.length - 10) + ' más</p>' : '') +
      '</div>';
  }

  // Highlights
  let highlightsHtml = '';
  if (mejorSede) {
    highlightsHtml += '<div style="display:inline-block;padding:8px 16px;background:#d4edda;color:#155724;border-radius:6px;margin-right:8px;margin-bottom:8px;font-size:13px;">🏆 Mejor: <strong>' + mejorSede.nombre + '</strong> (' + (mejorSede.sum / mejorSede.total).toFixed(2) + ')</div>';
  }
  if (peorSede && peorSede !== mejorSede) {
    highlightsHtml += '<div style="display:inline-block;padding:8px 16px;background:#f8d7da;color:#721c24;border-radius:6px;margin-bottom:8px;font-size:13px;">⚠️ A mejorar: <strong>' + peorSede.nombre + '</strong> (' + (peorSede.sum / peorSede.total).toFixed(2) + ')</div>';
  }

  const html = '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f0f2f5;">' +
    '<div style="max-width:640px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">' +
      // Header
      '<div style="background:#c8102e;padding:24px;color:#fff;text-align:center;">' +
        '<h1 style="margin:0;font-size:20px;">📊 Reporte Semanal</h1>' +
        '<p style="margin:6px 0 0;font-size:14px;opacity:0.9;">La Arepería · ' + fechaDesde + ' - ' + fechaHasta + '</p>' +
      '</div>' +
      '<div style="padding:24px;">' +
        // Summary cards
        '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:100px;text-align:center;padding:16px;background:#f0f2f5;border-radius:8px;"><div style="font-size:28px;font-weight:700;color:#333;">' + total + '</div><div style="font-size:11px;color:#999;text-transform:uppercase;">Total</div></div>' +
          '<div style="flex:1;min-width:100px;text-align:center;padding:16px;background:#f0f2f5;border-radius:8px;"><div style="font-size:28px;font-weight:700;color:#333;">' + promedio + '</div><div style="font-size:11px;color:#999;text-transform:uppercase;">Promedio</div></div>' +
          '<div style="flex:1;min-width:100px;text-align:center;padding:16px;background:#d4edda;border-radius:8px;"><div style="font-size:28px;font-weight:700;color:#155724;">' + bueno + '</div><div style="font-size:11px;color:#155724;text-transform:uppercase;">Bueno (' + pctBueno + '%)</div></div>' +
          '<div style="flex:1;min-width:100px;text-align:center;padding:16px;background:#fff3cd;border-radius:8px;"><div style="font-size:28px;font-weight:700;color:#856404;">' + regular + '</div><div style="font-size:11px;color:#856404;text-transform:uppercase;">Regular (' + pctRegular + '%)</div></div>' +
          '<div style="flex:1;min-width:100px;text-align:center;padding:16px;background:#f8d7da;border-radius:8px;"><div style="font-size:28px;font-weight:700;color:#721c24;">' + malo + '</div><div style="font-size:11px;color:#721c24;text-transform:uppercase;">Malo (' + pctMalo + '%)</div></div>' +
        '</div>' +
        // Highlights
        (highlightsHtml ? '<div style="margin-bottom:20px;">' + highlightsHtml + '</div>' : '') +
        // Tabla de sedes
        (sedeRows ?
          '<h3 style="font-size:16px;color:#333;margin-bottom:12px;">📍 Detalle por Sede</h3>' +
          '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
            '<tr style="background:#f0f2f5;"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;">Sede</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;">Total</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;">Prom.</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;">Distribución</th></tr>' +
            sedeRows +
          '</table>'
        : '<p style="color:#999;text-align:center;padding:20px;">No hubo calificaciones esta semana</p>') +
        // Comentarios negativos
        comentariosHtml +
        // Boton dashboard
        (dashLink ? '<div style="text-align:center;margin-top:28px;">' + dashLink + '</div>' : '') +
      '</div>' +
      // Footer
      '<div style="padding:16px 24px;background:#f9f9f9;text-align:center;font-size:12px;color:#999;">' +
        'Sistema de Calificaciones - La Arepería<br>Reporte generado automáticamente el ' + now.toLocaleString('es-CO') +
      '</div>' +
    '</div>' +
  '</body></html>';

  const subject = '📊 Reporte Semanal - La Arepería (' + fechaDesde + ' al ' + fechaHasta + ')';

  MailApp.sendEmail({
    to: emails.join(','),
    subject: subject,
    htmlBody: html
  });
}

/**
 * Configura los triggers automáticos
 * Ejecutar UNA VEZ manualmente desde el editor de Apps Script
 */
function setupTriggers() {
  // Limpiar triggers existentes de este proyecto
  removeTriggers();

  // Trigger semanal: Lunes a las 8-9am
  ScriptApp.newTrigger('sendWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();

  Logger.log('Trigger semanal configurado: Lunes 8-9am');
}

/**
 * Elimina todos los triggers del proyecto
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
  Logger.log('Todos los triggers eliminados (' + triggers.length + ')');
}

/**
 * Función para probar el envío de alerta manualmente
 */
function testSendAlert() {
  const config = getAlertConfig();
  sendAlertEmail({
    nombre_pv: 'Sede Centro (TEST)',
    codigo_pv: 'PV001',
    calificacion: 1,
    numero_factura: 'TEST-12345',
    comentario: 'Esto es una prueba de alerta'
  }, config);
  Logger.log('Alerta de prueba enviada');
}

/**
 * Función para probar el reporte semanal manualmente
 */
function testWeeklyReport() {
  sendWeeklyReport();
  Logger.log('Reporte semanal de prueba enviado');
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

  // Configurar hoja de Configuracion (solo si no existe, para no borrar datos reales)
  let configSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_CONFIG);
    configSheet.appendRow([
      'codigo_pv',
      'nombre_pv',
      'nombre_marca',
      'logo_url',
      'color_primario',
      'color_secundario',
      'prefijo_factura',
      'validar_duplicados',
      'activo'
    ]);

    // Datos de ejemplo
    configSheet.appendRow(['PV001', 'Sede Centro', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', 'BLOQUEAR', true]);
    configSheet.appendRow(['PV002', 'Sede Norte', 'La Arepería', '', '#c8102e', '#f7e123', 'FENO', 'BLOQUEAR', true]);
  }

  // Configurar hoja de Calificaciones (solo si no existe, para no borrar datos reales)
  let ratingsSheet = ss.getSheetByName(SHEET_RATINGS);
  if (!ratingsSheet) {
    ratingsSheet = ss.insertSheet(SHEET_RATINGS);
    ratingsSheet.appendRow([
      'timestamp',
      'codigo_pv',
      'nombre_pv',
      'numero_factura',
      'calificacion',
      'comentario'
    ]);
  }

  // Configurar hoja de ConfigAlertas (solo si no existe, para no borrar config existente)
  let alertsSheet = ss.getSheetByName(SHEET_ALERTS);
  if (!alertsSheet) {
    alertsSheet = ss.insertSheet(SHEET_ALERTS);
    alertsSheet.appendRow(['clave', 'valor', 'descripcion']);
    alertsSheet.appendRow(['emails_alerta', '', 'Correos destinatarios separados por coma']);
    alertsSheet.appendRow(['alertas_activas', true, 'Habilitar alertas por calificación baja']);
    alertsSheet.appendRow(['umbral_alerta', 2, 'Enviar alerta si calificación <= este valor (1=solo Malo, 2=Malo y Regular)']);
    alertsSheet.appendRow(['reporte_semanal', true, 'Habilitar reporte semanal por email']);
    alertsSheet.appendRow(['url_dashboard', '', 'URL del dashboard (se incluye como enlace en los emails)']);

    // Ajustar ancho de columnas
    alertsSheet.setColumnWidth(1, 180);
    alertsSheet.setColumnWidth(2, 300);
    alertsSheet.setColumnWidth(3, 400);
  }

  Logger.log('Hojas inicializadas correctamente');
}
