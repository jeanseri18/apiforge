const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connexions actives
const activeConnections = new Map();

// Health check endpoint
app.get('/api/database/health', (req, res) => {
  res.json({ status: 'ok', message: 'Database proxy server is running' });
});

// Test de connexion
app.post('/api/database/test-connection', async (req, res) => {
  try {
    const connection = req.body;
    let success = false;

    if (connection.type === 'postgresql') {
      success = await testPostgreSQLConnection(connection);
    } else if (connection.type === 'mysql') {
      success = await testMySQLConnection(connection);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Type de base de données non supporté: ${connection.type}` 
      });
    }

    res.json({ success });
  } catch (error) {
    console.error('Erreur de test de connexion:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Chargement des tables
app.post('/api/database/load-tables', async (req, res) => {
  try {
    const { connectionId, connection } = req.body;
    let tables = [];

    if (connection.type === 'postgresql') {
      tables = await loadPostgreSQLTables(connection);
    } else if (connection.type === 'mysql') {
      tables = await loadMySQLTables(connection);
    } else {
      return res.status(400).json({ 
        error: `Type de base de données non supporté: ${connection.type}` 
      });
    }

    res.json({ tables });
  } catch (error) {
    console.error('Erreur de chargement des tables:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Exécution de requête
app.post('/api/database/execute-query', async (req, res) => {
  try {
    const { connectionId, connection, query } = req.body;
    const startTime = Date.now();
    let result;

    if (connection.type === 'postgresql') {
      result = await executePostgreSQLQuery(connection, query);
    } else if (connection.type === 'mysql') {
      result = await executeMySQLQuery(connection, query);
    } else {
      return res.status(400).json({ 
        error: `Type de base de données non supporté: ${connection.type}` 
      });
    }

    const executionTime = Date.now() - startTime;
    
    const queryResult = {
      id: generateUUID(),
      query,
      connectionId,
      results: result.rows || [],
      rows: result.rows ? result.rows.map(row => Object.values(row)) : [],
      columns: result.fields || [],
      executionTime,
      rowsAffected: result.rowCount || 0,
      executedAt: new Date()
    };

    res.json(queryResult);
  } catch (error) {
    console.error('Erreur d\'exécution de requête:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Fonctions utilitaires PostgreSQL
async function testPostgreSQLConnection(connection) {
  const client = new Client({
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
    throw error;
  }
}

async function loadPostgreSQLTables(connection) {
  const client = new Client({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    
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
    const tables = [];

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
      const columns = columnsResult.rows.map(col => ({
        name: col.column_name,
        type: col.character_maximum_length 
          ? `${col.data_type.toUpperCase()}(${col.character_maximum_length})`
          : col.data_type.toUpperCase(),
        nullable: col.is_nullable === 'YES',
        primaryKey: false,
      }));

      tables.push({
        name: row.table_name,
        type: row.table_type === 'VIEW' ? 'view' : 'table',
        rowCount: parseInt(row.row_count) || 0,
        columns,
      });
    }

    await client.end();
    return tables;
  } catch (error) {
    await client.end().catch(() => {});
    throw error;
  }
}

async function executePostgreSQLQuery(connection, query) {
  const client = new Client({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    const result = await client.query(query);
    await client.end();
    
    return {
      rows: result.rows,
      fields: result.fields ? result.fields.map(field => ({
        name: field.name,
        type: getPostgreSQLTypeName(field.dataTypeID)
      })) : [],
      rowCount: result.rowCount
    };
  } catch (error) {
    await client.end().catch(() => {});
    throw error;
  }
}

// Fonctions utilitaires MySQL
async function testMySQLConnection(connection) {
  try {
    // Configuration de connexion avec gestion d'erreurs améliorée
    const connectionConfig = {
      host: connection.host,
      port: connection.port || 3306,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? {} : false,
      connectTimeout: 10000, // Augmenté à 10 secondes
      acquireTimeout: 10000,
      timeout: 10000
    };

    console.log(`🔍 Tentative de connexion MySQL à: ${connection.host}:${connection.port || 3306}`);
    
    const mysqlConnection = await mysql.createConnection(connectionConfig);
    await mysqlConnection.execute('SELECT 1');
    await mysqlConnection.end();
    
    console.log(`✅ Connexion MySQL réussie à: ${connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur de connexion MySQL à ${connection.host}:`, error.message);
    
    // Messages d'erreur plus explicites
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Impossible de résoudre le nom d'hôte '${connection.host}'. Vérifiez que l'adresse est correcte et que votre connexion internet fonctionne.`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Connexion refusée par le serveur ${connection.host}:${connection.port || 3306}. Vérifiez que le serveur MySQL est en cours d'exécution et accessible.`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`Timeout de connexion vers ${connection.host}. Le serveur met trop de temps à répondre.`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error(`Accès refusé pour l'utilisateur '${connection.username}'. Vérifiez vos identifiants.`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      throw new Error(`Base de données '${connection.database}' introuvable sur le serveur.`);
    }
    
    throw error;
  }
}

async function loadMySQLTables(connection) {
  // Configuration de connexion avec gestion d'erreurs améliorée
  const connectionConfig = {
    host: connection.host,
    port: connection.port || 3306,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? {} : false,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
  };

  console.log(`🔍 Chargement des tables MySQL depuis: ${connection.host}:${connection.port || 3306}`);
  
  const mysqlConnection = await mysql.createConnection(connectionConfig);

  try {
    const [tablesRows] = await mysqlConnection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_TYPE as table_type,
        TABLE_ROWS as row_count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const tables = [];

    for (const row of tablesRows) {
      const [columnsRows] = await mysqlConnection.execute(`
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

      const columns = columnsRows.map(col => ({
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

    await mysqlConnection.end();
    return tables;
  } catch (error) {
    await mysqlConnection.end().catch(() => {});
    throw error;
  }
}

async function executeMySQLQuery(connection, query) {
  // Configuration de connexion avec gestion d'erreurs améliorée
  const connectionConfig = {
    host: connection.host,
    port: connection.port || 3306,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? {} : false,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
  };

  console.log(`🔍 Exécution de requête MySQL sur: ${connection.host}:${connection.port || 3306}`);
  
  const mysqlConnection = await mysql.createConnection(connectionConfig);

  try {
    const [rows, fields] = await mysqlConnection.execute(query);
    await mysqlConnection.end();
    
    return {
      rows: Array.isArray(rows) ? rows : [],
      fields: fields ? fields.map(field => ({
        name: field.name,
        type: getMySQLTypeName(field.type)
      })) : [],
      rowCount: Array.isArray(rows) ? rows.length : (rows.affectedRows || 0)
    };
  } catch (error) {
    await mysqlConnection.end().catch(() => {});
    throw error;
  }
}

// Fonctions utilitaires
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getPostgreSQLTypeName(typeId) {
  const typeMap = {
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

function getMySQLTypeName(type) {
  const typeMap = {
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Database Proxy Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/database`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/database/health`);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});