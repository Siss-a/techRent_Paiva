// =============================================
// ROTAS DE CHAMADOS
// =============================================

const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/auth');
const ctrl = require('../controllers/chamadosController');

// Listar chamados (cada perfil vê uma visão diferente — lógica no controller)
router.get('/', autenticar, ctrl.listar);

// Ver um chamado específico
router.get('/:id', autenticar, ctrl.buscarPorId);

// Abrir um novo chamado (cliente, admin)
router.post('/', autenticar, autorizar('cliente', 'admin'), ctrl.criar);

// Atualizar o status do chamado (técnico, admin)
router.put('/:id/status', autenticar, autorizar('tecnico', 'admin'), ctrl.atualizarStatus);

module.exports = router;
