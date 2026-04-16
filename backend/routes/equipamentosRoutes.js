// =============================================
// ROTAS DE EQUIPAMENTOS
// =============================================
// Todas as rotas aqui exigem autenticação (autenticar).
// Algumas exigem nível de acesso específico (autorizar).


import express from 'express';
const router = express.Router();
import { autenticar, autorizar } from '../middlewares/auth.js';
import ctrl from '../controllers/equipamentosController.js';

// Qualquer usuário autenticado pode listar equipamentos
router.get('/', autenticar, ctrl.listar);

// Qualquer usuário autenticado pode ver um equipamento específico
router.get('/:id', autenticar, ctrl.buscarPorId);

// Apenas admin pode criar, atualizar ou remover equipamentos
router.post('/', autenticar, autorizar('admin'), ctrl.criar);
router.put('/:id', autenticar, autorizar('admin'), ctrl.atualizar);
router.delete('/:id', autenticar, autorizar('admin'), ctrl.remover);

export default router;
