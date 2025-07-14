import React, { useState } from 'react';
import { useDatabaseStore } from '../stores/databaseStore';
import { DatabaseSidebar } from '../components/Database/DatabaseSidebar';
import { QueryEditor } from '../components/Database/QueryEditor';
import { SchemaViewer } from '../components/Database/SchemaViewer';
import { QueryHistory } from '../components/Database/QueryHistory';
import QueryBuilder from '../components/Database/QueryBuilder';
import QueryProfiler from '../components/Database/QueryProfiler';

import { ConnectionModal } from '../components/Database/ConnectionModal';
import { 
  Database, 
  Play, 
  History, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Activity,
  Settings
} from 'lucide-react';

export const DatabaseBrowser: React.FC = () => {
  const {
    selectedTab,
    setSelectedTab,
    sidebarCollapsed,
    toggleSidebar,
    connections,
    activeConnectionId
  } = useDatabaseStore();

  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const activeConnection = connections.find(conn => conn.id === activeConnectionId);

  const renderMainContent = () => {
    switch (selectedTab) {
      case 'browser':
        return <SchemaViewer />;
      case 'query':
        return <QueryEditor />;
      case 'builder':
        return <QueryBuilder />;
      case 'profiler':
        return <QueryProfiler />;

      case 'history':
        return <QueryHistory />;
      default:
        return <SchemaViewer />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Database Browser</h2>
                </div>
                <button
                  onClick={() => setShowConnectionModal(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Add Connection"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Connection Status */}
              {activeConnection && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className={`w-2 h-2 rounded-full ${
                    activeConnection.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {activeConnection.name}
                  </span>
                </div>
              )}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              <DatabaseSidebar />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4">
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-4"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedTab('browser')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedTab === 'browser'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Schema
            </button>
            <button
              onClick={() => setSelectedTab('query')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedTab === 'query'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Play className="w-4 h-4 inline mr-1" />
              Query
            </button>
            <button
              onClick={() => setSelectedTab('builder')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedTab === 'builder'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-1" />
              Builder
            </button>
            <button
              onClick={() => setSelectedTab('profiler')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedTab === 'profiler'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-1" />
              Profiler
            </button>

            <button
              onClick={() => setSelectedTab('history')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                selectedTab === 'history'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              History
            </button>
          </div>

          {/* Connection Info */}
          <div className="ml-auto flex items-center gap-2">
            {activeConnection ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full ${
                  activeConnection.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{activeConnection.type.toUpperCase()}</span>
                <span>•</span>
                <span>{activeConnection.database}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                No connection selected
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {connections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Database Connections
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create your first database connection to get started
                </p>
                <button
                  onClick={() => setShowConnectionModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Connection
                </button>
              </div>
            </div>
          ) : !activeConnectionId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Connection
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a database connection from the sidebar to begin
                </p>
              </div>
            </div>
          ) : (
            renderMainContent()
          )}
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
        />
      )}
    </div>
  );
};