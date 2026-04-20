const fs = require('fs/promises');
const path = require('path');
const pool = require('./database/connection');

const SCRIPT_PATH = path.resolve(__dirname, '../script-bd.sql');

function parseSqlStatements(sqlContent) {
  return sqlContent
    .replace(/--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runMigration() {
  const sqlContent = await fs.readFile(SCRIPT_PATH, 'utf8');
  const statements = parseSqlStatements(sqlContent);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const statement of statements) {
      await connection.execute(statement);
    }

    await connection.commit();

    return {
      success: true,
      message: 'Migracao executada com sucesso',
      statementsExecuted: statements.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  runMigration,
};
