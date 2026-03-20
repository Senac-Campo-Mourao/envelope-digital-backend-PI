cat > src/controllers/cidadeController.js << 'EOF'
const Cidade = require('../models/Cidade');

exports.getCidades = async (req, res) => {
  try {
    const cidades = await Cidade.getAll();
    res.json(cidades);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ error: 'Erro ao carregar cidades' });
  }
};
EOF