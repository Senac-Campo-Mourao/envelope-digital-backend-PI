cat > src/app.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cidadeRoutes = require('./routes/cidades');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/cidades', cidadeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor rodando!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
EOF