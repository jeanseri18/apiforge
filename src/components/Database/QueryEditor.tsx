import React, { useState, useRef } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { DataViewer } from './DataViewer';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Loader, 
  Copy, 
  Check,
  FileText,
  Clock,
  FileSpreadsheet,
  Database
} from 'lucide-react';

export const QueryEditor: React.FC = () => {
  const {
    currentQuery,
    setCurrentQuery,
    executeQuery,
    queryResults,
    isExecuting,
    activeConnectionId,
    connections,
    clearResults
  } = useDatabaseStore();

  const [copied, setCopied] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConnection = connections.find(conn => conn.id === activeConnectionId);
  const currentResult = queryResults[selectedResultIndex];

  const handleExecute = async () => {
    if (!activeConnectionId || !currentQuery.trim()) return;
    
    await executeQuery(activeConnectionId, currentQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(currentQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy query:', error);
    }
  };

  const handleCopyResults = async () => {
    if (!currentResult?.results) return;
    
    try {
      const csv = [
        currentResult.columns.join(','),
        ...currentResult.results.map(row => 
          currentResult.columns.map(col => 
            JSON.stringify(row[col.name] ?? '')
          ).join(',')
        )
      ].join('\n');
      
      await navigator.clipboard.writeText(csv);
    } catch (error) {
      console.error('Failed to copy results:', error);
    }
  };

  const exportResults = (format: 'csv' | 'json' | 'excel') => {
    if (!currentResult?.results) return;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `query_results_${timestamp}`;
    
    switch (format) {
      case 'csv': {
        const csv = [
          currentResult.columns.map(col => col.name).join(','),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => {
              const value = row[col.name];
              if (value === null) return 'NULL';
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return String(value || '');
            }).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        break;
      }
      
      case 'json': {
        const json = JSON.stringify({
          query: currentResult.query,
          executedAt: currentResult.executedAt,
          executionTime: currentResult.executionTime,
          rowsAffected: currentResult.rowsAffected,
          columns: currentResult.columns,
          data: currentResult.results
        }, null, 2);
        
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        link.click();
        break;
      }
      
      case 'excel': {
        // Créer un format TSV pour Excel
        const tsv = [
          currentResult.columns.map(col => col.name).join('\t'),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => {
              const value = row[col.name];
              if (value === null) return 'NULL';
              return String(value || '').replace(/\t/g, ' ');
            }).join('\t')
          )
        ].join('\n');
        
        const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.xlsx`;
        link.click();
        break;
      }
    }
  };

  const formatValue = (value: any) => {
    if (value === null) return <span className="text-gray-400 italic">NULL</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    if (typeof value === 'string' && value === '') return <span className="text-gray-400 italic">empty</span>;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getQuerySuggestions = () => {
    const suggestions = [
      'SELECT * FROM users LIMIT 10;',
      'SHOW TABLES;',
      'DESCRIBE users;',
      'SELECT COUNT(*) FROM orders;',
      'SELECT * FROM users WHERE created_at > NOW() - INTERVAL 1 DAY;'
    ];
    return suggestions;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Query Editor */}
      <div className="flex-1 flex flex-col border-b border-gray-200 dark:border-gray-700">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SQL Query</span>
            {activeConnection && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({activeConnection.type} • {activeConnection.database})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyQuery}
              disabled={!currentQuery.trim()}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              title="Copy Query"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setCurrentQuery('')}
              disabled={!currentQuery.trim()}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              title="Clear Query"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            
            <button
              onClick={handleExecute}
              disabled={!activeConnectionId || !currentQuery.trim() || isExecuting}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isExecuting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-none outline-none resize-none"
            placeholder={`-- Enter your SQL query here\n-- Press Ctrl+Enter to execute\n\n${getQuerySuggestions().join('\n')}`}
            spellCheck={false}
          />
          
          {/* Query Info */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
            Lines: {currentQuery.split('\n').length} | Chars: {currentQuery.length}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col">
        {/* Results Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Results</span>
            </div>
            
            {queryResults.length > 1 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedResultIndex}
                  onChange={(e) => setSelectedResultIndex(parseInt(e.target.value))}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {queryResults.map((result, index) => (
                    <option key={result.id} value={index}>
                      Result {index + 1} ({result.results.length} rows)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentResult && (
              <>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentResult.results.length} rows • {currentResult.executionTime}ms
                </span>
                
                <button
                  onClick={handleCopyResults}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Copy as CSV"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <div className="relative group">
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-48">
                    <button
                      onClick={() => exportResults('csv')}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => exportResults('json')}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Database className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => exportResults('excel')}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as Excel
                    </button>
                  </div>
                </div>
              </>
            )}
            
            <button
              onClick={clearResults}
              disabled={queryResults.length === 0}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              title="Clear Results"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Content */}
        <div className="flex-1 overflow-auto">
          {queryResults.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No results yet</p>
                <p className="text-xs mt-1">Execute a query to see results here</p>
              </div>
            </div>
          ) : currentResult?.error ? (
            <div className="p-4">
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Query Error</h4>
                <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                  {currentResult.error}
                </pre>
              </div>
            </div>
          ) : currentResult?.results ? (
            <div className="p-4">
              <div className="overflow-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      {currentResult.columns.map((col, index) => (
                        <th key={index} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentResult.results.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {currentResult.columns.map((col, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {formatValue(row[col.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};