export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  icon: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'task';
  sentAt: Date;
  clicked: boolean;
  clickedAt?: Date;
  taskId?: string;
  url?: string;
  source: 'manual' | 'automatic' | 'system';
  status: 'sent' | 'clicked' | 'dismissed' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  clicked: number;
  dismissed: number;
  failed: number;
  clickRate: number;
  byType: Record<string, number>;
  byHour: Record<number, number>;
  lastNotification?: Date;
}