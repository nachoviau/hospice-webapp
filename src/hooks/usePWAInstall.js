import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔍 usePWAInstall: Iniciando detección...');
    
    // Detectar si ya está instalada
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 PWA ya está instalada');
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Verificar si ya está instalada al cargar
    if (checkIfInstalled()) return;

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎯 beforeinstallprompt disparado');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar cuando se instala la app
    const handleAppInstalled = () => {
      console.log('✅ PWA instalada');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Solo agregar listeners si no está instalada
    if (!checkIfInstalled()) {
      console.log('👂 Agregando event listeners...');
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // En producción, simular que es instalable después de un delay si no se dispara beforeinstallprompt
      if (window.location.protocol === 'https:') {
        setTimeout(() => {
          if (!isInstallable && !isInstalled) {
            console.log('⏰ Timeout: Simulando instalable en producción');
            setIsInstallable(true);
          }
        }, 3000); // 3 segundos de delay
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstallable, isInstalled]);

  const installApp = async () => {
    console.log('🚀 Intentando instalar PWA...');
    console.log('DeferredPrompt disponible:', !!deferredPrompt);
    
    // Si no hay deferredPrompt, mostrar instrucciones manuales
    if (!deferredPrompt) {
      console.log('📱 No hay deferredPrompt, mostrando instrucciones manuales');
      
      // Detectar dispositivo
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      let instructions = '';
      let title = '📱 Instalar App';
      
      if (isIOS) {
        title = '📱 Instalar en iPhone';
        instructions = `
          <div style="margin-bottom: 15px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              <strong>En Safari:</strong>
            </p>
            <ol style="color: #666; font-size: 14px; text-align: left; margin-left: 20px;">
              <li>Toca el botón <strong>Compartir</strong> (📤) en la barra inferior</li>
              <li>Desplázate hacia abajo y toca <strong>"Agregar a pantalla de inicio"</strong></li>
              <li>Toca <strong>"Agregar"</strong> para confirmar</li>
            </ol>
          </div>
        `;
      } else if (isAndroid) {
        title = '📱 Instalar en Android';
        instructions = `
          <div style="margin-bottom: 15px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              <strong>En Chrome:</strong>
            </p>
            <ol style="color: #666; font-size: 14px; text-align: left; margin-left: 20px;">
              <li>Toca el botón <strong>Menú</strong> (⋮) en la esquina superior derecha</li>
              <li>Selecciona <strong>"Instalar app"</strong> o <strong>"Agregar a pantalla de inicio"</strong></li>
              <li>Toca <strong>"Instalar"</strong> para confirmar</li>
            </ol>
          </div>
        `;
      } else {
        title = '📱 Instalar App';
        instructions = `
          <div style="margin-bottom: 15px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              <strong>Instrucciones generales:</strong>
            </p>
            <ol style="color: #666; font-size: 14px; text-align: left; margin-left: 20px;">
              <li>Busca la opción <strong>"Instalar app"</strong> en el menú del navegador</li>
              <li>O busca <strong>"Agregar a pantalla de inicio"</strong></li>
              <li>Confirma la instalación</li>
            </ol>
          </div>
        `;
      }
      
      // Crear un modal con instrucciones de instalación
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="
          background: white;
          padding: 20px;
          border-radius: 12px;
          max-width: 350px;
          text-align: center;
          margin: 20px;
        ">
          <h3 style="color: #333; margin-bottom: 15px;">${title}</h3>
          ${instructions}
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">
            Entendido
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      return true;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('❌ Usuario rechazó la instalación');
      }
    } catch (error) {
      console.error('❌ Error installing PWA:', error);
    }
    
    return false;
  };

  console.log('📊 Estado PWA:', { isInstallable, isInstalled, hasDeferredPrompt: !!deferredPrompt });

  return {
    isInstallable,
    isInstalled,
    installApp
  };
}; 