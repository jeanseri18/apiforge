import { DatabaseConnection } from '../stores/databaseStore';

export interface PooledConnection {
  id: string;
  connection: DatabaseConnection;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  useCount: number;
}

export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  maxIdleTime: number; // en millisecondes
  connectionTimeout: number; // en millisecondes
  retryAttempts: number;
  retryDelay: number; // en millisecondes
}

export class ConnectionPool {
  private pools: Map<string, PooledConnection[]> = new Map();
  private config: PoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: 10,
      minConnections: 2,
      maxIdleTime: 30000, // 30 secondes
      connectionTimeout: 5000, // 5 secondes
      retryAttempts: 3,
      retryDelay: 1000, // 1 seconde
      ...config
    };

    // Démarrer le nettoyage automatique des connexions inactives
    this.startCleanup();
  }

  /**
   * Obtenir une connexion du pool
   */
  async getConnection(connectionConfig: DatabaseConnection): Promise<PooledConnection> {
    const poolKey = this.getPoolKey(connectionConfig);
    let pool = this.pools.get(poolKey);

    if (!pool) {
      pool = [];
      this.pools.set(poolKey, pool);
    }

    // Chercher une connexion disponible
    const availableConnection = pool.find(conn => !conn.isActive);
    
    if (availableConnection) {
      availableConnection.isActive = true;
      availableConnection.lastUsed = new Date();
      availableConnection.useCount++;
      return availableConnection;
    }

    // Si le pool n'est pas plein, créer une nouvelle connexion
    if (pool.length < this.config.maxConnections) {
      const newConnection = await this.createConnection(connectionConfig);
      pool.push(newConnection);
      return newConnection;
    }

    // Attendre qu'une connexion se libère
    return this.waitForAvailableConnection(poolKey);
  }

  /**
   * Libérer une connexion
   */
  releaseConnection(connectionId: string): void {
    for (const [poolKey, pool] of this.pools.entries()) {
      const connection = pool.find(conn => conn.id === connectionId);
      if (connection) {
        connection.isActive = false;
        connection.lastUsed = new Date();
        break;
      }
    }
  }

  /**
   * Fermer toutes les connexions d'un pool
   */
  async closePool(connectionConfig: DatabaseConnection): Promise<void> {
    const poolKey = this.getPoolKey(connectionConfig);
    const pool = this.pools.get(poolKey);
    
    if (pool) {
      // Fermer toutes les connexions
      await Promise.all(pool.map(conn => this.closeConnection(conn)));
      this.pools.delete(poolKey);
    }
  }

  /**
   * Fermer tous les pools
   */
  async closeAllPools(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    for (const [poolKey, pool] of this.pools.entries()) {
      closePromises.push(
        Promise.all(pool.map(conn => this.closeConnection(conn))).then(() => {})
      );
    }
    
    await Promise.all(closePromises);
    this.pools.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Obtenir les statistiques du pool
   */
  getPoolStats(connectionConfig?: DatabaseConnection): PoolStats | Map<string, PoolStats> {
    if (connectionConfig) {
      const poolKey = this.getPoolKey(connectionConfig);
      const pool = this.pools.get(poolKey) || [];
      return this.calculatePoolStats(pool);
    }

    const allStats = new Map<string, PoolStats>();
    for (const [poolKey, pool] of this.pools.entries()) {
      allStats.set(poolKey, this.calculatePoolStats(pool));
    }
    return allStats;
  }

  /**
   * Créer une nouvelle connexion
   */
  private async createConnection(connectionConfig: DatabaseConnection): Promise<PooledConnection> {
    const connectionId = this.generateConnectionId();
    
    // Simuler la création d'une connexion avec retry
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Ici, vous intégreriez avec votre service de base de données réel
        await this.testConnection(connectionConfig);
        
        return {
          id: connectionId,
          connection: { ...connectionConfig },
          isActive: true,
          lastUsed: new Date(),
          createdAt: new Date(),
          useCount: 1
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    
    throw new Error(`Failed to create connection after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Tester une connexion
   */
  private async testConnection(connectionConfig: DatabaseConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      // Simuler un test de connexion
      setTimeout(() => {
        clearTimeout(timeout);
        if (Math.random() > 0.1) { // 90% de succès
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      }, 100);
    });
  }

  /**
   * Attendre qu'une connexion se libère
   */
  private async waitForAvailableConnection(poolKey: string): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for available connection'));
      }, this.config.connectionTimeout);

      const checkInterval = setInterval(() => {
        const pool = this.pools.get(poolKey);
        if (pool) {
          const availableConnection = pool.find(conn => !conn.isActive);
          if (availableConnection) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            availableConnection.isActive = true;
            availableConnection.lastUsed = new Date();
            availableConnection.useCount++;
            resolve(availableConnection);
          }
        }
      }, 100);
    });
  }

  /**
   * Fermer une connexion
   */
  private async closeConnection(connection: PooledConnection): Promise<void> {
    // Ici, vous fermeriez la connexion réelle à la base de données
    console.log(`Closing connection ${connection.id}`);
  }

  /**
   * Générer une clé unique pour le pool
   */
  private getPoolKey(connection: DatabaseConnection): string {
    return `${connection.type}_${connection.host}_${connection.port}_${connection.database}_${connection.username}`;
  }

  /**
   * Générer un ID unique pour la connexion
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculer les statistiques d'un pool
   */
  private calculatePoolStats(pool: PooledConnection[]): PoolStats {
    const activeConnections = pool.filter(conn => conn.isActive).length;
    const idleConnections = pool.length - activeConnections;
    const totalUseCount = pool.reduce((sum, conn) => sum + conn.useCount, 0);
    const avgUseCount = pool.length > 0 ? totalUseCount / pool.length : 0;
    const poolUtilization = this.config.maxConnections > 0 ? (pool.length / this.config.maxConnections) * 100 : 0;
    
    return {
      totalConnections: pool.length,
      activeConnections,
      idleConnections,
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections,
      avgUseCount: Math.round(avgUseCount * 100) / 100,
      oldestConnection: pool.length > 0 ? Math.min(...pool.map(conn => conn.createdAt.getTime())) : null,
      newestConnection: pool.length > 0 ? Math.max(...pool.map(conn => conn.createdAt.getTime())) : null,
      poolUtilization: Math.round(poolUtilization * 100) / 100
    };
  }

  /**
   * Démarrer le nettoyage automatique
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.maxIdleTime / 2);
  }

  /**
   * Nettoyer les connexions inactives
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    
    for (const [poolKey, pool] of this.pools.entries()) {
      const connectionsToRemove: PooledConnection[] = [];
      
      for (let i = pool.length - 1; i >= 0; i--) {
        const connection = pool[i];
        const idleTime = now.getTime() - connection.lastUsed.getTime();
        
        // Supprimer les connexions inactives qui dépassent le temps limite
        if (!connection.isActive && 
            idleTime > this.config.maxIdleTime && 
            pool.length > this.config.minConnections) {
          connectionsToRemove.push(connection);
          pool.splice(i, 1);
        }
      }
      
      // Fermer les connexions supprimées
      await Promise.all(connectionsToRemove.map(conn => this.closeConnection(conn)));
    }
  }

  /**
   * Utilitaire pour créer un délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  minConnections: number;
  avgUseCount: number;
  oldestConnection: number | null;
  newestConnection: number | null;
  poolUtilization: number; // percentage
}

// Instance singleton
const connectionPool = new ConnectionPool();

export default connectionPool;
export { connectionPool };