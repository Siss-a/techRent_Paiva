// =============================================
// ROTAS DE DASHBOARD
// =============================================

const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/auth');
const ctrl = require('../controllers/dashboardController');

// Resumo geral para o admin (usa view_resumo_admin)
router.get('/admin', autenticar, autorizar('admin'), ctrl.resumoAdmin);

// Painel do técnico com chamados abertos (usa view_painel_tecnico)
router.get('/tecnico', autenticar, autorizar('admin', 'tecnico'), ctrl.painelTecnico);

module.exports = router;
