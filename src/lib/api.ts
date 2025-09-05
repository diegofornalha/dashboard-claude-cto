import axios from 'axios'

// Configuração da API - usa porta 8000 onde o servidor principal está rodando
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Cliente axios configurado
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 segundos
})

// Interfaces básicas
export interface Task {
  id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  started_at?: string
  ended_at?: string
  working_directory: string
  final_summary?: string
  error_message?: string
  last_action_cache?: string
  task_identifier?: string
  orchestration_id?: string
  depends_on?: string[]
  initial_delay?: number
}

export interface CreateTaskRequest {
  task_identifier: string
  execution_prompt: string
  working_directory?: string
  model?: 'opus' | 'sonnet' | 'haiku'
  depends_on?: string[]
  orchestration_group?: string
}

export interface SystemStatus {
  healthy: boolean
  server_time: string
  tasks_running?: number
  tasks_completed?: number
}

// Funções da API

/**
 * Obter todas as tarefas
 */
export async function getTasks(limit: number = 100): Promise<{ tasks: Task[], count: number }> {
  try {
    const response = await api.get('/tasks', { params: { limit } })
    // A API retorna um array direto, então vamos transformar no formato esperado
    const tasks = Array.isArray(response.data) ? response.data : response.data.tasks || []
    return { 
      tasks: tasks,
      count: tasks.length 
    }
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return { tasks: [], count: 0 }
  }
}

/**
 * Obter uma tarefa específica pelo ID
 */
export async function getTask(taskId: number): Promise<Task | null> {
  try {
    const response = await api.get(`/tasks/${taskId}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return null
  }
}

/**
 * Obter status de uma tarefa pelo identificador
 */
export async function getTaskStatus(taskIdentifier: string): Promise<Task | null> {
  try {
    const response = await api.post('/mcp/tools/get_task_status', {
      tool: 'mcp__claude-cto__get_task_status',
      arguments: {
        task_identifier: taskIdentifier
      }
    })
    return response.data.result
  } catch (error) {
    console.error('Erro ao buscar status da tarefa:', error)
    return null
  }
}

/**
 * Criar uma nova tarefa via MCP
 */
export async function createTask(request: CreateTaskRequest): Promise<{ task_id: number, task_identifier: string } | null> {
  try {
    const response = await api.post('/mcp/tools/create_task', {
      tool: 'mcp__claude-cto__create_task',
      arguments: {
        task_identifier: request.task_identifier,
        execution_prompt: request.execution_prompt,
        working_directory: request.working_directory || '.',
        model: request.model || 'sonnet',
        depends_on: request.depends_on,
        orchestration_group: request.orchestration_group
      }
    })
    
    if (response.data.result) {
      return {
        task_id: response.data.result.task_id,
        task_identifier: response.data.result.task_identifier
      }
    }
    return null
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    throw error
  }
}

/**
 * Deletar uma tarefa
 */
export async function deleteTask(taskIdentifier: string): Promise<boolean> {
  try {
    const response = await api.post('/mcp/tools/delete_task', {
      tool: 'mcp__claude-cto__delete_task',
      arguments: {
        task_identifier: taskIdentifier
      }
    })
    return response.data.result?.success || false
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error)
    return false
  }
}

/**
 * Limpar tarefas concluídas e com falha
 */
export async function clearTasks(): Promise<number> {
  try {
    const response = await api.post('/mcp/tools/clear_tasks', {
      tool: 'mcp__claude-cto__clear_tasks',
      arguments: {}
    })
    return response.data.result?.cleared || 0
  } catch (error) {
    console.error('Erro ao limpar tarefas:', error)
    return 0
  }
}

/**
 * Verificar status do sistema
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await api.get('/health')
    const tasksResponse = await getTasks(100)
    
    const running = tasksResponse.tasks.filter(t => t.status === 'running').length
    const completed = tasksResponse.tasks.filter(t => t.status === 'completed').length
    
    return {
      healthy: true,
      server_time: new Date().toISOString(),
      tasks_running: running,
      tasks_completed: completed
    }
  } catch (error) {
    return {
      healthy: false,
      server_time: new Date().toISOString(),
      tasks_running: 0,
      tasks_completed: 0
    }
  }
}

// Exportar instância do axios para uso avançado se necessário
export { api }