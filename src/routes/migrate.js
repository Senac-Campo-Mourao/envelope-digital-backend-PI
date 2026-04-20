const express = require('express');
const { runMigration } = require('../migrate');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await runMigration();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao executar migracao:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao executar migracao',
      details: error.message,
    });
  }
});

module.exports = router;
