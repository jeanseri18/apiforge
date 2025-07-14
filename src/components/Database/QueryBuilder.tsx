import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import {
  Plus,
  Trash2,
  Play,
  Copy,
  RotateCcw,
  Filter,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronDown,
  Database,
  Table,
  Columns
} from 'lucide-react';

interface QueryCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface QueryJoin {
  id: string;
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  condition: string;
}

interface QueryOrder {
  id: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

interface QueryBuilderState {
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  selectedTable: string;
  selectedColumns: string[];
  conditions: QueryCondition[];
  joins: QueryJoin[];
  orderBy: QueryOrder[];
  groupBy: string[];
  having: QueryCondition[];
  limit: number | null;
  offset: number | null;
}

const QueryBuilder: React.FC = () => {
  const { tables, executeQuery, setCurrentQuery, activeConnectionId } = useDatabaseStore();
  
  // Get tables for the active connection
  const currentTables = activeConnectionId ? tables[activeConnectionId] || [] : [];
  const [builderState, setBuilderState] = useState<QueryBuilderState>({
    queryType: 'SELECT',
    selectedTable: '',
    selectedColumns: [],
    conditions: [],
    joins: [],
    orderBy: [],
    groupBy: [],
    having: [],
    limit: null,
    offset: null
  });
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  const operators = [
    '=', '!=', '<>', '<', '>', '<=', '>=',
    'LIKE', 'NOT LIKE', 'IN', 'NOT IN',
    'IS NULL', 'IS NOT NULL', 'BETWEEN'
  ];

  const joinTypes = ['INNER', 'LEFT', 'RIGHT', 'FULL'];

  useEffect(() => {
    generateQuery();
  }, [builderState]);

  const generateQuery = () => {
    if (!builderState.selectedTable) {
      setGeneratedQuery('');
      return;
    }

    let query = '';

    switch (builderState.queryType) {
      case 'SELECT':
        query = generateSelectQuery();
        break;
      case 'INSERT':
        query = generateInsertQuery();
        break;
      case 'UPDATE':
        query = generateUpdateQuery();
        break;
      case 'DELETE':
        query = generateDeleteQuery();
        break;
    }

    setGeneratedQuery(query);
  };

  const generateSelectQuery = (): string => {
    let query = 'SELECT ';
    
    // Colonnes
    if (builderState.selectedColumns.length === 0) {
      query += '*';
    } else {
      query += builderState.selectedColumns.join(', ');
    }
    
    // FROM
    query += `\nFROM ${builderState.selectedTable}`;
    
    // JOINS
    builderState.joins.forEach(join => {
      query += `\n${join.type} JOIN ${join.table} ON ${join.condition}`;
    });
    
    // WHERE
    if (builderState.conditions.length > 0) {
      query += '\nWHERE ';
      query += builderState.conditions.map((condition, index) => {
        let conditionStr = '';
        if (index > 0 && condition.logicalOperator) {
          conditionStr += `${condition.logicalOperator} `;
        }
        
        if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
          conditionStr += `${condition.column} ${condition.operator}`;
        } else if (condition.operator === 'BETWEEN') {
          const values = condition.value.split(',');
          conditionStr += `${condition.column} BETWEEN '${values[0]?.trim()}' AND '${values[1]?.trim()}'`;
        } else if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
          const values = condition.value.split(',').map(v => `'${v.trim()}'`).join(', ');
          conditionStr += `${condition.column} ${condition.operator} (${values})`;
        } else {
          conditionStr += `${condition.column} ${condition.operator} '${condition.value}'`;
        }
        
        return conditionStr;
      }).join(' ');
    }
    
    // GROUP BY
    if (builderState.groupBy.length > 0) {
      query += `\nGROUP BY ${builderState.groupBy.join(', ')}`;
    }
    
    // HAVING
    if (builderState.having.length > 0) {
      query += '\nHAVING ';
      query += builderState.having.map((condition, index) => {
        let conditionStr = '';
        if (index > 0 && condition.logicalOperator) {
          conditionStr += `${condition.logicalOperator} `;
        }
        conditionStr += `${condition.column} ${condition.operator} '${condition.value}'`;
        return conditionStr;
      }).join(' ');
    }
    
    // ORDER BY
    if (builderState.orderBy.length > 0) {
      query += '\nORDER BY ';
      query += builderState.orderBy.map(order => `${order.column} ${order.direction}`).join(', ');
    }
    
    // LIMIT
    if (builderState.limit !== null) {
      query += `\nLIMIT ${builderState.limit}`;
    }
    
    // OFFSET
    if (builderState.offset !== null) {
      query += `\nOFFSET ${builderState.offset}`;
    }
    
