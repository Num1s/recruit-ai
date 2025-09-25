import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  Dropdown, 
  List, 
  Typography, 
  Space, 
  Tag,
  Empty,
  Card,
  notification
} from 'antd';
import { 
  BellOutlined, 
  MailOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface Notification {
  id: string;
  type: 'invitation' | 'reminder' | 'result' | 'update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  relatedId?: string;
}

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Симуляция получения новых уведомлений
    const interval = setInterval(checkForNewNotifications, 30000); // каждые 30 секунд
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Моковые данные уведомлений
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'invitation',
          title: 'Новое приглашение на интервью',
          message: 'Компания TechCorp приглашает вас на интервью на позицию Senior Frontend Developer',
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: true,
          relatedId: 'inv-1'
        },
        {
          id: '2',
          type: 'reminder',
          title: 'Напоминание об интервью',
          message: 'До окончания срока действия приглашения от FinTech Solutions осталось 4 часа',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionRequired: true,
          relatedId: 'inv-2'
        },
        {
          id: '3',
          type: 'result',
          title: 'Результаты интервью готовы',
          message: 'Компания Digital Bank KG завершила анализ вашего интервью. Отчет доступен в личном кабинете',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionRequired: false,
          relatedId: 'report-1'
        },
        {
          id: '4',
          type: 'update',
          title: 'Обновление платформы',
          message: 'Добавлены новые функции анализа резюме и улучшена система оценки кандидатов',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionRequired: false
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewNotifications = async () => {
    // Симуляция проверки новых уведомлений
    const hasNew = Math.random() > 0.8; // 20% шанс получить новое уведомление
    
    if (hasNew) {
      const newNotification: Notification = {
        id: `new-${Date.now()}`,
        type: 'invitation',
        title: 'Новое приглашение',
        message: 'У вас есть новое приглашение на интервью',
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: true
      };

      setNotifications(prev => [newNotification, ...prev]);
      
      // Показываем системное уведомление
      notification.open({
        message: 'Новое уведомление',
        description: newNotification.message,
        icon: <BellOutlined style={{ color: '#1890ff' }} />,
        placement: 'topRight'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation': return <MailOutlined style={{ color: '#1890ff' }} />;
      case 'reminder': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'result': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'update': return <ExclamationCircleOutlined style={{ color: '#722ed1' }} />;
      default: return <BellOutlined />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'invitation': return 'Приглашение';
      case 'reminder': return 'Напоминание';
      case 'result': return 'Результат';
      case 'update': return 'Обновление';
      default: return 'Уведомление';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} мин назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч назад`;
    } else {
      return `${diffDays} дн назад`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const dropdownContent = (
    <Card 
      style={{ width: 400, maxHeight: 500, overflow: 'auto' }}
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>Уведомления</span>
          <Space>
            {unreadCount > 0 && (
              <Button size="small" type="link" onClick={markAllAsRead}>
                Прочитать все
              </Button>
            )}
            <Button size="small" type="text" icon={<SettingOutlined />} />
          </Space>
        </Space>
      }
    >
      {notifications.length === 0 ? (
        <Empty 
          description="Нет уведомлений" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{ 
                padding: '12px 0',
                backgroundColor: !item.read ? '#f0f5ff' : 'transparent',
                borderRadius: 4,
                marginBottom: 8
              }}
              actions={[
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />}
                  onClick={() => deleteNotification(item.id)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={
                  <Space>
                    <span 
                      style={{ 
                        fontWeight: !item.read ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                      onClick={() => markAsRead(item.id)}
                    >
                      {item.title}
                    </span>
                    <Tag size="small" color="blue">
                      {getNotificationTypeText(item.type)}
                    </Tag>
                    {item.actionRequired && (
                      <Tag size="small" color="orange">Требует действий</Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>{item.message}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
    >
      <Button 
        type="text" 
        icon={
          <Badge count={unreadCount} size="small" offset={[0, 0]}>
            <BellOutlined style={{ fontSize: '18px' }} />
          </Badge>
        }
        style={{ border: 'none', boxShadow: 'none' }}
      />
    </Dropdown>
  );
};

export default NotificationCenter;
