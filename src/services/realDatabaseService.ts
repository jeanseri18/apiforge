// Import dynamique pour éviter les erreurs côté client
let PgClient: any = null;
let mysql: any = null;

// Types pour MySQL
type MySQLConnection = {
  execute: (query: string, params?: any[]) => Promise<[any[], any[]]>;
  end: () => Promise<void>;
};

type MySQLModule = {
  createConnection: (config: any) => Promise<MySQLConnection>;
};

// Initialisation asynchrone des drivers
const initializeDrivers = async () => {
  // PostgreSQL uniquement côté serveur
  if (typeof window === 'undefined') {
    try {
      const pg = await import('pg');
      PgClient = pg.Client;
    } catch (error) {
      console.warn('PostgreSQL driver non disponible:', error);
    }
  }

  // MySQL - éviter le chargement côté client à cause des problèmes de compatibilité
  if (typeof window === 'undefined') {
    try {
      mysql = await import('mysql2/promise');
    } catch (error) {
      console.warn('MySQL driver non disponible:', error);
    }
  } else {
    console.warn('MySQL n\'est pas supporté côté client. Utilisez un environnement serveur.');
  }
};

// Initialiser les drivers au chargement du module
initializeDrivers();

import { DatabaseConnection, DatabaseTable, DatabaseColumn, QueryResult } from '../stores/databaseStore';

// Interface pour les connexions actives
interface ActiveConnection {
  id: string;
  type: 'postgresql' | 'mysql';
  client: any;
  isConnected: boolean;
}

// Service pour gérer les vraies connexions et opérations de base de données
export class RealDatabaseService {
  private static instance: RealDatabaseService;
  private activeConnections: Map<string, ActiveConnection> = new Map();

  static getInstance(): RealDatabaseService {
    if (!RealDatabaseService.instance) {
      RealDatabaseService.instance = new RealDatabaseService();
    }
    return RealDatabaseService.instance;
  }

