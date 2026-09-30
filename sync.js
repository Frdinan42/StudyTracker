// Sistema de sincronización con JSONBin.io
// Gratis, sin registro, con código de acceso personal

class StudySync {
    constructor() {
        // Cargar configuración del archivo config.js
        this.binId = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.binId : 'TU_BIN_ID_AQUI';
        this.apiKey = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.apiKey : 'TU_API_KEY_AQUI';
        this.syncIntervalMs = (typeof SYNC_CONFIG !== 'undefined') ? SYNC_CONFIG.syncInterval : 30000;
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.lastSync = null;
        this.syncInterval = null;
    }

    // Generar código aleatorio para el bin
    static generateBinId() {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 24; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
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
                // El bin no existe todavía, crearlo
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
            synced: { text: '✓ Sincronizado', class: 'synced' },
            syncing: { text: '↻ Sincronizando...', class: 'syncing' },
            error: { text: '✗ Error de conexión', class: 'error' },
            offline: { text: '○ Sin conexión', class: 'offline' }
        };

        const s = statuses[status] || statuses.offline;
        indicator.textContent = s.text;
        indicator.className = `sync-status ${s.class}`;
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

    // Sincronización inmediata
    async syncNow(getDataCallback, loadDataCallback) {
        if (!navigator.onLine) {
            this.updateSyncStatus('offline');
            return;
        }

        this.updateSyncStatus('syncing');

        // Primero intentar cargar datos de la nube
        const cloudData = await this.loadFromCloud();

        if (cloudData && cloudData.sessions) {
            // Comparar con datos locales
            const localData = getDataCallback();
            const cloudTime = new Date(cloudData.lastModified || 0);
            const localTime = new Date(localData.lastModified || 0);

            // Si la nube tiene datos más recientes, cargarlos
            if (cloudTime > localTime) {
                loadDataCallback(cloudData);
            } else {
                // Si los datos locales son más recientes, subirlos
                await this.saveToCloud(localData);
            }
        } else {
            // No hay datos en la nube, subir los locales
            const localData = getDataCallback();
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
