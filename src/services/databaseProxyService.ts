import { DatabaseConnection, DatabaseTable, QueryResult } from '../stores/databaseStore';

// Configuration de l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/database/health`,
  testConnection: `${API_BASE_URL}/api/database/test-connection`,
  loadTables: `${API_BASE_URL}/api/database/load-tables`,
  executeQuery: `${API_BASE_URL}/api/database/execute-query`,
};

// Interface pour les réponses de l'API
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  tables?: T;
}

// Vérification de la disponibilité de l'API
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.health, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.warn('API backend non disponible:', error);
    return false;
  }
}

// Test de connexion via l'API backend
export async function testConnectionViaApi(connection: DatabaseConnection): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.testConnection, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
    
    const data: ApiResponse<{ success: boolean }> = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Erreur lors du test de connexion via API:', error);
    throw error;
  }
}

// Chargement des tables via l'API backend
export async function loadTablesViaApi(connectionId: string, connection: DatabaseConnection): Promise<DatabaseTable[]> {
  try {
    const response = await fetch(API_ENDPOINTS.loadTables, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId, connection }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
    
    const data: ApiResponse<DatabaseTable[]> = await response.json();
    return data.tables || [];
  } catch (error) {
    console.error('Erreur lors du chargement des tables via API:', error);
    throw error;
  }
}

// Exécution de requête via l'API backend
export async function executeQueryViaApi(
  connectionId: string,
  connection: DatabaseConnection,
  query: string
): Promise<QueryResult> {
  try {
    const response = await fetch(API_ENDPOINTS.executeQuery, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId, connection, query }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
    
    const data: QueryResult = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête via API:', error);
    throw error;
  }
}

// Service proxy pour les connexions de base de données via API backend
export class DatabaseProxyService {
  private static instance: DatabaseProxyService;
  private baseUrl: string;

  constructor() {
    // URL de l'API backend - peut être configurée via variables d'environnement
    this.baseUrl = import.meta.env.VITE_DATABASE_API_URL || 'http://localhost:3001/api/database';
  }

  static getInstance(): DatabaseProxyService {
    if (!DatabaseProxyService.instance) {
      DatabaseProxyService.instance = new DatabaseProxyService();
    }
    return DatabaseProxyService.instance;
  }

  // Test de connexion via API
  async testConnection(connection: Omit<DatabaseConnection, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    return testConnectionViaApi(connection as DatabaseConnection);
  }

  // Chargement des tables via API
  async loadTables(connectionId: string, connection: DatabaseConnection): Promise<DatabaseTable[]> {
    return loadTablesViaApi(connectionId, connection);
  }

  // Exécution de requête via API
  async executeQuery(connectionId: string, connection: DatabaseConnection, query: string): Promise<QueryResult> {
    return executeQueryViaApi(connectionId, connection, query);
  }

  // Vérifier si l'API backend est disponible
  async checkApiAvailability(): Promise<boolean> {
    return checkApiAvailability();
  }
}

export const databaseProxyService = DatabaseProxyService.getInstance();