    return query;
  };

  const generateInsertQuery = (): string => {
    if (builderState.selectedColumns.length === 0) {
      return `INSERT INTO ${builderState.selectedTable} VALUES ()`;
    }
    
    const columns = builderState.selectedColumns.join(', ');
    const placeholders = builderState.selectedColumns.map(() => '?').join(', ');
    
    return `INSERT INTO ${builderState.selectedTable} (${columns})\nVALUES (${placeholders})`;
  };

  const generateUpdateQuery = (): string => {
    let query = `UPDATE ${builderState.selectedTable}\nSET `;
    
    if (builderState.selectedColumns.length === 0) {
      query += 'column = value';
    } else {
      query += builderState.selectedColumns.map(col => `${col} = ?`).join(', ');
    }
    
    if (builderState.conditions.length > 0) {
      query += '\nWHERE ';
      query += builderState.conditions.map((condition, index) => {
        let conditionStr = '';
        if (index > 0 && condition.logicalOperator) {
          conditionStr += `${condition.logicalOperator} `;
        }
        conditionStr += `${condition.column} ${condition.operator} '${condition.value}'`;
        return conditionStr;
      }).join(' ');
    }
    
    return query;
  };

  const generateDeleteQuery = (): string => {
    let query = `DELETE FROM ${builderState.selectedTable}`;
    
    if (builderState.conditions.length > 0) {
      query += '\nWHERE ';
      query += builderState.conditions.map((condition, index) => {
        let conditionStr = '';
        if (index > 0 && condition.logicalOperator) {
          conditionStr += `${condition.logicalOperator} `;
        }
        conditionStr += `${condition.column} ${condition.operator} '${condition.value}'`;
        return conditionStr;
      }).join(' ');
    }
    
    return query;
  };

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: Date.now().toString(),
      column: '',
      operator: '=',
      value: '',
      logicalOperator: builderState.conditions.length > 0 ? 'AND' : undefined
    };
    
    setBuilderState(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const removeCondition = (id: string) => {
    setBuilderState(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }));
  };

  const updateCondition = (id: string, field: keyof QueryCondition, value: string) => {
    setBuilderState(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const addJoin = () => {
    const newJoin: QueryJoin = {
      id: Date.now().toString(),
      table: '',
      type: 'INNER',
      condition: ''
    };
    
    setBuilderState(prev => ({
      ...prev,
      joins: [...prev.joins, newJoin]
    }));
  };

  const removeJoin = (id: string) => {
    setBuilderState(prev => ({
      ...prev,
      joins: prev.joins.filter(j => j.id !== id)
    }));
  };

  const updateJoin = (id: string, field: keyof QueryJoin, value: string) => {
    setBuilderState(prev => ({
      ...prev,
      joins: prev.joins.map(j => 
        j.id === id ? { ...j, [field]: value } : j
      )
    }));
  };

  const addOrderBy = () => {
    const newOrder: QueryOrder = {
      id: Date.now().toString(),
      column: '',
      direction: 'ASC'
    };
    
    setBuilderState(prev => ({
      ...prev,
      orderBy: [...prev.orderBy, newOrder]
    }));
  };

  const removeOrderBy = (id: string) => {
    setBuilderState(prev => ({
      ...prev,
      orderBy: prev.orderBy.filter(o => o.id !== id)
    }));
  };

  const updateOrderBy = (id: string, field: keyof QueryOrder, value: string) => {
    setBuilderState(prev => ({
      ...prev,
      orderBy: prev.orderBy.map(o => 
        o.id === id ? { ...o, [field]: value } : o
      )
    }));
  };

  const executeGeneratedQuery = () => {
    if (generatedQuery && activeConnectionId) {
      setCurrentQuery(generatedQuery);
      executeQuery(activeConnectionId, generatedQuery);
    }
  };

  const copyQuery = async () => {
    if (generatedQuery) {
      try {
        await navigator.clipboard.writeText(generatedQuery);
      } catch (error) {
        console.error('Failed to copy query:', error);
      }
    }
  };

  const resetBuilder = () => {
    setBuilderState({
      queryType: 'SELECT',
      selectedTable: '',
      selectedColumns: [],
      conditions: [],
      joins: [],
      orderBy: [],
      groupBy: [],
      having: [],
      limit: null,
      offset: null
    });
  };

  const getTableColumns = (tableName: string) => {
    const table = currentTables.find(t => t.name === tableName);
    return table?.columns || [];
  };

  const selectedTableColumns = getTableColumns(builderState.selectedTable);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Query Builder
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={copyQuery}
            disabled={!generatedQuery}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            title="Copy Query"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={executeGeneratedQuery}
            disabled={!generatedQuery}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-sm font-medium flex items-center gap-1"
          >
            <Play className="w-4 h-4" />
            Execute
          </button>
          
          <button
            onClick={resetBuilder}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Reset Builder"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Builder Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Query Type & Table Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Query Type
                </label>
                <select
                  value={builderState.queryType}
                  onChange={(e) => setBuilderState(prev => ({ ...prev, queryType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="SELECT">SELECT</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Table
                </label>
                <select
                  value={builderState.selectedTable}
                  onChange={(e) => setBuilderState(prev => ({ ...prev, selectedTable: e.target.value, selectedColumns: [] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select a table...</option>
                  {currentTables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Columns Selection */}
          {builderState.selectedTable && (builderState.queryType === 'SELECT' || builderState.queryType === 'INSERT' || builderState.queryType === 'UPDATE') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Columns {builderState.queryType === 'SELECT' && '(leave empty for *)'}
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2">
                {selectedTableColumns.map(column => (
                  <label key={column.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={builderState.selectedColumns.includes(column.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBuilderState(prev => ({
                            ...prev,
                            selectedColumns: [...prev.selectedColumns, column.name]
                          }));
                        } else {
                          setBuilderState(prev => ({
                            ...prev,
                            selectedColumns: prev.selectedColumns.filter(c => c !== column.name)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{column.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Joins */}
          {builderState.queryType === 'SELECT' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Joins
                </label>
                <button
                  onClick={addJoin}
                  className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Join
                </button>
              </div>
              
              <div className="space-y-2">
                {builderState.joins.map(join => (
                  <div key={join.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <select
                      value={join.type}
                      onChange={(e) => updateJoin(join.id, 'type', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {joinTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    
                    <span className="text-sm text-gray-500">JOIN</span>
                    
                    <select
                      value={join.table}
                      onChange={(e) => updateJoin(join.id, 'table', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select table...</option>
                      {currentTables.filter(t => t.name !== builderState.selectedTable).map(table => (
                        <option key={table.name} value={table.name}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                    
                    <span className="text-sm text-gray-500">ON</span>
                    
                    <input
                      type="text"
                      value={join.condition}
                      onChange={(e) => updateJoin(join.id, 'condition', e.target.value)}
                      placeholder="table1.id = table2.id"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    
                    <button
                      onClick={() => removeJoin(join.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditions (WHERE) */}
          {(builderState.queryType === 'SELECT' || builderState.queryType === 'UPDATE' || builderState.queryType === 'DELETE') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conditions (WHERE)
                </label>
                <button
                  onClick={addCondition}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Condition
                </button>
              </div>
              
              <div className="space-y-2">
                {builderState.conditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                    {index > 0 && (
                      <select
                        value={condition.logicalOperator || 'AND'}
                        onChange={(e) => updateCondition(condition.id, 'logicalOperator', e.target.value as 'AND' | 'OR')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    
                    <select
                      value={condition.column}
                      onChange={(e) => updateCondition(condition.id, 'column', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select column...</option>
                      {selectedTableColumns.map(column => (
                        <option key={column.name} value={column.name}>
                          {column.name}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {operators.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    
                    {!['IS NULL', 'IS NOT NULL'].includes(condition.operator) && (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                        placeholder={condition.operator === 'BETWEEN' ? 'value1, value2' : condition.operator.includes('IN') ? 'value1, value2, value3' : 'value'}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    )}
                    
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order By */}
          {builderState.queryType === 'SELECT' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order By
                </label>
                <button
                  onClick={addOrderBy}
                  className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Order
                </button>
              </div>
              
              <div className="space-y-2">
                {builderState.orderBy.map(order => (
                  <div key={order.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <select
                      value={order.column}
                      onChange={(e) => updateOrderBy(order.id, 'column', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select column...</option>
                      {selectedTableColumns.map(column => (
                        <option key={column.name} value={column.name}>
                          {column.name}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={order.direction}
                      onChange={(e) => updateOrderBy(order.id, 'direction', e.target.value as 'ASC' | 'DESC')}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="ASC">ASC</option>
                      <option value="DESC">DESC</option>
                    </select>
                    
                    <button
                      onClick={() => removeOrderBy(order.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limit & Offset */}
          {builderState.queryType === 'SELECT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limit
                </label>
                <input
                  type="number"
                  value={builderState.limit || ''}
                  onChange={(e) => setBuilderState(prev => ({ ...prev, limit: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offset
                </label>
                <input
                  type="number"
                  value={builderState.offset || ''}
                  onChange={(e) => setBuilderState(prev => ({ ...prev, offset: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="No offset"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Query Preview */}
        {showPreview && (
          <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Generated Query
              </h3>
            </div>
            
            <div className="p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-96 whitespace-pre-wrap">
                {generatedQuery || 'Select a table to start building your query...'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryBuilder;