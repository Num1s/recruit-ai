import React from 'react';
import { Card, Row, Col, Typography, Tabs } from 'antd';

const { Title } = Typography;
const { TabPane } = Tabs;

// Простой компонент управления командой
const TeamManagement: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={4}>Управление командой</Title>
        <p>Функционал управления командой будет доступен в следующих версиях.</p>
      </Card>
    </div>
  );
};

const RecruiterDashboardSimple: React.FC = () => {
  return (
    <div className="recruiter-dashboard">
      <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
          Панель рекрутера
        </Title>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Title level={4}>Потоки рекрутинга</Title>
              <p>Управление потоками рекрутинга</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Title level={4}>Управление пользователями</Title>
              <p>Создание и управление рекрутерами</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Title level={4}>Аналитика</Title>
              <p>Отчеты и статистика</p>
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs defaultActiveKey="overview" className="recruiter-tabs">
            <TabPane tab="Обзор" key="overview">
              <p>Общая информация о работе рекрутеров</p>
            </TabPane>
            <TabPane tab="Потоки" key="streams">
              <p>Управление потоками рекрутинга</p>
            </TabPane>
            <TabPane tab="Управление командой" key="team">
              <TeamManagement />
            </TabPane>
            <TabPane tab="Аналитика" key="analytics">
              <p>Аналитика и отчеты</p>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterDashboardSimple;
