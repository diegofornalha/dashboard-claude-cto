import { motion } from 'framer-motion'
import { 
  Map, 
  Home, 
  ListTodo, 
  Bell,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface RouteSection {
  title: string
  icon: React.ReactNode
  routes: {
    path: string
    name: string
    description: string
    icon: React.ReactNode
  }[]
}

export default function Sitemap() {
  const sections: RouteSection[] = [
    {
      title: 'Páginas Principais',
      icon: <Home className="w-5 h-5" />,
      routes: [
        {
          path: '/',
          name: 'Dashboard',
          description: 'Página inicial com visão geral do sistema e estatísticas',
          icon: <Home className="w-5 h-5" />
        },
        {
          path: '/sitemap',
          name: 'Mapa do Site',
          description: 'Visualização completa de todas as páginas disponíveis',
          icon: <Map className="w-5 h-5" />
        }
      ]
    },
    {
      title: 'Gerenciamento de Tarefas',
      icon: <ListTodo className="w-5 h-5" />,
      routes: [
        {
          path: '/tasks/list',
          name: 'Lista de Tarefas',
          description: 'Visualize e gerencie todas as tarefas do sistema',
          icon: <ListTodo className="w-5 h-5" />
        }
      ]
    },
    {
      title: 'Sistema',
      icon: <Bell className="w-5 h-5" />,
      routes: [
        {
          path: '/notifications',
          name: 'Notificações',
          description: 'Configure notificações do navegador para alertas de tarefas',
          icon: <Bell className="w-5 h-5" />
        }
      ]
    },
  ]

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-lg mr-4">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mapa do Site
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Navegue por todas as páginas e funcionalidades disponíveis
              </p>
            </div>
          </div>
        </motion.div>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <nav className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 dark:text-white font-medium">Mapa do Site</span>
          </nav>
        </motion.div>

        {/* Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Section Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Routes Grid */}
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.routes.map((route, routeIndex) => (
                    <motion.div
                      key={route.path}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: sectionIndex * 0.1 + routeIndex * 0.05,
                        duration: 0.3
                      }}
                    >
                      <Link href={route.path}>
                        <motion.div
                          className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer h-full"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg transition-colors duration-200 mr-3 flex-shrink-0">
                              {route.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {route.name}
                                </h3>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 ml-2" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {route.description}
                              </p>
                              <div className="mt-2">
                                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                  {route.path}
                                </code>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Todas as páginas estão acessíveis e funcionando
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}