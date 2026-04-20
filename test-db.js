require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  try {
    console.log('Tentando conectar ao banco...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    const client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: (process.env.DB_SSL || '').toLowerCase() === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
    });

    await client.connect();
    
    console.log('✅ Conectado ao banco de dados com sucesso!');
    
    const { rows } = await client.query('SELECT 1 as test');
    console.log('✅ Query de teste executada:', rows);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    console.error('Detalhes:', error);
  }
}

testConnection();