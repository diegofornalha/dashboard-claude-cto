import { useState, useEffect, useCallback } from 'react';

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  taskStarted: boolean;
  taskComplete: boolean;
  taskFailed: boolean;
}

interface WebNotificationOptions extends NotificationOptions {
  url?: string;
  taskId?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useWebNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    sound: true,
    taskStarted: true,
    taskComplete: true,
    taskFailed: true
  });

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      loadPreferences();
      checkExistingSubscription();
    }
  }, []);

  const loadPreferences = () => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar preferências:', e);
      }
    }
  };

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));
    
    if (updates.enabled === false && subscription) {
      unsubscribe();
    }
  }, [preferences, subscription]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notificações não suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToPush();
        
        sendNotification('Notificações Ativadas! 🎉', {
          body: 'Você receberá alertas sobre suas tasks do CTO',
          icon: '✅',
          tag: 'permission-granted'
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, [isSupported]);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key (você precisará gerar uma)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BLBx-hf2WrL2qEa0qKb-aCJbcxEvyn62GDTyyP9KTS5K7ZL0K7TfmOKSPqp8vQF0DaG8hpSBknz_x3qf5F4iEFo';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      setSubscription(subscription);
      
      // Enviar subscription para o backend
      await saveSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        await removeSubscriptionFromBackend(subscription);
        setSubscription(null);
      } catch (error) {
        console.error('Erro ao cancelar subscription:', error);
      }
    }
  };

  const sendNotification = useCallback((title: string, options?: WebNotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !preferences.enabled) {
      console.log('Notificação bloqueada:', { isSupported, permission, enabled: preferences.enabled });
      return null;
    }

    try {
      if (preferences.sound && options) {
        playNotificationSound();
      }

      const icon = options?.icon || getIconForType(options?.type);
      
      const notificationOptions: NotificationOptions = {
        body: options?.body || '',
        icon: icon,
        badge: '/favicon.ico',
        tag: options?.tag || `cto-${Date.now()}`,
        requireInteraction: options?.requireInteraction || false,
        silent: !preferences.sound,
        vibrate: options?.vibrate || [200, 100, 200],
        data: {
          url: options?.url || '/',
          taskId: options?.taskId,
          timestamp: new Date().toISOString()
        },
        ...options
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, notificationOptions);
        });
      } else {
        const notification = new Notification(title, notificationOptions);
        
        notification.onclick = () => {
          window.focus();
          if (options?.url) {
            window.location.href = options.url;
          }
          notification.close();
        };
        
        if (options?.duration) {
          setTimeout(() => notification.close(), options.duration);
        }
        
        return notification;
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return null;
    }
  }, [isSupported, permission, preferences]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Não foi possível tocar o som:', e));
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return '🔔';
      default: return '📢';
    }
  };

  const saveSubscriptionToBackend = async (sub: PushSubscription) => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          device: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar subscription');
      }
    } catch (error) {
      console.error('Erro ao salvar subscription no backend:', error);
    }
  };

  const removeSubscriptionFromBackend = async (sub: PushSubscription) => {
    try {
      await fetch('http://localhost:8001/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
    } catch (error) {
      console.error('Erro ao remover subscription do backend:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const testNotification = () => {
    sendNotification('🔔 Teste de Notificação', {
      body: 'Esta é uma notificação de teste do Dashboard CTO',
      type: 'info',
      duration: 5000,
      url: '/notifications'
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    preferences,
    requestPermission,
    updatePreferences,
    sendNotification,
    testNotification,
    subscribeToPush,
    unsubscribe
  };
}