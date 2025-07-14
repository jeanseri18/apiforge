import React, { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { 
  Table, 
  Key, 
  Link, 
  Eye, 
  Play, 
  Copy, 
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Database,
  Hash,
  Type,
  Check,
  X
} from 'lucide-react';

export const SchemaViewer: React.FC = () => {
  const {
    activeConnectionId,
    connections,
    tables,
    selectedTable,
    selectTable,
    setCurrentQuery,
    setSelectedTab
  } = useDatabaseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'tables' | 'views'>('all');

  const activeConnection = connections.find(conn => conn.id === activeConnectionId);
  const connectionTables = tables[activeConnectionId || ''] || [];
  const selectedTableData = connectionTables.find(table => table.name === selectedTable);

  const filteredTables = connectionTables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || table.type === filterType.slice(0, -1); // 'tables' -> 'table'
    return matchesSearch && matchesFilter;
  });

  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const handleTableSelect = (tableName: string) => {
    selectTable(tableName);
    if (!expandedTables.has(tableName)) {
      toggleTableExpansion(tableName);
    }
  };

  const handleQueryTable = (tableName: string, queryType: 'select' | 'describe' | 'count' = 'select') => {
    let query = '';
    switch (queryType) {
      case 'select':
        query = `SELECT * FROM ${tableName} LIMIT 100;`;
        break;
      case 'describe':
        query = `DESCRIBE ${tableName};`;
        break;
      case 'count':
        query = `SELECT COUNT(*) FROM ${tableName};`;
        break;
    }
    setCurrentQuery(query);
    setSelectedTab('query');
  };

  const getColumnIcon = (column: any) => {
    if (column.primaryKey) return <Key className="w-4 h-4 text-yellow-500" />;
    if (column.foreignKey) return <Link className="w-4 h-4 text-blue-500" />;
    return <Hash className="w-4 h-4 text-gray-400" />;
  };

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('int') || lowerType.includes('number')) return 'text-blue-600 dark:text-blue-400';
    if (lowerType.includes('varchar') || lowerType.includes('text') || lowerType.includes('string')) return 'text-green-600 dark:text-green-400';
    if (lowerType.includes('date') || lowerType.includes('time')) return 'text-purple-600 dark:text-purple-400';
    if (lowerType.includes('bool')) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const copyTableSchema = async (table: any) => {
    if (!table.columns) return;
    
    const schema = [
      `-- Table: ${table.name}`,
      `-- Type: ${table.type}`,
      table.rowCount !== undefined ? `-- Rows: ${table.rowCount}` : '',
      '',
      'Columns:',
      ...table.columns.map((col: any) => 
        `  ${col.name} ${col.type}${!col.nullable ? ' NOT NULL' : ''}${col.primaryKey ? ' PRIMARY KEY' : ''}${col.foreignKey ? ` REFERENCES ${col.foreignKey.table}(${col.foreignKey.column})` : ''}`
      )
    ].filter(Boolean).join('\n');
    
    try {
      await navigator.clipboard.writeText(schema);
    } catch (error) {
      console.error('Failed to copy schema:', error);
    }
  };

  if (!activeConnection) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Connection Selected</h3>
          <p>Select a database connection to view its schema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-900">
      {/* Tables List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tables..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Objects</option>
              <option value="tables">Tables Only</option>
              <option value="views">Views Only</option>
            </select>
          </div>
        </div>

        {/* Tables List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTables.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm ? 'No tables match your search' : 'No tables found'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredTables.map((table) => {
                const isExpanded = expandedTables.has(table.name);
                const isSelected = selectedTable === table.name;
                
                return (
                  <div key={table.name} className="">
                    <div
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => handleTableSelect(table.name)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTableExpansion(table.name);
                        }}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      
                      <Table className="w-4 h-4" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{table.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {table.type} {table.rowCount !== undefined && `• ${table.rowCount} rows`}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQueryTable(table.name, 'select');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Query Table"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Quick Column Preview */}
                    {isExpanded && table.columns && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {table.columns.slice(0, 5).map((column) => (
                          <div
                            key={column.name}
                            className="flex items-center gap-2 p-1 text-xs text-gray-500 dark:text-gray-400"
                          >
                            {getColumnIcon(column)}
                            <span className="font-mono">{column.name}</span>
                            <span className={getTypeColor(column.type)}>{column.type}</span>
                          </div>
                        ))}
                        {table.columns.length > 5 && (
                          <div className="text-xs text-gray-400 p-1">
                            +{table.columns.length - 5} more columns
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table Details */}
      <div className="flex-1 flex flex-col">
        {!selectedTableData ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Table</h3>
              <p>Choose a table from the list to view its detailed schema</p>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Table className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedTableData.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedTableData.type} • {selectedTableData.columns?.length || 0} columns
                      {selectedTableData.rowCount !== undefined && ` • ${selectedTableData.rowCount} rows`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyTableSchema(selectedTableData)}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Schema
                  </button>
                  
                  <button
                    onClick={() => handleQueryTable(selectedTableData.name, 'select')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Query Table
                  </button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQueryTable(selectedTableData.name, 'describe')}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  DESCRIBE
                </button>
                <button
                  onClick={() => handleQueryTable(selectedTableData.name, 'count')}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  COUNT(*)
                </button>
              </div>
            </div>

            {/* Columns Table */}
            <div className="flex-1 overflow-auto">
              {selectedTableData.columns && selectedTableData.columns.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Column
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Nullable
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Key
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTableData.columns.map((column, index) => (
                      <tr
                        key={column.name}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getColumnIcon(column)}
                            <span className="font-mono font-medium text-gray-900 dark:text-white">
                              {column.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono ${getTypeColor(column.type)}`}>
                            {column.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {column.nullable ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {column.primaryKey && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                                PK
                              </span>
                            )}
                            {column.foreignKey && (
                              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                FK → {column.foreignKey.table}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-gray-600 dark:text-gray-400 text-xs">
                            {column.defaultValue !== undefined ? String(column.defaultValue) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No column information available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};