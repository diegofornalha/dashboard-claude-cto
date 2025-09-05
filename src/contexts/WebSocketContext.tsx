import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSocketService, WebSocketMessage, MessageType } from '@/services/websocket';

interface WebSocketContextValue {
  ws: WebSocketService | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (type: MessageType, data: any) => void;
  subscribe: (type: MessageType, handler: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
}

export function WebSocketProvider({ 
  children, 
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws',
  autoConnect = true 
}: WebSocketProviderProps) {
  const [ws, setWs] = useState<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const service = new WebSocketService({
      url,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: process.env.NODE_ENV === 'development'
    });

    // Setup event handlers
    service.onConnection('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      console.log('WebSocket connected');
    });

    service.onConnection('close', () => {
      setIsConnected(false);
      setIsConnecting(false);
      console.log('WebSocket disconnected');
    });

    service.onConnection('error', (event) => {
      setError(new Error('WebSocket connection error'));
      setIsConnecting(false);
      console.error('WebSocket error:', event);
    });

    // Global message handler
    service.onAny((message) => {
      setLastMessage(message);
      
      // Log important messages
      if (message.type === 'error') {
        console.error('WebSocket error message:', message.data);
      }
    });

    setWs(service);

    // Auto-connect if configured
    if (autoConnect) {
      setIsConnecting(true);
      service.connect().catch(err => {
        console.error('Failed to connect WebSocket:', err);
        setError(err);
      });
    }

    // Update reconnect attempts periodically
    const interval = setInterval(() => {
      const stats = service.getStats();
      setReconnectAttempts(stats.reconnectAttempts);
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
      service.disconnect();
    };
  }, [url, autoConnect]);

  const connect = async () => {
    if (!ws) return;
    setIsConnecting(true);
    setError(null);
    try {
      await ws.connect();
    } catch (err) {
      setError(err as Error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    ws?.disconnect();
  };

  const send = (type: MessageType, data: any) => {
    if (!ws) {
      console.warn('WebSocket not initialized');
      return;
    }
    ws.send({ type, data });
  };

  const subscribe = (type: MessageType, handler: (message: WebSocketMessage) => void) => {
    if (!ws) {
      console.warn('WebSocket not initialized');
      return () => {};
    }
    return ws.on(type, handler);
  };

  const value: WebSocketContextValue = {
    ws,
    isConnected,
    isConnecting,
    error,
    lastMessage,
    reconnectAttempts,
    connect,
    disconnect,
    send,
    subscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Status indicator component
export function WebSocketStatus() {
  const { isConnected, isConnecting, reconnectAttempts, error } = useWebSocketContext();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium
        transition-all duration-300 flex items-center gap-2
        ${isConnected 
          ? 'bg-green-500 text-white' 
          : isConnecting 
            ? 'bg-yellow-500 text-white animate-pulse' 
            : 'bg-red-500 text-white'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${isConnected ? 'bg-white' : 'bg-white/50 animate-pulse'}
        `} />
        
        {isConnected && 'Connected'}
        {isConnecting && `Connecting${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}`}
        {!isConnected && !isConnecting && 'Disconnected'}
        
        {error && (
          <span className="text-xs opacity-75 ml-2">
            {error.message}
          </span>
        )}
      </div>
    </div>
  );
}