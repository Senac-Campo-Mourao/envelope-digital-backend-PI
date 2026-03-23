const pool = require('../database/connection');

class Cidade {
  static async getAll(limit = 100) {
    const [rows] = await pool.execute(
      'SELECT id_cidades as id, cidade, estado_sigla FROM cidades ORDER BY cidade LIMIT ?',
      [limit]
    );
    return rows;
  }

  static async search(term, limit = 50) {
    const searchTerm = `%${term}%`;
    const [rows] = await pool.execute(
      `SELECT id_cidades as id, cidade, estado_sigla 
       FROM cidades 
       WHERE cidade LIKE ? OR estado_sigla LIKE ?
       ORDER BY 
         CASE 
           WHEN cidade LIKE ? THEN 1
           WHEN cidade LIKE ? THEN 2
           ELSE 3
         END,
         cidade
       LIMIT ?`,
      [searchTerm, searchTerm, `${term}%`, `%${term}%`, limit]
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

  // Método para popular cidades (útil para desenvolvimento)
  static async populateCities() {
    const cities = [
      { cidade: 'São Paulo', estado_sigla: 'SP' },
      { cidade: 'Rio de Janeiro', estado_sigla: 'RJ' },
      { cidade: 'Belo Horizonte', estado_sigla: 'MG' },
      { cidade: 'Brasília', estado_sigla: 'DF' },
      { cidade: 'Curitiba', estado_sigla: 'PR' },
      { cidade: 'Porto Alegre', estado_sigla: 'RS' },
      { cidade: 'Salvador', estado_sigla: 'BA' },
      { cidade: 'Fortaleza', estado_sigla: 'CE' },
      { cidade: 'Recife', estado_sigla: 'PE' },
      { cidade: 'Manaus', estado_sigla: 'AM' },
      { cidade: 'Belém', estado_sigla: 'PA' },
      { cidade: 'Goiânia', estado_sigla: 'GO' },
      { cidade: 'Florianópolis', estado_sigla: 'SC' },
      { cidade: 'Campinas', estado_sigla: 'SP' },
      { cidade: 'Santos', estado_sigla: 'SP' },
      { cidade: 'São José dos Campos', estado_sigla: 'SP' },
      { cidade: 'Ribeirão Preto', estado_sigla: 'SP' },
      { cidade: 'Uberlândia', estado_sigla: 'MG' },
      { cidade: 'Contagem', estado_sigla: 'MG' },
      { cidade: 'Juiz de Fora', estado_sigla: 'MG' },
      { cidade: 'Vitória', estado_sigla: 'ES' },
      { cidade: 'Cuiabá', estado_sigla: 'MT' },
      { cidade: 'Campo Grande', estado_sigla: 'MS' },
      { cidade: 'Natal', estado_sigla: 'RN' },
      { cidade: 'João Pessoa', estado_sigla: 'PB' },
      { cidade: 'Maceió', estado_sigla: 'AL' },
      { cidade: 'Aracaju', estado_sigla: 'SE' },
      { cidade: 'Teresina', estado_sigla: 'PI' },
      { cidade: 'São Luís', estado_sigla: 'MA' },
      { cidade: 'Palmas', estado_sigla: 'TO' },
      { cidade: 'Porto Velho', estado_sigla: 'RO' },
      { cidade: 'Rio Branco', estado_sigla: 'AC' },
      { cidade: 'Boa Vista', estado_sigla: 'RR' },
      { cidade: 'Macapá', estado_sigla: 'AP' }
    ];

    for (const city of cities) {
      await pool.execute(
        'INSERT IGNORE INTO cidades (cidade, estado_sigla) VALUES (?, ?)',
        [city.cidade, city.estado_sigla]
      );
    }
  }
}

module.exports = Cidade;