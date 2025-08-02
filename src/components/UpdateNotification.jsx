import { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Iniciar comprobación de actualizaciones
    
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      // Service Worker no disponible
      setChecking(false);
      return;
    }

    let refreshing = false;

    // Detectar cuando se actualiza la página
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Hay una actualización esperando
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Función para verificar actualizaciones
    const checkForUpdates = async () => {
      try {
        // Verificar actualizaciones
        const registration = await navigator.serviceWorker.ready;
        
        // Estado del registration para depuración opcional
        
        // Verificar si hay una actualización esperando
        if (registration.waiting) {
          // Hay una actualización esperando
          setUpdateAvailable(true);
          setChecking(false);
          // Actualizar automáticamente después de 1 segundo
          setTimeout(() => {
            handleAutoUpdate();
          }, 1000);
          return;
        }

        // Forzando verificación de actualización
        await registration.update();
        
        // Esperar un momento y verificar nuevamente
        setTimeout(() => {
          // Verificación posterior
          
          if (registration.waiting) {
            // Actualización detectada después de verificación
            setUpdateAvailable(true);
            setChecking(false);
            // Actualizar automáticamente después de 1 segundo
            setTimeout(() => {
              handleAutoUpdate();
            }, 1000);
          } else {
            setChecking(false);
          }
        }, 3000);

      } catch (error) {
        console.error('Error verificando actualizaciones', error);
        setChecking(false);
      }
    };

    // Detectar actualizaciones disponibles
    navigator.serviceWorker.ready.then((registration) => {
      // Service Worker listo
      
      registration.addEventListener('updatefound', () => {
        // Update found
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          // Worker state changed
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión instalada, actualizando automáticamente
            setUpdateAvailable(true);
            setChecking(false);
            // Actualizar automáticamente después de 1 segundo
            setTimeout(() => {
              handleAutoUpdate();
            }, 1000);
          }
        });
      });
    });

    // Verificar inmediatamente al cargar
    checkForUpdates();

    // Eliminado intervalo de verificación periódica para evitar llamadas innecesarias.
    return () => {};
  }, []);

  const handleAutoUpdate = () => {
    // Actualización automática iniciada
    setUpdating(true);
    
    // Enviar mensaje al service worker para activar la nueva versión
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        // Enviando mensaje SKIP_WAITING
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  };

  // Estado interno: {updateAvailable, updating, checking}

  // Mostrar indicador de verificación
  if (checking && !updateAvailable) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-4 animate-fadeIn">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <FiRefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Verificando actualizaciones...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl shadow-lg p-4 animate-fadeIn">
      <div className="flex items-center justify-center gap-3">
        <div className="bg-white/20 rounded-full p-2">
          <FiRefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">
            {updating ? 'Actualizando automáticamente...' : 'Nueva versión disponible'}
          </h3>
          <p className="text-xs opacity-90">
            {updating ? 'La app se actualizará en segundos' : 'Actualizando automáticamente'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification; 