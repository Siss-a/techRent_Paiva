// =============================================
// ROTAS DE MANUTENÇÃO
// =============================================


import express from 'express';
const router = express.Router();
import { autenticar, autorizar } from '../middlewares/auth.js';
import ctrl from '../controllers/manutencaoController.js';

// Listar histórico de manutenções (admin e técnico)
router.get('/', autenticar, autorizar('admin', 'tecnico'), ctrl.listar);

// Registrar um reparo (apenas técnico)
router.post('/', autenticar, autorizar('tecnico'), ctrl.registrar);

export default router;
