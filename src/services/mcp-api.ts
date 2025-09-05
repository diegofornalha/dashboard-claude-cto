import axios from 'axios'

// Configuração da API
const API_BASE_URL = 'http://localhost:8001/api/v1'

// Cliente axios configurado
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// Interfaces básicas
export interface Task {
  id: string
  identifier: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  execution_prompt: string
  model: 'opus' | 'sonnet' | 'haiku'
  working_directory: string
  orchestration_group?: string
  execution_time?: number
}

export interface SystemStats {
  total_tasks: number
  running_tasks: number
  completed_tasks: number
  failed_tasks: number
  average_execution_time: number
  success_rate: number
  memory_usage: number
  cpu_usage: number
}

export interface Activity {
  id: string
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'system_event'
  timestamp: string
  task_id?: string
  task_identifier?: string
  message: string
  metadata?: Record<string, any>
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  email?: boolean
  events: {
    task_completed: boolean
    task_failed: boolean
    system_alerts: boolean
  }
}

/**
 * Obter todas as tarefas
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const response = await api.get<Task[]>('/tasks')
    return response.data.map(task => ({
      ...task,
      id: String(task.id),
      identifier: task.identifier || `task_${task.id}`
    }))
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    throw new Error('Falha ao carregar tarefas')
  }
}

/**
 * Obter uma tarefa específica pelo ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  try {
    const response = await api.get<Task>(`/tasks/${taskId}`)
    return {
      ...response.data,
      id: String(response.data.id),
      identifier: response.data.identifier || `task_${response.data.id}`
    }
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return null
  }
}

/**
 * Criar uma nova tarefa via MCP
 */
export async function createTask(
  identifier: string,
  prompt: string,
  workingDir: string = '.',
  model: 'opus' | 'sonnet' | 'haiku' = 'opus'
): Promise<Task | null> {
  try {
    const response = await api.post('/mcp/tools/create_task', {
      tool: 'mcp__claude-cto__create_task',
      arguments: {
        task_identifier: identifier,
        execution_prompt: prompt,
        working_directory: workingDir,
        model
      }
    })
    
    if (response.data.result) {
      const task = response.data.result
      return {
        id: String(task.id || task.identifier),
        identifier: task.identifier,
        status: task.status || 'pending',
        created_at: task.created_at || new Date().toISOString(),
        updated_at: task.updated_at || new Date().toISOString(),
        execution_prompt: prompt,
        model,
        working_directory: workingDir
      }
    }
    return null
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    throw new Error('Falha ao criar tarefa')
  }
}

/**
 * Deletar uma tarefa
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    await api.delete(`/tasks/${taskId}`)
    return true
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error)
    return false
  }
}

/**
 * Verificar status do sistema
 */
export async function getStatus(): Promise<{ healthy: boolean; server_time: string }> {
  try {
    await api.get('/health')
    return {
      healthy: true,
      server_time: new Date().toISOString()
    }
  } catch (error) {
    return {
      healthy: false,
      server_time: new Date().toISOString()
    }
  }
}

/**
 * Limpar tarefas concluídas e falhas
 */
export async function clearTasks(): Promise<{ cleared: number; message: string }> {
  try {
    const response = await api.post('/tasks/clear', {})
    const cleared = response.data.cleared || response.data.tasks_deleted || 0
    return {
      cleared,
      message: `${cleared} tarefas foram removidas`
    }
  } catch (error) {
    console.error('Erro ao limpar tarefas:', error)
    throw new Error('Falha ao limpar tarefas')
  }
}

/**
 * Obter estatísticas do sistema
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    const response = await api.get('/stats')
    const data = response.data
    return {
      total_tasks: (data.total_tasks_by_status?.completed || 0) + 
                  (data.total_tasks_by_status?.running || 0) +
                  (data.total_tasks_by_status?.pending || 0) +
                  (data.total_tasks_by_status?.failed || 0),
      running_tasks: data.total_tasks_by_status?.running || 0,
      completed_tasks: data.total_tasks_by_status?.completed || 0,
      failed_tasks: data.total_tasks_by_status?.failed || 0,
      average_execution_time: data.average_execution_time || 0,
      success_rate: data.success_rate || 0,
      memory_usage: data.system_resources?.memory_mb || 0,
      cpu_usage: data.system_resources?.cpu_percent || 0
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      total_tasks: 0,
      running_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      average_execution_time: 0,
      success_rate: 0,
      memory_usage: 0,
      cpu_usage: 0
    }
  }
}

/**
 * Obter atividades recentes (criadas a partir das tasks)
 */
export async function getActivities(limit: number = 50): Promise<Activity[]> {
  try {
    const tasks = await getTasks()
    const activities: Activity[] = []
    
    tasks.slice(0, limit).forEach(task => {
      if (task.created_at) {
        activities.push({
          id: `${task.id}-created`,
          type: 'task_created',
          timestamp: task.created_at,
          task_id: task.id,
          task_identifier: task.identifier,
          message: `Task ${task.identifier} criada`,
          metadata: {}
        })
      }
      
      if (task.status === 'completed' && task.updated_at) {
        activities.push({
          id: `${task.id}-completed`,
          type: 'task_completed',
          timestamp: task.updated_at,
          task_id: task.id,
          task_identifier: task.identifier,
          message: `Task ${task.identifier} concluída com sucesso`,
          metadata: {}
        })
      } else if (task.status === 'failed' && task.updated_at) {
        activities.push({
          id: `${task.id}-failed`,
          type: 'task_failed',
          timestamp: task.updated_at,
          task_id: task.id,
          task_identifier: task.identifier,
          message: `Task ${task.identifier} falhou`,
          metadata: {}
        })
      }
    })
    
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return activities.slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar atividades:', error)
    return []
  }
}

/**
 * Obter logs de uma tarefa
 */
export async function getTaskLogs(taskId: string): Promise<{ logs: string; error?: string }> {
  // Primeiro tentar via MCP tools que sabemos que funciona
  try {
    const mcpResponse = await api.post('/mcp/tools/get_task_logs', {
      tool: 'mcp__claude-cto__get_task_logs',
      arguments: {
        task_id: parseInt(taskId)
      }
    })
    
    if (mcpResponse.data?.result?.logs) {
      return { logs: mcpResponse.data.result.logs }
    } else if (mcpResponse.data?.result) {
      // Às vezes o resultado vem direto no result
      return { logs: JSON.stringify(mcpResponse.data.result, null, 2) }
    }
  } catch (mcpError) {
    console.error('Erro ao buscar logs via MCP:', mcpError)
  }
  
  // Fallback: tentar API direta
  try {
    const response = await api.get(`/api/v1/tasks/${taskId}/logs`)
    if (response.data?.logs) {
      return { logs: response.data.logs }
    }
  } catch (error) {
    console.error('Erro ao buscar logs da tarefa:', error)
  }
  
  // Se nenhum método funcionou, retornar mensagem apropriada
  return { 
    logs: 'Os logs desta tarefa ainda não estão disponíveis. Aguarde a tarefa ser processada ou tente novamente em alguns instantes.'
  }
}

/**
 * Obter configurações de notificação
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const response = await api.get('/notifications/settings')
    return response.data
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error)
    return {
      enabled: true,
      sound: false,
      desktop: true,
      email: false,
      events: {
        task_completed: true,
        task_failed: true,
        system_alerts: true
      }
    }
  }
}

/**
 * Atualizar configurações de notificação
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<boolean> {
  try {
    await api.put('/notifications/settings', settings)
    return true
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error)
    return false
  }
}

// Classe compatível com o código existente (deprecated)
class McpApiService {
  async getTasks() {
    return getTasks()
  }
  
  async getSystemStats() {
    return getSystemStats()
  }
  
  async deleteTask(taskId: string) {
    return deleteTask(taskId)
  }
  
  async clearTasks() {
    return clearTasks()
  }
  
  async createTask(identifier: string, prompt: string, workingDir?: string, model?: 'opus' | 'sonnet' | 'haiku') {
    return createTask(identifier, prompt, workingDir, model)
  }
  
  async getActivities(limit?: number) {
    return getActivities(limit)
  }
  
  async getNotificationSettings() {
    return getNotificationSettings()
  }
  
  async updateNotificationSettings(settings: NotificationSettings) {
    return updateNotificationSettings(settings)
  }
}

// Instância singleton para compatibilidade (deprecated - use funções diretas)
export const McpApi = new McpApiService()

// Exportar a classe e instância para compatibilidade
export default McpApiService