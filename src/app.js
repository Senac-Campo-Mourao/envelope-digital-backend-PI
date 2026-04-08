const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cidadeRoutes = require('./routes/cidades');
const viagemRoutes = require('./routes/viagens');

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

app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origem (ex.: health checks, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
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