/**
 * Dashboard de Metricas - Sistema de Calificaciones
 * Logica de agregacion, visualizacion y exportacion
 */
(function() {
    'use strict';

    // ========================================
    // Estado
    // ========================================
    var state = {
        rawSedes: [],
        rawRatings: [],
        filteredRatings: [],
        dateFrom: null,
        dateTo: null,
        trendPeriod: 'day',
        commentPage: 1,
        commentsPerPage: 15,
        commentSedeFilter: '',
        charts: {
            distribution: null,
            sedes: null,
            trend: null
        }
    };

    // ========================================
    // Elementos del DOM
    // ========================================
    var el = {
        loading: document.getElementById('dash-loading'),
        error: document.getElementById('dash-error'),
        errorMsg: document.getElementById('dash-error-msg'),
        btnRetry: document.getElementById('btn-retry'),
        content: document.getElementById('dash-content'),

        dateFrom: document.getElementById('date-from'),
        dateTo: document.getElementById('date-to'),
        btnApplyFilter: document.getElementById('btn-apply-filter'),
        btnClearFilter: document.getElementById('btn-clear-filter'),

        cardTotal: document.getElementById('card-total'),
        cardAverage: document.getElementById('card-average'),
        cardBestSede: document.getElementById('card-best-sede'),
        cardWorstSede: document.getElementById('card-worst-sede'),

        chartDistribution: document.getElementById('chart-distribution'),
        chartSedes: document.getElementById('chart-sedes'),
        chartTrend: document.getElementById('chart-trend'),

        trendToggle: document.querySelectorAll('.trend-toggle .btn'),

        tableSedesBody: document.getElementById('table-sedes-body'),
        tableCommentsBody: document.getElementById('table-comments-body'),
        commentsPagination: document.getElementById('comments-pagination'),
        filterSedeComments: document.getElementById('filter-sede-comments'),

        btnExportCsv: document.getElementById('btn-export-csv'),
        exportHint: document.getElementById('export-hint'),

        // Yesterday
        yesterdaySection: document.getElementById('yesterday-section'),
        yesterdayDate: document.getElementById('yesterday-date'),
        yTotal: document.getElementById('y-total'),
        yBueno: document.getElementById('y-bueno'),
        yRegular: document.getElementById('y-regular'),
        yMalo: document.getElementById('y-malo'),
        yAverage: document.getElementById('y-average'),
        yBarBueno: document.getElementById('y-bar-bueno'),
        yBarRegular: document.getElementById('y-bar-regular'),
        yBarMalo: document.getElementById('y-bar-malo'),
        yesterdaySedes: document.getElementById('yesterday-sedes')
    };

    // ========================================
    // API con JSONP fallback
    // ========================================
    function fetchWithCallback(url) {
        return new Promise(function(resolve, reject) {
            var callbackName = 'dashboard_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);

            window[callbackName] = function(data) {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                resolve(data);
            };

            var script = document.createElement('script');
            script.src = url + '&callback=' + callbackName;
            script.onerror = function() {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error('Error de conexion'));
            };

            document.body.appendChild(script);
        });
    }

    async function fetchDashboardData() {
        var url = CONFIG.API_URL + '?action=getDashboardData';

        try {
            var response = await fetch(url, { method: 'GET', redirect: 'follow' });
            var data = await response.json();
            if (!data.success) throw new Error(data.error || 'Error desconocido');
            return data;
        } catch (fetchError) {
            console.warn('Fetch failed, trying JSONP:', fetchError);
            try {
                var data2 = await fetchWithCallback(url);
                if (!data2.success) throw new Error(data2.error || 'Error desconocido');
                return data2;
            } catch (jsonpError) {
                throw new Error('No se pudo conectar con el servidor');
            }
        }
    }

    // ========================================
    // Funciones de agregacion
    // ========================================
    function computeSummary(ratings) {
        var total = ratings.length;
        if (total === 0) {
            return { total: 0, bueno: 0, regular: 0, malo: 0, average: 0 };
        }

        var bueno = 0, regular = 0, malo = 0, sum = 0;
        for (var i = 0; i < ratings.length; i++) {
            var cal = ratings[i].calificacion;
            sum += cal;
            if (cal === 3) bueno++;
            else if (cal === 2) regular++;
            else if (cal === 1) malo++;
        }

        return { total: total, bueno: bueno, regular: regular, malo: malo, average: sum / total };
    }

    function computeSedeStats(ratings, sedes) {
        var map = {};
        for (var i = 0; i < sedes.length; i++) {
            map[sedes[i].codigo_pv] = {
                codigo_pv: sedes[i].codigo_pv,
                nombre_pv: sedes[i].nombre_pv,
                total: 0, bueno: 0, regular: 0, malo: 0, sum: 0
            };
        }

        for (var j = 0; j < ratings.length; j++) {
            var r = ratings[j];
            if (!map[r.codigo_pv]) {
                map[r.codigo_pv] = {
                    codigo_pv: r.codigo_pv,
                    nombre_pv: r.nombre_pv,
                    total: 0, bueno: 0, regular: 0, malo: 0, sum: 0
                };
            }
            var entry = map[r.codigo_pv];
            entry.total++;
            entry.sum += r.calificacion;
            if (r.calificacion === 3) entry.bueno++;
            else if (r.calificacion === 2) entry.regular++;
            else if (r.calificacion === 1) entry.malo++;
        }

        var result = Object.values(map).map(function(s) {
            return {
                codigo_pv: s.codigo_pv,
                nombre_pv: s.nombre_pv,
                total: s.total,
                bueno: s.bueno,
                regular: s.regular,
                malo: s.malo,
                average: s.total > 0 ? s.sum / s.total : 0
            };
        });

        result.sort(function(a, b) {
            return b.average - a.average || b.total - a.total;
        });

        return result;
    }

    function computeTrend(ratings, period) {
        var groups = {};

        for (var i = 0; i < ratings.length; i++) {
            var r = ratings[i];
            var date = new Date(r.timestamp);
            var key;

            if (period === 'day') {
                key = date.toISOString().slice(0, 10);
            } else if (period === 'week') {
                var day = date.getDay();
                var diff = date.getDate() - day + (day === 0 ? -6 : 1);
                var monday = new Date(date);
                monday.setDate(diff);
                key = monday.toISOString().slice(0, 10);
            } else {
                key = date.toISOString().slice(0, 7);
            }

            if (!groups[key]) {
                groups[key] = { label: key, total: 0, bueno: 0, regular: 0, malo: 0, sum: 0 };
            }
            var g = groups[key];
            g.total++;
            g.sum += r.calificacion;
            if (r.calificacion === 3) g.bueno++;
            else if (r.calificacion === 2) g.regular++;
            else if (r.calificacion === 1) g.malo++;
        }

        var result = Object.values(groups).map(function(g) {
            return {
                label: g.label,
                total: g.total,
                bueno: g.bueno,
                regular: g.regular,
                malo: g.malo,
                average: g.total > 0 ? g.sum / g.total : 0
            };
        });

        result.sort(function(a, b) {
            return a.label.localeCompare(b.label);
        });

        return result;
    }

    function getFilteredComments(ratings, sedeFilter) {
        var filtered = ratings.filter(function(r) {
            return r.comentario && r.comentario.trim() !== '';
        });

        if (sedeFilter) {
            filtered = filtered.filter(function(r) {
                return r.codigo_pv === sedeFilter;
            });
        }

        filtered.sort(function(a, b) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        return filtered;
    }

    function applyDateFilter() {
        var filtered = state.rawRatings;

        if (state.dateFrom) {
            var from = new Date(state.dateFrom + 'T00:00:00');
            filtered = filtered.filter(function(r) {
                return new Date(r.timestamp) >= from;
            });
        }

        if (state.dateTo) {
            var to = new Date(state.dateTo + 'T23:59:59');
            filtered = filtered.filter(function(r) {
                return new Date(r.timestamp) <= to;
            });
        }

        state.filteredRatings = filtered;
    }

    // ========================================
    // Utilidades
    // ========================================
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function showLoading() {
        el.loading.classList.remove('hidden');
        el.error.classList.add('hidden');
        el.content.classList.add('hidden');
    }

    function showError(msg) {
        el.loading.classList.add('hidden');
        el.error.classList.remove('hidden');
        el.content.classList.add('hidden');
        el.errorMsg.textContent = msg;
    }

    function showContent() {
        el.loading.classList.add('hidden');
        el.error.classList.add('hidden');
        el.content.classList.remove('hidden');
    }

    function formatLabel(label, period) {
        if (period === 'month') {
            var parts = label.split('-');
            var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
        }
        if (period === 'week') {
            var d = new Date(label + 'T00:00:00');
            return 'Sem ' + d.getDate() + '/' + (d.getMonth() + 1);
        }
        var p = label.split('-');
        return p[2] + '/' + p[1];
    }

    // ========================================
    // Renderizado
    // ========================================
    function renderSummaryCards() {
        var summary = computeSummary(state.filteredRatings);
        var sedeStats = computeSedeStats(state.filteredRatings, state.rawSedes);

        el.cardTotal.textContent = summary.total.toLocaleString();
        el.cardAverage.textContent = summary.total > 0 ? summary.average.toFixed(2) : '-';

        var sedesWithRatings = sedeStats.filter(function(s) { return s.total > 0; });
        if (sedesWithRatings.length > 0) {
            el.cardBestSede.textContent = sedesWithRatings[0].nombre_pv;
            el.cardWorstSede.textContent = sedesWithRatings[sedesWithRatings.length - 1].nombre_pv;
        } else {
            el.cardBestSede.textContent = '-';
            el.cardWorstSede.textContent = '-';
        }
    }

    function renderDistributionChart() {
        var summary = computeSummary(state.filteredRatings);

        if (state.charts.distribution) {
            state.charts.distribution.destroy();
        }

        if (typeof Chart === 'undefined') return;

        state.charts.distribution = new Chart(el.chartDistribution, {
            type: 'doughnut',
            data: {
                labels: ['Bueno (3)', 'Regular (2)', 'Malo (1)'],
                datasets: [{
                    data: [summary.bueno, summary.regular, summary.malo],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, font: { size: 13 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed;
                                var total = summary.total;
                                var pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return context.label + ': ' + value + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    function renderSedesChart() {
        var sedeStats = computeSedeStats(state.filteredRatings, state.rawSedes);
        var sedesWithRatings = sedeStats.filter(function(s) { return s.total > 0; });

        if (state.charts.sedes) {
            state.charts.sedes.destroy();
        }

        if (typeof Chart === 'undefined') return;

        state.charts.sedes = new Chart(el.chartSedes, {
            type: 'bar',
            data: {
                labels: sedesWithRatings.map(function(s) { return s.nombre_pv; }),
                datasets: [
                    {
                        label: 'Bueno',
                        data: sedesWithRatings.map(function(s) { return s.bueno; }),
                        backgroundColor: '#28a745'
                    },
                    {
                        label: 'Regular',
                        data: sedesWithRatings.map(function(s) { return s.regular; }),
                        backgroundColor: '#ffc107'
                    },
                    {
                        label: 'Malo',
                        data: sedesWithRatings.map(function(s) { return s.malo; }),
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { stacked: true, beginAtZero: true },
                    y: { stacked: true }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 12 } }
                    }
                }
            }
        });
    }

    function renderTrendChart() {
        var trend = computeTrend(state.filteredRatings, state.trendPeriod);

        if (state.charts.trend) {
            state.charts.trend.destroy();
        }

        if (typeof Chart === 'undefined') return;

        var period = state.trendPeriod;

        state.charts.trend = new Chart(el.chartTrend, {
            type: 'line',
            data: {
                labels: trend.map(function(t) { return formatLabel(t.label, period); }),
                datasets: [
                    {
                        label: 'Total',
                        data: trend.map(function(t) { return t.total; }),
                        borderColor: '#c8102e',
                        backgroundColor: 'rgba(200, 16, 46, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Promedio',
                        data: trend.map(function(t) { return parseFloat(t.average.toFixed(2)); }),
                        borderColor: '#007bff',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Cantidad' },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Promedio' },
                        min: 1,
                        max: 3,
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 12 } }
                    }
                }
            }
        });
    }

    function renderSedesTable() {
        var sedeStats = computeSedeStats(state.filteredRatings, state.rawSedes);

        el.tableSedesBody.innerHTML = sedeStats.map(function(s) {
            var bPct = s.total > 0 ? (s.bueno / s.total * 100) : 0;
            var rPct = s.total > 0 ? (s.regular / s.total * 100) : 0;
            var mPct = s.total > 0 ? (s.malo / s.total * 100) : 0;

            return '<tr>' +
                '<td><strong>' + escapeHtml(s.nombre_pv) + '</strong></td>' +
                '<td>' + s.total + '</td>' +
                '<td>' + s.bueno + '</td>' +
                '<td>' + s.regular + '</td>' +
                '<td>' + s.malo + '</td>' +
                '<td><strong>' + (s.total > 0 ? s.average.toFixed(2) : '-') + '</strong></td>' +
                '<td>' +
                    '<div class="inline-bar">' +
                        '<div class="inline-bar__segment inline-bar__segment--bueno" style="width:' + bPct + '%"></div>' +
                        '<div class="inline-bar__segment inline-bar__segment--regular" style="width:' + rPct + '%"></div>' +
                        '<div class="inline-bar__segment inline-bar__segment--malo" style="width:' + mPct + '%"></div>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function renderCommentsTable() {
        var allComments = getFilteredComments(state.filteredRatings, state.commentSedeFilter);
        var totalPages = Math.ceil(allComments.length / state.commentsPerPage) || 1;

        if (state.commentPage > totalPages) state.commentPage = totalPages;
        if (state.commentPage < 1) state.commentPage = 1;

        var start = (state.commentPage - 1) * state.commentsPerPage;
        var pageComments = allComments.slice(start, start + state.commentsPerPage);

        var ratingLabels = { 1: 'Malo', 2: 'Regular', 3: 'Bueno' };

        if (pageComments.length === 0) {
            el.tableCommentsBody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">' +
                'No hay comentarios en el rango seleccionado</td></tr>';
        } else {
            el.tableCommentsBody.innerHTML = pageComments.map(function(r) {
                var date = new Date(r.timestamp);
                var dateStr = date.toLocaleDateString('es-CO', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                }) + ' ' + date.toLocaleTimeString('es-CO', {
                    hour: '2-digit', minute: '2-digit'
                });

                return '<tr>' +
                    '<td style="white-space:nowrap">' + dateStr + '</td>' +
                    '<td>' + escapeHtml(r.nombre_pv) + '</td>' +
                    '<td>' + escapeHtml(String(r.numero_factura)) + '</td>' +
                    '<td><span class="rating-badge rating-badge--' + r.calificacion + '">' +
                        ratingLabels[r.calificacion] + '</span></td>' +
                    '<td>' + escapeHtml(r.comentario) + '</td>' +
                '</tr>';
            }).join('');
        }

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            el.commentsPagination.innerHTML = '';
            return;
        }

        var html = '';
        html += '<button ' + (state.commentPage === 1 ? 'disabled' : '') +
                ' data-page="' + (state.commentPage - 1) + '">&laquo;</button>';

        var maxVisible = 7;
        var startPage = Math.max(1, state.commentPage - 3);
        var endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += '<button data-page="1">1</button>';
            if (startPage > 2) html += '<span>...</span>';
        }

        for (var i = startPage; i <= endPage; i++) {
            html += '<button data-page="' + i + '"' +
                    (i === state.commentPage ? ' class="active"' : '') +
                    '>' + i + '</button>';
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span>...</span>';
            html += '<button data-page="' + totalPages + '">' + totalPages + '</button>';
        }

        html += '<button ' + (state.commentPage === totalPages ? 'disabled' : '') +
                ' data-page="' + (state.commentPage + 1) + '">&raquo;</button>';

        el.commentsPagination.innerHTML = html;
    }

    function populateSedeFilter() {
        el.filterSedeComments.innerHTML = '<option value="">Todas las sedes</option>';
        for (var i = 0; i < state.rawSedes.length; i++) {
            var option = document.createElement('option');
            option.value = state.rawSedes[i].codigo_pv;
            option.textContent = state.rawSedes[i].nombre_pv;
            el.filterSedeComments.appendChild(option);
        }
    }

    // ========================================
    // Yesterday Section
    // ========================================
    function renderYesterday() {
        // Calcular fecha de ayer
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yYear = yesterday.getFullYear();
        var yMonth = yesterday.getMonth();
        var yDay = yesterday.getDate();

        // Formatear fecha para mostrar
        var dayNames = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
        var monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        el.yesterdayDate.textContent = dayNames[yesterday.getDay()] + ' ' +
            yDay + ' ' + monthNames[yMonth] + ' ' + yYear;

        // Filtrar calificaciones de ayer (sobre rawRatings, no filteredRatings)
        var yesterdayRatings = state.rawRatings.filter(function(r) {
            var d = new Date(r.timestamp);
            return d.getFullYear() === yYear && d.getMonth() === yMonth && d.getDate() === yDay;
        });

        var summary = computeSummary(yesterdayRatings);

        el.yTotal.textContent = summary.total;
        el.yBueno.textContent = summary.bueno;
        el.yRegular.textContent = summary.regular;
        el.yMalo.textContent = summary.malo;
        el.yAverage.textContent = summary.total > 0 ? summary.average.toFixed(2) : '-';

        // Barra de distribucion
        if (summary.total > 0) {
            el.yBarBueno.style.width = (summary.bueno / summary.total * 100) + '%';
            el.yBarRegular.style.width = (summary.regular / summary.total * 100) + '%';
            el.yBarMalo.style.width = (summary.malo / summary.total * 100) + '%';
        } else {
            el.yBarBueno.style.width = '0%';
            el.yBarRegular.style.width = '0%';
            el.yBarMalo.style.width = '0%';
        }

        // Chips por sede
        if (yesterdayRatings.length === 0) {
            el.yesterdaySedes.innerHTML = '<p class="yesterday-empty">No hubo calificaciones ayer</p>';
            return;
        }

        var sedeStats = computeSedeStats(yesterdayRatings, state.rawSedes);
        var sedesWithData = sedeStats.filter(function(s) { return s.total > 0; });

        el.yesterdaySedes.innerHTML = sedesWithData.map(function(s) {
            var avgClass = s.average >= 2.5 ? 'good' : (s.average >= 1.5 ? 'mid' : 'bad');
            return '<span class="yesterday-sede-chip">' +
                escapeHtml(s.nombre_pv) +
                ' <span class="yesterday-sede-chip__count">' + s.total + '</span>' +
                ' <span class="yesterday-sede-chip__avg yesterday-sede-chip__avg--' + avgClass + '">' +
                    s.average.toFixed(1) +
                '</span>' +
            '</span>';
        }).join('');
    }

    // ========================================
    // Export CSV
    // ========================================
    function exportToCsv() {
        var ratings = state.filteredRatings;
        var ratingLabels = { 1: 'Malo', 2: 'Regular', 3: 'Bueno' };

        // BOM para compatibilidad UTF-8 con Excel
        var csv = '\uFEFF';
        csv += 'Fecha,Hora,Codigo PV,Sede,Numero Factura,Calificacion,Calificacion Texto,Comentario\n';

        for (var i = 0; i < ratings.length; i++) {
            var r = ratings[i];
            var date = new Date(r.timestamp);
            var dateStr = date.toLocaleDateString('es-CO');
            var timeStr = date.toLocaleTimeString('es-CO');

            var comment = '"' + (r.comentario || '').replace(/"/g, '""') + '"';
            var factura = '"' + String(r.numero_factura || '').replace(/"/g, '""') + '"';
            var nombrePv = '"' + (r.nombre_pv || '').replace(/"/g, '""') + '"';

            csv += dateStr + ',' + timeStr + ',' +
                   r.codigo_pv + ',' + nombrePv + ',' +
                   factura + ',' + r.calificacion + ',' +
                   (ratingLabels[r.calificacion] || '') + ',' + comment + '\n';
        }

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);

        var filename = 'calificaciones';
        if (state.dateFrom) filename += '_desde_' + state.dateFrom;
        if (state.dateTo) filename += '_hasta_' + state.dateTo;
        filename += '.csv';

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ========================================
    // Render maestro
    // ========================================
    function renderAll() {
        renderSummaryCards();
        renderYesterday();
        renderDistributionChart();
        renderSedesChart();
        renderTrendChart();
        renderSedesTable();
        state.commentPage = 1;
        renderCommentsTable();
    }

    // ========================================
    // Eventos
    // ========================================
    function bindEvents() {
        // Filtro de fechas
        el.btnApplyFilter.addEventListener('click', function() {
            state.dateFrom = el.dateFrom.value || null;
            state.dateTo = el.dateTo.value || null;
            applyDateFilter();
            renderAll();
        });

        el.btnClearFilter.addEventListener('click', function() {
            el.dateFrom.value = '';
            el.dateTo.value = '';
            state.dateFrom = null;
            state.dateTo = null;
            applyDateFilter();
            renderAll();
        });

        // Toggle periodo de tendencia
        el.trendToggle.forEach(function(btn) {
            btn.addEventListener('click', function() {
                el.trendToggle.forEach(function(b) { b.classList.remove('btn--active'); });
                btn.classList.add('btn--active');
                state.trendPeriod = btn.dataset.period;
                renderTrendChart();
            });
        });

        // Filtro sede en comentarios
        el.filterSedeComments.addEventListener('change', function() {
            state.commentSedeFilter = this.value;
            state.commentPage = 1;
            renderCommentsTable();
        });

        // Paginacion (event delegation)
        el.commentsPagination.addEventListener('click', function(e) {
            var target = e.target;
            if (target.tagName === 'BUTTON' && target.dataset.page) {
                state.commentPage = parseInt(target.dataset.page);
                renderCommentsTable();
            }
        });

        // Export
        el.btnExportCsv.addEventListener('click', exportToCsv);

        // Retry
        el.btnRetry.addEventListener('click', loadData);
    }

    // ========================================
    // Inicializacion
    // ========================================
    async function loadData() {
        showLoading();

        try {
            var data = await fetchDashboardData();

            state.rawRatings = data.ratings.map(function(r) {
                return {
                    timestamp: r.timestamp,
                    codigo_pv: r.codigo_pv,
                    nombre_pv: r.nombre_pv,
                    numero_factura: r.numero_factura,
                    calificacion: parseInt(r.calificacion) || 0,
                    comentario: r.comentario || ''
                };
            });
            state.rawSedes = data.sedes;

            state.filteredRatings = state.rawRatings.slice();

            populateSedeFilter();
            renderAll();
            showContent();

        } catch (error) {
            console.error('Dashboard load error:', error);
            showError(error.message || 'Error al cargar datos del dashboard');
        }
    }

    function init() {
        bindEvents();
        loadData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
