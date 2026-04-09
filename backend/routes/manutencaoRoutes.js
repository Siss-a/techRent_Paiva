// =============================================
// ROTAS DE MANUTENÇÃO
// =============================================

const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/auth');
const ctrl = require('../controllers/manutencaoController');

// Listar histórico de manutenções (admin e técnico)
router.get('/', autenticar, autorizar('admin', 'tecnico'), ctrl.listar);

// Registrar um reparo (apenas técnico)
router.post('/', autenticar, autorizar('tecnico'), ctrl.registrar);

module.exports = router;
