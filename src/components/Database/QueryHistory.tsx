import React, { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { 
  History, 
  Play, 
  Copy, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Calendar,
  Database,
  Eye
} from 'lucide-react';

export const QueryHistory: React.FC = () => {
  const {
    queryHistory,
    connections,
    setCurrentQuery,
    setSelectedTab,
    executeQuery,
    activeConnectionId
  } = useDatabaseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [filterConnection, setFilterConnection] = useState<string>('all');
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  const filteredHistory = queryHistory.filter(entry => {
    const matchesSearch = entry.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'success' && entry.success) ||
      (filterStatus === 'error' && !entry.success);
    const matchesConnection = filterConnection === 'all' || entry.connectionId === filterConnection;
    
    return matchesSearch && matchesStatus && matchesConnection;
  });

  const handleRerunQuery = async (query: string, connectionId: string) => {
    if (connectionId !== activeConnectionId) {
      const connectionName = getConnectionName(connectionId);
      if (confirm(`Cette requête a été exécutée sur "${connectionName}". Voulez-vous changer de connexion et exécuter la requête ?`)) {
        await useDatabaseStore.getState().setActiveConnection(connectionId);
      } else {
        return;
      }
    }
    
    setCurrentQuery(query);
    setSelectedTab('query');
    await executeQuery(connectionId, query);
  };

  const handleCopyQuery = async (query: string) => {
    try {
      await navigator.clipboard.writeText(query);
    } catch (error) {
      console.error('Failed to copy query:', error);
    }
  };

  const handleUseQuery = (query: string) => {
    setCurrentQuery(query);
    setSelectedTab('query');
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return dateObj.toLocaleDateString();
  };

  const getConnectionName = (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    return connection ? connection.name : 'Unknown Connection';
  };

  const truncateQuery = (query: string, maxLength: number = 100) => {
    const singleLine = query.replace(/\s+/g, ' ').trim();
    return singleLine.length > maxLength 
      ? singleLine.substring(0, maxLength) + '...' 
      : singleLine;
  };

  return (
    <div className="h-full flex bg-white dark:bg-gray-900">
      {/* History List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Query History</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({filteredHistory.length} queries)
              </span>
            </div>
            
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique des requêtes ?')) {
                  useDatabaseStore.getState().clearQueryHistory();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search queries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>
            
            {/* Connection Filter */}
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              <select
                value={filterConnection}
                onChange={(e) => setFilterConnection(e.target.value)}
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Connections</option>
                {connections.map(conn => (
                  <option key={conn.id} value={conn.id}>{conn.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* History Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Query History</h3>
                <p>
                  {queryHistory.length === 0 
                    ? 'Execute some queries to see them here'
                    : 'No queries match your current filters'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    selectedQuery === entry.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedQuery(selectedQuery === entry.id ? null : entry.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Query Preview */}
                      <div className="flex items-center gap-2 mb-2">
                        {entry.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <code className="text-sm font-mono text-gray-900 dark:text-white truncate">
                          {truncateQuery(entry.query)}
                        </code>
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>{getConnectionName(entry.connectionId)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(entry.executionTime)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(entry.executedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseQuery(entry.query);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Use Query"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyQuery(entry.query);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Copy Query"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRerunQuery(entry.query, entry.connectionId);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Rerun Query"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Query */}
                  {selectedQuery === entry.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <pre className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                          {entry.query}
                        </pre>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Executed: {entry.executedAt.toLocaleString()}</span>
                          {entry.executionTime && (
                            <span>Duration: {formatDuration(entry.executionTime)}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyQuery(entry.query)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                          
                          <button
                            onClick={() => handleUseQuery(entry.query)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Eye className="w-3 h-3" />
                            Use Query
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};