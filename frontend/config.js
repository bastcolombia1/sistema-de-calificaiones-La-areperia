/**
 * Configuración del Sistema de Calificaciones
 *
 * INSTRUCCIONES:
 * 1. Reemplaza API_URL con la URL de tu Web App de Google Apps Script
 * 2. Configura CODIGO_PV con el código del punto de venta correspondiente
 */

const CONFIG = {
    // URL de la API (Google Apps Script Web App)
    // Reemplazar con tu URL después de publicar el script
    API_URL: 'https://script.google.com/macros/s/AKfycbxz1ZpoMHvNRvj8utoPh7FryoYrcUTU32jwZtFfjWTwjTsHB4SylazrzzvUGouEPcAm3A/exec',

    // PIN de administrador para configurar la sede (4 dígitos)
    ADMIN_PIN: '1234',

    // Tiempo en segundos antes de reiniciar después de calificar
    RESET_TIMEOUT: 30,

    // Modo debug (mostrar logs en consola)
    DEBUG: false
};
