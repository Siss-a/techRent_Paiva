// =============================================
// ROTAS DE EQUIPAMENTOS
// =============================================
// Todas as rotas aqui exigem autenticação (autenticar).
// Algumas exigem nível de acesso específico (autorizar).

const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/auth');
const ctrl = require('../controllers/equipamentosController');

// Qualquer usuário autenticado pode listar equipamentos
router.get('/', autenticar, ctrl.listar);

// Qualquer usuário autenticado pode ver um equipamento específico
router.get('/:id', autenticar, ctrl.buscarPorId);

// Apenas admin pode criar, atualizar ou remover equipamentos
router.post('/', autenticar, autorizar('admin'), ctrl.criar);
router.put('/:id', autenticar, autorizar('admin'), ctrl.atualizar);
router.delete('/:id', autenticar, autorizar('admin'), ctrl.remover);

module.exports = router;
