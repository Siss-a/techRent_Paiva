// =============================================
// ROTAS DE AUTENTICAÇÃO
// =============================================
// Rotas públicas — não exigem token JWT.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /auth/registro - cria uma conta
router.post('/registro', authController.registro);

// POST /auth/login - autentica e retorna o token JWT
router.post('/login', authController.login);

module.exports = router;
