import React from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useWebNotifications } from '@/hooks/useWebNotifications'

export default function NotificationsPage() {
  const router = useRouter()
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
        icon: <AlertCircle className="w-6 h-6" />,
        text: 'Navegador não suporta notificações',
        description: 'Este navegador não suporta Web Push Notifications. Tente usar Chrome, Firefox ou Edge.',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800'
      }
    }
    
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          text: 'Notificações ativadas',
          description: 'Você receberá notificações quando tarefas mudarem de status.',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'denied':
        return {
          icon: <X className="w-6 h-6" />,
          text: 'Notificações bloqueadas',
          description: 'As notificações foram bloqueadas. Você precisa alterar as configurações do navegador.',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      default:
        return {
          icon: <Bell className="w-6 h-6" />,
          text: 'Permissão necessária',
          description: 'Clique no botão abaixo para ativar as notificações do navegador.',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        }
    }
  }

  const status = getPermissionStatus()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Notificações</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                  <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  <span>Configurações de Notificações</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie suas preferências de notificações do navegador
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Permission Status Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className={`${status.bgColor} p-6 border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg ${status.color}`}>
                    {status.icon}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${status.color}`}>{status.text}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {status.description}
                    </p>
                  </div>
                </div>
                {permission === 'default' && isSupported && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={requestPermission}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-lg"
                  >
                    Ativar Notificações
                  </motion.button>
                )}
              </div>
            </div>

            {/* Settings Section */}
            {permission === 'granted' && (
              <div className="p-6 space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      {preferences.enabled ? (
                        <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <BellOff className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
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
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      {preferences.sound ? (
                        <Volume2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <VolumeX className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Som de Notificação
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tocar um som suave ao receber notificações
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
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 disabled:opacity-50"></div>
                  </label>
                </div>

                {/* Event Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Tipos de Notificação
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Escolha quais eventos devem gerar notificações
                  </p>

                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    {/* Task Started */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Tarefa Iniciada
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quando uma tarefa começa a ser executada
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskStarted}
                        onChange={(e) => updatePreferences({ taskStarted: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                    </label>

                    {/* Task Completed */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Tarefa Concluída
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quando uma tarefa é finalizada com sucesso
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskComplete}
                        onChange={(e) => updatePreferences({ taskComplete: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                    </label>

                    {/* Task Failed */}
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Tarefa Falhou
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quando uma tarefa encontra um erro
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={preferences.taskFailed}
                        onChange={(e) => updatePreferences({ taskFailed: e.target.checked })}
                        disabled={!preferences.enabled}
                      />
                    </label>
                  </div>
                </div>

                {/* Test Notification Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestNotification}
                  disabled={!preferences.enabled}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Bell className="w-5 h-5" />
                  <span>Testar Notificação</span>
                </motion.button>
              </div>
            )}

            {/* Permission Denied Message */}
            {permission === 'denied' && (
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Como reativar as notificações:
                  </h3>
                  <ol className="text-sm text-red-700 dark:text-red-300 space-y-2 list-decimal list-inside">
                    <li>Clique no ícone do cadeado na barra de endereços</li>
                    <li>Encontre "Notificações" nas configurações do site</li>
                    <li>Mude de "Bloquear" para "Permitir"</li>
                    <li>Recarregue esta página</li>
                  </ol>
                </div>
              </div>
            )}
          </motion.div>

          {/* Info Card */}
          <motion.div
            variants={itemVariants}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Sobre as Notificações
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>As notificações aparecem mesmo com o navegador minimizado</li>
              <li>Você pode clicar na notificação para voltar ao dashboard</li>
              <li>As configurações são salvas localmente no seu navegador</li>
              <li>Não coletamos ou enviamos dados para servidores externos</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}