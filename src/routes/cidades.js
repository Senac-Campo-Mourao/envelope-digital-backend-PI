const express = require('express');
const router = express.Router();
const cidadeController = require('../controllers/cidadeController');

router.get('/', cidadeController.getCidades);
router.get('/:id', cidadeController.getCidadeById);

if (process.env.NODE_ENV === 'development') {
  router.post('/populate', async (req, res) => {
    const Cidade = require('../models/Cidade');
    await Cidade.populateCities();
    res.json({ message: 'Cidades populadas com sucesso!' });
  });
}

module.exports = router;