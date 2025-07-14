import React, { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { X, Database, TestTube, Eye, EyeOff } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editConnection?: any;
}

type DatabaseType = 'mysql' | 'postgresql';

interface ConnectionForm {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionString: string;
}

const defaultPorts: Record<DatabaseType, number> = {
  mysql: 3306,
  postgresql: 5432,
  sqlite: 0,
};

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  editConnection
}) => {
  const { addConnection, updateConnection, testConnection } = useDatabaseStore();
  
  const [form, setForm] = useState<ConnectionForm>({
    name: editConnection?.name || '',
    type: editConnection?.type || 'postgresql',
    host: editConnection?.host || 'localhost',
    port: editConnection?.port || defaultPorts.postgresql,
    database: editConnection?.database || '',
    username: editConnection?.username || '',
    password: editConnection?.password || '',
    ssl: editConnection?.ssl || false,
    connectionString: editConnection?.connectionString || '',
  });
  
  const [useConnectionString, setUseConnectionString] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTypeChange = (type: DatabaseType) => {
    setForm(prev => ({
      ...prev,
      type,
      port: defaultPorts[type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editConnection) {
        updateConnection(editConnection.id, form);
      } else {
        addConnection(form);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Create a temporary connection for testing
      const tempConnection = {
        ...form,
        id: 'temp-test',
        isConnected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result (in real app, this would test actual connection)
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setTestResult({
        success,
        message: success 
          ? 'Connection successful!' 
          : 'Failed to connect. Please check your credentials and network settings.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed: ' + (error as Error).message
      });
    } finally {
      setTesting(false);
    }
  };

  const getDatabaseIcon = (type: DatabaseType) => {
    switch (type) {
      case 'mysql': return <Database className="w-4 h-4 text-orange-500" />;
      case 'postgresql': return <Database className="w-4 h-4 text-blue-500" />;
      default: return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editConnection ? 'Edit Connection' : 'New Database Connection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="My Database"
              required
            />
          </div>

          {/* Database Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Database Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['postgresql', 'mysql'] as DatabaseType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    form.type === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{getDatabaseIcon(type)}</div>
                  <div className="text-xs font-medium capitalize">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Method Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!useConnectionString}
                onChange={() => setUseConnectionString(false)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Individual Fields</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={useConnectionString}
                onChange={() => setUseConnectionString(true)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Connection String</span>
            </label>
          </div>

          {useConnectionString ? (
            /* Connection String */
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection String
              </label>
              <textarea
                value={form.connectionString}
                onChange={(e) => setForm(prev => ({ ...prev, connectionString: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={3}
                placeholder={`postgresql://username:password@localhost:5432/database`}
                required
              />
            </div>
          ) : (
            /* Individual Fields */
            <div className="space-y-4">
              {/* Host and Port */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={form.host}
                    onChange={(e) => setForm(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="localhost"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Database */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Database
                </label>
                <input
                  type="text"
                  value={form.database}
                  onChange={(e) => setForm(prev => ({ ...prev, database: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="my_database"
                  required
                />
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SSL */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.ssl}
                    onChange={(e) => setForm(prev => ({ ...prev, ssl: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS</span>
                </label>
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !form.name || (!useConnectionString ? (!form.host || !form.database) : !form.connectionString)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!form.name || (!useConnectionString ? (!form.host || !form.database) : !form.connectionString)}
              >
                {editConnection ? 'Update' : 'Create'} Connection
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};