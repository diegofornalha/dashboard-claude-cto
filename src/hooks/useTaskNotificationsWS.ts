import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebNotifications } from './useWebNotifications';
import { useWebSocket } from './useWebSocket';
import { notificationStorage } from '@/services/notification-storage';
import { McpApi } from '@/services/mcp-api';

interface TaskStatus {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  execution_prompt: string;
  created_at: string;
  execution_time?: number;
  orchestration_id?: string;
  progress?: number;
  current_action?: string;
}

interface TaskNotificationConfig {
  enabled: boolean;
  pollInterval: number;
  soundEnabled: boolean;
  groupByOrchestration: boolean;
  useWebSocket: boolean;
  priorityFilters: {
    opus: boolean;
    sonnet: boolean;
    haiku: boolean;
  };
}

interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  notificationsSent: number;
  lastUpdate: Date | null;
}

export function useTaskNotificationsWS(config?: Partial<TaskNotificationConfig>) {
  const { sendNotification, preferences, permission } = useWebNotifications();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    notificationsSent: 0,
    lastUpdate: null
  });
  
  const previousTasksRef = useRef<Map<string, TaskStatus>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  
  const defaultConfig: TaskNotificationConfig = {
    enabled: true,
    pollInterval: 5000,
    soundEnabled: true,
    groupByOrchestration: true,
    useWebSocket: true,
    priorityFilters: {
      opus: true,
      sonnet: true,
      haiku: true
    }
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // WebSocket connection
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws';
  const ws = useWebSocket(wsUrl, {
    autoConnect: finalConfig.useWebSocket && isMonitoring,
    onMessage: (message) => {
      if (message.type === 'task_status') {
        handleTaskUpdate(message.data);
      }
    },
    onConnect: () => {
      console.log('WebSocket connected for task notifications');
      // Request current task statuses
      ws.send('task_status', { action: 'subscribe' });
    }
  });
  
  const handleTaskUpdate = useCallback((task: TaskStatus) => {
    const previousTask = previousTasksRef.current.get(task.id);
    
    // Check if this is a status change
    if (previousTask && previousTask.status !== task.status) {
      // Send notification for status change
      if (shouldNotify(task)) {
        const notification = createNotificationForTask(task, previousTask);
        if (notification) {
          sendTaskNotification(notification);
        }
      }
    }
    
    // Update our cache
    previousTasksRef.current.set(task.id, task);
    
    // Update stats
    updateTaskStats();
  }, []);
  
  const shouldNotify = (task: TaskStatus): boolean => {
    if (!finalConfig.enabled || !preferences.taskNotifications) return false;
    if (notifiedTasksRef.current.has(`${task.id}-${task.status}`)) return false;
    
    // Check model filter
    const modelType = task.model.toLowerCase();
    if (modelType.includes('opus') && !finalConfig.priorityFilters.opus) return false;
    if (modelType.includes('sonnet') && !finalConfig.priorityFilters.sonnet) return false;
    if (modelType.includes('haiku') && !finalConfig.priorityFilters.haiku) return false;
    
    return true;
  };
  
  const createNotificationForTask = (
    task: TaskStatus,
    previousTask?: TaskStatus
  ): any | null => {
    let title = '';
    let body = '';
    let icon = '';
    let type: 'success' | 'error' | 'info' | 'warning' = 'info';
    
    switch (task.status) {
      case 'running':
        if (previousTask?.status === 'pending') {
          title = `⚡ Task ${task.identifier || task.id} Started`;
          body = `Running with ${task.model}${task.current_action ? `: ${task.current_action}` : ''}`;
          icon = '⚡';
          type = 'info';
        }
        break;
        
      case 'completed':
        title = `✅ Task ${task.identifier || task.id} Completed`;
        body = `Successfully completed${task.execution_time ? ` in ${formatDuration(task.execution_time)}` : ''}`;
        icon = '✅';
        type = 'success';
        break;
        
      case 'failed':
        title = `❌ Task ${task.identifier || task.id} Failed`;
        body = `Task failed after ${task.execution_time ? formatDuration(task.execution_time) : 'some time'}`;
        icon = '❌';
        type = 'error';
        break;
        
      default:
        return null;
    }
    
    return { title, body, icon, type, taskId: task.id };
  };
  
  const sendTaskNotification = (notification: any) => {
    const { title, body, icon, type, taskId } = notification;
    
    // Send browser notification
    sendNotification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      tag: `task-${taskId}`,
      requireInteraction: type === 'error',
      vibrate: type === 'error' ? [500, 250, 500] : [200, 100, 200],
      data: {
        url: `/tasks/${taskId}`,
        taskId,
        type: 'task_notification'
      }
    });
    
    // Store in notification history
    notificationStorage.addNotification({
      title,
      body,
      icon,
      type: 'task',
      source: 'automatic',
      clicked: false,
      status: 'sent',
      taskId: taskId.toString(),
      url: `/tasks/${taskId}`
    });
    
    // Mark as notified
    notifiedTasksRef.current.add(`${taskId}-${notification.status}`);
    
    // Update stats
    setTaskStats(prev => ({
      ...prev,
      notificationsSent: prev.notificationsSent + 1
    }));
  };
  
  const updateTaskStats = useCallback(() => {
    const tasks = Array.from(previousTasksRef.current.values());
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      notificationsSent: taskStats.notificationsSent,
      lastUpdate: new Date()
    };
    setTaskStats(stats);
  }, [taskStats.notificationsSent]);
  
  // Fallback to polling if WebSocket is not available
  const pollTasks = useCallback(async () => {
    if (!isMonitoring || finalConfig.useWebSocket) return;
    
    try {
      const response = await McpApi.listTasks();
      if (response.tasks) {
        response.tasks.forEach((task: any) => {
          handleTaskUpdate({
            id: task.id.toString(),
            identifier: task.identifier || task.id.toString(),
            status: task.status,
            model: task.model || 'unknown',
            execution_prompt: task.execution_prompt || '',
            created_at: task.created_at,
            execution_time: task.execution_time
          });
        });
      }
    } catch (error) {
      console.error('Failed to poll tasks:', error);
    }
  }, [isMonitoring, finalConfig.useWebSocket, handleTaskUpdate]);
  
  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
    
    setIsMonitoring(true);
    
    if (finalConfig.useWebSocket) {
      // WebSocket will handle real-time updates
      ws.connect();
    } else {
      // Use polling
      pollTasks();
      intervalRef.current = setInterval(pollTasks, finalConfig.pollInterval);
    }
  }, [permission, finalConfig, ws, pollTasks]);
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (ws.isConnected) {
      ws.send('task_status', { action: 'unsubscribe' });
      ws.disconnect();
    }
  }, [ws]);
  
  // Auto-start if configured
  useEffect(() => {
    if (finalConfig.enabled && permission === 'granted') {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, []);
  
  // Format duration helper
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };
  
  // Group notifications by orchestration
  const getOrchestrationGroups = useCallback(() => {
    if (!finalConfig.groupByOrchestration) return null;
    
    const groups = new Map<string, TaskStatus[]>();
    previousTasksRef.current.forEach(task => {
      const groupId = task.orchestration_id || 'standalone';
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(task);
    });
    
    return groups;
  }, [finalConfig.groupByOrchestration]);
  
  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    stats: taskStats,
    config: finalConfig,
    wsConnected: ws.isConnected,
    orchestrationGroups: getOrchestrationGroups(),
    clearNotifications: () => {
      notifiedTasksRef.current.clear();
      setTaskStats(prev => ({ ...prev, notificationsSent: 0 }));
    }
  };
}