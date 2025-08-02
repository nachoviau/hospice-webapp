// Registrar el service worker
export function registerSW() {
  console.log('Intentando registrar SW...');
  
  if ('serviceWorker' in navigator) {
    console.log('Service Worker soportado');
    
    window.addEventListener('load', () => {
      console.log('Página cargada, registrando SW...');
      
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          console.log('✅ SW registrado exitosamente:', registration.scope);
          console.log('Estado del SW:', registration.active ? 'Activo' : 'Inactivo');
        })
        .catch((error) => {
          console.error('❌ Error registrando SW:', error);
        });
    });
  } else {
    console.log('❌ Service Worker no soportado en este navegador');
  }
} 