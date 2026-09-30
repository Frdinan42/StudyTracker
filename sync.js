// Sistema de sincronización simplificado con JSONBin.io
// Estrategia: La nube es la fuente de verdad

class StudySync {
    constructor() {
        this.binId = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.binId : 'TU_BIN_ID_AQUI';
        this.apiKey = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.apiKey : 'TU_API_KEY_AQUI';
        this.syncIntervalMs = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.syncInterval : 30000;
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.lastSync = null;
        this.syncInterval = null;
    }

    // Guardar datos en la nube
    async saveToCloud(data) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.lastSync = new Date();
                this.updateSyncStatus('synced');
                return true;
            } else {
                const errorText = await response.text();
                console.error('Error guardando en la nube:', response.status, errorText);
                this.updateSyncStatus('error');
                return false;
            }
        } catch (error) {
            console.error('Error guardando en la nube:', error);
            this.updateSyncStatus('error');
            return false;
        }
    }

    // Cargar datos de la nube
    async loadFromCloud() {
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.lastSync = new Date();
                this.updateSyncStatus('synced');
                return result.record;
            } else if (response.status === 404) {
                return null;
            } else {
                const errorText = await response.text();
                console.error('Error cargando de la nube:', response.status, errorText);
                this.updateSyncStatus('error');
                return null;
            }
        } catch (error) {
            console.error('Error cargando de la nube:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    // Actualizar indicador de estado
    updateSyncStatus(status) {
        const indicator = document.getElementById('syncStatus');
        if (!indicator) return;

        const statuses = {
            synced: { text: '✓ Sincronizado', class: 'synced', icon: '✓' },
            syncing: { text: '↻ Sincronizando...', class: 'syncing', icon: '↻' },
            error: { text: '✗ Error de conexión', class: 'error', icon: '✗' },
            offline: { text: '○ Sin conexión', class: 'offline', icon: '○' }
        };

        const s = statuses[status] || statuses.offline;
        indicator.innerHTML = `<span class="sync-icon">${s.icon}</span><span class="sync-text">${s.text}</span>`;
        indicator.className = `sync-indicator ${s.class}`;
    }

    // Iniciar sincronización automática
    startAutoSync(getDataCallback, loadDataCallback, intervalMs = 30000) {
        // Sincronizar inmediatamente al cargar
        this.syncNow(getDataCallback, loadDataCallback);

        // Sincronizar cada X segundos
        this.syncInterval = setInterval(() => {
            this.syncNow(getDataCallback, loadDataCallback);
        }, intervalMs);

        // Sincronizar cuando la página va a cerrarse
        window.addEventListener('beforeunload', () => {
            this.syncNow(getDataCallback, loadDataCallback);
        });

        // Detectar conexión/desconexión
        window.addEventListener('online', () => {
            this.updateSyncStatus('synced');
            this.syncNow(getDataCallback, loadDataCallback);
        });

        window.addEventListener('offline', () => {
            this.updateSyncStatus('offline');
        });
    }

    // Sincronización inmediata - ESTRATEGIA SIMPLE
    async syncNow(getDataCallback, loadDataCallback) {
        if (!navigator.onLine) {
            this.updateSyncStatus('offline');
            return;
        }

        this.updateSyncStatus('syncing');

        // Cargar datos de la nube
        const cloudData = await this.loadFromCloud();
        
        // Obtener datos locales
        const localData = getDataCallback();

        if (cloudData && cloudData.sessions && cloudData.sessions.length > 0) {
            // La nube tiene datos: comparar por cantidad de sesiones
            if (cloudData.sessions.length >= localData.sessions.length) {
                // La nube tiene más o iguales sesiones: cargar de la nube
                loadDataCallback(cloudData);
                this.updateSyncStatus('synced');
            } else {
                // El dispositivo local tiene más sesiones: subir a la nube
                await this.saveToCloud(localData);
            }
        } else {
            // No hay datos en la nube: subir los locales
            await this.saveToCloud(localData);
        }
    }

    // Detener sincronización
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// Crear instancia global
const sync = new StudySync();
