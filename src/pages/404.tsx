import { useRouter } from 'next/router'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Custom404() {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentPath(router.asPath)
  }, [router.asPath])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-8">
            <Search className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>

          {/* Title */}
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Página não encontrada
          </h2>
          
          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>

          {/* Current URL */}
          {mounted && currentPath && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Você tentou acessar:</p>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {currentPath}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/">
              <motion.button
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="h-5 w-5" />
                <span>Ir para o Dashboard</span>
              </motion.button>
            </Link>

            <motion.button
              onClick={() => router.back()}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </motion.button>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Páginas úteis:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Dashboard
              </Link>
              <Link href="/tasks/list" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Tarefas
              </Link>
              <Link href="/sitemap" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Mapa do Site
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}