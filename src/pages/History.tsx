import React, { useState } from 'react';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HttpMethod, HistoryEntry, HttpRequest } from '../types/global';
import { useHistoryStore } from '../stores/historyStore';
import { httpService } from '../services/httpService';

const MethodBadge: React.FC<{ method: HttpMethod }> = ({ method }) => {
  const getMethodClass = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return 'method-get';
      case 'POST':
        return 'method-post';
      case 'PUT':
        return 'method-put';
      case 'DELETE':
        return 'method-delete';
      case 'PATCH':
        return 'method-patch';
      default:
        return 'badge-default';
    }
  };
  
  return (
    <span className={`${getMethodClass(method)} text-xs font-mono font-medium`}>
      {method}
    </span>
  );
};

const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
  const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-green-100 text-green-800';
    } else if (status >= 300 && status < 400) {
      return 'bg-blue-100 text-blue-800';
    } else if (status >= 400 && status < 500) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status >= 500) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };
  
  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) {
      return <CheckCircleIcon className="h-3 w-3" />;
    } else if (status >= 400 && status < 500) {
      return <ExclamationTriangleIcon className="h-3 w-3" />;
    } else if (status >= 500) {
      return <XCircleIcon className="h-3 w-3" />;
    }
    return null;
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{status}</span>
    </span>
  );
};

const HistoryItem: React.FC<{
  entry: HistoryEntry;
  onRerun: () => void;
  onDelete: () => void;
  onClick: () => void;
}> = ({ entry, onRerun, onDelete, onClick }) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  
  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <MethodBadge method={entry.request.method} />
            <StatusBadge status={entry.response?.status || 0} />
            <span className="text-sm text-gray-500">
              {formatDuration(entry.response?.duration || 0)}
            </span>
          </div>
          
          <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
            {entry.request.name || 'Requête sans nom'}
          </h3>
          
          <p className="text-sm text-gray-500 truncate mb-2">
            {entry.request.url}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              {formatTimestamp(entry.timestamp)}
            </span>
            {entry.collectionName && (
              <span>
                Collection: {entry.collectionName}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerun();
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Relancer la requête"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Supprimer de l'historique"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryDetails: React.FC<{ entry: HistoryEntry; onClose: () => void }> = ({ entry, onClose }) => {
  const [activeTab, setActiveTab] = useState('response');
  
  const tabs = [
    { id: 'request', label: 'Requête' },
    { id: 'response', label: 'Réponse' },
    { id: 'headers', label: 'En-têtes' },
    { id: 'timing', label: 'Timing' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MethodBadge method={entry.request.method} />
              <h2 className="text-lg font-semibold text-gray-900">
                {entry.request.name || 'Requête sans nom'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {entry.request.url}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'request' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">URL</h4>
                <code className="block p-3 bg-gray-100 rounded text-sm font-mono">
                  {entry.request.url}
                </code>
              </div>
              
              {entry.request.headers && Object.keys(entry.request.headers).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">En-têtes de requête</h4>
                  <div className="bg-gray-100 rounded p-3">
                    {Object.entries(entry.request.headers).map(([key, value]) => (
                      <div key={key} className="flex text-sm font-mono">
                        <span className="text-blue-600 mr-2">{key}:</span>
                        <span className="text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {entry.request.body && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Corps de la requête</h4>
                    <pre className="json-response">
                    {typeof entry.request.body === 'string' 
                      ? entry.request.body 
                      : JSON.stringify(entry.request.body, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'response' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <StatusBadge status={entry.response?.status || 0} />
                <span className="text-sm text-gray-500">
                  {entry.response?.duration || 0}ms
                </span>
                <span className="text-sm text-gray-500">
                  {entry.response?.size ? `${entry.response.size} bytes` : ''}
                </span>
              </div>
              
              {entry.response?.data && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Corps de la réponse</h4>
                    <pre className="json-response max-h-64">
                    {typeof entry.response.data === 'string' 
                      ? entry.response.data 
                      : JSON.stringify(entry.response.data, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'headers' && (
            <div className="space-y-4">
              {entry.response?.headers && Object.keys(entry.response.headers).length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">En-têtes de réponse</h4>
                  <div className="bg-gray-100 rounded p-3">
                    {Object.entries(entry.response.headers).map(([key, value]) => (
                      <div key={key} className="flex text-sm font-mono">
                        <span className="text-blue-600 mr-2">{key}:</span>
                        <span className="text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucun en-tête de réponse</p>
              )}
            </div>
          )}
          
          {activeTab === 'timing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Durée totale</h4>
                  <p className="text-lg font-semibold text-blue-600">
                    {entry.response?.duration || 0}ms
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Timestamp</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(entry.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const History: React.FC = () => {
  const {
    entries: historyEntries,
    clearHistory,
    removeEntry,
    getFilteredEntries
  } = useHistoryStore();
  
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<HttpMethod | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  
  // Filtrer les entrées selon les critères
  const filteredEntries = getFilteredEntries({
    search: searchTerm,
    method: filterMethod === 'all' ? undefined : filterMethod,
    status: filterStatus === 'all' ? undefined : filterStatus
  });
  
  const handleClearHistory = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      clearHistory();
    }
  };
  
  const handleRerunRequest = async (entry: HistoryEntry) => {
    try {
      // Convert HistoryEntry.request to HttpRequest format
      const httpRequest: HttpRequest = {
        id: `rerun-${Date.now()}`,
        name: entry.request.name || 'Requête ré-exécutée',
        method: entry.request.method,
        url: entry.request.url,
        headers: Object.entries(entry.request.headers).map(([key, value], index) => ({
          id: `header-${index}`,
          key,
          value,
          enabled: true
        })),
        queryParams: [],
        body: entry.request.body ? {
          type: 'raw' as const,
          content: entry.request.body,
          contentType: 'application/json'
        } : undefined,
        auth: { type: 'none' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await httpService.executeRequest(httpRequest);
    } catch (error) {
      console.error('Erreur lors de la ré-exécution de la requête:', error);
    }
  };
  
  const handleDeleteEntry = (entryId: string) => {
    removeEntry(entryId);
  };
  
  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
              <p className="text-gray-600 mt-1">
                Consultez l'historique de vos requêtes API
              </p>
            </div>
            <button
              onClick={handleClearHistory}
              className="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Effacer l'historique
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher dans l'historique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            {/* Method filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value as HttpMethod | 'all')}
                className="input"
              >
                <option value="all">Toutes les méthodes</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            {/* Status filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'error')}
                className="input"
              >
                <option value="all">Tous les statuts</option>
                <option value="success">Succès (2xx)</option>
                <option value="error">Erreurs (4xx, 5xx)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* History list */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterMethod !== 'all' || filterStatus !== 'all'
                ? 'Aucun résultat trouvé'
                : 'Aucun historique'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterMethod !== 'all' || filterStatus !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Vos requêtes apparaîtront ici une fois exécutées'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
                onRerun={() => console.log('Rerun request', entry.id)}
                onDelete={() => console.log('Delete entry', entry.id)}
              />
            ))}
          </div>
        )}
        
        {/* Details modal */}
        {selectedEntry && (
          <HistoryDetails
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </div>
    </div>
  );
};