const { Pool } = require('pg');
require('dotenv').config();

const env = {
  host: process.env.DB_HOST || process.env.AZURE_POSTGRESQL_HOST,
  port: process.env.DB_PORT || process.env.AZURE_POSTGRESQL_PORT || '5432',
  user: process.env.DB_USER || process.env.AZURE_POSTGRESQL_USER || process.env.AZURE_POSTGRESQL_USERNAME,
  password: process.env.DB_PASSWORD || process.env.AZURE_POSTGRESQL_PASSWORD,
  database: process.env.DB_NAME || process.env.AZURE_POSTGRESQL_DATABASE,
  poolMax: process.env.DB_POOL_MAX || process.env.AZURE_POSTGRESQL_POOL_MAX || '10',
  ssl: process.env.DB_SSL || process.env.AZURE_POSTGRESQL_SSL || 'true',
};

const toPgPlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
};

const buildResult = (sql, queryResult) => {
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith('SELECT') || normalized.startsWith('WITH')) {
    return [queryResult.rows, queryResult.fields || []];
  }

  const result = {
    affectedRows: queryResult.rowCount,
    rowCount: queryResult.rowCount,
  };

  if (normalized.startsWith('INSERT') && queryResult.rows && queryResult.rows[0]) {
    const inserted = queryResult.rows[0];
    const idKey = Object.keys(inserted).find((key) => key === 'id' || key.startsWith('id_'));
    if (idKey) {
      result.insertId = inserted[idKey];
    }
  }

  return [result, queryResult.fields || []];
};

const ensureReturningForInsert = (sql) => {
  const normalized = sql.trim().toUpperCase();
  if (normalized.startsWith('INSERT') && !normalized.includes('RETURNING')) {
    return `${sql} RETURNING *`;
  }
  return sql;
};

const dbConfig = {
  host: env.host,
  port: parseInt(env.port, 10),
  user: env.user,
  password: env.password,
  database: env.database,
  max: parseInt(env.poolMax, 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if ((env.ssl || '').toLowerCase() === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pgPool = new Pool(dbConfig);

const executeWithClient = async (client, sql, params = []) => {
  const statement = ensureReturningForInsert(toPgPlaceholders(sql));
  const queryResult = await client.query(statement, params);
  return buildResult(sql, queryResult);
};

const pool = {
  execute: async (sql, params = []) => executeWithClient(pgPool, sql, params),
  getConnection: async () => {
    const client = await pgPool.connect();

    return {
      execute: async (sql, params = []) => executeWithClient(client, sql, params),
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  },
};

module.exports = pool;