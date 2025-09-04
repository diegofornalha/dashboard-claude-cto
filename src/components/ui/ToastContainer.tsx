import React from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../contexts/NotificationContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { notifications } = useNotification();

  // Só renderiza se houver notificações
  if (notifications.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <div className="flex flex-col items-end space-y-2 pointer-events-auto">
        {notifications.map((notification) => (
          <Toast key={notification.id} notification={notification} />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ToastContainer;