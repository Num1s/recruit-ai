import React from 'react';
import { Skeleton, Card } from 'antd';

// Skeleton для карточки интервью
export const InterviewCardSkeleton: React.FC = () => {
  return (
    <Card className="interview-card-skeleton">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <Skeleton.Input style={{ width: 200, height: 20, marginBottom: 8 }} active />
          <Skeleton.Input style={{ width: 150, height: 16 }} active />
        </div>
        <div style={{ textAlign: 'right' }}>
          <Skeleton.Input style={{ width: 80, height: 24, marginBottom: 8 }} active />
          <Skeleton.Input style={{ width: 120, height: 16 }} active />
        </div>
      </div>
      <Skeleton.Input style={{ width: '100%', height: 16, marginBottom: 16 }} active />
      <Skeleton.Input style={{ width: '60%', height: 14 }} active />
    </Card>
  );
};

// Skeleton для дашборда
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-header">
        <Skeleton.Input style={{ width: 150, height: 32 }} active />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton.Button style={{ width: 120, height: 32 }} active />
          <Skeleton.Button style={{ width: 100, height: 32 }} active />
          <Skeleton.Avatar size="default" active />
        </div>
      </div>
      
      <div className="dashboard-content">
        <Skeleton.Input style={{ width: 300, height: 40, marginBottom: '2rem' }} active />
        
        {/* Statistics cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton.Input style={{ width: 120, height: 16, marginBottom: 8 }} active />
              <Skeleton.Input style={{ width: 60, height: 32 }} active />
            </Card>
          ))}
        </div>
        
        {/* Main content */}
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    </div>
  );
};

// Skeleton для таблицы
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="table-skeleton">
      {/* Table header */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton.Input key={i} style={{ width: 120, height: 20 }} active />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', padding: '1rem' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input key={colIndex} style={{ width: 120, height: 16 }} active />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton для формы
export const FormSkeleton: React.FC = () => {
  return (
    <div className="form-skeleton" style={{ padding: '2rem' }}>
      <Skeleton.Input style={{ width: 200, height: 32, marginBottom: '2rem' }} active />
      
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <Skeleton.Input style={{ width: 100, height: 16, marginBottom: '0.5rem' }} active />
          <Skeleton.Input style={{ width: '100%', height: 40 }} active />
        </div>
      ))}
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Skeleton.Button style={{ width: 120, height: 40 }} active />
        <Skeleton.Button style={{ width: 80, height: 40 }} active />
      </div>
    </div>
  );
};

// Skeleton для профиля пользователя
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="profile-skeleton" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <Skeleton.Avatar size={80} active />
        <div style={{ flex: 1 }}>
          <Skeleton.Input style={{ width: 200, height: 24, marginBottom: '0.5rem' }} active />
          <Skeleton.Input style={{ width: 150, height: 16, marginBottom: '0.5rem' }} active />
          <Skeleton.Input style={{ width: 180, height: 16 }} active />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {[1, 2].map((i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        ))}
      </div>
    </div>
  );
};

// Skeleton для списка элементов
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="list-skeleton">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          gap: '1rem', 
          padding: '1rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          alignItems: 'center'
        }}>
          <Skeleton.Avatar size="default" active />
          <div style={{ flex: 1 }}>
            <Skeleton.Input style={{ width: '60%', height: 16, marginBottom: '0.5rem' }} active />
            <Skeleton.Input style={{ width: '40%', height: 14 }} active />
          </div>
          <Skeleton.Button style={{ width: 80, height: 32 }} active />
        </div>
      ))}
    </div>
  );
};

export default {
  InterviewCardSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  ListSkeleton,
};


