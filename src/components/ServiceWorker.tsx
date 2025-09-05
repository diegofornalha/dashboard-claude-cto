import { useEffect, useState } from 'react';

export function ServiceWorker() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swState, setSwState] = useState<string>('checking');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    } else {
      setSwState('unsupported');
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado:', registration.scope);
      setSwRegistration(registration);
      setSwState('registered');
      
      // Verificar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('Service Worker atualizado!');
              window.location.reload();
            }
          });
        }
      });
      
      // Armazenar registration globalmente
      (window as any).swRegistration = registration;
      
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      setSwState('error');
    }
  };

  return null;
}