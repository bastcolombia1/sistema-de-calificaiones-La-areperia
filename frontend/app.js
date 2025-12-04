/**
 * Sistema de Calificaciones de Servicio
 * Aplicación Frontend
 */

(function() {
    'use strict';

    // ========================================
    // Estado de la aplicación
    // ========================================
    const state = {
        config: null,
        codigoPv: null,
        invoiceNumber: '',
        selectedRating: null,
        comment: '',
        logoTapCount: 0,
        logoTapTimer: null
    };

    // ========================================
    // Elementos del DOM
    // ========================================
    const elements = {
        // Pantallas
        loadingScreen: document.getElementById('loading-screen'),
        errorScreen: document.getElementById('error-screen'),
        setupScreen: document.getElementById('setup-screen'),
        invoiceScreen: document.getElementById('invoice-screen'),
        ratingScreen: document.getElementById('rating-screen'),
        thanksScreen: document.getElementById('thanks-screen'),
        submittingScreen: document.getElementById('submitting-screen'),

        // Mensajes de error
        errorMessage: document.getElementById('error-message'),
        invoiceError: document.getElementById('invoice-error'),

        // Elementos de marca
        brandName: document.getElementById('brand-name'),
        brandNameRating: document.getElementById('brand-name-rating'),
        storeName: document.getElementById('store-name'),
        storeNameRating: document.getElementById('store-name-rating'),
        logo: document.getElementById('logo'),
        logoRating: document.getElementById('logo-rating'),

        // Inputs
        invoiceInput: document.getElementById('invoice-number'),
        commentInput: document.getElementById('comment'),
        charCount: document.getElementById('char-current'),

        // Botones
        btnContinue: document.getElementById('btn-continue'),
        btnBack: document.getElementById('btn-back'),
        btnSubmit: document.getElementById('btn-submit'),
        ratingBtns: document.querySelectorAll('.rating-btn'),

        // Otros
        displayInvoice: document.getElementById('display-invoice'),
        countdown: document.getElementById('countdown'),
        invoicePrefix: document.getElementById('invoice-prefix'),

        // Setup/Admin
        pinSection: document.getElementById('pin-section'),
        sedeSection: document.getElementById('sede-section'),
        adminPin: document.getElementById('admin-pin'),
        pinError: document.getElementById('pin-error'),
        btnVerifyPin: document.getElementById('btn-verify-pin'),
        sedeSelect: document.getElementById('sede-select'),
        btnSaveSede: document.getElementById('btn-save-sede'),
        btnFullscreen: document.getElementById('btn-fullscreen')
    };

    // ========================================
    // Utilidades
    // ========================================
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[RatingApp]', ...args);
        }
    }

    function showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        log('Showing screen:', screenId);
    }

    function setColorTheme(primaryColor, secondaryColor) {
        if (primaryColor) {
            document.documentElement.style.setProperty('--color-primary', primaryColor);
            // Calcular color más oscuro para hover
            const darkerColor = adjustColor(primaryColor, -20);
            document.documentElement.style.setProperty('--color-primary-dark', darkerColor);
        }
        if (secondaryColor) {
            document.documentElement.style.setProperty('--color-background', secondaryColor);
        }
    }

    function adjustColor(hex, percent) {
        // Ajusta la luminosidad de un color hex
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    // ========================================
    // Storage - Guardar/Cargar sede
    // ========================================
    function getSavedSede() {
        return localStorage.getItem('codigo_pv');
    }

    function saveSede(codigoPv) {
        localStorage.setItem('codigo_pv', codigoPv);
    }

    function clearSede() {
        localStorage.removeItem('codigo_pv');
    }

    // ========================================
    // API con soporte CORS para Google Apps Script
    // ========================================

    function fetchWithCallback(url) {
        return new Promise((resolve, reject) => {
            // Crear nombre único para callback
            const callbackName = 'callback_' + Date.now();

            // Crear función callback global
            window[callbackName] = function(data) {
                // Limpiar
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };

            // Crear script tag
            const script = document.createElement('script');
            script.src = url + '&callback=' + callbackName;
            script.onerror = function() {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Error de conexión'));
            };

            document.body.appendChild(script);
        });
    }

    async function fetchConfig(codigoPv) {
        const url = `${CONFIG.API_URL}?action=getConfig&codigo_pv=${codigoPv}`;
        log('Fetching config from:', url);

        try {
            // Intentar con fetch normal primero (funciona si hay CORS habilitado)
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido');
            }
            return data.config;
        } catch (fetchError) {
            log('Fetch failed, trying JSONP:', fetchError);

            // Fallback a JSONP
            try {
                const data = await fetchWithCallback(url);
                if (!data.success) {
                    throw new Error(data.error || 'Error desconocido');
                }
                return data.config;
            } catch (jsonpError) {
                throw new Error('No se pudo conectar con el servidor');
            }
        }
    }

    async function fetchSedes() {
        const url = `${CONFIG.API_URL}?action=getSedes`;
        log('Fetching sedes from:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido');
            }
            return data.sedes;
        } catch (fetchError) {
            log('Fetch failed, trying JSONP:', fetchError);

            try {
                const data = await fetchWithCallback(url);
                if (!data.success) {
                    throw new Error(data.error || 'Error desconocido');
                }
                return data.sedes;
            } catch (jsonpError) {
                throw new Error('No se pudo conectar con el servidor');
            }
        }
    }

    async function checkInvoiceDuplicate(numeroFactura) {
        const url = `${CONFIG.API_URL}?action=checkInvoice&numero_factura=${encodeURIComponent(numeroFactura)}`;
        log('Checking invoice duplicate:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            const data = await response.json();
            return data;
        } catch (fetchError) {
            log('Fetch failed, trying JSONP:', fetchError);

            try {
                const data = await fetchWithCallback(url);
                return data;
            } catch (jsonpError) {
                // Si falla la verificación, permitir continuar
                return { success: true, exists: false };
            }
        }
    }

    async function submitRating(ratingData) {
        log('Submitting rating:', ratingData);

        // Construir URL con parámetros para GET (más compatible con CORS)
        const params = new URLSearchParams({
            action: 'saveRating',
            codigo_pv: ratingData.codigo_pv,
            numero_factura: ratingData.numero_factura,
            calificacion: ratingData.calificacion,
            comentario: ratingData.comentario || ''
        });

        const url = `${CONFIG.API_URL}?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error al guardar');
            }
            return data;
        } catch (fetchError) {
            log('Fetch POST failed, trying JSONP:', fetchError);

            // Fallback a JSONP
            const data = await fetchWithCallback(url);
            if (!data.success) {
                throw new Error(data.error || 'Error al guardar');
            }
            return data;
        }
    }

    // ========================================
    // UI Updates
    // ========================================
    function updateBranding(config) {
        // Nombre de marca
        elements.brandName.textContent = config.nombre_marca;
        elements.brandNameRating.textContent = config.nombre_marca;

        // Nombre de sede
        elements.storeName.textContent = config.nombre_pv;
        elements.storeNameRating.textContent = config.nombre_pv;

        // Logo
        if (config.logo_url) {
            elements.logo.src = config.logo_url;
            elements.logo.classList.remove('hidden');
            elements.logoRating.src = config.logo_url;
            elements.logoRating.classList.remove('hidden');
        }

        // Colores
        setColorTheme(config.color_primario, config.color_secundario);

        // Prefijo de factura
        if (config.prefijo_factura) {
            elements.invoicePrefix.textContent = config.prefijo_factura;
            elements.invoicePrefix.style.display = 'flex';
        } else {
            elements.invoicePrefix.style.display = 'none';
        }
    }

    function resetForm() {
        state.invoiceNumber = '';
        state.selectedRating = null;
        state.comment = '';

        elements.invoiceInput.value = '';
        elements.commentInput.value = '';
        elements.charCount.textContent = '0';

        elements.ratingBtns.forEach(btn => btn.classList.remove('selected'));
        elements.btnSubmit.disabled = true;
        elements.invoiceError.classList.add('hidden');
        elements.invoiceInput.classList.remove('error');
    }

    // ========================================
    // Setup/Admin Handlers
    // ========================================
    function handleVerifyPin() {
        const pin = elements.adminPin.value;

        if (pin === CONFIG.ADMIN_PIN) {
            elements.pinError.classList.add('hidden');
            elements.pinSection.classList.add('hidden');
            elements.sedeSection.classList.remove('hidden');
            loadSedes();
        } else {
            elements.pinError.classList.remove('hidden');
            elements.adminPin.value = '';
            elements.adminPin.focus();
        }
    }

    async function loadSedes() {
        try {
            const sedes = await fetchSedes();
            elements.sedeSelect.innerHTML = '<option value="">Seleccione una sede...</option>';

            sedes.forEach(sede => {
                const option = document.createElement('option');
                option.value = sede.codigo_pv;
                option.textContent = `${sede.nombre_pv} - ${sede.nombre_marca}`;
                elements.sedeSelect.appendChild(option);
            });

            // Si hay una sede guardada, seleccionarla
            const savedSede = getSavedSede();
            if (savedSede) {
                elements.sedeSelect.value = savedSede;
                elements.btnSaveSede.disabled = false;
            }
        } catch (error) {
            log('Error loading sedes:', error);
            elements.sedeSelect.innerHTML = '<option value="">Error al cargar sedes</option>';
        }
    }

    function handleSedeChange() {
        elements.btnSaveSede.disabled = !elements.sedeSelect.value;
    }

    async function handleSaveSede() {
        const codigoPv = elements.sedeSelect.value;
        if (!codigoPv) return;

        showScreen('loading-screen');
        saveSede(codigoPv);
        state.codigoPv = codigoPv;

        try {
            state.config = await fetchConfig(codigoPv);
            updateBranding(state.config);
            showScreen('invoice-screen');
            elements.invoiceInput.focus();
        } catch (error) {
            log('Error loading config:', error);
            elements.errorMessage.textContent = error.message;
            showScreen('error-screen');
        }
    }

    function showSetupScreen() {
        // Reset setup screen
        elements.pinSection.classList.remove('hidden');
        elements.sedeSection.classList.add('hidden');
        elements.adminPin.value = '';
        elements.pinError.classList.add('hidden');
        showScreen('setup-screen');
        elements.adminPin.focus();
    }

    // ========================================
    // Event Handlers
    // ========================================
    function handleInvoiceInput(e) {
        const value = e.target.value.toUpperCase();
        state.invoiceNumber = value;
        elements.invoiceError.textContent = 'Por favor ingresa el número de factura';
        elements.invoiceError.classList.add('hidden');
        elements.invoiceInput.classList.remove('error');
    }

    async function handleContinue() {
        if (!state.invoiceNumber.trim()) {
            elements.invoiceError.classList.remove('hidden');
            elements.invoiceInput.classList.add('error');
            elements.invoiceInput.focus();
            return;
        }

        // Construir número de factura completo con prefijo
        const prefix = state.config.prefijo_factura || '';
        const fullInvoice = prefix + state.invoiceNumber;

        // Verificar duplicados según configuración
        const validarDuplicados = state.config.validar_duplicados || 'NO';

        if (validarDuplicados !== 'NO') {
            elements.btnContinue.disabled = true;
            elements.btnContinue.textContent = 'Verificando...';

            try {
                const checkResult = await checkInvoiceDuplicate(fullInvoice);

                if (checkResult.success && checkResult.exists) {
                    if (validarDuplicados === 'BLOQUEAR') {
                        // Bloquear - no permitir continuar
                        elements.invoiceError.textContent = 'Esta factura ya fue calificada anteriormente';
                        elements.invoiceError.classList.remove('hidden');
                        elements.invoiceInput.classList.add('error');
                        elements.btnContinue.disabled = false;
                        elements.btnContinue.textContent = 'Continuar';
                        return;
                    } else if (validarDuplicados === 'ADVERTIR') {
                        // Advertir - preguntar al usuario
                        const continuar = confirm('Esta factura ya fue calificada anteriormente. ¿Desea enviar otra calificación?');
                        if (!continuar) {
                            elements.btnContinue.disabled = false;
                            elements.btnContinue.textContent = 'Continuar';
                            return;
                        }
                    }
                }
            } catch (error) {
                log('Error checking duplicate:', error);
                // Si hay error, permitir continuar
            }

            elements.btnContinue.disabled = false;
            elements.btnContinue.textContent = 'Continuar';
        }

        // Mostrar factura y continuar
        elements.displayInvoice.textContent = fullInvoice;
        showScreen('rating-screen');
    }

    function handleRatingSelect(e) {
        const btn = e.currentTarget;
        const rating = parseInt(btn.dataset.rating);

        // Actualizar selección visual
        elements.ratingBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Actualizar estado
        state.selectedRating = rating;
        elements.btnSubmit.disabled = false;

        log('Rating selected:', rating);
    }

    function handleCommentInput(e) {
        state.comment = e.target.value;
        elements.charCount.textContent = state.comment.length;
    }

    function handleBack() {
        showScreen('invoice-screen');
        elements.invoiceInput.focus();
    }

    async function handleSubmit() {
        if (!state.selectedRating) return;

        showScreen('submitting-screen');

        // Incluir prefijo en el número de factura
        const prefix = state.config.prefijo_factura || '';
        const fullInvoice = prefix + state.invoiceNumber;

        try {
            await submitRating({
                codigo_pv: state.codigoPv,
                numero_factura: fullInvoice,
                calificacion: state.selectedRating,
                comentario: state.comment
            });

            showScreen('thanks-screen');
            startCountdown();

        } catch (error) {
            log('Submit error:', error);
            alert('Error al enviar la calificación. Por favor intenta de nuevo.');
            showScreen('rating-screen');
        }
    }

    function startCountdown() {
        let seconds = CONFIG.RESET_TIMEOUT;
        elements.countdown.textContent = seconds;

        const interval = setInterval(() => {
            seconds--;
            elements.countdown.textContent = seconds;

            if (seconds <= 0) {
                clearInterval(interval);
                resetForm();
                showScreen('invoice-screen');
                elements.invoiceInput.focus();
            }
        }, 1000);
    }

    // ========================================
    // Accesos secretos para configuración
    // ========================================
    function handleKeyboardShortcut(e) {
        // Ctrl + Shift + S para abrir configuración
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showSetupScreen();
        }
    }

    function handleLogoTap() {
        // Incrementar contador de toques
        state.logoTapCount++;
        log('Logo tap count:', state.logoTapCount);

        // Reiniciar timer
        if (state.logoTapTimer) {
            clearTimeout(state.logoTapTimer);
        }

        // Si llega a 5 toques, abrir configuración
        if (state.logoTapCount >= 5) {
            state.logoTapCount = 0;
            showSetupScreen();
            return;
        }

        // Resetear contador después de 2 segundos de inactividad
        state.logoTapTimer = setTimeout(() => {
            state.logoTapCount = 0;
        }, 2000);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Entrar en pantalla completa
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { // Safari/iOS
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { // IE11
                elem.msRequestFullscreen();
            }
            elements.btnFullscreen.textContent = 'Salir Pantalla Completa';
        } else {
            // Salir de pantalla completa
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            elements.btnFullscreen.textContent = 'Pantalla Completa';
        }
    }

    // ========================================
    // Inicialización
    // ========================================
    function bindEvents() {
        // Input de factura
        elements.invoiceInput.addEventListener('input', handleInvoiceInput);
        elements.invoiceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleContinue();
        });

        // Botón continuar
        elements.btnContinue.addEventListener('click', handleContinue);

        // Botones de calificación
        elements.ratingBtns.forEach(btn => {
            btn.addEventListener('click', handleRatingSelect);
        });

        // Comentario
        elements.commentInput.addEventListener('input', handleCommentInput);

        // Navegación
        elements.btnBack.addEventListener('click', handleBack);
        elements.btnSubmit.addEventListener('click', handleSubmit);

        // Setup/Admin events
        elements.btnVerifyPin.addEventListener('click', handleVerifyPin);
        elements.adminPin.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleVerifyPin();
        });
        elements.sedeSelect.addEventListener('change', handleSedeChange);
        elements.btnSaveSede.addEventListener('click', handleSaveSede);

        // Tecla secreta (Ctrl+Shift+S)
        document.addEventListener('keydown', handleKeyboardShortcut);

        // Tocar logo 5 veces para abrir configuración
        elements.logo.addEventListener('click', handleLogoTap);
        elements.logoRating.addEventListener('click', handleLogoTap);

        // Botón pantalla completa
        elements.btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    async function init() {
        log('Initializing app...');
        log('Config:', CONFIG);

        bindEvents();

        // Verificar si hay una sede guardada
        const savedSede = getSavedSede();

        if (savedSede) {
            state.codigoPv = savedSede;
            log('Sede guardada encontrada:', savedSede);

            try {
                // Cargar configuración de la sede guardada
                state.config = await fetchConfig(savedSede);
                log('Config loaded:', state.config);

                // Actualizar UI con la configuración
                updateBranding(state.config);

                // Mostrar pantalla principal
                showScreen('invoice-screen');
                elements.invoiceInput.focus();

            } catch (error) {
                log('Init error:', error);
                // Si hay error, mostrar pantalla de setup
                clearSede();
                showSetupScreen();
            }
        } else {
            // No hay sede guardada, mostrar pantalla de setup
            log('No hay sede guardada, mostrando setup');
            showSetupScreen();
        }
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
