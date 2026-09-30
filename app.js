// StudyTracker - Aplicación de seguimiento de sesiones de estudio

class StudyTracker {
    constructor() {
        this.sessions = this.loadSessions();
        this.weeklyGoal = this.loadWeeklyGoal();
        this.currentDate = new Date();
        this.deleteSessionId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDateTime();
        this.updateStats();
        this.renderCalendar();
        this.renderSessions();
        this.updateGoalProgress();
        this.populateSubjectFilter();
    }

    // Persistencia
    loadSessions() {
        try {
            const data = localStorage.getItem('studySessions');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error cargando sesiones:', e);
            return [];
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('studySessions', JSON.stringify(this.sessions));
        } catch (e) {
            console.error('Error guardando sesiones:', e);
            this.showToast('Error al guardar. Usa Exportar para respaldar.', 'error');
        }
    }

    loadWeeklyGoal() {
        try {
            const data = localStorage.getItem('weeklyGoal');
            return data ? parseInt(data) : 5;
        } catch (e) {
            return 5;
        }
    }

    saveWeeklyGoal() {
        try {
            localStorage.setItem('weeklyGoal', this.weeklyGoal.toString());
        } catch (e) {
            console.error('Error guardando meta:', e);
        }
    }

    // Exportar datos
    exportData() {
        const data = {
            sessions: this.sessions,
            weeklyGoal: this.weeklyGoal,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studytracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Datos exportados correctamente');
    }

    // Importar datos
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.sessions && Array.isArray(data.sessions)) {
                    this.sessions = data.sessions;
                    this.saveSessions();
                    
                    if (data.weeklyGoal) {
                        this.weeklyGoal = data.weeklyGoal;
                        this.saveWeeklyGoal();
                    }
                    
                    this.updateStats();
                    this.renderCalendar();
                    this.renderSessions();
                    this.updateGoalProgress();
                    this.populateSubjectFilter();
                    
                    this.showToast(`¡Datos importados! ${this.sessions.length} sesiones cargadas`);
                } else {
                    this.showToast('Archivo de respaldo inválido', 'error');
                }
            } catch (err) {
                this.showToast('Error al leer el archivo', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Event Listeners
    setupEventListeners() {
        document.getElementById('studyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSession();
        });

        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('filterSubject').addEventListener('change', () => {
            this.renderSessions();
        });

        document.getElementById('clearFilter').addEventListener('click', () => {
            document.getElementById('filterSubject').value = '';
            this.renderSessions();
        });

        document.getElementById('updateGoal').addEventListener('click', () => {
            this.updateWeeklyGoal();
        });

        // Exportar/Importar
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
                e.target.value = '';
            }
        });

        // Modal
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                this.closeModal();
            }
        });
    }

    setDefaultDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);

        document.getElementById('date').value = dateStr;
        document.getElementById('startTime').value = timeStr;
    }

    // Gestión de sesiones
    addSession() {
        const subject = document.getElementById('subject').value;
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const duration = parseInt(document.getElementById('duration').value);
        const notes = document.getElementById('notes').value.trim();

        if (!subject || !date || !startTime || !duration) {
            this.showToast('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }

        const session = {
            id: Date.now().toString(),
            subject,
            date,
            startTime,
            duration,
            notes,
            createdAt: new Date().toISOString()
        };

        this.sessions.unshift(session);
        this.saveSessions();

        // Reset form
        document.getElementById('studyForm').reset();
        this.setDefaultDateTime();

        // Actualizar UI
        this.updateStats();
        this.renderCalendar();
        this.renderSessions();
        this.updateGoalProgress();
        this.populateSubjectFilter();

        this.showToast('¡Sesión guardada! 🎉');
    }

    deleteSession(id) {
        this.deleteSessionId = id;
        document.getElementById('confirmModal').classList.add('active');
    }

    confirmDelete() {
        if (this.deleteSessionId) {
            this.sessions = this.sessions.filter(s => s.id !== this.deleteSessionId);
            this.saveSessions();
            this.updateStats();
            this.renderCalendar();
            this.renderSessions();
            this.updateGoalProgress();
            this.populateSubjectFilter();
            this.showToast('Sesión eliminada', 'warning');
        }
        this.closeModal();
    }

    closeModal() {
        document.getElementById('confirmModal').classList.remove('active');
        this.deleteSessionId = null;
    }

    // Estadísticas
    updateStats() {
        const totalMinutes = this.sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        document.getElementById('currentStreak').textContent = this.calculateCurrentStreak();
        document.getElementById('totalTime').textContent = `${totalHours}h ${remainingMinutes}m`;
        document.getElementById('totalSessions').textContent = this.sessions.length;
        document.getElementById('bestStreak').textContent = this.calculateBestStreak();
    }

    calculateCurrentStreak() {
        if (this.sessions.length === 0) return 0;

        const studyDates = [...new Set(this.sessions.map(s => s.date))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Si no estudió hoy ni ayer, la racha es 0
        if (studyDates[0] !== today && studyDates[0] !== yesterday) {
            return 0;
        }

        let streak = 1;
        let currentDate = new Date(studyDates[0]);

        for (let i = 1; i < studyDates.length; i++) {
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];

            if (studyDates[i] === prevDateStr) {
                streak++;
                currentDate = new Date(studyDates[i]);
            } else {
                break;
            }
        }

        return streak;
    }

    calculateBestStreak() {
        if (this.sessions.length === 0) return 0;

        const studyDates = [...new Set(this.sessions.map(s => s.date))].sort();
        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < studyDates.length; i++) {
            const prevDate = new Date(studyDates[i - 1]);
            prevDate.setDate(prevDate.getDate() + 1);
            const nextDateStr = prevDate.toISOString().split('T')[0];

            if (studyDates[i] === nextDateStr) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    // Calendario
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const studyDates = new Set(this.sessions.map(s => s.date));
        const today = new Date().toISOString().split('T')[0];

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let html = dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('');

        // Celdas vacías antes del primer día
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Días del mes
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isStudyDay = studyDates.has(dateStr);
            const isToday = dateStr === today;

            let classes = 'calendar-day';
            if (isStudyDay) classes += ' active';
            if (isToday) classes += ' today';

            html += `<div class="${classes}">${day}</div>`;
        }

        document.getElementById('calendarGrid').innerHTML = html;
    }

    // Historial
    renderSessions() {
        const filter = document.getElementById('filterSubject').value;
        let filteredSessions = this.sessions;

        if (filter) {
            filteredSessions = this.sessions.filter(s => s.subject === filter);
        }

        const container = document.getElementById('sessionsList');

        if (filteredSessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <p>No hay sesiones registradas</p>
                    <p style="font-size: 0.9rem; margin-top: 5px;">¡Registra tu primera sesión de estudio!</p>
                </div>
            `;
            return;
        }

        const subjectIcons = {
            'Sostenibilidad aplicada al sistema productivo': '🌱',
            'Sistemas informáticos': '🖥️',
            'Programación': '💻',
            'Lenguajes de marcas y sistemas de gestión de información': '🌐',
            'Itinerario personal para la empleabilidad': '👔',
            'Entornos de desarrollo': '⚙️',
            'Digitalización aplicada a los sectores productivos': '📱',
            'Bases de datos': '🗄️',
            'Desarrollo con IA': '🤖'
        };

        container.innerHTML = filteredSessions.map(session => {
            const icon = subjectIcons[session.subject] || '📖';
            const date = new Date(session.date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });

            return `
                <div class="session-item">
                    <div class="session-icon">${icon}</div>
                    <div class="session-info">
                        <div class="session-subject">${session.subject}</div>
                        <div class="session-meta">
                            ${formattedDate} • ${session.startTime}
                            ${session.notes ? ` • ${session.notes}` : ''}
                        </div>
                    </div>
                    <div class="session-duration">${session.duration} min</div>
                    <button class="session-delete" onclick="tracker.deleteSession('${session.id}')" title="Eliminar">🗑️</button>
                </div>
            `;
        }).join('');
    }

    populateSubjectFilter() {
        const subjects = [...new Set(this.sessions.map(s => s.subject))];
        const select = document.getElementById('filterSubject');
        const currentValue = select.value;

        select.innerHTML = '<option value="">Todas las materias</option>' +
            subjects.map(s => `<option value="${s}">${s}</option>`).join('');

        select.value = currentValue;
    }

    // Meta semanal
    updateGoalProgress() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekSessions = this.sessions.filter(s => {
            const sessionDate = new Date(s.date + 'T00:00:00');
            return sessionDate >= startOfWeek;
        });

        const weeklyMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
        const weeklyHours = Math.floor(weeklyMinutes / 60);
        const weeklyRemainingMinutes = weeklyMinutes % 60;

        const goalMinutes = this.weeklyGoal * 60;
        const progress = Math.min((weeklyMinutes / goalMinutes) * 100, 100);

        document.getElementById('weeklyTime').textContent = `${weeklyHours}h ${weeklyRemainingMinutes}m`;
        document.getElementById('weeklyGoal').textContent = `${this.weeklyGoal}h 0m`;
        document.getElementById('weeklyProgress').style.width = `${progress}%`;

        const message = document.getElementById('goalMessage');
        if (progress >= 100) {
            message.textContent = '🎉 ¡Meta semanal alcanzada! ¡Enhorabuena!';
            message.style.color = 'var(--secondary)';
        } else {
            const remaining = goalMinutes - weeklyMinutes;
            const remainingHours = Math.floor(remaining / 60);
            const remainingMinutes = remaining % 60;
            message.textContent = `¡Estudia ${remainingHours > 0 ? remainingHours + 'h ' : ''}${remainingMinutes}m más para alcanzar tu meta!`;
            message.style.color = 'var(--text-muted)';
        }
    }

    updateWeeklyGoal() {
        const input = document.getElementById('goalHours');
        const value = parseInt(input.value);

        if (value < 1 || value > 168) {
            this.showToast('La meta debe estar entre 1 y 168 horas', 'error');
            return;
        }

        this.weeklyGoal = value;
        this.saveWeeklyGoal();
        this.updateGoalProgress();
        this.showToast('Meta actualizada correctamente');
    }

    // Notificaciones
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Inicializar aplicación
const tracker = new StudyTracker();

// Debug: verificar que todo está cargado
console.log('=== StudyTracker Debug ===');
console.log('SYNC_CONFIG:', typeof SYNC_CONFIG !== 'undefined' ? SYNC_CONFIG : 'NO DEFINIDO');
console.log('sync object:', typeof sync !== 'undefined' ? sync : 'NO DEFINIDO');
console.log('tracker object:', typeof tracker !== 'undefined' ? tracker : 'NO DEFINIDO');

// Iniciar sincronización automática
if (typeof sync !== 'undefined' && typeof SYNC_CONFIG !== 'undefined') {
    console.log('Iniciando sincronización...');
    sync.startAutoSync(
        // Obtener datos locales
        () => {
            console.log('Obteniendo datos locales...');
            return {
                sessions: tracker.sessions,
                weeklyGoal: tracker.weeklyGoal,
                lastModified: new Date().toISOString()
            };
        },
        // Cargar datos de la nube
        (data) => {
            console.log('Datos recibidos de la nube:', data);
            if (data.sessions) {
                tracker.sessions = data.sessions;
                tracker.saveSessions();
                tracker.updateStats();
                tracker.renderCalendar();
                tracker.renderSessions();
                tracker.updateGoalProgress();
                tracker.populateSubjectFilter();
                tracker.showToast('Datos sincronizados desde la nube');
            }
        },
        (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.syncInterval : 30000
    );
} else {
    console.error('Error: sync o SYNC_CONFIG no están definidos');
}
