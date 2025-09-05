import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import '@/styles/globals.css'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { WebSocketProvider, WebSocketStatus } from '@/contexts/WebSocketContext'
import ToastContainer from '@/components/ui/ToastContainer'
import { ServiceWorker } from '@/components/ServiceWorker'
import { useTaskNotificationsWS } from '@/hooks/useTaskNotificationsWS'

function AppContent({ Component, pageProps }: AppProps) {
  // Ativar monitoramento de tasks com WebSocket
  useTaskNotificationsWS({
    enabled: true,
    useWebSocket: true,
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
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CTO Dashboard - Admin Panel</title>
      </Head>
      <ServiceWorker />
      <Component {...pageProps} />
      <ToastContainer />
      <WebSocketStatus />
    </>
  )
}

function MyApp(props: AppProps) {
  return (
    <NotificationProvider>
      <WebSocketProvider autoConnect={true}>
        <AppContent {...props} />
      </WebSocketProvider>
    </NotificationProvider>
  )
}

export default MyApp