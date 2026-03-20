cat > src/controllers/authController.js << 'EOF'
const Motorista = require('../models/Motorista');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { nome, cpf, cnh, placa, email, senha } = req.body;
    
    const existingUser = await Motorista.findByEmailOrCpf(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }
    
    const user = await Motorista.create({
      nome,
      cpf,
      cnh,
      placa_caminhao: placa,
      email,
      senha
    });
    
    const token = generateToken(user.id);
    
    res.status(201).json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cpf: user.cpf
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body;
    
    const user = await Motorista.findByEmailOrCpf(login);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const isValidPassword = await Motorista.comparePassword(senha, user.senha);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = generateToken(user.id_motorista);
    
    res.json({
      user: {
        id: user.id_motorista,
        nome: user.nome,
        email: user.email,
        cpf: user.cpf
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};
EOF