-- Estrutura convertida para PostgreSQL

-- Banco alvo no Azure PostgreSQL: "envelope-pi-database"
-- Este script deve ser executado conectado nesse banco.
-- Exemplo (psql): psql "host=... dbname=envelope-pi-database user=... sslmode=require"
-- Obs.: Em Azure Database for PostgreSQL normalmente nao se cria database via script da aplicacao.

-- Nota: No Postgres, usamos SERIAL para AUTO_INCREMENT
CREATE TABLE IF NOT EXISTS cidades (
  id_cidades SERIAL PRIMARY KEY,
  cidade VARCHAR(100) NOT NULL,
  estado_sigla VARCHAR(2) NOT NULL,
  CONSTRAINT uq_cidades_cidade_uf UNIQUE (cidade, estado_sigla)
);

CREATE TABLE IF NOT EXISTS motorista (
  id_motorista SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  cnh VARCHAR(20) NOT NULL,
  placa_caminhao VARCHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS valor_frete (
  id_valor_frete SERIAL PRIMARY KEY,
  preco_tonelada DECIMAL(10,2) DEFAULT 0.00,
  adiantamento DECIMAL(10,2) DEFAULT 0.00,
  total_preco_tonelada DECIMAL(10,2) DEFAULT 0.00,
  ordem_pagamento DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS resumo (
  id_resumo SERIAL PRIMARY KEY,
  total_bruto DECIMAL(10,2) DEFAULT 0.00,
  total_gastos DECIMAL(10,2) DEFAULT 0.00,
  comissao DECIMAL(10,2) DEFAULT 0.00,
  total_liquido DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS viagem (
  id_viagem SERIAL PRIMARY KEY,
  data_entrada DATE NOT NULL,
  data_chegada DATE,
  km_saida DECIMAL(10,2) DEFAULT 0.00,
  km_entrada DECIMAL(10,2) DEFAULT 0.00,
  peso_saida DECIMAL(10,2) DEFAULT 0.00,
  peso_chegada DECIMAL(10,2) DEFAULT 0.00,
  id_motorista INT NOT NULL,
  id_saida INT,
  id_chegada INT,
  id_valor_frete INT,
  id_resumo INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_motorista FOREIGN KEY (id_motorista) REFERENCES motorista(id_motorista) ON DELETE CASCADE,
  CONSTRAINT fk_saida FOREIGN KEY (id_saida) REFERENCES cidades(id_cidades),
  CONSTRAINT fk_chegada FOREIGN KEY (id_chegada) REFERENCES cidades(id_cidades),
  CONSTRAINT fk_valor_frete FOREIGN KEY (id_valor_frete) REFERENCES valor_frete(id_valor_frete),
  CONSTRAINT fk_resumo FOREIGN KEY (id_resumo) REFERENCES resumo(id_resumo)
);

CREATE TABLE IF NOT EXISTS abastecimento (
  id_abastecimento SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  km DECIMAL(10,2) DEFAULT 0.00,
  posto VARCHAR(100) NOT NULL,
  litros DECIMAL(10,2) DEFAULT 0.00,
  valor_litros DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) DEFAULT 0.00,
  id_viagem INT NOT NULL,
  CONSTRAINT fk_viagem_abast FOREIGN KEY (id_viagem) REFERENCES viagem(id_viagem) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS falta_mercadoria (
  id_falta SERIAL PRIMARY KEY,
  kilos_falta DECIMAL(10,2) DEFAULT 0.00,
  preco_falta DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) DEFAULT 0.00,
  id_viagem INT NOT NULL,
  CONSTRAINT fk_viagem_falta FOREIGN KEY (id_viagem) REFERENCES viagem(id_viagem) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gorjeta (
  id_gorjeta SERIAL PRIMARY KEY,
  valor DECIMAL(10,2) DEFAULT 0.00,
  id_viagem INT NOT NULL,
  CONSTRAINT fk_viagem_gorj FOREIGN KEY (id_viagem) REFERENCES viagem(id_viagem) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oficina (
  id_oficina SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  km DECIMAL(10,2) DEFAULT 0.00,
  tipo VARCHAR(100) NOT NULL,
  preco DECIMAL(10,2) DEFAULT 0.00,
  id_viagem INT NOT NULL,
  CONSTRAINT fk_viagem_ofic FOREIGN KEY (id_viagem) REFERENCES viagem(id_viagem) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedagio (
  id_pedagio SERIAL PRIMARY KEY,
  valor DECIMAL(10,2) DEFAULT 0.00,
  id_viagem INT NOT NULL,
  CONSTRAINT fk_viagem_pedag FOREIGN KEY (id_viagem) REFERENCES viagem(id_viagem) ON DELETE CASCADE
);

-- Inserção de dados (Exemplo para cidades)
INSERT INTO cidades (cidade, estado_sigla) VALUES
	('Campo Mourão', 'PR'),
	('Foz do Iguaçu', 'PR'),
	('Rio de Janeiro', 'RJ'),
	('Agricolândia', 'PI'),
	('Lavandeira', 'TO'),
	('Curitiba', 'PR'),
	('São Paulo', 'SP'),
	('São Francisco do Sul', 'SC'),
  ('Lucas do Rio Verde', 'MT')
ON CONFLICT (cidade, estado_sigla) DO NOTHING;