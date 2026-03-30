// src/controllers/viagemController.js
const Abastecimento = require('../models/Abastecimento');
const Oficina = require('../models/Oficina');
const Pedagio = require('../models/Pedagio');
const Gorjeta = require('../models/Gorjeta');
const Cidade = require('../models/Cidade');
const pool = require('../database/connection');

exports.createViagem = async (req, res) => {
  console.log('=== DADOS RECEBIDOS ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('UserId:', req.userId);
  
  if (!req.userId) {
    console.log('❌ Usuário não autenticado!');
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ==================== PROCESSAR CIDADES ====================
    let cidadeSaidaId = null;
    let cidadeChegadaId = null;
    
    // Processar cidade de saída
    if (req.body.cidadeSaida) {
      if (typeof req.body.cidadeSaida === 'object' && req.body.cidadeSaida.id) {
        // Verificar se a cidade existe no banco
        const [cidadeExistente] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [req.body.cidadeSaida.id]
        );
        if (cidadeExistente.length > 0) {
          cidadeSaidaId = req.body.cidadeSaida.id;
        } else {
          // Criar nova cidade
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeSaida.cidade, req.body.cidadeSaida.estado_sigla]
          );
          cidadeSaidaId = result.insertId;
        }
      } else if (typeof req.body.cidadeSaida === 'object' && req.body.cidadeSaida.cidade) {
        // Buscar ou criar cidade por nome e UF
        const [existing] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [req.body.cidadeSaida.cidade, req.body.cidadeSaida.estado_sigla]
        );
        
        if (existing.length > 0) {
          cidadeSaidaId = existing[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeSaida.cidade, req.body.cidadeSaida.estado_sigla]
          );
          cidadeSaidaId = result.insertId;
        }
      }
    }
    
    // Processar cidade de chegada
    if (req.body.cidadeChegada) {
      if (typeof req.body.cidadeChegada === 'object' && req.body.cidadeChegada.id) {
        const [cidadeExistente] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE id_cidades = ?',
          [req.body.cidadeChegada.id]
        );
        if (cidadeExistente.length > 0) {
          cidadeChegadaId = req.body.cidadeChegada.id;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeChegada.cidade, req.body.cidadeChegada.estado_sigla]
          );
          cidadeChegadaId = result.insertId;
        }
      } else if (typeof req.body.cidadeChegada === 'object' && req.body.cidadeChegada.cidade) {
        const [existing] = await connection.execute(
          'SELECT id_cidades FROM cidades WHERE cidade = ? AND estado_sigla = ?',
          [req.body.cidadeChegada.cidade, req.body.cidadeChegada.estado_sigla]
        );
        
        if (existing.length > 0) {
          cidadeChegadaId = existing[0].id_cidades;
        } else {
          const [result] = await connection.execute(
            'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
            [req.body.cidadeChegada.cidade, req.body.cidadeChegada.estado_sigla]
          );
          cidadeChegadaId = result.insertId;
        }
      }
    }
    
    // Garantir que temos IDs válidos (usar fallback se necessário)
    if (!cidadeSaidaId) {
      // Buscar primeira cidade disponível
      const [primeiraCidade] = await connection.execute('SELECT id_cidades FROM cidades LIMIT 1');
      if (primeiraCidade.length > 0) {
        cidadeSaidaId = primeiraCidade[0].id_cidades;
      } else {
        // Criar cidade padrão
        const [result] = await connection.execute(
          'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
          ['Cidade Padrão', 'XX']
        );
        cidadeSaidaId = result.insertId;
      }
    }
    
    if (!cidadeChegadaId) {
      const [primeiraCidade] = await connection.execute('SELECT id_cidades FROM cidades LIMIT 1');
      if (primeiraCidade.length > 0) {
        cidadeChegadaId = primeiraCidade[0].id_cidades;
      } else {
        const [result] = await connection.execute(
          'INSERT INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
          ['Cidade Padrão', 'XX']
        );
        cidadeChegadaId = result.insertId;
      }
    }
    
    console.log('📍 Cidade Saída ID:', cidadeSaidaId);
    console.log('📍 Cidade Chegada ID:', cidadeChegadaId);
    
    // ==================== CALCULAR VALORES ====================
    const pesoSaida = parseFloat(req.body.pesoSaida) || 0;
    const precoTonelada = parseFloat(req.body.precoTonelada) || 0;
    const precoTotal = pesoSaida * precoTonelada;
    const adiantamento = precoTotal * 0.8;
    const ordemPagamento = precoTotal * 0.8;
    
    // ==================== CRIAR RESUMO ====================
    const [resumoResult] = await connection.execute(
      `INSERT INTO resumo (total_bruto, total_gastos, comissao, total_liquido) 
       VALUES (?, 0, 0, ?)`,
      [precoTotal, precoTotal]
    );
    const id_resumo = resumoResult.insertId;
    console.log('✅ Resumo criado, ID:', id_resumo);

    // ==================== CRIAR VALOR_FRETE ====================
    const [valorFreteResult] = await connection.execute(
      `INSERT INTO valor_frete (preco_tonelada, adiantamento, total_preco_tonelada, ordem_pagamento) 
       VALUES (?, ?, ?, ?)`,
      [precoTonelada, adiantamento, precoTotal, ordemPagamento]
    );
    const id_valor_frete = valorFreteResult.insertId;
    console.log('✅ Valor frete criado, ID:', id_valor_frete);

    // ==================== CRIAR VIAGEM ====================
    const dataInicio = req.body.dataInicio || new Date().toISOString().split('T')[0];
    const dataFim = req.body.dataFim || dataInicio;
    const kmSaida = parseFloat(req.body.kmSaida) || 0;
    const kmChegada = parseFloat(req.body.kmChegada) || 0;
    const pesoChegada = parseFloat(req.body.pesoChegada) || pesoSaida;
    
    const [viagemResult] = await connection.execute(
      `INSERT INTO viagem (
        data_entrada, data_chegada, km_saida, km_entrada, 
        peso_saida, peso_chegada, id_motorista, id_saida, id_chegada,
        id_valor_frete, id_resumo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dataInicio,
        dataFim,
        kmSaida,
        kmChegada,
        pesoSaida,
        pesoChegada,
        req.userId,
        cidadeSaidaId,
        cidadeChegadaId,
        id_valor_frete,
        id_resumo
      ]
    );
    const viagemId = viagemResult.insertId;
    console.log('✅ Viagem criada, ID:', viagemId);

    // ==================== SALVAR GORJETAS ====================
    let totalGorjetas = 0;
    if (req.body.gorjetas && req.body.gorjetas.length > 0) {
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
      console.log('✅ Gorjetas salvas, total:', totalGorjetas);
    }
    
    // ==================== SALVAR ABASTECIMENTOS ====================
    let totalAbastecimentos = 0;
    if (req.body.abastecimentos && req.body.abastecimentos.length > 0) {
      for (const abast of req.body.abastecimentos) {
        const litros = parseFloat(abast.litros) || 0;
        const valorLitros = parseFloat(abast.valorLitros) || 0;
        const total = litros * valorLitros;
        
        if (abast.data && litros > 0) {
          await connection.execute(
            `INSERT INTO abastecimento (data, km, posto, litros, valor_litros, total, id_viagem)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              abast.data, 
              parseFloat(abast.km) || 0, 
              abast.posto || '', 
              litros, 
              valorLitros, 
              total, 
              viagemId
            ]
          );
          totalAbastecimentos += total;
        }
      }
      console.log('✅ Abastecimentos salvos, total:', totalAbastecimentos);
    }
    
    // ==================== SALVAR OFICINAS ====================
    let totalOficinas = 0;
    if (req.body.oficinas && req.body.oficinas.length > 0) {
      for (const ofi of req.body.oficinas) {
        const preco = parseFloat(ofi.preco) || 0;
        if (ofi.data && preco > 0) {
          await connection.execute(
            `INSERT INTO oficina (data, km, tipo, preco, id_viagem)
             VALUES (?, ?, ?, ?, ?)`,
            [
              ofi.data, 
              parseFloat(ofi.km) || 0, 
              ofi.tipo || '', 
              preco, 
              viagemId
            ]
          );
          totalOficinas += preco;
        }
      }
      console.log('✅ Oficinas salvas, total:', totalOficinas);
    }
    
    // ==================== SALVAR PEDÁGIOS ====================
    let totalPedagios = 0;
    if (req.body.pedagios && req.body.pedagios.length > 0) {
      for (const ped of req.body.pedagios) {
        const valor = parseFloat(ped.valor) || 0;
        if (valor > 0) {
          await connection.execute(
            `INSERT INTO pedagio (valor, id_viagem) VALUES (?, ?)`,
            [valor, viagemId]
          );
          totalPedagios += valor;
        }
      }
      console.log('✅ Pedágios salvos, total:', totalPedagios);
    }
    
    // ==================== SALVAR FALTA DE MERCADORIA ====================
    let totalFaltaMercadoria = 0;
    if (req.body.faltaMercadoria) {
      const kilosFalta = parseFloat(req.body.faltaMercadoria.kilosFalta) || 0;
      const precoFalta = parseFloat(req.body.faltaMercadoria.precoFalta) || 0;
      totalFaltaMercadoria = kilosFalta * precoFalta;
      
      if (totalFaltaMercadoria > 0) {
        await connection.execute(
          `INSERT INTO falta_mercadoria (kilos_falta, preco_falta, total, id_viagem)
           VALUES (?, ?, ?, ?)`,
          [kilosFalta, precoFalta, totalFaltaMercadoria, viagemId]
        );
        console.log('✅ Falta mercadoria salva, total:', totalFaltaMercadoria);
      }
    }
    
    // ==================== ATUALIZAR RESUMO COM GASTOS TOTAIS ====================
    const totalGastos = totalAbastecimentos + totalOficinas + totalPedagios + totalFaltaMercadoria + totalGorjetas;
    const comissao = (precoTotal - totalGastos) * 0.1;
    const totalLiquido = precoTotal - totalGastos - comissao;
    
    await connection.execute(
      `UPDATE resumo SET total_gastos = ?, comissao = ?, total_liquido = ? WHERE id_resumo = ?`,
      [totalGastos, comissao, totalLiquido, id_resumo]
    );
    console.log('✅ Resumo atualizado com gastos totais');
    
    // ==================== COMMIT ====================
    await connection.commit();
    console.log('🎉 Transação concluída com sucesso!');
    
    res.status(201).json({ 
      success: true,
      id: viagemId, 
      message: '✅ Viagem salva com sucesso!'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao criar viagem:', error);
    console.error('❌ SQL:', error.sql);
    console.error('❌ Mensagem:', error.sqlMessage);
    res.status(500).json({ 
      error: 'Erro ao salvar viagem',
      details: error.sqlMessage || error.message
    });
  } finally {
    connection.release();
  }
};

exports.getViagens = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, 
              c1.cidade as cidade_saida, c1.estado_sigla as estado_saida,
              c2.cidade as cidade_chegada, c2.estado_sigla as estado_chegada,
              vf.total_preco_tonelada as total_bruto,
              r.total_liquido
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
    console.error('Erro ao listar viagens:', error);
    res.status(500).json({ error: 'Erro ao carregar viagens' });
  }
};

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
    
    const viagem = rows[0];
    
    // Buscar dados relacionados
    const [abastecimentos] = await pool.execute(
      'SELECT * FROM abastecimento WHERE id_viagem = ? ORDER BY data',
      [req.params.id]
    );
    const [oficinas] = await pool.execute(
      'SELECT * FROM oficina WHERE id_viagem = ? ORDER BY data',
      [req.params.id]
    );
    const [pedagios] = await pool.execute(
      'SELECT * FROM pedagio WHERE id_viagem = ?',
      [req.params.id]
    );
    const [gorjetas] = await pool.execute(
      'SELECT * FROM gorjeta WHERE id_viagem = ?',
      [req.params.id]
    );
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
    console.error('Erro ao buscar viagem:', error);
    res.status(500).json({ error: 'Erro ao carregar viagem' });
  }
};