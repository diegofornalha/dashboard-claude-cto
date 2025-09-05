import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Filter, 
  Download, 
  Trash2, 
  BarChart3,
  MousePointer,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Calendar,
  Search,
  ChevronDown
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { notificationStorage } from '@/services/notification-storage';
import { NotificationLog, NotificationStats } from '@/types/notification';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
  task: <Zap className="w-4 h-4 text-purple-500" />
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'agora mesmo';
}

export function NotificationHistory() {
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showStats, setShowStats] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadHistory();
    loadStats();
    
    const interval = setInterval(() => {
      loadHistory();
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadHistory = () => {
    const logs = notificationStorage.getHistory(100);
    setHistory(logs);
  };
  
  const loadStats = () => {
    const statistics = notificationStorage.getStatistics();
    setStats(statistics);
  };
  
  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesSource = filterSource === 'all' || log.source === filterSource;
      
      return matchesSearch && matchesType && matchesSource;
    });
  }, [history, searchTerm, filterType, filterSource]);
  
  const handleClearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      notificationStorage.clearHistory();
      loadHistory();
      loadStats();
    }
  };
  
  const handleExport = () => {
    const data = notificationStorage.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };
  
  const getSourceBadgeVariant = (source: string): "primary" | "secondary" | "default" => {
    switch (source) {
      case 'automatic': return 'primary';
      case 'manual': return 'secondary';
      case 'system': return 'default';
      default: return 'default';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estatísticas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </CardHeader>
          {showStats && (
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Enviadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.clicked}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Clicadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.clickRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Taxa de Clique
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Object.keys(stats.byType).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tipos Diferentes
                  </div>
                </div>
              </div>
              
              {/* Mini gráfico por tipo */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Por Tipo:</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <Badge key={type} variant="secondary">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          )}
        </Card>
      )}
      
      {/* Filtros e Ações */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar notificações..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">Todos os Tipos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
              <option value="warning">Aviso</option>
              <option value="info">Info</option>
              <option value="task">Task</option>
            </select>
            
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">Todas as Fontes</option>
              <option value="automatic">Automática</option>
              <option value="manual">Manual</option>
              <option value="system">Sistema</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="whitespace-nowrap text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardBody>
      </Card>
      
      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Notificações
            {filteredHistory.length > 0 && (
              <Badge variant="secondary">{filteredHistory.length}</Badge>
            )}
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma notificação no histórico</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {filteredHistory.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone */}
                    <div className="mt-1">
                      {TYPE_ICONS[log.type]}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {log.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {log.body}
                          </p>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex gap-2">
                          {log.clicked && (
                            <Badge variant="success" className="text-xs">
                              <MousePointer className="w-3 h-3 mr-1" />
                              Clicada
                            </Badge>
                          )}
                          <Badge 
                            variant={getSourceBadgeVariant(log.source)}
                            className="text-xs"
                          >
                            {log.source}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Metadados */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(log.sentAt)}
                        </span>
                        {log.taskId && (
                          <span className="flex items-center gap-1">
                            Task: {log.taskId}
                          </span>
                        )}
                        {log.clicked && log.clickedAt && (
                          <span className="flex items-center gap-1">
                            Clicada {formatRelativeTime(log.clickedAt)}
                          </span>
                        )}
                      </div>
                      
                      {/* Detalhes expansíveis */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <ChevronDown 
                              className={`w-3 h-3 transition-transform ${
                                expandedItems.has(log.id) ? 'rotate-180' : ''
                              }`}
                            />
                            Detalhes
                          </button>
                          {expandedItems.has(log.id) && (
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}