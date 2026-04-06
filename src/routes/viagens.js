// src/routes/viagens.js
const express = require('express');
const router = express.Router();
const viagemController = require('../controllers/viagemController');
const authMiddleware = require('../middlewares/auth');

// Todas as rotas de viagem exigem autenticação
router.use(authMiddleware);

router.post('/', viagemController.createViagem);
router.get('/', viagemController.getViagens);
router.get('/:id', viagemController.getViagemById);
router.put('/:id', viagemController.updateViagem);  // NOVA ROTA
router.delete('/:id', viagemController.deleteViagem);  // NOVA ROTA

module.exports = router;