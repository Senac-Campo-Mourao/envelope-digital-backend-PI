const pool = require('../database/connection');

class Gorjeta {
  static async create(gorjetaData, idViagem, connection = pool) {
    const { valor } = gorjetaData;
    const db = connection || pool;
    const [result] = await db.execute(
      'INSERT INTO gorjeta (valor, id_viagem) VALUES (?, ?)',
      [valor, idViagem]
    );
    return result.insertId;
  }

  static async getByViagemId(idViagem) {
    const [rows] = await pool.execute(
      'SELECT * FROM gorjeta WHERE id_viagem = ?',
      [idViagem]
    );
    return rows;
  }

  static async deleteByViagemId(idViagem) {
    const [result] = await pool.execute(
      'DELETE FROM gorjeta WHERE id_viagem = ?',
      [idViagem]
    );
    return result.affectedRows;
  }
}

module.exports = Gorjeta;