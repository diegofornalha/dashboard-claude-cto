import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Grid } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/States';
import { McpApi } from '@/services/mcp-api';
import { useWebNotifications } from '@/hooks/useWebNotifications';

// Types
interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  started_at?: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
  execution_time?: number;
}

// Tab types
type TabType = 'all' | 'running' | 'completed';

export default function TasksList() {
  const [isMounted, setIsMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true); // Auto-refresh ON por padrão
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const previousTasksRef = useRef<Task[]>([]);
  const { notifyTaskStarted, notifyTaskCompleted, notifyTaskFailed } = useWebNotifications();

  // Check for task status changes and send notifications
  const checkTaskChanges = (newTasks: Task[], oldTasks: Task[]) => {
    if (oldTasks.length === 0) return; // Skip on first load

    newTasks.forEach(newTask => {
      const oldTask = oldTasks.find(t => t.id === newTask.id);
      
      if (!oldTask) {
        // New task appeared
        if (newTask.status === 'running') {
          notifyTaskStarted(newTask.execution_prompt || `Task #${newTask.id}`, parseInt(newTask.id));
        }
      } else if (oldTask.status !== newTask.status) {
        // Status changed
        const taskName = newTask.execution_prompt || `Task #${newTask.id}`;
        const taskId = parseInt(newTask.id);
        
        switch (newTask.status) {
          case 'running':
            if (oldTask.status === 'pending') {
              notifyTaskStarted(taskName, taskId);
            }
            break;
          case 'completed':
            notifyTaskCompleted(taskName, taskId);
            break;
          case 'failed':
            notifyTaskFailed(taskName, undefined, taskId);
            break;
        }
      }
    });
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const apiTasks = await McpApi.getTasks();
      console.log('Tasks carregadas:', apiTasks);
      
      // Check for changes and notify
      if (previousTasksRef.current.length > 0) {
        checkTaskChanges(apiTasks, previousTasksRef.current);
      }
      
      // Update state
      previousTasksRef.current = apiTasks;
      setTasks(apiTasks);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tasks:', err);
      setError('Erro ao carregar tasks. Verifique se o servidor está rodando em http://localhost:8001');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initial load
  useEffect(() => {
    if (isMounted) {
      fetchTasks();
    }
  }, [isMounted]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !isMounted) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, isMounted]);

  // Filter tasks by active tab
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by tab
    switch (activeTab) {
      case 'running':
        filtered = filtered.filter(task => task.status === 'running');
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      case 'all':
      default:
        // Show all tasks
        break;
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });

    return filtered;
  }, [tasks, activeTab]);

  // Statistics for all tasks (not filtered)
  const taskStats = useMemo(() => {
    const stats = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: tasks.length,
      pending: stats.pending || 0,
      running: stats.running || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0
    };
  }, [tasks]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!isMounted) return 'Carregando...';
    
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Detectar se a tarefa está travada (rodando por mais de 1 hora)
  const isTaskStuck = (task: Task) => {
    if (task.status !== 'running') return false;
    if (!task.started_at) return false;
    
    try {
      const startTime = new Date(task.started_at).getTime();
      const now = Date.now();
      const hourInMs = 3600000; // 1 hora em ms
      
      return (now - startTime) > hourInMs;
    } catch {
      return false;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Deseja excluir esta tarefa travada?')) return;
    
    try {
      const success = await McpApi.deleteTask(taskId);
      if (success) {
        alert('Tarefa excluída com sucesso!');
        fetchTasks();
      } else {
        alert('Erro ao excluir tarefa');
      }
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
      alert('Erro ao excluir tarefa');
    }
  };

  const handleDeleteAllStuckTasks = async () => {
    const stuckTasks = tasks.filter(task => isTaskStuck(task));
    if (stuckTasks.length === 0) {
      alert('Não há tarefas travadas para excluir');
      return;
    }
    
    if (!confirm(`Deseja excluir ${stuckTasks.length} tarefas travadas?`)) return;
    
    let deletedCount = 0;
    for (const task of stuckTasks) {
      try {
        const success = await McpApi.deleteTask(task.id);
        if (success) deletedCount++;
      } catch (err) {
        console.error(`Erro ao excluir tarefa ${task.id}:`, err);
      }
    }
    
    alert(`${deletedCount} de ${stuckTasks.length} tarefas travadas foram excluídas`);
    fetchTasks();
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card 
      hoverable 
      className={`
        relative transition-all duration-300 hover:shadow-lg
        ${selectedTasks.has(task.id) ? 'ring-2 ring-blue-500 shadow-lg' : ''}
      `}
    >
      <CardBody className="p-6">
        {/* Status Badge - Positioned absolutely in top-right corner */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isTaskStuck(task) ? (
            <>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                title="Excluir tarefa travada"
              >
                🗑️
              </button>
              <Badge 
                variant="danger"
                className="text-xs font-medium shadow-sm animate-pulse bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Travada</span>
                </div>
              </Badge>
            </>
          ) : (
            <Badge 
              variant={getStatusBadgeVariant(task.status)}
              className={`
                text-xs font-medium shadow-sm
                ${task.status === 'running' ? 'animate-pulse' : ''}
                ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : ''}
                ${task.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' : ''}
                ${task.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : ''}
                ${task.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : ''}
              `}
            >
              <div className="flex items-center gap-1">
                {task.status === 'running' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {task.status === 'completed' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {task.status === 'failed' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                {task.status === 'pending' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="capitalize">{task.status}</span>
              </div>
            </Badge>
          )}
        </div>

        <Stack direction="vertical" spacing="sm">
          <div className="flex items-start justify-between pr-20">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedTasks.has(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/tasks/${task.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                      Task #{task.id} - {task.identifier}
                    </h3>
                  </Link>
                  {task.orchestration_group && (
                    <Badge variant="default" size="sm" className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      Grupo: {task.orchestration_group}
                    </Badge>
                  )}
                </div>
                
                {task.execution_time && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    ⏱️ {formatExecutionTime(task.execution_time)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-base text-gray-900 dark:text-white font-medium leading-relaxed line-clamp-4">
              {task.execution_prompt}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Criada: {formatDate(task.created_at)}</span>
              <span>Atualizada: {formatDate(task.updated_at)}</span>
            </div>
            
            <Link href={`/tasks/${task.id}`}>
              <Button size="sm" variant="secondary" className="text-xs">
                Ver Detalhes
              </Button>
            </Link>
          </div>
        </Stack>
      </CardBody>
    </Card>
  );

  const headerActions = (
    <Stack direction="horizontal" spacing="sm" className="flex-wrap">
      <Button
        variant={autoRefresh ? 'success' : 'secondary'}
        size="sm"
        onClick={() => setAutoRefresh(!autoRefresh)}
      >
        {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
      </Button>

      <Button 
        variant="secondary" 
        size="sm"
        onClick={fetchTasks}
        disabled={loading}
      >
        {loading ? 'Carregando...' : '🔄 Atualizar'}
      </Button>
      
      <Button 
        variant="secondary" 
        size="sm"
        onClick={async () => {
          try {
            await McpApi.clearTasks();
            fetchTasks();
          } catch (err) {
            console.error('Erro ao limpar tasks', err);
          }
        }}
      >
        🧹 Limpar
      </Button>
      
      {tasks.some(task => isTaskStuck(task)) && (
        <Button 
          variant="danger" 
          size="sm"
          onClick={handleDeleteAllStuckTasks}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          🗑️ Excluir Todas Travadas ({tasks.filter(task => isTaskStuck(task)).length})
        </Button>
      )}
    </Stack>
  );

  // Loading state during initial mount
  if (!isMounted) {
    return (
      <PageLayout>
        <PageHeader
          title="Lista de Tasks"
          description="Carregando..."
          actions={<div></div>}
        />
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Lista de Tasks"
        description={`${filteredTasks.length} tasks ${activeTab === 'all' ? 'no total' : activeTab === 'running' ? 'em execução' : 'concluídas'}`}
        actions={headerActions}
      />

      <Stack direction="vertical" spacing="lg">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <div className="flex items-center gap-2">
                <span>Todas</span>
                <Badge 
                  variant="default" 
                  className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {taskStats.total}
                </Badge>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('running')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'running'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <div className="flex items-center gap-2">
                <span>Em Execução</span>
                {taskStats.running > 0 && (
                  <Badge 
                    variant="info" 
                    className="text-xs animate-pulse bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {taskStats.running}
                  </Badge>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <div className="flex items-center gap-2">
                <span>Concluídas</span>
                {taskStats.completed > 0 && (
                  <Badge 
                    variant="success" 
                    className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    {taskStats.completed}
                  </Badge>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTasks.size} task(s) selecionada(s)
                </p>
                <Stack direction="horizontal" spacing="sm">
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={async () => {
                      try {
                        for (const taskId of Array.from(selectedTasks)) {
                          await McpApi.deleteTask(taskId);
                        }
                        setSelectedTasks(new Set());
                        fetchTasks();
                      } catch (err) {
                        console.error('Erro ao deletar tasks', err);
                      }
                    }}
                  >
                    🗑️ Deletar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTasks(new Set())}>
                    ❌ Limpar Seleção
                  </Button>
                </Stack>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tasks List */}
        {error ? (
          <Card>
            <CardBody>
              <ErrorState
                title="Erro ao carregar tasks"
                message={error}
                action={{
                  label: "Tentar novamente",
                  onClick: fetchTasks
                }}
              />
            </CardBody>
          </Card>
        ) : loading ? (
          <Card>
            <CardBody>
              <LoadingState 
                message="Carregando tasks..."
                size="lg"
              />
            </CardBody>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title={
                  activeTab === 'all' 
                    ? "Nenhuma task encontrada" 
                    : activeTab === 'running'
                    ? "Nenhuma task em execução"
                    : "Nenhuma task concluída"
                }
                message={
                  activeTab === 'all'
                    ? "Não há tasks no sistema. Use o MCP para criar uma nova task."
                    : activeTab === 'running'
                    ? "Não há tasks sendo executadas no momento."
                    : "Não há tasks concluídas ainda."
                }
                icon={
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                onChange={selectAllTasks}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Selecionar todas ({filteredTasks.length})
              </span>
            </div>
            
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Grid>
          </>
        )}
      </Stack>
    </PageLayout>
  );
}