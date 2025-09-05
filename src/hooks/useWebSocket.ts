import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WebSocketService, 
  WebSocketMessage, 
  WebSocketConfig,
  MessageType,
  getWebSocketService,
  resetWebSocketService
} from '@/services/websocket';

export interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

export interface UseWebSocketReturn extends WebSocketState {
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (type: MessageType, data: any) => void;
  request: (type: MessageType, data: any, timeout?: number) => Promise<WebSocketMessage>;
  subscribe: (type: MessageType, handler: (message: WebSocketMessage) => void) => () => void;
  subscribeAll: (handler: (message: WebSocketMessage) => void) => () => void;
}

export function useWebSocket(
  url?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocketService | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);

  const {
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    ...wsConfig
  } = options;

  // Initialize WebSocket service
  useEffect(() => {
    if (!url) return;

    try {
      const config: WebSocketConfig = {
        url,
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        debug: process.env.NODE_ENV === 'development',
        ...wsConfig
      };

      wsRef.current = getWebSocketService(config);

      // Setup connection handlers
      unsubscribesRef.current.push(
        wsRef.current.onConnection('open', () => {
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            error: null
          }));
          onConnect?.();
        })
      );

      unsubscribesRef.current.push(
        wsRef.current.onConnection('close', () => {
          setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false
          }));
          onDisconnect?.();
        })
      );

      unsubscribesRef.current.push(
        wsRef.current.onConnection('error', (event) => {
          setState(prev => ({
            ...prev,
            error: new Error('WebSocket connection error'),
            isConnecting: false
          }));
          onError?.(event);
        })
      );

      // Setup message handler
      if (onMessage) {
        unsubscribesRef.current.push(
          wsRef.current.onAny((message) => {
            setState(prev => ({
              ...prev,
              lastMessage: message
            }));
            onMessage(message);
          })
        );
      }

      // Auto-connect
      if (autoConnect) {
        connect();
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
    }

    // Cleanup
    return () => {
      unsubscribesRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribesRef.current = [];
      if (wsRef.current) {
        wsRef.current.disconnect();
        resetWebSocketService();
        wsRef.current = null;
      }
    };
  }, [url]); // Only re-initialize if URL changes

  // Connect method
  const connect = useCallback(async () => {
    if (!wsRef.current) return;

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      await wsRef.current.connect();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isConnecting: false
      }));
    }
  }, []);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.disconnect();
  }, []);

  // Send message
  const send = useCallback((type: MessageType, data: any) => {
    if (!wsRef.current) {
      console.warn('WebSocket not initialized');
      return;
    }
    wsRef.current.send({ type, data });
  }, []);

  // Request-response
  const request = useCallback(
    async (type: MessageType, data: any, timeout?: number) => {
      if (!wsRef.current) {
        throw new Error('WebSocket not initialized');
      }
      return wsRef.current.request(type, data, timeout);
    },
    []
  );

  // Subscribe to specific message type
  const subscribe = useCallback(
    (type: MessageType, handler: (message: WebSocketMessage) => void) => {
      if (!wsRef.current) {
        console.warn('WebSocket not initialized');
        return () => {};
      }
      return wsRef.current.on(type, handler);
    },
    []
  );

  // Subscribe to all messages
  const subscribeAll = useCallback(
    (handler: (message: WebSocketMessage) => void) => {
      if (!wsRef.current) {
        console.warn('WebSocket not initialized');
        return () => {};
      }
      return wsRef.current.onAny(handler);
    },
    []
  );

  // Update reconnect attempts
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current) {
        const stats = wsRef.current.getStats();
        setState(prev => {
          if (prev.reconnectAttempts !== stats.reconnectAttempts) {
            return {
              ...prev,
              reconnectAttempts: stats.reconnectAttempts
            };
          }
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    send,
    request,
    subscribe,
    subscribeAll
  };
}

// Hook for subscribing to specific message types
export function useWebSocketSubscription(
  type: MessageType,
  handler: (message: WebSocketMessage) => void,
  deps: React.DependencyList = []
) {
  const ws = useWebSocket();

  useEffect(() => {
    if (!ws.isConnected) return;

    const unsubscribe = ws.subscribe(type, handler);
    return unsubscribe;
  }, [ws.isConnected, type, ...deps]);

  return ws;
}

// Hook for task status updates via WebSocket
export function useWebSocketTaskUpdates(taskId?: string) {
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);

  const ws = useWebSocket(undefined, {
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'task_status' && message.data) {
        if (!taskId || message.data.task_id === taskId) {
          setTaskStatus(message.data);
          if (message.data.progress) {
            setTaskProgress(message.data.progress);
          }
        }
      }
    }
  });

  return {
    ...ws,
    taskStatus,
    taskProgress
  };
}

// Hook for real-time notifications via WebSocket
export function useWebSocketNotifications() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  const ws = useWebSocket(undefined, {
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications(prev => [message, ...prev].slice(0, 50)); // Keep last 50
      }
    }
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    ...ws,
    notifications,
    clearNotifications
  };
}