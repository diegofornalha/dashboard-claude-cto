import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { NotificationItem, NotificationType, useNotification } from '../../contexts/NotificationContext';

interface ToastProps {
  notification: NotificationItem;
}

const getIconAndColors = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-800 dark:text-green-200',
        messageColor: 'text-green-700 dark:text-green-300',
      };
    case 'error':
      return {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-800 dark:text-red-200',
        messageColor: 'text-red-700 dark:text-red-300',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        titleColor: 'text-yellow-800 dark:text-yellow-200',
        messageColor: 'text-yellow-700 dark:text-yellow-300',
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-800 dark:text-blue-200',
        messageColor: 'text-blue-700 dark:text-blue-300',
      };
  }
};

const Toast: React.FC<ToastProps> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor, messageColor } = 
    getIconAndColors(notification.type);

  useEffect(() => {
    // Trigger entrada animada
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // Tempo da animação de saída
  };

  useEffect(() => {
    // Auto-remove se tiver duração definida
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id]);

  return (
    <div
      className={`
        relative flex items-start p-4 mb-3 rounded-lg border shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out transform
        ${bgColor} ${borderColor}
        ${isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : isLeaving
          ? 'translate-x-full opacity-0 scale-95'
          : 'translate-x-full opacity-0 scale-95'
        }
        max-w-sm w-full
      `}
    >
      {/* Progress bar para mostrar tempo restante */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-current opacity-20 rounded-t-lg animate-progress" 
             style={{ 
               animation: `progress ${notification.duration}ms linear forwards`,
               animationDelay: '100ms'
             }} />
      )}

      {/* Ícone */}
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Conteúdo */}
      <div className="ml-3 flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${titleColor} leading-5`}>
          {notification.title}
        </h4>
        {notification.message && (
          <p className={`mt-1 text-sm ${messageColor} leading-4`}>
            {notification.message}
          </p>
        )}
      </div>

      {/* Botão de fechar */}
      <button
        onClick={handleClose}
        className={`
          ml-4 flex-shrink-0 rounded-md inline-flex text-gray-400 
          hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          transition-colors duration-200
        `}
      >
        <span className="sr-only">Fechar</span>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;