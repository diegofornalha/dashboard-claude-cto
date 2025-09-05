import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  Send,
  Settings2,
  Palette,
  Clock,
  MousePointer
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useWebNotifications } from '@/hooks/useWebNotifications';

interface CustomNotification {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  requireInteraction: boolean;
  silent: boolean;
  vibrate: number[];
  duration: number;
  actions: Array<{ action: string; title: string }>;
  data: {
    url: string;
    taskId?: string;
  };
}

const PRESET_TEMPLATES = [
  {
    name: 'Task Iniciada',
    icon: '⚡',
    config: {
      title: '⚡ Task Iniciada: SDK-001',
      body: 'Executando análise com modelo Claude Opus...',
      icon: '⚡',
      vibrate: [200, 100, 200],
      requireInteraction: false
    }
  },
  {
    name: 'Task Concluída',
    icon: '✅',
    config: {
      title: '✅ Task Concluída com Sucesso!',
      body: 'Tempo de execução: 2m 34s | Modelo: Sonnet',
      icon: '✅',
      vibrate: [100, 50, 100, 50, 100],
      requireInteraction: false
    }
  },
  {
    name: 'Task Falhou',
    icon: '❌',
    config: {
      title: '❌ Erro na Execução da Task',
      body: 'A task SDK-002 falhou. Clique para ver os detalhes do erro.',
      icon: '❌',
      vibrate: [500, 250, 500],
      requireInteraction: true
    }
  },
  {
    name: 'Múltiplas Tasks',
    icon: '📦',
    config: {
      title: '📦 5 Tasks Concluídas',
      body: 'Grupo de orquestração "data-processing" finalizado!',
      icon: '📦',
      vibrate: [100, 100, 100, 100, 100],
      requireInteraction: true,
      actions: [
        { action: 'view-all', title: 'Ver Todas' },
        { action: 'summary', title: 'Ver Resumo' }
      ]
    }
  }
];

const ICON_OPTIONS = ['⚡', '✅', '❌', '⚠️', '🔔', '📢', '🚀', '🎯', '💡', '🔧', '📦', '🎉'];
const VIBRATE_PATTERNS = {
  short: [200],
  medium: [200, 100, 200],
  long: [500, 250, 500],
  pulse: [100, 100, 100, 100, 100],
  sos: [100, 100, 100, 300, 300, 300, 100, 100, 100]
};

export function TestNotificationForm() {
  const { sendNotification, permission, isSupported, requestPermission } = useWebNotifications();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [customNotification, setCustomNotification] = useState<CustomNotification>({
    title: 'Notificação de Teste',
    body: 'Esta é uma notificação personalizada do Dashboard CTO',
    icon: '🔔',
    badge: '/favicon.ico',
    tag: 'test-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    duration: 5000,
    actions: [],
    data: {
      url: '/notifications',
      taskId: undefined
    }
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sendHistory, setSendHistory] = useState<Array<{ time: Date; title: string }>>([]);

  const handleTemplateSelect = (template: typeof PRESET_TEMPLATES[0]) => {
    setActiveTemplate(template.name);
    setCustomNotification(prev => ({
      ...prev,
      ...template.config,
      actions: template.config.actions || []
    }));
  };

  const handleSendNotification = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        alert('Você precisa permitir notificações para testar!');
        return;
      }
    }

    const options: any = {
      body: customNotification.body,
      icon: customNotification.icon,
      badge: customNotification.badge,
      tag: customNotification.tag,
      requireInteraction: customNotification.requireInteraction,
      silent: customNotification.silent,
      vibrate: customNotification.vibrate,
      data: customNotification.data,
      duration: customNotification.duration
    };

    if (customNotification.actions.length > 0) {
      options.actions = customNotification.actions;
    }

    sendNotification(customNotification.title, options);
    
    setSendHistory(prev => [
      { time: new Date(), title: customNotification.title },
      ...prev.slice(0, 4)
    ]);
  };

  const handleAddAction = () => {
    if (customNotification.actions.length < 2) {
      setCustomNotification(prev => ({
        ...prev,
        actions: [
          ...prev.actions,
          { action: `action-${Date.now()}`, title: 'Nova Ação' }
        ]
      }));
    }
  };

  const handleRemoveAction = (index: number) => {
    setCustomNotification(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardBody className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Seu navegador não suporta notificações push
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Templates Pré-definidos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Templates Rápidos
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_TEMPLATES.map(template => (
              <Button
                key={template.name}
                variant={activeTemplate === template.name ? 'primary' : 'outline'}
                onClick={() => handleTemplateSelect(template)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <span className="text-2xl mb-2">{template.icon}</span>
                <span className="text-xs">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Formulário de Customização */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Personalizar Notificação
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Avançado
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Campos Básicos */}
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <Input
              value={customNotification.title}
              onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título da notificação"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensagem</label>
            <textarea
              value={customNotification.body}
              onChange={(e) => setCustomNotification(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Corpo da mensagem"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {ICON_OPTIONS.map(icon => (
                <Button
                  key={icon}
                  variant={customNotification.icon === icon ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCustomNotification(prev => ({ ...prev, icon }))}
                  className="text-xl p-2"
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>

          {/* Opções Avançadas */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customNotification.requireInteraction}
                    onChange={(e) => setCustomNotification(prev => ({ 
                      ...prev, 
                      requireInteraction: e.target.checked 
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Requer Interação</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customNotification.silent}
                    onChange={(e) => setCustomNotification(prev => ({ 
                      ...prev, 
                      silent: e.target.checked 
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Silenciosa</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Padrão de Vibração</label>
                <select
                  value={customNotification.vibrate.join(',')}
                  onChange={(e) => setCustomNotification(prev => ({ 
                    ...prev, 
                    vibrate: e.target.value.split(',').map(Number)
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  {Object.entries(VIBRATE_PATTERNS).map(([name, pattern]) => (
                    <option key={name} value={pattern.join(',')}>
                      {name.charAt(0).toUpperCase() + name.slice(1)} - [{pattern.join(', ')}]ms
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ações ({customNotification.actions.length}/2)
                </label>
                {customNotification.actions.map((action, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={action.title}
                      onChange={(e) => {
                        const newActions = [...customNotification.actions];
                        newActions[index].title = e.target.value;
                        setCustomNotification(prev => ({ ...prev, actions: newActions }));
                      }}
                      placeholder="Texto do botão"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAction(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                {customNotification.actions.length < 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAction}
                  >
                    + Adicionar Ação
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL de Destino</label>
                <Input
                  value={customNotification.data.url}
                  onChange={(e) => setCustomNotification(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, url: e.target.value }
                  }))}
                  placeholder="/tasks/123"
                />
              </div>
            </div>
          )}

          {/* Botão de Envio */}
          <Button
            id="send-notification-btn"
            onClick={handleSendNotification}
            disabled={!isSupported}
            className="w-full"
            size="lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Enviar Notificação de Teste
          </Button>

          {/* Status da Permissão */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {permission === 'granted' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Notificações Permitidas</span>
              </>
            ) : permission === 'denied' ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Notificações Bloqueadas</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">Permissão Pendente</span>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Histórico de Envios */}
      {sendHistory.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <CardBody>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Últimas Notificações Enviadas
            </h4>
            <div className="space-y-2">
              {sendHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.title}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(item.time).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}