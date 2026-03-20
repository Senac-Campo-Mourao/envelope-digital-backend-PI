cat > src/models/Motorista.js << 'EOF'
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

class Motorista {
  static async create(motoristaData) {
    const { nome, cpf, cnh, placa_caminhao, email, senha } = motoristaData;
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO motorista (nome, cpf, cnh, placa_caminhao, email, senha) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, cpf, cnh, placa_caminhao, email, hashedPassword]
    );
    
    return { id: result.insertId, nome, email, cpf };
  }

  static async findByEmailOrCpf(login) {
    const [rows] = await pool.execute(
      `SELECT * FROM motorista WHERE email = ? OR cpf = ?`,
      [login, login]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id_motorista, nome, email, cpf, cnh, placa_caminhao 
       FROM motorista WHERE id_motorista = ?`,
      [id]
    );
    return rows[0];
  }

  static async comparePassword(senha, hashedSenha) {
    return await bcrypt.compare(senha, hashedSenha);
  }
}

module.exports = Motorista;
EOF