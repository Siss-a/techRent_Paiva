// =============================================
// ROTAS DE CHAMADOS
// =============================================
 
import express from 'express';
const router = express.Router();
import { autenticar, autorizar } from '../middlewares/auth.js';
import ctrl from '../controllers/chamadosController.js';
 
// Listar chamados 
router.get('/', autenticar, ctrl.listar);
 
// Ver um chamado específico
router.get('/:id', autenticar, ctrl.buscarPorId);
 
// Abrir um novo chamado (cliente, admin)
router.post('/', autenticar, autorizar('cliente', 'admin'), ctrl.criar);
 
// Atualizar o chamado inteiro — titulo, descricao, prioridade, status (técnico, admin)
router.put('/:id', autenticar, autorizar('tecnico', 'admin'), ctrl.atualizar);
 
// Atualizar apenas o status do chamado (técnico, admin)
router.put('/:id/status', autenticar, autorizar('tecnico', 'admin'), ctrl.atualizarStatus);
 
// Remover um chamado (apenas admin)
router.delete('/:id', autenticar, autorizar('admin'), ctrl.remover);
 
export default router;
 
