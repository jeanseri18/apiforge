import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Copy,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Loader
} from 'lucide-react';

interface DataViewerProps {
  tableName: string;
  connectionId: string;
}

export const DataViewer: React.FC<DataViewerProps> = ({ tableName, connectionId }) => {
  const { executeQuery, isExecuting } = useDatabaseStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<{ name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalRows / pageSize);
  const offset = (currentPage - 1) * pageSize;

  // Charger les données avec pagination
  const loadData = async () => {
    setLoading(true);
    try {
      // Construire la requête avec pagination, tri et filtres
      let query = `SELECT * FROM ${tableName}`;
      
      // Ajouter les filtres
      const filterConditions = Object.entries(filters)
        .filter(([_, value]) => value.trim())
        .map(([column, value]) => `${column} LIKE '%${value}%'`);
      
      if (searchTerm) {
        // Recherche globale dans toutes les colonnes texte
        const searchConditions = columns
          .filter(col => col.type.toLowerCase().includes('varchar') || col.type.toLowerCase().includes('text'))
          .map(col => `${col.name} LIKE '%${searchTerm}%'`)
          .join(' OR ');
        if (searchConditions) {
          filterConditions.push(`(${searchConditions})`);
        }
      }
      
      if (filterConditions.length > 0) {
        query += ` WHERE ${filterConditions.join(' AND ')}`;
      }
      
      // Ajouter le tri
      if (sortColumn) {
        query += ` ORDER BY ${sortColumn} ${sortDirection.toUpperCase()}`;
      }
      
      // Ajouter la pagination
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
      
      // Exécuter la requête
      await executeQuery(connectionId, query);
      
      // Récupérer le nombre total de lignes
      let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      if (filterConditions.length > 0) {
        countQuery += ` WHERE ${filterConditions.join(' AND ')}`;
      }
      await executeQuery(connectionId, countQuery);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les métadonnées de la table
  const loadTableMetadata = async () => {
    try {
      await executeQuery(connectionId, `DESCRIBE ${tableName}`);
    } catch (error) {
      console.error('Error loading table metadata:', error);
    }
  };

  useEffect(() => {
    loadTableMetadata();
    loadData();
  }, [tableName, connectionId, currentPage, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    // Reset à la première page quand on change les filtres
    setCurrentPage(1);
    loadData();
  }, [searchTerm, filters]);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (columnName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const exportToCSV = () => {
    if (!data.length) return;
    
    const csv = [
      columns.map(col => col.name).join(','),
      ...data.map(row => 
        columns.map(col => {
          const value = row[col.name];
          if (value === null) return 'NULL';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value || '');
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}_page_${currentPage}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (!data.length) return;
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}_page_${currentPage}.json`;
    link.click();
  };

  const copyToClipboard = async () => {
    if (!data.length) return;
    
    const csv = [
      columns.map(col => col.name).join('\t'),
      ...data.map(row => 
        columns.map(col => String(row[col.name] || '')).join('\t')
      )
    ].join('\n');
    
    try {
      await navigator.clipboard.writeText(csv);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatValue = (value: any) => {
    if (value === null) return <span className="text-gray-400 italic">NULL</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    if (typeof value === 'string' && value === '') return <span className="text-gray-400 italic">empty</span>;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header avec contrôles */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tableName} Data
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalRows.toLocaleString()} total rows
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Copy to Clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <div className="relative group">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Download className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={exportToCSV}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recherche globale */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in all columns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400 mx-2">
              Page {currentPage} of {totalPages} ({((currentPage - 1) * pageSize + 1).toLocaleString()}-{Math.min(currentPage * pageSize, totalRows).toLocaleString()} of {totalRows.toLocaleString()})
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {data.length} rows
          </div>
        </div>
      </div>
      
      {/* Table des données */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data found</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="w-12 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.name}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort(column.name)}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          {column.name}
                          {sortColumn === column.name && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={filters[column.name] || ''}
                        onChange={(e) => handleFilterChange(column.name, e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 text-gray-400 dark:text-gray-500 font-mono text-xs">
                    {offset + rowIndex + 1}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.name}
                      className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs max-w-xs truncate"
                      title={String(row[column.name] ?? '')}
                    >
                      {formatValue(row[column.name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};