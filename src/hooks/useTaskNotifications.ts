import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebNotifications } from './useWebNotifications';
import { McpApi } from '@/services/mcp-api';

interface TaskStatus {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  execution_prompt: string;
  created_at: string;
  execution_time?: number;
}

interface TaskNotificationConfig {
  enabled: boolean;
  pollInterval: number;
  soundEnabled: boolean;
  groupByOrchestration: boolean;
  priorityFilters: {
    opus: boolean;
    sonnet: boolean;
    haiku: boolean;
  };
}

export function useTaskNotifications(config?: Partial<TaskNotificationConfig>) {
  const { sendNotification, preferences, permission } = useWebNotifications();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    notificationsSent: 0
  });
  
  const previousTasksRef = useRef<Map<string, TaskStatus>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const defaultConfig: TaskNotificationConfig = {
    enabled: true,
    pollInterval: 5000,
    soundEnabled: true,
    groupByOrchestration: true,
    priorityFilters: {
      opus: true,
      sonnet: true,
      haiku: true
    },
    ...config
  };

  const detectTaskChanges = useCallback((currentTasks: TaskStatus[]) => {
    const changes = {
      new: [] as TaskStatus[],
      statusChanged: [] as { old: TaskStatus, new: TaskStatus }[],
      completed: [] as TaskStatus[],
      failed: [] as TaskStatus[]
    };

    currentTasks.forEach(task => {
      const previousTask = previousTasksRef.current.get(task.id);
      
      if (!previousTask) {
        changes.new.push(task);
      } else if (previousTask.status !== task.status) {
        changes.statusChanged.push({ old: previousTask, new: task });
        
        if (task.status === 'completed') {
          changes.completed.push(task);
        } else if (task.status === 'failed') {
          changes.failed.push(task);
        }
      }
    });
    
    return changes;
  }, []);

  const notifyTaskChange = useCallback((
    task: TaskStatus, 
    changeType: 'new' | 'running' | 'completed' | 'failed',
    previousStatus?: string
  ) => {
    if (!defaultConfig.priorityFilters[task.model as keyof typeof defaultConfig.priorityFilters]) {
      return;
    }

    let title = '';
    let body = '';
    let icon = '📝';
    let type: 'success' | 'error' | 'warning' | 'info' = 'info';
    
    switch (changeType) {
      case 'new':
        title = `📝 Nova Task: ${task.identifier}`;
        body = `Modelo: ${task.model} | Status: ${task.status}`;
        icon = '📝';
        type = 'info';
        break;
      case 'running':
        title = `⚡ Task Iniciada: ${task.identifier}`;
        body = `Executando com modelo ${task.model}...`;
        icon = '⚡';
        type = 'info';
        break;
      case 'completed':
        title = `✅ Task Concluída: ${task.identifier}`;
        body = `Tempo de execução: ${task.execution_time ? Math.floor(task.execution_time / 1000) + 's' : 'N/A'}`;
        icon = '✅';
        type = 'success';
        break;
      case 'failed':
        title = `❌ Task Falhou: ${task.identifier}`;
        body = `Erro ao executar task. Clique para ver detalhes.`;
        icon = '❌';
        type = 'error';
        break;
    }
    
    sendNotification(title, {
      body,
      icon,
      type,
      tag: `task-${task.id}`,
      url: `/tasks/${task.id}`,
      requireInteraction: changeType === 'failed',
      data: {
        taskId: task.id,
        model: task.model,
        changeType
      }
    });
    
    setTaskStats(prev => ({
      ...prev,
      notificationsSent: prev.notificationsSent + 1
    }));
    
    console.log(`📢 Notificação enviada:`, {
      task: task.identifier,
      change: changeType,
      from: previousStatus,
      to: task.status
    });
  }, [sendNotification, defaultConfig.priorityFilters]);

  const monitorTasks = useCallback(async () => {
    try {
      const tasks = await McpApi.getTasks();
      
      const changes = detectTaskChanges(tasks);
      
      if (preferences.taskStarted) {
        changes.new.forEach(task => {
          if (task.status === 'running') {
            notifyTaskChange(task, 'running');
          }
        });
      }
      
      changes.statusChanged.forEach(({ old, new: newTask }) => {
        if (newTask.status === 'running' && preferences.taskStarted) {
          notifyTaskChange(newTask, 'running', old.status);
        } else if (newTask.status === 'completed' && preferences.taskComplete) {
          notifyTaskChange(newTask, 'completed', old.status);
        } else if (newTask.status === 'failed' && preferences.taskFailed) {
          notifyTaskChange(newTask, 'failed', old.status);
        }
      });
      
      if (defaultConfig.groupByOrchestration && changes.completed.length > 2) {
        const orchestrationGroups = new Map<string, TaskStatus[]>();
        
        changes.completed.forEach(task => {
          const group = (task as any).orchestration_group || 'default';
          if (!orchestrationGroups.has(group)) {
            orchestrationGroups.set(group, []);
          }
          orchestrationGroups.get(group)!.push(task);
        });
        
        orchestrationGroups.forEach((tasks, group) => {
          if (tasks.length > 1) {
            sendNotification(`🎉 ${tasks.length} tasks concluídas`, {
              body: `Grupo ${group}: Todas as tasks foram finalizadas com sucesso!`,
              icon: '✅',
              type: 'success',
              requireInteraction: true
            });
          }
        });
      }
      
      previousTasksRef.current.clear();
      tasks.forEach(task => {
        previousTasksRef.current.set(task.id, task);
      });
      
      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        running: tasks.filter(t => t.status === 'running').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        notificationsSent: taskStats.notificationsSent
      };
      setTaskStats(stats);
      
    } catch (error) {
      console.error('Erro ao monitorar tasks:', error);
    }
  }, [detectTaskChanges, notifyTaskChange, preferences, sendNotification, defaultConfig.groupByOrchestration, taskStats.notificationsSent]);

  const startMonitoring = useCallback(() => {
    if (!defaultConfig.enabled || permission !== 'granted') {
      console.warn('Monitoramento não pode ser iniciado:', { enabled: defaultConfig.enabled, permission });
      return;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    monitorTasks();
    
    intervalRef.current = setInterval(monitorTasks, defaultConfig.pollInterval);
    setIsMonitoring(true);
    
    console.log(`✅ Monitoramento iniciado (intervalo: ${defaultConfig.pollInterval}ms)`);
  }, [defaultConfig.enabled, defaultConfig.pollInterval, permission, monitorTasks]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    console.log('⏸️ Monitoramento pausado');
  }, []);

  useEffect(() => {
    if (defaultConfig.enabled && permission === 'granted' && preferences.enabled) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [defaultConfig.enabled, permission, preferences.enabled, startMonitoring, stopMonitoring]);

  const checkNow = useCallback(() => {
    monitorTasks();
  }, [monitorTasks]);

  const clearHistory = useCallback(() => {
    previousTasksRef.current.clear();
    setTaskStats({
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      notificationsSent: 0
    });
  }, []);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    checkNow,
    clearHistory,
    stats: taskStats,
    config: defaultConfig
  };
}