const Viagem = require('../models/Viagem');
const Abastecimento = require('../models/Abastecimento');
const Oficina = require('../models/Oficina');
const Pedagio = require('../models/Pedagio');
const Gorjeta = require('../models/Gorjeta');
const pool = require('../database/connection');

exports.createViagem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const viagemData = {
      ...req.body,
      id_motorista: req.userId,
      precoTotal: (req.body.pesoSaida || 0) * (req.body.precoTonelada || 0),
      adiantamento: (req.body.pesoSaida || 0) * (req.body.precoTonelada || 0) * 0.8,
      ordemPagamento: (req.body.pesoSaida || 0) * (req.body.precoTonelada || 0) * 0.8
    };
    
    // Criar viagem
    const viagemId = await Viagem.create(viagemData, connection);
    
    // Criar abastecimentos
    if (req.body.abastecimentos && req.body.abastecimentos.length > 0) {
      for (const abast of req.body.abastecimentos) {
        await Abastecimento.create(abast, viagemId, connection);
      }
    }
    
    // Criar oficinas
    if (req.body.oficinas && req.body.oficinas.length > 0) {
      for (const ofi of req.body.oficinas) {
        await Oficina.create(ofi, viagemId, connection);
      }
    }
    
    // Criar pedágios
    if (req.body.pedagios && req.body.pedagios.length > 0) {
      for (const ped of req.body.pedagios) {
        await Pedagio.create(ped, viagemId, connection);
      }
    }
    
    // Criar gorjetas
    if (req.body.gorjetas && req.body.gorjetas.length > 0) {
      for (const gorj of req.body.gorjetas) {
        await Gorjeta.create(gorj, viagemId, connection);
      }
    }
    
    await connection.commit();
    
    res.status(201).json({ 
      id: viagemId, 
      message: 'Viagem criada com sucesso!' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar viagem:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar viagem',
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

exports.getViagens = async (req, res) => {
  try {
    const viagens = await Viagem.getByMotoristaId(req.userId);
    res.json(viagens);
  } catch (error) {
    console.error('Erro ao listar viagens:', error);
    res.status(500).json({ error: 'Erro ao carregar viagens' });
  }
};

exports.getViagemById = async (req, res) => {
  try {
    const viagem = await Viagem.getById(req.params.id, req.userId);
    if (!viagem) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }
    
    // Buscar dados complementares
    const abastecimentos = await Abastecimento.getByViagemId(req.params.id);
    const oficinas = await Oficina.getByViagemId(req.params.id);
    const pedagios = await Pedagio.getByViagemId(req.params.id);
    const gorjetas = await Gorjeta.getByViagemId(req.params.id);
    
    res.json({
      ...viagem,
      abastecimentos,
      oficinas,
      pedagios,
      gorjetas
    });
    
  } catch (error) {
    console.error('Erro ao buscar viagem:', error);
    res.status(500).json({ error: 'Erro ao carregar viagem' });
  }
};