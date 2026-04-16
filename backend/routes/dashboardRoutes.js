// =============================================
// ROTAS DE DASHBOARD
// =============================================

import express from 'express';
const router = express.Router();
import { autenticar, autorizar } from '../middlewares/auth.js';
import ctrl from '../controllers/dashboardController.js';

// Resumo geral para o admin (usa view_resumo_admin)
router.get('/admin', autenticar, autorizar('admin'), ctrl.resumoAdmin);

// Painel do técnico com chamados abertos (usa view_painel_tecnico)
router.get('/tecnico', autenticar, autorizar('admin', 'tecnico'), ctrl.painelTecnico);

export default router;
