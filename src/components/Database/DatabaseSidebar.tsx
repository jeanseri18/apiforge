import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { ClientLimitationAlert } from './ClientLimitationAlert';
import { ConnectionModal } from './ConnectionModal';
import { NetworkDiagnostic } from './NetworkDiagnostic';
import { 
  Database, 
  Table, 
  Eye, 
  Play, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Loader,
  AlertCircle,
  Key,
  Link,
  Network
} from 'lucide-react';

export const DatabaseSidebar: React.FC = () => {
  const {
    connections,
    activeConnectionId,
    setActiveConnection,
    testConnection,
    deleteConnection,
    tables,
    selectedTable,
    selectTable,
    setCurrentQuery,
    setSelectedTab
  } = useDatabaseStore();

  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [showClientAlert, setShowClientAlert] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNetworkDiagnostic, setShowNetworkDiagnostic] = useState(false);
  const [diagnosticConnection, setDiagnosticConnection] = useState<any>(null);

  // Afficher l'alerte côté client au premier chargement
  useEffect(() => {
    if (typeof window !== 'undefined' && connections.length > 0) {
      const alertDismissed = localStorage.getItem('client-limitation-alert-dismissed');
      if (!alertDismissed) {
        setShowClientAlert(true);
      }
    }
  }, [connections.length]);

  const handleDismissAlert = () => {
    setShowClientAlert(false);
    localStorage.setItem('client-limitation-alert-dismissed', 'true');
  };

  const handleEditConnection = (connection: any) => {
    setEditingConnection(connection);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingConnection(null);
  };

  const toggleConnection = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
    }
    setExpandedConnections(newExpanded);
  };

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnections(prev => new Set([...prev, connectionId]));
    try {
      await testConnection(connectionId);
    } catch (error) {
      // En cas d'erreur, proposer le diagnostic réseau
      const connection = connections.find(c => c.id === connectionId);
      if (connection && error instanceof Error && 
          (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
        // Proposer automatiquement le diagnostic pour les erreurs réseau
        console.log('Erreur réseau détectée, diagnostic disponible');
      }
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleOpenNetworkDiagnostic = (connection: any) => {
    setDiagnosticConnection(connection);
    setShowNetworkDiagnostic(true);
  };

  const handleCloseNetworkDiagnostic = () => {
    setShowNetworkDiagnostic(false);
    setDiagnosticConnection(null);
  };

  const handleSelectConnection = async (connectionId: string) => {
    await setActiveConnection(connectionId);
    if (!expandedConnections.has(connectionId)) {
      toggleConnection(connectionId);
    }
  };

  const handleTableClick = (tableName: string) => {
    selectTable(tableName);
    setSelectedTab('browser');
  };

  const handleTableQuery = (tableName: string) => {
    const query = `SELECT * FROM ${tableName} LIMIT 100;`;
    setCurrentQuery(query);
    setSelectedTab('query');
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'mysql':
        return <Database className="w-4 h-4 text-orange-500" />;
      case 'postgresql':
        return <Database className="w-4 h-4 text-blue-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColumnIcon = (column: any) => {
    if (column.primaryKey) return <Key className="w-3 h-3 text-yellow-500" />;
    if (column.foreignKey) return <Link className="w-3 h-3 text-blue-500" />;
    return null;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        <ClientLimitationAlert 
          show={showClientAlert} 
          onDismiss={handleDismissAlert} 
        />
      </div>
      {connections.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No connections yet</p>
        </div>
      ) : (
        <div className="p-2">
          {connections.map((connection) => {
            const isExpanded = expandedConnections.has(connection.id);
            const isActive = activeConnectionId === connection.id;
            const isTesting = testingConnections.has(connection.id);
            const connectionTables = tables[connection.id] || [];

            return (
              <div key={connection.id} className="mb-2">
                {/* Connection Header */}
                <div
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleSelectConnection(connection.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleConnection(connection.id);
                    }}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  
                  <span className="text-sm">{getConnectionIcon(connection.type)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{connection.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        connection.isConnected ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {connection.type} • {connection.database}
                    </div>
                  </div>

                  {/* Connection Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestConnection(connection.id);
                      }}
                      disabled={isTesting}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Test Connection"
                    >
                      {isTesting ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : connection.isConnected ? (
                        <Database className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNetworkDiagnostic(connection);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                      title="Network Diagnostic"
                    >
                      <Network className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditConnection(connection);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Edit Connection"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete connection "${connection.name}"?`)) {
                          deleteConnection(connection.id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      title="Delete Connection"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tables List */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {connectionTables.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
                        {connection.isConnected ? 'No tables found' : 'Connect to view tables'}
                      </div>
                    ) : (
                      connectionTables.map((table) => (
                        <div key={table.name} className="group">
                          <div
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                              selectedTable === table.name
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                            onClick={() => handleTableClick(table.name)}
                          >
                            <Table className="w-3 h-3" />
                            <span className="text-xs font-medium flex-1 truncate">{table.name}</span>
                            {table.rowCount !== undefined && (
                              <span className="text-xs text-gray-400">{table.rowCount}</span>
                            )}
                            
                            {/* Table Actions */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTableClick(table.name);
                                }}
                                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="View Schema"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTableQuery(table.name);
                                }}
                                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="Query Table"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Columns (when table is selected) */}
                          {selectedTable === table.name && table.columns && (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {table.columns.map((column) => (
                                <div
                                  key={column.name}
                                  className="flex items-center gap-2 p-1 text-xs text-gray-500 dark:text-gray-400"
                                >
                                  {getColumnIcon(column)}
                                  <span className="font-mono">{column.name}</span>
                                  <span className="text-gray-400">{column.type}</span>
                                  {!column.nullable && (
                                    <span className="text-red-400 text-xs">NOT NULL</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Edit Connection Modal */}
      <ConnectionModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        editConnection={editingConnection}
      />
      
      {/* Network Diagnostic Modal */}
      {showNetworkDiagnostic && diagnosticConnection && (
        <NetworkDiagnostic
          host={diagnosticConnection.host}
          port={diagnosticConnection.port || (diagnosticConnection.type === 'mysql' ? 3306 : 5432)}
          onClose={handleCloseNetworkDiagnostic}
        />
      )}
    </div>
  );
};