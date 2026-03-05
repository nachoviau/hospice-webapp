// Registrar el service worker
export function registerSW() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw2.js', { updateViaCache: 'none' })
				.then((registration) => {
					// Activar inmediatamente un nuevo SW si ya está en espera
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

					// Recargar una sola vez cuando cambia el controlador (nuevo SW activo)
					let reloaded = false;
					navigator.serviceWorker.addEventListener('controllerchange', () => {
						if (reloaded) return;
						reloaded = true;
						window.location.reload();
					});
				})
				.catch(() => {});
		});
	}
} 