// Registrar el service worker
export function registerSW() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
				.then((registration) => {
					// Forzar chequeo de actualización al ganar foco
					const tryUpdate = () => {
						if (registration && typeof registration.update === 'function') {
							registration.update();
						}
					};
					window.addEventListener('visibilitychange', () => {
						if (document.visibilityState === 'visible') tryUpdate();
					});

					// Activar inmediatamente un nuevo SW
					if (registration.waiting) {
						registration.waiting.postMessage({ type: 'SKIP_WAITING' });
					}
					registration.addEventListener('updatefound', () => {
						const newSW = registration.installing;
						if (!newSW) return;
						newSW.addEventListener('statechange', () => {
							if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
								newSW.postMessage({ type: 'SKIP_WAITING' });
							}
						});
					});

					// Recargar cuando el controlador cambia (nuevo SW activo)
					navigator.serviceWorker.addEventListener('controllerchange', () => {
						window.location.reload();
					});
				})
				.catch(() => {});
		});
	}
} 