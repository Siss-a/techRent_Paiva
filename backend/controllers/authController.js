// =============================================
// CONTROLLER DE AUTENTICAÇÃO
// =============================================
// TODO (alunos): implementar as funções registro e login.
//
// Dicas:
//   - Use bcryptjs para criptografar a senha antes de salvar (registro)
//   - Use bcryptjs para comparar a senha no login (bcrypt.compare)
//   - Use jsonwebtoken (jwt.sign) para gerar o token após login bem-sucedido
//   - O payload do token deve ter: id, nome, email, nivel_acesso
//   - NUNCA coloque a senha no payload do token!


import jwt from 'jsonwebtoken';
import { 
  create, 
  read, 
  hashPassword, 
  comparePassword 
} 
from '../config/database.js';

// POST /auth/registro - cria um novo usuário
const registro = async (req, res) => {
  try {
    const { nome, email, senha, nivel_acesso } = req.body;

    const emailFormatado = email.trim().toLowerCase();


    // Verificar se já existe
    const usuarios = await read('usuarios', `email = '${emailFormatado}'`);

    if (usuarios.length > 0) {
      return res.status(409).json({
        sucesso: false,
        erro: 'Email já cadastrado'
      });
    }

    // Gerar hash
    const senha_hash = await hashPassword(senha);

    // Criar usuário
    const usuarioId = await create('usuarios', {
      nome: nome.trim(),
      email: emailFormatado,
      senha_hash,
      nivel_acesso
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso',
      dados: {
        id: usuarioId,
        nome,
        email: emailFormatado
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor',
      mensagem: 'Não foi possível registrar o usuário'
    });
  }
};

// POST /auth/login - autentica e retorna JWT
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const emailFormatado = email.trim().toLowerCase();

    // Buscar usuário
    const usuarios = await read('usuarios', `email = '${emailFormatado}'`);

    if (usuarios.length === 0) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Credenciais inválidas'
      });
    }

    const usuario = usuarios[0];

    // Validar senha
    const senhaValida = await comparePassword(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Credenciais inválidas'
      });
    }

    // Gerar token 
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      dados: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          nivel_acesso: usuario.nivel_acesso
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
}
export default{ registro, login };
