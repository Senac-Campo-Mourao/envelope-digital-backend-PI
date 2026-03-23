const Viagem = require('../models/Viagem');

exports.createViagem = async (req, res) => {
  try {
    const viagemData = {
      ...req.body,
      id_motorista: req.userId,
      precoTotal: req.body.pesoSaida * req.body.precoTonelada,
      adiantamento: req.body.pesoSaida * req.body.precoTonelada * 0.8,
      ordemPagamento: req.body.pesoSaida * req.body.precoTonelada * 0.8
    };
    
    const viagemId = await Viagem.create(viagemData);
    
    res.status(201).json({ 
      id: viagemId, 
      message: 'Viagem criada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar viagem:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar viagem',
      details: error.message 
    });
  }
};

exports.getViagens = async (req, res) => {
  try {
    const viagens = await Viagem.getByMotoristaId(req.userId);
    res.json(viagens);
  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    res.status(500).json({ error: 'Erro ao carregar viagens' });
  }
};

exports.getViagemById = async (req, res) => {
  try {
    const viagem = await Viagem.getById(req.params.id, req.userId);
    if (!viagem) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }
    res.json(viagem);
  } catch (error) {
    console.error('Erro ao buscar viagem:', error);
    res.status(500).json({ error: 'Erro ao carregar viagem' });
  }
};