import { DatabaseConnection, DatabaseTable, DatabaseColumn, QueryResult } from '../stores/databaseStore';

// Service pour gérer les connexions et opérations de base de données
export class DatabaseService {
  private static instance: DatabaseService;
  private connections: Map<string, DatabaseConnection> = new Map();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Test de connexion (simulé)
  async testConnection(connection: Omit<DatabaseConnection, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    // Simulation d'un délai de connexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulation de validation basique
    if (!connection.host || !connection.port || !connection.database) {
      throw new Error('Paramètres de connexion manquants');
    }
    
    // Simulation d'échec pour certains cas
    if (connection.host === 'invalid-host') {
      throw new Error('Impossible de se connecter à l\'hôte');
    }
    
    return true;
  }

  // Chargement des tables (simulé)
  async loadTables(connectionId: string): Promise<DatabaseTable[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connexion non trouvée');
    }

    // Données simulées selon le type de base de données
    const mockTables: DatabaseTable[] = this.getMockTables(connection.type);
    
    return mockTables;
  }

  // Exécution de requête (simulée)
  async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    // Simulation d'un délai d'exécution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connexion non trouvée');
    }

    // Simulation de parsing basique de la requête
    const queryLower = query.toLowerCase().trim();
    
    if (queryLower.includes('error') || queryLower.includes('fail')) {
      throw new Error('Erreur de syntaxe SQL');
    }

    const duration = Date.now() - startTime;
    
    // Génération de résultats simulés
    if (queryLower.startsWith('select')) {
      return this.generateSelectResult(query, connectionId, duration);
    } else if (queryLower.startsWith('insert')) {
      return {
        id: crypto.randomUUID(),
        query,
        connectionId,
        results: [],
        rows: [],
        columns: [],
        executionTime: duration,
        rowsAffected: Math.floor(Math.random() * 5) + 1,
        executedAt: new Date()
      };
    } else if (queryLower.startsWith('update')) {
      return {
        id: crypto.randomUUID(),
        query,
        connectionId,
        results: [],
        rows: [],
        columns: [],
        executionTime: duration,
        rowsAffected: Math.floor(Math.random() * 10) + 1,
        executedAt: new Date()
      };
    } else if (queryLower.startsWith('delete')) {
      return {
        id: crypto.randomUUID(),
        query,
        connectionId,
        results: [],
        rows: [],
        columns: [],
        executionTime: duration,
        rowsAffected: Math.floor(Math.random() * 3) + 1,
        executedAt: new Date()
      };
    } else {
      return {
        id: crypto.randomUUID(),
        query,
        connectionId,
        results: [],
        rows: [],
        columns: [],
        executionTime: duration,
        rowsAffected: 0,
        executedAt: new Date()
      };
    }
  }

  // Enregistrement d'une connexion
  registerConnection(connection: DatabaseConnection): void {
    this.connections.set(connection.id, connection);
  }

  // Suppression d'une connexion
  unregisterConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  // Génération de tables simulées
  private getMockTables(dbType: string): DatabaseTable[] {
    const baseTables: DatabaseTable[] = [
      {
        name: 'users',
        type: 'table',
        rowCount: 1250,
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'username', type: 'VARCHAR(50)', nullable: false, primaryKey: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: false, primaryKey: false },
          { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, primaryKey: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: true, primaryKey: false }
        ]
      },
      {
        name: 'products',
        type: 'table',
        rowCount: 856,
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'name', type: 'VARCHAR(200)', nullable: false, primaryKey: false },
          { name: 'description', type: 'TEXT', nullable: true, primaryKey: false },
          { name: 'price', type: 'DECIMAL(10,2)', nullable: false, primaryKey: false },
          { name: 'category_id', type: 'INTEGER', nullable: true, primaryKey: false },
          { name: 'stock_quantity', type: 'INTEGER', nullable: false, primaryKey: false }
        ]
      },
      {
        name: 'orders',
        type: 'table',
        rowCount: 3420,
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'user_id', type: 'INTEGER', nullable: false, primaryKey: false },
          { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, primaryKey: false },
          { name: 'status', type: 'VARCHAR(20)', nullable: false, primaryKey: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false }
        ]
      }
    ];

    // Ajout de tables spécifiques selon le type de DB
    if (dbType === 'postgresql') {
      baseTables.push({
        name: 'user_sessions',
        type: 'view',
        rowCount: 0,
        columns: [
          { name: 'session_id', type: 'UUID', nullable: false, primaryKey: true },
          { name: 'user_id', type: 'INTEGER', nullable: false, primaryKey: false },
          { name: 'expires_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, primaryKey: false }
        ]
      });
    }

    return baseTables;
  }

  // Génération de résultats SELECT simulés
  private generateSelectResult(query: string, connectionId: string, duration: number): QueryResult {
    const columns = [
      { name: 'id', type: 'INTEGER' },
      { name: 'name', type: 'VARCHAR' },
      { name: 'email', type: 'VARCHAR' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ];

    const rowCount = Math.floor(Math.random() * 20) + 1;
    const rows: any[][] = [];
    const results: any[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = [
        i + 1,
        `User ${i + 1}`,
        `user${i + 1}@example.com`,
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      ];
      rows.push(row);
      
      // Créer un objet pour results
      const resultObj: any = {};
      columns.forEach((col, index) => {
        resultObj[col.name] = row[index];
      });
      results.push(resultObj);
    }

    return {
      id: crypto.randomUUID(),
      query,
      connectionId,
      results,
      rows,
      columns,
      executionTime: duration,
      rowsAffected: rowCount,
      executedAt: new Date()
    };
  }
}

export const databaseService = DatabaseService.getInstance();