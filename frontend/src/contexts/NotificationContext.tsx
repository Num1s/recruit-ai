import React, { createContext, useContext, ReactNode } from 'react';
import { notification } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationConfig {
  title: string;
  message?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

interface NotificationContextType {
  showSuccess: (config: NotificationConfig) => void;
  showError: (config: NotificationConfig) => void;
  showInfo: (config: NotificationConfig) => void;
  showWarning: (config: NotificationConfig) => void;
  destroy: (key?: string) => void;
  destroyAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Настройка глобальных стилей для уведомлений
  React.useEffect(() => {
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      maxCount: 3,
      rtl: false,
    });
  }, []);

  const showNotification = (type: NotificationType, config: NotificationConfig) => {
    const icons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
    };

    notification[type]({
      message: config.title,
      description: config.message,
      duration: config.duration,
      placement: config.placement,
      icon: icons[type],
      style: {
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      },
      className: 'custom-notification',
    });
  };

  const contextValue: NotificationContextType = {
    showSuccess: (config) => showNotification('success', config),
    showError: (config) => showNotification('error', config),
    showInfo: (config) => showNotification('info', config),
    showWarning: (config) => showNotification('warning', config),
    destroy: (key) => notification.destroy(key),
    destroyAll: () => notification.destroy(),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;


