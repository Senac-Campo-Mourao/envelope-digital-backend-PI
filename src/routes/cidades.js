cat > src/routes/cidades.js << 'EOF'
const express = require('express');
const router = express.Router();
const cidadeController = require('../controllers/cidadeController');

router.get('/', cidadeController.getCidades);

module.exports = router;
EOF