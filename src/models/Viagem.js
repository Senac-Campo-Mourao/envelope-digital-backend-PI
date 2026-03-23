const pool = require('../database/connection');

class Viagem {
  static async create(viagemData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Criar resumo
      const [resumoResult] = await connection.execute(
        `INSERT INTO resumo (total_bruto, total_gastos, comicao, total_liquido) 
         VALUES (?, ?, ?, ?)`,
        [viagemData.precoTotal || 0, 0, 0, viagemData.precoTotal || 0]
      );
      const id_resumo = resumoResult.insertId;

      // Criar valor_frete
      const [valorFreteResult] = await connection.execute(
        `INSERT INTO valor_frete (preco_tonelada, adintamento, total_preco_tonelada, ordem_pagamento) 
         VALUES (?, ?, ?, ?)`,
        [viagemData.precoTonelada || 0, viagemData.adiantamento || 0, viagemData.precoTotal || 0, viagemData.ordemPagamento || 0]
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
          viagemData.dataInicio || new Date(),
          viagemData.dataFim || new Date(),
          viagemData.kmSaida || 0,
          viagemData.kmChegada || 0,
          viagemData.pesoSaida || 0,
          viagemData.pesoChegada || 0,
          viagemData.id_motorista,
          viagemData.cidadeSaida,
          viagemData.cidadeChegada,
          id_valor_frete,
          id_resumo
        ]
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