import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useIsMobile } from '../hooks/useIsMobile';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

const PWAInstallBanner = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  // En desarrollo, simular que es instalable después de un delay
  const [devInstallable, setDevInstallable] = useState(false);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        setDevInstallable(true);
      }, 1000); // 1 segundo de delay
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Verificar si el usuario ya cerró el banner en esta sesión
  if (localStorage.getItem('pwaBannerDismissed') === 'true') {
    return null;
  }

  // Determinar si mostrar el banner
  const shouldShow = process.env.NODE_ENV === 'development' 
    ? (isMobile && isVisible && devInstallable)  // En desarrollo: móvil + delay
    : (isMobile && isVisible);  // En producción: solo móvil (sin requerir instalable)

  if (!shouldShow) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    localStorage.setItem('pwaBannerDismissed', 'true');
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg p-4 animate-fadeIn">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-1 bg-black/20 rounded text-xs text-center">
          🧪 Modo desarrollo - Banner simulado
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <FiSmartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">¿Instalar la app?</h3>
            <p className="text-xs opacity-90">Acceso más rápido y funciona offline</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-white text-amber-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors flex items-center gap-1 disabled:opacity-60"
          >
            {isInstalling ? (
              <div className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiDownload className="w-3 h-3" />
            )}
            {isInstalling ? 'Instalando...' : 'Instalar'}
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1"
            aria-label="Cerrar"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner; 