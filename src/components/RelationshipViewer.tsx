import React, { useState, useEffect, useRef } from 'react';
import { useDatabaseStore } from '../stores/databaseStore';
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Settings,
  Eye,
  EyeOff,
  Maximize,
  Filter,
  Search,
  Info
} from 'lucide-react';

interface TablePosition {
  x: number;
  y: number;
}

interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  constraintName?: string;
}

interface TableNode {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    primaryKey: boolean;
    foreignKey: boolean;
    nullable: boolean;
  }>;
  position: TablePosition;
  visible: boolean;
}

const RelationshipViewer: React.FC = () => {
  const { connections, activeConnectionId, tables } = useDatabaseStore();
  const [tableNodes, setTableNodes] = useState<TableNode[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [viewSettings, setViewSettings] = useState({
    showColumnTypes: true,
    showNullable: true,
    showIndexes: true,
    autoLayout: true,
    theme: 'light' as 'light' | 'dark'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'connected' | 'isolated'>('all');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConnectionId && tables[activeConnectionId]) {
      generateTableNodes();
      generateRelationships();
    }
  }, [activeConnectionId, tables]);

  const generateTableNodes = () => {
    if (!activeConnectionId || !tables[activeConnectionId]) return;

    const currentTables = tables[activeConnectionId];
    const nodes: TableNode[] = currentTables.map((table, index) => {
      // Disposition automatique en grille
      const cols = Math.ceil(Math.sqrt(currentTables.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        name: table.name,
        columns: table.columns?.map(col => ({
          name: col.name,
          type: col.type,
          primaryKey: col.primaryKey,
          foreignKey: !!col.foreignKey,
          nullable: col.nullable
        })) || [],
        position: {
          x: col * 300 + 50,
          y: row * 200 + 50
        },
        visible: true
      };
    });

    setTableNodes(nodes);
  };

  const generateRelationships = () => {
    if (!activeConnectionId || !tables[activeConnectionId]) return;

    const currentTables = tables[activeConnectionId];
    const relations: Relationship[] = [];

    // Analyser les clés étrangères pour détecter les relations
    currentTables.forEach(table => {
      table.columns?.forEach(column => {
        if (column.foreignKey) {
          // Simuler la détection de relation basée sur les conventions de nommage
          const referencedTable = detectReferencedTable(column.name, currentTables);
          if (referencedTable) {
            relations.push({
              id: `${table.name}_${column.name}_${referencedTable}`,
              fromTable: table.name,
              fromColumn: column.name,
              toTable: referencedTable,
              toColumn: 'id', // Convention par défaut
              type: 'one-to-many',
              constraintName: `fk_${table.name}_${column.name}`
            });
          }
        }
      });
    });

    setRelationships(relations);
  };

  const detectReferencedTable = (columnName: string, tables: any[]): string | null => {
    // Conventions de nommage courantes pour les clés étrangères
    const patterns = [
      columnName.replace(/_id$/, ''), // user_id -> user
      columnName.replace(/Id$/, ''), // userId -> user
      columnName.replace(/_pk$/, ''), // user_pk -> user
      columnName.replace(/Pk$/, '') // userPk -> user
    ];

    for (const pattern of patterns) {
      const foundTable = tables.find(t => 
        t.name.toLowerCase() === pattern.toLowerCase() ||
        t.name.toLowerCase() === pattern.toLowerCase() + 's' ||
        t.name.toLowerCase() === pattern.toLowerCase() + 'es'
      );
      if (foundTable) {
        return foundTable.name;
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const autoLayout = () => {
    // Algorithme de disposition automatique simple
    const nodes = [...tableNodes];
    const connectedTables = new Set<string>();
    
    // Identifier les tables connectées
    relationships.forEach(rel => {
      connectedTables.add(rel.fromTable);
      connectedTables.add(rel.toTable);
    });

    // Disposer les tables connectées au centre
    const connected = nodes.filter(node => connectedTables.has(node.name));
    const isolated = nodes.filter(node => !connectedTables.has(node.name));

    // Layout en cercle pour les tables connectées
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    connected.forEach((node, index) => {
      const angle = (index / connected.length) * 2 * Math.PI;
      node.position = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    // Layout en grille pour les tables isolées
    const cols = Math.ceil(Math.sqrt(isolated.length));
    isolated.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.position = {
        x: 50 + col * 250,
        y: 50 + row * 150
      };
    });

    setTableNodes([...connected, ...isolated]);
  };

  const exportDiagram = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-schema-${Date.now()}.svg`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const toggleTableVisibility = (tableName: string) => {
    setTableNodes(nodes => 
      nodes.map(node => 
        node.name === tableName 
          ? { ...node, visible: !node.visible }
          : node
      )
    );
  };

  const getFilteredTables = () => {
    let filtered = tableNodes;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.columns.some(col => 
          col.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtrer par type
    switch (filterType) {
      case 'connected':
        const connectedTables = new Set<string>();
        relationships.forEach(rel => {
          connectedTables.add(rel.fromTable);
          connectedTables.add(rel.toTable);
        });
        filtered = filtered.filter(table => connectedTables.has(table.name));
        break;
      case 'isolated':
        const isolatedTables = new Set<string>();
        relationships.forEach(rel => {
          isolatedTables.add(rel.fromTable);
          isolatedTables.add(rel.toTable);
        });
        filtered = filtered.filter(table => !isolatedTables.has(table.name));
        break;
    }

    return filtered.filter(table => table.visible);
  };

  const renderTable = (table: TableNode) => {
    const isSelected = selectedTable === table.name;
    
    return (
      <g key={table.name} transform={`translate(${table.position.x}, ${table.position.y})`}>
        {/* Table container */}
        <rect
          x="0"
          y="0"
          width="200"
          height={Math.max(100, 30 + table.columns.length * 20)}
          fill={isSelected ? '#dbeafe' : '#ffffff'}
          stroke={isSelected ? '#3b82f6' : '#d1d5db'}
          strokeWidth={isSelected ? 2 : 1}
          rx="4"
          className="cursor-pointer"
          onClick={() => setSelectedTable(isSelected ? null : table.name)}
        />
        
        {/* Table header */}
        <rect
          x="0"
          y="0"
          width="200"
          height="30"
          fill={isSelected ? '#3b82f6' : '#f3f4f6'}
          rx="4"
        />
        
        <text
          x="100"
          y="20"
          textAnchor="middle"
          className={`text-sm font-semibold ${isSelected ? 'fill-white' : 'fill-gray-900'}`}
        >
          {table.name}
        </text>
        
        {/* Columns */}
        {table.columns.map((column, index) => (
          <g key={column.name}>
            <text
              x="8"
              y={50 + index * 20}
              className="text-xs fill-gray-700"
            >
              {column.primaryKey && '🔑 '}
              {column.foreignKey && '🔗 '}
              {column.name}
              {viewSettings.showColumnTypes && (
                <tspan className="fill-gray-500"> : {column.type}</tspan>
              )}
              {viewSettings.showNullable && !column.nullable && (
                <tspan className="fill-red-500"> *</tspan>
              )}
            </text>
          </g>
        ))}
      </g>
    );
  };

  const renderRelationship = (relationship: Relationship) => {
    const fromTable = tableNodes.find(t => t.name === relationship.fromTable);
    const toTable = tableNodes.find(t => t.name === relationship.toTable);
    
    if (!fromTable || !toTable || !fromTable.visible || !toTable.visible) {
      return null;
    }

    const fromX = fromTable.position.x + 200;
    const fromY = fromTable.position.y + 50;
    const toX = toTable.position.x;
    const toY = toTable.position.y + 50;

    // Calculer les points de contrôle pour une courbe
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const controlX1 = fromX + 50;
    const controlY1 = fromY;
    const controlX2 = toX - 50;
    const controlY2 = toY;

    return (
      <g key={relationship.id}>
        {/* Ligne de relation */}
        <path
          d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        
        {/* Label de relation */}
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          className="text-xs fill-gray-600 bg-white"
        >
          {relationship.type}
        </text>
      </g>
    );
  };

  const filteredTables = getFilteredTables();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GitBranch className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Relationship Viewer</h1>
              <p className="text-sm text-gray-600">Visualize database table relationships</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tables</option>
              <option value="connected">Connected Only</option>
              <option value="isolated">Isolated Only</option>
            </select>
            
            {/* Controls */}
            <button
              onClick={() => handleZoom(0.1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <button
              onClick={resetView}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={autoLayout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Auto Layout"
            >
              <Maximize className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportDiagram}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Export Diagram"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tables List */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tables ({filteredTables.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tableNodes.map(table => (
                <div
                  key={table.name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                    selectedTable === table.name
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                >
                  <span className="text-sm font-medium">{table.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTableVisibility(table.name);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {table.visible ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Relationships List */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Relationships ({relationships.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {relationships.map(rel => (
                <div key={rel.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{rel.fromTable} → {rel.toTable}</div>
                  <div className="text-gray-600">{rel.fromColumn} → {rel.toColumn}</div>
                  <div className="text-xs text-gray-500">{rel.type}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Table Details */}
          {selectedTable && (
            <div className="p-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Table Details</h3>
              {(() => {
                const table = tableNodes.find(t => t.name === selectedTable);
                if (!table) return null;
                
                return (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name:</span>
                      <p className="text-sm text-gray-900">{table.name}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Columns ({table.columns.length}):</span>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {table.columns.map(col => (
                          <div key={col.name} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="font-medium">
                              {col.primaryKey && '🔑 '}
                              {col.foreignKey && '🔗 '}
                              {col.name}
                            </div>
                            <div className="text-gray-600">
                              {col.type} {!col.nullable && '(NOT NULL)'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Related Tables:</span>
                      <div className="mt-2 space-y-1">
                        {relationships
                          .filter(rel => rel.fromTable === selectedTable || rel.toTable === selectedTable)
                          .map(rel => (
                            <div key={rel.id} className="text-xs bg-blue-50 p-2 rounded">
                              <div className="font-medium">
                                {rel.fromTable === selectedTable ? rel.toTable : rel.fromTable}
                              </div>
                              <div className="text-gray-600">{rel.type}</div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                );
              })()
              }
            </div>
          )}
        </div>
        
        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          {!activeConnectionId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Connection Selected</h3>
                <p className="text-gray-600">Select a database connection to view relationships</p>
              </div>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
                <p className="text-gray-600">No tables match your current filter criteria</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6b7280"
                  />
                </marker>
              </defs>
              
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Render relationships first (behind tables) */}
                {relationships.map(renderRelationship)}
                
                {/* Render tables */}
                {filteredTables.map(renderTable)}
              </g>
            </svg>
          )}
          
          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">View Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showColumnTypes}
                onChange={(e) => setViewSettings(prev => ({ ...prev, showColumnTypes: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show column types</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showNullable}
                onChange={(e) => setViewSettings(prev => ({ ...prev, showNullable: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show nullable indicators</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showIndexes}
                onChange={(e) => setViewSettings(prev => ({ ...prev, showIndexes: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show indexes</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.autoLayout}
                onChange={(e) => setViewSettings(prev => ({ ...prev, autoLayout: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto layout on load</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={viewSettings.theme}
                onChange={(e) => setViewSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipViewer;