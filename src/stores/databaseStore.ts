import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { realDatabaseService } from '../services/realDatabaseService';
import { checkApiAvailability, testConnectionViaApi, loadTablesViaApi, executeQueryViaApi } from '../services/databaseProxyService';
import { databaseService } from '../services/databaseService';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  isConnected: boolean;
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseTable {
  name: string;
  schema?: string;
  type: 'table' | 'view' | 'collection';
  rowCount?: number;
  columns?: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: any;
}

export interface QueryResult {
  id: string;
  query: string;
  connectionId: string;
  results: any[];
  rows: any[][];
  columns: { name: string; type: string; }[];
  executionTime: number;
  rowsAffected?: number;
  error?: string;
  executedAt: Date;
}

export interface QueryHistory {
  id: string;
  query: string;
  connectionId: string;
  executedAt: Date;
  success: boolean;
  executionTime?: number;
  rowsAffected?: number;
}

interface DatabaseState {
  // Connections
  connections: DatabaseConnection[];
  activeConnectionId: string | null;
  activeConnection: DatabaseConnection | null;
  
  // Schema
  tables: Record<string, DatabaseTable[]>; // connectionId -> tables
  selectedTable: string | null;
  
  // Query
  currentQuery: string;
  queryResults: QueryResult[];
  queryHistory: QueryHistory[];
  isExecuting: boolean;
  
  // UI State
  selectedTab: 'browser' | 'query' | 'builder' | 'profiler' | 'history' | 'ssl' | 'tools';
  sidebarCollapsed: boolean;
  
  // Actions
  addConnection: (connection: Omit<DatabaseConnection, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>) => void;
  updateConnection: (id: string, updates: Partial<DatabaseConnection>) => void;
  deleteConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => Promise<void>;
  testConnection: (id: string) => Promise<boolean>;
  
  loadTables: (connectionId: string) => Promise<void>;
  selectTable: (tableName: string | null) => void;
  
  setCurrentQuery: (query: string) => void;
  executeQuery: (connectionId: string, query: string) => Promise<void>;
  clearResults: () => void;
  clearQueryHistory: () => void;
  
  setSelectedTab: (tab: 'browser' | 'query' | 'builder' | 'profiler' | 'history' | 'ssl' | 'tools') => void;
  toggleSidebar: () => void;
}

// Connexions de démonstration
const demoConnections: DatabaseConnection[] = [
  {
    id: 'demo-postgres',
    name: 'PostgreSQL Local',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'ecommerce_db',
    username: 'postgres',
    password: '',
    ssl: false,
    connectionString: '',
    isConnected: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastConnected: new Date(),
  },
  {
    id: 'demo-mysql',
    name: 'MySQL Production',
    type: 'mysql',
    host: 'prod-mysql.example.com',
    port: 3306,
    database: 'app_production',
    username: 'app_user',
    password: '',
    ssl: true,
    connectionString: '',
    isConnected: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      // Initial state
      connections: demoConnections,
      activeConnectionId: 'demo-postgres',
      activeConnection: demoConnections.find(c => c.id === 'demo-postgres') || null,
      tables: {},
      selectedTable: null,
      currentQuery: '',
      queryResults: [],
      queryHistory: [],
      isExecuting: false,
      selectedTab: 'browser',
      sidebarCollapsed: false,

      // Connection actions
      addConnection: (connectionData) => {
        const connection: DatabaseConnection = {
          ...connectionData,
          id: crypto.randomUUID(),
          isConnected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          connections: [...state.connections, connection],
        }));
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id
              ? { ...conn, ...updates, updatedAt: new Date() }
              : conn
          ),
        }));
      },

      deleteConnection: (id) => {
        set((state) => {
          const newTables = { ...state.tables };
          delete newTables[id];
          return {
            connections: state.connections.filter((conn) => conn.id !== id),
            activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
            tables: newTables,
          };
        });
      },

      setActiveConnection: async (id) => {
        const activeConnection = id ? get().connections.find(c => c.id === id) || null : null;
        set({ activeConnectionId: id, activeConnection });
        if (id && activeConnection) {
          // Si la connexion n'est pas encore établie, la tester d'abord
          if (!activeConnection.isConnected) {
            console.log('Connexion non établie, test en cours...');
            const isConnected = await get().testConnection(id);
            if (!isConnected) {
              console.warn('Échec de la connexion, impossible de charger les tables');
              return;
            }
          }
          // Charger les tables seulement si la connexion est établie
          console.log('Chargement des tables pour la connexion:', activeConnection.name);
          await get().loadTables(id);
        }
      },

      testConnection: async (id) => {
        const connection = get().connections.find((conn) => conn.id === id);
        if (!connection) return false;

        try {
          let isConnected = false;
          
          // Vérifier si nous sommes côté client
          if (typeof window !== 'undefined') {
            // Côté client - essayer d'abord l'API backend
            const apiAvailable = await checkApiAvailability();
            
            if (apiAvailable) {
              console.log('Utilisation de l\'API backend pour le test de connexion');
              isConnected = await testConnectionViaApi(connection);
            } else {
              // API non disponible - utiliser des connexions simulées pour les démos
              console.warn('API backend non disponible - utilisation de données simulées pour les démos');
              
              if (connection.name.includes('Demo') || connection.name.includes('Sample')) {
                isConnected = true;
              } else {
                console.error('API backend requis pour les connexions réelles. Veuillez démarrer le serveur proxy.');
                throw new Error('API backend non disponible. Démarrez le serveur proxy pour les connexions réelles.');
              }
            }
          } else {
            // Côté serveur - utiliser le vrai service
            isConnected = await realDatabaseService.testConnection(connection);
          }
          
          get().updateConnection(id, {
            isConnected,
            lastConnected: isConnected ? new Date() : undefined,
          });
          
          return isConnected;
        } catch (error) {
          console.error('Erreur de test de connexion:', error);
          get().updateConnection(id, { isConnected: false });
          return false;
        }
      },

       // Schema actions
      loadTables: async (connectionId) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection) return;

        try {
          let tables = [];
          
          // Vérifier si nous sommes côté client
          if (typeof window !== 'undefined') {
            // Côté client - essayer d'abord l'API backend
            const apiAvailable = await checkApiAvailability();
            
            if (apiAvailable) {
              console.log('Chargement des tables via l\'API backend');
              tables = await loadTablesViaApi(connectionId, connection);
            } else {
              // API non disponible - utiliser des tables simulées pour les démos
              if (connection.name.includes('Demo') || connection.name.includes('Sample')) {
                tables = await databaseService.loadTables(connectionId);
              } else {
                throw new Error('API backend non disponible. Démarrez le serveur proxy pour charger les tables réelles.');
              }
            }
          } else {
            // Côté serveur - utiliser le vrai service
            tables = await realDatabaseService.loadTables(connectionId);
          }
          
          set((state) => ({
            tables: {
              ...state.tables,
              [connectionId]: tables,
            },
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des tables:', error);
        }
      },

      selectTable: (tableName) => {
        set({ selectedTable: tableName });
      },

      // Query actions
      setCurrentQuery: (query) => {
        set({ currentQuery: query });
      },

      executeQuery: async (connectionId, query) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection) {
          throw new Error('Connexion non trouvée');
        }

        set({ isExecuting: true });
        
        try {
          let result;
          
          // Vérifier si nous sommes côté client
          if (typeof window !== 'undefined') {
            // Côté client - essayer d'abord l'API backend
            const apiAvailable = await checkApiAvailability();
            
            if (apiAvailable) {
              console.log('Exécution de la requête via l\'API backend');
              result = await executeQueryViaApi(connectionId, connection, query);
            } else {
              // API non disponible - utiliser le service simulé pour les démos
              if (connection.name.includes('Demo') || connection.name.includes('Sample')) {
                result = await databaseService.executeQuery(connectionId, query);
              } else {
                throw new Error('API backend non disponible. Démarrez le serveur proxy pour exécuter des requêtes réelles.');
              }
            }
          } else {
            // Côté serveur - utiliser le vrai service
            result = await realDatabaseService.executeQuery(connectionId, query);
          }
          
          const historyEntry: QueryHistory = {
            id: crypto.randomUUID(),
            query,
            connectionId,
            executedAt: new Date(),
            success: true,
            executionTime: result.executionTime,
          };

          set((state) => ({
            queryResults: [result, ...state.queryResults.slice(0, 9)], // Keep last 10 results
            queryHistory: [historyEntry, ...state.queryHistory.slice(0, 99)], // Keep last 100 queries
          }));
        } catch (error) {
          console.error('Query execution failed:', error);
          
          const historyEntry: QueryHistory = {
            id: crypto.randomUUID(),
            query,
            connectionId,
            executedAt: new Date(),
            success: false,
          };

          set((state) => ({
            queryHistory: [historyEntry, ...state.queryHistory.slice(0, 99)],
          }));
          throw error; // Re-throw the original error
        } finally {
          set({ isExecuting: false });
        }
      },

      clearResults: () => {
        set({ queryResults: [] });
      },

      clearQueryHistory: () => {
        set({ queryHistory: [] });
      },

      // UI actions
      setSelectedTab: (tab) => {
        set({ selectedTab: tab });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
    }),
    {
      name: 'database-store',
      partialize: (state) => ({
        connections: state.connections.map(conn => ({ ...conn, password: undefined })), // Don't persist passwords
        queryHistory: state.queryHistory,
        selectedTab: state.selectedTab,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir les chaînes de dates en objets Date lors de la désérialisation
          state.queryHistory = state.queryHistory.map(entry => ({
            ...entry,
            executedAt: typeof entry.executedAt === 'string' ? new Date(entry.executedAt) : entry.executedAt,
          }));
          
          state.connections = state.connections.map(conn => ({
            ...conn,
            createdAt: typeof conn.createdAt === 'string' ? new Date(conn.createdAt) : conn.createdAt,
            updatedAt: typeof conn.updatedAt === 'string' ? new Date(conn.updatedAt) : conn.updatedAt,
            lastConnected: conn.lastConnected && typeof conn.lastConnected === 'string' 
              ? new Date(conn.lastConnected) 
              : conn.lastConnected,
          }));
        }
      },
    }
  )
);