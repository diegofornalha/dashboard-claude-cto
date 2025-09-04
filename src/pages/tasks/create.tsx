import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Container } from '../../components/ui/Container';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stack } from '../../components/ui/Stack';
import { Alert } from '../../components/ui/Alert';
import { McpApi } from '../../services/mcp-api';

interface TaskForm {
  identifier: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
}

const modelOptions = [
  { value: 'haiku', label: '🌸 Haiku - Rápido e Econômico' },
  { value: 'sonnet', label: '📝 Sonnet - Balanceado' },
  { value: 'opus', label: '🎭 Opus - Máxima Qualidade' }
];

export default function CreateTask() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<TaskForm>({
    identifier: '',
    execution_prompt: '',
    model: 'haiku',
    working_directory: process.cwd() || '/tmp',
    orchestration_group: ''
  });

  const handleInputChange = (field: keyof TaskForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.identifier.trim() || !form.execution_prompt.trim()) {
      setError('Nome e prompt são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const taskData = {
        ...form,
        identifier: form.identifier.trim(),
        execution_prompt: form.execution_prompt.trim(),
        orchestration_group: form.orchestration_group?.trim() || undefined
      };

      const response = await McpApi.createTask(
        taskData.identifier,
        taskData.execution_prompt,
        taskData.working_directory,
        taskData.model
      );
      setSuccess(`Task "${taskData.identifier}" criada com sucesso!`);
      
      // Redirect para a lista após 2 segundos
      setTimeout(() => {
        router.push('/tasks/list');
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao criar task:', err);
      setError(err.message || 'Erro ao criar task. Verifique se o servidor está rodando.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-2xl text-white">✨</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Criar Nova Task
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Configure uma nova tarefa para execução pelo Claude CTO
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuração da Task
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Preencha os detalhes da tarefa que será executada
              </p>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Alert Messages */}
                {error && (
                  <Alert className="mb-6 bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                    <strong>Erro:</strong> {error}
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                    <strong>Sucesso:</strong> {success}
                    <p className="mt-1 text-sm">Redirecionando para a lista de tasks...</p>
                  </Alert>
                )}

                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    📝 Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome da Task *
                      </label>
                      <Input
                        placeholder="Ex: análise-dados-vendas"
                        value={form.identifier}
                        onChange={(e) => handleInputChange('identifier', e.target.value)}
                        required
                        fullWidth
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Identificador único para a task
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Modelo Claude *
                      </label>
                      <Select
                        options={modelOptions}
                        value={form.model}
                        onChange={(e) => handleInputChange('model', e.target.value as TaskForm['model'])}
                        fullWidth
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Modelo de IA para executar a task
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prompt de Execução *
                    </label>
                    <textarea
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[120px]"
                      placeholder="Descreva detalhadamente o que a task deve fazer..."
                      value={form.execution_prompt}
                      onChange={(e) => handleInputChange('execution_prompt', e.target.value)}
                      required
                      rows={5}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Instruções completas para o Claude executar
                    </p>
                  </div>
                </div>

                {/* Advanced Config */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    ⚙️ Configurações Avançadas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Diretório de Trabalho
                      </label>
                      <Input
                        placeholder="/caminho/para/diretorio"
                        value={form.working_directory}
                        onChange={(e) => handleInputChange('working_directory', e.target.value)}
                        fullWidth
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Diretório onde a task será executada
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grupo de Orquestração
                      </label>
                      <Input
                        placeholder="Ex: pipeline-data-2024"
                        value={form.orchestration_group}
                        onChange={(e) => handleInputChange('orchestration_group', e.target.value)}
                        fullWidth
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Opcional: agrupe tasks relacionadas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/tasks/list')}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    ← Cancelar
                  </Button>

                  <Stack direction="horizontal" spacing="md">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setForm({
                          identifier: '',
                          execution_prompt: '',
                          model: 'haiku',
                          working_directory: process.cwd() || '/tmp',
                          orchestration_group: ''
                        });
                        setError(null);
                        setSuccess(null);
                      }}
                      disabled={isSubmitting}
                    >
                      🔄 Limpar
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⚡</span>
                          Criando...
                        </>
                      ) : (
                        <>
                          ✨ Criar Task
                        </>
                      )}
                    </Button>
                  </Stack>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Tips */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Dicas para criar tasks eficazes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">📝 Prompt Detalhado</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seja específico sobre o que deve ser feito. Inclua contexto, objetivos e formato esperado do resultado.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 Modelo Adequado</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Haiku para tasks simples, Sonnet para tarefas balanceadas, Opus para máxima qualidade.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">📁 Diretório Correto</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Certifique-se de que o diretório existe e o Claude tem permissões adequadas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎭 Grupos de Orquestração</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use para agrupar tasks relacionadas e facilitar o monitoramento.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>
    </div>
  );
}