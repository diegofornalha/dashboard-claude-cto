import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import '@/styles/globals.css'
import { NotificationProvider } from '@/contexts/NotificationContext'
import ToastContainer from '@/components/ui/ToastContainer'
import { ServiceWorker } from '@/components/ServiceWorker'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'

function MyApp({ Component, pageProps }: AppProps) {
  // Ativar monitoramento de tasks
  useTaskNotifications({
    enabled: true,
    pollInterval: 5000
  });

  // Effect para detectar tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <NotificationProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CTO Dashboard - Admin Panel</title>
      </Head>
      <ServiceWorker />
      <Component {...pageProps} />
      <ToastContainer />
    </NotificationProvider>
  )
}

export default MyApp