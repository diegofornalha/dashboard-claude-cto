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
  started_at?: string;
  ended_at?: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
  execution_time?: number;
  result?: string;
  error_message?: string;
  final_summary?: string;
  last_action?: string;
  log_file?: string;
  // Debug info
  session_id?: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    total_tokens?: number;
  };
  num_turns?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  last_action_cache?: string;
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
      let foundTask = tasks.find(t => t.id === taskId || t.identifier === taskId);
      
      if (!foundTask) {
        setError(`Task "${taskId}" não encontrada`);
        setLoading(false);
        return;
      }

      // Buscar detalhes completos via MCP
      try {
        const response = await fetch('http://localhost:8001/mcp/tools/get_task_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'mcp__claude-cto__get_task_status',
            arguments: { task_id: parseInt(taskId) }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            // Merge TODOS os dados disponíveis do MCP
            foundTask = {
              ...foundTask,
              ...data.result,
              execution_prompt: data.result.execution_prompt || foundTask.execution_prompt || '',
              model: data.result.model || foundTask.model || 'opus',
              // Debug info
              session_id: data.result.session_id,
              total_cost_usd: data.result.total_cost_usd,
              usage: data.result.usage,
              num_turns: data.result.num_turns,
              duration_ms: data.result.duration_ms,
              duration_api_ms: data.result.duration_api_ms,
              last_action: data.result.last_action,
              log_file: data.result.log_file,
              final_summary: data.result.final_summary,
              started_at: data.result.started_at,
              ended_at: data.result.ended_at,
              last_action_cache: data.result.last_action_cache
            };
          }
        }
      } catch (mcpErr) {
        console.log('Detalhes MCP não disponíveis, usando dados básicos');
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      // Verificar se a data está no futuro (indica erro)
      if (date.getTime() > Date.now() + 86400000) return null; // +1 dia de margem
      
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return null;
    }
  };
  
  // Detectar se a tarefa está travada (rodando por mais de 1 hora)
  const isTaskStuck = () => {
    if (task?.status !== 'running') return false;
    if (!task?.started_at) return false;
    
    const startTime = new Date(task.started_at).getTime();
    const now = Date.now();
    const hourInMs = 3600000; // 1 hora em ms
    
    return (now - startTime) > hourInMs;
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

  // Parse final_summary para extrair informações das mensagens
  const parseTaskSummary = (summary?: string) => {
    if (!summary) return null;
    
    const processedMatch = summary.match(/Processed (\d+) messages/);
    const statusMatch = summary.match(/Task (completed|failed)/);
    const lastMessageMatch = summary.match(/Last: (\w+)\(/);
    
    return {
      messageCount: processedMatch ? parseInt(processedMatch[1]) : null,
      status: statusMatch ? statusMatch[1] : null,
      lastMessageType: lastMessageMatch ? lastMessageMatch[1] : null
    };
  };
  
  // Parse last_action_cache para extrair tipo e conteúdo COMPLETO
  const parseLastAction = (action?: string) => {
    if (!action) return null;
    
    const typeMatch = action.match(/^(\w+)\(/);
    // Captura TODO o conteúdo sem truncar
    const contentMatch = action.match(/content=\[([^\]]+)\]/);
    
    return {
      type: typeMatch ? typeMatch[1] : 'Unknown',
      content: contentMatch ? contentMatch[1] : action // Conteúdo completo sem limite
    };
  };

  // Extrair arquivos mencionados nas ações
  const extractFiles = (text?: string) => {
    if (!text) return { created: [], modified: [], read: [], deleted: [] };
    
    const files = {
      created: [] as string[],
      modified: [] as string[],
      read: [] as string[],
      deleted: [] as string[]
    };
    
    // Padrões para detectar operações em arquivos
    const patterns = {
      write: /Write\(['"]([^'"]+)['"]\)/g,
      edit: /Edit\(['"]([^'"]+)['"]\)/g,
      read: /Read\(['"]([^'"]+)['"]\)/g,
      multiEdit: /MultiEdit\(['"]([^'"]+)['"]\)/g,
      notebookEdit: /NotebookEdit\(['"]([^'"]+)['"]\)/g
    };
    
    // Detectar arquivos criados (Write)
    let match;
    while ((match = patterns.write.exec(text)) !== null) {
      if (!files.created.includes(match[1])) {
        files.created.push(match[1]);
      }
    }
    
    // Detectar arquivos modificados (Edit, MultiEdit, NotebookEdit)
    while ((match = patterns.edit.exec(text)) !== null) {
      if (!files.modified.includes(match[1])) {
        files.modified.push(match[1]);
      }
    }
    
    while ((match = patterns.multiEdit.exec(text)) !== null) {
      if (!files.modified.includes(match[1])) {
        files.modified.push(match[1]);
      }
    }
    
    while ((match = patterns.notebookEdit.exec(text)) !== null) {
      if (!files.modified.includes(match[1])) {
        files.modified.push(match[1]);
      }
    }
    
    // Detectar arquivos lidos (Read)
    while ((match = patterns.read.exec(text)) !== null) {
      if (!files.read.includes(match[1])) {
        files.read.push(match[1]);
      }
    }
    
    // Detectar menções a deletar/remover
    const deletePatterns = [
      /[Dd]elet(?:e|ing|ed)\s+(?:file\s+)?['"]?([^\s'"]+)['"]?/g,
      /[Rr]emov(?:e|ing|ed)\s+(?:file\s+)?['"]?([^\s'"]+)['"]?/g
    ];
    
    for (const pattern of deletePatterns) {
      while ((match = pattern.exec(text)) !== null) {
        // Filtrar apenas caminhos válidos de arquivo
        if (match[1].includes('/') || match[1].includes('.')) {
          if (!files.deleted.includes(match[1])) {
            files.deleted.push(match[1]);
          }
        }
      }
    }
    
    return files;
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
              {isTaskStuck() ? (
                <Badge 
                  variant="danger"
                  className="animate-pulse"
                >
                  <span className="mr-1">⚠️</span>
                  Tarefa Travada
                </Badge>
              ) : (
                <Badge 
                  variant={statusInfo.color as any}
                  className="animate-pulse-soft"
                >
                  <span className="mr-1">{statusInfo.icon}</span>
                  {statusInfo.label}
                </Badge>
              )}
              
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

        {/* Warning for stuck tasks */}
        {isTaskStuck() && (
          <Alert variant="warning" className="mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Esta tarefa parece estar travada
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  A tarefa está rodando há mais de 1 hora sem atualizações. 
                  Isso pode indicar que o processo travou ou foi interrompido.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Última ação: {task.last_action ? task.last_action.substring(0, 100) + '...' : 'Não disponível'}
                </p>
              </div>
            </div>
          </Alert>
        )}

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

                  {formatDate(task.created_at) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Criada em
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  )}

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


            {/* Debug & Performance Info COMPLETO */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🐛 Debug & Performance Completo
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {/* IDs e Identificadores */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">🔑 IDENTIFICADORES</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Task ID:</span>
                        <code className="ml-1 font-mono text-gray-900 dark:text-gray-100">{task.id || 'N/A'}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">Identifier:</span>
                        <code className="ml-1 font-mono text-gray-900 dark:text-gray-100">{task.identifier || 'N/A'}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">Session ID:</span>
                        <code className="ml-1 font-mono text-gray-900 dark:text-gray-100 text-[10px]">{task.session_id || 'N/A'}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">Orchestration:</span>
                        <code className="ml-1 font-mono text-gray-900 dark:text-gray-100">{task.orchestration_group || 'N/A'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Completos */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">⏰ TIMESTAMPS</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-400">Created:</span>
                        <code className="font-mono text-blue-800 dark:text-blue-200">{task.created_at || 'N/A'}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-400">Started:</span>
                        <code className="font-mono text-blue-800 dark:text-blue-200">{task.started_at || 'N/A'}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-400">Updated:</span>
                        <code className="font-mono text-blue-800 dark:text-blue-200">{task.updated_at || 'N/A'}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-400">Ended:</span>
                        <code className="font-mono text-blue-800 dark:text-blue-200">{task.ended_at || 'N/A'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Status e Configuração Detalhada */}
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 mb-2">⚙️ CONFIGURAÇÃO</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-yellow-600 dark:text-yellow-400">Status:</span>
                        <span className="ml-1 font-bold uppercase text-yellow-800 dark:text-yellow-200">{task.status}</span>
                      </div>
                      <div>
                        <span className="text-yellow-600 dark:text-yellow-400">Model:</span>
                        <span className="ml-1 font-bold uppercase text-yellow-800 dark:text-yellow-200">{task.model}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-yellow-600 dark:text-yellow-400">Directory:</span>
                        <code className="ml-1 font-mono text-[10px] text-yellow-800 dark:text-yellow-200">{task.working_directory}</code>
                      </div>
                      {task.log_file && (
                        <div className="col-span-2">
                          <span className="text-yellow-600 dark:text-yellow-400">Log File:</span>
                          <code className="ml-1 font-mono text-[10px] text-yellow-800 dark:text-yellow-200">{task.log_file}</code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Status para Running Tasks */}
                  {task.status === 'running' && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg animate-pulse">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">⚡ EXECUTANDO AGORA</p>
                      {task.last_action ? (
                        <div>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all">
                            {task.last_action}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                            <span className="text-xs text-indigo-500">Processando...</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Aguardando ação...</p>
                      )}
                    </div>
                  )}

                  {/* Performance Metrics Detalhadas */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">📊 MÉTRICAS DE PERFORMANCE</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Duração Total</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.duration_ms ? `${(task.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Tempo API</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.duration_api_ms ? `${(task.duration_api_ms / 1000).toFixed(2)}s` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Turnos</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.num_turns || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Exec Time</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.execution_time ? formatExecutionTime(task.execution_time) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Tempo Real</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.started_at && new Date(task.started_at).getTime() > 0 
                            ? formatExecutionTime(Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000))
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-purple-500 text-[10px]">Latência</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">
                          {task.duration_ms && task.duration_api_ms 
                            ? `${((task.duration_ms - task.duration_api_ms) / 1000).toFixed(2)}s`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Token Usage Detalhado */}
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-2">🎯 USO DE TOKENS</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-gray-900 rounded">
                        <span className="text-orange-500 text-[10px]">Input Tokens:</span>
                        <p className="font-mono font-bold text-orange-700 dark:text-orange-300">
                          {task.usage?.input_tokens?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-900 rounded">
                        <span className="text-orange-500 text-[10px]">Output Tokens:</span>
                        <p className="font-mono font-bold text-orange-700 dark:text-orange-300">
                          {task.usage?.output_tokens?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-900 rounded">
                        <span className="text-orange-500 text-[10px]">Cache Created:</span>
                        <p className="font-mono font-bold text-orange-700 dark:text-orange-300">
                          {task.usage?.cache_creation_input_tokens?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-900 rounded">
                        <span className="text-orange-500 text-[10px]">Cache Read:</span>
                        <p className="font-mono font-bold text-orange-700 dark:text-orange-300">
                          {task.usage?.cache_read_input_tokens?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2 p-2 bg-orange-100 dark:bg-orange-800/20 rounded text-center">
                        <span className="text-orange-600 dark:text-orange-400 text-[10px]">TOTAL TOKENS:</span>
                        <p className="font-mono font-bold text-lg text-orange-800 dark:text-orange-200">
                          {task.usage?.total_tokens?.toLocaleString() || 
                           ((task.usage?.input_tokens || 0) + (task.usage?.output_tokens || 0)).toLocaleString() || 
                           'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Analysis Detalhada */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-2">💰 ANÁLISE DE CUSTOS</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-green-500 text-[10px]">Custo USD</p>
                        <p className="font-bold text-lg text-green-700 dark:text-green-300">
                          ${task.total_cost_usd?.toFixed(6) || '0.0000'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                        <p className="text-green-500 text-[10px]">Custo BRL</p>
                        <p className="font-bold text-lg text-green-700 dark:text-green-300">
                          R$ {task.total_cost_usd ? (task.total_cost_usd * 5.5).toFixed(4) : '0.0000'}
                        </p>
                      </div>
                      {task.total_cost_usd && task.usage?.total_tokens && (
                        <div className="col-span-2 text-center p-2 bg-green-100 dark:bg-green-800/20 rounded">
                          <p className="text-green-600 dark:text-green-400 text-[10px]">Custo por 1K tokens</p>
                          <p className="font-mono text-green-800 dark:text-green-200">
                            ${((task.total_cost_usd / (task.usage.total_tokens || 1)) * 1000).toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Histórico de Mensagens */}
                  {(task.final_summary || task.last_action_cache || task.num_turns) && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">📨 HISTÓRICO DE MENSAGENS</p>
                      <div className="space-y-2">
                        {/* Parse do final_summary */}
                        {(() => {
                          const summaryInfo = parseTaskSummary(task.final_summary);
                          const lastActionInfo = parseLastAction(task.last_action_cache);
                          
                          return (
                            <>
                              {/* Informações do Summary */}
                              {summaryInfo && (
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                                    <p className="text-indigo-500 text-[10px]">Total Mensagens</p>
                                    <p className="font-bold text-lg text-indigo-700 dark:text-indigo-300">
                                      {summaryInfo.messageCount || task.num_turns || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                                    <p className="text-indigo-500 text-[10px]">Status Final</p>
                                    <p className="font-bold text-indigo-700 dark:text-indigo-300">
                                      {summaryInfo.status ? (
                                        <span className={summaryInfo.status === 'completed' ? 'text-green-600' : 'text-red-600'}>
                                          {summaryInfo.status.toUpperCase()}
                                        </span>
                                      ) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                                    <p className="text-indigo-500 text-[10px]">Última Mensagem</p>
                                    <p className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                                      {summaryInfo.lastMessageType || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Detalhes da última ação - COMPLETO */}
                              {lastActionInfo && (
                                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded max-h-[300px] overflow-y-auto">
                                  <p className="text-indigo-600 dark:text-indigo-400 text-[10px] mb-2">
                                    📍 Última Ação Processada (Completa):
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                        Tipo:
                                      </span>
                                      <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">
                                        {lastActionInfo.type}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        Conteúdo Completo:
                                      </p>
                                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono whitespace-pre-wrap break-all">
                                          {lastActionInfo.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Detalhes completos do final_summary */}
                              {task.final_summary && (
                                <details className="mt-2">
                                  <summary className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-700">
                                    Ver Detalhes Completos do Summary
                                  </summary>
                                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded">
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all">
                                      {task.final_summary}
                                    </p>
                                  </div>
                                </details>
                              )}
                              
                              {/* Detalhes completos da última ação */}
                              {task.last_action_cache && (
                                <details className="mt-2">
                                  <summary className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-700">
                                    Ver Detalhes Completos da Última Ação
                                  </summary>
                                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded">
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all">
                                      {task.last_action_cache}
                                    </p>
                                  </div>
                                </details>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Arquivos Modificados */}
                  {(() => {
                    // Combinar texto de last_action_cache e final_summary para buscar arquivos
                    const combinedText = `${task.last_action_cache || ''} ${task.final_summary || ''}`;
                    const files = extractFiles(combinedText);
                    const hasFiles = files.created.length > 0 || files.modified.length > 0 || 
                                   files.read.length > 0 || files.deleted.length > 0;
                    
                    if (!hasFiles) return null;
                    
                    return (
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                        <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-2">📁 ARQUIVOS MODIFICADOS</p>
                        <div className="space-y-2">
                          {/* Arquivos Criados */}
                          {files.created.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                                🆕 Arquivos Criados ({files.created.length})
                              </p>
                              <div className="space-y-1">
                                {files.created.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                                    <span className="text-green-600 dark:text-green-400">✨</span>
                                    <code className="text-[10px] text-green-700 dark:text-green-300 font-mono break-all">
                                      {file}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Arquivos Modificados */}
                          {files.modified.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                ✏️ Arquivos Modificados ({files.modified.length})
                              </p>
                              <div className="space-y-1">
                                {files.modified.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                    <span className="text-blue-600 dark:text-blue-400">📝</span>
                                    <code className="text-[10px] text-blue-700 dark:text-blue-300 font-mono break-all">
                                      {file}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Arquivos Lidos */}
                          {files.read.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                📖 Arquivos Lidos ({files.read.length})
                              </p>
                              <div className="space-y-1">
                                {files.read.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                                    <span className="text-gray-600 dark:text-gray-400">👁️</span>
                                    <code className="text-[10px] text-gray-700 dark:text-gray-300 font-mono break-all">
                                      {file}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Arquivos Excluídos */}
                          {files.deleted.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                🗑️ Arquivos Excluídos ({files.deleted.length})
                              </p>
                              <div className="space-y-1">
                                {files.deleted.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-red-100 dark:bg-red-900/30 rounded">
                                    <span className="text-red-600 dark:text-red-400">❌</span>
                                    <code className="text-[10px] text-red-700 dark:text-red-300 font-mono break-all line-through">
                                      {file}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Real-time Status para Running Tasks */}
                  {task.status === 'running' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">🔴 STATUS EM TEMPO REAL</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-red-600 dark:text-red-400">Tempo Decorrido:</span>
                          <code className="font-mono text-sm font-bold text-red-800 dark:text-red-200">
                            {task.started_at && new Date(task.started_at).getTime() > 0 
                              ? formatExecutionTime(Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000))
                              : 'Iniciando...'}
                          </code>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full animate-pulse" 
                               style={{width: `${Math.min(95, Math.floor((Date.now() - new Date(task.started_at || Date.now()).getTime()) / 1000))}%`}}>
                          </div>
                        </div>
                        {isTaskStuck() && (
                          <p className="text-xs font-bold text-red-600 animate-pulse">
                            ⚠️ ATENÇÃO: Tarefa rodando há mais de 1 hora!
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Informações Adicionais de Debug */}
                  {(task.final_summary || task.error_message || task.result) && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">📝 RESULTADOS</p>
                      <div className="space-y-2 text-xs">
                        {task.final_summary && (
                          <div>
                            <p className="text-gray-500">Summary:</p>
                            <p className="font-mono text-[10px] text-gray-700 dark:text-gray-300">{task.final_summary}</p>
                          </div>
                        )}
                        {task.error_message && (
                          <div>
                            <p className="text-red-500">Error:</p>
                            <p className="font-mono text-[10px] text-red-700 dark:text-red-300">{task.error_message}</p>
                          </div>
                        )}
                        {task.result && (
                          <div>
                            <p className="text-green-500 mb-1">Result (Completo):</p>
                            <div className="max-h-[200px] overflow-y-auto p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="font-mono text-[10px] text-green-700 dark:text-green-300 whitespace-pre-wrap">
                                {task.result}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

          </div>

          {/* Results and Logs */}
          <div className="space-y-6">
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
          </div>
        </Grid>
      </Container>
    </div>
  );
}