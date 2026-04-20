const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cidadeRoutes = require('./routes/cidades');
const viagemRoutes = require('./routes/viagens');
const migrateRoutes = require('./routes/migrate');

const app = express();

// CORS para produção (Cloudflare Pages) e desenvolvimento local
const allowedOrigins = [
  'https://envelope-digital-frontend-pi.pages.dev',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()).filter(Boolean)
    : [])
];

const wildcardHostSuffixes = [
  '.envelope-digital-frontend-pi.pages.dev'
];

function isOriginAllowed(origin) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { host } = new URL(origin);

    if (host === 'envelope-digital-frontend-pi.pages.dev') {
      return true;
    }

    if (wildcardHostSuffixes.some((suffix) => host.endsWith(suffix))) {
      return true;
    }

    // Suporte a padrões em FRONTEND_URLS, como: https://*.meudominio.com
    return allowedOrigins.some((allowedOrigin) => {
      if (!allowedOrigin.includes('*')) {
        return false;
      }

      const escaped = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');

      const pattern = new RegExp(`^${escaped}$`);
      return pattern.test(origin);
    });
  } catch (error) {
    return false;
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origem (ex.: health checks, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/cidades', cidadeRoutes);
app.use('/api/viagens', viagemRoutes);
app.use('/api/migrate', migrateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor rodando!',
    timestamp: new Date().toISOString()
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = app;