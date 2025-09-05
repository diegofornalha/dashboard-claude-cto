import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { 
  Wifi, 
  WifiOff, 
  Send, 
  Bell, 
  Activity,
  MessageSquare,
  Zap
} from 'lucide-react';

export function WebSocketDemo() {
  const { 
    isConnected, 
    isConnecting, 
    error, 
    lastMessage, 
    reconnectAttempts,
    connect,
    disconnect,
    send,
    subscribe
  } = useWebSocketContext();
  
  const [messages, setMessages] = useState<Array<{
    type: string;
    data: any;
    timestamp: number;
  }>>([]);
  
  const [taskCount, setTaskCount] = useState(0);
  
  useEffect(() => {
    if (!isConnected) return;
    
    // Subscribe to task updates
    const unsubTask = subscribe('task_status', (message) => {
      setMessages(prev => [message, ...prev].slice(0, 20));
      setTaskCount(prev => prev + 1);
    });
    
    // Subscribe to notifications
    const unsubNotif = subscribe('notification', (message) => {
      setMessages(prev => [message, ...prev].slice(0, 20));
    });
    
    return () => {
      unsubTask();
      unsubNotif();
    };
  }, [isConnected, subscribe]);
  
  const handleSendTestMessage = () => {
    send('heartbeat', { test: true, timestamp: Date.now() });
  };
  
  const handleSubscribeToTasks = () => {
    send('task_status', { action: 'subscribe' });
  };
  
  const handleCreateTestTask = () => {
    // This would normally call the API to create a task
    send('task_status', { 
      action: 'create',
      data: {
        model: 'sonnet',
        execution_prompt: 'Test task from WebSocket demo'
      }
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isConnected ? (
              <><Wifi className="w-5 h-5 text-green-500" /> WebSocket Connected</>
            ) : isConnecting ? (
              <><Activity className="w-5 h-5 text-yellow-500 animate-pulse" /> Connecting...</>
            ) : (
              <><WifiOff className="w-5 h-5 text-red-500" /> Disconnected</>
            )}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <Badge variant={isConnected ? 'success' : error ? 'error' : 'default'}>
                {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected'}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Reconnect Attempts</div>
              <div className="font-semibold">{reconnectAttempts}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Task Updates</div>
              <div className="font-semibold">{taskCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Messages</div>
              <div className="font-semibold">{messages.length}</div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              Error: {error.message}
            </div>
          )}
          
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={connect} disabled={isConnecting}>
                <Wifi className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : (
              <>
                <Button onClick={disconnect} variant="outline">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                <Button onClick={handleSendTestMessage} variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Send Heartbeat
                </Button>
                <Button onClick={handleSubscribeToTasks} variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe Tasks
                </Button>
                <Button onClick={handleCreateTestTask} variant="primary">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Test Task
                </Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Last Message */}
      {lastMessage && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Last Message
            </h3>
          </CardHeader>
          <CardBody>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{lastMessage.type}</Badge>
                <span className="text-xs text-gray-500">
                  {new Date(lastMessage.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(lastMessage.data, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Message History */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Message History
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y dark:divide-gray-800">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <Badge 
                      variant={
                        msg.type === 'task_status' ? 'primary' : 
                        msg.type === 'notification' ? 'success' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {msg.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {JSON.stringify(msg.data)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}