import React, { useState } from 'react';

const IntegrationsPageSimple: React.FC = () => {
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

        {/* Simple Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'management'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('management')}
            >
              ⚙ Управление
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('search')}
            >
              🔍 Поиск кандидатов
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Аналитика
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Управление интеграциями</h2>
              <p className="text-gray-600 mb-4">
                Здесь будет интерфейс для управления интеграциями с внешними платформами.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                + Добавить интеграцию
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Поиск кандидатов</h2>
              <p className="text-gray-600 mb-4">
                Здесь будет интерфейс для поиска кандидатов на внешних платформах.
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                🔍 Начать поиск
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Аналитика интеграций</h2>
              <p className="text-gray-600 mb-4">
                Здесь будет отображаться статистика по интеграциям.
              </p>
              <div className="text-center py-12">
                <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-6xl">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Аналитика интеграций
                </h3>
                <p className="text-gray-600">
                  Раздел в разработке. Здесь будет отображаться статистика по интеграциям.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPageSimple;
