const { Pool } = require('pg');
require('dotenv').config();

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
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
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