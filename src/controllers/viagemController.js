// viagemController.js - Versão completa com todos os métodos
const pool = require('../database/connection');

// CREATE - Criar nova viagem
exports.createViagem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      dataInicio,
      dataFim,
      kmSaida,
      kmChegada,
      pesoSaida,
      pesoChegada,
      precoTonelada,
      cidadeSaida,
      cidadeChegada,
      abastecimentos = [],
      oficinas = [],
      pedagios = [],
      gorjetas = [],
      faltaMercadoria = null
    } = req.body;

    // Validar campos obrigatórios
    if (!dataInicio || !pesoSaida || !precoTonelada) {
      await connection.rollback();
      return res.status(400).json({ error: 'Campos obrigatórios: dataInicio, pesoSaida, precoTonelada' });
    }

    // Processar cidade de saída
    let cidadeSaidaId = null;
    if (cidadeSaida) {
      if (cidadeSaida.id) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [cidadeSaida.id]
        );
        cidadeSaidaId = existe.length > 0 ? cidadeSaida.id : null;
      }
      
      if (!cidadeSaidaId && cidadeSaida.cidade) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [cidadeSaida.cidade, cidadeSaida.estado_sigla]
        );
        
        if (existe.length > 0) {
          cidadeSaidaId = existe[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [cidadeSaida.cidade, cidadeSaida.estado_sigla]
          );
          cidadeSaidaId = result.insertId;
        }
      }
    }

    // Processar cidade de chegada
    let cidadeChegadaId = null;
    if (cidadeChegada) {
      if (cidadeChegada.id) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [cidadeChegada.id]
        );
        cidadeChegadaId = existe.length > 0 ? cidadeChegada.id : null;
      }
      
      if (!cidadeChegadaId && cidadeChegada.cidade) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [cidadeChegada.cidade, cidadeChegada.estado_sigla]
        );
        
        if (existe.length > 0) {
          cidadeChegadaId = existe[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [cidadeChegada.cidade, cidadeChegada.estado_sigla]
          );
          cidadeChegadaId = result.insertId;
        }
      }
    }

    // Calcular valores
    const peso = parseFloat(pesoSaida) || 0;
    const precoTon = parseFloat(precoTonelada) || 0;
    const precoTotal = peso * precoTon;
    const adiantamento = precoTotal * 0.8;
    const ordemPagamento = precoTotal * 0.8;

    // Criar resumo
    const [resumoResult] = await connection.execute(
      `INSERT INTO resumo (total_bruto, total_gastos, comissao, total_liquido) 
       VALUES (?, 0, 0, ?)`,
      [precoTotal, precoTotal]
    );
    const id_resumo = resumoResult.insertId;

    // Criar valor_frete
    const [valorFreteResult] = await connection.execute(
      `INSERT INTO valor_frete (preco_tonelada, adiantamento, total_preco_tonelada, ordem_pagamento) 
       VALUES (?, ?, ?, ?)`,
      [precoTon, adiantamento, precoTotal, ordemPagamento]
    );
    const id_valor_frete = valorFreteResult.insertId;

    // Criar viagem
    const [viagemResult] = await connection.execute(
      `INSERT INTO viagem (
        data_entrada, data_chegada, km_saida, km_entrada, 
        peso_saida, peso_chegada, id_motorista, id_saida, id_chegada,
        id_valor_frete, id_resumo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dataInicio,
        dataFim || dataInicio,
        parseFloat(kmSaida) || 0,
        parseFloat(kmChegada) || 0,
        peso,
        parseFloat(pesoChegada) || peso,
        req.userId,
        cidadeSaidaId,
        cidadeChegadaId,
        id_valor_frete,
        id_resumo
      ]
    );
    const id_viagem = viagemResult.insertId;

    // Inserir abastecimentos
    let totalAbastecimentos = 0;
    for (const abast of abastecimentos) {
      const litros = parseFloat(abast.litros) || 0;
      const valorLitros = parseFloat(abast.valorLitros) || 0;
      const total = litros * valorLitros;
      if (abast.data && litros > 0) {
        await connection.execute(
          'INSERT INTO abastecimento (data, km, posto, litros, valor_litros, total, id_viagem) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [abast.data, parseFloat(abast.km) || 0, abast.posto || '', litros, valorLitros, total, id_viagem]
        );
        totalAbastecimentos += total;
      }
    }

    // Inserir oficinas
    let totalOficinas = 0;
    for (const ofi of oficinas) {
      const preco = parseFloat(ofi.preco) || 0;
      if (ofi.data && preco > 0) {
        await connection.execute(
          'INSERT INTO oficina (data, km, tipo, preco, id_viagem) VALUES (?, ?, ?, ?, ?)',
          [ofi.data, parseFloat(ofi.km) || 0, ofi.tipo || '', preco, id_viagem]
        );
        totalOficinas += preco;
      }
    }

    // Inserir pedágios
    let totalPedagios = 0;
    for (const ped of pedagios) {
      const valor = parseFloat(ped.valor) || 0;
      if (valor > 0) {
        await connection.execute(
          'INSERT INTO pedagio (valor, id_viagem) VALUES (?, ?)',
          [valor, id_viagem]
        );
        totalPedagios += valor;
      }
    }

    // Inserir gorjetas
    let totalGorjetas = 0;
    for (const gorj of gorjetas) {
      const valor = parseFloat(gorj.valor) || 0;
      if (valor > 0) {
        await connection.execute(
          'INSERT INTO gorjeta (valor, id_viagem) VALUES (?, ?)',
          [valor, id_viagem]
        );
        totalGorjetas += valor;
      }
    }

    // Inserir falta de mercadoria
    let totalFaltaMercadoria = 0;
    if (faltaMercadoria) {
      const kilosFalta = parseFloat(faltaMercadoria.kilosFalta) || 0;
      const precoFalta = parseFloat(faltaMercadoria.precoFalta) || 0;
      totalFaltaMercadoria = kilosFalta * precoFalta;
      if (totalFaltaMercadoria > 0) {
        await connection.execute(
          'INSERT INTO falta_mercadoria (kilos_falta, preco_falta, total, id_viagem) VALUES (?, ?, ?, ?)',
          [kilosFalta, precoFalta, totalFaltaMercadoria, id_viagem]
        );
      }
    }

    // Atualizar resumo com os gastos
    const totalGastos = totalAbastecimentos + totalOficinas + totalPedagios + totalFaltaMercadoria + totalGorjetas;
    const comissao = precoTotal * 0.1;
    const totalLiquido = precoTotal - totalGastos - comissao;

    await connection.execute(
      `UPDATE resumo SET total_gastos = ?, comissao = ?, total_liquido = ? WHERE id_resumo = ?`,
      [totalGastos, comissao, totalLiquido, id_resumo]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '✅ Viagem criada com sucesso!',
      id: id_viagem
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao criar viagem:', error);
    res.status(500).json({ error: 'Erro ao criar viagem', details: error.message });
  } finally {
    connection.release();
  }
};

// GET ALL - Listar todas as viagens do motorista
exports.getViagens = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, 
              c1.cidade as cidade_saida, c1.estado_sigla as estado_saida,
              c2.cidade as cidade_chegada, c2.estado_sigla as estado_chegada,
              vf.preco_tonelada, vf.total_preco_tonelada as total_bruto,
              r.total_gastos, r.comissao, r.total_liquido
       FROM viagem v
       LEFT JOIN cidades c1 ON v.id_saida = c1.id_cidades
       LEFT JOIN cidades c2 ON v.id_chegada = c2.id_cidades
       LEFT JOIN valor_frete vf ON v.id_valor_frete = vf.id_valor_frete
       LEFT JOIN resumo r ON v.id_resumo = r.id_resumo
       WHERE v.id_motorista = ?
       ORDER BY v.data_entrada DESC`,
      [req.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao listar viagens:', error);
    res.status(500).json({ error: 'Erro ao listar viagens', details: error.message });
  }
};

// GET BY ID - Buscar uma viagem específica
exports.getViagemById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, 
              c1.cidade as cidade_saida, c1.estado_sigla as estado_saida,
              c2.cidade as cidade_chegada, c2.estado_sigla as estado_chegada,
              vf.preco_tonelada, vf.adiantamento, vf.total_preco_tonelada as total_bruto,
              r.total_gastos, r.comissao, r.total_liquido
       FROM viagem v
       LEFT JOIN cidades c1 ON v.id_saida = c1.id_cidades
       LEFT JOIN cidades c2 ON v.id_chegada = c2.id_cidades
       LEFT JOIN valor_frete vf ON v.id_valor_frete = vf.id_valor_frete
       LEFT JOIN resumo r ON v.id_resumo = r.id_resumo
       WHERE v.id_viagem = ? AND v.id_motorista = ?`,
      [req.params.id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    // Buscar detalhes adicionais
    const viagem = rows[0];

    // Buscar abastecimentos
    const [abastecimentos] = await pool.execute(
      'SELECT id_abastecimento, data, km, posto, litros, valor_litros AS valor_litro, total, id_viagem FROM abastecimento WHERE id_viagem = ? ORDER BY data',
      [req.params.id]
    );

    // Buscar oficinas
    const [oficinas] = await pool.execute(
      'SELECT * FROM oficina WHERE id_viagem = ? ORDER BY data',
      [req.params.id]
    );

    // Buscar pedágios
    const [pedagios] = await pool.execute(
      'SELECT * FROM pedagio WHERE id_viagem = ?',
      [req.params.id]
    );

    // Buscar gorjetas
    const [gorjetas] = await pool.execute(
      'SELECT * FROM gorjeta WHERE id_viagem = ?',
      [req.params.id]
    );

    // Buscar falta de mercadoria
    const [faltaMercadoria] = await pool.execute(
      'SELECT * FROM falta_mercadoria WHERE id_viagem = ?',
      [req.params.id]
    );

    res.json({
      ...viagem,
      abastecimentos,
      oficinas,
      pedagios,
      gorjetas,
      faltaMercadoria: faltaMercadoria[0] || null
    });

  } catch (error) {
    console.error('❌ Erro ao buscar viagem:', error);
    res.status(500).json({ error: 'Erro ao buscar viagem', details: error.message });
  }
};

// UPDATE viagem
exports.updateViagem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const viagemId = req.params.id;
    
    // Verificar se viagem existe e pertence ao usuário
    const [viagemExistente] = await connection.execute(
      'SELECT id_viagem, id_valor_frete, id_resumo FROM viagem WHERE id_viagem = ? AND id_motorista = ?',
      [viagemId, req.userId]
    );
    
    if (viagemExistente.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }
    
    const viagemAtual = viagemExistente[0];
    
    // Processar cidades
    let cidadeSaidaId = null;
    let cidadeChegadaId = null;
    
    if (req.body.cidadeSaida) {
      if (req.body.cidadeSaida.id) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [req.body.cidadeSaida.id]
        );
        cidadeSaidaId = existe.length > 0 ? req.body.cidadeSaida.id : null;
      }
      
      if (!cidadeSaidaId && req.body.cidadeSaida.cidade) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [req.body.cidadeSaida.cidade, req.body.cidadeSaida.estado_sigla]
        );
        
        if (existe.length > 0) {
          cidadeSaidaId = existe[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeSaida.cidade, req.body.cidadeSaida.estado_sigla]
          );
          cidadeSaidaId = result.insertId;
        }
      }
    }
    
    if (req.body.cidadeChegada) {
      if (req.body.cidadeChegada.id) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [req.body.cidadeChegada.id]
        );
        cidadeChegadaId = existe.length > 0 ? req.body.cidadeChegada.id : null;
      }
      
      if (!cidadeChegadaId && req.body.cidadeChegada.cidade) {
        const [existe] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [req.body.cidadeChegada.cidade, req.body.cidadeChegada.estado_sigla]
        );
        
        if (existe.length > 0) {
          cidadeChegadaId = existe[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeChegada.cidade, req.body.cidadeChegada.estado_sigla]
          );
          cidadeChegadaId = result.insertId;
        }
      }
    }
    
    // Calcular valores
    const pesoSaida = parseFloat(req.body.pesoSaida) || 0;
    const precoTonelada = parseFloat(req.body.precoTonelada) || 0;
    const precoTotal = pesoSaida * precoTonelada;
    const adiantamento = precoTotal * 0.8;
    const ordemPagamento = precoTotal * 0.8;
    
    // Atualizar valor_frete
    await connection.execute(
      `UPDATE valor_frete SET 
        preco_tonelada = ?, 
        adiantamento = ?, 
        total_preco_tonelada = ?, 
        ordem_pagamento = ?
       WHERE id_valor_frete = ?`,
      [precoTonelada, adiantamento, precoTotal, ordemPagamento, viagemAtual.id_valor_frete]
    );
    
    // Atualizar viagem
    await connection.execute(
      `UPDATE viagem SET 
        data_entrada = ?, 
        data_chegada = ?, 
        km_saida = ?, 
        km_entrada = ?,
        peso_saida = ?, 
        peso_chegada = ?,
        id_saida = ?,
        id_chegada = ?
       WHERE id_viagem = ?`,
      [
        req.body.dataInicio || new Date().toISOString().split('T')[0],
        req.body.dataFim || req.body.dataInicio || new Date().toISOString().split('T')[0],
        parseFloat(req.body.kmSaida) || 0,
        parseFloat(req.body.kmChegada) || 0,
        pesoSaida,
        parseFloat(req.body.pesoChegada) || pesoSaida,
        cidadeSaidaId,
        cidadeChegadaId,
        viagemId
      ]
    );
    
    // Deletar registros antigos
    await connection.execute('DELETE FROM abastecimento WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM oficina WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM pedagio WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM gorjeta WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM falta_mercadoria WHERE id_viagem = ?', [viagemId]);
    
    // Inserir novos registros
    let totalAbastecimentos = 0;
    if (req.body.abastecimentos) {
      for (const abast of req.body.abastecimentos) {
        const litros = parseFloat(abast.litros) || 0;
        const valorLitros = parseFloat(abast.valorLitros) || 0;
        const total = litros * valorLitros;
        if (abast.data && litros > 0) {
          await connection.execute(
            'INSERT INTO abastecimento (data, km, posto, litros, valor_litros, total, id_viagem) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [abast.data, parseFloat(abast.km) || 0, abast.posto || '', litros, valorLitros, total, viagemId]
          );
          totalAbastecimentos += total;
        }
      }
    }
    
    let totalOficinas = 0;
    if (req.body.oficinas) {
      for (const ofi of req.body.oficinas) {
        const preco = parseFloat(ofi.preco) || 0;
        if (ofi.data && preco > 0) {
          await connection.execute(
            'INSERT INTO oficina (data, km, tipo, preco, id_viagem) VALUES (?, ?, ?, ?, ?)',
            [ofi.data, parseFloat(ofi.km) || 0, ofi.tipo || '', preco, viagemId]
          );
          totalOficinas += preco;
        }
      }
    }
    
    let totalPedagios = 0;
    if (req.body.pedagios) {
      for (const ped of req.body.pedagios) {
        const valor = parseFloat(ped.valor) || 0;
        if (valor > 0) {
          await connection.execute(
            'INSERT INTO pedagio (valor, id_viagem) VALUES (?, ?)',
            [valor, viagemId]
          );
          totalPedagios += valor;
        }
      }
    }
    
    let totalGorjetas = 0;
    if (req.body.gorjetas) {
      for (const gorj of req.body.gorjetas) {
        const valor = parseFloat(gorj.valor) || 0;
        if (valor > 0) {
          await connection.execute(
            'INSERT INTO gorjeta (valor, id_viagem) VALUES (?, ?)',
            [valor, viagemId]
          );
          totalGorjetas += valor;
        }
      }
    }
    
    let totalFaltaMercadoria = 0;
    if (req.body.faltaMercadoria) {
      const kilosFalta = parseFloat(req.body.faltaMercadoria.kilosFalta) || 0;
      const precoFalta = parseFloat(req.body.faltaMercadoria.precoFalta) || 0;
      totalFaltaMercadoria = kilosFalta * precoFalta;
      if (totalFaltaMercadoria > 0) {
        await connection.execute(
          'INSERT INTO falta_mercadoria (kilos_falta, preco_falta, total, id_viagem) VALUES (?, ?, ?, ?)',
          [kilosFalta, precoFalta, totalFaltaMercadoria, viagemId]
        );
      }
    }
    
    // Atualizar resumo
    const totalGastos = totalAbastecimentos + totalOficinas + totalPedagios + totalFaltaMercadoria + totalGorjetas;
    const comissao = precoTotal * 0.1;
    const totalLiquido = precoTotal - totalGastos - comissao;
    
    await connection.execute(
      `UPDATE resumo SET total_bruto = ?, total_gastos = ?, comissao = ?, total_liquido = ? WHERE id_resumo = ?`,
      [precoTotal, totalGastos, comissao, totalLiquido, viagemAtual.id_resumo]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: '✅ Viagem atualizada com sucesso!',
      id: viagemId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao atualizar viagem:', error);
    res.status(500).json({ error: 'Erro ao atualizar viagem', details: error.message });
  } finally {
    connection.release();
  }
};

// DELETE viagem
exports.deleteViagem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const viagemId = req.params.id;
    
    // Verificar se viagem existe e pertence ao usuário
    const [viagem] = await connection.execute(
      'SELECT id_viagem, id_valor_frete, id_resumo FROM viagem WHERE id_viagem = ? AND id_motorista = ?',
      [viagemId, req.userId]
    );
    
    if (viagem.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }
    
    await connection.beginTransaction();
    
    // Deletar registros relacionados
    await connection.execute('DELETE FROM abastecimento WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM oficina WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM pedagio WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM gorjeta WHERE id_viagem = ?', [viagemId]);
    await connection.execute('DELETE FROM falta_mercadoria WHERE id_viagem = ?', [viagemId]);
    
    // Deletar viagem
    await connection.execute('DELETE FROM viagem WHERE id_viagem = ?', [viagemId]);
    
    // Deletar valor_frete e resumo
    await connection.execute('DELETE FROM valor_frete WHERE id_valor_frete = ?', [viagem[0].id_valor_frete]);
    await connection.execute('DELETE FROM resumo WHERE id_resumo = ?', [viagem[0].id_resumo]);
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: '🗑️ Viagem excluída com sucesso!' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao excluir viagem:', error);
    res.status(500).json({ error: 'Erro ao excluir viagem', details: error.message });
  } finally {
    connection.release();
  }
};