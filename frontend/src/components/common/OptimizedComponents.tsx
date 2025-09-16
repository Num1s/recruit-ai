import React, { memo, useMemo } from 'react';
import { Card, Button, Tag, Avatar, Typography } from 'antd';
import { 
  PlayCircleOutlined, 
  FileTextOutlined, 
  ClockCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Оптимизированная карточка интервью
interface InterviewCardProps {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  expiresAt: string;
  invitedAt: string;
  jobDescription?: string;
  onStartInterview: (id: string) => void;
  onViewReport: (id: string) => void;
}

export const OptimizedInterviewCard = memo<InterviewCardProps>(({
  id,
  companyName,
  jobTitle,
  status,
  expiresAt,
  invitedAt,
  jobDescription,
  onStartInterview,
  onViewReport
}) => {
  const statusColor = useMemo(() => {
    switch (status) {
      case 'sent': return 'blue';
      case 'accepted': return 'orange';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'reviewed': return 'purple';
      default: return 'default';
    }
  }, [status]);

  const statusText = useMemo(() => {
    switch (status) {
      case 'sent': return 'Приглашение';
      case 'accepted': return 'Принято';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Выполнено';
      case 'reviewed': return 'Рассмотрено';
      default: return status;
    }
  }, [status]);

  const timeRemaining = useMemo(() => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истекло';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Осталось ${hours}ч ${minutes}м`;
    }
    return `Осталось ${minutes}м`;
  }, [expiresAt]);

  const handleStartInterview = React.useCallback(() => {
    onStartInterview(id);
  }, [id, onStartInterview]);

  const handleViewReport = React.useCallback(() => {
    onViewReport(id);
  }, [id, onViewReport]);

  const actions = useMemo(() => {
    const actionsList: React.ReactNode[] = [];
    
    if (status === 'sent') {
      actionsList.push(
        <Button
          key="start"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartInterview}
        >
          Начать интервью
        </Button>
      );
    }
    
    if (status === 'reviewed') {
      actionsList.push(
        <Button
          key="report"
          icon={<FileTextOutlined />}
          onClick={handleViewReport}
        >
          Посмотреть отчет
        </Button>
      );
    }
    
    return actionsList;
  }, [status, handleStartInterview, handleViewReport]);

  return (
    <Card className="interview-card" actions={actions}>
      <div className="interview-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {companyName}
          </Title>
          <Text strong style={{ fontSize: '16px' }}>
            {jobTitle}
          </Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Tag color={statusColor} style={{ marginBottom: '0.5rem' }}>
            {statusText}
          </Tag>
          {status === 'sent' && (
            <div className="deadline">
              <ClockCircleOutlined /> {timeRemaining}
            </div>
          )}
        </div>
      </div>

      {jobDescription && (
        <Text type="secondary" style={{ marginTop: '1rem', display: 'block' }}>
          {jobDescription}
        </Text>
      )}

      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#999' }}>
        Приглашение получено: {new Date(invitedAt).toLocaleDateString('ru-RU')}
      </div>
    </Card>
  );
});

OptimizedInterviewCard.displayName = 'OptimizedInterviewCard';

// Оптимизированная строка таблицы кандидатов
interface CandidateRowProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    status: string;
    interviewDate: string;
    score?: number;
  };
  onViewReport: (id: string) => void;
}

export const OptimizedCandidateRow = memo<CandidateRowProps>(({
  candidate,
  onViewReport
}) => {
  const statusColor = useMemo(() => {
    switch (candidate.status) {
      case 'scheduled': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'report_ready': return 'purple';
      default: return 'default';
    }
  }, [candidate.status]);

  const statusText = useMemo(() => {
    switch (candidate.status) {
      case 'scheduled': return 'Назначено';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Выполнено';
      case 'report_ready': return 'Отчет готов';
      default: return candidate.status;
    }
  }, [candidate.status]);

  const handleViewReport = React.useCallback(() => {
    onViewReport(candidate.id);
  }, [candidate.id, onViewReport]);

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{candidate.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{candidate.email}</div>
          </div>
        </div>
      </td>
      <td>{candidate.position}</td>
      <td>
        <Tag color={statusColor}>{statusText}</Tag>
      </td>
      <td>{new Date(candidate.interviewDate).toLocaleDateString('ru-RU')}</td>
      <td>
        {candidate.score ? `${candidate.score}/5` : '-'}
      </td>
      <td>
        {(candidate.status === 'report_ready' || candidate.status === 'completed') && (
          <Button size="small" onClick={handleViewReport}>
            Отчет
          </Button>
        )}
      </td>
    </tr>
  );
});

OptimizedCandidateRow.displayName = 'OptimizedCandidateRow';

// Оптимизированный список с виртуализацией
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
}

export const VirtualizedList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor
}: VirtualizedListProps<T>) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, visibleRange.startIndex + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

(VirtualizedList as any).displayName = 'VirtualizedList';

export default {
  OptimizedInterviewCard,
  OptimizedCandidateRow,
  VirtualizedList,
};
