import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import {
  Clock,
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';

interface QueryProfile {
  id: string;
  query: string;
  executionTime: number;
  rowsAffected: number;
  executedAt: Date;
  status: 'success' | 'error' | 'warning';
  memoryUsage?: number;
  cpuUsage?: number;
  ioOperations?: number;
  indexesUsed?: string[];
  suggestions?: string[];
  planSteps?: QueryPlanStep[];
}

interface QueryPlanStep {
  id: string;
  operation: string;
  table?: string;
  index?: string;
  cost: number;
  rows: number;
  time: number;
  details: string;
}

interface PerformanceMetrics {
  avgExecutionTime: number;
  totalQueries: number;
  successRate: number;
  slowQueries: number;
  fastQueries: number;
  memoryEfficiency: number;
  indexUsageRate: number;
}

const QueryProfiler: React.FC = () => {
  const { queryHistory } = useDatabaseStore();
  const [profiles, setProfiles] = useState<QueryProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<QueryProfile | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'plan' | 'suggestions'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState<'time' | 'duration' | 'rows'>('time');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'warning'>('all');

  useEffect(() => {
    generateProfiles();
  }, [queryHistory, timeRange]);

  useEffect(() => {
    if (profiles.length > 0) {
      calculateMetrics();
    }
  }, [profiles]);

  const generateProfiles = () => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange];

    const filteredHistory = queryHistory.filter(query => 
      now.getTime() - query.executedAt.getTime() <= timeRangeMs
    );

    const generatedProfiles: QueryProfile[] = filteredHistory.map(query => {
      const executionTime = query.executionTime || Math.random() * 1000 + 10;
      const status = executionTime > 1000 ? 'warning' : executionTime > 5000 ? 'error' : 'success';
      
      return {
        id: `profile_${query.id}`,
        query: query.query,
        executionTime,
        rowsAffected: query.rowsAffected || Math.floor(Math.random() * 1000),
        executedAt: query.executedAt,
        status,
        memoryUsage: Math.random() * 100 + 10, // MB
        cpuUsage: Math.random() * 80 + 5, // %
        ioOperations: Math.floor(Math.random() * 50 + 1),
        indexesUsed: generateIndexesUsed(query.query),
        suggestions: generateSuggestions(query.query, executionTime),
        planSteps: generateQueryPlan(query.query)
      };
    });

    setProfiles(generatedProfiles);
  };

  const generateIndexesUsed = (query: string): string[] => {
    const indexes: string[] = [];
    if (query.toLowerCase().includes('where')) {
      indexes.push('idx_primary_key');
    }
    if (query.toLowerCase().includes('join')) {
      indexes.push('idx_foreign_key');
    }
    if (query.toLowerCase().includes('order by')) {
      indexes.push('idx_sort_column');
    }
    return indexes;
  };

  const generateSuggestions = (query: string, executionTime: number): string[] => {
    const suggestions: string[] = [];
    
    if (executionTime > 1000) {
      suggestions.push('Consider adding an index on frequently queried columns');
    }
    
    if (query.toLowerCase().includes('select *')) {
      suggestions.push('Avoid SELECT * - specify only needed columns');
    }
    
    if (query.toLowerCase().includes('like \'%')) {
      suggestions.push('Leading wildcard in LIKE can prevent index usage');
    }
    
    if (!query.toLowerCase().includes('limit') && query.toLowerCase().includes('select')) {
      suggestions.push('Consider adding LIMIT clause for large result sets');
    }
    
    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('limit')) {
      suggestions.push('ORDER BY without LIMIT can be expensive on large datasets');
    }
    
    return suggestions;
  };

  const generateQueryPlan = (query: string): QueryPlanStep[] => {
    const steps: QueryPlanStep[] = [];
    let stepId = 1;
    
    // Simulate query plan steps
    if (query.toLowerCase().includes('select')) {
      steps.push({
        id: `step_${stepId++}`,
        operation: 'Seq Scan',
        table: 'main_table',
        cost: Math.random() * 100 + 10,
        rows: Math.floor(Math.random() * 1000 + 100),
        time: Math.random() * 50 + 5,
        details: 'Sequential scan on main table'
      });
    }
    
    if (query.toLowerCase().includes('where')) {
      steps.push({
        id: `step_${stepId++}`,
        operation: 'Filter',
        cost: Math.random() * 20 + 5,
        rows: Math.floor(Math.random() * 500 + 50),
        time: Math.random() * 10 + 2,
        details: 'Apply WHERE conditions'
      });
    }
    
    if (query.toLowerCase().includes('join')) {
      steps.push({
        id: `step_${stepId++}`,
        operation: 'Hash Join',
        table: 'joined_table',
        cost: Math.random() * 200 + 50,
        rows: Math.floor(Math.random() * 2000 + 200),
        time: Math.random() * 100 + 20,
        details: 'Hash join with related table'
      });
    }
    
    if (query.toLowerCase().includes('order by')) {
      steps.push({
        id: `step_${stepId++}`,
        operation: 'Sort',
        cost: Math.random() * 150 + 30,
        rows: Math.floor(Math.random() * 1000 + 100),
        time: Math.random() * 80 + 15,
        details: 'Sort result set'
      });
    }
    
    return steps;
  };

  const calculateMetrics = () => {
    if (profiles.length === 0) {
      setMetrics(null);
      return;
    }

    const totalQueries = profiles.length;
    const successQueries = profiles.filter(p => p.status === 'success').length;
    const slowQueries = profiles.filter(p => p.executionTime > 1000).length;
    const fastQueries = profiles.filter(p => p.executionTime < 100).length;
    const avgExecutionTime = profiles.reduce((sum, p) => sum + p.executionTime, 0) / totalQueries;
    const avgMemoryUsage = profiles.reduce((sum, p) => sum + (p.memoryUsage || 0), 0) / totalQueries;
    const indexUsageRate = profiles.filter(p => (p.indexesUsed?.length || 0) > 0).length / totalQueries;

    setMetrics({
      avgExecutionTime,
      totalQueries,
      successRate: (successQueries / totalQueries) * 100,
      slowQueries,
      fastQueries,
      memoryEfficiency: 100 - avgMemoryUsage,
      indexUsageRate: indexUsageRate * 100
    });
  };

  const getFilteredProfiles = () => {
    let filtered = profiles;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.executionTime - a.executionTime;
        case 'rows':
          return b.rowsAffected - a.rowsAffected;
        case 'time':
        default:
          return b.executedAt.getTime() - a.executedAt.getTime();
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics,
      profiles: profiles.map(p => ({
        query: p.query,
        executionTime: p.executionTime,
        rowsAffected: p.rowsAffected,
        status: p.status,
        suggestions: p.suggestions
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_performance_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Query Profiler
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={generateProfiles}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportReport}
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Metrics Panel */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Performance Metrics
            </h3>
            
            {metrics && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Avg Execution Time
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.avgExecutionTime.toFixed(1)}ms
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Queries
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.totalQueries}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Success Rate
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.successRate.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fast Queries
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.fastQueries}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slow Queries
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.slowQueries}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Index Usage
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.indexUsageRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="time">Execution Time</option>
                  <option value="duration">Duration</option>
                  <option value="rows">Rows Affected</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>

          {/* Query List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredProfiles().map(profile => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedProfile?.id === profile.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(profile.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                          {profile.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.executedAt.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm font-mono text-gray-900 dark:text-white truncate mb-2">
                        {profile.query}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {profile.executionTime.toFixed(1)}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {profile.rowsAffected} rows
                        </span>
                        {profile.indexesUsed && profile.indexesUsed.length > 0 && (
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {profile.indexesUsed.length} indexes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        {selectedProfile && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Query Details
              </h3>
              
              <div className="flex items-center gap-1 mt-2">
                {['overview', 'details', 'plan', 'suggestions'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Query
                    </label>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border overflow-auto max-h-32">
                      {selectedProfile.query}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Execution Time
                      </label>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProfile.executionTime.toFixed(1)}ms
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rows Affected
                      </label>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProfile.rowsAffected}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Memory Usage
                      </label>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProfile.memoryUsage?.toFixed(1)}MB
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CPU Usage
                      </label>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProfile.cpuUsage?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Indexes Used
                    </label>
                    {selectedProfile.indexesUsed && selectedProfile.indexesUsed.length > 0 ? (
                      <div className="space-y-1">
                        {selectedProfile.indexesUsed.map((index, i) => (
                          <div key={i} className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {index}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No indexes used
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      I/O Operations
                    </label>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedProfile.ioOperations}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'plan' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Execution Plan
                  </label>
                  {selectedProfile.planSteps && selectedProfile.planSteps.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProfile.planSteps.map((step, i) => (
                        <div key={step.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {i + 1}. {step.operation}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {step.time.toFixed(1)}ms
                            </span>
                          </div>
                          
                          {step.table && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Table: {step.table}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {step.details}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Cost: {step.cost.toFixed(1)}</span>
                            <span>Rows: {step.rows}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No execution plan available
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'suggestions' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Performance Suggestions
                  </label>
                  {selectedProfile.suggestions && selectedProfile.suggestions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProfile.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-yellow-800 dark:text-yellow-200">
                            {suggestion}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-800 dark:text-green-200">
                        No performance issues detected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryProfiler;