const pool = require('../database/connection');

class Viagem {
  static async create(viagemData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Criar resumo
      const [resumoResult] = await connection.execute(
        `INSERT INTO resumo (total_bruto, total_gastos, comicao, total_liquido) 
         VALUES (?, ?, ?, ?)`,
        [viagemData.resumo.totalBruto, viagemData.resumo.totalGastos, 
         viagemData.resumo.comissao, viagemData.resumo.totalLiquido]
      );
      const id_resumo = resumoResult.insertId;

      // 2. Criar valor_frete
      const [valorFreteResult] = await connection.execute(
        `INSERT INTO valor_frete (preco_tonelada, adintamento, total_preco_tonelada, ordem_pagamento) 
         VALUES (?, ?, ?, ?)`,
        [viagemData.precoTonelada, viagemData.adiantamento, viagemData.precoTotal, viagemData.ordemPagamento]
      );
      const id_valor_frete = valorFreteResult.insertId;

      // 3. Criar abastecimentos
      let id_abastecimento = null;
      if (viagemData.abastecimentos && viagemData.abastecimentos.length > 0) {
        for (const abast of viagemData.abastecimentos) {
          const [abastResult] = await connection.execute(
            `INSERT INTO abastecimento (id_abastecimento, data, km, posto, litros, valor_litros, total) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [abast.id, abast.data, abast.km, abast.posto, abast.litros, abast.valorLitros, abast.total]
          );
          id_abastecimento = abastResult.insertId;
        }
      }

      // 4. Criar oficinas
      let id_oficina = null;
      if (viagemData.oficinas && viagemData.oficinas.length > 0) {
        for (const ofi of viagemData.oficinas) {
          const [ofiResult] = await connection.execute(
            `INSERT INTO oficina (id_oficina, data, km, tipo_de_problema, preco, total) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ofi.id, ofi.data, ofi.km, ofi.tipo, ofi.preco, ofi.preco]
          );
          id_oficina = ofiResult.insertId;
        }
      }

      // 5. Criar pedagios
      let id_pedagio = null;
      if (viagemData.pedagios && viagemData.pedagios.length > 0) {
        let totalPedagios = 0;
        for (const ped of viagemData.pedagios) {
          const [pedResult] = await connection.execute(
            `INSERT INTO pedagio (id_pedagio, preco, total) 
             VALUES (?, ?, ?)`,
            [ped.id, ped.valor, ped.valor]
          );
          id_pedagio = pedResult.insertId;
          totalPedagios += ped.valor;
        }
      }

      // 6. Criar outros
      let id_outros = null;
      if (viagemData.outros) {
        const totalFalta = viagemData.outros.faltaMercadoria 
          ? viagemData.outros.kilosFalta * viagemData.outros.precoFalta 
          : 0;
        const totalGorjetas = viagemData.outros.gorjetas.reduce((sum, g) => sum + g.valor, 0);
        
        const [outrosResult] = await connection.execute(
          `INSERT INTO outros (falta_mercadorias_kilo, falta_mercadorias_preco, gorjeta, total_gorjeta) 
           VALUES (?, ?, ?, ?)`,
          [viagemData.outros.kilosFalta || 0, viagemData.outros.precoFalta || 0, totalGorjetas, totalGorjetas]
        );
        id_outros = outrosResult.insertId;
      }

      // 7. Criar viagem
      const [viagemResult] = await connection.execute(
        `INSERT INTO viagem (
          id_viagem, data_entrada, data_chegada, km_saida, km_entrada, 
          peso_saida, peso_chegada, id_motorista, id_saida, id_chegada,
          id_valor_frete, id_resumo, id_pedagio, id_outros, id_oficina, id_abastecimento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [viagemData.id, viagemData.dataInicio, viagemData.dataFim, 
         viagemData.kmSaida, viagemData.kmChegada, viagemData.pesoSaida, 
         viagemData.pesoChegada, viagemData.id_motorista, 
         viagemData.cidadeSaida, viagemData.cidadeChegada,
         id_valor_frete, id_resumo, id_pedagio, id_outros, id_oficina, id_abastecimento]
      );

      await connection.commit();
      return viagemResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getByMotoristaId(motoristaId) {
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
      [motoristaId]
    );
    return rows;
  }

  static async getById(id, motoristaId) {
    const [rows] = await pool.execute(
      `SELECT v.*, 
              c1.cidade as cidade_saida, c1.estado_sigla as estado_saida,
              c2.cidade as cidade_chegada, c2.estado_sigla as estado_chegada,
              vf.preco_tonelada, vf.adintamento, vf.total_preco_tonelada as total_bruto,
              r.total_gastos, r.comicao, r.total_liquido
       FROM viagem v
       LEFT JOIN cidades c1 ON v.id_saida = c1.id_cidades
       LEFT JOIN cidades c2 ON v.id_chegada = c2.id_cidades
       LEFT JOIN valor_frete vf ON v.id_valor_frete = vf.id_valor_frete
       LEFT JOIN resumo r ON v.id_resumo = r.id_resumo
       WHERE v.id_viagem = ? AND v.id_motorista = ?`,
      [id, motoristaId]
    );
    return rows[0];
  }
}

module.exports = Viagem;