import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/common/Tabs';
import IntegrationManagementSimple from '../../components/integrations/IntegrationManagementSimple';
import CandidateSearch from '../../components/integrations/CandidateSearch';

const IntegrationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('management');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Интеграции</h1>
          <p className="text-gray-600 mt-2">
            Управление подключениями к внешним платформам поиска кандидатов
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management" className="flex items-center">
              ⚙ Управление
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center">
              🔍 Поиск кандидатов
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              📊 Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="mt-6">
            <IntegrationManagementSimple />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <CandidateSearch />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-6xl">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Аналитика интеграций
              </h3>
              <p className="text-gray-600">
                Раздел в разработке. Здесь будет отображаться статистика по интеграциям.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntegrationsPage;
