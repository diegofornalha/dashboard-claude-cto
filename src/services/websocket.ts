// WebSocket Service for Real-time Communication
export type MessageType = 
  | 'task_status'
  | 'notification'
  | 'agent_update'
  | 'system_status'
  | 'error'
  | 'heartbeat';

export interface WebSocketMessage {
  type: MessageType;
  timestamp: number;
  data: any;
  id?: string;
  correlation_id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (event: Event) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private globalHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers = {
    open: new Set<ConnectionHandler>(),
    close: new Set<ConnectionHandler>(),
    error: new Set<ConnectionHandler>()
  };
  private messageQueue: WebSocketMessage[] = [];
  private isReconnecting = false;
  private lastHeartbeat = Date.now();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: false,
      ...config
    };
  }

  // Connection Management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = (event) => {
          this.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.connectionHandlers.open.forEach(handler => handler(event));
          resolve();
        };

        this.ws.onclose = (event) => {
          this.log('WebSocket closed', event);
          this.stopHeartbeat();
          this.connectionHandlers.close.forEach(handler => handler(event));
          this.handleReconnect();
        };

        this.ws.onerror = (event) => {
          this.log('WebSocket error', event);
          this.connectionHandlers.error.forEach(handler => handler(event));
          reject(event);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.log('Failed to parse message', error);
          }
        };
      } catch (error) {
        this.log('Failed to create WebSocket', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopReconnect();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Message Handling
  private handleMessage(message: WebSocketMessage): void {
    this.log('Received message', message);

    // Update heartbeat timestamp
    if (message.type === 'heartbeat') {
      this.lastHeartbeat = Date.now();
      return;
    }

    // Call type-specific handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Call global handlers
    this.globalHandlers.forEach(handler => handler(message));
  }

  // Public API for subscribing to messages
  on(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  onAny(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  onConnection(event: 'open' | 'close' | 'error', handler: ConnectionHandler): () => void {
    this.connectionHandlers[event].add(handler);
    return () => {
      this.connectionHandlers[event].delete(handler);
    };
  }

  // Send messages
  send(message: Omit<WebSocketMessage, 'timestamp' | 'id'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      id: this.generateId()
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
        this.log('Sent message', fullMessage);
      } catch (error) {
        this.log('Failed to send message', error);
        this.queueMessage(fullMessage);
      }
    } else {
      this.queueMessage(fullMessage);
      if (!this.isReconnecting) {
        this.handleReconnect();
      }
    }
  }

  // Request-Response pattern
  request(
    type: MessageType,
    data: any,
    timeout = 5000
  ): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      const correlationId = this.generateId();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout for ${type}`));
      }, timeout);

      const unsubscribe = this.onAny((message) => {
        if (message.correlation_id === correlationId) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(message);
        }
      });

      this.send({
        type,
        data,
        correlation_id: correlationId
      });
    });
  }

  // Connection state
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // Private methods
  private handleReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    this.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('Reconnect failed', error);
      });
    }, this.config.reconnectInterval);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          data: { timestamp: Date.now() }
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    // Keep only last 100 messages in queue
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          this.log('Failed to send queued message', error);
          break;
        }
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  // Statistics
  getStats() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      lastHeartbeat: this.lastHeartbeat,
      handlers: {
        types: Array.from(this.messageHandlers.keys()),
        global: this.globalHandlers.size
      }
    };
  }
}

// Singleton instance
let instance: WebSocketService | null = null;

export function getWebSocketService(config?: WebSocketConfig): WebSocketService {
  if (!instance && config) {
    instance = new WebSocketService(config);
  }
  if (!instance) {
    throw new Error('WebSocket service not initialized. Call with config first.');
  }
  return instance;
}

export function resetWebSocketService(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}