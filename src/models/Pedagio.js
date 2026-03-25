const pool = require('../database/connection');

class Pedagio {
  static async create(pedagioData, idViagem, connection = pool) {
    const { valor } = pedagioData;
    const db = connection || pool;
    const [result] = await db.execute(
      `INSERT INTO pedagio (valor, id_viagem)
       VALUES (?, ?)`,
      [valor, idViagem]
    );
    return result.insertId;
  }

  static async getByViagemId(idViagem) {
    const [rows] = await pool.execute(
      'SELECT * FROM pedagio WHERE id_viagem = ?',
      [idViagem]
    );
    return rows;
  }

  static async deleteByViagemId(idViagem) {
    const [result] = await pool.execute(
      'DELETE FROM pedagio WHERE id_viagem = ?',
      [idViagem]
    );
    return result.affectedRows;
  }
}

module.exports = Pedagio;