import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Container } from '../../components/ui/Container';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Stack } from '../../components/ui/Stack';
import { Grid } from '../../components/ui/Grid';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { McpApi } from '../../services/mcp-api';

interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
  execution_time?: number;
  result?: string;
  error_message?: string;
}

const statusConfig = {
  pending: { color: 'warning', icon: '⏳', label: 'Pendente' },
  running: { color: 'info', icon: '⚡', label: 'Em Execução' },
  completed: { color: 'success', icon: '✅', label: 'Concluída' },
  failed: { color: 'danger', icon: '❌', label: 'Falhada' }
} as const;

const modelConfig = {
  haiku: { icon: '🌸', label: 'Haiku', description: 'Rápido e Econômico' },
  sonnet: { icon: '📝', label: 'Sonnet', description: 'Balanceado' },
  opus: { icon: '🎭', label: 'Opus', description: 'Máxima Qualidade' },
  // Fallback config for unknown models
  default: { icon: '❓', label: 'Desconhecido', description: 'Modelo não reconhecido' }
} as const;

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchTask = async (taskId: string) => {
    try {
      const tasks = await McpApi.getTasks();
      const foundTask = tasks.find(t => t.id === taskId || t.identifier === taskId);
      
      if (!foundTask) {
        setError(`Task "${taskId}" não encontrada`);
        return;
      }

      setTask({
        ...foundTask,
        execution_time: foundTask.execution_time ? Math.floor(foundTask.execution_time / 1000) : undefined
      });
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar task:', err);
      setError('Erro ao carregar task. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchTask(id);
    }
  }, [id]);

  useEffect(() => {
    if (!autoRefresh || !task) return;

    const interval = setInterval(() => {
      if (id && typeof id === 'string') {
        fetchTask(id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, task, id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
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

  const handleDeleteTask = async () => {
    if (!task) return;

    const confirmMessage = `Tem certeza que deseja excluir a task "${task.identifier}"?\n\nEsta ação não pode ser desfeita.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const success = await McpApi.deleteTask(task.identifier);
      if (success) {
        alert('Task excluída com sucesso!');
        router.push('/tasks/list');
      } else {
        alert('Erro ao excluir task');
      }
    } catch (err) {
      console.error('Erro ao excluir task:', err);
      alert('Erro ao excluir task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Container maxWidth="2xl" className="py-8">
          <div className="space-y-6">
            <Skeleton variant="text" width="300px" height="40px" />
            <Card>
              <CardBody>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="text" height="20px" />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Container maxWidth="2xl" className="py-8">
          <Card>
            <CardBody>
              <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                <strong>Erro:</strong> {error}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => router.push('/tasks/list')}>
                    ← Voltar para Lista
                  </Button>
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    🔄 Tentar Novamente
                  </Button>
                </div>
              </Alert>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  if (!task) return null;

  const statusInfo = statusConfig[task.status];
  const modelInfo = modelConfig[task.model] || modelConfig.opus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Container maxWidth="2xl" className="py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/tasks/list')}
                className="text-sm"
              >
                ← Voltar
              </Button>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Detalhes da Task</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {task.identifier}
            </h1>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant={statusInfo.color as any}
                className="animate-pulse-soft"
              >
                <span className="mr-1">{statusInfo.icon}</span>
                {statusInfo.label}
              </Badge>
              
              {task.orchestration_group && (
                <Badge variant="default">
                  🎭 {task.orchestration_group}
                </Badge>
              )}
              
              <Badge variant="secondary">
                <span className="mr-1">{modelInfo.icon}</span>
                {modelInfo.label}
              </Badge>
            </div>
          </div>

          <Stack direction="horizontal" spacing="sm">
            <Button
              variant={autoRefresh ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              disabled={task.status === 'completed' || task.status === 'failed'}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteTask}
            >
              🗑️ Excluir
            </Button>
          </Stack>
        </div>

        <Grid cols={1} colsLg={2} gap="lg">
          {/* Task Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📋 Informações da Task
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID da Task
                    </label>
                    <code className="block bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono">
                      {task.id}
                    </code>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modelo Claude
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{modelInfo.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{modelInfo.label}</span>
                      <span className="text-sm text-gray-500">({modelInfo.description})</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Diretório de Trabalho
                    </label>
                    <code className="block bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono">
                      {task.working_directory}
                    </code>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Criada em
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(task.created_at)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Última Atualização
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(task.updated_at)}
                    </p>
                  </div>

                  {task.execution_time && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tempo de Execução
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        ⏱️ {formatExecutionTime(task.execution_time)}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Execution Prompt */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📝 Prompt de Execução
                </h2>
              </CardHeader>
              <CardBody>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {task.execution_prompt}
                  </pre>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Results and Logs */}
          <div className="space-y-6">
            {/* Status Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📊 Status da Execução
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">{statusInfo.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {statusInfo.label}
                  </h3>
                  
                  {task.status === 'running' && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Task em execução... {autoRefresh && '(Atualizando automaticamente)'}
                    </p>
                  )}
                  
                  {task.status === 'pending' && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Aguardando início da execução
                    </p>
                  )}
                  
                  {task.status === 'completed' && (
                    <p className="text-green-600 dark:text-green-400">
                      Executada com sucesso!
                    </p>
                  )}
                  
                  {task.status === 'failed' && (
                    <p className="text-red-600 dark:text-red-400">
                      Execução falhou
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Results */}
            {task.result && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    ✅ Resultado da Execução
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-green-800 dark:text-green-200 leading-relaxed">
                      {task.result}
                    </pre>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Error Messages */}
            {task.error_message && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    ❌ Mensagem de Erro
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-red-800 dark:text-red-200 leading-relaxed">
                      {task.error_message}
                    </pre>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ⚡ Ações Rápidas
                </h2>
              </CardHeader>
              <CardBody>
                <Stack direction="vertical" spacing="sm">
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    fullWidth
                  >
                    🔄 Atualizar Dados
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const message = `💡 Use o MCP para criar uma nova task:\n\nPara criar uma task similar, use o comando no MCP:\n\nmcp__claude-cto__create_task\n\nCom as seguintes configurações:\n• Modelo: ${task.model}\n• Diretório: ${task.working_directory}\n• Grupo de orquestração: ${task.orchestration_group || 'N/A'}`;
                      alert(message);
                    }}
                    fullWidth
                  >
                    💡 Como Criar Task Similar
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const taskJson = JSON.stringify(task, null, 2);
                      navigator.clipboard.writeText(taskJson);
                      alert('Dados da task copiados para a área de transferência!');
                    }}
                    fullWidth
                  >
                    📋 Copiar JSON
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </div>
        </Grid>
      </Container>
    </div>
  );
}