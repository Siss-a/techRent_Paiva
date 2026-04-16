// =============================================
// ROTAS DE AUTENTICAÇÃO
// =============================================
// Rotas públicas — não exigem token JWT.

import express from 'express';
const router = express.Router();
import authController from '../controllers/authController.js';

// POST /auth/registro - cria uma conta
router.post('/registro', authController.registro);

// POST /auth/login - autentica e retorna o token JWT
router.post('/login', authController.login);

export default router;
