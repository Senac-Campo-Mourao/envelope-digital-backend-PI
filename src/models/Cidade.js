cat > src/models/Cidade.js << 'EOF'
const pool = require('../database/connection');

class Cidade {
  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT id_cidades as id, cidade, estado_sigla FROM cidades ORDER BY cidade'
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      'SELECT id_cidades as id, cidade, estado_sigla FROM cidades WHERE id_cidades = ?',
      [id]
    );
    return rows[0];
  }
}

module.exports = Cidade;
EOF