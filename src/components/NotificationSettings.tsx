import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Volume2, VolumeX, Check, X, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { useWebNotifications } from '@/hooks/useWebNotifications'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    preferences,
    requestPermission,
    updatePreferences,
    sendNotification
  } = useWebNotifications()

  const handleTestNotification = () => {
    sendNotification('🔔 Teste de Notificação', {
      body: 'Esta é uma notificação de teste do Claude CTO Dashboard',
      vibrate: [200, 100, 200]
    })
  }

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        text: 'Navegador não suporta notificações',
        color: 'text-gray-500'
      }
    }
    
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          text: 'Notificações ativadas',
          color: 'text-green-600 dark:text-green-400'
        }
      case 'denied':
        return {
          icon: <X className="w-5 h-5" />,
          text: 'Notificações bloqueadas',
          color: 'text-red-600 dark:text-red-400'
        }
      default:
        return {
          icon: <Bell className="w-5 h-5" />,
          text: 'Clique para ativar notificações',
          color: 'text-blue-600 dark:text-blue-400'
        }
    }
  }

  const status = getPermissionStatus()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Configurações de Notificações</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Permission Status */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={status.color}>{status.icon}</div>
                    <span className={`font-medium ${status.color}`}>{status.text}</span>
                  </div>
                  {permission === 'default' && isSupported && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={requestPermission}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Ativar
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Settings */}
              {permission === 'granted' && (
                <>
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {preferences.enabled ? (
                        <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <BellOff className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Notificações do Navegador
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receba alertas mesmo com o dashboard minimizado
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.enabled}
                        onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {preferences.sound ? (
                        <Volume2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Som de Notificação</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tocar som ao receber notificações
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.sound}
                        onChange={(e) => updatePreferences({ sound: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 disabled:opacity-50"></div>
                    </label>
                  </div>

                  {/* Event Toggles */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificar quando:
                    </p>
                    
                    {/* Task Started */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskStarted}
                        onChange={(e) => updatePreferences({ taskStarted: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-900 dark:text-white">Tarefa iniciada</span>
                      </div>
                    </label>

                    {/* Task Completed */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskComplete}
                        onChange={(e) => updatePreferences({ taskComplete: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-900 dark:text-white">Tarefa concluída</span>
                      </div>
                    </label>

                    {/* Task Failed */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskFailed}
                        onChange={(e) => updatePreferences({ taskFailed: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-900 dark:text-white">Tarefa falhou</span>
                      </div>
                    </label>
                  </div>

                  {/* Test Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTestNotification}
                    disabled={!preferences.enabled}
                    className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Testar Notificação</span>
                  </motion.button>
                </>
              )}

              {/* Permission Denied Message */}
              {permission === 'denied' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    As notificações foram bloqueadas. Para reativar, você precisa alterar as 
                    configurações do seu navegador para este site.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}