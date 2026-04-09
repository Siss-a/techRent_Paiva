// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO (JWT)
// =============================================
// Middlewares são funções que ficam "no meio" da requisição e a resposta.
// Este middleware verifica se o usuário está autenticado antes de
// permitir o acesso a uma rota protegida.

const jwt = require('jsonwebtoken');

// -------------------------------------------------
// autenticar
// -------------------------------------------------
// Verifica se o token JWT enviado no header é válido.
// Se for válido, extrai os dados do usuário e passa para a próxima função (next).
// Se não for, retorna 401 (Não autorizado).
const autenticar = (req, res, next) => {
  // O token deve vir no header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  // O formato esperado é "Bearer <token>", então separamos pelo espaço
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensagem: 'Formato de token inválido.' });
  }

  try {
    // jwt.verify lança um erro se o token for inválido ou expirado
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Salva os dados do usuário na requisição para uso nas próximas funções
    req.usuario = payload;

    next(); // Tudo certo, pode continuar
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
};

// -------------------------------------------------
// autorizar(...niveis)
// -------------------------------------------------
// Fábrica de middlewares: recebe os níveis permitidos e devolve
// um middleware que barra quem não tiver o nível correto.
//
// Uso nas rotas: router.get('/rota', autenticar, autorizar('admin'), controller)
const autorizar = (...niveis) => {
  return (req, res, next) => {
    // req.usuario foi preenchido pelo middleware autenticar acima
    if (!niveis.includes(req.usuario.nivel_acesso)) {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
  };
};

module.exports = { autenticar, autorizar };
