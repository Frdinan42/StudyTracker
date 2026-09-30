// ============================================
// CONFIGURACIÓN DE SINCRONIZACIÓN
// ============================================
// 
// Para usar la sincronización necesitas:
// 
// 1. Ir a https://jsonbin.io/ y crear una cuenta gratis
// 2. Crear un nuevo "Bin" (contenedor de datos)
// 3. Copiar el Bin ID y la API Key
// 4. Pegarlos aquí abajo
//
// ============================================

const SYNC_CONFIG = {
    // Tu Bin ID (lo obtienes al crear un bin en jsonbin.io)
    binId: '6abd4bc6ffd5d160533fe6fb',
    
    // Tu API Key (lo obtienes en tu perfil de jsonbin.io)
    apiKey: '$2a$10$kTx.jwxz/1SVg8P9IdzlX.GWD8PgjtD8u7g44H8nPJb93PUYOgMbu',
    
    // Intervalo de sincronización en milisegundos (30 segundos)
    syncInterval: 30000,
    
    // ¿Sincronizar automáticamente al iniciar?
    autoSync: true
};

// ============================================
// INSTRUCCIONES PASO A PASO
// ============================================
//
// PASO 1: Crear cuenta en JSONBin.io
//   - Ve a https://jsonbin.io/
//   - Click en "Sign Up" (gratis)
//   - Regístrate con tu email
//
// PASO 2: Crear un Bin
//   - Una vez logueado, click en "Create a Bin"
//   - Ponle nombre: "studytracker"
//   - Click en "Create"
//
// PASO 3: Copiar el Bin ID
//   - En la página del bin, verás algo como:
//     Bin ID: 68b8f3a7e4b0c5d2a1f4e6c8
//   - Copia ese código
//
// PASO 4: Obtener tu API Key
//   - Ve a tu perfil (foto esquina superior derecha)
//   - Click en "API Keys"
//   - Copia tu "Master Key"
//
// PASO 5: Pegar aquí arriba
//   - Reemplaza 'TU_BIN_ID_AQUI' con tu Bin ID
//   - Reemplaza 'TU_API_KEY_AQUI' con tu API Key
//
// ============================================
