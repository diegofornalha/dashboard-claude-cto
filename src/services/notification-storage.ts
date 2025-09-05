import { NotificationLog, NotificationStats } from '@/types/notification';

const STORAGE_KEY = 'cto_notification_history';
const MAX_HISTORY_SIZE = 500;

export class NotificationStorage {
  private history: NotificationLog[] = [];
  
  constructor() {
    this.loadHistory();
  }
  
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((item: any) => ({
          ...item,
          sentAt: new Date(item.sentAt),
          clickedAt: item.clickedAt ? new Date(item.clickedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      this.history = [];
    }
  }
  
  private saveHistory(): void {
    try {
      if (this.history.length > MAX_HISTORY_SIZE) {
        this.history = this.history.slice(-MAX_HISTORY_SIZE);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }
  
  addNotification(log: Omit<NotificationLog, 'id' | 'sentAt'>): NotificationLog {
    const newLog: NotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date(),
      status: log.status || 'sent'
    };
    
    this.history.unshift(newLog);
    this.saveHistory();
    
    return newLog;
  }
  
  markAsClicked(id: string): void {
    const notification = this.history.find(n => n.id === id);
    if (notification) {
      notification.clicked = true;
      notification.clickedAt = new Date();
      notification.status = 'clicked';
      this.saveHistory();
    }
  }
  
  markAsDismissed(id: string): void {
    const notification = this.history.find(n => n.id === id);
    if (notification) {
      notification.status = 'dismissed';
      this.saveHistory();
    }
  }
  
  getHistory(
    limit?: number,
    filters?: {
      type?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      taskId?: string;
    }
  ): NotificationLog[] {
    let filtered = [...this.history];
    
    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(n => n.type === filters.type);
      }
      if (filters.source) {
        filtered = filtered.filter(n => n.source === filters.source);
      }
      if (filters.taskId) {
        filtered = filtered.filter(n => n.taskId === filters.taskId);
      }
      if (filters.startDate) {
        filtered = filtered.filter(n => n.sentAt >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(n => n.sentAt <= filters.endDate!);
      }
    }
    
    return limit ? filtered.slice(0, limit) : filtered;
  }
  
  getStatistics(): NotificationStats {
    const stats: NotificationStats = {
      total: this.history.length,
      clicked: this.history.filter(n => n.clicked).length,
      dismissed: this.history.filter(n => n.status === 'dismissed').length,
      failed: this.history.filter(n => n.status === 'failed').length,
      clickRate: 0,
      byType: {},
      byHour: {},
      lastNotification: this.history[0]?.sentAt
    };
    
    if (stats.total > 0) {
      stats.clickRate = (stats.clicked / stats.total) * 100;
    }
    
    this.history.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      
      const hour = n.sentAt.getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });
    
    return stats;
  }
  
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }
  
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }
  
  importHistory(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        this.history = imported.map(item => ({
          ...item,
          sentAt: new Date(item.sentAt),
          clickedAt: item.clickedAt ? new Date(item.clickedAt) : undefined
        }));
        this.saveHistory();
        return true;
      }
    } catch (error) {
      console.error('Erro ao importar histórico:', error);
    }
    return false;
  }
}

export const notificationStorage = new NotificationStorage();