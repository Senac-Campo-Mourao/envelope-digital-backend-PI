// src/controllers/cidadeController.js
const Cidade = require('../models/Cidade');

exports.getCidades = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let cidades;
    
    if (search && search.trim()) {
      cidades = await Cidade.search(search, parseInt(limit));
    } else {
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

// NOVO: Criar ou buscar cidade pelo nome e UF
exports.getOrCreateCidade = async (req, res) => {
  try {
    const { nome, uf } = req.body;
    
    if (!nome || !uf) {
      return res.status(400).json({ error: 'Nome da cidade e UF são obrigatórios' });
    }
    
    const cidade = await Cidade.getOrCreate(nome, uf);
    
    res.json(cidade);
  } catch (error) {
    console.error('Erro ao criar/buscar cidade:', error);
    res.status(500).json({ error: 'Erro ao processar cidade' });
  }
};