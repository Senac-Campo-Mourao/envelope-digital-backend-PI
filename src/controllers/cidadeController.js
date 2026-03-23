const Cidade = require('../models/Cidade');

exports.getCidades = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let cidades;
    
    if (search && search.trim()) {
      // Busca com filtro
      cidades = await Cidade.search(search, parseInt(limit));
    } else {
      // Busca todas
      cidades = await Cidade.getAll(parseInt(limit));
    }
    
    res.json(cidades);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ error: 'Erro ao carregar cidades' });
  }
};

exports.getCidadeById = async (req, res) => {
  try {
    const cidade = await Cidade.getById(req.params.id);
    if (!cidade) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }
    res.json(cidade);
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    res.status(500).json({ error: 'Erro ao carregar cidade' });
  }
};