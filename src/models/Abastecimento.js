const pool = require('../database/connection');

class Abastecimento {
  static async create(abastecimentoData, idViagem, connection = pool) {
    const { data, km, posto, litros, valorLitros, total } = abastecimentoData;
    const db = connection || pool;
    const [result] = await db.execute(
      `INSERT INTO abastecimento (data, km, posto, litros, valor_litros, total, id_viagem)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data, km, posto, litros, valorLitros, total, idViagem]
    );
    return result.insertId;
  }

  static async getByViagemId(idViagem) {
    const [rows] = await pool.execute(
      'SELECT * FROM abastecimento WHERE id_viagem = ? ORDER BY data',
      [idViagem]
    );
    return rows;
  }

  static async deleteByViagemId(idViagem) {
    const [result] = await pool.execute(
      'DELETE FROM abastecimento WHERE id_viagem = ?',
      [idViagem]
    );
    return result.affectedRows;
  }
}

module.exports = Abastecimento;