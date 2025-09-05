import { useState, useEffect, useCallback } from 'react'

interface NotificationOptions {
  body?: string
  icon?: string
  badge?: string
  vibrate?: number[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: any
}

interface WebNotificationPreferences {
  enabled: boolean
  sound: boolean
  taskComplete: boolean
  taskFailed: boolean
  taskStarted: boolean
}

export function useWebNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [preferences, setPreferences] = useState<WebNotificationPreferences>({
    enabled: false,
    sound: true,
    taskComplete: true,
    taskFailed: true,
    taskStarted: false
  })

  // Check if browser supports notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      
      // Load saved preferences
      const saved = localStorage.getItem('webNotificationPrefs')
      if (saved) {
        try {
          setPreferences(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load notification preferences:', e)
        }
      }
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notifications are not supported in this browser')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // Test notification
        sendNotification('🎉 Notificações Ativadas', {
          body: 'Você receberá alertas sobre suas tarefas do Claude CTO',
          vibrate: [200, 100, 200]
        })
        
        // Save preference
        const newPrefs = { ...preferences, enabled: true }
        setPreferences(newPrefs)
        localStorage.setItem('webNotificationPrefs', JSON.stringify(newPrefs))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported, preferences])

  // Send notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !preferences.enabled) {
      return null
    }

    try {
      // Default icon as SVG data URL
      const defaultIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230ea5e9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      
      const notification = new Notification(title, {
        icon: defaultIcon,
        badge: defaultIcon,
        vibrate: [200],
        tag: 'claude-cto',
        ...options
      })

      // Play sound if enabled
      if (preferences.sound && !options?.silent) {
        playNotificationSound()
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle clicks
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Navigate to specific task if data is provided
        if (options?.data?.taskId) {
          window.location.href = `/tasks/${options.data.taskId}`
        }
      }

      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
      return null
    }
  }, [isSupported, permission, preferences])

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Simple beep sound as data URL
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPDaizsICGS56+OvXRULUKXh8LNfGAUve9Dw03wx')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Could not play notification sound'))
    } catch (e) {
      console.log('Audio not supported')
    }
  }

  // Update preferences
  const updatePreferences = useCallback((newPrefs: Partial<WebNotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)
    localStorage.setItem('webNotificationPrefs', JSON.stringify(updated))
  }, [preferences])

  // Task notification helpers
  const notifyTaskStarted = useCallback((taskName: string, taskId?: number) => {
    if (!preferences.taskStarted) return
    
    sendNotification('🚀 Tarefa Iniciada', {
      body: `A tarefa "${taskName}" começou a ser executada`,
      data: { taskId }
    })
  }, [preferences.taskStarted, sendNotification])

  const notifyTaskCompleted = useCallback((taskName: string, taskId?: number) => {
    if (!preferences.taskComplete) return
    
    sendNotification('✅ Tarefa Concluída', {
      body: `A tarefa "${taskName}" foi concluída com sucesso!`,
      data: { taskId }
    })
  }, [preferences.taskComplete, sendNotification])

  const notifyTaskFailed = useCallback((taskName: string, error?: string, taskId?: number) => {
    if (!preferences.taskFailed) return
    
    sendNotification('❌ Tarefa Falhou', {
      body: error ? `Erro na tarefa "${taskName}": ${error}` : `A tarefa "${taskName}" falhou`,
      data: { taskId },
      requireInteraction: true // Keep visible until user interacts
    })
  }, [preferences.taskFailed, sendNotification])

  return {
    // State
    isSupported,
    permission,
    preferences,
    
    // Actions
    requestPermission,
    sendNotification,
    updatePreferences,
    
    // Task helpers
    notifyTaskStarted,
    notifyTaskCompleted,
    notifyTaskFailed
  }
}