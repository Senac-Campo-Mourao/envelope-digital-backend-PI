# Envelope Digital – Backend

API REST do sistema **Envelope Digital**, desenvolvida em **Node.js com Express e PostgreSQL**, como parte do **Projeto Integrador do curso Programador Web – Senac**.

O objetivo do sistema é digitalizar o controle do **“envelope de viagem” utilizado por caminhoneiros**, permitindo registrar motoristas, veículos e despesas de viagem.

---

# Problema

Durante viagens, muitos caminhoneiros utilizam um envelope de papel para registrar despesas como:

* combustível
* pedágio
* peças
* manutenção
* troca de óleo
* outros gastos

Esse método dificulta o controle e a organização das informações.
O sistema **Envelope Digital** busca transformar esse processo manual em uma **aplicação web organizada e acessível**.

---

# Tecnologias utilizadas

* Node.js
* Express
* PostgreSQL
* pg (node-postgres)
* Cors
* Dotenv
* Nodemon
* Git / GitHub

---

# Arquitetura da API

A API segue o padrão **REST**.

Exemplo de estrutura do projeto:

```
src
 ├── controllers
 ├── routes
 ├── services
 ├── models
 ├── database
 │   └── connection.js
 ├── config
 └── app.js
```

---

# Principais entidades do sistema

## Motoristas

* id
* nome
* cpf
* telefone

## Veículos

* id
* placa
* modelo
* ano

## Viagens

* id
* motorista_id
* veiculo_id
* km_saida
* km_chegada
* data_saida
* data_chegada

## Despesas

* id
* viagem_id
* tipo
* valor
* data
* descricao

Tipos de despesas:

* abastecimento
* pedágio
* peças
* troca de óleo
* outros

---

# Exemplo de endpoints

## Motoristas

GET

```
/motoristas
```

POST

```
/motoristas
```

---

## Veículos

GET

```
/veiculos
```

POST

```
/veiculos
```

---

## Viagens

POST

```
/viagens
```

GET

```
/viagens
```

---

## Despesas

POST

```
/despesas
```

GET

```
/despesas
```

---

# Configuração do banco de dados

Exemplo de arquivo `.env`

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=senha
DB_NAME=envelope_digital
DB_SSL=false
```

---

# Como executar o projeto

1 Clonar o repositório

```
git clone https://github.com/seu-repositorio/envelope-digital-backend
```

2 Entrar na pasta do projeto

```
cd envelope-digital-backend
```

3 Instalar dependências

```
npm install
```

4 Executar o servidor

```
npm run dev
```

---

# Projeto Integrador

Projeto desenvolvido no **Curso Programador Web – Senac**, integrando as unidades curriculares:

* Elaborar Projetos de Aplicações Web
* Estruturar Aplicações Front-end
* Desenvolver Aplicações Back-end
* Publicar Aplicações Web

---

# Licença

Projeto educacional desenvolvido para fins de aprendizagem.
