// =============================================
// ROTAS DE CHAMADOS
// =============================================

import express from 'express';
const router = express.Router();
import { autenticar, autorizar } from '../middlewares/auth.js';
import ctrl from '../controllers/chamadosController.js';

// Listar chamados (cada perfil vê uma visão diferente — lógica no controller)
router.get('/', autenticar, ctrl.listar);

// Ver um chamado específico
router.get('/:id', autenticar, ctrl.buscarPorId);

// Abrir um novo chamado (cliente, admin)
router.post('/', autenticar, autorizar('cliente', 'admin'), ctrl.criar);

// Atualizar o status do chamado (técnico, admin)
router.put('/:id/status', autenticar, autorizar('tecnico', 'admin'), ctrl.atualizarStatus);

export default router;
