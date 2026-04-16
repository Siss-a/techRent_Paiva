// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO (JWT)
// =============================================

import jwt from 'jsonwebtoken';

// -------------------------------------------------
// autenticar
// -------------------------------------------------
export const autenticar = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensagem: 'Formato de token inválido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
};

// -------------------------------------------------
// autorizar(...niveis)
// -------------------------------------------------
export const autorizar = (...niveis) => {
  return (req, res, next) => {
    // req.usuario preenchido pelo autenticar
    if (!req.usuario || !niveis.includes(req.usuario.nivel_acesso)) {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
  };
};