  // Test de connexion réelle
  async testConnection(connection: Omit<DatabaseConnection, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      // Vérifier l'environnement avant d'initialiser les drivers
      if (typeof window !== 'undefined') {
        // Côté client - seules les connexions simulées sont supportées
        console.warn(`Les connexions ${connection.type} ne sont pas supportées côté client. Utilisez un environnement serveur pour les vraies connexions.`);
        return false;
      }
      
      // Attendre que les drivers soient initialisés (côté serveur uniquement)
      await initializeDrivers();
      
      if (connection.type === 'postgresql') {
        if (!PgClient) {
          throw new Error('PostgreSQL driver non disponible côté serveur.');
        }
        return await this.testPostgreSQLConnection(connection);
      } else if (connection.type === 'mysql') {
        if (!mysql) {
          throw new Error('MySQL driver non disponible côté serveur.');
        }
        return await this.testMySQLConnection(connection);
      } else {
        throw new Error(`Type de base de données non supporté: ${connection.type}`);
      }
    } catch (error) {
      console.error('Erreur de test de connexion:', error);
      throw error;
    }
  }

  // Test de connexion PostgreSQL
  private async testPostgreSQLConnection(connection: any): Promise<boolean> {
    if (!PgClient) {
      throw new Error('PostgreSQL n\'est pas disponible dans cet environnement.');
    }
    const client = new PgClient({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return true;
    } catch (error) {
      await client.end().catch(() => {});
      throw new Error(`Erreur de connexion PostgreSQL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Test de connexion MySQL
  private async testMySQLConnection(connection: any): Promise<boolean> {
    try {
      const mysqlConnection = await (mysql as MySQLModule).createConnection({
        host: connection.host,
        port: connection.port || 3306,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        ssl: connection.ssl ? {} : false,
        connectTimeout: 5000,
      });

      await mysqlConnection.execute('SELECT 1');
      await mysqlConnection.end();
      return true;
    } catch (error) {
      throw new Error(`Erreur de connexion MySQL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Établir une connexion persistante
  async connect(connection: DatabaseConnection): Promise<void> {
    try {
      // Vérifier l'environnement avant d'initialiser les drivers
      if (typeof window !== 'undefined') {
        throw new Error(`Les connexions ${connection.type} ne sont pas supportées côté client. Utilisez un environnement serveur.`);
      }
      
      // Attendre que les drivers soient initialisés (côté serveur uniquement)
      await initializeDrivers();
      
      if (this.activeConnections.has(connection.id)) {
        await this.disconnect(connection.id);
      }

      let client: any;

      if (connection.type === 'postgresql') {
        if (!PgClient) {
          throw new Error('PostgreSQL driver non disponible côté serveur.');
        }
        client = new PgClient({
          host: connection.host,
          port: connection.port,
          database: connection.database,
          user: connection.username,
          password: connection.password,
          ssl: connection.ssl ? { rejectUnauthorized: false } : false,
        });
        await client.connect();
      } else if (connection.type === 'mysql') {
        if (!mysql) {
          throw new Error('MySQL driver non disponible côté serveur.');
        }
        client = await (mysql as MySQLModule).createConnection({
          host: connection.host,
          port: connection.port || 3306,
          database: connection.database,
          user: connection.username,
          password: connection.password,
          ssl: connection.ssl ? {} : false,
        });
      } else {
        throw new Error(`Type de base de données non supporté: ${connection.type}`);
      }

      this.activeConnections.set(connection.id, {
        id: connection.id,
        type: connection.type,
        client,
        isConnected: true,
      });
    } catch (error) {
      throw new Error(`Impossible d'établir la connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Fermer une connexion
  async disconnect(connectionId: string): Promise<void> {
    const activeConnection = this.activeConnections.get(connectionId);
    if (!activeConnection) return;

    try {
      if (activeConnection.type === 'postgresql') {
        await (activeConnection.client as any).end();
      } else if (activeConnection.type === 'mysql') {
        await (activeConnection.client as MySQLConnection).end();
      }
    } catch (error) {
      console.error('Erreur lors de la fermeture de connexion:', error);
    } finally {
      this.activeConnections.delete(connectionId);
    }
  }

  // Chargement des tables réelles
  async loadTables(connectionId: string): Promise<DatabaseTable[]> {
    const activeConnection = this.activeConnections.get(connectionId);
    if (!activeConnection || !activeConnection.isConnected) {
      throw new Error('Connexion non établie');
    }

    try {
      if (activeConnection.type === 'postgresql') {
        return await this.loadPostgreSQLTables(activeConnection.client as any);
      } else if (activeConnection.type === 'mysql') {
        return await this.loadMySQLTables(activeConnection.client as MySQLConnection);
      } else {
        throw new Error(`Type de base de données non supporté: ${activeConnection.type}`);
      }
    } catch (error) {
      throw new Error(`Erreur lors du chargement des tables: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Chargement des tables PostgreSQL
  private async loadPostgreSQLTables(client: any): Promise<DatabaseTable[]> {
    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_type,
        COALESCE(s.n_tup_ins, 0) as row_count
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name
    `;

    const result = await client.query(tablesQuery);
    const tables: DatabaseTable[] = [];

    for (const row of result.rows) {
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `;

      const columnsResult = await client.query(columnsQuery, [row.table_name]);
      const columns: DatabaseColumn[] = columnsResult.rows.map((col: any) => ({
        name: col.column_name,
        type: col.character_maximum_length 
          ? `${col.data_type.toUpperCase()}(${col.character_maximum_length})`
          : col.data_type.toUpperCase(),
        nullable: col.is_nullable === 'YES',
        primaryKey: false, // Sera déterminé par une requête séparée si nécessaire
      }));

      tables.push({
        name: row.table_name,
        type: row.table_type === 'VIEW' ? 'view' : 'table',
        rowCount: parseInt(row.row_count) || 0,
        columns,
      });
    }

    return tables;
  }

  // Chargement des tables MySQL
  private async loadMySQLTables(connection: MySQLConnection): Promise<DatabaseTable[]> {
    const [tablesRows] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_TYPE as table_type,
        TABLE_ROWS as row_count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const tables: DatabaseTable[] = [];

    for (const row of tablesRows as any[]) {
      const [columnsRows] = await connection.execute(`
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
          COLUMN_KEY as column_key
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [row.table_name]);

      const columns: DatabaseColumn[] = (columnsRows as any[]).map((col: any) => ({
        name: col.column_name,
        type: col.character_maximum_length 
          ? `${col.data_type.toUpperCase()}(${col.character_maximum_length})`
          : col.data_type.toUpperCase(),
        nullable: col.is_nullable === 'YES',
        primaryKey: col.column_key === 'PRI',
      }));

      tables.push({
        name: row.table_name,
        type: row.table_type === 'VIEW' ? 'view' : 'table',
        rowCount: parseInt(row.row_count) || 0,
        columns,
      });
    }

    return tables;
  }

  // Exécution de requête réelle
  async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    const startTime = Date.now();
    const activeConnection = this.activeConnections.get(connectionId);
    
    if (!activeConnection || !activeConnection.isConnected) {
      throw new Error('Connexion non établie');
    }

    try {
      let result: any;
      let columns: DatabaseColumn[] = [];
      let rows: any[][] = [];
      let results: any[] = [];
      let rowsAffected = 0;

      if (activeConnection.type === 'postgresql') {
        const pgResult = await (activeConnection.client as any).query(query);
        
        if (pgResult.fields && pgResult.fields.length > 0) {
          columns = pgResult.fields.map((field: any) => ({
            name: field.name,
            type: this.getPostgreSQLTypeName(field.dataTypeID),
            nullable: true,
            primaryKey: false,
          }));
          
          rows = pgResult.rows.map((row: any) => 
            columns.map(col => row[col.name])
          );
          results = pgResult.rows;
        }
        
        rowsAffected = pgResult.rowCount || 0;
      } else if (activeConnection.type === 'mysql') {
        const [mysqlRows, fields] = await (activeConnection.client as MySQLConnection).execute(query);
        
        if (fields && fields.length > 0) {
          columns = fields.map((field: any) => ({
            name: field.name,
            type: this.getMySQLTypeName(field.type),
            nullable: true,
            primaryKey: false,
          }));
          
          if (Array.isArray(mysqlRows)) {
            rows = mysqlRows.map((row: any) => 
              columns.map(col => row[col.name])
            );
            results = mysqlRows as any[];
            rowsAffected = mysqlRows.length;
          }
        } else {
          // Pour les requêtes INSERT, UPDATE, DELETE
          rowsAffected = (mysqlRows as any).affectedRows || 0;
        }
      }

      const duration = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        query,
        connectionId,
        results,
        rows,
        columns,
        executionTime: duration,
        rowsAffected,
        executedAt: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new Error(`Erreur d'exécution de requête: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Mapping des types PostgreSQL
  private getPostgreSQLTypeName(typeId: number): string {
    const typeMap: { [key: number]: string } = {
      16: 'BOOLEAN',
      20: 'BIGINT',
      21: 'SMALLINT',
      23: 'INTEGER',
      25: 'TEXT',
      700: 'REAL',
      701: 'DOUBLE PRECISION',
      1043: 'VARCHAR',
      1082: 'DATE',
      1114: 'TIMESTAMP',
      1184: 'TIMESTAMPTZ',
    };
    return typeMap[typeId] || 'UNKNOWN';
  }

  // Mapping des types MySQL
  private getMySQLTypeName(type: number): string {
    const typeMap: { [key: number]: string } = {
      1: 'TINYINT',
      2: 'SMALLINT',
      3: 'INT',
      4: 'FLOAT',
      5: 'DOUBLE',
      7: 'TIMESTAMP',
      8: 'BIGINT',
      9: 'MEDIUMINT',
      10: 'DATE',
      11: 'TIME',
      12: 'DATETIME',
      13: 'YEAR',
      15: 'VARCHAR',
      16: 'BIT',
      245: 'JSON',
      246: 'DECIMAL',
      247: 'ENUM',
      248: 'SET',
      249: 'TINYBLOB',
      250: 'MEDIUMBLOB',
      251: 'LONGBLOB',
      252: 'BLOB',
      253: 'VARCHAR',
      254: 'CHAR',
    };
    return typeMap[type] || 'UNKNOWN';
  }

  // Fermer toutes les connexions
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.activeConnections.keys()).map(id => 
      this.disconnect(id)
    );
    await Promise.all(promises);
  }
}

export const realDatabaseService = RealDatabaseService.getInstance();